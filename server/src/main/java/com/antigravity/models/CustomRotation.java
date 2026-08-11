package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class CustomRotation {
  @JsonProperty("num_drivers")
  @JsonAlias("numDrivers")
  private final int numDrivers;

  @JsonProperty("heats")
  private final List<CustomHeat> heats;

  public CustomRotation() {
    this.numDrivers = 0;
    this.heats = new ArrayList<>();
  }

  @JsonCreator
  public CustomRotation(
      @JsonProperty("num_drivers") @JsonAlias("numDrivers") int numDrivers,
      @JsonProperty("heats") @JsonAlias("heats") List<CustomHeat> heats) {
    this.numDrivers = numDrivers;
    this.heats = heats != null ? heats : new ArrayList<>();
  }

  public int getNumDrivers() {
    return numDrivers;
  }

  public List<CustomHeat> getHeats() {
    return heats;
  }
}
