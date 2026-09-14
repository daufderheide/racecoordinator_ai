package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;

import org.junit.Test;

public class FuelCurvePointTest {

  @Test
  public void testDefaultConstructor() {
    FuelCurvePoint point = new FuelCurvePoint();
    assertEquals(0.0, point.getX(), 0.0001);
    assertEquals(0.0, point.getY(), 0.0001);
  }

  @Test
  public void testCustomConstructor() {
    FuelCurvePoint point = new FuelCurvePoint(0.25, 3.5);
    assertEquals(0.25, point.getX(), 0.0001);
    assertEquals(3.5, point.getY(), 0.0001);
  }

  @Test
  public void testEqualsAndHashCode() {
    FuelCurvePoint p1 = new FuelCurvePoint(0.5, 2.0);
    FuelCurvePoint p2 = new FuelCurvePoint(0.5, 2.0);
    FuelCurvePoint p3 = new FuelCurvePoint(0.75, 2.0);

    assertEquals(p1, p1);
    assertEquals(p1, p2);
    assertEquals(p1.hashCode(), p2.hashCode());
    assertNotEquals(p1, p3);
    assertNotEquals(p1, null);
    assertNotEquals(p1, "other");
  }

  @Test
  public void testToString() {
    FuelCurvePoint p = new FuelCurvePoint(0.1, 0.9);
    assertNotNull(p.toString());
  }
}
