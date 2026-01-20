package com.antigravity.converters;

import com.antigravity.proto.Heat;
import com.antigravity.proto.DriverHeatData;
import com.antigravity.proto.RaceParticipant;

import java.util.stream.Collectors;

public class HeatConverter {

    public static Heat toProto(com.antigravity.race.Heat heat, java.util.Set<String> sentObjectIds) {
        String key = "Heat_" + heat.getObjectId();
        if (sentObjectIds.contains(key)) {
            return Heat.newBuilder()
                    .setObjectId(heat.getObjectId())
                    .build();
        } else {
            sentObjectIds.add(key);
            return Heat.newBuilder()
                    .setObjectId(heat.getObjectId())
                    .addAllHeatDrivers(heat.getDrivers().stream()
                            .map(d -> toProto(d, sentObjectIds))
                            .collect(Collectors.toList()))
                    .setHeatNumber(heat.getHeatNumber())
                    .build();
        }
    }

    public static DriverHeatData toProto(com.antigravity.race.DriverHeatData data,
            java.util.Set<String> sentObjectIds) {
        String key = "HeatData_" + data.getObjectId();
        if (sentObjectIds.contains(key)) {
            return DriverHeatData.newBuilder()
                    .setObjectId(data.getObjectId())
                    .build();
        } else {
            sentObjectIds.add(key);
            return DriverHeatData.newBuilder()
                    .setObjectId(data.getObjectId())
                    .setDriver(toProto(data.getDriver(), sentObjectIds))
                    .build();
        }
    }

    public static RaceParticipant toProto(com.antigravity.race.RaceParticipant participant,
            java.util.Set<String> sentObjectIds) {
        String key = "Participant_" + participant.getObjectId();
        if (sentObjectIds.contains(key)) {
            return RaceParticipant.newBuilder()
                    .setObjectId(participant.getObjectId())
                    .build();
        } else {
            sentObjectIds.add(key);
            return RaceParticipant.newBuilder()
                    .setObjectId(participant.getObjectId())
                    .setDriver(DriverConverter.toProto(participant.getDriver(), sentObjectIds))
                    .build();
        }
    }
}
