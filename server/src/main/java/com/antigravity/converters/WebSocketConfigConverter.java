package com.antigravity.converters;

import com.antigravity.protocols.websocket.WebSocketConfig;

public class WebSocketConfigConverter {

  public static com.antigravity.proto.WebSocketConfig toProto( // fqn-collision
      WebSocketConfig config) { // fqn-collision
    if (config == null) {
      return com.antigravity.proto.WebSocketConfig.getDefaultInstance(); // fqn-collision
    }
    return com.antigravity.proto.WebSocketConfig.newBuilder() // fqn-collision
        .setName(config.name != null ? config.name : "")
        .setPort(config.port)
        .build();
  }

  public static WebSocketConfig fromProto(
      com.antigravity.proto.WebSocketConfig protoConfig) { // fqn-collision

    if (protoConfig == null) {
      return null;
    }
    return new WebSocketConfig(protoConfig.getName(), protoConfig.getPort());
  }
}
