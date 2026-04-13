package com.antigravity.protocols;

import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;

public interface ProtocolListener {

  void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex);

  void onSegment(int lane, double segmentTime, int interfaceId, int interfaceIndex);

  void onCallbutton(int lane, int interfaceIndex);

  void onInterfaceStatus(InterfaceStatus status, int interfaceIndex);

  void onCarData(CarData carData);

  void onInterfaceEvent(InterfaceEvent event);
}
