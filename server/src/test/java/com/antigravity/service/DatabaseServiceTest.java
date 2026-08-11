package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
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
    results.add(new SeasonDriverResult("d1", "Driver 1", 1, 10, 0, 10));

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
}
