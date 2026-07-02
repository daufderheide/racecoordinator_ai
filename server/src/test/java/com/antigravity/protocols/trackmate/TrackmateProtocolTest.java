package com.antigravity.protocols.trackmate;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;

import com.antigravity.mocks.MockScheduler;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.PinBehavior;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import org.junit.Before;
import org.junit.Test;

public class TrackmateProtocolTest {

  private TestableTrackmateProtocol protocol;
  private MockScheduler scheduler;
  private TestListener listener;
  private MockSerialConnection serialConnection;
  private TrackmateConfig config;

  private static class MockSerialConnection extends SerialConnection {
    boolean open = false;
    SerialPortDataListener listener;
    SerialPort mockPort = mock(SerialPort.class);
    public byte[] lastWrittenData;
    public List<byte[]> allWrittenData = new ArrayList<>();

    @Override
    public void connect(String portName, int baudRate) throws IOException {
      open = true;
    }

    @Override
    public void connect(String portName, int baudRate, boolean setDtrRts) throws IOException {
      open = true;
    }

    @Override
    public void disconnect() {
      open = false;
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
      lastWrittenData = data;
      allWrittenData.add(data);
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
    int lapCount = 0;
    int lastLapLane = -1;
    InterfaceStatus lastStatus = InterfaceStatus.DISCONNECTED;
    int callButtonCount = 0;

    @Override
    public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {
      lapCount++;
      lastLapLane = lane;
    }

    @Override
    public void onSegment(int lane, double segmentTime, int interfaceId, int interfaceIndex) {}

    @Override
    public void onCallbutton(int lane, int interfaceIndex) {
      callButtonCount++;
    }

    @Override
    public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {
      lastStatus = status;
    }

    @Override
    public void onCarData(CarData carData) {}

    @Override
    public void onInterfaceEvent(InterfaceEvent event) {}
  }

  private static class TestableTrackmateProtocol extends TrackmateProtocol {
    private final MockScheduler mockScheduler;

    public TestableTrackmateProtocol(
        TrackmateConfig config,
        int numLanes,
        MockScheduler scheduler,
        MockSerialConnection serial) {
      super(config, numLanes, serial, scheduler);
      this.mockScheduler = scheduler;
    }

    @Override
    protected ScheduledExecutorService createScheduler() {
      return mockScheduler;
    }
  }

  @Before
  public void setUp() {
    scheduler = new MockScheduler();
    serialConnection = new MockSerialConnection();
    config = new TrackmateConfig();
    config.commPort = "COM1";
    config.numLanes = 2;
    config.debounce = 2;
    config.useIR = false;
    config.normallyClosedLaneSensors = false;
    config.normallyClosedRelays = false;

    config.lapPinBehaviors = new ArrayList<>();
    config.lapPinBehaviors.add(PinBehavior.BEHAVIOR_LAP_BASE_VALUE + 0);
    config.lapPinBehaviors.add(PinBehavior.BEHAVIOR_LAP_BASE_VALUE + 1);

    protocol = new TestableTrackmateProtocol(config, 2, scheduler, serialConnection);
    listener = new TestListener();
    protocol.setListener(listener);
  }

  @Test
  public void testInitializationSequence() {
    protocol.open();

    // Verify init sequence
    // A2 (Lanes)
    assertArrayEquals(new byte[] {0x41, 0x32, 0x0A}, serialConnection.allWrittenData.get(0));
    // C0 (Sensor IR false)
    assertArrayEquals(new byte[] {0x43, 0x30, 0x0A}, serialConnection.allWrittenData.get(1));
    // D2 (Debounce 2)
    assertArrayEquals(new byte[] {0x44, 0x32, 0x0A}, serialConnection.allWrittenData.get(2));
    // I0
    assertArrayEquals(new byte[] {0x49, 0x30, 0x0A}, serialConnection.allWrittenData.get(3));
    // S
    assertArrayEquals(new byte[] {0x53, 0x0A}, serialConnection.allWrittenData.get(4));
  }

  @Test
  public void testLapTrigger() {
    protocol.open();
    // Simulate 'A' for Lane 0
    serialConnection.injectData(new byte[] {0x41});

    assertEquals(1, listener.lapCount);
    assertEquals(0, listener.lastLapLane);

    // Simulate 'B' for Lane 1
    serialConnection.injectData(new byte[] {0x42});

    assertEquals(2, listener.lapCount);
    assertEquals(1, listener.lastLapLane);
  }

  @Test
  public void testCallButton() {
    protocol.open();
    // Simulate 'W' for call button
    serialConnection.injectData(new byte[] {0x57});

    assertEquals(1, listener.callButtonCount);
  }

  @Test
  public void testSetMainPower_NormallyClosedFalse() {
    protocol.open();
    serialConnection.allWrittenData.clear();

    protocol.setMainPower(true); // Turn ON, normally closed is FALSE, so DEENERGIZE (E)
    assertArrayEquals(new byte[] {0x45}, serialConnection.lastWrittenData);

    protocol.setMainPower(false); // Turn OFF, ENERGIZE (R)
    assertArrayEquals(new byte[] {0x52}, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetMainPower_NormallyClosedTrue() {
    config.normallyClosedRelays = true;
    protocol = new TestableTrackmateProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();
    serialConnection.allWrittenData.clear();

    protocol.setMainPower(true); // Turn ON, normally closed is TRUE, so ENERGIZE (R)
    assertArrayEquals(new byte[] {0x52}, serialConnection.lastWrittenData);

    protocol.setMainPower(false); // Turn OFF, DEENERGIZE (E)
    assertArrayEquals(new byte[] {0x45}, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetLanePower() {
    protocol.open();
    serialConnection.allWrittenData.clear();

    protocol.setLanePower(true, 0); // Turn Lane 0 ON. bitmask = 1
    assertArrayEquals(new byte[] {0x6E, 0x01}, serialConnection.lastWrittenData);

    protocol.setLanePower(true, 1); // Turn Lane 1 ON. bitmask = 3
    assertArrayEquals(new byte[] {0x6E, 0x03}, serialConnection.lastWrittenData);
  }
}
