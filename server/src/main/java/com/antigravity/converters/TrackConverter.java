package com.antigravity.converters;

import com.antigravity.models.Track;
import com.antigravity.proto.LaneModel;
import com.antigravity.proto.Model;
import com.antigravity.proto.TrackModel;
import java.util.ArrayList;
import java.util.List;

public class TrackConverter {
    public static TrackModel toProto(Track track) {
        List<LaneModel> laneModels = new ArrayList<>();
        if (track.getLanes() != null) {
            for (com.antigravity.models.Lane lane : track.getLanes()) {
                laneModels.add(LaneConverter.toProto(lane));
            }
        }

        return TrackModel.newBuilder()
                .setName(track.getName())
                .setModel(Model.newBuilder()
                        .setEntityId(track.getEntityId() != null ? track.getEntityId() : "")
                        .build())
                .addAllLanes(laneModels)
                .build();
    }
}
