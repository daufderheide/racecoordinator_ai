package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.race.RaceStatistics;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import org.junit.Test;

public class RaceHistoryRecordTest {

  @Test
  public void testConstructorsAndGetters() {
    RaceHistoryRecord record =
        new RaceHistoryRecord(
            "hist_1",
            "orig_1",
            null,
            null,
            new ArrayList<>(),
            new ArrayList<>(),
            120.5f,
            new RaceStatistics(),
            true);

    assertEquals("hist_1", record.getId());
    assertEquals("orig_1", record.getOriginalEntityId());
    assertEquals(120.5f, record.getAccumulatedRaceTime(), 0.001);
    assertTrue(record.isDemo());
    assertNotNull(record.getStatistics());

    record.setEventId("event_1");
    record.setEventName("Grand Prix");
    record.setEventRace(true);
    record.setEventSummary(false);
    record.setTimestamp(1700000000000L);

    assertEquals("event_1", record.getEventId());
    assertEquals("Grand Prix", record.getEventName());
    assertTrue(record.isEventRace());
    assertEquals(Long.valueOf(1700000000000L), record.getTimestamp());

    // Test fallback to statistics startMillis when timestamp is null
    RaceHistoryRecord recordWithStats = new RaceHistoryRecord();
    RaceStatistics stats = new RaceStatistics();
    stats.setStartMillis(1690000000000L);
    recordWithStats.setStatistics(stats);
    assertEquals(Long.valueOf(1690000000000L), recordWithStats.getTimestamp());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RaceHistoryRecord record =
        new RaceHistoryRecord(
            "hist_1", "orig_1", null, null, null, null, 100.0f, null, false, 1720000000000L);

    String json = mapper.writeValueAsString(record);
    RaceHistoryRecord deserialized = mapper.readValue(json, RaceHistoryRecord.class);

    assertNotNull(deserialized);
    assertEquals("hist_1", deserialized.getId());
    assertEquals("orig_1", deserialized.getOriginalEntityId());
    assertEquals(Long.valueOf(1720000000000L), deserialized.getTimestamp());
    assertEquals(0, deserialized.getIneligibleLapCount());
  }

  @Test
  public void testIneligibleLapCount() throws Exception {
    RaceHistoryRecord record = new RaceHistoryRecord();
    assertEquals(0, record.getIneligibleLapCount());

    com.antigravity.race.Heat heat1 = new com.antigravity.race.Heat();
    com.antigravity.race.DriverHeatData dhd1 = new com.antigravity.race.DriverHeatData();
    dhd1.setLane(0);
    dhd1.addLap(4.5, false, true);
    dhd1.addLap(4.2, false, false); // Ineligible

    com.antigravity.race.DriverHeatData dhd2 = new com.antigravity.race.DriverHeatData();
    dhd2.setLane(1);
    dhd2.addLap(4.8, false, true);
    dhd2.addLap(4.3, false, false); // Ineligible
    dhd2.addLap(4.1, false, false); // Ineligible

    java.util.List<com.antigravity.race.DriverHeatData> drivers = new ArrayList<>();
    drivers.add(dhd1);
    drivers.add(dhd2);
    heat1.setDrivers(drivers);

    java.util.List<com.antigravity.race.Heat> heats = new ArrayList<>();
    heats.add(heat1);
    record.setHeats(heats);

    assertEquals(3, record.getIneligibleLapCount());

    // Explicit override
    record.setIneligibleLapCount(5);
    assertEquals(5, record.getIneligibleLapCount());

    // JSON serialization
    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(record);
    assertTrue(json.contains("\"ineligible_lap_count\":5"));

    RaceHistoryRecord deserialized = mapper.readValue(json, RaceHistoryRecord.class);
    assertEquals(5, deserialized.getIneligibleLapCount());
  }
}
