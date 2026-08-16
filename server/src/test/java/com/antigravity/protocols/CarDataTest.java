package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class CarDataTest {

  @Test
  public void testConstructorsAndGetters() {
    CarData data = new CarData(1, 12.34, 0.85, 0.80, true, CarLocation.PitRow, CarLocation.Main, 2);

    assertEquals(1, data.getLane());
    assertEquals(12.34, data.getTime(), 0.001);
    assertEquals(0.85, data.getControllerThrottlePCT(), 0.001);
    assertEquals(0.80, data.getCarThrottlePCT(), 0.001);
    assertTrue(data.getCanRefuel());
    assertEquals(CarLocation.PitRow, data.getLocation());
    assertEquals(CarLocation.Main, data.getLastLocation());
    assertEquals(2, data.getLocationId());
  }
}
