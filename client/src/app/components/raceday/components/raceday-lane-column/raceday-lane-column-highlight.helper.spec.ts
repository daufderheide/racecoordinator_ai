import {
  HighlightLapStyle,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  isLaneColumnHighlighted,
  resolveLaneColumnHighlightLapStyle,
} from "./raceday-lane-column-highlight.helper";

describe("raceday-lane-column-highlight.helper", () => {
  describe("resolveLaneColumnHighlightLapStyle", () => {
    it("should return settings.highlightLapStyle if defined", () => {
      const settings = {
        highlightLapStyle: "subtle" as HighlightLapStyle,
      } as LaneColumnWidgetSettings;
      expect(resolveLaneColumnHighlightLapStyle(settings, null)).toBe("subtle");
    });

    it("should return none if highlightRowOnLap is false", () => {
      const settings = { highlightRowOnLap: false } as LaneColumnWidgetSettings;
      expect(resolveLaneColumnHighlightLapStyle(settings, null)).toBe("none");
    });

    it("should return parent highlightLapStyle or default full-glow for driver station", () => {
      const settings = {} as LaneColumnWidgetSettings;
      expect(
        resolveLaneColumnHighlightLapStyle(settings, { isDriverStation: true }),
      ).toBe("full-glow");
      expect(
        resolveLaneColumnHighlightLapStyle(settings, {
          isDriverStation: true,
          highlightLapStyle: "pulse",
        }),
      ).toBe("pulse");
    });

    it("should return parent highlightLapStyle or classic for standard display", () => {
      const settings = {} as LaneColumnWidgetSettings;
      expect(resolveLaneColumnHighlightLapStyle(settings, {})).toBe("classic");
      expect(
        resolveLaneColumnHighlightLapStyle(settings, {
          highlightLapStyle: "banner",
        }),
      ).toBe("banner");
    });
  });

  describe("isLaneColumnHighlighted", () => {
    const settings = { highlightRowOnLap: true } as LaneColumnWidgetSettings;

    it("should return false if isHeaderWidget is true", () => {
      expect(
        isLaneColumnHighlighted(settings, true, "classic", undefined, null),
      ).toBeFalse();
    });

    it("should return false if highlightLapStyle is none or highlightRowOnLap is false", () => {
      expect(
        isLaneColumnHighlighted(settings, false, "none", undefined, null),
      ).toBeFalse();
      expect(
        isLaneColumnHighlighted(
          { highlightRowOnLap: false } as LaneColumnWidgetSettings,
          false,
          "classic",
          undefined,
          null,
        ),
      ).toBeFalse();
    });

    it("should return true if targetDriver objectId is highlighted", () => {
      const targetDriver = { objectId: "d1" } as DriverHeatData;
      const parent = { highlightedDrivers: new Set(["d1"]) };
      expect(
        isLaneColumnHighlighted(
          settings,
          false,
          "classic",
          targetDriver,
          parent,
        ),
      ).toBeTrue();
    });

    it("should return true if targetDriver participant objectId is highlighted", () => {
      const targetDriver = {
        participant: { objectId: "p1" },
      } as DriverHeatData;
      const parent = { highlightedDrivers: new Set(["p1"]) };
      expect(
        isLaneColumnHighlighted(
          settings,
          false,
          "classic",
          targetDriver,
          parent,
        ),
      ).toBeTrue();
    });

    it("should return true if targetDriver actualDriver entity_id is highlighted", () => {
      const targetDriver = {
        actualDriver: { entity_id: "e1" },
      } as DriverHeatData;
      const parent = { highlightedDrivers: new Set(["e1"]) };
      expect(
        isLaneColumnHighlighted(
          settings,
          false,
          "classic",
          targetDriver,
          parent,
        ),
      ).toBeTrue();
    });

    it("should return true if targetDriver driver entity_id is highlighted", () => {
      const targetDriver = { driver: { entity_id: "e2" } } as DriverHeatData;
      const parent = { highlightedDrivers: new Set(["e2"]) };
      expect(
        isLaneColumnHighlighted(
          settings,
          false,
          "classic",
          targetDriver,
          parent,
        ),
      ).toBeTrue();
    });

    it("should check driver station host driver match when activeLaneIndex is set", () => {
      const hostDriver = {
        laneIndex: 1,
        objectId: "host1",
        participant: { objectId: "host_p1" },
        actualDriver: { entity_id: "host_e1" },
      } as DriverHeatData;
      const parent = {
        isDriverStation: true,
        activeLaneIndex: 1,
        sortedHeatDrivers: [hostDriver],
        highlightedDrivers: new Set(["host1"]),
      };
      expect(
        isLaneColumnHighlighted(settings, false, "classic", undefined, parent),
      ).toBeTrue();

      parent.highlightedDrivers = new Set(["host_p1"]);
      expect(
        isLaneColumnHighlighted(settings, false, "classic", undefined, parent),
      ).toBeTrue();

      parent.highlightedDrivers = new Set(["host_e1"]);
      expect(
        isLaneColumnHighlighted(settings, false, "classic", undefined, parent),
      ).toBeTrue();
    });

    it("should return false if no drivers match highlighted set", () => {
      const targetDriver = { objectId: "d9" } as DriverHeatData;
      const parent = { highlightedDrivers: new Set(["d1"]) };
      expect(
        isLaneColumnHighlighted(
          settings,
          false,
          "classic",
          targetDriver,
          parent,
        ),
      ).toBeFalse();
    });
  });
});
