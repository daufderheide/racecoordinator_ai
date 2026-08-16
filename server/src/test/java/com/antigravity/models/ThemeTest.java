package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

public class ThemeTest {

  @Test
  public void testConstructorsAndGetters() {
    Map<String, String> slots = new HashMap<>();
    slots.put("background", "bg.png");

    Theme theme = new Theme("Dark Theme", true, slots, null, "theme-1", "id-1");
    assertEquals("Dark Theme", theme.getName());
    assertTrue(theme.isDefault());
    assertEquals("bg.png", theme.getSlots().get("background"));
    assertNotNull(theme.getAudioSlots());
    assertEquals("theme-1", theme.getEntityId());
    assertEquals("id-1", theme.getId());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    Map<String, String> slots = new HashMap<>();
    slots.put("logo", "logo.png");

    Theme theme = new Theme("Default Theme", true, slots, new HashMap<>(), "theme-1", "id-1");
    String json = mapper.writeValueAsString(theme);
    Theme deserialized = mapper.readValue(json, Theme.class);

    assertNotNull(deserialized);
    assertEquals("Default Theme", deserialized.getName());
    assertTrue(deserialized.isDefault());
  }
}
