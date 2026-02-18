package com.antigravity.converters;

import java.util.Set;
import java.util.stream.Collectors;

public class TrackConverter {
  public static com.antigravity.proto.TrackModel toProto(com.antigravity.models.Track track,
      Set<String> sentObjectIds) {
    String key = "Track_" + track.getObjectId();
    if (sentObjectIds.contains(key)) {
      return com.antigravity.proto.TrackModel.newBuilder()
          .setModel(com.antigravity.proto.Model.newBuilder().setEntityId(track.getObjectId()).build())
          .build();
    } else {
      sentObjectIds.add(key);
      return com.antigravity.proto.TrackModel.newBuilder()
          .setModel(com.antigravity.proto.Model.newBuilder().setEntityId(track.getObjectId()).build())
          .setName(track.getName())
          .addAllLanes(track.getLanes().stream()
              .map(l -> LaneConverter.toProto(l, sentObjectIds))
              .collect(Collectors.toList()))
          .build();
    }
  }
}
