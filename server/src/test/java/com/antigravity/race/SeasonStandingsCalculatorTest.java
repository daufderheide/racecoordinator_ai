package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.SeasonStandingDetail;
import com.antigravity.models.SeasonStandingItem;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Test;

public class SeasonStandingsCalculatorTest {

  @Test
  public void testNullOrEmptySeasonReturnsEmptyList() {
    List<SeasonStandingItem> r1 = SeasonStandingsCalculator.calculateStandings(null);
    assertNotNull(r1);
    assertTrue(r1.isEmpty());

    Season emptySeason = new Season("Empty", 0, new ArrayList<>());
    List<SeasonStandingItem> r2 = SeasonStandingsCalculator.calculateStandings(emptySeason);
    assertNotNull(r2);
    assertTrue(r2.isEmpty());
  }

  @Test
  public void testStandingsCalculationWithMultipleRacesAndBonusPoints() {
    Map<String, Double> b1 = new HashMap<>();
    b1.put("fastest_lap", 2.0);
    Map<String, Double> hb1 = new HashMap<>();
    hb1.put("heat_1", 1.0);

    // Race 1: Driver A wins (25 + 2 overall bonus + 5 heat + 1 heat bonus = 33)
    // Driver B second (18 + 0 overall bonus + 3 heat + 0 heat bonus = 21)
    SeasonDriverResult r1A =
        new SeasonDriverResult("dA", "Driver A", 1, 25.0, 2.0, b1, 5.0, 1.0, hb1, 33.0);
    SeasonDriverResult r1B =
        new SeasonDriverResult(
            "dB",
            "Driver B",
            2,
            18.0,
            0.0,
            Collections.emptyMap(),
            3.0,
            0.0,
            Collections.emptyMap(),
            21.0);
    SeasonRaceRecord race1 =
        new SeasonRaceRecord("race1", "Race 1", 1000L, Arrays.asList(r1A, r1B));

    // Race 2: Driver B wins (25 + 0 overall bonus + 5 heat + 2 heat bonus = 32)
    // Driver A second (18 + 0 overall bonus + 3 heat + 0 heat bonus = 21)
    Map<String, Double> hb2B = new HashMap<>();
    hb2B.put("heat_2", 2.0);
    SeasonDriverResult r2B =
        new SeasonDriverResult(
            "dB", "Driver B", 1, 25.0, 0.0, Collections.emptyMap(), 5.0, 2.0, hb2B, 32.0);
    SeasonDriverResult r2A =
        new SeasonDriverResult(
            "dA",
            "Driver A",
            2,
            18.0,
            0.0,
            Collections.emptyMap(),
            3.0,
            0.0,
            Collections.emptyMap(),
            21.0);
    SeasonRaceRecord race2 =
        new SeasonRaceRecord("race2", "Race 2", 2000L, Arrays.asList(r2A, r2B));

    Season season = new Season("Test Season", 0, Arrays.asList(race1, race2));
    List<SeasonStandingItem> standings = SeasonStandingsCalculator.calculateStandings(season);

    assertNotNull(standings);
    assertEquals(2, standings.size());

    // Driver A: net = 54 (33 + 21), gross = 54, overallBonus = 2.0, heatBonus = 1.0, totalBonus =
    // 3.0
    // Driver B: net = 53 (21 + 32), gross = 53, overallBonus = 0.0, heatBonus = 2.0, totalBonus =
    // 2.0
    SeasonStandingItem itemA = standings.get(0);
    assertEquals(1, itemA.getRank());
    assertEquals("dA", itemA.getDriverId());
    assertEquals("Driver A", itemA.getDriverName());
    assertEquals(54.0, itemA.getNetPoints(), 0.001);
    assertEquals(54.0, itemA.getGrossPoints(), 0.001);
    assertEquals(2.0, itemA.getOverallBonusPoints(), 0.001);
    assertEquals(1.0, itemA.getHeatBonusPoints(), 0.001);
    assertEquals(3.0, itemA.getTotalBonusPoints(), 0.001);
    assertEquals(3.0, itemA.getBonusPoints(), 0.001);
    assertEquals(2, itemA.getRacesRun());

    SeasonStandingItem itemB = standings.get(1);
    assertEquals(2, itemB.getRank());
    assertEquals("dB", itemB.getDriverId());
    assertEquals("Driver B", itemB.getDriverName());
    assertEquals(53.0, itemB.getNetPoints(), 0.001);
    assertEquals(53.0, itemB.getGrossPoints(), 0.001);
    assertEquals(0.0, itemB.getOverallBonusPoints(), 0.001);
    assertEquals(2.0, itemB.getHeatBonusPoints(), 0.001);
    assertEquals(2.0, itemB.getTotalBonusPoints(), 0.001);
    assertEquals(2.0, itemB.getBonusPoints(), 0.001);
    assertEquals(2, itemB.getRacesRun());
  }

  @Test
  public void testStandingsCalculationWithDrops() {
    // 3 races, 1 drop
    // Driver A scores: 30 (bonus 5), 20 (bonus 2), 10 (bonus 1) -> drop 10 (bonus 1)
    // Net: 50, Gross: 60
    // Net bonuses: 5 + 2 = 7 (dropped race bonus is excluded from net bonus calculation)
    SeasonDriverResult r1A =
        new SeasonDriverResult(
            "dA",
            "Driver A",
            1,
            20.0,
            5.0,
            Collections.emptyMap(),
            5.0,
            0.0,
            Collections.emptyMap(),
            30.0);
    SeasonDriverResult r2A =
        new SeasonDriverResult(
            "dA",
            "Driver A",
            2,
            15.0,
            0.0,
            Collections.emptyMap(),
            3.0,
            2.0,
            Collections.emptyMap(),
            20.0);
    SeasonDriverResult r3A =
        new SeasonDriverResult(
            "dA",
            "Driver A",
            3,
            8.0,
            1.0,
            Collections.emptyMap(),
            1.0,
            0.0,
            Collections.emptyMap(),
            10.0);

    SeasonRaceRecord race1 =
        new SeasonRaceRecord("r1", "Race 1", 1000L, Collections.singletonList(r1A));
    SeasonRaceRecord race2 =
        new SeasonRaceRecord("r2", "Race 2", 2000L, Collections.singletonList(r2A));
    SeasonRaceRecord race3 =
        new SeasonRaceRecord("r3", "Race 3", 3000L, Collections.singletonList(r3A));

    Season season = new Season("Drops Season", 1, Arrays.asList(race1, race2, race3));
    List<SeasonStandingItem> standings = SeasonStandingsCalculator.calculateStandings(season);

    assertEquals(1, standings.size());
    SeasonStandingItem item = standings.get(0);
    assertEquals(50.0, item.getNetPoints(), 0.001);
    assertEquals(60.0, item.getGrossPoints(), 0.001);
    assertEquals(10.0, item.getDroppedPoints(), 0.001);
    assertEquals(5.0, item.getOverallBonusPoints(), 0.001);
    assertEquals(2.0, item.getHeatBonusPoints(), 0.001);
    assertEquals(7.0, item.getTotalBonusPoints(), 0.001);
    assertEquals(7.0, item.getBonusPoints(), 0.001);
    assertEquals(3, item.getRacesRun());

    // Verify raceScores details
    List<SeasonStandingDetail> details = item.getRaceScores();
    assertEquals(3, details.size());
    assertTrue(details.get(2).isDropped());
  }

  @Test
  public void testRoundingToTwoDecimalPlaces() {
    SeasonDriverResult r1 =
        new SeasonDriverResult(
            "d1",
            "Driver 1",
            1,
            25.333333,
            2.666666,
            Collections.singletonMap("fastest_lap", 2.666666),
            3.14159,
            1.23456,
            Collections.singletonMap("heat_fastest", 1.23456),
            32.376149);

    SeasonRaceRecord race1 =
        new SeasonRaceRecord("r1", "Race 1", 1000L, Collections.singletonList(r1));
    Season season = new Season("Rounding Season", 0, Collections.singletonList(race1));

    List<SeasonStandingItem> standings = SeasonStandingsCalculator.calculateStandings(season);
    assertEquals(1, standings.size());
    SeasonStandingItem item = standings.get(0);

    assertEquals(32.38, item.getNetPoints(), 0.001);
    assertEquals(32.38, item.getGrossPoints(), 0.001);
    assertEquals(2.67, item.getOverallBonusPoints(), 0.001);
    assertEquals(1.23, item.getHeatBonusPoints(), 0.001);
    assertEquals(3.90, item.getTotalBonusPoints(), 0.001);
    assertEquals(3.90, item.getBonusPoints(), 0.001);

    SeasonStandingDetail detail = item.getRaceScores().get(0);
    assertEquals(25.33, detail.getOverallPoints(), 0.001);
    assertEquals(2.67, detail.getOverallBonusPoints(), 0.001);
    assertEquals(3.14, detail.getHeatPoints(), 0.001);
    assertEquals(1.23, detail.getHeatBonusPoints(), 0.001);
    assertEquals(32.38, detail.getTotalPoints(), 0.001);
  }
}
