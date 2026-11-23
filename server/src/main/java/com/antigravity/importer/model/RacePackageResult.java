package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RacePackageResult {

  @JsonProperty("success")
  private boolean success;

  @JsonProperty("imported_race_id")
  private String importedRaceId;

  @JsonProperty("race_name")
  private String raceName;

  @JsonProperty("driver_count")
  private int driverCount;

  @JsonProperty("drivers_created")
  private int driversCreated;

  @JsonProperty("drivers_linked")
  private int driversLinked;

  @JsonProperty("committed_to_season_id")
  private String committedToSeasonId;

  @JsonProperty("race_config_id")
  private String raceConfigId;

  @JsonProperty("race_config_name")
  private String raceConfigName;

  @JsonProperty("race_config_action")
  private String raceConfigAction;

  @JsonProperty("action")
  private String action;

  @JsonProperty("message")
  private String message;

  public RacePackageResult() {}

  public RacePackageResult(
      boolean success,
      String importedRaceId,
      String raceName,
      int driverCount,
      int driversCreated,
      int driversLinked,
      String committedToSeasonId,
      String message) {
    this(
        success,
        importedRaceId,
        raceName,
        driverCount,
        driversCreated,
        driversLinked,
        committedToSeasonId,
        null,
        null,
        null,
        message,
        "IMPORTED");
  }

  @JsonCreator
  public RacePackageResult(
      @JsonProperty("success") boolean success,
      @JsonProperty("imported_race_id") String importedRaceId,
      @JsonProperty("race_name") String raceName,
      @JsonProperty("driver_count") int driverCount,
      @JsonProperty("drivers_created") int driversCreated,
      @JsonProperty("drivers_linked") int driversLinked,
      @JsonProperty("committed_to_season_id") String committedToSeasonId,
      @JsonProperty("race_config_id") String raceConfigId,
      @JsonProperty("race_config_name") String raceConfigName,
      @JsonProperty("race_config_action") String raceConfigAction,
      @JsonProperty("message") String message,
      @JsonProperty("action") String action) {
    this.success = success;
    this.importedRaceId = importedRaceId;
    this.raceName = raceName;
    this.driverCount = driverCount;
    this.driversCreated = driversCreated;
    this.driversLinked = driversLinked;
    this.committedToSeasonId = committedToSeasonId;
    this.raceConfigId = raceConfigId;
    this.raceConfigName = raceConfigName;
    this.raceConfigAction = raceConfigAction;
    this.message = message;
    this.action = action;
  }

  public RacePackageResult(
      boolean success,
      String importedRaceId,
      String raceName,
      int driverCount,
      int driversCreated,
      int driversLinked,
      String committedToSeasonId,
      String raceConfigId,
      String raceConfigName,
      String raceConfigAction,
      String message) {
    this(
        success,
        importedRaceId,
        raceName,
        driverCount,
        driversCreated,
        driversLinked,
        committedToSeasonId,
        raceConfigId,
        raceConfigName,
        raceConfigAction,
        message,
        "IMPORTED");
  }

  public boolean isSuccess() {
    return success;
  }

  public void setSuccess(boolean success) {
    this.success = success;
  }

  public String getImportedRaceId() {
    return importedRaceId;
  }

  public void setImportedRaceId(String importedRaceId) {
    this.importedRaceId = importedRaceId;
  }

  public String getRaceName() {
    return raceName;
  }

  public void setRaceName(String raceName) {
    this.raceName = raceName;
  }

  public int getDriverCount() {
    return driverCount;
  }

  public void setDriverCount(int driverCount) {
    this.driverCount = driverCount;
  }

  public int getDriversCreated() {
    return driversCreated;
  }

  public void setDriversCreated(int driversCreated) {
    this.driversCreated = driversCreated;
  }

  public int getDriversLinked() {
    return driversLinked;
  }

  public void setDriversLinked(int driversLinked) {
    this.driversLinked = driversLinked;
  }

  public String getCommittedToSeasonId() {
    return committedToSeasonId;
  }

  public void setCommittedToSeasonId(String committedToSeasonId) {
    this.committedToSeasonId = committedToSeasonId;
  }

  public String getRaceConfigId() {
    return raceConfigId;
  }

  public void setRaceConfigId(String raceConfigId) {
    this.raceConfigId = raceConfigId;
  }

  public String getRaceConfigName() {
    return raceConfigName;
  }

  public void setRaceConfigName(String raceConfigName) {
    this.raceConfigName = raceConfigName;
  }

  public String getRaceConfigAction() {
    return raceConfigAction;
  }

  public void setRaceConfigAction(String raceConfigAction) {
    this.raceConfigAction = raceConfigAction;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getAction() {
    return action;
  }

  public void setAction(String action) {
    this.action = action;
  }
}
