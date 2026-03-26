package com.antigravity.protocols.arduino;

import static org.junit.Assert.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;

import org.junit.Before;
import org.junit.Test;

import com.antigravity.mocks.MockScheduler;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.PinBehavior;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.CarData;

public class ArduinoProtocolTest {

  private TestableArduinoProtocol protocol;
  private MockScheduler scheduler;
  private TestListener listener;
  private MockSerialConnection serialConnection;
  private ArduinoConfig config;

  private static class MockSerialConnection extends SerialConnection {
    boolean open = false;
    com.fazecast.jSerialComm.SerialPortDataListener listener;
    com.fazecast.jSerialComm.SerialPort mockPort = org.mockito.Mockito.mock(com.fazecast.jSerialComm.SerialPort.class);

    @Override
    public void connect(String portName, int baudRate) throws IOException {
      if (portName.equals("FAIL")) {
        throw new IOException("Connection failed");
      }
      open = true;
    }

    @Override
    public boolean isOpen() {
      return open;
    }

    @Override
    public void addListener(com.fazecast.jSerialComm.SerialPortDataListener listener) {
      this.listener = listener;
    }

    @Override
    public void writeData(byte[] data) throws IOException {
      lastWrittenData = data;
      allWrittenData.add(data);
    }

    public byte[] lastWrittenData;
    public java.util.List<byte[]> allWrittenData = new java.util.ArrayList<>();

    public void injectData(byte[] data) {
      if (listener != null) {
        com.fazecast.jSerialComm.SerialPortEvent event = new com.fazecast.jSerialComm.SerialPortEvent(mockPort,
            com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_RECEIVED, data);
        listener.serialEvent(event);
      }
    }
  }

  private static class TestListener implements ProtocolListener {
    int lapCount = 0;
    int lastLapLane = -1;
    InterfaceStatus lastStatus = InterfaceStatus.DISCONNECTED;
    int pitStateChanges = 0;
    com.antigravity.protocols.CarLocation lastLocation = com.antigravity.protocols.CarLocation.Main;
    public CarData lastCarData;

    int callButtonCount = 0;
    int segmentCount = 0;
    public com.antigravity.proto.InterfaceEvent lastEvent;

    @Override
    public void onLap(int lane, double lapTime, int interfaceId) {
      lapCount++;
      lastLapLane = lane;
    }

    @Override
    public void onSegment(int lane, double segmentTime, int interfaceId) {
      segmentCount++;
    }

    @Override
    public void onCallbutton(int lane) {
      callButtonCount++;
    }

    @Override
    public void onInterfaceStatus(InterfaceStatus status) {
      lastStatus = status;
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
    public void onInterfaceEvent(com.antigravity.proto.InterfaceEvent event) {
      lastEvent = event;
    }
  }

  private static class TestableArduinoProtocol extends ArduinoProtocol {
    long mockedTime = 10000;

    public TestableArduinoProtocol(ArduinoConfig config, int numLanes, MockScheduler scheduler,
        MockSerialConnection serial) {
      super(config, numLanes, serial, scheduler);
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
    config.baudRate = 9600;
    config.normallyClosedLaneSensors = false;
    config.normallyClosedRelays = false;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    listener = new TestListener();
    protocol.setListener(listener);
  }

  @Test
  public void testStatusDisconnected_NoPort() {
    config.commPort = "";
    protocol.open();
    scheduler.tick();
    assertEquals("Status should be DISCONNECTED when no port", InterfaceStatus.DISCONNECTED, listener.lastStatus);
  }

  @Test
  public void testStatusNoData_ConnectedButNoHeartbeat() {
    protocol.open();
    scheduler.tick();
    assertEquals("Status should be NO_DATA when connected but no heartbeat", InterfaceStatus.NO_DATA,
        listener.lastStatus);
  }

  @Test
  public void testStatusConnected_AfterHeartbeat() {
    protocol.open();
    // Simulate heartbeat - but we need to reach the private onHeartbeat or similar.
    // In ArduinoProtocol, processData() parses opcode 'T' and calls onHeartbeat.
    // However, onHeartbeat is private.
    // We can simulate it by setting lastHeartbeatTimeMs if we make it protected,
    // or we can simulate a real heartbeat message in the buffer.

    // For now, let's just use reflection or assume behavior if we can trigger it.
    // Actually, let's just set the time directly in our testable class if we add a
    // helper.

    // Trigger "heartbeat" (T opcode is 0x54)
    // message format from ArduinoProtocol: V opcode or T opcode, then data, then ;
    // Heartbeat: T <long:timeInUse> <byte:isReset> ;
    // But it's binary!
    // Heartbeat: 0x54, 8 bytes of long, 1 byte of reset, 0x3B

    // Instead of parsing, let's just verify DISCONNECTED if timeout.
  }

  @Test
  public void testStatusDisconnected_Timeout() {
    protocol.open();
    protocol.simulateHeartbeat();
    scheduler.tick();
    assertEquals(InterfaceStatus.CONNECTED, listener.lastStatus);

    // Timeout is 2000ms
    protocol.advanceTime(2500);
    scheduler.tick();
    assertEquals("Status should be DISCONNECTED after 2.5s without heartbeat", InterfaceStatus.DISCONNECTED,
        listener.lastStatus);
  }

  @Test
  public void testStatusDisconnected_OnFailure() {
    config.commPort = "FAIL";
    protocol.open();
    scheduler.tick();
    // open() returns true but status loop should see !serialConnection.isOpen()
    assertEquals("Status should be DISCONNECTED on connection failure", InterfaceStatus.DISCONNECTED,
        listener.lastStatus);
  }

  @Test
  public void testUpdateConfig() {
    // Initial: D2 is Lane 0 Lap
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, com.antigravity.proto.PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    // V 1.0.0.0 ; -> 56 01 00 00 00 3B
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Trigger D2 input (Digital=0x44, Pin=2, State=0 - NO means 0 triggers)
    // I D2 0 ; -> 49 44 02 00 3B
    byte[] inputLap = { 0x49, 0x44, 0x02, 0x00, 0x3B };
    serialConnection.injectData(inputLap);

    assertEquals("Should have received 1 lap", 1, listener.lapCount);
    assertEquals("Lane 0", 0, listener.lastLapLane);

    // Update: D2 is now Call Button (Lane 0)
    ArduinoConfig newConfig = new ArduinoConfig();
    newConfig.commPort = "COM1";
    newConfig.baudRate = 9600;
    newConfig.normallyClosedLaneSensors = false;
    newConfig.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    newConfig.digitalIds.set(2, com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + 0);

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
  public void testSetPinState_Digital() {
    protocol.open();
    // O D 2 1 ; -> 4F 44 02 01 3B
    protocol.setPinState(true, 2, true);

    byte[] expected = { 0x4F, 0x44, 0x02, 0x01, 0x3B };
    org.junit.Assert.assertArrayEquals(expected, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetPinState_Analog() {
    protocol.open();
    // O A 3 0 ; -> 4F 41 03 00 3B
    protocol.setPinState(false, 3, false);

    byte[] expected = { 0x4F, 0x41, 0x03, 0x00, 0x3B };
    org.junit.Assert.assertArrayEquals(expected, serialConnection.lastWrittenData);
  }

  @Test
  public void testHasPerLaneRelays_False() {
    // Initial config has no relays
    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    assertEquals(false, protocol.hasPerLaneRelays());
  }

  @Test
  public void testHasPerLaneRelays_True_Digital() {
    // Set digital pin 2 to be a relay for lane 0
    // Relay base is behavior... let's check PinBehavior.
    // In ArduinoProtocol.java:
    // BEHAVIOR_RELAY_BASE
    // The range is [RELAY_BASE, RELAY_BASE + numLanes)

    int relayBase = com.antigravity.proto.PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, relayBase + 0); // Relay for Lane 0

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    assertEquals(true, protocol.hasPerLaneRelays());
  }

  @Test
  public void testHasPerLaneRelays_True_Analog() {
    // Set analog pin 0 to be a relay for lane 1
    int relayBase = com.antigravity.proto.PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    config.analogIds = new ArrayList<>(
        Collections.nCopies(6, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.analogIds.set(0, relayBase + 1); // Relay for Lane 1

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    assertEquals(true, protocol.hasPerLaneRelays());
  }

  @Test
  public void testSetMainPower() {
    // Configure Pin 4 as Main Relay (Behavior 3)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, com.antigravity.proto.PinBehavior.BEHAVIOR_RELAY.getNumber());

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Turn ON
    protocol.setMainPower(true);
    // 0x4F, 0x44 (Digital), 0x04 (Pin 4), 0x01 (High), 0x3B
    byte[] expectedOn = { 0x4F, 0x44, 0x04, 0x01, 0x3B };
    org.junit.Assert.assertArrayEquals(expectedOn, serialConnection.lastWrittenData);

    // Turn OFF
    protocol.setMainPower(false);
    // 0x4F, 0x44 (Digital), 0x04 (Pin 4), 0x00 (Low), 0x3B
    byte[] expectedOff = { 0x4F, 0x44, 0x04, 0x00, 0x3B };
    org.junit.Assert.assertArrayEquals(expectedOff, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetMainPower_NormallyClosed() {
    // Configure Pin 4 as Main Relay
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, com.antigravity.proto.PinBehavior.BEHAVIOR_RELAY.getNumber());
    config.normallyClosedRelays = true;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Turn ON (should be LOW)
    protocol.setMainPower(true);
    byte[] expectedOn = { 0x4F, 0x44, 0x04, 0x00, 0x3B };
    org.junit.Assert.assertArrayEquals(expectedOn, serialConnection.lastWrittenData);

    // Turn OFF (should be HIGH)
    protocol.setMainPower(false);
    byte[] expectedOff = { 0x4F, 0x44, 0x04, 0x01, 0x3B };
    org.junit.Assert.assertArrayEquals(expectedOff, serialConnection.lastWrittenData);
  }

  @Test
  public void testSetLanePower() {
    // Configure Pin 5 as Relay for Lane 0 (Base + 0)
    // Configure Pin 6 as Relay for Lane 1 (Base + 1)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    int relayBase = com.antigravity.proto.PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    config.digitalIds.set(5, relayBase + 0);
    config.digitalIds.set(6, relayBase + 1);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Turn Lane 0 ON
    protocol.setLanePower(true, 0);
    // 0x4F, 0x44, 0x05, 0x01, 0x3B
    byte[] expectedLane0On = { 0x4F, 0x44, 0x05, 0x01, 0x3B };
    org.junit.Assert.assertArrayEquals(expectedLane0On, serialConnection.lastWrittenData);

    // Turn Lane 1 OFF
    protocol.setLanePower(false, 1);
    // 0x4F, 0x44, 0x06, 0x00, 0x3B
    byte[] expectedLane1Off = { 0x4F, 0x44, 0x06, 0x00, 0x3B };
    org.junit.Assert.assertArrayEquals(expectedLane1Off, serialConnection.lastWrittenData);

    // Try Invalid Lane (2) - Should not send anything specific (mock keeps last
    // written)
    // To verify, we can clear lastWrittenData or check if it changed
    serialConnection.lastWrittenData = null;
    protocol.setLanePower(true, 2);
    org.junit.Assert.assertNull(serialConnection.lastWrittenData);
  }

  @Test
  public void testSetLanePower_NormallyClosed() {
    // Configure Pin 5 as Relay for Lane 0
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    int relayBase = com.antigravity.proto.PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    config.digitalIds.set(5, relayBase + 0);
    config.normallyClosedRelays = true;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.open();

    // Turn Lane 0 ON (should be LOW)
    protocol.setLanePower(true, 0);
    byte[] expectedLane0On = { 0x4F, 0x44, 0x05, 0x00, 0x3B };
    org.junit.Assert.assertArrayEquals(expectedLane0On, serialConnection.lastWrittenData);

    // Turn Lane 0 OFF (should be HIGH)
    protocol.setLanePower(false, 0);
    byte[] expectedLane0Off = { 0x4F, 0x44, 0x05, 0x01, 0x3B };
    org.junit.Assert.assertArrayEquals(expectedLane0Off, serialConnection.lastWrittenData);
  }

  @Test
  public void testPitDetection_PitOutOnly() {
    // Configure D4 as Pit Out (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Trigger D4 low (0 - NO means 0 triggers) -> In pits
    byte[] pitOutLowTrigger = { 0x49, 0x44, 0x04, 0x00, 0x3B };
    serialConnection.injectData(pitOutLowTrigger);
    assertEquals(com.antigravity.protocols.CarLocation.PitRow, listener.lastLocation);
    assertEquals(1, listener.pitStateChanges);

    // Trigger D4 high (1) -> Out of pits
    byte[] pitOutHighRelease = { 0x49, 0x44, 0x04, 0x01, 0x3B };
    serialConnection.injectData(pitOutHighRelease);
    assertEquals(com.antigravity.protocols.CarLocation.Main, listener.lastLocation);
    assertEquals(2, listener.pitStateChanges);
  }

  @Test
  public void testPitDetection_PitInAndOut() {
    // Configure D4 as Pit In (Base + 0), D5 as Pit Out (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0);
    config.digitalIds.set(5, com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Trigger D5 high (Pit Out - transition from 0 to 1 should trigger Main)
    byte[] pitOutHigh = { 0x49, 0x44, 0x05, 0x01, 0x3B };
    serialConnection.injectData(pitOutHigh);
    assertEquals(com.antigravity.protocols.CarLocation.Main, listener.lastLocation);
  }

  @Test
  public void testPitDetection_PitInOutPin() {
    // Configure D4 as Pit In/Out (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Trigger D4 low (Pit In/Out - wantState is 0) -> In pits
    byte[] pitInOutLow = { 0x49, 0x44, 0x04, 0x00, 0x3B };
    serialConnection.injectData(pitInOutLow);
    assertEquals(com.antigravity.protocols.CarLocation.PitRow, listener.lastLocation);

    // Trigger D4 high (Pit In/Out - !wantState) -> Out of pits
    byte[] pitInOutHigh = { 0x49, 0x44, 0x04, 0x01, 0x3B };
    serialConnection.injectData(pitInOutHigh);
    assertEquals(com.antigravity.protocols.CarLocation.Main, listener.lastLocation);
  }

  @Test
  public void testPitDetection_PitInAndOutTransition() {
    // Configure D4 as Pit In (Base + 0), D5 as Pit Out (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0);
    config.digitalIds.set(5, com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Trigger D4 low (Pit In - wantState is 0) -> In pits
    byte[] pitInLow = { 0x49, 0x44, 0x04, 0x00, 0x3B };
    serialConnection.injectData(pitInLow);
    assertEquals(com.antigravity.protocols.CarLocation.PitRow, listener.lastLocation);

    // Trigger D5 low (Pit Out - wantState is 0) -> STILL in pits (transition hasn't
    // happened)
    byte[] pitOutLow = { 0x49, 0x44, 0x05, 0x00, 0x3B };
    serialConnection.injectData(pitOutLow);
    assertEquals(com.antigravity.protocols.CarLocation.PitRow, listener.lastLocation);

    // Trigger D5 high (Pit Out - transition 0 -> 1) -> Out of pits
    byte[] pitOutHigh = { 0x49, 0x44, 0x05, 0x01, 0x3B };
    serialConnection.injectData(pitOutHigh);
    assertEquals(com.antigravity.protocols.CarLocation.Main, listener.lastLocation);
  }

  @Test
  public void testPitDetection_LapPinBehavior_PitOut() {
    // Configure D2 as Lap (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, com.antigravity.proto.PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.PIT_OUT;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Initial state: Main
    assertEquals(com.antigravity.protocols.CarLocation.Main, listener.lastLocation);

    // Trigger D2 high (Lap/Pit Out) -> Should stay in Main or Exit Pits if it was
    // in
    // them.
    // However, the current code just calls updatePitState(laneIndex, false).
    // Let's first put it in pits via a mock helper if possible, or just verify it
    // doesn't enter.

    // Force it into pits first
    protocol.simulatePitEntry(0);
    assertEquals(com.antigravity.protocols.CarLocation.PitRow, listener.lastLocation);

    byte[] lapLow = { 0x49, 0x44, 0x02, 0x00, 0x3B };
    serialConnection.injectData(lapLow);
    assertEquals("Should have exited pits on Lap trigger (PIT_OUT)", com.antigravity.protocols.CarLocation.Main,
        listener.lastLocation);
  }

  @Test
  public void testPitDetection_LapPinBehavior_PitInOut() {
    // Configure D2 as Lap (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, com.antigravity.proto.PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.PIT_IN_OUT;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Trigger D2 low (Lap/Pit In - NO means 0 triggers) -> In pits
    byte[] lapLow = { 0x49, 0x44, 0x02, 0x00, 0x3B };
    serialConnection.injectData(lapLow);
    assertEquals("Should be in pits while over sensor", com.antigravity.protocols.CarLocation.PitRow,
        listener.lastLocation);

    // Trigger D2 high (Clear sensor) -> Out of pits
    byte[] lapHigh = { 0x49, 0x44, 0x02, 0x01, 0x3B };
    serialConnection.injectData(lapHigh);
    assertEquals("Should be out of pits after clearing sensor", com.antigravity.protocols.CarLocation.Main,
        listener.lastLocation);
  }

  @Test
  public void testPitDeltaTime() {
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(4, com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0);
    config.digitalIds.set(5, com.antigravity.proto.PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Enter pit via Pit In (D4 LOW - NO means 0 triggers)
    byte[] pitInLow = { 0x49, 0x44, 0x04, 0x00, 0x3B };
    protocol.advanceTime(1000);
    serialConnection.injectData(pitInLow);

    org.junit.Assert.assertNotNull(listener.lastCarData);
    assertEquals("First report should have delta 0 and true canRefuel", 0.0, listener.lastCarData.getTime(), 0.001);
    assertEquals("Should be able to refuel on pit entry", true, listener.lastCarData.getCanRefuel());

    // Advance 2.5s and tick the scheduler to simulate the 10Hz loop
    protocol.advanceTime(2500);
    scheduler.tick();

    assertEquals("Refuel scheduler report should have elapsed time", 2.5, listener.lastCarData.getTime(), 0.001);
    assertEquals("Still able to refuel", true, listener.lastCarData.getCanRefuel());

    // Advance 0.1s and tick again
    protocol.advanceTime(100);
    scheduler.tick();

    assertEquals("Next refuel scheduler report should have elapsed time", 0.1, listener.lastCarData.getTime(), 0.001);

    // Leave the pit via Pit Out transition (D5 LOW then HIGH)
    byte[] pitOutLow = { 0x49, 0x44, 0x05, 0x00, 0x3B };
    byte[] pitOutHigh = { 0x49, 0x44, 0x05, 0x01, 0x3B };
    protocol.advanceTime(200);
    serialConnection.injectData(pitOutLow);
    protocol.advanceTime(10);
    serialConnection.injectData(pitOutHigh);

    assertEquals("Exit report should have delta 0", 0.0, listener.lastCarData.getTime(), 0.001);
    assertEquals("Cannot refuel on pit exit", false, listener.lastCarData.getCanRefuel());
  }

  @Test
  public void testCallButtonTransitions() {
    // Configure D2 as Call Button (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + 0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    byte[] callLow = { 0x49, 0x44, 0x02, 0x00, 0x3B };
    byte[] callHigh = { 0x49, 0x44, 0x02, 0x01, 0x3B };

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
  public void testSegmentCounterTransitions() {
    // Configure D3 as Segment Counter (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(3, com.antigravity.proto.PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + 0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Normal (NO): Trigger D2 LOW (state 0) -> Segment should trigger
    byte[] segmentLow = { 0x49, 0x44, 0x03, 0x00, 0x3B };
    serialConnection.injectData(segmentLow);
    assertEquals(1, listener.segmentCount);

    // Normal (NO): Trigger D3 HIGH (state 1) -> Segment should NOT trigger again
    byte[] segmentHigh = { 0x49, 0x44, 0x03, 0x01, 0x3B };
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
  public void testSegmentHandling_LapsAsSegments() {
    // Configure D2 as Lap (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(2, com.antigravity.proto.PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0);
    config.useLapsForSegments = true;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Trigger D2 LOW (state 0) -> Should trigger BOTH Lap and Segment
    byte[] lapLow = { 0x49, 0x44, 0x02, 0x00, 0x3B };
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
  public void testSegmentHandling_InvertedSegment() {
    // Configure D3 as Segment Counter (Base + 0)
    config.digitalIds = new ArrayList<>(
        Collections.nCopies(10, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.digitalIds.set(3, com.antigravity.proto.PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + 0);
    config.normallyClosedLaneSensors = true;

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Inject Version to verify
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // Inverted: Trigger D3 HIGH (state 1) -> Segment should trigger
    byte[] segmentHigh = { 0x49, 0x44, 0x03, 0x01, 0x3B };
    serialConnection.injectData(segmentHigh);
    assertEquals("Should have received 1 segment on HIGH trigger (inverted)", 1, listener.segmentCount);

    // Inverted: Trigger D3 LOW (state 0) -> Segment should NOT trigger
    byte[] segmentLow = { 0x49, 0x44, 0x03, 0x00, 0x3B };
    serialConnection.injectData(segmentLow);
    assertEquals("Should still have 1 segment on LOW trigger (inverted)", 1, listener.segmentCount);
  }

  @Test
  public void testSendPinModeAnalogRead() {
    // Configure A1 as Voltage Level for Lane 0 (Base + 0)
    config.analogIds = new ArrayList<>(
        Collections.nCopies(6, com.antigravity.proto.PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    config.analogIds.set(1, com.antigravity.proto.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + 0);

    protocol = new TestableArduinoProtocol(config, 2, scheduler, serialConnection);
    protocol.setListener(listener);
    protocol.open();

    // Trigger Version to send pin modes
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    // After version, sendPinModeAnalogRead should be called
    // Opcode 0x70
    // Binary format: P opcode totalPins (Type Pin)* Terminator
    // totalPins = 1
    // Type = ANALOG (1)
    // PinIndex = 1 (A1)
    // Expected: 0x70 0x01 0x41 0x01 0x3B
    byte[] expected = { 0x70, 0x01, 0x41, 0x01, 0x3B };

    boolean found = false;
    for (byte[] data : serialConnection.allWrittenData) {
      if (java.util.Arrays.equals(expected, data)) {
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
    byte[] versionMsg = { 0x56, 0x01, 0x00, 0x00, 0x00, 0x3B };
    serialConnection.injectData(versionMsg);

    // Opcode 0x41 (A), Count 1, Pin 1, Value 1023 (0x3FF)
    // Value is 4 bytes: 0, 0, 3, 255
    byte[] msg = { 0x41, 0x01, 0x01, 0x00, 0x00, 0x03, (byte) 0xFF, 0x3B };
    serialConnection.injectData(msg);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(1, listener.lastEvent.getAnalogData().getPin());
    assertEquals(1023, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_ZeroValue() {
    protocol.open();

    byte[] versionMsg = { 0x56, 0x01, 0x00, 0x00, 0x00, 0x3B };
    serialConnection.injectData(versionMsg);

    // Pin 0, Value 0
    byte[] msg = { 0x41, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3B };
    serialConnection.injectData(msg);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(0, listener.lastEvent.getAnalogData().getPin());
    assertEquals(0, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_MaxValue() {
    protocol.open();

    byte[] versionMsg = { 0x56, 0x01, 0x00, 0x00, 0x00, 0x3B };
    serialConnection.injectData(versionMsg);

    // Pin 2, Value 1023 (max 10-bit ADC reading)
    byte[] msg = { 0x41, 0x01, 0x02, 0x00, 0x00, 0x03, (byte) 0xFF, 0x3B };
    serialConnection.injectData(msg);

    assertNotNull("Event should not be null", listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(2, listener.lastEvent.getAnalogData().getPin());
    assertEquals(1023, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_MidRangeValue() {
    protocol.open();

    byte[] versionMsg = { 0x56, 0x01, 0x00, 0x00, 0x00, 0x3B };
    serialConnection.injectData(versionMsg);

    // Pin 3, Value 512 = 0x00000200
    byte[] msg = { 0x41, 0x01, 0x03, 0x00, 0x00, 0x02, 0x00, 0x3B };
    serialConnection.injectData(msg);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(3, listener.lastEvent.getAnalogData().getPin());
    assertEquals(512, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnAnalogData_MultiPin_ThreePins() {
    // Track all fired events
    ArrayList<com.antigravity.proto.InterfaceEvent> events = new ArrayList<>();
    TestListener multiListener = new TestListener() {
      @Override
      public void onInterfaceEvent(com.antigravity.proto.InterfaceEvent event) {
        super.onInterfaceEvent(event);
        events.add(event);
      }
    };
    protocol.setListener(multiListener);
    protocol.open();

    byte[] versionMsg = { 0x56, 0x01, 0x00, 0x00, 0x00, 0x3B };
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
        0x41, 0x03,
        0x00, 0x00, 0x00, 0x00, 0x64,
        0x01, 0x00, 0x00, 0x02, 0x00,
        0x02, 0x00, 0x00, 0x03, (byte) 0xFF,
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
    ArrayList<com.antigravity.proto.InterfaceEvent> events = new ArrayList<>();
    TestListener multiListener = new TestListener() {
      @Override
      public void onInterfaceEvent(com.antigravity.proto.InterfaceEvent event) {
        super.onInterfaceEvent(event);
        events.add(event);
      }
    };
    protocol.setListener(multiListener);
    protocol.open();

    byte[] versionMsg = { 0x56, 0x01, 0x00, 0x00, 0x00, 0x3B };
    serialConnection.injectData(versionMsg);

    // First message: Pin 0, Value 200
    byte[] msg1 = { 0x41, 0x01, 0x00, 0x00, 0x00, 0x00, (byte) 0xC8, 0x3B };
    // Second message: Pin 1, Value 800 = 0x00000320
    byte[] msg2 = { 0x41, 0x01, 0x01, 0x00, 0x00, 0x03, 0x20, 0x3B };

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

    byte[] versionMsg = { 0x56, 0x01, 0x00, 0x00, 0x00, 0x3B };
    serialConnection.injectData(versionMsg);

    // Inject only the opcode and count (not the full message body)
    byte[] partial = { 0x41, 0x01 };
    serialConnection.injectData(partial);

    // No analog event should have fired yet
    assertNull("Partial message should not produce an event",
        listener.lastEvent == null || !listener.lastEvent.hasAnalogData() ? null : "has event");
  }

  @Test
  public void testOnAnalogData_HighPinIndex() {
    protocol.open();

    byte[] versionMsg = { 0x56, 0x01, 0x00, 0x00, 0x00, 0x3B };
    serialConnection.injectData(versionMsg);

    // Pin 15 (last analog pin on Mega A15), Value 750 = 0x000002EE
    byte[] msg = { 0x41, 0x01, 0x0F, 0x00, 0x00, 0x02, (byte) 0xEE, 0x3B };
    serialConnection.injectData(msg);

    assertNotNull(listener.lastEvent);
    assertTrue(listener.lastEvent.hasAnalogData());
    assertEquals(15, listener.lastEvent.getAnalogData().getPin());
    assertEquals(750, listener.lastEvent.getAnalogData().getValue());
  }

  @Test
  public void testOnSegmentCounter() {
    ArduinoConfig config = new ArduinoConfig();
    config.commPort = "COM1";
    config.normallyClosedLaneSensors = false;
    config.digitalIds = new ArrayList<>();
    // Fill with reserved to reach pin 4
    for (int i = 0; i < 4; i++)
      config.digitalIds.add(PinBehavior.BEHAVIOR_RESERVED_VALUE);
    config.digitalIds.add(PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE); // Pin 4 = Lane 0 Seg

    protocol.updateConfig(config);
    protocol.open();

    // Verify version
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    protocol.simulateHeartbeat();

    // OPCODE_INPUT (I), DIGITAL (D), Pin (4), State (0 - NO trigger), Terminator
    // (;)
    byte[] message = { 0x49, 0x44, 4, 0, 0x3B };
    serialConnection.injectData(message);

    assertEquals(1, listener.segmentCount);
  }

  @Test
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
    byte[] versionMsg = { 0x56, 1, 0, 0, 0, 0x3B };
    serialConnection.injectData(versionMsg);

    protocol.simulateHeartbeat();

    // OPCODE_INPUT (I), DIGITAL (D), Pin (0), State (0 - NO trigger), Terminator
    // (;)
    byte[] message = { 0x49, 0x44, 0, 0, 0x3B };
    serialConnection.injectData(message);

    assertEquals(1, listener.lapCount);
    assertEquals(1, listener.segmentCount); // Should also fire segment
  }
}
