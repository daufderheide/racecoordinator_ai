package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class SeasonScoring {

  @JsonProperty("position_points")
  private final List<Integer> positionPoints;

  @JsonProperty("heat_position_points")
  private final List<Integer> heatPositionPoints;

  public SeasonScoring() {
    // Default position points: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1
    this.positionPoints = new ArrayList<>(Arrays.asList(25, 18, 15, 12, 10, 8, 6, 4, 2, 1));
    // Default heat position points (e.g. 4 lanes): 3, 2, 1, 0
    this.heatPositionPoints = new ArrayList<>(Arrays.asList(3, 2, 1, 0));
  }

  @JsonCreator
  public SeasonScoring(
      @JsonProperty("position_points") List<Integer> positionPoints,
      @JsonProperty("heat_position_points") List<Integer> heatPositionPoints) {
    this.positionPoints =
        positionPoints != null
            ? new ArrayList<>(positionPoints)
            : new ArrayList<>(Arrays.asList(25, 18, 15, 12, 10, 8, 6, 4, 2, 1));
    this.heatPositionPoints =
        heatPositionPoints != null
            ? new ArrayList<>(heatPositionPoints)
            : new ArrayList<>(Arrays.asList(3, 2, 1, 0));
  }

  public List<Integer> getPositionPoints() {
    return new ArrayList<>(positionPoints);
  }

  public List<Integer> getHeatPositionPoints() {
    return new ArrayList<>(heatPositionPoints);
  }
}
