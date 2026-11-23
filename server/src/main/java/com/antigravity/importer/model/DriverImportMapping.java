package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverImportMapping {

  @JsonProperty("source_driver_id")
  private String sourceDriverId;

  @JsonProperty("source_driver_name")
  private String sourceDriverName;

  @JsonProperty("source_driver_nickname")
  private String sourceDriverNickname;

  @JsonProperty("matched_local_driver_id")
  private String matchedLocalDriverId;

  @JsonProperty("matched_local_driver_name")
  private String matchedLocalDriverName;

  @JsonProperty("match_type")
  private String matchType; // "EXACT_NAME", "EXACT_NICKNAME", "NONE"

  @JsonProperty("suggested_action")
  private String suggestedAction; // "LINK", "CREATE_NEW"

  public DriverImportMapping() {}

  @JsonCreator
  public DriverImportMapping(
      @JsonProperty("source_driver_id") String sourceDriverId,
      @JsonProperty("source_driver_name") String sourceDriverName,
      @JsonProperty("source_driver_nickname") String sourceDriverNickname,
      @JsonProperty("matched_local_driver_id") String matchedLocalDriverId,
      @JsonProperty("matched_local_driver_name") String matchedLocalDriverName,
      @JsonProperty("match_type") String matchType,
      @JsonProperty("suggested_action") String suggestedAction) {
    this.sourceDriverId = sourceDriverId;
    this.sourceDriverName = sourceDriverName;
    this.sourceDriverNickname = sourceDriverNickname;
    this.matchedLocalDriverId = matchedLocalDriverId;
    this.matchedLocalDriverName = matchedLocalDriverName;
    this.matchType = matchType != null ? matchType : "NONE";
    this.suggestedAction = suggestedAction != null ? suggestedAction : "CREATE_NEW";
  }

  public String getSourceDriverId() {
    return sourceDriverId;
  }

  public void setSourceDriverId(String sourceDriverId) {
    this.sourceDriverId = sourceDriverId;
  }

  public String getSourceDriverName() {
    return sourceDriverName;
  }

  public void setSourceDriverName(String sourceDriverName) {
    this.sourceDriverName = sourceDriverName;
  }

  public String getSourceDriverNickname() {
    return sourceDriverNickname;
  }

  public void setSourceDriverNickname(String sourceDriverNickname) {
    this.sourceDriverNickname = sourceDriverNickname;
  }

  public String getMatchedLocalDriverId() {
    return matchedLocalDriverId;
  }

  public void setMatchedLocalDriverId(String matchedLocalDriverId) {
    this.matchedLocalDriverId = matchedLocalDriverId;
  }

  public String getMatchedLocalDriverName() {
    return matchedLocalDriverName;
  }

  public void setMatchedLocalDriverName(String matchedLocalDriverName) {
    this.matchedLocalDriverName = matchedLocalDriverName;
  }

  public String getMatchType() {
    return matchType;
  }

  public void setMatchType(String matchType) {
    this.matchType = matchType;
  }

  public String getSuggestedAction() {
    return suggestedAction;
  }

  public void setSuggestedAction(String suggestedAction) {
    this.suggestedAction = suggestedAction;
  }
}
