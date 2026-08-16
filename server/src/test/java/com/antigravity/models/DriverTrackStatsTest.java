package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class DriverTrackStatsTest {

  @Test
  public void testConstructorsAndGetters() {
    DriverTrackStats.LanePaceStats laneStat =
        new DriverTrackStats.LanePaceStats(0, 5.5, 5.8, 5.2, 0.2, 95.0, 0.05, 50);

    DriverTrackStats stats =
        new DriverTrackStats(
            "id-1", "d1", "t1", 5, 20, 200, Arrays.asList(laneStat), 5.5, 95.0, 123456789L);

    assertEquals("id-1", stats.getId());
    assertEquals("d1", stats.getDriverId());
    assertEquals("t1", stats.getTrackId());
    assertEquals(5, stats.getTotalRaces());
    assertEquals(20, stats.getTotalHeats());
    assertEquals(200, stats.getTotalLaps());
    assertEquals(1, stats.getLaneStats().size());
    assertEquals(5.5, stats.getOverallMedianLapTime(), 0.001);
    assertEquals(95.0, stats.getOverallConsistencyScore(), 0.001);
    assertEquals(123456789L, stats.getLastUpdated());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    DriverTrackStats.LanePaceStats laneStat =
        new DriverTrackStats.LanePaceStats(0, 5.5, 5.8, 5.2, 0.2, 95.0, 0.05, 50);

    DriverTrackStats stats =
        new DriverTrackStats(
            "id-1", "d1", "t1", 5, 20, 200, Arrays.asList(laneStat), 5.5, 95.0, 123456789L);

    String json = mapper.writeValueAsString(stats);
    DriverTrackStats deserialized = mapper.readValue(json, DriverTrackStats.class);

    assertNotNull(deserialized);
    assertEquals("d1", deserialized.getDriverId());
    assertEquals("t1", deserialized.getTrackId());
    assertEquals(1, deserialized.getLaneStats().size());
  }
}
