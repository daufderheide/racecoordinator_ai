package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class AnalogFuelOptionsTest {

  @Test
  public void testDefaultConstructor() {
    AnalogFuelOptions options = new AnalogFuelOptions();
    assertFalse(options.isEnabled());
    assertEquals(100.0, options.getCapacity(), 0.001);
    assertEquals(6.0, options.getReferenceTime(), 0.001);
    assertEquals(1.0, options.getPowerStutterOnTime(), 0.001);
    assertEquals(1.0, options.getPowerStutterOffTime(), 0.001);
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    AnalogFuelOptions options =
        new AnalogFuelOptions(
            true,
            true,
            false,
            FuelOptions.OutOfFuelAction.POWER_STUTTER,
            120.0,
            FuelOptions.FuelUsageType.QUADRATIC,
            5.0,
            100.0,
            15.0,
            3.0,
            7.5,
            0.5,
            0.5);

    String json = mapper.writeValueAsString(options);
    AnalogFuelOptions deserialized = mapper.readValue(json, AnalogFuelOptions.class);

    assertNotNull(deserialized);
    assertTrue(deserialized.isEnabled());
    assertEquals(120.0, deserialized.getCapacity(), 0.001);
    assertEquals(7.5, deserialized.getReferenceTime(), 0.001);
    assertEquals(FuelOptions.OutOfFuelAction.POWER_STUTTER, deserialized.getOutOfFuelAction());
  }
}
