package com.antigravity.importer.model;

import java.util.ArrayList;
import java.util.List;

/**
 * The preview sent back to import (#1210, step 6b): the rows as the user left them, and the field
 * types the file gave for new own fields (from a JSON export).
 */
public class CarImportCommitRequest {

  private List<CarImportRow> rows = new ArrayList<>();
  private List<CarImportPreview.FieldChange> newFields = new ArrayList<>();

  public List<CarImportRow> getRows() {
    return rows;
  }

  public void setRows(List<CarImportRow> rows) {
    this.rows = rows != null ? rows : new ArrayList<>();
  }

  public List<CarImportPreview.FieldChange> getNewFields() {
    return newFields;
  }

  public void setNewFields(List<CarImportPreview.FieldChange> newFields) {
    this.newFields = newFields != null ? newFields : new ArrayList<>();
  }
}
