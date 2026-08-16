package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class TeamTest {

  @Test
  public void testConstructorsAndGetters() {
    Team t1 = new Team("Red Bull", "avatar.png", Arrays.asList("d1", "d2"), "team-1", "id-1");
    assertEquals("Red Bull", t1.getName());
    assertEquals("avatar.png", t1.getAvatarUrl());
    assertEquals(2, t1.getDriverIds().size());
    assertEquals("team-1", t1.getEntityId());
    assertEquals("id-1", t1.getId());

    Team t2 = new Team("Ferrari", null, null);
    assertEquals("Ferrari", t2.getName());
    assertNotNull(t2.getDriverIds());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    Team team = new Team("Red Bull", "avatar.png", Arrays.asList("d1", "d2"), "team-1", "id-1");

    String json = mapper.writeValueAsString(team);
    Team deserialized = mapper.readValue(json, Team.class);

    assertNotNull(deserialized);
    assertEquals("Red Bull", deserialized.getName());
    assertEquals("avatar.png", deserialized.getAvatarUrl());
    assertEquals(2, deserialized.getDriverIds().size());
  }
}
