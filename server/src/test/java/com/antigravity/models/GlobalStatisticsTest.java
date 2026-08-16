package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class GlobalStatisticsTest {

  @Test
  public void testConstructorsAndMutators() {
    GlobalStatistics stats = new GlobalStatistics("race_1");
    assertEquals("race_1", stats.getRaceEntityId());
    assertEquals("race_1", stats.getEntityId());

    stats.addRaceCount();
    assertEquals(1, stats.getTotalRaces());

    stats.addLaps(50.5);
    assertEquals(50.5, stats.getTotalLaps(), 0.001);

    stats.addRaceTimeMs(60000);
    assertEquals(60000, stats.getTotalRaceTimeMs());

    stats.setFastestLapTime(5.12);
    stats.setFastestLapDriverName("Driver 1");
    stats.setHighestScore(100.0);
    stats.setHighestScoreHolderName("Driver 2");

    assertEquals(5.12, stats.getFastestLapTime(), 0.001);
    assertEquals("Driver 1", stats.getFastestLapDriverName());
    assertEquals(100.0, stats.getHighestScore(), 0.001);
    assertEquals("Driver 2", stats.getHighestScoreHolderName());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    GlobalStatistics stats = new GlobalStatistics("race_1");
    stats.setId("stat_id");
    stats.setTotalRaces(10);

    String json = mapper.writeValueAsString(stats);
    GlobalStatistics deserialized = mapper.readValue(json, GlobalStatistics.class);

    assertNotNull(deserialized);
    assertEquals(10, deserialized.getTotalRaces());
    assertEquals("race_1", deserialized.getRaceEntityId());
  }
}
