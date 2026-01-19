package com.antigravity.converters;

import com.antigravity.models.Race;
import com.antigravity.proto.Model;
import com.antigravity.proto.RaceModel;
import com.antigravity.proto.TrackModel;

public class RaceConverter {
    public static RaceModel toProto(Race race, TrackModel trackProto) {
        return RaceModel.newBuilder()
                .setName(race.getName())
                .setModel(Model.newBuilder()
                        .setEntityId(race.getEntityId() != null ? race.getEntityId() : "")
                        .build())
                .setTrack(trackProto)
                .build();
    }
}
