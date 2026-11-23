package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RacePackageManifest {

  @JsonProperty("format_version")
  private int formatVersion = 1;

  @JsonProperty("created_by_app_version")
  private String createdByAppVersion;

  @JsonProperty("min_compatible_app_version")
  private String minCompatibleAppVersion = "1.0.0";

  @JsonProperty("package_type")
  private String packageType = "race_package";

  @JsonProperty("race_id")
  private String raceId;

  @JsonProperty("race_name")
  private String raceName;

  @JsonProperty("start_time")
  private Long startTime;

  @JsonProperty("end_time")
  private Long endTime;

  @JsonProperty("heat_count")
  private int heatCount;

  @JsonProperty("driver_count")
  private int driverCount;

  @JsonProperty("fingerprint")
  private String fingerprint;

  public RacePackageManifest() {}

  @JsonCreator
  public RacePackageManifest(
      @JsonProperty("format_version") int formatVersion,
      @JsonProperty("created_by_app_version") String createdByAppVersion,
      @JsonProperty("min_compatible_app_version") String minCompatibleAppVersion,
      @JsonProperty("package_type") String packageType,
      @JsonProperty("race_id") String raceId,
      @JsonProperty("race_name") String raceName,
      @JsonProperty("start_time") Long startTime,
      @JsonProperty("end_time") Long endTime,
      @JsonProperty("heat_count") int heatCount,
      @JsonProperty("driver_count") int driverCount,
      @JsonProperty("fingerprint") String fingerprint) {
    this.formatVersion = formatVersion > 0 ? formatVersion : 1;
    this.createdByAppVersion = createdByAppVersion;
    this.minCompatibleAppVersion =
        minCompatibleAppVersion != null ? minCompatibleAppVersion : "1.0.0";
    this.packageType = packageType != null ? packageType : "race_package";
    this.raceId = raceId;
    this.raceName = raceName;
    this.startTime = startTime;
    this.endTime = endTime;
    this.heatCount = heatCount;
    this.driverCount = driverCount;
    this.fingerprint = fingerprint;
  }

  public int getFormatVersion() {
    return formatVersion;
  }

  public void setFormatVersion(int formatVersion) {
    this.formatVersion = formatVersion;
  }

  public String getCreatedByAppVersion() {
    return createdByAppVersion;
  }

  public void setCreatedByAppVersion(String createdByAppVersion) {
    this.createdByAppVersion = createdByAppVersion;
  }

  public String getMinCompatibleAppVersion() {
    return minCompatibleAppVersion;
  }

  public void setMinCompatibleAppVersion(String minCompatibleAppVersion) {
    this.minCompatibleAppVersion = minCompatibleAppVersion;
  }

  public String getPackageType() {
    return packageType;
  }

  public void setPackageType(String packageType) {
    this.packageType = packageType;
  }

  public String getRaceId() {
    return raceId;
  }

  public void setRaceId(String raceId) {
    this.raceId = raceId;
  }

  public String getRaceName() {
    return raceName;
  }

  public void setRaceName(String raceName) {
    this.raceName = raceName;
  }

  public Long getStartTime() {
    return startTime;
  }

  public void setStartTime(Long startTime) {
    this.startTime = startTime;
  }

  public Long getEndTime() {
    return endTime;
  }

  public void setEndTime(Long endTime) {
    this.endTime = endTime;
  }

  public int getHeatCount() {
    return heatCount;
  }

  public void setHeatCount(int heatCount) {
    this.heatCount = heatCount;
  }

  public int getDriverCount() {
    return driverCount;
  }

  public void setDriverCount(int driverCount) {
    this.driverCount = driverCount;
  }

  public String getFingerprint() {
    return fingerprint;
  }

  public void setFingerprint(String fingerprint) {
    this.fingerprint = fingerprint;
  }
}
