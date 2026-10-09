package com.antigravity.race.states;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.PartialTime;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.HeatStandings;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.Before;
import org.junit.Test;

public class RacingTest {

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
    Driver d = new Driver(name, name, id, "1");
    RaceParticipant p = new RaceParticipant(d, id);
    return new DriverHeatData(p);
  }

  @Test
  public void testCalculateAutoSegments_Basic() {
    DriverHeatData d1 = drivers.get(0);
    // 2 laps of 10s. Median = 10s.
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true);

    // 5s since last lap. Expect 5/10 = 0.5 segments.
    double[] times = new double[] {5.0, 0.0};
    when(executionManager.getTimeSinceLastLap()).thenReturn(times);

    org.mockito.Mockito.clearInvocations(race);
    racing.calculateAutoSegments();

    assertEquals(0.5, d1.getAutoCalculatedLaps(), 0.001);
    assertEquals(2.5, d1.getAdjustedLapCount(), 0.001);
    verify(race, never()).broadcast(any());
  }

  @Test
  public void testCalculateAutoSegments_CapAt99() {
    DriverHeatData d1 = drivers.get(0);
    // 2 laps of 10s. Median = 10s.
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true);

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
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true);
    d1.addLap(10.0, false, true);

    DriverHeatData d2 = drivers.get(1);
    // d2 reached 3 laps. Median = 10s.
    d2.addLap(10.0, false, true);
    d2.addLap(10.0, false, true);
    d2.addLap(10.0, false, true);

    // 4s since last lap for d1, 6s for d2.
    double[] times = new double[] {4.0, 6.0};
    when(executionManager.getTimeSinceLastLap()).thenReturn(times);

    racing.calculateAutoSegments();

    assertEquals(0.0, d1.getAutoCalculatedLaps(), 0.001);
    assertEquals(5.0, d1.getAdjustedLapCount(), 0.001);

    assertEquals(0.6, d2.getAutoCalculatedLaps(), 0.001);
    assertEquals(3.6, d2.getAdjustedLapCount(), 0.001);
  }

  @Test
  public void testGetFlagType_ThemedFlagResolution() {
    java.util.Map<String, String> slots = new java.util.HashMap<>();
    slots.put("flag.racing", "default_flag_yellow");
    slots.put("flag.one_lap_to_go", "default_flag_black");
    slots.put("flag.heat_finishing", "default_flag_red");
    com.antigravity.models.Theme theme =
        new com.antigravity.models.Theme("Custom", true, slots, null, "theme-1", "id-1");
    when(race.getTheme()).thenReturn(theme);

    // Active racing -> resolves to yellow
    assertEquals(RaceFlag.YELLOW, racing.getFlagType(race));

    // Lap based with 1 lap to go
    com.antigravity.models.Race lapRace =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(
                new HeatScoring(
                    FinishMethod.Lap,
                    5,
                    HeatRanking.LAP_COUNT,
                    HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    AllowFinish.None))
            .build();
    when(race.getRaceModel()).thenReturn(lapRace);

    DriverHeatData d1 = drivers.get(0);
    // 4 laps out of 5 -> 1 lap to go -> black
    for (int i = 0; i < 4; i++) {
      d1.addLap(10.0, false, true);
    }
    assertEquals(RaceFlag.BLACK, racing.getFlagType(race));

    // Finish allowed and d1 finishes -> heat_finishing -> red
    com.antigravity.models.Race allowFinishRace =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(
                new HeatScoring(
                    FinishMethod.Lap,
                    5,
                    HeatRanking.LAP_COUNT,
                    HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    AllowFinish.Allow))
            .build();
    when(race.getRaceModel()).thenReturn(allowFinishRace);

    d1.addLap(10.0, false, true); // 5 laps
    assertEquals(RaceFlag.RED, racing.getFlagType(race));
  }

  @Test
  public void testEnter_SyncsDriverFlags() {
    when(race.getRaceTime()).thenReturn(60.0f);
    Racing newRacing = new Racing();
    newRacing.enter(race);

    assertEquals(RaceFlag.GREEN, drivers.get(0).getFlag());
    assertEquals(RaceFlag.GREEN, drivers.get(1).getFlag());
  }

  @Test
  public void testEnter_TimedScoring_AddsRaceTimeWhenZero() {
    org.mockito.Mockito.clearInvocations(race);
    when(race.hasRacedInCurrentHeat()).thenReturn(false);
    when(race.getRaceTime()).thenReturn(0.0f, 60.0f);
    Racing newRacing = new Racing();
    newRacing.enter(race);

    verify(race).addRaceTime(60.0f);
    verify(race).broadcastFlag(RaceFlag.GREEN);
    assertEquals(RaceFlag.GREEN, drivers.get(0).getFlag());
  }

  @Test
  public void testEnter_TimedScoring_DoesNotAddRaceTimeWhenHasRacedInCurrentHeat() {
    org.mockito.Mockito.clearInvocations(race);
    when(race.hasRacedInCurrentHeat()).thenReturn(true);
    when(race.getRaceTime()).thenReturn(0.0f);
    Racing newRacing = new Racing();
    newRacing.enter(race);

    verify(race, never()).addRaceTime(any(Float.class));
  }

  @Test
  public void testExit_CapturesPartialLapTimesForUnfinishedDrivers() {
    List<PartialTime> partials =
        Arrays.asList(new PartialTime(0, 4.5, 0.0), new PartialTime(1, 3.2, 0.0));
    when(race.stopProtocols()).thenReturn(partials);

    // Lane 0 unfinished, Lane 1 finished
    Set<Integer> finishedLanes = new HashSet<>(Collections.singletonList(1));
    when(executionManager.getFinishedLanes()).thenReturn(finishedLanes);

    racing.exit(race);

    assertEquals(4.5, drivers.get(0).getPendingLapTime(), 0.001);
    assertEquals(0.0, drivers.get(1).getPendingLapTime(), 0.001);
  }

  @Test
  public void testExit_IgnoresZeroOrNegativePartialTimes() {
    List<PartialTime> partials =
        Arrays.asList(new PartialTime(0, 0.0, 0.0), new PartialTime(1, -1.0, 0.0));
    when(race.stopProtocols()).thenReturn(partials);
    when(executionManager.getFinishedLanes()).thenReturn(Collections.emptySet());

    racing.exit(race);

    assertEquals(0.0, drivers.get(0).getPendingLapTime(), 0.001);
    assertEquals(0.0, drivers.get(1).getPendingLapTime(), 0.001);
  }

  @Test
  public void testPause_TransitionsToPausedState() {
    racing.pause(race);

    assertEquals(1, race.getStatistics().getYellowFlagCount());
    org.mockito.ArgumentCaptor<IRaceState> stateCaptor =
        org.mockito.ArgumentCaptor.forClass(IRaceState.class);
    verify(race).changeState(stateCaptor.capture());
    org.junit.Assert.assertTrue(stateCaptor.getValue() instanceof Paused);
  }
}
