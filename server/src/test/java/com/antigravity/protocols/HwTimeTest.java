package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;

import org.junit.Before;
import org.junit.Test;

public class HwTimeTest {

  private HwTime hwTime;

  @Before
  public void setUp() {
    hwTime = new HwTime();
  }

  @Test
  public void testInitialState() {
    // time() resets the state, so toString() is better to check initial state without resetting
    assertEquals("0.0s, sec: 0, us: 0", hwTime.toString());
  }

  @Test
  public void testAddMicroseconds_NoRollover() {
    hwTime.add(500_000); // 500ms
    assertEquals("0.5s, sec: 0, us: 500000", hwTime.toString());
  }

  @Test
  public void testAddMicroseconds_WithRollover() {
    hwTime.add(1_500_000); // 1.5 seconds
    assertEquals("1.5s, sec: 1, us: 500000", hwTime.toString());
  }

  @Test
  public void testAddMicroseconds_MultipleAdds() {
    hwTime.add(400_000); // 0.4s
    hwTime.add(800_000); // 0.8s
    assertEquals("1.2s, sec: 1, us: 200000", hwTime.toString());
  }

  @Test
  public void testTime_ReturnsAndResets() {
    hwTime.add(2_500_000); // 2.5s

    // time() should return 2.5 and reset internally
    double t = hwTime.time();
    assertEquals(2.5, t, 0.0001);

    // Check that it was reset
    assertEquals("0.0s, sec: 0, us: 0", hwTime.toString());
  }

  @Test
  public void testReset() {
    hwTime.add(3_000_000); // 3.0s
    hwTime.reset();
    assertEquals("0.0s, sec: 0, us: 0", hwTime.toString());
  }
}
