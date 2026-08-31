package com.antigravity.protocols.bart;

import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.InterfaceStatusEvent;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.antigravity.protocols.interfaces.BleConnection;
import com.antigravity.protocols.interfaces.ConnectionDataListener;
import com.antigravity.protocols.interfaces.IConnection;
import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

public class BartProtocol extends DefaultProtocol implements ConnectionDataListener {

  private final BartConfig config;
  private IConnection connection;

  // Packet headers & types
  public static final byte SYNC_BYTE = (byte) 0xA5;
  public static final byte TYPE_LAP_EVENT = 0x01;
  public static final byte TYPE_STATUS_SNAPSHOT = 0x20;
  public static final byte TYPE_ACK = 0x7F;
  public static final byte TYPE_COMMAND = (byte) 0x90;

  // Opcodes
  public static final byte OP_START = 0x01;
  public static final byte OP_STOP = 0x02;
  public static final byte OP_SET_MINLAP = 0x10;
  public static final byte OP_READ_STAT = 0x20;

  public BartProtocol(BartConfig config, int numLanes) {
    this(
        config,
        numLanes,
        new BleConnection(config.deviceName, config.deviceAddress),
        Executors.newScheduledThreadPool(1));
  }

  public BartProtocol(
      BartConfig config,
      int numLanes,
      IConnection connection,
      ScheduledExecutorService statusScheduler) {
    super(numLanes);
    this.config = config;
    this.connection =
        connection != null
            ? connection
            : new BleConnection(config.deviceName, config.deviceAddress);
    this.statusScheduler =
        statusScheduler != null ? statusScheduler : Executors.newScheduledThreadPool(1);
    this.detectedChannels = numLanes;
    this.connection.addDataListener(this);
  }

  @Override
  public synchronized boolean open() {
    if (connection != null && connection.isOpen()) {
      logger.info("BartProtocol connection already open");
      return true;
    }

    String target =
        config.deviceAddress != null && !config.deviceAddress.isEmpty()
            ? config.deviceAddress
            : config.deviceName;

    if (target == null || target.isEmpty()) {
      logger.info("No BLE device specified for BartProtocol, status DISCONNECTED");
      if (listener != null) {
        listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, getInterfaceIndex());
      }
      startStatusScheduler();
      return true;
    }

    try {
      logger.info("Connecting to BART BLE peripheral: {}", target);
      connection.connect(target);
      lastHeartbeatTimeMs = now();
      if (listener != null) {
        listener.onInterfaceStatus(InterfaceStatus.CONNECTED, getInterfaceIndex());
      }
      sendMinLap(config.minLapMs);
      sendReadStatus();
      startStatusScheduler();
      return true;
    } catch (IOException e) {
      logger.error("Failed to connect to BART peripheral {}: {}", target, e.getMessage());
      if (listener != null) {
        listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, getInterfaceIndex());
      }
      return false;
    }
  }

  @Override
  public void close() {
    logger.info("Closing BartProtocol");
    super.close();
    if (connection != null && connection.isOpen()) {
      try {
        sendStop();
      } catch (Exception ignored) {
      }
      connection.disconnect();
    }
    lastHeartbeatTimeMs = 0;
  }

  @Override
  public void onDataReceived(byte[] data) {
    if (data != null && data.length > 0) {
      logger.info("BART Raw RX {} bytes: {}", data.length, bytesToHex(data));
      lastHeartbeatTimeMs = now();
      rxBuffer.write(data);
      processData();
    }
  }

  private void processData() {
    while (rxBuffer.size() >= 4) {
      // Find SYNC byte 0xA5
      byte b = rxBuffer.peek(0);
      if (b != SYNC_BYTE) {
        rxBuffer.get(); // Discard unaligned byte
        continue;
      }

      byte msgType = rxBuffer.peek(1);
      int packetLen = getExpectedPacketLength(msgType);
      if (packetLen < 4 || rxBuffer.size() < packetLen) {
        // Wait for full packet to arrive or unknown type discard
        if (packetLen == -1) {
          rxBuffer.get(); // Discard corrupted sync
        }
        break;
      }

      byte[] packet = rxBuffer.read(packetLen);

      logger.info(
          "BART Packet Received - Type: 0x{} ({}), Length: {}, Bytes: {}",
          String.format("%02X", msgType),
          getPacketTypeName(msgType),
          packetLen,
          bytesToHex(packet));

      // Verify CRC8
      byte computedCrc = BartCrc.calculateCrc(packet, 0, packetLen - 1);
      byte actualCrc = packet[packetLen - 1];

      if (computedCrc != actualCrc) {
        logger.warn(
            "CRC error in BART packet: computed=0x{}, actual=0x{}, packet={}",
            String.format("%02X", computedCrc),
            String.format("%02X", actualCrc),
            bytesToHex(packet));
        continue;
      }

      handlePacket(packet, msgType);
    }
  }

  private int getExpectedPacketLength(byte msgType) {
    switch (msgType) {
      case TYPE_LAP_EVENT:
        return 10; // A5 01 01 lane laps lap_ms_low lap_ms_high ts_d10 reserved CRC
      case TYPE_STATUS_SNAPSHOT:
        return 9; // A5 20 01 race_state minlap uptime_d10 lanes reserved CRC
      case TYPE_ACK:
        return 5; // A5 7F op status CRC
      default:
        return -1;
    }
  }

  private void handlePacket(byte[] packet, byte msgType) {
    lastHeartbeatTimeMs = now();

    if (msgType == TYPE_LAP_EVENT) {
      int rawLane = packet[3] & 0xFF;
      int lapCount = packet[4] & 0xFF;
      int lapMs = (packet[5] & 0xFF) | ((packet[6] & 0xFF) << 8);

      logger.info(
          "BART Lap Event - Raw Lane: {}, Laps: {}, Lap Time: {} ms, Full Packet: {}",
          rawLane,
          lapCount,
          lapMs,
          bytesToHex(packet));

      int behavior = getSignalBehaviorForChannel(rawLane);
      int lapBase = PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
      int pitInBase = PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE;
      int pitOutBase = PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE;

      int activeState = isNormallyClosedLaneSensors() ? 1 : 0;
      long lapUs = (long) lapMs * 1000L;

      if (behavior >= lapBase && behavior < lapBase + getNumLanes()) {
        int mappedLane = behavior - lapBase;
        if (mappedLane >= 0 && mappedLane < getNumLanes()) {
          hwLapTime[mappedLane].add(lapUs);
          hwSegmentTime[mappedLane].add(lapUs);
        }
        handleLapCounter(mappedLane, activeState, rawLane);
      } else if (behavior >= pitInBase && behavior < pitInBase + getNumLanes()) {
        int mappedLane = behavior - pitInBase;
        handlePitIn(mappedLane, activeState);
      } else if (behavior >= pitOutBase && behavior < pitOutBase + getNumLanes()) {
        int mappedLane = behavior - pitOutBase;
        handlePitOutPulse(mappedLane);
      } else {
        logger.error(
            "Unknown BART channel behavior: {} for raw lane: {}, lapCount: {}, lapMs: {}, packet: {}",
            behavior,
            rawLane,
            lapCount,
            lapMs,
            bytesToHex(packet));
      }
    } else if (msgType == TYPE_STATUS_SNAPSHOT) {
      int raceState = packet[3] & 0xFF;
      int minLapMs = (packet[4] & 0xFF) | ((packet[5] & 0xFF) << 8);
      int activeLanes = packet[6] & 0xFF;
      int reserved = packet[7] & 0xFF;
      this.detectedChannels = activeLanes;
      logger.info(
          "BART Status Snapshot Received - Device: '{}', Race State: {}, Active Lanes (Detected Channels): {}, Min Lap: {} ms, Reserved: 0x{}, Full Packet: {}",
          config.deviceName != null ? config.deviceName : "Unknown",
          raceState,
          activeLanes,
          minLapMs,
          String.format("%02X", reserved),
          bytesToHex(packet));
      if (listener != null) {
        InterfaceStatusEvent statusEvent =
            InterfaceStatusEvent.newBuilder()
                .setStatus(InterfaceStatus.CONNECTED)
                .setInterfaceIndex(getInterfaceIndex())
                .setDetectedChannels(activeLanes)
                .build();
        listener.onInterfaceEvent(InterfaceEvent.newBuilder().setStatus(statusEvent).build());
      }
    } else if (msgType == TYPE_ACK) {
      int ackOp = packet[2] & 0xFF;
      logger.info(
          "BART ACK Received for OP 0x{} ({}) - Full Packet: {}",
          String.format("%02X", ackOp),
          getOpCodeName((byte) ackOp),
          bytesToHex(packet));
    }
  }

  private int getSignalBehaviorForChannel(int channel) {
    if (config.lapPinBehaviors != null && channel >= 0 && channel < config.lapPinBehaviors.size()) {
      return config.lapPinBehaviors.get(channel);
    }
    return PinBehavior.BEHAVIOR_LAP_BASE_VALUE + channel;
  }

  public void sendStart() {
    sendCommand(OP_START, new byte[0]);
  }

  public void sendStop() {
    sendCommand(OP_STOP, new byte[0]);
  }

  public void sendMinLap(int minLapMs) {
    byte[] payload = new byte[2];
    payload[0] = (byte) (minLapMs & 0xFF);
    payload[1] = (byte) ((minLapMs >> 8) & 0xFF);
    sendCommand(OP_SET_MINLAP, payload);
  }

  public void sendReadStatus() {
    sendCommand(OP_READ_STAT, new byte[0]);
  }

  private void sendCommand(byte opCode, byte[] payload) {
    if (connection == null || !connection.isOpen()) {
      return;
    }
    int len = 4 + (payload != null ? payload.length : 0);
    byte[] frame = new byte[len];
    frame[0] = SYNC_BYTE;
    frame[1] = TYPE_COMMAND;
    frame[2] = opCode;
    if (payload != null && payload.length > 0) {
      System.arraycopy(payload, 0, frame, 3, payload.length);
    }
    byte crc = BartCrc.calculateCrc(frame, 0, len - 1);
    frame[len - 1] = crc;

    logger.info(
        "BART TX Command OP 0x{} ({}) - Frame: {}",
        String.format("%02X", opCode),
        getOpCodeName(opCode),
        bytesToHex(frame));

    try {
      connection.writeData(frame);
    } catch (IOException e) {
      logger.error(
          "Failed to send BART command OP 0x{}: {}", String.format("%02X", opCode), e.getMessage());
    }
  }

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    super.setRaceState(state, flag, countdown);
    if (state == RaceState.RACING) {
      sendStart();
    } else if (state == RaceState.PAUSED
        || state == RaceState.RACE_OVER
        || state == RaceState.HEAT_OVER) {
      sendStop();
    }
  }

  // Base IProtocol & DefaultProtocol contract methods
  @Override
  protected boolean isNormallyClosedLaneSensors() {
    return false;
  }

  @Override
  protected boolean isNormallyClosedRelays() {
    return false;
  }

  @Override
  protected LapPinPitBehavior getLapPinPitBehavior() {
    return config.lapPinPitBehavior != null ? config.lapPinPitBehavior : LapPinPitBehavior.NONE;
  }

  @Override
  protected boolean useLapsForSegments() {
    return false;
  }

  @Override
  protected double getHardwareDebounceUs() {
    return 0.0;
  }

  @Override
  public boolean hasPitInConfigured(int laneIndex) {
    if (config != null && config.lapPinBehaviors != null) {
      int pitIn = PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + laneIndex;
      int pitInOut = PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE + laneIndex;
      for (Integer behavior : config.lapPinBehaviors) {
        if (behavior != null && (behavior == pitIn || behavior == pitInOut)) {
          return true;
        }
      }
    }
    return false;
  }

  @Override
  protected boolean isConnected() {
    return connection != null && connection.isOpen();
  }

  private static String bytesToHex(byte[] bytes) {
    if (bytes == null) return "";
    StringBuilder sb = new StringBuilder();
    for (byte b : bytes) {
      sb.append(String.format("%02X ", b));
    }
    return sb.toString().trim();
  }

  private String getOpCodeName(byte opCode) {
    switch (opCode) {
      case OP_START:
        return "START";
      case OP_STOP:
        return "STOP";
      case OP_SET_MINLAP:
        return "SET_MINLAP";
      case OP_READ_STAT:
        return "READ_STAT";
      default:
        return "UNKNOWN_OP";
    }
  }

  private String getPacketTypeName(byte msgType) {
    switch (msgType) {
      case TYPE_LAP_EVENT:
        return "LAP_EVENT";
      case TYPE_STATUS_SNAPSHOT:
        return "STATUS_SNAPSHOT";
      case TYPE_ACK:
        return "ACK";
      default:
        return "UNKNOWN_TYPE";
    }
  }

  @Override
  protected void checkAndPublishStatus() {
    if (isConnected()) {
      sendReadStatus();
    }
    super.checkAndPublishStatus();
  }

  @Override
  public boolean requiresHeartbeat() {
    return true;
  }
}
