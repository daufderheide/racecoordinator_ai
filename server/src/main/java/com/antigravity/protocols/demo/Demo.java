package com.antigravity.protocols.demo;

import java.util.ArrayList;
import java.util.List;

import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.PartialTime;
import com.antigravity.proto.DemoPinId;

public class Demo extends DefaultProtocol {
  private java.util.concurrent.ScheduledExecutorService scheduler;
  private java.util.concurrent.ScheduledExecutorService statusScheduler;
  private java.util.concurrent.ScheduledFuture<?> statusFuture;
  private java.util.concurrent.ScheduledFuture<?> timerHandle;
  private java.util.Random random;

  private class LaneState {
    long currentLapElapsedTime = 0;
    long targetLapDuration;
    long currentLapStartTime = 0;
    boolean isFirstLap = true;

    LaneState() {
      setNextTarget();
    }

    void setNextTarget() {
      if (isFirstLap) {
        // First lap is reaction time: (0, 0.5]s
        targetLapDuration = 1 + random.nextInt(500);
        isFirstLap = false;
      } else {
        // Regular lap time: [3s, 5s]
        targetLapDuration = 3000 + random.nextInt(2001);
      }
    }
  }

  private LaneState[] laneStates;

  public Demo(int numLanes) {
    this(numLanes, new java.util.Random());
  }

  protected Demo(int numLanes, java.util.Random random) {
    super(numLanes);
    this.random = random;
    laneStates = new LaneState[numLanes];
    for (int i = 0; i < numLanes; i++) {
      laneStates[i] = new LaneState();
    }
  }

  @Override
  public boolean open() {
    startStatusScheduler();
    return true;
  }

  @Override
  public void close() {
    if (statusFuture != null) {
      statusFuture.cancel(true);
    }
    if (statusScheduler != null) {
      statusScheduler.shutdown();
    }
    statusScheduler = null;
  }

  private void startStatusScheduler() {
    if (statusFuture != null && !statusFuture.isCancelled()) {
      return;
    }
    if (statusScheduler == null || statusScheduler.isShutdown()) {
      statusScheduler = createScheduler();
    }
    statusFuture = statusScheduler.scheduleAtFixedRate(() -> {
      if (listener != null) {
        listener.onInterfaceStatus(com.antigravity.proto.InterfaceStatus.CONNECTED);
      }
    }, 0, 1, java.util.concurrent.TimeUnit.SECONDS);
  }

  @Override
  public void startTimer() {
    if (scheduler != null && !scheduler.isShutdown()) {
      return;
    }
    scheduler = createScheduler();

    // Restore start times based on elapsed time
    long nowMs = now();
    for (LaneState state : laneStates) {
      state.currentLapStartTime = nowMs - state.currentLapElapsedTime;
    }

    Runnable lapGenerator = new Runnable() {
      public void run() {
        try {
          long nowMs = now();
          for (int i = 0; i < laneStates.length; i++) {
            LaneState state = laneStates[i];
            long totalElapsed = nowMs - state.currentLapStartTime;

            if (totalElapsed >= state.targetLapDuration) {
              double lapTime = totalElapsed / 1000.0;

              if (listener != null) {
                int laneInterfaceId = DemoPinId.DEMO_PIN_ID_LANE_BASE_VALUE.getNumber() + i;
                listener.onLap(i, lapTime, laneInterfaceId);
              }

              // Reset for next lap
              state.currentLapElapsedTime = 0;
              // The start time for the next lap is effectively "now"
              // but closely aligned to when the previous one finished to avoid drift?
              // For simplicity in this demo, just resetting to now is fine,
              // or we could add the overshoot to the next lap if we wanted perfect precision.
              // Let's stick to "now" for simple restart logic.
              state.currentLapStartTime = nowMs;
              state.setNextTarget();
            }
          }
        } catch (Exception e) {
          e.printStackTrace();
        }
      }
    };

    timerHandle = scheduler.scheduleAtFixedRate(lapGenerator, 0, 50, java.util.concurrent.TimeUnit.MILLISECONDS);
  }

  @Override
  public List<PartialTime> stopTimer() {
    if (timerHandle != null) {
      timerHandle.cancel(true);
    }
    if (scheduler != null) {
      scheduler.shutdown();
    }
    scheduler = null; // Ensure we can restart it

    // Save state
    long nowMs = now();
    List<PartialTime> partialTimes = new ArrayList<>();
    for (int i = 0; i < laneStates.length; i++) {
      LaneState state = laneStates[i];
      state.currentLapElapsedTime = nowMs - state.currentLapStartTime;
      partialTimes.add(new PartialTime(i, state.currentLapElapsedTime / 1000.0, 0.0));
    }

    return partialTimes;
  }

  protected long now() {
    return System.currentTimeMillis();
  }

  protected java.util.concurrent.ScheduledExecutorService createScheduler() {
    return java.util.concurrent.Executors.newScheduledThreadPool(1);
  }

}
