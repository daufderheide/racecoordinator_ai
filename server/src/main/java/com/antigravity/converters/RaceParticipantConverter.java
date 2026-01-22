package com.antigravity.converters;

import java.util.Set;

import com.antigravity.proto.RaceParticipant;
import com.antigravity.proto.RaceParticipant.Builder;

public class RaceParticipantConverter {
  public static RaceParticipant toProto(com.antigravity.race.RaceParticipant participant, Set<String> sentObjectIds) {
    if (participant == null) {
      return null;
    }

    Builder builder = RaceParticipant.newBuilder()
        .setObjectId(participant.getObjectId())
        .setDriver(DriverConverter.toProto(participant.getDriver(), sentObjectIds))
        .setRank(participant.getRank())
        .setTotalLaps(participant.getTotalLaps())
        .setTotalTime(participant.getTotalTime())
        .setBestLapTime(participant.getBestLapTime())
        .setAverageLapTime(participant.getAverageLapTime())
        .setMedianLapTime(participant.getMedianLapTime());

    return builder.build();
  }
}
