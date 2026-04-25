package com.antigravity.converters;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.DigitalFuelOptions;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Track;
import com.antigravity.proto.FuelUsageType;
import com.antigravity.proto.Model;
import com.antigravity.proto.RaceModel;
import java.util.Set;
import java.util.stream.Collectors;

public class RaceConverter {

  public static RaceModel toProto(Race race, Track track, Set<String> sentObjectIds) {
    String key = "Race_" + race.getObjectId();
    if (sentObjectIds.contains(key)) {
      return RaceModel.newBuilder()
          .setModel(Model.newBuilder().setEntityId(race.getObjectId()).build())
          .build();
    } else {
      sentObjectIds.add(key);
      RaceModel.Builder builder =
          RaceModel.newBuilder()
              .setModel(Model.newBuilder().setEntityId(race.getObjectId()).build())
              .setName(race.getName())
              .setTrack(TrackConverter.toProto(track, sentObjectIds));

      if (race.getHeatScoring() != null) {
        HeatScoring scoring = race.getHeatScoring();
        builder.setHeatScoring(
            com.antigravity.proto.HeatScoring.newBuilder()
                .setFinishMethod(
                    com.antigravity.proto.HeatScoring.FinishMethod.valueOf(
                        scoring.getFinishMethod().name()))
                .setFinishValue(scoring.getFinishValue())
                .setHeatRanking(
                    com.antigravity.proto.HeatScoring.HeatRanking.valueOf(
                        "HR_" + scoring.getHeatRanking().name()))
                .setHeatRankingTiebreaker(
                    com.antigravity.proto.HeatScoring.HeatRankingTiebreaker.valueOf(
                        "HRT_" + scoring.getHeatRankingTiebreaker().name()))
                .setAllowFinish(
                    com.antigravity.proto.HeatScoring.AllowFinish.valueOf(
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
            com.antigravity.proto.OverallScoring.newBuilder()
                .setDroppedHeats(scoring.getDroppedHeats())
                .setRankingMethod(
                    com.antigravity.proto.OverallScoring.OverallRanking.valueOf(
                        "OR_" + scoring.getRankingMethod().name()))
                .setTiebreaker(
                    com.antigravity.proto.OverallScoring.OverallRankingTiebreaker.valueOf(
                        "ORT_" + scoring.getTiebreaker().name()))
                .build());
      }

      builder.setMinLapTime(race.getMinLapTime());

      if (race.getFuelOptions() != null) {
        AnalogFuelOptions fuel = race.getFuelOptions();
        builder.setFuelOptions(
            com.antigravity.proto.AnalogFuelOptions.newBuilder()
                .setEnabled(fuel.isEnabled())
                .setResetFuelAtHeatStart(fuel.isResetFuelAtHeatStart())
                .setEndHeatOnOutOfFuel(fuel.isEndHeatOnOutOfFuel())
                .setCapacity(fuel.getCapacity())
                .setUsageType(FuelUsageType.valueOf(fuel.getUsageType().name()))
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
            com.antigravity.proto.DigitalFuelOptions.newBuilder()
                .setEnabled(fuel.isEnabled())
                .setResetFuelAtHeatStart(fuel.isResetFuelAtHeatStart())
                .setEndHeatOnOutOfFuel(fuel.isEndHeatOnOutOfFuel())
                .setCapacity(fuel.getCapacity())
                .setUsageType(FuelUsageType.valueOf(fuel.getUsageType().name()))
                .setUsageRate(fuel.getUsageRate())
                .setStartLevel(fuel.getStartLevel())
                .setRefuelRate(fuel.getRefuelRate())
                .setPitStopDelay(fuel.getPitStopDelay())
                .build());
      }
      if (race.getTeamOptions() != null) {
        TeamOptions options = race.getTeamOptions();
        builder.setTeamOptions(
            com.antigravity.proto.TeamOptions.newBuilder()
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
        builder.setHeatRotationType(com.antigravity.proto.HeatRotationType.valueOf(rotationName));
      }
      builder.setSoloLaneIndex(race.getSoloLaneIndex());
      return builder.build();
    }
  }

  public static com.antigravity.proto.Race toProto(
      com.antigravity.race.Race race, Set<String> sentObjectIds) {
    return com.antigravity.proto.Race.newBuilder()
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
