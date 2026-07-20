package com.antigravity.protocols.trackmate;

import com.antigravity.proto.InterfaceDigitalPinEvent;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.AbstractSerialProtocol;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.interfaces.ISerialConnection;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

public class TrackmateProtocol extends AbstractSerialProtocol {

  private final TrackmateConfig config;
  private int timeLength = 0;
  private final byte[] timeStream = new byte[3];

  private final long[] lastHitTimeMs = new long[8];
  private final boolean[] isSensorActive = new boolean[8];

  private static final byte START_COMMAND = 0x53; // 'S'

  // NC Relay turns track power on with 'E'
  private static final byte DEENERGIZE_COMMAND = 0x45; // 'E'
  // NC Relay turns track power off with 'R'
  private static final byte ENERGIZE_COMMAND = 0x52; // 'R'
  private static final byte TERMINATOR_LF = 0x0A;
  private static final byte TERMINATOR_CR = 0x0D;

  public TrackmateProtocol(TrackmateConfig config, int numLanes) {
    this(config, numLanes, null, null);
  }

  protected TrackmateProtocol(
      TrackmateConfig config,
      int numLanes,
      ISerialConnection serialConnection,
      ScheduledExecutorService statusScheduler) {
    super(
        numLanes,
        serialConnection,
        statusScheduler != null ? statusScheduler : Executors.newScheduledThreadPool(1));
    this.config = config;
    logger.info("TrackmateProtocol initialized with {} lanes", numLanes);
  }

  @Override
  protected String getCommPort() {
    return config.commPort;
  }

  @Override
  protected int getBaudRate() {
    return 9600;
  }

  @Override
  protected void onPortConnected() {
    logger.info("Connected to {}. Initializing hardware.", config.commPort);
    initializeHardware();
  }

  @Override
  protected void startStatusScheduler() {
    super.startStatusScheduler();
  }

  @Override
  public void close() {
    super.close();
  }

  private void initializeHardware() {
    logger.info("Initializing trackmate hardware");

    // Number of lanes sent to hardware is based on the max pin mapped to a behavior
    int hwNumLanes = 0;
    if (config.lapPinBehaviors != null) {
      for (int i = 0; i < config.lapPinBehaviors.size(); i++) {
        if (config.lapPinBehaviors.get(i) != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
          hwNumLanes = i + 1;
        }
      }
    }
    if (hwNumLanes == 0) {
      // Set to max lanes
      hwNumLanes = 8;
    }

    byte lanesByte = (byte) (0x30 + hwNumLanes);
    logger.info("Setting hardware lanes to {}", hwNumLanes);
    writeData(new byte[] {0x41, lanesByte, TERMINATOR_LF}); // An

    // Sensor type - now driven by normallyClosedLaneSensors
    byte sensorByte = config.normallyClosedLaneSensors ? (byte) 0x31 : (byte) 0x30;
    logger.info("Setting sensor type normally closed to {}", config.normallyClosedLaneSensors);
    writeData(new byte[] {0x43, sensorByte, TERMINATOR_LF}); // Cn

    // Debounce
    byte debounceByte = (byte) (0x30 + config.debounce);
    logger.info("Setting debounce to {}", config.debounce);
    writeData(new byte[] {0x44, debounceByte, TERMINATOR_LF}); // Dn

    // Relay type 1 = normally on, 0 = normally off
    byte relayByte = config.normallyClosedRelays ? (byte) 0x31 : (byte) 0x30;
    logger.info("Setting relay normally closed to {}", config.normallyClosedRelays);
    writeData(new byte[] {0x49, relayByte, TERMINATOR_LF}); // I0 / I1

    // Start sending data
    logger.info("Sending START_COMMAND");
    writeData(new byte[] {START_COMMAND, TERMINATOR_LF});
  }

  private void triggerPinBehavior(int behavior, int state, int pinIndex) {
    if (behavior >= PinBehavior.BEHAVIOR_LAP_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE) {
      int lane = behavior - PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
      handleLapCounter(lane, state, pinIndex);
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE;
      handlePitIn(lane, state);
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE_VALUE) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE;
      handlePitOut(lane, state);
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE + 1000) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE;
      handlePitInOut(lane, state);
    }
  }

  @Override
  protected void processData() {
    while (rxBuffer.size() > 0) {
      byte data = rxBuffer.get();
      lastHeartbeatTimeMs = now();

      if (data == TERMINATOR_CR) {
        commitTime();
      } else if (data == TERMINATOR_LF) {
        // Line feed acts as a heartbeat, use it for debounce/pit checking
        long currentTime = now();
        for (int i = 0; i < 8; i++) {
          if (isSensorActive[i] && (currentTime - lastHitTimeMs[i] > 500)) {
            isSensorActive[i] = false;
            int inactiveState = isNormallyClosedLaneSensors() ? 0 : 1;
            if (listener != null) {
              listener.onInterfaceEvent(
                  InterfaceEvent.newBuilder()
                      .setDigitalPin(
                          InterfaceDigitalPinEvent.newBuilder()
                              .setInterfaceIndex(getInterfaceIndex())
                              .setPin(i)
                              .setIsDigital(true)
                              .setState(inactiveState))
                      .build());
            }
            if (config.lapPinBehaviors != null && i < config.lapPinBehaviors.size()) {
              int behavior = config.lapPinBehaviors.get(i);
              triggerPinBehavior(behavior, inactiveState, i);
            }
          }
        }
      } else if (data >= 0x41 && data <= 0x48) { // 'A' through 'H'
        int pinIndex = data - 0x41;
        lastHitTimeMs[pinIndex] = now();
        int activeState = isNormallyClosedLaneSensors() ? 1 : 0;

        if (!isSensorActive[pinIndex]) {
          isSensorActive[pinIndex] = true;
          if (listener != null) {
            listener.onInterfaceEvent(
                InterfaceEvent.newBuilder()
                    .setDigitalPin(
                        InterfaceDigitalPinEvent.newBuilder()
                            .setInterfaceIndex(getInterfaceIndex())
                            .setPin(pinIndex)
                            .setIsDigital(true)
                            .setState(activeState))
                    .build());
          }
          if (config.lapPinBehaviors != null && pinIndex < config.lapPinBehaviors.size()) {
            int behavior = config.lapPinBehaviors.get(pinIndex);
            triggerPinBehavior(behavior, activeState, pinIndex);
          }
        }
      } else if (data == 0x57) { // 'W' Call button
        logger.info("Trackmate hardware sent call button signal (0x57 / 'W')");
        handleCallButton(0, 1, 0); // Reset to unpressed state
        handleCallButton(0, 0, 0); // Fire a state 0 (pressed) transition
      } else if (data == 0x77) { // 'w' Call button (lowercase variant)
        logger.info("Trackmate hardware sent call button signal (0x77 / 'w')");
        handleCallButton(0, 1, 0);
        handleCallButton(0, 0, 0);
      } else if (data >= 0x30 && data <= 0x39) { // '0' through '9'
        handleTimeDigit(data);
      } else {
        logger.debug(
            "Trackmate Protocol received unhandled byte: 0x{} ('{}')",
            String.format("%02X", data),
            (char) data);
      }
    }
  }

  private void handleTimeDigit(byte data) {
    if (timeLength >= 3) {
      logger.error("Too many values for time field");
    } else {
      timeStream[timeLength] = data;
      timeLength++;
    }
  }

  private void commitTime() {
    if (timeLength > 0) {
      long t = 0;
      long exp = 1;
      for (int i = timeLength - 1; i >= 0; i--) {
        t += ((timeStream[i] - 0x30) * exp);
        exp *= 10;
      }
      timeLength = 0;
      // Trackmate time is in ms. hwLapTime uses microseconds.
      long timeUs = t * 1000;
      logger.trace("Processed time message: {} ms", t);
      for (int i = 0; i < getNumLanes(); i++) {
        hwLapTime[i].add(timeUs);
        hwSegmentTime[i].add(timeUs);
      }
    }
  }

  @Override
  protected void sendTimeReset() {
    // For Trackmate, we reset local timer variables when starting
    for (int i = 0; i < getNumLanes(); i++) {
      hwLapTime[i].reset();
      hwSegmentTime[i].reset();
    }
    // Reset sensor states so that we can detect hits that occur immediately upon
    // resume
    for (int i = 0; i < 8; i++) {
      isSensorActive[i] = false;
      lastHitTimeMs[i] = 0;
    }
  }

  @Override
  public void startTimer() {
    super.startTimer();
    logger.info("Starting timer (software timer only, hardware timer started at initialization)");
    // Do not send START_COMMAND here, as it's already sent during initialization
    // and sending it again can cause Trackmate to drop sensor readings.
  }

  @Override
  public void setMainPower(boolean on) {
    super.setMainPower(on);
    boolean powerState = config.normallyClosedRelays ? !on : on;
    byte command = powerState ? ENERGIZE_COMMAND : DEENERGIZE_COMMAND;
    logger.info(
        "Setting main power. on: "
            + on
            + ", NC: "
            + config.normallyClosedRelays
            + ", State: "
            + powerState
            + ", Command: "
            + (char) command);
    writeData(new byte[] {command, TERMINATOR_LF});
  }

  @Override
  public void setLanePower(boolean on, int lane) {
    super.setLanePower(on, lane);
    // Trackmate supports relays via 'n' or 'f' and a bitmask.
    // 'n' turns specified relays ON and others OFF.
    // To support per-lane efficiently without dropping others, we need to track all
    // lane powers.
    int bitmask = 0;
    for (int i = 0; i < getNumLanes(); i++) {
      Boolean lanePower = lastLanePower.get(i);
      if (lanePower != null && lanePower) {
        bitmask |= (1 << i);
      }
    }
    byte commandPrefix = config.normallyClosedRelays ? (byte) 0x6E : (byte) 0x66; // 'n' or 'f'

    logger.info(
        "Setting lane power. NC: {},  Lane: {}, On: {}, Command: {}, Bitmask: {}",
        config.normallyClosedRelays,
        lane,
        on,
        (char) commandPrefix,
        bitmask);
    byte[] message = new byte[] {commandPrefix, (byte) bitmask, TERMINATOR_LF};
    writeData(message);
  }

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    // Optional: map to some trackmate functionality if supported
  }

  @Override
  protected boolean isNormallyClosedLaneSensors() {
    return config.normallyClosedLaneSensors;
  }

  @Override
  protected boolean isNormallyClosedRelays() {
    return config.normallyClosedRelays;
  }

  @Override
  protected ArduinoConfig.LapPinPitBehavior getLapPinPitBehavior() {
    return config.lapPinPitBehavior != null
        ? config.lapPinPitBehavior
        : ArduinoConfig.LapPinPitBehavior.NONE;
  }

  @Override
  protected boolean useLapsForSegments() {
    return false;
  }

  @Override
  protected double getHardwareDebounceUs() {
    return 0; // Trackmate does debounce in hardware
  }

  @Override
  protected boolean hasPitInConfigured(int laneIndex) {
    if (config == null || config.lapPinBehaviors == null) {
      return false;
    }
    return config.lapPinBehaviors.contains(PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + laneIndex);
  }

  @Override
  public boolean hasPerLaneRelays() {
    return config.hasPerLaneRelays;
  }

  @Override
  public boolean hasMainRelay() {
    return true;
  }

  @Override
  protected boolean requiresDtrRts() {
    return false;
  }

  @Override
  protected boolean requiresHeartbeat() {
    return true;
  }
}
