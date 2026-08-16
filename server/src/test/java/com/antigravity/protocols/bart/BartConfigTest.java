package com.antigravity.protocols.bart;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class BartConfigTest {

  @Test
  public void testDefaultConstructor() {
    BartConfig config = new BartConfig();
    assertEquals("BART", config.name);
    assertEquals(8, config.numLanes);
    assertEquals(1, config.minLapMs);
    assertEquals(LapPinPitBehavior.NONE, config.lapPinPitBehavior);
    assertNotNull(config.lapPinBehaviors);
    assertEquals(8, config.lapPinBehaviors.size());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    BartConfig config = new BartConfig();
    config.deviceName = "BART_DEVICE";

    String json = mapper.writeValueAsString(config);
    BartConfig deserialized = mapper.readValue(json, BartConfig.class);

    assertNotNull(deserialized);
    assertEquals("BART_DEVICE", deserialized.deviceName);
    assertEquals(8, deserialized.numLanes);
  }
}
