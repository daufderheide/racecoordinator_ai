package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Driver extends Model {
  public static final String EMPTY_DRIVER_ID = "EMPTY_LANE";
  public static final Driver EMPTY_DRIVER = new Driver("Empty", "Empty", EMPTY_DRIVER_ID, null);

  private final String name;
  private final String nickname;
  private final String avatarUrl;
  private final AudioConfig lapAudio;
  private final AudioConfig bestLapAudio;
  private final AudioConfig penaltyAudio;

  public Driver(
      @JsonProperty("name") String name,
      @JsonProperty("nickname") String nickname,
      @JsonProperty("avatarUrl") String avatarUrl,
      @JsonProperty("lapAudio") AudioConfig lapAudio,
      @JsonProperty("bestLapAudio") AudioConfig bestLapAudio,
      @JsonProperty("penaltyAudio") AudioConfig penaltyAudio,
      @JsonProperty("lapSoundUrl") String lapSoundUrl,
      @JsonProperty("bestLapSoundUrl") String bestLapSoundUrl,
      @JsonProperty("penaltySoundUrl") String penaltySoundUrl,
      @JsonProperty("lapSoundType") String lapSoundType,
      @JsonProperty("bestLapSoundType") String bestLapSoundType,
      @JsonProperty("penaltySoundType") String penaltySoundType,
      @JsonProperty("lapSoundText") String lapSoundText,
      @JsonProperty("bestLapSoundText") String bestLapSoundText,
      @JsonProperty("penaltySoundText") String penaltySoundText,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.nickname = nickname;
    this.avatarUrl = avatarUrl;

    if (lapAudio != null) {
      this.lapAudio = lapAudio;
    } else if (lapSoundUrl != null || lapSoundType != null || lapSoundText != null) {
      this.lapAudio = new AudioConfig(lapSoundType, lapSoundUrl, lapSoundText);
    } else {
      this.lapAudio = new AudioConfig("preset", "default_beep", "");
    }

    if (bestLapAudio != null) {
      this.bestLapAudio = bestLapAudio;
    } else if (bestLapSoundUrl != null || bestLapSoundType != null || bestLapSoundText != null) {
      this.bestLapAudio = new AudioConfig(bestLapSoundType, bestLapSoundUrl, bestLapSoundText);
    } else {
      this.bestLapAudio = new AudioConfig("preset", "default_driveby", "");
    }

    if (penaltyAudio != null) {
      this.penaltyAudio = penaltyAudio;
    } else if (penaltySoundUrl != null || penaltySoundType != null || penaltySoundText != null) {
      String actualUrl = penaltySoundUrl;
      if ("default_penalty".equals(actualUrl)
          || "/assets/default_penalty_penalty.wav".equals(actualUrl)) {
        actualUrl = "default_penalty";
      }
      this.penaltyAudio = new AudioConfig(penaltySoundType, actualUrl, penaltySoundText);
    } else {
      this.penaltyAudio = new AudioConfig("preset", "default_penalty", "");
    }
  }

  // TODO(aufderheide): This constructor mess needs a builder pattern refactor.
  public Driver(
      String name,
      String nickname,
      String avatarUrl,
      AudioConfig lapAudio,
      AudioConfig bestLapAudio,
      String lapSoundUrl,
      String bestLapSoundUrl,
      String lapSoundType,
      String bestLapSoundType,
      String lapSoundText,
      String bestLapSoundText,
      String entityId,
      String id) {
    this(
        name,
        nickname,
        avatarUrl,
        lapAudio,
        bestLapAudio,
        null,
        lapSoundUrl,
        bestLapSoundUrl,
        null,
        lapSoundType,
        bestLapSoundType,
        null,
        lapSoundText,
        bestLapSoundText,
        null,
        entityId,
        id);
  }

  public Driver(String name, String nickname, String entityId, String id) {
    this(
        name, nickname, null, null, null, null, null, null, null, null, null, null, null, null,
        null, entityId, id);
  }

  public Driver(String name) {
    this(
        name, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        null, null);
  }

  public Driver(String name, String nickname) {
    this(
        name, nickname, null, null, null, null, null, null, null, null, null, null, null, null,
        null, null, null);
  }

  public String getName() {
    return name;
  }

  public String getNickname() {
    return nickname;
  }

  public String getDisplayName() {
    if (nickname != null && !nickname.trim().isEmpty()) {
      return nickname;
    }
    return name;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public AudioConfig getLapAudio() {
    return lapAudio;
  }

  public AudioConfig getBestLapAudio() {
    return bestLapAudio;
  }

  public AudioConfig getPenaltyAudio() {
    return penaltyAudio;
  }

  public static boolean isEmptyId(String id) {
    return id == null || id.isEmpty() || EMPTY_DRIVER_ID.equals(id);
  }

  public static boolean isEmpty(Driver driver) {
    return driver == null || isEmptyId(driver.getEntityId());
  }

  public boolean isEmpty() {
    return isEmpty(this);
  }
}
