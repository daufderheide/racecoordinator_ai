package com.antigravity.protocols.trackmate;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TrackmateConfig {

  public String name;
  public String commPort;
  public boolean normallyClosedRelays;
  public boolean useIR;
  public int debounce;
  public int numLanes;

  public TrackmateConfig() {
    this.name = "Trackmate";
    this.normallyClosedRelays = true;
    this.useIR = true;
    this.debounce = 1;
    this.numLanes = 8;
  }

  @JsonCreator
  public TrackmateConfig(
      @JsonProperty("name") String name,
      @JsonProperty("commPort") String commPort,
      @JsonProperty("normallyClosedRelays") Boolean normallyClosedRelays,
      @JsonProperty("useIR") Boolean useIR,
      @JsonProperty("debounce") Integer debounce,
      @JsonProperty("numLanes") Integer numLanes) {
    this.name = name != null ? name : "Trackmate";
    this.commPort = commPort;
    this.normallyClosedRelays = normallyClosedRelays != null ? normallyClosedRelays : true;
    this.useIR = useIR != null ? useIR : true;
    this.debounce = debounce != null ? debounce : 1;
    this.numLanes = numLanes != null ? numLanes : 8;
  }
}
