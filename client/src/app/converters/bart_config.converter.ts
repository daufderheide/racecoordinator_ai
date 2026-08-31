import { BartConfig } from "@app/models/bart_config";
import { IBartConfig } from "@app/proto/antigravity";

export class BartConfigConverter {
  static fromProto(proto: IBartConfig): BartConfig {
    return {
      name: proto.name || "BART",
      deviceName: proto.deviceName || "",
      deviceAddress: proto.deviceAddress || "",
      numLanes: proto.numLanes || 8,
      minLapMs: proto.minLapMs != null ? proto.minLapMs : 1,
      lapPinPitBehavior: proto.lapPinPitBehavior ?? 3,
      lapPinBehaviors: proto.lapPinBehaviors || [],
    };
  }

  static toProto(config: BartConfig): IBartConfig {
    return {
      name: config.name,
      deviceName: config.deviceName,
      deviceAddress: config.deviceAddress,
      numLanes: config.numLanes,
      minLapMs: config.minLapMs,
      lapPinPitBehavior: config.lapPinPitBehavior,
      lapPinBehaviors: config.lapPinBehaviors,
    };
  }
}
