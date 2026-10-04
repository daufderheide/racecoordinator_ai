package com.antigravity.importer;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.AudioConfig;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

public class DriverAudioParserHelperTest {

  @Test
  public void testParseEmptyAndBlankAudio() {
    AudioConfig sysLap = DriverAudioParserHelper.parseAudioSlot("lap", "", "system", null);
    assertEquals("preset", sysLap.getType());
    assertEquals("default_beep", sysLap.getUrl());

    AudioConfig noneLap = DriverAudioParserHelper.parseAudioSlot("lap", "  ", "none", null);
    assertEquals("none", noneLap.getType());

    AudioConfig sysFuel = DriverAudioParserHelper.parseAudioSlot("fuel", null, "system", null);
    assertEquals("audio_set", sysFuel.getType());
    assertEquals("default_fuel_level", sysFuel.getUrl());
  }

  @Test
  public void testParseNoneAndMute() {
    AudioConfig c1 = DriverAudioParserHelper.parseAudioSlot("lap", "none", "system", null);
    assertEquals("none", c1.getType());

    AudioConfig c2 = DriverAudioParserHelper.parseAudioSlot("lap", "OFF", "system", null);
    assertEquals("none", c2.getType());

    AudioConfig c3 = DriverAudioParserHelper.parseAudioSlot("lap", "mute", "system", null);
    assertEquals("none", c3.getType());

    AudioConfig c4 = DriverAudioParserHelper.parseAudioSlot("lap", "silent", "system", null);
    assertEquals("none", c4.getType());

    AudioConfig c5 = DriverAudioParserHelper.parseAudioSlot("lap", "disabled", "system", null);
    assertEquals("none", c5.getType());
  }

  @Test
  public void testParseTTS() {
    AudioConfig tts1 =
        DriverAudioParserHelper.parseAudioSlot(
            "lap", "tts:Great lap {driver.name}!", "system", null);
    assertEquals("tts", tts1.getType());
    assertEquals("Great lap {driver.name}!", tts1.getText());

    AudioConfig tts2 =
        DriverAudioParserHelper.parseAudioSlot("lap", "Fast lap by {driver.name}", "system", null);
    assertEquals("tts", tts2.getType());
    assertEquals("Fast lap by {driver.name}", tts2.getText());

    AudioConfig tts3 =
        DriverAudioParserHelper.parseAudioSlot("lap", "Lap ${driver.nickname}", "system", null);
    assertEquals("tts", tts3.getType());
    assertEquals("Lap ${driver.nickname}", tts3.getText());
  }

  @Test
  public void testParsePresetAndCustomSound() {
    AudioConfig p1 = DriverAudioParserHelper.parseAudioSlot("lap", "preset:bell", "system", null);
    assertEquals("preset", p1.getType());
    assertEquals("bell", p1.getUrl());

    AudioConfig p2 =
        DriverAudioParserHelper.parseAudioSlot("lap", "custom_sound.wav", "system", null);
    assertEquals("preset", p2.getType());
    assertEquals("custom_sound.wav", p2.getUrl());
  }

  @Test
  public void testParseAssetLookup() {
    Map<String, String> lookup = new HashMap<>();
    lookup.put("horn.wav", "/assets/asset-123_horn.wav");

    AudioConfig p = DriverAudioParserHelper.parseAudioSlot("lap", "horn.wav", "system", lookup);
    assertEquals("preset", p.getType());
    assertEquals("/assets/asset-123_horn.wav", p.getUrl());
  }

  @Test
  public void testParseAudioSet() {
    AudioConfig s1 =
        DriverAudioParserHelper.parseAudioSlot("lap", "audio_set:my_fuel_set", "system", null);
    assertEquals("audio_set", s1.getType());
    assertEquals("my_fuel_set", s1.getUrl());

    AudioConfig s2 =
        DriverAudioParserHelper.parseAudioSlot("fuel", "custom_fuel_set", "system", null);
    assertEquals("audio_set", s2.getType());
    assertEquals("custom_fuel_set", s2.getUrl());
  }
}
