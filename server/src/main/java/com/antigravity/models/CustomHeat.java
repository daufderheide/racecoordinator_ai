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

  @JsonProperty("is_step_up_boundary")
  @JsonAlias({"isStepUpBoundary", "stepUpBoundary"})
  private final boolean isStepUpBoundary;

  @JsonProperty("step")
  private final int step;

  public CustomHeat() {
    this.driverIndices = new ArrayList<>();
    this.group = 0;
    this.isStepUpBoundary = false;
    this.step = 0;
  }

  public CustomHeat(List<Integer> driverIndices) {
    this(driverIndices, 0, false, 0);
  }

  public CustomHeat(List<Integer> driverIndices, Integer group) {
    this(driverIndices, group, false, 0);
  }

  @JsonCreator
  public CustomHeat(
      @JsonProperty("driver_indices") @JsonAlias("driverIndices") List<Integer> driverIndices,
      @JsonProperty("group") Integer group,
      @JsonProperty("is_step_up_boundary") @JsonAlias({"isStepUpBoundary", "stepUpBoundary"})
          Boolean isStepUpBoundary,
      @JsonProperty("step") Integer step) {
    this.driverIndices = driverIndices != null ? driverIndices : new ArrayList<>();
    this.group = group != null ? group : 0;
    this.isStepUpBoundary = isStepUpBoundary != null ? isStepUpBoundary : false;
    this.step = step != null ? step : 0;
  }

  public List<Integer> getDriverIndices() {
    return driverIndices;
  }

  public int getGroup() {
    return group;
  }

  @JsonProperty("is_step_up_boundary")
  public boolean isStepUpBoundary() {
    return isStepUpBoundary;
  }

  public int getStep() {
    return step;
  }
}
