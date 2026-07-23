package com.antigravity.protocols.phidget;

import com.antigravity.proto.PinBehavior;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PhidgetConfig {

  public String name;
  public int serialNumber;
  public boolean isHubPort;
  public int hubPort;

  public int debounceUs;
  public boolean normallyClosedLaneSensors;
  public boolean normallyClosedRelays;
  public int useLapsForPits;
  public int useLapsForPitEnd;
  public boolean usePitsAsLaps;
  public boolean useLapsForSegments;
  public LapPinPitBehavior lapPinPitBehavior;

  public List<Integer> digitalInIds;
  public List<Integer> digitalOutIds;
  public List<Integer> analogIds;

  @JsonAlias({"voltage_configs", "voltageConfigs"})
  public Map<String, Integer> voltageConfigs = new HashMap<>();

  @JsonIgnore
  public Map<String, Integer> getVoltageConfigsMap() {
    return voltageConfigs;
  }

  public static final int MAX_DIGITAL_IN_PINS = 32;
  public static final int MAX_DIGITAL_OUT_PINS = 32;
  public static final int MAX_ANALOG_PINS = 16;

  public PhidgetConfig() {
    this.digitalInIds = new ArrayList<>();
    for (int i = 0; i < MAX_DIGITAL_IN_PINS; i++) {
      this.digitalInIds.add(PinBehavior.BEHAVIOR_UNUSED.getNumber());
    }

    this.digitalOutIds = new ArrayList<>();
    for (int i = 0; i < MAX_DIGITAL_OUT_PINS; i++) {
      this.digitalOutIds.add(PinBehavior.BEHAVIOR_UNUSED.getNumber());
    }

    this.analogIds = new ArrayList<>();
    for (int i = 0; i < MAX_ANALOG_PINS; i++) {
      this.analogIds.add(PinBehavior.BEHAVIOR_UNUSED.getNumber());
    }
    this.voltageConfigs = new HashMap<>();

    this.name = "Phidget";
    this.serialNumber = -1;
    this.isHubPort = false;
    this.hubPort = 0;

    this.debounceUs = 200;
    this.normallyClosedLaneSensors = true;
    this.normallyClosedRelays = true;
    this.useLapsForPits = 0;
    this.useLapsForPitEnd = 0;
    this.usePitsAsLaps = false;
    this.useLapsForSegments = true;
    this.lapPinPitBehavior = LapPinPitBehavior.PIT_IN_OUT;
  }

  @JsonCreator
  public PhidgetConfig(
      @JsonProperty("name") String name,
      @JsonProperty("serialNumber") int serialNumber,
      @JsonProperty("isHubPort") boolean isHubPort,
      @JsonProperty("hubPort") int hubPort,
      @JsonProperty("debounceUs") int debounceUs,
      @JsonProperty("normallyClosedLaneSensors") boolean normallyClosedLaneSensors,
      @JsonProperty("normallyClosedRelays") boolean normallyClosedRelays,
      @JsonProperty("useLapsForPits") Integer useLapsForPits,
      @JsonProperty("useLapsForPitEnd") Integer useLapsForPitEnd,
      @JsonProperty("usePitsAsLaps") boolean usePitsAsLaps,
      @JsonProperty("useLapsForSegments") boolean useLapsForSegments,
      @JsonProperty("lapPinPitBehavior") LapPinPitBehavior lapPinPitBehavior,
      @JsonProperty("digitalInIds") List<Integer> digitalInIds,
      @JsonProperty("digitalOutIds") List<Integer> digitalOutIds,
      @JsonProperty("analogIds") List<Integer> analogIds,
      @JsonProperty("voltageConfigs") @JsonAlias("voltage_configs")
          Map<String, Integer> voltageConfigs) {
    this.name = name;
    this.serialNumber = serialNumber;
    this.isHubPort = isHubPort;
    this.hubPort = hubPort;
    this.debounceUs = debounceUs;
    this.normallyClosedLaneSensors = normallyClosedLaneSensors;
    this.normallyClosedRelays = normallyClosedRelays;
    this.useLapsForPits = useLapsForPits != null ? useLapsForPits : 0;
    this.useLapsForPitEnd = useLapsForPitEnd != null ? useLapsForPitEnd : 0;
    this.usePitsAsLaps = usePitsAsLaps;
    this.useLapsForSegments = useLapsForSegments;
    this.lapPinPitBehavior = lapPinPitBehavior;
    this.digitalInIds = digitalInIds;
    this.digitalOutIds = digitalOutIds;
    this.analogIds = analogIds;
    this.voltageConfigs = voltageConfigs;
  }
}
