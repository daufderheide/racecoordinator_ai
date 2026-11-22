package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.App;
import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.model.RacePackageManifest;
import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.Track;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.antigravity.race.RaceStatistics;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class RacePackageExporterTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private SqliteRepository<RaceHistoryRecord> historyRepository;
  private SqliteRepository<Race> raceRepository;
  private SqliteRepository<com.antigravity.models.Team> teamRepository;
  private AssetService assetService;
  private RacePackageExporter exporter;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    historyRepository =
        new SqliteRepository<>(databaseContext, "race_history", RaceHistoryRecord.class);
    raceRepository = new SqliteRepository<>(databaseContext, "races", Race.class);
    teamRepository =
        new SqliteRepository<>(databaseContext, "teams", com.antigravity.models.Team.class);

    File assetsDir = new File(new File(databaseContext.getDataRoot(), "test_db"), "assets");
    assetService = new AssetService(databaseContext, assetsDir.getAbsolutePath());

    exporter =
        new RacePackageExporter(
            databaseContext, assetService, driverRepository, raceRepository, teamRepository);
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
  public void testExportRacePackageSuccess() throws Exception {
    // 1. Create drivers
    Driver d1 =
        new Driver.Builder()
            .withEntityId("d1")
            .withName("Alice Speed")
            .withNickname("Rocket")
            .build();
    Driver d2 =
        new Driver.Builder()
            .withEntityId("d2")
            .withName("Bob Drift")
            .withNickname("Sideways")
            .build();
    driverRepository.save(d1);
    driverRepository.save(d2);

    // 2. Create history record
    Race raceModel =
        new Race.Builder().withEntityId("race-cfg-1").withName("Championship Round 1").build();

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

    List<Heat> heats = new ArrayList<>();
    Heat h1 = new Heat();
    h1.setHeatNumber(1);
    heats.add(h1);

    RaceStatistics stats = new RaceStatistics();
    stats.setStartTime("2026-11-19T10:00:00Z");
    stats.setEndTime("2026-11-19T10:10:00Z");

    RaceHistoryRecord record =
        new RaceHistoryRecord(
            "hist-1",
            "orig-1",
            raceModel,
            track,
            Arrays.asList(rp1, rp2),
            heats,
            600.0f,
            stats,
            false,
            1700000000000L);

    SeasonDriverResult res1 = new SeasonDriverResult("d1", "Alice Speed", 1, 25.0, 0.0, 25.0);
    SeasonDriverResult res2 = new SeasonDriverResult("d2", "Bob Drift", 2, 18.0, 0.0, 18.0);
    record.setDriverResults(Arrays.asList(res1, res2));

    historyRepository.save(record);

    // 3. Save raw race records
    RecordData recordData =
        RecordData.newBuilder()
            .setCurrent(
                com.antigravity.proto.CurrentRecords.newBuilder()
                    .setFastestLap(
                        RecordEntry.newBuilder()
                            .setValue(5.123)
                            .setHolderName("Alice Speed")
                            .build())
                    .build())
            .build();
    DatabaseService.getInstance()
        .saveRaceRecords(databaseContext, "hist-1", recordData.toByteArray(), false);

    // 4. Save race save data
    RaceSaveData saveData = new RaceSaveData();
    saveData.setSaveName("hist-1");
    saveData.setModel(raceModel);
    saveData.setTrack(track);
    DatabaseService.getInstance().saveManualRace(databaseContext, saveData);

    // 5. Export package
    byte[] packageBytes = exporter.exportRacePackage("hist-1", false);
    assertNotNull(packageBytes);
    assertTrue(packageBytes.length > 0);

    // 6. Verify contents of ZIP
    boolean foundManifest = false;
    boolean foundHistory = false;
    boolean foundRecords = false;
    boolean foundSave = false;
    boolean foundDrivers = false;

    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(packageBytes))) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        String name = entry.getName();
        byte[] entryBytes = readEntryBytes(zis);
        if ("manifest.json".equals(name)) {
          foundManifest = true;
          RacePackageManifest manifest =
              objectMapper.readValue(entryBytes, RacePackageManifest.class);
          assertEquals("Championship Round 1", manifest.getRaceName());
          assertEquals(2, manifest.getDriverCount());
          assertEquals(1, manifest.getHeatCount());
          assertEquals(App.SERVER_VERSION, manifest.getCreatedByAppVersion());
          assertNotNull(manifest.getFingerprint());
        } else if ("race_history.json".equals(name)) {
          foundHistory = true;
          RaceHistoryRecord rec = objectMapper.readValue(entryBytes, RaceHistoryRecord.class);
          assertEquals("hist-1", rec.getId());
          assertEquals(2, rec.getDrivers().size());
          assertEquals(2, rec.getDriverResults().size());
        } else if ("race_records.pb".equals(name)) {
          foundRecords = true;
        } else if ("saved_race.json".equals(name)) {
          foundSave = true;
        } else if ("drivers.json".equals(name)) {
          foundDrivers = true;
        }
      }
    }

    assertTrue("manifest.json must be present in package", foundManifest);
    assertTrue("race_history.json must be present in package", foundHistory);
    assertTrue("race_records.pb must be present in package", foundRecords);
    assertTrue("saved_race.json must be present in package", foundSave);
    assertTrue("drivers.json must be present in package", foundDrivers);
  }

  @Test
  public void testExportCollectsDriversFromHeatsAndResults() throws Exception {
    Driver d1 = new Driver.Builder().withEntityId("d1").withName("Driver 1").build();
    Driver d2 = new Driver.Builder().withEntityId("d2").withName("Driver 2").build();
    Driver d3 = new Driver.Builder().withEntityId("d3").withName("Driver 3").build();
    driverRepository.save(d1);
    driverRepository.save(d2);
    driverRepository.save(d3);

    Race raceModel =
        new Race.Builder().withEntityId("r-multi").withName("Multi Driver Race").build();
    Track track = new Track.Builder().entityId("t-1").name("Track").build();

    // d1 in participants
    RaceParticipant p1 = new RaceParticipant(d1);

    // d2 in heat
    com.antigravity.race.DriverHeatData dhd2 =
        new com.antigravity.race.DriverHeatData(new RaceParticipant(d2));
    Heat heat = new Heat();
    heat.setHeatNumber(1);
    heat.setDrivers(Arrays.asList(dhd2));

    // d3 in driver results
    SeasonDriverResult sdr3 = new SeasonDriverResult("d3", "Driver 3", 1, 25.0, 10.0, 35.0);

    RaceHistoryRecord history =
        new RaceHistoryRecord(
            "hist-multi",
            "orig-1",
            raceModel,
            track,
            Arrays.asList(p1),
            Arrays.asList(heat),
            120.0f,
            new RaceStatistics(),
            false,
            1700000000L);
    history.setDriverResults(Arrays.asList(sdr3));
    historyRepository.save(history);

    byte[] zipBytes = exporter.exportRacePackage("hist-multi", false);
    assertNotNull(zipBytes);

    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        if ("manifest.json".equals(entry.getName())) {
          RacePackageManifest manifest =
              objectMapper.readValue(readEntryBytes(zis), RacePackageManifest.class);
          assertEquals(3, manifest.getDriverCount());
        }
      }
    }
  }

  @Test(expected = IllegalArgumentException.class)
  public void testExportNonExistentRaceThrows() throws Exception {
    exporter.exportRacePackage("non-existent-id", false);
  }

  @Test(expected = IllegalArgumentException.class)
  public void testExportNullIdThrows() throws Exception {
    exporter.exportRacePackage(null, false);
  }

  @Test
  public void testCalculatePackageFingerprintConsistency() {
    List<String> list1 = Arrays.asList("Alice", "Bob", "Charlie");
    List<String> list2 = Arrays.asList("Charlie", "Alice", "Bob");

    String fp1 = RacePackageExporter.calculatePackageFingerprint("Night Race", 1000L, list1);
    String fp2 = RacePackageExporter.calculatePackageFingerprint("night race", 1000L, list2);

    assertNotNull(fp1);
    assertEquals("Fingerprint must be case-insensitive and driver order invariant", fp1, fp2);
  }

  @Test
  public void testCalculateInvariantPackageFingerprint() {
    String fp1 = RacePackageExporter.calculatePackageFingerprint(1700000000000L, 8, 4, 120.45f);
    String fp2 = RacePackageExporter.calculatePackageFingerprint(1700000000000L, 8, 4, 120.48f);
    String fpDiff = RacePackageExporter.calculatePackageFingerprint(1700000000000L, 10, 4, 120.5f);

    assertNotNull(fp1);
    // Rounded to 1 decimal place: 120.5 == 120.5
    assertEquals(
        "Float precision within 0.1s should yield identical invariant fingerprint", fp1, fp2);
    assertNotEquals("Different heat count should yield different fingerprint", fp1, fpDiff);
  }

  @Test
  public void testExportRacePackage_WithTeamAndCustomRotation() throws Exception {
    // 1. Create team and member driver
    Driver member = new Driver.Builder().withEntityId("d-member").withName("Member Driver").build();
    driverRepository.save(member);

    com.antigravity.models.Team team =
        new com.antigravity.models.Team.Builder()
            .withEntityId("team-alpha")
            .withName("Alpha Team")
            .withDriverIds(Collections.singletonList("d-member"))
            .build();
    teamRepository.save(team);

    // 2. Custom rotation
    com.antigravity.models.CustomHeat heat =
        new com.antigravity.models.CustomHeat(Arrays.asList(0, 1, 2, 3), 0, false, 0);
    com.antigravity.models.CustomRotation rot =
        new com.antigravity.models.CustomRotation(4, Collections.singletonList(heat));
    Race raceModel =
        new Race.Builder()
            .withEntityId("race-cfg-team")
            .withName("Team Challenge")
            .withCustomRotations(Collections.singletonList(rot))
            .build();
    raceRepository.save(raceModel);

    // 3. History record with team participant
    RaceHistoryRecord history = new RaceHistoryRecord();
    history.setId("hist-team-1");
    history.setModel(raceModel);
    history.setOriginalEntityId("race-cfg-team");
    history.setTimestamp(1700000000000L);
    history.setAccumulatedRaceTime(300.0f);

    RaceParticipant rp = new RaceParticipant();
    rp.setTeam(team);
    rp.setTeamParticipant(true);
    rp.setObjectId("t_team-alpha");
    history.setDrivers(Collections.singletonList(rp));
    historyRepository.save(history);

    // 4. Export package
    byte[] zipBytes = exporter.exportRacePackage("hist-team-1", false);
    assertNotNull(zipBytes);
    assertTrue(zipBytes.length > 0);

    // 5. Inspect zip contents
    boolean foundTeams = false;
    boolean foundCustomRotation = false;
    boolean foundDrivers = false;

    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        if ("teams.json".equalsIgnoreCase(entry.getName())) {
          foundTeams = true;
          byte[] b = readEntryBytes(zis);
          assertTrue(new String(b).contains("Alpha Team"));
        } else if ("custom_rotation.json".equalsIgnoreCase(entry.getName())) {
          foundCustomRotation = true;
          byte[] b = readEntryBytes(zis);
          assertTrue(new String(b).contains("Team Challenge Rotation"));
        } else if ("drivers.json".equalsIgnoreCase(entry.getName())) {
          foundDrivers = true;
          byte[] b = readEntryBytes(zis);
          assertTrue(new String(b).contains("Member Driver"));
        }
        zis.closeEntry();
      }
    }

    assertTrue("teams.json must be present in package zip", foundTeams);
    assertTrue("custom_rotation.json must be present in package zip", foundCustomRotation);
    assertTrue("drivers.json must contain team member drivers", foundDrivers);
  }

  private byte[] readEntryBytes(ZipInputStream zis) throws IOException {
    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
    byte[] buf = new byte[8192];
    int n;
    while ((n = zis.read(buf)) != -1) {
      baos.write(buf, 0, n);
    }
    return baos.toByteArray();
  }
}
