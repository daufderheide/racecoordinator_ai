package com.antigravity.converters;

import com.antigravity.proto.LapPinPitBehavior;
import com.antigravity.protocols.bart.BartConfig;
import java.util.ArrayList;

public class BartConfigConverter {

  public static com.antigravity.proto.BartConfig toProto( // fqn-collision
      BartConfig config) { // fqn-collision
    if (config == null) {
      return com.antigravity.proto.BartConfig.getDefaultInstance(); // fqn-collision
    }
    return com.antigravity.proto.BartConfig.newBuilder() // fqn-collision
        .setName(config.name != null ? config.name : "")
        .setDeviceName(config.deviceName != null ? config.deviceName : "")
        .setDeviceAddress(config.deviceAddress != null ? config.deviceAddress : "")
        .setNumLanes(config.numLanes)
        .setMinLapMs(config.minLapMs)
        .setLapPinPitBehaviorValue(
            config.lapPinPitBehavior != null
                ? config.lapPinPitBehavior.getValue()
                : LapPinPitBehavior.LAP_PIN_PIT_NONE_VALUE)
        .addAllLapPinBehaviors(
            config.lapPinBehaviors != null ? config.lapPinBehaviors : new ArrayList<>())
        .build();
  }

  public static BartConfig fromProto(
      com.antigravity.proto.BartConfig protoConfig) { // fqn-collision
    if (protoConfig == null) {
      return null;
    }
    BartConfig config = new BartConfig();
    config.name = protoConfig.getName();
    config.deviceName = protoConfig.getDeviceName();
    config.deviceAddress = protoConfig.getDeviceAddress();
    config.numLanes = protoConfig.getNumLanes();
    config.minLapMs = protoConfig.getMinLapMs();
    config.lapPinPitBehavior =
        com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior // fqn-collision
            .fromValue(protoConfig.getLapPinPitBehaviorValue());
    if (protoConfig.getLapPinBehaviorsList() != null) {
      config.lapPinBehaviors = new ArrayList<>(protoConfig.getLapPinBehaviorsList());
    } else {
      config.lapPinBehaviors = new ArrayList<>();
    }
    return config;
  }
}
