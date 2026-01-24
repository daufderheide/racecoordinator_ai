package com.antigravity.protocols.arduino;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;

import com.antigravity.models.Lane;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.PartialTime;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.antigravity.util.CircularBuffer;
import java.io.IOException;

public class ArduinoProtocol extends DefaultProtocol {
  private Config config;
  private List<Lane> lanes;

  private SerialConnection serialConnection;
  private CircularBuffer rxBuffer;
  private boolean versionVerified = false;
  private Map<String, PinConfig> pinLookup;

  private HwTime[] hwLapTime;
  private HwTime[] hwSegmentTime;
  private byte hwReset;

  // Not lane specific
  private static final int BEHAVIOR_CALL_BUTTON = 1;

  // Lane specific
  private static final int BEHAVIOR_MAX_RANGE = 999;
  private static final int BEHAVIOR_LAP_BASE = 1000;
  private static final int BEHAVIOR_SEGMENT_BASE = 2000;
  private static final int BEHAVIOR_CALL_BUTTON_BASE = 3000;

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

  public ArduinoProtocol(Config config, List<Lane> lanes) {
    super(lanes.size());
    this.config = config;
    this.lanes = lanes;

    serialConnection = new SerialConnection();
    rxBuffer = new CircularBuffer(4096);
    buildPinLookup();

    // Initialize the hardware timing.
    hwLapTime = new HwTime[lanes.size()];
    hwSegmentTime = new HwTime[lanes.size()];
    for (int i = 0; i < lanes.size(); i++) {
      hwLapTime[i] = new HwTime();
      hwSegmentTime[i] = new HwTime();
    }
    hwReset = 1;
  }

  @Override
  public boolean open() {
    try {
      serialConnection.connect(config.commPort, config.baudRate);

      serialConnection.addListener(new com.fazecast.jSerialComm.SerialPortDataListener() {
        @Override
        public int getListeningEvents() {
          return com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_AVAILABLE;
        }

        public void serialEvent(com.fazecast.jSerialComm.SerialPortEvent event) {
          if (event.getEventType() != com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_AVAILABLE) {
            return;
          }

          byte[] data = event.getReceivedData();
          if (data != null && data.length > 0) {
            rxBuffer.write(data);
            processData();
          }
        }
      });

      serialConnection.writeData(RESET_COMMAND);

      return true;
    } catch (IOException e) {
      return false;
    }
  }

  @Override
  public void startTimer() {
    sendTimeReset();
    for (int i = 0; i < lanes.size(); i++) {
      hwLapTime[i].Reset();
      hwSegmentTime[i].Reset();
    }
    hwReset = 1;
  }

  @Override
  public List<PartialTime> stopTimer() {
    List<PartialTime> partialTimes = new ArrayList<>();
    for (int i = 0; i < lanes.size(); i++) {
      partialTimes.add(new PartialTime(i, hwLapTime[i].Time(), hwSegmentTime[i].Time()));
    }
    return partialTimes;
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
          // TODO(aufderheide): Add warning log when this happens.
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
        // TODO(aufderheide): Add error log when this happens.
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
        System.err.println("ArduinoProtocol: Unknown opcode: " + opcode);
        break;
    }
  }

  private void onHeartbeat(long timeInUse, byte isReset) {
    System.out.println("ArduinoProtocol: Received Heartbeat - Time: " + timeInUse + "us, Reset: " + isReset);

    if (isReset == hwReset) {
      hwReset = 0;
      for (int i = 0; i < lanes.size(); i++) {
        hwLapTime[i].Add(timeInUse);
        hwSegmentTime[i].Add(timeInUse);
      }
    } else {
      System.err.println("ArduinoProtocol: Received Heartbeat - Reset mismatch: " + isReset + " != " + hwReset);
    }
  }

  private void onVersion(int major, int minor, int patch, int build) {
    if (!versionVerified) {
      if (major == 1 && minor == 0 && patch == 0) {
        versionVerified = true;
        System.out.println("ArduinoProtocol: Version verified - " + major + "." + minor + "." + patch + "." + build);
        sendPinModeRead();
      } else {
        System.err.println("ArduinoProtocol: Invalid firmware version: " + major + "." + minor + "." + patch);
      }
    }
  }

  private void sendPinModeRead() {
    int digitalCount = 0;
    if (config.digitalIds != null) {
      for (int id : config.digitalIds) {
        if (id != -1) {
          digitalCount++;
        }
      }
    }

    int analogCount = 0;
    if (config.analogIds != null) {
      for (int id : config.analogIds) {
        if (id != -1) {
          analogCount++;
        }
      }
    }

    int totalPins = digitalCount + analogCount;
    // P + I + Count + (Type + Pin) * totalPins + Terminator
    byte[] message = new byte[3 + (totalPins * 2) + 1];

    int idx = 0;
    message[idx++] = 0x50; // 'P'
    message[idx++] = 0x49; // 'I'
    message[idx++] = (byte) totalPins;

    if (config.digitalIds != null) {
      for (int i = 0; i < config.digitalIds.length; i++) {
        if (config.digitalIds[i] != -1) {
          message[idx++] = DIGITAL;
          message[idx++] = (byte) i;
        }
      }
    }

    if (config.analogIds != null) {
      for (int i = 0; i < config.analogIds.length; i++) {
        if (config.analogIds[i] != -1) {
          message[idx++] = ANALOG;
          message[idx++] = (byte) i;
        }
      }
    }

    message[idx++] = TERMINATOR;

    try {
      serialConnection.writeData(message);
    } catch (IOException e) {
      System.err.println("ArduinoProtocol: Failed to send PIN_MODE_READ");
      e.printStackTrace();
    }
  }

  private void sendTimeReset() {
    try {
      serialConnection.writeData(TIME_RESET_COMMAND);
    } catch (IOException e) {
      System.err.println("ArduinoProtocol: Failed to send TIME_RESET");
      e.printStackTrace();
    }
  }

  private void onInput(boolean isDigital, int pin, int state) {
    String key = (isDigital ? "D" : "A") + pin;
    PinConfig pinConfig = pinLookup.get(key);

    if (pinConfig != null) {
      System.out.println("ArduinoProtocol: Received Input - Behavior: " + pinConfig.behavior +
          ", Lane: " + pinConfig.laneIndex + ", Pin: " + pin + ", State: " + state);
      switch (pinConfig.behavior) {
        case LAP_COUNTER:
          onLapCounter(pinConfig.laneIndex, state);
          break;
        case SEGMENT_COUNTER:
          onSegmentCounter(pinConfig.laneIndex, state);
          break;
        case CALL_BUTTON:
          onCallButton(pinConfig.laneIndex, state);
          break;
      }
    } else {
      System.out.println("ArduinoProtocol: Received Input - Type: " + (isDigital ? "Digital" : "Analog") +
          ", Pin: " + pin + ", State: " + state);
    }
  }

  private void onLapCounter(int laneIndex, int state) {
    System.out.println("ArduinoProtocol: Received Lap Counter - Lane: " + laneIndex + ", State: " + state);

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

        System.out.println("ArduinoProtocol: Handling Lap - Lane: " + laneIndex + ", Time: " + time);
        if (listener != null) {
          // TODO(aufderheide):
          // We need to know how to hanle false starts. Maybe do not
          // send the lap, but send a 0 time CarData?
          listener.onLap(laneIndex, time);

          if (time > 0) {
            listener.onCarData(new CarData(laneIndex, time, 1, 1, false, CarLocation.Main, CarLocation.Main, -1));
          }
        }
      }
    } else {
      System.out.println("ArduinoProtocol: Bad lane for lap data: " + (laneIndex + 1));
    }
  }

  private void onSegmentCounter(int laneIndex, int state) {
    System.out.println("ArduinoProtocol: Received Segment Counter - Lane: " + laneIndex + ", State: " + state);
  }

  private void onCallButton(int laneIndex, int state) {
    System.out.println("ArduinoProtocol: Received Call Button - Lane: " + laneIndex + ", State: " + state);
  }

  private void buildPinLookup() {
    pinLookup = new HashMap<>();
    addPinConfigs(config.digitalIds, true);
    addPinConfigs(config.analogIds, false);
  }

  private void addPinConfigs(int[] ids, boolean isDigital) {
    if (ids == null) {
      return;
    }

    for (int i = 0; i < ids.length; i++) {
      int code = ids[i];
      if (code == -1) {
        continue;
      }

      InputBehavior behavior = null;
      int laneIndex = -1;

      if (code >= BEHAVIOR_LAP_BASE && code <= BEHAVIOR_LAP_BASE + BEHAVIOR_MAX_RANGE) {
        behavior = InputBehavior.LAP_COUNTER;
        laneIndex = code - BEHAVIOR_LAP_BASE;
      } else if (code >= BEHAVIOR_SEGMENT_BASE && code <= BEHAVIOR_SEGMENT_BASE + BEHAVIOR_MAX_RANGE) {
        behavior = InputBehavior.SEGMENT_COUNTER;
        laneIndex = code - BEHAVIOR_SEGMENT_BASE;
      } else if (code >= BEHAVIOR_CALL_BUTTON_BASE && code <= BEHAVIOR_CALL_BUTTON_BASE + BEHAVIOR_MAX_RANGE) {
        behavior = InputBehavior.CALL_BUTTON;
        laneIndex = code - BEHAVIOR_CALL_BUTTON_BASE;
      } else if (code == BEHAVIOR_CALL_BUTTON) {
        behavior = InputBehavior.CALL_BUTTON;
      }

      if (behavior != null) {
        pinLookup.put(isDigital ? "D" : "A" + i, new PinConfig(laneIndex, isDigital, i, behavior));
      }
    }
  }

  private enum InputBehavior {
    LAP_COUNTER,
    SEGMENT_COUNTER,
    CALL_BUTTON
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
}
