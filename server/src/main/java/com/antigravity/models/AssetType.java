package com.antigravity.models;

public enum AssetType {
  IMAGE("image"),
  IMAGE_SET("image_set"),
  AUDIO("audio"),
  AUDIO_SET("audio_set"),
  CUSTOM_ROTATION("custom_rotation");

  private final String value;

  AssetType(String value) {
    this.value = value;
  }

  public String getValue() {
    return value;
  }

  public static String normalize(String type) {
    if (type == null) {
      return IMAGE.getValue();
    }
    if ("sound".equalsIgnoreCase(type) || "audio".equalsIgnoreCase(type)) {
      return AUDIO.getValue();
    }
    return type;
  }
}
