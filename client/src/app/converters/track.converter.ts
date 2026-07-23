import { Track } from "@app/models/track";
import { ITrackModel } from "@app/proto/antigravity";

import { ArduinoConfigConverter } from "./arduino_config.converter";
import { ConverterCache } from "./converter_cache";
import { LaneConverter } from "./lane.converter";
import { PhidgetConfigConverter } from "./phidget_config.converter";
import { TrackmateConfigConverter } from "./trackmate_config.converter";

export class TrackConverter {
  private static cache = new ConverterCache<Track>();

  static clearCache() {
    this.cache.clear();
  }

  static fromProto(proto: ITrackModel): Track {
    if (!proto) {
      return new Track({
        entity_id: "",
        name: "Unknown Track",
        num_track_sections: 100,
        lanes: [],
        has_digital_fuel: false,
        arduino_configs: [],
        phidget_configs: [],
      });
    }
    const objectId = proto.model?.entityId || "";
    const isReference =
      (!proto.lanes || proto.lanes.length === 0) && !!objectId;

    if (isReference) {
      const cached = this.cache.get(objectId);
      if (cached) return cached;
      // If reference fails, we fall through to process which might return a fallback
    }

    return this.cache.process(
      objectId,
      isReference,
      () => {
        const lanes = (proto.lanes || []).map((l) =>
          LaneConverter.fromProto(l),
        );
        return new Track({
          entity_id: objectId,
          name: proto.name || "Unknown Track",
          num_track_sections: proto.numTrackSections || 100,
          lanes: lanes,
          has_digital_fuel: proto.hasDigitalFuel ?? false,
          arduino_configs: (proto.arduinoConfigs || []).map((ac) =>
            ArduinoConfigConverter.fromProto(ac),
          ),
          has_per_lane_relays: proto.hasPerLaneRelays ?? false,
          has_main_relay: proto.hasMainRelay ?? false,
          trackmate_configs: (proto.trackmateConfigs || []).map((tc) =>
            TrackmateConfigConverter.fromProto(tc),
          ),
          phidget_configs: (proto.phidgetConfigs || []).map((pc) =>
            PhidgetConfigConverter.fromProto(pc),
          ),
        });
      },
      () => {
        if (!proto.lanes && !isReference) {
          throw new Error(
            "TrackConverter: proto.lanes is missing for full Track",
          );
        }
      },
    );
  }
}
