package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class RaceHeatStatisticsTest {

  @Test
  public void testGettersAndSetters() {
    RaceHeatStatistics stats = new RaceHeatStatistics();
    stats.setStartTime("2026-08-15T12:00:00Z");
    stats.setEndTime("2026-08-15T12:05:00Z");
    stats.setStartMillis(100000L);
    stats.setDurationMillis(300000L);

    assertEquals("2026-08-15T12:00:00Z", stats.getStartTime());
    assertEquals("2026-08-15T12:05:00Z", stats.getEndTime());
    assertEquals(100000L, stats.getStartMillis());
    assertEquals(300000L, stats.getDurationMillis());
  }
}
