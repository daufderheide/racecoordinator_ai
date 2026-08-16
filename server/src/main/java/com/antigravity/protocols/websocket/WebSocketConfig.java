package com.antigravity.protocols.websocket;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class WebSocketConfig {

  public String name;
  public int port;

  public WebSocketConfig() {
    this.name = "WebSocket";
    this.port = 7070;
  }

  @JsonCreator
  public WebSocketConfig(@JsonProperty("name") String name, @JsonProperty("port") Integer port) {
    this.name = name != null ? name : "WebSocket";
    this.port = port != null ? port : 7070;
  }
}
