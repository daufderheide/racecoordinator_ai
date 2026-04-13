package com.antigravity.protocols.demo;

import com.antigravity.proto.DemoPinId;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.PartialTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class Demo extends DefaultProtocol {

  private ScheduledExecutorService scheduler;
  private ScheduledExecutorService statusScheduler;
  private ScheduledFuture<?> statusFuture;
  private ScheduledFuture<?> timerHandle;
  private final Random random;
  private final boolean isFuelRace;

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
    final long[] segmentOffsets = new long[4];
    final boolean[] segmentSent = new boolean[4];

    LaneState() {
      setNextTarget();
    }

    void setNextTarget() {
      pitEntrySent = false;
      pitExitSent = false;
      for (int i = 0; i < segmentSent.length; i++) {
        segmentSent[i] = false;
      }
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
            System.out.println(
                "Demo: Lane scheduled for pit stop. Duration: "
                    + pitDuration
                    + "ms, Lap Total: "
                    + targetLapDuration
                    + "ms");
          } else {
            isPitLap = false;
            targetLapDuration = lapDuration;
            lapsUntilNextPit--;
          }
        } else {
          isPitLap = false;
          targetLapDuration = lapDuration;
        }

        // Calculate 4 irregular segment offsets (15%, 40%, 60%, 85%)
        double[] percentages = {0.15, 0.40, 0.60, 0.85};
        for (int i = 0; i < segmentOffsets.length; i++) {
          segmentOffsets[i] = (long) (targetLapDuration * percentages[i]);
        }
      }
    }
  }

  private final LaneState[] laneStates;

  public Demo(int numLanes, boolean isFuelRace) {
    this(numLanes, new Random(), isFuelRace);
  }

  protected Demo(int numLanes, Random random, boolean isFuelRace) {
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
    statusFuture =
        statusScheduler.scheduleAtFixedRate(
            () -> {
              try {
                if (listener != null) {
                  listener.onInterfaceStatus(InterfaceStatus.CONNECTED, getInterfaceIndex());
                }
              } catch (Exception e) {
                System.err.println("Demo: Error reporting status: " + e.getMessage());
              }
            },
            0,
            1,
            TimeUnit.SECONDS);
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

    Runnable lapGenerator =
        new Runnable() {
          @Override
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
                      CarData carData =
                          new CarData(
                              i,
                              totalElapsed / 1000.0,
                              0.0,
                              0.0,
                              true,
                              CarLocation.PitRow,
                              CarLocation.Main,
                              0);
                      listener.onCarData(carData);
                    }
                  }
                  if (totalElapsed >= state.pitExitOffset && !state.pitExitSent) {
                    state.pitExitSent = true;
                    if (listener != null) {
                      CarData carData =
                          new CarData(
                              i,
                              totalElapsed / 1000.0,
                              0.5,
                              0.5,
                              false,
                              CarLocation.Main,
                              CarLocation.PitRow,
                              0);
                      listener.onCarData(carData);
                    }
                  }
                }

                // Handle segment hits
                if (!state.isFirstLap) {
                  for (int j = 0; j < state.segmentOffsets.length; j++) {
                    if (state.segmentOffsets[j] > 0
                        && totalElapsed >= state.segmentOffsets[j]
                        && !state.segmentSent[j]) {
                      state.segmentSent[j] = true;
                      if (listener != null) {
                        int segmentId = 101 + i;
                        long prevOffset = (j == 0) ? 0 : state.segmentOffsets[j - 1];
                        listener.onSegment(
                            i,
                            (state.segmentOffsets[j] - prevOffset) / 1000.0,
                            segmentId,
                            getInterfaceIndex());
                      }
                    }
                  }
                }

                if (totalElapsed >= state.targetLapDuration) {
                  double lapTime = totalElapsed / 1000.0;

                  if (listener != null) {
                    int laneInterfaceId = DemoPinId.DEMO_PIN_ID_LANE_BASE_VALUE.getNumber() + i;
                    listener.onLap(i, lapTime, laneInterfaceId, getInterfaceIndex());
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

    timerHandle = scheduler.scheduleAtFixedRate(lapGenerator, 0, 50, TimeUnit.MILLISECONDS);
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

  protected ScheduledExecutorService createScheduler() {
    return Executors.newScheduledThreadPool(1);
  }
}
