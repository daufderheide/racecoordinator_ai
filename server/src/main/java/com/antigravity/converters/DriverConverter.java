package com.antigravity.converters;

import com.antigravity.models.Driver;
import com.antigravity.proto.DriverModel;
import com.antigravity.proto.Model;

public class DriverConverter {
    public static DriverModel toProto(Driver driver) {
        return DriverModel.newBuilder()
                .setName(driver.getName())
                .setNickname(driver.getNickname() != null ? driver.getNickname() : "")
                .setModel(Model.newBuilder()
                        .setEntityId(driver.getEntityId() != null ? driver.getEntityId() : "")
                        .build())
                .build();
    }
}
