package com.antigravity.converters;

import java.util.Set;

public class LaneConverter {
  public static com.antigravity.proto.LaneModel toProto(com.antigravity.models.Lane lane, Set<String> sentObjectIds) {
    String key = "Lane_" + lane.getObjectId();
    if (sentObjectIds.contains(key)) {
      return com.antigravity.proto.LaneModel.newBuilder()
          .setObjectId(lane.getObjectId())
          .build();
    } else {
      sentObjectIds.add(key);
      return com.antigravity.proto.LaneModel.newBuilder()
          .setObjectId(lane.getObjectId())
          .setForegroundColor(lane.getForeground_color())
          .setBackgroundColor(lane.getBackground_color())
          .setLength(lane.getLength())
          .build();
    }
  }
}
