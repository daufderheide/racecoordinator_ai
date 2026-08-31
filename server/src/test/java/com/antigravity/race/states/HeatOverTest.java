package com.antigravity.race.states;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.HeatScoring;
import com.antigravity.proto.RaceFlag;
import com.antigravity.race.Race;
import org.junit.Before;
import org.junit.Test;

public class HeatOverTest {

  private Race race;
  private com.antigravity.models.Race raceModel;
  private HeatOver heatOver;

  @Before
  public void setUp() {
    race = mock(Race.class);
    raceModel =
        new com.antigravity.models.Race.Builder()
            .withAutoAdvanceWarmupTime(3.0)
            .withHeatScoring(new HeatScoring())
            .build();
    when(race.getRaceModel()).thenReturn(raceModel);
    heatOver = new HeatOver();
  }

  @Test
  public void testGetFlagType_NullRace() {
    assertEquals(RaceFlag.RED, heatOver.getFlagType(null));
  }

  @Test
  public void testGetFlagType_RedFlagWhenNotWarmup() {
    when(race.getAutoAdvanceRemaining()).thenReturn(0.0);
    assertEquals(RaceFlag.RED, heatOver.getFlagType(race));
  }

  @Test
  public void testGetFlagType_GreenYellowDuringWarmup() {
    when(race.getAutoAdvanceRemaining()).thenReturn(2.0); // 2.0 <= 3.0 warmupTime
    assertEquals(RaceFlag.GREEN_YELLOW, heatOver.getFlagType(race));
  }

  @Test
  public void testGetFlagType_ThemedFlagResolution() {
    java.util.Map<String, String> slots = new java.util.HashMap<>();
    slots.put("flag.heat_over", "default_flag_checkered");
    slots.put("flag.warmup", "default_flag_yellow");
    com.antigravity.models.Theme theme =
        new com.antigravity.models.Theme("Custom", true, slots, null, "theme-1", "id-1");
    when(race.getTheme()).thenReturn(theme);

    // Warmup -> resolved to yellow
    when(race.getAutoAdvanceRemaining()).thenReturn(2.0);
    assertEquals(RaceFlag.YELLOW, heatOver.getFlagType(race));

    // Not warmup -> resolved to checkered
    when(race.getAutoAdvanceRemaining()).thenReturn(0.0);
    assertEquals(RaceFlag.CHECKERED, heatOver.getFlagType(race));
  }

  @Test(expected = IllegalStateException.class)
  public void testStart_ThrowsWhenHeatOver() {
    heatOver.start(race);
  }

  @Test(expected = IllegalStateException.class)
  public void testSkipHeat_ThrowsWhenHeatOver() {
    heatOver.skipHeat(race);
  }

  @Test
  public void testPause_StopsAutoAdvance() {
    heatOver.pause(race);
    verify(race).setAutoAdvanceFired(true);
    verify(race).clearAutoTimers();
  }

  @Test
  public void testRestartHeat() {
    heatOver.restartHeat(race);
    verify(race).resetCurrentHeat();
    verify(race).changeState(org.mockito.ArgumentMatchers.any(NotStarted.class));
  }

  @Test(expected = IllegalStateException.class)
  public void testDeferHeat_ThrowsWhenHeatOver() {
    heatOver.deferHeat(race);
  }

  @Test
  public void testOnLap_DuringDriftWindow_CountsDriftLap() {
    com.antigravity.race.HeatExecutionManager hem =
        mock(com.antigravity.race.HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(hem);
    when(hem.onLap(0, 5.0, 1, false, true, true)).thenReturn(true);
    when(race.createSnapshot()).thenReturn(com.antigravity.proto.RaceData.getDefaultInstance());

    heatOver.enter(race);
    boolean result = heatOver.onLap(0, 5.0, 1, false);

    org.junit.Assert.assertTrue(result);
    verify(hem).onLap(0, 5.0, 1, false, true, true);
    verify(race).updateScoreRecords();
    verify(race, org.mockito.Mockito.atLeastOnce())
        .broadcast(org.mockito.ArgumentMatchers.any(com.antigravity.proto.RaceData.class));
  }

  @Test
  public void testOnLap_DriftTimeZero_ReturnsFalse() {
    com.antigravity.models.Race zeroDriftRaceModel =
        new com.antigravity.models.Race.Builder()
            .withDriftTime(0.0)
            .withHeatScoring(new HeatScoring())
            .build();
    when(race.getRaceModel()).thenReturn(zeroDriftRaceModel);

    heatOver.enter(race);
    boolean result = heatOver.onLap(0, 5.0, 1, false);

    org.junit.Assert.assertFalse(result);
  }

  @Test
  public void testOnLap_DriftTimeExpired_ReturnsFalse() throws Exception {
    com.antigravity.models.Race shortDriftRaceModel =
        new com.antigravity.models.Race.Builder()
            .withDriftTime(0.01)
            .withHeatScoring(new HeatScoring())
            .build();
    when(race.getRaceModel()).thenReturn(shortDriftRaceModel);

    heatOver.enter(race);
    Thread.sleep(30);
    boolean result = heatOver.onLap(0, 5.0, 1, false);

    org.junit.Assert.assertFalse(result);
  }
}
