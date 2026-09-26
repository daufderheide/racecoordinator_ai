import { CameraConfig } from "@app/models/camera_config";
import { ICameraInterfaceConfig } from "@app/proto/antigravity";

import { CameraConfigConverter } from "./camera_config.converter";

describe("CameraConfigConverter", () => {
  it("should convert from proto to model", () => {
    const proto: ICameraInterfaceConfig = {
      name: "Track Cam 1",
      interfaceIndex: 2,
      targetFps: 60,
      autoDetectLanes: true,
      connectionType: "remote",
      gates: [
        {
          laneIndex: 0,
          xPct: 0.1,
          yPct: 0.2,
          widthPct: 0.3,
          heightPct: 0.4,
          gateType: 0,
          sensitivity: 0.8,
        },
      ],
    };

    const model = CameraConfigConverter.fromProto(proto);
    expect(model.name).toBe("Track Cam 1");
    expect(model.interfaceIndex).toBe(2);
    expect(model.targetFps).toBe(60);
    expect(model.autoDetectLanes).toBe(true);
    expect(model.connectionType).toBe("remote");
    expect(model.gates.length).toBe(1);
    expect(model.gates[0].laneIndex).toBe(0);
    expect(model.gates[0].xPct).toBe(0.1);
    expect(model.gates[0].yPct).toBe(0.2);
    expect(model.gates[0].widthPct).toBe(0.3);
    expect(model.gates[0].heightPct).toBe(0.4);
    expect(model.gates[0].gateType).toBe(0);
    expect(model.gates[0].sensitivity).toBe(0.8);
  });

  it("should handle default values when proto fields are missing", () => {
    const proto: ICameraInterfaceConfig = {};
    const model = CameraConfigConverter.fromProto(proto);
    expect(model.name).toBe("Camera Interface");
    expect(model.interfaceIndex).toBe(0);
    expect(model.targetFps).toBe(60);
    expect(model.autoDetectLanes).toBe(false);
    expect(model.connectionType).toBe("local");
    expect(model.gates).toEqual([]);
  });

  it("should convert from model to proto", () => {
    const model: CameraConfig = {
      name: "My Cam",
      interfaceIndex: 1,
      targetFps: 30,
      autoDetectLanes: false,
      connectionType: "remote",
      gates: [
        {
          laneIndex: 1,
          xPct: 0.25,
          yPct: 0.35,
          widthPct: 0.45,
          heightPct: 0.55,
          gateType: 1,
          sensitivity: 0.6,
        },
      ],
    };

    const proto = CameraConfigConverter.toProto(model);
    expect(proto.name).toBe("My Cam");
    expect(proto.interfaceIndex).toBe(1);
    expect(proto.targetFps).toBe(30);
    expect(proto.autoDetectLanes).toBe(false);
    expect(proto.connectionType).toBe("remote");
    expect(proto.gates?.length).toBe(1);
    expect(proto.gates?.[0].laneIndex).toBe(1);
    expect(proto.gates?.[0].xPct).toBe(0.25);
    expect(proto.gates?.[0].yPct).toBe(0.35);
    expect(proto.gates?.[0].widthPct).toBe(0.45);
    expect(proto.gates?.[0].heightPct).toBe(0.55);
    expect(proto.gates?.[0].gateType).toBe(1);
    expect(proto.gates?.[0].sensitivity).toBe(0.6);
  });
});
