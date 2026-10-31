package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.OverallScoring.OverallRanking;
import com.antigravity.models.OverallScoring.OverallRankingTiebreaker;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class HeatStandingsTest {

  private RaceParticipant createDriver(String id) {
    Driver d = new Driver(id, id, id, null);
    return new RaceParticipant(d, id);
  }

  @Test
  public void testLapCountRanking() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true); // 2 laps, 20s

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false, true); // 1 lap, 10s

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);
    List<String> results = standings.getStandings();

    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));
  }

  @Test
  public void testFastestLapTiebreaker() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    // Both have 2 laps, but p2 has faster best lap
    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true); // best 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(15.0, false, true);
    d2.addLap(5.0, false, true); // best 5.0

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);
    List<String> results = standings.getStandings();

    assertEquals(d2.getObjectId(), results.get(0));
    assertEquals(d1.getObjectId(), results.get(1));
  }

  @Test
  public void testAverageLapTiebreaker() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true); // Avg 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(12.0, false, true);
    d2.addLap(12.0, false, true); // Avg 12.0

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME),
            false);
    assertEquals(d1.getObjectId(), standings.getStandings().get(0));
  }

  @Test
  public void testMedianLapTiebreaker() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true); // Median 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(5.0, false, true);
    d2.addLap(15.0, false, true);
    d2.addLap(15.0, false, true); // Median 15.0

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.MEDIAN_LAP_TIME),
            false);
    List<String> results = standings.getStandings();

    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));
  }

  @Test
  public void testCalculateGapsLapBased() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");
    RaceParticipant p3 = createDriver("p3");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true); // 2 laps

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false, true); // 1 lap

    DriverHeatData d3 = new DriverHeatData(p3);
    // 0 laps

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);
    data.add(d3);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    standings.getStandings(); // Triggers calculateStandings -> calculateGaps

    assertEquals(2, d1.getLapCount());
    assertEquals(1, d2.getLapCount());
    assertEquals(0, d3.getLapCount());

    assertEquals(0.0, d1.getGapLeader(), 0.001);
    assertEquals(0.0, d1.getGapPosition(), 0.001);

    assertEquals(0.0, d2.getGapLeader(), 0.001); // Projected gap at same lap is 0
    assertEquals(0.0, d2.getGapPosition(), 0.001);

    assertEquals(20.0, d3.getGapLeader(), 0.001); // 0 laps, gap = lead.totalTime
    assertEquals(10.0, d3.getGapPosition(), 0.001); // 0 laps, gap to d2 = d2.totalTime
  }

  @Test
  public void testCalculateGapsTimed() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true); // 10.0s total

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(12.5, false, true); // 12.5s total

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Timed,
                300,
                HeatRanking.LAP_COUNT,
                HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    standings.getStandings(); // Triggers calculateStandings -> calculateGaps

    assertEquals(0.0, d1.getGapLeader(), 0.001);
    assertEquals(2.5, d2.getGapLeader(), 0.001); // 2.5s behind
    assertEquals(2.5, d2.getGapPosition(), 0.001);
  }

  @Test
  public void testReactionTimeDoesNotAffectStandings() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");
    RaceParticipant p3 = createDriver("p3");

    // All drivers have identical laps and times
    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true);
    d1.setReactionTime(0.1); // Fastest reaction

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false, true);
    d2.setReactionTime(0.5); // Slower reaction

    DriverHeatData d3 = new DriverHeatData(p3);
    d3.addLap(10.0, false, true);
    d3.setReactionTime(1.0); // Slowest reaction

    List<DriverHeatData> data = new ArrayList<>();
    // Add in reverse order of reaction time
    data.add(d3);
    data.add(d2);
    data.add(d1);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    List<String> results = standings.getStandings();

    // Since reaction time is no longer a tiebreaker, their original insertion order is preserved
    assertEquals(d3.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));
    assertEquals(d1.getObjectId(), results.get(2));
  }

  @Test
  public void testEmptyLaneRanking() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = new RaceParticipant(Driver.EMPTY_DRIVER, "empty");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true);

    DriverHeatData d2 = new DriverHeatData(p2);
    // Empty lane has no laps

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d2); // Put empty lane first to test sorting
    data.add(d1);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    List<String> results = standings.getStandings();

    // d1 (real driver) should be first, d2 (empty) should be second
    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));

    // Verify ranks
    com.antigravity.proto.StandingsUpdate update = standings.updateStandings();
    assertEquals(2, update.getUpdatesCount());

    for (com.antigravity.proto.HeatPositionUpdate pos : update.getUpdatesList()) {
      if (pos.getObjectId().equals(d1.getObjectId())) {
        assertEquals(1, pos.getRank()); // Real driver ranked 1
      } else if (pos.getObjectId().equals(d2.getObjectId())) {
        assertEquals(99, pos.getRank()); // Empty lane ranked 99
      }
    }
  }

  @Test
  public void testFractionalLapRanking() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true); // 1 lap
    d1.setUserLaps(0.25); // 1.25 laps

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false, true); // 1 lap
    d2.setUserLaps(0.5); // 1.5 laps

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);
    List<String> results = standings.getStandings();

    // d2 has more laps (1.5) than d1 (1.25)
    assertEquals(d2.getObjectId(), results.get(0));
    assertEquals(d1.getObjectId(), results.get(1));
  }

  @Test
  public void testGapsWithAutoAndUserLaps() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    // d1: 1 lap + 0.5 user = 1.5 laps. Avg lap 10s.
    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true);
    d1.setUserLaps(0.5);

    // d2: 1 lap + 0.25 auto = 1.25 laps. Avg lap 10s.
    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false, true);
    d2.setAutoCalculatedLaps(0.25);

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);
    standings.getStandings();

    // d1 is leader (1.5 laps)
    // d2 is behind (1.25 laps)
    // Diff is 0.25 laps.
    // Gap calculation: avgLapTime * lapDiff = 10 * 0.25 = 2.5s
    assertEquals(2.5, d2.getGapLeader(), 0.001);
    assertEquals(2.5, d2.getGapPosition(), 0.001);
  }

  @Test
  public void testPracticeStandings() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true); // 1 lap

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false, true);
    d2.addLap(10.0, false, true); // 2 laps (should be first if not practice)

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1); // Added first
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            true); // Practice mode

    List<String> results = standings.getStandings();

    // In practice mode, sorting is skipped, so original order is preserved.
    // d1 remains first, d2 remains second
    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));

    // Verify ranks are 99 for both
    com.antigravity.proto.StandingsUpdate update = standings.updateStandings();
    for (com.antigravity.proto.HeatPositionUpdate pos : update.getUpdatesList()) {
      assertEquals(99, pos.getRank());
    }
  }

  @Test
  public void testResetWithEmptyLanes() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = new RaceParticipant(Driver.EMPTY_DRIVER, "empty");

    DriverHeatData d1 = new DriverHeatData(p1);
    DriverHeatData d2 = new DriverHeatData(p2);

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d2); // empty lane first (lane 0)
    data.add(d1); // real driver second (lane 1)

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    // Initial state at heat start must be lane order (empty lane in lane 0 is first)
    List<String> results = standings.getStandings();
    assertEquals(d2.getObjectId(), results.get(0));
    assertEquals(d1.getObjectId(), results.get(1));

    // Resetting at heat start maintains lane order
    standings.reset();
    results = standings.getStandings();
    assertEquals(d2.getObjectId(), results.get(0));
    assertEquals(d1.getObjectId(), results.get(1));

    // Once racing begins and a real driver completes a lap, empty lanes sort to bottom
    d1.addLap(10.0, false, true);
    standings.updateStandings();
    results = standings.getStandings();
    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));
  }

  @Test
  public void testHeatStartStandingsAreInLaneOrderRegardlessOfSeed() {
    RaceParticipant p1 = createDriver("p1");
    p1.setSeed(10); // Lane 0, high seed
    RaceParticipant p2 = createDriver("p2");
    p2.setSeed(1); // Lane 1, lowest seed (would rank 1st under tiebreaker)
    RaceParticipant p3 = createDriver("p3");
    p3.setSeed(5); // Lane 2, middle seed

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.setLane(0);
    DriverHeatData d2 = new DriverHeatData(p2);
    d2.setLane(1);
    DriverHeatData d3 = new DriverHeatData(p3);
    d3.setLane(2);

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);
    data.add(d3);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    // At heat start, standings must be lane order: 0, 1, 2 regardless of seed
    List<String> results = standings.getStandings();
    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));
    assertEquals(d3.getObjectId(), results.get(2));

    com.antigravity.proto.StandingsUpdate update = standings.updateStandings();
    assertEquals(1, update.getUpdates(0).getRank());
    assertEquals(2, update.getUpdates(1).getRank());
    assertEquals(3, update.getUpdates(2).getRank());
  }

  @Test
  public void testHeatStartStandingsWithScrambledInsertionOrder() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");
    RaceParticipant p3 = createDriver("p3");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.setLane(0);
    DriverHeatData d2 = new DriverHeatData(p2);
    d2.setLane(1);
    DriverHeatData d3 = new DriverHeatData(p3);
    d3.setLane(2);

    List<DriverHeatData> data = new ArrayList<>();
    // Add in scrambled lane order: 2, 0, 1
    data.add(d3);
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    // At heat start, standings must be sorted by lane: Lane 0, Lane 1, Lane 2
    List<String> results = standings.getStandings();
    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));
    assertEquals(d3.getObjectId(), results.get(2));
  }

  @Test
  public void testLaneOrderDoesNotMatterAfterHeatStart() {
    RaceParticipant p1 = createDriver("p1");
    p1.setSeed(10); // Lane 0, Seed 10
    RaceParticipant p2 = createDriver("p2");
    p2.setSeed(2); // Lane 1, Seed 2
    RaceParticipant p3 = createDriver("p3");
    p3.setSeed(8); // Lane 2, Seed 8

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.setLane(0);
    DriverHeatData d2 = new DriverHeatData(p2);
    d2.setLane(1);
    DriverHeatData d3 = new DriverHeatData(p3);
    d3.setLane(2);

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);
    data.add(d3);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    // At heat start: Lane order 0, 1, 2
    assertEquals(d1.getObjectId(), standings.getStandings().get(0));
    assertEquals(d2.getObjectId(), standings.getStandings().get(1));
    assertEquals(d3.getObjectId(), standings.getStandings().get(2));

    // Car on Lane 2 completes a lap: now racing is underway
    d3.addLap(10.0, false, true);
    standings.updateStandings();

    // d3 (Lane 2) is 1st because it has 1 lap.
    // For d1 (Lane 0) and d2 (Lane 1), both have 0 laps. Lane order NO LONGER matters.
    // Their tiebreaker is Seed: p2 (seed 2) wins over p1 (seed 10), so d2 is 2nd, d1 is 3rd.
    List<String> racingResults = standings.getStandings();
    assertEquals(d3.getObjectId(), racingResults.get(0)); // 1 lap
    assertEquals(d2.getObjectId(), racingResults.get(1)); // 0 laps, Seed 2
    assertEquals(d1.getObjectId(), racingResults.get(2)); // 0 laps, Seed 10
  }

  @Test
  public void testLapsLed() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false, true); // Lap 1 at t=10.0 -> Leader (d1 led lap 1)
    d1.addLap(10.0, false, true); // Lap 2 at t=20.0 -> Leader (d1 led lap 2)

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(12.0, false, true); // Lap 1 at t=12.0 (p1 has 1 lap at t=10, so p1 is leading)
    d2.addLap(
        6.0, false,
        true); // Lap 2 at t=18.0 (p1 has 1 lap at t=10, 2 laps at t=20, so at t=18 p2 takes lead
    // and leads lap 2)

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    com.antigravity.proto.StandingsUpdate update = standings.updateStandings();
    assertEquals(2, update.getUpdatesCount());
    assertEquals(1, d1.getLapsLed());
    assertEquals(1, d2.getLapsLed());
  }

  @Test
  public void testFastestLapRankingGaps() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");
    RaceParticipant p3 = createDriver("p3");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(4.200, false, true); // best lap 4.200s, 1 lap
    d1.addLap(4.500, false, true); // 2 laps

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(4.000, false, true); // best lap 4.000s, 1 lap

    DriverHeatData d3 = new DriverHeatData(p3);
    d3.addLap(4.500, false, true); // best lap 4.500s, 1 lap
    d3.addLap(5.000, false, true); // 2 laps
    d3.addLap(4.800, false, true); // 3 laps

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);
    data.add(d3);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap,
                0,
                HeatRanking.FASTEST_LAP,
                HeatRankingTiebreaker.AVERAGE_LAP_TIME),
            false);

    standings.updateStandings();
    List<String> results = standings.getStandings();

    // Ranked by best lap ascending: d2 (4.000), d1 (4.200), d3 (4.500)
    assertEquals(d2.getObjectId(), results.get(0));
    assertEquals(d1.getObjectId(), results.get(1));
    assertEquals(d3.getObjectId(), results.get(2));

    // d2 (Leader): gapLeader = 0, gapPosition = 0
    assertEquals(0.0, d2.getGapLeader(), 0.001);
    assertEquals(0.0, d2.getGapPosition(), 0.001);
    assertEquals(0.0, d2.getGapLeaderF1(), 0.001);
    assertEquals(0.0, d2.getGapPositionF1(), 0.001);
    assertEquals(0, d2.getLapsDownLeader());
    assertEquals(0, d2.getLapsDownPosition());
    assertEquals(0.0, d2.getGapLeaderLaps(), 0.001);
    assertEquals(0.0, d2.getGapPositionLaps(), 0.001);

    // d1 (P2): 4.200 - 4.000 = 0.200s behind leader, 0.200s behind position ahead
    assertEquals(0.200, d1.getGapLeader(), 0.001);
    assertEquals(0.200, d1.getGapPosition(), 0.001);
    assertEquals(0.200, d1.getGapLeaderF1(), 0.001);
    assertEquals(0.200, d1.getGapPositionF1(), 0.001);
    assertEquals(0, d1.getLapsDownLeader());
    assertEquals(0, d1.getLapsDownPosition());
    assertEquals(0.0, d1.getGapLeaderLaps(), 0.001);
    assertEquals(0.0, d1.getGapPositionLaps(), 0.001);

    // d3 (P3): 4.500 - 4.000 = 0.500s behind leader, 4.500 - 4.200 = 0.300s behind d1
    assertEquals(0.500, d3.getGapLeader(), 0.001);
    assertEquals(0.300, d3.getGapPosition(), 0.001);
    assertEquals(0.500, d3.getGapLeaderF1(), 0.001);
    assertEquals(0.300, d3.getGapPositionF1(), 0.001);
    assertEquals(0, d3.getLapsDownLeader());
    assertEquals(0, d3.getLapsDownPosition());
    assertEquals(0.0, d3.getGapLeaderLaps(), 0.001);
    assertEquals(0.0, d3.getGapPositionLaps(), 0.001);
  }

  @Test
  public void testHeatStandingsInheritsFastestLapFromOverallScoring() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");
    RaceParticipant p3 = createDriver("p3");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(4.200, false, true); // best lap 4.200s, 5 laps total
    d1.addLap(4.300, false, true);
    d1.addLap(4.400, false, true);
    d1.addLap(4.500, false, true);
    d1.addLap(4.600, false, true);

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(4.000, false, true); // best lap 4.000s, only 1 lap total

    DriverHeatData d3 = new DriverHeatData(p3);
    d3.addLap(4.500, false, true); // best lap 4.500s, 10 laps total
    for (int i = 0; i < 9; i++) {
      d3.addLap(5.000, false, true);
    }

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);
    data.add(d3);

    // HeatScoring is LAP_COUNT, but OverallScoring is FASTEST_LAP
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(
            0, OverallRanking.FASTEST_LAP, OverallRankingTiebreaker.AVERAGE_LAP_TIME);

    HeatStandings standings = new HeatStandings(data, heatScoring, overallScoring, false);

    standings.updateStandings();
    List<String> results = standings.getStandings();

    // Ranked by best lap ascending: d2 (4.000), d1 (4.200), d3 (4.500)
    // Even though d3 has 10 laps and d2 has only 1 lap!
    assertEquals(d2.getObjectId(), results.get(0));
    assertEquals(d1.getObjectId(), results.get(1));
    assertEquals(d3.getObjectId(), results.get(2));

    // d2 (Leader): gapLeader = 0, gapPosition = 0
    assertEquals(0.0, d2.getGapLeader(), 0.001);
    assertEquals(0.0, d2.getGapPosition(), 0.001);
    assertEquals(0.0, d2.getGapLeaderF1(), 0.001);
    assertEquals(0.0, d2.getGapPositionF1(), 0.001);
    assertEquals(0, d2.getLapsDownLeader());
    assertEquals(0, d2.getLapsDownPosition());
    assertEquals(0.0, d2.getGapLeaderLaps(), 0.001);
    assertEquals(0.0, d2.getGapPositionLaps(), 0.001);

    // d1 (P2): 4.200 - 4.000 = 0.200s behind leader, 0.200s behind position ahead
    // Note: gapLeader and gapPosition are IDENTICAL for position 2!
    assertEquals(0.200, d1.getGapLeader(), 0.001);
    assertEquals(0.200, d1.getGapPosition(), 0.001);
    assertEquals(0.200, d1.getGapLeaderF1(), 0.001);
    assertEquals(0.200, d1.getGapPositionF1(), 0.001);
    assertEquals(0, d1.getLapsDownLeader());
    assertEquals(0, d1.getLapsDownPosition());
    assertEquals(0.0, d1.getGapLeaderLaps(), 0.001);
    assertEquals(0.0, d1.getGapPositionLaps(), 0.001);

    // d3 (P3): 4.500 - 4.000 = 0.500s behind leader, 4.500 - 4.200 = 0.300s behind d1
    assertEquals(0.500, d3.getGapLeader(), 0.001);
    assertEquals(0.300, d3.getGapPosition(), 0.001);
    assertEquals(0.500, d3.getGapLeaderF1(), 0.001);
    assertEquals(0.300, d3.getGapPositionF1(), 0.001);
    assertEquals(0, d3.getLapsDownLeader());
    assertEquals(0, d3.getLapsDownPosition());
    assertEquals(0.0, d3.getGapLeaderLaps(), 0.001);
    assertEquals(0.0, d3.getGapPositionLaps(), 0.001);
  }

  @Test
  public void testDynamicLapsFastestLapGaps() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.setLane(1);
    DriverHeatData d2 = new DriverHeatData(p2);
    d2.setLane(2);

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    OverallScoring overallScoring =
        new OverallScoring(
            0, OverallRanking.FASTEST_LAP, OverallRankingTiebreaker.AVERAGE_LAP_TIME);
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    HeatStandings standings = new HeatStandings(data, heatScoring, overallScoring, false);

    // Initial state: d1 runs 5.000s, d2 runs 4.800s
    d1.addLap(5.000, false, true);
    d2.addLap(4.800, false, true);
    standings.updateStandings();

    // d2 is leader (4.800s), d1 is P2 (5.000s)
    assertEquals(d2.getObjectId(), standings.getStandings().get(0));
    assertEquals(d1.getObjectId(), standings.getStandings().get(1));
    assertEquals(0.0, d2.getGapLeader(), 0.001);
    assertEquals(0.0, d2.getGapPosition(), 0.001);
    // d1 (P2): gapLeader and gapPosition are equal (0.200s)
    assertEquals(0.200, d1.getGapLeader(), 0.001);
    assertEquals(0.200, d1.getGapPosition(), 0.001);

    // Dynamic update: d1 completes lap at 4.500s in lane 1
    d1.addLap(4.500, false, true);
    standings.onLap(1, 4.500);

    // Now d1 takes P1 (4.500s), d2 drops to P2 (4.800s)
    assertEquals(d1.getObjectId(), standings.getStandings().get(0));
    assertEquals(d2.getObjectId(), standings.getStandings().get(1));
    assertEquals(0.0, d1.getGapLeader(), 0.001);
    assertEquals(0.0, d1.getGapPosition(), 0.001);
    // d2 (now P2): gapLeader and gapPosition are equal (0.300s = 4.800 - 4.500)
    assertEquals(0.300, d2.getGapLeader(), 0.001);
    assertEquals(0.300, d2.getGapPosition(), 0.001);

    // Dynamic update: d2 answers with 4.400s in lane 2
    d2.addLap(4.400, false, true);
    standings.onLap(2, 4.400);

    // Now d2 retakes P1 (4.400s), d1 drops to P2 (4.500s)
    assertEquals(d2.getObjectId(), standings.getStandings().get(0));
    assertEquals(d1.getObjectId(), standings.getStandings().get(1));
    assertEquals(0.0, d2.getGapLeader(), 0.001);
    assertEquals(0.0, d2.getGapPosition(), 0.001);
    // d1 (now P2): gapLeader and gapPosition are equal (0.100s = 4.500 - 4.400)
    assertEquals(0.100, d1.getGapLeader(), 0.001);
    assertEquals(0.100, d1.getGapPosition(), 0.001);
  }

  @Test
  public void testHeatStandings_OtherScoringMethods_NotAffectedByOverallScoring() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    // Both have 10 laps, but:
    // d1: best lap 4.0s, total time 60s (9 laps of 6.22s + 1 lap of 4.0s)
    // d2: best lap 4.8s, total time 50s (10 laps of 5.0s, but one is 4.8s)
    DriverHeatData d1 = new DriverHeatData(p1);
    d1.setLane(1);
    d1.addLap(4.0, false, true);
    for (int i = 0; i < 9; i++) {
      d1.addLap(6.222, false, true); // total ~60.0s, best 4.0s
    }

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.setLane(2);
    d2.addLap(4.8, false, true);
    for (int i = 0; i < 9; i++) {
      d2.addLap(5.022, false, true); // total ~50.0s, best 4.8s
    }

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    // heatScoring is LAP_COUNT with FASTEST_LAP_TIME tiebreaker, overallScoring is TOTAL_TIME
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.TOTAL_TIME, OverallRankingTiebreaker.AVERAGE_LAP_TIME);

    HeatStandings standings = new HeatStandings(data, heatScoring, overallScoring, false);

    // In heat standings, LAP_COUNT + FASTEST_LAP_TIME tiebreaker governs:
    // Both have 10 laps, but d1 has a faster best lap (4.0s < 4.8s) -> d1 is P1
    assertEquals(d1.getObjectId(), standings.getStandings().get(0));
    assertEquals(d2.getObjectId(), standings.getStandings().get(1));

    // Verify reverse: heatScoring is TOTAL_TIME, overallScoring is LAP_COUNT
    HeatScoring heatScoring2 =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.TOTAL_TIME, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring2 =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.AVERAGE_LAP_TIME);

    HeatStandings standings2 = new HeatStandings(data, heatScoring2, overallScoring2, false);
    // In heat standings, TOTAL_TIME governs:
    // Both have 10 laps, but d2 has lower total time (50s < 60s) -> d2 is P1
    assertEquals(d2.getObjectId(), standings2.getStandings().get(0));
    assertEquals(d1.getObjectId(), standings2.getStandings().get(1));
  }
}
