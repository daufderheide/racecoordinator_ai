package com.antigravity.protocols.arduino;

import static org.junit.Assert.assertEquals;
import org.junit.Test;
import com.fasterxml.jackson.databind.ObjectMapper;

public class ArduinoConfigSerializationTest {

  @Test
  public void testLapPinPitBehaviorSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();

    ArduinoConfig config = new ArduinoConfig();
    config.lapPinPitBehavior = ArduinoConfig.LapPinPitBehavior.PIT_IN;

    String json = mapper.writeValueAsString(config);

    // Check that the JSON contains the integer value 1 for lapPinPitBehavior
    // instead of the string "PIT_IN"
    org.junit.Assert.assertTrue("JSON should contain integer value for lapPinPitBehavior",
        json.contains("\"lapPinPitBehavior\":1"));

    // Verify round-trip deserialization
    ArduinoConfig deserialized = mapper.readValue(json, ArduinoConfig.class);
    assertEquals(ArduinoConfig.LapPinPitBehavior.PIT_IN, deserialized.lapPinPitBehavior);
  }

  @Test
  public void testLapPinPitBehaviorDeserializationFromInt() throws Exception {
    ObjectMapper mapper = new ObjectMapper();

    String json = "{\"lapPinPitBehavior\":2}"; // PIT_OUT
    ArduinoConfig deserialized = mapper.readValue(json, ArduinoConfig.class);

    assertEquals(ArduinoConfig.LapPinPitBehavior.PIT_OUT, deserialized.lapPinPitBehavior);
  }
}
