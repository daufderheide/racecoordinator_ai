package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class AudioConfigTest {

  @Test
  public void testConstructorsAndGetters() {
    AudioConfig config = new AudioConfig("custom", "http://example.com/sound.mp3", "lap sound");
    assertEquals("custom", config.getType());
    assertEquals("http://example.com/sound.mp3", config.getUrl());
    assertEquals("lap sound", config.getText());

    AudioConfig defaultConfig = new AudioConfig();
    assertEquals("preset", defaultConfig.getType());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    AudioConfig config = new AudioConfig("tts", null, "Go!");

    String json = mapper.writeValueAsString(config);
    AudioConfig deserialized = mapper.readValue(json, AudioConfig.class);

    assertNotNull(deserialized);
    assertEquals("tts", deserialized.getType());
    assertEquals("Go!", deserialized.getText());
  }
}
