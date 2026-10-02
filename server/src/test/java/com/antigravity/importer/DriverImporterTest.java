package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.model.DriverImportCommitRequest;
import com.antigravity.importer.model.DriverImportPreview;
import com.antigravity.importer.model.DriverImportResult;
import com.antigravity.importer.model.DriverImportRow;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DriverImporterTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private AssetService assetService;
  private DriverImporter importer;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);

    File assetsDir = new File(new File(databaseContext.getDataRoot(), "test_db"), "assets");
    assetService = new AssetService(databaseContext, assetsDir.getAbsolutePath());

    importer = new DriverImporter(databaseContext, driverRepository, assetService);
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
}
