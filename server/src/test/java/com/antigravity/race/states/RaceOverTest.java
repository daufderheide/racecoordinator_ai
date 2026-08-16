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
            .withName("Test Race")
            .withHeatScoring(
                new HeatScoring(
                    HeatScoring.FinishMethod.Timed,
                    60,
                    HeatScoring.HeatRanking.LAP_COUNT,
                    HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    HeatScoring.AllowFinish.None))
            .build();
    when(race.getRaceModel()).thenReturn(raceModel);
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
}
