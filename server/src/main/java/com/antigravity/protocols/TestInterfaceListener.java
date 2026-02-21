package com.antigravity.protocols;

import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.LapEvent;
import com.antigravity.proto.SegmentEvent;
import com.antigravity.race.ClientSubscriptionManager;

/**
 * Interface listener for testing interface protocols. This is used when the
 * client makes an initialize-interface call. This should mean a client is on
 * the track-editor page. This is NOT a unit test class and belongs in the main
 * source folder.
 */
public class TestInterfaceListener implements ProtocolListener {

  @Override
  public void onLap(int lane, double lapTime, int interfaceId) {
    InterfaceEvent event = InterfaceEvent.newBuilder()
        .setLap(LapEvent.newBuilder()
            .setLane(lane)
            .setLapTime(lapTime)
            .setInterfaceId(interfaceId)
            .build())
        .build();
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(event);
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    InterfaceEvent event = InterfaceEvent.newBuilder()
        .setSegment(SegmentEvent.newBuilder()
            .setLane(lane)
            .setSegmentTime(segmentTime)
            .setInterfaceId(interfaceId)
            .build())
        .build();
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(event);
  }

  @Override
  public void onCallbutton(int lane) {
    InterfaceEvent event = InterfaceEvent.newBuilder()
        .setCallbutton(com.antigravity.proto.CallbuttonEvent.newBuilder()
            .setLane(lane)
            .build())
        .build();
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(event);
  }

  @Override
  public void onInterfaceStatus(com.antigravity.proto.InterfaceStatus status) {
    InterfaceEvent event = InterfaceEvent.newBuilder()
        .setStatus(com.antigravity.proto.InterfaceStatusEvent.newBuilder()
            .setStatus(status)
            .build())
        .build();
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(event);
  }

  @Override
  public void onCarData(CarData carData) {
    throw new UnsupportedOperationException("Unimplemented method 'onCarData'");
  }
}
