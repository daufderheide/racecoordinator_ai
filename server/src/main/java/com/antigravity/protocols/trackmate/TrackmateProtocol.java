package com.antigravity.protocols.trackmate;

import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.AbstractSerialProtocol;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.interfaces.SerialConnection;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

public class TrackmateProtocol extends AbstractSerialProtocol {

  private final TrackmateConfig config;
  private int timeLength = 0;
  private final byte[] timeStream = new byte[3];

  private static final byte START_COMMAND = 0x53; // 'S'

  private static final byte ENERGIZE_COMMAND = 0x52; // 'R'
  private static final byte DEENERGIZE_COMMAND = 0x45; // 'E'
  private static final byte TERMINATOR_LF = 0x0A;
  private static final byte TERMINATOR_CR = 0x0D;

  public TrackmateProtocol(TrackmateConfig config, int numLanes) {
    this(config, numLanes, null, null);
  }

  protected TrackmateProtocol(
      TrackmateConfig config,
      int numLanes,
      SerialConnection serialConnection,
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

  private void initializeHardware() {
    // Number of lanes sent to hardware is based on the max pin mapped to a behavior
    int hwNumLanes = 0;
    if (config.lapPinBehaviors != null) {
      for (int i = 0; i < config.lapPinBehaviors.size(); i++) {
        if (config.lapPinBehaviors.get(i) != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
          hwNumLanes = i + 1;
        }
      }
    }
    if (hwNumLanes == 0) hwNumLanes = 1; // Minimum 1

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

  @Override
  protected void processData() {
    while (rxBuffer.size() > 0) {
      byte data = rxBuffer.get();
      lastHeartbeatTimeMs = now();

      if (data == TERMINATOR_CR) {
        commitTime();
      } else if (data == TERMINATOR_LF) {
        // Line feed acts as a heartbeat
        if (listener != null) {
          // No specific pit debounce logic implemented here yet as trackmate just sends
          // laps.
          // In C# they used LF to handle debounce/pitting logic, but
          // AbstractSerialProtocol handles
          // basic debounce via getHardwareDebounceUs.
        }
      } else if (data >= 0x41 && data <= 0x48) { // 'A' through 'H'
        int pinIndex = data - 0x41;
        if (config.lapPinBehaviors != null && pinIndex < config.lapPinBehaviors.size()) {
          int behavior = config.lapPinBehaviors.get(pinIndex);
          int activeState = isNormallyClosedLaneSensors() ? 1 : 0;

          if (behavior >= PinBehavior.BEHAVIOR_LAP_BASE_VALUE
              && behavior < PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE) {
            int lane = behavior - PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
            handleLapCounter(lane, activeState, pinIndex);
          } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE
              && behavior < PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE) {
            int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE;
            handlePitIn(lane, activeState);
          } else if (behavior >= PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE
              && behavior < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE_VALUE) {
            int lane = behavior - PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE;
            handlePitOut(lane, activeState);
          } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE
              && behavior < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE + 1000) {
            int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE;
            handlePitInOut(lane, activeState);
          }
        }
      } else if (data == 0x57) { // 'W' Call button
        handleCallButton(0, 1, 0); // Reset to unpressed state
        handleCallButton(0, 0, 0); // Fire a state 0 (pressed) transition
      } else if (data >= 0x30 && data <= 0x39) { // '0' through '9'
        handleTimeDigit(data);
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
  }

  @Override
  public void startTimer() {
    super.startTimer();
    logger.info("Sending START_COMMAND (start timer)");
    writeData(new byte[] {START_COMMAND, TERMINATOR_LF});
  }

  @Override
  public void setMainPower(boolean on) {
    super.setMainPower(on);
    boolean powerState = config.normallyClosedRelays ? !on : on;
    byte command = powerState ? ENERGIZE_COMMAND : DEENERGIZE_COMMAND;
    logger.info("Setting main power. On: {}, powerState: {}", on, powerState);
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

    boolean invert = config.normallyClosedRelays;
    byte commandPrefix = invert ? (byte) 0x66 : (byte) 0x6E; // 'f' or 'n'

    // Convert bitmask to string bytes
    String bitmaskStr = String.valueOf(bitmask);
    logger.info("Setting lane power. Lane: {}, On: {}, Bitmask: {}", lane, on, bitmaskStr);
    byte[] message = new byte[1 + bitmaskStr.length() + 1];
    message[0] = commandPrefix;
    for (int i = 0; i < bitmaskStr.length(); i++) {
      message[i + 1] = (byte) bitmaskStr.charAt(i);
    }
    message[message.length - 1] = TERMINATOR_LF;
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
    return true;
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
}
