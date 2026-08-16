package com.antigravity.util;

import com.antigravity.models.Driver;
import com.antigravity.models.RankingMethod;
import com.antigravity.models.TiebreakerMethod;
import com.antigravity.race.DriverHeatData;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.Assert;
import org.junit.Test;

public class GhostRaceSimulatorTest {

  private DriverHeatData createDriverHeatData(String id, double... lapTimes) {
    DriverHeatData dhd = new DriverHeatData();
    Driver actualDriver = new Driver(id, id, id, id);
    dhd.setActualDriver(actualDriver);
    List<DriverHeatData.LapData> laps = new ArrayList<>();
    for (double t : lapTimes) {
      DriverHeatData.LapData lap = new DriverHeatData.LapData();
      lap.setLapTime(t);
      laps.add(lap);
    }
    dhd.setLaps(laps);
    return dhd;
  }

  @Test
  public void testSimulatorInstantiation() {
    GhostRaceSimulator simulator = new GhostRaceSimulator();
    Assert.assertNotNull(simulator);
  }

  @Test
  public void testGhostRace() {
    DriverHeatData a =
        createDriverHeatData(
            "A", 10.0, 10.0, 10.0, 10.0, 10.0); // finishes laps at 10, 20, 30, 40, 50
    DriverHeatData b =
        createDriverHeatData(
            "B", 11.0, 11.0, 11.0, 11.0, 5.0); // finishes laps at 11, 22, 33, 44, 49

    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(a, b), RankingMethod.LAP_COUNT, TiebreakerMethod.TOTAL_TIME);

    // A leads lap 1, 2, 3, 4
    // B completes lap 5 at T=49, A completes lap 5 at T=50.
    // At T=49, B has 5 laps, A has 4 laps. B is leader.
    // B leads lap 5.

    Assert.assertEquals(4, (int) led.get("A"));
    Assert.assertEquals(1, (int) led.get("B"));
  }

  @Test
  public void testGhostRace_FastestLapRanking() {
    // Driver A runs 10.0, 9.0, 8.0 (cumulative: 10, 19, 27)
    // Driver B runs 9.5, 7.5, 9.0 (cumulative: 9.5, 17, 26)
    DriverHeatData a = createDriverHeatData("A", 10.0, 9.0, 8.0);
    DriverHeatData b = createDriverHeatData("B", 9.5, 7.5, 9.0);

    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(a, b), RankingMethod.FASTEST_LAP, TiebreakerMethod.TOTAL_TIME);

    Assert.assertEquals(0, (int) led.get("A"));
    Assert.assertEquals(3, (int) led.get("B"));
  }

  @Test
  public void testGhostRace_AverageLapRanking() {
    DriverHeatData a = createDriverHeatData("A", 5.0, 5.0);
    DriverHeatData b = createDriverHeatData("B", 6.0, 6.0);

    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(a, b), RankingMethod.AVERAGE_LAP, TiebreakerMethod.FASTEST_LAP_TIME);

    Assert.assertEquals(2, (int) led.get("A"));
    Assert.assertEquals(0, (int) led.get("B"));
  }

  @Test
  public void testGhostRace_TotalTimeRanking() {
    DriverHeatData a = createDriverHeatData("A", 4.0, 4.0);
    DriverHeatData b = createDriverHeatData("B", 5.0, 5.0);

    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(a, b), RankingMethod.TOTAL_TIME, TiebreakerMethod.FASTEST_LAP_TIME);

    Assert.assertEquals(2, (int) led.get("A"));
    Assert.assertEquals(0, (int) led.get("B"));
  }

  @Test
  public void testGhostRace_MedianLapTiebreaker() {
    DriverHeatData a = createDriverHeatData("A", 5.0, 5.0, 5.0);
    DriverHeatData b = createDriverHeatData("B", 5.0, 5.0, 5.0);

    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(a, b), RankingMethod.LAP_COUNT, TiebreakerMethod.MEDIAN_LAP_TIME);

    Assert.assertNotNull(led);
  }

  @Test
  public void testTotalLapsLedEqualsMaxLaps() {
    DriverHeatData d2 = createDriverHeatData("d2", 3.098, 4.500, 3.840, 3.098);
    DriverHeatData d4 = createDriverHeatData("d4", 3.547, 3.547, 4.106, 3.547);
    DriverHeatData d1 = createDriverHeatData("d1", 3.151, 4.052, 4.300, 3.151);
    DriverHeatData d3 = createDriverHeatData("d3", 3.496, 4.114, 3.496, 4.699);

    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(d2, d4, d1, d3),
            RankingMethod.LAP_COUNT,
            TiebreakerMethod.AVERAGE_LAP_TIME);

    int totalLapsLed = led.values().stream().mapToInt(Integer::intValue).sum();
    Assert.assertEquals(4, totalLapsLed);
  }

  @Test
  public void testEmptyAndNullInputs() {
    Assert.assertTrue(
        GhostRaceSimulator.calculateLapsLed(
                null, RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME)
            .isEmpty());
    Assert.assertTrue(
        GhostRaceSimulator.calculateLapsLed(
                new ArrayList<>(), RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME)
            .isEmpty());
    Map<String, Integer> zeroLaps =
        GhostRaceSimulator.calculateLapsLed(
            Collections.singletonList(createDriverHeatData("d1")),
            RankingMethod.LAP_COUNT,
            TiebreakerMethod.AVERAGE_LAP_TIME);
    Assert.assertEquals(1, zeroLaps.size());
    Assert.assertEquals(0, (int) zeroLaps.get("d1"));
  }

  @Test
  public void testSingleDriverLeadsAllLaps() {
    DriverHeatData d = createDriverHeatData("d1", 5.0, 5.0, 5.0);
    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(d), RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);
    Assert.assertEquals(1, led.size());
    Assert.assertEquals(3, (int) led.get("d1"));
  }

  @Test
  public void testEmptyLanesIgnored() {
    DriverHeatData d = createDriverHeatData("d1", 5.0, 5.0);
    DriverHeatData empty = new DriverHeatData();
    empty.setActualDriver(Driver.EMPTY_DRIVER);

    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(d, empty), RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);
    Assert.assertEquals(1, led.size());
    Assert.assertEquals(2, (int) led.get("d1"));
  }

  @Test
  public void testGetDriverId() {
    Assert.assertNull(GhostRaceSimulator.getDriverId(null));

    DriverHeatData dhd = new DriverHeatData();
    dhd.setActualDriver(new Driver("drv123", "Nick", "id1", ""));
    Assert.assertEquals("id1", GhostRaceSimulator.getDriverId(dhd));
  }

  @Test
  public void testLapPerformanceSnapshotAccessors() {
    GhostRaceSimulator.LapPerformanceSnapshot snapshot =
        new GhostRaceSimulator.LapPerformanceSnapshot("p1", 10, 55.5, 4.8, 5.55, 5.5, false, 42);

    Assert.assertEquals("p1", snapshot.getParticipantId());
    Assert.assertEquals(10.0, snapshot.getAdjustedLapCount(), 0.001);
    Assert.assertEquals(55.5, snapshot.getTotalTime(), 0.001);
    Assert.assertEquals(4.8, snapshot.getBestLapTime(), 0.001);
    Assert.assertEquals(5.55, snapshot.getAverageLapTime(), 0.001);
    Assert.assertEquals(5.5, snapshot.getMedianLapTime(), 0.001);
    Assert.assertFalse(snapshot.isEmptyParticipant());
    Assert.assertEquals(42, snapshot.getSeed());
  }

  @Test
  public void testCalculateLapsLedWithZeroOrNegativeLapTimes() {
    DriverHeatData a = createDriverHeatData("A", 0.0, -1.0, 5.0);
    DriverHeatData b = createDriverHeatData("B", 6.0, 6.0, 6.0);

    Map<String, Integer> led =
        GhostRaceSimulator.calculateLapsLed(
            Arrays.asList(a, b), RankingMethod.FASTEST_LAP, TiebreakerMethod.TOTAL_TIME);
    Assert.assertNotNull(led);
  }
}
