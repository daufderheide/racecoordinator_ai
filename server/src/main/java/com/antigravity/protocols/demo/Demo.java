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
  private boolean isFuelRace;

  private class LaneState {
    long currentLapElapsedTime = 0;
    long targetLapDuration;
    long currentLapStartTime = 0;
    boolean isFirstLap = true;
    int lapsUntilNextPit = 0;
    boolean isPitLap = false;
    long pitEntryOffset = 0;
    long pitExitOffset = 0;
    boolean pitEntrySent = false;
    boolean pitExitSent = false;

    LaneState() {
      setNextTarget();
    }

    void setNextTarget() {
      pitEntrySent = false;
      pitExitSent = false;
      if (isFirstLap) {
        // First lap is reaction time: (0, 0.5]s
        targetLapDuration = 1 + random.nextInt(500);
        isFirstLap = false;
        if (isFuelRace) {
          lapsUntilNextPit = 3 + random.nextInt(5); // 3 to 7 laps
        }
      } else {
        // Regular lap time: [3s, 5s]
        long lapDuration = 3000 + random.nextInt(2001);

        if (isFuelRace) {
          if (lapsUntilNextPit <= 0) {
            isPitLap = true;
            long pitDuration = 5000 + random.nextInt(5001); // 5 to 10 seconds
            targetLapDuration = lapDuration + pitDuration;
            pitEntryOffset = 500 + random.nextInt(501);
            pitExitOffset = pitEntryOffset + pitDuration;
            lapsUntilNextPit = 3 + random.nextInt(5);
            System.out.println("Demo: Lane scheduled for pit stop. Duration: " + pitDuration + "ms, Lap Total: "
                + targetLapDuration + "ms");
          } else {
            isPitLap = false;
            targetLapDuration = lapDuration;
            lapsUntilNextPit--;
          }
        } else {
          isPitLap = false;
          targetLapDuration = lapDuration;
        }
      }
    }
  }

  private LaneState[] laneStates;

  public Demo(int numLanes, boolean isFuelRace) {
    this(numLanes, new java.util.Random(), isFuelRace);
  }

  protected Demo(int numLanes, java.util.Random random, boolean isFuelRace) {
    super(numLanes);
    this.random = random;
    this.isFuelRace = isFuelRace;
    laneStates = new LaneState[numLanes];
    for (int i = 0; i < numLanes; i++) {
      laneStates[i] = new LaneState();
    }
  }

  @Override
  public boolean open() {
    System.out.println("DEBUG: Opening Demo Protocol for " + getNumLanes() + " lanes");
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
      try {
        if (listener != null) {
          listener.onInterfaceStatus(com.antigravity.proto.InterfaceStatus.CONNECTED);
        }
      } catch (Exception e) {
        System.err.println("Demo: Error reporting status: " + e.getMessage());
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

            if (state.isPitLap) {
              if (totalElapsed >= state.pitEntryOffset && !state.pitEntrySent) {
                state.pitEntrySent = true;
                if (listener != null) {
                  com.antigravity.protocols.CarData carData = new com.antigravity.protocols.CarData(
                      i, totalElapsed / 1000.0, 0.0, 0.0, true,
                      com.antigravity.protocols.CarLocation.PitRow,
                      com.antigravity.protocols.CarLocation.Main, 0);
                  listener.onCarData(carData);
                }
              }
              if (totalElapsed >= state.pitExitOffset && !state.pitExitSent) {
                state.pitExitSent = true;
                if (listener != null) {
                  com.antigravity.protocols.CarData carData = new com.antigravity.protocols.CarData(
                      i, totalElapsed / 1000.0, 0.5, 0.5, false,
                      com.antigravity.protocols.CarLocation.Main,
                      com.antigravity.protocols.CarLocation.PitRow, 0);
                  listener.onCarData(carData);
                }
              }
            }

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
