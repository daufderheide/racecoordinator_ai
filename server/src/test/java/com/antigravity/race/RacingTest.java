package com.antigravity.race;

import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.*;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RacingTest {

  private com.antigravity.race.Race race;
  private HeatScoring heatScoring;
  private List<RaceParticipant> participants;
  private Track track;

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
        new Track(
            "Test Track",
            lanes,
            Collections.singletonList(mock(ArduinoConfig.class)),
            "track1",
            new ObjectId());

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
  }

  @After
  public void tearDown() {
    if (race != null && race.getState() != null) {
      try {
        race.getState().exit(race);
      } catch (Exception e) {
        // Ignore
      }
    }
  }

  @Test
  public void testRacingDelegation_EndsHeatOnLaps() {
    Racing racing = new Racing();
    race.changeState(racing);

    // Driver 1 completes 3rd lap (limit is 3)
    racing.onLap(0, 1.0, 1, false); // Reaction
    racing.onLap(0, 5.0, 1, false); // Lap 1
    racing.onLap(0, 5.0, 1, false); // Lap 2
    racing.onLap(0, 5.0, 1, false); // Lap 3 (Finished)
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testTimedRace_NoAllowFinish_EndsOnTime() throws InterruptedException {
    heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            1L, // 1 second
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);

    race =
        new com.antigravity.race.Race.Builder()
            .model(
                new Race.Builder()
                    .withName("Test Race")
                    .withTrackEntityId("track1")
                    .withHeatScoring(heatScoring)
                    .withOverallScoring(race.getRaceModel().getOverallScoring())
                    .withEntityId("race1")
                    .build())
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();

    Racing racing = new Racing();
    race.changeState(racing);
    racing.enter(race);

    // Wait for ticker to expire time (ticker runs every 100ms)
    Thread.sleep(1500);

    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testPerLanePowerOffOnFinish() {
    Racing racing = new Racing();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    Race mockModel = mock(Race.class);
    HeatScoring allowFinishScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.Allow);

    when(mockRace.getRaceModel()).thenReturn(mockModel);
    when(mockModel.getHeatScoring()).thenReturn(allowFinishScoring);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
    when(mockRace.getState()).thenReturn(racing);
    Track mockTrack = mock(Track.class);
    when(mockRace.getTrack()).thenReturn(mockTrack);

    // Mock Heat and Drivers
    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());
    HeatStandings mockStandings = mock(HeatStandings.class);
    when(mockHeat.getHeatStandings()).thenReturn(mockStandings);

    // Use the real manager from the race if it's not a mock,
    // but here mockRace is a mock, so we need to provide a manager that works.
    // Let's use a real one but point it to the mock race.
    HeatExecutionManager realManager = new HeatExecutionManager(mockRace);
    realManager.initialize(2);
    when(mockRace.getHeatExecutionManager()).thenReturn(realManager);

    // We need real participants for the constructor
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(0)));
    drivers.add(new DriverHeatData(participants.get(1)));
    when(mockHeat.getDrivers()).thenReturn(drivers);
    when(mockHeat.getActiveDriverCount()).thenReturn(2);

    // Setup manager mock behavior indirectly by using a real one on a mock race?
    // Actually, Racing.enter(race) creates its own manager.
    // So we just need to verify it calls setLanePower(false, 0)
    racing.enter(mockRace);

    // Driver 1 completes 3 laps
    racing.onLap(0, 1.0, 1, false); // Reaction
    racing.onLap(0, 5.0, 1, false); // Lap 1
    racing.onLap(0, 5.0, 1, false); // Lap 2
    racing.onLap(0, 5.0, 1, false); // Lap 3 (Finish)

    verify(mockRace).setLanePower(false, 0);
  }

  @Test
  public void testOnCarData_BroadcastsRefuelingState() {
    Racing racing = new Racing();
    race.changeState(racing);

    // Set refueling state in race
    race.getHeatExecutionManager().getIsRefueling()[0] = true;

    CarData carData =
        new CarData(0, 1.0, 0.5, 0.5, false, CarLocation.PitRow, CarLocation.PitRow, -1);

    // Mock broadcast tracker or just verify it doesn't crash
    racing.onCarData(carData);

    // We'd ideally verify the broadcast message contains setRefueling(true)
  }

  @Test
  public void testRefuelingStateChange_CallsRaceSetRefueling() throws InterruptedException {
    Racing racing = new Racing();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);
    when(mockModel.getHeatScoring()).thenReturn(new HeatScoring());
    when(mockRace.getState()).thenReturn(racing);
    when(mockRace.getTrack()).thenReturn(mock(Track.class));

    HeatExecutionManager manager = new HeatExecutionManager(mockRace);
    manager.initialize(2);
    when(mockRace.getHeatExecutionManager()).thenReturn(manager);

    Track mockTrack = mock(Track.class);
    when(mockRace.getTrack()).thenReturn(mockTrack);
    when(mockTrack.getLanes())
        .thenReturn(Arrays.asList(new Lane("red", "black", 100), new Lane("blue", "black", 100)));

    racing.enter(mockRace);

    // Simulate refueling start for Lane 0
    manager.getIsRefueling()[0] = true;

    // Wait for ticker (runs every 100ms)
    Thread.sleep(300);

    verify(mockRace).setRefueling(0, true);

    // Simulate refueling stop
    manager.getIsRefueling()[0] = false;
    Thread.sleep(300);

    verify(mockRace).setRefueling(0, false);

    racing.exit(mockRace);
  }

  @Test
  public void testFuelLevelChange_CallsRaceSetFuelLevel() throws InterruptedException {
    Racing racing = new Racing();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);
    when(mockModel.getHeatScoring()).thenReturn(new HeatScoring());
    when(mockRace.getState()).thenReturn(racing);
    when(mockRace.getTrack()).thenReturn(mock(Track.class));

    // Analog fuel options with capacity 100
    com.antigravity.models.AnalogFuelOptions fuelOptions =
        new com.antigravity.models.AnalogFuelOptions(
            true, // enabled
            false, // resetFuelAtHeatStart
            false, // endHeatOnOutOfFuel
            100.0, // capacity
            null, // usageType (defaults to LINEAR)
            4.0, // usageRate
            100.0, // startLevel
            10.0, // refuelRate
            2.0, // pitStopDelay
            6.0 // referenceTime
            );
    when(mockModel.getFuelOptions()).thenReturn(fuelOptions);

    HeatExecutionManager manager = new HeatExecutionManager(mockRace);
    manager.initialize(2);
    when(mockRace.getHeatExecutionManager()).thenReturn(manager);

    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(0)));
    drivers.add(new DriverHeatData(participants.get(1)));
    when(mockHeat.getDrivers()).thenReturn(drivers);

    Track mockTrack = mock(Track.class);
    when(mockRace.getTrack()).thenReturn(mockTrack);
    when(mockTrack.getLanes())
        .thenReturn(Arrays.asList(new Lane("red", "black", 100), new Lane("blue", "black", 100)));
    when(mockTrack.hasDigitalFuel()).thenReturn(false);

    racing.enter(mockRace);

    // Simulate fuel level change for Lane 0
    drivers.get(0).getDriver().setFuelLevel(50.0); // 50%

    // Wait for ticker (runs every 100ms)
    Thread.sleep(300);

    verify(mockRace).setFuelLevel(0, 50);

    // Simulate another change
    drivers.get(0).getDriver().setFuelLevel(25.0); // 25%
    Thread.sleep(300);

    verify(mockRace).setFuelLevel(0, 25);
    racing.exit(mockRace);
  }

  @Test
  public void testTickerBroadcastsFlagChanges() throws InterruptedException {
    Racing racing = new Racing();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());

    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);
    when(mockRace.getState()).thenReturn(racing);
    when(mockRace.getTrack()).thenReturn(mock(Track.class));

    // 3 lap race
    HeatScoring scoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.Allow);
    when(mockModel.getHeatScoring()).thenReturn(scoring);

    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

    DriverHeatData d1 = new DriverHeatData(participants.get(0));
    when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

    HeatExecutionManager manager = new HeatExecutionManager(mockRace);
    manager.initialize(1);
    when(mockRace.getHeatExecutionManager()).thenReturn(manager);

    racing.enter(mockRace);

    // Should broadcast GREEN initially (or within first tick)
    Thread.sleep(200);
    verify(mockRace).broadcastFlag(com.antigravity.proto.RaceFlag.GREEN);

    // Advance to 2nd lap (limit 3) -> Should be WHITE flag
    d1.addLap(1.0, false);
    d1.addLap(1.0, false); // Now 2 laps
    Thread.sleep(200);
    verify(mockRace).broadcastFlag(com.antigravity.proto.RaceFlag.WHITE);

    // Advance to 3rd lap -> Should be CHECKERED flag
    d1.addLap(1.0, false); // Now 3 laps
    Thread.sleep(200);
    verify(mockRace).broadcastFlag(com.antigravity.proto.RaceFlag.CHECKERED);

    racing.exit(mockRace);
  }

  @Test
  public void testTimedRace_CheckeredFlagAtCounterZero_WithAllowFinish() {
    Racing racing = new Racing();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());

    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);

    // Timed race with allowFinish enabled
    HeatScoring scoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60L, // 60 seconds
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.Allow);
    when(mockModel.getHeatScoring()).thenReturn(scoring);

    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

    DriverHeatData d1 = new DriverHeatData(participants.get(0));
    when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

    // Mock execution manager to avoid NullPointerException
    HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
    when(mockExecutionManager.getFinishedLanes()).thenReturn(new java.util.HashSet<>());
    when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);

    // Set race time to 0 (counter reached 0)
    when(mockRace.getRaceTime()).thenReturn(0.0f);

    // Call enter to initialize executionManager in Racing state
    racing.enter(mockRace);

    com.antigravity.proto.RaceFlag flag = racing.getFlagType(mockRace);
    assertTrue(flag == com.antigravity.proto.RaceFlag.CHECKERED);
  }

  @Test
  public void testTimedRace_NoCheckeredFlagBeforeCounterZero_WithAllowFinish() {
    Racing racing = new Racing();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());

    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);

    // Timed race with allowFinish enabled
    HeatScoring scoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60L, // 60 seconds
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.Allow);
    when(mockModel.getHeatScoring()).thenReturn(scoring);

    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

    DriverHeatData d1 = new DriverHeatData(participants.get(0));
    when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

    // Mock execution manager to avoid NullPointerException
    HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
    when(mockExecutionManager.getFinishedLanes()).thenReturn(new java.util.HashSet<>());
    when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);

    // Set race time to positive value (counter not reached 0 yet)
    when(mockRace.getRaceTime()).thenReturn(30.0f);

    // Call enter to initialize executionManager in Racing state
    racing.enter(mockRace);

    com.antigravity.proto.RaceFlag flag = racing.getFlagType(mockRace);
    assertTrue(flag == com.antigravity.proto.RaceFlag.GREEN);
  }

  @Test
  public void testTimedRace_NoCheckeredFlagAtCounterZero_WithoutAllowFinish() {
    Racing racing = new Racing();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());

    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);

    // Timed race with allowFinish disabled
    HeatScoring scoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60L, // 60 seconds
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);
    when(mockModel.getHeatScoring()).thenReturn(scoring);

    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

    DriverHeatData d1 = new DriverHeatData(participants.get(0));
    when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

    // Set race time to 0 (counter reached 0)
    when(mockRace.getRaceTime()).thenReturn(0.0f);

    com.antigravity.proto.RaceFlag flag = racing.getFlagType(mockRace);
    assertTrue(flag == com.antigravity.proto.RaceFlag.GREEN);
  }

  @Test
  public void testEnter_TurnsOnMainPower() {
    Racing racing = new Racing();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);
    when(mockModel.getHeatScoring()).thenReturn(new HeatScoring());
    when(mockRace.getState()).thenReturn(racing);
    when(mockRace.getTrack()).thenReturn(mock(Track.class));

    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

    HeatExecutionManager manager = new HeatExecutionManager(mockRace);
    manager.initialize(2);
    when(mockRace.getHeatExecutionManager()).thenReturn(manager);

    racing.enter(mockRace);

    verify(mockRace).broadcastFlag(com.antigravity.proto.RaceFlag.GREEN);
  }

  @Test
  public void testFalseStartTimePenaltyProcessing() throws InterruptedException {
    Racing racing = new Racing();

    // Create a real race model
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withEntityId("race1")
            .withHeatScoring(new HeatScoring())
            .build();

    // Create a real race object
    com.antigravity.race.Race realRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .track(track)
            .drivers(participants)
            .isDemoMode(true)
            .build();

    // Setup DriverHeatData with penalty
    DriverHeatData d1 = realRace.getCurrentHeat().getDrivers().get(0);
    d1.setRemainingFalseStartTimePenalty(0.2);

    realRace.changeState(racing);

    // Initial check: Power should be OFF for lane 0 (called during enter via
    // initializeFalseStartTimePenalties)
    assertTrue("Power should be OFF for lane 0 initially", !realRace.isLanePower(0));

    // Wait for penalty to expire (0.2s penalty should expire in ~3-4 ticks)
    // and for power to be turned back ON
    long start = System.currentTimeMillis();
    while ((d1.getRemainingFalseStartTimePenalty() > 0 || !realRace.isLanePower(0))
        && (System.currentTimeMillis() - start) < 5000) {
      Thread.sleep(50);
    }

    // After expiry, power should be ON
    assertTrue("Power should be ON for lane 0 after penalty expires", realRace.isLanePower(0));

    realRace.stop();
  }

  @Test
  public void testLaneFlagDuringPenalty() throws InterruptedException {
    Racing racing = new Racing();
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withEntityId("race1")
            .withHeatScoring(new HeatScoring())
            .build();

    com.antigravity.race.Race realRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .track(track)
            .drivers(participants)
            .isDemoMode(true)
            .build();

    DriverHeatData d1 = realRace.getCurrentHeat().getDrivers().get(0);
    d1.setRemainingFalseStartTimePenalty(0.2);

    realRace.changeState(racing);
    racing.enter(realRace);

    // Flag should be BLACK during penalty
    assertTrue(
        "Lane flag should be BLACK during penalty",
        racing.getLaneFlagType(realRace, 0) == com.antigravity.proto.RaceFlag.BLACK);

    // Wait for penalty to expire
    long start = System.currentTimeMillis();
    while (d1.getRemainingFalseStartTimePenalty() > 0
        && (System.currentTimeMillis() - start) < 2000) {
      Thread.sleep(100);
    }

    // Flag should be GREEN (base flag) after penalty
    assertTrue(
        "Lane flag should be GREEN after penalty expires",
        racing.getLaneFlagType(realRace, 0) == com.antigravity.proto.RaceFlag.GREEN);

    realRace.stop();
  }

  @Test
  public void testLaneFlagDuringLowFuel() {
    Racing racing = new Racing();

    // Analog fuel options
    com.antigravity.models.AnalogFuelOptions fuelOptions =
        new com.antigravity.models.AnalogFuelOptions(
            true, // enabled
            false, false, 100.0, null, 4.0, 100.0, 10.0, 2.0, 6.0);

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withEntityId("race1")
            .withHeatScoring(new HeatScoring())
            .withFuelOptions(fuelOptions)
            .build();

    com.antigravity.race.Race realRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .track(track)
            .drivers(participants)
            .isDemoMode(true)
            .build();

    DriverHeatData d1 = realRace.getCurrentHeat().getDrivers().get(0);
    d1.getDriver().setFuelLevel(0.0);

    realRace.changeState(racing);
    // Note: getLaneFlagType uses HeatExecutionManager to check if fuel is enabled
    // The manager is initialized during enter() or set manually.
    // IRaceState.getLaneFlagType checks:
    // race.getHeatExecutionManager().isAnalogFuelEnabled()

    assertTrue(
        "Lane flag should be BLACK when fuel is 0",
        racing.getLaneFlagType(realRace, 0) == com.antigravity.proto.RaceFlag.BLACK);

    // Set fuel back
    d1.getDriver().setFuelLevel(50.0);
    assertTrue(
        "Lane flag should be GREEN when fuel is recovered",
        racing.getLaneFlagType(realRace, 0) == com.antigravity.proto.RaceFlag.GREEN);

    realRace.stop();
  }
}
