package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class DigitalFuelOptionsTest {

  @Test
  public void testDefaultConstructor() {
    DigitalFuelOptions options = new DigitalFuelOptions();
    assertFalse(options.isEnabled());
    assertEquals(100.0, options.getCapacity(), 0.001);
    assertEquals(4.0, options.getUsageRate(), 0.001);
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    DigitalFuelOptions options =
        new DigitalFuelOptions(
            true,
            false,
            true,
            FuelOptions.OutOfFuelAction.END_HEAT,
            150.0,
            FuelOptions.FuelUsageType.LINEAR,
            3.5,
            150.0,
            20.0,
            1.5);

    String json = mapper.writeValueAsString(options);
    DigitalFuelOptions deserialized = mapper.readValue(json, DigitalFuelOptions.class);

    assertNotNull(deserialized);
    assertTrue(deserialized.isEnabled());
    assertEquals(150.0, deserialized.getCapacity(), 0.001);
    assertEquals(FuelOptions.OutOfFuelAction.END_HEAT, deserialized.getOutOfFuelAction());
  }
}
