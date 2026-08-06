package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.SeasonScoring;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.util.SeasonPointsCalculator.DriverSeasonStanding;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class SeasonPointsCalculatorTest {

  @Test
  public void testUnstartedRaceAwardsNoHeatPoints() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(Arrays.asList(10000, 1000, 100, 0), Arrays.asList(50, 9, 4, 1));
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

    assertEquals(10000, standingA.getNetPoints());
    assertEquals(0, standingA.getCurrentRacePoints() - 10000); // 0 heat points

    assertEquals(1000, standingB.getNetPoints());
    assertEquals(0, standingB.getCurrentRacePoints() - 1000); // 0 heat points
  }

  @Test
  public void testCompletedHeatAwardsHeatPointsToParticipantDriver() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring =
        new SeasonScoring(Arrays.asList(10000, 1000, 100, 0), Arrays.asList(50, 9, 4, 1));
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
    assertEquals(10050, standingA.getNetPoints());
  }

  @Test
  public void testRacingStateWithLapsAwardsLiveHeatPoints() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring = new SeasonScoring(Arrays.asList(100, 50), Arrays.asList(10, 5));
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

    assertEquals(110, s1.getNetPoints());
    assertEquals(55, s2.getNetPoints());
  }

  @Test
  public void testMultipleHeatsOnlyCompletedHeatsAwardPoints() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring = new SeasonScoring(Arrays.asList(100, 50), Arrays.asList(10, 5));
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

    assertEquals(110, s1.getNetPoints());
    assertEquals(55, s2.getNetPoints());
  }

  @Test
  public void testRaceOverStateAwardsAllHeatsPoints() {
    Race race = mock(Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    SeasonScoring scoring = new SeasonScoring(Arrays.asList(100, 50), Arrays.asList(10, 5));
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

    assertEquals(120, s1.getNetPoints());
    assertEquals(60, s2.getNetPoints());
  }
}
