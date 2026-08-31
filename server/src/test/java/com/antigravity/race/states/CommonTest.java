package com.antigravity.race.states;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import com.antigravity.proto.RaceData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class CommonTest {

  @Test
  public void testAdvanceToNextHeat_NotLastHeat() {
    Race race = mock(Race.class);
    Heat h1 = mock(Heat.class);
    Heat h2 = mock(Heat.class);

    when(h1.getObjectId()).thenReturn("h1-id");
    when(h2.getObjectId()).thenReturn("h2-id");
    when(h2.getActiveDriverCount()).thenReturn(1);

    List<Heat> heats = new ArrayList<>(Arrays.asList(h1, h2));
    when(race.getHeats()).thenReturn(heats);
    when(race.getCurrentHeat()).thenReturn(h1);

    RaceParticipant p1 = mock(RaceParticipant.class);
    when(p1.getObjectId()).thenReturn("p1-id");
    when(race.getDrivers()).thenReturn(Collections.singletonList(p1));

    Common.advanceToNextHeat(race);

    // Verifications on race state/setup
    verify(race).setCurrentHeat(h2);
    verify(race).resetRaceTime();
    verify(race).prepareHeat();
    verify(race).setAutoStartFired(false);
    verify(race).setAutoAdvanceFired(false);

    // Verifies that state was changed to NotStarted
    ArgumentCaptor<IRaceState> stateCaptor = ArgumentCaptor.forClass(IRaceState.class);
    verify(race).changeState(stateCaptor.capture());
    assertTrue(stateCaptor.getValue() instanceof NotStarted);

    // Verifies that broadcast was called with expected proto
    ArgumentCaptor<RaceData> dataCaptor = ArgumentCaptor.forClass(RaceData.class);
    verify(race).broadcast(dataCaptor.capture());
    RaceData broadcastData = dataCaptor.getValue();
    assertNotNull(broadcastData);
    assertTrue(broadcastData.hasRace());
    assertNotNull(broadcastData.getRace().getCurrentHeat());
    assertEquals(2, broadcastData.getRace().getHeatsCount());
  }

  @Test
  public void testAdvanceToNextHeat_SkipsEmptyHeat() {
    Race race = mock(Race.class);
    Heat h1 = mock(Heat.class);
    Heat h2 = mock(Heat.class);
    Heat h3 = mock(Heat.class);

    when(h1.getObjectId()).thenReturn("h1-id");
    when(h2.getObjectId()).thenReturn("h2-id");
    when(h3.getObjectId()).thenReturn("h3-id");

    when(h1.getActiveDriverCount()).thenReturn(1);
    when(h2.getActiveDriverCount()).thenReturn(0); // empty heat
    when(h3.getActiveDriverCount()).thenReturn(2); // non-empty heat

    List<Heat> heats = new ArrayList<>(Arrays.asList(h1, h2, h3));
    when(race.getHeats()).thenReturn(heats);
    when(race.getCurrentHeat()).thenReturn(h1);

    RaceParticipant p1 = mock(RaceParticipant.class);
    when(p1.getObjectId()).thenReturn("p1-id");
    when(race.getDrivers()).thenReturn(Collections.singletonList(p1));

    Common.advanceToNextHeat(race);

    // Should skip h2 and set current heat to h3
    verify(race).setCurrentHeat(h3);
    verify(race, never()).setCurrentHeat(h2);

    ArgumentCaptor<IRaceState> stateCaptor = ArgumentCaptor.forClass(IRaceState.class);
    verify(race).changeState(stateCaptor.capture());
    assertTrue(stateCaptor.getValue() instanceof NotStarted);
  }

  @Test
  public void testAdvanceToNextHeat_MultipleEmptyHeats() {
    Race race = mock(Race.class);
    Heat h1 = mock(Heat.class);
    Heat h2 = mock(Heat.class);
    Heat h3 = mock(Heat.class);
    Heat h4 = mock(Heat.class);

    when(h1.getObjectId()).thenReturn("h1-id");
    when(h2.getObjectId()).thenReturn("h2-id");
    when(h3.getObjectId()).thenReturn("h3-id");
    when(h4.getObjectId()).thenReturn("h4-id");

    when(h1.getActiveDriverCount()).thenReturn(1);
    when(h2.getActiveDriverCount()).thenReturn(0);
    when(h3.getActiveDriverCount()).thenReturn(0);
    when(h4.getActiveDriverCount()).thenReturn(1);

    List<Heat> heats = new ArrayList<>(Arrays.asList(h1, h2, h3, h4));
    when(race.getHeats()).thenReturn(heats);
    when(race.getCurrentHeat()).thenReturn(h1);

    Common.advanceToNextHeat(race);

    verify(race).setCurrentHeat(h4);
    verify(race, never()).setCurrentHeat(h2);
    verify(race, never()).setCurrentHeat(h3);

    ArgumentCaptor<IRaceState> stateCaptor = ArgumentCaptor.forClass(IRaceState.class);
    verify(race).changeState(stateCaptor.capture());
    assertTrue(stateCaptor.getValue() instanceof NotStarted);
  }

  @Test
  public void testAdvanceToNextHeat_AllRemainingHeatsEmpty_TransitionsToRaceOver() {
    Race race = mock(Race.class);
    Heat h1 = mock(Heat.class);
    Heat h2 = mock(Heat.class);
    Heat h3 = mock(Heat.class);

    when(h1.getObjectId()).thenReturn("h1-id");
    when(h2.getObjectId()).thenReturn("h2-id");
    when(h3.getObjectId()).thenReturn("h3-id");

    when(h1.getActiveDriverCount()).thenReturn(1);
    when(h2.getActiveDriverCount()).thenReturn(0);
    when(h3.getActiveDriverCount()).thenReturn(0);

    List<Heat> heats = new ArrayList<>(Arrays.asList(h1, h2, h3));
    when(race.getHeats()).thenReturn(heats);
    when(race.getCurrentHeat()).thenReturn(h1);

    Common.advanceToNextHeat(race);

    verify(race, never()).setCurrentHeat(any());
    ArgumentCaptor<IRaceState> stateCaptor = ArgumentCaptor.forClass(IRaceState.class);
    verify(race).changeState(stateCaptor.capture());
    assertTrue(stateCaptor.getValue() instanceof RaceOver);
  }

  @Test
  public void testAdvanceToNextHeat_LastHeat() {
    Race race = mock(Race.class);
    Heat h1 = mock(Heat.class);

    when(h1.getObjectId()).thenReturn("h1-id");

    List<Heat> heats = new ArrayList<>(Collections.singletonList(h1));
    when(race.getHeats()).thenReturn(heats);
    when(race.getCurrentHeat()).thenReturn(h1);

    Common.advanceToNextHeat(race);

    // Verifies that state was changed to RaceOver
    ArgumentCaptor<IRaceState> stateCaptor = ArgumentCaptor.forClass(IRaceState.class);
    verify(race).changeState(stateCaptor.capture());
    assertTrue(stateCaptor.getValue() instanceof RaceOver);

    // No next heat, so setCurrentHeat etc. shouldn't be called
    verify(race, never()).setCurrentHeat(any());
    verify(race, never()).resetRaceTime();
    verify(race, never()).prepareHeat();
    verify(race, never()).broadcast(any());
  }

  @Test
  public void testHandleDriftLap_NullRaceOrModel() {
    assertFalse(Common.handleDriftLap(null, System.currentTimeMillis(), "State", 0, 5.0, 1, null));

    Race race = mock(Race.class);
    when(race.getRaceModel()).thenReturn(null);
    assertFalse(Common.handleDriftLap(race, System.currentTimeMillis(), "State", 0, 5.0, 1, null));
  }

  @Test
  public void testHandleDriftLap_ZeroDriftTime() {
    Race race = mock(Race.class);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withDriftTime(0.0).build();
    when(race.getRaceModel()).thenReturn(model);

    assertFalse(Common.handleDriftLap(race, System.currentTimeMillis(), "State", 0, 5.0, 1, null));
  }

  @Test
  public void testHandleDriftLap_ExpiredDriftTime() {
    Race race = mock(Race.class);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withDriftTime(0.01).build();
    when(race.getRaceModel()).thenReturn(model);

    long pastStartTime = System.currentTimeMillis() - 50;
    assertFalse(Common.handleDriftLap(race, pastStartTime, "State", 0, 5.0, 1, null));
  }

  @Test
  public void testHandleDriftLap_WithinDriftWindow_SuccessWithCallback() {
    Race race = mock(Race.class);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withDriftTime(1.0).build();
    when(race.getRaceModel()).thenReturn(model);

    com.antigravity.race.HeatExecutionManager hem =
        mock(com.antigravity.race.HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(hem);
    when(hem.onLap(0, 5.0, 1, false, true, true)).thenReturn(true);

    boolean[] callbackRan = new boolean[] {false};
    boolean result =
        Common.handleDriftLap(
            race,
            System.currentTimeMillis(),
            "State",
            0,
            5.0,
            1,
            () -> {
              callbackRan[0] = true;
            });

    assertTrue(result);
    assertTrue(callbackRan[0]);
    verify(hem).onLap(0, 5.0, 1, false, true, true);
  }

  @Test
  public void testHandleDriftLap_WithinDriftWindow_UncountedDoesNotRunCallback() {
    Race race = mock(Race.class);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withDriftTime(1.0).build();
    when(race.getRaceModel()).thenReturn(model);

    com.antigravity.race.HeatExecutionManager hem =
        mock(com.antigravity.race.HeatExecutionManager.class);
    when(race.getHeatExecutionManager()).thenReturn(hem);
    when(hem.onLap(0, 5.0, 1, false, true, true)).thenReturn(false);

    boolean[] callbackRan = new boolean[] {false};
    boolean result =
        Common.handleDriftLap(
            race,
            System.currentTimeMillis(),
            "State",
            0,
            5.0,
            1,
            () -> {
              callbackRan[0] = true;
            });

    assertFalse(result);
    assertFalse(callbackRan[0]);
  }
}
