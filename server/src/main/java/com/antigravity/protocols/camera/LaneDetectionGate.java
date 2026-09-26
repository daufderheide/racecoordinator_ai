package com.antigravity.protocols.camera;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LaneDetectionGate {

  public static final int TYPE_LAP = 0;
  public static final int TYPE_SECTOR = 1;
  public static final int TYPE_PIT_IN = 2;
  public static final int TYPE_PIT_OUT = 3;

  @JsonProperty("laneIndex")
  @JsonAlias("lane_index")
  public int laneIndex;

  @JsonProperty("xPct")
  @JsonAlias("x_pct")
  public float xPct;

  @JsonProperty("yPct")
  @JsonAlias("y_pct")
  public float yPct;

  @JsonProperty("widthPct")
  @JsonAlias("width_pct")
  public float widthPct;

  @JsonProperty("heightPct")
  @JsonAlias("height_pct")
  public float heightPct;

  @JsonProperty("gateType")
  @JsonAlias("gate_type")
  public int gateType;

  @JsonProperty("sensitivity")
  public float sensitivity;

  public LaneDetectionGate() {
    this.laneIndex = 0;
    this.xPct = 0.0f;
    this.yPct = 0.45f;
    this.widthPct = 0.2f;
    this.heightPct = 0.1f;
    this.gateType = TYPE_LAP;
    this.sensitivity = 0.5f;
  }

  @JsonCreator
  public LaneDetectionGate(
      @JsonProperty("laneIndex") @JsonAlias("lane_index") Integer laneIndex,
      @JsonProperty("xPct") @JsonAlias("x_pct") Float xPct,
      @JsonProperty("yPct") @JsonAlias("y_pct") Float yPct,
      @JsonProperty("widthPct") @JsonAlias("width_pct") Float widthPct,
      @JsonProperty("heightPct") @JsonAlias("height_pct") Float heightPct,
      @JsonProperty("gateType") @JsonAlias("gate_type") Integer gateType,
      @JsonProperty("sensitivity") Float sensitivity) {
    this.laneIndex = laneIndex != null ? laneIndex : 0;
    this.xPct = xPct != null ? xPct : 0.0f;
    this.yPct = yPct != null ? yPct : 0.45f;
    this.widthPct = widthPct != null ? widthPct : 0.2f;
    this.heightPct = heightPct != null ? heightPct : 0.1f;
    this.gateType = gateType != null ? gateType : TYPE_LAP;
    this.sensitivity = sensitivity != null ? sensitivity : 0.5f;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    LaneDetectionGate that = (LaneDetectionGate) o;
    return laneIndex == that.laneIndex
        && Float.compare(that.xPct, xPct) == 0
        && Float.compare(that.yPct, yPct) == 0
        && Float.compare(that.widthPct, widthPct) == 0
        && Float.compare(that.heightPct, heightPct) == 0
        && gateType == that.gateType
        && Float.compare(that.sensitivity, sensitivity) == 0;
  }

  @Override
  public int hashCode() {
    return Objects.hash(laneIndex, xPct, yPct, widthPct, heightPct, gateType, sensitivity);
  }
}
