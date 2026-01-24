package com.antigravity.protocols;

public enum CarLocation {
  Unused(-1),
  Main(0),
  PitRow(1),
  // Everything from PitBayBase down is the pit bay number the car is located in
  PitBayBase(2000);

  private final int value;

  CarLocation(int value) {
    this.value = value;
  }

  public int getValue() {
    return value;
  }
};