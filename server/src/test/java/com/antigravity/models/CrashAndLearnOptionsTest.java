package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class CrashAndLearnOptionsTest {

  @Test
  public void testDefaultValues() {
    CrashAndLearnOptions options = new CrashAndLearnOptions.Builder().build();

    assertFalse(options.isEnabled());
    assertEquals(0.0, options.getAutomatedCrashTime(), 0.001);
    assertEquals(3, options.getMaxCrashes());
    assertTrue(options.isPauseHeatOnCrash());
    assertTrue(options.isAllowMultipleCrashesPerLap());
    assertTrue(options.isResetCrashesEachHeat());
    assertTrue(options.isResetDqEachHeat());
    assertEquals(0.0, options.getHeatCrashLapPenalty(), 0.001);
    assertEquals(0.0, options.getHeatTimePenalty(), 0.001);
    assertEquals(100.0, options.getDqHeatScorePercentage(), 0.001);
  }

  @Test
  public void testCustomValuesAndBuilder() {
    CrashAndLearnOptions options =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withAutomatedCrashTime(5.2)
            .withMaxCrashes(7)
            .withPauseHeatOnCrash(false)
            .withAllowMultipleCrashesPerLap(false)
            .withResetCrashesEachHeat(false)
            .withResetDqEachHeat(false)
            .withHeatCrashLapPenalty(2.0)
            .withHeatTimePenalty(4.5)
            .withDqHeatScorePercentage(75.0)
            .build();

    assertTrue(options.isEnabled());
    assertEquals(5.2, options.getAutomatedCrashTime(), 0.001);
    assertEquals(7, options.getMaxCrashes());
    assertFalse(options.isPauseHeatOnCrash());
    assertFalse(options.isAllowMultipleCrashesPerLap());
    assertFalse(options.isResetCrashesEachHeat());
    assertFalse(options.isResetDqEachHeat());
    assertEquals(2.0, options.getHeatCrashLapPenalty(), 0.001);
    assertEquals(4.5, options.getHeatTimePenalty(), 0.001);
    assertEquals(75.0, options.getDqHeatScorePercentage(), 0.001);
  }

  @Test
  public void testBuilderFromCopyConstructor() {
    CrashAndLearnOptions original =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withAutomatedCrashTime(3.5)
            .withMaxCrashes(2)
            .withPauseHeatOnCrash(false)
            .withAllowMultipleCrashesPerLap(false)
            .withResetCrashesEachHeat(false)
            .withResetDqEachHeat(false)
            .withHeatCrashLapPenalty(1.0)
            .withHeatTimePenalty(2.0)
            .withDqHeatScorePercentage(50.0)
            .build();

    CrashAndLearnOptions copy = new CrashAndLearnOptions.Builder().from(original).build();

    assertEquals(original, copy);
    assertEquals(original.hashCode(), copy.hashCode());
    assertTrue(copy.isEnabled());
    assertEquals(3.5, copy.getAutomatedCrashTime(), 0.001);
    assertEquals(2, copy.getMaxCrashes());
    assertFalse(copy.isPauseHeatOnCrash());
    assertFalse(copy.isAllowMultipleCrashesPerLap());
    assertFalse(copy.isResetCrashesEachHeat());
    assertFalse(copy.isResetDqEachHeat());
    assertEquals(1.0, copy.getHeatCrashLapPenalty(), 0.001);
    assertEquals(2.0, copy.getHeatTimePenalty(), 0.001);
    assertEquals(50.0, copy.getDqHeatScorePercentage(), 0.001);
  }

  @Test
  public void testEqualsAndHashCode() {
    CrashAndLearnOptions opt1 = new CrashAndLearnOptions.Builder().withEnabled(true).build();
    CrashAndLearnOptions opt2 = new CrashAndLearnOptions.Builder().withEnabled(true).build();
    CrashAndLearnOptions opt3 = new CrashAndLearnOptions.Builder().withEnabled(false).build();

    assertEquals(opt1, opt2);
    assertEquals(opt1.hashCode(), opt2.hashCode());
    assertNotEquals(opt1, opt3);
    assertNotEquals(opt1, null);
    assertNotEquals(opt1, "string");
  }

  @Test
  public void testConstructorWithNulls() {
    CrashAndLearnOptions options =
        new CrashAndLearnOptions(null, null, null, null, null, null, null, null, null, null);

    assertFalse(options.isEnabled());
    assertEquals(0.0, options.getAutomatedCrashTime(), 0.001);
    assertEquals(3, options.getMaxCrashes());
    assertTrue(options.isPauseHeatOnCrash());
    assertTrue(options.isAllowMultipleCrashesPerLap());
    assertTrue(options.isResetCrashesEachHeat());
    assertTrue(options.isResetDqEachHeat());
    assertEquals(0.0, options.getHeatCrashLapPenalty(), 0.001);
    assertEquals(0.0, options.getHeatTimePenalty(), 0.001);
    assertEquals(100.0, options.getDqHeatScorePercentage(), 0.001);
    assertNotNull(options.toString());
  }
}
