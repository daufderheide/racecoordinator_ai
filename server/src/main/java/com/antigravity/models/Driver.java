package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class Driver extends Model {
  public static final String EMPTY_DRIVER_ID = "EMPTY_LANE";
  public static final Driver EMPTY_DRIVER = new Driver("Empty", "Empty", EMPTY_DRIVER_ID, null);

  private final String name;
  private final String nickname;
  private final String avatarUrl;
  private final AudioConfig lapAudio;
  private final AudioConfig bestLapAudio;
  private final AudioConfig penaltyAudio;

  @BsonCreator
  public Driver(
      @BsonProperty("name") @JsonProperty("name") String name,
      @BsonProperty("nickname") @JsonProperty("nickname") String nickname,
      @BsonProperty("avatarUrl") @JsonProperty("avatarUrl") String avatarUrl,
      @BsonProperty("lapAudio") @JsonProperty("lapAudio") AudioConfig lapAudio,
      @BsonProperty("bestLapAudio") @JsonProperty("bestLapAudio") AudioConfig bestLapAudio,
      @BsonProperty("penaltyAudio") @JsonProperty("penaltyAudio") AudioConfig penaltyAudio,
      @BsonProperty("lapSoundUrl") @JsonProperty("lapSoundUrl") String lapSoundUrl,
      @BsonProperty("bestLapSoundUrl") @JsonProperty("bestLapSoundUrl") String bestLapSoundUrl,
      @BsonProperty("penaltySoundUrl") @JsonProperty("penaltySoundUrl") String penaltySoundUrl,
      @BsonProperty("lapSoundType") @JsonProperty("lapSoundType") String lapSoundType,
      @BsonProperty("bestLapSoundType") @JsonProperty("bestLapSoundType") String bestLapSoundType,
      @BsonProperty("penaltySoundType") @JsonProperty("penaltySoundType") String penaltySoundType,
      @BsonProperty("lapSoundText") @JsonProperty("lapSoundText") String lapSoundText,
      @BsonProperty("bestLapSoundText") @JsonProperty("bestLapSoundText") String bestLapSoundText,
      @BsonProperty("penaltySoundText") @JsonProperty("penaltySoundText") String penaltySoundText,
      @BsonProperty("entity_id") @JsonProperty("entity_id") String entityId,
      @BsonId @BsonProperty("_id") @JsonProperty("_id") ObjectId id) {
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
      ObjectId id) {
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

  public Driver(String name, String nickname, String entityId, ObjectId id) {
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

  public boolean isEmpty() {
    return EMPTY_DRIVER_ID.equals(getEntityId());
  }
}
