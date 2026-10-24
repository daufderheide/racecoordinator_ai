package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.DriverImportParserHelper.ParsedDataFile;
import com.antigravity.importer.model.DriverImportCommitRequest;
import com.antigravity.importer.model.DriverImportPreview;
import com.antigravity.importer.model.DriverImportResult;
import com.antigravity.importer.model.DriverImportRow;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.proto.AssetMessage;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DriverExporterTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private SqliteRepository<DriverLabel> driverLabelRepository;
  private AssetService assetService;
  private DriverExporter exporter;
  private DriverImporter importer;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    driverLabelRepository =
        new SqliteRepository<>(databaseContext, "driver_labels", DriverLabel.class);

    File assetsDir = new File(new File(databaseContext.getDataRoot(), "test_db"), "assets");
    assetService = new AssetService(databaseContext, assetsDir.getAbsolutePath());

    exporter =
        new DriverExporter(databaseContext, driverRepository, assetService, driverLabelRepository);
    importer =
        new DriverImporter(databaseContext, driverRepository, assetService, driverLabelRepository);
  }

  @After
  public void tearDown() {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  @Test
  public void testExportCsvWithSharedAudioFilesDeduplicationAndRoundTrip() throws Exception {
    // Create companion sound and avatar assets
    byte[] turboSoundBytes =
        "RIFF....WAVEfmt ....turbo_sound_data".getBytes(StandardCharsets.UTF_8);
    byte[] engineRevBytes = "RIFF....WAVEfmt ....engine_rev_data".getBytes(StandardCharsets.UTF_8);
    byte[] avatarBytes = new byte[] {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3};

    AssetMessage turboAsset = assetService.saveAsset("turbo_sound.wav", "sound", turboSoundBytes);
    AssetMessage engineAsset = assetService.saveAsset("engine_rev.wav", "sound", engineRevBytes);
    AssetMessage avatarAsset = assetService.saveAsset("speedy_avatar.png", "image", avatarBytes);

    // Driver 1: uses turbo_sound.wav and avatar
    Driver d1 =
        new Driver.Builder()
            .withEntityId("d1")
            .withName("Speedy Gonzales")
            .withNickname("Speedy")
            .withAvatarUrl(avatarAsset.getUrl())
            .withLapAudio(new AudioConfig("preset", turboAsset.getUrl(), ""))
            .withBestLapAudio(new AudioConfig("preset", "default_driveby", ""))
            .build();

    // Driver 2: SHARES turbo_sound.wav with Driver 1, and also uses engine_rev.wav
    Driver d2 =
        new Driver.Builder()
            .withEntityId("d2")
            .withName("Lightning McQueen")
            .withNickname("Lightning")
            .withLapAudio(new AudioConfig("preset", turboAsset.getUrl(), ""))
            .withBestLapAudio(new AudioConfig("preset", engineAsset.getUrl(), ""))
            .withOverallBestLapAudio(new AudioConfig("none", "", ""))
            .build();

    // Driver 3: uses TTS and default preset
    Driver d3 =
        new Driver.Builder()
            .withEntityId("d3")
            .withName("Mario Rossi")
            .withNickname("Mario")
            .withLapAudio(new AudioConfig("preset", "default_beep", ""))
            .withBestLapAudio(new AudioConfig("tts", "", "Fastest lap by ${nickname}!"))
            .build();

    // Empty driver that should be excluded
    Driver dEmpty =
        new Driver.Builder()
            .withEntityId(Driver.EMPTY_DRIVER_ID)
            .withName("Empty")
            .withNickname("Empty")
            .build();

    driverRepository.insert(d1);
    driverRepository.insert(d2);
    driverRepository.insert(d3);
    driverRepository.insert(dEmpty);

    // Export drivers as CSV in a ZIP package
    byte[] zipBytes = exporter.exportDriversZip(null, "csv");
    assertNotNull(zipBytes);
    assertTrue(zipBytes.length > 0);

    // Verify ZIP contents
    Map<String, byte[]> zipEntries = extractZipEntries(zipBytes);

    // 1. Primary CSV data file must exist
    assertTrue("drivers.csv must be present in zip", zipEntries.containsKey("drivers.csv"));

    // 2. Audio files must be included
    assertTrue("turbo_sound.wav must be present in zip", zipEntries.containsKey("turbo_sound.wav"));
    assertTrue("engine_rev.wav must be present in zip", zipEntries.containsKey("engine_rev.wav"));
    assertTrue(
        "speedy_avatar.png must be present in zip", zipEntries.containsKey("speedy_avatar.png"));

    // 3. Deduplication check: total entries = 4 (drivers.csv, turbo_sound.wav, engine_rev.wav,
    // speedy_avatar.png)
    assertEquals("Shared audio must only be packaged once in zip", 4, zipEntries.size());

    // 4. Verify CSV content structure
    String csvText = new String(zipEntries.get("drivers.csv"), StandardCharsets.UTF_8);
    assertTrue(csvText.contains("# default-audio: system"));
    assertTrue(csvText.contains("Speedy Gonzales"));
    assertTrue(csvText.contains("Lightning McQueen"));
    assertTrue(csvText.contains("Mario Rossi"));
    assertTrue("EMPTY_LANE should not be in export", !csvText.contains("EMPTY_LANE"));
    assertTrue("Should reference relative turbo_sound.wav", csvText.contains("turbo_sound.wav"));
    assertTrue("Should reference relative engine_rev.wav", csvText.contains("engine_rev.wav"));
    assertTrue(
        "Should reference relative speedy_avatar.png", csvText.contains("speedy_avatar.png"));
    assertTrue("Should include TTS", csvText.contains("tts:Fastest lap by ${nickname}!"));

    // 5. Test Round-Trip: pass the exported zip directly into DriverImporter.parseAndValidate
    DriverImportPreview preview =
        importer.parseAndValidate(new ByteArrayInputStream(zipBytes), "drivers_export.zip", null);
    assertEquals(3, preview.getTotalRows());
    // Since names already exist in DB, they show as CONFLICT
    assertEquals(3, preview.getConflictCount());

    // Resolve as OVERWRITE and commit
    preview.getRows().forEach(r -> r.setSelectedResolution("OVERWRITE"));
    DriverImportResult result =
        importer.commitImport(new DriverImportCommitRequest(preview.getRows()));
    assertTrue(result.isSuccess());
    assertEquals(3, result.getUpdatedCount());
  }

  @Test
  public void testExportExcelXlsxFormat() throws Exception {
    byte[] soundBytes = "RIFF....WAVEfmt ....test_sound".getBytes(StandardCharsets.UTF_8);
    AssetMessage soundAsset = assetService.saveAsset("custom_horn.wav", "sound", soundBytes);

    Driver driver =
        new Driver.Builder()
            .withEntityId("d1")
            .withName("Carlos Sainz")
            .withNickname("Smooth Operator")
            .withLapAudio(new AudioConfig("preset", soundAsset.getUrl(), ""))
            .withHeatBestLapAudio(new AudioConfig("tts", "", "Smooth operator ${nickname}"))
            .build();
    driverRepository.insert(driver);

    byte[] zipBytes = exporter.exportDriversZip(Arrays.asList(driver), "xlsx");
    assertNotNull(zipBytes);

    Map<String, byte[]> zipEntries = extractZipEntries(zipBytes);
    assertTrue(zipEntries.containsKey("drivers.xlsx"));
    assertTrue(zipEntries.containsKey("custom_horn.wav"));

    // Verify drivers.xlsx can be parsed back by DriverImportParserHelper.parseExcel
    try (InputStream is = new ByteArrayInputStream(zipEntries.get("drivers.xlsx"))) {
      ParsedDataFile parsed = DriverImportParserHelper.parseExcel(is);
      assertEquals(1, parsed.getRows().size());
      Map<String, String> row = parsed.getRows().get(0);
      assertEquals("Carlos Sainz", row.get("name"));
      assertEquals("Smooth Operator", row.get("nickname"));
      assertEquals("custom_horn.wav", row.get("lap"));
      assertEquals("tts:Smooth operator ${nickname}", row.get("heatBestLap"));
    }
  }

  @Test
  public void testExportJsonFormat() throws Exception {
    byte[] soundBytes = "RIFF....WAVEfmt ....pit_sound".getBytes(StandardCharsets.UTF_8);
    AssetMessage soundAsset = assetService.saveAsset("pit_stop.wav", "sound", soundBytes);

    Driver driver =
        new Driver.Builder()
            .withEntityId("d1")
            .withName("Lewis Hamilton")
            .withNickname("Sir Lewis")
            .withPitInAudio(new AudioConfig("preset", soundAsset.getUrl(), ""))
            .withBestLapAudio(new AudioConfig("none", "", ""))
            .build();
    driverRepository.insert(driver);

    byte[] zipBytes = exporter.exportDriversZip(Arrays.asList(driver), "json");
    assertNotNull(zipBytes);

    Map<String, byte[]> zipEntries = extractZipEntries(zipBytes);
    assertTrue(zipEntries.containsKey("drivers.json"));
    assertTrue(zipEntries.containsKey("pit_stop.wav"));

    // Verify drivers.json can be parsed back by DriverImportParserHelper.parseJson
    try (InputStream is = new ByteArrayInputStream(zipEntries.get("drivers.json"))) {
      ParsedDataFile parsed = DriverImportParserHelper.parseJson(is);
      assertEquals(1, parsed.getRows().size());
      Map<String, String> row = parsed.getRows().get(0);
      assertEquals("Lewis Hamilton", row.get("name"));
      assertEquals("Sir Lewis", row.get("nickname"));
      assertEquals("pit_stop.wav", row.get("pitIn"));
      assertEquals("none", row.get("bestLap"));
    }
  }

  @Test
  public void testExportSubsetOfDrivers() throws Exception {
    Driver d1 =
        new Driver.Builder().withEntityId("d1").withName("Alice").withNickname("Ally").build();
    Driver d2 =
        new Driver.Builder().withEntityId("d2").withName("Bob").withNickname("Bobby").build();
    Driver d3 =
        new Driver.Builder().withEntityId("d3").withName("Charlie").withNickname("Chuck").build();

    // Export only Alice and Charlie
    List<Driver> subset = Arrays.asList(d1, d3);
    byte[] zipBytes = exporter.exportDriversZip(subset, "csv");

    Map<String, byte[]> entries = extractZipEntries(zipBytes);
    String csv = new String(entries.get("drivers.csv"), StandardCharsets.UTF_8);
    assertTrue(csv.contains("Alice"));
    assertTrue(csv.contains("Charlie"));
    assertTrue(!csv.contains("Bob"));
  }

  @Test
  public void testMissingPhysicalAssetGracefullyHandled() throws Exception {
    // Driver references an asset URL whose file was deleted on disk
    Driver d =
        new Driver.Builder()
            .withEntityId("d1")
            .withName("Ghost Driver")
            .withNickname("Ghost")
            .withLapAudio(new AudioConfig("preset", "/assets/non_existent_sound.wav", ""))
            .build();

    byte[] zipBytes = exporter.exportDriversZip(Arrays.asList(d), "csv");
    assertNotNull(zipBytes);
    Map<String, byte[]> entries = extractZipEntries(zipBytes);
    assertTrue(entries.containsKey("drivers.csv"));
    // Non-existent physical file should not crash the export or create corrupted entries
    assertEquals(1, entries.size());
  }

  @Test
  public void testExportAndImportIntoNewDatabaseWithOverwrite() throws Exception {
    byte[] customWavBytes =
        "RIFF....WAVEfmt ....custom_beep_wav_content".getBytes(StandardCharsets.UTF_8);
    AssetMessage customAsset = assetService.saveAsset("my_custom.wav", "sound", customWavBytes);

    Driver sourceDriver =
        new Driver.Builder()
            .withEntityId("d1")
            .withName("Driver 1")
            .withNickname("D1")
            .withLapAudio(new AudioConfig("preset", customAsset.getModel().getEntityId(), ""))
            .build();
    driverRepository.insert(sourceDriver);

    // Export to zip
    byte[] zipBytes = exporter.exportDriversZip(Arrays.asList(sourceDriver), "csv");
    assertNotNull(zipBytes);

    // Create a new separate database (like factory DB)
    String rootDir = tempFolder.newFolder("db_root2").getAbsolutePath() + File.separator;
    DatabaseContext dbContext2 = new DatabaseContext("factory_db", null, rootDir);
    SqliteRepository<Driver> driverRepo2 =
        new SqliteRepository<>(dbContext2, "drivers", Driver.class);
    File assetsDir2 = new File(new File(dbContext2.getDataRoot(), "factory_db"), "assets");
    AssetService assetService2 = new AssetService(dbContext2, assetsDir2.getAbsolutePath());
    DriverImporter importer2 = new DriverImporter(dbContext2, driverRepo2, assetService2);

    // In factory DB, "Driver 1" already exists with default beep
    Driver factoryDriver =
        new Driver.Builder()
            .withEntityId("fact_1")
            .withName("Driver 1")
            .withNickname("D1")
            .withLapAudio(new AudioConfig("preset", "default_beep", ""))
            .build();
    driverRepo2.insert(factoryDriver);

    // Import zip into factory DB
    DriverImportPreview preview =
        importer2.parseAndValidate(new ByteArrayInputStream(zipBytes), "drivers_export.zip", null);
    assertEquals(1, preview.getTotalRows());
    assertEquals(1, preview.getConflictCount());

    DriverImportRow row = preview.getRows().get(0);
    assertEquals("CONFLICT", row.getStatus());
    assertEquals("fact_1", row.getExistingDriverId());

    // Resolve as OVERWRITE
    row.setSelectedResolution("OVERWRITE");

    DriverImportResult result =
        importer2.commitImport(new DriverImportCommitRequest(Arrays.asList(row)));
    assertTrue(result.isSuccess());
    assertEquals(1, result.getUpdatedCount());
    assertEquals(1, result.getUpdatedDriverIds().size());
    assertEquals("fact_1", result.getUpdatedDriverIds().get(0));

    // Check driver in factory DB
    Driver updated = driverRepo2.findByEntityId("fact_1");
    assertNotNull(updated);
    assertNotNull(updated.getLapAudio());
    assertEquals("preset", updated.getLapAudio().getType());
    assertTrue(updated.getLapAudio().getUrl().contains("my_custom.wav"));

    List<AssetMessage> factoryAssets = assetService2.getAllAssets();
    boolean foundCustomAsset =
        factoryAssets.stream().anyMatch(a -> a.getName().equals("my_custom.wav"));
    assertTrue("Custom asset should be in factory assets table", foundCustomAsset);

    try {
      dbContext2.getConnection().close();
    } catch (Exception ignored) {
    }
  }

  private Map<String, byte[]> extractZipEntries(byte[] zipBytes) throws Exception {
    Map<String, byte[]> map = new HashMap<>();
    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        if (!entry.isDirectory()) {
          byte[] data = DriverImportParserHelper.readAllBytesFromStream(zis);
          map.put(entry.getName(), data);
        }
      }
    }
    return map;
  }

  @Test
  public void testLogicalSortingAcrossAllFormats() throws Exception {
    Driver d1 = new Driver.Builder().withEntityId("d1").withName("Driver 1").build();
    Driver d2 = new Driver.Builder().withEntityId("d2").withName("Driver 2").build();
    Driver d9 = new Driver.Builder().withEntityId("d9").withName("Driver 9").build();
    Driver d10 = new Driver.Builder().withEntityId("d10").withName("Driver 10").build();
    Driver d11 = new Driver.Builder().withEntityId("d11").withName("Driver 11").build();

    // Insert in unsorted order: 10, 2, 11, 1, 9
    List<Driver> drivers = Arrays.asList(d10, d2, d11, d1, d9);

    // 1. CSV
    byte[] csvZip = exporter.exportDriversZip(drivers, "csv");
    Map<String, byte[]> csvEntries = extractZipEntries(csvZip);
    String csvText = new String(csvEntries.get("drivers.csv"), StandardCharsets.UTF_8);
    int pos1 = csvText.indexOf("Driver 1,");
    int pos2 = csvText.indexOf("Driver 2,");
    int pos9 = csvText.indexOf("Driver 9,");
    int pos10 = csvText.indexOf("Driver 10,");
    int pos11 = csvText.indexOf("Driver 11,");
    assertTrue("Driver 1 before Driver 2", pos1 >= 0 && pos1 < pos2);
    assertTrue("Driver 2 before Driver 9", pos2 < pos9);
    assertTrue("Driver 9 before Driver 10", pos9 < pos10);
    assertTrue("Driver 10 before Driver 11", pos10 < pos11);

    // 2. Excel
    byte[] xlsxZip = exporter.exportDriversZip(drivers, "xlsx");
    Map<String, byte[]> xlsxEntries = extractZipEntries(xlsxZip);
    ParsedDataFile xlsxParsed =
        DriverImportParserHelper.parseExcel(
            new ByteArrayInputStream(xlsxEntries.get("drivers.xlsx")));
    assertEquals(5, xlsxParsed.getRows().size());
    assertEquals("Driver 1", xlsxParsed.getRows().get(0).get("name"));
    assertEquals("Driver 2", xlsxParsed.getRows().get(1).get("name"));
    assertEquals("Driver 9", xlsxParsed.getRows().get(2).get("name"));
    assertEquals("Driver 10", xlsxParsed.getRows().get(3).get("name"));
    assertEquals("Driver 11", xlsxParsed.getRows().get(4).get("name"));

    // 3. JSON
    byte[] jsonZip = exporter.exportDriversZip(drivers, "json");
    Map<String, byte[]> jsonEntries = extractZipEntries(jsonZip);
    ParsedDataFile jsonParsed =
        DriverImportParserHelper.parseJson(
            new ByteArrayInputStream(jsonEntries.get("drivers.json")));
    assertEquals(5, jsonParsed.getRows().size());
    assertEquals("Driver 1", jsonParsed.getRows().get(0).get("name"));
    assertEquals("Driver 2", jsonParsed.getRows().get(1).get("name"));
    assertEquals("Driver 9", jsonParsed.getRows().get(2).get("name"));
    assertEquals("Driver 10", jsonParsed.getRows().get(3).get("name"));
    assertEquals("Driver 11", jsonParsed.getRows().get(4).get("name"));
  }

  @Test
  public void testLabelExportAcrossAllFormats() throws Exception {
    DriverLabel l1 =
        new DriverLabel.Builder()
            .withEntityId("lbl_c1")
            .withName("Club 1")
            .withColor("#3b82f6")
            .build();
    DriverLabel l2 =
        new DriverLabel.Builder()
            .withEntityId("lbl_c2")
            .withName("Club 2")
            .withColor("#ef4444")
            .build();
    DriverLabel l3 =
        new DriverLabel.Builder()
            .withEntityId("lbl_nov")
            .withName("Novice")
            .withColor("#10b981")
            .build();
    DriverLabel l4 =
        new DriverLabel.Builder()
            .withEntityId("lbl_pro")
            .withName("Pro")
            .withColor("#8b5cf6")
            .build();

    driverLabelRepository.insert(l1);
    driverLabelRepository.insert(l2);
    driverLabelRepository.insert(l3);
    driverLabelRepository.insert(l4);

    Driver d1 =
        new Driver.Builder()
            .withEntityId("d1")
            .withName("Driver 1")
            .withNickname("D1")
            .withLabelIds(Arrays.asList("lbl_c1", "lbl_nov"))
            .build();

    Driver d10 =
        new Driver.Builder()
            .withEntityId("d10")
            .withName("Driver 10")
            .withNickname("D10")
            .withLabelIds(Arrays.asList("lbl_c2", "lbl_pro"))
            .build();

    List<Driver> drivers = Arrays.asList(d1, d10);

    // 1. CSV
    byte[] csvZip = exporter.exportDriversZip(drivers, "csv");
    Map<String, byte[]> csvEntries = extractZipEntries(csvZip);
    String csvText = new String(csvEntries.get("drivers.csv"), StandardCharsets.UTF_8);
    // Header should contain Label 1..4
    assertTrue(csvText.contains("Label 1,Label 2,Label 3,Label 4"));
    // Driver 1 has Club 1 and Novice
    assertTrue(csvText.contains("Driver 1,D1,,Club 1,,Novice,"));
    // Driver 10 has Club 2 and Pro
    assertTrue(csvText.contains("Driver 10,D10,,,Club 2,,Pro"));

    // 2. Excel
    byte[] xlsxZip = exporter.exportDriversZip(drivers, "xlsx");
    Map<String, byte[]> xlsxEntries = extractZipEntries(xlsxZip);
    ParsedDataFile xlsxParsed =
        DriverImportParserHelper.parseExcel(
            new ByteArrayInputStream(xlsxEntries.get("drivers.xlsx")));
    assertEquals(2, xlsxParsed.getRows().size());
    Map<String, String> row1 = xlsxParsed.getRows().get(0);
    assertEquals("Driver 1", row1.get("name"));
    assertEquals("Club 1", row1.get("label1"));
    assertEquals("Novice", row1.get("label3"));
    Map<String, String> row2 = xlsxParsed.getRows().get(1);
    assertEquals("Driver 10", row2.get("name"));
    assertEquals("Club 2", row2.get("label2"));
    assertEquals("Pro", row2.get("label4"));

    // 3. JSON
    byte[] jsonZip = exporter.exportDriversZip(drivers, "json");
    Map<String, byte[]> jsonEntries = extractZipEntries(jsonZip);
    ObjectMapper mapper = new ObjectMapper();
    JsonNode jsonNode = mapper.readTree(jsonEntries.get("drivers.json"));
    JsonNode driversArray = jsonNode.get("drivers");
    assertEquals(2, driversArray.size());

    JsonNode j1 = driversArray.get(0);
    assertEquals("Driver 1", j1.get("name").asText());
    assertEquals("Club 1", j1.get("label1").asText());
    assertEquals("Novice", j1.get("label3").asText());
    JsonNode j1Labels = j1.get("labels");
    assertEquals(2, j1Labels.size());
    assertEquals("Club 1", j1Labels.get(0).asText());
    assertEquals("Novice", j1Labels.get(1).asText());

    JsonNode j2 = driversArray.get(1);
    assertEquals("Driver 10", j2.get("name").asText());
    assertEquals("Club 2", j2.get("label2").asText());
    assertEquals("Pro", j2.get("label4").asText());
    JsonNode j2Labels = j2.get("labels");
    assertEquals(2, j2Labels.size());
    assertEquals("Club 2", j2Labels.get(0).asText());
    assertEquals("Pro", j2Labels.get(1).asText());
  }
}
