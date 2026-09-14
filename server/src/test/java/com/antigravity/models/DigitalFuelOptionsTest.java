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

  @Test
  public void testBoxedDoubleConstructorWithDefaults() {
    DigitalFuelOptions options =
        new DigitalFuelOptions(false, false, false, null, null, null, null, null, null, null);

    assertFalse(options.isEnabled());
    assertFalse(options.isResetFuelAtHeatStart());
    assertEquals(FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS, options.getOutOfFuelAction());
    assertEquals(100.0, options.getCapacity(), 0.001);
    assertEquals(FuelOptions.FuelUsageType.LINEAR, options.getUsageType());
    assertEquals(4.0, options.getUsageRate(), 0.001);
    assertEquals(100.0, options.getStartLevel(), 0.001);
    assertEquals(10.0, options.getRefuelRate(), 0.001);
    assertEquals(2.0, options.getPitStopDelay(), 0.001);
  }

  @Test
  public void testBoxedDoubleConstructorWithEndHeatFallback() {
    DigitalFuelOptions options =
        new DigitalFuelOptions(
            true,
            true,
            true,
            null,
            Double.valueOf(80.0),
            FuelOptions.FuelUsageType.QUADRATIC,
            Double.valueOf(2.5),
            Double.valueOf(80.0),
            Double.valueOf(8.0),
            Double.valueOf(1.0));

    assertTrue(options.isEnabled());
    assertTrue(options.isResetFuelAtHeatStart());
    assertEquals(FuelOptions.OutOfFuelAction.END_HEAT, options.getOutOfFuelAction());
    assertEquals(80.0, options.getCapacity(), 0.001);
    assertEquals(FuelOptions.FuelUsageType.QUADRATIC, options.getUsageType());
    assertEquals(2.5, options.getUsageRate(), 0.001);
    assertEquals(80.0, options.getStartLevel(), 0.001);
    assertEquals(8.0, options.getRefuelRate(), 0.001);
    assertEquals(1.0, options.getPitStopDelay(), 0.001);
  }
}
