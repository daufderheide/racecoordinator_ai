package com.antigravity.converters;

import com.antigravity.models.Lane;
import com.antigravity.proto.LaneModel;

public class LaneConverter {
    public static LaneModel toProto(Lane lane) {
        return LaneModel.newBuilder()
                .setBackgroundColor(lane.getBackground_color())
                .setForegroundColor(lane.getForeground_color())
                .setLength(lane.getLength())
                .build();
    }
}
