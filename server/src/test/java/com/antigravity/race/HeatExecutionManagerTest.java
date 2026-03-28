package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Team;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.NotStarted;

public class HeatExecutionManagerTest {

  private Race race;
  private HeatScoring heatScoring;
  private List<RaceParticipant> participants;
  private Track track;
  private HeatExecutionManager executionManager;

  @Before
  public void setUp() {
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        3L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);

    OverallScoring overallScoring = new OverallScoring(
        0,
        OverallScoring.OverallRanking.LAP_COUNT,
        OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatRotationType(HeatRotationType.RoundRobin)
        .withHeatScoring(heatScoring)
        .withOverallScoring(overallScoring)
        .withEntityId("race1")
        .withId(new ObjectId())
        .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));
    participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", new ObjectId()), "p2"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "black", 100));
    track = new Track("Test Track", lanes, java.util.Collections.singletonList(mock(ArduinoConfig.class)), "track1",
        new ObjectId());

    race = new Race(raceModel, participants, track, true, 0.0, 0.0);
    executionManager = race.getHeatExecutionManager();
    // Manager is already initialized by Race constructor, but we want a clean state
    executionManager.initialize(track.getLanes().size());
  }

  @Test
  public void testLapRace_AllowFinish_None_EndsOnFirstDriver() {
    // Driver 1 completes 3rd lap (limit is 3)
    executionManager.onLap(0, 1.0, 1, false, true); // Reaction
    executionManager.onLap(0, 5.0, 1, false, true); // Lap 1
    executionManager.onLap(0, 5.0, 1, false, true); // Lap 2
    executionManager.onLap(0, 5.0, 1, false, true); // Lap 3 (Finished)
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testLapRace_AllowFinish_Allow_EndsOnLastDriver() {
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        3L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.Allow);
    
    // We need to re-create the race to update the scoring
    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatScoring(heatScoring)
        .withOverallScoring(new OverallScoring())
        .withEntityId("race1")
        .build();
    race = new Race(raceModel, participants, track, true);
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    // Driver 1 completes 3 laps
    executionManager.onLap(0, 1.0, 1, false, true); // Reaction
    executionManager.onLap(0, 5.0, 1, false, true); // Lap 1
    executionManager.onLap(0, 5.0, 1, false, true); // Lap 2
    executionManager.onLap(0, 5.0, 1, false, true); // Lap 3 (Finished)
    assertFalse(race.getState() instanceof HeatOver);
    assertTrue(executionManager.getFinishedLanes().contains(0));

    // Driver 2 completes 3 laps
    executionManager.onLap(1, 1.0, 1, false, true); // Reaction
    executionManager.onLap(1, 5.0, 1, false, true); // Lap 1
    executionManager.onLap(1, 5.0, 1, false, true); // Lap 2
    executionManager.onLap(1, 5.0, 1, false, true); // Lap 3 (Finished)
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testMinLapTime_AccumulatesLaps() {
    double minLapTime = 10.0;
    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatScoring(heatScoring)
        .withOverallScoring(new OverallScoring())
        .withMinLapTime(minLapTime)
        .withEntityId("race1")
        .build();
    race = new Race(raceModel, participants, track, true);
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    // Initial state: 0 laps
    assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());

    // Reaction time
    executionManager.onLap(0, 1.0, 1, false, true);

    // Lap 1: 4.0s (accumulated: 4.0s) - below min 10.0s
    executionManager.onLap(0, 4.0, 1, false, true);
    assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());

    // Lap 2: 7.0s (accumulated: 11.0s) - above min 10.0s
    executionManager.onLap(0, 7.0, 1, false, true);
    assertEquals(1, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    // The lap time should be 12.0s (1.0s reaction + 4.0s + 7.0s accumulated)
    assertEquals(12.0, race.getCurrentHeat().getDrivers().get(0).getLaps().get(0).getLapTime(), 0.001);
  }

  @Test
  public void testFuelConsumption_Linear() {
    com.antigravity.models.AnalogFuelOptions fuelOptions = new com.antigravity.models.AnalogFuelOptions(
        true, false, false, 100.0, com.antigravity.models.AnalogFuelOptions.FuelUsageType.LINEAR, 4.0, 100.0, 10.0, 2.0,
        5.0);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatRotationType(HeatRotationType.RoundRobin)
        .withHeatScoring(heatScoring)
        .withOverallScoring(new OverallScoring())
        .withFuelOptions(fuelOptions)
        .withEntityId("race1")
        .build();

    race = new Race(raceModel, participants, track, true);
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    // Set initial fuel level
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(100.0);

    // Reaction
    executionManager.onLap(0, 1.0, 1, false, true);

    // Lap time exactly equal to reference time (5.0s) should use exactly the usageRate (4.0)
    executionManager.onLap(0, 5.0, 1, false, true);

    assertEquals(96.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
  }

  @Test
  public void testOnSegmentHandling() {
    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);

    // Segments are ignored before reaction time is set (via onLap)
    executionManager.onSegment(0, 1.2, 1);
    assertEquals(0.0, driverData.getReactionTime(), 0.001);
    assertEquals(0, driverData.getSegments().size());

    // First lap hit sets reaction time
    executionManager.onLap(0, 1.5, 1, false, true);
    assertEquals(1.5, driverData.getReactionTime(), 0.001);

    // Subsequent segments are added
    executionManager.onSegment(0, 5.0, 1);
    assertEquals(1, driverData.getSegments().size());
    assertEquals(5.0, driverData.getSegments().get(0), 0.001);
  }

  @Test
  public void testWarmup_IgnoreTeamLimits_TimeAndLaps() {
    // Setup team with strict limits: 1 lap, 10 seconds total time
    TeamOptions teamOptions = new TeamOptions(1, 0.0, 0, 10.0, false);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatScoring(heatScoring)
        .withOverallScoring(new OverallScoring())
        .withEntityId("race1")
        .withTeamOptions(teamOptions)
        .build();

    Team mockTeam = new Team("Team A", null, null, "t1", new ObjectId());
    RaceParticipant teamParticipant = new RaceParticipant(mockTeam);
    participants.clear();
    participants.add(teamParticipant);

    race = new Race(raceModel, participants, track, true);
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    driverData.setActualDriver(new Driver("1A", "1A", "sd1", new ObjectId()));

    // Warmup lap handling (ignoreTeamLimits = true, checkFinish = false)
    executionManager.onLap(0, 1.0, 1, true, false); // Reaction
    executionManager.onLap(0, 20.0, 1, true, false); // Lap 1 (both limits exceeded: 1 lap and 10s time)
    executionManager.onLap(0, 20.0, 1, true, false); // Lap 2 (should STILL be counted)
    
    assertEquals(2, driverData.getLapCount());
    assertTrue("State should still be NotStarted", race.getState() instanceof NotStarted);
  }

  @Test
  public void testWarmup_NeverFinishes() {
    // Setup 3 lap race
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        3L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);
    
    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatScoring(heatScoring)
        .withOverallScoring(new OverallScoring())
        .withEntityId("race1")
        .build();
    race = new Race(raceModel, participants, track, true);
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    // Trigger many more laps than the 3 lap limit
    executionManager.onLap(0, 1.0, 1, true, false); // Reaction
    for (int i = 0; i < 10; i++) {
      executionManager.onLap(0, 5.0, 1, true, false);
    }
    
    assertEquals(10, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    assertTrue("Lanes should not be finished", executionManager.getFinishedLanes().isEmpty());
    assertTrue("State should still be NotStarted", race.getState() instanceof NotStarted);
  }

  @Test
  public void testWarmup_Refueling() {
    com.antigravity.models.AnalogFuelOptions fuelOptions = new com.antigravity.models.AnalogFuelOptions(
        true, false, false, 100.0, com.antigravity.models.AnalogFuelOptions.FuelUsageType.LINEAR, 4.0, 100.0, 10.0, 2.0,
        5.0);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withFuelOptions(fuelOptions)
        .withEntityId("race1")
        .build();

    race = new Race(raceModel, participants, track, true);
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    driverData.getDriver().setFuelLevel(50.0);

    // Enter pit
    com.antigravity.protocols.CarData pitData = new com.antigravity.protocols.CarData(
        0, 0, 0, 0, true, com.antigravity.protocols.CarLocation.PitRow, 
        com.antigravity.protocols.CarLocation.PitRow, -1);
    
    executionManager.handlePitDetection(pitData);
    
    // Process delay (e.g. 2s)
    executionManager.processTicker(1.0f);
    executionManager.processTicker(1.0f);
    
    // Should be refueling now
    assertTrue(executionManager.getIsRefueling()[0]);
    
    // Process refueling (refuelRate is 10.0)
    executionManager.processTicker(1.0f);
    assertTrue(driverData.getDriver().getFuelLevel() > 50.0);
  }
}
