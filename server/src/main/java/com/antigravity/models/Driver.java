package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
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
  private final AudioConfig overallBestLapAudio;
  private final AudioConfig overallLaneBestLapAudio;
  private final AudioConfig raceBestLapAudio;
  private final AudioConfig raceLaneBestLapAudio;
  private final AudioConfig heatBestLapAudio;
  private final AudioConfig newRaceLeaderAudio;
  private final AudioConfig newHeatLeaderAudio;
  private final AudioConfig pitInAudio;
  private final AudioConfig fuelAudio;

  public Driver(
      @JsonProperty("name") String name,
      @JsonProperty("nickname") String nickname,
      @JsonProperty("avatarUrl") String avatarUrl,
      @JsonProperty("lapAudio") AudioConfig lapAudio,
      @JsonProperty("bestLapAudio") AudioConfig bestLapAudio,
      @JsonProperty("penaltyAudio") AudioConfig penaltyAudio,
      @JsonProperty("overallBestLapAudio") @JsonAlias("overall_best_lap_audio")
          AudioConfig overallBestLapAudio,
      @JsonProperty("overallLaneBestLapAudio") @JsonAlias("overall_lane_best_lap_audio")
          AudioConfig overallLaneBestLapAudio,
      @JsonProperty("raceBestLapAudio") @JsonAlias("race_best_lap_audio")
          AudioConfig raceBestLapAudio,
      @JsonProperty("raceLaneBestLapAudio") @JsonAlias("race_lane_best_lap_audio")
          AudioConfig raceLaneBestLapAudio,
      @JsonProperty("heatBestLapAudio") @JsonAlias("heat_best_lap_audio")
          AudioConfig heatBestLapAudio,
      @JsonProperty("newRaceLeaderAudio") @JsonAlias("new_race_leader_audio")
          AudioConfig newRaceLeaderAudio,
      @JsonProperty("newHeatLeaderAudio") @JsonAlias("new_heat_leader_audio")
          AudioConfig newHeatLeaderAudio,
      @JsonProperty("pitInAudio") @JsonAlias("pit_in_audio") AudioConfig pitInAudio,
      @JsonProperty("fuelAudio") @JsonAlias("fuel_audio") AudioConfig fuelAudio,
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
    this.lapAudio = resolveAudio(lapAudio, lapSoundUrl, lapSoundType, lapSoundText, "default_beep");
    this.bestLapAudio =
        resolveAudio(
            bestLapAudio, bestLapSoundUrl, bestLapSoundType, bestLapSoundText, "default_driveby");
    this.penaltyAudio =
        resolvePenaltyAudio(penaltyAudio, penaltySoundUrl, penaltySoundType, penaltySoundText);
    this.overallBestLapAudio = defaultPresetAudio(overallBestLapAudio, "default_record_lap");
    this.overallLaneBestLapAudio =
        defaultPresetAudio(overallLaneBestLapAudio, "default_record_lane_lap");
    this.raceBestLapAudio = defaultPresetAudio(raceBestLapAudio, "default_best_race_lap");
    this.raceLaneBestLapAudio =
        defaultPresetAudio(raceLaneBestLapAudio, "default_best_race_lane_lap");
    this.heatBestLapAudio = defaultPresetAudio(heatBestLapAudio, "default_best_heat_lap");
    this.newRaceLeaderAudio = defaultPresetAudio(newRaceLeaderAudio, "default_new_race_leader");
    this.newHeatLeaderAudio = defaultPresetAudio(newHeatLeaderAudio, "default_new_heat_leader");
    this.pitInAudio = defaultPresetAudio(pitInAudio, "default_pit_in");
    this.fuelAudio = defaultSetAudio(fuelAudio, "default_fuel_level");
  }

  private static AudioConfig defaultPresetAudio(AudioConfig config, String defaultPreset) {
    return config != null ? config : new AudioConfig("preset", defaultPreset, "");
  }

  private static AudioConfig defaultSetAudio(AudioConfig config, String defaultSet) {
    if (config != null) {
      if ("preset".equalsIgnoreCase(config.getType())
          || config.getType() == null
          || config.getType().trim().isEmpty()) {
        return new AudioConfig(
            "audio_set",
            config.getUrl() != null && !config.getUrl().trim().isEmpty()
                ? config.getUrl()
                : defaultSet,
            config.getText());
      }
      return config;
    }
    return new AudioConfig("audio_set", defaultSet, "");
  }

  private static AudioConfig resolveAudio(
      AudioConfig config, String url, String type, String text, String defaultPreset) {
    if (config != null) {
      return config;
    }
    if (url != null || type != null || text != null) {
      return new AudioConfig(type, url, text);
    }
    return new AudioConfig("preset", defaultPreset, "");
  }

  private static AudioConfig resolvePenaltyAudio(
      AudioConfig config, String url, String type, String text) {
    if (config != null) {
      return config;
    }
    if (url != null || type != null || text != null) {
      String actualUrl =
          "default_penalty".equals(url) || "/assets/default_penalty_penalty.wav".equals(url)
              ? "default_penalty"
              : url;
      return new AudioConfig(type, actualUrl, text);
    }
    return new AudioConfig("preset", "default_penalty", "");
  }

  public Driver(
      String name,
      String nickname,
      String avatarUrl,
      AudioConfig lapAudio,
      AudioConfig bestLapAudio,
      AudioConfig penaltyAudio,
      String lapSoundUrl,
      String bestLapSoundUrl,
      String penaltySoundUrl,
      String lapSoundType,
      String bestLapSoundType,
      String penaltySoundType,
      String lapSoundText,
      String bestLapSoundText,
      String penaltySoundText,
      String entityId,
      String id) {
    this(
        name,
        nickname,
        avatarUrl,
        lapAudio,
        bestLapAudio,
        penaltyAudio,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        lapSoundUrl,
        bestLapSoundUrl,
        penaltySoundUrl,
        lapSoundType,
        bestLapSoundType,
        penaltySoundType,
        lapSoundText,
        bestLapSoundText,
        penaltySoundText,
        entityId,
        id);
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
        null, null, null, null, null, null, null, null, null, null, entityId, id);
  }

  public Driver(String name) {
    this(name, null, null, null);
  }

  public Driver(String name, String nickname) {
    this(name, nickname, null, null);
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

  public AudioConfig getOverallBestLapAudio() {
    return overallBestLapAudio;
  }

  public AudioConfig getOverallLaneBestLapAudio() {
    return overallLaneBestLapAudio;
  }

  public AudioConfig getRaceBestLapAudio() {
    return raceBestLapAudio;
  }

  public AudioConfig getRaceLaneBestLapAudio() {
    return raceLaneBestLapAudio;
  }

  public AudioConfig getHeatBestLapAudio() {
    return heatBestLapAudio;
  }

  public AudioConfig getNewRaceLeaderAudio() {
    return newRaceLeaderAudio;
  }

  public AudioConfig getNewHeatLeaderAudio() {
    return newHeatLeaderAudio;
  }

  public AudioConfig getPitInAudio() {
    return pitInAudio;
  }

  public AudioConfig getFuelAudio() {
    return fuelAudio;
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

  public static class Builder {
    private String id;
    private String entityId;
    private String name;
    private String nickname;
    private String avatarUrl;
    private AudioConfig lapAudio = new AudioConfig("preset", "default_beep", "");
    private AudioConfig bestLapAudio = new AudioConfig("preset", "default_driveby", "");
    private AudioConfig penaltyAudio = new AudioConfig("preset", "default_penalty", "");
    private AudioConfig overallBestLapAudio = new AudioConfig("preset", "default_record_lap", "");
    private AudioConfig overallLaneBestLapAudio =
        new AudioConfig("preset", "default_record_lane_lap", "");
    private AudioConfig raceBestLapAudio = new AudioConfig("preset", "default_best_race_lap", "");
    private AudioConfig raceLaneBestLapAudio =
        new AudioConfig("preset", "default_best_race_lane_lap", "");
    private AudioConfig heatBestLapAudio = new AudioConfig("preset", "default_best_heat_lap", "");
    private AudioConfig newRaceLeaderAudio =
        new AudioConfig("preset", "default_new_race_leader", "");
    private AudioConfig newHeatLeaderAudio =
        new AudioConfig("preset", "default_new_heat_leader", "");
    private AudioConfig pitInAudio = new AudioConfig("preset", "default_pit_in", "");
    private AudioConfig fuelAudio = new AudioConfig("audio_set", "default_fuel_level", "");

    public Builder() {}

    public static Builder from(Driver other) {
      Builder b = new Builder();
      if (other != null) {
        b.id = other.getId();
        b.entityId = other.getEntityId();
        b.name = other.getName();
        b.nickname = other.getNickname();
        b.avatarUrl = other.getAvatarUrl();
        b.lapAudio = other.getLapAudio();
        b.bestLapAudio = other.getBestLapAudio();
        b.penaltyAudio = other.getPenaltyAudio();
        b.overallBestLapAudio = other.getOverallBestLapAudio();
        b.overallLaneBestLapAudio = other.getOverallLaneBestLapAudio();
        b.raceBestLapAudio = other.getRaceBestLapAudio();
        b.raceLaneBestLapAudio = other.getRaceLaneBestLapAudio();
        b.heatBestLapAudio = other.getHeatBestLapAudio();
        b.newRaceLeaderAudio = other.getNewRaceLeaderAudio();
        b.newHeatLeaderAudio = other.getNewHeatLeaderAudio();
        b.pitInAudio = other.getPitInAudio();
        b.fuelAudio = other.getFuelAudio();
      }
      return b;
    }

    public Builder withId(String id) {
      this.id = id;
      return this;
    }

    public Builder withEntityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public Builder withName(String name) {
      this.name = name;
      return this;
    }

    public Builder withNickname(String nickname) {
      this.nickname = nickname;
      return this;
    }

    public Builder withAvatarUrl(String avatarUrl) {
      this.avatarUrl = avatarUrl;
      return this;
    }

    public Builder withLapAudio(AudioConfig lapAudio) {
      this.lapAudio = lapAudio;
      return this;
    }

    public Builder withBestLapAudio(AudioConfig bestLapAudio) {
      this.bestLapAudio = bestLapAudio;
      return this;
    }

    public Builder withPenaltyAudio(AudioConfig penaltyAudio) {
      this.penaltyAudio = penaltyAudio;
      return this;
    }

    public Builder withOverallBestLapAudio(AudioConfig overallBestLapAudio) {
      this.overallBestLapAudio = overallBestLapAudio;
      return this;
    }

    public Builder withOverallLaneBestLapAudio(AudioConfig overallLaneBestLapAudio) {
      this.overallLaneBestLapAudio = overallLaneBestLapAudio;
      return this;
    }

    public Builder withRaceBestLapAudio(AudioConfig raceBestLapAudio) {
      this.raceBestLapAudio = raceBestLapAudio;
      return this;
    }

    public Builder withRaceLaneBestLapAudio(AudioConfig raceLaneBestLapAudio) {
      this.raceLaneBestLapAudio = raceLaneBestLapAudio;
      return this;
    }

    public Builder withHeatBestLapAudio(AudioConfig heatBestLapAudio) {
      this.heatBestLapAudio = heatBestLapAudio;
      return this;
    }

    public Builder withNewRaceLeaderAudio(AudioConfig newRaceLeaderAudio) {
      this.newRaceLeaderAudio = newRaceLeaderAudio;
      return this;
    }

    public Builder withNewHeatLeaderAudio(AudioConfig newHeatLeaderAudio) {
      this.newHeatLeaderAudio = newHeatLeaderAudio;
      return this;
    }

    public Builder withPitInAudio(AudioConfig pitInAudio) {
      this.pitInAudio = pitInAudio;
      return this;
    }

    public Builder withFuelAudio(AudioConfig fuelAudio) {
      this.fuelAudio = fuelAudio;
      return this;
    }

    public Driver build() {
      return new Driver(
          name,
          nickname,
          avatarUrl,
          lapAudio,
          bestLapAudio,
          penaltyAudio,
          overallBestLapAudio,
          overallLaneBestLapAudio,
          raceBestLapAudio,
          raceLaneBestLapAudio,
          heatBestLapAudio,
          newRaceLeaderAudio,
          newHeatLeaderAudio,
          pitInAudio,
          fuelAudio,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          entityId,
          id);
    }
  }
}
