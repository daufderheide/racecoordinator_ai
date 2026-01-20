package com.antigravity.converters;

import com.antigravity.models.Race;
import com.antigravity.proto.Model;
import com.antigravity.proto.RaceModel;
import com.antigravity.proto.TrackModel;
import java.util.Set;

public class RaceConverter {
        public static com.antigravity.proto.RaceModel toProto(com.antigravity.models.Race race,
                        com.antigravity.models.Track track,
                        Set<String> sentObjectIds) {
                String key = "Race_" + race.getObjectId();
                if (sentObjectIds.contains(key)) {
                        return com.antigravity.proto.RaceModel.newBuilder()
                                        .setModel(com.antigravity.proto.Model.newBuilder()
                                                        .setEntityId(race.getObjectId()).build())
                                        .build();
                } else {
                        sentObjectIds.add(key);
                        return com.antigravity.proto.RaceModel.newBuilder()
                                        .setModel(com.antigravity.proto.Model.newBuilder()
                                                        .setEntityId(race.getObjectId()).build())
                                        .setName(race.getName())
                                        .setTrack(TrackConverter.toProto(track, sentObjectIds))
                                        .build();
                }
        }
}
