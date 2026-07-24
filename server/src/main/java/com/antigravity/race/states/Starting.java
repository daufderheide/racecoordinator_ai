package com.antigravity.race.states;

import com.antigravity.proto.Lap;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Race;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * State representing the countdown/pre-start period of a race. Handles the countdown ticker and
 * transitions to Racing state.
 */
public class Starting implements IRaceState {

  private static final Logger logger = LoggerFactory.getLogger(Starting.class);

  private ScheduledExecutorService scheduler;
  private ScheduledFuture<?> timerHandle;
  private Race race;

  public Starting() {}

  @Override
  public void enter(Race race) {
    this.race = race;
    logger.info("Starting state entered. Countdown initiating.");
    race.broadcastFlag(getFlagType(race));

    // Set auto-start fired to prevent re-triggering from NotStarted
    race.setAutoStartFired(true);

    double startTimeVal =
        race.hasRacedInCurrentHeat()
            ? race.getRaceModel().getRestartTime()
            : race.getRaceModel().getStartTime();

    double delayLimitVal =
        race.hasRacedInCurrentHeat()
            ? race.getRaceModel().getRestartRandomizer()
            : race.getRaceModel().getStartRandomizer();

    final int randomTicks =
        delayLimitVal > 0 ? new java.util.Random().nextInt((int) (delayLimitVal * 10)) + 1 : 0;

    logger.info("Starting countdown: {}s + {} random ticks", startTimeVal, randomTicks);

    if (scheduler != null) {
      scheduler.shutdown();
    }
    scheduler =
        Executors.newSingleThreadScheduledExecutor(
            r -> {
              Thread t = new Thread(r, "StartingTicker");
              t.setDaemon(true);
              return t;
            });

    final Runnable ticker =
        new Runnable() {
          private int countdown = (int) (startTimeVal * 10);
          private int remainingRandomTicks = randomTicks;

          @Override
          public void run() {
            try {
              float displayTime = Math.max(0, countdown) / 10.0f;
              race.setAutoStartRemaining(displayTime);

              // Update hardware and broadcast time
              race.setHeatProgress(0.0);
              race.syncRaceState();
              race.broadcastTime();

              if (countdown > 0) {
                countdown--;
              } else if (remainingRandomTicks > 0) {
                remainingRandomTicks--;
              } else {
                logger.info("Starting ticker: Transitioning to Racing.");
                race.changeState(new Racing());
              }
            } catch (Throwable t) {
              logger.error("Error in Starting timer", t);
            }
          }
        };

    timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, TimeUnit.MILLISECONDS);
  }

  @Override
  public void exit(Race race) {
    logger.info("Starting state exited.");
    stopTimer();
    race.setAutoStartRemaining(0);
  }

  private void stopTimer() {
    if (timerHandle != null) {
      timerHandle.cancel(false);
      timerHandle = null;
    }
    if (scheduler != null) {
      scheduler.shutdown();
      scheduler = null;
    }
  }

  @Override
  public void nextHeat(Race race) {
    throw new IllegalStateException("Cannot move to next heat while starting");
  }

  @Override
  public void restartHeat(Race race) {
    logger.info("Starting.restartHeat() called. Resetting current heat.");
    race.resetCurrentHeat();
    race.changeState(new NotStarted());
  }

  @Override
  public void skipHeat(Race race) {
    throw new IllegalStateException("Cannot skip heat while starting");
  }

  @Override
  public void deferHeat(Race race) {
    throw new IllegalStateException("Cannot defer heat while starting");
  }

  @Override
  public void start(Race race) {
    logger.info("Start called while already starting. Ignoring.");
  }

  @Override
  public void pause(Race race) {
    logger.info("Starting.pause() called. Transitioning to NotStarted or Paused.");
    stopTimer();
    if (race.hasRacedInCurrentHeat()) {
      race.changeState(new Paused());
    } else {
      race.changeState(new NotStarted());
    }
  }

  @Override
  public boolean onLap(int lane, double lapTime, int interfaceId, boolean isDrift) {
    logger.info("Lap detected in lane {} during starting. Processing false start.", lane);
    if (race == null || race.getCurrentHeat() == null) {
      return false;
    }
    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    if (lane < 0 || lane >= drivers.size()) {
      return false;
    }

    DriverHeatData dhd = drivers.get(lane);
    if (dhd == null) {
      return false;
    }

    dhd.incrementFalseStarts();

    double lapPenalty = race.getRaceModel().getFalseStartLapPenalty();
    if (lapPenalty > 0) {
      dhd.setPenaltyLaps(dhd.getPenaltyLaps() + lapPenalty);
    }

    double timePenalty = race.getRaceModel().getFalseStartTimePenalty();
    if (timePenalty > 0) {
      dhd.setRemainingFalseStartTimePenalty(timePenalty);
    }

    Lap falseStartMsg =
        Lap.newBuilder()
            .setObjectId(dhd.getObjectId())
            .setLapTime(0.0)
            .setInterfaceId(interfaceId)
            .setType(Lap.LapType.FALSE_START)
            .setFlag(getLaneFlagType(race, lane))
            .build();
    dhd.setFlag(falseStartMsg.getFlag());

    RaceData falseStartDataMsg = RaceData.newBuilder().setLap(falseStartMsg).build();
    race.broadcast(falseStartDataMsg);

    if (race.getRaceModel().isRestartOnFalseStart()) {
      logger.info("Restarting heat due to false start on lane {}", lane);
      stopTimer();
      race.restartHeatForFalseStart();
    }

    return true;
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {}

  @Override
  public void onCarData(CarData carData) {}

  @Override
  public void onCallbutton(Race race, int lane) {
    logger.info("Callbutton pressed during starting. Pausing race.");
    pause(race);
  }

  @Override
  public RaceFlag getFlagType(Race race) {
    if (race != null && race.hasRacedInCurrentHeat()) {
      return RaceFlag.YELLOW;
    }
    return RaceFlag.RED;
  }

  @Override
  public RaceFlag getLaneFlagType(Race race, int lane) {
    if (race != null
        && race.getCurrentHeat() != null
        && lane < race.getCurrentHeat().getDrivers().size()) {
      if (race.getCurrentHeat().getDrivers().get(lane).getRemainingFalseStartTimePenalty() > 0) {
        return RaceFlag.BLACK;
      }
    }
    return getFlagType(race);
  }
}
