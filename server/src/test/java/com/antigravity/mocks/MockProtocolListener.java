package com.antigravity.mocks;

import java.util.ArrayList;
import java.util.List;

import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolListener;

public class MockProtocolListener implements ProtocolListener {
  public List<Double> laps = new ArrayList<>();
  public int lastLane;
  public double lastLapTime;
  public double lastSegmentTime;
  public com.antigravity.proto.InterfaceStatus lastStatus;

  @Override
  public void onLap(int lane, double lapTime, int interfaceId) {
    laps.add(lapTime);
    lastLane = lane;
    lastLapTime = lapTime;
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    lastLane = lane;
    lastSegmentTime = segmentTime;
  }

  @Override
  public void onCallbutton(int lane) {
  }

  @Override
  public void onInterfaceStatus(com.antigravity.proto.InterfaceStatus status) {
    lastStatus = status;
  }

  @Override
  public void onCarData(CarData carData) {
  }
}
