package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class LogicalSortComparatorTest {

  @Test
  public void testDriverTenSortsAfterDriverNine() {
    List<String> list =
        new ArrayList<>(Arrays.asList("Driver 10", "Driver 9", "Driver 2", "Driver 1"));
    list.sort(LogicalSortComparator.INSTANCE);

    assertEquals(Arrays.asList("Driver 1", "Driver 2", "Driver 9", "Driver 10"), list);
  }

  @Test
  public void testCompleteDriverOneToTwelveSequence() {
    List<String> unsorted =
        Arrays.asList(
            "Driver 10",
            "Driver 1",
            "Driver 12",
            "Driver 2",
            "Driver 11",
            "Driver 3",
            "Driver 4",
            "Driver 9",
            "Driver 5",
            "Driver 8",
            "Driver 6",
            "Driver 7");
    List<String> list = new ArrayList<>(unsorted);
    list.sort(LogicalSortComparator.INSTANCE);

    List<String> expected =
        Arrays.asList(
            "Driver 1",
            "Driver 2",
            "Driver 3",
            "Driver 4",
            "Driver 5",
            "Driver 6",
            "Driver 7",
            "Driver 8",
            "Driver 9",
            "Driver 10",
            "Driver 11",
            "Driver 12");
    assertEquals(expected, list);
  }

  @Test
  public void testNullAndEmptyHandling() {
    assertEquals(0, LogicalSortComparator.compareLogical(null, null));
    assertTrue(LogicalSortComparator.compareLogical(null, "Driver 1") < 0);
    assertTrue(LogicalSortComparator.compareLogical("Driver 1", null) > 0);
    assertTrue(LogicalSortComparator.compareLogical("", "Driver 1") < 0);
    assertEquals(0, LogicalSortComparator.compareLogical("", ""));
  }

  @Test
  public void testCaseInsensitivityWithSecondaryTieBreaker() {
    assertTrue(LogicalSortComparator.compareLogical("driver 1", "Driver 2") < 0);
    assertTrue(LogicalSortComparator.compareLogical("Driver 2", "driver 1") > 0);

    // Identical case-insensitively, primary compare is 0, secondary compare uses ASCII
    // 'D' (68) < 'd' (100)
    assertTrue(LogicalSortComparator.compareLogical("Driver 1", "driver 1") < 0);
    assertTrue(LogicalSortComparator.compareLogical("driver 1", "Driver 1") > 0);
    assertEquals(0, LogicalSortComparator.compareLogical("Driver 1", "Driver 1"));
  }

  @Test
  public void testLeadingZeros() {
    // 1 < 01 < 001 < 2
    List<String> list = new ArrayList<>(Arrays.asList("Car 2", "Car 01", "Car 1", "Car 001"));
    list.sort(LogicalSortComparator.INSTANCE);

    assertEquals(Arrays.asList("Car 1", "Car 01", "Car 001", "Car 2"), list);
  }

  @Test
  public void testMixedAlphanumeric() {
    List<String> list =
        new ArrayList<>(Arrays.asList("Label 10", "Label 2", "Label 1", "Label 20"));
    list.sort(LogicalSortComparator.INSTANCE);

    assertEquals(Arrays.asList("Label 1", "Label 2", "Label 10", "Label 20"), list);
  }

  @Test
  public void testComparatorInstance() {
    LogicalSortComparator comp = new LogicalSortComparator();
    assertTrue(comp.compare("A", "B") < 0);
    assertTrue(comp.compare("B", "A") > 0);
    assertEquals(0, comp.compare("A", "A"));
  }
}
