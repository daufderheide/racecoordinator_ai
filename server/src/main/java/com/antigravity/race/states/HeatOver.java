package com.antigravity.race.states;

public class HeatOver implements IRaceState {
  private java.util.concurrent.ScheduledExecutorService scheduler;
  private java.util.concurrent.ScheduledFuture<?> timerHandle;

  @Override
  public void enter(com.antigravity.race.Race race) {
    System.out.println("HeatOver state entered.");
    race.setMainPower(false);

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
  public void exit(com.antigravity.race.Race race) {
    System.out.println("HeatOver state exited.");
    stopTimer();
  }

  @Override
  public void nextHeat(com.antigravity.race.Race race) {
    stopTimer();
    Common.advanceToNextHeat(race);
  }

  @Override
  public void skipHeat(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot skip heat: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void start(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot start race: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void pause(com.antigravity.race.Race race) {
    System.out.println("HeatOver.pause() called. Terminating auto-advance.");
    stopTimer();
    race.setAutoAdvanceFired(true);
    race.clearAutoTimers();
  }

  @Override
  public void restartHeat(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot restart heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void deferHeat(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot defer heat: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId) {
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
  }

  @Override
  public void onCarData(com.antigravity.protocols.CarData carData) {
  }

  private void startAutoAdvanceTimer(final com.antigravity.race.Race race) {
    scheduler = java.util.concurrent.Executors.newScheduledThreadPool(1);
    final Runnable ticker = new Runnable() {
      long lastTime = 0;

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
            broadcastTime(race);
          }
        } catch (Exception e) {
          e.printStackTrace();
        }
      }
    };
    timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, java.util.concurrent.TimeUnit.MILLISECONDS);
  }

  private void stopTimer() {
    if (timerHandle != null) {
      timerHandle.cancel(true);
    }
    if (scheduler != null) {
      scheduler.shutdown();
    }
  }

  private void broadcastTime(com.antigravity.race.Race race) {
    race.broadcastTime();
  }

  @Override
  public void onCallbutton(com.antigravity.race.Race race, int lane) {
    System.out.println("HeatOver.onCallbutton() called. Moving to next heat.");
    nextHeat(race);
  }
}
