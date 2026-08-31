package com.antigravity.race.states;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.race.Heat;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.Race;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class NotStartedTest {

  private Race race;
  private com.antigravity.models.Race raceModel;
  private HeatExecutionManager executionManager;
  private NotStarted notStarted;

  @Before
  public void setUp() {
    race = mock(Race.class);
    executionManager = mock(HeatExecutionManager.class);
    raceModel =
        new com.antigravity.models.Race.Builder()
            .withAutoStartTime(10.0)
            .withAutoStartWarmupTime(3.0)
            .withHeatScoring(new HeatScoring())
            .withHeatRotationType(HeatRotationType.SingleHeat)
            .build();
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getHeatExecutionManager()).thenReturn(executionManager);
    notStarted = new NotStarted();
  }

  @Test
  public void testGetFlagType_NullRace() {
    assertEquals(RaceFlag.RED, notStarted.getFlagType(null));
  }

  @Test
  public void testGetFlagType_RedFlagWhenNotWarmup() {
    when(race.getAutoStartRemaining()).thenReturn(0.0);
    assertEquals(RaceFlag.RED, notStarted.getFlagType(race));
  }

  @Test
  public void testGetFlagType_GreenYellowDuringWarmup() {
    // autoStartTime = 10, warmup = 3. elapsed = 10 - 8 = 2s <= 3s -> warmup
    when(race.getAutoStartRemaining()).thenReturn(8.0);
    assertEquals(RaceFlag.GREEN_YELLOW, notStarted.getFlagType(race));
  }

  @Test
  public void testGetFlagType_ThemedFlagResolution() {
    java.util.Map<String, String> slots = new java.util.HashMap<>();
    slots.put("flag.not_started", "default_flag_yellow");
    slots.put("flag.warmup", "default_flag_green");
    com.antigravity.models.Theme theme =
        new com.antigravity.models.Theme("Custom", true, slots, null, "theme-1", "id-1");
    when(race.getTheme()).thenReturn(theme);

    // Warmup -> green
    when(race.getAutoStartRemaining()).thenReturn(8.0);
    assertEquals(RaceFlag.GREEN, notStarted.getFlagType(race));

    // Not warmup -> yellow
    when(race.getAutoStartRemaining()).thenReturn(0.0);
    assertEquals(RaceFlag.YELLOW, notStarted.getFlagType(race));
  }

  @Test
  public void testEnterAndExit_AutoStartFiredTrue() {
    when(race.isAutoStartFired()).thenReturn(true);
    notStarted.enter(race);
    verify(race).prepareHeat();
    verify(race).initializeHardwareState();
    verify(race).setAutoStartRemaining(0);
    verify(race).broadcastTime();

    notStarted.exit(race);
    verify(race, org.mockito.Mockito.times(2)).setAutoStartRemaining(0);
  }

  @Test
  public void testEnter_EmptyHeat_SkipsAutomatically() {
    Heat emptyHeat = mock(Heat.class);
    when(emptyHeat.isEmpty()).thenReturn(true);
    when(emptyHeat.getActiveDriverCount()).thenReturn(0);
    when(emptyHeat.getHeatNumber()).thenReturn(1);
    when(race.getCurrentHeat()).thenReturn(emptyHeat);

    List<Heat> heats = new ArrayList<>(Collections.singletonList(emptyHeat));
    when(race.getHeats()).thenReturn(heats);

    notStarted.enter(race);

    // Common.advanceToNextHeat should have transitioned the race
    verify(race, never()).prepareHeat();
    verify(race).changeState(any(RaceOver.class));
  }

  @Test
  public void testEnter_AutoStartFiredFalse_ArmTimer() {
    when(race.isAutoStartFired()).thenReturn(false);
    notStarted.enter(race);
    verify(race).prepareHeat();
    verify(race).setAutoStartRemaining(10.0);
    verify(race).initializeHardwareState();

    notStarted.exit(race);
  }

  @Test
  public void testPause_DuringWarmup() {
    when(race.getAutoStartRemaining()).thenReturn(8.0);
    notStarted.pause(race);
    verify(race).resetCurrentHeat();
    verify(race).setAutoStartFired(true);
    verify(race).clearAutoTimers();
    verify(race).updatePowerForFlag(any(RaceFlag.class));
    verify(race).setRaceState(eq(RaceState.NOT_STARTED), any(RaceFlag.class), eq(0.0));
  }

  @Test
  public void testPause_NotDuringWarmup() {
    when(race.getAutoStartRemaining()).thenReturn(0.0);
    notStarted.pause(race);
    verify(race, never()).resetCurrentHeat();
    verify(race).setAutoStartFired(true);
    verify(race).clearAutoTimers();
    verify(race).updatePowerForFlag(RaceFlag.RED);
  }

  @Test
  public void testStart_DuringWarmup() {
    when(race.getAutoStartRemaining()).thenReturn(8.0);
    notStarted.start(race);
    verify(race).resetCurrentHeat();
    verify(race).changeState(any(Starting.class));
  }

  @Test
  public void testStart_NotDuringWarmup() {
    when(race.getAutoStartRemaining()).thenReturn(0.0);
    notStarted.start(race);
    verify(race, never()).resetCurrentHeat();
    verify(race).changeState(any(Starting.class));
  }

  @Test
  public void testRestartHeat_ResetsAutoStartFired() {
    notStarted.restartHeat(race);
    verify(race).resetCurrentHeat();
    verify(race).setAutoStartFired(false);
    verify(race).setAutoAdvanceFired(false);
    verify(race).changeState(any(NotStarted.class));
  }

  @Test
  public void testOnLap_DuringWarmup() {
    when(race.getAutoStartRemaining()).thenReturn(8.0); // warmup active
    notStarted.enter(race);
    notStarted.onLap(0, 5.2, 0, false);
    verify(executionManager).onLap(0, 5.2, 0, true, false, false);
  }

  @Test
  public void testOnLap_NotDuringWarmup() {
    when(race.getAutoStartRemaining()).thenReturn(0.0); // warmup not active
    notStarted.enter(race);
    boolean counted = notStarted.onLap(0, 5.2, 0, false);
    assertFalse(counted);
    verify(executionManager, never())
        .onLap(anyInt(), anyDouble(), anyInt(), anyBoolean(), anyBoolean(), anyBoolean());
  }

  @Test
  public void testOnSegment_DuringWarmup() {
    when(race.getAutoStartRemaining()).thenReturn(8.0);
    notStarted.enter(race);
    notStarted.onSegment(0, 1.2, 0);
    verify(executionManager).onSegment(0, 1.2, 0);
  }

  @Test
  public void testOnCallbutton_StartsRace() {
    notStarted.onCallbutton(race, 0);
    verify(race).startRace();
  }

  @Test
  public void testCanChangeLane() {
    assertTrue(notStarted.canChangeLane(race));
  }

  @Test(expected = IllegalStateException.class)
  public void testNextHeat_Throws() {
    notStarted.nextHeat(race);
  }
}
