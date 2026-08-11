package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class CustomHeat {
  @JsonProperty("driver_indices")
  @JsonAlias("driverIndices")
  private final List<Integer> driverIndices;

  @JsonProperty("group")
  private final int group;

  public CustomHeat() {
    this.driverIndices = new ArrayList<>();
    this.group = 0;
  }

  public CustomHeat(List<Integer> driverIndices) {
    this(driverIndices, 0);
  }

  @JsonCreator
  public CustomHeat(
      @JsonProperty("driver_indices") @JsonAlias("driverIndices") List<Integer> driverIndices,
      @JsonProperty("group") Integer group) {
    this.driverIndices = driverIndices != null ? driverIndices : new ArrayList<>();
    this.group = group != null ? group : 0;
  }

  public List<Integer> getDriverIndices() {
    return driverIndices;
  }

  public int getGroup() {
    return group;
  }
}
