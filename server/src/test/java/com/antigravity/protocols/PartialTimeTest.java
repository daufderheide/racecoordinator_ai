package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class PartialTimeTest {

  @Test
  public void testConstructorsAndGetters() {
    PartialTime pt = new PartialTime(2, 6.25, 2.15);
    assertEquals(2, pt.getLaneIndex());
    assertEquals(6.25, pt.getLapTime(), 0.001);
    assertEquals(2.15, pt.getSegmentTime(), 0.001);
  }
}
