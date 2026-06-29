package com.antigravity.protocols.trackmate;

import com.antigravity.proto.PinBehavior;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TrackmateConfig {

  public String name;
  public String commPort;
  public boolean normallyClosedRelays;
  public boolean normallyClosedLaneSensors;
  public boolean useIR; // Deprecated, use normallyClosedLaneSensors
  public int debounce;
  public int numLanes;
  public boolean hasPerLaneRelays;
  public LapPinPitBehavior lapPinPitBehavior;
  public List<Integer> lapPinBehaviors;

  public TrackmateConfig() {
    this.name = "Trackmate";
    this.normallyClosedRelays = true;
    this.normallyClosedLaneSensors = true;
    this.useIR = true;
    this.debounce = 1;
    this.numLanes = 8;
    this.hasPerLaneRelays = false;
    this.lapPinPitBehavior = LapPinPitBehavior.PIT_IN_OUT;

    this.lapPinBehaviors = new ArrayList<>();
    for (int i = 0; i < 8; i++) {
      this.lapPinBehaviors.add(PinBehavior.BEHAVIOR_LAP_BASE_VALUE + i);
    }
  }

  @JsonCreator
  public TrackmateConfig(
      @JsonProperty("name") String name,
      @JsonProperty("commPort") String commPort,
      @JsonProperty("normallyClosedRelays") Boolean normallyClosedRelays,
      @JsonProperty("normallyClosedLaneSensors") Boolean normallyClosedLaneSensors,
      @JsonProperty("useIR") Boolean useIR,
      @JsonProperty("debounce") Integer debounce,
      @JsonProperty("numLanes") Integer numLanes,
      @JsonProperty("hasPerLaneRelays") Boolean hasPerLaneRelays,
      @JsonProperty("lapPinPitBehavior") LapPinPitBehavior lapPinPitBehavior,
      @JsonProperty("lapPinBehaviors") List<Integer> lapPinBehaviors) {
    this.name = name != null ? name : "Trackmate";
    this.commPort = commPort;
    this.normallyClosedRelays = normallyClosedRelays != null ? normallyClosedRelays : true;

    // Migrate useIR -> normallyClosedLaneSensors if absent
    if (normallyClosedLaneSensors == null) {
      this.normallyClosedLaneSensors = useIR != null ? useIR : true;
    } else {
      this.normallyClosedLaneSensors = normallyClosedLaneSensors;
    }
    this.useIR = this.normallyClosedLaneSensors;

    this.debounce = debounce != null ? debounce : 1;
    this.numLanes = numLanes != null ? numLanes : 8;
    this.hasPerLaneRelays = hasPerLaneRelays != null ? hasPerLaneRelays : false;
    this.lapPinPitBehavior =
        lapPinPitBehavior != null ? lapPinPitBehavior : LapPinPitBehavior.PIT_IN_OUT;

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
