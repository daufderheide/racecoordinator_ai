package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import org.junit.Test;

public class HeatLapRowTest {

  @Test
  public void testHeatLapRow_AccessorsAndBoundaries() {
    HeatLapRow row = new HeatLapRow(1, Arrays.asList(3.5, 4.2, null, 3.8));

    assertEquals(1, row.getLapNumber());
    assertEquals(4, row.getLaneLaps().size());
    assertEquals(3.5, row.getLaneLap(0), 0.001);
    assertEquals(4.2, row.getLaneLap(1), 0.001);
    assertNull(row.getLaneLap(2));
    assertEquals(3.8, row.getLaneLap(3), 0.001);

    assertEquals(3.5, row.getLapTime(0), 0.001);
    assertNull(row.getLapTime(2));

    // Boundary checks
    assertNull(row.getLaneLap(-1));
    assertNull(row.getLaneLap(4));
    assertNull(row.getLaneLap(100));
    assertNull(row.getLapTime(-5));
    assertNull(row.getLapTime(99));
  }

  @Test
  public void testHeatLapRow_NullLapsList() {
    HeatLapRow row = new HeatLapRow(5, null);

    assertEquals(5, row.getLapNumber());
    assertNotNull(row.getLaneLaps());
    assertTrue(row.getLaneLaps().isEmpty());
    assertNull(row.getLaneLap(0));
    assertNull(row.getLapTime(0));
  }
}
