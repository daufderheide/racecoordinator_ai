package com.antigravity.converters;

import com.antigravity.models.DriverLabel;
import com.antigravity.proto.DriverLabelModel;
import com.antigravity.proto.Model;

public class DriverLabelConverter {

  public static DriverLabelModel toProto(DriverLabel label) {
    if (label == null) {
      return null;
    }

    return DriverLabelModel.newBuilder()
        .setName(label.getName() != null ? label.getName() : "")
        .setColor(label.getColor() != null ? label.getColor() : "#3b82f6")
        .setModel(
            Model.newBuilder()
                .setEntityId(label.getEntityId() != null ? label.getEntityId() : "")
                .build())
        .build();
  }

  public static DriverLabel fromProto(DriverLabelModel proto) {
    if (proto == null) {
      return null;
    }

    String entityId = proto.getModel() != null ? proto.getModel().getEntityId() : null;
    return new DriverLabel(proto.getName(), proto.getColor(), entityId);
  }
}
