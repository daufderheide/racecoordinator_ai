package com.antigravity.protocols;

public interface ProtocolListener {
    void onLap(int lane, double lapTime, int interfaceId);

    void onSegment(int lane, double segmentTime, int interfaceId);

    void onInterfaceStatus(com.antigravity.proto.InterfaceStatus status);

    void onCarData(CarData carData);
}
