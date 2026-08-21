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

public class NotStartedTest {

  private Race race;
  private com.antigravity.models.Race raceModel;
  private NotStarted notStarted;

  @Before
  public void setUp() {
    race = mock(Race.class);
    raceModel =
        new com.antigravity.models.Race.Builder()
            .withAutoStartTime(10.0)
            .withAutoStartWarmupTime(3.0)
            .withHeatScoring(new HeatScoring())
            .build();
    when(race.getRaceModel()).thenReturn(raceModel);
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
  public void testEnterAndExit() {
    when(race.isAutoStartFired()).thenReturn(true);
    notStarted.enter(race);
    verify(race).prepareHeat();
    verify(race).initializeHardwareState();

    notStarted.exit(race);
  }
}
