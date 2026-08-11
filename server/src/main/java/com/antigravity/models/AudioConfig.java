package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AudioConfig {

  private final String type;
  private final String url;
  private final String text;

  public AudioConfig(
      @JsonProperty("type") String type,
      @JsonProperty("url") String url,
      @JsonProperty("text") String text) {
    this.type = type != null ? type : "preset";
    this.url = url;
    this.text = text;
  }

  public AudioConfig() {
    this("preset", null, null);
  }

  public String getType() {
    return type;
  }

  public String getUrl() {
    return url;
  }

  public String getText() {
    return text;
  }
}
