import { TrackmateConfig } from "@app/models/track";
import { ITrackmateConfig } from "@app/proto/antigravity";

export class TrackmateConfigConverter {
  static fromProto(proto: ITrackmateConfig): TrackmateConfig {
    return {
      name: proto.name || "Trackmate",
      commPort: proto.commPort || "",
      normallyClosedRelays: proto.normallyClosedRelays ?? true,
      normallyClosedLaneSensors: proto.normallyClosedLaneSensors ?? true,
      useIR: proto.useIr ?? true,
      debounce: proto.debounce || 1,
      numLanes: proto.numLanes || 8,
      hasPerLaneRelays: proto.hasPerLaneRelays ?? false,
      lapPinPitBehavior: proto.lapPinPitBehavior || 0,
      lapPinBehaviors: proto.lapPinBehaviors || [],
    };
  }

  static toProto(config: TrackmateConfig): ITrackmateConfig {
    return {
      name: config.name,
      commPort: config.commPort,
      normallyClosedRelays: config.normallyClosedRelays,
      normallyClosedLaneSensors: config.normallyClosedLaneSensors,
      useIr: config.useIR,
      debounce: config.debounce,
      numLanes: config.numLanes,
      hasPerLaneRelays: config.hasPerLaneRelays,
      lapPinPitBehavior: config.lapPinPitBehavior,
      lapPinBehaviors: config.lapPinBehaviors,
    };
  }
}
