package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class DriverImportResult {

  private boolean success;
  private int importedCount;
  private int updatedCount;
  private int skippedCount;
  private List<String> createdDriverIds = new ArrayList<>();
  private List<String> messages = new ArrayList<>();

  public DriverImportResult() {}

  @JsonCreator
  public DriverImportResult(
      @JsonProperty("success") boolean success,
      @JsonProperty("importedCount") int importedCount,
      @JsonProperty("updatedCount") int updatedCount,
      @JsonProperty("skippedCount") int skippedCount,
      @JsonProperty("createdDriverIds") List<String> createdDriverIds,
      @JsonProperty("messages") List<String> messages) {
    this.success = success;
    this.importedCount = importedCount;
    this.updatedCount = updatedCount;
    this.skippedCount = skippedCount;
    if (createdDriverIds != null) {
      this.createdDriverIds = new ArrayList<>(createdDriverIds);
    }
    if (messages != null) {
      this.messages = new ArrayList<>(messages);
    }
  }

  public boolean isSuccess() {
    return success;
  }

  public void setSuccess(boolean success) {
    this.success = success;
  }

  public int getImportedCount() {
    return importedCount;
  }

  public void setImportedCount(int importedCount) {
    this.importedCount = importedCount;
  }

  public int getUpdatedCount() {
    return updatedCount;
  }

  public void setUpdatedCount(int updatedCount) {
    this.updatedCount = updatedCount;
  }

  public int getSkippedCount() {
    return skippedCount;
  }

  public void setSkippedCount(int skippedCount) {
    this.skippedCount = skippedCount;
  }

  public List<String> getCreatedDriverIds() {
    return createdDriverIds;
  }

  public void setCreatedDriverIds(List<String> createdDriverIds) {
    this.createdDriverIds = createdDriverIds != null ? createdDriverIds : new ArrayList<>();
  }

  public List<String> getMessages() {
    return messages;
  }

  public void setMessages(List<String> messages) {
    this.messages = messages != null ? messages : new ArrayList<>();
  }
}
