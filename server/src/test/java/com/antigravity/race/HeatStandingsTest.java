package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
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
    d1.addLap(10.0, false);
    d1.addLap(10.0, false); // 2 laps, 20s

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false); // 1 lap, 10s

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
    d1.addLap(10.0, false);
    d1.addLap(10.0, false); // best 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(15.0, false);
    d2.addLap(5.0, false); // best 5.0

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
    d1.addLap(10.0, false);
    d1.addLap(10.0, false); // Avg 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(12.0, false);
    d2.addLap(12.0, false); // Avg 12.0

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
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);
    d1.addLap(10.0, false); // Median 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(5.0, false);
    d2.addLap(15.0, false);
    d2.addLap(15.0, false); // Median 15.0

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
    d1.addLap(10.0, false);
    d1.addLap(10.0, false); // 2 laps

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false); // 1 lap

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
    d1.addLap(10.0, false); // 10.0s total

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(12.5, false); // 12.5s total

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
  public void testReactionTimeTiebreaker() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p3");
    RaceParticipant p3 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.setReactionTime(0.5); // Fastest reaction

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.setReactionTime(1.0); // Slower reaction

    DriverHeatData d3 = new DriverHeatData(p3);
    d3.setReactionTime(0.0); // No reaction yet (worst)

    List<DriverHeatData> data = new ArrayList<>();
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

    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));
    assertEquals(d3.getObjectId(), results.get(2));
  }

  @Test
  public void testEmptyLaneRanking() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = new RaceParticipant(Driver.EMPTY_DRIVER, "empty");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false);

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
  public void testStandingsStabilityAfterReactionTime() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = new RaceParticipant(Driver.EMPTY_DRIVER, "empty");

    DriverHeatData d1 = new DriverHeatData(p1);
    DriverHeatData d2 = new DriverHeatData(p2);

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    // Initially, d1 should be first
    assertEquals(d1.getObjectId(), standings.getStandings().get(0));

    // d1 gets a reaction time
    d1.setReactionTime(0.5);
    standings.updateStandings();

    // d1 should still be first
    assertEquals(d1.getObjectId(), standings.getStandings().get(0));

    // Verify ranks
    com.antigravity.proto.StandingsUpdate update = standings.updateStandings();
    for (com.antigravity.proto.HeatPositionUpdate pos : update.getUpdatesList()) {
      if (pos.getObjectId().equals(d1.getObjectId())) {
        assertEquals(1, pos.getRank());
      } else if (pos.getObjectId().equals(d2.getObjectId())) {
        assertEquals(99, pos.getRank());
      }
    }
  }

  @Test
  public void testFractionalLapRanking() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false); // 1 lap
    d1.setUserLaps(0.25); // 1.25 laps

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false); // 1 lap
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
    d1.addLap(10.0, false);
    d1.setUserLaps(0.5);

    // d2: 1 lap + 0.25 auto = 1.25 laps. Avg lap 10s.
    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false);
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
  public void testFalseStartReactionTimeTiebreaker() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");
    RaceParticipant p3 = createDriver("p3");

    // p1: real reaction 0.5s
    DriverHeatData d1 = new DriverHeatData(p1);
    d1.setReactionTime(0.5);

    // p2: false start reaction 0.0s (should be worse than 0.5s)
    DriverHeatData d2 = new DriverHeatData(p2);
    d2.setReactionTime(0.0);

    // p3: no reaction -1.0s (should be same as 0.0s or at least worse than 0.5s)
    DriverHeatData d3 = new DriverHeatData(p3);
    d3.setReactionTime(-1.0);

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d2);
    data.add(d3);
    data.add(d1);

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                HeatScoring.FinishMethod.Lap,
                0,
                HeatScoring.HeatRanking.LAP_COUNT,
                HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    List<String> results = standings.getStandings();

    // d1 should be first because 0.5 > 0.0 (or -1.0) in the tie-breaker logic
    // where <= 0 becomes Double.MAX_VALUE
    assertEquals(d1.getObjectId(), results.get(0));

    // d2 and d3 are both Double.MAX_VALUE, so they maintain their relative order
    // or sort by name/objectId.
  }

  @Test
  public void testPracticeStandings() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false); // 1 lap

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0, false);
    d2.addLap(10.0, false); // 2 laps (should be first if not practice)

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
    data.add(d2); // empty lane first
    data.add(d1); // real driver second

    HeatStandings standings =
        new HeatStandings(
            data,
            new HeatScoring(
                FinishMethod.Lap, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME),
            false);

    // Initial state set by constructor calculateStandings
    List<String> results = standings.getStandings();
    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));

    // Resetting should maintain the same sorted order (empty lane last)
    standings.reset();
    results = standings.getStandings();
    assertEquals(d1.getObjectId(), results.get(0));
    assertEquals(d2.getObjectId(), results.get(1));
  }
}
