package com.antigravity.race.states;

import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceTime;
import com.antigravity.protocols.CarData;
import com.antigravity.race.Race;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class Starting implements IRaceState {

  @Override
  public RaceFlag getFlagType(Race race) {
    return race.hasRacedInCurrentHeat() ? RaceFlag.YELLOW : RaceFlag.RED;
  }

  private ScheduledExecutorService scheduler;
  private ScheduledFuture<?> timerHandle;

  @Override
  public void enter(Race race) {
    System.out.println("Starting state entered. Countdown initiating.");
    race.setMainPower(false);

    if (!race.hasRacedInCurrentHeat()) {
      race.prepareHeat();
    }
    race.setAutoStartFired(true);

    final double startTimeVal =
        race.hasRacedInCurrentHeat()
            ? race.getRaceModel().getRestartTime()
            : race.getRaceModel().getStartTime();
    final double delayLimitVal =
        race.hasRacedInCurrentHeat()
            ? race.getRaceModel().getRestartDelay()
            : race.getRaceModel().getStartDelay();

    final int randomTicks =
        delayLimitVal > 0 ? new java.util.Random().nextInt((int) (delayLimitVal * 10)) + 1 : 0;

    race.setAutoStartRemaining(startTimeVal);
    System.out.println(
        "Starting state: startTimeVal="
            + startTimeVal
            + ", delayLimitVal="
            + delayLimitVal
            + ", randomTicks="
            + randomTicks);

    scheduler = Executors.newScheduledThreadPool(1);
    final Runnable ticker =
        new Runnable() {
          int countdown = (int) (startTimeVal * 10);
          int remainingRandomTicks = randomTicks;

          @Override
          public void run() {
            try {
              float displayTime = Math.max(0, countdown) / 10.0f;

              RaceTime raceTimeMsg = RaceTime.newBuilder().setTime(displayTime).build();

              RaceData raceDataMsg = RaceData.newBuilder().setRaceTime(raceTimeMsg).build();

              race.broadcast(raceDataMsg);
              race.setRaceState(
                  com.antigravity.proto.RaceState.STARTING,
                  getFlagType(race),
                  (double) displayTime);

              if (countdown > 0) {
                countdown--;
              } else if (remainingRandomTicks > 0) {
                remainingRandomTicks--;
              } else {
                race.changeState(new Racing());
              }
            } catch (Exception e) {
              System.err.println("Error in Starting timer: " + e.getMessage());
              e.printStackTrace();
            }
          }
        };
    timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, TimeUnit.MILLISECONDS);
  }

  @Override
  public void exit(Race race) {
    if (timerHandle != null) {
      timerHandle.cancel(false);
    }
    if (scheduler != null) {
      scheduler.shutdown();
    }
    System.out.println("Starting state exited.");
  }

  @Override
  public void nextHeat(Race race) {
    throw new IllegalStateException(
        "Cannot move to next heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void start(Race race) {
    throw new IllegalStateException("Cannot start race: Race is already in Starting state.");
  }

  @Override
  public void pause(Race race) {
    System.out.println("Starting.pause() called. Cancelling start.");
    if (race.hasRacedInCurrentHeat()) {
      race.changeState(new Paused());
    } else {
      race.resetRaceTime();
      race.changeState(new NotStarted());
    }
  }

  @Override
  public void restartHeat(Race race) {
    throw new IllegalStateException(
        "Cannot restart heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void skipHeat(Race race) {
    throw new IllegalStateException(
        "Cannot skip heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void deferHeat(Race race) {
    throw new IllegalStateException(
        "Cannot defer heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public boolean onLap(int lane, double lapTime, int interfaceId, boolean isDrift) {
    // Not while starting
    return false;
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    // Not while starting
  }

  @Override
  public void onCarData(CarData carData) {
    // TODO(aufderheide): Handle false start
  }

  @Override
  public void onCallbutton(Race race, int lane) {
    System.out.println("Starting.onCallbutton() called. Pausing race start.");
    pause(race);
  }
}
