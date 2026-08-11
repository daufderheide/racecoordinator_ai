package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Theme extends Model {

  public static final String DEFAULT_THEME_ID = "default_classic_rc_ai";

  private final String name;
  private final boolean isDefault;
  private final Map<String, String> slots;
  private final Map<String, AudioConfig> audioSlots;

  @JsonCreator
  public Theme(
      @JsonProperty("name") String name,
      @JsonProperty("is_default") boolean isDefault,
      @JsonProperty("slots") Map<String, String> slots,
      @JsonProperty("audio_slots") Map<String, AudioConfig> audioSlots,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.isDefault = isDefault;
    this.slots = slots != null ? slots : new HashMap<>();
    this.audioSlots = audioSlots != null ? audioSlots : new HashMap<>();
  }

  public String getName() {
    return name;
  }

  @JsonProperty("is_default")
  public boolean isDefault() {
    return isDefault;
  }

  public Map<String, String> getSlots() {
    return slots;
  }

  @JsonProperty("audio_slots")
  public Map<String, AudioConfig> getAudioSlots() {
    return audioSlots;
  }
}
