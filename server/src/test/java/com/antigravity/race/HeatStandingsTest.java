package com.antigravity.race;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.ArrayList;
import java.util.List;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;

public class HeatStandingsTest {

  private RaceParticipant createDriver(String id) {
    com.antigravity.models.Driver d = new com.antigravity.models.Driver(id, id, id, null);
    return new RaceParticipant(d, id);
  }

  @Test
  public void testLapCountRanking() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0);
    d1.addLap(10.0); // 2 laps, 20s

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0); // 1 lap, 10s

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings = new HeatStandings(data, new HeatScoring(FinishMethod.Lap, 0, HeatRanking.LAP_COUNT,
        HeatRankingTiebreaker.FASTEST_LAP_TIME));
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
    d1.addLap(10.0);
    d1.addLap(10.0); // best 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(15.0);
    d2.addLap(5.0); // best 5.0

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings = new HeatStandings(data, new HeatScoring(FinishMethod.Lap, 0, HeatRanking.LAP_COUNT,
        HeatRankingTiebreaker.FASTEST_LAP_TIME));
    List<String> results = standings.getStandings();

    assertEquals(d2.getObjectId(), results.get(0));
    assertEquals(d1.getObjectId(), results.get(1));
  }

  @Test
  public void testAverageLapTiebreaker() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0);
    d1.addLap(10.0); // Avg 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(12.0);
    d2.addLap(12.0); // Avg 12.0

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings = new HeatStandings(data, new HeatScoring(FinishMethod.Lap, 0, HeatRanking.LAP_COUNT,
        HeatRankingTiebreaker.AVERAGE_LAP_TIME));
    assertEquals(d1.getObjectId(), standings.getStandings().get(0));
  }

  @Test
  public void testMedianLapTiebreaker() {
    RaceParticipant p1 = createDriver("p1");
    RaceParticipant p2 = createDriver("p2");

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0);
    d1.addLap(10.0);
    d1.addLap(10.0); // Median 10.0

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(5.0);
    d2.addLap(15.0);
    d2.addLap(15.0); // Median 15.0

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings = new HeatStandings(data, new HeatScoring(FinishMethod.Lap, 0, HeatRanking.LAP_COUNT,
        HeatRankingTiebreaker.MEDIAN_LAP_TIME));
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
    d1.addLap(10.0);
    d1.addLap(10.0); // 2 laps

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(10.0); // 1 lap

    DriverHeatData d3 = new DriverHeatData(p3);
    // 0 laps

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);
    data.add(d3);

    HeatStandings standings = new HeatStandings(data, new HeatScoring(FinishMethod.Lap, 0, HeatRanking.LAP_COUNT,
        HeatRankingTiebreaker.FASTEST_LAP_TIME));

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
    d1.addLap(10.0); // 10.0s total

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(12.5); // 12.5s total

    List<DriverHeatData> data = new ArrayList<>();
    data.add(d1);
    data.add(d2);

    HeatStandings standings = new HeatStandings(data, new HeatScoring(FinishMethod.Timed, 300, HeatRanking.LAP_COUNT,
        HeatRankingTiebreaker.FASTEST_LAP_TIME));

    standings.getStandings(); // Triggers calculateStandings -> calculateGaps

    assertEquals(0.0, d1.getGapLeader(), 0.001);
    assertEquals(2.5, d2.getGapLeader(), 0.001); // 2.5s behind
    assertEquals(2.5, d2.getGapPosition(), 0.001);
  }
}
