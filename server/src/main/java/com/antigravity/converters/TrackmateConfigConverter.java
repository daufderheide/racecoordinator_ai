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
}
