package com.antigravity.converters;

import com.antigravity.proto.CameraInterfaceConfig;
import com.antigravity.protocols.camera.CameraConfig;
import com.antigravity.protocols.camera.LaneDetectionGate;
import java.util.ArrayList;
import java.util.List;

public class CameraConfigConverter {

  public static CameraInterfaceConfig toProto(CameraConfig config) {
    if (config == null) {
      return CameraInterfaceConfig.getDefaultInstance();
    }
    CameraInterfaceConfig.Builder builder =
        CameraInterfaceConfig.newBuilder()
            .setName(config.name != null ? config.name : "")
            .setInterfaceIndex(config.interfaceIndex)
            .setTargetFps(config.targetFps)
            .setAutoDetectLanes(config.autoDetectLanes);

    if (config.gates != null) {
      for (LaneDetectionGate gate : config.gates) {
        if (gate != null) {
          builder.addGates(
              com.antigravity.proto.LaneDetectionGate.newBuilder() // fqn-collision
                  .setLaneIndex(gate.laneIndex)
                  .setXPct(gate.xPct)
                  .setYPct(gate.yPct)
                  .setWidthPct(gate.widthPct)
                  .setHeightPct(gate.heightPct)
                  .setGateType(gate.gateType)
                  .setSensitivity(gate.sensitivity)
                  .build());
        }
      }
    }
    return builder.build();
  }

  public static CameraConfig fromProto(CameraInterfaceConfig protoConfig) {
    if (protoConfig == null) {
      return null;
    }
    CameraConfig config = new CameraConfig();
    config.name = protoConfig.getName();
    config.interfaceIndex = protoConfig.getInterfaceIndex();
    config.targetFps = protoConfig.getTargetFps() > 0 ? protoConfig.getTargetFps() : 60;
    config.autoDetectLanes = protoConfig.getAutoDetectLanes();

    List<LaneDetectionGate> gates = new ArrayList<>();
    if (protoConfig.getGatesList() != null) {
      for (com.antigravity.proto.LaneDetectionGate g : // fqn-collision
          protoConfig.getGatesList()) {
        LaneDetectionGate gate = new LaneDetectionGate();
        gate.laneIndex = g.getLaneIndex();
        gate.xPct = g.getXPct();
        gate.yPct = g.getYPct();
        gate.widthPct = g.getWidthPct();
        gate.heightPct = g.getHeightPct();
        gate.gateType = g.getGateType();
        gate.sensitivity = g.getSensitivity();
        gates.add(gate);
      }
    }
    config.gates = gates;
    return config;
  }
}
