import { Track } from "@app/models/track";
import { ITrackModel } from "@app/proto/antigravity";

import { ArduinoConfigConverter } from "./arduino_config.converter";
import { ConverterCache } from "./converter_cache";
import { LaneConverter } from "./lane.converter";
import { TrackmateConfigConverter } from "./trackmate_config.converter";

export class TrackConverter {
  private static cache = new ConverterCache<Track>();

  static clearCache() {
    this.cache.clear();
  }

  static fromProto(proto: ITrackModel): Track {
    if (!proto) {
      return new Track("", "Unknown Track", 100, [], false, []);
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
        return new Track(
          objectId,
          proto.name || "Unknown Track",
          proto.numTrackSections || 100,
          lanes,
          proto.hasDigitalFuel ?? false,
          (proto.arduinoConfigs || []).map((ac) =>
            ArduinoConfigConverter.fromProto(ac),
          ),
          (proto.trackmateConfigs || []).map((tc) =>
            TrackmateConfigConverter.fromProto(tc),
          ),
        );
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
