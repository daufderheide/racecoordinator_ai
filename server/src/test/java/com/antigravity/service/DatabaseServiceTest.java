package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.models.Driver;
import com.antigravity.models.Event;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.race.EventExecutionManager;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.repository.SqliteRepository;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DatabaseServiceTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private DatabaseService dbService;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    dbService = DatabaseService.getInstance();
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
  public void testSaveAndGetRaceHistory() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withName("Test Race").withEntityId("ID1").build();
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(new RaceParticipant(new Driver("Dave", "DB")));

    Race runtimeRace =
        new Race.Builder()
            .model(model)
            .drivers(drivers)
            .track(dbService.getFactoryTrack())
            .accumulatedRaceTime(12.5f)
            .isDemoMode(false)
            .build();

    runtimeRace.getStatistics().setDurationMillis(5000);

    dbService.saveRaceHistory(databaseContext, runtimeRace);

    List<RaceHistoryRecord> history = dbService.getRaceHistory(databaseContext, false);
    assertNotNull(history);
    assertTrue(history.size() > 0);
    assertEquals("ID1", history.get(0).getOriginalEntityId());
  }

  @Test
  public void testRaceHistoryRecord_EventFieldsGettersAndSetters() {
    RaceHistoryRecord record = new RaceHistoryRecord();
    record.setEventId("event_123");
    record.setEventName("Summer Championship");
    record.setEventRace(true);
    record.setEventSummary(true);

    assertEquals("event_123", record.getEventId());
    assertEquals("Summer Championship", record.getEventName());
    assertTrue(record.isEventRace());
    assertTrue(record.isEventSummary());
  }

  @Test
  public void testSaveRaceHistory_TagsEventRaceWhenEventIsActive() throws Exception {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Event Heat 1")
            .withEntityId("EH1")
            .build();
    Race runtimeRace = new Race.Builder().model(model).track(dbService.getFactoryTrack()).build();

    EventExecutionManager manager = EventExecutionManager.getInstance();
    manager.cancelEvent();

    Event.EventRaceItem item1 = new Event.EventRaceItem("EH1", 0);
    Event event =
        new Event("Summer Event", "Description", 0.0, Arrays.asList(item1), "event_123", null);

    java.lang.reflect.Field activeEventField =
        EventExecutionManager.class.getDeclaredField("activeEvent");
    activeEventField.setAccessible(true);
    activeEventField.set(manager, event);

    java.lang.reflect.Field currentIndexField =
        EventExecutionManager.class.getDeclaredField("currentRaceIndex");
    currentIndexField.setAccessible(true);
    currentIndexField.set(manager, 0);

    dbService.saveRaceHistory(databaseContext, runtimeRace);

    List<RaceHistoryRecord> history = dbService.getRaceHistory(databaseContext, false);
    assertNotNull(history);
    assertFalse(history.isEmpty());
    RaceHistoryRecord record = history.get(0);
    assertTrue(record.isEventRace());
    assertEquals("event_123", record.getEventId());
    assertEquals("Summer Event", record.getEventName());

    manager.cancelEvent();
  }

  @Test
  public void testUpdateAndGetGlobalStatistics() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race 2")
            .withEntityId("ID2")
            .build();
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(new RaceParticipant(new Driver("Alice", "AL")));

    Race runtimeRace =
        new Race.Builder()
            .model(model)
            .drivers(drivers)
            .track(dbService.getFactoryTrack())
            .accumulatedRaceTime(20.0f)
            .build();

    dbService.updateGlobalStatistics(databaseContext, runtimeRace);

    GlobalStatistics stats =
        dbService.getGlobalStatistics(databaseContext, "ID2", RaceScope.PRODUCTION);
    assertNotNull(stats);
  }

  @Test
  public void testCommitRaceToSeason_UsesExplicitStartTimestamp() {
    databaseContext.ensureTable("seasons");
    SqliteRepository<Season> seasonRepo =
        new SqliteRepository<>(databaseContext, "seasons", Season.class);
    Season season = new Season("2026 Season", 0, new ArrayList<>(), "S1", null);
    seasonRepo.save(season);

    long expectedStartTime = 1700000000000L;
    List<SeasonDriverResult> results = new ArrayList<>();
    results.add(new SeasonDriverResult("d1", "Driver 1", 1, 10.0, 0.0, 10.0));

    dbService.commitRaceToSeason(
        databaseContext, "S1", "GP Race 1", expectedStartTime, false, results);

    Season updatedSeason = dbService.getSeason(databaseContext, "S1");
    assertNotNull(updatedSeason);
    assertEquals(1, updatedSeason.getRaces().size());
    assertEquals(expectedStartTime, updatedSeason.getRaces().get(0).getTimestamp());
  }

  @Test
  public void testResetToFactory_SetsDriverAudioConfigs() {
    dbService.resetToFactory(databaseContext);
    List<Driver> drivers =
        new SqliteRepository<>(databaseContext, "drivers", Driver.class).findAll();
    assertNotNull(drivers);
    assertFalse(drivers.isEmpty());

    for (Driver driver : drivers) {
      assertNotNull("Driver lapAudio should not be null", driver.getLapAudio());
      assertNotNull("Driver lapAudio url should not be null", driver.getLapAudio().getUrl());
      assertNotNull("Driver bestLapAudio should not be null", driver.getBestLapAudio());
      assertNotNull(
          "Driver bestLapAudio url should not be null", driver.getBestLapAudio().getUrl());
      assertNotNull("Driver penaltyAudio should not be null", driver.getPenaltyAudio());
      assertNotNull(
          "Driver penaltyAudio url should not be null", driver.getPenaltyAudio().getUrl());
    }
  }

  @Test
  public void testGetDriverTrackStatsBypassesCorruptedDuplicates() {
    DatabaseContext context = databaseContext;
    context.ensureTable("demo_driver_track_stats");

    // Create a "corrupted" old duplicate record with a null internal ID.
    // When saved, SqliteRepository will generate a random UUID as its entity_id.
    com.antigravity.models.DriverTrackStats corruptedStats =
        new com.antigravity.models.DriverTrackStats();
    corruptedStats.setId(null);
    corruptedStats.setDriverId("driver1");
    corruptedStats.setTrackId("track1");
    corruptedStats.setTotalLaps(0);

    SqliteRepository<com.antigravity.models.DriverTrackStats> repo =
        new SqliteRepository<>(
            context, "demo_driver_track_stats", com.antigravity.models.DriverTrackStats.class);
    repo.save(corruptedStats);

    // Create the "correct" new record that uses driverId_trackId as its ID.
    com.antigravity.models.DriverTrackStats correctStats =
        new com.antigravity.models.DriverTrackStats();
    correctStats.setId("driver1_track1");
    correctStats.setDriverId("driver1");
    correctStats.setTrackId("track1");
    correctStats.setTotalLaps(42);
    repo.save(correctStats);

    // Now call DatabaseService to fetch it.
    com.antigravity.models.DriverTrackStats retrieved =
        dbService.getDriverTrackStats(context, "driver1", "track1", true);
    assertNotNull(retrieved);
    assertEquals("driver1_track1", retrieved.getId());
    assertEquals(42, retrieved.getTotalLaps());
  }

  @Test
  public void testResetRaceData_PurgesAllAssociatedTables() {
    DatabaseContext context = databaseContext;
    String raceId1 = "RACE_TARGET_1";
    String raceId2 = "RACE_OTHER_2";

    // 1. Race History
    com.antigravity.models.Race model1 =
        new com.antigravity.models.Race.Builder()
            .withName("Target Race")
            .withEntityId(raceId1)
            .build();
    com.antigravity.models.Race model2 =
        new com.antigravity.models.Race.Builder()
            .withName("Other Race")
            .withEntityId(raceId2)
            .build();

    Race r1 = new Race.Builder().model(model1).track(dbService.getFactoryTrack()).build();
    Race r2 = new Race.Builder().model(model2).track(dbService.getFactoryTrack()).build();

    dbService.saveRaceHistory(context, r1);
    dbService.saveRaceHistory(context, r2);

    // 2. Race Records
    dbService.saveRaceRecords(context, r1);
    dbService.saveRaceRecords(context, r2);

    // 3. Global Statistics
    dbService.updateGlobalStatistics(context, r1);
    dbService.updateGlobalStatistics(context, r2);

    // 4. Saved Races
    com.antigravity.race.RaceSaveData save1 = new com.antigravity.race.RaceSaveData();
    save1.setId("save_1");
    save1.setSaveName("save_1");
    save1.setModel(model1);
    dbService.saveManualRace(context, save1);

    com.antigravity.race.RaceSaveData save2 = new com.antigravity.race.RaceSaveData();
    save2.setId("save_2");
    save2.setSaveName("save_2");
    save2.setModel(model2);
    dbService.saveManualRace(context, save2);

    // 5. Driver Statistics
    com.antigravity.models.DriverStatistics dStats1 = new com.antigravity.models.DriverStatistics();
    dStats1.setDriverId("d1");
    dStats1.setRaceId(raceId1);
    dStats1.setBestLapTime(5.123);
    new SqliteRepository<>(
            context, "driver_statistics", com.antigravity.models.DriverStatistics.class)
        .save(dStats1);

    com.antigravity.models.DriverStatistics dStats2 = new com.antigravity.models.DriverStatistics();
    dStats2.setDriverId("d1");
    dStats2.setRaceId(raceId2);
    dStats2.setBestLapTime(6.456);
    new SqliteRepository<>(
            context, "driver_statistics", com.antigravity.models.DriverStatistics.class)
        .save(dStats2);

    // 6. Predictions & Evaluations
    com.antigravity.models.RacePredictionRecord pred1 =
        new com.antigravity.models.RacePredictionRecord();
    pred1.setRaceId(raceId1);
    pred1.setId(raceId1);
    dbService.saveRacePredictionRecord(context, pred1, false);

    com.antigravity.models.PredictionEvaluationRecord eval1 =
        new com.antigravity.models.PredictionEvaluationRecord();
    eval1.setRaceId(raceId1);
    eval1.setId(raceId1);
    dbService.savePredictionEvaluationRecord(context, eval1, false);

    // Verify presence before reset
    assertNotNull(dbService.getRaceRecords(context, raceId1, false));
    assertEquals(2, dbService.getRaceHistory(context, false).size());
    assertEquals(2, dbService.getSavedRaces(context, false).size());

    // Execute resetRaceData for race 1
    dbService.resetRaceData(context, raceId1);

    // Verify race 1 data is wiped
    assertEquals(
        0.0,
        dbService.getGlobalStatistics(context, raceId1, RaceScope.PRODUCTION).getTotalLaps(),
        0.001);
    assertEquals(
        0, dbService.getGlobalStatistics(context, raceId1, RaceScope.PRODUCTION).getTotalRaces());
    assertTrue(
        dbService.getRaceRecords(context, raceId1, false) == null
            || dbService
                    .getRaceRecords(context, raceId1, false)
                    .getOverall()
                    .getFastestLap()
                    .getValue()
                == 0.0);

    List<RaceHistoryRecord> remainingHistory = dbService.getRaceHistory(context, false);
    assertEquals(1, remainingHistory.size());
    assertEquals(raceId2, remainingHistory.get(0).getOriginalEntityId());

    List<com.antigravity.race.RaceSaveData> remainingSaves =
        dbService.getSavedRaces(context, false);
    assertEquals(1, remainingSaves.size());
    assertEquals("save_2", remainingSaves.get(0).getSaveName());

    com.antigravity.models.DriverStatistics remainingDStats1 =
        dbService.getDriverStatistics(context, "d1", raceId1, RaceScope.PRODUCTION);
    assertEquals(0.0, remainingDStats1.getBestLapTime(), 0.001);

    com.antigravity.models.DriverStatistics remainingDStats2 =
        dbService.getDriverStatistics(context, "d1", raceId2, RaceScope.PRODUCTION);
    assertEquals(6.456, remainingDStats2.getBestLapTime(), 0.001);

    assertTrue(dbService.getRacePredictionRecord(context, raceId1, false) == null);
    assertTrue(dbService.getPredictionEvaluationRecord(context, raceId1, false) == null);
  }

  @Test
  public void testGetSavedRaces_IgnoresUnknownProperties() throws Exception {
    databaseContext.ensureTable("saved_races");
    String rawJsonWithUnknownProperty =
        "{\"_id\":\"test-123\",\"saveName\":\"test_race.json\",\"unknownPropertyWhichShouldBeIgnored\":\"bloat\"}";
    String sql = "INSERT INTO saved_races (entity_id, sequence_id, json_data) VALUES (?, ?, ?)";
    try (java.sql.PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, "test-123");
      pstmt.setString(2, "test_race.json");
      pstmt.setString(3, rawJsonWithUnknownProperty);
      pstmt.executeUpdate();
    }
    List<com.antigravity.race.RaceSaveData> saves =
        dbService.getSavedRaces(databaseContext, RaceScope.PRODUCTION);
    assertNotNull(saves);
    assertEquals(1, saves.size());
    assertEquals("test_race.json", saves.get(0).getSaveName());
    assertEquals("test-123", saves.get(0).getId());
    assertFalse(saves.get(0).isCorrupt());
  }

  @Test
  public void testGetSavedRaces_CorruptJson() throws Exception {
    databaseContext.ensureTable("saved_races");
    String rawJsonCorrupt = "{ \"malformed\": true, \"_id\": [ { "; // Invalid JSON
    String sql = "INSERT INTO saved_races (entity_id, sequence_id, json_data) VALUES (?, ?, ?)";
    try (java.sql.PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, "test-corrupt-123");
      pstmt.setString(2, "corrupted_race.json");
      pstmt.setString(3, rawJsonCorrupt);
      pstmt.executeUpdate();
    }
    List<com.antigravity.race.RaceSaveData> saves =
        dbService.getSavedRaces(databaseContext, RaceScope.PRODUCTION);
    assertNotNull(saves);
    assertEquals(1, saves.size());
    assertEquals("corrupted_race.json", saves.get(0).getSaveName());
    assertTrue(saves.get(0).isCorrupt());
  }

  @Test
  public void testUpdateGlobalStatisticsInDemoMode() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race Demo")
            .withEntityId("DEMO1")
            .build();
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(new RaceParticipant(new Driver("Dave", "DB")));

    com.antigravity.race.Race runtimeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(drivers)
            .track(dbService.getFactoryTrack())
            .isDemoMode(true)
            .build();

    dbService.updateGlobalStatistics(databaseContext, runtimeRace);
    assertNotNull(databaseContext);
  }

  @Test
  public void testUpsertAutoSaveInDemoMode() {
    com.antigravity.race.RaceSaveData data = new com.antigravity.race.RaceSaveData();
    data.setDemoMode(true);
    data.setSaveName("autosave_DEMO1.json");

    dbService.upsertAutoSave(databaseContext, data);
    assertNotNull(databaseContext);
  }

  @Test
  public void testSaveDriverStatistics() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withEntityId("RACE123")
            .build();

    List<com.antigravity.models.Lane> lanes =
        Arrays.asList(
            new com.antigravity.models.Lane("#ff0000", "#ffffff", 100),
            new com.antigravity.models.Lane("#00ff00", "#000000", 100));
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder().name("2-Lane Track").lanes(lanes).build();

    Driver d1 = new Driver("Driver 1", "d1", "d1", null);
    RaceParticipant p1 = new RaceParticipant(d1);
    List<RaceParticipant> participants = Arrays.asList(p1);

    com.antigravity.race.DriverHeatData hd1_p1 = new com.antigravity.race.DriverHeatData(p1);
    hd1_p1.addLap(5.5, false, true);
    hd1_p1.addLap(6.0, false, true);

    com.antigravity.race.Heat heat1 =
        new com.antigravity.race.Heat(
            1, Arrays.asList(hd1_p1), new com.antigravity.models.HeatScoring(), false);
    heat1.setStarted(true);

    Race runtimeRace =
        new Race.Builder()
            .model(model)
            .drivers(participants)
            .heats(Arrays.asList(heat1))
            .track(track)
            .isDemoMode(true)
            .build();

    dbService.saveDriverStatistics(databaseContext, runtimeRace);

    com.antigravity.models.DriverStatistics stats =
        dbService.getDriverStatistics(databaseContext, "d1", "RACE123", RaceScope.PRODUCTION);
    assertNotNull(stats);
  }

  @Test
  public void testGetDriverStatisticsStrictScopeIsolation() throws Exception {
    String rootDir = tempFolder.newFolder("db_root_isolation").getAbsolutePath() + File.separator;
    DatabaseContext dc = new DatabaseContext("iso_db", null, rootDir);
    com.antigravity.models.DriverStatistics stats =
        dbService.getDriverStatistics(dc, "d1", "RACE123", RaceScope.DEMO);
    assertEquals(0.0, stats.getBestLapTime(), 0.001);
  }

  @Test
  public void testRenameSavedRace_SuccessAndNotFound() {
    com.antigravity.race.RaceSaveData save = new com.antigravity.race.RaceSaveData();
    save.setId("orig_save.json");
    save.setSaveName("orig_save.json");
    dbService.saveManualRace(databaseContext, save);

    assertNotNull(dbService.getSavedRace(databaseContext, "orig_save.json", false));

    boolean renamed =
        dbService.renameSavedRace(databaseContext, "orig_save.json", "renamed_save", false);
    assertTrue(renamed);

    assertNull(dbService.getSavedRace(databaseContext, "orig_save.json", false));
    com.antigravity.race.RaceSaveData updated =
        dbService.getSavedRace(databaseContext, "renamed_save.json", false);
    assertNotNull(updated);
    assertEquals("renamed_save.json", updated.getSaveName());

    boolean notFound =
        dbService.renameSavedRace(databaseContext, "nonexistent.json", "anything", false);
    assertFalse(notFound);
  }
}
