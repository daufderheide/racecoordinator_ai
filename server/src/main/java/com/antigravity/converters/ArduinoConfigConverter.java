package com.antigravity.converters;

import com.antigravity.protocols.arduino.ArduinoConfig;
import java.util.ArrayList;

public class ArduinoConfigConverter {
  public static ArduinoConfig fromProto(com.antigravity.proto.ArduinoConfig proto) {
    return new ArduinoConfig(
        proto.getName(),
        proto.getCommPort(),
        proto.getBaudRate(),
        proto.getDebounceUs(),
        proto.getHardwareType(),
        proto.getGlobalInvertLanes(),
        proto.getNormallyClosedRelays(),
        proto.getGlobalInvertLights(),
        proto.getUsePitsAsLaps(),
        proto.getUseLapsForSegments(),
        ArduinoConfig.LapPinPitBehavior.values()[proto.getLapPinPitBehaviorValue()],
        new ArrayList<>(proto.getDigitalIdsList()),
        new ArrayList<>(proto.getAnalogIdsList()),
        null, // ledStrings - excluded as per request
        new ArrayList<>(proto.getLedLaneColorOverridesList()));
  }
}
