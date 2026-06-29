package com.antigravity.converters;

import com.antigravity.proto.LapPinPitBehavior;
import com.antigravity.protocols.trackmate.TrackmateConfig;
import java.util.ArrayList;

public class TrackmateConfigConverter {

  public static com.antigravity.proto.TrackmateConfig toProto( // fqn-collision
      TrackmateConfig config) { // fqn-collision
    if (config == null) {
      return com.antigravity.proto.TrackmateConfig.getDefaultInstance(); // fqn-collision
    }
    return com.antigravity.proto.TrackmateConfig.newBuilder() // fqn-collision
        .setName(config.name != null ? config.name : "")
        .setCommPort(config.commPort != null ? config.commPort : "")
        .setNormallyClosedRelays(config.normallyClosedRelays)
        .setNormallyClosedLaneSensors(config.normallyClosedLaneSensors)
        .setHasPerLaneRelays(config.hasPerLaneRelays)
        .setUseIr(config.useIR)
        .setDebounce(config.debounce)
        .setNumLanes(config.numLanes)
        .setLapPinPitBehaviorValue(
            config.lapPinPitBehavior != null
                ? config.lapPinPitBehavior.getValue()
                : LapPinPitBehavior.LAP_PIN_PIT_IN_OUT_VALUE)
        .addAllLapPinBehaviors(
            config.lapPinBehaviors != null ? config.lapPinBehaviors : new ArrayList<>())
        .build();
  }

  public static TrackmateConfig fromProto(
      com.antigravity.proto.TrackmateConfig protoConfig) { // fqn-collision
    if (protoConfig == null) {
      return null;
    }
    TrackmateConfig config = new TrackmateConfig();
    config.name = protoConfig.getName();
    config.commPort = protoConfig.getCommPort();
    config.normallyClosedRelays = protoConfig.getNormallyClosedRelays();
    config.normallyClosedLaneSensors = protoConfig.getNormallyClosedLaneSensors();
    config.hasPerLaneRelays = protoConfig.getHasPerLaneRelays();
    config.useIR = protoConfig.getUseIr();
    config.debounce = protoConfig.getDebounce();
    config.numLanes = protoConfig.getNumLanes();
    config.lapPinPitBehavior =
        com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior
            .fromValue( // fqn-collision
                protoConfig.getLapPinPitBehaviorValue());
    if (protoConfig.getLapPinBehaviorsList() != null) {
      config.lapPinBehaviors = new ArrayList<>(protoConfig.getLapPinBehaviorsList());
    } else {
      config.lapPinBehaviors = new ArrayList<>();
    }
    return config;
  }
}
