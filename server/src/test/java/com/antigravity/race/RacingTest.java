package com.antigravity.race;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;
import org.junit.After;

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

public class RacingTest {

  private Race race;
  private HeatScoring heatScoring;
  private List<RaceParticipant> participants;
  private Track track;

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

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Test Race",
        "track1",
        HeatRotationType.RoundRobin,
        heatScoring,
        overallScoring,
        "race1",
        new ObjectId());

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));
    participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", new ObjectId()), "p2"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "black", 100));
    track = new Track("Test Track", lanes, java.util.Collections.singletonList(mock(ArduinoConfig.class)), "track1",
        new ObjectId());

    race = new Race(raceModel, participants, track, true);
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
  public void testLapRace_NoAllowFinish_EndsOnFirstDriver() {
    Racing racing = new Racing();
    race.changeState(racing);

    // Driver 1 completes 1 lap
    racing.onLap(0, 1.0, 1); // Reaction
    racing.onLap(0, 5.0, 1); // Lap 1
    racing.onLap(0, 5.0, 1); // Lap 2
    assertFalse(race.getState() instanceof HeatOver);

    // Driver 1 completes 3rd lap (limit is 3)
    racing.onLap(0, 5.0, 1);
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testLapRace_AllowFinish_EndsOnLastDriver() {
    // Update scoring to Allow Finish
    com.antigravity.models.Race model = race.getRaceModel();
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        3L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.Allow);
    // We can't easily change the model since it's immutable-ish in the constructor
    // but let's re-create race for this test or use reflection if needed.
    // Actually, let's just create a new race here.
    race = new Race(new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring,
        model.getOverallScoring(), "race1", new ObjectId()),
        participants, track, true);

    Racing racing = new Racing();
    race.changeState(racing);

    // Driver 1 completes 3 laps
    racing.onLap(0, 1.0, 1); // Reaction
    racing.onLap(0, 5.0, 1); // Lap 1
    racing.onLap(0, 5.0, 1); // Lap 2
    racing.onLap(0, 5.0, 1); // Lap 3 (Finished)
    assertFalse(race.getState() instanceof HeatOver);

    // Driver 1 tries to do another lap - should be ignored and NOT end the heat
    int initialLapCount = race.getCurrentHeat().getDrivers().get(0).getLapCount();
    racing.onLap(0, 5.0, 1);
    assertEquals(initialLapCount, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    assertFalse(race.getState() instanceof HeatOver);

    // Driver 2 completes 3 laps
    racing.onLap(1, 1.0, 1); // Reaction
    racing.onLap(1, 5.0, 1); // Lap 1
    racing.onLap(1, 5.0, 1); // Lap 2
    racing.onLap(1, 5.0, 1); // Lap 3 (Finished)
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testTimedRace_NoAllowFinish_EndsOnTime() throws InterruptedException {
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Timed,
        1L, // 1 second
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);

    race = new Race(new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring,
        race.getRaceModel().getOverallScoring(), "race1", new ObjectId()),
        participants, track, true);

    Racing racing = new Racing();
    race.changeState(racing);

    // Wait for time to expire in the ticker (ticker runs every 100ms)
    Thread.sleep(1500);

    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testTimedRace_AllowFinish_EndsOnLapsAfterTime() throws InterruptedException {
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Timed,
        1L, // 1 second
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.Allow);

    race = new Race(new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring,
        race.getRaceModel().getOverallScoring(), "race1", new ObjectId()),
        participants, track, true);

    // Enter Racing state manually and start ticker
    Racing racing = new Racing();
    race.changeState(racing);
    racing.enter(race);

    // Wait for time to expire
    Thread.sleep(1500);
    assertFalse(race.getState() instanceof HeatOver);

    // Driver 1 crosses line
    racing.onLap(0, 1.0, 1); // Reaction
    racing.onLap(0, 5.0, 1); // First lap after time expired
    assertFalse(race.getState() instanceof HeatOver);

    // Driver 2 crosses line
    racing.onLap(1, 1.0, 1); // Reaction
    racing.onLap(1, 5.0, 1); // First lap after time expired
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testMinLapTime_AccumulatesLaps() {
    double minLapTime = 10.0;
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        3L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);

    race = new Race(new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring,
        race.getRaceModel().getOverallScoring(), minLapTime, "race1", new ObjectId()),
        participants, track, true);

    Racing racing = new Racing();
    race.changeState(racing);

    // Initial state: 0 laps
    assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());

    // Reaction time
    racing.onLap(0, 1.0, 1);

    // Lap 1: 4.0s (accumulated: 4.0s) - below min 10.0s
    racing.onLap(0, 4.0, 1);
    assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());

    // Lap 2: 7.0s (accumulated: 11.0s) - above min 10.0s
    racing.onLap(0, 7.0, 1);
    assertEquals(1, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    // The lap time should be 12.0s (1.0s reaction + 4.0s + 7.0s accumulated)
    assertEquals(12.0, race.getCurrentHeat().getDrivers().get(0).getLaps().get(0).getLapTime(), 0.001);

    // Lap 3: 12.0s (accumulated: 12.0s) - above min 10.0s
    racing.onLap(0, 12.0, 1);
    assertEquals(2, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    assertEquals(12.0, race.getCurrentHeat().getDrivers().get(0).getLaps().get(1).getLapTime(), 0.001);
  }

  @Test
  public void testPerLanePowerOffOnFinish() {
    Racing racing = new Racing();
    Race mockRace = mock(Race.class);
    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    HeatScoring allowFinishScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        3L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.Allow);

    when(mockRace.getRaceModel()).thenReturn(mockModel);
    when(mockModel.getHeatScoring()).thenReturn(allowFinishScoring);

    // Mock Heat and Drivers
    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    HeatStandings mockStandings = mock(HeatStandings.class);
    when(mockHeat.getHeatStandings()).thenReturn(mockStandings);

    List<DriverHeatData> drivers = new ArrayList<>();
    DriverHeatData driver1 = new DriverHeatData(participants.get(0));
    DriverHeatData driver2 = new DriverHeatData(participants.get(1));
    drivers.add(driver1);
    drivers.add(driver2);
    when(mockHeat.getDrivers()).thenReturn(drivers);

    racing.enter(mockRace);

    // Driver 1 completes 3 laps (limit is 3)
    racing.onLap(0, 1.0, 1); // Reaction
    racing.onLap(0, 5.0, 1); // Lap 1
    racing.onLap(0, 5.0, 1); // Lap 2

    // This lap should trigger finish and setLanePower(false, 0) because driver 2 is
    // still racing
    racing.onLap(0, 5.0, 1); // Lap 3 (Finish)

    org.mockito.Mockito.verify(mockRace).setLanePower(false, 0);
    // Heat should NOT have ended yet
    org.mockito.Mockito.verify(mockRace, org.mockito.Mockito.never()).changeState(org.mockito.ArgumentMatchers.any());
  }

  @Test
  public void testFuelConsumption_Linear() {
    com.antigravity.models.AnalogFuelOptions fuelOptions = new com.antigravity.models.AnalogFuelOptions(
        true, false, false, 100.0, com.antigravity.models.AnalogFuelOptions.FuelUsageType.LINEAR, 4.0, 100.0, 10.0, 2.0,
        5.0);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring, null,
        new OverallScoring(), 0.0, fuelOptions, null, "race1", new ObjectId());

    race = new Race(raceModel, participants, track, true);

    // Set initial fuel level
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(100.0);

    Racing racing = new Racing();
    race.changeState(racing);

    // Reaction
    racing.onLap(0, 1.0, 1);

    // Lap time exactly equal to reference time (5.0s) should use exactly the
    // usageRate (4.0)
    racing.onLap(0, 5.0, 1);

    assertEquals(96.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
  }

  @Test
  public void testFuelConsumption_Quadratic() {
    com.antigravity.models.AnalogFuelOptions fuelOptions = new com.antigravity.models.AnalogFuelOptions(
        true, false, false, 100.0, com.antigravity.models.AnalogFuelOptions.FuelUsageType.QUADRATIC, 4.0, 100.0, 10.0,
        2.0, 5.0);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring, null,
        new OverallScoring(), 0.0, fuelOptions, null, "race1", new ObjectId());

    race = new Race(raceModel, participants, track, true);

    // Set initial fuel level
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(100.0);

    Racing racing = new Racing();
    race.changeState(racing);

    // Reaction
    racing.onLap(0, 1.0, 1);

    // Lap time 2.5s (half of reference). Logic: usageRate * (ref^2) / (lap^2) = 4.0
    // * 25 / 6.25 = 16.0 fuel used.
    racing.onLap(0, 2.5, 1);

    assertEquals(100.0 - 16.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
  }

  @Test
  public void testFuelConsumption_Cubic() {
    com.antigravity.models.AnalogFuelOptions fuelOptions = new com.antigravity.models.AnalogFuelOptions(
        true, false, false, 100.0, com.antigravity.models.AnalogFuelOptions.FuelUsageType.CUBIC, 4.0, 100.0, 10.0, 2.0,
        5.0);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring, null,
        new OverallScoring(), 0.0, fuelOptions, null, "race1", new ObjectId());

    race = new Race(raceModel, participants, track, true);

    // Set initial fuel level
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(100.0);

    Racing racing = new Racing();
    race.changeState(racing);

    // Reaction
    racing.onLap(0, 1.0, 1);

    // Lap time 10.0s (double reference time). Logic: usageRate * (ref^3) / (lap^3)
    // = 4.0 * 125 / 1000 = 0.5 fuel used.
    racing.onLap(0, 10.0, 1);

    assertEquals(100.0 - 0.5, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
  }

  @Test
  public void testOnSegmentHandling() {
    Racing racing = new Racing();
    race.changeState(racing);

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);

    // Segments are ignored before reaction time is set (via onLap)
    racing.onSegment(0, 1.2, 1);
    assertEquals(0.0, driverData.getReactionTime(), 0.001);
    assertEquals(0, driverData.getSegments().size());

    // First lap hit sets reaction time
    racing.onLap(0, 1.5, 1);
    assertEquals(1.5, driverData.getReactionTime(), 0.001);
    assertEquals(0, driverData.getSegments().size());

    // Subsequent segments are added
    racing.onSegment(0, 5.0, 1);
    assertEquals(1, driverData.getSegments().size());
    assertEquals(5.0, driverData.getSegments().get(0), 0.001);

    // Another segment
    racing.onSegment(0, 5.5, 1);
    assertEquals(2, driverData.getSegments().size());
    assertEquals(5.5, driverData.getSegments().get(1), 0.001);

    // Lap resets segments
    racing.onLap(0, 10.0, 1);
    assertEquals(1, driverData.getLapCount());
    assertEquals(0, driverData.getSegments().size());
  }

  @Test
  public void testMultipleSegmentsAndInterfaceIds() {
    Racing racing = new Racing();
    race.changeState(racing);
    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);

    // Initial lap to set reaction/start time
    racing.onLap(0, 1.0, 1);

    // Multiple segments with different interface IDs
    racing.onSegment(0, 5.0, 101);
    racing.onSegment(0, 5.5, 102);
    racing.onSegment(0, 6.0, 103);

    assertEquals(3, driverData.getSegments().size());
    assertEquals(5.0, driverData.getSegments().get(0), 0.001);
    assertEquals(5.5, driverData.getSegments().get(1), 0.001);
    assertEquals(6.0, driverData.getSegments().get(2), 0.001);
  }

  @Test
  public void testSegmentsIgnoredAfterHeatFinish() {
    Racing racing = new Racing();
    race.changeState(racing);
    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);

    // Complete the race (3 laps)
    racing.onLap(0, 1.0, 1); // Reaction
    racing.onLap(0, 5.0, 1); // Lap 1
    racing.onLap(0, 5.0, 1); // Lap 2
    racing.onLap(0, 5.0, 1); // Lap 3 (Finish)

    assertTrue(race.getState() instanceof HeatOver);

    // Segment arriving after finish should be ignored
    racing.onSegment(0, 2.0, 101);
    assertEquals(0, driverData.getSegments().size());
  }

  @Test
  public void testDigitalFuelConsumption() {
    com.antigravity.models.DigitalFuelOptions fuelOptions = new com.antigravity.models.DigitalFuelOptions(
        true, false, false, 100.0, com.antigravity.models.FuelOptions.FuelUsageType.LINEAR, 10.0, 100.0, 10.0, 5.0);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring, null,
        new OverallScoring(), 0.0, null, fuelOptions, "race1", new ObjectId());

    // Mock track with digital fuel
    Track mockTrack = mock(Track.class);
    when(mockTrack.hasDigitalFuel()).thenReturn(true);
    when(mockTrack.getLanes()).thenReturn(track.getLanes());

    Race raceWithFuel = new Race(raceModel, participants, mockTrack, true);
    raceWithFuel.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(100.0);

    Racing racing = new Racing();
    raceWithFuel.changeState(racing);

    // Initial fuel level: 100
    // Throttle 1.0 (100%), Time 1.0s, UsageRate 10.0 -> Consumed 10.0
    com.antigravity.protocols.CarData carData = new com.antigravity.protocols.CarData(
        0, 1.0, 1.0, 1.0, false, com.antigravity.protocols.CarLocation.Main,
        com.antigravity.protocols.CarLocation.Main, -1);

    racing.onCarData(carData);

    assertEquals(90.0, raceWithFuel.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);

    // Throttle 0.5 (50%), Time 2.0s, UsageRate 10.0 -> Consumed 10.0
    carData = new com.antigravity.protocols.CarData(
        0, 2.0, 0.5, 0.5, false, com.antigravity.protocols.CarLocation.Main,
        com.antigravity.protocols.CarLocation.Main, -1);

    racing.onCarData(carData);

    assertEquals(80.0, raceWithFuel.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
  }

  @Test
  public void testTeamLimits_DriverSwitch() {
    TeamOptions teamOptions = new TeamOptions(2, 0.0, 0, 0.0, false); 

    com.antigravity.models.HeatScoring customScoring = new com.antigravity.models.HeatScoring(
        com.antigravity.models.HeatScoring.FinishMethod.Lap,
        10L, // 10 laps to prevent early finish
        com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
        com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        com.antigravity.models.HeatScoring.AllowFinish.None);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, customScoring, null,
        new OverallScoring(), 0.0, null, null, teamOptions, "race1", new ObjectId());

    Team mockTeam = new Team("Team A", null, null, "t1", new ObjectId());
    RaceParticipant teamParticipant = new RaceParticipant(mockTeam);
    participants.clear();
    participants.add(teamParticipant);

    race = new Race(raceModel, participants, track, true);

    Racing racing = new Racing();
    race.changeState(racing);

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    Driver subDriver1 = new Driver("1A", "1A", "sd1", new ObjectId());
    Driver subDriver2 = new Driver("1B", "1B", "sd2", new ObjectId());

    // Set active sub-driver
    driverData.setActualDriver(subDriver1);

    // Initial state
    assertEquals(0, driverData.getLapCount());

    // Reaction
    racing.onLap(0, 1.0, 1);

    // subDriver1 completes 2 laps (reaches limit)
    racing.onLap(0, 5.0, 1); 
    racing.onLap(0, 5.0, 1); 
    assertEquals(2, driverData.getLapCount());

    // 3rd lap should be rejected
    racing.onLap(0, 5.0, 1); 
    assertEquals(2, driverData.getLapCount()); 

    // SWITCH DRIVER
    driverData.setActualDriver(subDriver2);

    // subDriver2 should be able to complete 1st lap
    racing.onLap(0, 5.0, 1); 
    assertEquals(3, driverData.getLapCount()); 

    racing.onLap(0, 5.0, 1); 
    assertEquals(4, driverData.getLapCount());

    // subDriver2 reaches limit (2 laps)
    racing.onLap(0, 5.0, 1); // should be rejected
    assertEquals(4, driverData.getLapCount()); 
  }

  @Test
  public void testTeamLimits_FuelConsumptionOnRejectedLap() {
    TeamOptions teamOptions = new TeamOptions(1, 0.0, 0, 0.0, false); // limit 1 lap
    
    com.antigravity.models.AnalogFuelOptions fuelOptions = new com.antigravity.models.AnalogFuelOptions(
        true, false, false, 100.0, com.antigravity.models.FuelOptions.FuelUsageType.LINEAR, 10.0, 100.0, 10.0, 1.0, 5.0);

    com.antigravity.models.HeatScoring customScoring = new com.antigravity.models.HeatScoring(
        com.antigravity.models.HeatScoring.FinishMethod.Lap,
        10L, 
        com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
        com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        com.antigravity.models.HeatScoring.AllowFinish.None);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, customScoring, null,
        new OverallScoring(), 0.0, fuelOptions, null, teamOptions, "race1", new ObjectId());

    Team mockTeam = new Team("Team A", null, null, "t1", new ObjectId());
    RaceParticipant teamParticipant = new RaceParticipant(mockTeam);
    participants.clear();
    participants.add(teamParticipant);

    race = new Race(raceModel, participants, track, true);
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(100.0);

    Racing racing = new Racing();
    race.changeState(racing);

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(0);
    Driver subDriver = new Driver("1A", "1A", "sd1", new ObjectId());
    driverData.setActualDriver(subDriver);

    // Initial state
    assertEquals(0, driverData.getLapCount());
    assertEquals(100.0, driverData.getDriver().getFuelLevel(), 0.001);

    // Reaction
    racing.onLap(0, 1.0, 1);

    // lap 1 (accepted)
    racing.onLap(0, 5.0, 1); 
    assertEquals(1, driverData.getLapCount());
    double fuelAfterLap1 = driverData.getDriver().getFuelLevel();
    assertTrue(fuelAfterLap1 < 100.0);

    // lap 2 (rejected due to 1 lap team limit)
    racing.onLap(0, 5.0, 1); 
    assertEquals(1, driverData.getLapCount()); 
    double fuelAfterLap2 = driverData.getDriver().getFuelLevel();
    assertTrue("Fuel did not consume on rejected lap!", fuelAfterLap2 < fuelAfterLap1);
  }

  private void assertEquals(long expected, long actual) {
    if (expected != actual) {
      throw new AssertionError("Expected " + expected + " but got " + actual);
    }
  }

  private void assertEquals(double expected, double actual, double delta) {
    if (Math.abs(expected - actual) > delta) {
      throw new AssertionError("Expected " + expected + " but got " + actual);
    }
  }
}
