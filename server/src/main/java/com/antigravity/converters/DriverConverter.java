package com.antigravity.converters;

import com.antigravity.models.Driver;
import com.antigravity.proto.DriverModel;
import com.antigravity.proto.Model;

public class DriverConverter {
    public static DriverModel toProto(Driver driver, java.util.Set<String> sentObjectIds) {
        if (driver == null) {
            return DriverModel.newBuilder().build();
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
            return DriverModel.newBuilder()
                    .setName(driver.getName())
                    .setNickname(driver.getNickname() != null ? driver.getNickname() : "")
                    .setModel(Model.newBuilder()
                            .setEntityId(driver.getEntityId() != null ? driver.getEntityId() : "")
                            .build())
                    .build();
        }
    }
}
