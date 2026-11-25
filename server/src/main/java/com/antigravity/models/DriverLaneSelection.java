package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum DriverLaneSelection {
  NONE,
  RACE_START,
  HEAT_START,
  STEP_START;

  @JsonCreator
  public static DriverLaneSelection fromString(Object value) {
    if (value == null) {
      return NONE;
    }
    if (value instanceof Number) {
      int ordinal = ((Number) value).intValue();
      DriverLaneSelection[] values = values();
      if (ordinal >= 0 && ordinal < values.length) {
        return values[ordinal];
      }
      return NONE;
    }
    String s = value.toString().trim();
    for (DriverLaneSelection v : values()) {
      if (v.name().equalsIgnoreCase(s)) {
        return v;
      }
    }
    return NONE;
  }
}
