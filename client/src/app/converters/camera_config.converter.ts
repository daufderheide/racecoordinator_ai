import { CameraConfig } from "@app/models/camera_config";
import { ICameraInterfaceConfig } from "@app/proto/antigravity";

export class CameraConfigConverter {
  static fromProto(proto: ICameraInterfaceConfig): CameraConfig {
    return {
      name: proto.name || "Camera Interface",
      interfaceIndex: proto.interfaceIndex ?? 0,
      targetFps: proto.targetFps || 60,
      autoDetectLanes: proto.autoDetectLanes ?? false,
      gates: (proto.gates || []).map((g) => ({
        laneIndex: g.laneIndex ?? 0,
        xPct: g.xPct ?? 0,
        yPct: g.yPct ?? 0,
        widthPct: g.widthPct ?? 0,
        heightPct: g.heightPct ?? 0,
        gateType: g.gateType ?? 0,
        sensitivity: g.sensitivity ?? 0.5,
      })),
      connectionType: (proto.connectionType as "local" | "remote") || "local",
    };
  }

  static toProto(config: CameraConfig): ICameraInterfaceConfig {
    return {
      name: config.name,
      interfaceIndex: config.interfaceIndex,
      targetFps: config.targetFps,
      autoDetectLanes: config.autoDetectLanes,
      gates: (config.gates || []).map((g) => ({
        laneIndex: g.laneIndex,
        xPct: g.xPct,
        yPct: g.yPct,
        widthPct: g.widthPct,
        heightPct: g.heightPct,
        gateType: g.gateType,
        sensitivity: g.sensitivity,
      })),
      connectionType: config.connectionType || "local",
    };
  }
}
