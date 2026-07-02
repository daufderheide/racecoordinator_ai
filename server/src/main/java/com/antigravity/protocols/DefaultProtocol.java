package com.antigravity.protocols;

import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.util.CircularBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class DefaultProtocol implements IProtocol {

  protected final Logger logger = LoggerFactory.getLogger(getClass());

  private final int numLanes;
  protected ProtocolListener listener;
  private int interfaceIndex = -1;

  // Connection data
  protected CircularBuffer rxBuffer;

  // Hardware state tracking
  protected HwTime[] hwLapTime;
  protected HwTime[] hwSegmentTime;
  protected byte hwReset = 1;

  // Input states
  protected boolean[] laneInPits;
  protected long[] lastRefuelTimeMs;
  protected long[] lastAnalogTimeMs;
  protected int[] lastPitOutState;
  protected int[] lastLapPinState;
  protected Map<Integer, Integer> lastCallButtonState = new HashMap<>();
  protected Map<Integer, Boolean> pinStateCache = new HashMap<>();

  // Relay states
  protected Boolean lastMainPower = null;
  protected Map<Integer, Boolean> lastLanePower = new HashMap<>();

  // Scheduling
  protected ScheduledExecutorService statusScheduler;
  protected ScheduledFuture<?> statusFuture;
  protected ScheduledFuture<?> refuelFuture;
  protected volatile long lastHeartbeatTimeMs = 0;

  public DefaultProtocol(int numLanes) {
    this.numLanes = numLanes;
    this.rxBuffer = new CircularBuffer(4096);

    this.hwLapTime = new HwTime[numLanes];
    this.hwSegmentTime = new HwTime[numLanes];
    for (int i = 0; i < numLanes; i++) {
      this.hwLapTime[i] = new HwTime();
      this.hwSegmentTime[i] = new HwTime();
    }

    this.laneInPits = new boolean[numLanes];
    this.lastRefuelTimeMs = new long[numLanes];
    this.lastAnalogTimeMs = new long[numLanes];
    this.lastPitOutState = new int[numLanes];
    this.lastLapPinState = new int[numLanes];
    for (int i = 0; i < numLanes; i++) {
      this.lastRefuelTimeMs[i] = 0;
      this.lastAnalogTimeMs[i] = 0;
      this.lastPitOutState[i] = -1;
      this.lastLapPinState[i] = -1;
    }
  }

  // Configuration Hooks
  protected abstract boolean isNormallyClosedLaneSensors();

  protected abstract boolean isNormallyClosedRelays();

  protected abstract ArduinoConfig.LapPinPitBehavior getLapPinPitBehavior();

  protected abstract boolean useLapsForSegments();

  protected abstract double getHardwareDebounceUs();

  protected abstract boolean hasPitInConfigured(int laneIndex);

  protected long now() {
    return System.currentTimeMillis();
  }

  protected ScheduledExecutorService createScheduler() {
    return Executors.newSingleThreadScheduledExecutor();
  }

  protected void startStatusScheduler() {
    if (statusFuture != null && !statusFuture.isCancelled()) {
      return;
    }
    if (statusScheduler == null) {
      statusScheduler = createScheduler();
    }
    statusFuture =
        statusScheduler.scheduleAtFixedRate(
            () -> {
              try {
                if (listener != null) {
                  InterfaceStatus status;
                  if (!isConnected()) {
                    status = InterfaceStatus.DISCONNECTED;
                  } else if (!requiresHeartbeat()) {
                    status = InterfaceStatus.CONNECTED;
                  } else if (lastHeartbeatTimeMs == 0) {
                    status = InterfaceStatus.NO_DATA;
                  } else {
                    long age = now() - lastHeartbeatTimeMs;
                    logger.debug(
                        "Timeout age: {}ms (now: {}, lastHeartbeat: {})",
                        age,
                        now(),
                        lastHeartbeatTimeMs);
                    if (age < 2000) {
                      status = InterfaceStatus.CONNECTED;
                    } else {
                      status = InterfaceStatus.DISCONNECTED;
                      logger.warn(
                          "status dropping to DISCONNECTED due to heartbeat age: {}ms", age);
                    }
                  }
                  listener.onInterfaceStatus(status, getInterfaceIndex());
                }
              } catch (Exception e) {
                logger.error("Error in status scheduler", e);
              }
            },
            0,
            1,
            TimeUnit.SECONDS);

    refuelFuture =
        statusScheduler.scheduleAtFixedRate(
            () -> {
              try {
                if (listener != null) {
                  long currentTime = now();
                  for (int laneIndex = 0; laneIndex < numLanes; laneIndex++) {
                    if (laneInPits[laneIndex]) {
                      double deltaTimeSeconds = 0.0;
                      if (lastRefuelTimeMs[laneIndex] > 0) {
                        deltaTimeSeconds = (currentTime - lastRefuelTimeMs[laneIndex]) / 1000.0;
                      }
                      lastRefuelTimeMs[laneIndex] = currentTime;

                      listener.onCarData(
                          new CarData(
                              laneIndex,
                              deltaTimeSeconds,
                              0,
                              0,
                              true,
                              CarLocation.PitRow,
                              CarLocation.PitRow,
                              -1));
                    }
                  }
                }
              } catch (Exception e) {
                logger.error("Error in refuel scheduler", e);
              }
            },
            0,
            100,
            TimeUnit.MILLISECONDS);
  }

  protected void stopStatusScheduler() {
    if (statusFuture != null) {
      statusFuture.cancel(true);
      statusFuture = null;
    }
    if (refuelFuture != null) {
      refuelFuture.cancel(true);
      refuelFuture = null;
    }
    if (statusScheduler != null) {
      statusScheduler.shutdownNow();
      statusScheduler = null;
    }
  }

  // Event Handlers
  protected void handleHeartbeat(long timeInUse, byte isReset) {
    logger.debug("Received Heartbeat - Time: {}us, Reset: {}", timeInUse, isReset);
    boolean arduinoReset = isReset != 0;
    boolean pcExpectedReset = hwReset != 0;

    if (arduinoReset == pcExpectedReset) {
      hwReset = 0;
      for (int i = 0; i < numLanes; i++) {
        hwLapTime[i].add(timeInUse);
        hwSegmentTime[i].add(timeInUse);
      }
    } else {
      if (!arduinoReset && pcExpectedReset) {
        // Mismatch: Arduino hasn't reset yet, but PC expects reset (e.g. late in-flight message).
        // Discard the pre-reset time but keep hwReset = 1, waiting for the reset heartbeat.
        logger.info(
            "Received Heartbeat - Reset expected but not set yet. Discarding in-flight time.");
      } else {
        // Mismatch: Arduino reset unexpectedly (arduinoReset is true, pcExpectedReset is false).
        // Treat as a reset event: clear pin cache and initialize hardware state, and set hwReset =
        // 0.
        logger.warn(
            "Received Heartbeat - Reset mismatch: got {}, expected {}. Clearing pin cache.",
            isReset,
            hwReset);
        pinStateCache.clear();
        hwReset = 0;
        initializeHardwareState();
        for (int i = 0; i < numLanes; i++) {
          hwLapTime[i].add(timeInUse);
          hwSegmentTime[i].add(timeInUse);
        }
      }
    }
  }

  protected void handleLapCounter(int laneIndex, int state, int interfaceId) {
    logger.debug("Received Lap Counter - Lane: {}, State: {}", laneIndex, state);
    if (laneIndex >= hwLapTime.length) {
      logger.warn("Bad lane for lap data: {}", (laneIndex + 1));
      return;
    }

    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;

    if (state == wantState) {
      double time = hwLapTime[laneIndex].time();
      time -= (getHardwareDebounceUs() / (1000.0 * 1000.0));

      logger.info("Handling Lap - Lane: {}, Time: {}", laneIndex, time);
      if (listener != null) {
        if (useLapsForSegments()) {
          handleSegmentCounter(laneIndex, state, interfaceId);
        }

        listener.onLap(laneIndex, time, interfaceId, getInterfaceIndex());

        ArduinoConfig.LapPinPitBehavior behavior = getLapPinPitBehavior();
        if (behavior == ArduinoConfig.LapPinPitBehavior.PIT_IN
            || behavior == ArduinoConfig.LapPinPitBehavior.PIT_IN_OUT) {
          if (state == wantState) {
            updatePitState(laneIndex, true);
          }
        } else if (behavior == ArduinoConfig.LapPinPitBehavior.PIT_OUT) {
          if (hasPitInConfigured(laneIndex)) {
            if (state != wantState && lastLapPinState[laneIndex] == wantState) {
              updatePitState(laneIndex, false);
            }
          } else {
            if (state == wantState) {
              updatePitState(laneIndex, false);
            }
          }
        }
      }
    } else {
      ArduinoConfig.LapPinPitBehavior behavior = getLapPinPitBehavior();
      if (behavior == ArduinoConfig.LapPinPitBehavior.PIT_IN_OUT) {
        updatePitState(laneIndex, false);
      } else if (behavior == ArduinoConfig.LapPinPitBehavior.PIT_OUT) {
        if (hasPitInConfigured(laneIndex) && lastLapPinState[laneIndex] == wantState) {
          updatePitState(laneIndex, false);
        }
      }
    }
    lastLapPinState[laneIndex] = state;
  }

  protected void handleSegmentCounter(int laneIndex, int state, int interfaceId) {
    logger.info("Received Segment Counter - Lane: {}, State: {}", laneIndex, state);

    if (laneIndex >= hwSegmentTime.length) {
      logger.warn("Bad lane for segment data: {}", (laneIndex + 1));
      return;
    }

    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;

    if (state == wantState) {
      double time = hwSegmentTime[laneIndex].time();
      time -= (getHardwareDebounceUs() / (1000.0 * 1000.0));

      logger.info("Handling Segment - Lane: {}, Time: {}", laneIndex, time);
      if (listener != null) {
        listener.onSegment(laneIndex, time, interfaceId, getInterfaceIndex());
      }
    }
  }

  protected void handleCallButton(int laneIndex, int state, int interfaceId) {
    logger.info(
        "Received Call Button - Lane: {}, State: {}, InterfaceId: {}",
        laneIndex,
        state,
        interfaceId);

    Integer prevState = lastCallButtonState.get(interfaceId);
    if (state == 0 && prevState != null && prevState == 1) {
      if (listener != null) {
        listener.onCallbutton(laneIndex, getInterfaceIndex());
      }
    }
    lastCallButtonState.put(interfaceId, state);
  }

  protected void handlePitIn(int laneIndex, int state) {
    if (laneIndex < 0 || laneIndex >= numLanes) return;
    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;
    if (state == wantState) {
      updatePitState(laneIndex, true);
    }
  }

  protected void handlePitOut(int laneIndex, int state) {
    if (laneIndex < 0 || laneIndex >= numLanes) return;
    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;

    if (hasPitInConfigured(laneIndex)) {
      if (lastPitOutState[laneIndex] == wantState && state != wantState) {
        updatePitState(laneIndex, false);
      }
    } else {
      updatePitState(laneIndex, state == wantState);
    }
    lastPitOutState[laneIndex] = state;
  }

  protected void handlePitInOut(int laneIndex, int state) {
    if (laneIndex < 0 || laneIndex >= numLanes) return;
    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;
    updatePitState(laneIndex, state == wantState);
  }

  protected void updatePitState(int laneIndex, boolean inPits) {
    if (laneInPits[laneIndex] != inPits) {
      logger.info(
          "updatePitState: Lane {} transition to {}", laneIndex, inPits ? "IN_PITS" : "OUT_PITS");
      laneInPits[laneIndex] = inPits;

      if (inPits) {
        lastRefuelTimeMs[laneIndex] = now();
        if (listener != null) {
          listener.onCarData(
              new CarData(laneIndex, 0.0, 0, 0, true, CarLocation.PitRow, CarLocation.Main, -1));
        }
      } else {
        lastRefuelTimeMs[laneIndex] = 0;
        if (listener != null) {
          listener.onCarData(
              new CarData(laneIndex, 0.0, 0, 0, false, CarLocation.Main, CarLocation.PitRow, -1));
        }
      }
    }
  }

  // Base IProtocol methods
  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {}

  @Override
  public void close() {
    stopStatusScheduler();
  }

  @Override
  public void clearLeds() {}

  @Override
  public boolean hasPerLaneRelays() {
    return false;
  }

  @Override
  public boolean hasDigitalFuel() {
    return false;
  }

  @Override
  public boolean hasMainRelay() {
    return false;
  }

  @Override
  public void setListener(ProtocolListener listener) {
    this.listener = listener;
  }

  protected boolean requiresHeartbeat() {
    return true;
  }

  @Override
  public void startTimer() {
    for (int i = 0; i < numLanes; i++) {
      hwLapTime[i].reset();
      hwSegmentTime[i].reset();
    }
    hwReset = 1;
  }

  @Override
  public List<PartialTime> stopTimer() {
    List<PartialTime> partialTimes = new ArrayList<>();
    for (int i = 0; i < numLanes; i++) {
      partialTimes.add(new PartialTime(i, hwLapTime[i].time(), hwSegmentTime[i].time()));
    }
    return partialTimes;
  }

  @Override
  public void setMainPower(boolean on) {
    lastMainPower = on;
  }

  @Override
  public void setLanePower(boolean on, int lane) {
    lastLanePower.put(lane, on);
  }

  @Override
  public int getNumLanes() {
    return numLanes;
  }

  @Override
  public void setHeatStandings(List<Integer> laneIndices) {}

  @Override
  public void setRefueling(int laneIndex, boolean isRefueling) {}

  public static int calculateFuelPercentage(double fuelLevel, double capacity) {
    if (capacity == 0) {
      return 100;
    } else if (fuelLevel <= 0) {
      return 0;
    } else {
      int pct = (int) (fuelLevel / capacity * 100.0 + 0.5);
      return Math.max(0, Math.min(100, pct));
    }
  }

  @Override
  public void setFuelLevel(int laneIndex, double fuelLevel, double capacity) {}

  @Override
  public void setHeatProgress(double percentage) {}

  @Override
  public void setInterfaceIndex(int index) {
    this.interfaceIndex = index;
  }

  @Override
  public int getInterfaceIndex() {
    return interfaceIndex;
  }

  @Override
  public boolean isHealthy() {
    if (lastHeartbeatTimeMs == 0) {
      return false; // No heartbeat yet
    }
    // Healthy if we received a heartbeat in the last 2 seconds
    return (now() - lastHeartbeatTimeMs) < 2000;
  }

  public long getLastHeartbeatTimeMs() {
    return lastHeartbeatTimeMs;
  }

  protected abstract boolean isConnected();

  @Override
  public void initializeHardwareState() {}
}
