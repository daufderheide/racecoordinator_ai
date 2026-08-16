package com.antigravity.protocols.phidget;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class PhidgetConfigTest {

  @Test
  public void testDefaultConstructor() {
    PhidgetConfig config = new PhidgetConfig();
    assertEquals("Phidget", config.name);
    assertEquals(-1, config.serialNumber);
    assertTrue(config.normallyClosedLaneSensors);
    assertTrue(config.normallyClosedRelays);
    assertTrue(config.useLapsForSegments);
    assertEquals(LapPinPitBehavior.PIT_IN_OUT, config.lapPinPitBehavior);
    assertNotNull(config.digitalInIds);
    assertNotNull(config.digitalOutIds);
    assertNotNull(config.analogIds);
    assertNotNull(config.voltageConfigs);
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    PhidgetConfig config = new PhidgetConfig();
    config.serialNumber = 12345;

    String json = mapper.writeValueAsString(config);
    PhidgetConfig deserialized = mapper.readValue(json, PhidgetConfig.class);

    assertNotNull(deserialized);
    assertEquals(12345, deserialized.serialNumber);
    assertEquals("Phidget", deserialized.name);
  }
}
