package com.antigravity.protocols.phidget;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
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
  public void testOpenFailureWhenNotConnectedOrDriverMissing() {
    // When Phidget device 12345 is not physically attached or native library linkage fails,
    // open() should gracefully return false without throwing uncaught exceptions.
    boolean result = protocol.open();
    assertFalse(result);
    assertFalse(protocol.isHealthy());
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
}
