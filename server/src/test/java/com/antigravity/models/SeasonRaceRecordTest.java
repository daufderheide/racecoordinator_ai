package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import org.junit.Test;

public class SeasonRaceRecordTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testSeasonRaceRecordSerialization() throws Exception {
    SeasonRaceRecord.SeasonDriverResult res =
        new SeasonRaceRecord.SeasonDriverResult("d1", "Driver 1", 1, 10, 5, 15);
    SeasonRaceRecord record =
        new SeasonRaceRecord(
            "r1", "Grand Prix 1", 1785905421000L, true, Collections.singletonList(res));

    String json = mapper.writeValueAsString(record);
    assertTrue("JSON should contain is_demo property", json.contains("\"is_demo\":true"));

    SeasonRaceRecord deserialized = mapper.readValue(json, SeasonRaceRecord.class);
    assertNotNull(deserialized);
    assertEquals("r1", deserialized.getRaceId());
    assertEquals("Grand Prix 1", deserialized.getRaceName());
    assertTrue(deserialized.isDemo());
    assertEquals(1, deserialized.getDriverResults().size());
  }

  @Test
  public void testSeasonRaceRecordDeserializationAliases() throws Exception {
    String jsonIsDemo =
        "{\"race_id\":\"r1\",\"race_name\":\"Race 1\",\"timestamp\":1000,\"is_demo\":true,\"unknown_field\":\"ignore_me\"}";
    SeasonRaceRecord rec1 = mapper.readValue(jsonIsDemo, SeasonRaceRecord.class);
    assertTrue("Should deserialize is_demo:true", rec1.isDemo());

    String jsonCamelCase =
        "{\"race_id\":\"r1\",\"race_name\":\"Race 1\",\"timestamp\":1000,\"isDemo\":true}";
    SeasonRaceRecord rec2 = mapper.readValue(jsonCamelCase, SeasonRaceRecord.class);
    assertTrue("Should deserialize isDemo:true", rec2.isDemo());

    String jsonDemo =
        "{\"race_id\":\"r1\",\"race_name\":\"Race 1\",\"timestamp\":1000,\"demo\":true}";
    SeasonRaceRecord rec3 = mapper.readValue(jsonDemo, SeasonRaceRecord.class);
    assertTrue("Should deserialize demo:true", rec3.isDemo());
  }

  @Test
  public void testRaceHistoryRecordSerialization() throws Exception {
    RaceHistoryRecord history = new RaceHistoryRecord();
    history.setOriginalEntityId("h1");
    history.setDemo(true);

    String json = mapper.writeValueAsString(history);
    assertTrue("JSON should contain is_demo property", json.contains("\"is_demo\":true"));

    RaceHistoryRecord deserialized = mapper.readValue(json, RaceHistoryRecord.class);
    assertNotNull(deserialized);
    assertEquals("h1", deserialized.getOriginalEntityId());
    assertTrue(deserialized.isDemo());
  }
}
