package com.antigravity.protocols.arduino;

import java.util.List;

import com.antigravity.models.Lane;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.antigravity.util.CircularBuffer;
import java.io.IOException;

public class ArduinoProtocol extends DefaultProtocol {
  private Config config;
  private List<Lane> lanes;

  private SerialConnection serialConnection;
  private CircularBuffer rxBuffer;
  private boolean versionVerified = false;

  public ArduinoProtocol(Config config, List<Lane> lanes) {
    super(lanes.size());
    this.config = config;
    this.lanes = lanes;

    serialConnection = new SerialConnection();
    rxBuffer = new CircularBuffer(4096);
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

  // Data sent from PC to Arduino
  private static final byte[] RESET_COMMAND = { 0x52, 0x45, 0x53, 0x45, 0x54, 0x3B }; // RESET;

  // Data sent from Arduino to PC
  private static final byte OPCODE_HEARTBEAT = 0x54; // 'T'
  private static final byte OPCODE_VERSION = 0x56; // 'V'
  private static final byte OPCODE_INPUT = 0x49; // 'I'
  private static final byte TERMINATOR = 0x3B; // ';'
  private static final byte DIGITAL = 0x44; // 'D'
  private static final byte ANALOG = 0x41; // 'A'

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
        boolean isReset = message[5] != 0;
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

  private void onHeartbeat(long timeInUse, boolean isReset) {
    System.out.println("ArduinoProtocol: Received Heartbeat - Time: " + timeInUse + "us, Reset: " + isReset);
  }

  private void onVersion(int major, int minor, int patch, int build) {
    if (!versionVerified) {
      if (major == 1 && minor == 0 && patch == 0) {
        versionVerified = true;
        System.out.println("ArduinoProtocol: Version verified - " + major + "." + minor + "." + patch + "." + build);
      } else {
        System.err.println("ArduinoProtocol: Invalid firmware version: " + major + "." + minor + "." + patch);
      }
    }
  }

  private void onInput(boolean isDigital, int pin, int state) {
    System.out.println("ArduinoProtocol: Received Input - Type: " + (isDigital ? "Digital" : "Analog") +
        ", Pin: " + pin + ", State: " + state);
  }
}
