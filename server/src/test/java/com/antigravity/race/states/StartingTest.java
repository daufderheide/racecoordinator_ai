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

  @Test
  public void testEnter_SyncsDriverFlags() {
    com.antigravity.race.Heat currentHeat = mock(com.antigravity.race.Heat.class);
    com.antigravity.race.DriverHeatData dhd =
        new com.antigravity.race.DriverHeatData(
            new com.antigravity.race.RaceParticipant(
                new com.antigravity.models.Driver("d1", "Driver 1", "id1", "1"), "id1"));
    when(currentHeat.getDrivers()).thenReturn(java.util.Collections.singletonList(dhd));
    when(race.getCurrentHeat()).thenReturn(currentHeat);
    when(race.hasRacedInCurrentHeat()).thenReturn(false);

    starting.enter(race);

    assertEquals(RaceFlag.RED, dhd.getFlag());
  }

  @Test
  public void testEnterAndExit_StopsTicker() {
    starting.enter(race);
    verify(race).broadcastFlag(RaceFlag.RED);
    verify(race).setAutoStartFired(true);

    starting.exit(race);
    verify(race).setAutoStartRemaining(0);
  }

  @Test
  public void testGetLaneFlagType_AllowFinish_FinishedDriverShowsDriverFinishedFlag() {
    HeatScoring allowFinishScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.SingleLapAutoSegments);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withHeatScoring(allowFinishScoring).build();
    when(race.getRaceModel()).thenReturn(model);
    when(race.hasRacedInCurrentHeat()).thenReturn(true);

    com.antigravity.race.Heat currentHeat = mock(com.antigravity.race.Heat.class);
    com.antigravity.race.DriverHeatData dhd0 =
        new com.antigravity.race.DriverHeatData(
            new com.antigravity.race.RaceParticipant(
                new com.antigravity.models.Driver("d1", "Driver 1", "id1", "1"), "id1"));
    com.antigravity.race.DriverHeatData dhd1 =
        new com.antigravity.race.DriverHeatData(
            new com.antigravity.race.RaceParticipant(
                new com.antigravity.models.Driver("d2", "Driver 2", "id2", "2"), "id2"));
    when(currentHeat.getDrivers()).thenReturn(java.util.Arrays.asList(dhd0, dhd1));
    when(race.getCurrentHeat()).thenReturn(currentHeat);

    com.antigravity.race.HeatExecutionManager em =
        mock(com.antigravity.race.HeatExecutionManager.class);
    when(em.getFinishedLanes())
        .thenReturn(new java.util.HashSet<>(java.util.Collections.singletonList(0)));
    when(race.getHeatExecutionManager()).thenReturn(em);

    assertEquals(RaceFlag.RED, starting.getLaneFlagType(race, 0));
    assertEquals(RaceFlag.YELLOW, starting.getLaneFlagType(race, 1));
  }
}
