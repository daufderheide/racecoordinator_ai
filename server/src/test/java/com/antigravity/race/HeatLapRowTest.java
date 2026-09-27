package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
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
    assertNotNull(row.getLaneSegments());
    assertTrue(row.getLaneSegments().isEmpty());
    assertTrue(row.getLaneSegments(0).isEmpty());
    assertNull(row.getLaneSegment(0));
    assertNull(row.getLaneSegment(0, 0));
    assertNull(row.getSegment(0));
    assertNull(row.getSegment(0, 0));
  }

  @Test
  public void testHeatLapRow_SegmentsHandling() {
    List<List<Double>> segments =
        Arrays.asList(
            Arrays.asList(1.123, 2.246),
            Collections.singletonList(1.5),
            Collections.emptyList(),
            null);

    HeatLapRow row = new HeatLapRow(1, Arrays.asList(3.369, 1.5, 4.0, 3.8), segments);

    assertEquals(4, row.getLaneSegments().size());

    // Lane 0: 2 segments -> multiple segments format as comma-separated string
    assertEquals(2, row.getLaneSegments(0).size());
    assertEquals("1.123, 2.246", row.getLaneSegment(0));
    assertEquals("1.123, 2.246", row.getSegment(0));
    assertEquals(1.123, row.getLaneSegment(0, 0), 0.001);
    assertEquals(2.246, row.getLaneSegment(0, 1), 0.001);
    assertEquals(1.123, row.getSegment(0, 0), 0.001);
    assertNull(row.getLaneSegment(0, 2));

    // Lane 1: 1 segment -> returns Double value
    assertEquals(1, row.getLaneSegments(1).size());
    assertEquals(1.5, (Double) row.getLaneSegment(1), 0.001);
    assertEquals(1.5, (Double) row.getSegment(1), 0.001);
    assertEquals(1.5, row.getLaneSegment(1, 0), 0.001);
    assertNull(row.getLaneSegment(1, 1));

    // Lane 2: 0 segments -> returns null
    assertTrue(row.getLaneSegments(2).isEmpty());
    assertNull(row.getLaneSegment(2));
    assertNull(row.getSegment(2));
    assertNull(row.getLaneSegment(2, 0));

    // Lane 3: null segment list -> becomes empty list, returns null
    assertTrue(row.getLaneSegments(3).isEmpty());
    assertNull(row.getLaneSegment(3));
    assertNull(row.getSegment(3));
    assertNull(row.getLaneSegment(3, 0));

    // Boundary checks
    assertTrue(row.getLaneSegments(-1).isEmpty());
    assertTrue(row.getLaneSegments(10).isEmpty());
    assertNull(row.getLaneSegment(-1));
    assertNull(row.getLaneSegment(10));
    assertNull(row.getLaneSegment(-1, 0));
    assertNull(row.getLaneSegment(0, -1));
    assertNull(row.getLaneSegment(10, 0));
  }

  @Test
  public void testHeatLapRow_GetValues() {
    // 1. Without segments
    HeatLapRow rowNoSeg = new HeatLapRow(1, Arrays.asList(3.5, 4.2, null, 3.8));
    assertEquals(Arrays.asList(3.5, 4.2, null, 3.8), rowNoSeg.getValues());

    // 2. With multi-segments
    List<List<Double>> segments =
        Arrays.asList(
            Arrays.asList(1.123, 2.246),
            Collections.singletonList(1.5),
            Collections.emptyList(),
            null);
    HeatLapRow rowWithSeg = new HeatLapRow(1, Arrays.asList(3.369, 1.5, null, 3.8), segments, 2);

    List<Object> expected =
        Arrays.asList(
            3.369,
            1.123,
            2.246, // Lane 0
            1.5,
            1.5,
            null, // Lane 1 (1 seg -> padded to 2)
            null,
            null,
            null, // Lane 2 (empty -> padded to 2)
            3.8,
            null,
            null // Lane 3 (null -> padded to 2)
            );
    assertEquals(expected, rowWithSeg.getValues());

    // 3. Null laps list
    HeatLapRow nullRow = new HeatLapRow(2, null, null, 2);
    assertTrue(nullRow.getValues().isEmpty());
  }
}
