package com.antigravity.race.states;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.proto.RaceFlag;
import com.antigravity.race.Race;
import com.antigravity.race.RaceStatistics;
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
    java.util.Map<String, String> slots = new java.util.HashMap<>();
    slots.put("flag.heat_paused", "default_flag_red");
    com.antigravity.models.Theme theme =
        new com.antigravity.models.Theme("Custom", true, slots, null, "theme-1", "id-1");
    when(race.getTheme()).thenReturn(theme);

    assertEquals(RaceFlag.RED, paused.getFlagType(race));
  }

  @Test
  public void testGetFlagType_CheckeredFlagResolution() {
    java.util.Map<String, String> slots = new java.util.HashMap<>();
    slots.put("flag.heat_paused", "default_flag_checkered");
    com.antigravity.models.Theme theme =
        new com.antigravity.models.Theme("Custom", false, slots, null, "theme-chk", "id-chk");
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
}
