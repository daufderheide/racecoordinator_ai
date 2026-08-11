package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Lane extends Model {

  private final String background_color;
  private final String foreground_color;
  private final int length;

  @JsonCreator
  public Lane(
      @JsonProperty("background_color") String background_color,
      @JsonProperty("foreground_color") String foreground_color,
      @JsonProperty("length") int length,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.background_color = background_color;
    this.foreground_color = foreground_color;
    this.length = length;
  }

  public Lane(String background_color, String foreground_color, int length) {
    this(background_color, foreground_color, length, null, null);
  }

  public String getBackground_color() {
    return background_color;
  }

  public String getForeground_color() {
    return foreground_color;
  }

  public int getLength() {
    return length;
  }
}
