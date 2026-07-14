package com.antigravity.converters;

import com.antigravity.proto.DriverModel;
import com.antigravity.proto.RaceParticipant;
import com.antigravity.proto.TeamModel;
import java.util.Set;

public class RaceParticipantConverter {

  public static RaceParticipant toProto(
      com.antigravity.race.RaceParticipant participant, // fqn-collision
      Set<String> sentObjectIds) {
    if (participant == null) {
      return null;
    }

    RaceParticipant.Builder builder =
        RaceParticipant.newBuilder()
            .setObjectId(participant.getObjectId() != null ? participant.getObjectId() : "");

    DriverModel driverProto = DriverConverter.toProto(participant.getDriver(), sentObjectIds);
    if (driverProto != null) {
      builder.setDriver(driverProto);
    }

    TeamModel teamProto = TeamConverter.toProto(participant.getTeam(), sentObjectIds);
    if (teamProto != null) {
      builder.setTeam(teamProto);
    }

    return builder
        .setRank(participant.getRank())
        .setTotalLaps(participant.getTotalLaps())
        .setTotalTime(participant.getTotalTime())
        .setBestLapTime(participant.getBestLapTime())
        .setAverageLapTime(participant.getAverageLapTime())
        .setMedianLapTime(participant.getMedianLapTime())
        .setRankValue(participant.getRankValue())
        .setSeed(participant.getSeed())
        .setFuelLevel(participant.getFuelLevel())
        .setGapLeader(participant.getGapLeader())
        .setGapPosition(participant.getGapPosition())
        .setGapLeaderF1(participant.getGapLeaderF1())
        .setGapPositionF1(participant.getGapPositionF1())
        .setLapsDownLeader(participant.getLapsDownLeader())
        .setLapsDownPosition(participant.getLapsDownPosition())
        .build();
  }
}
