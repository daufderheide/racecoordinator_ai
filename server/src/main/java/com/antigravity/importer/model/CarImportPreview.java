package com.antigravity.importer.model;

import java.util.ArrayList;
import java.util.List;

/**
 * What an import file would do (#1210, step 6b): the cars, the own fields it adds, and the choice
 * options it adds to existing fields. Nothing is saved yet, apart from the pictures in the file.
 */
public class CarImportPreview {

  /** A car already in the database, so the client can check names while the user edits. */
  public static class ExistingCar {
    private String entityId;
    private String name;

    public ExistingCar() {}

    public ExistingCar(String entityId, String name) {
      this.entityId = entityId;
      this.name = name;
    }

    public String getEntityId() {
      return entityId;
    }

    public void setEntityId(String entityId) {
      this.entityId = entityId;
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }
  }

  /** An own field the import adds, or choice options it adds to a field. */
  public static class FieldChange {
    private String name;
    private String type;
    private List<String> options = new ArrayList<>();

    public FieldChange() {}

    public FieldChange(String name, String type, List<String> options) {
      this.name = name;
      this.type = type;
      this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public String getType() {
      return type;
    }

    public void setType(String type) {
      this.type = type;
    }

    public List<String> getOptions() {
      return options;
    }

    public void setOptions(List<String> options) {
      this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
    }
  }

  private List<CarImportRow> rows = new ArrayList<>();
  private int totalRows;
  private int validCount;
  private int conflictCount;
  private int errorCount;
  private List<String> importedAssetNames = new ArrayList<>();
  private List<ExistingCar> existingCars = new ArrayList<>();
  private List<FieldChange> newFields = new ArrayList<>();
  private List<FieldChange> newOptions = new ArrayList<>();

  public List<CarImportRow> getRows() {
    return rows;
  }

  public void setRows(List<CarImportRow> rows) {
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

  public List<ExistingCar> getExistingCars() {
    return existingCars;
  }

  public void setExistingCars(List<ExistingCar> existingCars) {
    this.existingCars = existingCars != null ? existingCars : new ArrayList<>();
  }

  public List<FieldChange> getNewFields() {
    return newFields;
  }

  public void setNewFields(List<FieldChange> newFields) {
    this.newFields = newFields != null ? newFields : new ArrayList<>();
  }

  public List<FieldChange> getNewOptions() {
    return newOptions;
  }

  public void setNewOptions(List<FieldChange> newOptions) {
    this.newOptions = newOptions != null ? newOptions : new ArrayList<>();
  }
}
