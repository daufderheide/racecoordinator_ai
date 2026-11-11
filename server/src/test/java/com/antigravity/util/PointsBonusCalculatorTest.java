package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.BonusScoringConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.PointsScoring;
import com.antigravity.models.RankingMethod;
import com.antigravity.models.SeasonScoring;
import com.antigravity.models.TiebreakerMethod;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Test;

public class PointsBonusCalculatorTest {

  private RaceParticipant createParticipant(String name, String id) {
    Driver d = new Driver.Builder().withName(name).withEntityId(id).build();
    return new RaceParticipant(d);
  }

  @Test
  public void testInstantiation() {
    assertNotNull(new PointsBonusCalculator());
  }

  @Test
  public void testGetLaneForDhd_NullAndDefaults() {
    assertEquals(2, PointsBonusCalculator.getLaneForDhd(null, 2, null));

    DriverHeatData dhd = new DriverHeatData();
    dhd.setLane(-1);
    assertEquals(3, PointsBonusCalculator.getLaneForDhd(dhd, 3, null));

    dhd.setLane(1);
    assertEquals(1, PointsBonusCalculator.getLaneForDhd(dhd, 0, null));

    Heat heat = new Heat();
    Driver actual1 = new Driver.Builder().withName("D1").withEntityId("d1").build();
    Driver actual2 = new Driver.Builder().withName("D2").withEntityId("d2").build();
    dhd.setActualDriver(actual1);
    DriverHeatData dhd2 = new DriverHeatData();
    dhd2.setActualDriver(actual2);
    dhd2.setLane(1);
    heat.setDrivers(Arrays.asList(dhd, dhd2));
    // Duplicated lanes fallback to laneIdx
    assertEquals(0, PointsBonusCalculator.getLaneForDhd(dhd, 0, heat));
  }

  @Test
  public void testGetDriverIdFromDhd() {
    assertNull(PointsBonusCalculator.getDriverIdFromDhd(null));

    DriverHeatData dhd = new DriverHeatData();
    dhd.setObjectId(null);
    assertNull(PointsBonusCalculator.getDriverIdFromDhd(dhd));

    Driver actual = new Driver.Builder().withName("Actual").withEntityId("a1").build();
    dhd.setActualDriver(actual);
    assertEquals("a1", PointsBonusCalculator.getDriverIdFromDhd(dhd));

    RaceParticipant rp = createParticipant("Driver 1", "d1");
    dhd.setDriver(rp);
    assertEquals("d1", PointsBonusCalculator.getDriverIdFromDhd(dhd));
  }

  @Test
  public void testGetParticipantIdentifier() {
    assertEquals("", PointsBonusCalculator.getParticipantIdentifier(null));

    RaceParticipant rp = new RaceParticipant();
    rp.setObjectId(null);
    assertEquals("", PointsBonusCalculator.getParticipantIdentifier(rp));

    rp = createParticipant("Driver 1", "d1");
    assertEquals("d1", PointsBonusCalculator.getParticipantIdentifier(rp));
  }

  @Test
  public void testCalculateSingleHeatBonuses_FastestLapAndLapsLed() {
    RaceParticipant rp1 = createParticipant("D1", "d1");
    RaceParticipant rp2 = createParticipant("D2", "d2");

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    DriverHeatData dhd2 = new DriverHeatData(rp2);

    dhd1.addLap(10.0, false, true);
    dhd1.addLap(11.0, false, true);

    dhd2.addLap(9.5, false, true); // D2 leads lap 1 (9.5 < 10.0) and has fastest lap
    dhd2.addLap(12.0, false, true); // D1 leads lap 2 (21.0 < 21.5)

    Heat heat = new Heat();
    heat.setDrivers(Arrays.asList(dhd1, dhd2));

    BonusScoringConfig config =
        new PointsScoring(
            null, null, 0.0, 1.0, // fastest lap
            2.0, // led lap
            3.0, // most laps led
            false, 0.0, 0.0, 0.0, 0.0, false);

    Map<String, List<Double>> bonusesMap = new HashMap<>();
    Map<String, Map<String, Double>> breakdownMap = new HashMap<>();

    PointsBonusCalculator.calculateSingleHeatBonuses(
        heat,
        1,
        config,
        RankingMethod.LAP_COUNT,
        TiebreakerMethod.AVERAGE_LAP_TIME,
        Arrays.asList(rp1, rp2),
        bonusesMap,
        breakdownMap);

    // D2 got fastest lap bonus (1.0)
    assertTrue(bonusesMap.get("d2").contains(1.0));
    assertEquals(1.0, breakdownMap.get("d2").get("fastest_lap_heat_1"), 0.001);

    // Both led at least 1 lap
    assertTrue(bonusesMap.get("d1").contains(2.0));
    assertTrue(bonusesMap.get("d2").contains(2.0));
  }

  @Test
  public void testCalculateOverallBonuses_FastestLapPerLaneAndOverall() {
    RaceParticipant rp1 = createParticipant("D1", "d1");
    RaceParticipant rp2 = createParticipant("D2", "d2");

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);
    dhd1.addLap(8.0, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);
    dhd2.addLap(10.0, false, true);

    Heat heat = new Heat();
    heat.setDrivers(Arrays.asList(dhd1, dhd2));

    BonusScoringConfig config =
        new SeasonScoring(
            null, null, 0.0, 0.0, 0.0, 0.0, false, 0.0, 1.5, // overall fastest
            2.5, // fastest per lane
            0.0, 0.0, false);

    Map<String, List<Double>> bonusesMap = new HashMap<>();
    Map<String, Map<String, Double>> breakdownMap = new HashMap<>();

    PointsBonusCalculator.calculateOverallBonuses(
        Arrays.asList(heat),
        config,
        RankingMethod.LAP_COUNT,
        TiebreakerMethod.AVERAGE_LAP_TIME,
        Arrays.asList(rp1, rp2),
        bonusesMap,
        breakdownMap);

    // D1 is overall fastest (8.0 < 10.0) -> gets 1.5
    assertTrue(bonusesMap.get("d1").contains(1.5));
    // D1 is lane 1 fastest -> gets 2.5
    assertTrue(bonusesMap.get("d1").contains(2.5));
    // D2 is lane 2 fastest -> gets 2.5
    assertTrue(bonusesMap.get("d2").contains(2.5));
  }

  @Test
  public void testResolveOneBonusPerDriver() {
    Map<String, List<Double>> bonuses = new HashMap<>();
    bonuses.put("d1", new ArrayList<>(Arrays.asList(1.0, 3.0, 2.0)));

    Map<String, Map<String, Double>> breakdown = new HashMap<>();
    Map<String, Double> d1Breakdown = new HashMap<>();
    d1Breakdown.put("b1", 1.0);
    d1Breakdown.put("b3", 3.0);
    d1Breakdown.put("b2", 2.0);
    breakdown.put("d1", d1Breakdown);

    PointsBonusCalculator.resolveOneBonusPerDriver(bonuses, breakdown, true);

    assertEquals(1, bonuses.get("d1").size());
    assertEquals(3.0, bonuses.get("d1").get(0), 0.001);
    assertEquals(1, breakdown.get("d1").size());
    assertEquals(3.0, breakdown.get("d1").get("b3"), 0.001);

    // When disabled, no reduction
    bonuses.put("d2", new ArrayList<>(Arrays.asList(1.0, 2.0)));
    PointsBonusCalculator.resolveOneBonusPerDriver(bonuses, null, false);
    assertEquals(2, bonuses.get("d2").size());
  }

  @Test
  public void testCalculateOverallBonusesSum_NullAndEmptySafety() {
    assertTrue(
        PointsBonusCalculator.calculateOverallBonusesSum(
                null, null, RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME, null)
            .isEmpty());

    assertTrue(
        PointsBonusCalculator.calculateOverallBonusesSum(
                new ArrayList<>(),
                null,
                RankingMethod.LAP_COUNT,
                TiebreakerMethod.AVERAGE_LAP_TIME,
                null)
            .isEmpty());
  }
}
