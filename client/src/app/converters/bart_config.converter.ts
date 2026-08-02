import { BartConfig } from "@app/models/bart_config";
import { IBartConfig } from "@app/proto/antigravity";

export class BartConfigConverter {
  static fromProto(proto: IBartConfig): BartConfig {
    return {
      name: proto.name || "BART",
      deviceName: proto.deviceName || "BART_0001",
      deviceAddress: proto.deviceAddress || "",
      debounce: proto.debounce || 1,
      numLanes: proto.numLanes || 8,
      minLapMs: proto.minLapMs || 1000,
      lapPinPitBehavior: proto.lapPinPitBehavior || 0,
      lapPinBehaviors: proto.lapPinBehaviors || [],
    };
  }

  static toProto(config: BartConfig): IBartConfig {
    return {
      name: config.name,
      deviceName: config.deviceName,
      deviceAddress: config.deviceAddress,
      debounce: config.debounce,
      numLanes: config.numLanes,
      minLapMs: config.minLapMs,
      lapPinPitBehavior: config.lapPinPitBehavior,
      lapPinBehaviors: config.lapPinBehaviors,
    };
  }
}
