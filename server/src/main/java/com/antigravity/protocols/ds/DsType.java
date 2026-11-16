package com.antigravity.protocols.ds;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DsType {
  DS_030("DS-030", 4800),
  DS_200("DS-200", 4800),
  DS_200B("DS-200b", 57600),
  DS_300("DS-300", 57600),
  DS_300RC("DS-300 RC", 57600);

  private final String displayName;
  private final int baudRate;

  DsType(String displayName, int baudRate) {
    this.displayName = displayName;
    this.baudRate = baudRate;
  }

  public String getDisplayName() {
    return displayName;
  }

  public int getBaudRate() {
    return baudRate;
  }

  public boolean isDs200() {
    return this == DS_200 || this == DS_200B;
  }

  public boolean isDs030() {
    return this == DS_030;
  }

  @JsonValue
  public String toValue() {
    return name();
  }

  public static DsType fromValue(String value) {
    return fromValue((Object) value);
  }

  @JsonCreator
  public static DsType fromValue(Object value) {
    if (value == null) {
      return DS_300;
    }
    if (value instanceof Number) {
      int ord = ((Number) value).intValue();
      if (ord >= 0 && ord < values().length) {
        return values()[ord];
      }
      return DS_300;
    }
    String str = value.toString().trim();
    try {
      int ord = Integer.parseInt(str);
      if (ord >= 0 && ord < values().length) {
        return values()[ord];
      }
    } catch (NumberFormatException ignored) {
    }
    for (DsType type : values()) {
      if (type.name().equalsIgnoreCase(str) || type.displayName.equalsIgnoreCase(str)) {
        return type;
      }
    }
    return DS_300;
  }
}
