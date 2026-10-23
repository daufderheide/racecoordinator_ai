import { Lane } from "@app/models/lane";
import { ArduinoConfig } from "@app/models/track";

export const TRACK_SCALE_OPTIONS = [
  { label: "1/87", value: 1 / 87 },
  { label: "1/64", value: 1 / 64 },
  { label: "1/43", value: 1 / 43 },
  { label: "1/32", value: 1 / 32 },
  { label: "1/24", value: 1 / 24 },
  { label: "1/1", value: 1.0 },
];

export class TrackLaneHelper {
  static normalizeTrackScale(scale: number | undefined): number {
    if (
      scale === undefined ||
      scale === null ||
      isNaN(scale) ||
      scale <= 0 ||
      scale > 1.0
    ) {
      return 1.0;
    }
    const matched = TRACK_SCALE_OPTIONS.find(
      (opt) => Math.abs(opt.value - scale) < 0.0001,
    );
    return matched ? matched.value : scale;
  }

  static createDefaultLane(
    id: string,
    foregroundColor: string = "black",
    backgroundColor: string = "#ffffff",
    length: number = 100,
  ): Lane {
    return new Lane(id, foregroundColor, backgroundColor, length);
  }

  static updateLaneLength(lanes: Lane[], index: number, length: any): Lane[] {
    const val = typeof length === "number" ? length : parseFloat(length);
    const parsedVal = isNaN(val) ? 0 : val;
    const updated = [...lanes];
    const l = updated[index];
    if (l) {
      updated[index] = new Lane(
        l.entity_id,
        l.foreground_color,
        l.background_color,
        parsedVal,
      );
    }
    return updated;
  }

  static updateLaneBackgroundColor(
    lanes: Lane[],
    index: number,
    color: string,
    arduinoConfigs?: ArduinoConfig[],
  ): Lane[] {
    const updated = [...lanes];
    const l = updated[index];
    if (l) {
      updated[index] = new Lane(
        l.entity_id,
        l.foreground_color,
        color,
        l.length,
      );
    }

    arduinoConfigs?.forEach((config) => {
      config.ledStrings?.forEach((ls) => {
        if (
          ls.ledLaneColorOverrides &&
          ls.ledLaneColorOverrides.length > index
        ) {
          ls.ledLaneColorOverrides[index] = color;
        }
      });
    });

    return updated;
  }

  static updateLaneForegroundColor(
    lanes: Lane[],
    index: number,
    color: string,
  ): Lane[] {
    const updated = [...lanes];
    const l = updated[index];
    if (l) {
      updated[index] = new Lane(
        l.entity_id,
        color,
        l.background_color,
        l.length,
      );
    }
    return updated;
  }
}
