package com.antigravity.importer.model;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * One car of an import file (#1210, step 6b), as shown in the preview and sent back to commit.
 *
 * <p>{@code values} holds the fixed columns the file has (keys from {@link
 * com.antigravity.importer.CarImportParser}: brand, carClass, scale, motor, magnet, chassis, gears,
 * tyres, modified, notes, picture). {@code customValues} holds the own-field columns by field name.
 * A key that is missing means "the file doesn't say", so an overwrite keeps the car's value; an
 * empty value clears it.
 */
public class CarImportRow {

  /** Status of a row: imported as is, needs a decision, or can't be imported. */
  public static final String STATUS_VALID = "VALID";

  public static final String STATUS_CONFLICT = "CONFLICT";
  public static final String STATUS_ERROR = "ERROR";

  public static final String CONFLICT_NONE = "NONE";
  public static final String CONFLICT_NAME = "DUPLICATE_NAME";
  public static final String CONFLICT_IN_FILE = "DUPLICATE_IN_FILE";

  public static final String RESOLUTION_SKIP = "SKIP";
  public static final String RESOLUTION_OVERWRITE = "OVERWRITE";
  public static final String RESOLUTION_AUTO_RENAME = "AUTO_RENAME";

  private int rowIndex;
  private String rawName = "";
  private String resolvedName = "";
  private Map<String, String> values = new LinkedHashMap<>();
  private Map<String, String> customValues = new LinkedHashMap<>();
  private String status = STATUS_VALID;
  private String conflictType = CONFLICT_NONE;
  private String message;
  private String selectedResolution;
  private String existingCarId;

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
    this.rawName = rawName != null ? rawName : "";
  }

  public String getResolvedName() {
    return resolvedName;
  }

  public void setResolvedName(String resolvedName) {
    this.resolvedName = resolvedName != null ? resolvedName : "";
  }

  public Map<String, String> getValues() {
    return values;
  }

  public void setValues(Map<String, String> values) {
    this.values = values != null ? new LinkedHashMap<>(values) : new LinkedHashMap<>();
  }

  public Map<String, String> getCustomValues() {
    return customValues;
  }

  public void setCustomValues(Map<String, String> customValues) {
    this.customValues =
        customValues != null ? new LinkedHashMap<>(customValues) : new LinkedHashMap<>();
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

  public String getExistingCarId() {
    return existingCarId;
  }

  public void setExistingCarId(String existingCarId) {
    this.existingCarId = existingCarId;
  }
}
