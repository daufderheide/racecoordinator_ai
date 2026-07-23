package com.antigravity.protocols.phidget;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import java.util.Arrays;
import org.junit.Before;
import org.junit.Test;

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
    assertTrue(protocol.isHealthy());
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
  }

  @Test
  public void testCloseSafety() {
    // Closing unopened protocol should be a safe no-op
    protocol.close();
    assertFalse(protocol.hasMainRelay());
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
  }
}
