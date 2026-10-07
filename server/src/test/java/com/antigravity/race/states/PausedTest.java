package com.antigravity.race.states;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.Theme;
import com.antigravity.proto.RaceFlag;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceStatistics;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.junit.Before;
import org.junit.Test;

public class PausedTest {

  private Race race;
  private Paused paused;

  @Before
  public void setUp() {
    race = mock(Race.class);
    when(race.getStatistics()).thenReturn(new RaceStatistics());
    paused = new Paused();
  }

  @Test
  public void testGetFlagType() {
    assertEquals(RaceFlag.YELLOW, paused.getFlagType(race));
  }

  @Test
  public void testGetFlagType_ThemedFlagResolution() {
    Map<String, String> slots = new HashMap<>();
    slots.put("flag.heat_paused", "default_flag_red");
    Theme theme = new Theme("Custom", true, slots, null, "theme-1", "id-1");
    when(race.getTheme()).thenReturn(theme);

    assertEquals(RaceFlag.RED, paused.getFlagType(race));
  }

  @Test
  public void testGetFlagType_CheckeredFlagResolution() {
    Map<String, String> slots = new HashMap<>();
    slots.put("flag.heat_paused", "default_flag_checkered");
    Theme theme = new Theme("Custom", false, slots, null, "theme-chk", "id-chk");
    when(race.getTheme()).thenReturn(theme);

    assertEquals(RaceFlag.CHECKERED, paused.getFlagType(race));
  }

  @Test
  public void testEnterAndExit() {
    paused.enter(race);
    verify(race).broadcastFlag(RaceFlag.YELLOW);

    paused.exit(race);
    // statistics should have duration recorded
  }

  @Test
  public void testStart_ResumesToStarting() {
    paused.start(race);
    verify(race).changeState(org.mockito.ArgumentMatchers.any(Starting.class));
  }

  @Test(expected = IllegalStateException.class)
  public void testPause_ThrowsWhenAlreadyPaused() {
    paused.pause(race);
  }

  @Test(expected = IllegalStateException.class)
  public void testNextHeat_ThrowsWhenPaused() {
    paused.nextHeat(race);
  }

  @Test
  public void testRestartHeat() {
    paused.restartHeat(race);
    verify(race).resetCurrentHeat();
    verify(race).changeState(org.mockito.ArgumentMatchers.any(NotStarted.class));
  }

  @Test
  public void testOnCallbutton_StartsRace() {
    paused.onCallbutton(race, 0);
    verify(race).startRace();
  }

  @Test
  public void testEnter_SyncsDriverFlags() {
    Heat currentHeat = mock(Heat.class);
    DriverHeatData dhd =
        new DriverHeatData(new RaceParticipant(new Driver("d1", "Driver 1", "id1", "1"), "id1"));
    when(currentHeat.getDrivers()).thenReturn(Collections.singletonList(dhd));
    when(race.getCurrentHeat()).thenReturn(currentHeat);

    paused.enter(race);

    assertEquals(RaceFlag.YELLOW, dhd.getFlag());
  }

  @Test
  public void testEnter_AutoSegmentsOnPause_Calculates() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withAutoSegmentsOnPause(true).build();
    when(race.getRaceModel()).thenReturn(model);
    HeatExecutionManager heatMgr = mock(HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(heatMgr);

    paused.enter(race);

    verify(heatMgr).calculateAutoSegments();
  }

  @Test
  public void testEnter_AutoSegmentsOnPause_Disabled_DoesNotCalculate() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withAutoSegmentsOnPause(false).build();
    when(race.getRaceModel()).thenReturn(model);
    HeatExecutionManager heatMgr = mock(HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(heatMgr);

    paused.enter(race);

    verify(heatMgr, never()).calculateAutoSegments();
  }

  @Test
  public void testStart_AutoSegmentsOnPause_RemovesPauseSegments() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withAutoSegmentsOnPause(true).build();
    when(race.getRaceModel()).thenReturn(model);
    HeatExecutionManager heatMgr = mock(HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(heatMgr);

    paused.start(race);

    verify(heatMgr).removePauseAutoSegments();
    verify(race).changeState(org.mockito.ArgumentMatchers.any(Starting.class));
  }

  @Test
  public void testStart_AutoSegmentsOnPause_Disabled_DoesNotRemove() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withAutoSegmentsOnPause(false).build();
    when(race.getRaceModel()).thenReturn(model);
    HeatExecutionManager heatMgr = mock(HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(heatMgr);

    paused.start(race);

    verify(heatMgr, never()).removePauseAutoSegments();
  }

  @Test
  public void testSkipHeat_AutoSegmentsOnPause_NonAutoFinish_RemovesPauseSegments() {
    HeatScoring scoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            15,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            AllowFinish.Allow);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(scoring)
            .withAutoSegmentsOnPause(true)
            .build();
    when(race.getRaceModel()).thenReturn(model);
    HeatExecutionManager heatMgr = mock(HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(heatMgr);

    paused.skipHeat(race);

    verify(heatMgr).removePauseAutoSegments();
  }

  @Test
  public void testSkipHeat_AutoSegmentsOnPause_AutoFinishNone_RetainsPauseSegments() {
    HeatScoring scoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            15,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            AllowFinish.NoneAutoSegments);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(scoring)
            .withAutoSegmentsOnPause(true)
            .build();
    when(race.getRaceModel()).thenReturn(model);
    HeatExecutionManager heatMgr = mock(HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(heatMgr);

    paused.skipHeat(race);

    verify(heatMgr, never()).removePauseAutoSegments();
  }

  @Test
  public void testSkipHeat_AutoSegmentsOnPause_AutoFinishSingleLap_RetainsPauseSegments() {
    HeatScoring scoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            15,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            AllowFinish.SingleLapAutoSegments);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(scoring)
            .withAutoSegmentsOnPause(true)
            .build();
    when(race.getRaceModel()).thenReturn(model);
    HeatExecutionManager heatMgr = mock(HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(heatMgr);

    paused.skipHeat(race);

    verify(heatMgr, never()).removePauseAutoSegments();
  }

  @Test
  public void testOnLap_AutoSegmentsOnPause_Recalculates() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withDriftTime(5.0)
            .withAutoSegmentsOnPause(true)
            .build();
    when(race.getRaceModel()).thenReturn(model);
    HeatExecutionManager heatMgr = mock(HeatExecutionManager.class);
    when(heatMgr.onLap(0, 10.0, 1, false, true, true)).thenReturn(true);
    when(race.getHeatExecutionManager()).thenReturn(heatMgr);

    paused.enter(race);
    paused.onLap(0, 10.0, 1, false);

    verify(heatMgr, org.mockito.Mockito.atLeast(2)).calculateAutoSegments();
  }

  @Test
  public void testHeatExecutionManager_CalculateAndRemoveAutoSegments() {
    HeatScoring scoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            AllowFinish.NoneAutoSegments);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(scoring)
            .withAutoSegmentsOnPause(true)
            .build();
    when(race.getRaceModel()).thenReturn(model);

    Heat heat = mock(Heat.class);
    DriverHeatData dhd =
        new DriverHeatData(new RaceParticipant(new Driver("d1", "Driver 1", "id1", "1"), "id1"));
    dhd.addLap(10.0, false, true);
    dhd.addLap(10.0, false, true);
    when(heat.getDrivers()).thenReturn(Collections.singletonList(dhd));
    when(race.getCurrentHeat()).thenReturn(heat);

    HeatExecutionManager execMgr = mock(HeatExecutionManager.class);
    when(execMgr.getTimeSinceLastLap()).thenReturn(new double[] {5.0});
    when(execMgr.getFinishedLanes()).thenReturn(Collections.emptySet());

    HeatExecutionManager.calculateAutoSegments(race, execMgr);

    assertEquals(0.5, dhd.getAutoCalculatedLaps(), 0.001);

    HeatExecutionManager.removePauseAutoSegments(race, execMgr);

    assertEquals(0.0, dhd.getAutoCalculatedLaps(), 0.001);
  }
}
