package com.antigravity.protocols.websocket;

import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.arduino.ArduinoConfig;

public class WebSocketProtocol extends DefaultProtocol {

  private String name;
  private int port;
  private boolean isConnected = true;

  public WebSocketProtocol(WebSocketConfig config, int numLanes) {
    super(numLanes);
    this.name = config.name;
    this.port = config.port;
  }

  public void updateConfig(WebSocketConfig config) {
    this.name = config.name;
    this.port = config.port;
  }

  @Override
  public void updatePitState(int laneIndex, boolean inPits) {
    super.updatePitState(laneIndex, inPits);
  }

  @Override
  protected boolean isNormallyClosedLaneSensors() {
    return false;
  }

  @Override
  protected boolean isNormallyClosedRelays() {
    return false;
  }

  @Override
  protected ArduinoConfig.LapPinPitBehavior getLapPinPitBehavior() {
    return ArduinoConfig.LapPinPitBehavior.NONE;
  }

  @Override
  protected boolean useLapsForSegments() {
    return false;
  }

  @Override
  protected double getHardwareDebounceUs() {
    return 0.0;
  }

  @Override
  protected boolean hasPitInConfigured(int laneIndex) {
    return true;
  }

  @Override
  protected boolean isConnected() {
    return isConnected;
  }

  @Override
  public boolean open() {
    startStatusScheduler();
    isConnected = true;
    return true;
  }

  @Override
  protected boolean requiresHeartbeat() {
    return false;
  }

  @Override
  public void close() {
    super.close();
    isConnected = false;
  }
}
