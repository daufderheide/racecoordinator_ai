package com.antigravity.protocols.arduino;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;

import com.antigravity.mocks.MockScheduler;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.proto.RgbLedBehavior;
import com.antigravity.proto.RgbLedState;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import org.junit.Before;
import org.junit.Test;

public class ArduinoProtocolTest {

  private TestableArduinoProtocol protocol;
  private MockScheduler scheduler;
  private TestListener listener;
  private MockSerialConnection serialConnection;
  private ArduinoConfig config;

  // TODO(aufderheide): Move MockSerialConnection to a common test utilities
  // package. It'll be
  // needed in other tests
  // down the road.
  private static class MockSerialConnection extends SerialConnection {

    boolean open = false;
    SerialPortDataListener listener;
    SerialPort mockPort = mock(SerialPort.class);
    public byte[] lastWrittenData;
    public List<byte[]> allWrittenData = new ArrayList<>();
    public List<String> eventLog = new ArrayList<>(); // Track order of events
    public int connectionCount = 0;
    public String lastPortName;
    public int lastBaudRate;

    @Override
    public void connect(String portName, int baudRate) throws IOException {
      connect(portName, baudRate, true);
    }

    @Override
    public void connect(String portName, int baudRate, boolean setDtrRts) throws IOException {
      connectionCount++;
      lastPortName = portName;
      lastBaudRate = baudRate;
      if (portName.equals("FAIL")) {
        throw new IOException("Connection failed");
      }
      open = true;
      eventLog.add("CONNECT");
    }

    @Override
    public void disconnect() {
      open = false;
      eventLog.add("DISCONNECT");
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
      eventLog.add("WRITE");
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
    int pitStateChanges = 0;
    CarLocation lastLocation = CarLocation.Main;
    public CarData lastCarData;
    int callButtonCount = 0;
    int segmentCount = 0;
    public InterfaceEvent lastEvent;
    public int lastInterfaceIndex = -1;

    @Override
    public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {
      lapCount++;
      lastLapLane = lane;
      this.lastInterfaceIndex = interfaceIndex;
    }

    @Override
    public void onSegment(int lane, double segmentTime, int interfaceId, int interfaceIndex) {
      segmentCount++;
      this.lastInterfaceIndex = interfaceIndex;
    }

    @Override
    public void onCallbutton(int lane, int interfaceIndex) {
      callButtonCount++;
      this.lastInterfaceIndex = interfaceIndex;
    }

    @Override
    public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {
      lastStatus = status;
      this.lastInterfaceIndex = interfaceIndex;
    }

    @Override
    public void onCarData(CarData carData) {
      lastCarData = carData;
      if (carData.getLocation() != lastLocation) {
        pitStateChanges++;
        lastLocation = carData.getLocation();
      }
    }

    @Override
    public void onInterfaceEvent(InterfaceEvent event) {
      lastEvent = event;
    }
  }

  @Test
  public void testCloseSequence() {
    // Add an LED string so clearLeds() actually sends data
    LedString string0 = new LedString(2, Arrays.asList(1), 255, 0, 0, 5.0, new ArrayList<>());
    config.ledStrings = Collections.singletonList(string0);

    protocol.open();
    // Inject version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.eventLog.clear();

    protocol.close();

    // Verify sequence: WRITE (for clearLeds) should happen BEFORE DISCONNECT
    int lastWrite = -1;
    int lastDisconnect = -1;

    for (int i = 0; i < serialConnection.eventLog.size(); i++) {
      String event = serialConnection.eventLog.get(i);
      if (event.equals("WRITE")) {
        lastWrite = i;
      } else if (event.equals("DISCONNECT")) {
        lastDisconnect = i;
      }
    }

    assertTrue("Should have performed at least one write (LED clear)", lastWrite != -1);
    assertTrue("Should have disconnected", lastDisconnect != -1);
    assertTrue("LED clear must happen BEFORE serial disconnect", lastWrite < lastDisconnect);
  }

  private static class TestableArduinoProtocol extends ArduinoProtocol {

    long mockedTime = 10000;

    public TestableArduinoProtocol(
        ArduinoConfig config, int numLanes, MockScheduler scheduler, MockSerialConnection serial) {
      super(config, numLanes, serial, scheduler);
      this.mockScheduler = scheduler;
    }

    private final MockScheduler mockScheduler;

    @Override
    protected ScheduledExecutorService createScheduler() {
      if (mockScheduler.isShutdown()) {
        mockScheduler.reset();
      }
      return mockScheduler;
    }

    @Override
    protected long now() {
      return mockedTime;
    }

    void advanceTime(long millis) {
      mockedTime += millis;
    }

    void simulateHeartbeat() {
      lastHeartbeatTimeMs = now();
    }

    void simulatePitEntry(int laneIndex) {
      updatePitState(laneIndex, true);
    }
  }

  @Before
  public void setUp() {
    scheduler = new MockScheduler();
    serialConnection = new MockSerialConnection();
    config = new ArduinoConfig();
    config.commPort = "COM1";
    config.baudRate = 115200;
    config.normallyClosedLaneSensors = false;
    config.normallyClosedRelays = false;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    listener = new TestListener();
    protocol.setListener(listener);
  }

  @Test
  public void testStatusConnected_AfterVersion() {
    protocol.open();
    scheduler.tick();
    assertEquals("Initial status should be NO_DATA", InterfaceStatus.NO_DATA, listener.lastStatus);

    // Inject Version message: V 2.1.0.0 ; -> 56 02 01 00 00 3B
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    scheduler.tick();
    assertEquals(
        "Status should be CONNECTED immediately after version verification",
        InterfaceStatus.CONNECTED,
        listener.lastStatus);
  }

  @Test
  public void testHeartbeatResetOnConfigChange() {
    protocol.open();
    protocol.simulateHeartbeat();
    scheduler.tick();
    assertEquals(InterfaceStatus.CONNECTED, listener.lastStatus);

    // Change port
    ArduinoConfig newConfig = new ArduinoConfig();
    newConfig.commPort = "COM2";
    protocol.updateConfig(newConfig);

    // After switching port, lastHeartbeatTimeMs should be 0.
    // Since serialConnection.isOpen() is true for COM2, it should report NO_DATA
    scheduler.tick();
    assertEquals(
        "Status should be NO_DATA immediately after port change (until heartbeat)",
        InterfaceStatus.NO_DATA,
        listener.lastStatus);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUpdateConfig() {
    // Initial: D2 is Lane 0 Lap
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    // V 2.1.0.0 ; -> 56 02 01 00 00 3B
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Trigger D2 input (Digital=0x44, Pin=2, State=0 - NO means 0 triggers)
    // I D2 0 ; -> 49 44 02 00 3B
    byte[] inputLap = {0x49, 0x44, 0x02, 0x00, 0x3B};
    serialConnection.injectData(inputLap);

    assertEquals("Should have received 1 lap", 1, listener.lapCount);
    assertEquals("Lane 0", 0, listener.lastLapLane);

    // Update: D2 is now Call Button (Lane 0)
    ArduinoConfig newConfig = new ArduinoConfig();
    newConfig.commPort = "COM1";
    newConfig.baudRate = 115200;
    newConfig.normallyClosedLaneSensors = false;
    newConfig.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    newConfig.digitalIds.set(2, PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + 0);

    protocol.updateConfig(newConfig);

    // Reset stats
    listener.lapCount = 0;

    // Trigger D2 input again
    serialConnection.injectData(inputLap);

    assertEquals("Should NOT receive lap after config change", 0, listener.lapCount);
    // Listener doesn't track call button, but absence of lap confirms change
    // behavior
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUpdateConfig_SyncsPower() {
    // Configure Pin 4 as Main Relay
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_RELAY.getNumber());
    config.normallyClosedRelays = false;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Verify version to allow power commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Initial state: Power OFF, NC=false -> 0V
    protocol.setMainPower(false);
    serialConnection.allWrittenData.clear();

    // Update config: Change to NC=true
    ArduinoConfig newConfig = new ArduinoConfig();
    newConfig.commPort = "COM1";
    newConfig.baudRate = 115200;
    newConfig.normallyClosedRelays = true; // CHANGED
    newConfig.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    newConfig.digitalIds.set(4, PinBehavior.BEHAVIOR_RELAY.getNumber());

    protocol.updateConfig(newConfig);

    // Verify it sent a new power command (should now be 5V for OFF because NC=true)
    boolean foundPower = false;
    byte[] expectedPower = {0x4F, 0x44, 0x04, 0x01, 0x3B};
    for (byte[] data : serialConnection.allWrittenData) {
      if (Arrays.equals(data, expectedPower)) {
        foundPower = true;
        break;
      }
    }
    assertTrue("Should have synchronized power after NC setting change", foundPower);
  }

  @Test
  public void testSetPinState_Digital() {
    protocol.open();
    // O D 2 1 ; -> 4F 44 02 01 3B
    protocol.setPinState(true, 2, true);

    byte[] expected = {0x4F, 0x44, 0x02, 0x01, 0x3B};
    assertArrayEquals(expected, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetPinState_Analog() {
    protocol.open();
    // O A 3 0 ; -> 4F 41 03 00 3B
    protocol.setPinState(false, 3, false);

    byte[] expected = {0x4F, 0x41, 0x03, 0x00, 0x3B};
    assertArrayEquals(expected, serialConnection.lastWrittenData);
  }

  @Test
  public void testHasPerLaneRelays_False() {
    // Initial config has no relays
    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    assertEquals(false, protocol.hasPerLaneRelays());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testHasPerLaneRelays_True_Digital() {
    // Set digital pin 2 to be a relay for lane 0
    // Relay base is behavior... let's check PinBehavior.
    // In ArduinoProtocol.java:
    // BEHAVIOR_RELAY_BASE
    // The range is [RELAY_BASE, RELAY_BASE + numLanes)

    int relayBase = PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, relayBase + 0); // Relay for Lane 0

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    assertEquals(true, protocol.hasPerLaneRelays());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testHasPerLaneRelays_True_Analog() {
    // Set analog pin 0 to be a relay for lane 1
    int relayBase = PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    config.analogIds =
        new ArrayList<>(Collections.nCopies(6, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.analogIds.set(0, relayBase + 1); // Relay for Lane 1

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    assertEquals(true, protocol.hasPerLaneRelays());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSetMainPower() {
    // Configure Pin 4 as Main Relay (Behavior 3)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_RELAY.getNumber());

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Verify version to allow power commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Turn ON
    protocol.setMainPower(true);
    // 0x4F, 0x44 (Digital), 0x04 (Pin 4), 0x01 (High), 0x3B
    byte[] expectedOn = {0x4F, 0x44, 0x04, 0x01, 0x3B};
    assertArrayEquals(expectedOn, serialConnection.lastWrittenData);

    // Turn OFF
    protocol.setMainPower(false);
    // 0x4F, 0x44 (Digital), 0x04 (Pin 4), 0x00 (Low), 0x3B
    byte[] expectedOff = {0x4F, 0x44, 0x04, 0x00, 0x3B};
    assertArrayEquals(expectedOff, serialConnection.lastWrittenData);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSetPinStateCaching() throws Exception {
    // Configure Pin 4 as Main Relay
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_RELAY.getNumber());

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // 0. Setup: verify version to allow messages
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    // 1. Set pin 4 to HIGH
    protocol.setPinState(true, 4, true);
    assertEquals("Should have sent 1 message", 1, serialConnection.allWrittenData.size());
    byte[] expectedHigh = {0x4F, 0x44, 4, 1, 0x3B};
    assertArrayEquals(expectedHigh, serialConnection.allWrittenData.get(0));

    // 2. Set pin 4 to HIGH again (should be cached)
    protocol.setPinState(true, 4, true);
    assertEquals("Should be cached (size still 1)", 1, serialConnection.allWrittenData.size());

    // 3. Set pin 4 to LOW
    protocol.setPinState(true, 4, false);
    assertEquals("Should have sent 2nd message", 2, serialConnection.allWrittenData.size());
    byte[] expectedLow = {0x4F, 0x44, 4, 0, 0x3B};
    assertArrayEquals(expectedLow, serialConnection.allWrittenData.get(1));

    // 4. Force cache clear (simulating what heartbeat mismatch does)
    Field cacheField = DefaultProtocol.class.getDeclaredField("pinStateCache");
    cacheField.setAccessible(true);
    ((Map<?, ?>) cacheField.get(protocol)).clear();

    // 5. Set pin 4 to LOW again (should NOT be cached anymore)
    protocol.setPinState(true, 4, false);
    assertEquals(
        "Should have sent message after cache clear", 3, serialConnection.allWrittenData.size());
    assertArrayEquals(expectedLow, serialConnection.allWrittenData.get(2));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPowerSyncOnVersion() {
    // Configure Pin 4 as Main Relay
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_RELAY.getNumber());

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Verify no version verified yet
    serialConnection.allWrittenData.clear();

    // Call setMainPower - it should NOT send yet because version not verified
    protocol.setMainPower(true);
    assertEquals(
        "Should NOT have sent power command yet", 0, serialConnection.allWrittenData.size());

    // Now inject version message
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Verify it sent the cached power state
    // Sequence should include pin modes, led modes, then power sync
    boolean foundPower = false;
    byte[] expectedPower = {0x4F, 0x44, 0x04, 0x01, 0x3B};
    for (byte[] data : serialConnection.allWrittenData) {
      if (Arrays.equals(data, expectedPower)) {
        foundPower = true;
        break;
      }
    }
    assertTrue("Should have synchronized power after version verification", foundPower);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSetMainPower_NormallyClosed() {
    // Configure Pin 4 as Main Relay
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_RELAY.getNumber());
    config.normallyClosedRelays = true;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Verify version to allow power commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Turn ON (should be LOW)
    protocol.setMainPower(true);
    byte[] expectedOn = {0x4F, 0x44, 0x04, 0x00, 0x3B};
    assertArrayEquals(expectedOn, serialConnection.lastWrittenData);

    // Turn OFF (should be HIGH)
    protocol.setMainPower(false);
    byte[] expectedOff = {0x4F, 0x44, 0x04, 0x01, 0x3B};
    assertArrayEquals(expectedOff, serialConnection.lastWrittenData);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSetLanePower() {
    // Configure Pin 5 as Relay for Lane 0 (Base + 0)
    // Configure Pin 6 as Relay for Lane 1 (Base + 1)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    int relayBase = PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    config.digitalIds.set(5, relayBase + 0);
    config.digitalIds.set(6, relayBase + 1);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Verify version to allow power commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Turn Lane 0 ON
    protocol.setLanePower(true, 0);
    // 0x4F, 0x44, 0x05, 0x01, 0x3B
    byte[] expectedLane0On = {0x4F, 0x44, 0x05, 0x01, 0x3B};
    assertArrayEquals(expectedLane0On, serialConnection.lastWrittenData);

    // Turn Lane 1 OFF
    protocol.setLanePower(false, 1);
    // 0x4F, 0x44, 0x06, 0x00, 0x3B
    byte[] expectedLane1Off = {0x4F, 0x44, 0x06, 0x00, 0x3B};
    assertArrayEquals(expectedLane1Off, serialConnection.lastWrittenData);

    // Try Invalid Lane (2) - Should not send anything specific (mock keeps last
    // written)
    // To verify, we can clear lastWrittenData or check if it changed
    serialConnection.lastWrittenData = null;
    protocol.setLanePower(true, 2);
    assertNull(serialConnection.lastWrittenData);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSetLanePower_NormallyClosed() {
    // Configure Pin 5 as Relay for Lane 0
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    int relayBase = PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    config.digitalIds.set(5, relayBase + 0);
    config.normallyClosedRelays = true;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Verify version to allow power commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Turn Lane 0 ON (should be LOW)
    protocol.setLanePower(true, 0);
    byte[] expectedLane0On = {0x4F, 0x44, 0x05, 0x00, 0x3B};
    assertArrayEquals(expectedLane0On, serialConnection.lastWrittenData);

    // Turn Lane 0 OFF (should be HIGH)
    protocol.setLanePower(false, 0);
    byte[] expectedLane0Off = {0x4F, 0x44, 0x05, 0x01, 0x3B};
    assertArrayEquals(expectedLane0Off, serialConnection.lastWrittenData);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPitDetection_PitOutOnly() {
    // Configure D4 as Pit Out (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Trigger D4 low (0 - NO means 0 triggers) -> In pits
    byte[] pitOutLowTrigger = {0x49, 0x44, 0x04, 0x00, 0x3B};
    serialConnection.injectData(pitOutLowTrigger);
    assertEquals(CarLocation.PitRow, listener.lastLocation);
    assertEquals(1, listener.pitStateChanges);

    // Trigger D4 high (1) -> Out of pits
    byte[] pitOutHighRelease = {0x49, 0x44, 0x04, 0x01, 0x3B};
    serialConnection.injectData(pitOutHighRelease);
    assertEquals(CarLocation.Main, listener.lastLocation);
    assertEquals(2, listener.pitStateChanges);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPitDetection_PitInAndOut() {
    // Configure D4 as Pit In (Base + 0), D5 as Pit Out (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0);
    config.digitalIds.set(5, PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Trigger D5 high (Pit Out - transition from 0 to 1 should trigger Main)
    byte[] pitOutHigh = {0x49, 0x44, 0x05, 0x01, 0x3B};
    serialConnection.injectData(pitOutHigh);
    assertEquals(CarLocation.Main, listener.lastLocation);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPitDetection_PitInOutPin() {
    // Configure D4 as Pit In/Out (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Trigger D4 low (Pit In/Out - wantState is 0) -> In pits
    byte[] pitInOutLow = {0x49, 0x44, 0x04, 0x00, 0x3B};
    serialConnection.injectData(pitInOutLow);
    assertEquals(CarLocation.PitRow, listener.lastLocation);

    // Trigger D4 high (Pit In/Out - !wantState) -> Out of pits
    byte[] pitInOutHigh = {0x49, 0x44, 0x04, 0x01, 0x3B};
    serialConnection.injectData(pitInOutHigh);
    assertEquals(CarLocation.Main, listener.lastLocation);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPitDetection_PitInAndOutTransition() {
    // Configure D4 as Pit In (Base + 0), D5 as Pit Out (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0);
    config.digitalIds.set(5, PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Trigger D4 low (Pit In - wantState is 0) -> In pits
    byte[] pitInLow = {0x49, 0x44, 0x04, 0x00, 0x3B};
    serialConnection.injectData(pitInLow);
    assertEquals(CarLocation.PitRow, listener.lastLocation);

    // Trigger D5 low (Pit Out - wantState is 0) -> STILL in pits (transition hasn't
    // happened)
    byte[] pitOutLow = {0x49, 0x44, 0x05, 0x00, 0x3B};
    serialConnection.injectData(pitOutLow);
    assertEquals(CarLocation.PitRow, listener.lastLocation);

    // Trigger D5 high (Pit Out - transition 0 -> 1) -> Out of pits
    byte[] pitOutHigh = {0x49, 0x44, 0x05, 0x01, 0x3B};
    serialConnection.injectData(pitOutHigh);
    assertEquals(CarLocation.Main, listener.lastLocation);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPitDetection_LapPinBehavior_PitOut() {
    // Configure D2 as Lap (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.PIT_OUT;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Initial state: Main
    assertEquals(CarLocation.Main, listener.lastLocation);

    // Trigger D2 high (Lap/Pit Out) -> Should stay in Main or Exit Pits if it was
    // in
    // them.
    // However, the current code just calls updatePitState(laneIndex, false).
    // Let's first put it in pits via a mock helper if possible, or just verify it
    // doesn't enter.

    // Force it into pits first
    protocol.simulatePitEntry(0);
    assertEquals(CarLocation.PitRow, listener.lastLocation);

    byte[] lapLow = {0x49, 0x44, 0x02, 0x00, 0x3B};
    serialConnection.injectData(lapLow);
    assertEquals(
        "Should have exited pits on Lap trigger (PIT_OUT)",
        CarLocation.Main,
        listener.lastLocation);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPitDetection_LapPinBehavior_PitInOut() {
    // Configure D2 as Lap (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.PIT_IN_OUT;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Trigger D2 low (Lap/Pit In - NO means 0 triggers) -> In pits
    byte[] lapLow = {0x49, 0x44, 0x02, 0x00, 0x3B};
    serialConnection.injectData(lapLow);
    assertEquals("Should be in pits while over sensor", CarLocation.PitRow, listener.lastLocation);

    // Trigger D2 high (Clear sensor) -> Out of pits
    byte[] lapHigh = {0x49, 0x44, 0x02, 0x01, 0x3B};
    serialConnection.injectData(lapHigh);
    assertEquals(
        "Should be out of pits after clearing sensor", CarLocation.Main, listener.lastLocation);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPitDeltaTime() {
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0);
    config.digitalIds.set(5, PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Enter pit via Pit In (D4 LOW - NO means 0 triggers)
    byte[] pitInLow = {0x49, 0x44, 0x04, 0x00, 0x3B};
    protocol.advanceTime(1000);
    serialConnection.injectData(pitInLow);

    assertNotNull(listener.lastCarData);
    assertEquals(
        "First report should have delta 0 and true canRefuel",
        0.0,
        listener.lastCarData.getTime(),
        0.001);
    assertEquals(
        "Should be able to refuel on pit entry", true, listener.lastCarData.getCanRefuel());

    // Advance 2.5s and tick the scheduler to simulate the 10Hz loop
    protocol.advanceTime(2500);
    scheduler.tick();

    assertEquals(
        "Refuel scheduler report should have elapsed time",
        2.5,
        listener.lastCarData.getTime(),
        0.001);
    assertEquals("Still able to refuel", true, listener.lastCarData.getCanRefuel());

    // Advance 0.1s and tick again
    protocol.advanceTime(100);
    scheduler.tick();

    assertEquals(
        "Next refuel scheduler report should have elapsed time",
        0.1,
        listener.lastCarData.getTime(),
        0.001);

    // Leave the pit via Pit Out transition (D5 LOW then HIGH)
    byte[] pitOutLow = {0x49, 0x44, 0x05, 0x00, 0x3B};
    byte[] pitOutHigh = {0x49, 0x44, 0x05, 0x01, 0x3B};
    protocol.advanceTime(200);
    serialConnection.injectData(pitOutLow);
    protocol.advanceTime(10);
    serialConnection.injectData(pitOutHigh);

    assertEquals("Exit report should have delta 0", 0.0, listener.lastCarData.getTime(), 0.001);
    assertEquals("Cannot refuel on pit exit", false, listener.lastCarData.getCanRefuel());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testCallButtonTransitions() {
    // Configure D2 as Call Button (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + 0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    byte[] callLow = {0x49, 0x44, 0x02, 0x00, 0x3B};
    byte[] callHigh = {0x49, 0x44, 0x02, 0x01, 0x3B};

    // Trigger D2 LOW (state 0) -> Call Button should NOT trigger yet (first event)
    serialConnection.injectData(callLow);
    assertEquals(0, listener.callButtonCount);

    // Trigger D2 HIGH (state 1) -> Call Button should NOT trigger
    serialConnection.injectData(callHigh);
    assertEquals(0, listener.callButtonCount);

    // Trigger D2 LOW (state 0) -> Call Button should trigger (1 -> 0 transition)
    serialConnection.injectData(callLow);
    assertEquals(1, listener.callButtonCount);

    // Trigger D2 LOW (state 0) again -> Call Button should NOT trigger again
    serialConnection.injectData(callLow);
    assertEquals(1, listener.callButtonCount);

    // Enable inversion - Call button should STILL trigger on 0 (high-to-low
    // transition)
    config.normallyClosedLaneSensors = true;
    protocol.updateConfig(config);

    listener.callButtonCount = 0;
    // Current state is 0. Resetting state with 1 first.
    serialConnection.injectData(callHigh);
    serialConnection.injectData(callLow);
    assertEquals(1, listener.callButtonCount);

    // Trigger D2 HIGH (state 1) -> Call Button should NOT trigger
    serialConnection.injectData(callHigh);
    assertEquals(1, listener.callButtonCount);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSegmentCounterTransitions() {
    // Configure D3 as Segment Counter (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(3, PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + 0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Normal (NO): Trigger D2 LOW (state 0) -> Segment should trigger
    byte[] segmentLow = {0x49, 0x44, 0x03, 0x00, 0x3B};
    serialConnection.injectData(segmentLow);
    assertEquals(1, listener.segmentCount);

    // Normal (NO): Trigger D3 HIGH (state 1) -> Segment should NOT trigger again
    byte[] segmentHigh = {0x49, 0x44, 0x03, 0x01, 0x3B};
    serialConnection.injectData(segmentHigh);
    assertEquals(1, listener.segmentCount);

    // Inverted (NC): Trigger D3 HIGH (state 1) -> Segment should trigger
    config.normallyClosedLaneSensors = true;
    protocol.updateConfig(config);

    listener.segmentCount = 0;
    serialConnection.injectData(segmentHigh);
    assertEquals(1, listener.segmentCount);

    // Inverted (NC): Trigger D3 LOW (state 0) -> Segment should NOT trigger
    serialConnection.injectData(segmentLow);
    assertEquals(1, listener.segmentCount);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSegmentHandling_LapsAsSegments() {
    // Configure D2 as Lap (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);
    config.useLapsForSegments = true;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Trigger D2 LOW (state 0) -> Should trigger BOTH Lap and Segment
    byte[] lapLow = {0x49, 0x44, 0x02, 0x00, 0x3B};
    serialConnection.injectData(lapLow);

    assertEquals("Should have received 1 lap", 1, listener.lapCount);
    assertEquals("Should have received 1 segment", 1, listener.segmentCount);

    // Disable Laps as Segments
    config.useLapsForSegments = false;
    protocol.updateConfig(config);

    listener.lapCount = 0;
    listener.segmentCount = 0;

    // Trigger D2 LOW again
    serialConnection.injectData(lapLow);

    assertEquals("Should have received 1 lap", 1, listener.lapCount);
    assertEquals("Should NOT have received segment", 0, listener.segmentCount);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSegmentHandling_InvertedSegment() {
    // Configure D3 as Segment Counter (Base + 0)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(3, PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + 0);
    config.normallyClosedLaneSensors = true;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Inverted: Trigger D3 HIGH (state 1) -> Segment should trigger
    byte[] segmentHigh = {0x49, 0x44, 0x03, 0x01, 0x3B};
    serialConnection.injectData(segmentHigh);
    assertEquals(
        "Should have received 1 segment on HIGH trigger (inverted)", 1, listener.segmentCount);

    // Inverted: Trigger D3 LOW (state 0) -> Segment should NOT trigger
    byte[] segmentLow = {0x49, 0x44, 0x03, 0x00, 0x3B};
    serialConnection.injectData(segmentLow);
    assertEquals("Should still have 1 segment on LOW trigger (inverted)", 1, listener.segmentCount);
  }

  @Test
  public void testInterfaceDigitalPinEvent() {
    protocol.open();
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // 1. Digital Pin Input (D2 LOW)
    // I D2 0 ; -> 49 44 02 00 3B
    byte[] digitalInput = {0x49, 0x44, 0x02, 0x00, 0x3B};
    serialConnection.injectData(digitalInput);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasDigitalPin());
    assertEquals(2, listener.lastEvent.getDigitalPin().getPin());
    assertEquals(0, listener.lastEvent.getDigitalPin().getState());
    assertEquals(true, listener.lastEvent.getDigitalPin().getIsDigital());
    assertEquals(
        protocol.getInterfaceIndex(), listener.lastEvent.getDigitalPin().getInterfaceIndex());

    // 2. Analog Pin Input (A3 HIGH)
    // I A3 1 ; -> 49 41 03 01 3B
    byte[] analogInput = {0x49, 0x41, 0x03, 0x01, 0x3B};
    serialConnection.injectData(analogInput);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasDigitalPin());
    assertEquals(3, listener.lastEvent.getDigitalPin().getPin());
    assertEquals(1, listener.lastEvent.getDigitalPin().getState());
    assertEquals(false, listener.lastEvent.getDigitalPin().getIsDigital());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSendPinModeAnalogRead() {
    // Configure A1 as Voltage Level for Lane 0 (Base + 0)
    config.analogIds =
        new ArrayList<>(Collections.nCopies(6, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.analogIds.set(1, PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + 0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Trigger Version to send pin modes
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // After version, sendPinModeAnalogRead should be called
    // Opcode 0x70
    // Binary format: P opcode totalPins (Type Pin)* Terminator
    // totalPins = 1
    // Type = ANALOG (1)
    // PinIndex = 1 (A1)
    // Expected: 0x70 0x01 0x41 0x01 0x3B
    byte[] expected = {0x70, 0x01, 0x41, 0x01, 0x3B};

    boolean found = false;
    for (byte[] data : serialConnection.allWrittenData) {
      if (Arrays.equals(expected, data)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent PIN_MODE READ_ANALOG command", found);
  }

  @Test
  public void testOnAnalogData() {
    protocol.open();

    // Send version first to verify protocol
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Opcode 0x41 (A), Count 1, Pin 1, Value 1023 (0x3FF)
    // Value is 4 bytes: 0, 0, 3, 255
    byte[] msg = {0x41, 0x01, 0x01, 0x00, 0x00, 0x03, (byte) 0xFF, 0x3B};
    serialConnection.injectData(msg);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(1, listener.lastEvent.getAnalogData().getPin());
    assertEquals(1023, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_ZeroValue() {
    protocol.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Pin 0, Value 0
    byte[] msg = {0x41, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3B};
    serialConnection.injectData(msg);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(0, listener.lastEvent.getAnalogData().getPin());
    assertEquals(0, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_MaxValue() {
    protocol.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Pin 2, Value 1023 (max 10-bit ADC reading)
    byte[] msg = {0x41, 0x01, 0x02, 0x00, 0x00, 0x03, (byte) 0xFF, 0x3B};
    serialConnection.injectData(msg);

    assertNotNull("Event should not be null", listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(2, listener.lastEvent.getAnalogData().getPin());
    assertEquals(1023, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_MidRangeValue() {
    protocol.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Pin 3, Value 512 = 0x00000200
    byte[] msg = {0x41, 0x01, 0x03, 0x00, 0x00, 0x02, 0x00, 0x3B};
    serialConnection.injectData(msg);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(3, listener.lastEvent.getAnalogData().getPin());
    assertEquals(512, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_MultiPin_ThreePins() {
    // Track all fired events
    ArrayList<InterfaceEvent> events = new ArrayList<>();
    TestListener multiListener =
        new TestListener() {
          @Override
          public void onInterfaceEvent(InterfaceEvent event) {
            super.onInterfaceEvent(event);
            events.add(event);
          }
        };
    protocol.setListener(multiListener);
    protocol.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Count = 3
    // Pin 0, Value 100 = 0x00000064
    // Pin 1, Value 512 = 0x00000200
    // Pin 2, Value 1023 = 0x000003FF
    // Message: 0x41, 0x03,
    // 0x00, 0x00, 0x00, 0x00, 0x64, -- pin 0, value 100
    // 0x01, 0x00, 0x00, 0x02, 0x00, -- pin 1, value 512
    // 0x02, 0x00, 0x00, 0x03, 0xFF, -- pin 2, value 1023
    // 0x3B
    byte[] msg = {
      0x41,
      0x03,
      0x00,
      0x00,
      0x00,
      0x00,
      0x64,
      0x01,
      0x00,
      0x00,
      0x02,
      0x00,
      0x02,
      0x00,
      0x00,
      0x03,
      (byte) 0xFF,
      0x3B
    };
    serialConnection.injectData(msg);

    assertEquals("Should fire one event per pin", 3, events.size());

    assertEquals(0, events.get(0).getAnalogData().getPin());
    assertEquals(100, events.get(0).getAnalogData().getValue());

    assertEquals(1, events.get(1).getAnalogData().getPin());
    assertEquals(512, events.get(1).getAnalogData().getValue());

    assertEquals(2, events.get(2).getAnalogData().getPin());
    assertEquals(1023, events.get(2).getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_TwoConsecutiveMessages() {
    ArrayList<InterfaceEvent> events = new ArrayList<>();
    TestListener multiListener =
        new TestListener() {
          @Override
          public void onInterfaceEvent(InterfaceEvent event) {
            super.onInterfaceEvent(event);
            events.add(event);
          }
        };
    protocol.setListener(multiListener);
    protocol.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // First message: Pin 0, Value 200
    byte[] msg1 = {0x41, 0x01, 0x00, 0x00, 0x00, 0x00, (byte) 0xC8, 0x3B};
    // Second message: Pin 1, Value 800 = 0x00000320
    byte[] msg2 = {0x41, 0x01, 0x01, 0x00, 0x00, 0x03, 0x20, 0x3B};

    serialConnection.injectData(msg1);
    serialConnection.injectData(msg2);

    assertEquals("Should fire event for each message", 2, events.size());
    assertEquals(0, events.get(0).getAnalogData().getPin());
    assertEquals(200, events.get(0).getAnalogData().getValue());
    assertEquals(1, events.get(1).getAnalogData().getPin());
    assertEquals(800, events.get(1).getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_PartialMessageDoesNotFire() {
    protocol.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Inject only the opcode and count (not the full message body)
    byte[] partial = {0x41, 0x01};
    serialConnection.injectData(partial);

    // No analog event should have fired yet
    assertNull(
        "Partial message should not produce an event",
        listener.lastEvent == null || !listener.lastEvent.hasAnalogData() ? null : "has event");
  }

  @Test
  public void testOnAnalogData_HighPinIndex() {
    protocol.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Pin 15 (last analog pin on Mega A15), Value 750 = 0x000002EE
    byte[] msg = {0x41, 0x01, 0x0F, 0x00, 0x00, 0x02, (byte) 0xEE, 0x3B};
    serialConnection.injectData(msg);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(15, listener.lastEvent.getAnalogData().getPin());
    assertEquals(750, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testOnSegmentCounter() {
    ArduinoConfig config = new ArduinoConfig();
    config.commPort = "COM1";
    config.normallyClosedLaneSensors = false;
    config.digitalIds = new ArrayList<>();
    // Fill with reserved to reach pin 4
    for (int i = 0; i < 4; i++) {
      config.digitalIds.add(PinBehavior.BEHAVIOR_RESERVED_VALUE);
    }
    config.digitalIds.add(PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE); // Pin 4 = Lane 0 Seg

    protocol.updateConfig(config);
    protocol.open();

    // Verify version
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    protocol.simulateHeartbeat();

    // OPCODE_INPUT (I), DIGITAL (D), Pin (4), State (0 - NO trigger), Terminator
    // (;)
    byte[] message = {0x49, 0x44, 4, 0, 0x3B};
    serialConnection.injectData(message);

    assertEquals(1, listener.segmentCount);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUseLapsForSegments() {
    ArduinoConfig config = new ArduinoConfig();
    config.commPort = "COM1";
    config.normallyClosedLaneSensors = false;
    config.digitalIds = new ArrayList<>();
    config.digitalIds.add(PinBehavior.BEHAVIOR_LAP_BASE_VALUE); // Pin 0 = Lane 0 Lap
    config.useLapsForSegments = true;

    protocol.updateConfig(config);
    protocol.open();

    // Verify version
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    protocol.simulateHeartbeat();

    // OPCODE_INPUT (I), DIGITAL (D), Pin (0), State (0 - NO trigger), Terminator
    // (;)
    byte[] message = {0x49, 0x44, 0, 0, 0x3B};
    serialConnection.injectData(message);

    assertEquals(1, listener.lapCount);
    assertEquals(1, listener.segmentCount); // Should also fire segment
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSendRgbLedMode() {
    // Configure one LED string with 5 LEDs
    List<Integer> leds =
        new ArrayList<>(Collections.nCopies(5, RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED_VALUE));
    leds.set(
        4, RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE_VALUE); // Max index 4, so count is 5

    LedString string0 = new LedString(14, leds, 150, 2, 0, 5.0, new ArrayList<>()); // ledType 2
    config.ledStrings = new ArrayList<>();
    config.ledStrings.add(string0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Trigger Version to send RGB LED mode
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B}; // V2
    serialConnection.injectData(versionMsg);

    // Opcode 0x6C (l)
    // pin = 14 (translated to physical 14 for Uno A0)
    // ledCount = 5
    // brightness = 150
    // updateRate = 20 (0x0014)
    // ledType = 2
    // Expected: 0x6C 0x0E 0x05 0x96 0x14 0x00 0x02 0x00 0x3B
    byte[] expected = {0x6C, 0x0E, 0x05, (byte) 150, 0x14, 0x00, 0x02, 0x00, 0x3B};

    boolean found = false;
    for (byte[] data : serialConnection.allWrittenData) {
      if (Arrays.equals(expected, data)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent sendRgbLedMode command", found);
  }

  @Test
  public void testSetStringRgbLedValues() {
    protocol.open();

    // Trigger Version to verify protocol
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Set LED 2 to Red (255, 0, 0) on pin 14
    List<RgbLedState> leds = new ArrayList<>();
    leds.add(RgbLedState.newBuilder().setIndex(2).setR(255).setG(0).setB(0).build());

    protocol.setStringRgbLedValues(14, leds);

    // Opcode 0x4C (L)
    // pin = 14 (physical 14)
    // numUpdates = 1
    // LedIndex = 2
    // R = 255 (0xFF), G = 0, B = 0
    // Expected: 0x4C 0x0E 0x01 0x02 0xFF 0x00 0x00 0x3B
    byte[] expected = {0x4C, 0x0E, 0x01, 0x02, (byte) 0xFF, 0x00, 0x00, 0x3B};

    assertArrayEquals(expected, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetHeatStandings() {
    // Configure LED string 1 with 2 leds: Lane 0 leader (2000), Lane 1 leader
    // (2001)
    LedString ledString = new LedString();
    ledString.pin = 1;
    ledString.leds =
        Arrays.asList(
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE + 0,
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE + 1);
    ledString.ledLaneColorOverrides = Arrays.asList("#FF0000", "#00FF00");
    config.ledStrings = Collections.singletonList(ledString);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();
    // Verify version to allow commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Standings: Lane 1 is leader
    protocol.setHeatStandings(Arrays.asList(1, 0));

    // Expected SET_RGB_LED_VALUES command for String 1:
    // LED 0: Lane 0 leader -> OFF (0,0,0)
    // LED 1: Lane 1 leader -> ON (0,255,0)
    // Opcode: 0x4C, String: 1, NumLeds: 2, [0, 0, 0, 0, 1, 0, 255, 0], Terminator:
    // 0x3B
    byte[] expected = {
      0x4C,
      0x01,
      0x02,
      0x00,
      0x00,
      0x00,
      0x00, // LED 0
      0x01,
      0x00,
      (byte) 0xFF,
      0x00, // LED 1
      0x3B
    };

    boolean found = false;
    for (byte[] data : serialConnection.allWrittenData) {
      if (Arrays.equals(expected, data)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent SET_RGB_LED_VALUES command for standings", found);
  }

  @Test
  public void testSetHeatStandings_MissingColorMapping() {
    LedString ledString =
        new LedString(
            1,
            Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE + 0),
            255,
            0,
            0,
            5.0,
            new ArrayList<>());
    config.ledStrings = Collections.singletonList(ledString);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();
    // Verify version to allow commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    serialConnection.allWrittenData.clear();
    protocol.setHeatStandings(Arrays.asList(0));

    // Should have sent a SET_RGB_LED_VALUES command with White fallback (FF FF FF)
    // Opcode 0x4C, String 1, Count 1, Index 0, R=255, G=255, B=255
    byte[] expectedFallback = {0x4C, 0x01, 0x01, 0x00, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, 0x3B};

    boolean found = false;
    for (byte[] data : serialConnection.allWrittenData) {
      if (Arrays.equals(expectedFallback, data)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent LED update with White fallback for missing color", found);
  }

  @Test
  public void testVersionVerificationAndIgnoredMessages() {
    protocol.open();

    // 1. Send Heatbeat (T) before version - should be ignored
    // Heartbeat: T <long:timeInUse> <byte:isReset> ; -> 54 00 01 02 03 00 3B
    byte[] heartbeatMsg = {0x54, 0, 0, 1, 0, 0, 0x3B};
    serialConnection.injectData(heartbeatMsg);

    assertEquals(
        "Heartbeat should be ignored before version verification",
        0,
        protocol.getLastHeartbeatTimeMs());

    // 2. Send Input (I) before version - should be ignored
    byte[] inputLap = {0x49, 0x44, 0x02, 0x00, 0x3B};
    serialConnection.injectData(inputLap);
    assertEquals("Input should be ignored before version verification", 0, listener.lapCount);

    // 3. Send Version (V) - should verify
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    assertTrue(
        "Version should be verified",
        protocol.isOpen()); // Actually checking it's open and verified

    // 4. Send Heartbeat again - should be processed
    serialConnection.injectData(heartbeatMsg);
    assertTrue(
        "Heartbeat should be processed after version verification",
        protocol.getLastHeartbeatTimeMs() > 0);

    // 5. Send Input again - should be processed
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);
    protocol.updateConfig(config);

    serialConnection.injectData(inputLap);
    assertEquals("Input should be processed after version verification", 1, listener.lapCount);
  }

  @Test
  public void testSendRgbLedMode_Removals() {
    // 1. Initial configuration with an LED string
    ArduinoConfig configWithLed = new ArduinoConfig();
    configWithLed.commPort = "COM1";
    LedString string0 = new LedString(2, Arrays.asList(1), 100, 0, 0, 5.0, new ArrayList<>());
    configWithLed.ledStrings = new ArrayList<>(Collections.singletonList(string0));

    protocol.updateConfig(configWithLed);
    protocol.open();

    // Verify version to enable sending commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);

    // Initial mode message should have been sent (Pin 2, Count 1, Brightness 100,
    // Rate 20, Type 0,
    // ColorOrder 0)
    byte[] expectedInitial = {0x6C, 0x02, 0x01, 100, 0x14, 0x00, 0x00, 0x00, 0x3B};
    assertTrue(
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedInitial, d)));

    // 2. Update config to remove the LED string
    serialConnection.allWrittenData.clear();
    ArduinoConfig configNoLed = new ArduinoConfig();
    configNoLed.commPort = "COM1";
    configNoLed.ledStrings = null; // Removed

    protocol.updateConfig(configNoLed);

    // Should send cleanup message: pin 2, brightness 0 (to turn off previous
    // string)
    byte[] expectedCleanup = {0x6C, 0x02, 0x01, 0, 0x14, 0x00, 0x00, 0x00, 0x3B};
    assertTrue(
        "Should have sent cleanup message with brightness 0 for pin 2",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedCleanup, d)));
  }

  @Test
  public void testWriteData_EnforcesBufferLimit() {
    // Configure for Uno
    config.hardwareType = 0;
    protocol.updateConfig(config);
    protocol.open();
    assertEquals("Uno buffer limit should be 128", 128, protocol.getMaxBufferSize());

    serialConnection.allWrittenData.clear();

    // Send 128 bytes - should succeed
    byte[] msg128 = new byte[128];
    Arrays.fill(msg128, (byte) 0);
    msg128[127] = 0x3B; // Valid terminator (though writeData doesn't check it, it checks length)
    protocol.writeData(msg128);
    assertEquals("128 byte message should be sent", 1, serialConnection.allWrittenData.size());

    // Send 129 bytes - should be dropped
    serialConnection.allWrittenData.clear();
    byte[] msg129 = new byte[129];
    protocol.writeData(msg129);
    assertEquals(
        "129 byte message should be dropped on Uno", 0, serialConnection.allWrittenData.size());

    // Configure for Mega
    config.hardwareType = 1;
    protocol.updateConfig(config);
    assertEquals("Mega buffer limit should be 128", 128, protocol.getMaxBufferSize());

    // Send 129 bytes - should be dropped
    serialConnection.allWrittenData.clear();
    protocol.writeData(msg129);
    assertEquals(
        "129 byte message should be dropped on Mega", 0, serialConnection.allWrittenData.size());
  }

  @Test
  public void testSetRefueling() {
    protocol.open();
    // Verify version to allow commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    // Configure Pin 8 as RGB String (Behavior 4)
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(8, PinBehavior.BEHAVIOR_LED_RGB_STRING.getNumber());

    // Setup an LED string with Refueling Lane behavior (Base + 0)
    LedString ledString = new LedString();
    ledString.pin = 8;
    ledString.brightness = 255;
    ledString.addressableLeds = 10;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(
                10, com.antigravity.proto.RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED_VALUE));
    ledString.leds.set(
        0, com.antigravity.proto.RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 0);
    ledString.ledLaneColorOverrides = Arrays.asList("#FF0000", "#00FF00"); // Red for Lane 0
    config.ledStrings = Collections.singletonList(ledString);

    protocol.updateConfig(config);
    serialConnection.allWrittenData.clear();

    // Set Refueling to TRUE for Lane 0
    protocol.setRefueling(0, true);

    // Should send SET_RGB_LED_VALUES (opcode 'L' = 0x4C)
    // Pin 8 is physical pin 8 on Uno (default hardware type 0)
    // Batch size 1, Item 0: color #FF0000 (R=255, G=0, B=0)
    // Message: 0x4C, 0x08, 0x01, 0x00, 0xFF, 0x00, 0x00, 0x3B
    byte[] expected = {0x4C, 0x08, 0x01, 0x00, (byte) 0xFF, 0x00, 0x00, 0x3B};
    boolean found = false;
    for (byte[] msg : serialConnection.allWrittenData) {
      if (Arrays.equals(msg, expected)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent Refueling ON command", found);

    // Set Refueling to FALSE for Lane 0
    serialConnection.allWrittenData.clear();
    protocol.setRefueling(0, false);
    // Message: 0x4C, 0x08, 0x01, 0x00, 0x00, 0x00, 0x00, 0x3B
    byte[] expectedOff = {0x4C, 0x08, 0x01, 0x00, 0x00, 0x00, 0x00, 0x3B};
    found = false;
    for (byte[] msg : serialConnection.allWrittenData) {
      if (Arrays.equals(msg, expectedOff)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent Refueling OFF command", found);
  }

  @Test
  public void testSetHeatProgress() {
    protocol.open();
    // Verify version to allow commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    // Configure Pin 8 as RGB String
    config.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(8, PinBehavior.BEHAVIOR_LED_RGB_STRING.getNumber());

    // Setup an LED string with Heat Progress behavior (Value 2)
    LedString ledString = new LedString();
    ledString.pin = 8;
    ledString.brightness = 255;
    ledString.addressableLeds = 1;
    ledString.leds =
        Collections.singletonList(
            com.antigravity.proto.RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    protocol.updateConfig(config);
    serialConnection.allWrittenData.clear();

    // 10% progress -> Should be GREEN (normalizedProgress 0.1 < 0.5)
    protocol.setHeatProgress(0.1);

    // Message: 0x4C, 0x08, 0x01, 0x00, 0x00, 0xFF, 0x00, 0x3B
    byte[] expected = {0x4C, 0x08, 0x01, 0x00, 0x00, (byte) 0xFF, 0x00, 0x3B};
    boolean found = false;
    for (byte[] msg : serialConnection.allWrittenData) {
      if (Arrays.equals(msg, expected)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent Heat Progress Green command", found);
  }

  @Test
  public void testVersionVerification_StrayBytes() {
    protocol.open();
    // Clear initial RESET command from history to make verification cleaner
    serialConnection.allWrittenData.clear();

    // Simulate stray heartbeat byte 'T' (0x54) followed by version message
    // 0x54 + {0x56, 2, 1, 0, 0, 0x3B}
    // Note: The previous bug would have treated [0x54 ... 0x3B] as a 7-byte
    // heartbeat
    // and consumed the version opcode!
    byte[] strayAndVersion = {0x54, 0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(strayAndVersion);

    // Version should be verified now.
    // If verified, it sends Pin Mode ('P'), Debounce ('d'), etc.
    boolean foundConfigCommand = false;
    for (byte[] msg : serialConnection.allWrittenData) {
      if (msg.length > 0 && (msg[0] == 0x50 || msg[0] == 0x64)) {
        foundConfigCommand = true;
        break;
      }
    }
    assertTrue(
        "Should have sent configuration commands after version verification despite stray bytes",
        foundConfigCommand);
  }

  @Test
  public void testGetMaxBufferSize() {
    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    assertEquals(
        "Buffer size should be explicitly set to 128 for memory constraints",
        128,
        protocol.getMaxBufferSize());
  }

  @Test
  public void testUpdateConfig_ReconnectOnPortChange() {
    protocol.open();
    assertTrue("Should be open initially", serialConnection.isOpen());
    int initialConnections = serialConnection.connectionCount;
    assertEquals("COM1", serialConnection.lastPortName);

    ArduinoConfig newConfig = new ArduinoConfig();
    newConfig.commPort = "COM2"; // Changed
    newConfig.baudRate = 115200;
    newConfig.digitalIds = new ArrayList<>(config.digitalIds);
    newConfig.analogIds = new ArrayList<>(config.analogIds);

    protocol.updateConfig(newConfig);

    assertTrue("Should be open after reconnect", serialConnection.isOpen());
    assertEquals(
        "Connection count should have incremented",
        initialConnections + 1,
        serialConnection.connectionCount);
    assertEquals("Port name should have updated", "COM2", serialConnection.lastPortName);
  }

  @Test
  public void testUpdateConfig_NoReconnectOnSamePort() {
    protocol.open();
    int initialConnections = serialConnection.connectionCount;

    ArduinoConfig newConfig = new ArduinoConfig();
    newConfig.commPort = "COM1"; // Same
    newConfig.baudRate = 115200;
    newConfig.digitalIds = new ArrayList<>(config.digitalIds);
    newConfig.analogIds = new ArrayList<>(config.analogIds);
    newConfig.debounceUs = 5000; // Changed other field

    protocol.updateConfig(newConfig);

    assertEquals(initialConnections, serialConnection.connectionCount);
  }

  @Test
  public void testSetHeatStandings_SendsHeatLeaderMessage() {
    protocol.open();
    // Verify version to allow sending commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    // 1. Initial standings update: lane 1 is leader
    protocol.setHeatStandings(Arrays.asList(1, 0));

    // Expected: 0x45 0x01 0x01 0x3B
    byte[] expectedMsg = {0x45, 0x01, 0x01, 0x3B};
    boolean found =
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d));
    assertTrue("Should have sent heat leader message for lane 1", found);

    // 2. Standings update with same leader: lane 1 is still leader
    serialConnection.allWrittenData.clear();
    protocol.setHeatStandings(Arrays.asList(1, 0));
    boolean foundDuplicate =
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d));
    assertTrue("Should NOT have sent duplicate heat leader message", !foundDuplicate);

    // 3. Standings update with new leader: lane 0 is now leader
    serialConnection.allWrittenData.clear();
    protocol.setHeatStandings(Arrays.asList(0, 1));
    byte[] expectedNewMsg = {0x45, 0x01, 0x00, 0x3B};
    boolean foundNew =
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedNewMsg, d));
    assertTrue("Should have sent heat leader message for new leader lane 0", foundNew);
  }

  @Test
  public void testInitializeHardwareState_ResetsLeader() {
    protocol.open();
    // Verify version to allow sending commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    // 1. Initial leader: lane 1
    protocol.setHeatStandings(Arrays.asList(1, 0));
    byte[] expectedMsg = {0x45, 0x01, 0x01, 0x3B};
    assertTrue(
        "Should have sent heat leader message for lane 1",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d)));

    // 2. Initialize hardware state
    serialConnection.allWrittenData.clear();
    protocol.initializeHardwareState();

    // 3. Set standings with same leader lane 1 again
    protocol.setHeatStandings(Arrays.asList(1, 0));
    assertTrue(
        "Should send heat leader message again after initializeHardwareState reset",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d)));
  }

  @Test
  public void testSetHeatStandings_SendsHeatStandingsMessage() {
    protocol.open();
    // Verify version to allow sending commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    // 1. Initial standings update
    protocol.setHeatStandings(Arrays.asList(3, 2, 1, 0));

    // Expected: 0x45 0x02 0x04 0x03 0x02 0x01 0x00 0x3B
    byte[] expectedMsg = {0x45, 0x02, 0x04, 0x03, 0x02, 0x01, 0x00, 0x3B};
    boolean found =
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d));
    assertTrue("Should have sent heat standings message", found);

    // 2. Standings update with same order
    serialConnection.allWrittenData.clear();
    protocol.setHeatStandings(Arrays.asList(3, 2, 1, 0));
    boolean foundDuplicate =
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d));
    assertTrue("Should NOT have sent duplicate heat standings message", !foundDuplicate);

    // 3. Standings update with changed order
    serialConnection.allWrittenData.clear();
    protocol.setHeatStandings(Arrays.asList(3, 1, 2, 0));
    byte[] expectedNewMsg = {0x45, 0x02, 0x04, 0x03, 0x01, 0x02, 0x00, 0x3B};
    boolean foundNew =
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedNewMsg, d));
    assertTrue("Should have sent updated heat standings message", foundNew);
  }

  @Test
  public void testInitializeHardwareState_ResetsStandings() {
    protocol.open();
    // Verify version to allow sending commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    // 1. Initial standings
    protocol.setHeatStandings(Arrays.asList(3, 2, 1, 0));
    byte[] expectedMsg = {0x45, 0x02, 0x04, 0x03, 0x02, 0x01, 0x00, 0x3B};
    assertTrue(
        "Should have sent heat standings message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d)));

    // 2. Initialize hardware state
    serialConnection.allWrittenData.clear();
    protocol.initializeHardwareState();

    // 3. Set standings with same order again
    protocol.setHeatStandings(Arrays.asList(3, 2, 1, 0));
    assertTrue(
        "Should send heat standings message again after initializeHardwareState reset",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d)));
  }

  @Test
  public void testSetFuelLevel_SendsFuelPercentageMessage() {
    protocol.open();
    // Verify version to allow sending commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    // 1. Regular case: fuelLevel = 50.0, capacity = 100.0 (50%)
    protocol.setFuelLevel(0, 50.0, 100.0);
    byte[] expectedMsg1 = {0x45, 0x03, 0x00, 50, 0x3B};
    assertTrue(
        "Should have sent 50% fuel percentage message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg1, d)));

    // 2. Capacity 0 case -> 100%
    serialConnection.allWrittenData.clear();
    protocol.setFuelLevel(1, 0.0, 0.0);
    byte[] expectedMsg2 = {0x45, 0x03, 0x01, 100, 0x3B};
    assertTrue(
        "Should have sent 100% fuel percentage message for capacity 0",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg2, d)));

    // 3. Level <= 0 case -> 0%
    serialConnection.allWrittenData.clear();
    protocol.setFuelLevel(0, -5.0, 100.0);
    byte[] expectedMsg3 = {0x45, 0x03, 0x00, 0, 0x3B};
    assertTrue(
        "Should have sent 0% fuel percentage message for negative fuel level",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg3, d)));

    // 4. Level = 0 case -> 0%
    serialConnection.allWrittenData.clear();
    protocol.setFuelLevel(0, 0.0, 100.0);
    byte[] expectedMsg4 = {0x45, 0x03, 0x00, 0, 0x3B};
    assertTrue(
        "Should have sent 0% fuel percentage message for 0 fuel level",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg4, d)));

    // 5. Rounding case: 0.49% -> 0% (fuelLevel = 0.0049, capacity = 1.0)
    serialConnection.allWrittenData.clear();
    protocol.setFuelLevel(0, 0.0049, 1.0);
    byte[] expectedMsg5 = {0x45, 0x03, 0x00, 0, 0x3B};
    assertTrue(
        "Should have rounded 0.49% down to 0%",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg5, d)));

    // 6. Rounding case: 0.50% -> 1% (fuelLevel = 0.005, capacity = 1.0)
    serialConnection.allWrittenData.clear();
    protocol.setFuelLevel(0, 0.005, 1.0);
    byte[] expectedMsg6 = {0x45, 0x03, 0x00, 1, 0x3B};
    assertTrue(
        "Should have rounded 0.50% up to 1%",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg6, d)));

    // 7. Clamp case: level > capacity -> 100%
    serialConnection.allWrittenData.clear();
    protocol.setFuelLevel(0, 150.0, 100.0);
    byte[] expectedMsg7 = {0x45, 0x03, 0x00, 100, 0x3B};
    assertTrue(
        "Should have clamped percentage to 100%",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg7, d)));
  }

  @Test
  public void testSetRaceState_SendsCorrectMessages() {
    protocol.open();
    // Verify version to allow sending commands
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    // 1. NotStarted, no auto-start, no warmup -> State 0, Value 0
    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.RED, 0.0);
    byte[] expectedMsg1 = {0x45, 0x00, 0, 0, 0x3B};
    assertTrue(
        "Should send NotStarted state message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg1, d)));

    // Verify duplicate is cached
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.RED, 0.0);
    assertEquals("Should not send duplicate message", 0, serialConnection.allWrittenData.size());

    // 2. NotStarted, auto-starting but no warmup -> State 0, Value 1
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.RED, 10.0);
    byte[] expectedMsg2 = {0x45, 0x00, 0, 1, 0x3B};
    assertTrue(
        "Should send NotStarted auto-starting message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg2, d)));

    // 3. NotStarted, warmup but no auto-start countdown -> State 0, Value 2
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.GREEN_YELLOW, 0.0);
    byte[] expectedMsg3 = {0x45, 0x00, 0, 2, 0x3B};
    assertTrue(
        "Should send NotStarted warmup message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg3, d)));

    // 4. NotStarted, auto-starting and warmup -> State 0, Value 3
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.GREEN_YELLOW, 10.0);
    byte[] expectedMsg4 = {0x45, 0x00, 0, 3, 0x3B};
    assertTrue(
        "Should send NotStarted auto-starting warmup message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg4, d)));

    // 5. Starting countdown at 5s -> State 2, Value 5
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.STARTING, RaceFlag.RED, 4.2);
    byte[] expectedMsg5 = {0x45, 0x00, 2, 5, 0x3B};
    assertTrue(
        "Should send Starting countdown message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg5, d)));

    // Verify duplicate starting countdown at 4.2 doesn't send
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.STARTING, RaceFlag.RED, 4.1);
    assertEquals(
        "Should not send duplicate count since rounded value is still 5",
        0,
        serialConnection.allWrittenData.size());

    // Countdown changes to 4 -> State 2, Value 4
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.STARTING, RaceFlag.RED, 3.8);
    byte[] expectedMsg5_2 = {0x45, 0x00, 2, 4, 0x3B};
    assertTrue(
        "Should send updated Starting countdown message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg5_2, d)));

    // 6. Restarting countdown at 3s -> State 3, Value 3
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.STARTING, RaceFlag.YELLOW, 2.5);
    byte[] expectedMsg6 = {0x45, 0x00, 3, 3, 0x3B};
    assertTrue(
        "Should send Restarting countdown message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg6, d)));

    // 7. Racing -> State 4, Value 0
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
    byte[] expectedMsg7 = {0x45, 0x00, 4, 0, 0x3B};
    assertTrue(
        "Should send Racing state message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg7, d)));

    // 8. Paused -> State 5, Value 0
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.PAUSED, RaceFlag.RED, 0.0);
    byte[] expectedMsg8 = {0x45, 0x00, 5, 0, 0x3B};
    assertTrue(
        "Should send Paused state message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg8, d)));

    // 9. HeatOver, auto-advancing and warmup -> State 6, Value 3
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.HEAT_OVER, RaceFlag.GREEN_YELLOW, 15.0);
    byte[] expectedMsg9 = {0x45, 0x00, 6, 3, 0x3B};
    assertTrue(
        "Should send HeatOver state message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg9, d)));

    // 10. RaceOver -> State 7, Value 0
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.RACE_OVER, RaceFlag.CHECKERED, 0.0);
    byte[] expectedMsg10 = {0x45, 0x00, 7, 0, 0x3B};
    assertTrue(
        "Should send RaceOver state message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg10, d)));
  }

  @Test
  public void testInitializeHardwareState_ResetsRaceStateCache() {
    protocol.open();
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.RED, 0.0);
    byte[] expectedMsg = {0x45, 0x00, 0, 0, 0x3B};
    assertTrue(
        "Should send NotStarted state message",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d)));

    // Try sending same state again, should be cached
    serialConnection.allWrittenData.clear();
    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.RED, 0.0);
    assertEquals("Should be cached", 0, serialConnection.allWrittenData.size());

    // Initialize hardware state (should clear cache)
    protocol.initializeHardwareState();
    serialConnection.allWrittenData.clear();

    // Send same state again, should NOT be cached now
    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.RED, 0.0);
    assertTrue(
        "Should send message again after reset",
        serialConnection.allWrittenData.stream().anyMatch(d -> Arrays.equals(expectedMsg, d)));
  }

  @Test
  public void testClose_SendsClosingState() {
    protocol.open();
    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    serialConnection.injectData(versionMsg);
    serialConnection.allWrittenData.clear();

    protocol.close();

    byte[] expectedClosingMsg = {0x45, 0x00, 8, 0, 0x3B};
    assertTrue(
        "Should send closing state message on close",
        serialConnection.allWrittenData.stream()
            .anyMatch(d -> Arrays.equals(expectedClosingMsg, d)));
  }
}
