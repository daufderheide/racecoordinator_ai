package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.FuelCurvePoint;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;

public class FuelCalculationUtilsTest {

  @Test
  public void testNullAndEmptyCurve() {
    assertEquals(1.0, FuelCalculationUtils.interpolateFuelCurve(null, 0.5), 0.0001);
    assertEquals(
        1.0, FuelCalculationUtils.interpolateFuelCurve(Collections.emptyList(), 0.5), 0.0001);
  }

  @Test
  public void testSinglePoint() {
    List<FuelCurvePoint> points = Collections.singletonList(new FuelCurvePoint(0.5, 2.5));
    assertEquals(2.5, FuelCalculationUtils.interpolateFuelCurve(points, 0.1), 0.0001);
    assertEquals(2.5, FuelCalculationUtils.interpolateFuelCurve(points, 0.5), 0.0001);
    assertEquals(2.5, FuelCalculationUtils.interpolateFuelCurve(points, 0.9), 0.0001);
  }

  @Test
  public void testBoundaryClamping() {
    List<FuelCurvePoint> points =
        Arrays.asList(
            new FuelCurvePoint(0.0, 4.0),
            new FuelCurvePoint(0.5, 1.0),
            new FuelCurvePoint(1.0, 0.0));

    assertEquals(4.0, FuelCalculationUtils.interpolateFuelCurve(points, -0.5), 0.0001);
    assertEquals(4.0, FuelCalculationUtils.interpolateFuelCurve(points, 0.0), 0.0001);
    assertEquals(0.0, FuelCalculationUtils.interpolateFuelCurve(points, 1.0), 0.0001);
    assertEquals(0.0, FuelCalculationUtils.interpolateFuelCurve(points, 1.5), 0.0001);
  }

  @Test
  public void testAnalogMonotonicNonIncreasingInterpolation() {
    List<FuelCurvePoint> points =
        Arrays.asList(
            new FuelCurvePoint(0.0, 4.0),
            new FuelCurvePoint(0.25, 2.0),
            new FuelCurvePoint(0.5, 1.0),
            new FuelCurvePoint(0.75, 0.5),
            new FuelCurvePoint(1.0, 0.0));

    // Midpoint between 0.0 (4.0) and 0.25 (2.0) is x = 0.125 -> y = 3.0
    assertEquals(3.0, FuelCalculationUtils.interpolateFuelCurve(points, 0.125), 0.0001);
    // Midpoint between 0.25 (2.0) and 0.5 (1.0) is x = 0.375 -> y = 1.5
    assertEquals(1.5, FuelCalculationUtils.interpolateFuelCurve(points, 0.375), 0.0001);
    // Midpoint between 0.5 (1.0) and 0.75 (0.5) is x = 0.625 -> y = 0.75
    assertEquals(0.75, FuelCalculationUtils.interpolateFuelCurve(points, 0.625), 0.0001);

    // Verify monotonic property across fine steps
    double prevY = Double.MAX_VALUE;
    for (double x = 0.0; x <= 1.0; x += 0.05) {
      double y = FuelCalculationUtils.interpolateFuelCurve(points, x);
      assertTrue(
          "Expected non-increasing, but y (" + y + ") > prevY (" + prevY + ")", y <= prevY + 1e-9);
      prevY = y;
    }
  }

  @Test
  public void testDigitalMonotonicNonDecreasingInterpolation() {
    List<FuelCurvePoint> points =
        Arrays.asList(
            new FuelCurvePoint(0.0, 0.0),
            new FuelCurvePoint(0.25, 0.1),
            new FuelCurvePoint(0.5, 0.3),
            new FuelCurvePoint(0.75, 0.6),
            new FuelCurvePoint(1.0, 1.0));

    // Verify monotonic non-decreasing property across fine steps
    double prevY = -1.0;
    for (double x = 0.0; x <= 1.0; x += 0.05) {
      double y = FuelCalculationUtils.interpolateFuelCurve(points, x);
      assertTrue(
          "Expected non-decreasing, but y (" + y + ") < prevY (" + prevY + ")", y >= prevY - 1e-9);
      prevY = y;
    }
  }

  @Test
  public void testZeroWidthDeltaSafe() {
    List<FuelCurvePoint> points =
        Arrays.asList(new FuelCurvePoint(0.5, 1.0), new FuelCurvePoint(0.5, 2.0));
    assertEquals(1.0, FuelCalculationUtils.interpolateFuelCurve(points, 0.5), 0.0001);
  }
}
