package com.antigravity.protocols.bart;

import com.antigravity.proto.PinBehavior;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BartConfig {

  public String name;
  public String deviceName;
  public String deviceAddress;
  public int numLanes;
  public int minLapMs;
  public LapPinPitBehavior lapPinPitBehavior;
  public List<Integer> lapPinBehaviors;

  public BartConfig() {
    this.name = "BART";
    this.deviceName = "BART_0001";
    this.deviceAddress = "";
    this.numLanes = 8;
    this.minLapMs = 1000;
    this.lapPinPitBehavior = LapPinPitBehavior.NONE;

    this.lapPinBehaviors = new ArrayList<>();
    for (int i = 0; i < 8; i++) {
      this.lapPinBehaviors.add(PinBehavior.BEHAVIOR_LAP_BASE_VALUE + i);
    }
  }

  @JsonCreator
  public BartConfig(
      @JsonProperty("name") String name,
      @JsonProperty("deviceName") String deviceName,
      @JsonProperty("deviceAddress") String deviceAddress,
      @JsonProperty("numLanes") Integer numLanes,
      @JsonProperty("minLapMs") Integer minLapMs,
      @JsonProperty("lapPinPitBehavior") LapPinPitBehavior lapPinPitBehavior,
      @JsonProperty("lapPinBehaviors") List<Integer> lapPinBehaviors) {
    this.name = name != null ? name : "BART";
    this.deviceName = deviceName != null ? deviceName : "BART_0001";
    this.deviceAddress = deviceAddress != null ? deviceAddress : "";
    this.numLanes = numLanes != null ? numLanes : 8;
    this.minLapMs = minLapMs != null ? minLapMs : 1000;
    this.lapPinPitBehavior = lapPinPitBehavior != null ? lapPinPitBehavior : LapPinPitBehavior.NONE;

    if (lapPinBehaviors != null && !lapPinBehaviors.isEmpty()) {
      this.lapPinBehaviors = new ArrayList<>(lapPinBehaviors);
    } else {
      this.lapPinBehaviors = new ArrayList<>();
      for (int i = 0; i < 8; i++) {
        this.lapPinBehaviors.add(PinBehavior.BEHAVIOR_LAP_BASE_VALUE + i);
      }
    }
  }
}
