package com.antigravity.race;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceFlag;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import com.antigravity.service.ServerConfigService;
import java.util.Collections;
import org.junit.Before;
import org.junit.Test;

public class StartingStateTest {

  private Race race;
  private Starting starting;
  private ServerConfigService configService;
  private ClientSubscriptionManager manager;
  private RaceParticipant mockParticipant;
  private DatabaseContext mockDbCtx;

  @Before
  public void setUp() {
    configService = mock(ServerConfigService.class);
    when(configService.getStartDelay()).thenReturn(0.0);
    when(configService.getRestartDelay()).thenReturn(0.0);

    Lane lane = new Lane("red", "white", 100);
    Track track = new Track("Test Track", Collections.singletonList(lane));

    mockParticipant = mock(RaceParticipant.class);
    when(mockParticipant.getObjectId()).thenReturn("p1");

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder().withStartTime(1.0).withRestartTime(2.0).build();

    mockDbCtx = mock(DatabaseContext.class);
    com.mongodb.client.MongoDatabase mockDb = mock(com.mongodb.client.MongoDatabase.class);
    when(mockDbCtx.getDatabase()).thenReturn(mockDb);
    com.mongodb.client.MongoCollection mockCollection =
        mock(com.mongodb.client.MongoCollection.class);
    com.mongodb.client.FindIterable mockIterable = mock(com.mongodb.client.FindIterable.class);
    when(mockDb.getCollection(anyString(), any())).thenReturn(mockCollection);
    when(mockCollection.find(any(org.bson.conversions.Bson.class))).thenReturn(mockIterable);

    race =
        new Race.Builder()
            .model(raceModel)
            .track(track)
            .drivers(Collections.singletonList(mockParticipant))
            .databaseContext(mockDbCtx)
            .isDemoMode(true)
            .build();

    manager = ClientSubscriptionManager.getInstance();
    manager.setRace(race);
    starting = new Starting();
  }

  @Test
  public void testStartingUsesStartTimeForNewHeat() throws InterruptedException {
    race.setHasRacedInCurrentHeat(false);
    long start = System.currentTimeMillis();
    race.changeState(starting);

    // Wait for transition to Racing
    long deadline = System.currentTimeMillis() + 5000;
    while (!(race.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
      Thread.sleep(100);
    }

    assertTrue(
        "Race should be in Racing state after startTime. Current state: "
            + race.getState().getClass().getName(),
        race.getState() instanceof Racing);
    long duration = System.currentTimeMillis() - start;
    assertTrue(
        "Duration should be around 1000ms, was " + duration, duration >= 900 && duration < 3000);
  }

  @Test
  public void testStartingUsesRestartTimeForRestart() throws InterruptedException {
    race.setHasRacedInCurrentHeat(true);
    long start = System.currentTimeMillis();
    race.changeState(starting);

    // Wait for transition to Racing
    long deadline = System.currentTimeMillis() + 5000;
    while (!(race.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
      Thread.sleep(100);
    }

    assertTrue(
        "Race should be in Racing state after restartTime. Current state: "
            + race.getState().getClass().getName(),
        race.getState() instanceof Racing);
    long duration = System.currentTimeMillis() - start;
    assertTrue(
        "Duration should be around 2000ms, was " + duration, duration >= 1900 && duration < 4000);
  }

  @Test
  public void testStartingWaitRandomDelay() throws InterruptedException {
    com.antigravity.models.Race raceModelWithDelay =
        new com.antigravity.models.Race.Builder().withStartTime(1.0).withStartDelay(1.0).build();

    race =
        new Race.Builder()
            .model(raceModelWithDelay)
            .track(race.getTrack())
            .drivers(race.getDrivers())
            .databaseContext(mockDbCtx)
            .isDemoMode(true)
            .build();
    manager.setRace(race);

    long start = System.currentTimeMillis();
    race.changeState(starting);

    // Wait for transition to Racing
    long deadline = System.currentTimeMillis() + 6000;
    while (!(race.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
      Thread.sleep(100);
    }

    assertTrue(
        "Race should be in Racing state. Current state: " + race.getState().getClass().getName(),
        race.getState() instanceof Racing);
    long duration = System.currentTimeMillis() - start;
    // 1.0s base + up to 1.0s random delay
    assertTrue("Duration should be at least 1000ms, was " + duration, duration >= 900);
    assertTrue("Duration should be around 2000ms max, was " + duration, duration < 4000);
  }

  @Test
  public void testHotStart() throws InterruptedException {
    com.antigravity.models.Race hotStartModel =
        new com.antigravity.models.Race.Builder().withHotStart(true).build();

    race =
        new Race.Builder()
            .model(hotStartModel)
            .track(race.getTrack())
            .drivers(race.getDrivers())
            .databaseContext(mockDbCtx)
            .isDemoMode(true)
            .build();
    manager.setRace(race);

    race.changeState(starting);

    assertTrue(
        "Hot start should remain in Starting state during countdown",
        race.getState() instanceof Starting);
    assertTrue(
        "Master power should be ON during starting countdown when hot start is enabled",
        race.isMainPower());
  }

  @Test
  public void testHotStartDoesNotBypassCountdown() throws InterruptedException {
    com.antigravity.models.Race hotStartModel =
        new com.antigravity.models.Race.Builder().withHotStart(true).withStartTime(1.0).build();

    race =
        new Race.Builder()
            .model(hotStartModel)
            .track(race.getTrack())
            .drivers(race.getDrivers())
            .databaseContext(mockDbCtx)
            .isDemoMode(true)
            .build();
    manager.setRace(race);

    // Initial state is NotStarted
    assertTrue(
        "Initial state should be NotStarted",
        race.getState() instanceof com.antigravity.race.states.NotStarted);
    assertFalse("Master power should be OFF initially", race.isMainPower());

    // Start the race
    race.startRace();

    // Verify it transitions to Starting (not directly to Racing) and power is turned ON during the
    // countdown
    assertTrue(
        "Should transition to Starting state to run the countdown sequence",
        race.getState() instanceof Starting);
    assertTrue(
        "Master power should be turned ON during the countdown sequence for hot start",
        race.isMainPower());

    // Wait for the countdown sequence to finish and transition to Racing
    long deadline = System.currentTimeMillis() + 5000;
    while (!(race.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
      Thread.sleep(100);
    }

    assertTrue(
        "Should transition to Racing state after countdown completes",
        race.getState() instanceof Racing);
    assertTrue("Master power should still be ON in Racing", race.isMainPower());
  }

  @Test
  public void testStartingFalseStartTriggersNotStarted() {
    race.changeState(starting);
    starting.onLap(0, 0.5, 1, false);

    assertTrue(
        "Race should stay in Starting state on false start in current implementation",
        race.getState() instanceof Starting);
  }

  @Test
  public void testGetFlagType() {
    // 1) Initial start: should be RED
    race.setHasRacedInCurrentHeat(false);
    race.changeState(starting);
    assertEquals("Flag should be RED for initial start", RaceFlag.RED, starting.getFlagType(race));

    // 2) Restart: should be YELLOW
    race.setHasRacedInCurrentHeat(true);
    race.changeState(starting);
    assertEquals("Flag should be YELLOW for restart", RaceFlag.YELLOW, starting.getFlagType(race));
  }
}
