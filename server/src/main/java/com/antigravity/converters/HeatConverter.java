package com.antigravity.converters;

import com.antigravity.proto.DriverHeatData;
import com.antigravity.proto.DriverModel;
import com.antigravity.proto.Heat;
import com.antigravity.proto.LapData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceParticipant;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

public class HeatConverter {

  public static final String PARTICIPANT_PREFIX = "Participant_";

  public static Heat toProto(
      com.antigravity.race.Heat heat, Set<String> sentObjectIds) { // fqn-collision
    Heat.Builder builder =
        Heat.newBuilder()
            .setObjectId(heat.getObjectId() != null ? heat.getObjectId() : "")
            .setHeatNumber(heat.getHeatNumber())
            .addAllStandings(
                heat.getStandings() != null ? heat.getStandings() : Collections.emptyList())
            .setStarted(heat.isStarted())
            .setGroup(heat.getGroup());

    if (heat.getDrivers() != null) {
      builder.addAllHeatDrivers(
          heat.getDrivers().stream()
              .map(d -> toProto(d, sentObjectIds))
              .collect(Collectors.toList()));
    }
    return builder.build();
  }

  public static DriverHeatData toProto(
      com.antigravity.race.DriverHeatData data, Set<String> sentObjectIds) { // fqn-collision
    DriverHeatData.Builder builder =
        DriverHeatData.newBuilder()
            .setObjectId(data.getObjectId() != null ? data.getObjectId() : "")
            .setDriverId(
                data.getActualDriver() != null && data.getActualDriver().getEntityId() != null
                    ? data.getActualDriver().getEntityId()
                    : "");

    RaceParticipant participantProto =
        RaceParticipantConverter.toProto(data.getDriver(), sentObjectIds);
    if (participantProto != null) {
      builder.setDriver(participantProto);
    }

    builder
        .setActualDriver(
            data.getActualDriver() != null
                ? DriverConverter.toProto(data.getActualDriver(), sentObjectIds)
                : DriverModel.getDefaultInstance())
        .setGapLeader(data.getGapLeader())
        .setGapPosition(data.getGapPosition());

    if (data.getSegments() != null) {
      builder.addAllSegments(data.getSegments());
    }

    if (data.getLaps() != null) {
      builder.addAllLaps(
          data.getLaps().stream()
              .map(
                  l ->
                      LapData.newBuilder()
                          .setLapTime(l.getLapTime())
                          .setDriverId(l.getDriverId() != null ? l.getDriverId() : "")
                          .setIsDrift(l.isDrift())
                          .addAllSegments(l.getSegments())
                          .build())
              .collect(Collectors.toList()));
    }

    return builder
        .setPenaltyLaps(data.getPenaltyLaps())
        .setUserLaps(data.getUserLaps())
        .setAutoCalculatedLaps(data.getAutoCalculatedLaps())
        .setAdjustedLapCount(data.getAdjustedLapCount())
        .setAverageLapTime(data.getAverageLapTime())
        .setMedianLapTime(data.getMedianLapTime())
        .setBestLapTime(data.getBestLapTime())
        .setReactionTime(data.getReactionTime())
        .setGapLeader(data.getGapLeader())
        .setGapPosition(data.getGapPosition())
        .setGapLeaderF1(data.getGapLeaderF1())
        .setGapPositionF1(data.getGapPositionF1())
        .setLapsDownLeader(data.getLapsDownLeader())
        .setLapsDownPosition(data.getLapsDownPosition())
        .setIsRefueling(data.isRefueling())
        .setCurrentLocation(
            data.getCurrentLocation() != null ? data.getCurrentLocation().getValue() : -1)
        .setInitialFuelLevel(data.getInitialFuelLevel())
        .setFalseStarts(data.getFalseStarts())
        .setFlag(data.getFlag() != null ? data.getFlag() : RaceFlag.UNKNOWN_FLAG)
        .build();
  }
}
