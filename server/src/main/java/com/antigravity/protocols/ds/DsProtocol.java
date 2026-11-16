package com.antigravity.protocols.ds;

import com.antigravity.protocols.AbstractSerialProtocol;
import com.antigravity.protocols.PartialTime;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.interfaces.ISerialConnection;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ScheduledExecutorService;

public class DsProtocol extends AbstractSerialProtocol {

  private static final int INCOMING_SIZE_ = 21;
  private static final int INCOMING_SIZE_DS30_ = 4;
  private static final int MAX_LANES = 8;

  private DsConfig config;
  private byte[] currentPacket;
  private byte[] lastProcessedPacket;
  private int dataCount = 0;
  private int incomingSize;
  private int ds30LaneNumber = -1;

  public DsProtocol(DsConfig config, int numLanes) {
    this(config, numLanes, null, null);
  }

  public DsProtocol(
      DsConfig config,
      int numLanes,
      ISerialConnection serialConnection,
      ScheduledExecutorService statusScheduler) {
    super(numLanes > 0 ? numLanes : MAX_LANES, serialConnection, statusScheduler);
    this.config = config != null ? config : new DsConfig();
    initBuffers();
    logger.info(
        "DsProtocol initialized: type={}, port={}, baud={}, lanes={}",
        this.config.getType(),
        this.config.getCommPort(),
        this.config.getBaudRate(),
        getNumLanes());
  }

  private void initBuffers() {
    this.dataCount = 0;
    this.lastProcessedPacket = null;
    if (this.config.isDs030()) {
      this.incomingSize = 1;
      this.ds30LaneNumber = -1;
      this.currentPacket = new byte[INCOMING_SIZE_DS30_];
    } else {
      this.incomingSize = INCOMING_SIZE_;
      this.currentPacket = new byte[INCOMING_SIZE_];
    }
  }

  public DsConfig getConfig() {
    return config;
  }

  public synchronized void updateConfig(DsConfig newConfig) {
    if (newConfig == null) {
      return;
    }
    boolean needReconnect =
        !Objects.equals(this.config.getCommPort(), newConfig.getCommPort())
            || this.config.getBaudRate() != newConfig.getBaudRate();
    boolean typeChanged = this.config.getType() != newConfig.getType();

    logger.info(
        "DsProtocol.updateConfig: newType={}, newPort={}, newBaud={}, needReconnect={}",
        newConfig.getType(),
        newConfig.getCommPort(),
        newConfig.getBaudRate(),
        needReconnect);

    this.config = newConfig;

    if (typeChanged) {
      initBuffers();
    }

    if (needReconnect && isConnected()) {
      logger.info(
          "Reconnecting DsProtocol due to config change (port/baud rate changed to {} @ {} baud)",
          this.config.getCommPort(),
          this.config.getBaudRate());
      close();
      open();
    }
  }

  @Override
  protected String getCommPort() {
    return config != null ? config.getCommPort() : "";
  }

  @Override
  protected int getBaudRate() {
    return config != null ? config.getBaudRate() : 57600;
  }

  @Override
  protected void onPortConnected() {
    logger.info(
        "DsProtocol connected to {} at {} baud (type={})",
        getCommPort(),
        getBaudRate(),
        config.getType());
    initBuffers();
    lastHeartbeatTimeMs = now();
  }

  @Override
  protected void sendTimeReset() {
    logger.trace("DsProtocol.sendTimeReset called (hardware is transmit-only, no-op)");
  }

  @Override
  public boolean canManualStart() {
    return false;
  }

  @Override
  public boolean canManualPause() {
    return false;
  }

  @Override
  public boolean canManualRestart() {
    return false;
  }

  @Override
  protected boolean requiresHeartbeat() {
    return false;
  }

  @Override
  public boolean hasPerLaneRelays() {
    return false;
  }

  @Override
  public boolean hasMainRelay() {
    return false;
  }

  @Override
  public boolean hasDigitalFuel() {
    return false;
  }

  @Override
  public boolean hasPitInConfigured(int laneIndex) {
    return false;
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
  protected ArduinoConfig.LapPinPitBehavior getLapPinPitBehavior() {
    return ArduinoConfig.LapPinPitBehavior.NONE;
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
  public List<PartialTime> stopTimer() {
    logger.info("DsProtocol.stopTimer called");
    return new ArrayList<>();
  }

  @Override
  protected void processData() {
    while (rxBuffer.size() > 0) {
      byte b = rxBuffer.get();
      lastHeartbeatTimeMs = now();

      if (logger.isTraceEnabled()) {
        logger.trace(
            "DsProtocol rx byte: 0x{} (dataCount={}, incomingSize={})",
            String.format("%02X", b & 0xFF),
            dataCount,
            incomingSize);
      }

      if (!config.isDs030()) {
        // Framing synchronization: first byte must be 0xE0
        if (dataCount == 0 && (b & 0xFF) != 0xE0) {
          logger.trace(
              "DsProtocol skipping out-of-sync byte 0x{} waiting for 0xE0 start delimiter",
              String.format("%02X", b & 0xFF));
          continue;
        }

        currentPacket[dataCount] = b;
        dataCount++;

        if (dataCount == incomingSize) {
          handlePacket();
          dataCount = 0;
        }
      } else {
        // DS030 dynamic packet handling
        currentPacket[dataCount] = b;
        dataCount++;

        if (dataCount == incomingSize) {
          handlePacketDS30();
          dataCount = 0;
        }
      }
    }
  }

  private void handlePacket() {
    if (logger.isDebugEnabled()) {
      StringBuilder hex = new StringBuilder();
      for (int i = 0; i < incomingSize; i++) {
        hex.append(String.format("%02X ", currentPacket[i] & 0xFF));
      }
      logger.debug("DSxxx Packet Received: (DR) --> '{}'", hex.toString().trim());
    }

    validatePacketIntegrity();

    if (lastProcessedPacket != null && Arrays.equals(currentPacket, lastProcessedPacket)) {
      logger.debug("DSxxx duplicate packet ignored (matches previous data word)");
      return;
    }

    int hardwareType = currentPacket[3] & 0xFF;
    if (hardwareType == 2) {
      logger.debug("DSxxx Packet identified as DS200");
    } else if (hardwareType == 3) {
      logger.debug("DSxxx Packet identified as DS300");
    } else {
      logger.debug("DSxxx Packet identified as type 0x{}", Integer.toHexString(hardwareType));
    }

    int dataType = currentPacket[7] & 0xFF;
    switch (dataType) {
      case 0x00:
        int functionType = currentPacket[8] & 0xFF;
        handleFunctionEvent(functionType);
        break;

      case 0x1B:
        logger.info("DSxxx Timing data packet received");
        handleLap();
        break;

      case 0x1C:
        logger.info("DSxxx Final record data packet received");
        break;

      default:
        logger.debug("DSxxx Other data type received: 0x{}", String.format("%02X", dataType));
        break;
    }

    lastProcessedPacket = Arrays.copyOf(currentPacket, currentPacket.length);
  }

  private void validatePacketIntegrity() {
    int checksum = 0;
    for (int i = 1; i < 18; i++) {
      checksum += (currentPacket[i] & 0xFF);
    }
    checksum += (currentPacket[19] & 0xFF);
    int expectedChecksum = currentPacket[18] & 0xFF;
    if ((checksum & 0xFF) != expectedChecksum) {
      logger.error(
          "DSxxx Checksum failure: calculated 0x{}, expected 0x{}",
          String.format("%02X", checksum & 0xFF),
          String.format("%02X", expectedChecksum));
    }

    int wordLength = currentPacket[2] & 0xFF;
    if (wordLength != incomingSize) {
      logger.error(
          "DSxxx Word length incorrect: received {}, expected {}", wordLength, incomingSize);
    }

    int endByte = currentPacket[incomingSize - 1] & 0xFF;
    if (endByte != 0xEB) {
      logger.error(
          "DSxxx End byte incorrect: received 0x{}, expected 0xEB", String.format("%02X", endByte));
    }
  }

  private void handleFunctionEvent(int functionType) {
    logger.info("DSxxx Function event received: 0x{}", String.format("%02X", functionType));
    switch (functionType) {
      case 0xA1:
      case 0xA2:
      case 0xA3:
        logger.info("DSxxx Start Race Phase (0x{})", String.format("%02X", functionType));
        if (listener != null) {
          listener.onStartTimer(getInterfaceIndex());
        }
        break;
      case 0xA4:
        logger.info("DSxxx End Race (0xA4)");
        if (listener != null) {
          listener.onEndHeat(getInterfaceIndex());
        }
        break;
      case 0xA5:
        logger.info("DSxxx Start Pause (0xA5)");
        if (listener != null) {
          listener.onPauseTimer(getInterfaceIndex());
        }
        break;
      case 0xA6:
        logger.info("DSxxx End Pause (0xA6)");
        break;
      case 0xA7:
        logger.info("DSxxx Abort Race (0xA7)");
        if (listener != null) {
          listener.onAbort(getInterfaceIndex());
        }
        break;
      default:
        logger.warn("DSxxx Unknown function code: 0x{}", String.format("%02X", functionType));
        break;
    }
  }

  private double getDSTime() {
    byte b13 = currentPacket[13];
    byte b14 = currentPacket[14];
    byte b15 = currentPacket[15];
    byte b16 = currentPacket[16];
    byte b17 = currentPacket[17];

    if (b13 == 0
        && (b14 & 0xFF) == 0xAA
        && (b15 & 0xFF) == 0xAB
        && (b16 & 0xFF) == 0xAA
        && (b17 & 0xFF) == 0xAA) {
      logger.info("DSxxx Reaction time detected via 0xAA 0xAB 0xAA 0xAA pattern");
      return 0.0001;
    }

    int hours = (((b13 & 0xFF) >> 4) * 10) + (b13 & 0x0F);
    int minutes = (((b14 & 0xFF) >> 4) * 10) + (b14 & 0x0F);
    int seconds = (((b15 & 0xFF) >> 4) * 10) + (b15 & 0x0F);
    double fraction =
        (((b16 & 0xFF) >> 4) * 0.1)
            + ((b16 & 0x0F) * 0.01)
            + (((b17 & 0xFF) >> 4) * 0.001)
            + ((b17 & 0x0F) * 0.0001);

    double dsTime = (hours * 3600.0) + (minutes * 60.0) + seconds + fraction;

    if (dsTime > 6000.0) {
      logger.info(
          "DSxxx Reaction time detected (time {}s > 6000s threshold, returning 0.0001s)", dsTime);
      return 0.0001;
    }

    return dsTime;
  }

  private void handleLap() {
    int laneMask = currentPacket[10] & 0xFF;
    int lane = -1;

    switch (laneMask) {
      case 0x80:
        lane = 0;
        break;
      case 0x40:
        lane = 1;
        break;
      case 0x20:
        lane = 2;
        break;
      case 0x10:
        lane = 3;
        break;
      case 0x08:
        lane = 4;
        break;
      case 0x04:
        lane = 5;
        break;
      case 0x02:
        lane = 6;
        break;
      case 0x01:
        lane = 7;
        break;
      default:
        logger.warn("DSxxx Unknown lane bitmask: 0x{}", String.format("%02X", laneMask));
        return;
    }

    // DS200 2-lane hack: Sometimes lanes 1 and 2 report as lanes 8 and 7 (0-indexed: 7 and 6)
    if (config.isDs200()) {
      if (lane == 6) {
        logger.info("DS200 Lane hack: remapping lane 7 (0-indexed 6) to lane 2 (0-indexed 1)");
        lane = 1;
      } else if (lane == 7) {
        logger.info("DS200 Lane hack: remapping lane 8 (0-indexed 7) to lane 1 (0-indexed 0)");
        lane = 0;
      }
    }

    double dsTime = getDSTime();
    logger.info("DSxxx Reporting lap time {}s on lane {} (0-indexed: {})", dsTime, lane + 1, lane);

    if (listener != null) {
      listener.onLap(lane, dsTime, 0, getInterfaceIndex());
    }
  }

  private void handlePacketDS30() {
    if (logger.isDebugEnabled()) {
      StringBuilder hex = new StringBuilder();
      for (int i = 0; i < incomingSize; i++) {
        hex.append(String.format("%02X ", currentPacket[i] & 0xFF));
      }
      logger.debug("DS030 Packet: (DR) --> '{}'", hex.toString().trim());
    }

    if (ds30LaneNumber >= 0) {
      // 3-byte lap timing data received
      byte b0 = currentPacket[0];
      byte b1 = currentPacket[1];
      byte b2 = currentPacket[2];

      int seconds = (((b0 & 0xFF) >> 4) * 10) + (b0 & 0x0F);
      double fraction =
          (((b1 & 0xFF) >> 4) * 0.1)
              + ((b1 & 0x0F) * 0.01)
              + (((b2 & 0xFF) >> 4) * 0.001)
              + ((b2 & 0x0F) * 0.0001);

      double dsTime = seconds + fraction;

      if ((b1 & 0xFF) == 0xEE || dsTime > 6000.0) {
        logger.info(
            "DS030 Reaction time detected (byte1=0x{}, time={}s, returning 0.0001s)",
            String.format("%02X", b1 & 0xFF),
            dsTime);
        dsTime = 0.0001;
      } else {
        logger.info(
            "DS030 Reporting lap time {}s on lane {} (0-indexed: {})",
            dsTime,
            ds30LaneNumber + 1,
            ds30LaneNumber);
      }

      if (listener != null) {
        listener.onLap(ds30LaneNumber, dsTime, 0, getInterfaceIndex());
      }

      ds30LaneNumber = -1;
      incomingSize = 1;
    } else {
      // 1-byte command or lane trigger received
      int b = currentPacket[0] & 0xFF;
      logger.info("DS030 Byte event: 0x{}", String.format("%02X", b));

      switch (b) {
        case 0xA0:
        case 0xA1:
        case 0xA2:
          logger.info("DS030 Start Race Phase (0x{})", String.format("%02X", b));
          if (listener != null) {
            listener.onStartTimer(getInterfaceIndex());
          }
          break;
        case 0xA3:
          logger.info("DS030 Start Pause (0xA3)");
          if (listener != null) {
            listener.onPauseTimer(getInterfaceIndex());
          }
          break;
        case 0xA4:
          logger.info("DS030 End Race (0xA4)");
          if (listener != null) {
            listener.onEndHeat(getInterfaceIndex());
          }
          break;
        case 0xA5:
          logger.info("DS030 Abort Race (0xA5)");
          if (listener != null) {
            listener.onAbort(getInterfaceIndex());
          }
          break;
        case 0x80:
          incomingSize = 3;
          ds30LaneNumber = 0;
          logger.info("DS030 Lane 1 trigger detected, awaiting 3 timing bytes");
          break;
        case 0x40:
          incomingSize = 3;
          ds30LaneNumber = 1;
          logger.info("DS030 Lane 2 trigger detected, awaiting 3 timing bytes");
          break;
        case 0x20:
          incomingSize = 3;
          ds30LaneNumber = 2;
          logger.info("DS030 Lane 3 trigger detected, awaiting 3 timing bytes");
          break;
        case 0x10:
          incomingSize = 3;
          ds30LaneNumber = 3;
          logger.info("DS030 Lane 4 trigger detected, awaiting 3 timing bytes");
          break;
        default:
          logger.warn("DS030 Unknown byte received: 0x{}", String.format("%02X", b));
          break;
      }
    }
  }
}
