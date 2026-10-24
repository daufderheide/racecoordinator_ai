package com.antigravity.importer.model;

import com.antigravity.models.AudioConfig;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DriverImportRow {

  private int rowIndex;
  private String rawName;
  private String rawNickname;
  private String resolvedName;
  private String resolvedNickname;
  private String avatarUrl;
  private Map<String, AudioConfig> audioSlots = new HashMap<>();
  private String defaultAudioMode = "system";
  private String status = "VALID"; // VALID, CONFLICT, ERROR
  private String conflictType =
      "NONE"; // NONE, DUPLICATE_NAME, DUPLICATE_NICKNAME, DUPLICATE_IN_FILE
  private String message = "";
  private String selectedResolution = "SKIP"; // SKIP, OVERWRITE, AUTO_RENAME
  private String existingDriverId;
  private List<String> labels = new ArrayList<>();
  private List<String> labelIds = new ArrayList<>();
  private boolean hasLabelColumns;

  public DriverImportRow() {}

  public DriverImportRow(
      int rowIndex,
      String rawName,
      String rawNickname,
      String resolvedName,
      String resolvedNickname,
      String avatarUrl,
      Map<String, AudioConfig> audioSlots,
      String defaultAudioMode,
      String status,
      String conflictType,
      String message,
      String selectedResolution,
      String existingDriverId) {
    this(
        rowIndex,
        rawName,
        rawNickname,
        resolvedName,
        resolvedNickname,
        avatarUrl,
        audioSlots,
        defaultAudioMode,
        status,
        conflictType,
        message,
        selectedResolution,
        existingDriverId,
        null,
        null);
  }

  @JsonCreator
  public DriverImportRow(
      @JsonProperty("rowIndex") int rowIndex,
      @JsonProperty("rawName") String rawName,
      @JsonProperty("rawNickname") String rawNickname,
      @JsonProperty("resolvedName") String resolvedName,
      @JsonProperty("resolvedNickname") String resolvedNickname,
      @JsonProperty("avatarUrl") String avatarUrl,
      @JsonProperty("audioSlots") Map<String, AudioConfig> audioSlots,
      @JsonProperty("defaultAudioMode") String defaultAudioMode,
      @JsonProperty("status") String status,
      @JsonProperty("conflictType") String conflictType,
      @JsonProperty("message") String message,
      @JsonProperty("selectedResolution") String selectedResolution,
      @JsonProperty("existingDriverId") String existingDriverId,
      @JsonProperty("labels") List<String> labels,
      @JsonProperty("labelIds") List<String> labelIds) {
    this.rowIndex = rowIndex;
    this.rawName = rawName;
    this.rawNickname = rawNickname;
    this.resolvedName = resolvedName;
    this.resolvedNickname = resolvedNickname;
    this.avatarUrl = avatarUrl;
    if (audioSlots != null) {
      this.audioSlots = new HashMap<>(audioSlots);
    }
    this.defaultAudioMode = defaultAudioMode != null ? defaultAudioMode : "system";
    this.status = status != null ? status : "VALID";
    this.conflictType = conflictType != null ? conflictType : "NONE";
    this.message = message != null ? message : "";
    this.selectedResolution = selectedResolution != null ? selectedResolution : "SKIP";
    this.existingDriverId = existingDriverId;
    if (labels != null) {
      this.labels = new ArrayList<>(labels);
    }
    if (labelIds != null) {
      this.labelIds = new ArrayList<>(labelIds);
    }
  }

  public int getRowIndex() {
    return rowIndex;
  }

  public void setRowIndex(int rowIndex) {
    this.rowIndex = rowIndex;
  }

  public String getRawName() {
    return rawName;
  }

  public void setRawName(String rawName) {
    this.rawName = rawName;
  }

  public String getRawNickname() {
    return rawNickname;
  }

  public void setRawNickname(String rawNickname) {
    this.rawNickname = rawNickname;
  }

  public String getResolvedName() {
    return resolvedName;
  }

  public void setResolvedName(String resolvedName) {
    this.resolvedName = resolvedName;
  }

  public String getResolvedNickname() {
    return resolvedNickname;
  }

  public void setResolvedNickname(String resolvedNickname) {
    this.resolvedNickname = resolvedNickname;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public void setAvatarUrl(String avatarUrl) {
    this.avatarUrl = avatarUrl;
  }

  public Map<String, AudioConfig> getAudioSlots() {
    return audioSlots;
  }

  public void setAudioSlots(Map<String, AudioConfig> audioSlots) {
    this.audioSlots = audioSlots != null ? audioSlots : new HashMap<>();
  }

  public String getDefaultAudioMode() {
    return defaultAudioMode;
  }

  public void setDefaultAudioMode(String defaultAudioMode) {
    this.defaultAudioMode = defaultAudioMode;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getConflictType() {
    return conflictType;
  }

  public void setConflictType(String conflictType) {
    this.conflictType = conflictType;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getSelectedResolution() {
    return selectedResolution;
  }

  public void setSelectedResolution(String selectedResolution) {
    this.selectedResolution = selectedResolution;
  }

  public String getExistingDriverId() {
    return existingDriverId;
  }

  public void setExistingDriverId(String existingDriverId) {
    this.existingDriverId = existingDriverId;
  }

  public List<String> getLabels() {
    return labels != null ? labels : new ArrayList<>();
  }

  public void setLabels(List<String> labels) {
    this.labels = labels != null ? new ArrayList<>(labels) : new ArrayList<>();
  }

  public List<String> getLabelIds() {
    return labelIds != null ? labelIds : new ArrayList<>();
  }

  public void setLabelIds(List<String> labelIds) {
    this.labelIds = labelIds != null ? new ArrayList<>(labelIds) : new ArrayList<>();
  }

  public boolean isHasLabelColumns() {
    return hasLabelColumns;
  }

  public void setHasLabelColumns(boolean hasLabelColumns) {
    this.hasLabelColumns = hasLabelColumns;
  }
}
