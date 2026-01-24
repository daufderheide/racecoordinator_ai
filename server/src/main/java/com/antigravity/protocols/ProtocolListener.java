package com.antigravity.protocols;

public interface ProtocolListener {
    void onLap(int lane, double lapTime);

    void onSegment(int lane, double segmentTime);

    void onCarData(CarData carData);
}
