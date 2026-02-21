package com.antigravity.protocols.arduino;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.PinId;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.PartialTime;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.antigravity.util.CircularBuffer;
import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class ArduinoProtocol extends DefaultProtocol {
  private static final Logger logger = LoggerFactory.getLogger(ArduinoProtocol.class);

  private ArduinoConfig config;
  private int numLanes;

  private SerialConnection serialConnection;
  private CircularBuffer rxBuffer;
  private boolean versionVerified = false;
  private Map<String, PinConfig> pinLookup;

  private HwTime[] hwLapTime;
  private HwTime[] hwSegmentTime;
  private byte hwReset;

  private ScheduledExecutorService statusScheduler;
  private java.util.concurrent.ScheduledFuture<?> statusFuture;
  protected long lastHeartbeatTimeMs = 0;

  // Lane specific

  // Data sent from PC to Arduino
  private static final byte[] RESET_COMMAND = { 0x52, 0x45, 0x53, 0x45, 0x54, 0x3B };
  private static final byte[] TIME_RESET_COMMAND = { 0x54, 0x3B };

  // Data sent from Arduino to PC
  private static final byte OPCODE_HEARTBEAT = 0x54; // 'T'
  private static final byte OPCODE_VERSION = 0x56; // 'V'
  private static final byte OPCODE_INPUT = 0x49; // 'I'
  private static final byte TERMINATOR = 0x3B; // ';'
  private static final byte DIGITAL = 0x44; // 'D'
  private static final byte ANALOG = 0x41; // 'A'

  public ArduinoProtocol(ArduinoConfig config, int numLanes) {
    this(config, numLanes, null, null);

    if (numLanes > ArduinoConfig.MAX_LANES) {
      throw new IllegalArgumentException(
          "Number of lanes " + numLanes + " exceeds maximum of " + ArduinoConfig.MAX_LANES);
    }
  }

  protected ArduinoProtocol(ArduinoConfig config, int numLanes, SerialConnection serialConnection,
      ScheduledExecutorService statusScheduler) {
    super(numLanes);
    this.config = config;
    this.numLanes = numLanes;

    this.serialConnection = serialConnection != null ? serialConnection : createSerialConnection();
    this.statusScheduler = statusScheduler;
    rxBuffer = new CircularBuffer(4096);
    buildPinLookup();

    // Initialize the hardware timing.
    hwLapTime = new HwTime[numLanes];
    hwSegmentTime = new HwTime[numLanes];
    for (int i = 0; i < numLanes; i++) {
      hwLapTime[i] = new HwTime();
      hwSegmentTime[i] = new HwTime();
    }
    hwReset = 1;
  }

  protected SerialConnection createSerialConnection() {
    return new SerialConnection();
  }

  protected ScheduledExecutorService createScheduler() {
    return Executors.newSingleThreadScheduledExecutor();
  }

  protected long now() {
    return System.currentTimeMillis();
  }

  @Override
  public boolean open() {
    startStatusScheduler();

    if (config.commPort == null || config.commPort.isEmpty()) {
      logger.info("No COM port specified, status will be DISCONNECTED");
      return true;
    }

    try {
      logger.info("Attempting to connect to {} at {} baud", config.commPort, config.baudRate);
      serialConnection.connect(config.commPort, config.baudRate);

      serialConnection.addListener(new com.fazecast.jSerialComm.SerialPortDataListener() {
        @Override
        public int getListeningEvents() {
          return com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_RECEIVED;
        }

        public void serialEvent(com.fazecast.jSerialComm.SerialPortEvent event) {
          if (event.getEventType() != com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_RECEIVED) {
            return;
          }

          byte[] data = event.getReceivedData();
          if (data != null && data.length > 0) {
            logger.info("Received: {}", bytesToHex(data));
            rxBuffer.write(data);
            processData();
          }
        }
      });

      serialConnection.writeData(RESET_COMMAND);
      logger.info("Connected to {}. Sent RESET command.", config.commPort);

      return true;
    } catch (IOException e) {
      logger.error("Failed to connect to {}: {}", config.commPort, e.getMessage());
      return true; // Still return true so the status loop can report DISCONNECTED to the client
    }
  }

  @Override
  public void close() {
    logger.info("Closing ArduinoProtocol");
    if (statusFuture != null) {
      statusFuture.cancel(true);
    }
    if (statusScheduler != null) {
      statusScheduler.shutdown();
    }
    statusScheduler = null;

    if (serialConnection != null && serialConnection.isOpen()) {
      serialConnection.disconnect();
    }
  }

  private void startStatusScheduler() {
    if (statusFuture != null && !statusFuture.isCancelled()) {
      return;
    }
    if (statusScheduler == null) {
      statusScheduler = createScheduler();
    }
    statusFuture = statusScheduler.scheduleAtFixedRate(() -> {
      try {
        if (listener != null) {
          com.antigravity.proto.InterfaceStatus status;
          if (!serialConnection.isOpen()) {
            status = com.antigravity.proto.InterfaceStatus.DISCONNECTED;
          } else if (lastHeartbeatTimeMs == 0) {
            status = com.antigravity.proto.InterfaceStatus.NO_DATA;
          } else if (now() - lastHeartbeatTimeMs < 2000) {
            status = com.antigravity.proto.InterfaceStatus.CONNECTED;
          } else {
            status = com.antigravity.proto.InterfaceStatus.DISCONNECTED;
          }
          listener.onInterfaceStatus(status);
        }
      } catch (Exception e) {
        logger.error("Error in status scheduler", e);
      }
    }, 0, 1, TimeUnit.SECONDS);
  }

  @Override
  public void startTimer() {
    sendTimeReset();
    for (int i = 0; i < numLanes; i++) {
      hwLapTime[i].Reset();
      hwSegmentTime[i].Reset();
    }
    hwReset = 1;
  }

  @Override
  public List<PartialTime> stopTimer() {
    List<PartialTime> partialTimes = new ArrayList<>();
    for (int i = 0; i < numLanes; i++) {
      partialTimes.add(new PartialTime(i, hwLapTime[i].Time(), hwSegmentTime[i].Time()));
    }
    return partialTimes;
  }

  public void updateConfig(ArduinoConfig newConfig) {
    boolean debounceChanged = this.config.debounceUs != newConfig.debounceUs;
    boolean digitalPinsChanged = !this.config.digitalIds.equals(newConfig.digitalIds);
    boolean analogPinsChanged = !this.config.analogIds.equals(newConfig.analogIds);

    this.config = newConfig;
    buildPinLookup();

    if (versionVerified) {
      if (digitalPinsChanged || analogPinsChanged) {
        sendPinModeRead();
        sendPinModeWrite();
      }
      if (debounceChanged) {
        sendDebounce();
      }
    }
  }

  public void setPinState(boolean isDigital, int pin, boolean isHigh) {
    if (!serialConnection.isOpen()) {
      logger.warn("Serial connection not open, cannot set pin state");
      return;
    }

    // O D/A pin state ;
    // 0x4F, 0x44/0x41, pin, 0x01/0x00, 0x3B
    byte[] message = new byte[5];
    message[0] = 0x4F; // 'O'
    message[1] = isDigital ? DIGITAL : ANALOG;
    message[2] = (byte) pin;
    message[3] = isHigh ? (byte) 1 : (byte) 0;
    message[4] = TERMINATOR;

    try {
      serialConnection.writeData(message);
      logger.info("Sent Output Command - Type: {}, Pin: {}, State: {}", (isDigital ? "Digital" : "Analog"), pin,
          (isHigh ? "High" : "Low"));
    } catch (IOException e) {
      logger.error("Failed to send output command", e);
    }
  }

  private void processData() {
    while (rxBuffer.size() > 0) {
      byte opcode = rxBuffer.peek(0);
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
        default:
          // Unknown opcode, skip one byte to resync
          logger.warn("Unknown opcode: {}, skipping one byte to resync", String.format("0x%02X", opcode));
          rxBuffer.get();
          continue;
      }

      if (rxBuffer.size() < messageLength) {
        // Not enough data yet, wait for more
        break;
      }

      // Check terminator
      if (rxBuffer.peek(messageLength - 1) != TERMINATOR) {
        // Invalid message (bad terminator), skip one byte to resync
        logger.error("Invalid message (bad terminator) for opcode {}, skipping one byte",
            String.format("0x%02X", opcode));
        rxBuffer.get();
        continue;
      }

      // Valid message, read it
      byte[] message = rxBuffer.read(messageLength);
      handleMessage(message);
    }
  }

  private void handleMessage(byte[] message) {
    byte opcode = message[0];

    if (!versionVerified && opcode != OPCODE_VERSION) {
      return;
    }

    switch (opcode) {
      case OPCODE_HEARTBEAT:
        long timeInUse = ((long) (message[1] & 0xFF) << 24) |
            ((long) (message[2] & 0xFF) << 16) |
            ((long) (message[3] & 0xFF) << 8) |
            ((long) (message[4] & 0xFF));
        byte isReset = message[5];
        onHeartbeat(timeInUse, isReset);
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
      default:
        logger.error("Unknown opcode: {}", opcode);
        break;
    }
  }

  private void onHeartbeat(long timeInUse, byte isReset) {
    lastHeartbeatTimeMs = now();
    // Heartbeats are frequent, so maybe use debug? But user asked for logs when
    // data
    // received.
    // Keeping as info for now based on request, but might be noisy.
    // Actually, "recieves data that it understands as a messg" implies meaningful
    // messages.
    // Heartbeat is frequent, let's use DEBUG to avoid flooding logs, unless it's a
    // reset/mismatch.
    logger.debug("Received Heartbeat - Time: {}us, Reset: {}", timeInUse, isReset);

    if (isReset == hwReset) {
      hwReset = 0;
      for (int i = 0; i < numLanes; i++) {
        hwLapTime[i].Add(timeInUse);
        hwSegmentTime[i].Add(timeInUse);
      }
    } else {
      logger.warn("Received Heartbeat - Reset mismatch: got {}, expected {}", isReset, hwReset);
    }
  }

  private void onVersion(int major, int minor, int patch, int build) {
    if (!versionVerified) {
      // Note: Not checking build number as it changes frequently and indicates
      // backwards compatibility with previous versions.
      if (major == 1 && minor == 0 && patch == 0) {
        versionVerified = true;
        logger.info("Version verified - {}.{}.{}.{}", major, minor, patch, build);
        sendPinModeRead();
        sendPinModeWrite();
        sendDebounce();
        sendTimeReset();
      } else {
        logger.error("Invalid firmware version: {}.{}.{}", major, minor, patch);
      }
    }
  }

  private void sendPinModeRead() {
    sendPinMode((byte) 0x49, true);
  }

  private void sendPinModeWrite() {
    sendPinMode((byte) 0x4F, false);
  }

  private void sendPinMode(byte opcode, boolean isRead) {
    int digitalCount = 0;
    if (config.digitalIds != null) {
      for (int id : config.digitalIds) {
        if (id < 0) {
          throw new IllegalArgumentException("Invalid pin ID: " + id);
        }

        if (isRead ? ArduinoConfig.isReadPin(id) : ArduinoConfig.isWritePin(id)) {
          digitalCount++;
        }
      }
    }

    int analogCount = 0;
    if (config.analogIds != null) {
      for (int id : config.analogIds) {
        if (id < 0) {
          throw new IllegalArgumentException("Invalid pin ID: " + id);
        }
        if (isRead ? ArduinoConfig.isReadPin(id) : ArduinoConfig.isWritePin(id)) {
          analogCount++;
        }
      }
    }

    int totalPins = digitalCount + analogCount;
    // P + I/O + Count + (Type + Pin) * totalPins + Terminator
    byte[] message = new byte[3 + (totalPins * 2) + 1];

    int idx = 0;
    message[idx++] = 0x50; // 'P'
    message[idx++] = opcode;
    message[idx++] = (byte) totalPins;

    if (config.digitalIds != null) {
      for (int i = 0; i < config.digitalIds.size(); i++) {
        int id = config.digitalIds.get(i);
        if (isRead ? ArduinoConfig.isReadPin(id) : ArduinoConfig.isWritePin(id)) {
          message[idx++] = DIGITAL;
          message[idx++] = (byte) i;
        }
      }
    }

    if (config.analogIds != null) {
      for (int i = 0; i < config.analogIds.size(); i++) {
        int id = config.analogIds.get(i);
        if (isRead ? ArduinoConfig.isReadPin(id) : ArduinoConfig.isWritePin(id)) {
          message[idx++] = ANALOG;
          message[idx++] = (byte) i;
        }
      }
    }

    message[idx++] = TERMINATOR;

    try {
      serialConnection.writeData(message);
      logger.info("Sent PIN_MODE {}", (isRead ? "READ" : "WRITE"));
    } catch (IOException e) {
      logger.error("Failed to send PIN_MODE {}", (isRead ? "READ" : "WRITE"), e);
    }
  }

  private void sendDebounce() {
    // private byte[] DEBOUNCE_COMMAND = { 0x64, 0x0, 0x0, 0x0, 0x0, 0x3B }; // d
    // Hms Hus Lms Lus ;
    byte[] message = new byte[6];
    message[0] = 0x64; // 'd'
    message[1] = (byte) (config.debounceUs / 1000); // Hms
    message[2] = (byte) ((config.debounceUs % 1000) / 4); // Hus
    message[3] = message[1]; // Lms
    message[4] = message[2]; // Lus
    message[5] = TERMINATOR;

    try {
      serialConnection.writeData(message);
      logger.info("Sent DEBOUNCE");
    } catch (IOException e) {
      logger.error("Failed to send DEBOUNCE", e);
    }
  }

  private void sendTimeReset() {
    try {
      serialConnection.writeData(TIME_RESET_COMMAND);
      logger.info("Sent TIME_RESET");
    } catch (IOException e) {
      logger.error("Failed to send TIME_RESET", e);
    }
  }

  private void onInput(boolean isDigital, int pin, int state) {
    String key = (isDigital ? "D" : "A") + pin;
    PinConfig pinConfig = pinLookup.get(key);

    if (pinConfig != null) {
      logger.info("Received Input - Behavior: {}, Lane: {}, Pin: {}, State: {}", pinConfig.behavior,
          pinConfig.laneIndex, pin, state);

      int interfaceId = (isDigital ? PinId.PIN_ID_DIGITAL_BASE_VALUE : PinId.PIN_ID_ANALOG_BASE_VALUE) + pin;

      switch (pinConfig.behavior) {
        case LAP_COUNTER:
          onLapCounter(pinConfig.laneIndex, state, interfaceId);
          break;
        case SEGMENT_COUNTER:
          onSegmentCounter(pinConfig.laneIndex, state, interfaceId);
          break;
        case CALL_BUTTON:
          onCallButton(pinConfig.laneIndex, state);
          break;
        case RESERVED:
          // Ignore
          break;
        default:
          logger.warn("Received Unknown Input - Behavior: {}, Lane: {}, Pin: {}, State: {}", pinConfig.behavior,
              pinConfig.laneIndex, pin, state);
          break;
      }
    } else {
      logger.info("Received Input - Type: {}, Pin: {}, State: {}", (isDigital ? "Digital" : "Analog"), pin, state);
    }
  }

  private void onLapCounter(int laneIndex, int state, int interfaceId) {
    logger.debug("Received Lap Counter - Lane: {}, State: {}", laneIndex, state);

    if (laneIndex < hwLapTime.length) {
      byte wantState = 1;
      if (config.globalInvertLanes != 0) {
        wantState = 0;
      }

      if (state == wantState) {
        // Lap
        double time = hwLapTime[laneIndex].Time();

        // Subtract the hw debounce time from our time
        time -= (config.debounceUs / (1000.0 * 1000.0));

        logger.info("Handling Lap - Lane: {}, Time: {}", laneIndex, time);
        if (listener != null) {
          // TODO(aufderheide):
          // We need to know how to hanle false starts. Maybe do not
          // send the lap, but send a 0 time CarData?
          listener.onLap(laneIndex, time, interfaceId);

          if (time > 0) {
            listener.onCarData(new CarData(laneIndex, time, 1, 1, false, CarLocation.Main, CarLocation.Main, -1));
          }
        }
      }
    } else {
      logger.warn("Bad lane for lap data: {}", (laneIndex + 1));
    }
  }

  private void onSegmentCounter(int laneIndex, int state, int interfaceId) {
    logger.info("Received Segment Counter - Lane: {}, State: {}", laneIndex, state);
    if (listener != null) {
      listener.onSegment(laneIndex, 0.0, interfaceId);
    }
  }

  private void onCallButton(int laneIndex, int state) {
    logger.info("Received Call Button - Lane: {}, State: {}", laneIndex, state);
    if (listener != null) {
      listener.onCallbutton(laneIndex);
    }
  }

  private void buildPinLookup() {
    pinLookup = new HashMap<>();
    addPinConfigs(config.digitalIds, true);
    addPinConfigs(config.analogIds, false);
  }

  private void addPinConfigs(List<Integer> ids, boolean isDigital) {
    if (ids == null) {
      return;
    }

    for (int i = 0; i < ids.size(); i++) {
      int code = ids.get(i);
      if (code == -1) {
        continue;
      }

      InputBehavior behavior = null;
      int laneIndex = -1;

      if (code >= PinBehavior.BEHAVIOR_LAP_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + numLanes) {
        behavior = InputBehavior.LAP_COUNTER;
        laneIndex = code - PinBehavior.BEHAVIOR_LAP_BASE.getNumber();
      } else if (code >= PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + numLanes) {
        behavior = InputBehavior.SEGMENT_COUNTER;
        laneIndex = code - PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber();
      } else if (code >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber()
          && code < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + numLanes) {
        behavior = InputBehavior.CALL_BUTTON;
        laneIndex = code - PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber();
      } else if (code == PinBehavior.BEHAVIOR_CALL_BUTTON.getNumber()) {
        behavior = InputBehavior.CALL_BUTTON;
      } else if (code == PinBehavior.BEHAVIOR_RESERVED.getNumber()) {
        behavior = InputBehavior.RESERVED;
      } else if (code == PinBehavior.BEHAVIOR_RELAY.getNumber()) {
        behavior = InputBehavior.MAIN_RELAY;
      } else if (code >= PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() &&
          code < PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + numLanes) {
        behavior = InputBehavior.LANE_RELAY;
        laneIndex = code - PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
      }

      if (behavior != null) {
        pinLookup.put((isDigital ? "D" : "A") + i, new PinConfig(laneIndex, isDigital, i, behavior));
      }
    }
  }

  private enum InputBehavior {
    LAP_COUNTER,
    SEGMENT_COUNTER,
    CALL_BUTTON,
    MAIN_RELAY,
    LANE_RELAY,
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
    if (this.config.digitalIds.stream().anyMatch(id -> id >= PinBehavior.BEHAVIOR_RELAY_BASE.getNumber()
        && id < PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + numLanes)) {
      return true;
    }

    if (this.config.analogIds.stream().anyMatch(id -> id >= PinBehavior.BEHAVIOR_RELAY_BASE.getNumber()
        && id < PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + numLanes)) {
      return true;
    }

    return false;
  }

  @Override
  public boolean hasMainRelay() {
    if (this.config.digitalIds.stream().anyMatch(
        id -> id == PinBehavior.BEHAVIOR_RELAY.getNumber())) {
      return true;
    }

    if (this.config.analogIds.stream().anyMatch(
        id -> id == PinBehavior.BEHAVIOR_RELAY.getNumber())) {
      return true;
    }

    return false;
  }

  @Override
  public void setMainPower(boolean on) {
    if (pinLookup == null) {
      return;
    }

    for (PinConfig pinConfig : pinLookup.values()) {
      if (pinConfig.behavior == InputBehavior.MAIN_RELAY) {
        setPinState(pinConfig.isDigital, pinConfig.pin, on);
      }
    }
  }

  @Override
  public void setLanePower(boolean on, int lane) {
    if (pinLookup == null) {
      return;
    }

    for (PinConfig pinConfig : pinLookup.values()) {
      if (pinConfig.behavior == InputBehavior.LANE_RELAY && pinConfig.laneIndex == lane) {
        setPinState(pinConfig.isDigital, pinConfig.pin, on);
      }
    }
  }
}
