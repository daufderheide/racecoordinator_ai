package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.model.DriverImportMapping;
import com.antigravity.importer.model.DriverResolution;
import com.antigravity.importer.model.RacePackageCommitRequest;
import com.antigravity.importer.model.RacePackagePreview;
import com.antigravity.importer.model.RacePackageResult;
import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.Track;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceStatistics;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class RacePackageImporterTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private SqliteRepository<RaceHistoryRecord> historyRepository;
  private SqliteRepository<Race> raceRepository;
  private SqliteRepository<Season> seasonRepository;
  private SqliteRepository<com.antigravity.models.Team> teamRepository;
  private AssetService assetService;
  private RacePackageExporter exporter;
  private RacePackageImporter importer;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    historyRepository =
        new SqliteRepository<>(databaseContext, "race_history", RaceHistoryRecord.class);
    raceRepository = new SqliteRepository<>(databaseContext, "races", Race.class);
    seasonRepository = new SqliteRepository<>(databaseContext, "seasons", Season.class);
    teamRepository =
        new SqliteRepository<>(databaseContext, "teams", com.antigravity.models.Team.class);

    File assetsDir = new File(new File(databaseContext.getDataRoot(), "test_db"), "assets");
    assetService = new AssetService(databaseContext, assetsDir.getAbsolutePath());

    exporter =
        new RacePackageExporter(
            databaseContext, assetService, driverRepository, raceRepository, teamRepository);
    importer =
        new RacePackageImporter(
            databaseContext,
            assetService,
            driverRepository,
            historyRepository,
            raceRepository,
            teamRepository);
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

  private byte[] createSamplePackage(
      String raceId, String raceName, long timestamp, String d1Name, String d2Name)
      throws Exception {
    Driver d1 =
        new Driver.Builder().withEntityId("src-d1").withName(d1Name).withNickname("Rocket").build();
    Driver d2 =
        new Driver.Builder()
            .withEntityId("src-d2")
            .withName(d2Name)
            .withNickname("Sideways")
            .build();
    driverRepository.save(d1);
    driverRepository.save(d2);

    Race raceModel = new Race.Builder().withEntityId("race-cfg-1").withName(raceName).build();

    Track track =
        new Track.Builder()
            .name("Silverstone")
            .entityId("track-1")
            .lanes(
                Arrays.asList(
                    new Lane("#ff0000", "#ffffff", 100, "l1", null),
                    new Lane("#00ff00", "#000000", 100, "l2", null)))
            .build();

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    rp1.setTotalLaps(50);

    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    rp2.setTotalLaps(48);

    Heat h1 = new Heat();
    h1.setHeatNumber(1);

    RaceStatistics stats = new RaceStatistics();
    stats.setStartTime("2026-11-19T10:00:00Z");

    RaceHistoryRecord record =
        new RaceHistoryRecord(
            raceId,
            "orig-1",
            raceModel,
            track,
            Arrays.asList(rp1, rp2),
            Collections.singletonList(h1),
            600.0f,
            stats,
            false,
            timestamp);

    SeasonDriverResult res1 = new SeasonDriverResult("src-d1", d1Name, 1, 25.0, 0.0, 25.0);
    SeasonDriverResult res2 = new SeasonDriverResult("src-d2", d2Name, 2, 18.0, 0.0, 18.0);
    record.setDriverResults(Arrays.asList(res1, res2));

    historyRepository.save(record);

    RecordData recordData =
        RecordData.newBuilder()
            .setCurrent(
                com.antigravity.proto.CurrentRecords.newBuilder()
                    .setFastestLap(
                        RecordEntry.newBuilder().setValue(5.123).setHolderName(d1Name).build())
                    .build())
            .build();
    DatabaseService.getInstance()
        .saveRaceRecords(databaseContext, raceId, recordData.toByteArray(), false);

    byte[] bytes = exporter.exportRacePackage(raceId, false);

    // Clean up history and drivers to simulate fresh target computer
    historyRepository.delete(raceId);
    driverRepository.delete("src-d1");
    driverRepository.delete("src-d2");

    return bytes;
  }

  @Test
  public void testPreviewPackage_NewDriversAndNoDuplicate() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    assertNotNull(preview);
    assertFalse(preview.isDuplicateRace());
    assertNotNull(preview.getManifest());
    assertEquals("GT3 Cup Round 1", preview.getManifest().getRaceName());
    assertEquals(2, preview.getDriverMappings().size());

    DriverImportMapping mDave =
        preview.getDriverMappings().stream()
            .filter(m -> "Dave Brown".equals(m.getSourceDriverName()))
            .findFirst()
            .orElse(null);
    assertNotNull(mDave);
    assertEquals("Dave Brown", mDave.getSourceDriverName());
    assertEquals("NONE", mDave.getMatchType());
    assertEquals("CREATE_NEW", mDave.getSuggestedAction());
    assertNotNull(preview.getTempPackageToken());
  }

  @Test
  public void testPreviewPackage_ExactNameAndNicknameMatches() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    // Local DB has "Dave Brown" (exact name) and "Robert S" with nickname "Sideways"
    Driver localDave =
        new Driver.Builder().withEntityId("local-dave-1").withName("dave brown").build();
    Driver localRobert =
        new Driver.Builder()
            .withEntityId("local-robert-2")
            .withName("Robert S")
            .withNickname("sideways")
            .build();
    driverRepository.save(localDave);
    driverRepository.save(localRobert);

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    assertEquals(2, preview.getDriverMappings().size());

    DriverImportMapping mDave =
        preview.getDriverMappings().stream()
            .filter(m -> "Dave Brown".equals(m.getSourceDriverName()))
            .findFirst()
            .orElse(null);
    assertNotNull(mDave);
    assertEquals("EXACT_NAME", mDave.getMatchType());
    assertEquals("LINK", mDave.getSuggestedAction());
    assertEquals("local-dave-1", mDave.getMatchedLocalDriverId());

    DriverImportMapping mBob =
        preview.getDriverMappings().stream()
            .filter(m -> "Bob Smith".equals(m.getSourceDriverName()))
            .findFirst()
            .orElse(null);
    assertNotNull(mBob);
    assertEquals("EXACT_NICKNAME", mBob.getMatchType());
    assertEquals("LINK", mBob.getSuggestedAction());
    assertEquals("local-robert-2", mBob.getMatchedLocalDriverId());
  }

  @Test
  public void testPreviewPackage_DuplicateDetection() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    // Pre-insert identical race into history
    Race raceModel =
        new Race.Builder().withEntityId("race-cfg-1").withName("GT3 Cup Round 1").build();
    RaceHistoryRecord existing =
        new RaceHistoryRecord(
            "existing-hist-id",
            "orig-1",
            raceModel,
            null,
            null,
            null,
            600.0f,
            null,
            false,
            1700000000000L);
    historyRepository.save(existing);

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    assertTrue("Duplicate race should be detected", preview.isDuplicateRace());
    assertEquals("existing-hist-id", preview.getExistingRaceId());
  }

  @Test
  public void testCommitPackage_CreateNewDriversAndSeasonIngestion() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    // Create a season
    Season season = new Season("2026 Winter Cup", 1, new ArrayList<>(), "season-winter-1", null);
    seasonRepository.save(season);

    // Commit request with CREATE_NEW and attach to season
    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            Arrays.asList(
                new DriverResolution("src-d1", "CREATE_NEW", null, "Dave Brown Jr"),
                new DriverResolution("src-d2", "CREATE_NEW", null, "Bob Smith")),
            "season-winter-1");

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals(2, result.getDriversCreated());
    assertEquals(0, result.getDriversLinked());
    assertEquals("season-winter-1", result.getCommittedToSeasonId());

    // Verify drivers were created in repository
    List<Driver> allDrivers = driverRepository.findAll();
    assertEquals(2, allDrivers.size());

    // Verify race history saved
    RaceHistoryRecord importedHistory =
        historyRepository.findByEntityId(result.getImportedRaceId());
    assertNotNull(importedHistory);
    assertEquals(2, importedHistory.getDrivers().size());

    // Verify season has the race appended with pre-calculated driver points
    Season updatedSeason = seasonRepository.findByEntityId("season-winter-1");
    assertNotNull(updatedSeason);
    assertEquals(1, updatedSeason.getRaces().size());
    SeasonRaceRecord seasonRace = updatedSeason.getRaces().get(0);
    assertEquals(2, seasonRace.getDriverResults().size());
    assertEquals(25.0, seasonRace.getDriverResults().get(0).getTotalPoints(), 0.001);
  }

  @Test
  public void testCommitPackage_LinkExistingDriver() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    // Existing local driver Dave
    Driver localDave =
        new Driver.Builder().withEntityId("local-dave-uuid").withName("Dave Brown").build();
    driverRepository.save(localDave);

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            Arrays.asList(
                new DriverResolution("src-d1", "LINK", "local-dave-uuid", null),
                new DriverResolution("src-d2", "CREATE_NEW", null, "Bob Smith")),
            null);

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals(1, result.getDriversLinked());
    assertEquals(1, result.getDriversCreated());

    // Verify history record has the linked driver UUID
    RaceHistoryRecord importedHistory =
        historyRepository.findByEntityId(result.getImportedRaceId());
    assertNotNull(importedHistory);
    assertEquals("local-dave-uuid", importedHistory.getDrivers().get(0).getObjectId());
  }

  @Test
  public void testCommitPackage_DuplicateSkip() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    // Add duplicate to history
    Race raceModel =
        new Race.Builder().withEntityId("race-cfg-1").withName("GT3 Cup Round 1").build();
    RaceHistoryRecord existing =
        new RaceHistoryRecord(
            "existing-hist-id",
            "orig-1",
            raceModel,
            null,
            null,
            null,
            600.0f,
            null,
            false,
            1700000000000L);
    historyRepository.save(existing);

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(), "SKIP", Collections.emptyList(), null);

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals("Skipped race package import", result.getMessage());
    assertEquals("SKIPPED", result.getAction());
    assertEquals(0, result.getDriversCreated());
    assertEquals(0, result.getDriversLinked());
    List<Driver> allDrivers = driverRepository.findAll();
    assertEquals(0, allDrivers.size());
  }

  @Test
  public void testPreviewPackage_RaceConfigConflictDetected() throws Exception {
    Race existingRace =
        new Race.Builder().withEntityId("local-cfg-1").withName("GT3 Cup Round 1").build();
    raceRepository.save(existingRace);

    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    assertTrue(preview.isConfigConflict());
    assertEquals("GT3 Cup Round 1", preview.getExistingConfigName());
    assertEquals("GT3 Cup Round 1 (1)", preview.getSuggestedConfigName());
  }

  @Test
  public void testCommitPackage_AutoRenameRaceConfig() throws Exception {
    Race existingRace =
        new Race.Builder().withEntityId("local-cfg-1").withName("GT3 Cup Round 1").build();
    raceRepository.save(existingRace);

    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            "AUTO_RENAME",
            null,
            Collections.emptyList(),
            null);

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals("AUTO_RENAME", result.getRaceConfigAction());
    assertEquals("GT3 Cup Round 1 (1)", result.getRaceConfigName());
    assertNotNull(result.getRaceConfigId());

    // Both races should exist in race repository
    List<Race> allRaces = raceRepository.findAll();
    assertEquals(2, allRaces.size());
  }

  @Test
  public void testCommitPackage_OverwriteRaceConfig() throws Exception {
    Race existingRace =
        new Race.Builder()
            .withEntityId("local-cfg-1")
            .withName("GT3 Cup Round 1")
            .withMinLapTime(5.0)
            .build();
    raceRepository.save(existingRace);

    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            "OVERWRITE",
            null,
            Collections.emptyList(),
            null);

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals("OVERWRITE", result.getRaceConfigAction());
    assertEquals("GT3 Cup Round 1", result.getRaceConfigName());
    assertEquals("local-cfg-1", result.getRaceConfigId());

    // Only 1 race should exist in race repository with the same ID
    List<Race> allRaces = raceRepository.findAll();
    assertEquals(1, allRaces.size());
    assertEquals("local-cfg-1", allRaces.get(0).getEntityId());
  }

  @Test
  public void testCommitPackage_UseExistingRaceConfig() throws Exception {
    Race existingRace =
        new Race.Builder()
            .withEntityId("local-cfg-1")
            .withName("GT3 Cup Round 1")
            .withMinLapTime(5.0)
            .build();
    raceRepository.save(existingRace);

    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            "USE_EXISTING",
            null,
            Collections.emptyList(),
            null);

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals("USE_EXISTING", result.getRaceConfigAction());
    assertEquals("GT3 Cup Round 1", result.getRaceConfigName());
    assertEquals("local-cfg-1", result.getRaceConfigId());

    // Only 1 race should exist and its minLapTime should remain 5.0
    List<Race> allRaces = raceRepository.findAll();
    assertEquals(1, allRaces.size());
    assertEquals(5.0, allRaces.get(0).getMinLapTime(), 0.001);
  }

  @Test
  public void testCommitPackage_DuplicateRaceCreateCopyImportsNewConfigWithUniqueName()
      throws Exception {
    Race existingRace =
        new Race.Builder().withEntityId("local-cfg-1").withName("GT3 Cup Round 1").build();
    raceRepository.save(existingRace);

    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    // Add duplicate to history
    RaceHistoryRecord existingHist =
        new RaceHistoryRecord(
            "existing-hist-id",
            "local-cfg-1",
            existingRace,
            null,
            null,
            null,
            600.0f,
            null,
            false,
            1700000000000L);
    historyRepository.save(existingHist);

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    assertTrue(preview.isDuplicateRace());
    assertTrue(preview.isConfigConflict());
    assertEquals("GT3 Cup Round 1 (1)", preview.getSuggestedConfigName());

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            "CREATE_NEW",
            null,
            Collections.emptyList(),
            null);

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals("AUTO_RENAME", result.getRaceConfigAction());
    assertEquals("GT3 Cup Round 1 (1)", result.getRaceConfigName());

    List<Race> allRaces = raceRepository.findAll();
    assertEquals(2, allRaces.size());
  }

  @Test
  public void testCommitPackage_SkipRaceConfig() throws Exception {
    Race existingRace =
        new Race.Builder().withEntityId("local-cfg-1").withName("GT3 Cup Round 1").build();
    raceRepository.save(existingRace);

    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            "SKIP",
            null,
            Collections.emptyList(),
            null);

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals("SKIPPED", result.getRaceConfigAction());
    // No new race config created
    assertEquals(1, raceRepository.findAll().size());
  }

  @Test
  public void testCommitPackage_CustomConfigName() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            "CREATE_NEW",
            "My Custom Championship",
            Collections.emptyList(),
            null);

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals("My Custom Championship", result.getRaceConfigName());
    assertEquals("My Custom Championship", result.getRaceName());
    Race saved = raceRepository.findByEntityId(result.getRaceConfigId());
    assertNotNull(saved);
    assertEquals("My Custom Championship", saved.getName());
    RaceHistoryRecord importedHistory =
        historyRepository.findByEntityId(result.getImportedRaceId());
    assertNotNull(importedHistory);
    assertEquals("My Custom Championship", importedHistory.getModel().getName());
  }

  @Test
  public void testCommitPackage_DuplicateOverwriteUpdatesSeason() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    Race raceModel =
        new Race.Builder().withEntityId("race-cfg-1").withName("GT3 Cup Round 1").build();
    RaceHistoryRecord existing =
        new RaceHistoryRecord(
            "existing-hist-id",
            "orig-1",
            raceModel,
            null,
            null,
            null,
            600.0f,
            null,
            false,
            1700000000000L);
    historyRepository.save(existing);

    // Create a season containing this race
    com.antigravity.repository.SqliteRepository<com.antigravity.models.Season> seasonRepo =
        new com.antigravity.repository.SqliteRepository<>(
            databaseContext, "seasons", com.antigravity.models.Season.class);
    com.antigravity.models.SeasonRaceRecord sRec =
        new com.antigravity.models.SeasonRaceRecord(
            "1",
            "GT3 Cup Round 1",
            1700000000000L,
            false,
            Collections.emptyList(),
            "existing-hist-id");
    com.antigravity.models.Season season =
        new com.antigravity.models.Season(
            "Championship 2026", 0, Collections.singletonList(sRec), "season-1", null);
    seasonRepo.save(season);

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "OVERWRITE",
            "OVERWRITE",
            "GT3 Cup Round 1 Renamed",
            Collections.emptyList(),
            "season-1");

    RacePackageResult result = importer.commitPackage(commitReq);

    assertTrue(result.isSuccess());
    assertEquals("OVERWRITTEN", result.getAction());
    assertEquals("GT3 Cup Round 1 Renamed", result.getRaceName());

    // Verify season was updated
    com.antigravity.models.Season updatedSeason = seasonRepo.findByEntityId("season-1");
    assertNotNull(updatedSeason);
    assertEquals(1, updatedSeason.getRaces().size());
    assertEquals("GT3 Cup Round 1 Renamed", updatedSeason.getRaces().get(0).getRaceName());
  }

  @Test
  public void testPreviewPackage_DuplicateDetection_WhenRenamed() throws Exception {
    byte[] zipBytes =
        createSamplePackage(
            "hist-src-123", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    // Pre-insert race history record with a completely different name but same source race ID /
    // timestamp / heats / drivers
    Race raceModel =
        new Race.Builder()
            .withEntityId("race-cfg-1")
            .withName("Renamed Custom Championship")
            .build();
    RaceHistoryRecord existing =
        new RaceHistoryRecord(
            "existing-hist-id-renamed",
            "orig-1",
            raceModel,
            null,
            null,
            null,
            120.0f,
            null,
            false,
            1700000000000L);
    existing.setSourceRaceId("hist-src-123");
    historyRepository.save(existing);

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    assertTrue(
        "Duplicate race should be detected even when renamed locally", preview.isDuplicateRace());
    assertEquals("existing-hist-id-renamed", preview.getExistingRaceId());
    assertEquals("Renamed Custom Championship", preview.getExistingRaceName());
  }

  @Test
  public void testCommitPackage_RecordsSourceRaceIdAndPackageFingerprint() throws Exception {
    byte[] zipBytes =
        createSamplePackage(
            "hist-src-456", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");

    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));
    assertFalse(preview.isDuplicateRace());

    // Commit package with custom name
    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            "CREATE_NEW",
            "Custom Super Cup",
            Collections.emptyList(),
            null);

    RacePackageResult result = importer.commitPackage(commitReq);
    assertTrue(result.isSuccess());

    // Verify history record has sourceRaceId and packageFingerprint
    RaceHistoryRecord saved = historyRepository.findByEntityId(result.getImportedRaceId());
    assertNotNull(saved);
    assertEquals("hist-src-456", saved.getSourceRaceId());
    assertNotNull(saved.getPackageFingerprint());

    // Re-importing the same package should detect duplicate even though local name is "Custom Super
    // Cup"
    RacePackagePreview secondPreview = importer.previewPackage(new ByteArrayInputStream(zipBytes));
    assertTrue("Should detect duplicate on second import", secondPreview.isDuplicateRace());
    assertEquals("Custom Super Cup", secondPreview.getExistingRaceName());
  }

  @Test
  public void testIsVersionGreater() {
    assertTrue(RacePackageImporter.isVersionGreater("2.0.0", "1.9.9"));
    assertTrue(RacePackageImporter.isVersionGreater("1.1.0", "1.0.9"));
    assertFalse(RacePackageImporter.isVersionGreater("1.0.0", "1.0.0"));
    assertFalse(RacePackageImporter.isVersionGreater("1.0.0", "2.0.0"));
  }

  @Test
  public void testPreviewAndCommitPackage_WithTeamsAndCustomRotation() throws Exception {
    // 1. Prepare export environment with team, driver, and custom rotation
    Driver dMember =
        new Driver.Builder().withEntityId("d-hamilton").withName("Lewis Hamilton").build();
    driverRepository.save(dMember);

    com.antigravity.models.Team team =
        new com.antigravity.models.Team.Builder()
            .withEntityId("t-merc")
            .withName("Mercedes AMG")
            .withDriverIds(Collections.singletonList("d-hamilton"))
            .build();
    teamRepository.save(team);

    com.antigravity.models.CustomHeat heat =
        new com.antigravity.models.CustomHeat(Arrays.asList(0, 1, 2, 3), 0, false, 0);
    com.antigravity.models.CustomRotation rot =
        new com.antigravity.models.CustomRotation(4, Collections.singletonList(heat));
    Race raceModel =
        new Race.Builder()
            .withEntityId("race-f1")
            .withName("Formula 1 GP")
            .withCustomRotations(Collections.singletonList(rot))
            .build();
    raceRepository.save(raceModel);

    RaceHistoryRecord history = new RaceHistoryRecord();
    history.setId("hist-f1-1");
    history.setModel(raceModel);
    history.setOriginalEntityId("race-f1");
    history.setTimestamp(1710000000000L);
    history.setAccumulatedRaceTime(500.0f);

    RaceParticipant rp = new RaceParticipant();
    rp.setTeam(team);
    rp.setTeamParticipant(true);
    rp.setObjectId("t_t-merc");
    Driver syntheticTeamDriver =
        new Driver.Builder().withEntityId("t_t-merc").withName("Mercedes AMG").build();
    rp.setDriver(syntheticTeamDriver);
    history.setDrivers(Collections.singletonList(rp));

    Heat heat1 = new Heat();
    DriverHeatData dhd = new DriverHeatData();
    dhd.setDriver(rp);
    dhd.setActualDriver(dMember);
    heat1.setDrivers(Collections.singletonList(dhd));
    history.setHeats(Collections.singletonList(heat1));

    historyRepository.save(history);

    // Export package
    byte[] zipBytes = exporter.exportRacePackage("hist-f1-1", false);
    assertNotNull(zipBytes);

    // 2. Clear local database to simulate fresh import
    for (Driver d : driverRepository.findAll()) {
      driverRepository.delete(d.getEntityId());
    }
    for (com.antigravity.models.Team t : teamRepository.findAll()) {
      teamRepository.delete(t.getEntityId());
    }
    for (Race r : raceRepository.findAll()) {
      raceRepository.delete(r.getEntityId());
    }
    for (RaceHistoryRecord h : historyRepository.findAll()) {
      historyRepository.delete(h.getId());
    }

    // 3. Preview package
    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));
    assertNotNull(preview);
    assertEquals("Formula 1 GP", preview.getManifest().getRaceName());

    // Verify driverMappings contains both the driver and the team
    List<DriverImportMapping> mappings = preview.getDriverMappings();
    assertNotNull(mappings);
    assertTrue(mappings.stream().anyMatch(m -> "t_t-merc".equals(m.getSourceDriverId())));
    assertTrue(mappings.stream().anyMatch(m -> "d-hamilton".equals(m.getSourceDriverId())));

    // 4. Commit package
    List<DriverResolution> resolutions = new ArrayList<>();
    resolutions.add(new DriverResolution("t_t-merc", "CREATE_NEW", null, "Mercedes AMG"));
    resolutions.add(new DriverResolution("d-hamilton", "CREATE_NEW", null, "Lewis Hamilton"));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            "CREATE_NEW",
            "Formula 1 GP",
            resolutions,
            null);

    RacePackageResult result = importer.commitPackage(commitReq);
    assertTrue(result.isSuccess());

    // 5. Verify team was created in teamRepository and member driver mapped
    List<com.antigravity.models.Team> importedTeams = teamRepository.findAll();
    assertEquals(1, importedTeams.size());
    com.antigravity.models.Team importedTeam = importedTeams.get(0);
    assertEquals("Mercedes AMG", importedTeam.getName());
    assertEquals(1, importedTeam.getDriverIds().size());

    // Verify driver was created in driverRepository
    List<Driver> importedDrivers = driverRepository.findAll();
    assertEquals(1, importedDrivers.size());
    Driver importedDriver = importedDrivers.get(0);
    assertEquals("Lewis Hamilton", importedDriver.getName());
    assertEquals(importedDriver.getEntityId(), importedTeam.getDriverIds().get(0));

    // 6. Verify custom rotation was reconciled and race configuration updated
    List<Race> importedRaces = raceRepository.findAll();
    assertEquals(1, importedRaces.size());
    Race importedRace = importedRaces.get(0);
    assertNotNull(importedRace.getCustomRotationAssetId());
    assertNotNull(importedRace.getCustomRotationAssetName());

    // 7. Verify history record has remapped team and heats
    RaceHistoryRecord savedHist = historyRepository.findByEntityId(result.getImportedRaceId());
    assertNotNull(savedHist);
    assertEquals(1, savedHist.getDrivers().size());
    RaceParticipant savedRp = savedHist.getDrivers().get(0);
    assertEquals("t_" + importedTeam.getEntityId(), savedRp.getObjectId());
    assertTrue(savedRp.isTeamParticipant());
    assertNotNull(savedRp.getTeam());
    assertEquals(importedTeam.getEntityId(), savedRp.getTeam().getEntityId());

    assertEquals(1, savedHist.getHeats().size());
    DriverHeatData savedDhd = savedHist.getHeats().get(0).getDrivers().get(0);
    assertEquals("t_" + importedTeam.getEntityId(), savedDhd.getDriver().getObjectId());
    assertEquals(importedDriver.getEntityId(), savedDhd.getActualDriver().getEntityId());
  }

  @Test
  public void testCommitPackage_TwoDriversLinkedToSameLocalDriver_IsRejected() throws Exception {
    byte[] zipBytes =
        createSamplePackage("hist-1", "GT3 Cup Round 1", 1700000000000L, "Dave Brown", "Bob Smith");
    Driver localDave =
        new Driver.Builder().withEntityId("local-dave-uuid").withName("Dave Brown").build();
    driverRepository.save(localDave);
    RacePackagePreview preview = importer.previewPackage(new ByteArrayInputStream(zipBytes));

    RacePackageCommitRequest commitReq =
        new RacePackageCommitRequest(
            preview.getTempPackageToken(),
            "CREATE_COPY",
            Arrays.asList(
                new DriverResolution("src-d1", "LINK", "local-dave-uuid", null),
                new DriverResolution("src-d2", "LINK", "local-dave-uuid", null)),
            null);

    try {
      importer.commitPackage(commitReq);
      fail("Linking two package drivers to the same local driver must be rejected");
    } catch (IllegalArgumentException expected) {
      assertTrue(expected.getMessage().contains("same local driver"));
    }
    assertTrue(historyRepository.findAll().isEmpty());
  }

  @Test
  public void testValidateUniqueLinkTargets_AllowsCreateNewAndDistinctLinks() {
    RacePackageImporter.validateUniqueLinkTargets(null);
    RacePackageImporter.validateUniqueLinkTargets(
        Arrays.asList(
            new DriverResolution("a", "LINK", "local-1", null),
            new DriverResolution("b", "LINK", "local-2", null),
            new DriverResolution("c", "CREATE_NEW", null, "New One"),
            new DriverResolution("d", "CREATE_NEW", null, "New Two")));
  }
}
