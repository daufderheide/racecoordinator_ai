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

    assertEquals("event_1", record.getEventId());
    assertEquals("Grand Prix", record.getEventName());
    assertTrue(record.isEventRace());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RaceHistoryRecord record =
        new RaceHistoryRecord("hist_1", "orig_1", null, null, null, null, 100.0f, null, false);

    String json = mapper.writeValueAsString(record);
    RaceHistoryRecord deserialized = mapper.readValue(json, RaceHistoryRecord.class);

    assertNotNull(deserialized);
    assertEquals("hist_1", deserialized.getId());
    assertEquals("orig_1", deserialized.getOriginalEntityId());
  }
}
