package com.antigravity.protocols.demo;

import com.antigravity.proto.DemoConfig;
import com.antigravity.proto.DemoPinId;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.PartialTime;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Demo extends DefaultProtocol {
  private static final Logger logger = LoggerFactory.getLogger(Demo.class);

  private ScheduledExecutorService scheduler;
  private ScheduledExecutorService statusScheduler;
  private ScheduledFuture<?> statusFuture;
  private ScheduledFuture<?> timerHandle;
  private final Random random;
  private final boolean isFuelRace;
  private final DemoConfig config;
  final boolean startBehindSensor;

  class LaneState {

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
    final long[] segmentOffsets;
    final boolean[] segmentSent;

    LaneState() {
      segmentOffsets = new long[config.getNumSegments()];
      segmentSent = new boolean[config.getNumSegments()];
      setNextTarget();
    }

    void setNextTarget() {
      pitEntrySent = false;
      pitExitSent = false;
      for (int i = 0; i < segmentSent.length; i++) {
        segmentSent[i] = false;
      }
      if (isFirstLap && startBehindSensor) {
        // First lap is reaction time
        long minReaction = (long) config.getMinReactionTimeMs();
        long maxReaction = (long) config.getMaxReactionTimeMs();
        targetLapDuration =
            minReaction + random.nextInt((int) Math.max(1, maxReaction - minReaction + 1));
        isFirstLap = false;
        if (isFuelRace) {
          int minLaps = config.getMinLapsBetweenPits();
          int maxLaps = config.getMaxLapsBetweenPits();
          lapsUntilNextPit = minLaps + random.nextInt(Math.max(1, maxLaps - minLaps + 1));
        }
        return;
      }

      if (isFirstLap) {
        isFirstLap = false;
      }

      // Regular lap time
      long minLap = (long) config.getMinLapTimeMs();
      long maxLap = (long) config.getMaxLapTimeMs();
      long lapDuration = minLap + random.nextInt((int) Math.max(1, maxLap - minLap + 1));

      if (isFuelRace) {
        if (lapsUntilNextPit <= 0) {
          isPitLap = true;
          long minRefuel = (long) config.getMinRefuelTimeMs();
          long maxRefuel = (long) config.getMaxRefuelTimeMs();
          long pitDuration =
              minRefuel + random.nextInt((int) Math.max(1, maxRefuel - minRefuel + 1));
          targetLapDuration = lapDuration + pitDuration;

          long minPitOffset = (long) config.getMinPitEntryOffsetMs();
          long maxPitOffset = (long) config.getMaxPitEntryOffsetMs();
          pitEntryOffset =
              minPitOffset + random.nextInt((int) Math.max(1, maxPitOffset - minPitOffset + 1));
          pitExitOffset = pitEntryOffset + pitDuration;

          int minLaps = config.getMinLapsBetweenPits();
          int maxLaps = config.getMaxLapsBetweenPits();
          lapsUntilNextPit = minLaps + random.nextInt(Math.max(1, maxLaps - minLaps + 1));
          logger.info(
              "Demo: Lane scheduled for pit stop. Duration: {}ms, Lap Total: {}ms",
              pitDuration,
              targetLapDuration);
        } else {
          isPitLap = false;
          targetLapDuration = lapDuration;
          lapsUntilNextPit--;
        }
      } else {
        isPitLap = false;
        targetLapDuration = lapDuration;
      }
      // Calculate segment offsets
      int numSegments = config.getNumSegments();
      if (numSegments == 1) {
        segmentOffsets[0] = (long) (targetLapDuration * 1.0 / 2.0);
      } else if (numSegments >= 2 && numSegments <= 4) {
        double[] percentages;
        if (numSegments == 2) {
          percentages = new double[] {0.35, 1.0};
        } else if (numSegments == 3) {
          percentages = new double[] {0.25, 0.60, 1.0};
        } else {
          percentages = new double[] {0.15, 0.40, 0.60, 1.0};
        }
        for (int i = 0; i < segmentOffsets.length; i++) {
          segmentOffsets[i] = (long) (targetLapDuration * percentages[i]);
        }
      } else if (numSegments > 4) {
        // Linear distribution for other counts
        for (int i = 0; i < numSegments; i++) {
          segmentOffsets[i] = (long) (targetLapDuration * (i + 1.0) / numSegments);
        }
      }
    }

    void reset() {
      currentLapElapsedTime = 0;
      currentLapStartTime = 0;
      isFirstLap = true;
      isPitLap = false;
      pitEntrySent = false;
      pitExitSent = false;
      for (int i = 0; i < segmentSent.length; i++) {
        segmentSent[i] = false;
      }
      setNextTarget();
    }
  }

  final LaneState[] laneStates;

  public Demo(int numLanes, boolean isFuelRace) {
    this(numLanes, new Random(), isFuelRace, null, true);
  }

  public Demo(int numLanes, boolean isFuelRace, DemoConfig config) {
    this(numLanes, new Random(), isFuelRace, config, true);
  }

  public Demo(int numLanes, boolean isFuelRace, DemoConfig config, boolean startBehindSensor) {
    this(numLanes, new Random(), isFuelRace, config, startBehindSensor);
  }

  protected Demo(
      int numLanes,
      Random random,
      boolean isFuelRace,
      DemoConfig config,
      boolean startBehindSensor) {
    super(numLanes);
    this.random = random;
    this.isFuelRace = isFuelRace;
    this.config = config != null ? config : createDefaultConfig();
    this.startBehindSensor = startBehindSensor;
    laneStates = new LaneState[numLanes];
    for (int i = 0; i < numLanes; i++) {
      laneStates[i] = new LaneState();
    }
  }

  public static DemoConfig createDefaultConfig() {
    return DemoConfig.newBuilder()
        .setMinLapTimeMs(3000)
        .setMaxLapTimeMs(5000)
        .setMinRefuelTimeMs(5000)
        .setMaxRefuelTimeMs(10000)
        .setNumSegments(2)
        .setMinLapsBetweenPits(3)
        .setMaxLapsBetweenPits(7)
        .setMinReactionTimeMs(1)
        .setMaxReactionTimeMs(500)
        .setMinPitEntryOffsetMs(500)
        .setMaxPitEntryOffsetMs(1000)
        .build();
  }

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    if (state == RaceState.NOT_STARTED) {
      for (LaneState laneState : laneStates) {
        laneState.reset();
      }
    }
  }

  @Override
  public boolean open() {
    logger.debug("Opening Demo Protocol for {} lanes", getNumLanes());
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

  @Override
  protected void startStatusScheduler() {
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
                logger.error("Demo: Error reporting status", e);
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

    long nowMs = now();
    for (LaneState state : laneStates) {
      if (state.currentLapElapsedTime > 0) {
        state.targetLapDuration =
            Math.max(1, state.targetLapDuration - state.currentLapElapsedTime);
        if (state.isPitLap) {
          state.pitEntryOffset = Math.max(0, state.pitEntryOffset - state.currentLapElapsedTime);
          state.pitExitOffset = Math.max(0, state.pitExitOffset - state.currentLapElapsedTime);
        }
        for (int j = 0; j < state.segmentOffsets.length; j++) {
          if (state.segmentOffsets[j] > 0) {
            state.segmentOffsets[j] =
                Math.max(0, state.segmentOffsets[j] - state.currentLapElapsedTime);
          }
        }
      }
      state.currentLapStartTime = nowMs;
      state.currentLapElapsedTime = 0;
    }

    timerHandle = scheduler.scheduleAtFixedRate(createLapGenerator(), 0, 50, TimeUnit.MILLISECONDS);
  }

  private Runnable createLapGenerator() {
    return new Runnable() {
      @Override
      public void run() {
        try {
          long nowMs = now();
          for (int i = 0; i < laneStates.length; i++) {
            generateLapsForLane(i, nowMs);
          }
        } catch (Exception e) {
          logger.error("Error in demo lap generator", e);
        }
      }
    };
  }

  private void generateLapsForLane(int i, long nowMs) {
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
      int segmentsToCheck =
          config.getNumSegments() > 1
              ? state.segmentOffsets.length - 1
              : state.segmentOffsets.length;
      for (int j = 0; j < segmentsToCheck; j++) {
        if (state.segmentOffsets[j] > 0
            && totalElapsed >= state.segmentOffsets[j]
            && !state.segmentSent[j]) {
          state.segmentSent[j] = true;
          if (listener != null) {
            int segmentId = 101 + i;
            long prevOffset = (j == 0) ? 0 : state.segmentOffsets[j - 1];
            listener.onSegment(
                i, (state.segmentOffsets[j] - prevOffset) / 1000.0, segmentId, getInterfaceIndex());
          }
        }
      }
    }

    if (totalElapsed >= state.targetLapDuration) {
      double lapTime = totalElapsed / 1000.0;

      if (listener != null) {
        int numSegments = config.getNumSegments();
        if (numSegments > 1) {
          int lastSegIdx = numSegments - 1;
          if (state.segmentOffsets[lastSegIdx] > 0 && !state.segmentSent[lastSegIdx]) {
            state.segmentSent[lastSegIdx] = true;
            int segmentId = 101 + i;
            long prevOffset = state.segmentOffsets[lastSegIdx - 1];
            listener.onSegment(i, lapTime - (prevOffset / 1000.0), segmentId, getInterfaceIndex());
          }
        }

        int laneInterfaceId = DemoPinId.DEMO_PIN_ID_LANE_BASE_VALUE.getNumber() + i;
        listener.onLap(i, lapTime, laneInterfaceId, getInterfaceIndex());
      }

      // Reset for next lap
      state.currentLapElapsedTime = 0;
      state.currentLapStartTime = nowMs;
      state.setNextTarget();
    }
  }

  @Override
  public List<PartialTime> stopTimer() {
    if (timerHandle != null) {
      timerHandle.cancel(false);
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

  @Override
  public boolean isHealthy() {
    return true;
  }

  protected ScheduledExecutorService createScheduler() {
    return Executors.newScheduledThreadPool(1);
  }

  @Override
  protected boolean isNormallyClosedLaneSensors() {
    return true;
  }

  @Override
  protected boolean isNormallyClosedRelays() {
    return true;
  }

  @Override
  protected LapPinPitBehavior getLapPinPitBehavior() {
    return LapPinPitBehavior.NONE;
  }

  @Override
  protected boolean useLapsForSegments() {
    return false;
  }

  @Override
  protected double getHardwareDebounceUs() {
    return 0;
  }

  @Override
  protected boolean hasPitInConfigured(int laneIndex) {
    return false;
  }

  @Override
  protected boolean isConnected() {
    return true;
  }
}
