package com.antigravity.race;

import com.antigravity.models.Car;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** The car one team driver uses when a team races with a car per driver (#1210). */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ParticipantDriverCar {
  private String driverId;
  private Car car;

  public ParticipantDriverCar() {}

  public ParticipantDriverCar(String driverId, Car car) {
    this.driverId = driverId;
    this.car = car;
  }

  public String getDriverId() {
    return driverId;
  }

  public void setDriverId(String driverId) {
    this.driverId = driverId;
  }

  public Car getCar() {
    return car;
  }

  public void setCar(Car car) {
    this.car = car;
  }
}
