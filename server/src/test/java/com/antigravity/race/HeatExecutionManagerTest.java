package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Track;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class HeatExecutionManagerTest {

  private com.antigravity.race.Race race;
  private HeatScoring heatScoring;
  private List<RaceParticipant> participants;
  private Track track;
  private HeatExecutionManager executionManager;

  @Before
  public void setUp() {
    heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
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
            .withId(new ObjectId())
            .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));
    participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", new ObjectId()), "p2"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "black", 100));
    track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
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
    executionManager = race.getHeatExecutionManager();
    // Manager is already initialized by Race constructor, but we want a clean state
    executionManager.initialize(track.getLanes().size());
  }

  @Test
  public void testLapRace_AllowFinish_None_EndsOnFirstDriver() {
    // Driver 1 completes 3rd lap (limit is 3)
    executionManager.onLap(0, 1.0, 1, false, true, false); // Reaction
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 1
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 2
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 3 (Finished)
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testLapRace_AllowFinish_Allow_EndsOnLastDriver() {
    heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.Allow);

    // We need to re-create the race to update the scoring
    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withEntityId("race1")
            .build();
    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());
    race.updatePowerForFlag(com.antigravity.proto.RaceFlag.GREEN);

    // Driver 1 completes 3 laps
    executionManager.onLap(0, 1.0, 1, false, true, false); // Reaction
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 1
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 2
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 3 (Finished)
    assertFalse(race.getState() instanceof HeatOver);
    assertTrue(executionManager.getFinishedLanes().contains(0));
    assertFalse("Lane 0 power should be OFF after finishing", race.isLanePower(0));
    assertTrue("Lane 1 power should stay ON for Driver 2", race.isLanePower(1));

    // Driver 2 completes 3 laps
    executionManager.onLap(1, 1.0, 1, false, true, false); // Reaction
    executionManager.onLap(1, 5.0, 1, false, true, false); // Lap 1
    executionManager.onLap(1, 5.0, 1, false, true, false); // Lap 2
    executionManager.onLap(1, 5.0, 1, false, true, false); // Lap 3 (Finished)
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testLapRace_AllowFinish_SingleLap() {
    heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.SingleLap);

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withEntityId("race1")
            .build();
    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());
    race.updatePowerForFlag(com.antigravity.proto.RaceFlag.GREEN);

    // Driver 1 completes 3 laps (Leader finishes)
    executionManager.onLap(0, 1.0, 1, false, true, false); // Reaction
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 1
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 2
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 3 (Finished)

    assertFalse(race.getState() instanceof HeatOver);
    assertTrue(executionManager.getFinishedLanes().contains(0));
    assertFalse("Lane 0 power should be OFF", race.isLanePower(0));
    assertTrue("Lane 1 power should be ON", race.isLanePower(1));

    // Driver 2 is at Lap 0. In SingleLap mode, since someone finished,
    // their NEXT lap hit should finish them regardless of the 3 lap limit.
    executionManager.onLap(1, 1.0, 1, false, true, false); // Reaction (Lap 0)
    assertFalse(race.getState() instanceof HeatOver);

    executionManager.onLap(1, 5.0, 1, false, true, false); // Lap 1 (Finish triggered by SingleLap)
    assertTrue(
        "Heat should end after Driver 2 completes their single extra lap",
        race.getState() instanceof HeatOver);
    assertTrue(executionManager.getFinishedLanes().contains(1));
  }

  @Test
  public void testMinLapTime_AccumulatesLaps() {
    double minLapTime = 10.0;
    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withMinLapTime(minLapTime)
            .withEntityId("race1")
            .build();
    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    // Initial state: 0 laps
    assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());

    // Reaction time
    executionManager.onLap(0, 1.0, 1, false, true, false);

    // Lap 1: 4.0s (accumulated: 4.0s) - below min 10.0s
    executionManager.onLap(0, 4.0, 1, false, true, false);
    assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());

    // Lap 2: 7.0s (accumulated: 11.0s) - above min 10.0s
    executionManager.onLap(0, 7.0, 1, false, true, false);
    assertEquals(1, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    // The lap time should be 12.0s (1.0s reaction + 4.0s + 7.0s accumulated)
    assertEquals(
        12.0, race.getCurrentHeat().getDrivers().get(0).getLaps().get(0).getLapTime(), 0.001);
  }

  @Test
  public void testFuelConsumption_Linear() {
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0,
            100.0,
            10.0,
            2.0,
            5.0);

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withFuelOptions(fuelOptions)
            .withEntityId("race1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    // Set initial fuel level
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(100.0);

    // Reaction
    executionManager.onLap(0, 1.0, 1, false, true, false);

    // Lap time exactly equal to reference time (5.0s) should use exactly the usageRate (4.0)
    executionManager.onLap(0, 5.0, 1, false, true, false);

    assertEquals(96.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
  }

  @Test
  public void testFuelConsumption_SubsequentLaps() {
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0, // usageRate (at reference time)
            100.0,
            10.0,
            2.0,
            5.0 // referenceTime
            );

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withFuelOptions(fuelOptions)
            .withEntityId("race1")
            .withStartBehindSensor(true)
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    // Set initial fuel level
    RaceParticipant driver = race.getCurrentHeat().getDrivers().get(0).getDriver();
    driver.setFuelLevel(100.0);

    // 1. Reaction time crossing (e.g., 8.0s)
    executionManager.onLap(0, 8.0, 1, false, true, false);
    // No fuel should be consumed during reaction time crossing
    assertEquals(100.0, driver.getFuelLevel(), 0.001);

    // 2. First actual lap after reaction time (e.g., 5.0s lap duration)
    // Formula for LINEAR:
    // refL = 5.0
    // x1 = refL * 2 = 10.0
    // y1 = usageRate / 2 = 2.0
    // x2 = refL = 5.0
    // y2 = usageRate = 4.0
    // slope m = (4.0 - 2.0) / (5.0 - 10.0) = -0.4
    // b = 2.0 - (-0.4) * 10.0 = 6.0
    // lapFuelUsed = m * racingTime + b
    // For 5.0s, lapFuelUsed = -0.4 * 5.0 + 6.0 = 4.0
    executionManager.onLap(0, 5.0, 1, false, true, false);
    assertEquals(96.0, driver.getFuelLevel(), 0.001);

    // 3. Second lap (e.g., 5.0s lap duration)
    // If the reaction time (8.0s) was incorrectly subtracted, racingTime would be 5.0 - 8.0 = -3.0
    // -> Math.max(0.1, -3.0) = 0.1s
    // With the fix, the racingTime is 5.0s, so fuel used should be exactly 4.0 again.
    executionManager.onLap(0, 5.0, 1, false, true, false);
    assertEquals(92.0, driver.getFuelLevel(), 0.001);
  }

  @Test
  public void testOnSegmentHandling() {
    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);

    // Segments are ignored before reaction time is set (via onLap)
    executionManager.onSegment(0, 1.2, 1);
    assertEquals(-1.0, driverData.getReactionTime(), 0.001);
    assertEquals(0, driverData.getSegments().size());

    // First lap hit sets reaction time
    executionManager.onLap(0, 1.5, 1, false, true, false);
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

    Race raceModel =
        new Race.Builder()
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

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    driverData.setActualDriver(new Driver("1A", "1A", "sd1", new ObjectId()));

    // Warmup lap handling (ignoreTeamLimits = true, checkFinish = false)
    executionManager.onLap(0, 1.0, 1, true, false, false); // Reaction
    executionManager.onLap(
        0, 20.0, 1, true, false, false); // Lap 1 (both limits exceeded: 1 lap and 10s time)
    executionManager.onLap(0, 20.0, 1, true, false, false); // Lap 2 (should STILL be counted)

    assertEquals(2, driverData.getLapCount());
    assertTrue("State should still be NotStarted", race.getState() instanceof NotStarted);
  }

  @Test
  public void testWarmup_NeverFinishes() {
    // Setup 3 lap race
    heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withEntityId("race1")
            .build();
    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    // Trigger many more laps than the 3 lap limit
    executionManager.onLap(0, 1.0, 1, true, false, false); // Reaction
    for (int i = 0; i < 10; i++) {
      executionManager.onLap(0, 5.0, 1, true, false, false);
    }

    assertEquals(10, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    assertTrue("Lanes should not be finished", executionManager.getFinishedLanes().isEmpty());
    assertTrue("State should still be NotStarted", race.getState() instanceof NotStarted);
  }

  @Test
  public void testWarmup_Refueling() {
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0,
            100.0,
            10.0,
            2.0,
            5.0);

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withFuelOptions(fuelOptions)
            .withEntityId("race1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    driverData.getDriver().setFuelLevel(50.0);

    // Enter pit
    CarData pitData = new CarData(0, 0, 0, 0, true, CarLocation.PitRow, CarLocation.PitRow, -1);

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

  @Test
  public void testOnLapAndOnSegmentRejectedOnEmptyLane() {
    // Re-create the race with one real driver and one EMPTY_DRIVER explicitly
    List<RaceParticipant> mixedParticipants = new ArrayList<>();
    mixedParticipants.add(
        new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));
    mixedParticipants.add(new RaceParticipant(Driver.EMPTY_DRIVER));

    race =
        new com.antigravity.race.Race.Builder()
            .model(race.getRaceModel())
            .drivers(mixedParticipants)
            .track(track) // 2 lanes
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(2);

    DriverHeatData emptyDriverData = race.getCurrentHeat().getDrivers().get(1);
    assertTrue(emptyDriverData.getDriver().getDriver().isEmpty());

    // Try onLap
    boolean lapResult = executionManager.onLap(1, 5.0, 1, false, true, false);
    assertFalse("Lap on empty lane should be rejected", lapResult);
    assertEquals(0, emptyDriverData.getLapCount());

    // Try onSegment
    executionManager.onSegment(1, 2.0, 1);
    assertEquals(0, emptyDriverData.getSegments().size());
  }

  @Test
  public void testEmptyLaneRefuelingSkipped() {
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0,
            100.0,
            10.0,
            2.0,
            5.0);

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withFuelOptions(fuelOptions)
            .withEntityId("race1")
            .build();

    List<RaceParticipant> mixedParticipants = new ArrayList<>();
    mixedParticipants.add(
        new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));
    mixedParticipants.add(new RaceParticipant(Driver.EMPTY_DRIVER));

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(mixedParticipants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(2);

    DriverHeatData emptyDriverData = race.getCurrentHeat().getDrivers().get(1);
    emptyDriverData.getDriver().setFuelLevel(50.0);

    // Enter pit for the empty lane
    CarData pitData = new CarData(1, 0, 0, 0, true, CarLocation.PitRow, CarLocation.PitRow, -1);
    executionManager.handlePitDetection(pitData);

    // Process ticker
    executionManager.processTicker(1.0f);
    executionManager.processTicker(1.0f);

    // Should NOT be refueling because it's an empty lane
    assertFalse("Empty lane should not be refueling", executionManager.getIsRefueling()[1]);
    assertEquals(50.0, emptyDriverData.getDriver().getFuelLevel(), 0.001);
  }

  @Test
  public void testRealDriverNamedEmpty() {
    // Create a real driver whose name happens to be "Empty" but has a valid entity ID
    Driver realDriverNamedEmpty = new Driver("Empty", "Speedy", "real_id_123", new ObjectId());
    List<RaceParticipant> mixedParticipants = new ArrayList<>();
    mixedParticipants.add(new RaceParticipant(realDriverNamedEmpty, "rp1"));
    mixedParticipants.add(new RaceParticipant(Driver.EMPTY_DRIVER));

    race =
        new com.antigravity.race.Race.Builder()
            .model(race.getRaceModel())
            .drivers(mixedParticipants)
            .track(track) // 2 lanes
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(2);

    DriverHeatData realDriverData = race.getCurrentHeat().getDrivers().get(0);
    DriverHeatData emptyDriverData = race.getCurrentHeat().getDrivers().get(1);

    // Verify isEmpty() works as expected: false for the real driver named "Empty", true for the
    // actual empty driver
    assertFalse(
        "Real driver named 'Empty' should NOT be considered empty",
        realDriverData.getDriver().getDriver().isEmpty());
    assertTrue(
        "Actual empty driver should be considered empty",
        emptyDriverData.getDriver().getDriver().isEmpty());

    // Record laps for the real driver
    executionManager.onLap(0, 1.0, 1, false, true, false); // Reaction
    boolean lapResult = executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 1

    assertTrue("Lap for real driver named 'Empty' should be accepted", lapResult);
    assertEquals(1, realDriverData.getLapCount());

    // Record lap for actual empty driver (should still be rejected)
    boolean emptyLapResult = executionManager.onLap(1, 5.0, 1, false, true, false);
    assertFalse("Lap for actual empty driver should be rejected", emptyLapResult);
    assertEquals(0, emptyDriverData.getLapCount());
  }

  @Test
  public void testTimeSinceLastLap() {
    executionManager.initialize(2);

    // Initial time is 0
    assertEquals(0.0, executionManager.getTimeSinceLastLap()[0], 0.001);

    // Process ticker 5s
    executionManager.processTicker(5.0f);
    assertEquals(5.0, executionManager.getTimeSinceLastLap()[0], 0.001);

    // Record lap resets time
    executionManager.onLap(0, 1.0, 1, false, true, false); // Reaction
    assertEquals(0.0, executionManager.getTimeSinceLastLap()[0], 0.001);

    // Process ticker 2s
    executionManager.processTicker(2.0f);
    assertEquals(2.0, executionManager.getTimeSinceLastLap()[0], 0.001);

    // Another lap resets time
    executionManager.onLap(0, 10.0, 1, false, true, false); // Lap 1
    assertEquals(0.0, executionManager.getTimeSinceLastLap()[0], 0.001);
  }

  @Test
  public void testFalseStartReactionTimeHandling() {
    executionManager.initialize(2);
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);

    // Set reaction time to 0.0 (simulating false start recorded in Starting state)
    dhd.setReactionTime(0.0);

    // Subsequent lap hit should NOT be treated as reaction time, but as Lap 1
    // In handleLapTime, effectiveLapTime = lapTime + reactionTime = 5.0 + 0.0 = 5.0
    executionManager.onLap(0, 5.0, 1, false, true, false);

    assertEquals(1, dhd.getLapCount());
    assertEquals(5.0, dhd.getLaps().get(0).getLapTime(), 0.001);
    assertEquals(0.0, dhd.getReactionTime(), 0.001); // Should still be 0.0

    // Segments should be accepted now
    executionManager.onSegment(0, 1.2, 1);
    assertEquals(1, dhd.getSegments().size());
  }

  @Test
  public void testDriftLapType() {
    executionManager.initialize(1);
    // Reaction
    executionManager.onLap(0, 1.0, 1, false, true, false);

    // Record a drift lap
    // onLap(int lane, double lapTime, int interfaceId, boolean isWarmup, boolean checkFinish,
    // boolean isDrift)
    executionManager.onLap(0, 5.0, 1, false, true, true);

    DriverHeatData.LapData lapData = race.getCurrentHeat().getDrivers().get(0).getLaps().get(0);
    assertTrue(lapData.isDrift());
  }

  @Test
  public void testHeatEndsWithEmptyLane_AllowFinish() {
    heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            1L, // 1 lap race for quick test
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.Allow);

    List<RaceParticipant> mixedParticipants = new ArrayList<>();
    mixedParticipants.add(
        new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));
    mixedParticipants.add(new RaceParticipant(Driver.EMPTY_DRIVER));

    race =
        new com.antigravity.race.Race.Builder()
            .model(
                new Race.Builder()
                    .withName("Test Race")
                    .withTrackEntityId("track1")
                    .withHeatScoring(heatScoring)
                    .withOverallScoring(new OverallScoring())
                    .withEntityId("race1")
                    .build())
            .drivers(mixedParticipants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(2);

    // Heat starts in Racing state for this test setup usually, but let's force it if needed
    // The executionManager.onLap will call race.changeState()

    // Driver 1 completes 1 lap
    executionManager.onLap(0, 1.0, 1, false, true, false); // Reaction
    executionManager.onLap(0, 5.0, 1, false, true, false); // Lap 1 (Finished)

    // With the fix, the heat should end because active driver count is 1
    assertTrue(
        "Heat should be over because only 1 driver is active", race.getState() instanceof HeatOver);
  }

  @Test
  public void testStartBehindSensorFalseBypassesReactionTime() {
    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withStartBehindSensor(false)
            .withEntityId("race1")
            .build();
    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);

    // First crossing should immediately record a lap (not a reaction time)
    boolean counted = executionManager.onLap(0, 5.0, 1, false, true, false);

    assertTrue("First lap should be counted when startBehindSensor is false", counted);
    assertEquals(1, dhd.getLapCount());
    assertEquals(0.0, dhd.getReactionTime(), 0.001);
    assertEquals(5.0, dhd.getLaps().get(0).getLapTime(), 0.001);
  }

  @Test
  public void testOutOfFuelRejectionAccumulatesTimeAndDoesNotConsumeFuel() {
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0, // usageRate
            100.0,
            10.0,
            2.0,
            5.0 // referenceTime
            );

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withFuelOptions(fuelOptions)
            .withEntityId("race1")
            .withStartBehindSensor(false)
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    RaceParticipant driver = race.getCurrentHeat().getDrivers().get(0).getDriver();
    driver.setFuelLevel(0.0); // Out of fuel!

    // First crossing (should be rejected since out of fuel)
    boolean counted = executionManager.onLap(0, 5.0, 1, false, true, false);
    assertFalse("Lap should be rejected when out of fuel", counted);
    assertEquals(0.0, driver.getFuelLevel(), 0.001); // remains 0
    assertEquals(5.0, race.getCurrentHeat().getDrivers().get(0).getPendingLapTime(), 0.001);

    // Refuel driver to 50.0
    driver.setFuelLevel(50.0);

    // Second crossing (now has fuel, so should be accepted)
    counted = executionManager.onLap(0, 6.0, 1, false, true, false);
    assertTrue("Lap should be counted when fuel is refilled", counted);
    // Lap time should include the rejected time: 5.0 + 6.0 = 11.0s
    assertEquals(
        11.0, race.getCurrentHeat().getDrivers().get(0).getLaps().get(0).getLapTime(), 0.001);

    // Fuel consumption should ONLY be calculated for the accepted crossing (6.0s), NOT the 5.0s
    // out-of-fuel crossing.
    // LINEAR: refL = 5.0, x1 = 10.0, y1 = 2.0, x2 = 5.0, y2 = 4.0, m = -0.4, b = 6.0
    // For 6.0s racingTime: lapFuelUsed = -0.4 * 6.0 + 6.0 = 3.6
    // Expected remaining fuel: 50.0 - 3.6 = 46.4
    assertEquals(46.4, driver.getFuelLevel(), 0.001);
  }

  @Test
  public void testTeamLimitsRejectionAccumulatesTimeAndConsumesFuel() {
    // 1 lap limit in heat
    TeamOptions teamOptions = new TeamOptions(1, 0.0, 0, 0.0, false);
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0, // usageRate
            100.0,
            10.0,
            2.0,
            5.0 // referenceTime
            );

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withTeamOptions(teamOptions)
            .withFuelOptions(fuelOptions)
            .withEntityId("race1")
            .withStartBehindSensor(false)
            .build();

    Team mockTeam = new Team("Team A", null, null, "t1", new ObjectId());
    RaceParticipant teamParticipant = new RaceParticipant(mockTeam);
    participants.clear();
    participants.add(teamParticipant);

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    driverData.setActualDriver(new Driver("1A", "1A", "sd1", new ObjectId()));
    driverData.getDriver().setFuelLevel(100.0);

    // First crossing (accepted, counts as lap 1)
    boolean counted = executionManager.onLap(0, 5.0, 1, false, true, false);
    assertTrue("First lap should be counted", counted);
    assertEquals(96.0, driverData.getDriver().getFuelLevel(), 0.001); // consumes 4.0 fuel

    // Second crossing (exceeds team limit of 1 lap, so rejected, but should consume fuel)
    counted = executionManager.onLap(0, 5.0, 1, false, true, false);
    assertFalse("Second lap should be rejected due to team limits", counted);
    // Consumes another 4.0 fuel: 96.0 - 4.0 = 92.0
    assertEquals(92.0, driverData.getDriver().getFuelLevel(), 0.001);
    assertEquals(5.0, driverData.getPendingLapTime(), 0.001);

    // Third crossing, but with ignoreTeamLimits = true (like when driver is swapped or ignore check
    // is active)
    counted = executionManager.onLap(0, 6.0, 1, true, true, false);
    assertTrue("Lap should be counted when ignoreTeamLimits is true", counted);
    // Total lap time should include the rejected time: 5.0 + 6.0 = 11.0s
    assertEquals(11.0, driverData.getLaps().get(1).getLapTime(), 0.001);
    // Fuel consumption should ONLY be for 6.0s (not the 5.0s which already consumed fuel)
    // 92.0 - 3.6 = 88.4
    assertEquals(88.4, driverData.getDriver().getFuelLevel(), 0.001);
  }

  @Test
  public void testMinLapTimeCheckDoesNotCountOutOfFuelRejectionTime() {
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0, // usageRate
            100.0,
            10.0,
            2.0,
            5.0 // referenceTime
            );

    double minLapTime = 3.0;

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withFuelOptions(fuelOptions)
            .withMinLapTime(minLapTime)
            .withEntityId("race1")
            .withStartBehindSensor(false)
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    RaceParticipant driver = race.getCurrentHeat().getDrivers().get(0).getDriver();
    driver.setFuelLevel(0.0); // Out of fuel!

    // First crossing - rejected due to out of fuel (takes 5.0s, which is > minLapTime 3.0)
    boolean counted = executionManager.onLap(0, 5.0, 1, false, true, false);
    assertFalse("Lap should be rejected when out of fuel", counted);
    assertEquals(5.0, race.getCurrentHeat().getDrivers().get(0).getPendingLapTime(), 0.001);

    // Refuel driver
    driver.setFuelLevel(50.0);

    // Second crossing - a very fast trigger (0.5s) below minLapTime of 3.0s.
    // Since the previous rejection time (5.0s) should NOT count for min lap check,
    // this 0.5s crossing should be rejected as a minimum lap time violation.
    counted = executionManager.onLap(0, 0.5, 1, false, true, false);
    assertFalse("Subsequent fast lap should be rejected by min lap time check", counted);

    // The pending lap time is now accumulated: 5.0s + 0.5s = 5.5s
    assertEquals(5.5, race.getCurrentHeat().getDrivers().get(0).getPendingLapTime(), 0.001);

    // Third crossing - 4.0s (which is >= minLapTime 3.0s). Should be accepted!
    counted = executionManager.onLap(0, 4.0, 1, false, true, false);
    assertTrue("Third lap should be counted as it meets min lap time", counted);
    // Total lap time should include all pending times: 5.0 + 0.5 + 4.0 = 9.5s
    assertEquals(
        9.5, race.getCurrentHeat().getDrivers().get(0).getLaps().get(0).getLapTime(), 0.001);
  }

  @Test
  public void testMinLapTimeCheckDoesNotCountTeamLimitsRejectionTime() {
    TeamOptions teamOptions = new TeamOptions(1, 0.0, 0, 0.0, false); // 1 lap limit in heat
    double minLapTime = 3.0;

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withTeamOptions(teamOptions)
            .withMinLapTime(minLapTime)
            .withEntityId("race1")
            .withStartBehindSensor(false)
            .build();

    Team mockTeam = new Team("Team A", null, null, "t1", new ObjectId());
    RaceParticipant teamParticipant = new RaceParticipant(mockTeam);
    participants.clear();
    participants.add(teamParticipant);

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    driverData.setActualDriver(new Driver("1A", "1A", "sd1", new ObjectId()));

    // First crossing (accepted, counts as lap 1)
    boolean counted = executionManager.onLap(0, 5.0, 1, false, true, false);
    assertTrue("First lap should be counted", counted);

    // Second crossing (takes 5.0s, exceeds team limit of 1 lap, so rejected)
    counted = executionManager.onLap(0, 5.0, 1, false, true, false);
    assertFalse("Second lap should be rejected due to team limits", counted);
    assertEquals(5.0, driverData.getPendingLapTime(), 0.001);

    // Third crossing - a fast trigger (0.5s) below minLapTime of 3.0s (even with ignoreTeamLimits =
    // true).
    // The previous rejected time (5.0s) should NOT count for min lap check, so it should be
    // rejected.
    counted = executionManager.onLap(0, 0.5, 1, true, true, false);
    assertFalse("Fast crossing should be rejected by min lap check", counted);
    assertEquals(5.5, driverData.getPendingLapTime(), 0.001);

    // Fourth crossing - 4.0s (meets min lap time, ignoreTeamLimits = true). Should be accepted!
    counted = executionManager.onLap(0, 4.0, 1, true, true, false);
    assertTrue("Fourth lap should be counted", counted);
    // Total lap time: 5.0 + 0.5 + 4.0 = 9.5s
    assertEquals(9.5, driverData.getLaps().get(1).getLapTime(), 0.001);
  }

  @Test
  public void testMinLapTimeCheckedBeforeOutOfFuelAndTeamLimits() {
    // 1. Test Out of Fuel precedence
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0, // usageRate
            100.0,
            10.0,
            2.0,
            5.0 // referenceTime
            );

    double minLapTime = 3.0;

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withFuelOptions(fuelOptions)
            .withMinLapTime(minLapTime)
            .withEntityId("race1")
            .withStartBehindSensor(false)
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    RaceParticipant driver = race.getCurrentHeat().getDrivers().get(0).getDriver();
    driver.setFuelLevel(0.0); // Out of fuel!

    // First crossing: 0.5s. If minLapTime check is first, this is rejected as MIN_LAP_TIME, not
    // OUT_OF_FUEL.
    // This means it is NOT excluded from the next lap's min check time.
    boolean counted = executionManager.onLap(0, 0.5, 1, false, true, false);
    assertFalse("Lap below minLapTime should be rejected", counted);

    // Refuel driver
    driver.setFuelLevel(50.0);

    // Second crossing: 2.6s.
    // Since the previous 0.5s crossing was rejected as MIN_LAP_TIME (not excluded),
    // the min check time is 0.5s + 2.6s = 3.1s, which is >= minLapTime (3.0s).
    // Thus it should be accepted.
    counted = executionManager.onLap(0, 2.6, 1, false, true, false);
    assertTrue(
        "Second crossing should be counted because first crossing time was accumulated", counted);
    assertEquals(
        3.1, race.getCurrentHeat().getDrivers().get(0).getLaps().get(0).getLapTime(), 0.001);

    // 2. Test Team Limits precedence
    TeamOptions teamOptions = new TeamOptions(1, 0.0, 0, 0.0, false); // 1 lap limit in heat
    raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withTeamOptions(teamOptions)
            .withMinLapTime(minLapTime)
            .withEntityId("race1")
            .withStartBehindSensor(false)
            .build();

    Team mockTeam = new Team("Team A", null, null, "t1", new ObjectId());
    RaceParticipant teamParticipant = new RaceParticipant(mockTeam);
    participants.clear();
    participants.add(teamParticipant);

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    driverData.setActualDriver(new Driver("1A", "1A", "sd1", new ObjectId()));

    // First crossing (accepted, counts as lap 1 - team limit is now reached)
    counted = executionManager.onLap(0, 5.0, 1, false, true, false);
    assertTrue("First lap should be counted", counted);

    // Second crossing: 0.5s.
    // Since team limits are exceeded, but minLapTime check is first, this is rejected as
    // MIN_LAP_TIME.
    // So the 0.5s is NOT excluded.
    counted = executionManager.onLap(0, 0.5, 1, false, true, false);
    assertFalse("Crossing below minLapTime should be rejected as MIN_LAP_TIME", counted);

    // Third crossing: 2.6s, with ignoreTeamLimits = true.
    // Since the previous 0.5s crossing was NOT excluded, minCheckTime = 0.5s + 2.6s = 3.1s >= 3.0s.
    // Since ignoreTeamLimits is true, this should be accepted.
    counted = executionManager.onLap(0, 2.6, 1, true, true, false);
    assertTrue(
        "Third crossing should be counted because second crossing time was accumulated", counted);
    assertEquals(3.1, driverData.getLaps().get(1).getLapTime(), 0.001);
  }
}
