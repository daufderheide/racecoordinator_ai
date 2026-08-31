package com.antigravity.protocols;

import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.InterfaceStatusEvent;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.util.CircularBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
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

  public static final long ANALOG_LED_BLINK_INTERVAL_MS = 500;

  // Analog LED state
  protected boolean isGreenFlagOn = false;
  protected boolean isYellowFlagOn = false;
  protected boolean[] isCountdownOn = new boolean[5];
  protected int startingDuration = 0;
  protected double maxCountdownSeen = 0.0;
  protected RaceState currentRaceState = RaceState.UNKNOWN_STATE;
  protected RaceFlag currentRaceFlag = RaceFlag.UNKNOWN_FLAG;
  protected double currentCountdown = 0.0;
  protected boolean analogLedAlternatingToggle = false;
  protected ScheduledFuture<?> analogLedFuture;

  // Connection data
  protected CircularBuffer rxBuffer;

  // Hardware state tracking
  protected HwTime[] hwLapTime;
  protected HwTime[] hwSegmentTime;
  protected final long[] lastLapTimeNanos;
  protected final long[] lastSegmentTimeNanos;
  protected byte hwReset = 1;

  // Input states
  protected PitManager pitManager;
  protected long[] lastAnalogTimeMs;
  protected Map<Integer, Integer> lastCallButtonState = new HashMap<>();
  protected Map<Integer, Boolean> pinStateCache = new HashMap<>();

  // Relay states
  protected Boolean lastMainPower = null;
  protected Map<Integer, Boolean> lastLanePower = new HashMap<>();

  // Heat leader state
  protected Integer lastLeaderLane = null;

  // Scheduling
  protected ScheduledExecutorService statusScheduler;
  protected ScheduledFuture<?> statusFuture;
  protected volatile long lastHeartbeatTimeMs = 0;
  protected volatile long openTimeMs = 0;
  protected volatile long lastReconnectAttemptTimeMs = 0;
  private static final long RECONNECT_INTERVAL_MS = 5000;

  public DefaultProtocol(int numLanes) {
    this.numLanes = numLanes;
    this.rxBuffer = new CircularBuffer(4096);

    this.hwLapTime = new HwTime[numLanes];
    this.hwSegmentTime = new HwTime[numLanes];
    this.lastLapTimeNanos = new long[numLanes];
    this.lastSegmentTimeNanos = new long[numLanes];
    for (int i = 0; i < numLanes; i++) {
      this.hwLapTime[i] = new HwTime();
      this.hwSegmentTime[i] = new HwTime();
    }

    this.pitManager =
        new PitManager(
            numLanes,
            this::hasPitInConfigured,
            () -> this.listener,
            this::now,
            () -> this.statusScheduler);
    this.lastAnalogTimeMs = new long[numLanes];
    for (int i = 0; i < numLanes; i++) {
      this.lastAnalogTimeMs[i] = 0;
    }
  }

  // Configuration Hooks
  protected abstract boolean isNormallyClosedLaneSensors();

  protected abstract boolean isNormallyClosedRelays();

  protected abstract ArduinoConfig.LapPinPitBehavior getLapPinPitBehavior();

  protected abstract boolean useLapsForSegments();

  protected abstract double getHardwareDebounceUs();

  @Override
  public abstract boolean hasPitInConfigured(int laneIndex);

  protected long now() {
    return System.currentTimeMillis();
  }

  protected ScheduledExecutorService createScheduler() {
    return Executors.newSingleThreadScheduledExecutor(
        r -> {
          Thread t = new Thread(r, "DefaultProtocol-Scheduler-" + getInterfaceIndex());
          t.setDaemon(true);
          return t;
        });
  }

  protected synchronized void startStatusScheduler() {
    stopStatusScheduler();

    openTimeMs = now();
    statusScheduler = createScheduler();
    try {
      statusFuture =
          statusScheduler.scheduleAtFixedRate(this::checkAndPublishStatus, 0, 1, TimeUnit.SECONDS);

      analogLedFuture =
          statusScheduler.scheduleAtFixedRate(
              () -> {
                try {
                  if (listener != null) {
                    analogLedAlternatingToggle = !analogLedAlternatingToggle;
                    if (currentRaceFlag == RaceFlag.WHITE
                        || currentRaceFlag == RaceFlag.CHECKERED
                        || currentRaceFlag == RaceFlag.GREEN_YELLOW) {
                      evaluateAnalogLeds();
                      onAnalogLedsChanged();
                    }
                  }
                } catch (Exception e) {
                  logger.error("Error in analog led scheduler", e);
                }
              },
              0,
              ANALOG_LED_BLINK_INTERVAL_MS,
              TimeUnit.MILLISECONDS);

      pitManager.start();
    } catch (RejectedExecutionException e) {
      logger.warn("Status scheduler task rejected during startup: {}", e.getMessage());
    }
  }

  protected synchronized void stopStatusScheduler() {
    if (statusFuture != null) {
      statusFuture.cancel(true);
      statusFuture = null;
    }
    if (analogLedFuture != null) {
      analogLedFuture.cancel(true);
      analogLedFuture = null;
    }
    if (pitManager != null) {
      pitManager.stop();
    }
    if (statusScheduler != null) {
      statusScheduler.shutdownNow();
      statusScheduler = null;
    }
  }

  protected void checkAndPublishStatus() {
    try {
      if (listener != null) {
        InterfaceStatus status;
        if (!isConnected()) {
          status = InterfaceStatus.DISCONNECTED;
          tryAutoReconnect();
        } else if (!requiresHeartbeat()) {
          status = InterfaceStatus.CONNECTED;
        } else if (lastHeartbeatTimeMs == 0) {
          status = InterfaceStatus.NO_DATA;
        } else {
          long age = now() - lastHeartbeatTimeMs;
          logger.trace(
              "Timeout age: {}ms (now: {}, lastHeartbeat: {})", age, now(), lastHeartbeatTimeMs);
          if (age < 2000) {
            status = InterfaceStatus.CONNECTED;
          } else {
            status = InterfaceStatus.DISCONNECTED;
            logger.warn("status dropping to DISCONNECTED due to heartbeat age: {}ms", age);
            tryAutoReconnect();
          }
        }
        String ver = getVersion();
        InterfaceStatusEvent statusEvent =
            InterfaceStatusEvent.newBuilder()
                .setStatus(status)
                .setInterfaceIndex(getInterfaceIndex())
                .setDetectedChannels(getDetectedChannels())
                .setSupportsRgbLeds(supportsRgbLeds())
                .setVersion(ver != null ? ver : "")
                .build();
        listener.onInterfaceEvent(InterfaceEvent.newBuilder().setStatus(statusEvent).build());
        listener.onInterfaceStatus(status, getInterfaceIndex());
      }
    } catch (Exception e) {
      logger.error("Error in status scheduler", e);
    }
  }

  protected boolean canReconnect() {
    return true;
  }

  protected void tryAutoReconnect() {
    if (!canReconnect()) {
      return;
    }
    long currentTime = now();
    if (isConnected()) {
      if (!requiresHeartbeat()
          || lastHeartbeatTimeMs == 0
          || (currentTime - lastHeartbeatTimeMs <= 2000)) {
        return;
      }
    }

    if (currentTime - lastReconnectAttemptTimeMs >= RECONNECT_INTERVAL_MS) {
      lastReconnectAttemptTimeMs = currentTime;
      try {
        if (isConnected()) {
          logger.warn(
              "Interface index {} heartbeat stale (>2000ms). Closing stale connection before reconnect.",
              getInterfaceIndex());
          close();
        }
        logger.info(
            "Attempting automatic reconnection for interface index {}...", getInterfaceIndex());
        open();
      } catch (Exception e) {
        logger.debug(
            "Auto-reconnect attempt failed for interface index {}: {}",
            getInterfaceIndex(),
            e.getMessage());
      }
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
        // Mismatch: Arduino hasn't reset yet, but PC expects reset (e.g. late in-flight
        // message).
        // Discard the pre-reset time but keep hwReset = 1, waiting for the reset
        // heartbeat.
        logger.info(
            "Received Heartbeat - Reset expected but not set yet. Discarding in-flight time.");
      } else {
        // Mismatch: Arduino reset unexpectedly (arduinoReset is true, pcExpectedReset
        // is false).
        // Treat as a reset event: clear pin cache and initialize hardware state, and
        // set hwReset =
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
        if (behavior != null && behavior != ArduinoConfig.LapPinPitBehavior.NONE) {
          pitManager.handleLapPinPit(laneIndex, behavior, state == wantState);
        }
      }
    } else {
      ArduinoConfig.LapPinPitBehavior behavior = getLapPinPitBehavior();
      if (behavior != null && behavior != ArduinoConfig.LapPinPitBehavior.NONE) {
        pitManager.handleLapPinPit(laneIndex, behavior, state == wantState);
      }
    }
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
      logger.info(
          "Call button transition (1 -> 0) detected. Triggering listener for lane: {}", laneIndex);
      if (listener != null) {
        listener.onCallbutton(laneIndex, getInterfaceIndex());
      } else {
        logger.warn("Call button transition detected, but listener is null!");
      }
    } else {
      logger.debug(
          "Call button state updated (state={}, prevState={}) without triggering listener",
          state,
          prevState);
    }
    lastCallButtonState.put(interfaceId, state);
  }

  protected void handlePitIn(int laneIndex, int state) {
    if (laneIndex < 0 || laneIndex >= numLanes) return;
    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;
    pitManager.handlePitIn(laneIndex, state == wantState);
  }

  protected void handlePitOut(int laneIndex, int state) {
    if (laneIndex < 0 || laneIndex >= numLanes) return;
    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;
    pitManager.handlePitOut(laneIndex, state == wantState);
  }

  protected void handlePitOutPulse(int laneIndex) {
    pitManager.handlePitOutPulse(laneIndex);
  }

  protected void handlePitInOut(int laneIndex, int state) {
    if (laneIndex < 0 || laneIndex >= numLanes) return;
    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;
    pitManager.handlePitInOut(laneIndex, state == wantState);
  }

  protected void updatePitState(int laneIndex, boolean inPits) {
    pitManager.updatePitState(laneIndex, inPits);
  }

  // Base IProtocol methods
  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    if (state == RaceState.STARTING) {
      if (currentRaceState != RaceState.STARTING) {
        maxCountdownSeen = countdown;
        startingDuration = 0;
      } else {
        maxCountdownSeen = Math.max(maxCountdownSeen, countdown);
      }
      startingDuration = Math.max(startingDuration, (int) Math.ceil(maxCountdownSeen));
    } else {
      maxCountdownSeen = 0.0;
      if (state == RaceState.UNKNOWN_STATE
          || state == RaceState.RACE_OVER
          || state == RaceState.HEAT_OVER) {
        startingDuration = 0;
      }
    }

    currentRaceState = state;
    currentRaceFlag = flag;
    currentCountdown = countdown;

    evaluateAnalogLeds();
    onAnalogLedsChanged();
  }

  protected void evaluateAnalogLeds() {
    if (currentRaceState == RaceState.STARTING) {
      isGreenFlagOn = false;
      isYellowFlagOn = true;
      for (int i = 0; i < 5; i++) {
        int onCount = Math.max(1, startingDuration - (int) Math.ceil(currentCountdown) + 1);
        boolean shouldBeOn = i >= startingDuration - onCount && i < startingDuration;
        isCountdownOn[i] = shouldBeOn;
      }
    } else if (currentRaceFlag == RaceFlag.RED) {
      isGreenFlagOn = false;
      isYellowFlagOn = false;
      for (int i = 0; i < 5; i++) isCountdownOn[i] = true;
    } else if (currentRaceFlag == RaceFlag.WHITE
        || currentRaceFlag == RaceFlag.CHECKERED
        || currentRaceFlag == RaceFlag.GREEN_YELLOW) {
      isGreenFlagOn = analogLedAlternatingToggle;
      isYellowFlagOn = !analogLedAlternatingToggle;
      for (int i = 0; i < 5; i++) isCountdownOn[i] = false;
    } else if (currentRaceState == RaceState.RACING && currentRaceFlag == RaceFlag.GREEN) {
      isGreenFlagOn = true;
      isYellowFlagOn = false;
      for (int i = 0; i < 5; i++) isCountdownOn[i] = false;
    } else {
      isGreenFlagOn = false;
      isYellowFlagOn = true;
      for (int i = 0; i < 5; i++) isCountdownOn[i] = false;
    }
  }

  protected void onAnalogLedsChanged() {}

  @Override
  public void close() {
    stopStatusScheduler();
  }

  @Override
  public void clearLeds() {
    isGreenFlagOn = false;
    isYellowFlagOn = false;
    for (int i = 0; i < 5; i++) {
      isCountdownOn[i] = false;
    }
    lastLeaderLane = null;
    onAnalogLedsChanged();
  }

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

  protected int detectedChannels = 0;

  public int getDetectedChannels() {
    return detectedChannels;
  }

  protected boolean requiresHeartbeat() {
    return true;
  }

  protected void addHardwareTimeDeltaNanos(int laneIndex, long nowNanos) {
    if (laneIndex >= hwLapTime.length) {
      return;
    }
    if (lastLapTimeNanos[laneIndex] > 0) {
      long deltaUs = (nowNanos - lastLapTimeNanos[laneIndex]) / 1000;
      hwLapTime[laneIndex].add(deltaUs);
    }
    lastLapTimeNanos[laneIndex] = nowNanos;

    if (lastSegmentTimeNanos[laneIndex] > 0) {
      long deltaUs = (nowNanos - lastSegmentTimeNanos[laneIndex]) / 1000;
      hwSegmentTime[laneIndex].add(deltaUs);
    }
    lastSegmentTimeNanos[laneIndex] = nowNanos;
  }

  @Override
  public synchronized void startTimer() {
    long now = System.nanoTime();
    for (int i = 0; i < numLanes; i++) {
      hwLapTime[i].reset();
      hwSegmentTime[i].reset();
      lastLapTimeNanos[i] = now;
      lastSegmentTimeNanos[i] = now;
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
    return interfaceIndex >= 0 ? interfaceIndex : 0;
  }

  @Override
  public boolean isHealthy() {
    if (!isConnected() || lastHeartbeatTimeMs == 0) {
      return false; // Not connected or no heartbeat yet
    }
    // Healthy if we received a heartbeat in the last 2 seconds
    return (now() - lastHeartbeatTimeMs) < 2000;
  }

  public long getLastHeartbeatTimeMs() {
    return lastHeartbeatTimeMs;
  }

  protected abstract boolean isConnected();

  public boolean supportsRgbLeds() {
    return true;
  }

  public String getVersion() {
    return "";
  }

  @Override
  public boolean isLaneInPits(int laneIndex) {
    return pitManager != null && pitManager.isLaneInPits(laneIndex);
  }

  @Override
  public void setPitManager(PitManager pitManager) {
    if (this.pitManager != null && this.pitManager != pitManager) {
      this.pitManager.stop();
    }
    this.pitManager =
        pitManager != null
            ? pitManager
            : new PitManager(numLanes, this::hasPitInConfigured, () -> this.listener);
  }

  @Override
  public void initializeHardwareState() {
    if (pitManager != null) {
      pitManager.reset();
    }
    lastLeaderLane = null;
  }
}
