package com.antigravity.converters;

import com.antigravity.proto.Heat;
import com.antigravity.proto.DriverHeatData;
import com.antigravity.proto.RaceParticipant;

import java.util.stream.Collectors;

public class HeatConverter {

    public static Heat toProto(com.antigravity.race.Heat heat) {
        return Heat.newBuilder()
                .addAllHeatDrivers(heat.getDrivers().stream()
                        .map(HeatConverter::toProto)
                        .collect(Collectors.toList()))
                .build();
    }

    public static DriverHeatData toProto(com.antigravity.race.DriverHeatData data) {
        return DriverHeatData.newBuilder()
                .setDriver(toProto(data.getDriver()))
                .build();
    }

    public static RaceParticipant toProto(com.antigravity.race.RaceParticipant participant) {
        return RaceParticipant.newBuilder()
                .setDriver(DriverConverter.toProto(participant.getDriver()))
                .build();
    }
}
