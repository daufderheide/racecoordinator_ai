import { PhidgetConfig } from "@app/models/track";
import { IPhidgetConfig } from "@app/proto/antigravity";

export class PhidgetConfigConverter {
  static fromProto(proto: IPhidgetConfig): PhidgetConfig {
    const voltageConfigs: { [lane: number]: number } = {};
    if (proto.voltageConfigs) {
      for (const vc of proto.voltageConfigs) {
        if (vc.lane != null && vc.maxVoltage != null) {
          voltageConfigs[vc.lane] = vc.maxVoltage;
        }
      }
    }

    return {
      name: proto.name || "Phidget",
      serialNumber: proto.serialNumber || 0,
      isHubPort: proto.isHubPort ?? false,
      hubPort: proto.hubPort || 0,
      debounceUs: proto.debounceUs || 0,
      normallyClosedLaneSensors: proto.normallyClosedLaneSensors ?? false,
      normallyClosedRelays: proto.normallyClosedRelays ?? false,
      useLapsForPits: proto.useLapsForPits || 0,
      useLapsForPitEnd: proto.useLapsForPitEnd || 0,
      usePitsAsLaps: proto.usePitsAsLaps ?? false,
      useLapsForSegments: proto.useLapsForSegments ?? false,
      lapPinPitBehavior: proto.lapPinPitBehavior || 0,
      digitalInIds: proto.digitalInIds || [],
      digitalOutIds: proto.digitalOutIds || [],
      analogIds: proto.analogIds || [],
      voltageConfigs: voltageConfigs,
    };
  }

  static toProto(config: PhidgetConfig): IPhidgetConfig {
    return {
      name: config.name,
      serialNumber: config.serialNumber,
      isHubPort: config.isHubPort,
      hubPort: config.hubPort,
      debounceUs: config.debounceUs,
      normallyClosedLaneSensors: config.normallyClosedLaneSensors,
      normallyClosedRelays: config.normallyClosedRelays,
      useLapsForPits: config.useLapsForPits,
      useLapsForPitEnd: config.useLapsForPitEnd,
      usePitsAsLaps: config.usePitsAsLaps,
      useLapsForSegments: config.useLapsForSegments,
      lapPinPitBehavior: config.lapPinPitBehavior,
      digitalInIds: config.digitalInIds || [],
      digitalOutIds: config.digitalOutIds || [],
      analogIds: config.analogIds || [],
      voltageConfigs: Object.entries(config.voltageConfigs || {}).map(
        ([lane, maxVoltage]) => ({
          lane: parseInt(lane, 10),
          maxVoltage: maxVoltage as number,
        }),
      ),
    };
  }
}
