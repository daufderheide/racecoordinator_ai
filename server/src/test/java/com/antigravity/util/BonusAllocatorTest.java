package com.antigravity.util;

import static org.junit.Assert.*;

import java.util.*;
import org.junit.Test;

public class BonusAllocatorTest {

  @Test
  public void testAllocateOnePerDriver() {
    BonusAllocator.BonusDef b1 =
        new BonusAllocator.BonusDef("FastestLap", 5.0, Arrays.asList("A", "B", "C"));
    BonusAllocator.BonusDef b2 =
        new BonusAllocator.BonusDef("MostLaps", 3.0, Arrays.asList("A", "C", "B"));
    BonusAllocator.BonusDef b3 = new BonusAllocator.BonusDef("LedLap", 1.0, Arrays.asList("B"));
    BonusAllocator.BonusDef b4 = new BonusAllocator.BonusDef("LedLap", 1.0, Arrays.asList("A"));

    Map<String, List<Double>> result = BonusAllocator.allocate(Arrays.asList(b1, b2, b3, b4), true);

    assertEquals(1, result.get("A").size(), 0.001);
    assertEquals(5.0, result.get("A").get(0), 0.001);

    assertEquals(1, result.get("C").size(), 0.001);
    assertEquals(3.0, result.get("C").get(0), 0.001);

    assertEquals(1, result.get("B").size(), 0.001);
    assertEquals(1.0, result.get("B").get(0), 0.001);
  }

  @Test
  public void testAllocateMultiplePerDriver() {
    BonusAllocator.BonusDef b1 =
        new BonusAllocator.BonusDef("FastestLap", 5.0, Arrays.asList("A", "B", "C"));
    BonusAllocator.BonusDef b2 =
        new BonusAllocator.BonusDef("MostLaps", 3.0, Arrays.asList("A", "C", "B"));

    Map<String, List<Double>> result = BonusAllocator.allocate(Arrays.asList(b1, b2), false);

    assertEquals(2, result.get("A").size());
    assertTrue(result.get("A").contains(5.0));
    assertTrue(result.get("A").contains(3.0));
    assertNull(result.get("C"));
  }

  @Test
  public void testAllocateEmptyListAndEmptyFallbacks() {
    Map<String, List<Double>> emptyResultOne =
        BonusAllocator.allocate(Collections.emptyList(), true);
    assertTrue(emptyResultOne.isEmpty());

    Map<String, List<Double>> emptyResultMulti =
        BonusAllocator.allocate(Collections.emptyList(), false);
    assertTrue(emptyResultMulti.isEmpty());

    BonusAllocator.BonusDef b1 =
        new BonusAllocator.BonusDef("FastestLap", 5.0, Collections.emptyList());
    Map<String, List<Double>> resultNoDrivers =
        BonusAllocator.allocate(Collections.singletonList(b1), true);
    assertTrue(resultNoDrivers.isEmpty());

    Map<String, List<Double>> resultNoDriversMulti =
        BonusAllocator.allocate(Collections.singletonList(b1), false);
    assertTrue(resultNoDriversMulti.isEmpty());
  }
}
