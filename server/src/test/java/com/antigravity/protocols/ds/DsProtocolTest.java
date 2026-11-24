package com.antigravity.protocols.ds;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;

import com.antigravity.mocks.MockScheduler;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class DsProtocolTest {

  private TestListener listener;
  private MockSerialConnection serialConnection;
  private MockScheduler scheduler;

  private static class MockSerialConnection extends SerialConnection {
    boolean open = false;
    String lastPort;
    int lastBaud;
    SerialPortDataListener listener;
    SerialPort mockPort = mock(SerialPort.class);
    List<byte[]> writtenData = new ArrayList<>();

    @Override
    public void connect(String portName, int baudRate) throws IOException {
      this.lastPort = portName;
      this.lastBaud = baudRate;
      this.open = true;
    }

    @Override
    public void connect(String portName, int baudRate, boolean setDtrRts) throws IOException {
      connect(portName, baudRate);
    }

    @Override
    public void disconnect() {
      this.open = false;
    }

    @Override
    public boolean isOpen() {
      return open;
    }

    @Override
    public void addListener(SerialPortDataListener listener) {
      this.listener = listener;
    }

    @Override
    public void writeData(byte[] data) throws IOException {
      writtenData.add(data);
    }

    public void injectData(byte[] data) {
      if (listener != null) {
        SerialPortEvent event =
            new SerialPortEvent(mockPort, SerialPort.LISTENING_EVENT_DATA_RECEIVED, data);
        listener.serialEvent(event);
      }
    }
  }

  private static class TestListener implements ProtocolListener {
    int startTimerCount = 0;
    int pauseTimerCount = 0;
    int endHeatCount = 0;
    int abortCount = 0;
    int lapCount = 0;
    int lastLapLane = -1;
    double lastLapTime = 0.0;
    InterfaceStatus lastStatus;

    @Override
    public void onStartTimer(int interfaceIndex) {
      startTimerCount++;
    }

    @Override
    public void onPauseTimer(int interfaceIndex) {
      pauseTimerCount++;
    }

    @Override
    public void onEndHeat(int interfaceIndex) {
      endHeatCount++;
    }

    @Override
    public void onAbort(int interfaceIndex) {
      abortCount++;
    }

    @Override
    public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {
      lapCount++;
      lastLapLane = lane;
      lastLapTime = lapTime;
    }

    @Override
    public void onSegment(int lane, double segmentTime, int interfaceId, int interfaceIndex) {}

    @Override
    public void onCallbutton(int lane, int interfaceIndex) {}

    @Override
    public void onCarData(CarData carData) {}

    @Override
    public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {
      this.lastStatus = status;
    }

    @Override
    public void onInterfaceEvent(InterfaceEvent event) {}
  }

  @Before
  public void setUp() {
    listener = new TestListener();
    serialConnection = new MockSerialConnection();
    scheduler = new MockScheduler();
  }

  private DsProtocol createProtocol(DsType type, String port) {
    DsConfig config = new DsConfig("DS Unit", port, type);
    DsProtocol protocol = new DsProtocol(config, 4, serialConnection, scheduler);
    protocol.setListener(listener);
    protocol.setInterfaceIndex(0);
    return protocol;
  }

  @Test
  public void testCapabilitiesAndFlags() {
    DsProtocol protocol = createProtocol(DsType.DS_300, "COM1");
    assertFalse(protocol.requiresHeartbeat());
    assertFalse(protocol.canManualStart());
    assertFalse(protocol.canManualPause());
    assertFalse(protocol.canManualRestart());
    assertFalse(protocol.hasPerLaneRelays());
    assertFalse(protocol.hasDigitalFuel());
    assertFalse(protocol.hasMainRelay());
    assertTrue(protocol.stopTimer().isEmpty());
  }

  @Test
  public void testOpenSetsCorrectBaudRate() {
    DsProtocol p300 = createProtocol(DsType.DS_300, "COM1");
    p300.open();
    assertTrue(serialConnection.isOpen());
    assertEquals("COM1", serialConnection.lastPort);
    assertEquals(57600, serialConnection.lastBaud);
    p300.close();

    DsProtocol p030 = createProtocol(DsType.DS_030, "COM2");
    p030.open();
    assertTrue(serialConnection.isOpen());
    assertEquals("COM2", serialConnection.lastPort);
    assertEquals(4800, serialConnection.lastBaud);
    p030.close();
  }

  @Test
  public void testDs030SingleByteEvents() {
    DsProtocol protocol = createProtocol(DsType.DS_030, "COM1");
    protocol.open();

    serialConnection.injectData(new byte[] {(byte) 0xA0});
    assertEquals(1, listener.startTimerCount);

    serialConnection.injectData(new byte[] {(byte) 0xA3});
    assertEquals(1, listener.pauseTimerCount);

    serialConnection.injectData(new byte[] {(byte) 0xA4});
    assertEquals(1, listener.endHeatCount);

    serialConnection.injectData(new byte[] {(byte) 0xA5});
    assertEquals(1, listener.abortCount);

    protocol.close();
  }

  @Test
  public void testDs030LapTimingAndReactionTime() {
    DsProtocol protocol = createProtocol(DsType.DS_030, "COM1");
    protocol.open();

    // Trigger lane 0 (0x80) followed by 3 BCD bytes (12, 34, 56 -> 12.3456 seconds)
    serialConnection.injectData(new byte[] {(byte) 0x80, (byte) 0x12, (byte) 0x34, (byte) 0x56});
    assertEquals(1, listener.lapCount);
    assertEquals(0, listener.lastLapLane);
    assertEquals(12.3456, listener.lastLapTime, 0.0001);

    // Trigger lane 2 (0x20) with reaction time signature (0xEE in byte 1)
    serialConnection.injectData(new byte[] {(byte) 0x20, (byte) 0x00, (byte) 0xEE, (byte) 0x01});
    assertEquals(2, listener.lapCount);
    assertEquals(2, listener.lastLapLane);
    assertEquals(0.0001, listener.lastLapTime, 0.00001);

    protocol.close();
  }

  private byte[] buildDs21BytePacket(
      int hardwareType, int dataType, int functionOrLane, double lapTime) {
    byte[] packet = new byte[21];
    packet[0] = (byte) 0xE0;
    packet[1] = 0x00;
    packet[2] = 21; // word length
    packet[3] = (byte) hardwareType;
    packet[7] = (byte) dataType;

    if (dataType == 0x00) {
      packet[8] = (byte) functionOrLane;
    } else if (dataType == 0x1B) {
      packet[10] = (byte) functionOrLane;
      // Encode lap time into bytes 13..17
      int totalMs = (int) Math.round(lapTime * 1000.0);
      int hundredths = (totalMs / 10) % 100;
      int tenthsThousandths = ((totalMs / 1000) % 10) * 16 + (totalMs % 10);
      packet[13] = (byte) ((totalMs / 60000) & 0xFF); // minutes
      packet[14] = (byte) (((totalMs / 1000) % 60) & 0xFF); // seconds
      packet[15] = (byte) ((hundredths / 10) * 16 + (hundredths % 10));
      packet[16] = (byte) tenthsThousandths;
      packet[17] = 0x00;
    }

    packet[19] = 0x00;
    packet[20] = (byte) 0xEB; // end byte

    int checksum = 0;
    for (int i = 1; i < 18; i++) {
      checksum += (packet[i] & 0xFF);
    }
    checksum += (packet[19] & 0xFF);
    packet[18] = (byte) (checksum & 0xFF);

    return packet;
  }

  @Test
  public void testDs300FunctionEvents() {
    DsProtocol protocol = createProtocol(DsType.DS_300, "COM1");
    protocol.open();

    byte[] startPacket = buildDs21BytePacket(3, 0x00, 0xA1, 0.0);
    serialConnection.injectData(startPacket);
    assertEquals(1, listener.startTimerCount);

    byte[] pausePacket = buildDs21BytePacket(3, 0x00, 0xA5, 0.0);
    serialConnection.injectData(pausePacket);
    assertEquals(1, listener.pauseTimerCount);

    byte[] endPacket = buildDs21BytePacket(3, 0x00, 0xA4, 0.0);
    serialConnection.injectData(endPacket);
    assertEquals(1, listener.endHeatCount);

    byte[] abortPacket = buildDs21BytePacket(3, 0x00, 0xA7, 0.0);
    serialConnection.injectData(abortPacket);
    assertEquals(1, listener.abortCount);

    byte[] endPausePacket = buildDs21BytePacket(3, 0x00, 0xA6, 0.0);
    serialConnection.injectData(endPausePacket);
    assertEquals(2, listener.startTimerCount);

    byte[] keepAlivePacket = buildDs21BytePacket(3, 0x00, 0xC0, 0.0);
    serialConnection.injectData(keepAlivePacket);
    // 0xC0 keep-alive packet should be handled cleanly without modifying counts
    assertEquals(2, listener.startTimerCount);
    assertEquals(1, listener.pauseTimerCount);
    assertEquals(1, listener.endHeatCount);
    assertEquals(1, listener.abortCount);

    protocol.close();
  }

  @Test
  public void testDs300LapTimingAndDeduplication() {
    DsProtocol protocol = createProtocol(DsType.DS_300, "COM1");
    protocol.open();

    byte[] lapPacket = buildDs21BytePacket(3, 0x1B, 0x80, 5.432);
    serialConnection.injectData(lapPacket);
    assertEquals(1, listener.lapCount);
    assertEquals(0, listener.lastLapLane);

    // DS300 sends identical packets in bursts: duplicate should be ignored
    serialConnection.injectData(lapPacket);
    assertEquals(1, listener.lapCount);

    // Subsequent packet with different lane should be accepted
    byte[] lapLane2 = buildDs21BytePacket(3, 0x1B, 0x40, 6.123);
    serialConnection.injectData(lapLane2);
    assertEquals(2, listener.lapCount);
    assertEquals(1, listener.lastLapLane);

    protocol.close();
  }

  @Test
  public void testDs200LaneRemapping() {
    DsProtocol protocol = createProtocol(DsType.DS_200, "COM1");
    protocol.open();

    // In DS200, hardware lane 7 (bitmask 0x02) remaps to lane index 1 (lane 2)
    byte[] packetLane7 = buildDs21BytePacket(2, 0x1B, 0x02, 4.5);
    serialConnection.injectData(packetLane7);
    assertEquals(1, listener.lapCount);
    assertEquals(1, listener.lastLapLane);

    // Hardware lane 8 (bitmask 0x01) remaps to lane index 0 (lane 1)
    byte[] packetLane8 = buildDs21BytePacket(2, 0x1B, 0x01, 4.8);
    serialConnection.injectData(packetLane8);
    assertEquals(2, listener.lapCount);
    assertEquals(0, listener.lastLapLane);

    protocol.close();
  }

  @Test
  public void testUpdateConfigPortAndBaudChange() {
    DsProtocol protocol = createProtocol(DsType.DS_030, "COM1");
    protocol.open();
    assertEquals("COM1", serialConnection.lastPort);
    assertEquals(4800, serialConnection.lastBaud);

    // Change port only
    DsConfig newPortConfig = new DsConfig("DS Unit", "COM2", DsType.DS_030);
    protocol.updateConfig(newPortConfig);
    assertEquals("COM2", serialConnection.lastPort);
    assertEquals(4800, serialConnection.lastBaud);

    // Change type causing baud rate change (4800 -> 57600)
    DsConfig newBaudConfig = new DsConfig("DS Unit", "COM2", DsType.DS_300);
    protocol.updateConfig(newBaudConfig);
    assertEquals("COM2", serialConnection.lastPort);
    assertEquals(57600, serialConnection.lastBaud);

    // Identical config: no reconnect
    protocol.updateConfig(newBaudConfig);
    assertTrue(serialConnection.isOpen());

    protocol.close();
  }
}
