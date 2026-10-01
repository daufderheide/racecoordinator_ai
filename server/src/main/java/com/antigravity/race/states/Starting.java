package com.antigravity.race.states;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.Lap;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Race;
import com.antigravity.service.DatabaseService;
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
    syncDriverFlags(race);

    // Set auto-start fired to prevent re-triggering from NotStarted
    race.setAutoStartFired(true);

    if (!race.hasRacedInCurrentHeat()
        && race.getRaceModel() != null
        && race.getRaceModel().getEntityId() != null) {
      ClientSubscriptionManager csm = ClientSubscriptionManager.getInstance();
      DatabaseContext dbCtx = csm != null ? csm.getDatabaseContext() : null;
      if (dbCtx != null && DatabaseService.getInstance() != null) {
        DatabaseService.getInstance()
            .deletePredictionEvaluationRecord(
                dbCtx, race.getRaceModel().getEntityId(), race.isDemoMode());
      }
    }

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
    final double randomDelaySeconds = randomTicks / 10.0;
    final double totalDurationSeconds = startTimeVal + randomDelaySeconds;

    logger.info(
        "Starting countdown: {}s + {}s random delay (total {}s)",
        startTimeVal,
        randomDelaySeconds,
        totalDurationSeconds);

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

    final long startNanoTime = System.nanoTime();
    final Runnable ticker =
        new Runnable() {
          private long expectedNextTickNano = startNanoTime;

          @Override
          public void run() {
            try {
              long tickStartNano = System.nanoTime();
              if (expectedNextTickNano > 0) {
                long jitterNs = tickStartNano - expectedNextTickNano;
                if (jitterNs > 100_000_000L) {
                  logger.warn("[PERF] Starting ticker delayed by {} ms", jitterNs / 1_000_000L);
                }
              }
              expectedNextTickNano = tickStartNano + 100_000_000L;

              double elapsed = (tickStartNano - startNanoTime) / 1_000_000_000.0;
              float displayTime = (float) Math.max(0.0, startTimeVal - elapsed);

              if (elapsed >= totalDurationSeconds) {
                race.setAutoStartRemaining(0.0f);
                race.setHeatProgress(0.0);
                race.syncRaceState();
                race.broadcastTime();
                logger.info("Starting ticker: Transitioning to Racing.");
                race.changeState(new Racing());
              } else {
                race.setAutoStartRemaining(displayTime);
                race.setHeatProgress(0.0);
                race.syncRaceState();
                race.broadcastTime();
              }

              long tickExecNs = System.nanoTime() - tickStartNano;
              if (tickExecNs > 25_000_000L) {
                logger.warn("[PERF] Starting ticker execution took {} ms", tickExecNs / 1_000_000L);
              }
            } catch (Throwable t) {
              logger.error("Error in Starting timer", t);
            }
          }
        };

    timerHandle = scheduler.scheduleWithFixedDelay(ticker, 0, 100, TimeUnit.MILLISECONDS);
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
    race.changeState(new NotStarted());
    race.resetCurrentHeat();
    race.setAutoStartFired(false);
    race.setAutoAdvanceFired(false);
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

    race.setLanePower(false, lane);

    Lap falseStartMsg =
        Lap.newBuilder()
            .setObjectId(dhd.getObjectId())
            .setLapTime(0.0)
            .setInterfaceId(interfaceId)
            .setType(Lap.LapType.FALSE_START)
            .setFlag(getLaneFlagType(race, lane))
            .setFuelLevel(dhd.getDriver().getFuelLevel())
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
    if (race.hasRacedInCurrentHeat()) {
      race.recordTrackCall(lane);
    }
    pause(race);
  }

  @Override
  public RaceFlag getFlagType(Race race) {
    if (race != null && race.hasRacedInCurrentHeat()) {
      return race.getTheme() != null
          ? race.getTheme()
              .resolveFlag("flag.restarting", RaceFlag.YELLOW, race.getDatabaseContext())
          : RaceFlag.YELLOW;
    }
    return race.getTheme() != null
        ? race.getTheme().resolveFlag("flag.starting", RaceFlag.RED, race.getDatabaseContext())
        : RaceFlag.RED;
  }

  @Override
  public RaceFlag getLaneFlagType(Race race, int lane) {
    if (race != null
        && race.getCurrentHeat() != null
        && lane < race.getCurrentHeat().getDrivers().size()) {
      if (race.getCurrentHeat().getDrivers().get(lane).getRemainingFalseStartTimePenalty() > 0) {
        return race.getTheme() != null
            ? race.getTheme().resolveFlag("flag.penalty", RaceFlag.BLACK, race.getDatabaseContext())
            : RaceFlag.BLACK;
      }
    }
    return getFlagType(race);
  }
}
