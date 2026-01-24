package com.antigravity.protocols;

public class PartialTime {
  private int laneIndex;
  private double lapTime;
  private double segmentTime;

  public PartialTime(int laneIndex, double lapTime, double segmentTime) {
    this.laneIndex = laneIndex;
    this.lapTime = lapTime;
    this.segmentTime = segmentTime;
  }

  public int getLaneIndex() {
    return laneIndex;
  }

  public double getLapTime() {
    return lapTime;
  }

  public double getSegmentTime() {
    return segmentTime;
  }
}
