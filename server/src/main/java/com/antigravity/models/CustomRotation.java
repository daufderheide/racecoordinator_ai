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

  @JsonProperty("description")
  private final String description;

  public CustomRotation() {
    this.numDrivers = 0;
    this.heats = new ArrayList<>();
    this.description = "";
  }

  public CustomRotation(int numDrivers, List<CustomHeat> heats) {
    this(numDrivers, heats, "");
  }

  @JsonCreator
  public CustomRotation(
      @JsonProperty("num_drivers") @JsonAlias("numDrivers") int numDrivers,
      @JsonProperty("heats") @JsonAlias("heats") List<CustomHeat> heats,
      @JsonProperty("description") @JsonAlias("description") String description) {
    this.numDrivers = numDrivers;
    this.heats = heats != null ? heats : new ArrayList<>();
    this.description = description != null ? description : "";
  }

  public int getNumDrivers() {
    return numDrivers;
  }

  public List<CustomHeat> getHeats() {
    return heats;
  }

  public String getDescription() {
    return description;
  }
}
