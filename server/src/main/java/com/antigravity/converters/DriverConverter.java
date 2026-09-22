package com.antigravity.converters;

import com.antigravity.models.Driver;
import com.antigravity.proto.AudioConfig;
import com.antigravity.proto.DriverModel;
import com.antigravity.proto.Model;
import java.util.Set;

public class DriverConverter {

  public static DriverModel toProto(Driver driver, Set<String> sentObjectIds) {
    if (driver == null) {
      return null;
    }

    return DriverModel.newBuilder()
        .setName(driver.getName() != null ? driver.getName() : "")
        .setNickname(driver.getNickname() != null ? driver.getNickname() : "")
        .setAvatarUrl(driver.getAvatarUrl() != null ? driver.getAvatarUrl() : "")
        .setLapAudio(toProtoAudio(driver.getLapAudio(), "default_beep"))
        .setBestLapAudio(toProtoAudio(driver.getBestLapAudio(), "default_driveby"))
        .setPenaltyAudio(toProtoAudio(driver.getPenaltyAudio(), "default_penalty"))
        .setOverallBestLapAudio(toProtoAudio(driver.getOverallBestLapAudio(), "default_record_lap"))
        .setOverallLaneBestLapAudio(
            toProtoAudio(driver.getOverallLaneBestLapAudio(), "default_record_lane_lap"))
        .setRaceBestLapAudio(toProtoAudio(driver.getRaceBestLapAudio(), "default_best_race_lap"))
        .setRaceLaneBestLapAudio(
            toProtoAudio(driver.getRaceLaneBestLapAudio(), "default_best_race_lane_lap"))
        .setHeatBestLapAudio(toProtoAudio(driver.getHeatBestLapAudio(), "default_best_heat_lap"))
        .setNewRaceLeaderAudio(
            toProtoAudio(driver.getNewRaceLeaderAudio(), "default_new_race_leader"))
        .setNewHeatLeaderAudio(
            toProtoAudio(driver.getNewHeatLeaderAudio(), "default_new_heat_leader"))
        .setPitInAudio(toProtoAudio(driver.getPitInAudio(), "default_pit_in"))
        .setFuelAudio(toProtoAudio(driver.getFuelAudio(), "default_fuel_level", "audio_set"))
        .setModel(
            Model.newBuilder()
                .setEntityId(driver.getEntityId() != null ? driver.getEntityId() : "")
                .build())
        .build();
  }

  private static AudioConfig toProtoAudio(
      com.antigravity.models.AudioConfig config, String defaultUrl) { // fqn-collision
    return toProtoAudio(config, defaultUrl, "preset");
  }

  private static AudioConfig toProtoAudio(
      com.antigravity.models.AudioConfig config, // fqn-collision
      String defaultUrl,
      String defaultType) {
    String type = config != null && config.getType() != null ? config.getType() : defaultType;
    if ("audio_set".equals(defaultType) && "preset".equals(type)) {
      type = "audio_set";
    }
    String url = "";
    if ("none".equalsIgnoreCase(type)) {
      url = "";
    } else if (config != null && config.getUrl() != null && !config.getUrl().trim().isEmpty()) {
      url = config.getUrl().trim();
    } else if (!"tts".equalsIgnoreCase(type) && defaultUrl != null) {
      url = defaultUrl;
    }
    String text = config != null && config.getText() != null ? config.getText() : "";
    return AudioConfig.newBuilder().setType(type).setUrl(url).setText(text).build();
  }

  private static com.antigravity.models.AudioConfig fromProtoAudio( // fqn-collision
      AudioConfig proto) {
    if (proto == null) {
      return null;
    }
    return new com.antigravity.models.AudioConfig( // fqn-collision
        proto.getType(), proto.getUrl(), proto.getText());
  }

  public static Driver fromProto(DriverModel proto) {
    if (proto == null) {
      return null;
    }

    String avatarUrl = proto.getAvatarUrl();
    if (avatarUrl != null && avatarUrl.isEmpty()) {
      avatarUrl = null;
    }

    Driver.Builder builder =
        new Driver.Builder()
            .withName(proto.getName())
            .withNickname(proto.getNickname())
            .withAvatarUrl(avatarUrl)
            .withEntityId(proto.getModel() != null ? proto.getModel().getEntityId() : null);

    if (proto.hasLapAudio()) {
      builder.withLapAudio(fromProtoAudio(proto.getLapAudio()));
    }
    if (proto.hasBestLapAudio()) {
      builder.withBestLapAudio(fromProtoAudio(proto.getBestLapAudio()));
    }
    if (proto.hasPenaltyAudio()) {
      builder.withPenaltyAudio(fromProtoAudio(proto.getPenaltyAudio()));
    }
    if (proto.hasOverallBestLapAudio()) {
      builder.withOverallBestLapAudio(fromProtoAudio(proto.getOverallBestLapAudio()));
    }
    if (proto.hasOverallLaneBestLapAudio()) {
      builder.withOverallLaneBestLapAudio(fromProtoAudio(proto.getOverallLaneBestLapAudio()));
    }
    if (proto.hasRaceBestLapAudio()) {
      builder.withRaceBestLapAudio(fromProtoAudio(proto.getRaceBestLapAudio()));
    }
    if (proto.hasRaceLaneBestLapAudio()) {
      builder.withRaceLaneBestLapAudio(fromProtoAudio(proto.getRaceLaneBestLapAudio()));
    }
    if (proto.hasHeatBestLapAudio()) {
      builder.withHeatBestLapAudio(fromProtoAudio(proto.getHeatBestLapAudio()));
    }
    if (proto.hasNewRaceLeaderAudio()) {
      builder.withNewRaceLeaderAudio(fromProtoAudio(proto.getNewRaceLeaderAudio()));
    }
    if (proto.hasNewHeatLeaderAudio()) {
      builder.withNewHeatLeaderAudio(fromProtoAudio(proto.getNewHeatLeaderAudio()));
    }
    if (proto.hasPitInAudio()) {
      builder.withPitInAudio(fromProtoAudio(proto.getPitInAudio()));
    }
    if (proto.hasFuelAudio()) {
      builder.withFuelAudio(fromProtoAudio(proto.getFuelAudio()));
    }

    return builder.build();
  }
}
