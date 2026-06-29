package com.antigravity.converters;

import com.antigravity.protocols.trackmate.TrackmateConfig;

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
        .setUseIr(config.useIR)
        .setDebounce(config.debounce)
        .setNumLanes(config.numLanes)
        .build();
  }
}
