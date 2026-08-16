package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class LaneTest {

  @Test
  public void testConstructorsAndGetters() {
    Lane lane = new Lane("#ff0000", "#ffffff", 100, "lane-1", "id-1");
    assertEquals("#ff0000", lane.getBackground_color());
    assertEquals("#ffffff", lane.getForeground_color());
    assertEquals(100, lane.getLength());
    assertEquals("lane-1", lane.getEntityId());
    assertEquals("id-1", lane.getId());

    Lane simple = new Lane("#00ff00", "#000000", 50);
    assertEquals("#00ff00", simple.getBackground_color());
    assertEquals("#000000", simple.getForeground_color());
    assertEquals(50, simple.getLength());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    Lane lane = new Lane("#ff0000", "#ffffff", 100, "lane-1", "id-1");

    String json = mapper.writeValueAsString(lane);
    Lane deserialized = mapper.readValue(json, Lane.class);

    assertNotNull(deserialized);
    assertEquals(lane.getBackground_color(), deserialized.getBackground_color());
    assertEquals(lane.getForeground_color(), deserialized.getForeground_color());
    assertEquals(lane.getLength(), deserialized.getLength());
  }
}
