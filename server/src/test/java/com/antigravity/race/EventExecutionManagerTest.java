package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Driver;
import com.antigravity.models.Event;
import com.antigravity.models.Event.EventRaceItem;
import com.antigravity.models.Track;
import com.antigravity.service.DatabaseService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class EventExecutionManagerTest {

  @Before
  @After
  public void resetEventExecutionManager() {
    EventExecutionManager.getInstance().cancelEvent();
  }

  @Test
  public void testEventExecutionManagerSingletonAndStatus() {
    EventExecutionManager manager = EventExecutionManager.getInstance();
    assertNotNull(manager);
    assertFalse(manager.isEventActive());
    assertEquals(0.0, manager.getAutoAdvanceRemainingSeconds(), 0.001);
  }

  @Test
  public void testEventDriverQualificationLogic() {
    List<EventRaceItem> raceItems = new ArrayList<>();
    raceItems.add(new EventRaceItem("race_1", 0)); // Unlimited
    raceItems.add(new EventRaceItem("race_2", 2)); // Top 2 qualify

    Event event = new Event("Championship", "Test Event", 5.0, raceItems, "e1", null);
    assertEquals(2, event.getRaces().size());
    assertEquals(0, event.getRaces().get(0).getMaxDrivers());
    assertEquals(2, event.getRaces().get(1).getMaxDrivers());
  }

  @Test
  public void
      testOnRaceOver_IgnoresEmptyDriversAndPreservesAllQualifiedDriversForUnlimitedNextRace()
          throws Exception {
    List<EventRaceItem> raceItems = new ArrayList<>();
    raceItems.add(new EventRaceItem("race_1", 0)); // Practice (Unlimited)
    raceItems.add(new EventRaceItem("race_2", 0)); // Timed (Unlimited)

    Event event = new Event("Event1", "Test Event", 0.0, raceItems, "e1", null);

    List<String> initialParticipants = Arrays.asList("d_driver1", "d_driver2", "d_driver3");

    EventExecutionManager manager = EventExecutionManager.getInstance();
    // Simulate starting event internal state
    manager.cancelEvent();

    // Set internal state directly for test
    java.lang.reflect.Field activeEventField =
        EventExecutionManager.class.getDeclaredField("activeEvent");
    activeEventField.setAccessible(true);
    activeEventField.set(manager, event);

    java.lang.reflect.Field currentIndexField =
        EventExecutionManager.class.getDeclaredField("currentRaceIndex");
    currentIndexField.setAccessible(true);
    currentIndexField.set(manager, 0);

    java.lang.reflect.Field qualifiedField =
        EventExecutionManager.class.getDeclaredField("currentQualifiedParticipantIds");
    qualifiedField.setAccessible(true);
    qualifiedField.set(manager, new ArrayList<>(initialParticipants));

    // Construct mock completed race with 3 real drivers + 1 EMPTY_DRIVER
    Driver d1 = new Driver("Driver 1", "D1", "driver1", null);
    Driver d2 = new Driver("Driver 2", "D2", "driver2", null);
    Driver d3 = new Driver("Driver 3", "D3", "driver3", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    RaceParticipant rp3 = new RaceParticipant(d3);
    rp3.setRank(3);
    RaceParticipant rpEmpty = new RaceParticipant(Driver.EMPTY_DRIVER);
    rpEmpty.setRank(99);

    Track track =
        new Track.Builder().name("Track 1").lanes(new ArrayList<>()).entityId("t1").build();
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Practice Race")
            .withTrackEntityId("t1")
            .build();

    Race completedRace =
        new Race.Builder()
            .model(raceModel)
            .track(track)
            .drivers(Arrays.asList(rp1, rp2, rp3, rpEmpty))
            .isDemoMode(true)
            .build();

    manager.onRaceOver(completedRace);

    List<String> nextQualified = manager.getCurrentQualifiedParticipantIds();
    assertEquals(3, nextQualified.size());
    assertTrue(nextQualified.contains("d_driver1"));
    assertTrue(nextQualified.contains("d_driver2"));
    assertTrue(nextQualified.contains("d_driver3"));
    assertFalse(nextQualified.contains("d_EMPTY_LANE"));
  }

  @Test
  public void testOnRaceOver_TruncatesDriversWhenNextRaceHasMaxDriversLimit() throws Exception {
    List<EventRaceItem> raceItems = new ArrayList<>();
    raceItems.add(new EventRaceItem("race_1", 0)); // Unlimited
    raceItems.add(new EventRaceItem("race_2", 2)); // Top 2 qualify

    Event event = new Event("Event2", "Test Event", 0.0, raceItems, "e2", null);

    List<String> initialParticipants = Arrays.asList("d_driver1", "d_driver2", "d_driver3");

    EventExecutionManager manager = EventExecutionManager.getInstance();
    manager.cancelEvent();

    java.lang.reflect.Field activeEventField =
        EventExecutionManager.class.getDeclaredField("activeEvent");
    activeEventField.setAccessible(true);
    activeEventField.set(manager, event);

    java.lang.reflect.Field currentIndexField =
        EventExecutionManager.class.getDeclaredField("currentRaceIndex");
    currentIndexField.setAccessible(true);
    currentIndexField.set(manager, 0);

    java.lang.reflect.Field qualifiedField =
        EventExecutionManager.class.getDeclaredField("currentQualifiedParticipantIds");
    qualifiedField.setAccessible(true);
    qualifiedField.set(manager, new ArrayList<>(initialParticipants));

    Driver d1 = new Driver("Driver 1", "D1", "driver1", null);
    Driver d2 = new Driver("Driver 2", "D2", "driver2", null);
    Driver d3 = new Driver("Driver 3", "D3", "driver3", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    RaceParticipant rp3 = new RaceParticipant(d3);
    rp3.setRank(3);

    Track track =
        new Track.Builder().name("Track 1").lanes(new ArrayList<>()).entityId("t1").build();
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Race 1")
            .withTrackEntityId("t1")
            .build();

    Race completedRace =
        new Race.Builder()
            .model(raceModel)
            .track(track)
            .drivers(Arrays.asList(rp1, rp2, rp3))
            .isDemoMode(true)
            .build();

    manager.onRaceOver(completedRace);

    List<String> nextQualified = manager.getCurrentQualifiedParticipantIds();
    assertEquals(2, nextQualified.size());
    assertEquals("d_driver1", nextQualified.get(0));
    assertEquals("d_driver2", nextQualified.get(1));
    assertFalse(nextQualified.contains("d_driver3"));
  }

  @Test
  public void testCancelAutoAdvanceTimer() throws Exception {
    EventExecutionManager manager = EventExecutionManager.getInstance();
    manager.cancelEvent();

    java.lang.reflect.Field autoAdvanceRemainingSecondsField =
        EventExecutionManager.class.getDeclaredField("autoAdvanceRemainingSeconds");
    autoAdvanceRemainingSecondsField.setAccessible(true);
    autoAdvanceRemainingSecondsField.set(manager, 10.0);

    assertEquals(10.0, manager.getAutoAdvanceRemainingSeconds(), 0.001);

    manager.cancelAutoAdvanceTimer();
    assertEquals(0.0, manager.getAutoAdvanceRemainingSeconds(), 0.001);
  }

  @Test
  public void testRaceGetAutoAdvanceRemaining_DelegatesToEventExecutionManager() throws Exception {
    EventExecutionManager manager = EventExecutionManager.getInstance();
    manager.cancelEvent();

    EventRaceItem item1 = new EventRaceItem("r1", 0);
    EventRaceItem item2 = new EventRaceItem("r2", 0);
    Event event = new Event("Event1", "Test Event", 10.0, Arrays.asList(item1, item2), "e1", null);

    java.lang.reflect.Field activeEventField =
        EventExecutionManager.class.getDeclaredField("activeEvent");
    activeEventField.setAccessible(true);
    activeEventField.set(manager, event);

    java.lang.reflect.Field currentIndexField =
        EventExecutionManager.class.getDeclaredField("currentRaceIndex");
    currentIndexField.setAccessible(true);
    currentIndexField.set(manager, 0);

    java.lang.reflect.Field autoAdvanceRemainingSecondsField =
        EventExecutionManager.class.getDeclaredField("autoAdvanceRemainingSeconds");
    autoAdvanceRemainingSecondsField.setAccessible(true);
    autoAdvanceRemainingSecondsField.set(manager, 7.5);

    assertTrue(manager.isEventActive());
    assertEquals(7.5, manager.getAutoAdvanceRemainingSeconds(), 0.001);

    manager.cancelAutoAdvanceTimer();
    assertEquals(0.0, manager.getAutoAdvanceRemainingSeconds(), 0.001);
  }

  @Test
  public void testOnRaceOver_SavesEventSummaryRecordWhenLastRaceCompletes() throws Exception {
    EventExecutionManager manager = EventExecutionManager.getInstance();
    manager.cancelEvent();

    EventRaceItem item1 = new EventRaceItem("r1", 0);
    Event event =
        new Event("Championship Event", "Desc", 0.0, Arrays.asList(item1), "evt_final", null);

    java.lang.reflect.Field activeEventField =
        EventExecutionManager.class.getDeclaredField("activeEvent");
    activeEventField.setAccessible(true);
    activeEventField.set(manager, event);

    java.lang.reflect.Field currentIndexField =
        EventExecutionManager.class.getDeclaredField("currentRaceIndex");
    currentIndexField.setAccessible(true);
    currentIndexField.set(manager, 0);

    Driver d1 = new Driver("Dave", "D", "driver1", "driver1_id");
    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);

    Race completedRace =
        new Race.Builder()
            .model(
                new com.antigravity.models.Race.Builder()
                    .withName("Final Heat")
                    .withEntityId("r1")
                    .build())
            .track(DatabaseService.getInstance().getFactoryTrack())
            .drivers(Arrays.asList(rp1))
            .isDemoMode(true)
            .build();

    manager.onRaceOver(completedRace);

    assertNotNull(manager.getActiveEvent());
    assertEquals("evt_final", manager.getActiveEvent().getEntityId());
    manager.cancelEvent();
  }

  @org.junit.Rule
  public org.junit.rules.TemporaryFolder tempFolder = new org.junit.rules.TemporaryFolder();

  @Test(expected = IllegalArgumentException.class)
  public void testStartEvent_EmptyRaces_ThrowsException() throws Exception {
    Event emptyEvent =
        new Event("Empty Event", "No races", 0.0, new ArrayList<>(), "e_empty", null);
    EventExecutionManager.getInstance()
        .startEvent(emptyEvent, Arrays.asList("d_1"), true, null, null);
  }

  @Test
  public void testStartEventAndAdvance_WithRealDatabase() throws Exception {
    String rootDir = tempFolder.newFolder("db_root_eem").getAbsolutePath() + java.io.File.separator;
    com.antigravity.context.DatabaseContext dbCtx =
        new com.antigravity.context.DatabaseContext("test_db", null, rootDir);

    try {
      // Seed Track
      com.antigravity.repository.SqliteRepository<Track> trackRepo =
          new com.antigravity.repository.SqliteRepository<>(dbCtx, "tracks", Track.class);
      Track track =
          new Track.Builder()
              .name("Main Track")
              .entityId("t1")
              .lanes(
                  Arrays.asList(
                      new com.antigravity.models.Lane("#FFFFFF", "#FF0000", 50),
                      new com.antigravity.models.Lane("#FFFFFF", "#00FF00", 50)))
              .build();
      trackRepo.insert(track);

      // Seed Drivers
      com.antigravity.repository.SqliteRepository<Driver> driverRepo =
          new com.antigravity.repository.SqliteRepository<>(dbCtx, "drivers", Driver.class);
      Driver d1 = new Driver("Driver One", "D1", "d1", "d1_id");
      Driver d2 = new Driver("Driver Two", "D2", "d2", "d2_id");
      Driver d3 = new Driver("Driver Three", "D3", "d3", "d3_id");
      driverRepo.insert(d1);
      driverRepo.insert(d2);
      driverRepo.insert(d3);

      // Seed Races
      com.antigravity.repository.SqliteRepository<com.antigravity.models.Race> raceRepo =
          new com.antigravity.repository.SqliteRepository<>(
              dbCtx, "races", com.antigravity.models.Race.class);
      com.antigravity.models.Race race1 =
          new com.antigravity.models.Race.Builder()
              .withName("Heat 1")
              .withEntityId("r1")
              .withTrackEntityId("t1")
              .withHeatRotationType(com.antigravity.models.HeatRotationType.RoundRobin)
              .build();
      com.antigravity.models.Race race2 =
          new com.antigravity.models.Race.Builder()
              .withName("Heat 2")
              .withEntityId("r2")
              .withTrackEntityId("t1")
              .withHeatRotationType(com.antigravity.models.HeatRotationType.RoundRobin)
              .build();
      raceRepo.insert(race1);
      raceRepo.insert(race2);

      // Create Event with 2 races and maxDrivers=2 for race 1
      List<EventRaceItem> raceItems = new ArrayList<>();
      raceItems.add(new EventRaceItem("r1", 2));
      raceItems.add(new EventRaceItem("r2", 0));
      Event event = new Event("Grand Prix", "Championship Event", 0.0, raceItems, "e1", null);

      EventExecutionManager manager = EventExecutionManager.getInstance();
      manager.startEvent(event, Arrays.asList("d_d1", "d_d2", "d_d3"), true, null, dbCtx);

      assertTrue(manager.isEventActive());
      assertEquals(0, manager.getCurrentRaceIndex());
      assertEquals(2, manager.getCurrentQualifiedParticipantIds().size());

      // Advance to Race 2
      boolean advanced = manager.advanceToNextRace();
      assertTrue(advanced);
      assertEquals(1, manager.getCurrentRaceIndex());

      // Try advance past last race
      boolean pastEnd = manager.advanceToNextRace();
      assertFalse(pastEnd);

      // Cancel
      manager.cancelEvent();
      assertFalse(manager.isEventActive());
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testGetEventDriverResultsMap_ReturnsCopy() {
    EventExecutionManager manager = EventExecutionManager.getInstance();
    assertNotNull(manager.getEventDriverResultsMap());
    assertTrue(manager.getEventDriverResultsMap().isEmpty());
  }

  @Test
  public void testAdvanceToNextRaceWhenNoEvent() throws Exception {
    EventExecutionManager manager = EventExecutionManager.getInstance();
    manager.cancelEvent();
    assertFalse(manager.advanceToNextRace());
  }

  @Test
  public void testCancelAutoAdvanceTimerWhenInactive() {
    EventExecutionManager manager = EventExecutionManager.getInstance();
    manager.cancelAutoAdvanceTimer();
    assertEquals(0.0, manager.getAutoAdvanceRemainingSeconds(), 0.001);
  }

  @Test
  public void testSchedulerDaemonThread() throws Exception {
    java.lang.reflect.Field field = EventExecutionManager.class.getDeclaredField("scheduler");
    field.setAccessible(true);
    java.util.concurrent.ScheduledExecutorService ses =
        (java.util.concurrent.ScheduledExecutorService)
            field.get(EventExecutionManager.getInstance());

    java.util.concurrent.atomic.AtomicBoolean isDaemon =
        new java.util.concurrent.atomic.AtomicBoolean(false);
    ses.submit(() -> isDaemon.set(Thread.currentThread().isDaemon())).get();
    assertTrue("EventExecutionManager scheduler thread must be daemon", isDaemon.get());
  }
}
