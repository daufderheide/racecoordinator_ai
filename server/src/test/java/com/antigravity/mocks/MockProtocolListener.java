package com.antigravity.mocks;

import java.util.ArrayList;
import java.util.List;

import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolListener;

public class MockProtocolListener implements ProtocolListener {
  public List<Double> laps = new ArrayList<>();

  @Override
  public void onLap(int lane, double lapTime) {
    laps.add(lapTime);
  }

  @Override
  public void onSegment(int lane, double segmentTime) {
  }

  @Override
  public void onCarData(CarData carData) {
  }
}
