import { Lane } from "@app/models/lane";
import { Track } from "@app/models/track";

export class TrackEditorCrudHelper {
  static generateUniqueTrackName(
    baseName: string,
    allTracks: Track[],
    forceSuffix: boolean = false,
  ): string {
    let counter = forceSuffix ? 1 : 0;
    const pattern = /(_\d+)$/;
    const base = (baseName || "").replace(pattern, "").trim();

    while (true) {
      const candidate = counter === 0 ? base : `${base}_${counter}`;
      if (
        !allTracks.some(
          (t) => t.name && t.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  static buildTrackSavePayload(finalTrack: Track): any {
    return {
      ...finalTrack,
      "@id": 1,
      lanes: finalTrack.lanes.map((l, i) => ({
        ...l,
        "@id": i + 2,
      })),
    };
  }

  static createTrackFromFactory(
    factoryTrack: any,
    trackName: string,
    idGenerator: () => string,
  ): Track {
    return new Track({
      entity_id: "new",
      name: trackName,
      num_track_sections: factoryTrack.num_track_sections || 100,
      track_scale: factoryTrack.track_scale ?? 1.0,
      lanes: (factoryTrack.lanes || []).map(
        (l: any) =>
          new Lane(
            idGenerator(),
            l.foreground_color,
            l.background_color,
            l.length,
          ),
      ),
      has_digital_fuel: false,
      arduino_configs: factoryTrack.arduino_configs,
      has_per_lane_relays: factoryTrack.has_per_lane_relays || false,
      has_main_relay: factoryTrack.has_main_relay || false,
      trackmate_configs: factoryTrack.trackmate_configs,
      phidget_configs: factoryTrack.phidget_configs,
      bart_configs: factoryTrack.bart_configs,
    });
  }

  static createFallbackTrack(
    trackName: string,
    idGenerator: () => string,
  ): Track {
    return new Track({
      entity_id: "new",
      name: trackName,
      num_track_sections: 100,
      track_scale: 1.0,
      lanes: [
        new Lane(idGenerator(), "#ef4444", "black", 100),
        new Lane(idGenerator(), "#ffffff", "black", 100),
      ],
      has_digital_fuel: false,
    });
  }

  static getUnsavedTrackReasons(
    editingTrack: Track | undefined,
    trackName: string,
    isNameUnique: boolean,
    isSaving: boolean,
    isDirtyState: boolean,
  ): string[] {
    const reasons: string[] = [];
    if (!editingTrack) return reasons;

    const nameTrimmed = trackName?.trim() || "";
    if (!nameTrimmed) {
      reasons.push("DISCARD_REASON_TRACK_NAME_EMPTY");
    } else if (!isNameUnique) {
      reasons.push("DISCARD_REASON_TRACK_NAME_DUPLICATE");
    }

    if (isSaving) {
      reasons.push("DISCARD_REASON_SAVING");
    } else if (reasons.length === 0 && isDirtyState) {
      reasons.push("DISCARD_REASON_EXIT_TOO_QUICKLY");
    }

    return reasons;
  }
}
