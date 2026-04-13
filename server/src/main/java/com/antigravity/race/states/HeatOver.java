package com.antigravity.race.states;

import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.Race;
import java.time.OffsetDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class HeatOver implements IRaceState {

  @Override
  public RaceFlag getFlagType(Race race) {
    if (race == null) return RaceFlag.RED;

    double warmupTime = race.getRaceModel().getAutoAdvanceWarmupTime();
    double remaining = race.getAutoAdvanceRemaining();

    if (warmupTime > 0 && remaining > 0 && remaining <= warmupTime) {
      return RaceFlag.GREEN_YELLOW;
    }

    return RaceFlag.RED;
  }

  private ScheduledExecutorService scheduler;
  private ScheduledFuture<?> timerHandle;

  @Override
  public void enter(Race race) {
    System.out.println("HeatOver state entered.");
    race.setMainPower(false);

    if (race.getCurrentHeat() != null) {
      race.getCurrentHeat().getStatistics().setEndTime(OffsetDateTime.now().toString());
      long start = race.getCurrentHeat().getStatistics().getStartMillis();
      if (start > 0) {
        race.getCurrentHeat().getStatistics().setDurationMillis(System.currentTimeMillis() - start);
      }
    }

    double autoAdvanceTime = race.getRaceModel().getAutoAdvanceTime();
    if (autoAdvanceTime > 0 && !race.isAutoAdvanceFired()) {
      race.setAutoAdvanceRemaining(autoAdvanceTime);
      startAutoAdvanceTimer(race);
    } else {
      race.setAutoAdvanceRemaining(0);
      broadcastTime(race);
    }
  }

  @Override
  public void exit(Race race) {
    System.out.println("HeatOver state exited.");
    stopTimer();
  }

  @Override
  public void nextHeat(Race race) {
    stopTimer();
    Common.advanceToNextHeat(race);
  }

  @Override
  public void skipHeat(Race race) {
    throw new IllegalStateException("Cannot skip heat: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void start(Race race) {
    throw new IllegalStateException(
        "Cannot start race: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void pause(Race race) {
    System.out.println("HeatOver.pause() called. Terminating auto-advance.");
    stopTimer();
    race.setAutoAdvanceFired(true);
    race.clearAutoTimers();
  }

  @Override
  public void restartHeat(Race race) {
    System.out.println("HeatOver.restartHeat() called. Resetting current heat.");
    race.resetCurrentHeat();
    race.changeState(new NotStarted());
  }

  @Override
  public void deferHeat(Race race) {
    throw new IllegalStateException(
        "Cannot defer heat: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId) {}

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {}

  @Override
  public void onCarData(CarData carData) {}

  private void startAutoAdvanceTimer(final Race race) {
    scheduler = Executors.newScheduledThreadPool(1);
    final Runnable ticker =
        new Runnable() {
          long lastTime = 0;

          @Override
          public void run() {
            try {
              long now = System.nanoTime();
              if (lastTime == 0) {
                lastTime = now;
                return;
              }

              double delta = (now - lastTime) / 1_000_000_000.0;
              lastTime = now;

              double remaining = race.getAutoAdvanceRemaining() - delta;
              if (remaining <= 0) {
                remaining = 0;
                race.setAutoAdvanceRemaining(0);
                broadcastTime(race);
                stopTimer();
                race.setAutoAdvanceFired(true);
                race.moveToNextHeat();
              } else {
                race.setAutoAdvanceRemaining(remaining);

                // Handle warmup time power logic
                double warmupTime = race.getRaceModel().getAutoAdvanceWarmupTime();
                if (warmupTime > 0) {
                  if (remaining <= warmupTime) {
                    if (!race.isMainPower()) {
                      race.setMainPower(true);
                    }
                  } else {
                    if (race.isMainPower()) {
                      race.setMainPower(false);
                    }
                  }
                }

                broadcastTime(race);
              }
            } catch (Exception e) {
              e.printStackTrace();
            }
          }
        };
    timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, TimeUnit.MILLISECONDS);
  }

  private void stopTimer() {
    if (timerHandle != null) {
      timerHandle.cancel(true);
    }
    if (scheduler != null) {
      scheduler.shutdown();
    }
  }

  private void broadcastTime(Race race) {
    race.broadcastTime();
  }

  @Override
  public void onCallbutton(Race race, int lane) {
    System.out.println("HeatOver.onCallbutton() called. Moving to next heat.");
    nextHeat(race);
  }
}
