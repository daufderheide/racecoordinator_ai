package com.antigravity.protocols;

public class CarData {
  private int lane;
  private double time;
  private double controllerThrottlePCT; // [0, 1]
  private double carThrottlePCT; // [0, 1]
  private boolean canRefuel;
  private CarLocation location;
  private CarLocation lastLocation;
  private int locationId;

  public CarData(int lane, double time, double controllerThrottlePCT, double carThrottlePCT, boolean canRefuel,
      CarLocation location, CarLocation lastLocation, int locationId) {
    this.lane = lane;
    this.time = time;
    this.controllerThrottlePCT = controllerThrottlePCT;
    this.carThrottlePCT = carThrottlePCT;
    this.canRefuel = canRefuel;
    this.location = location;
    this.lastLocation = lastLocation;
    this.locationId = locationId;
  }

  public int getLane() {
    return lane;
  }

  public double getTime() {
    return time;
  }

  public double getControllerThrottlePCT() {
    return controllerThrottlePCT;
  }

  public double getCarThrottlePCT() {
    return carThrottlePCT;
  }

  public boolean getCanRefuel() {
    return canRefuel;
  }

  public CarLocation getLocation() {
    return location;
  }

  public CarLocation getLastLocation() {
    return lastLocation;
  }

  public int getLocationId() {
    return locationId;
  }
}
