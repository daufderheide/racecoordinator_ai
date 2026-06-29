package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.race.states.Common;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class RaceTimeTest {

  private com.antigravity.race.Race race;
  private Track track;
  private List<RaceParticipant> drivers;

  @Before
  public void setUp() {
    // Setup 2-lane track
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100, "l1", null));
    lanes.add(new Lane("blue", "black", 100, "l2", null));
    track = new Track.Builder().name("Test Track").lanes(lanes).entityId("track1").id(null).build();

    // Setup drivers
    drivers = new ArrayList<>();
    for (int i = 0; i < 4; i++) {
      Driver d =
          new Driver(
              "D" + i,
              "Nick" + i,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              "id" + i,
              null);
      drivers.add(new RaceParticipant(d));
    }
  }

  @Test
  public void testLapBasedRaceTimeResets() {
    Race raceModel =
        new Race.Builder()
            .withName("Lap Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(
                new HeatScoring(
                    HeatScoring.FinishMethod.Lap,
                    10,
                    HeatScoring.HeatRanking.LAP_COUNT,
                    HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    HeatScoring.AllowFinish.None))
            .withOverallScoring(
                new OverallScoring(
                    0,
                    OverallScoring.OverallRanking.LAP_COUNT,
                    OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME))
            .withEntityId("race1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();

    // Start Heat 1
    race.changeState(new Racing());
    race.addRaceTime(100.0f);
    assertEquals(100.0f, race.getRaceTime(), 0.001);

    // Advance to Heat 2
    race.changeState(new HeatOver());
    Common.advanceToNextHeat(race);

    // Should be 0.0 at the start of Heat 2
    assertEquals(0.0f, race.getRaceTime(), 0.001);

    // Start Heat 2
    race.changeState(new Racing());
    race.addRaceTime(50.0f);
    assertEquals(50.0f, race.getRaceTime(), 0.001);
  }

  @Test
  public void testTimedRaceTimeResets() {
    long finishValue = 300; // 5 minutes
    Race raceModel =
        new Race.Builder()
            .withName("Timed Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(
                new HeatScoring(
                    HeatScoring.FinishMethod.Timed,
                    finishValue,
                    HeatScoring.HeatRanking.LAP_COUNT,
                    HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    HeatScoring.AllowFinish.None))
            .withOverallScoring(
                new OverallScoring(
                    0,
                    OverallScoring.OverallRanking.LAP_COUNT,
                    OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME))
            .withEntityId("race2")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();

    // Start Heat 1
    race.changeState(new Racing());
    // Time-based race starts at finishValue (countdown)
    assertEquals((float) finishValue, race.getRaceTime(), 0.001);

    // Simulate 100s passing (down to 200)
    race.addRaceTime(-100.0f);
    assertEquals(200.0f, race.getRaceTime(), 0.001);

    // Advance to Heat 2
    race.changeState(new HeatOver());
    Common.advanceToNextHeat(race);

    // Before Racing state, it should be 0.0 (reset by prepareHeat)
    assertEquals(0.0f, race.getRaceTime(), 0.001);

    // Start Heat 2 - Racing.enter should re-initialize it to finishValue
    race.changeState(new Racing());
    assertEquals((float) finishValue, race.getRaceTime(), 0.001);
  }

  @Test
  public void testRestartHeatResetsTime() {
    Race raceModel =
        new Race.Builder()
            .withName("Restart Test")
            .withTrackEntityId("track1")
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .withEntityId("race3")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();

    // Start Racing
    race.changeState(new Racing());
    race.addRaceTime(123.45f);
    assertEquals(123.45f, race.getRaceTime(), 0.001);

    // Restart heat
    race.restartHeat();
    // Time should be reset
    assertEquals(0.0f, race.getRaceTime(), 0.001);
  }
}
