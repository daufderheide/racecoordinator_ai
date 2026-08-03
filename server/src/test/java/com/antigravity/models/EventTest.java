package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class EventTest {

  @Test
  public void testEventCreationAndJsonSerialization() throws Exception {
    List<Event.EventRaceItem> races = new ArrayList<>();
    races.add(new Event.EventRaceItem("race_1", 0)); // Unlimited
    races.add(new Event.EventRaceItem("race_2", 4)); // Max 4

    Event event = new Event("Championship", "Summer Cup 2026", 10.0, races, "1", null);

    assertEquals("Championship", event.getName());
    assertEquals("Summer Cup 2026", event.getDescription());
    assertEquals(10.0, event.getAutoAdvanceTime(), 0.001);
    assertEquals(2, event.getRaces().size());
    assertEquals("race_1", event.getRaces().get(0).getRaceId());
    assertEquals(0, event.getRaces().get(0).getMaxDrivers());
    assertEquals("race_2", event.getRaces().get(1).getRaceId());
    assertEquals(4, event.getRaces().get(1).getMaxDrivers());

    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(event);
    assertNotNull(json);

    Event deserialized = mapper.readValue(json, Event.class);
    assertEquals("Championship", deserialized.getName());
    assertEquals("Summer Cup 2026", deserialized.getDescription());
    assertEquals(10.0, deserialized.getAutoAdvanceTime(), 0.001);
    assertEquals(2, deserialized.getRaces().size());
    assertEquals(4, deserialized.getRaces().get(1).getMaxDrivers());
  }

  @Test
  public void testCamelCaseJsonDeserialization() throws Exception {
    String json =
        "{\"@id\":1,\"name\":\"Championship\",\"description\":\"Summer Cup 2026\",\"auto_advance_time\":10.0,\"races\":[{\"raceId\":\"race_1\",\"maxDrivers\":0},{\"raceId\":\"race_2\",\"maxDrivers\":4}],\"entity_id\":\"1\"}";
    ObjectMapper mapper = new ObjectMapper();
    Event deserialized = mapper.readValue(json, Event.class);
    assertEquals("Championship", deserialized.getName());
    assertEquals(2, deserialized.getRaces().size());
    assertEquals("race_1", deserialized.getRaces().get(0).getRaceId());
    assertEquals(4, deserialized.getRaces().get(1).getMaxDrivers());
  }
}
