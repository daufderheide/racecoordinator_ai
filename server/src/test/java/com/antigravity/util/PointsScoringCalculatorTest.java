package com.antigravity.util;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.PointsScoring;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class PointsScoringCalculatorTest {

  private RaceParticipant createParticipant(String name, String id) {
    Driver d = new Driver.Builder().withName(name).withEntityId(id).build();
    return new RaceParticipant(d);
  }

  private Heat createHeat(
      int heatNum,
      RaceParticipant p1,
      List<Double> p1Laps,
      RaceParticipant p2,
      List<Double> p2Laps) {
    DriverHeatData dhd1 = new DriverHeatData(p1);
    dhd1.setLane(0);
    for (double lap : p1Laps) {
      dhd1.addLap(lap, false, true);
    }

    DriverHeatData dhd2 = new DriverHeatData(p2);
    dhd2.setLane(1);
    for (double lap : p2Laps) {
      dhd2.addLap(lap, false, true);
    }

    List<DriverHeatData> drivers = Arrays.asList(dhd1, dhd2);
    HeatScoring hs = new HeatScoring();
    return new Heat(heatNum, drivers, hs, false);
  }

  @Test
  public void testNullSafety() {
    PointsScoringCalculator.calculatePoints(null, null, null, null, null, 0);
    List<RaceParticipant> list = new ArrayList<>();
    PointsScoringCalculator.calculatePoints(list, null, null, null, null, 0);
    list.add(createParticipant("D1", "id1"));
    PointsScoringCalculator.calculatePoints(list, null, null, null, null, 0);
    // Should not throw
    assertEquals(0.0, list.get(0).getTotalPoints(), 0.001);
  }

  @Test
  public void testHeatPositionPointsOnly() {
    RaceParticipant p1 = createParticipant("Driver1", "id1");
    RaceParticipant p2 = createParticipant("Driver2", "id2");
    List<RaceParticipant> participants = Arrays.asList(p1, p2);

    // Heat 1: P1 has 3 laps (5.0s, 5.0s, 5.0s), P2 has 2 laps (6.0s, 6.0s) -> P1 1st (4 pts), P2
    // 2nd (2 pts)
    Heat h1 = createHeat(1, p1, Arrays.asList(5.0, 5.0, 5.0), p2, Arrays.asList(6.0, 6.0));
    // Heat 2: P2 has 3 laps (5.0s, 5.0s, 5.0s), P1 has 2 laps (6.0s, 6.0s) -> P2 1st (4 pts), P1
    // 2nd (2 pts)
    Heat h2 = createHeat(2, p1, Arrays.asList(6.0, 6.0), p2, Arrays.asList(5.0, 5.0, 5.0));

    PointsScoring scoring = new PointsScoring(Arrays.asList(25.0, 18.0), Arrays.asList(4.0, 2.0));

    HeatScoring hs = new HeatScoring();
    OverallScoring os = new OverallScoring();

    PointsScoringCalculator.calculatePoints(
        participants, Arrays.asList(h1, h2), scoring, hs, os, 0);

    assertEquals(6.0, p1.getTotalPoints(), 0.001);
    assertEquals(6.0, p2.getTotalPoints(), 0.001);
  }

  @Test
  public void testHeatFastestLapBonus() {
    RaceParticipant p1 = createParticipant("Driver1", "id1");
    RaceParticipant p2 = createParticipant("Driver2", "id2");
    List<RaceParticipant> participants = Arrays.asList(p1, p2);

    // Heat 1: P1 (5.0s, 5.0s), P2 (4.5s, 6.0s). P1 wins on total time/laps or tie, but P2 gets
    // fastest lap (4.5s)
    Heat h1 = createHeat(1, p1, Arrays.asList(5.0, 5.0), p2, Arrays.asList(4.5, 6.0));

    PointsScoring scoring =
        new PointsScoring(
            Arrays.asList(10.0, 8.0),
            Arrays.asList(5.0, 3.0),
            0.0, // heat carryover
            1.5, // heat fastest lap bonus
            0.0,
            0.0,
            false,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    HeatScoring hs = new HeatScoring();
    OverallScoring os = new OverallScoring();

    PointsScoringCalculator.calculatePoints(participants, Arrays.asList(h1), scoring, hs, os, 0);

    // P1: 1st place heat points (5.0) = 5.0
    // P2: 2nd place heat points (3.0) + fastest lap bonus (1.5) = 4.5
    assertEquals(5.0, p1.getTotalPoints(), 0.001);
    assertEquals(4.5, p2.getTotalPoints(), 0.001);
  }

  @Test
  public void testHeatOneBonusPerDriver() {
    RaceParticipant p1 = createParticipant("Driver1", "id1");
    RaceParticipant p2 = createParticipant("Driver2", "id2");
    List<RaceParticipant> participants = Arrays.asList(p1, p2);

    // P1 leads lap and sets fastest lap
    Heat h1 = createHeat(1, p1, Arrays.asList(4.0, 4.0), p2, Arrays.asList(6.0, 6.0));

    PointsScoring scoring =
        new PointsScoring(
            Arrays.asList(10.0, 8.0),
            Arrays.asList(5.0, 3.0),
            0.0,
            2.0, // fastest lap bonus
            1.0, // led lap bonus
            3.0, // most laps led bonus
            true, // one bonus per driver: should pick max bonus (3.0)
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    HeatScoring hs = new HeatScoring();
    OverallScoring os = new OverallScoring();

    PointsScoringCalculator.calculatePoints(participants, Arrays.asList(h1), scoring, hs, os, 0);

    // P1 gets 5.0 (1st pos) + 3.0 (max bonus) = 8.0
    assertEquals(8.0, p1.getTotalPoints(), 0.001);
  }

  @Test
  public void testOverallBonuses() {
    RaceParticipant p1 = createParticipant("Driver1", "id1");
    RaceParticipant p2 = createParticipant("Driver2", "id2");
    p1.setTotalLaps(10.0);
    p2.setTotalLaps(8.0);
    List<RaceParticipant> participants = Arrays.asList(p1, p2);

    // Heat 1: P1 lane 0 (4.5s), P2 lane 1 (5.0s)
    Heat h1 = createHeat(1, p1, Arrays.asList(4.5), p2, Arrays.asList(5.0));
    // Heat 2: P1 lane 0 (4.8s), P2 lane 1 (4.2s) -> overall fastest lap is P2 (4.2s)
    Heat h2 = createHeat(2, p1, Arrays.asList(4.8), p2, Arrays.asList(4.2));

    PointsScoring scoring =
        new PointsScoring(
            Arrays.asList(10.0, 8.0),
            Arrays.asList(0.0, 0.0), // No heat position points
            0.0,
            0.0,
            0.0,
            0.0,
            false,
            5.0, // overall fastest lap bonus -> P2 gets 5.0
            2.0, // overall fastest lap per lane bonus -> P1 wins lane 0 (4.5s: 2.0), P2 wins lane 1
            // (4.2s: 2.0)
            0.0,
            0.0,
            false);

    HeatScoring hs = new HeatScoring();
    OverallScoring os = new OverallScoring();

    PointsScoringCalculator.calculatePoints(
        participants, Arrays.asList(h1, h2), scoring, hs, os, 0);

    // P1: lane 0 fastest lap 2.0 = 2.0
    // P2: overall fastest lap 5.0 + lane 1 fastest lap 2.0 = 7.0
    assertEquals(2.0, p1.getTotalPoints(), 0.001);
    assertEquals(7.0, p2.getTotalPoints(), 0.001);
  }

  @Test
  public void testDroppedHeats() {
    RaceParticipant p1 = createParticipant("Driver1", "id1");
    List<RaceParticipant> participants = Arrays.asList(p1);

    // Heat 1: 1st place -> 10 pts
    Heat h1 =
        createHeat(1, p1, Arrays.asList(5.0), createParticipant("E1", "e1"), Arrays.asList(6.0));
    // Heat 2: 2nd place -> 5 pts
    Heat h2 =
        createHeat(2, p1, Arrays.asList(6.0), createParticipant("E2", "e2"), Arrays.asList(5.0));

    PointsScoring scoring = new PointsScoring(Arrays.asList(10.0, 8.0), Arrays.asList(10.0, 5.0));

    HeatScoring hs = new HeatScoring();
    OverallScoring os = new OverallScoring();

    // 1 dropped heat: drop lowest heat (5 pts), keep 10 pts
    PointsScoringCalculator.calculatePoints(
        participants, Arrays.asList(h1, h2), scoring, hs, os, 1);

    assertEquals(10.0, p1.getTotalPoints(), 0.001);
  }
}
