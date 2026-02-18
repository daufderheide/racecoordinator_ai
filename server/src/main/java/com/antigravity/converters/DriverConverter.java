package com.antigravity.converters;

import com.antigravity.models.Driver;
import com.antigravity.proto.DriverModel;
import com.antigravity.proto.Model;

public class DriverConverter {
  public static DriverModel toProto(Driver driver, java.util.Set<String> sentObjectIds) {
    if (driver == null) {
      return null;
    }
    String key = "Driver_" + driver.getObjectId();
    if (sentObjectIds != null && sentObjectIds.contains(key)) {
      return DriverModel.newBuilder()
          .setModel(Model.newBuilder()
              .setEntityId(driver.getEntityId() != null ? driver.getEntityId() : "")
              .build())
          .build();
    } else {
      if (sentObjectIds != null) {
        sentObjectIds.add(key);
      }
      com.antigravity.proto.AudioConfig lapAudio = com.antigravity.proto.AudioConfig.newBuilder()
          .setType(driver.getLapAudio().getType())
          .setUrl(driver.getLapAudio().getUrl() != null ? driver.getLapAudio().getUrl() : "")
          .setText(driver.getLapAudio().getText() != null ? driver.getLapAudio().getText() : "")
          .build();

      com.antigravity.proto.AudioConfig bestLapAudio = com.antigravity.proto.AudioConfig.newBuilder()
          .setType(driver.getBestLapAudio().getType())
          .setUrl(driver.getBestLapAudio().getUrl() != null ? driver.getBestLapAudio().getUrl() : "")
          .setText(driver.getBestLapAudio().getText() != null ? driver.getBestLapAudio().getText() : "")
          .build();

      return DriverModel.newBuilder()
          .setName(driver.getName())
          .setNickname(driver.getNickname() != null ? driver.getNickname() : "")
          .setAvatarUrl(driver.getAvatarUrl() != null ? driver.getAvatarUrl() : "")
          .setLapAudio(lapAudio)
          .setBestLapAudio(bestLapAudio)
          .setModel(Model.newBuilder()
              .setEntityId(driver.getEntityId() != null ? driver.getEntityId() : "")
              .build())
          .build();
    }
  }
}
