package com.antigravity.race;

import static org.mockito.Mockito.*;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.Race;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import java.util.Collections;
import org.junit.Before;
import org.junit.Test;

public class HeatProgressTest {

  private com.antigravity.race.Race mockRace;
  private Race raceModel;
  private Heat mockHeat;
  private HeatExecutionManager mockExecutionManager;

  @Before
  public void setUp() {
    mockRace = mock(com.antigravity.race.Race.class);
    mockHeat = mock(Heat.class);
    mockExecutionManager = mock(HeatExecutionManager.class);

    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());
  }

  @Test
  public void testStartingStateSetsZeroProgress() {
    raceModel =
        new Race.Builder().withName("Test Race").withStartTime(1.0).withRestartTime(1.0).build();
    when(mockRace.getRaceModel()).thenReturn(raceModel);

    Starting starting = new Starting();

    // We need a real-ish race for the ticker to run or we mock it heavily
    // But the simplest is to verify that Starting.enter() sets progress to 0.0 eventually
    // Actually, I added it to the ticker, so it will be called repeatedly.

    starting.enter(mockRace);

    // Ticker runs every 100ms. Wait a bit.
    try {
      Thread.sleep(200);
    } catch (InterruptedException e) {
    }

    verify(mockRace, atLeastOnce()).setHeatProgress(0.0);
    starting.exit(mockRace);
  }

  @Test
  public void testTimedRaceProgress() throws InterruptedException {
    HeatScoring timedScoring = new HeatScoring(FinishMethod.Timed, 60L, null, null, null);
    raceModel = new Race.Builder().withName("Test Race").withHeatScoring(timedScoring).build();
    when(mockRace.getRaceModel()).thenReturn(raceModel);

    // Use a custom Answer to handle changing race time without resetting the mock
    final float[] raceTime = {60.0f};
    when(mockRace.getRaceTime()).thenAnswer(invocation -> raceTime[0]);

    Racing racing = new Racing();
    racing.enter(mockRace);

    // Start with 60s remaining (0% progress)
    Thread.sleep(200);
    verify(mockRace, atLeastOnce()).setHeatProgress(0.0);

    // Change time to 30s remaining (50% progress)
    raceTime[0] = 30.0f;
    Thread.sleep(200);
    verify(mockRace, atLeastOnce()).setHeatProgress(0.5);

    // Change time to 0s remaining (100% progress)
    raceTime[0] = 0.0f;
    Thread.sleep(200);
    verify(mockRace, atLeastOnce()).setHeatProgress(1.0);

    racing.exit(mockRace);
  }

  @Test
  public void testLapBasedRaceProgress() throws InterruptedException {
    HeatScoring lapScoring = new HeatScoring(FinishMethod.Lap, 10L, null, null, null);
    raceModel = new Race.Builder().withName("Test Race").withHeatScoring(lapScoring).build();
    when(mockRace.getRaceModel()).thenReturn(raceModel);

    DriverHeatData d1 = mock(DriverHeatData.class);
    final int[] lapCount = {0};
    when(d1.getLapCount()).thenAnswer(invocation -> lapCount[0]);
    when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

    Racing racing = new Racing();
    racing.enter(mockRace);

    // 0 laps -> 0% progress
    Thread.sleep(200);
    verify(mockRace, atLeastOnce()).setHeatProgress(0.0);

    // 5 laps -> 50% progress
    lapCount[0] = 5;
    Thread.sleep(200);
    verify(mockRace, atLeastOnce()).setHeatProgress(0.5);

    // 10 laps -> 100% progress
    lapCount[0] = 10;
    Thread.sleep(200);
    verify(mockRace, atLeastOnce()).setHeatProgress(1.0);

    racing.exit(mockRace);
  }
}
