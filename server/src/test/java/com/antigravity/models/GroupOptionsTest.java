package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.converters.RaceConverter;
import com.antigravity.proto.RaceModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import org.junit.Test;

public class GroupOptionsTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  public void testDefaultConstructor() {
    GroupOptions options = new GroupOptions();
    assertNotNull(options.getNames());
    assertTrue(options.getNames().isEmpty());
  }

  @Test
  public void testConstructorWithNames() {
    List<String> names = Arrays.asList("Novice", "Intermediate", "Pro");
    GroupOptions options = new GroupOptions(true, 3, false, true, false, true, 0, names);

    assertEquals(true, options.isEnabled());
    assertEquals(3, options.getMaxGroups());
    assertEquals(3, options.getNames().size());
    assertEquals("Novice", options.getNames().get(0));
    assertEquals("Intermediate", options.getNames().get(1));
    assertEquals("Pro", options.getNames().get(2));
  }

  @Test
  public void testJsonSerialization() throws Exception {
    List<String> names = Arrays.asList("Group A", "Group B");
    GroupOptions options = new GroupOptions(true, 2, false, true, false, true, 0, names);

    String json = objectMapper.writeValueAsString(options);
    GroupOptions deserialized = objectMapper.readValue(json, GroupOptions.class);

    assertNotNull(deserialized);
    assertEquals(2, deserialized.getNames().size());
    assertEquals("Group A", deserialized.getNames().get(0));
    assertEquals("Group B", deserialized.getNames().get(1));
  }

  @Test
  public void testToProtoConversion() {
    List<String> names = Arrays.asList("A Class", "B Class");
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, true, 0, names);

    Race race = new Race.Builder().withName("Test Race").withGroupOptions(groupOptions).build();

    Track track = new Track.Builder().name("Test Track").build();
    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertNotNull(proto.getGroupOptions());
    assertEquals(2, proto.getGroupOptions().getNamesCount());
    assertEquals("A Class", proto.getGroupOptions().getNames(0));
    assertEquals("B Class", proto.getGroupOptions().getNames(1));
  }
}
