package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class LaneTest {

  @Test
  public void testConstructorsAndGetters() {
    Lane lane = new Lane("#ff0000", "#ffffff", 100.5, "lane-1", "id-1");
    assertEquals("#ff0000", lane.getBackground_color());
    assertEquals("#ffffff", lane.getForeground_color());
    assertEquals(100.5, lane.getLength(), 0.001);
    assertEquals("lane-1", lane.getEntityId());
    assertEquals("id-1", lane.getId());

    Lane simple = new Lane("#00ff00", "#000000", 50.25);
    assertEquals("#00ff00", simple.getBackground_color());
    assertEquals("#000000", simple.getForeground_color());
    assertEquals(50.25, simple.getLength(), 0.001);

    Lane intSimple = new Lane("#0000ff", "#ffffff", 60);
    assertEquals("#0000ff", intSimple.getBackground_color());
    assertEquals("#ffffff", intSimple.getForeground_color());
    assertEquals(60.0, intSimple.getLength(), 0.001);

    Lane intFull = new Lane("#ffff00", "#000000", 75, "lane-2", "id-2");
    assertEquals("#ffff00", intFull.getBackground_color());
    assertEquals("#000000", intFull.getForeground_color());
    assertEquals(75.0, intFull.getLength(), 0.001);
    assertEquals("lane-2", intFull.getEntityId());
    assertEquals("id-2", intFull.getId());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    Lane lane = new Lane("#ff0000", "#ffffff", 100.5, "lane-1", "id-1");

    String json = mapper.writeValueAsString(lane);
    Lane deserialized = mapper.readValue(json, Lane.class);

    assertNotNull(deserialized);
    assertEquals(lane.getBackground_color(), deserialized.getBackground_color());
    assertEquals(lane.getForeground_color(), deserialized.getForeground_color());
    assertEquals(lane.getLength(), deserialized.getLength(), 0.001);
  }
}
