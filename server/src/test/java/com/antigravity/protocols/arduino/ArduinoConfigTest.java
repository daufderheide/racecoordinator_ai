package com.antigravity.protocols.arduino;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.antigravity.proto.PinBehavior;

public class ArduinoConfigTest {

  @Test
  public void testGetPinMode() {
    assertEquals(ArduinoConfig.PinMode.READ, ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_CALL_BUTTON.getNumber()));
    assertEquals(ArduinoConfig.PinMode.WRITE, ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_RELAY.getNumber()));

    assertEquals(ArduinoConfig.PinMode.READ, ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0));
    assertEquals(ArduinoConfig.PinMode.READ,
        ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + 0));
    assertEquals(ArduinoConfig.PinMode.READ,
        ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + 1));
    assertEquals(ArduinoConfig.PinMode.WRITE,
        ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + 5));
    assertEquals(ArduinoConfig.PinMode.READ,
        ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + 0));
    assertEquals(ArduinoConfig.PinMode.READ,
        ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + 0));

    // New Voltage Level behavior
    assertEquals(ArduinoConfig.PinMode.READ_ANALOG,
        ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + 0));
    assertEquals(ArduinoConfig.PinMode.READ_ANALOG,
        ArduinoConfig.getPinMode(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + 3));
  }

  @Test
  public void testIsReadPin() {
    assertTrue(ArduinoConfig.isReadPin(PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0));
    assertFalse(ArduinoConfig.isReadPin(PinBehavior.BEHAVIOR_RELAY.getNumber()));
    assertFalse(ArduinoConfig.isReadPin(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + 0));
  }

  @Test
  public void testIsWritePin() {
    assertTrue(ArduinoConfig.isWritePin(PinBehavior.BEHAVIOR_RELAY.getNumber()));
    assertFalse(ArduinoConfig.isWritePin(PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + 0));
    assertFalse(ArduinoConfig.isWritePin(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + 0));
  }

  @Test
  public void testConstructor() {
    ArduinoConfig config1 = new ArduinoConfig(
        "Test1", "COM1", 115200, 200, 1,
        true,
        false,
        0,
        true,
        false,
        ArduinoConfig.LapPinPitBehavior.NONE,
        null, null, null, null, null);

    assertTrue(config1.normallyClosedLaneSensors);
    assertFalse(config1.normallyClosedRelays);
    assertTrue(config1.usePitsAsLaps);
    assertFalse(config1.useLapsForSegments);
  }
}
