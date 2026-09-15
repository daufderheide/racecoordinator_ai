package com.antigravity.protocols.camera;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CameraConfig {

  public String name;
  public int interfaceIndex;
  public int targetFps;
  public boolean autoDetectLanes;
  public List<LaneDetectionGate> gates;

  public CameraConfig() {
    this.name = "Camera Interface";
    this.interfaceIndex = 0;
    this.targetFps = 60;
    this.autoDetectLanes = false;
    this.gates = new ArrayList<>();
  }

  @JsonCreator
  public CameraConfig(
      @JsonProperty("name") String name,
      @JsonProperty("interfaceIndex") Integer interfaceIndex,
      @JsonProperty("targetFps") Integer targetFps,
      @JsonProperty("autoDetectLanes") Boolean autoDetectLanes,
      @JsonProperty("gates") List<LaneDetectionGate> gates) {
    this.name = name != null ? name : "Camera Interface";
    this.interfaceIndex = interfaceIndex != null ? interfaceIndex : 0;
    this.targetFps = targetFps != null ? targetFps : 60;
    this.autoDetectLanes = autoDetectLanes != null ? autoDetectLanes : false;
    this.gates = gates != null ? new ArrayList<>(gates) : new ArrayList<>();
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
        && Objects.equals(gates, that.gates);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, interfaceIndex, targetFps, autoDetectLanes, gates);
  }
}
