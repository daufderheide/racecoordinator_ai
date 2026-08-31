package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.mocks.MockProtocolListener;
import com.antigravity.mocks.MockScheduler;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.protocols.bart.BartConfig;
import com.antigravity.protocols.bart.BartCrc;
import com.antigravity.protocols.bart.BartProtocol;
import com.antigravity.protocols.interfaces.BleConnection;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.antigravity.protocols.phidget.PhidgetConfig;
import com.antigravity.protocols.phidget.PhidgetProtocol;
import com.antigravity.protocols.trackmate.TrackmateConfig;
import com.antigravity.protocols.trackmate.TrackmateProtocol;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.concurrent.ScheduledExecutorService;
import org.junit.Before;
import org.junit.Test;

public class ProtocolDelegateTest {

  private IProtocol proto1;
  private IProtocol proto2;
  private ProtocolDelegate delegate;

  private static class MockSerialConnection extends SerialConnection {
    boolean open = false;
    SerialPortDataListener listener;
    SerialPort mockPort = mock(SerialPort.class);

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
    public void writeData(byte[] data) throws IOException {}

    public void injectData(byte[] data) {
      if (listener != null) {
        SerialPortEvent event =
            new SerialPortEvent(mockPort, SerialPort.LISTENING_EVENT_DATA_RECEIVED, data);
        listener.serialEvent(event);
      }
    }
  }

  private static class TestableArduinoProtocol extends ArduinoProtocol {
    private final MockScheduler mockScheduler;

    public TestableArduinoProtocol(
        ArduinoConfig config,
        int numLanes,
        MockSerialConnection serialConnection,
        MockScheduler scheduler) {
      super(config, numLanes, serialConnection, scheduler);
      this.mockScheduler = scheduler;
    }

    @Override
    protected ScheduledExecutorService createScheduler() {
      if (mockScheduler != null && mockScheduler.isShutdown()) {
        mockScheduler.reset();
      }
      return mockScheduler != null ? mockScheduler : super.createScheduler();
    }
  }

  private static class TestableTrackmateProtocol extends TrackmateProtocol {
    private final MockScheduler mockScheduler;

    public TestableTrackmateProtocol(
        TrackmateConfig config,
        int numLanes,
        MockSerialConnection serialConnection,
        MockScheduler scheduler) {
      super(config, numLanes, serialConnection, scheduler);
      this.mockScheduler = scheduler;
    }

    @Override
    protected ScheduledExecutorService createScheduler() {
      if (mockScheduler != null && mockScheduler.isShutdown()) {
        mockScheduler.reset();
      }
      return mockScheduler != null ? mockScheduler : super.createScheduler();
    }
  }

  @Before
  public void setUp() {
    BleConnection.mockMode = true;
    proto1 = mock(IProtocol.class);
    proto2 = mock(IProtocol.class);
    delegate = new ProtocolDelegate(Arrays.asList(proto1, proto2));
  }

  @Test
  public void testOpenAndClose() {
    when(proto1.open()).thenReturn(true);
    when(proto2.open()).thenReturn(true);
    assertTrue(delegate.open());

    delegate.close();
    verify(proto1).close();
    verify(proto2).close();
  }

  @Test
  public void testClearLedsAndSetRaceState() {
    delegate.clearLeds();
    verify(proto1).clearLeds();
    verify(proto2).clearLeds();

    delegate.setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
    verify(proto1).setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
    verify(proto2).setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
  }

  @Test
  public void testRelaysAndFuelChecks() {
    when(proto1.hasPerLaneRelays()).thenReturn(false);
    when(proto2.hasPerLaneRelays()).thenReturn(true);
    assertTrue(delegate.hasPerLaneRelays());

    when(proto1.hasDigitalFuel()).thenReturn(true);
    assertTrue(delegate.hasDigitalFuel());

    when(proto1.hasMainRelay()).thenReturn(true);
    assertTrue(delegate.hasMainRelay());
  }

  @Test
  public void testTimerAndLanes() {
    delegate.startTimer();
    verify(proto1).startTimer();
    verify(proto2).startTimer();

    when(proto1.getNumLanes()).thenReturn(4);
    assertEquals(4, delegate.getNumLanes());

    ProtocolDelegate empty = new ProtocolDelegate(Collections.emptyList());
    assertEquals(0, empty.getNumLanes());
    assertFalse(empty.isHealthy());
  }

  @Test
  public void testIsHealthy() {
    when(proto1.isHealthy()).thenReturn(true);
    when(proto2.isHealthy()).thenReturn(true);
    assertTrue(delegate.isHealthy());

    when(proto2.isHealthy()).thenReturn(false);
    assertFalse(delegate.isHealthy());
  }

  @Test
  public void testArduinoPitInAndPhidgetPitOut() throws Exception {
    MockScheduler scheduler = new MockScheduler();
    ArduinoConfig arduinoConfig = new ArduinoConfig();
    arduinoConfig.commPort = "COM3";
    arduinoConfig.normallyClosedLaneSensors = false;
    arduinoConfig.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    arduinoConfig.digitalIds.set(4, PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0);
    arduinoConfig.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    MockSerialConnection arduinoSerial = new MockSerialConnection();
    TestableArduinoProtocol arduino =
        new TestableArduinoProtocol(arduinoConfig, 2, arduinoSerial, scheduler);
    arduino.setInterfaceIndex(0);

    PhidgetConfig phidgetConfig = new PhidgetConfig();
    phidgetConfig.serialNumber = 12345;
    phidgetConfig.normallyClosedLaneSensors = false;
    phidgetConfig.lapPinPitBehavior = LapPinPitBehavior.NONE;
    phidgetConfig.digitalInIds =
        Arrays.asList(
            PinBehavior.BEHAVIOR_UNUSED_VALUE,
            PinBehavior.BEHAVIOR_UNUSED_VALUE,
            PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE + 0);

    PhidgetProtocol phidget = new PhidgetProtocol(phidgetConfig, 2, null);
    phidget.setInterfaceIndex(1);

    ProtocolDelegate pitDelegate = new ProtocolDelegate(Arrays.asList(arduino, phidget));
    MockProtocolListener listener = new MockProtocolListener();
    pitDelegate.setListener(listener);
    pitDelegate.open();

    assertTrue(pitDelegate.hasPitInConfigured(0));
    assertFalse(pitDelegate.hasPitInConfigured(1));
    assertFalse(pitDelegate.isLaneInPits(0));

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    arduinoSerial.injectData(versionMsg);

    byte[] pitInLow = {0x49, 0x44, 0x04, 0x00, 0x3B};
    arduinoSerial.injectData(pitInLow);

    assertTrue(pitDelegate.isLaneInPits(0));
    assertTrue(arduino.isLaneInPits(0));
    assertTrue(phidget.isLaneInPits(0));
    assertEquals(1, listener.carData.size());
    assertEquals(CarLocation.PitRow, listener.carData.get(0).getLocation());
    assertTrue(listener.carData.get(0).getCanRefuel());

    Method handleDigitalChange =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    handleDigitalChange.setAccessible(true);
    handleDigitalChange.invoke(phidget, 2, PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE + 0, true);

    assertTrue(pitDelegate.isLaneInPits(0));
    assertEquals(1, listener.carData.size());

    handleDigitalChange.invoke(phidget, 2, PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE + 0, false);

    assertFalse(pitDelegate.isLaneInPits(0));
    assertFalse(arduino.isLaneInPits(0));
    assertFalse(phidget.isLaneInPits(0));
    assertEquals(2, listener.carData.size());
    assertEquals(CarLocation.Main, listener.carData.get(1).getLocation());
    assertFalse(listener.carData.get(1).getCanRefuel());

    pitDelegate.close();
  }

  @Test
  public void testArduinoPitInAndTrackmatePitOutPulse() {
    MockScheduler scheduler1 = new MockScheduler();
    MockScheduler scheduler2 = new MockScheduler();

    ArduinoConfig arduinoConfig = new ArduinoConfig();
    arduinoConfig.commPort = "COM3";
    arduinoConfig.normallyClosedLaneSensors = false;
    arduinoConfig.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    arduinoConfig.digitalIds.set(4, PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0);
    arduinoConfig.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    MockSerialConnection arduinoSerial = new MockSerialConnection();
    TestableArduinoProtocol arduino =
        new TestableArduinoProtocol(arduinoConfig, 2, arduinoSerial, scheduler1);
    arduino.setInterfaceIndex(0);

    TrackmateConfig tmConfig = new TrackmateConfig();
    tmConfig.commPort = "COM4";
    tmConfig.numLanes = 2;
    tmConfig.lapPinBehaviors =
        Arrays.asList(
            PinBehavior.BEHAVIOR_LAP_BASE_VALUE + 0, PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE + 0);

    MockSerialConnection tmSerial = new MockSerialConnection();
    TestableTrackmateProtocol trackmate =
        new TestableTrackmateProtocol(tmConfig, 2, tmSerial, scheduler2);
    trackmate.setInterfaceIndex(1);

    ProtocolDelegate pitDelegate = new ProtocolDelegate(Arrays.asList(arduino, trackmate));
    MockProtocolListener listener = new MockProtocolListener();
    pitDelegate.setListener(listener);
    pitDelegate.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    arduinoSerial.injectData(versionMsg);
    byte[] pitInLow = {0x49, 0x44, 0x04, 0x00, 0x3B};
    arduinoSerial.injectData(pitInLow);

    assertTrue(pitDelegate.isLaneInPits(0));
    assertEquals(1, listener.carData.size());
    assertEquals(CarLocation.PitRow, listener.carData.get(0).getLocation());

    byte[] tmPitOutMsg = {'B', 0x0D};
    tmSerial.injectData(tmPitOutMsg);

    assertFalse(pitDelegate.isLaneInPits(0));
    assertEquals(2, listener.carData.size());
    assertEquals(CarLocation.Main, listener.carData.get(1).getLocation());

    pitDelegate.close();
  }

  @Test
  public void testBartPitInAndArduinoPitOut() {
    MockScheduler scheduler = new MockScheduler();

    BartConfig bartConfig = new BartConfig();
    bartConfig.deviceName = "BART_TEST";
    bartConfig.deviceAddress = "AA:BB:CC:DD:EE:FF";
    bartConfig.numLanes = 2;
    bartConfig.lapPinBehaviors =
        Arrays.asList(
            PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + 0, PinBehavior.BEHAVIOR_LAP_BASE_VALUE + 1);

    BleConnection bartConnection =
        new BleConnection(bartConfig.deviceName, bartConfig.deviceAddress);
    BartProtocol bart = new BartProtocol(bartConfig, 2, bartConnection, scheduler);
    bart.setInterfaceIndex(0);

    ArduinoConfig arduinoConfig = new ArduinoConfig();
    arduinoConfig.commPort = "COM3";
    arduinoConfig.normallyClosedLaneSensors = false;
    arduinoConfig.digitalIds =
        new ArrayList<>(Collections.nCopies(10, PinBehavior.BEHAVIOR_UNUSED.getNumber()));
    arduinoConfig.digitalIds.set(5, PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0);
    arduinoConfig.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.NONE;

    MockSerialConnection arduinoSerial = new MockSerialConnection();
    TestableArduinoProtocol arduino =
        new TestableArduinoProtocol(arduinoConfig, 2, arduinoSerial, scheduler);
    arduino.setInterfaceIndex(1);

    ProtocolDelegate pitDelegate = new ProtocolDelegate(Arrays.asList(bart, arduino));
    MockProtocolListener listener = new MockProtocolListener();
    pitDelegate.setListener(listener);
    pitDelegate.open();

    byte[] versionMsg = {0x56, 2, 1, 0, 0, 0x3B};
    arduinoSerial.injectData(versionMsg);

    byte[] pitInNoCrc =
        new byte[] {(byte) 0xA5, 0x01, 0x01, 0x00, 0x01, (byte) 0xE8, 0x03, 0x64, 0x00};
    byte[] pitInPacket = new byte[10];
    System.arraycopy(pitInNoCrc, 0, pitInPacket, 0, 9);
    pitInPacket[9] = BartCrc.calculateCrc(pitInNoCrc);
    bartConnection.injectReceivedData(pitInPacket);

    assertTrue(pitDelegate.isLaneInPits(0));
    assertEquals(1, listener.carData.size());
    assertEquals(CarLocation.PitRow, listener.carData.get(0).getLocation());

    byte[] pitOutLow = {0x49, 0x44, 0x05, 0x00, 0x3B};
    arduinoSerial.injectData(pitOutLow);
    assertTrue(pitDelegate.isLaneInPits(0));

    byte[] pitOutHigh = {0x49, 0x44, 0x05, 0x01, 0x3B};
    arduinoSerial.injectData(pitOutHigh);

    assertFalse(pitDelegate.isLaneInPits(0));
    assertEquals(2, listener.carData.size());
    assertEquals(CarLocation.Main, listener.carData.get(1).getLocation());

    pitDelegate.close();
  }
}
