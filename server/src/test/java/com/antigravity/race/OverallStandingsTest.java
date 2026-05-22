package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import com.antigravity.models.GroupOptions;
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

public class OverallStandingsTest {

  private RaceParticipant createDriver(String name, String id) {
    // Driver(name, nickname, entityId, objectId)
    Driver d = new Driver(name, "nick", id, null);
    // RaceParticipant(driver, objectId)
    return new RaceParticipant(d, id);
  }

  private Heat createHeat(
      int number,
      RaceParticipant p1,
      double laps1,
      double time1,
      RaceParticipant p2,
      double laps2,
      double time2) {
    List<DriverHeatData> dhdList = new ArrayList<>();

    DriverHeatData d1 = new DriverHeatData(p1);
    // Add laps to simulate average time
    for (int i = 0; i < laps1; i++) {
      d1.addLap(time1 / laps1, false);
    }

    DriverHeatData d2 = new DriverHeatData(p2);
    for (int i = 0; i < laps2; i++) {
      d2.addLap(time2 / laps2, false);
    }

    dhdList.add(d1);
    dhdList.add(d2);

    HeatScoring scoring =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);

    return new Heat(number, dhdList, scoring);
  }

  @Test
  public void testSimpleRanking() {
    // Use FASTEST_LAP_TIME as tiebreaker
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, new GroupOptions());

    RaceParticipant p1 = createDriver("D1", "id1");
    RaceParticipant p2 = createDriver("D2", "id2");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);
    drivers.add(p2);

    List<Heat> heats = new ArrayList<>();
    // Heat 1: P1 wins (10 laps, 100s), P2 (9 laps, 100s)
    heats.add(createHeat(1, p1, 10, 100.0, p2, 9, 100.0));

    os.recalculate(drivers, heats);

    assertEquals(1, p1.getRank());
    assertEquals(2, p2.getRank());
    assertEquals(10.0, p1.getTotalLaps(), 0.001);
    assertEquals(9.0, p2.getTotalLaps(), 0.001);
  }

  @Test
  public void testDroppedHeats() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.MEDIAN_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(1, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.MEDIAN_LAP_TIME);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, new GroupOptions());

    RaceParticipant p1 = createDriver("D1", "id1");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);

    List<Heat> heats = new ArrayList<>();
    RaceParticipant dummy = createDriver("Dummy", "dummy");

    // Heat 1: 10 laps (Good)
    heats.add(createHeat(1, p1, 10, 100.0, dummy, 0, 0));
    // Heat 2: 5 laps (Bad heat - should be dropped)
    heats.add(createHeat(2, p1, 5, 200.0, dummy, 0, 0));
    // Heat 3: 12 laps (Best heat)
    heats.add(createHeat(3, p1, 12, 120.0, dummy, 0, 0));

    // Should drop Heat 2 (5 laps). Total = 10 + 12 = 22. Total time = 100 + 120 =
    // 220.
    os.recalculate(drivers, heats);

    assertEquals(22.0, p1.getTotalLaps(), 0.001);
    assertEquals(220.0, p1.getTotalTime(), 0.001);
  }

  @Test
  public void testTiebreakers() {
    // Main criteria: LAP_COUNT, Tiebreaker: AVERAGE_LAP_TIME
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.AVERAGE_LAP_TIME);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, new GroupOptions());

    RaceParticipant p1 = createDriver("D1", "id1");
    RaceParticipant p2 = createDriver("D2", "id2");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);
    drivers.add(p2);

    List<Heat> heats = new ArrayList<>();
    // Both P1 and P2 have 10 laps, but P1 is faster (100s vs 110s)
    heats.add(createHeat(1, p1, 10, 100.0, p2, 10, 110.0));

    os.recalculate(drivers, heats);

    assertEquals(1, p1.getRank());
    assertEquals(2, p2.getRank());
    assertEquals(10.0, p1.getAverageLapTime(), 0.001);
    assertEquals(11.0, p2.getAverageLapTime(), 0.001);

    // Switch to MEDIAN_LAP_TIME
    heatScoring =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.MEDIAN_LAP_TIME);
    overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.MEDIAN_LAP_TIME);
    os = new OverallStandings(heatScoring, overallScoring, new GroupOptions());

    p1 = createDriver("D1", "id1");
    p2 = createDriver("D2", "id2");
    drivers.clear();
    drivers.add(p1);
    drivers.add(p2);
    heats.clear();

    // P1: 10, 10, 10 (Median 10)
    // P2: 5, 15, 15 (Median 15)
    // Both have 30s total, 3 laps.

    DriverHeatData d1 = new DriverHeatData(p1);
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);

    DriverHeatData d2 = new DriverHeatData(p2);
    d2.addLap(5.0, false);
    d2.addLap(15.0, false);
    d2.addLap(15.0, false);

    List<DriverHeatData> dhdList = new ArrayList<>();
    dhdList.add(d1);
    dhdList.add(d2);
    heats.add(new Heat(1, dhdList, heatScoring));

    os.recalculate(drivers, heats);

    assertEquals(1, p1.getRank());
    assertEquals(2, p2.getRank());
    assertEquals(10.0, p1.getMedianLapTime(), 0.001);
    assertEquals(15.0, p2.getMedianLapTime(), 0.001);
  }

  @Test
  public void testAverageLapRanking() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.AVERAGE_LAP, OverallRankingTiebreaker.TOTAL_TIME);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, new GroupOptions());

    RaceParticipant p1 = createDriver("D1", "id1");
    RaceParticipant p2 = createDriver("D2", "id2");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);
    drivers.add(p2);

    List<Heat> heats = new ArrayList<>();
    // P1: 10 laps, 100s (Average 10s)
    // P2: 10 laps, 90s (Average 9s) - P2 should be #1
    heats.add(createHeat(1, p1, 10, 100.0, p2, 10, 90.0));

    os.recalculate(drivers, heats);

    assertEquals(1, p2.getRank());
    assertEquals(2, p1.getRank());
    assertEquals(9.0, p2.getAverageLapTime(), 0.001);
    assertEquals(10.0, p1.getAverageLapTime(), 0.001);
  }

  @Test
  public void testEmptyLaneOverallRanking() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, new GroupOptions());

    RaceParticipant p1 = createDriver("D1", "id1");
    RaceParticipant p2 = new RaceParticipant(Driver.EMPTY_DRIVER, "empty");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p2); // Empty lane first
    drivers.add(p1);

    List<Heat> heats = new ArrayList<>();
    // Heat 1: P1 has 10 laps, P2 (empty) has 0
    heats.add(createHeat(1, p1, 10, 100.0, p2, 0, 0));

    os.recalculate(drivers, heats);

    // D1 (real) should be rank 1, Empty should be rank 99
    assertEquals(1, p1.getRank());
    assertEquals(99, p2.getRank());

    // Verify sorting order in the list (Empty should be at the bottom)
    assertEquals(p1, drivers.get(0));
    assertEquals(p2, drivers.get(1));
  }

  @Test
  public void testFractionalOverallStandings() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, new GroupOptions());

    RaceParticipant p1 = createDriver("D1", "id1");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);

    List<Heat> heats = new ArrayList<>();
    RaceParticipant dummy = createDriver("Dummy", "dummy");

    // Heat 1: 10.25 laps
    Heat h1 = createHeat(1, p1, 10, 100.0, dummy, 0, 0);
    h1.getDrivers().get(0).setUserLaps(0.25);
    heats.add(h1);

    // Heat 2: 5.5 laps
    Heat h2 = createHeat(2, p1, 5, 50.0, dummy, 0, 0);
    h2.getDrivers().get(0).setUserLaps(0.5);
    heats.add(h2);

    // Total should be 10.25 + 5.5 = 15.75
    os.recalculate(drivers, heats);

    assertEquals(15.75, p1.getTotalLaps(), 0.001);
  }

  @Test
  public void testZeroTimeRanking() {
    // Main criteria: TOTAL_TIME
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.TOTAL_TIME, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.TOTAL_TIME, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, new GroupOptions());

    RaceParticipant p1 = createDriver("D1", "id1");
    RaceParticipant p2 = createDriver("D2", "id2");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);
    drivers.add(p2);

    List<Heat> heats = new ArrayList<>();
    // P1: 0 laps, 0s
    // P2: 1 lap, 10s
    // P2 should be #1 because 10s is an actual time, while 0s means no progress.
    heats.add(createHeat(1, p1, 0, 0.0, p2, 1, 10.0));

    os.recalculate(drivers, heats);

    assertEquals(1, p2.getRank());
    assertEquals(2, p1.getRank());
  }

  @Test
  public void testMinAdvancingSimple() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    // Enable min advancing 1
    GroupOptions groupOptions = new GroupOptions(true, 1, false, true, false, true, 1);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, groupOptions);

    RaceParticipant p1 = createDriver("D1", "id1");
    RaceParticipant p2 = createDriver("D2", "id2");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);
    drivers.add(p2);

    List<Heat> heats = new ArrayList<>();
    // P1: 10 laps, P2: 12 laps. Normally P2 is #1.
    heats.add(createHeat(1, p1, 10, 100.0, p2, 12, 120.0));

    os.recalculate(drivers, heats);

    // With minAdvancing 1, D1 and D2 are in group 0 (default).
    // Top 1 advances. Since D2 is better, D2 is forced top.
    // Result should be D2, D1.
    assertEquals(1, p2.getRank());
    assertEquals(2, p1.getRank());
  }

  @Test
  public void testMinAdvancingMultipleGroups() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    // Enable min advancing 1
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, true, 1);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, groupOptions);

    RaceParticipant g1_p1 = createDriver("G1P1", "g1p1");
    RaceParticipant g1_p2 = createDriver("G1P2", "g1p2");
    RaceParticipant g2_p1 = createDriver("G2P1", "g2p1");
    RaceParticipant g2_p2 = createDriver("G2P2", "g2p2");

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(g1_p1);
    drivers.add(g1_p2);
    drivers.add(g2_p1);
    drivers.add(g2_p2);

    List<Heat> heats = new ArrayList<>();
    // Group 1: P2 wins (20 laps), P1 second (10 laps) -> P2 advances
    Heat h1 = createHeat(1, g1_p1, 10, 100.0, g1_p2, 20, 200.0);
    h1.setGroup(1);
    heats.add(h1);

    // Group 2: P1 wins (15 laps), P2 second (5 laps) -> P1 advances
    Heat h2 = createHeat(2, g2_p1, 15, 150.0, g2_p2, 5, 50.0);
    h2.setGroup(2);
    heats.add(h2);

    os.recalculate(drivers, heats);

    // Forced Top: g1_p2 (20 laps) and g2_p1 (15 laps).
    // Sorted: g1_p2 (Rank 1), g2_p1 (Rank 2)
    // The Rest: g1_p1 (10 laps) and g2_p2 (5 laps)
    // Sorted: g1_p1 (Rank 3), g2_p2 (Rank 4)

    assertEquals(1, g1_p2.getRank());
    assertEquals(2, g2_p1.getRank());
    assertEquals(3, g1_p1.getRank());
    assertEquals(4, g2_p2.getRank());
  }

  @Test
  public void testMinAdvancingNotEnoughDrivers() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    // min advancing 2, but group only has 1
    GroupOptions groupOptions = new GroupOptions(true, 1, false, true, false, true, 2);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, groupOptions);

    RaceParticipant p1 = createDriver("D1", "id1");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);

    List<Heat> heats = new ArrayList<>();
    heats.add(createHeat(1, p1, 10, 100.0, createDriver("Dummy", "dummy"), 0, 0));

    os.recalculate(drivers, heats);

    assertEquals(1, p1.getRank());
    assertEquals(10.0, p1.getTotalLaps(), 0.001);
  }

  @Test
  public void testMinAdvancingWithEmptyDrivers() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    GroupOptions groupOptions = new GroupOptions(true, 1, false, true, false, true, 1);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, groupOptions);

    RaceParticipant p1 = createDriver("D1", "id1");
    RaceParticipant empty = new RaceParticipant(Driver.EMPTY_DRIVER, "empty");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);
    drivers.add(empty);

    List<Heat> heats = new ArrayList<>();
    heats.add(createHeat(1, p1, 10, 100.0, empty, 0, 0));

    os.recalculate(drivers, heats);

    assertEquals(1, p1.getRank());
    assertEquals(99, empty.getRank());
    assertEquals(p1, drivers.get(0));
    assertEquals(empty, drivers.get(1));
  }

  @Test
  public void testMinAdvancingWithCustomRotation() {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);

    // Groups enabled with minAdvancing = 1
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, true, 1);
    OverallStandings os = new OverallStandings(heatScoring, overallScoring, groupOptions);

    RaceParticipant g1_p1 = createDriver("G1P1", "g1p1");
    RaceParticipant g1_p2 = createDriver("G1P2", "g1p2");
    RaceParticipant g2_p1 = createDriver("G2P1", "g2p1");
    RaceParticipant g2_p2 = createDriver("G2P2", "g2p2");

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(g1_p1);
    drivers.add(g1_p2);
    drivers.add(g2_p1);
    drivers.add(g2_p2);

    List<Heat> heats = new ArrayList<>();
    // Custom heats preserve their custom groups (Group 5 and Group 6)
    Heat h1 = createHeat(1, g1_p1, 10, 100.0, g1_p2, 20, 200.0);
    h1.setGroup(5);
    heats.add(h1);

    Heat h2 = createHeat(2, g2_p1, 15, 150.0, g2_p2, 5, 50.0);
    h2.setGroup(6);
    heats.add(h2);

    os.recalculate(drivers, heats);

    // Group 5: g1_p2 (20 laps) advances over g1_p1 (10 laps)
    // Group 6: g2_p1 (15 laps) advances over g2_p2 (5 laps)
    // Forced Top (minAdvancing = 1 per group): g1_p2, g2_p1. Sorted: g1_p2 (Rank 1), g2_p1 (Rank
    // 2).
    // The Rest: g1_p1, g2_p2. Sorted: g1_p1 (Rank 3), g2_p2 (Rank 4).
    assertEquals(1, g1_p2.getRank());
    assertEquals(2, g2_p1.getRank());
    assertEquals(3, g1_p1.getRank());
    assertEquals(4, g2_p2.getRank());
  }
}
