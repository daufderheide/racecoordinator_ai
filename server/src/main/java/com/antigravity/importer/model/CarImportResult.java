package com.antigravity.importer.model;

import java.util.ArrayList;
import java.util.List;

/** What an import did (#1210, step 6b). */
public class CarImportResult {

  private boolean success;
  private int importedCount;
  private int updatedCount;
  private int skippedCount;
  private List<String> createdCarIds = new ArrayList<>();
  private List<String> updatedCarIds = new ArrayList<>();
  private List<String> createdFieldNames = new ArrayList<>();
  private List<String> messages = new ArrayList<>();

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

  public List<String> getCreatedCarIds() {
    return createdCarIds;
  }

  public void setCreatedCarIds(List<String> createdCarIds) {
    this.createdCarIds = createdCarIds != null ? createdCarIds : new ArrayList<>();
  }

  public List<String> getUpdatedCarIds() {
    return updatedCarIds;
  }

  public void setUpdatedCarIds(List<String> updatedCarIds) {
    this.updatedCarIds = updatedCarIds != null ? updatedCarIds : new ArrayList<>();
  }

  public List<String> getCreatedFieldNames() {
    return createdFieldNames;
  }

  public void setCreatedFieldNames(List<String> createdFieldNames) {
    this.createdFieldNames = createdFieldNames != null ? createdFieldNames : new ArrayList<>();
  }

  public List<String> getMessages() {
    return messages;
  }

  public void setMessages(List<String> messages) {
    this.messages = messages != null ? messages : new ArrayList<>();
  }
}
