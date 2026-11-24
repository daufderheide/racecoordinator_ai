package com.antigravity.race;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.HeatScoring;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import org.junit.Before;
import org.junit.Test;

public class RaceHardwareEventHandlerTest {

  private Race race;

  @Before
  public void setUp() {
    race = mock(Race.class);
  }

  @Test
  public void testHandleStartTimerWhenStoppedDoesNothing() {
    when(race.isStopped()).thenReturn(true);
    RaceHardwareEventHandler.handleStartTimer(race, 0);
    verify(race, never()).moveToNextHeat();
    verify(race, never()).startRace();
  }

  @Test
  public void testHandleStartTimerInHeatOverMovesToNextHeat() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new HeatOver());
    RaceHardwareEventHandler.handleStartTimer(race, 0);
    verify(race).moveToNextHeat();
    verify(race, never()).startRace();
  }

  @Test
  public void testHandleStartTimerInNotStartedStartsRace() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new NotStarted());
    RaceHardwareEventHandler.handleStartTimer(race, 0);
    verify(race).startRace();
    verify(race, never()).moveToNextHeat();
  }

  @Test
  public void testHandleStartTimerInPausedResumesRace() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new Paused());
    RaceHardwareEventHandler.handleStartTimer(race, 0);
    verify(race).startRace();
    verify(race, never()).moveToNextHeat();
  }

  @Test
  public void testHandleStartTimerInStartingDoesNothing() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new Starting());
    RaceHardwareEventHandler.handleStartTimer(race, 0);
    verify(race, never()).startRace();
    verify(race, never()).moveToNextHeat();
  }

  @Test
  public void testHandleStartTimerInOtherStatesDoesNothing() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new Racing());
    RaceHardwareEventHandler.handleStartTimer(race, 0);
    verify(race, never()).moveToNextHeat();
    verify(race, never()).startRace();
  }

  @Test
  public void testHandlePauseTimerWhenStoppedDoesNothing() {
    when(race.isStopped()).thenReturn(true);
    RaceHardwareEventHandler.handlePauseTimer(race, 0);
    verify(race, never()).pauseRace();
  }

  @Test
  public void testHandlePauseTimerInRacingPausesRace() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new Racing());
    RaceHardwareEventHandler.handlePauseTimer(race, 0);
    verify(race).pauseRace();
  }

  @Test
  public void testHandlePauseTimerInStartingPausesRace() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new Starting());
    RaceHardwareEventHandler.handlePauseTimer(race, 0);
    verify(race).pauseRace();
  }

  @Test
  public void testHandlePauseTimerInPausedDoesNothing() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new Paused());
    RaceHardwareEventHandler.handlePauseTimer(race, 0);
    verify(race, never()).pauseRace();
  }

  @Test
  public void testHandleEndHeatInfiniteTimedLastHeatTransitionsToRaceOver() {
    when(race.isStopped()).thenReturn(false);
    com.antigravity.models.Race model = mock(com.antigravity.models.Race.class); // fqn-collision
    HeatScoring scoring = mock(HeatScoring.class);
    when(scoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Timed);
    when(scoring.getFinishValue()).thenReturn(0L);
    when(model.getHeatScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(model);
    when(race.isLastHeat()).thenReturn(true);

    RaceHardwareEventHandler.handleEndHeat(race, 0);
    verify(race).changeState(any(RaceOver.class));
  }

  @Test
  public void testHandleEndHeatInfiniteTimedNotLastHeatTransitionsToHeatOver() {
    when(race.isStopped()).thenReturn(false);
    com.antigravity.models.Race model = mock(com.antigravity.models.Race.class); // fqn-collision
    HeatScoring scoring = mock(HeatScoring.class);
    when(scoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Timed);
    when(scoring.getFinishValue()).thenReturn(0L);
    when(model.getHeatScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(model);
    when(race.isLastHeat()).thenReturn(false);

    RaceHardwareEventHandler.handleEndHeat(race, 0);
    verify(race).changeState(any(HeatOver.class));
  }

  @Test
  public void testHandleEndHeatNonInfiniteTimedPausesIfRacing() {
    when(race.isStopped()).thenReturn(false);
    com.antigravity.models.Race model = mock(com.antigravity.models.Race.class); // fqn-collision
    HeatScoring scoring = mock(HeatScoring.class);
    when(scoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Timed);
    when(scoring.getFinishValue()).thenReturn(120L); // 2 minutes, not infinite
    when(model.getHeatScoring()).thenReturn(scoring);
    when(race.getRaceModel()).thenReturn(model);
    when(race.getState()).thenReturn(new Racing());

    RaceHardwareEventHandler.handleEndHeat(race, 0);
    verify(race).pauseRace();
  }

  @Test
  public void testHandleAbortInRaceOverOrNotStartedIsIgnored() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new NotStarted());
    RaceHardwareEventHandler.handleAbort(race, 0);
    verify(race, never()).restartHeat();

    when(race.getState()).thenReturn(new RaceOver());
    RaceHardwareEventHandler.handleAbort(race, 0);
    verify(race, never()).restartHeat();
  }

  @Test
  public void testHandleAbortInPausedOrRacingRestartsHeat() {
    when(race.isStopped()).thenReturn(false);
    when(race.getState()).thenReturn(new Paused());
    RaceHardwareEventHandler.handleAbort(race, 0);
    verify(race).restartHeat();

    when(race.getState()).thenReturn(new Racing());
    RaceHardwareEventHandler.handleAbort(race, 0);
    verify(race, org.mockito.Mockito.times(2)).restartHeat();
  }

  @Test
  public void testHandleAbortInStartingAbortsStart() {
    when(race.isStopped()).thenReturn(false);
    Starting startingState = mock(Starting.class);
    when(race.getState()).thenReturn(startingState);
    when(race.hasRacedInCurrentHeat()).thenReturn(true);

    RaceHardwareEventHandler.handleAbort(race, 0);
    verify(race).clearAutoTimers();
    verify(race).recordTrackCall(-1);
    verify(startingState).pause(race);
  }
}
