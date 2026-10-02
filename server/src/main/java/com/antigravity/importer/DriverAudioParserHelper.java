package com.antigravity.importer;

import com.antigravity.models.AudioConfig;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public final class DriverAudioParserHelper {

  public static final Map<String, String> DEFAULT_PRESETS;

  static {
    Map<String, String> presets = new HashMap<>();
    presets.put("lap", "default_beep");
    presets.put("bestLap", "default_driveby");
    presets.put("penalty", "default_penalty");
    presets.put("overallBestLap", "default_record_lap");
    presets.put("overallLaneBestLap", "default_record_lane_lap");
    presets.put("raceBestLap", "default_best_race_lap");
    presets.put("raceLaneBestLap", "default_best_race_lane_lap");
    presets.put("heatBestLap", "default_best_heat_lap");
    presets.put("newRaceLeader", "default_new_race_leader");
    presets.put("newHeatLeader", "default_new_heat_leader");
    presets.put("pitIn", "default_pit_in");
    presets.put("fuel", "default_fuel_level");
    DEFAULT_PRESETS = Collections.unmodifiableMap(presets);
  }

  private DriverAudioParserHelper() {}

  public static AudioConfig parseAudioSlot(
      String slotKey,
      String cellValue,
      String rowAudioDefault,
      Map<String, String> assetUrlLookup) {
    if (cellValue == null || cellValue.trim().isEmpty()) {
      return createDefaultAudio(slotKey, rowAudioDefault);
    }

    String val = cellValue.trim();
    String lower = val.toLowerCase();

    if ("none".equals(lower)
        || "off".equals(lower)
        || "mute".equals(lower)
        || "silent".equals(lower)
        || "disabled".equals(lower)) {
      return new AudioConfig("none", "", "");
    }

    if (lower.startsWith("tts:")) {
      String text = val.substring(4).trim();
      return new AudioConfig("tts", "", text);
    }

    if (val.contains("{") || val.contains("${")) {
      return new AudioConfig("tts", "", val);
    }

    if (lower.startsWith("preset:")) {
      String preset = val.substring(7).trim();
      return new AudioConfig("preset", preset, "");
    }

    if (lower.startsWith("audio_set:") || "fuel".equals(slotKey)) {
      String setName = lower.startsWith("audio_set:") ? val.substring(10).trim() : val;
      return new AudioConfig("audio_set", setName, "");
    }

    // Check if filename matches an imported asset
    String lookupKey = val.toLowerCase();
    if (assetUrlLookup != null && assetUrlLookup.containsKey(lookupKey)) {
      return new AudioConfig("preset", assetUrlLookup.get(lookupKey), "");
    }

    // Default to preset with provided value / url
    return new AudioConfig("preset", val, "");
  }

  public static AudioConfig createDefaultAudio(String slotKey, String defaultAudioMode) {
    if ("none".equalsIgnoreCase(defaultAudioMode) || "mute".equalsIgnoreCase(defaultAudioMode)) {
      return new AudioConfig("none", "", "");
    }

    String preset = DEFAULT_PRESETS.getOrDefault(slotKey, "default_beep");
    if ("fuel".equals(slotKey)) {
      return new AudioConfig("audio_set", preset, "");
    }
    return new AudioConfig("preset", preset, "");
  }
}
