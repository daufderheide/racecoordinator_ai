package com.antigravity.protocols.trackmate;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class TrackmateConfigTest {

  @Test
  public void testDefaultConstructor() {
    TrackmateConfig config = new TrackmateConfig();
    assertEquals("Trackmate", config.name);
    assertEquals(8, config.numLanes);
    assertTrue(config.normallyClosedRelays);
    assertTrue(config.normallyClosedLaneSensors);
    assertEquals(LapPinPitBehavior.PIT_IN_OUT, config.lapPinPitBehavior);
    assertNotNull(config.lapPinBehaviors);
    assertEquals(8, config.lapPinBehaviors.size());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    TrackmateConfig config = new TrackmateConfig();
    config.commPort = "COM3";

    String json = mapper.writeValueAsString(config);
    TrackmateConfig deserialized = mapper.readValue(json, TrackmateConfig.class);

    assertNotNull(deserialized);
    assertEquals("COM3", deserialized.commPort);
    assertEquals(8, deserialized.numLanes);
  }
}
