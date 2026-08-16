package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class DriverStatisticsTest {

  @Test
  public void testGettersAndSetters() {
    DriverStatistics stats = new DriverStatistics();
    stats.setId("stat-1");
    stats.setDriverId("d1");
    stats.setRaceId("r1");
    stats.setBestLapTime(5.42);
    stats.setBestLapCount(25.0);
    stats.setLaneBestLapTimes(Arrays.asList(5.42, 5.89));
    stats.setLaneBestLapCounts(Arrays.asList(25.0, 24.0));
    stats.setBestLapTimeDate(1000L);
    stats.setBestLapCountDate(2000L);
    stats.setLaneBestLapTimesDates(Arrays.asList(1000L, 1100L));
    stats.setLaneBestLapCountsDates(Arrays.asList(2000L, 2100L));

    assertEquals("stat-1", stats.getId());
    assertEquals("d1", stats.getDriverId());
    assertEquals("r1", stats.getRaceId());
    assertEquals("d1_r1", stats.getEntityId());
    assertEquals(5.42, stats.getBestLapTime(), 0.001);
    assertEquals(25.0, stats.getBestLapCount(), 0.001);
    assertEquals(2, stats.getLaneBestLapTimes().size());
    assertEquals(2, stats.getLaneBestLapCounts().size());
    assertEquals(Long.valueOf(1000L), stats.getBestLapTimeDate());
    assertEquals(Long.valueOf(2000L), stats.getBestLapCountDate());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    DriverStatistics stats =
        new DriverStatistics(
            "stat-1",
            "d1",
            "r1",
            5.42,
            25.0,
            Arrays.asList(5.42),
            Arrays.asList(25.0),
            1000L,
            2000L,
            Arrays.asList(1000L),
            Arrays.asList(2000L));

    String json = mapper.writeValueAsString(stats);
    DriverStatistics deserialized = mapper.readValue(json, DriverStatistics.class);

    assertNotNull(deserialized);
    assertEquals("d1", deserialized.getDriverId());
    assertEquals("r1", deserialized.getRaceId());
    assertEquals(5.42, deserialized.getBestLapTime(), 0.001);
  }
}
