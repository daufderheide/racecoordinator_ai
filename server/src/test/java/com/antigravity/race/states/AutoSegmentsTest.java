package com.antigravity.race.states;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.HeatStandings;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class AutoSegmentsTest {

  private Race race;
  private Heat heat;
  private HeatExecutionManager executionManager;
  private Racing racing;
  private List<DriverHeatData> drivers;

  @Before
  public void setUp() {
    race = mock(Race.class);
    heat = mock(Heat.class);
    executionManager = mock(HeatExecutionManager.class);
    racing = new Racing();

    when(race.getStatistics()).thenReturn(new com.antigravity.race.RaceStatistics());
    com.antigravity.race.RaceHeatStatistics heatStats =
        new com.antigravity.race.RaceHeatStatistics();
    when(heat.getStatistics()).thenReturn(heatStats);

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(
                new HeatScoring(
                    FinishMethod.Timed,
                    60,
                    HeatRanking.LAP_COUNT,
                    HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    AllowFinish.NoneAutoSegments))
            .build();

    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getCurrentHeat()).thenReturn(heat);
    when(race.getHeatExecutionManager()).thenReturn(executionManager);

    drivers = new ArrayList<>();
    drivers.add(createDriverData("d1", "Driver 1"));
    drivers.add(createDriverData("d2", "Driver 2"));

    when(heat.getDrivers()).thenReturn(drivers);

    // Set up standings mock
    HeatStandings standings = new HeatStandings(drivers, raceModel.getHeatScoring(), false);
    when(heat.getHeatStandings()).thenReturn(standings);

    // Initialize racing state with race
    racing.enter(race);
  }

  private DriverHeatData createDriverData(String id, String name) {
    Driver d = new Driver(name, name, id, new ObjectId());
    RaceParticipant p = new RaceParticipant(d, id);
    return new DriverHeatData(p);
  }

  @Test
  public void testCalculateAutoSegments_Basic() {
    DriverHeatData d1 = drivers.get(0);
    // 2 laps of 10s. Median = 10s.
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);

    // 5s since last lap. Expect 5/10 = 0.5 segments.
    double[] times = new double[] {5.0, 0.0};
    when(executionManager.getTimeSinceLastLap()).thenReturn(times);

    racing.calculateAutoSegments();

    assertEquals(0.5, d1.getAutoCalculatedLaps(), 0.001);
    assertEquals(2.5, d1.getAdjustedLapCount(), 0.001);
  }

  @Test
  public void testCalculateAutoSegments_CapAt99() {
    DriverHeatData d1 = drivers.get(0);
    // 2 laps of 10s. Median = 10s.
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);

    // 11s since last lap (more than median). Expect cap at 0.99.
    double[] times = new double[] {11.0, 0.0};
    when(executionManager.getTimeSinceLastLap()).thenReturn(times);

    racing.calculateAutoSegments();

    assertEquals(0.99, d1.getAutoCalculatedLaps(), 0.001);
    assertEquals(2.99, d1.getAdjustedLapCount(), 0.001);
  }

  @Test
  public void testCalculateAutoSegments_NoLaps() {
    DriverHeatData d1 = drivers.get(0);
    // No laps yet. Median = 0.

    double[] times = new double[] {5.0, 0.0};
    when(executionManager.getTimeSinceLastLap()).thenReturn(times);

    racing.calculateAutoSegments();

    assertEquals(0.0, d1.getAutoCalculatedLaps(), 0.001);
    assertEquals(0.0, d1.getAdjustedLapCount(), 0.001);
  }

  @Test
  public void testCalculateAutoSegments_LapBased_FinishingDriver() {
    // Change scoring to Lap based
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(
                new HeatScoring(
                    FinishMethod.Lap,
                    5,
                    HeatRanking.LAP_COUNT,
                    HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    AllowFinish.NoneAutoSegments))
            .build();
    when(race.getRaceModel()).thenReturn(raceModel);

    DriverHeatData d1 = drivers.get(0);
    // d1 reached 5 laps. Should get 0 auto segments.
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);
    d1.addLap(10.0, false);

    DriverHeatData d2 = drivers.get(1);
    // d2 reached 3 laps. Median = 10s.
    d2.addLap(10.0, false);
    d2.addLap(10.0, false);
    d2.addLap(10.0, false);

    // 4s since last lap for d1, 6s for d2.
    double[] times = new double[] {4.0, 6.0};
    when(executionManager.getTimeSinceLastLap()).thenReturn(times);

    racing.calculateAutoSegments();

    assertEquals(0.0, d1.getAutoCalculatedLaps(), 0.001);
    assertEquals(5.0, d1.getAdjustedLapCount(), 0.001);

    assertEquals(0.6, d2.getAutoCalculatedLaps(), 0.001);
    assertEquals(3.6, d2.getAdjustedLapCount(), 0.001);
  }
}
