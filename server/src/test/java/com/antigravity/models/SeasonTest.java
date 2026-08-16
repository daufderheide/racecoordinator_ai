package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import org.junit.Test;

public class SeasonTest {

  @Test
  public void testConstructorsAndGetters() {
    Season s1 = new Season("Winter Championship", 2);
    assertEquals("Winter Championship", s1.getName());
    assertEquals(2, s1.getDrops());
    assertNotNull(s1.getRaces());

    Season s2 = new Season("Summer Cup", 1, new ArrayList<>(), "season-1", "id-1");
    assertEquals("Summer Cup", s2.getName());
    assertEquals(1, s2.getDrops());
    assertEquals("season-1", s2.getEntityId());
    assertEquals("id-1", s2.getId());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    Season season = new Season("Winter Championship", 2, new ArrayList<>(), "season-1", "id-1");

    String json = mapper.writeValueAsString(season);
    Season deserialized = mapper.readValue(json, Season.class);

    assertNotNull(deserialized);
    assertEquals("Winter Championship", deserialized.getName());
    assertEquals(2, deserialized.getDrops());
  }
}
