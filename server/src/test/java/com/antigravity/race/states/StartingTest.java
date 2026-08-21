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

public class StartingTest {

  private Race race;
  private com.antigravity.models.Race raceModel;
  private Starting starting;

  @Before
  public void setUp() {
    race = mock(Race.class);
    raceModel =
        new com.antigravity.models.Race.Builder()
            .withStartTime(5.0)
            .withRestartTime(3.0)
            .withHeatScoring(new HeatScoring())
            .build();
    when(race.getRaceModel()).thenReturn(raceModel);
    starting = new Starting();
  }

  @Test
  public void testGetFlagType() {
    when(race.hasRacedInCurrentHeat()).thenReturn(false);
    assertEquals(RaceFlag.RED, starting.getFlagType(race));

    when(race.hasRacedInCurrentHeat()).thenReturn(true);
    assertEquals(RaceFlag.YELLOW, starting.getFlagType(race));
  }

  @Test
  public void testGetFlagType_ThemedFlagResolution() {
    java.util.Map<String, String> slots = new java.util.HashMap<>();
    slots.put("flag.starting", "default_flag_yellow");
    slots.put("flag.restarting", "default_flag_green");
    com.antigravity.models.Theme theme =
        new com.antigravity.models.Theme("Custom", true, slots, null, "theme-1", "id-1");
    when(race.getTheme()).thenReturn(theme);

    when(race.hasRacedInCurrentHeat()).thenReturn(false);
    assertEquals(RaceFlag.YELLOW, starting.getFlagType(race));

    when(race.hasRacedInCurrentHeat()).thenReturn(true);
    assertEquals(RaceFlag.GREEN, starting.getFlagType(race));
  }

  @Test(expected = IllegalStateException.class)
  public void testNextHeat_ThrowsWhileStarting() {
    starting.nextHeat(race);
  }

  @Test
  public void testRestartHeat() {
    starting.restartHeat(race);
    verify(race).resetCurrentHeat();
    verify(race).changeState(org.mockito.ArgumentMatchers.any(NotStarted.class));
  }
}
