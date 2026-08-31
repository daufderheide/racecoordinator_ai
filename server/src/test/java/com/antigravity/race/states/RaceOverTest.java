package com.antigravity.race.states;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.HeatScoring;
import com.antigravity.proto.RaceFlag;
import com.antigravity.race.Race;
import org.junit.Before;
import org.junit.Test;

public class RaceOverTest {

  private Race race;
  private com.antigravity.models.Race raceModel;
  private RaceOver raceOver;

  @Before
  public void setUp() {
    race = mock(Race.class);
    raceModel =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(
                new HeatScoring(
                    HeatScoring.FinishMethod.Timed,
                    60,
                    HeatScoring.HeatRanking.LAP_COUNT,
                    HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    HeatScoring.AllowFinish.None))
            .build();
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getStatistics()).thenReturn(new com.antigravity.race.RaceStatistics());
    raceOver = new RaceOver();
  }

  @Test
  public void testGetFlagType_CheckeredOnLastHeatWhenNoFinishAllowed() {
    when(race.isLastHeat()).thenReturn(true);
    assertEquals(RaceFlag.CHECKERED, raceOver.getFlagType(race));
  }

  @Test
  public void testGetFlagType_RedWhenNotLastHeat() {
    when(race.isLastHeat()).thenReturn(false);
    assertEquals(RaceFlag.RED, raceOver.getFlagType(race));
  }

  @Test
  public void testGetFlagType_ThemedFlagResolution() {
    java.util.Map<String, String> slots = new java.util.HashMap<>();
    slots.put("flag.race_over", "default_flag_yellow");
    slots.put("flag.heat_over", "default_flag_green");
    com.antigravity.models.Theme theme =
        new com.antigravity.models.Theme("Custom", true, slots, null, "theme-1", "id-1");
    when(race.getTheme()).thenReturn(theme);

    when(race.isLastHeat()).thenReturn(true);
    assertEquals(RaceFlag.YELLOW, raceOver.getFlagType(race));

    when(race.isLastHeat()).thenReturn(false);
    assertEquals(RaceFlag.GREEN, raceOver.getFlagType(race));
  }

  @Test(expected = IllegalStateException.class)
  public void testPause_ThrowsWhenRaceOver() {
    raceOver.pause(race);
  }

  @Test(expected = IllegalStateException.class)
  public void testStart_ThrowsWhenRaceOver() {
    raceOver.start(race);
  }

  @Test(expected = IllegalStateException.class)
  public void testRestartHeat_ThrowsWhenRaceOver() {
    raceOver.restartHeat(race);
  }

  @Test
  public void testOnLap_DuringDriftWindow_CountsDriftLap() {
    com.antigravity.race.HeatExecutionManager hem =
        mock(com.antigravity.race.HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(hem);
    when(hem.onLap(0, 5.0, 1, false, true, true)).thenReturn(true);
    when(race.createSnapshot()).thenReturn(com.antigravity.proto.RaceData.getDefaultInstance());

    raceOver.enter(race);
    boolean result = raceOver.onLap(0, 5.0, 1, false);

    org.junit.Assert.assertTrue(result);
    org.mockito.Mockito.verify(hem).onLap(0, 5.0, 1, false, true, true);
    org.mockito.Mockito.verify(race).updateAndBroadcastOverallStandings();
    org.mockito.Mockito.verify(race, org.mockito.Mockito.atLeastOnce()).updateScoreRecords();
    org.mockito.Mockito.verify(race, org.mockito.Mockito.atLeastOnce())
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

    raceOver.enter(race);
    boolean result = raceOver.onLap(0, 5.0, 1, false);

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

    raceOver.enter(race);
    Thread.sleep(30);
    boolean result = raceOver.onLap(0, 5.0, 1, false);

    org.junit.Assert.assertFalse(result);
  }
}
