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
        new SeasonRaceRecord.SeasonDriverResult("d1", "Driver 1", 1, 10.0, 3.0, 5.0, 2.0, 20.0);
    SeasonRaceRecord record =
        new SeasonRaceRecord(
            "r1", "Grand Prix 1", 1785905421000L, true, Collections.singletonList(res));

    String json = mapper.writeValueAsString(record);
    assertTrue("JSON should contain is_demo property", json.contains("\"is_demo\":true"));
    assertTrue(
        "JSON should contain overall_bonus_points property",
        json.contains("\"overall_bonus_points\":3.0"));
    assertTrue(
        "JSON should contain heat_bonus_points property",
        json.contains("\"heat_bonus_points\":2.0"));

    SeasonRaceRecord deserialized = mapper.readValue(json, SeasonRaceRecord.class);
    assertNotNull(deserialized);
    assertEquals("r1", deserialized.getRaceId());
    assertEquals("Grand Prix 1", deserialized.getRaceName());
    assertTrue(deserialized.isDemo());
    assertEquals(1, deserialized.getDriverResults().size());
    SeasonRaceRecord.SeasonDriverResult resDeserialized = deserialized.getDriverResults().get(0);
    assertEquals(10.0, resDeserialized.getOverallPoints(), 0.001);
    assertEquals(3.0, resDeserialized.getOverallBonusPoints(), 0.001);
    assertEquals(5.0, resDeserialized.getHeatPoints(), 0.001);
    assertEquals(2.0, resDeserialized.getHeatBonusPoints(), 0.001);
    assertEquals(20.0, resDeserialized.getTotalPoints(), 0.001);
    assertNotNull(resDeserialized.getOverallBonusBreakdown());
    assertNotNull(resDeserialized.getHeatBonusBreakdown());
  }

  @Test
  public void testSeasonDriverResultWithBreakdownMapsSerialization() throws Exception {
    java.util.Map<String, Double> overallBreakdown = new java.util.LinkedHashMap<>();
    overallBreakdown.put("fastest_lap", 15.0);
    overallBreakdown.put("most_laps_led", 25.0);

    java.util.Map<String, Double> heatBreakdown = new java.util.LinkedHashMap<>();
    heatBreakdown.put("fastest_lap", 5.0);
    heatBreakdown.put("led_lap", 2.0);

    SeasonRaceRecord.SeasonDriverResult res =
        new SeasonRaceRecord.SeasonDriverResult(
            "d1", "Driver 1", 1, 25.0, 40.0, overallBreakdown, 10.0, 7.0, heatBreakdown, 82.0);

    SeasonRaceRecord record =
        new SeasonRaceRecord(
            "r1", "Championship Race 1", 1785905421000L, false, Collections.singletonList(res));

    String json = mapper.writeValueAsString(record);
    assertTrue(json.contains("\"overall_bonus_breakdown\":"));
    assertTrue(json.contains("\"fastest_lap\":15.0"));
    assertTrue(json.contains("\"most_laps_led\":25.0"));
    assertTrue(json.contains("\"heat_bonus_breakdown\":"));
    assertTrue(json.contains("\"fastest_lap\":5.0"));
    assertTrue(json.contains("\"led_lap\":2.0"));

    SeasonRaceRecord deserialized = mapper.readValue(json, SeasonRaceRecord.class);
    assertNotNull(deserialized);
    SeasonRaceRecord.SeasonDriverResult desRes = deserialized.getDriverResults().get(0);
    assertEquals(15.0, desRes.getOverallBonusBreakdown().get("fastest_lap"), 0.001);
    assertEquals(25.0, desRes.getOverallBonusBreakdown().get("most_laps_led"), 0.001);
    assertEquals(5.0, desRes.getHeatBonusBreakdown().get("fastest_lap"), 0.001);
    assertEquals(2.0, desRes.getHeatBonusBreakdown().get("led_lap"), 0.001);
    assertEquals(82.0, desRes.getTotalPoints(), 0.001);
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
