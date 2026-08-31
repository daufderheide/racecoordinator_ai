package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.SeasonScoring;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.util.SeasonPointsCalculator.DriverRaceScoreDetail;
import com.antigravity.util.SeasonPointsCalculator.DriverSeasonStanding;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;

public class SeasonPointsCalculatorTest {

  @Test
  public void testUnstartedRaceAwardsNoHeatPoints() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(10000.0, 1000.0, 100.0, 0.0), Arrays.asList(50.0, 9.0, 4.0, 1.0));
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new NotStarted());

    Driver driverA = new Driver("The Girls", "The Girls", "d1", null);
    Driver driverB = new Driver("Sports Mode", "Sports Mode", "d2", null);

    RaceParticipant rpA = new RaceParticipant(driverA);
    rpA.setRank(1);
    RaceParticipant rpB = new RaceParticipant(driverB);
    rpB.setRank(2);

    List<RaceParticipant> participants = Arrays.asList(rpA, rpB);
    when(race.getDrivers()).thenReturn(participants);

    DriverHeatData dhd1 = new DriverHeatData(rpA);
    DriverHeatData dhd2 = new DriverHeatData(rpB);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    Heat heat2 = new Heat(2, Arrays.asList(dhd2, dhd1), false);
    List<Heat> heats = Arrays.asList(heat1, heat2);

    when(race.getHeats()).thenReturn(heats);
    when(race.getCurrentHeat()).thenReturn(heat1);

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);
    assertEquals(2, standings.size());

    // Both drivers should have 0 heat points because no heat has completed/started laps
    DriverSeasonStanding standingA =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding standingB =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    assertEquals(10000.0, standingA.getNetPoints(), 0.001);
    assertEquals(0.0, standingA.getCurrentRacePoints() - 10000.0, 0.001); // 0 heat points

    assertEquals(1000.0, standingB.getNetPoints(), 0.001);
    assertEquals(0.0, standingB.getCurrentRacePoints() - 1000.0, 0.001); // 0 heat points
  }

  @Test
  public void testCompletedHeatAwardsHeatPointsToParticipantDriver() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(10000.0, 1000.0, 100.0, 0.0), Arrays.asList(50.0, 9.0, 4.0, 1.0));
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new HeatOver());

    Driver teamDriver = new Driver("The Girls", "The Girls", "d1", null);
    Driver actualDriver = new Driver("Bank Farter", "Bank Farter", "d1_member", null);

    RaceParticipant rpA = new RaceParticipant(teamDriver);
    rpA.setRank(1);

    when(race.getDrivers()).thenReturn(Arrays.asList(rpA));

    DriverHeatData dhd1 = new DriverHeatData(rpA, actualDriver);
    Heat heat1 = new Heat(1, Arrays.asList(dhd1), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));
    when(race.getCurrentHeat()).thenReturn(heat1);

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding standingA =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    // 10,000 overall points + 50 heat points = 10,050
    assertEquals(10050.0, standingA.getNetPoints(), 0.001);
  }

  @Test
  public void testRacingStateWithLapsAwardsLiveHeatPoints() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring = new SeasonScoring(Arrays.asList(100.0, 50.0), Arrays.asList(10.0, 5.0));
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new Racing());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLaps(Arrays.asList(new DriverHeatData.LapData(5.0, "d1", null, false)));
    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLaps(Arrays.asList(new DriverHeatData.LapData(6.0, "d2", null, false)));

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));
    when(race.getCurrentHeat()).thenReturn(heat1);

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    assertEquals(110.0, s1.getNetPoints(), 0.001);
    assertEquals(55.0, s2.getNetPoints(), 0.001);
  }

  @Test
  public void testMultipleHeatsOnlyCompletedHeatsAwardPoints() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring = new SeasonScoring(Arrays.asList(100.0, 50.0), Arrays.asList(10.0, 5.0));
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new NotStarted());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.setLaps(Arrays.asList(new DriverHeatData.LapData(5.0, "d1", null, false)));
    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    dhd2_h1.setLaps(Arrays.asList(new DriverHeatData.LapData(6.0, "d2", null, false)));

    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);

    DriverHeatData dhd1_h2 = new DriverHeatData(rp1);
    DriverHeatData dhd2_h2 = new DriverHeatData(rp2);
    Heat heat2 = new Heat(2, Arrays.asList(dhd2_h2, dhd1_h2), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2));
    when(race.getCurrentHeat()).thenReturn(heat2);

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    assertEquals(110.0, s1.getNetPoints(), 0.001);
    assertEquals(55.0, s2.getNetPoints(), 0.001);
  }

  @Test
  public void testRaceOverStateAwardsAllHeatsPoints() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring = new SeasonScoring(Arrays.asList(100.0, 50.0), Arrays.asList(10.0, 5.0));
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.setLaps(Arrays.asList(new DriverHeatData.LapData(5.0, "d1", null, false)));
    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    dhd2_h1.setLaps(Arrays.asList(new DriverHeatData.LapData(6.0, "d2", null, false)));
    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);

    DriverHeatData dhd1_h2 = new DriverHeatData(rp1);
    dhd1_h2.setLaps(Arrays.asList(new DriverHeatData.LapData(5.0, "d1", null, false)));
    DriverHeatData dhd2_h2 = new DriverHeatData(rp2);
    dhd2_h2.setLaps(Arrays.asList(new DriverHeatData.LapData(6.0, "d2", null, false)));
    Heat heat2 = new Heat(2, Arrays.asList(dhd2_h2, dhd1_h2), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2));
    when(race.getCurrentHeat()).thenReturn(heat2);

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    assertEquals(120.0, s1.getNetPoints(), 0.001);
    assertEquals(60.0, s2.getNetPoints(), 0.001);
  }

  @Test
  public void testMostHeatLapsLedTransfersWhenBeaten() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    // 0 position points, 0 heat position points, 10.0 bonus for most heat laps led
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0, 0.0),
            Arrays.asList(0.0, 0.0),
            0.0,
            0.0,
            0.0,
            10.0, // heat_bonus_most_laps_led
            false,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Heat 1: d1 leads 2 laps (lap times: 5.0, 5.0). d2 has 0 laps.
    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.addLap(5.0, false, true);
    dhd1_h1.addLap(5.0, false, true);
    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);

    // Heat 2: d2 leads 3 laps (lap times: 5.0, 5.0, 5.0). d1 has 0 laps.
    DriverHeatData dhd1_h2 = new DriverHeatData(rp1);
    DriverHeatData dhd2_h2 = new DriverHeatData(rp2);
    dhd2_h2.addLap(5.0, false, true);
    dhd2_h2.addLap(5.0, false, true);
    dhd2_h2.addLap(5.0, false, true);
    Heat heat2 = new Heat(2, Arrays.asList(dhd1_h2, dhd2_h2), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    // d1 led 2 laps in heat 1 (earning 10.0), and d2 led 3 laps in heat 2 (earning 10.0).
    // Both earn the 10.0 most heat laps led bonus for their respective heats.
    assertEquals(10.0, s1.getCurrentRacePoints(), 0.001);
    assertEquals(10.0, s2.getCurrentRacePoints(), 0.001);
  }

  @Test
  public void testMostHeatLapsLedTiedBreaksByRank() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0, 0.0),
            Arrays.asList(0.0, 0.0),
            0.0,
            0.0,
            0.0,
            100.0, // most heat laps led bonus = 100.0
            false,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    com.antigravity.models.HeatScoring heatScoring =
        new com.antigravity.models.HeatScoring(
            com.antigravity.models.HeatScoring.FinishMethod.Timed,
            10,
            com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
            com.antigravity.models.HeatScoring.HeatRankingTiebreaker.AVERAGE_LAP_TIME);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(raceModel.getHeatScoring()).thenReturn(heatScoring);
    when(race.getRaceModel()).thenReturn(raceModel);

    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("d1", "Driver 1", "d1", null);
    com.antigravity.models.Driver d2 =
        new com.antigravity.models.Driver("d2", "Driver 2", "d2", null);
    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // In heat 1, both d1 and d2 led 2 laps (tied with 2 laps led each)
    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.addLap(3.0, false, true);
    dhd1.addLap(3.0, false, true);
    dhd1.addLap(6.0, false, true);
    dhd1.addLap(6.0, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.addLap(5.0, false, true);
    dhd2.addLap(5.0, false, true);
    dhd2.addLap(2.0, false, true);
    dhd2.addLap(2.0, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));
    when(race.getState()).thenReturn(new RaceOver());

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    // Since both d1 and d2 have 2 laps led, only the higher ranked driver (d1, rank 1) gets the
    // 100.0 bonus
    assertEquals(100.0, s1.getCurrentRacePoints(), 0.001);
    assertEquals(0.0, s2.getCurrentRacePoints(), 0.001);
  }

  @Test
  public void testCarryOverPercentagesAndBonuses() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(50.0, 30.0),
            Arrays.asList(10.0, 5.0),
            50.0, // 50% heat carry over
            5.0, // fastest heat lap bonus
            2.0, // led heat lap bonus
            0.0, // most heat laps led bonus
            false,
            25.0, // 25% overall carry over
            15.0, // overall fastest lap bonus
            4.0, // overall fastest lap per lane bonus
            3.0, // overall led lap bonus
            8.0, // overall most laps led bonus
            false);

    com.antigravity.models.HeatScoring heatScoring =
        new com.antigravity.models.HeatScoring(
            com.antigravity.models.HeatScoring.FinishMethod.Timed,
            10,
            com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
            com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            com.antigravity.models.HeatScoring.AllowFinish.None);

    com.antigravity.models.OverallScoring overallScoring =
        new com.antigravity.models.OverallScoring(
            0,
            com.antigravity.models.OverallScoring.OverallRanking.LAP_COUNT,
            com.antigravity.models.OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(raceModel.getHeatScoring()).thenReturn(heatScoring);
    when(raceModel.getOverallScoring()).thenReturn(overallScoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Heat 1: d1 runs 4 laps on lane 0 (times: 5.0, 4.8, 5.0, 5.0).
    //         d2 runs 2 laps on lane 1 (times: 6.0, 6.0).
    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.setLane(0);
    dhd1_h1.addLap(5.0, false, true);
    dhd1_h1.addLap(4.8, false, true);
    dhd1_h1.addLap(5.0, false, true);
    dhd1_h1.addLap(5.0, false, true);

    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    dhd2_h1.setLane(1);
    dhd2_h1.addLap(6.0, false, true);
    dhd2_h1.addLap(6.0, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    assertNotNull(s1.getCurrentRaceScoreDetail());
    assertNotNull(s2.getCurrentRaceScoreDetail());

    // d1 overall: 50.0 (pos pts) + 1.0 (25% of 4 laps) = 51.0
    // d1 overall bonuses: 15.0 (fastest lap 4.8) + 4.0 (fastest lane 0) + 3.0 (led lap) + 8.0 (most
    // laps led) = 30.0
    // d1 heat: 10.0 (heat pos pts) + 2.0 (50% of 4 laps) = 12.0
    // d1 heat bonuses: 5.0 (fastest heat lap 4.8) + 2.0 (led lap) = 7.0
    // d1 total: 51.0 + 30.0 + 12.0 + 7.0 = 100.0
    assertEquals(51.0, s1.getCurrentRaceScoreDetail().getOverallPoints(), 0.001);
    assertEquals(30.0, s1.getCurrentRaceScoreDetail().getOverallBonusPoints(), 0.001);
    assertEquals(12.0, s1.getCurrentRaceScoreDetail().getHeatPoints(), 0.001);
    assertEquals(7.0, s1.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
    assertEquals(100.0, s1.getCurrentRaceScoreDetail().getTotalPoints(), 0.001);
    assertEquals(1, s1.getCurrentRaceScoreDetail().getOverallRank());

    // d2 overall: 30.0 (pos pts) + 0.5 (25% of 2 laps) = 30.5
    // d2 overall bonuses: 4.0 (fastest lane 1: 6.0) = 4.0
    // d2 heat: 5.0 (heat pos pts) + 1.0 (50% of 2 laps) = 6.0
    // d2 heat bonuses: 0.0
    // d2 total: 30.5 + 4.0 + 6.0 + 0.0 = 40.5
    assertEquals(30.5, s2.getCurrentRaceScoreDetail().getOverallPoints(), 0.001);
    assertEquals(4.0, s2.getCurrentRaceScoreDetail().getOverallBonusPoints(), 0.001);
    assertEquals(6.0, s2.getCurrentRaceScoreDetail().getHeatPoints(), 0.001);
    assertEquals(0.0, s2.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
    assertEquals(40.5, s2.getCurrentRaceScoreDetail().getTotalPoints(), 0.001);
  }

  @Test
  public void testOneBonusPerDriverLimitation() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0),
            Arrays.asList(0.0),
            0.0,
            10.0, // fastest heat lap bonus
            3.0, // led heat lap bonus
            0.0,
            true, // heat 1 bonus per driver
            0.0,
            0.0, // overall fastest lap bonus (unused)
            20.0, // overall fastest per lane bonus
            5.0, // overall led lap bonus
            12.0, // overall most laps led bonus
            true // overall 1 bonus per driver
            );

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    when(race.getDrivers()).thenReturn(Arrays.asList(rp1));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.addLap(5.0, false, true);
    Heat heat1 = new Heat(1, Arrays.asList(dhd1), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 = standings.get(0);
    // d1 qualified for multiple overall bonuses (20.0, 5.0, 12.0). With 1 bonus per driver, takes
    // max (20.0).
    assertEquals(20.0, s1.getCurrentRaceScoreDetail().getOverallBonusPoints(), 0.001);
    // d1 qualified for multiple heat bonuses (10.0, 3.0). With 1 bonus per driver, takes max
    // (10.0).
    assertEquals(10.0, s1.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
    assertEquals(30.0, s1.getCurrentRaceScoreDetail().getTotalPoints(), 0.001);
  }

  @Test
  public void testHeatOneBonusPerDriverWithMostLapsLedAndFastestLap() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0),
            Arrays.asList(0.0),
            0.0,
            50.0, // fastest heat lap bonus
            10.0, // led heat lap bonus
            100.0, // most heat laps led bonus
            true, // heat 1 bonus per driver
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    when(race.getDrivers()).thenReturn(Arrays.asList(rp1));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.addLap(5.0, false, true);
    dhd1.addLap(4.5, false, true);
    Heat heat1 = new Heat(1, Arrays.asList(dhd1), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 = standings.get(0);
    // d1 qualifies for fastest heat lap (50.0), led heat lap (10.0), and most heat laps led
    // (100.0).
    // With 1 heat bonus per driver checked, d1 should only receive 100.0 (the highest one).
    assertEquals(100.0, s1.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
    assertEquals(100.0, s1.getCurrentRaceScoreDetail().getTotalPoints(), 0.001);
  }

  @Test
  public void testHeatOneBonusPerDriverAcrossMultipleHeats() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0),
            Arrays.asList(0.0),
            0.0,
            50.0, // fastest heat lap bonus
            10.0, // led heat lap bonus
            100.0, // most heat laps led bonus
            true, // heat 1 bonus per driver
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Heat 1: d1 runs 3 laps (times: 5.0, 4.0, 4.0). d2 runs 1 lap (time: 6.0).
    // d1 earns: most heat laps led (100.0), fastest lap (50.0), led lap (10.0) -> resolved to 100.0
    // for Heat 1.
    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.setLane(0);
    dhd1_h1.addLap(5.0, false, true);
    dhd1_h1.addLap(4.0, false, true);
    dhd1_h1.addLap(4.0, false, true);

    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    dhd2_h1.setLane(1);
    dhd2_h1.addLap(6.0, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);

    // Heat 2: d2 runs 3 laps (times: 3.0, 3.0, 3.0). d1 runs 2 laps (times: 4.0, 2.5).
    // d2 earns: most heat laps led (100.0), led lap (10.0) -> resolved to 100.0 for Heat 2.
    // d1 earns: fastest heat lap (50.0, 2.5s) -> resolved to 50.0 for Heat 2.
    DriverHeatData dhd1_h2 = new DriverHeatData(rp1);
    dhd1_h2.setLane(1);
    dhd1_h2.addLap(4.0, false, true);
    dhd1_h2.addLap(2.5, false, true);

    DriverHeatData dhd2_h2 = new DriverHeatData(rp2);
    dhd2_h2.setLane(0);
    dhd2_h2.addLap(3.0, false, true);
    dhd2_h2.addLap(3.0, false, true);
    dhd2_h2.addLap(3.0, false, true);

    Heat heat2 = new Heat(2, Arrays.asList(dhd1_h2, dhd2_h2), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    // d1 gets: Heat 1 (100.0) + Heat 2 (50.0) = 150.0
    assertEquals(150.0, s1.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
    // d2 gets: Heat 1 (0.0) + Heat 2 (100.0) = 100.0
    assertEquals(100.0, s2.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
  }

  @Test
  public void testHeatMostLapsLedTieBreaksToSingleDriver() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0),
            Arrays.asList(0.0),
            0.0,
            0.0,
            10.0, // led heat lap bonus = 10.0
            100.0, // most heat laps led bonus = 100.0
            false, // heat 1 bonus per driver = false
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Lap 1: d1 runs 3.0s, d2 runs 5.0s -> d1 leads lap 1.
    // Lap 2: d1 runs 5.0s (cumulative 8.0s), d2 runs 2.0s (cumulative 7.0s) -> d2 leads lap 2.
    // Both d1 and d2 have led 1 lap.
    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);
    dhd1.addLap(3.0, false, true);
    dhd1.addLap(5.0, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);
    dhd2.addLap(5.0, false, true);
    dhd2.addLap(2.0, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    // Both led at least 1 lap (10.0 pts), but only d1 (rank 1) gets most laps led (100.0 pts)
    assertEquals(110.0, s1.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
    assertEquals(10.0, s2.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
  }

  @Test
  public void testHeatMostLapsLedTieWithOneBonusPerDriver() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0),
            Arrays.asList(0.0),
            0.0,
            0.0,
            10.0, // led heat lap bonus = 10.0
            100.0, // most heat laps led bonus = 100.0
            true, // heat 1 bonus per driver = true
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Both d1 and d2 lead 1 lap
    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);
    dhd1.addLap(3.0, false, true);
    dhd1.addLap(5.0, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);
    dhd2.addLap(5.0, false, true);
    dhd2.addLap(2.0, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    // d1 has [100.0, 10.0] -> resolved to 100.0
    // d2 has [10.0] -> resolved to 10.0
    assertEquals(100.0, s1.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
    assertEquals(10.0, s2.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
  }

  @Test
  public void testHeatFastestLapTiedAwardsBothDrivers() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0),
            Arrays.asList(0.0),
            0.0,
            50.0, // fastest heat lap bonus = 50.0
            0.0,
            0.0,
            false,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Both d1 and d2 set identical fastest lap of 3.200s
    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);
    dhd1.addLap(3.2, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);
    dhd2.addLap(3.2, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    // Both drivers receive the 50.0 fastest lap bonus
    assertEquals(50.0, s1.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
    assertEquals(50.0, s2.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
  }

  @Test
  public void testHeatBonusesIgnoreEmptyLanes() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0),
            Arrays.asList(0.0),
            0.0,
            50.0, // fastest heat lap bonus
            10.0, // led heat lap bonus
            100.0, // most heat laps led bonus
            false,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);

    RaceParticipant emptyParticipant = new RaceParticipant(Driver.EMPTY_DRIVER);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, emptyParticipant));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);
    dhd1.addLap(4.0, false, true);

    DriverHeatData dhdEmpty = new DriverHeatData(emptyParticipant);
    dhdEmpty.setLane(1);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhdEmpty), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    // Only d1 should be in the active driver standings, receiving all heat bonuses
    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();

    assertEquals(160.0, s1.getCurrentRaceScoreDetail().getHeatBonusPoints(), 0.001);
  }

  @Test
  public void testOverallLapsLedWithFutureUnrunHeats() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0),
            Arrays.asList(0.0),
            0.0,
            0.0,
            0.0,
            0.0,
            false,
            0.0,
            0.0,
            0.0,
            10.0, // overall led lap bonus
            100.0, // overall most laps led bonus
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);
    Driver d3 = new Driver("D3", "D3", "d3", null);
    Driver d4 = new Driver("D4", "D4", "d4", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    RaceParticipant rp3 = new RaceParticipant(d3);
    rp3.setRank(3);
    RaceParticipant rp4 = new RaceParticipant(d4);
    rp4.setRank(4);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2, rp3, rp4));

    // Heat 1: d1 runs 2 laps (3.0, 3.0), d2 runs 2 laps (5.0, 5.0).
    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.setLane(0);
    dhd1_h1.addLap(3.0, false, true);
    dhd1_h1.addLap(3.0, false, true);

    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    dhd2_h1.setLane(1);
    dhd2_h1.addLap(5.0, false, true);
    dhd2_h1.addLap(5.0, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);

    // Heat 2: future unrun heat with d3 and d4 (0 laps)
    DriverHeatData dhd3_h2 = new DriverHeatData(rp3);
    dhd3_h2.setLane(0);
    DriverHeatData dhd4_h2 = new DriverHeatData(rp4);
    dhd4_h2.setLane(1);
    Heat heat2 = new Heat(2, Arrays.asList(dhd3_h2, dhd4_h2), false);

    // Heat 3: future unrun heat with d1 and d3 (0 laps) - this tests that future 0-lap heats for d1
    // do not overwrite d1's laps!
    DriverHeatData dhd1_h3 = new DriverHeatData(rp1);
    dhd1_h3.setLane(1);
    DriverHeatData dhd3_h3 = new DriverHeatData(rp3);
    dhd3_h3.setLane(0);
    Heat heat3 = new Heat(3, Arrays.asList(dhd1_h3, dhd3_h3), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2, heat3));

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    assertNotNull(standings);

    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();

    // d1 led both laps overall -> receives 10.0 (led lap) + 100.0 (most laps led) = 110.0 overall
    // bonus points
    assertEquals(110.0, s1.getCurrentRaceScoreDetail().getOverallBonusPoints(), 0.001);
    assertEquals(0.0, s2.getCurrentRaceScoreDetail().getOverallBonusPoints(), 0.001);
  }

  @Test
  public void testBonusBreakdownMapPopulated() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(50.0, 30.0),
            Arrays.asList(10.0, 5.0),
            0.0,
            5.0, // fastest heat lap bonus
            2.0, // led heat lap bonus
            8.0, // most laps led in heat bonus
            false, // heat 1 bonus per driver
            0.0,
            15.0, // overall fastest lap bonus
            4.0, // overall fastest per lane bonus
            3.0, // overall led lap bonus
            25.0, // overall most laps led bonus
            false // overall 1 bonus per driver
            );

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);
    dhd1.addLap(4.0, false, true);
    dhd1.addLap(4.0, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);
    dhd2.addLap(5.0, false, true);

    Heat heat = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);
    assertEquals(2, results.size());

    SeasonDriverResult r1 = results.get(0);
    assertNotNull(r1.getOverallBonusBreakdown());
    assertNotNull(r1.getHeatBonusBreakdown());

    // Overall breakdown for d1: fastest_lap (15.0), fastest_lap_lane_1 (4.0), led_lap (3.0),
    // most_laps_led (25.0)
    assertEquals(15.0, r1.getOverallBonusBreakdown().get("fastest_lap"), 0.001);
    assertEquals(4.0, r1.getOverallBonusBreakdown().get("fastest_lap_lane_1"), 0.001);
    assertEquals(3.0, r1.getOverallBonusBreakdown().get("led_lap"), 0.001);
    assertEquals(25.0, r1.getOverallBonusBreakdown().get("most_laps_led"), 0.001);

    // Heat breakdown for d1: fastest_lap_heat_1 (5.0), led_lap_heat_1 (2.0), most_laps_led_heat_1
    // (8.0)
    assertEquals(5.0, r1.getHeatBonusBreakdown().get("fastest_lap_heat_1"), 0.001);
    assertEquals(2.0, r1.getHeatBonusBreakdown().get("led_lap_heat_1"), 0.001);
    assertEquals(8.0, r1.getHeatBonusBreakdown().get("most_laps_led_heat_1"), 0.001);

    // d2 won Lane 1 (display Lane 2)
    SeasonDriverResult r2 = results.get(1);
    assertEquals(4.0, r2.getOverallBonusBreakdown().get("fastest_lap_lane_2"), 0.001);

    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverRaceScoreDetail detail = s1.getCurrentRaceScoreDetail();
    assertNotNull(detail);
    assertEquals(15.0, detail.getOverallBonusBreakdown().get("fastest_lap"), 0.001);
    assertEquals(4.0, detail.getOverallBonusBreakdown().get("fastest_lap_lane_1"), 0.001);
    assertEquals(5.0, detail.getHeatBonusBreakdown().get("fastest_lap_heat_1"), 0.001);
  }

  @Test
  public void testFastestLapPerLaneAwardedOncePerLaneAcrossHeats() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(50.0, 30.0),
            Arrays.asList(10.0, 5.0),
            0.0,
            0.0, // heat fastest
            0.0, // heat led
            0.0, // heat most
            false,
            0.0,
            0.0, // overall fastest
            10.0, // overall fastest lap per lane bonus = 10.0 pts per lane
            0.0, // overall led
            0.0, // overall most
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Heat 1:
    // Lane 0: d1 runs 4.5s
    // Lane 1: d2 runs 4.3s
    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.setLane(0);
    dhd1_h1.addLap(4.5, false, true);

    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    dhd2_h1.setLane(1);
    dhd2_h1.addLap(4.3, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);

    // Heat 2:
    // Lane 0: d2 runs 4.2s (beats d1's 4.5s on Lane 0)
    // Lane 1: d1 runs 4.0s (beats d2's 4.3s on Lane 1)
    DriverHeatData dhd2_h2 = new DriverHeatData(rp2);
    dhd2_h2.setLane(0);
    dhd2_h2.addLap(4.2, false, true);

    DriverHeatData dhd1_h2 = new DriverHeatData(rp1);
    dhd1_h2.setLane(1);
    dhd1_h2.addLap(4.0, false, true);

    Heat heat2 = new Heat(2, Arrays.asList(dhd2_h2, dhd1_h2), false);

    // Heat 3:
    // Lane 0: d2 runs 4.2s again on Lane 0 (should NOT award a second bonus to d2 for Lane 0)
    // Lane 1: d2 runs 4.6s on Lane 1
    DriverHeatData dhd2_h3 = new DriverHeatData(rp2);
    dhd2_h3.setLane(0);
    dhd2_h3.addLap(4.2, false, true);

    DriverHeatData dhd2_h3_l1 = new DriverHeatData(rp2);
    dhd2_h3_l1.setLane(1);
    dhd2_h3_l1.addLap(4.6, false, true);

    Heat heat3 = new Heat(3, Arrays.asList(dhd2_h3, dhd2_h3_l1), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2, heat3));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);

    SeasonDriverResult r1 =
        results.stream().filter(r -> r.getDriverId().equals("d1")).findFirst().get();
    SeasonDriverResult r2 =
        results.stream().filter(r -> r.getDriverId().equals("d2")).findFirst().get();

    // d1 won Lane 1 (lane index 1 -> display Lane 2, 4.0s) -> receives 10.0 bonus points
    assertEquals(10.0, r1.getOverallBonusPoints(), 0.001);
    assertEquals(10.0, r1.getOverallBonusBreakdown().get("fastest_lap_lane_2"), 0.001);

    // d2 won Lane 0 (lane index 0 -> display Lane 1, 4.2s) -> receives 10.0 bonus points (awarded
    // ONCE for Lane 0 despite 2 matching heats)
    assertEquals(10.0, r2.getOverallBonusPoints(), 0.001);
    assertEquals(10.0, r2.getOverallBonusBreakdown().get("fastest_lap_lane_1"), 0.001);
  }

  @Test
  public void testFourLaneTrackFastestLapPerLaneAwardedFourTimesWithBreakdown() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(100.0, 80.0, 60.0),
            Collections.emptyList(),
            0.0,
            0.0,
            0.0,
            0.0,
            false,
            0.0,
            0.0,
            5.0, // 5.0 pts per lane
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("Driver 1", "D1", "d1", null);
    Driver d2 = new Driver("Driver 2", "D2", "d2", null);
    Driver d3 = new Driver("Driver 3", "D3", "d3", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);
    RaceParticipant rp3 = new RaceParticipant(d3);
    rp3.setRank(3);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2, rp3));

    // Heat 1: 4 lanes (0, 1, 2, 3)
    // Lane 0: d1 runs 3.0s (Lane 1 fastest)
    // Lane 1: d1 runs 3.2s
    // Lane 2: d2 runs 3.1s (Lane 3 fastest)
    // Lane 3: d3 runs 3.5s
    DriverHeatData dhd1_0 = new DriverHeatData(rp1);
    dhd1_0.setLane(0);
    dhd1_0.addLap(3.0, false, true);

    DriverHeatData dhd1_1 = new DriverHeatData(rp1);
    dhd1_1.setLane(1);
    dhd1_1.addLap(3.2, false, true);

    DriverHeatData dhd2_2 = new DriverHeatData(rp2);
    dhd2_2.setLane(2);
    dhd2_2.addLap(3.1, false, true);

    DriverHeatData dhd3_3 = new DriverHeatData(rp3);
    dhd3_3.setLane(3);
    dhd3_3.addLap(3.5, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1_0, dhd1_1, dhd2_2, dhd3_3), false);

    // Heat 2:
    // Lane 1: d2 runs 2.9s (beats d1's 3.2s -> Lane 2 fastest)
    // Lane 3: d1 runs 3.3s (beats d3's 3.5s -> Lane 4 fastest)
    DriverHeatData dhd2_1 = new DriverHeatData(rp2);
    dhd2_1.setLane(1);
    dhd2_1.addLap(2.9, false, true);

    DriverHeatData dhd1_3 = new DriverHeatData(rp1);
    dhd1_3.setLane(3);
    dhd1_3.addLap(3.3, false, true);

    Heat heat2 = new Heat(2, Arrays.asList(dhd2_1, dhd1_3), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);

    SeasonDriverResult r1 =
        results.stream().filter(r -> r.getDriverId().equals("d1")).findFirst().get();
    SeasonDriverResult r2 =
        results.stream().filter(r -> r.getDriverId().equals("d2")).findFirst().get();
    SeasonDriverResult r3 =
        results.stream().filter(r -> r.getDriverId().equals("d3")).findFirst().get();

    // d1 won Lane 0 (Lane 1, 3.0s) and Lane 3 (Lane 4, 3.3s) -> 2 bonuses = 10.0 pts
    assertEquals(10.0, r1.getOverallBonusPoints(), 0.001);
    assertEquals(5.0, r1.getOverallBonusBreakdown().get("fastest_lap_lane_1"), 0.001);
    assertEquals(5.0, r1.getOverallBonusBreakdown().get("fastest_lap_lane_4"), 0.001);

    // d2 won Lane 1 (Lane 2, 2.9s) and Lane 2 (Lane 3, 3.1s) -> 2 bonuses = 10.0 pts
    assertEquals(10.0, r2.getOverallBonusPoints(), 0.001);
    assertEquals(5.0, r2.getOverallBonusBreakdown().get("fastest_lap_lane_2"), 0.001);
    assertEquals(5.0, r2.getOverallBonusBreakdown().get("fastest_lap_lane_3"), 0.001);

    // d3 won 0 lanes -> 0.0 bonus points
    assertEquals(0.0, r3.getOverallBonusPoints(), 0.001);
    assertNull(r3.getOverallBonusBreakdown().get("fastest_lap_lane_1"));

    // Total bonuses awarded across all drivers: 10 + 10 = 20 pts (4 bonuses of 5.0 pts for 4 lanes)
    double totalBonuses =
        results.stream().mapToDouble(SeasonDriverResult::getOverallBonusPoints).sum();
    assertEquals(20.0, totalBonuses, 0.001);
  }

  @Test
  public void testSingleHeatFourDriversAwardedFourPerLaneBonuses() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0, 0.0, 0.0, 0.0),
            Collections.emptyList(),
            0.0,
            0.0,
            0.0,
            0.0,
            false,
            0.0,
            0.0, // overall fastest lap bonus
            1000.0, // overall fastest lap per lane bonus = 1000.0 pts
            1.0, // led lap bonus
            100.0, // most laps led bonus
            false // 1 bonus per driver = false
            );

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("Driver 1", "D1", "d1", null);
    Driver d4 = new Driver("Driver 4", "D4", "d4", null);
    Driver d2 = new Driver("Driver 2", "D2", "d2", null);
    Driver d3 = new Driver("Driver 3", "D3", "d3", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp4 = new RaceParticipant(d4);
    rp4.setRank(2);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(3);
    RaceParticipant rp3 = new RaceParticipant(d3);
    rp3.setRank(4);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp4, rp2, rp3));

    // Heat 1: 4 drivers on 4 lanes
    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.addLap(3.421, false, true);

    DriverHeatData dhd4 = new DriverHeatData(rp4);
    dhd4.addLap(3.508, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.addLap(3.708, false, true);

    DriverHeatData dhd3 = new DriverHeatData(rp3);
    dhd3.addLap(5.178, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd4, dhd2, dhd3), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);

    SeasonDriverResult r1 =
        results.stream().filter(r -> r.getDriverId().equals("d1")).findFirst().get();
    SeasonDriverResult r4 =
        results.stream().filter(r -> r.getDriverId().equals("d4")).findFirst().get();
    SeasonDriverResult r2 =
        results.stream().filter(r -> r.getDriverId().equals("d2")).findFirst().get();
    SeasonDriverResult r3 =
        results.stream().filter(r -> r.getDriverId().equals("d3")).findFirst().get();

    // d1 got Lane 1 fastest lap bonus (1000)
    assertEquals(1000.0, r1.getOverallBonusBreakdown().get("fastest_lap_lane_1"), 0.001);

    // d4 got Lane 2 fastest lap bonus (1000)
    assertEquals(1000.0, r4.getOverallBonusBreakdown().get("fastest_lap_lane_2"), 0.001);

    // d2 got Lane 3 fastest lap bonus (1000)
    assertEquals(1000.0, r2.getOverallBonusBreakdown().get("fastest_lap_lane_3"), 0.001);

    // d3 got Lane 4 fastest lap bonus (1000)
    assertEquals(1000.0, r3.getOverallBonusBreakdown().get("fastest_lap_lane_4"), 0.001);

    // Live standings detail checks
    List<DriverSeasonStanding> standings =
        SeasonPointsCalculator.calculateLiveStandings(null, race);
    DriverSeasonStanding s1 =
        standings.stream().filter(s -> s.getDriverId().equals("d1")).findFirst().get();
    DriverSeasonStanding s4 =
        standings.stream().filter(s -> s.getDriverId().equals("d4")).findFirst().get();
    DriverSeasonStanding s2 =
        standings.stream().filter(s -> s.getDriverId().equals("d2")).findFirst().get();
    DriverSeasonStanding s3 =
        standings.stream().filter(s -> s.getDriverId().equals("d3")).findFirst().get();

    assertEquals(
        1000.0,
        s1.getCurrentRaceScoreDetail().getOverallBonusBreakdown().get("fastest_lap_lane_1"),
        0.001);
    assertEquals(
        1000.0,
        s4.getCurrentRaceScoreDetail().getOverallBonusBreakdown().get("fastest_lap_lane_2"),
        0.001);
    assertEquals(
        1000.0,
        s2.getCurrentRaceScoreDetail().getOverallBonusBreakdown().get("fastest_lap_lane_3"),
        0.001);
    assertEquals(
        1000.0,
        s3.getCurrentRaceScoreDetail().getOverallBonusBreakdown().get("fastest_lap_lane_4"),
        0.001);
  }

  @Test
  public void testOverallFastestLapAndPerLaneFastestLapAwardedTogether() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0, 0.0, 0.0, 0.0),
            Collections.emptyList(),
            0.0,
            0.0,
            0.0,
            0.0,
            false,
            0.0,
            20.0, // overall fastest lap bonus = 20.0 pts
            5.0, // overall fastest lap per lane bonus = 5.0 pts
            0.0,
            0.0,
            false // 1 bonus per driver = false
            );

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("Driver 1", "D1", "d1", null);
    Driver d2 = new Driver("Driver 2", "D2", "d2", null);
    Driver d3 = new Driver("Driver 3", "D3", "d3", null);
    Driver d4 = new Driver("Driver 4", "D4", "d4", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    RaceParticipant rp3 = new RaceParticipant(d3);
    RaceParticipant rp4 = new RaceParticipant(d4);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2, rp3, rp4));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.addLap(3.2, false, true); // fastest overall AND fastest on lane 0

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.addLap(3.4, false, true); // fastest on lane 1

    DriverHeatData dhd3 = new DriverHeatData(rp3);
    dhd3.addLap(3.6, false, true); // fastest on lane 2

    DriverHeatData dhd4 = new DriverHeatData(rp4);
    dhd4.addLap(3.8, false, true); // fastest on lane 3

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2, dhd3, dhd4), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);

    SeasonDriverResult r1 =
        results.stream().filter(r -> r.getDriverId().equals("d1")).findFirst().get();
    SeasonDriverResult r2 =
        results.stream().filter(r -> r.getDriverId().equals("d2")).findFirst().get();
    SeasonDriverResult r3 =
        results.stream().filter(r -> r.getDriverId().equals("d3")).findFirst().get();
    SeasonDriverResult r4 =
        results.stream().filter(r -> r.getDriverId().equals("d4")).findFirst().get();

    // d1 receives overall fastest lap (20.0) + Lane 1 fastest lap (5.0) = 25.0
    assertEquals(25.0, r1.getOverallBonusPoints(), 0.001);
    assertEquals(20.0, r1.getOverallBonusBreakdown().get("fastest_lap"), 0.001);
    assertEquals(5.0, r1.getOverallBonusBreakdown().get("fastest_lap_lane_1"), 0.001);

    // d2 receives Lane 2 fastest lap (5.0)
    assertEquals(5.0, r2.getOverallBonusPoints(), 0.001);
    assertEquals(5.0, r2.getOverallBonusBreakdown().get("fastest_lap_lane_2"), 0.001);
    assertNull(r2.getOverallBonusBreakdown().get("fastest_lap"));

    // d3 receives Lane 3 fastest lap (5.0)
    assertEquals(5.0, r3.getOverallBonusPoints(), 0.001);
    assertEquals(5.0, r3.getOverallBonusBreakdown().get("fastest_lap_lane_3"), 0.001);

    // d4 receives Lane 4 fastest lap (5.0)
    assertEquals(5.0, r4.getOverallBonusPoints(), 0.001);
    assertEquals(5.0, r4.getOverallBonusBreakdown().get("fastest_lap_lane_4"), 0.001);
  }

  @Test
  public void testOneBonusPerDriverWithOverallFastestAndPerLaneBonus() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0, 0.0),
            Collections.emptyList(),
            0.0,
            0.0,
            0.0,
            0.0,
            false,
            0.0,
            20.0, // overall fastest lap bonus = 20.0 pts
            5.0, // overall fastest lap per lane bonus = 5.0 pts
            0.0,
            0.0,
            true // 1 bonus per driver = TRUE
            );

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("Driver 1", "D1", "d1", null);
    Driver d2 = new Driver("Driver 2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    RaceParticipant rp2 = new RaceParticipant(d2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.addLap(3.0, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.addLap(3.5, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Arrays.asList(heat1));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);

    SeasonDriverResult r1 =
        results.stream().filter(r -> r.getDriverId().equals("d1")).findFirst().get();
    SeasonDriverResult r2 =
        results.stream().filter(r -> r.getDriverId().equals("d2")).findFirst().get();

    // d1 qualified for 20.0 (overall fastest) and 5.0 (lane 1 fastest). With 1 bonus limit,
    // receives max (20.0).
    assertEquals(20.0, r1.getOverallBonusPoints(), 0.001);

    // d2 qualified for 5.0 (lane 2 fastest).
    assertEquals(5.0, r2.getOverallBonusPoints(), 0.001);
  }

  @Test
  public void testPerLaneFastestLapTieAwardsBothDrivers() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0, 0.0),
            Collections.emptyList(),
            0.0,
            0.0,
            0.0,
            0.0,
            false,
            0.0,
            0.0,
            8.0, // overall fastest lap per lane = 8.0 pts
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("Driver 1", "D1", "d1", null);
    Driver d2 = new Driver("Driver 2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    RaceParticipant rp2 = new RaceParticipant(d2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Heat 1: d1 runs 4.0s on Lane 0, d2 runs 4.5s on Lane 1
    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.setLane(0);
    dhd1_h1.addLap(4.0, false, true);

    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    dhd2_h1.setLane(1);
    dhd2_h1.addLap(4.5, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);

    // Heat 2: d2 runs 4.0s on Lane 0 (exact tie with d1 on Lane 0), d1 runs 5.0s on Lane 1
    DriverHeatData dhd2_h2 = new DriverHeatData(rp2);
    dhd2_h2.setLane(0);
    dhd2_h2.addLap(4.0, false, true);

    DriverHeatData dhd1_h2 = new DriverHeatData(rp1);
    dhd1_h2.setLane(1);
    dhd1_h2.addLap(5.0, false, true);

    Heat heat2 = new Heat(2, Arrays.asList(dhd2_h2, dhd1_h2), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);

    SeasonDriverResult r1 =
        results.stream().filter(r -> r.getDriverId().equals("d1")).findFirst().get();
    SeasonDriverResult r2 =
        results.stream().filter(r -> r.getDriverId().equals("d2")).findFirst().get();

    // Both d1 and d2 tied on Lane 0 (4.0s) -> both receive 8.0 pts for Lane 1
    assertEquals(8.0, r1.getOverallBonusPoints(), 0.001);
    assertEquals(8.0, r1.getOverallBonusBreakdown().get("fastest_lap_lane_1"), 0.001);
    assertNull(r1.getOverallBonusBreakdown().get("fastest_lap_lane_2"));

    // d2 also won Lane 1 (4.5s vs 5.0s) -> receives 8.0 (Lane 1) + 8.0 (Lane 2) = 16.0 pts
    assertEquals(16.0, r2.getOverallBonusPoints(), 0.001);
    assertEquals(8.0, r2.getOverallBonusBreakdown().get("fastest_lap_lane_1"), 0.001);
    assertEquals(8.0, r2.getOverallBonusBreakdown().get("fastest_lap_lane_2"), 0.001);
  }

  @Test
  public void testMultiHeatDriverBonusBreakdownIdentifiesHeats() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(0.0, 0.0),
            Arrays.asList(0.0, 0.0),
            0.0,
            5.0, // heat bonus fastest lap = 5.0 pts
            2.0, // heat bonus led lap = 2.0 pts
            0.0,
            false,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            false);

    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("Driver 1", "D1", "d1", null);
    Driver d2 = new Driver("Driver 2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    RaceParticipant rp2 = new RaceParticipant(d2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    // Heat 1: d1 runs 3.0s, d2 runs 3.5s -> d1 wins heat fastest lap
    DriverHeatData dhd1_h1 = new DriverHeatData(rp1);
    dhd1_h1.setLane(0);
    dhd1_h1.addLap(3.0, false, true);

    DriverHeatData dhd2_h1 = new DriverHeatData(rp2);
    dhd2_h1.setLane(1);
    dhd2_h1.addLap(3.5, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), false);

    // Heat 2: d2 runs 2.8s, d1 runs 3.2s -> d2 wins heat fastest lap
    DriverHeatData dhd2_h2 = new DriverHeatData(rp2);
    dhd2_h2.setLane(0);
    dhd2_h2.addLap(2.8, false, true);

    DriverHeatData dhd1_h2 = new DriverHeatData(rp1);
    dhd1_h2.setLane(1);
    dhd1_h2.addLap(3.2, false, true);

    Heat heat2 = new Heat(2, Arrays.asList(dhd2_h2, dhd1_h2), false);

    // Heat 3: d1 runs 2.5s, d2 runs 2.9s -> d1 wins heat fastest lap in heat 3
    DriverHeatData dhd1_h3 = new DriverHeatData(rp1);
    dhd1_h3.setLane(0);
    dhd1_h3.addLap(2.5, false, true);

    DriverHeatData dhd2_h3 = new DriverHeatData(rp2);
    dhd2_h3.setLane(1);
    dhd2_h3.addLap(2.9, false, true);

    Heat heat3 = new Heat(3, Arrays.asList(dhd1_h3, dhd2_h3), false);

    when(race.getHeats()).thenReturn(Arrays.asList(heat1, heat2, heat3));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);

    SeasonDriverResult r1 =
        results.stream().filter(r -> r.getDriverId().equals("d1")).findFirst().get();
    SeasonDriverResult r2 =
        results.stream().filter(r -> r.getDriverId().equals("d2")).findFirst().get();

    // d1 won Heat 1 (5.0) and Heat 3 (5.0) -> heat breakdown should call out heat 1 and heat 3
    assertEquals(
        14.0,
        r1.getHeatBonusPoints(),
        0.001); // 5.0 + 2.0 (led) in heat 1, 5.0 + 2.0 (led) in heat 3 = 14.0
    assertEquals(5.0, r1.getHeatBonusBreakdown().get("fastest_lap_heat_1"), 0.001);
    assertEquals(5.0, r1.getHeatBonusBreakdown().get("fastest_lap_heat_3"), 0.001);
    assertNull(r1.getHeatBonusBreakdown().get("fastest_lap_heat_2"));

    // d2 won Heat 2 (5.0) -> heat breakdown should call out heat 2
    assertEquals(7.0, r2.getHeatBonusPoints(), 0.001); // 5.0 + 2.0 (led) in heat 2 = 7.0
    assertEquals(5.0, r2.getHeatBonusBreakdown().get("fastest_lap_heat_2"), 0.001);
    assertNull(r2.getHeatBonusBreakdown().get("fastest_lap_heat_1"));
    assertNull(r2.getHeatBonusBreakdown().get("fastest_lap_heat_3"));
  }

  @Test
  public void testDriverSeasonStandingAndDetailAccessors() {
    DriverRaceScoreDetail detail1 =
        new DriverRaceScoreDetail("r1", "Race 1", 1, 25.0, 5.0, null, 10.0, 2.0, null, 42.0);
    detail1.setDropped(true);
    assertEquals("r1", detail1.getRaceId());
    assertEquals("Race 1", detail1.getRaceName());
    assertEquals(1, detail1.getOverallRank());
    assertEquals(25.0, detail1.getOverallPoints(), 0.001);
    assertEquals(5.0, detail1.getOverallBonusPoints(), 0.001);
    assertEquals(10.0, detail1.getHeatPoints(), 0.001);
    assertEquals(2.0, detail1.getHeatBonusPoints(), 0.001);
    assertEquals(42.0, detail1.getTotalPoints(), 0.001);
    assertEquals(true, detail1.isDropped());
    assertNotNull(detail1.getOverallBonusBreakdown());
    assertNotNull(detail1.getHeatBonusBreakdown());

    DriverRaceScoreDetail liveDetail =
        new DriverRaceScoreDetail("live_race", "Live Race", 2, 18.0, 0.0, 8.0, 0.0, 26.0);

    DriverSeasonStanding standing =
        new DriverSeasonStanding(
            "d10", "Driver Ten", 100.0, 120.0, 5, Arrays.asList(detail1, liveDetail));

    assertEquals("d10", standing.getDriverId());
    assertEquals("Driver Ten", standing.getDriverName());
    assertEquals(100.0, standing.getNetPoints(), 0.001);
    assertEquals(120.0, standing.getGrossPoints(), 0.001);
    assertEquals(5, standing.getRacesRun());
    assertEquals(2, standing.getRaceScores().size());
    assertEquals(26.0, standing.getCurrentRacePoints(), 0.001);
    assertEquals(liveDetail, standing.getCurrentRaceScoreDetail());
  }

  @Test
  public void testDriverSeasonStandingWithNulls() {
    DriverSeasonStanding standing = new DriverSeasonStanding(null, null, null, null, null, null);
    assertEquals("", standing.getDriverId());
    assertEquals("", standing.getDriverName());
    assertEquals(0.0, standing.getNetPoints(), 0.001);
    assertEquals(0.0, standing.getGrossPoints(), 0.001);
    assertEquals(0, standing.getRacesRun());
    assertNotNull(standing.getRaceScores());
    assertEquals(0.0, standing.getCurrentRacePoints(), 0.001);
    assertNull(standing.getCurrentRaceScoreDetail());
  }

  @Test
  public void testCalculatorInstantiation() {
    SeasonPointsCalculator calc = new SeasonPointsCalculator();
    assertNotNull(calc);
  }

  @Test
  public void testCalculateStandings_NullAndEmptySeason() {
    assertTrue(SeasonPointsCalculator.calculateStandings(null).isEmpty());
    Season emptySeason = new Season("Empty Season", 0);
    assertTrue(SeasonPointsCalculator.calculateStandings(emptySeason).isEmpty());
  }

  @Test
  public void testCalculateStandings_DropsAndTies() {
    SeasonDriverResult r1A = new SeasonDriverResult("d1", "Alice", 1, 25.0, 0.0, 10.0, 0.0, 35.0);
    SeasonDriverResult r1B = new SeasonDriverResult("d2", "Bob", 2, 18.0, 0.0, 8.0, 0.0, 26.0);
    com.antigravity.models.SeasonRaceRecord race1 =
        new com.antigravity.models.SeasonRaceRecord("r1", "Race 1", 1000L, Arrays.asList(r1A, r1B));

    SeasonDriverResult r2A = new SeasonDriverResult("d1", "Alice", 2, 18.0, 0.0, 8.0, 0.0, 26.0);
    SeasonDriverResult r2B = new SeasonDriverResult("d2", "Bob", 1, 25.0, 0.0, 10.0, 0.0, 35.0);
    com.antigravity.models.SeasonRaceRecord race2 =
        new com.antigravity.models.SeasonRaceRecord("r2", "Race 2", 2000L, Arrays.asList(r2A, r2B));

    Season season = new Season("Drop Season", 1, Arrays.asList(race1, race2));

    List<DriverSeasonStanding> standings = SeasonPointsCalculator.calculateStandings(season, null);
    assertNotNull(standings);
    assertEquals(2, standings.size());

    // Both drivers drop their 26.0 race -> net is 35.0 each, gross is 61.0 each
    assertEquals(35.0, standings.get(0).getNetPoints(), 0.001);
    assertEquals(61.0, standings.get(0).getGrossPoints(), 0.001);
    assertEquals(35.0, standings.get(1).getNetPoints(), 0.001);
    assertEquals(61.0, standings.get(1).getGrossPoints(), 0.001);
  }

  @Test
  public void testCalculateDriverResultsForRace_ComprehensiveBonuses() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(25.0, 18.0),
            Arrays.asList(10.0, 8.0),
            3.0, // overall fastest lap
            2.0, // overall fastest lap per lane
            1.0, // overall led lap
            5.0, // overall most laps led
            false,
            2.0, // heat fastest lap
            1.0, // heat led lap
            3.0, // heat most laps led
            0.0, // heat clean race
            0.0, // heat finishing bonus
            false);
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);
    dhd1.addLap(4.0, false, true);
    dhd1.addLap(4.2, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);
    dhd2.addLap(4.5, false, true);
    dhd2.addLap(4.6, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Collections.singletonList(heat1));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);
    assertEquals(2, results.size());

    // d1 wins position points (25.0) + overall fastest lap (3.0) + overall fastest lap lane 1 (2.0)
    assertTrue(results.get(0).getTotalPoints() > 25.0);
  }

  @Test
  public void testHeatPointsWithMoreConfiguredPointsThanHeatLanes() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    // 4 heat points configured, but heat will only have 2 lanes/drivers
    SeasonScoring scoring =
        new SeasonScoring(Arrays.asList(100.0, 50.0), Arrays.asList(10.0, 8.0, 6.0, 4.0));
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    Driver d1 = new Driver("D1", "D1", "d1", null);
    Driver d2 = new Driver("D2", "D2", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    rp1.setRank(1);
    RaceParticipant rp2 = new RaceParticipant(d2);
    rp2.setRank(2);

    when(race.getDrivers()).thenReturn(Arrays.asList(rp1, rp2));

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);
    dhd1.addLap(4.0, false, true);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);
    dhd2.addLap(5.0, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    when(race.getHeats()).thenReturn(Collections.singletonList(heat1));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);
    assertEquals(2, results.size());

    SeasonDriverResult r1 =
        results.stream().filter(r -> r.getDriverId().equals("d1")).findFirst().get();
    SeasonDriverResult r2 =
        results.stream().filter(r -> r.getDriverId().equals("d2")).findFirst().get();

    assertEquals(10.0, r1.getHeatPoints(), 0.001);
    assertEquals(8.0, r2.getHeatPoints(), 0.001);
    assertEquals(110.0, r1.getTotalPoints(), 0.001); // 100 pos + 10 heat
    assertEquals(58.0, r2.getTotalPoints(), 0.001); // 50 pos + 8 heat
  }

  @Test
  public void testHeatPointsWithFewerConfiguredPointsThanHeatLanes() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    // 4 heat points configured, but heat will have 8 lanes/drivers
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(100.0, 80.0, 60.0, 50.0, 40.0, 30.0, 20.0, 10.0),
            Arrays.asList(10.0, 8.0, 6.0, 4.0));
    when(raceModel.getSeasonScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getState()).thenReturn(new RaceOver());

    List<RaceParticipant> participants = new java.util.ArrayList<>();
    List<DriverHeatData> heatDrivers = new java.util.ArrayList<>();

    for (int i = 1; i <= 8; i++) {
      Driver d = new Driver("D" + i, "D" + i, "d" + i, null);
      RaceParticipant rp = new RaceParticipant(d);
      rp.setRank(i);
      participants.add(rp);

      DriverHeatData dhd = new DriverHeatData(rp);
      dhd.setLane(i - 1);
      // Driver 1 fastest (4.0s), Driver 8 slowest (4.0 + 8*0.5 = 8.0s)
      dhd.addLap(4.0 + (i * 0.5), false, true);
      heatDrivers.add(dhd);
    }

    when(race.getDrivers()).thenReturn(participants);

    Heat heat1 = new Heat(1, heatDrivers, false);
    when(race.getHeats()).thenReturn(Collections.singletonList(heat1));

    List<SeasonDriverResult> results = SeasonPointsCalculator.calculateDriverResultsForRace(race);
    assertNotNull(results);
    assertEquals(8, results.size());

    // 1st through 4th receive 10.0, 8.0, 6.0, 4.0 heat points
    assertEquals(
        10.0,
        results.stream()
            .filter(r -> r.getDriverId().equals("d1"))
            .findFirst()
            .get()
            .getHeatPoints(),
        0.001);
    assertEquals(
        8.0,
        results.stream()
            .filter(r -> r.getDriverId().equals("d2"))
            .findFirst()
            .get()
            .getHeatPoints(),
        0.001);
    assertEquals(
        6.0,
        results.stream()
            .filter(r -> r.getDriverId().equals("d3"))
            .findFirst()
            .get()
            .getHeatPoints(),
        0.001);
    assertEquals(
        4.0,
        results.stream()
            .filter(r -> r.getDriverId().equals("d4"))
            .findFirst()
            .get()
            .getHeatPoints(),
        0.001);

    // 5th through 8th receive 0.0 heat points
    assertEquals(
        0.0,
        results.stream()
            .filter(r -> r.getDriverId().equals("d5"))
            .findFirst()
            .get()
            .getHeatPoints(),
        0.001);
    assertEquals(
        0.0,
        results.stream()
            .filter(r -> r.getDriverId().equals("d6"))
            .findFirst()
            .get()
            .getHeatPoints(),
        0.001);
    assertEquals(
        0.0,
        results.stream()
            .filter(r -> r.getDriverId().equals("d7"))
            .findFirst()
            .get()
            .getHeatPoints(),
        0.001);
    assertEquals(
        0.0,
        results.stream()
            .filter(r -> r.getDriverId().equals("d8"))
            .findFirst()
            .get()
            .getHeatPoints(),
        0.001);
  }
}
