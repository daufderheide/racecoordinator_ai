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

  @Test
  public void testElevenArgumentConstructor() {
    AnalogFuelOptions options =
        new AnalogFuelOptions(
            true,
            false,
            true,
            FuelOptions.OutOfFuelAction.END_HEAT,
            110.0,
            FuelOptions.FuelUsageType.LINEAR,
            4.5,
            90.0,
            12.0,
            2.5,
            8.0);

    assertTrue(options.isEnabled());
    assertFalse(options.isResetFuelAtHeatStart());
    assertEquals(FuelOptions.OutOfFuelAction.END_HEAT, options.getOutOfFuelAction());
    assertEquals(110.0, options.getCapacity(), 0.001);
    assertEquals(FuelOptions.FuelUsageType.LINEAR, options.getUsageType());
    assertEquals(4.5, options.getUsageRate(), 0.001);
    assertEquals(90.0, options.getStartLevel(), 0.001);
    assertEquals(12.0, options.getRefuelRate(), 0.001);
    assertEquals(2.5, options.getPitStopDelay(), 0.001);
    assertEquals(8.0, options.getReferenceTime(), 0.001);
    assertEquals(1.0, options.getPowerStutterOnTime(), 0.001);
    assertEquals(1.0, options.getPowerStutterOffTime(), 0.001);
  }

  @Test
  public void testBoxedDoubleConstructorWithDefaults() {
    AnalogFuelOptions options =
        new AnalogFuelOptions(
            false, false, true, null, null, null, null, null, null, null, null, null, null);

    assertFalse(options.isEnabled());
    assertEquals(FuelOptions.OutOfFuelAction.END_HEAT, options.getOutOfFuelAction());
    assertEquals(100.0, options.getCapacity(), 0.001);
    assertEquals(FuelOptions.FuelUsageType.LINEAR, options.getUsageType());
    assertEquals(4.0, options.getUsageRate(), 0.001);
    assertEquals(100.0, options.getStartLevel(), 0.001);
    assertEquals(10.0, options.getRefuelRate(), 0.001);
    assertEquals(2.0, options.getPitStopDelay(), 0.001);
    assertEquals(6.0, options.getReferenceTime(), 0.001);
    assertEquals(1.0, options.getPowerStutterOnTime(), 0.001);
    assertEquals(1.0, options.getPowerStutterOffTime(), 0.001);
  }
}
