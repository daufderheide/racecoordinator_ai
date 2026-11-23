package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RacePackagePreview {

  @JsonProperty("manifest")
  private RacePackageManifest manifest;

  @JsonProperty("duplicate_race")
  private boolean duplicateRace;

  @JsonProperty("existing_race_id")
  private String existingRaceId;

  @JsonProperty("existing_race_name")
  private String existingRaceName;

  @JsonProperty("config_conflict")
  private boolean configConflict;

  @JsonProperty("existing_config_name")
  private String existingConfigName;

  @JsonProperty("suggested_config_name")
  private String suggestedConfigName;

  @JsonProperty("driver_mappings")
  private List<DriverImportMapping> driverMappings = new ArrayList<>();

  @JsonProperty("temp_package_token")
  private String tempPackageToken;

  public RacePackagePreview() {}

  public RacePackagePreview(
      RacePackageManifest manifest,
      boolean duplicateRace,
      String existingRaceId,
      String existingRaceName,
      List<DriverImportMapping> driverMappings,
      String tempPackageToken) {
    this(
        manifest,
        duplicateRace,
        existingRaceId,
        existingRaceName,
        false,
        null,
        null,
        driverMappings,
        tempPackageToken);
  }

  @JsonCreator
  public RacePackagePreview(
      @JsonProperty("manifest") RacePackageManifest manifest,
      @JsonProperty("duplicate_race") boolean duplicateRace,
      @JsonProperty("existing_race_id") String existingRaceId,
      @JsonProperty("existing_race_name") String existingRaceName,
      @JsonProperty("config_conflict") Boolean configConflict,
      @JsonProperty("existing_config_name") String existingConfigName,
      @JsonProperty("suggested_config_name") String suggestedConfigName,
      @JsonProperty("driver_mappings") List<DriverImportMapping> driverMappings,
      @JsonProperty("temp_package_token") String tempPackageToken) {
    this.manifest = manifest;
    this.duplicateRace = duplicateRace;
    this.existingRaceId = existingRaceId;
    this.existingRaceName = existingRaceName;
    this.configConflict = Boolean.TRUE.equals(configConflict);
    this.existingConfigName = existingConfigName;
    this.suggestedConfigName = suggestedConfigName;
    if (driverMappings != null) {
      this.driverMappings = new ArrayList<>(driverMappings);
    }
    this.tempPackageToken = tempPackageToken;
  }

  public RacePackageManifest getManifest() {
    return manifest;
  }

  public void setManifest(RacePackageManifest manifest) {
    this.manifest = manifest;
  }

  public boolean isDuplicateRace() {
    return duplicateRace;
  }

  public void setDuplicateRace(boolean duplicateRace) {
    this.duplicateRace = duplicateRace;
  }

  public String getExistingRaceId() {
    return existingRaceId;
  }

  public void setExistingRaceId(String existingRaceId) {
    this.existingRaceId = existingRaceId;
  }

  public String getExistingRaceName() {
    return existingRaceName;
  }

  public void setExistingRaceName(String existingRaceName) {
    this.existingRaceName = existingRaceName;
  }

  public boolean isConfigConflict() {
    return configConflict;
  }

  public void setConfigConflict(boolean configConflict) {
    this.configConflict = configConflict;
  }

  public String getExistingConfigName() {
    return existingConfigName;
  }

  public void setExistingConfigName(String existingConfigName) {
    this.existingConfigName = existingConfigName;
  }

  public String getSuggestedConfigName() {
    return suggestedConfigName;
  }

  public void setSuggestedConfigName(String suggestedConfigName) {
    this.suggestedConfigName = suggestedConfigName;
  }

  public List<DriverImportMapping> getDriverMappings() {
    return driverMappings;
  }

  public void setDriverMappings(List<DriverImportMapping> driverMappings) {
    this.driverMappings = driverMappings != null ? driverMappings : new ArrayList<>();
  }

  public String getTempPackageToken() {
    return tempPackageToken;
  }

  public void setTempPackageToken(String tempPackageToken) {
    this.tempPackageToken = tempPackageToken;
  }
}
