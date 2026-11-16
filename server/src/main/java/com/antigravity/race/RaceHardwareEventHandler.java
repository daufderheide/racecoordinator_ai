package com.antigravity.race;

import com.antigravity.models.HeatScoring;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceHardwareEventHandler {

  private static final Logger logger = LoggerFactory.getLogger(RaceHardwareEventHandler.class);

  public static void handleStartTimer(Race race, int interfaceIndex) {
    if (race.isStopped()) {
      return;
    }
    IRaceState state = race.getState();
    logger.info(
        "Hardware onStartTimer received from interface {}. Current state: {}",
        interfaceIndex,
        state != null ? state.getClass().getSimpleName() : "null");
    if (state instanceof HeatOver) {
      logger.info("Advancing to next heat due to hardware START_TIMER");
      race.moveToNextHeat();
    } else {
      logger.info(
          "Ignoring hardware START_TIMER in state {}",
          state != null ? state.getClass().getSimpleName() : "null");
    }
  }

  public static void handlePauseTimer(Race race, int interfaceIndex) {
    if (race.isStopped()) {
      return;
    }
    IRaceState state = race.getState();
    logger.info(
        "Hardware onPauseTimer received from interface {}. Current state: {}",
        interfaceIndex,
        state != null ? state.getClass().getSimpleName() : "null");
    if (state instanceof Racing) {
      logger.info("Pausing race due to hardware PAUSE_TIMER");
      race.pauseRace();
    } else {
      logger.info(
          "Ignoring hardware PAUSE_TIMER in state {}",
          state != null ? state.getClass().getSimpleName() : "null");
    }
  }

  public static void handleEndHeat(Race race, int interfaceIndex) {
    if (race.isStopped()) {
      return;
    }
    IRaceState state = race.getState();
    logger.info(
        "Hardware onEndHeat received from interface {}. Current state: {}",
        interfaceIndex,
        state != null ? state.getClass().getSimpleName() : "null");
    HeatScoring scoring = race.getRaceModel() != null ? race.getRaceModel().getHeatScoring() : null;
    boolean isTimed =
        scoring != null && scoring.getFinishMethod() == HeatScoring.FinishMethod.Timed;
    boolean isInfiniteTimed = isTimed && scoring.getFinishValue() <= 0;

    if (isInfiniteTimed) {
      logger.info("Infinitely timed heat ending via hardware END_HEAT");
      if (race.isLastHeat()) {
        race.changeState(new RaceOver());
      } else {
        race.changeState(new HeatOver());
      }
    } else {
      logger.info("Non-infinitely timed heat received hardware END_HEAT; pausing race");
      if (state instanceof Racing || state instanceof Starting) {
        race.pauseRace();
      }
    }
  }

  public static void handleAbort(Race race, int interfaceIndex) {
    if (race.isStopped()) {
      return;
    }
    IRaceState state = race.getState();
    logger.info(
        "Hardware onAbort received from interface {}. Current state: {}",
        interfaceIndex,
        state != null ? state.getClass().getSimpleName() : "null");
    if (state instanceof RaceOver || state instanceof NotStarted) {
      logger.info(
          "Ignoring hardware ABORT in state {}",
          state != null ? state.getClass().getSimpleName() : "null");
      return;
    }
    if (state instanceof Paused || state instanceof Racing) {
      logger.info(
          "Restarting heat due to hardware ABORT in state {}", state.getClass().getSimpleName());
      race.restartHeat();
    } else if (state instanceof Starting) {
      logger.info("Aborting start sequence due to hardware ABORT");
      race.clearAutoTimers();
      if (race.hasRacedInCurrentHeat()) {
        race.recordTrackCall(-1);
      }
      state.pause(race);
    }
  }
}
