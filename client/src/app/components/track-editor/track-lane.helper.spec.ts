import { Lane } from "@app/models/lane";
import { ArduinoConfig } from "@app/models/track";

import { TrackLaneHelper } from "./track-lane.helper";

describe("TrackLaneHelper", () => {
  describe("normalizeTrackScale", () => {
    it("should return preset scale if within epsilon", () => {
      expect(TrackLaneHelper.normalizeTrackScale(1 / 64)).toBeCloseTo(1 / 64);
      expect(TrackLaneHelper.normalizeTrackScale(1 / 32)).toBeCloseTo(1 / 32);
    });

    it("should fallback to 1.0 for invalid scales", () => {
      expect(TrackLaneHelper.normalizeTrackScale(undefined)).toBe(1.0);
      expect(TrackLaneHelper.normalizeTrackScale(null as any)).toBe(1.0);
      expect(TrackLaneHelper.normalizeTrackScale(NaN)).toBe(1.0);
      expect(TrackLaneHelper.normalizeTrackScale(0)).toBe(1.0);
      expect(TrackLaneHelper.normalizeTrackScale(-0.5)).toBe(1.0);
      expect(TrackLaneHelper.normalizeTrackScale(1.5)).toBe(1.0);
    });

    it("should return valid custom scale if not matched to preset", () => {
      expect(TrackLaneHelper.normalizeTrackScale(0.75)).toBe(0.75);
    });
  });

  describe("createDefaultLane", () => {
    it("should create lane with default values", () => {
      const lane = TrackLaneHelper.createDefaultLane("l-1");
      expect(lane.entity_id).toBe("l-1");
      expect(lane.foreground_color).toBe("black");
      expect(lane.background_color).toBe("#ffffff");
      expect(lane.length).toBe(100);
    });

    it("should accept custom values", () => {
      const lane = TrackLaneHelper.createDefaultLane(
        "l-2",
        "yellow",
        "blue",
        45,
      );
      expect(lane.foreground_color).toBe("yellow");
      expect(lane.background_color).toBe("blue");
      expect(lane.length).toBe(45);
    });
  });

  describe("updateLaneLength", () => {
    it("should update lane length with number or string", () => {
      const lanes = [new Lane("l1", "w", "b", 10)];
      const updated = TrackLaneHelper.updateLaneLength(lanes, 0, 25.5);
      expect(updated[0].length).toBe(25.5);

      const updatedStr = TrackLaneHelper.updateLaneLength(lanes, 0, "30");
      expect(updatedStr[0].length).toBe(30);

      const updatedNan = TrackLaneHelper.updateLaneLength(lanes, 0, "invalid");
      expect(updatedNan[0].length).toBe(0);
    });
  });

  describe("updateLaneBackgroundColor & updateLaneForegroundColor", () => {
    it("should update background color and sync with arduino led overrides", () => {
      const lanes = [new Lane("l1", "white", "black", 10)];
      const arduinoConfigs: ArduinoConfig[] = [
        {
          ledStrings: [
            {
              ledLaneColorOverrides: ["black", "yellow"],
            } as any,
          ],
        } as any,
      ];

      const updated = TrackLaneHelper.updateLaneBackgroundColor(
        lanes,
        0,
        "#ff0000",
        arduinoConfigs,
      );

      expect(updated[0].background_color).toBe("#ff0000");
      expect(arduinoConfigs[0].ledStrings![0].ledLaneColorOverrides![0]).toBe(
        "#ff0000",
      );
    });

    it("should update foreground color", () => {
      const lanes = [new Lane("l1", "white", "black", 10)];
      const updated = TrackLaneHelper.updateLaneForegroundColor(
        lanes,
        0,
        "#00ff00",
      );
      expect(updated[0].foreground_color).toBe("#00ff00");
    });
  });
});
