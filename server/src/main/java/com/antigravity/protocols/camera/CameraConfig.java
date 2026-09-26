package com.antigravity.protocols.camera;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CameraConfig {

  @JsonProperty("name")
  public String name;

  @JsonProperty("interfaceIndex")
  @JsonAlias("interface_index")
  public int interfaceIndex;

  @JsonProperty("targetFps")
  @JsonAlias("target_fps")
  public int targetFps;

  @JsonProperty("autoDetectLanes")
  @JsonAlias("auto_detect_lanes")
  public boolean autoDetectLanes;

  @JsonProperty("gates")
  public List<LaneDetectionGate> gates;

  @JsonProperty("connectionType")
  @JsonAlias("connection_type")
  public String connectionType;

  public CameraConfig() {
    this.name = "Camera Interface";
    this.interfaceIndex = 0;
    this.targetFps = 60;
    this.autoDetectLanes = false;
    this.gates = new ArrayList<>();
    this.connectionType = "local";
  }

  @JsonCreator
  public CameraConfig(
      @JsonProperty("name") String name,
      @JsonProperty("interfaceIndex") @JsonAlias("interface_index") Integer interfaceIndex,
      @JsonProperty("targetFps") @JsonAlias("target_fps") Integer targetFps,
      @JsonProperty("autoDetectLanes") @JsonAlias("auto_detect_lanes") Boolean autoDetectLanes,
      @JsonProperty("gates") List<LaneDetectionGate> gates,
      @JsonProperty("connectionType") @JsonAlias("connection_type") String connectionType) {
    this.name = name != null ? name : "Camera Interface";
    this.interfaceIndex = interfaceIndex != null ? interfaceIndex : 0;
    this.targetFps = targetFps != null ? targetFps : 60;
    this.autoDetectLanes = autoDetectLanes != null ? autoDetectLanes : false;
    this.gates = gates != null ? new ArrayList<>(gates) : new ArrayList<>();
    this.connectionType =
        (connectionType != null && !connectionType.trim().isEmpty())
            ? connectionType.trim()
            : "local";
  }

  public CameraConfig(
      String name,
      Integer interfaceIndex,
      Integer targetFps,
      Boolean autoDetectLanes,
      List<LaneDetectionGate> gates) {
    this(name, interfaceIndex, targetFps, autoDetectLanes, gates, "local");
  }

  public CameraConfig(CameraConfig other) {
    if (other != null) {
      this.name = other.name;
      this.interfaceIndex = other.interfaceIndex;
      this.targetFps = other.targetFps;
      this.autoDetectLanes = other.autoDetectLanes;
      this.gates = other.gates != null ? new ArrayList<>(other.gates) : new ArrayList<>();
      this.connectionType = other.connectionType != null ? other.connectionType : "local";
    } else {
      this.name = "Camera Interface";
      this.interfaceIndex = 0;
      this.targetFps = 60;
      this.autoDetectLanes = false;
      this.gates = new ArrayList<>();
      this.connectionType = "local";
    }
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public int getInterfaceIndex() {
    return interfaceIndex;
  }

  public void setInterfaceIndex(int interfaceIndex) {
    this.interfaceIndex = interfaceIndex;
  }

  public int getTargetFps() {
    return targetFps;
  }

  public void setTargetFps(int targetFps) {
    this.targetFps = targetFps;
  }

  public boolean isAutoDetectLanes() {
    return autoDetectLanes;
  }

  public void setAutoDetectLanes(boolean autoDetectLanes) {
    this.autoDetectLanes = autoDetectLanes;
  }

  public List<LaneDetectionGate> getGates() {
    return gates;
  }

  public void setGates(List<LaneDetectionGate> gates) {
    this.gates = gates;
  }

  public String getConnectionType() {
    return connectionType;
  }

  public void setConnectionType(String connectionType) {
    this.connectionType = connectionType;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    CameraConfig that = (CameraConfig) o;
    return interfaceIndex == that.interfaceIndex
        && targetFps == that.targetFps
        && autoDetectLanes == that.autoDetectLanes
        && Objects.equals(name, that.name)
        && Objects.equals(gates, that.gates)
        && Objects.equals(connectionType, that.connectionType);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, interfaceIndex, targetFps, autoDetectLanes, gates, connectionType);
  }
}
