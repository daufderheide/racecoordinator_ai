package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class DriverImportPreview {

  private List<DriverImportRow> rows = new ArrayList<>();
  private int totalRows;
  private int validCount;
  private int conflictCount;
  private int errorCount;
  private List<String> importedAssetNames = new ArrayList<>();
  private String detectedAudioDefault = "system";

  public DriverImportPreview() {}

  @JsonCreator
  public DriverImportPreview(
      @JsonProperty("rows") List<DriverImportRow> rows,
      @JsonProperty("totalRows") int totalRows,
      @JsonProperty("validCount") int validCount,
      @JsonProperty("conflictCount") int conflictCount,
      @JsonProperty("errorCount") int errorCount,
      @JsonProperty("importedAssetNames") List<String> importedAssetNames,
      @JsonProperty("detectedAudioDefault") String detectedAudioDefault) {
    if (rows != null) {
      this.rows = new ArrayList<>(rows);
    }
    this.totalRows = totalRows;
    this.validCount = validCount;
    this.conflictCount = conflictCount;
    this.errorCount = errorCount;
    if (importedAssetNames != null) {
      this.importedAssetNames = new ArrayList<>(importedAssetNames);
    }
    this.detectedAudioDefault = detectedAudioDefault != null ? detectedAudioDefault : "system";
  }

  public List<DriverImportRow> getRows() {
    return rows;
  }

  public void setRows(List<DriverImportRow> rows) {
    this.rows = rows != null ? rows : new ArrayList<>();
  }

  public int getTotalRows() {
    return totalRows;
  }

  public void setTotalRows(int totalRows) {
    this.totalRows = totalRows;
  }

  public int getValidCount() {
    return validCount;
  }

  public void setValidCount(int validCount) {
    this.validCount = validCount;
  }

  public int getConflictCount() {
    return conflictCount;
  }

  public void setConflictCount(int conflictCount) {
    this.conflictCount = conflictCount;
  }

  public int getErrorCount() {
    return errorCount;
  }

  public void setErrorCount(int errorCount) {
    this.errorCount = errorCount;
  }

  public List<String> getImportedAssetNames() {
    return importedAssetNames;
  }

  public void setImportedAssetNames(List<String> importedAssetNames) {
    this.importedAssetNames = importedAssetNames != null ? importedAssetNames : new ArrayList<>();
  }

  public String getDetectedAudioDefault() {
    return detectedAudioDefault;
  }

  public void setDetectedAudioDefault(String detectedAudioDefault) {
    this.detectedAudioDefault = detectedAudioDefault;
  }
}
