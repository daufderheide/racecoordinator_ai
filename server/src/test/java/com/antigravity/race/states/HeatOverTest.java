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
            .withName("Test Race")
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
}
