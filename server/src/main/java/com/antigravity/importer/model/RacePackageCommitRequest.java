package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RacePackageCommitRequest {

  @JsonProperty("temp_package_token")
  private String tempPackageToken;

  @JsonProperty("duplicate_action")
  private String duplicateAction = "CREATE_COPY"; // "OVERWRITE", "CREATE_COPY", "SKIP"

  @JsonProperty("config_action")
  private String configAction = "CREATE_NEW"; // "CREATE_NEW", "OVERWRITE", "USE_EXISTING", "SKIP"

  @JsonProperty("race_name")
  @JsonAlias("custom_config_name")
  private String raceName;

  @JsonProperty("custom_config_name")
  private String customConfigName;

  @JsonProperty("driver_resolutions")
  private List<DriverResolution> driverResolutions = new ArrayList<>();

  @JsonProperty("season_id")
  private String seasonId;

  public RacePackageCommitRequest() {}

  public RacePackageCommitRequest(
      String tempPackageToken,
      String duplicateAction,
      List<DriverResolution> driverResolutions,
      String seasonId) {
    this(tempPackageToken, duplicateAction, "CREATE_NEW", null, driverResolutions, seasonId);
  }

  @JsonCreator
  public RacePackageCommitRequest(
      @JsonProperty("temp_package_token") String tempPackageToken,
      @JsonProperty("duplicate_action") String duplicateAction,
      @JsonProperty("config_action") String configAction,
      @JsonProperty("race_name") @JsonAlias("custom_config_name") String raceName,
      @JsonProperty("driver_resolutions") List<DriverResolution> driverResolutions,
      @JsonProperty("season_id") String seasonId) {
    this.tempPackageToken = tempPackageToken;
    this.duplicateAction = duplicateAction != null ? duplicateAction : "CREATE_COPY";
    this.configAction = configAction != null ? configAction : "CREATE_NEW";
    this.raceName = raceName;
    this.customConfigName = raceName;
    if (driverResolutions != null) {
      this.driverResolutions = new ArrayList<>(driverResolutions);
    }
    this.seasonId = seasonId;
  }

  public String getTempPackageToken() {
    return tempPackageToken;
  }

  public void setTempPackageToken(String tempPackageToken) {
    this.tempPackageToken = tempPackageToken;
  }

  public String getDuplicateAction() {
    return duplicateAction;
  }

  public void setDuplicateAction(String duplicateAction) {
    this.duplicateAction = duplicateAction;
  }

  public String getConfigAction() {
    return configAction;
  }

  public void setConfigAction(String configAction) {
    this.configAction = configAction;
  }

  public String getRaceName() {
    if (raceName != null && !raceName.trim().isEmpty()) {
      return raceName.trim();
    }
    return customConfigName != null ? customConfigName.trim() : null;
  }

  public void setRaceName(String raceName) {
    this.raceName = raceName;
    this.customConfigName = raceName;
  }

  public String getCustomConfigName() {
    return getRaceName();
  }

  public void setCustomConfigName(String customConfigName) {
    setRaceName(customConfigName);
  }

  public List<DriverResolution> getDriverResolutions() {
    return driverResolutions;
  }

  public void setDriverResolutions(List<DriverResolution> driverResolutions) {
    this.driverResolutions = driverResolutions != null ? driverResolutions : new ArrayList<>();
  }

  public String getSeasonId() {
    return seasonId;
  }

  public void setSeasonId(String seasonId) {
    this.seasonId = seasonId;
  }
}
