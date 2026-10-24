package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.model.DriverImportCommitRequest;
import com.antigravity.importer.model.DriverImportPreview;
import com.antigravity.importer.model.DriverImportResult;
import com.antigravity.importer.model.DriverImportRow;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DriverImporterTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private SqliteRepository<DriverLabel> driverLabelRepository;
  private AssetService assetService;
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
  public void testParseAndValidateCsvValidDrivers() throws Exception {
    String csv =
        "Name,Nickname,Avatar,Lap Sound\n"
            + "Mario Rossi,Mario,avatar1.png,default_beep\n"
            + "Luigi Verdi,Luigi,,tts:Fast lap\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "drivers.csv", null);

    assertEquals(2, preview.getTotalRows());
    assertEquals(2, preview.getValidCount());
    assertEquals(0, preview.getConflictCount());
    assertEquals(0, preview.getErrorCount());

    DriverImportRow r1 = preview.getRows().get(0);
    assertEquals("Mario Rossi", r1.getResolvedName());
    assertEquals("Mario", r1.getResolvedNickname());
    assertEquals("avatar1.png", r1.getAvatarUrl());
    assertEquals("default_beep", r1.getAudioSlots().get("lap").getUrl());

    DriverImportRow r2 = preview.getRows().get(1);
    assertEquals("Luigi Verdi", r2.getResolvedName());
    assertEquals("Luigi", r2.getResolvedNickname());
    assertEquals("tts", r2.getAudioSlots().get("lap").getType());
    assertEquals("Fast lap", r2.getAudioSlots().get("lap").getText());
  }

  @Test
  public void testMissingNameProducesError() throws Exception {
    String csv = "Name,Nickname\n" + ",NoNameDriver\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "test.csv", null);

    assertEquals(1, preview.getTotalRows());
    assertEquals(0, preview.getValidCount());
    assertEquals(1, preview.getErrorCount());
    assertEquals("ERROR", preview.getRows().get(0).getStatus());
    assertTrue(preview.getRows().get(0).getMessage().toLowerCase().contains("name"));
  }

  @Test
  public void testBlankNicknameDefaultsToNameAndValidates() throws Exception {
    String csv = "Name,Nickname\n" + "Ayrton Senna,\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "test.csv", null);

    assertEquals(1, preview.getTotalRows());
    assertEquals(1, preview.getValidCount());
    assertEquals(0, preview.getConflictCount());

    DriverImportRow row = preview.getRows().get(0);
    assertEquals("Ayrton Senna", row.getResolvedName());
    assertEquals("Ayrton Senna", row.getResolvedNickname());
    assertEquals("VALID", row.getStatus());
  }

  @Test
  public void testBlankNicknameCollidingWithExistingDriver() throws Exception {
    // Existing driver with nickname "Speedy"
    driverRepository.insert(new Driver("John Smith", "Speedy", "d1", "d1"));

    // Imported driver named "Speedy" with blank nickname -> defaults to "Speedy" -> conflict!
    String csv = "Name,Nickname\n" + "Speedy,\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "test.csv", null);

    assertEquals(1, preview.getTotalRows());
    assertEquals(0, preview.getValidCount());
    assertEquals(1, preview.getConflictCount());

    DriverImportRow row = preview.getRows().get(0);
    assertEquals("CONFLICT", row.getStatus());
    assertEquals("DUPLICATE_NICKNAME", row.getConflictType());
    assertTrue(row.getMessage().contains("Speedy"));
  }

  @Test
  public void testDuplicateNameInDatabaseProducesConflict() throws Exception {
    driverRepository.insert(new Driver("Mario Rossi", "Mario", "d1", "d1"));

    String csv = "Name,Nickname\n" + "Mario Rossi,OtherNick\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "test.csv", null);

    assertEquals(1, preview.getConflictCount());
    DriverImportRow row = preview.getRows().get(0);
    assertEquals("CONFLICT", row.getStatus());
    assertEquals("DUPLICATE_NAME", row.getConflictType());
    assertEquals("d1", row.getExistingDriverId());
  }

  @Test
  public void testDuplicateNameInFileProducesConflict() throws Exception {
    String csv = "Name,Nickname\n" + "Carlos Sainz,Carlos\n" + "Carlos Sainz,SmoothOperator\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "test.csv", null);

    assertEquals(1, preview.getValidCount());
    assertEquals(1, preview.getConflictCount());
    assertEquals("DUPLICATE_IN_FILE", preview.getRows().get(1).getConflictType());
  }

  @Test
  public void testAudioDefaultDirectiveNoneVsSystem() throws Exception {
    String csvNone = "# default-audio: none\n" + "Name,Nickname\n" + "Driver One,One\n";
    DriverImportPreview p1 =
        importer.parseAndValidate(
            new ByteArrayInputStream(csvNone.getBytes(StandardCharsets.UTF_8)), "test.csv", null);
    assertEquals("none", p1.getDetectedAudioDefault());
    assertEquals("none", p1.getRows().get(0).getAudioSlots().get("lap").getType());

    String csvSystem = "# default-audio: system\n" + "Name,Nickname\n" + "Driver Two,Two\n";
    DriverImportPreview p2 =
        importer.parseAndValidate(
            new ByteArrayInputStream(csvSystem.getBytes(StandardCharsets.UTF_8)), "test.csv", null);
    assertEquals("system", p2.getDetectedAudioDefault());
    assertEquals("preset", p2.getRows().get(0).getAudioSlots().get("lap").getType());
    assertEquals("default_beep", p2.getRows().get(0).getAudioSlots().get("lap").getUrl());
  }

  @Test
  public void testAutoImportCompanionAssets() throws Exception {
    Map<String, byte[]> assets = new HashMap<>();
    byte[] mockWav = new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'};
    byte[] mockPng = new byte[] {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3, 4};
    assets.put("vroom.wav", mockWav);
    assets.put("avatar.png", mockPng);

    String csv = "Name,Nickname,Avatar,Lap Sound\n" + "Speed Racer,Speed,avatar.png,vroom.wav\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "test.csv", assets);

    assertEquals(1, preview.getValidCount());
    DriverImportRow row = preview.getRows().get(0);

    assertTrue(row.getAvatarUrl().startsWith("/assets/"));
    assertTrue(row.getAvatarUrl().contains("avatar"));

    AudioConfig lap = row.getAudioSlots().get("lap");
    assertEquals("preset", lap.getType());
    assertTrue(lap.getUrl().startsWith("/assets/"));
    assertTrue(lap.getUrl().contains("vroom"));
  }

  @Test
  public void testNonMediaCompanionAssetsAreIgnored() throws Exception {
    String csv = "Name,Nickname\nAlice,Ace\n";
    Map<String, byte[]> companionAssets = new HashMap<>();
    companionAssets.put("notes.txt", "some text".getBytes(StandardCharsets.UTF_8));
    companionAssets.put("data.csv", "more,csv".getBytes(StandardCharsets.UTF_8));
    companionAssets.put("avatar.png", "fake-png-bytes".getBytes(StandardCharsets.UTF_8));

    DriverImportPreview preview =
        importer.parseAndValidate(
            new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)),
            "drivers.csv",
            companionAssets);

    assertEquals(1, preview.getImportedAssetNames().size());
    assertEquals("avatar.png", preview.getImportedAssetNames().get(0));
  }

  @Test
  public void testCommitImportWithResolutions() throws Exception {
    Driver existing = new Driver("Existing Driver", "OldNick", "d1", "d1");
    driverRepository.insert(existing);

    DriverImportRow validRow = new DriverImportRow();
    validRow.setResolvedName("New Driver");
    validRow.setResolvedNickname("NewNick");
    validRow.setStatus("VALID");

    DriverImportRow overwriteRow = new DriverImportRow();
    overwriteRow.setResolvedName("Existing Driver");
    overwriteRow.setResolvedNickname("UpdatedNick");
    overwriteRow.setExistingDriverId("d1");
    overwriteRow.setStatus("CONFLICT");
    overwriteRow.setSelectedResolution("OVERWRITE");

    DriverImportRow autoRenameRow = new DriverImportRow();
    autoRenameRow.setResolvedName("Existing Driver");
    autoRenameRow.setResolvedNickname("OldNick");
    autoRenameRow.setStatus("CONFLICT");
    autoRenameRow.setSelectedResolution("AUTO_RENAME");

    DriverImportRow skipRow = new DriverImportRow();
    skipRow.setResolvedName("Skip Me");
    skipRow.setResolvedNickname("Skip");
    skipRow.setStatus("CONFLICT");
    skipRow.setSelectedResolution("SKIP");

    DriverImportCommitRequest req =
        new DriverImportCommitRequest(
            java.util.Arrays.asList(validRow, overwriteRow, autoRenameRow, skipRow));

    DriverImportResult result = importer.commitImport(req);

    assertTrue(result.isSuccess());
    assertEquals(2, result.getImportedCount()); // validRow + autoRenameRow
    assertEquals(1, result.getUpdatedCount()); // overwriteRow
    assertEquals(1, result.getSkippedCount()); // skipRow

    // Verify overwrite in DB
    Driver updated = driverRepository.findByEntityId("d1");
    assertNotNull(updated);
    assertEquals("UpdatedNick", updated.getNickname());

    // Verify auto-rename inserted
    assertTrue(
        driverRepository.findAll().stream()
            .anyMatch(d -> d.getName().contains("Existing Driver (1)")));
  }

  @Test
  public void testTemplates() throws Exception {
    String csv = importer.generateCsvTemplate();
    assertTrue(csv.contains("Name,Nickname"));

    byte[] xlsx = importer.generateXlsxTemplate();
    assertTrue(xlsx.length > 0);

    String json = importer.generateJsonTemplate();
    assertTrue(json.contains("\"drivers\""));
  }

  @Test
  public void testExistingDriversIncludedInPreviewAndCrossFieldCollisions() throws Exception {
    Driver d1 = new Driver("Max Verstappen", "Mad Max", "d-max", "d-max");
    driverRepository.insert(d1);

    // Row 1 matches existing nickname as candidate name
    // Row 2 matches existing name as candidate nickname
    String csv = "Name,Nickname\nMad Max,SuperMax\nNewDriver,Max Verstappen\n";
    DriverImportPreview preview =
        importer.parseAndValidate(
            new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)), "drivers.csv", null);

    assertNotNull(preview.getExistingDrivers());
    assertEquals(1, preview.getExistingDrivers().size());
    assertEquals("Max Verstappen", preview.getExistingDrivers().get(0).getName());
    assertEquals("Mad Max", preview.getExistingDrivers().get(0).getNickname());

    assertEquals(2, preview.getConflictCount());
    assertEquals("DUPLICATE_NAME", preview.getRows().get(0).getConflictType());
    assertEquals("DUPLICATE_NICKNAME", preview.getRows().get(1).getConflictType());
  }

  @Test
  public void testDefensiveAutoRenameOnCommitForCollidingValidRow() throws Exception {
    Driver d1 = new Driver("Existing Driver", "OldNick", "d1", "d1");
    driverRepository.insert(d1);

    // Row comes marked VALID but has duplicate nickname OldNick
    DriverImportRow collidingRow = new DriverImportRow();
    collidingRow.setResolvedName("Existing Driver_1");
    collidingRow.setResolvedNickname("OldNick");
    collidingRow.setStatus("VALID");

    DriverImportCommitRequest request = new DriverImportCommitRequest();
    request.setRows(Arrays.asList(collidingRow));

    DriverImportResult result = importer.commitImport(request);
    assertTrue(result.isSuccess());
    assertEquals(1, result.getImportedCount());

    // Defensive check auto-renamed nickname to avoid DB collision
    assertTrue(
        driverRepository.findAll().stream()
            .anyMatch(d -> d.getNickname().startsWith("OldNick (1)")));
  }

  @Test
  public void testImportJsonWithDefaultHelmetAvatars() throws Exception {
    String json =
        "{\n"
            + "  \"defaultAudio\": \"system\",\n"
            + "  \"drivers\": [\n"
            + "    {\n"
            + "      \"name\": \"Fernando Alonso\",\n"
            + "      \"nickname\": \"El Nano\",\n"
            + "      \"avatarUrl\": \"assets/defaults/helmets/helmet_yellow.png\",\n"
            + "      \"lapAudio\": { \"type\": \"tts\", \"text\": \"Fast lap\" }\n"
            + "    },\n"
            + "    {\n"
            + "      \"name\": \"Sebastian Vettel\",\n"
            + "      \"nickname\": \"Seb\",\n"
            + "      \"avatarUrl\": \"assets/defaults/helmets/helmet_red.png\"\n"
            + "    }\n"
            + "  ]\n"
            + "}";

    ByteArrayInputStream bais = new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview =
        importer.parseAndValidate(bais, "03_full_configuration.json", null);

    assertEquals(2, preview.getTotalRows());
    assertEquals(2, preview.getValidCount());

    DriverImportRow alonsoRow = preview.getRows().get(0);
    assertEquals("Fernando Alonso", alonsoRow.getResolvedName());
    assertTrue(
        "Alonso avatar should resolve to yellow helmet asset URL",
        alonsoRow.getAvatarUrl() != null && alonsoRow.getAvatarUrl().contains("black-yellow"));

    DriverImportRow vettelRow = preview.getRows().get(1);
    assertEquals("Sebastian Vettel", vettelRow.getResolvedName());
    assertTrue(
        "Vettel avatar should resolve to red helmet asset URL",
        vettelRow.getAvatarUrl() != null && vettelRow.getAvatarUrl().contains("red-yellow"));

    DriverImportCommitRequest req = new DriverImportCommitRequest(preview.getRows());
    DriverImportResult result = importer.commitImport(req);
    assertTrue(result.isSuccess());
    assertEquals(2, result.getImportedCount());

    Driver importedAlonso =
        driverRepository.findAll().stream()
            .filter(d -> "Fernando Alonso".equals(d.getName()))
            .findFirst()
            .orElse(null);
    assertNotNull(importedAlonso);
    assertTrue(importedAlonso.getAvatarUrl().startsWith("/assets/"));
    assertTrue(importedAlonso.getAvatarUrl().contains("black-yellow"));
  }

  @Test
  public void testCommitImportWithOverwritePopulatesUpdatedDriverIds() throws Exception {
    Driver existing = new Driver("Lewis Hamilton", "Lewis", "lh1", "lh1");
    driverRepository.insert(existing);

    DriverImportRow row = new DriverImportRow();
    row.setExistingDriverId("lh1");
    row.setResolvedName("Lewis Hamilton");
    row.setResolvedNickname("Sir Lewis");
    row.setStatus("CONFLICT");
    row.setSelectedResolution("OVERWRITE");

    Map<String, AudioConfig> audioSlots = new HashMap<>();
    audioSlots.put("lap", new AudioConfig("preset", "/assets/custom_sound.wav", ""));
    row.setAudioSlots(audioSlots);

    DriverImportCommitRequest req = new DriverImportCommitRequest(Arrays.asList(row));
    DriverImportResult result = importer.commitImport(req);

    assertTrue(result.isSuccess());
    assertEquals(0, result.getImportedCount());
    assertEquals(1, result.getUpdatedCount());
    assertEquals(1, result.getUpdatedDriverIds().size());
    assertEquals("lh1", result.getUpdatedDriverIds().get(0));

    Driver updated = driverRepository.findByEntityId("lh1");
    assertNotNull(updated);
    assertEquals("Sir Lewis", updated.getNickname());
    assertNotNull(updated.getLapAudio());
    assertEquals("/assets/custom_sound.wav", updated.getLapAudio().getUrl());
  }

  @Test
  public void testParseAndValidateCsvDriftLapSound() throws Exception {
    String csv = "Name,Nickname,Drift Lap Sound\n" + "Takumi Fujiwara,Takumi,tts:Initial D drift\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "drifters.csv", null);

    assertEquals(1, preview.getTotalRows());
    assertEquals(1, preview.getValidCount());
    DriverImportRow row = preview.getRows().get(0);
    assertNotNull(row.getAudioSlots().get("driftLap"));
    assertEquals("tts", row.getAudioSlots().get("driftLap").getType());
    assertEquals("Initial D drift", row.getAudioSlots().get("driftLap").getText());

    DriverImportCommitRequest req = new DriverImportCommitRequest(preview.getRows());
    DriverImportResult result = importer.commitImport(req);
    assertTrue(result.isSuccess());
    Driver imported = driverRepository.findByEntityId(result.getCreatedDriverIds().get(0));
    assertNotNull(imported);
    assertNotNull(imported.getDriftLapAudio());
    assertEquals("tts", imported.getDriftLapAudio().getType());
    assertEquals("Initial D drift", imported.getDriftLapAudio().getText());
  }

  @Test
  public void testImportCsvWithNumberedLabelsAndAutoCreateLabels() throws Exception {
    // Label 1 already exists in DB, Label 2 and Novice are new
    DriverLabel existingLbl =
        new DriverLabel.Builder()
            .withEntityId("lbl_club1")
            .withName("Club 1")
            .withColor("#3b82f6")
            .build();
    driverLabelRepository.insert(existingLbl);

    String csv =
        "Name,Nickname,Label 1,Label 2\n"
            + "Mario Rossi,Mario,Club 1,Novice\n"
            + "Luigi Verdi,Luigi,Club 2,\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "drivers.csv", null);

    assertEquals(2, preview.getTotalRows());
    assertEquals(2, preview.getValidCount());

    DriverImportRow r1 = preview.getRows().get(0);
    assertNotNull(r1.getLabels());
    assertEquals(2, r1.getLabels().size());
    assertTrue(r1.getLabels().contains("Club 1"));
    assertTrue(r1.getLabels().contains("Novice"));
    // Pre-resolved labelIds has lbl_club1 because it existed in DB
    assertNotNull(r1.getLabelIds());
    assertTrue(r1.getLabelIds().contains("lbl_club1"));

    DriverImportRow r2 = preview.getRows().get(1);
    assertNotNull(r2.getLabels());
    assertEquals(1, r2.getLabels().size());
    assertTrue(r2.getLabels().contains("Club 2"));

    // Commit import
    DriverImportCommitRequest req = new DriverImportCommitRequest(preview.getRows());
    DriverImportResult result = importer.commitImport(req);
    assertTrue(result.isSuccess());
    assertEquals(2, result.getImportedCount());

    // Verify all 3 labels now exist in DB
    List<DriverLabel> allDbLabels = driverLabelRepository.findAll();
    assertEquals(3, allDbLabels.size());
    DriverLabel novLbl =
        allDbLabels.stream()
            .filter(l -> "Novice".equalsIgnoreCase(l.getName()))
            .findFirst()
            .orElse(null);
    DriverLabel club2Lbl =
        allDbLabels.stream()
            .filter(l -> "Club 2".equalsIgnoreCase(l.getName()))
            .findFirst()
            .orElse(null);
    assertNotNull(novLbl);
    assertNotNull(club2Lbl);

    // Verify drivers have correct label IDs
    Driver mario = driverRepository.findByEntityId(result.getCreatedDriverIds().get(0));
    assertNotNull(mario);
    assertEquals(2, mario.getLabelIds().size());
    assertTrue(mario.getLabelIds().contains("lbl_club1"));
    assertTrue(mario.getLabelIds().contains(novLbl.getEntityId()));

    Driver luigi = driverRepository.findByEntityId(result.getCreatedDriverIds().get(1));
    assertNotNull(luigi);
    assertEquals(1, luigi.getLabelIds().size());
    assertTrue(luigi.getLabelIds().contains(club2Lbl.getEntityId()));
  }

  @Test
  public void testImportExcelWithLabels() throws Exception {
    byte[] xlsxBytes;
    try (Workbook wb = new XSSFWorkbook();
        ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
      Sheet sheet = wb.createSheet("Drivers");
      Row header = sheet.createRow(0);
      header.createCell(0).setCellValue("Name");
      header.createCell(1).setCellValue("Nickname");
      header.createCell(2).setCellValue("Label 1");
      header.createCell(3).setCellValue("Label 2");

      Row r1 = sheet.createRow(1);
      r1.createCell(0).setCellValue("Charles Leclerc");
      r1.createCell(1).setCellValue("Charles");
      r1.createCell(2).setCellValue("Pro");
      r1.createCell(3).setCellValue("Scuderia");

      wb.write(baos);
      xlsxBytes = baos.toByteArray();
    }

    ByteArrayInputStream bais = new ByteArrayInputStream(xlsxBytes);
    DriverImportPreview preview = importer.parseAndValidate(bais, "drivers.xlsx", null);
    assertEquals(1, preview.getTotalRows());
    DriverImportRow row = preview.getRows().get(0);
    assertNotNull(row.getLabels());
    assertEquals(2, row.getLabels().size());
    assertTrue(row.getLabels().contains("Pro"));
    assertTrue(row.getLabels().contains("Scuderia"));

    DriverImportResult result =
        importer.commitImport(new DriverImportCommitRequest(preview.getRows()));
    assertTrue(result.isSuccess());
    Driver charles = driverRepository.findByEntityId(result.getCreatedDriverIds().get(0));
    assertNotNull(charles);
    assertEquals(2, charles.getLabelIds().size());
  }

  @Test
  public void testImportJsonWithLabelsArrayAndNumberedLabels() throws Exception {
    String json =
        "{\n"
            + "  \"defaultAudio\": \"system\",\n"
            + "  \"drivers\": [\n"
            + "    {\n"
            + "      \"name\": \"Max Verstappen\",\n"
            + "      \"nickname\": \"Max\",\n"
            + "      \"labels\": [\"Champion\", \"RedBull\"]\n"
            + "    },\n"
            + "    {\n"
            + "      \"name\": \"George Russell\",\n"
            + "      \"nickname\": \"George\",\n"
            + "      \"label1\": \"Mercedes\",\n"
            + "      \"label2\": \"Pro\"\n"
            + "    }\n"
            + "  ]\n"
            + "}";

    ByteArrayInputStream bais = new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "drivers.json", null);

    assertEquals(2, preview.getTotalRows());
    DriverImportRow r1 = preview.getRows().get(0);
    assertNotNull(r1.getLabels());
    assertTrue(r1.getLabels().contains("Champion"));
    assertTrue(r1.getLabels().contains("RedBull"));

    DriverImportRow r2 = preview.getRows().get(1);
    assertNotNull(r2.getLabels());
    assertTrue(r2.getLabels().contains("Mercedes"));
    assertTrue(r2.getLabels().contains("Pro"));

    DriverImportResult result =
        importer.commitImport(new DriverImportCommitRequest(preview.getRows()));
    assertTrue(result.isSuccess());
    assertEquals(2, result.getImportedCount());
  }

  @Test
  public void testImportOverwritePreservesLabelsWhenNoLabelColumnsProvided() throws Exception {
    DriverLabel existingLbl =
        new DriverLabel.Builder()
            .withEntityId("lbl_keep")
            .withName("KeepMe")
            .withColor("#3b82f6")
            .build();
    driverLabelRepository.insert(existingLbl);

    Driver existingDriver =
        new Driver.Builder()
            .withEntityId("d_existing")
            .withName("Lando Norris")
            .withNickname("Lando")
            .withLabelIds(Arrays.asList("lbl_keep"))
            .build();
    driverRepository.insert(existingDriver);

    // CSV without any label columns
    String csv = "Name,Nickname\n" + "Lando Norris,LandoSuper\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "drivers.csv", null);
    assertEquals(1, preview.getConflictCount());

    DriverImportRow row = preview.getRows().get(0);
    row.setSelectedResolution("OVERWRITE");

    DriverImportResult result =
        importer.commitImport(new DriverImportCommitRequest(Arrays.asList(row)));
    assertTrue(result.isSuccess());

    Driver updated = driverRepository.findByEntityId("d_existing");
    assertNotNull(updated);
    assertEquals("LandoSuper", updated.getNickname());
    // Labels must be preserved because file had no label columns
    assertNotNull(updated.getLabelIds());
    assertEquals(1, updated.getLabelIds().size());
    assertEquals("lbl_keep", updated.getLabelIds().get(0));
  }

  @Test
  public void testImportOverwriteReplacesLabelsWhenLabelColumnsProvided() throws Exception {
    DriverLabel oldLbl =
        new DriverLabel.Builder()
            .withEntityId("lbl_old")
            .withName("OldClub")
            .withColor("#3b82f6")
            .build();
    driverLabelRepository.insert(oldLbl);

    Driver existingDriver =
        new Driver.Builder()
            .withEntityId("d_existing2")
            .withName("Oscar Piastri")
            .withNickname("Oscar")
            .withLabelIds(Arrays.asList("lbl_old"))
            .build();
    driverRepository.insert(existingDriver);

    // CSV WITH a label column specifying a new label
    String csv = "Name,Nickname,Label 1\n" + "Oscar Piastri,OscarSuper,NewClub\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    DriverImportPreview preview = importer.parseAndValidate(bais, "drivers.csv", null);
    assertEquals(1, preview.getConflictCount());

    DriverImportRow row = preview.getRows().get(0);
    row.setSelectedResolution("OVERWRITE");

    DriverImportResult result =
        importer.commitImport(new DriverImportCommitRequest(Arrays.asList(row)));
    assertTrue(result.isSuccess());

    Driver updated = driverRepository.findByEntityId("d_existing2");
    assertNotNull(updated);
    assertEquals("OscarSuper", updated.getNickname());
    // Labels must be replaced with NewClub
    assertNotNull(updated.getLabelIds());
    assertEquals(1, updated.getLabelIds().size());
    DriverLabel newLbl =
        driverLabelRepository.findAll().stream()
            .filter(l -> "NewClub".equalsIgnoreCase(l.getName()))
            .findFirst()
            .orElse(null);
    assertNotNull(newLbl);
    assertEquals(newLbl.getEntityId(), updated.getLabelIds().get(0));
  }

  @Test
  public void testTemplatesIncludeLabels() throws Exception {
    // 1. CSV template
    String csv = importer.generateCsvTemplate();
    assertTrue("CSV template should include Label 1", csv.contains("Label 1"));
    assertTrue("CSV template should include Label 2", csv.contains("Label 2"));

    // 2. XLSX template
    byte[] xlsx = importer.generateXlsxTemplate();
    assertNotNull(xlsx);
    try (ByteArrayInputStream bais = new ByteArrayInputStream(xlsx)) {
      DriverImportParserHelper.ParsedDataFile parsed = DriverImportParserHelper.parseExcel(bais);
      assertNotNull(parsed.getRows());
      assertTrue(parsed.getRows().size() >= 2);
      assertEquals("Club 1", parsed.getRows().get(0).get("label1"));
      assertEquals("Novice", parsed.getRows().get(0).get("label2"));
    }

    // 3. JSON template
    String json = importer.generateJsonTemplate();
    assertTrue(
        "JSON template should include labels", json.contains("labels") || json.contains("label1"));
    try (ByteArrayInputStream bais =
        new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8))) {
      DriverImportParserHelper.ParsedDataFile parsed = DriverImportParserHelper.parseJson(bais);
      assertNotNull(parsed.getRows());
      assertTrue(parsed.getRows().size() >= 2);
      assertEquals("Club 1", parsed.getRows().get(0).get("label1"));
      assertEquals("Novice", parsed.getRows().get(0).get("label2"));
    }
  }

  @Test
  public void testGenerateUniqueLabelColorPicksAvailablePreset() {
    String color = importer.generateUniqueLabelColor(new HashSet<>());
    assertNotNull(color);
    assertTrue(color.matches("^#[0-9a-fA-F]{6}$"));
    assertTrue(DriverImporter.PRESET_LABEL_COLORS.contains(color));
  }

  @Test
  public void testGenerateUniqueLabelColorAvoidsUsedColors() {
    Set<String> used = new HashSet<>();
    // Mark all presets except the very last one as used
    for (int i = 0; i < DriverImporter.PRESET_LABEL_COLORS.size() - 1; i++) {
      used.add(DriverImporter.PRESET_LABEL_COLORS.get(i).toLowerCase(java.util.Locale.ROOT));
    }
    String expected =
        DriverImporter.PRESET_LABEL_COLORS.get(DriverImporter.PRESET_LABEL_COLORS.size() - 1);
    String chosen = importer.generateUniqueLabelColor(used);
    assertEquals(expected, chosen);
  }

  @Test
  public void testGenerateUniqueLabelColorFallsBackToRandomHexWhenPresetsExhausted() {
    Set<String> used = new HashSet<>();
    for (String preset : DriverImporter.PRESET_LABEL_COLORS) {
      used.add(preset.toLowerCase(java.util.Locale.ROOT));
    }
    String chosen = importer.generateUniqueLabelColor(used);
    assertNotNull(chosen);
    assertTrue(chosen.matches("^#[0-9a-fA-F]{6}$"));
    assertFalse(used.contains(chosen.toLowerCase(java.util.Locale.ROOT)));
  }

  @Test
  public void testImportNewLabelsRandomizesAndKeepsUniqueColors() throws Exception {
    // 1. Existing label with red color in DB
    String existingColor = "#ef4444";
    DriverLabel existingLbl =
        new DriverLabel.Builder()
            .withEntityId("lbl_existing")
            .withName("Veteran")
            .withColor(existingColor)
            .build();
    driverLabelRepository.insert(existingLbl);

    // 2. Import CSV with 4 distinct new labels across 4 drivers
    String csv =
        "Name,Nickname,Label 1\n"
            + "Racer One,R1,Group Alpha\n"
            + "Racer Two,R2,Group Beta\n"
            + "Racer Three,R3,Group Gamma\n"
            + "Racer Four,R4,Group Delta\n";

    DriverImportPreview preview =
        importer.parseAndValidate(
            new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)), "drivers.csv", null);
    assertEquals(4, preview.getRows().size());

    DriverImportCommitRequest req = new DriverImportCommitRequest(preview.getRows());
    DriverImportResult result = importer.commitImport(req);
    assertTrue(result.isSuccess());
    assertEquals(4, result.getImportedCount());

    // 3. Verify all 4 new labels were created and each has a unique color
    List<DriverLabel> allLabels = driverLabelRepository.findAll();
    assertEquals(5, allLabels.size()); // 1 existing + 4 new

    Set<String> assignedColors = new HashSet<>();
    for (DriverLabel lbl : allLabels) {
      assertNotNull(lbl.getColor());
      assertTrue(lbl.getColor().matches("^#[0-9a-fA-F]{6}$"));
      assignedColors.add(lbl.getColor().toLowerCase(java.util.Locale.ROOT));
    }
    assertEquals("All labels must have unique colors", 5, assignedColors.size());

    // None of the newly created labels should use the existing label's color
    for (DriverLabel lbl : allLabels) {
      if (!"lbl_existing".equals(lbl.getEntityId())) {
        assertFalse(
            "New label " + lbl.getName() + " should not have existing label color",
            existingColor.equalsIgnoreCase(lbl.getColor()));
      }
    }
  }

  @Test
  public void testDeterministicRandomLabelColorSelection() throws Exception {
    DriverImporter deterministicImporter =
        new DriverImporter(
            databaseContext,
            driverRepository,
            assetService,
            driverLabelRepository,
            new Random(12345));

    Set<String> used = new HashSet<>();
    String color1 = deterministicImporter.generateUniqueLabelColor(used);
    used.add(color1.toLowerCase(java.util.Locale.ROOT));

    String color2 = deterministicImporter.generateUniqueLabelColor(used);
    assertFalse(color1.equalsIgnoreCase(color2));
  }
}
