package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class DriverImportCommitRequest {

  private List<DriverImportRow> rows = new ArrayList<>();

  public DriverImportCommitRequest() {}

  @JsonCreator
  public DriverImportCommitRequest(@JsonProperty("rows") List<DriverImportRow> rows) {
    if (rows != null) {
      this.rows = new ArrayList<>(rows);
    }
  }

  public List<DriverImportRow> getRows() {
    return rows;
  }

  public void setRows(List<DriverImportRow> rows) {
    this.rows = rows != null ? rows : new ArrayList<>();
  }
}
