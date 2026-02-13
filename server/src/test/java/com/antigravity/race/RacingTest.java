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

  private void assertEquals(long expected, long actual) {
    if (expected != actual) {
      throw new AssertionError("Expected " + expected + " but got " + actual);
    }
  }
}
