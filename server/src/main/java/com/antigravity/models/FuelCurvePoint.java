package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

public class FuelCurvePoint {

  @JsonProperty("x")
  private final double x;

  @JsonProperty("y")
  private final double y;

  public FuelCurvePoint() {
    this(0.0, 0.0);
  }

  @JsonCreator
  public FuelCurvePoint(@JsonProperty("x") double x, @JsonProperty("y") double y) {
    this.x = x;
    this.y = y;
  }

  public double getX() {
    return x;
  }

  public double getY() {
    return y;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    FuelCurvePoint that = (FuelCurvePoint) o;
    return Double.compare(that.x, x) == 0 && Double.compare(that.y, y) == 0;
  }

  @Override
  public int hashCode() {
    return Objects.hash(x, y);
  }

  @Override
  public String toString() {
    return "FuelCurvePoint{" + "x=" + x + ", y=" + y + '}';
  }
}
