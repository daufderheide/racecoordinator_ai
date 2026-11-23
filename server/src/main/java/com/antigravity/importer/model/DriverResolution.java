package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverResolution {

  @JsonProperty("source_driver_id")
  private String sourceDriverId;

  @JsonProperty("action")
  private String action; // "LINK", "CREATE_NEW"

  @JsonProperty("target_driver_id")
  private String targetDriverId;

  @JsonProperty("new_driver_name")
  private String newDriverName;

  public DriverResolution() {}

  @JsonCreator
  public DriverResolution(
      @JsonProperty("source_driver_id") String sourceDriverId,
      @JsonProperty("action") String action,
      @JsonProperty("target_driver_id") String targetDriverId,
      @JsonProperty("new_driver_name") String newDriverName) {
    this.sourceDriverId = sourceDriverId;
    this.action = action != null ? action : "LINK";
    this.targetDriverId = targetDriverId;
    this.newDriverName = newDriverName;
  }

  public String getSourceDriverId() {
    return sourceDriverId;
  }

  public void setSourceDriverId(String sourceDriverId) {
    this.sourceDriverId = sourceDriverId;
  }

  public String getAction() {
    return action;
  }

  public void setAction(String action) {
    this.action = action;
  }

  public String getTargetDriverId() {
    return targetDriverId;
  }

  public void setTargetDriverId(String targetDriverId) {
    this.targetDriverId = targetDriverId;
  }

  public String getNewDriverName() {
    return newDriverName;
  }

  public void setNewDriverName(String newDriverName) {
    this.newDriverName = newDriverName;
  }
}
