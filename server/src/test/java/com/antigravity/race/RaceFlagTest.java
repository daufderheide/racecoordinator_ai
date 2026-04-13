package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.proto.RaceFlag;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class RaceFlagTest {

  private Race race;
  private com.antigravity.models.Race raceModel;
  private HeatScoring heatScoring;

  @Before
  public void setUp() {
    heatScoring = mock(HeatScoring.class);
    raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.getHeatScoring()).thenReturn(heatScoring);

    race = mock(Race.class);
    when(race.getRaceModel()).thenReturn(raceModel);
  }

  @Test
  public void testNotStartedFlag() {
    NotStarted state = new NotStarted();

    // No warmup
    when(raceModel.getAutoStartTime()).thenReturn(0.0);
    when(raceModel.getAutoStartWarmupTime()).thenReturn(0.0);
    assertEquals(RaceFlag.RED, state.getFlagType(race));

    // Warmup active
    when(raceModel.getAutoStartTime()).thenReturn(10.0);
    when(raceModel.getAutoStartWarmupTime()).thenReturn(5.0);
    when(race.getAutoStartRemaining()).thenReturn(8.0); // elapsed = 2.0 <= 5.0
    assertEquals(RaceFlag.GREEN_YELLOW, state.getFlagType(race));

    // Warmup finished but still NotStarted
    when(race.getAutoStartRemaining()).thenReturn(3.0); // elapsed = 7.0 > 5.0
    assertEquals(RaceFlag.RED, state.getFlagType(race));
  }

  @Test
  public void testStartingFlag() {
    Starting state = new Starting();

    // Fresh start
    when(race.hasRacedInCurrentHeat()).thenReturn(false);
    assertEquals(RaceFlag.RED, state.getFlagType(race));

    // Resuming
    when(race.hasRacedInCurrentHeat()).thenReturn(true);
    assertEquals(RaceFlag.YELLOW, state.getFlagType(race));
  }

  @Test
  public void testPausedFlag() {
    Paused state = new Paused();
    assertEquals(RaceFlag.YELLOW, state.getFlagType(race));
  }

  @Test
  public void testRaceOverFlag() {
    RaceOver state = new RaceOver();
    assertEquals(RaceFlag.RED, state.getFlagType(race));
  }

  @Test
  public void testHeatOverFlag() {
    HeatOver state = new HeatOver();

    // No warmup
    when(raceModel.getAutoAdvanceWarmupTime()).thenReturn(0.0);
    assertEquals(RaceFlag.RED, state.getFlagType(race));

    // Warmup active
    when(raceModel.getAutoAdvanceWarmupTime()).thenReturn(5.0);
    when(race.getAutoAdvanceRemaining()).thenReturn(3.0);
    assertEquals(RaceFlag.GREEN_YELLOW, state.getFlagType(race));

    // Before warmup
    when(race.getAutoAdvanceRemaining()).thenReturn(8.0);
    assertEquals(RaceFlag.RED, state.getFlagType(race));
  }

  @Test
  public void testRacingFlag() {
    Racing state = new Racing();
    Heat currentHeat = mock(Heat.class);
    when(race.getCurrentHeat()).thenReturn(currentHeat);

    List<DriverHeatData> activeDrivers = new ArrayList<>();
    DriverHeatData d = mock(DriverHeatData.class);
    activeDrivers.add(d);
    when(currentHeat.getDrivers()).thenReturn(activeDrivers);

    // Initial Green
    when(heatScoring.getFinishMethod()).thenReturn(FinishMethod.Lap);
    when(heatScoring.getFinishValue()).thenReturn(10L);
    when(heatScoring.getAllowFinish()).thenReturn(AllowFinish.None);
    when(d.getLapCount()).thenReturn(5);
    assertEquals(RaceFlag.GREEN, state.getFlagType(race));

    // White Flag (9 of 10 laps)
    when(d.getLapCount()).thenReturn(9);
    assertEquals(RaceFlag.WHITE, state.getFlagType(race));

    // Checkered Flag
    when(heatScoring.getAllowFinish()).thenReturn(AllowFinish.Allow);
    when(d.getLapCount()).thenReturn(10);
    assertEquals(RaceFlag.CHECKERED, state.getFlagType(race));
  }
}
