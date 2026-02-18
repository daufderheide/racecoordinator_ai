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

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
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
    track = new Track("Test Track", lanes, mock(ArduinoConfig.class), "track1", new ObjectId());

    race = new Race(raceModel, participants, track, true);
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
    assertEquals(12.0, race.getCurrentHeat().getDrivers().get(0).getLaps().get(0), 0.001);

    // Lap 3: 12.0s (accumulated: 12.0s) - above min 10.0s
    racing.onLap(0, 12.0, 1);
    assertEquals(2, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    assertEquals(12.0, race.getCurrentHeat().getDrivers().get(0).getLaps().get(1), 0.001);
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
    when(mockRace.isRacing()).thenReturn(true);

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
