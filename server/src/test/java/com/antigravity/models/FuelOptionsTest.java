package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class FuelOptionsTest {

  @Test
  public void testGetters() {
    FuelOptions options =
        new FuelOptions(
            true,
            true,
            FuelOptions.OutOfFuelAction.POWER_STUTTER,
            200.0,
            FuelOptions.FuelUsageType.CUBIC,
            6.0,
            200.0,
            25.0,
            4.0) {};

    assertTrue(options.isEnabled());
    assertTrue(options.isResetFuelAtHeatStart());
    assertEquals(FuelOptions.OutOfFuelAction.POWER_STUTTER, options.getOutOfFuelAction());
    assertEquals(200.0, options.getCapacity(), 0.001);
    assertEquals(FuelOptions.FuelUsageType.CUBIC, options.getUsageType());
    assertEquals(6.0, options.getUsageRate(), 0.001);
    assertEquals(200.0, options.getStartLevel(), 0.001);
    assertEquals(25.0, options.getRefuelRate(), 0.001);
    assertEquals(4.0, options.getPitStopDelay(), 0.001);
  }

  @Test
  public void testDefaultConstructor() {
    FuelOptions options = new FuelOptions() {};
    assertFalse(options.isEnabled());
    assertEquals(100.0, options.getCapacity(), 0.001);
    assertEquals(FuelOptions.FuelUsageType.LINEAR, options.getUsageType());
  }
}
