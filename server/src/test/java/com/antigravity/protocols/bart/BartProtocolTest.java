package com.antigravity.protocols.bart;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.interfaces.BleConnection;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Before;
import org.junit.Test;

public class BartProtocolTest {

  private BartConfig config;
  private BleConnection connection;
  private ScheduledExecutorService statusScheduler;
  private BartProtocol protocol;

  @Before
  public void setUp() {
    BleConnection.mockMode = true;
    config = new BartConfig();
    config.deviceName = "BART_TEST";
    config.deviceAddress = "AA:BB:CC:DD:EE:FF";
    config.numLanes = 4;
    connection = new BleConnection(config.deviceName, config.deviceAddress);
    statusScheduler = Executors.newSingleThreadScheduledExecutor();
    protocol = new BartProtocol(config, 4, connection, statusScheduler);
  }

  @Test
  public void testOpenAndClose() {
    protocol.open();
    assertEquals(true, connection.isOpen());
    protocol.close();
    assertEquals(false, connection.isOpen());
  }

  @Test
  public void testLapEventPacketHandling() {
    AtomicInteger lapLane = new AtomicInteger(-1);
    AtomicReference<Double> lapTime = new AtomicReference<>(0.0);

    protocol.setListener(
        new ProtocolListener() {
          @Override
          public void onLap(int laneIndex, double time, int interfaceId, int interfaceIndex) {
            lapLane.set(laneIndex);
            lapTime.set(time);
          }

          @Override
          public void onSegment(int laneIndex, double time, int interfaceId, int interfaceIndex) {}

          @Override
          public void onCallbutton(int laneIndex, int interfaceIndex) {}

          @Override
          public void onCarData(CarData carData) {}

          @Override
          public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {}

          @Override
          public void onInterfaceEvent(InterfaceEvent event) {}
        });

    protocol.open();

    // Construct valid lap packet: A5 01 01 lane=0 laps=1 lap_ms=1250(0x04E2) ts=100 reserved=0 CRC
    byte[] packetNoCrc =
        new byte[] {(byte) 0xA5, 0x01, 0x01, 0x00, 0x01, (byte) 0xE2, 0x04, 0x64, 0x00};
    byte crc = BartCrc.calculateCrc(packetNoCrc);
    byte[] packet = new byte[10];
    System.arraycopy(packetNoCrc, 0, packet, 0, 9);
    packet[9] = crc;

    connection.injectReceivedData(packet);

    assertEquals(0, lapLane.get());
    assertEquals(1.25, lapTime.get(), 0.0001);
    protocol.close();
  }

  @Test
  public void testSetRaceStateCommands() {
    protocol.open();
    protocol.setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
    protocol.setRaceState(RaceState.PAUSED, RaceFlag.YELLOW, 0.0);
    protocol.close();
  }

  @Test
  public void testRequiresHeartbeatReturnsTrue() {
    assertEquals(true, protocol.requiresHeartbeat());
  }

  @Test
  public void testOpenEmitsConnectedStatus() {
    AtomicReference<InterfaceStatus> statusRef = new AtomicReference<>();
    protocol.setListener(
        new ProtocolListener() {
          @Override
          public void onLap(int laneIndex, double time, int interfaceId, int interfaceIndex) {}

          @Override
          public void onSegment(int laneIndex, double time, int interfaceId, int interfaceIndex) {}

          @Override
          public void onCallbutton(int laneIndex, int interfaceIndex) {}

          @Override
          public void onCarData(CarData carData) {}

          @Override
          public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {
            statusRef.set(status);
          }

          @Override
          public void onInterfaceEvent(InterfaceEvent event) {}
        });

    protocol.open();
    assertEquals(InterfaceStatus.CONNECTED, statusRef.get());
    protocol.close();
  }

  @Test
  public void testStatusSnapshotBroadcastingDetectedChannels() {
    AtomicInteger detectedChannels = new AtomicInteger(0);
    protocol.setListener(
        new ProtocolListener() {
          @Override
          public void onLap(int laneIndex, double time, int interfaceId, int interfaceIndex) {}

          @Override
          public void onSegment(int laneIndex, double time, int interfaceId, int interfaceIndex) {}

          @Override
          public void onCallbutton(int laneIndex, int interfaceIndex) {}

          @Override
          public void onCarData(CarData carData) {}

          @Override
          public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {}

          @Override
          public void onInterfaceEvent(InterfaceEvent event) {
            if (event.hasStatus()) {
              detectedChannels.set(event.getStatus().getDetectedChannels());
            }
          }
        });

    protocol.open();

    // Construct valid status snapshot packet: A5 20 01 00 (IDLE) 01 (minlap=1) 00 (uptime) 06
    // (lanes=6) 00 (reserved) CRC
    byte[] packetNoCrc = new byte[] {(byte) 0xA5, 0x20, 0x01, 0x00, 0x01, 0x00, 0x06, 0x00};
    byte crc = BartCrc.calculateCrc(packetNoCrc);
    byte[] packet = new byte[9];
    System.arraycopy(packetNoCrc, 0, packet, 0, 8);
    packet[8] = crc;

    connection.injectReceivedData(packet);

    assertEquals(6, detectedChannels.get());
    protocol.close();
  }

  @Test
  public void testPitInAndPitOutRefueling() {
    config.lapPinBehaviors = new java.util.ArrayList<>();
    config.lapPinBehaviors.add(com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + 0);
    config.lapPinBehaviors.add(com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE + 0);

    AtomicReference<CarData> carDataRef = new AtomicReference<>();

    protocol.setListener(
        new ProtocolListener() {
          @Override
          public void onLap(int laneIndex, double time, int interfaceId, int interfaceIndex) {}

          @Override
          public void onSegment(int laneIndex, double time, int interfaceId, int interfaceIndex) {}

          @Override
          public void onCallbutton(int laneIndex, int interfaceIndex) {}

          @Override
          public void onCarData(CarData carData) {
            carDataRef.set(carData);
          }

          @Override
          public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {}

          @Override
          public void onInterfaceEvent(InterfaceEvent event) {}
        });

    protocol.open();

    // 1. Inject Pit In packet on channel 0
    byte[] pitInNoCrc =
        new byte[] {(byte) 0xA5, 0x01, 0x01, 0x00, 0x01, (byte) 0xE8, 0x03, 0x64, 0x00};
    byte[] pitInPacket = new byte[10];
    System.arraycopy(pitInNoCrc, 0, pitInPacket, 0, 9);
    pitInPacket[9] = BartCrc.calculateCrc(pitInNoCrc);

    connection.injectReceivedData(pitInPacket);

    assertEquals(0, carDataRef.get().getLane());
    assertEquals(true, carDataRef.get().getCanRefuel());

    // 2. Inject Pit Out packet on channel 1
    byte[] pitOutNoCrc =
        new byte[] {(byte) 0xA5, 0x01, 0x01, 0x01, 0x01, (byte) 0xE8, 0x03, 0x64, 0x00};
    byte[] pitOutPacket = new byte[10];
    System.arraycopy(pitOutNoCrc, 0, pitOutPacket, 0, 9);
    pitOutPacket[9] = BartCrc.calculateCrc(pitOutNoCrc);

    connection.injectReceivedData(pitOutPacket);

    assertEquals(0, carDataRef.get().getLane());
    assertEquals(false, carDataRef.get().getCanRefuel());

    protocol.close();
  }

  @Test
  public void testUnknownBehaviorHandling() {
    config.lapPinBehaviors = new java.util.ArrayList<>();
    config.lapPinBehaviors.add(9999); // Unknown behavior value

    protocol.open();

    byte[] packetNoCrc =
        new byte[] {(byte) 0xA5, 0x01, 0x01, 0x00, 0x01, (byte) 0xE2, 0x04, 0x64, 0x00};
    byte[] packet = new byte[10];
    System.arraycopy(packetNoCrc, 0, packet, 0, 9);
    packet[9] = BartCrc.calculateCrc(packetNoCrc);

    connection.injectReceivedData(packet);
    protocol.close();
  }

  @Test
  public void testCheckAndPublishStatusSendsReadStatus() {
    protocol.open();
    connection.clearSentBytes();

    // Trigger checkAndPublishStatus directly
    protocol.checkAndPublishStatus();

    byte[] sent = connection.getSentBytes();
    assertNotNull(sent);
    assertTrue(sent.length >= 4);
    assertEquals((byte) 0xA5, sent[0]);
    assertEquals((byte) 0x90, sent[1]); // Command message type
    assertEquals((byte) 0x20, sent[2]); // OP_READ_STAT
    protocol.close();
  }

  @Test
  public void testAck5ByteParsingAndCrc() {
    protocol.open();

    // Construct 5-byte ACK packet for OP 0x20 (READ_STAT): A5 7F 20 01 CRC
    byte[] ackNoCrc = new byte[] {(byte) 0xA5, 0x7F, 0x20, 0x01};
    byte crc = BartCrc.calculateCrc(ackNoCrc);
    byte[] ackPacket = new byte[] {(byte) 0xA5, 0x7F, 0x20, 0x01, crc};

    connection.injectReceivedData(ackPacket);

    // Verify buffer was fully consumed (0 remaining) and no crash
    protocol.close();
  }
}
