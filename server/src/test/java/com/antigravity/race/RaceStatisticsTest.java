package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import com.antigravity.service.ServerConfigService;
import com.antigravity.util.CsvExporter;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class RaceStatisticsTest {

  private com.antigravity.race.Race race;
  private List<RaceParticipant> participants;
  private Track track;

  @Before
  public void setUp() {
    ServerConfigService configService = mock(ServerConfigService.class);
    when(configService.getStartRandomizer()).thenReturn(0.0);
    when(configService.getRestartRandomizer()).thenReturn(0.0);

    DatabaseContext dbContext = mock(DatabaseContext.class);
    when(dbContext.getConfigService()).thenReturn(configService);

    ClientSubscriptionManager.getInstance().setDatabaseContext(dbContext);

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            10L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);

    OverallScoring overallScoring =
        new OverallScoring(
            0,
            OverallScoring.OverallRanking.LAP_COUNT,
            OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId("race1")
            .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("track1")
            .id(new ObjectId())
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
  }

  @Test
  public void testStatisticsCollection() throws InterruptedException {
    RaceStatistics stats = race.getStatistics();
    assertNull(stats.getStartTime());
    assertNull(stats.getEndTime());
    assertEquals(0, stats.getYellowFlagCount());
    assertEquals(0, stats.getTotalPausedTimeMillis());
    assertEquals(0, stats.getRestartCount());

    // 1. Start Race (Racing.enter sets start times)
    Racing racingState = new Racing();
    race.changeState(racingState);

    assertNotNull(stats.getStartTime());
    assertNotNull(race.getCurrentHeat().getStatistics().getStartTime());

    String initialStartTime = stats.getStartTime();

    // 2. Pause Race (Racing.pause increments yellow flag)
    racingState.pause(race);
    assertEquals(1, stats.getYellowFlagCount());
    assertTrue(race.getState() instanceof Paused);

    Thread.sleep(100); // Simulate some pause time

    // 3. Resume Race (Paused.start transitions to Starting)
    race.getState().start(race);
    assertTrue(race.getState() instanceof Starting);
    // Exiting Paused should have added to paused time
    assertTrue("Paused time should be > 0", stats.getTotalPausedTimeMillis() > 0);

    // 4. Restart Heat (Manual trigger in Racing.restartHeat or Paused.restartHeat)
    race.resetCurrentHeat();
    assertEquals(1, stats.getRestartCount());

    // 5. End Heat (transition to HeatOver)
    race.changeState(new HeatOver());
    assertNotNull(race.getCurrentHeat().getStatistics().getEndTime());

    // 6. End Race (transition to RaceOver)
    race.changeState(new RaceOver());
    assertNotNull(stats.getEndTime());
    assertTrue("Race duration should be > 0", stats.getDurationMillis() > 0);
    assertEquals(initialStartTime, stats.getStartTime()); // Should not have changed

    // 7. Verify CSV Export
    String csv = CsvExporter.export(race);
    assertTrue(csv.contains("Start Time," + stats.getStartTime()));
    assertTrue(csv.contains("End Time," + stats.getEndTime()));
    assertTrue(csv.contains("Duration (ms)," + stats.getDurationMillis()));
    assertFalse(
        "Race duration in CSV should not be N/A",
        csv.contains("End Time," + stats.getEndTime() + "\nDuration (ms),N/A"));
    assertTrue(csv.contains("Yellow Flags,1"));
    assertTrue(csv.contains("Total Paused Time (ms)," + stats.getTotalPausedTimeMillis()));
    assertTrue(csv.contains("Restarts,1"));

    // Heat stats in CSV
    assertTrue(csv.contains("#Heat, Start Time, End Time, Duration\n"));
    String heatStats =
        "1,"
            + escape(race.getCurrentHeat().getStatistics().getStartTime())
            + ","
            + escape(race.getCurrentHeat().getStatistics().getEndTime())
            + ","
            + race.getCurrentHeat().getStatistics().getDurationMillis();
    assertTrue(csv.contains(heatStats));
  }

  private String escape(String value) {
    if (value == null) {
      return "";
    }
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  @Test
  public void testNAforUnfinishedRace() {
    // Start the race
    Racing racingState = new Racing();
    race.changeState(racingState);

    // Verify CSV Export has N/A for end times
    String csv = CsvExporter.export(race);
    assertTrue(csv.contains("Start Time,"));
    assertTrue(csv.contains("End Time,N/A"));
    assertTrue(csv.contains("Duration (ms),N/A"));

    // Heat stats in CSV should also have N/A for end time and duration if not finished
    assertTrue(csv.contains("#Heat, Start Time, End Time, Duration\n"));
    assertTrue(csv.contains("1,"));
    // Start time will be set because race has started, but End and Duration are N/A
    assertTrue(csv.contains(",N/A,N/A\n\n"));
  }

  @Test
  public void testHeatStartTimePreservedOnRestart() throws InterruptedException {
    // Start the heat
    Racing racingState = new Racing();
    race.changeState(racingState);

    String initialHeatStart = race.getCurrentHeat().getStatistics().getStartTime();
    assertNotNull("Initial heat start time should be set", initialHeatStart);

    Thread.sleep(100);

    // Restart the heat
    race.resetCurrentHeat();
    // Transition back to Racing state as if we're starting again
    race.changeState(new Racing());

    assertEquals(
        "Heat start time should be preserved after restart",
        initialHeatStart,
        race.getCurrentHeat().getStatistics().getStartTime());
  }

  @Test
  public void testSaveAndRestoreStatistics() {
    // 1. Setup active race with statistics
    Racing racingState = new Racing();
    race.changeState(racingState);
    race.getStatistics().incrementYellowFlagCount();
    race.getStatistics().setStartMillis(12345L);
    race.getCurrentHeat().getStatistics().setStartMillis(67890L);

    // 2. Simulate Save
    RaceSaveData saveData = new RaceSaveData();
    saveData.setModel(race.getRaceModel());
    saveData.setTrack(race.getTrack());
    saveData.setDrivers(race.getDrivers());
    saveData.setHeats(race.getHeats());
    saveData.setStatistics(race.getStatistics());
    saveData.setCurrentHeatIndex(0);
    saveData.setStateClassName(race.getState().getClass().getName());

    // 3. Simulate Restore
    com.antigravity.race.Race restoredRace =
        new com.antigravity.race.Race.Builder()
            .model(saveData.getModel())
            .track(saveData.getTrack())
            .drivers(saveData.getDrivers())
            .heats(saveData.getHeats())
            .statistics(saveData.getStatistics())
            .currentHeatIndex(saveData.getCurrentHeatIndex())
            .stateClassName(saveData.getStateClassName())
            .isDemoMode(true)
            .build();

    // 4. Verify
    assertNotNull(restoredRace.getStatistics());
    assertEquals(1, restoredRace.getStatistics().getYellowFlagCount());
    assertEquals(12345L, restoredRace.getStatistics().getStartMillis());
    assertEquals(67890L, restoredRace.getCurrentHeat().getStatistics().getStartMillis());
    assertEquals(race.getStatistics().getStartTime(), restoredRace.getStatistics().getStartTime());
  }

  @Test
  public void testBackwardCompatibility() {
    // 1. Simulate an old save file (statistics field is null)
    RaceSaveData saveData = new RaceSaveData();
    saveData.setModel(race.getRaceModel());
    saveData.setTrack(race.getTrack());
    saveData.setDrivers(race.getDrivers());
    saveData.setHeats(race.getHeats());
    saveData.setStatistics(null); // Explicitly null
    saveData.setCurrentHeatIndex(0);
    saveData.setStateClassName(NotStarted.class.getName());

    // 2. Restore
    com.antigravity.race.Race restoredRace =
        new com.antigravity.race.Race.Builder()
            .model(saveData.getModel())
            .track(saveData.getTrack())
            .drivers(saveData.getDrivers())
            .heats(saveData.getHeats())
            .statistics(saveData.getStatistics())
            .currentHeatIndex(saveData.getCurrentHeatIndex())
            .stateClassName(saveData.getStateClassName())
            .isDemoMode(true)
            .build();

    // 3. Verify it doesn't crash and has default statistics
    assertNotNull(restoredRace.getStatistics());
    assertEquals(0, restoredRace.getStatistics().getYellowFlagCount());
    assertNull(restoredRace.getStatistics().getStartTime());

    for (Heat heat : restoredRace.getHeats()) {
      assertNotNull(heat.getStatistics());
    }
  }

  @Test
  public void testOnLapRecordTimingConsistency() {
    // 1. Setup participant with a reaction time
    // We MUST get the participant from the race object, as the builder clones the list
    RaceParticipant p = race.getDrivers().get(0);
    // Reaction time is stored in DriverHeatData
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    dhd.setReactionTime(0.5); // 500ms reaction time

    // 2. Start Race
    race.changeState(new Racing());

    // 3. Trigger raw hardware lap of 2.0s
    // effectiveLapTime should be 2.5s (2.0 + 0.5)
    race.onLap(0, 2.0, 0, 0);

    // 4. Verify RecordData reflects effective time
    assertEquals("Lap count should be 1", 1.0, p.getTotalLaps(), 0.001);
    assertEquals("Lane Best Lap should be 2.5", 2.5, p.getBestLapTime(), 0.001);

    com.antigravity.proto.RecordData records = race.getRecordData();
    assertEquals(
        "Race Fastest Lap record should be 2.5",
        2.5,
        records.getCurrent().getFastestLap().getValue(),
        0.001);
    assertEquals(
        "Heat Fastest Lap record should be 2.5",
        2.5,
        records.getCurrent().getHeatFastestLap().getValue(),
        0.001);

    // 5. Subsequent lap should NOT add reaction time again
    race.onLap(0, 1.8, 0, 0); // Raw 1.8s

    // Explicitly update overall standings before final assertion
    race.updateAndBroadcastOverallStandings();

    // FIND the driver by name to be 100% sure we have the right reference after sorting
    p =
        race.getDrivers().stream()
            .filter(d -> d.getDriver() != null && "Driver 1".equals(d.getDriver().getName()))
            .findFirst()
            .orElse(p);

    assertEquals("Lap count should be 2", 2.0, p.getTotalLaps(), 0.001);
    assertEquals("Lane Best Lap should be 1.8", 1.8, p.getBestLapTime(), 0.001);

    records = race.getRecordData();
    assertEquals(
        "Race Fastest Lap record should be 1.8",
        1.8,
        records.getCurrent().getFastestLap().getValue(),
        0.001);
  }
}
