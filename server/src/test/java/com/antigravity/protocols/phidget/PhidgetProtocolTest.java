package com.antigravity.protocols.phidget;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.PartialTime;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class PhidgetProtocolTest {

  private PhidgetConfig config;
  private PhidgetProtocol protocol;

  @Before
  public void setUp() {
    config = new PhidgetConfig();
    config.serialNumber = 12345;
    config.isHubPort = false;
    config.hubPort = 0;
    config.digitalInIds =
        Arrays.asList(PinBehavior.BEHAVIOR_UNUSED_VALUE, PinBehavior.BEHAVIOR_CALL_BUTTON_VALUE);
    config.digitalOutIds =
        Arrays.asList(
            PinBehavior.BEHAVIOR_RELAY_VALUE,
            PinBehavior.BEHAVIOR_RELAY_BASE_VALUE,
            PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG_VALUE,
            PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG_VALUE,
            PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE);
    config.analogIds = Arrays.asList(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE_VALUE);

    protocol = new PhidgetProtocol(config, 4, null);
    protocol.setInterfaceIndex(0);
  }

  @Test
  public void testInitialStateAndGetters() {
    assertEquals(0, protocol.getInterfaceIndex());
    assertEquals(4, protocol.getNumLanes());
    assertFalse(protocol.hasMainRelay()); // Not open yet
    assertFalse(protocol.hasPerLaneRelays()); // Not open yet
    assertFalse(protocol.hasDigitalFuel());
    assertFalse(protocol.isHealthy()); // Not open yet
  }

  @Test
  public void testUpdateConfig() {
    PhidgetConfig newConfig = new PhidgetConfig();
    newConfig.serialNumber = 67890;
    protocol.updateConfig(newConfig);
  }

  @Test
  public void testCheckAttachmentStatus() throws Exception {
    // Spy on the protocol so we can mock the hardware getAttached() loop
    PhidgetProtocol spyProtocol = org.mockito.Mockito.spy(protocol);

    // Set opened = true so the listener is notified
    java.lang.reflect.Field openedField = PhidgetProtocol.class.getDeclaredField("opened");
    openedField.setAccessible(true);
    openedField.set(spyProtocol, true);

    ProtocolListener mockListener = mock(ProtocolListener.class);
    spyProtocol.setListener(mockListener);

    java.lang.reflect.Method checkMethod =
        PhidgetProtocol.class.getDeclaredMethod("checkAttachmentStatus");
    checkMethod.setAccessible(true);

    // Test detached
    org.mockito.Mockito.doReturn(false).when(spyProtocol).isAnyChannelAttached();
    checkMethod.invoke(spyProtocol);
    assertFalse(spyProtocol.isHealthy());

    // Test attached
    org.mockito.Mockito.doReturn(true).when(spyProtocol).isAnyChannelAttached();
    checkMethod.invoke(spyProtocol);
    // Since configured pins exist and at least one channel is attached, it should be healthy
    assertTrue(spyProtocol.isHealthy());
    verify(mockListener).onInterfaceStatus(InterfaceStatus.CONNECTED, 0);
  }

  @Test
  public void testOpenFailureWhenNotConnectedOrDriverMissing() {
    // When Phidget device 12345 is not physically attached or native library linkage fails,
    // open() should gracefully return false without throwing uncaught exceptions.
    boolean result = protocol.open();
    assertFalse(result);
    assertFalse(protocol.isHealthy());
  }

  @Test
  public void testKeepAliveManagerLifecycle() throws Exception {
    // Calling open() should instantiate the keepAliveManager to prevent macOS USB thread
    // termination
    protocol.open();

    java.lang.reflect.Field keepAliveField =
        PhidgetProtocol.class.getDeclaredField("keepAliveManager");
    keepAliveField.setAccessible(true);
    Object keepAliveManager = keepAliveField.get(protocol);

    // In environments where JNI load is skipped, the manager might throw an UnsatisfiedLinkError,
    // but the object itself might still be instantiated or null depending on when it fails.
    // However, if the test is running with the driver, it should be instantiated.
    // We'll just verify that close() properly nullifies it regardless.

    protocol.close();
    Object keepAliveManagerAfterClose = keepAliveField.get(protocol);
    assertNull(keepAliveManagerAfterClose);
  }

  @Test
  public void testCloseSafetyAndStatusNotification() {
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    // Closing protocol should update health and notify listener of DISCONNECTED state
    protocol.close();
    assertFalse(protocol.hasMainRelay());
    assertFalse(protocol.isHealthy());
    verify(mockListener).onInterfaceStatus(InterfaceStatus.DISCONNECTED, 0);
  }

  @Test
  public void testStateAndPowerOperations() {
    // Operations on unopened outputs should catch PhidgetException silently without throwing
    protocol.setRaceState(RaceState.STARTING, RaceFlag.RED, 5.0);
    protocol.setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
    protocol.setRaceState(RaceState.RACING, RaceFlag.YELLOW, 0.0);
    protocol.clearLeds();
    protocol.setMainPower(true);
    protocol.setMainPower(false);
    protocol.setLanePower(true, 0);
    protocol.setLanePower(false, 0);
    protocol.setPinState(true, 0, true);
    protocol.setPinState(true, 0, false);
  }

  @Test
  public void testStartTimerAndStopTimerPartialTimes() throws Exception {
    protocol.startTimer();
    Thread.sleep(20);

    List<PartialTime> partialTimes = protocol.stopTimer();
    assertNotNull(partialTimes);
    assertEquals(4, partialTimes.size());

    for (int i = 0; i < 4; i++) {
      PartialTime pt = partialTimes.get(i);
      assertEquals(i, pt.getLaneIndex());
      assertTrue("Lap partial time should be positive", pt.getLapTime() > 0.0);
      assertTrue("Lap partial time should be small", pt.getLapTime() < 1.0);
      assertTrue("Segment partial time should be positive", pt.getSegmentTime() > 0.0);
    }
  }

  @Test
  public void testDigitalInputLapSoftwareTiming() throws Exception {
    config.normallyClosedLaneSensors = false;
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    protocol.startTimer();
    Thread.sleep(15);

    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    m.setAccessible(true);

    // Channel 0, PinBehavior BEHAVIOR_LAP_BASE_VALUE (lane 0), state true
    int lapBehavior = PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
    m.invoke(protocol, 0, lapBehavior, true);

    verify(mockListener).onLap(eq(0), anyDouble(), eq(0), eq(0));
  }

  @Test
  public void testPitInAndPitOutRefueling() throws Exception {
    config.normallyClosedLaneSensors = false;
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    m.setAccessible(true);

    int pitInBehavior = PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE;
    int pitOutBehavior = PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE;

    // Trigger Pit In for lane 0
    m.invoke(protocol, 0, pitInBehavior, true);

    ArgumentCaptor<CarData> captor = ArgumentCaptor.forClass(CarData.class);
    verify(mockListener, atLeastOnce()).onCarData(captor.capture());
    CarData lastData = captor.getValue();
    assertEquals(0, lastData.getLane());
    assertTrue(lastData.getCanRefuel());
    assertEquals(CarLocation.PitRow, lastData.getLocation());

    // Trigger Pit Out for lane 0
    m.invoke(protocol, 1, pitOutBehavior, true);
    m.invoke(protocol, 1, pitOutBehavior, false);

    verify(mockListener, atLeastOnce()).onCarData(captor.capture());
    CarData exitData = captor.getValue();
    assertEquals(0, exitData.getLane());
    assertFalse(exitData.getCanRefuel());
    assertEquals(CarLocation.Main, exitData.getLocation());
  }

  @Test
  public void testPitInOutRefueling() throws Exception {
    config.normallyClosedLaneSensors = false;
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    m.setAccessible(true);

    int pitInOutBehavior = PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE + 1; // lane 1

    // Stopping over Pit In/Out sensor on lane 1 -> active (in pits)
    m.invoke(protocol, 2, pitInOutBehavior, true);

    ArgumentCaptor<CarData> captor = ArgumentCaptor.forClass(CarData.class);
    verify(mockListener, atLeastOnce()).onCarData(captor.capture());
    CarData enterData = captor.getValue();
    assertEquals(1, enterData.getLane());
    assertTrue(enterData.getCanRefuel());

    // Driving off Pit In/Out sensor -> inactive (exits pits)
    m.invoke(protocol, 2, pitInOutBehavior, false);

    verify(mockListener, atLeastOnce()).onCarData(captor.capture());
    CarData exitData = captor.getValue();
    assertEquals(1, exitData.getLane());
    assertFalse(exitData.getCanRefuel());
  }

  @Test
  public void testLapSensorPitBehaviorRefueling() throws Exception {
    config.normallyClosedLaneSensors = false;
    config.lapPinPitBehavior = LapPinPitBehavior.PIT_IN_OUT;
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    m.setAccessible(true);

    int lapBehavior = PinBehavior.BEHAVIOR_LAP_BASE_VALUE + 2; // lane 2

    // Lap sensor active -> triggers lap AND enters pit
    m.invoke(protocol, 3, lapBehavior, true);

    ArgumentCaptor<CarData> captor = ArgumentCaptor.forClass(CarData.class);
    verify(mockListener, atLeastOnce()).onCarData(captor.capture());
    CarData enterData = captor.getValue();
    assertEquals(2, enterData.getLane());
    assertTrue(enterData.getCanRefuel());

    // Lap sensor inactive -> exits pit
    m.invoke(protocol, 3, lapBehavior, false);

    verify(mockListener, atLeastOnce()).onCarData(captor.capture());
    CarData exitData = captor.getValue();
    assertEquals(2, exitData.getLane());
    assertFalse(exitData.getCanRefuel());
  }

  @Test
  public void testOpenReturnsTrueAndEmitsDisconnectedWhenNoDeviceSelected() {
    PhidgetConfig noDeviceConfig = new PhidgetConfig();
    noDeviceConfig.serialNumber = -1;
    PhidgetProtocol unassignedProtocol = new PhidgetProtocol(noDeviceConfig, 4, null);
    ProtocolListener mockListener = mock(ProtocolListener.class);
    unassignedProtocol.setListener(mockListener);

    try {
      assertTrue(unassignedProtocol.open());
      assertFalse(unassignedProtocol.isConnected());
      assertFalse(unassignedProtocol.isHealthy());
      verify(mockListener, atLeastOnce()).onInterfaceStatus(InterfaceStatus.DISCONNECTED, 0);
    } finally {
      unassignedProtocol.close();
    }
  }

  @Test
  public void testUseLapsForSegmentsRequiresSegmentSensors() throws Exception {
    config.normallyClosedLaneSensors = false;
    config.useLapsForSegments = true;
    // Currently config.digitalInIds has no segment sensors configured
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    protocol.startTimer();
    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    m.setAccessible(true);

    int lapBehavior = PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
    m.invoke(protocol, 0, lapBehavior, true);

    // Lap should be called, but onSegment should NOT be called because no segment sensors are
    // configured
    verify(mockListener).onLap(eq(0), anyDouble(), eq(0), eq(0));
    verify(mockListener, org.mockito.Mockito.never()).onSegment(eq(0), anyDouble(), eq(0), eq(0));

    // Now configure a segment sensor in digitalInIds
    config.digitalInIds =
        Arrays.asList(PinBehavior.BEHAVIOR_LAP_BASE_VALUE, PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE);
    m.invoke(protocol, 0, lapBehavior, true);

    // Now onSegment SHOULD be called
    verify(mockListener).onSegment(eq(0), anyDouble(), eq(0), eq(0));
  }

  @Test
  public void testGetNativeLibraryPathsForMac() {
    List<String> paths = PhidgetProtocol.getNativeLibraryPaths("Mac OS X", "x86_64", "/tmp/rc");
    assertEquals(1, paths.size());
    assertTrue(paths.get(0).endsWith("libphidget22java.jnilib"));
    assertTrue(paths.get(0).contains("macos"));
  }

  @Test
  public void testGetNativeLibraryPathsForWin64() {
    List<String> paths = PhidgetProtocol.getNativeLibraryPaths("Windows 10", "amd64", "/tmp/rc");
    assertEquals(3, paths.size());
    assertTrue(paths.get(0).endsWith("phidget22extra.dll"));
    assertTrue(paths.get(1).endsWith("phidget22.dll"));
    assertTrue(paths.get(2).endsWith("phidget22java.dll"));
    assertTrue(paths.get(0).contains("x64"));
  }

  @Test
  public void testGetNativeLibraryPathsForWin32() {
    List<String> paths = PhidgetProtocol.getNativeLibraryPaths("Windows 7", "x86", "/tmp/rc");
    assertEquals(3, paths.size());
    assertTrue(paths.get(0).endsWith("phidget22extra.dll"));
    assertTrue(paths.get(1).endsWith("phidget22.dll"));
    assertTrue(paths.get(2).endsWith("phidget22java.dll"));
    assertTrue(paths.get(0).contains("x86"));
  }

  @Test
  public void testGetNativeLibraryPathsForLinux() {
    List<String> paths = PhidgetProtocol.getNativeLibraryPaths("Linux", "amd64", "/tmp/rc");
    // Linux is currently not explicitly bundled for zero-install, so it returns empty
    assertTrue(paths.isEmpty());
  }

  @Test
  public void testNullEntriesInPhidgetConfigDoesNotThrowNpe() {
    PhidgetConfig nullConfig = new PhidgetConfig();
    nullConfig.digitalInIds = Arrays.asList(null, PinBehavior.BEHAVIOR_CALL_BUTTON_VALUE, null);
    nullConfig.digitalOutIds = Arrays.asList(null, PinBehavior.BEHAVIOR_RELAY_VALUE, null);
    nullConfig.analogIds = Arrays.asList(null, PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE_VALUE, null);

    PhidgetProtocol nullProtocol = new PhidgetProtocol(nullConfig, 4, null);
    assertNotNull(nullProtocol);
  }

  @Test
  public void testRaceFlagAndRaceStateUpdates() {
    protocol.setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
    protocol.setRaceState(RaceState.STARTING, RaceFlag.YELLOW, 3.0);
    protocol.setRaceState(RaceState.NOT_STARTED, RaceFlag.RED, 0.0);
    protocol.setRaceState(RaceState.UNKNOWN_STATE, RaceFlag.UNKNOWN_FLAG, 0.0);
  }

  @Test
  public void testNormallyClosedRelaysAndLaneSensorsGetters() {
    config.normallyClosedLaneSensors = true;
    config.normallyClosedRelays = true;
    assertTrue(protocol.isNormallyClosedLaneSensors());
    assertTrue(protocol.isNormallyClosedRelays());

    config.normallyClosedLaneSensors = false;
    config.normallyClosedRelays = false;
    assertFalse(protocol.isNormallyClosedLaneSensors());
    assertFalse(protocol.isNormallyClosedRelays());
  }

  @Test
  public void testAnalogInputVoltageRatioScaling() throws Exception {
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleAnalogInputStateChange", int.class, int.class, double.class);
    m.setAccessible(true);

    // Channel 0, voltage ratio 0.5 (should scale to 511 in 0-1023 range)
    m.invoke(protocol, 0, PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE_VALUE, 0.5);

    ArgumentCaptor<com.antigravity.proto.InterfaceEvent> captor =
        ArgumentCaptor.forClass(com.antigravity.proto.InterfaceEvent.class);
    verify(mockListener).onInterfaceEvent(captor.capture());

    com.antigravity.proto.InterfaceEvent event = captor.getValue();
    assertTrue(event.hasAnalogData());
    assertEquals(0, event.getAnalogData().getPin());
    assertEquals(511, event.getAnalogData().getValue());

    // Behavior -1 should be ignored
    org.mockito.Mockito.reset(mockListener);
    m.invoke(protocol, 0, -1, 0.75);
    verify(mockListener, org.mockito.Mockito.never())
        .onInterfaceEvent(org.mockito.ArgumentMatchers.any());
  }

  @Test
  public void testMasterAndPerLaneCallButtons() throws Exception {
    config.normallyClosedLaneSensors = false;
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    m.setAccessible(true);

    // Initialize unpressed state (false -> sensorState 1)
    m.invoke(protocol, 0, PinBehavior.BEHAVIOR_CALL_BUTTON_VALUE, false);
    // Master Call Button pressed (true -> sensorState 0, triggers 1 -> 0 transition)
    m.invoke(protocol, 0, PinBehavior.BEHAVIOR_CALL_BUTTON_VALUE, true);
    verify(mockListener).onCallbutton(eq(-1), eq(0));

    // Per-Lane Call Button Lane 2 (PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE + 2)
    m.invoke(protocol, 1, PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE + 2, false);
    m.invoke(protocol, 1, PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE + 2, true);
    verify(mockListener).onCallbutton(eq(2), eq(0));
  }

  @Test
  public void testOpenWithZeroConfiguredPinsEvaluatesHealthy() {
    PhidgetConfig emptyPinsConfig = new PhidgetConfig();
    emptyPinsConfig.serialNumber = 12345;
    emptyPinsConfig.digitalInIds = Arrays.asList(PinBehavior.BEHAVIOR_UNUSED_VALUE);
    emptyPinsConfig.digitalOutIds = Arrays.asList(PinBehavior.BEHAVIOR_UNUSED_VALUE);
    emptyPinsConfig.analogIds = Arrays.asList(PinBehavior.BEHAVIOR_UNUSED_VALUE);

    PhidgetProtocol emptyProtocol = new PhidgetProtocol(emptyPinsConfig, 4, null);
    ProtocolListener mockListener = mock(ProtocolListener.class);
    emptyProtocol.setListener(mockListener);

    try {
      boolean opened = emptyProtocol.open();
      assertTrue(opened);
      assertTrue(emptyProtocol.isHealthy());
      verify(mockListener, atLeastOnce()).onInterfaceStatus(InterfaceStatus.CONNECTED, 0);
    } finally {
      emptyProtocol.close();
    }
  }

  @Test
  public void testPowerControlsWhenClosed() {
    protocol.setMainPower(true);
    protocol.setMainPower(false);
    for (int lane = 0; lane < 4; lane++) {
      protocol.setLanePower(true, lane);
      protocol.setLanePower(false, lane);
    }
  }

  @Test
  public void testNormallyClosedLapSensorTripTransition() throws Exception {
    config.normallyClosedLaneSensors = true;
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    protocol.startTimer();
    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    m.setAccessible(true);

    int lapBehavior = PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
    // NC Idle state is true (closed circuit) -> should not trigger lap
    m.invoke(protocol, 0, lapBehavior, true);
    verify(mockListener, org.mockito.Mockito.never()).onLap(eq(0), anyDouble(), eq(0), eq(0));

    // NC Tripped state is false (open circuit) -> should trigger lap
    m.invoke(protocol, 0, lapBehavior, false);
    verify(mockListener).onLap(eq(0), anyDouble(), eq(0), eq(0));
  }

  @Test
  public void testNormallyOpenLapSensorTripTransition() throws Exception {
    config.normallyClosedLaneSensors = false;
    ProtocolListener mockListener = mock(ProtocolListener.class);
    protocol.setListener(mockListener);

    protocol.startTimer();
    Method m =
        PhidgetProtocol.class.getDeclaredMethod(
            "handleDigitalInputStateChange", int.class, int.class, boolean.class);
    m.setAccessible(true);

    int lapBehavior = PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
    // NO Idle state is false (open circuit) -> should not trigger lap
    m.invoke(protocol, 0, lapBehavior, false);
    verify(mockListener, org.mockito.Mockito.never()).onLap(eq(0), anyDouble(), eq(0), eq(0));

    // NO Tripped state is true (closed circuit) -> should trigger lap
    m.invoke(protocol, 0, lapBehavior, true);
    verify(mockListener).onLap(eq(0), anyDouble(), eq(0), eq(0));
  }

  @Test
  public void testCanReconnectLifecycle() throws Exception {
    Method m = PhidgetProtocol.class.getDeclaredMethod("canReconnect");
    m.setAccessible(true);

    // Initially unopened -> canReconnect is true
    assertTrue((Boolean) m.invoke(protocol));

    // Set opened = true
    java.lang.reflect.Field openedField = PhidgetProtocol.class.getDeclaredField("opened");
    openedField.setAccessible(true);
    openedField.set(protocol, true);

    // While opened -> canReconnect is false to prevent duplicate channel creation
    assertFalse((Boolean) m.invoke(protocol));

    // After close -> canReconnect is true again
    protocol.close();
    assertTrue((Boolean) m.invoke(protocol));
  }

  @Test
  public void testSyncPowerAndSyncAnalogLedsExecution() {
    protocol.syncPower();
    protocol.syncAnalogLeds();
  }
}
