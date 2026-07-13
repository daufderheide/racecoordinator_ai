package com.antigravity.protocols.arduino;

import com.antigravity.proto.InterfaceAnalogDataEvent;
import com.antigravity.proto.InterfaceDigitalPinEvent;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.PinId;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.proto.RgbLedState;
import com.antigravity.protocols.AbstractSerialProtocol;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.interfaces.SerialConnection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("checkstyle:FileLength")
public class ArduinoProtocol extends AbstractSerialProtocol {

  private static final Logger logger = LoggerFactory.getLogger(ArduinoProtocol.class);

  private volatile ArduinoConfig config;
  private volatile boolean versionVerified = false;
  private Map<String, PinConfig> pinLookup;

  private ScheduledFuture<?> ledFlashFuture;
  private ArduinoLedHelper ledHelper;

  private Integer lastLeaderLane = null;
  private List<Integer> lastHeatStandings = null;
  private Integer lastSentState = null;
  private Integer lastSentValue = null;

  // Data sent from PC to Arduino
  private static final byte[] RESET_COMMAND = {0x52, 0x45, 0x53, 0x45, 0x54, 0x3B};
  private static final byte[] TIME_RESET_COMMAND = {0x54, 0x3B};

  // Data sent from Arduino to PC
  private static final byte OPCODE_HEARTBEAT = 0x54; // 'T'
  private static final byte OPCODE_VERSION = 0x56; // 'V'
  private static final byte OPCODE_INPUT = 0x49; // 'I'
  private static final byte OPCODE_ANALOG_DATA = 0x41; // 'A'
  private static final byte TERMINATOR = 0x3B; // ';'
  private static final byte DIGITAL = 0x44; // 'D'
  private static final byte ANALOG = 0x41; // 'A'

  public ArduinoProtocol(ArduinoConfig config, int numLanes, List<String> laneColors) {
    this(config, numLanes, null, null);

    if (numLanes > ArduinoConfig.MAX_LANES) {
      throw new IllegalArgumentException(
          "Number of lanes " + numLanes + " exceeds maximum of " + ArduinoConfig.MAX_LANES);
    }
    this.ledHelper.setLaneColors(laneColors);
  }

  protected ArduinoProtocol(
      ArduinoConfig config,
      int numLanes,
      SerialConnection serialConnection,
      ScheduledExecutorService statusScheduler) {
    super(
        numLanes,
        serialConnection,
        statusScheduler != null ? statusScheduler : Executors.newScheduledThreadPool(1));
    this.config = config;
    logger.info("ArduinoProtocol initialized with {} lanes", numLanes);

    this.ledHelper = new ArduinoLedHelper(this);
    buildPinLookup();
  }

  @Override
  protected String getCommPort() {
    return config.commPort;
  }

  @Override
  protected int getBaudRate() {
    return 115200; // Hardcoded in original implementation
  }

  @Override
  protected void onPortConnected() {
    pinStateCache.clear();
    ledHelper.resetCache();
    writeData(RESET_COMMAND);
    logger.info("Connected to {}. Sent RESET command.", config.commPort);

    // Immediately refresh the race state to ensure LEDs turn on
    ledHelper.refreshRaceState();
  }

  @Override
  protected void startStatusScheduler() {
    super.startStatusScheduler();

    if (ledFlashFuture == null || ledFlashFuture.isCancelled()) {
      ledFlashFuture =
          statusScheduler.scheduleAtFixedRate(
              () -> {
                try {
                  ledHelper.refreshRaceState();
                  ledHelper.refreshThermometers();
                } catch (Exception e) {
                  logger.error("Error in led flash scheduler", e);
                }
              },
              0,
              50,
              TimeUnit.MILLISECONDS);
    }
  }

  @Override
  public void close() {
    if (ledFlashFuture != null) {
      ledFlashFuture.cancel(true);
      ledFlashFuture = null;
    }

    if (isConnected()) {
      sendRaceStateMessage(8, 0);
      clearLeds();
      try {
        Thread.sleep(100);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      }
    }

    super.close();
    versionVerified = false;
    lastSentState = null;
    lastSentValue = null;
  }

  public void updateConfig(ArduinoConfig newConfig) {
    boolean commPortChanged = !Objects.equals(this.config.commPort, newConfig.commPort);
    boolean debounceChanged = this.config.debounceUs != newConfig.debounceUs;
    boolean digitalPinsChanged = !this.config.digitalIds.equals(newConfig.digitalIds);
    boolean analogPinsChanged = !this.config.analogIds.equals(newConfig.analogIds);
    boolean ledStringsChanged = !Objects.equals(this.config.ledStrings, newConfig.ledStrings);
    boolean normallyClosedRelaysChanged =
        this.config.normallyClosedRelays != newConfig.normallyClosedRelays;
    boolean normallyClosedLaneSensorsChanged =
        this.config.normallyClosedLaneSensors != newConfig.normallyClosedLaneSensors;

    String oldPort = this.config.commPort;
    this.config = newConfig;
    buildPinLookup();

    if (commPortChanged) {
      logger.info("COM port changed from {} to {}. Reconnecting...", oldPort, newConfig.commPort);
      lastHeartbeatTimeMs = 0;
      close();
      open();
    } else if (versionVerified) {
      if (digitalPinsChanged || analogPinsChanged || normallyClosedLaneSensorsChanged) {
        sendPinModeRead();
        sendPinModeWrite();
        sendPinModeAnalogRead();
      }
      if (ledStringsChanged) {
        ledHelper.sendRgbLedMode();
      }
      if (debounceChanged) {
        sendDebounce();
      }
      if (digitalPinsChanged || analogPinsChanged || normallyClosedRelaysChanged) {
        syncPower();
      }
    }
  }

  public void setPinState(boolean isDigital, int pin, boolean isHigh) {
    if (!isConnected()) {
      logger.warn("Serial connection not open, cannot set pin state");
      return;
    }

    int cacheKey = (isDigital ? 1000 : 2000) + pin;
    Boolean lastState = pinStateCache.get(cacheKey);
    if (lastState != null && lastState == isHigh) {
      return;
    }

    byte[] message = new byte[5];
    message[0] = 0x4F; // 'O'
    message[1] = isDigital ? DIGITAL : ANALOG;
    message[2] = (byte) pin;
    message[3] = isHigh ? (byte) 1 : (byte) 0;
    message[4] = TERMINATOR;

    writeData(message);
    pinStateCache.put(cacheKey, isHigh);

    logger.info(
        "Sent PIN_STATE - Type: {}, Pin: {}, State: {}",
        isDigital ? "Digital" : "Analog",
        pin,
        isHigh ? "HIGH" : "LOW");
  }

  @Override
  protected void processData() {
    while (rxBuffer.size() > 0) {
      byte opcode = rxBuffer.peek(0);

      if (!versionVerified && opcode != OPCODE_VERSION) {
        logger.warn(
            "Skipping byte 0x{} before version verification", String.format("%02X", opcode));
        rxBuffer.get();
        continue;
      }

      int messageLength = 0;

      switch (opcode) {
        case OPCODE_HEARTBEAT:
          messageLength = 7;
          break;
        case OPCODE_VERSION:
          messageLength = 6;
          break;
        case OPCODE_INPUT:
          messageLength = 5;
          break;
        case OPCODE_ANALOG_DATA:
          if (rxBuffer.size() >= 2) {
            int count = rxBuffer.peek(1) & 0xFF;
            messageLength = 3 + count * 5;
          } else {
            return;
          }
          break;
        default:
          logger.warn(
              "Unknown opcode: {}, skipping one byte to resync", String.format("0x%02X", opcode));
          rxBuffer.get();
          continue;
      }

      if (rxBuffer.size() < messageLength) {
        break;
      }

      if (rxBuffer.peek(messageLength - 1) != TERMINATOR) {
        logger.error(
            "Invalid message (bad terminator) for opcode {}, skipping one byte. Buffer: {}",
            String.format("0x%02X", opcode),
            rxBuffer.toHexString());
        rxBuffer.get();
        continue;
      }

      byte[] message = rxBuffer.read(messageLength);
      logger.debug("Processing message: {}", bytesToHex(message));
      handleMessage(message);
    }
  }

  public void handleMessage(byte[] message) {
    if (message != null && message.length > 0) {
      lastHeartbeatTimeMs = now();
    }

    byte opcode = message[0];

    if (!versionVerified && opcode != OPCODE_VERSION) {
      logger.warn(
          "Ignoring message (opcode: 0x{}) before version verification",
          String.format("%02X", opcode));
      return;
    }

    switch (opcode) {
      case OPCODE_HEARTBEAT:
        long timeInUse =
            ((long) (message[1] & 0xFF) << 24)
                | ((long) (message[2] & 0xFF) << 16)
                | ((long) (message[3] & 0xFF) << 8)
                | ((long) (message[4] & 0xFF));
        byte isReset = message[5];
        handleHeartbeat(timeInUse, isReset);
        break;
      case OPCODE_VERSION:
        int major = message[1] & 0xFF;
        int minor = message[2] & 0xFF;
        int patch = message[3] & 0xFF;
        int build = message[4] & 0xFF;
        onVersion(major, minor, patch, build);
        break;
      case OPCODE_INPUT:
        boolean isDigital = message[1] == DIGITAL;
        int pin = message[2] & 0xFF;
        int state = message[3] & 0xFF;
        onInput(isDigital, pin, state);
        break;
      case OPCODE_ANALOG_DATA:
        int count = message[1] & 0xFF;
        int idx = 2;
        for (int i = 0; i < count; i++) {
          int aPin = message[idx++] & 0xFF;
          int val =
              ((message[idx++] & 0xFF) << 24)
                  | ((message[idx++] & 0xFF) << 16)
                  | ((message[idx++] & 0xFF) << 8)
                  | (message[idx++] & 0xFF);
          onAnalogData(aPin, val);
        }
        break;
      default:
        logger.error("Unknown opcode: {}", opcode);
        break;
    }
  }

  private void onVersion(int major, int minor, int patch, int build) {
    if (!versionVerified) {
      if (major == 2 && minor == 1 && patch == 0) {
        versionVerified = true;
        logger.info("Version verified - {}.{}.{}.{}", major, minor, patch, build);
        sendPinModeRead();
        sendPinModeWrite();
        sendPinModeAnalogRead();
        sendDebounce();
        sendTimeReset();
        initializeHardwareState();
      } else {
        logger.error("Invalid firmware version: {}.{}.{}. Expected 2.1.0", major, minor, patch);
      }
    }
  }

  private void sendPinModeRead() {
    sendPinMode((byte) 0x49, ArduinoConfig.PinMode.READ);
  }

  private void sendPinModeWrite() {
    sendPinMode((byte) 0x4F, ArduinoConfig.PinMode.WRITE);
  }

  private void sendPinModeAnalogRead() {
    sendPinMode((byte) 0x70, ArduinoConfig.PinMode.READ_ANALOG);
  }

  private void sendPinMode(byte opcode, ArduinoConfig.PinMode mode) {
    int digitalCount = 0;
    if (config.digitalIds != null) {
      for (int id : config.digitalIds) {
        if (id < 0) continue;
        if (ArduinoConfig.getPinMode(id) == mode) digitalCount++;
      }
    }

    int analogCount = 0;
    if (config.analogIds != null) {
      for (int id : config.analogIds) {
        if (id < 0) continue;
        if (ArduinoConfig.getPinMode(id) == mode) analogCount++;
      }
    }

    int totalPins = digitalCount + analogCount;
    byte[] message;
    int idx = 0;
    if (mode == ArduinoConfig.PinMode.READ_ANALOG) {
      message = new byte[2 + (totalPins * 2) + 1];
    } else {
      message = new byte[3 + (totalPins * 2) + 1];
      message[idx++] = 0x50; // 'P'
    }

    message[idx++] = opcode;
    message[idx++] = (byte) totalPins;

    if (config.digitalIds != null) {
      for (int i = 0; i < config.digitalIds.size(); i++) {
        int id = config.digitalIds.get(i);
        if (ArduinoConfig.getPinMode(id) == mode) {
          message[idx++] = DIGITAL;
          message[idx++] = (byte) i;
        }
      }
    }

    if (config.analogIds != null) {
      for (int i = 0; i < config.analogIds.size(); i++) {
        int id = config.analogIds.get(i);
        if (ArduinoConfig.getPinMode(id) == mode) {
          message[idx++] = ANALOG;
          message[idx++] = (byte) i;
        }
      }
    }

    message[idx++] = TERMINATOR;

    writeData(message);
    logger.info("Sent PIN_MODE {} (opcode: 0x{})", mode, String.format("%02X", opcode));
  }

  private void sendDebounce() {
    byte[] message = new byte[6];
    message[0] = 0x64; // 'd'
    message[1] = (byte) (config.debounceUs / 1000);
    message[2] = (byte) ((config.debounceUs % 1000) / 4);
    message[3] = message[1];
    message[4] = message[2];
    message[5] = TERMINATOR;

    writeData(message);
    logger.info("Sent DEBOUNCE");
  }

  @Override
  protected void sendTimeReset() {
    writeData(TIME_RESET_COMMAND);
    logger.info("Sent TIME_RESET");
    ledHelper.refreshRaceState();
  }

  public void setStringRgbLedValues(int pinId, List<RgbLedState> rgbLeds) {
    ledHelper.setStringRgbLedValues(pinId, rgbLeds);
  }

  @Override
  public void clearLeds() {
    ledHelper.clearLeds();
  }

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    ledHelper.setRaceState(state, flag, countdown);

    int stateVal;
    int valueVal = 0;

    switch (state) {
      case NOT_STARTED:
        stateVal = 0;
        int nsMask = 0;
        if (countdown > 0.0) {
          nsMask |= 0x01;
        }
        if (flag == RaceFlag.GREEN_YELLOW) {
          nsMask |= 0x02;
        }
        valueVal = nsMask;
        break;
      case STARTING:
        stateVal = (flag == RaceFlag.YELLOW) ? 3 : 2;
        valueVal = Math.max(0, (int) Math.ceil(countdown));
        break;
      case RACING:
        stateVal = 4;
        break;
      case PAUSED:
        stateVal = 5;
        break;
      case HEAT_OVER:
        stateVal = 6;
        int hoMask = 0;
        if (countdown > 0.0) {
          hoMask |= 0x01;
        }
        if (flag == RaceFlag.GREEN_YELLOW) {
          hoMask |= 0x02;
        }
        valueVal = hoMask;
        break;
      case RACE_OVER:
        stateVal = 7;
        break;
      default:
        return;
    }

    if (lastSentState == null
        || lastSentValue == null
        || lastSentState != stateVal
        || lastSentValue != valueVal) {
      lastSentState = stateVal;
      lastSentValue = valueVal;
      sendRaceStateMessage(stateVal, valueVal);
    }
  }

  private void sendRaceStateMessage(int stateVal, int valueVal) {
    if (!isConnected()) {
      logger.warn("Serial connection not open, cannot send race state");
      return;
    }
    byte[] message = new byte[5];
    message[0] = 0x45; // 'E'
    message[1] = 0x00; // Sub-opcode (Race State)
    message[2] = (byte) stateVal;
    message[3] = (byte) valueVal;
    message[4] = TERMINATOR;

    writeData(message);
    logger.info("Sent RACE_STATE - State: {}, Value: {}", stateVal, valueVal);
  }

  @Override
  public void setFuelLevel(int laneIndex, double fuelLevel, double capacity) {
    int percentage = DefaultProtocol.calculateFuelPercentage(fuelLevel, capacity);
    ledHelper.setFuelLevel(laneIndex, percentage);
    sendFuelPercentage(laneIndex, percentage);
  }

  private void sendFuelPercentage(int laneIndex, int percentage) {
    if (!isConnected()) {
      logger.warn("Serial connection not open, cannot send fuel percentage");
      return;
    }
    byte[] message = new byte[5];
    message[0] = 0x45; // 'E'
    message[1] = 0x03; // Sub-opcode (Fuel Percentage)
    message[2] = (byte) laneIndex;
    message[3] = (byte) percentage;
    message[4] = TERMINATOR;

    writeData(message);
    logger.info("Sent FUEL_PERCENTAGE - Lane: {}, Percentage: {}", laneIndex, percentage);
  }

  @Override
  public void setHeatProgress(double percentage) {
    ledHelper.setHeatProgress(percentage);
  }

  private void onInput(boolean isDigital, int pin, int state) {
    String key = (isDigital ? "D" : "A") + pin;
    PinConfig pinConfig = pinLookup.get(key);

    if (pinConfig != null) {
      logger.info(
          "Received Input - Behavior: {}, Lane: {}, Pin: {}, State: {}",
          pinConfig.behavior,
          pinConfig.laneIndex,
          pin,
          state);

      int interfaceId =
          (isDigital ? PinId.PIN_ID_DIGITAL_BASE_VALUE : PinId.PIN_ID_ANALOG_BASE_VALUE) + pin;

      switch (pinConfig.behavior) {
        case LAP_COUNTER:
          handleLapCounter(pinConfig.laneIndex, state, interfaceId);
          break;
        case SEGMENT_COUNTER:
          handleSegmentCounter(pinConfig.laneIndex, state, interfaceId);
          break;
        case CALL_BUTTON:
          handleCallButton(pinConfig.laneIndex, state, interfaceId);
          break;
        case PIT_IN:
          handlePitIn(pinConfig.laneIndex, state);
          break;
        case PIT_OUT:
          handlePitOut(pinConfig.laneIndex, state);
          break;
        case PIT_IN_OUT:
          handlePitInOut(pinConfig.laneIndex, state);
          break;
        case RESERVED:
          break;
        default:
          logger.warn(
              "Received Unknown Input - Behavior: {}, Lane: {}, Pin: {}, State: {}",
              pinConfig.behavior,
              pinConfig.laneIndex,
              pin,
              state);
          break;
      }
    } else {
      logger.info(
          "Received Input - Type: {}, Pin: {}, State: {}",
          (isDigital ? "Digital" : "Analog"),
          pin,
          state);
    }

    if (listener != null) {
      InterfaceEvent event =
          InterfaceEvent.newBuilder()
              .setDigitalPin(
                  InterfaceDigitalPinEvent.newBuilder()
                      .setPin(pin)
                      .setState(state)
                      .setIsDigital(isDigital)
                      .setInterfaceIndex(getInterfaceIndex())
                      .build())
              .build();
      listener.onInterfaceEvent(event);
    }
  }

  private void onAnalogData(int pin, int value) {
    logger.debug("Received Analog Data - Pin: A{}, Value: {}", pin, value);

    if (listener != null) {
      InterfaceEvent event =
          InterfaceEvent.newBuilder()
              .setAnalogData(
                  InterfaceAnalogDataEvent.newBuilder()
                      .setPin(pin)
                      .setValue(value)
                      .setInterfaceIndex(getInterfaceIndex())
                      .build())
              .build();
      listener.onInterfaceEvent(event);

      PinConfig pinConfig = pinLookup.get("A" + pin);

      if (pinConfig != null && pinConfig.behavior == InputBehavior.VOLTAGE_LEVEL) {
        int laneIndex = pinConfig.laneIndex;
        if (laneIndex >= 0 && laneIndex < getNumLanes()) {
          long currentTime = now();
          double deltaTimeSeconds = 0.0;
          if (lastAnalogTimeMs[laneIndex] > 0) {
            deltaTimeSeconds = (currentTime - lastAnalogTimeMs[laneIndex]) / 1000.0;
          }
          lastAnalogTimeMs[laneIndex] = currentTime;

          String key = String.valueOf(laneIndex);
          Map<String, Integer> voltageConfigsMap = config.getVoltageConfigsMap();
          Integer maxVoltage = (voltageConfigsMap != null) ? voltageConfigsMap.get(key) : null;

          double pct = 0.0;
          if (maxVoltage != null && maxVoltage > 0) {
            pct = Math.min(1.0, Math.max(0.0, (double) value / maxVoltage));
          }

          CarLocation location = laneInPits[laneIndex] ? CarLocation.PitRow : CarLocation.Main;
          listener.onCarData(
              new CarData(
                  laneIndex,
                  deltaTimeSeconds,
                  pct,
                  pct,
                  laneInPits[laneIndex],
                  location,
                  location,
                  -1));
        }
      }
    }
  }

  @Override
  protected boolean hasPitInConfigured(int laneIndex) {
    if (config.lapPinPitBehavior == ArduinoConfig.LapPinPitBehavior.PIT_IN) {
      return true;
    }

    for (PinConfig pc : pinLookup.values()) {
      if (pc.behavior == InputBehavior.PIT_IN
          && (pc.laneIndex == -1 || pc.laneIndex == laneIndex)) {
        return true;
      }
    }
    return false;
  }

  @Override
  public void initializeHardwareState() {
    lastLeaderLane = null;
    lastHeatStandings = null;
    lastSentState = null;
    lastSentValue = null;
    syncPower();
    ledHelper.initializeHardwareState();
  }

  private void buildPinLookup() {
    pinLookup = new HashMap<>();
    addPinConfigs(config.digitalIds, true);
    addPinConfigs(config.analogIds, false);
  }

  private void addPinConfigs(List<Integer> ids, boolean isDigital) {
    if (ids == null) return;

    for (int i = 0; i < ids.size(); i++) {
      int code = ids.get(i);
      if (code == -1) continue;

      InputBehavior behavior = null;
      int laneIndex = -1;

      if (code >= PinBehavior.BEHAVIOR_LAP_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + getNumLanes()) {
        behavior = InputBehavior.LAP_COUNTER;
        laneIndex = code - PinBehavior.BEHAVIOR_LAP_BASE.getNumber();
      } else if (code >= PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + getNumLanes()) {
        behavior = InputBehavior.SEGMENT_COUNTER;
        laneIndex = code - PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber();
      } else if (code >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + getNumLanes()) {
        behavior = InputBehavior.CALL_BUTTON;
        laneIndex = code - PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber();
      } else if (code == PinBehavior.BEHAVIOR_CALL_BUTTON.getNumber()) {
        behavior = InputBehavior.CALL_BUTTON;
      } else if (code == PinBehavior.BEHAVIOR_RESERVED.getNumber()) {
        behavior = InputBehavior.RESERVED;
      } else if (code == PinBehavior.BEHAVIOR_RELAY.getNumber()) {
        behavior = InputBehavior.MAIN_RELAY;
      } else if (code >= PinBehavior.BEHAVIOR_RELAY_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + getNumLanes()) {
        behavior = InputBehavior.LANE_RELAY;
        laneIndex = code - PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
      } else if (code >= PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + getNumLanes()) {
        behavior = InputBehavior.PIT_IN;
        laneIndex = code - PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber();
      } else if (code >= PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + getNumLanes()) {
        behavior = InputBehavior.PIT_OUT;
        laneIndex = code - PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber();
      } else if (code >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE.getNumber() + getNumLanes()) {
        behavior = InputBehavior.PIT_IN_OUT;
        laneIndex = code - PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE.getNumber();
      } else if (code >= PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + getNumLanes()) {
        behavior = InputBehavior.VOLTAGE_LEVEL;
        laneIndex = code - PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber();
      }

      if (behavior != null) {
        pinLookup.put(
            (isDigital ? "D" : "A") + i, new PinConfig(laneIndex, isDigital, i, behavior));
      }
    }
  }

  private enum InputBehavior {
    LAP_COUNTER,
    SEGMENT_COUNTER,
    CALL_BUTTON,
    MAIN_RELAY,
    LANE_RELAY,
    PIT_IN,
    PIT_OUT,
    PIT_IN_OUT,
    VOLTAGE_LEVEL,
    RESERVED
  }

  private static class PinConfig {
    int laneIndex;
    boolean isDigital;
    int pin;
    InputBehavior behavior;

    public PinConfig(int laneIndex, boolean isDigital, int pin, InputBehavior behavior) {
      this.laneIndex = laneIndex;
      this.isDigital = isDigital;
      this.pin = pin;
      this.behavior = behavior;
    }
  }

  private static String bytesToHex(byte[] bytes) {
    StringBuilder sb = new StringBuilder();
    for (byte b : bytes) {
      sb.append(String.format("%02X ", b));
    }
    return sb.toString().trim();
  }

  @Override
  public boolean hasPerLaneRelays() {
    if (this.config.digitalIds.stream()
        .anyMatch(
            id ->
                id >= PinBehavior.BEHAVIOR_RELAY_BASE.getNumber()
                    && id < PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + getNumLanes())) {
      return true;
    }

    if (this.config.analogIds.stream()
        .anyMatch(
            id ->
                id >= PinBehavior.BEHAVIOR_RELAY_BASE.getNumber()
                    && id < PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + getNumLanes())) {
      return true;
    }

    return false;
  }

  @Override
  public boolean hasMainRelay() {
    if (this.config.digitalIds.stream()
        .anyMatch(id -> id == PinBehavior.BEHAVIOR_RELAY.getNumber())) {
      return true;
    }

    if (this.config.analogIds.stream()
        .anyMatch(id -> id == PinBehavior.BEHAVIOR_RELAY.getNumber())) {
      return true;
    }

    return false;
  }

  @Override
  public void setMainPower(boolean on) {
    super.setMainPower(on);
    if (!versionVerified || pinLookup == null) {
      return;
    }

    boolean isHigh = on != config.normallyClosedRelays;
    for (PinConfig pinConfig : pinLookup.values()) {
      if (pinConfig.behavior == InputBehavior.MAIN_RELAY) {
        setPinState(pinConfig.isDigital, pinConfig.pin, isHigh);
      }
    }
  }

  private void syncPower() {
    if (lastMainPower != null) {
      setMainPower(lastMainPower);
    }
    for (Map.Entry<Integer, Boolean> entry : lastLanePower.entrySet()) {
      setLanePower(entry.getValue(), entry.getKey());
    }
  }

  @Override
  public boolean hasDigitalFuel() {
    if (pinLookup == null) return false;
    for (PinConfig pc : pinLookup.values()) {
      if (pc.behavior == InputBehavior.VOLTAGE_LEVEL) {
        return true;
      }
    }
    return false;
  }

  @Override
  public void setLanePower(boolean on, int lane) {
    super.setLanePower(on, lane);
    if (!versionVerified || pinLookup == null) {
      return;
    }

    boolean isHigh = on != config.normallyClosedRelays;
    for (PinConfig pinConfig : pinLookup.values()) {
      if (pinConfig.behavior == InputBehavior.LANE_RELAY && pinConfig.laneIndex == lane) {
        setPinState(pinConfig.isDigital, pinConfig.pin, isHigh);
      }
    }
  }

  @Override
  public void setHeatStandings(List<Integer> laneIndices) {
    ledHelper.setHeatStandings(laneIndices);

    if (laneIndices != null && !laneIndices.isEmpty()) {
      int leaderLane = laneIndices.get(0);
      if (lastLeaderLane == null || lastLeaderLane != leaderLane) {
        lastLeaderLane = leaderLane;
        sendHeatLeader(leaderLane);
      }

      if (lastHeatStandings == null || !lastHeatStandings.equals(laneIndices)) {
        lastHeatStandings = new java.util.ArrayList<>(laneIndices);
        sendHeatStandings(laneIndices);
      }
    }
  }

  private void sendHeatLeader(int laneIndex) {
    if (!isConnected()) {
      logger.warn("Serial connection not open, cannot send heat leader");
      return;
    }
    byte[] message = new byte[4];
    message[0] = 0x45; // 'E'
    message[1] = 0x01; // Sub-opcode (heat leader)
    message[2] = (byte) laneIndex;
    message[3] = TERMINATOR;

    writeData(message);
    logger.info("Sent HEAT_LEADER - Lane: {}", laneIndex);
  }

  private void sendHeatStandings(List<Integer> laneIndices) {
    if (!isConnected()) {
      logger.warn("Serial connection not open, cannot send heat standings");
      return;
    }
    int numLanes = laneIndices.size();
    byte[] message = new byte[3 + numLanes + 1];
    message[0] = 0x45; // 'E'
    message[1] = 0x02; // Sub-opcode (heat standings)
    message[2] = (byte) numLanes;
    for (int i = 0; i < numLanes; i++) {
      message[3 + i] = laneIndices.get(i).byteValue();
    }
    message[3 + numLanes] = TERMINATOR;

    writeData(message);
    logger.info("Sent HEAT_STANDINGS - Standings: {}", laneIndices);
  }

  @Override
  public void setRefueling(int laneIndex, boolean isRefueling) {
    ledHelper.setRefueling(laneIndex, isRefueling);
  }

  public boolean isOpen() {
    return versionVerified;
  }

  public ArduinoConfig getConfig() {
    return config;
  }

  // Configuration Hooks Implementation

  @Override
  protected boolean isNormallyClosedLaneSensors() {
    return config != null && config.normallyClosedLaneSensors;
  }

  @Override
  protected boolean isNormallyClosedRelays() {
    return config != null && config.normallyClosedRelays;
  }

  @Override
  protected ArduinoConfig.LapPinPitBehavior getLapPinPitBehavior() {
    return config != null ? config.lapPinPitBehavior : ArduinoConfig.LapPinPitBehavior.NONE;
  }

  @Override
  protected boolean useLapsForSegments() {
    return config != null && config.useLapsForSegments && hasSegmentSensors();
  }

  private boolean hasSegmentSensors() {
    if (pinLookup == null) {
      return false;
    }
    for (PinConfig pinConfig : pinLookup.values()) {
      if (pinConfig.behavior == InputBehavior.SEGMENT_COUNTER) {
        return true;
      }
    }
    return false;
  }

  @Override
  protected double getHardwareDebounceUs() {
    return config != null ? config.debounceUs : 0;
  }
}
