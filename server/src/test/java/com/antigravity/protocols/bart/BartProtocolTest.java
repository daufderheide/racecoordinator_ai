package com.antigravity.protocols.bart;

import static org.junit.Assert.assertEquals;

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
  public void testRequiresHeartbeatReturnsFalse() {
    assertEquals(false, protocol.requiresHeartbeat());
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
}
