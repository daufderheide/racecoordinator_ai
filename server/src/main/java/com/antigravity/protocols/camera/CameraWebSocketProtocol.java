package com.antigravity.protocols.camera;

import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.antigravity.race.ClientSubscriptionManager;

public class CameraWebSocketProtocol extends DefaultProtocol {

  private final CameraConfig config;
  private volatile boolean isOpen = false;
  private volatile boolean hasConnectedClient = false;
  private volatile int currentFps = 0;
  private volatile float batteryLevel = 1.0f;

  public CameraWebSocketProtocol(CameraConfig config, int numLanes) {
    super(numLanes);
    this.config = config;
    this.detectedChannels = numLanes;
  }

  public CameraConfig getConfig() {
    return config;
  }

  public int getCurrentFps() {
    return currentFps;
  }

  public float getBatteryLevel() {
    return batteryLevel;
  }

  @Override
  public synchronized boolean open() {
    isOpen = true;
    lastHeartbeatTimeMs = 0;
    ClientSubscriptionManager.getInstance().registerCameraProtocol(this);
    startStatusScheduler();
    return true;
  }

  @Override
  public synchronized void close() {
    isOpen = false;
    hasConnectedClient = false;
    ClientSubscriptionManager.getInstance().unregisterCameraProtocol(this);
    stopStatusScheduler();
    if (listener != null) {
      listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, getInterfaceIndex());
    }
  }

  @Override
  public boolean isConnected() {
    return isOpen && (!hasConnectedClient || (now() - lastHeartbeatTimeMs < 10000));
  }

  @Override
  public boolean isHealthy() {
    return isConnected() && hasConnectedClient;
  }

  @Override
  protected boolean canReconnect() {
    return false;
  }

  @Override
  protected boolean requiresHeartbeat() {
    return true;
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
  protected LapPinPitBehavior getLapPinPitBehavior() {
    return LapPinPitBehavior.NONE;
  }

  @Override
  protected boolean useLapsForSegments() {
    return false;
  }

  @Override
  protected double getHardwareDebounceUs() {
    return 0;
  }

  @Override
  public boolean hasPitInConfigured(int laneIndex) {
    if (config == null || config.gates == null) {
      return false;
    }
    for (LaneDetectionGate gate : config.gates) {
      if (gate.laneIndex == laneIndex && gate.gateType == LaneDetectionGate.TYPE_PIT_IN) {
        return true;
      }
    }
    return false;
  }

  public void onIncomingLap(int lane, double lapTime, int interfaceId) {
    hasConnectedClient = true;
    lastHeartbeatTimeMs = now();
    if (listener != null) {
      listener.onLap(lane, lapTime, interfaceId, getInterfaceIndex());
    }
  }

  public void onIncomingSegment(int lane, double segmentTime, int interfaceId) {
    hasConnectedClient = true;
    lastHeartbeatTimeMs = now();
    if (listener != null) {
      listener.onSegment(lane, segmentTime, interfaceId, getInterfaceIndex());
    }
  }

  public void onIncomingCallbutton(int lane) {
    hasConnectedClient = true;
    lastHeartbeatTimeMs = now();
    if (listener != null) {
      listener.onCallbutton(lane, getInterfaceIndex());
    }
  }

  public void onIncomingPitIn(int lane) {
    hasConnectedClient = true;
    lastHeartbeatTimeMs = now();
    if (pitManager != null) {
      pitManager.updatePitState(lane, true);
    }
  }

  public void onIncomingPitOut(int lane) {
    hasConnectedClient = true;
    lastHeartbeatTimeMs = now();
    if (pitManager != null) {
      pitManager.updatePitState(lane, false);
    }
  }

  public void onIncomingHeartbeat(int currentFps, float batteryLevel, double clientTimestamp) {
    this.hasConnectedClient = true;
    this.currentFps = currentFps;
    this.batteryLevel = batteryLevel;
    this.lastHeartbeatTimeMs = now();
  }
}
