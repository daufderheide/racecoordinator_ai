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

  @Test
  public void testCustomCurveSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    java.util.List<FuelCurvePoint> curve =
        java.util.Arrays.asList(
            new FuelCurvePoint(0.0, 4.0),
            new FuelCurvePoint(0.5, 1.0),
            new FuelCurvePoint(1.0, 0.0));
    AnalogFuelOptions options =
        new AnalogFuelOptions(
            true,
            false,
            false,
            FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
            100.0,
            FuelOptions.FuelUsageType.CUSTOM_CURVE,
            4.0,
            100.0,
            10.0,
            2.0,
            6.0,
            1.0,
            1.0,
            curve);

    String json = mapper.writeValueAsString(options);
    AnalogFuelOptions deserialized = mapper.readValue(json, AnalogFuelOptions.class);

    assertNotNull(deserialized);
    assertEquals(FuelOptions.FuelUsageType.CUSTOM_CURVE, deserialized.getUsageType());
    assertNotNull(deserialized.getCustomCurve());
    assertEquals(3, deserialized.getCustomCurve().size());
    assertEquals(0.5, deserialized.getCustomCurve().get(1).getX(), 0.001);
    assertEquals(1.0, deserialized.getCustomCurve().get(1).getY(), 0.001);
  }

  @Test
  public void testExplicitFourParameterConstructor() {
    AnalogFuelOptions options =
        new AnalogFuelOptions(
            true,
            false,
            false,
            FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
            100.0,
            FuelOptions.FuelUsageType.LINEAR,
            4.0,
            100.0,
            10.0,
            2.0,
            6.0,
            1.0,
            1.0,
            null,
            2.5,
            6.0,
            8.0,
            1.5);

    assertEquals(2.5, options.getFastestTime(), 0.001);
    assertEquals(6.0, options.getMaxUsage(), 0.001);
    assertEquals(8.0, options.getSlowestTime(), 0.001);
    assertEquals(1.5, options.getMinUsage(), 0.001);
  }

  @Test
  public void testJsonSerializationWithFourParameters() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    AnalogFuelOptions options =
        new AnalogFuelOptions(
            true,
            false,
            false,
            FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
            100.0,
            FuelOptions.FuelUsageType.LINEAR,
            4.0,
            100.0,
            10.0,
            2.0,
            6.0,
            1.0,
            1.0,
            null,
            2.5,
            6.0,
            8.5,
            1.5);

    String json = mapper.writeValueAsString(options);
    AnalogFuelOptions deserialized = mapper.readValue(json, AnalogFuelOptions.class);

    assertNotNull(deserialized);
    assertEquals(2.5, deserialized.getFastestTime(), 0.001);
    assertEquals(6.0, deserialized.getMaxUsage(), 0.001);
    assertEquals(8.5, deserialized.getSlowestTime(), 0.001);
    assertEquals(1.5, deserialized.getMinUsage(), 0.001);
  }

  @Test
  public void testAutomaticBackfillFromLegacyFields() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    // JSON with legacy reference_time and usage_rate only
    String jsonLinear =
        "{\"enabled\":true,\"usage_type\":\"LINEAR\",\"usage_rate\":4.0,\"reference_time\":6.0}";
    AnalogFuelOptions linear = mapper.readValue(jsonLinear, AnalogFuelOptions.class);
    assertEquals(3.0, linear.getFastestTime(), 0.001);
    assertEquals(5.0, linear.getMaxUsage(), 0.001);
    assertEquals(9.0, linear.getSlowestTime(), 0.001);
    assertEquals(3.0, linear.getMinUsage(), 0.001);

    String jsonQuad =
        "{\"enabled\":true,\"usage_type\":\"QUADRATIC\",\"usage_rate\":4.0,\"reference_time\":6.0}";
    AnalogFuelOptions quad = mapper.readValue(jsonQuad, AnalogFuelOptions.class);
    assertEquals(3.0, quad.getFastestTime(), 0.001);
    assertEquals(16.0, quad.getMaxUsage(), 0.001);
    assertEquals(9.0, quad.getSlowestTime(), 0.001);
    assertEquals(4.0 * (4.0 / 9.0), quad.getMinUsage(), 0.001);

    String jsonCubic =
        "{\"enabled\":true,\"usage_type\":\"CUBIC\",\"usage_rate\":4.0,\"reference_time\":6.0}";
    AnalogFuelOptions cubic = mapper.readValue(jsonCubic, AnalogFuelOptions.class);
    assertEquals(3.0, cubic.getFastestTime(), 0.001);
    assertEquals(32.0, cubic.getMaxUsage(), 0.001);
    assertEquals(9.0, cubic.getSlowestTime(), 0.001);
    assertEquals(4.0 * (8.0 / 27.0), cubic.getMinUsage(), 0.001);
  }
}
