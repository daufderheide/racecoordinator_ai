package com.antigravity.converters;

import com.antigravity.protocols.ds.DsConfig;
import com.antigravity.protocols.ds.DsType;

public class DsConfigConverter {

  public static com.antigravity.proto.DsConfig toProto(DsConfig config) { // fqn-collision
    if (config == null) {
      return com.antigravity.proto.DsConfig.getDefaultInstance(); // fqn-collision
    }
    DsType type = config.getType();
    com.antigravity.proto.DsType protoType = // fqn-collision
        com.antigravity.proto.DsType.forNumber(type != null ? type.ordinal() : 3); // fqn-collision
    if (protoType == null) {
      protoType = com.antigravity.proto.DsType.DS_300; // fqn-collision
    }

    return com.antigravity.proto.DsConfig.newBuilder() // fqn-collision
        .setName(config.name != null ? config.name : "")
        .setCommPort(config.commPort != null ? config.commPort : "")
        .setType(protoType)
        .setBaudRate(config.getBaudRate())
        .build();
  }

  public static DsConfig fromProto(com.antigravity.proto.DsConfig protoConfig) { // fqn-collision
    if (protoConfig == null) {
      return null;
    }
    DsConfig config = new DsConfig();
    config.name = protoConfig.getName();
    config.commPort = protoConfig.getCommPort();
    int typeVal = protoConfig.getTypeValue();
    if (typeVal >= 0 && typeVal < DsType.values().length) {
      config.setType(DsType.values()[typeVal]);
    } else {
      config.setType(DsType.DS_300);
    }
    if (protoConfig.getBaudRate() > 0) {
      config.setBaudRate(protoConfig.getBaudRate());
    }
    return config;
  }
}
