package com.antigravity.handlers.dto;

public class SavedRaceDescriptor {
  private String filename;
  private boolean corrupt;

  public SavedRaceDescriptor() {}

  public SavedRaceDescriptor(String filename, boolean corrupt) {
    this.filename = filename;
    this.corrupt = corrupt;
  }

  public String getFilename() {
    return filename;
  }

  public void setFilename(String filename) {
    this.filename = filename;
  }

  public boolean isCorrupt() {
    return corrupt;
  }

  public void setCorrupt(boolean corrupt) {
    this.corrupt = corrupt;
  }
}
