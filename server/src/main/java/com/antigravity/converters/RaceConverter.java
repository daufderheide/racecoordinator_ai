package com.antigravity.converters;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.DigitalFuelOptions;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Track;
import java.util.Set;
import java.util.stream.Collectors;

public class RaceConverter {

  @SuppressWarnings("checkstyle:MethodLength")
  public static com.antigravity.proto.RaceModel toProto( // fqn-collision
      Race race, Track track, Set<String> sentObjectIds) { // fqn-collision
    String key = "Race_" + race.getObjectId();
    if (sentObjectIds.contains(key)) {
      return com.antigravity.proto.RaceModel.newBuilder() // fqn-collision
          .setModel(
              (com.antigravity.proto.Model) // fqn-collision
                  com.antigravity.proto.Model.newBuilder() // fqn-collision
                      .setEntityId(race.getObjectId())
                      .build()) // fqn-collision
          .build();
    } else {
      sentObjectIds.add(key);
      com.antigravity.proto.RaceModel.Builder builder = // fqn-collision
          com.antigravity.proto.RaceModel.newBuilder() // fqn-collision
              .setModel(
                  (com.antigravity.proto.Model) // fqn-collision
                      com.antigravity.proto.Model.newBuilder() // fqn-collision
                          .setEntityId(race.getObjectId())
                          .build()) // fqn-collision
              .setName(race.getName())
              .setTrack(TrackConverter.toProto(track, sentObjectIds));

      if (race.getHeatScoring() != null) {
        HeatScoring scoring = race.getHeatScoring();
        builder.setHeatScoring(
            com.antigravity.proto.HeatScoring.newBuilder() // fqn-collision
                .setFinishMethod(
                    com.antigravity.proto.HeatScoring.FinishMethod // fqn-collision
                        .valueOf(scoring.getFinishMethod().name()))
                .setFinishValue(scoring.getFinishValue())
                .setHeatRanking(
                    com.antigravity.proto.HeatScoring.HeatRanking // fqn-collision
                        .valueOf("HR_" + scoring.getHeatRanking().name()))
                .setHeatRankingTiebreaker(
                    com.antigravity.proto.HeatScoring.HeatRankingTiebreaker // fqn-collision
                        .valueOf("HRT_" + scoring.getHeatRankingTiebreaker().name()))
                .setAllowFinish(
                    com.antigravity.proto.HeatScoring.AllowFinish // fqn-collision
                        .valueOf(
                        "AF_"
                            + (scoring.getAllowFinish() != null
                                ? scoring
                                    .getAllowFinish()
                                    .name()
                                    .replaceAll("([a-z])([A-Z])", "$1_$2")
                                    .toUpperCase()
                                : "NONE")))
                .build());
      }

      if (race.getOverallScoring() != null) {
        OverallScoring scoring = race.getOverallScoring();
        builder.setOverallScoring(
            com.antigravity.proto.OverallScoring.newBuilder() // fqn-collision
                .setDroppedHeats(scoring.getDroppedHeats())
                .setRankingMethod(
                    com.antigravity.proto.OverallScoring.OverallRanking // fqn-collision
                        .valueOf("OR_" + scoring.getRankingMethod().name()))
                .setTiebreaker(
                    com.antigravity.proto.OverallScoring.OverallRankingTiebreaker // fqn-collision
                        .valueOf("ORT_" + scoring.getTiebreaker().name()))
                .build());
      }

      builder.setMinLapTime(race.getMinLapTime());

      if (race.getFuelOptions() != null) {
        AnalogFuelOptions fuel = race.getFuelOptions();
        builder.setFuelOptions(
            com.antigravity.proto.AnalogFuelOptions.newBuilder() // fqn-collision
                .setEnabled(fuel.isEnabled())
                .setResetFuelAtHeatStart(fuel.isResetFuelAtHeatStart())
                .setEndHeatOnOutOfFuel(fuel.isEndHeatOnOutOfFuel())
                .setCapacity(fuel.getCapacity())
                .setUsageType(
                    com.antigravity.proto.FuelUsageType.valueOf( // fqn-collision
                        fuel.getUsageType().name())) // fqn-collision
                .setUsageRate(fuel.getUsageRate())
                .setStartLevel(fuel.getStartLevel())
                .setRefuelRate(fuel.getRefuelRate())
                .setPitStopDelay(fuel.getPitStopDelay())
                .setReferenceTime(fuel.getReferenceTime())
                .build());
      }

      if (race.getDigitalFuelOptions() != null) {
        DigitalFuelOptions fuel = race.getDigitalFuelOptions();
        builder.setDigitalFuelOptions(
            com.antigravity.proto.DigitalFuelOptions.newBuilder() // fqn-collision
                .setEnabled(fuel.isEnabled())
                .setResetFuelAtHeatStart(fuel.isResetFuelAtHeatStart())
                .setEndHeatOnOutOfFuel(fuel.isEndHeatOnOutOfFuel())
                .setCapacity(fuel.getCapacity())
                .setUsageType(
                    com.antigravity.proto.FuelUsageType.valueOf( // fqn-collision
                        fuel.getUsageType().name())) // fqn-collision
                .setUsageRate(fuel.getUsageRate())
                .setStartLevel(fuel.getStartLevel())
                .setRefuelRate(fuel.getRefuelRate())
                .setPitStopDelay(fuel.getPitStopDelay())
                .build());
      }
      if (race.getTeamOptions() != null) {
        TeamOptions options = race.getTeamOptions();
        builder.setTeamOptions(
            com.antigravity.proto.TeamOptions.newBuilder() // fqn-collision
                .setHeatLapLimit(options.getHeatLapLimit())
                .setHeatTimeLimit(options.getHeatTimeLimit())
                .setOverallLapLimit(options.getOverallLapLimit())
                .setOverallTimeLimit(options.getOverallTimeLimit())
                .setRequirePitStopChangeDriver(options.isRequirePitStopChangeDriver())
                .build());
      }
      builder.setAutoAdvanceTime(race.getAutoAdvanceTime());
      builder.setAutoStartTime(race.getAutoStartTime());
      builder.setAutoAdvanceWarmupTime(race.getAutoAdvanceWarmupTime());
      builder.setAutoStartWarmupTime(race.getAutoStartWarmupTime());
      builder.setDriftTime(race.getDriftTime());
      builder.setStartTime(race.getStartTime());
      builder.setRestartTime(race.getRestartTime());
      builder.setStartDelay(race.getStartDelay());
      builder.setRestartDelay(race.getRestartDelay());
      if (race.getHeatRotationType() != null) {
        String rotationName =
            race.getHeatRotationType().name().replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase();
        builder.setHeatRotationType(
            com.antigravity.proto.HeatRotationType.valueOf(rotationName)); // fqn-collision
      }
      builder.setSoloLaneIndex(race.getSoloLaneIndex());
      if (race.getCustomRotationSequence() != null) {
        builder.addAllCustomRotationSequence(race.getCustomRotationSequence());
      }
      if (race.getCustomRotationAssetId() != null) {
        builder.setCustomRotationAssetId(race.getCustomRotationAssetId());
      }
      builder.setHeatTimesThrough(race.getHeatTimesThrough());
      builder.setReverseHeats(race.isReverseHeats());
      return builder.build();
    }
  }

  public static com.antigravity.proto.Race toProto( // fqn-collision
      com.antigravity.race.Race race, Set<String> sentObjectIds) { // fqn-collision
    return com.antigravity.proto.Race.newBuilder() // fqn-collision
        .setRace(toProto(race.getRaceModel(), race.getTrack(), sentObjectIds))
        .addAllDrivers(
            race.getDrivers().stream()
                .map(p -> RaceParticipantConverter.toProto(p, sentObjectIds))
                .collect(Collectors.toList()))
        .addAllHeats(
            race.getHeats().stream()
                .map(h -> HeatConverter.toProto(h, sentObjectIds))
                .collect(Collectors.toList()))
        .setCurrentHeat(HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
        .setRecordData(race.getRecordData())
        .build();
  }
}
