package com.antigravity.mocks;

import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolListener;
import java.util.ArrayList;
import java.util.List;

public class MockProtocolListener implements ProtocolListener {

  public List<Double> laps = new ArrayList<>();
  public int lastLane;
  public double lastLapTime;
  public double lastSegmentTime;
  public InterfaceStatus lastStatus;
  public InterfaceEvent lastEvent;
  public List<MockSegment> segments = new ArrayList<>();
  public List<CarData> carData = new ArrayList<>();

  public static class MockSegment {

    public int lane;
    public double time;
    public int interfaceId;

    public MockSegment(int lane, double time, int interfaceId, int interfaceIndex) {
      this.lane = lane;
      this.time = time;
      this.interfaceId = interfaceId;
    }
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {
    laps.add(lapTime);
    lastLane = lane;
    lastLapTime = lapTime;
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId, int interfaceIndex) {
    lastLane = lane;
    lastSegmentTime = segmentTime;
    segments.add(new MockSegment(lane, segmentTime, interfaceId, interfaceIndex));
  }

  @Override
  public void onCallbutton(int lane, int interfaceIndex) {}

  @Override
  public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {
    lastStatus = status;
  }

  @Override
  public void onCarData(CarData data) {
    carData.add(data);
  }

  @Override
  public void onInterfaceEvent(InterfaceEvent event) {
    lastEvent = event;
  }
}
