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
import com.antigravity.protocols.arduino.ArduinoConfig;
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
    int callButtonCount = 0;
    int digitalPinEventCount = 0;
    com.antigravity.proto.InterfaceDigitalPinEvent lastDigitalPinEvent;

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
    public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {}

    boolean[] laneInPits = new boolean[2];

    @Override
    public void onCarData(CarData carData) {
      if (carData != null && carData.getLane() < laneInPits.length) {
        laneInPits[carData.getLane()] =
            carData.getLocation() == com.antigravity.protocols.CarLocation.PitRow;
      }
    }

    @Override
    public void onInterfaceEvent(InterfaceEvent event) {
      if (event.hasDigitalPin()) {
        digitalPinEventCount++;
        lastDigitalPinEvent = event.getDigitalPin();
      }
    }
  }

  private static class TestableTrackmateProtocol extends TrackmateProtocol {
    private final MockScheduler mockScheduler;
    public long currentTime = 0;

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

    @Override
    protected long now() {
      return currentTime;
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
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

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

    protocol.setMainPower(true); // Turn ON, normally closed is FALSE, so ENERGIZE (R)
    assertArrayEquals(new byte[] {0x52, 0x0A}, serialConnection.lastWrittenData);

    protocol.setMainPower(false); // Turn OFF, DEENERGIZE (E)
    assertArrayEquals(new byte[] {0x45, 0x0A}, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetMainPower_NormallyClosedTrue() {
    config.normallyClosedRelays = true;
    protocol = new TestableTrackmateProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();
    serialConnection.allWrittenData.clear();

    protocol.setMainPower(true); // Turn ON, normally closed is TRUE, so DEENERGIZE (E)
    assertArrayEquals(new byte[] {0x45, 0x0A}, serialConnection.lastWrittenData);

    protocol.setMainPower(false); // Turn OFF, ENERGIZE (R)
    assertArrayEquals(new byte[] {0x52, 0x0A}, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetLanePower_NormallyClosedFalse() {
    protocol.open();
    serialConnection.allWrittenData.clear();

    protocol.setLanePower(true, 0); // Turn Lane 0 ON. bitmask = 1
    assertArrayEquals(new byte[] {0x66, 0x01, 0x0A}, serialConnection.lastWrittenData);

    protocol.setLanePower(true, 1); // Turn Lane 1 ON. bitmask = 3
    assertArrayEquals(new byte[] {0x66, 0x03, 0x0A}, serialConnection.lastWrittenData);

    protocol.setLanePower(false, 0); // Turn Lane 0 OFF. bitmask = 1
    assertArrayEquals(new byte[] {0x66, 0x02, 0x0A}, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetLanePower_NormallyClosedTrue() {
    config.normallyClosedRelays = true;
    protocol = new TestableTrackmateProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();
    serialConnection.allWrittenData.clear();

    protocol.setLanePower(true, 0); // Turn Lane 0 ON. bitmask = 1
    assertArrayEquals(new byte[] {0x6E, 0x01, 0x0A}, serialConnection.lastWrittenData);

    protocol.setLanePower(true, 1); // Turn Lane 1 ON. bitmask = 3
    assertArrayEquals(new byte[] {0x6E, 0x03, 0x0A}, serialConnection.lastWrittenData);

    protocol.setLanePower(false, 0); // Turn Lane 0 OFF. bitmask = 1
    assertArrayEquals(new byte[] {0x6E, 0x02, 0x0A}, serialConnection.lastWrittenData);
  }

  @Test
  public void testStartTimer() {
    protocol.open();
    serialConnection.allWrittenData.clear();

    protocol.startTimer();
    // Ensure that no hardware commands are sent when startTimer is called,
    // as Trackmate hardware timer is initialized exactly once at startup.
    assertEquals(0, serialConnection.allWrittenData.size());
  }

  @Test
  public void testTimeDebouncePitting() {
    // Configure PIT_IN_OUT behavior
    config.lapPinPitBehavior =
        com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior.PIT_IN_OUT;
    protocol = new TestableTrackmateProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // 1. Trigger sensor for Lane 0 ('A')
    protocol.currentTime = 1000;
    serialConnection.injectData(new byte[] {0x41});
    org.junit.Assert.assertTrue("Car should enter pits on sensor trigger", listener.laneInPits[0]);

    // 2. Advance time by 100ms - Car should still be in pits
    protocol.currentTime = 1100;
    serialConnection.injectData(new byte[] {0x0A});
    org.junit.Assert.assertTrue("Car should remain in pits after 100ms", listener.laneInPits[0]);

    // 3. Advance time by 600ms total - Car should leave pits
    protocol.currentTime = 1600;
    serialConnection.injectData(new byte[] {0x0A});
    org.junit.Assert.assertFalse(
        "Car should leave pits after 500ms without trigger", listener.laneInPits[0]);

    // 4. Trigger again - ensure it can re-enter pits
    protocol.currentTime = 1800;
    serialConnection.injectData(new byte[] {0x41});
    org.junit.Assert.assertTrue("Car should re-enter pits", listener.laneInPits[0]);

    // 5. Trigger once more before timeout - resets timeout
    protocol.currentTime = 2000;
    serialConnection.injectData(new byte[] {0x41});
    org.junit.Assert.assertTrue("Car still in pits", listener.laneInPits[0]);

    protocol.currentTime = 2100;
    serialConnection.injectData(new byte[] {0x0A}); // 100ms since last hit
    org.junit.Assert.assertTrue("Car still in pits", listener.laneInPits[0]);

    protocol.currentTime = 2600;
    serialConnection.injectData(new byte[] {0x0A}); // 600ms since last hit
    org.junit.Assert.assertFalse("Car leaves pits", listener.laneInPits[0]);
  }

  @Test
  public void testDigitalPinEvent() {
    protocol.open();
    // Simulate 'A' for pin 0
    serialConnection.injectData(new byte[] {0x41});
    assertEquals(1, listener.digitalPinEventCount);
    assertEquals(0, listener.lastDigitalPinEvent.getPin());
    assertEquals(0, listener.lastDigitalPinEvent.getState()); // NC=false, so active is 0

    // Simulate 'B' for pin 1
    serialConnection.injectData(new byte[] {0x42});
    assertEquals(2, listener.digitalPinEventCount);
    assertEquals(1, listener.lastDigitalPinEvent.getPin());
    assertEquals(0, listener.lastDigitalPinEvent.getState());

    // Wait > 500ms and send Line Feed (0x0A) - pins should revert to inactive and
    // emit event
    protocol.currentTime = 600;
    serialConnection.injectData(new byte[] {0x0A});
    assertEquals(4, listener.digitalPinEventCount); // both pins emit an event when turning off
    assertEquals(1, listener.lastDigitalPinEvent.getState()); // inactive state is 1
  }
}
