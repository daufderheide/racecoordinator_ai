import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  buildSyntheticInsetWidgetInputs,
  buildSyntheticMainWidgetInputs,
  formatAdjustedLapValue,
  getInsetDefaultAlignment,
  isCustomWidgetKey,
  isOverallDataSource,
  isParentRaceOver,
  resolveColumnHeaderLabel,
  resolveOverallGridDriver,
} from "./raceday-lane-column.utils";

describe("raceday-lane-column.utils", () => {
  describe("isCustomWidgetKey", () => {
    it("should return true for keys starting with custom:", () => {
      expect(isCustomWidgetKey("custom:fuel-gauge")).toBeTrue();
      expect(isCustomWidgetKey("custom:")).toBeTrue();
    });

    it("should return false for standard column keys or empty string", () => {
      expect(isCustomWidgetKey("bestLapTime")).toBeFalse();
      expect(isCustomWidgetKey("")).toBeFalse();
      expect(isCustomWidgetKey(undefined)).toBeFalse();
    });
  });

  describe("buildSyntheticMainWidgetInputs", () => {
    it("should construct synthetic inputs with showHeader: false and targetIndex", () => {
      const widget: any = {
        id: "w1",
        widgetType: "lane-column",
        customSettings: {
          testParam: 42,
        },
      };

      const result = buildSyntheticMainWidgetInputs(
        "custom:my-widget",
        widget,
        "lane",
        3,
        { parentProp: true },
        false,
      );

      expect(result.widget.id).toBe("w1-main");
      expect(result.widget.widgetType).toBe("custom:my-widget" as any);
      expect(result.widget.customSettings?.["showHeader"]).toBeFalse();
      expect(result.widget.customSettings?.["bindingMode"]).toBe("lane");
      expect(result.widget.customSettings?.["gridLane"]).toBe(3);
      expect(result.widget.customSettings?.["targetIndex"]).toBe(4);
      expect(result.widget.customSettings?.["testParam"]).toBe(42);
      expect(result.parent.parentProp).toBeTrue();
      expect(result.isCustomizing).toBeFalse();
    });

    it("should pass targetDriver, laneForegroundColor, and laneBackgroundColor into customSettings", () => {
      const widget: any = {
        id: "w1",
        widgetType: "lane-column",
        customSettings: {},
      };
      const mockDriver = { name: "Driver 2", laneIndex: 2 };

      const result = buildSyntheticMainWidgetInputs(
        "custom:advanced-laps",
        widget,
        "lane",
        0,
        null,
        false,
        mockDriver,
        "#000000",
        "#3b82f6",
      );

      expect(result.widget.customSettings?.["targetDriver"]).toBe(mockDriver);
      expect(result.widget.customSettings?.["laneForegroundColor"]).toBe(
        "#000000",
      );
      expect(result.widget.customSettings?.["laneBackgroundColor"]).toBe(
        "#3b82f6",
      );
    });

    it("should handle null widget gracefully", () => {
      const result = buildSyntheticMainWidgetInputs(
        "custom:fallback",
        null,
        "position",
        0,
        null,
        true,
      );

      expect(result.widget.id).toBe("lane-col-main");
      expect(result.widget.widgetType).toBe("custom:fallback" as any);
      expect(result.widget.customSettings?.["showHeader"]).toBeFalse();
      expect(result.widget.customSettings?.["gridLane"]).toBe(0);
      expect(result.isCustomizing).toBeTrue();
    });
  });

  describe("buildSyntheticInsetWidgetInputs", () => {
    it("should construct synthetic inset inputs with insetsConfig overrides", () => {
      const widget: any = {
        id: "w1",
        customSettings: {
          insetsConfig: {
            "top-right": {
              customProp: "inset-val",
            },
          },
        },
      };

      const result = buildSyntheticInsetWidgetInputs(
        "top-right",
        "custom:inset-widget",
        widget,
        "lane",
        1,
        14,
        null,
        false,
      );

      expect(result.widget.id).toBe("w1-inset-top-right");
      expect(result.widget.widgetType).toBe("custom:inset-widget" as any);
      expect(result.widget.customSettings?.["customProp"]).toBe("inset-val");
      expect(result.widget.customSettings?.["showHeader"]).toBeFalse();
      expect(result.widget.customSettings?.["valueFontSize"]).toBe(14);
      expect(result.widget.customSettings?.["gridLane"]).toBe(1);
      expect(result.widget.customSettings?.["decimalPlaces"]).toBe(2);
      expect(result.widget.customSettings?.["lapDecimalPlaces"]).toBe(2);
      expect(result.widget.customSettings?.["valueAlignment"]).toBe("right");
    });

    it("should inherit parent insetLapDecimalPlaces when anchor decimals are omitted", () => {
      const widget: any = {
        id: "w-parent",
        customSettings: {
          insetLapDecimalPlaces: 3,
          insetTimeDecimalPlaces: 1,
          insetsConfig: {
            "bottom-right": {
              mode: "overall",
            },
          },
        },
      };

      const result = buildSyntheticInsetWidgetInputs(
        "bottom-right",
        "custom:dopamine:advanced-laps",
        widget,
        "lane",
        0,
        18,
        null,
        false,
      );

      expect(result.widget.customSettings?.["decimalPlaces"]).toBe(3);
      expect(result.widget.customSettings?.["lapDecimalPlaces"]).toBe(3);
      expect(result.widget.customSettings?.["insetLapDecimalPlaces"]).toBe(3);
      expect(result.widget.customSettings?.["insetTimeDecimalPlaces"]).toBe(1);
      expect(result.widget.customSettings?.["valueAlignment"]).toBe("right");
    });

    it("should honor explicit valueAlignment in insetsConfig", () => {
      const widget: any = {
        id: "w-align",
        customSettings: {
          insetsConfig: {
            "top-left": {
              valueAlignment: "center",
            },
          },
        },
      };

      const result = buildSyntheticInsetWidgetInputs(
        "top-left",
        "custom:dopamine:advanced-laps",
        widget,
        "lane",
        0,
        18,
        null,
        false,
      );

      expect(result.widget.customSettings?.["valueAlignment"]).toBe("center");
    });

    it("should prioritize anchorCfg.decimalPlaces or lapDecimalPlaces over parent insetLapDecimalPlaces", () => {
      const widget: any = {
        id: "w-override",
        customSettings: {
          insetLapDecimalPlaces: 3,
          insetsConfig: {
            "bottom-right": {
              mode: "overall",
              decimalPlaces: 0,
            },
          },
        },
      };

      const result = buildSyntheticInsetWidgetInputs(
        "bottom-right",
        "custom:dopamine:advanced-laps",
        widget,
        "lane",
        0,
        18,
        null,
        false,
      );

      expect(result.widget.customSettings?.["decimalPlaces"]).toBe(0);
      expect(result.widget.customSettings?.["lapDecimalPlaces"]).toBe(0);
    });

    it("should pass targetDriver, laneForegroundColor, and laneBackgroundColor into customSettings", () => {
      const widget: any = {
        id: "w-colors",
        customSettings: {},
      };
      const mockDriver = { name: "Driver 1", laneIndex: 1 };

      const result = buildSyntheticInsetWidgetInputs(
        "bottom-right",
        "custom:advanced-laps",
        widget,
        "overallPosition",
        1,
        14,
        null,
        false,
        mockDriver,
        "#000000",
        "#ffffff",
      );

      expect(result.widget.customSettings?.["targetDriver"]).toBe(mockDriver);
      expect(result.widget.customSettings?.["laneForegroundColor"]).toBe(
        "#000000",
      );
      expect(result.widget.customSettings?.["laneBackgroundColor"]).toBe(
        "#ffffff",
      );
    });
  });

  describe("getInsetDefaultAlignment", () => {
    it("should return left for left-positioned anchors", () => {
      expect(getInsetDefaultAlignment("top-left")).toBe("left");
      expect(getInsetDefaultAlignment("center-left")).toBe("left");
      expect(getInsetDefaultAlignment("bottom-left")).toBe("left");
    });

    it("should return right for right-positioned anchors", () => {
      expect(getInsetDefaultAlignment("top-right")).toBe("right");
      expect(getInsetDefaultAlignment("center-right")).toBe("right");
      expect(getInsetDefaultAlignment("bottom-right")).toBe("right");
    });

    it("should return center for center-positioned anchors", () => {
      expect(getInsetDefaultAlignment("top-center")).toBe("center");
      expect(getInsetDefaultAlignment("bottom-center")).toBe("center");
    });
  });

  describe("resolveColumnHeaderLabel", () => {
    it("should resolve custom widget label from service manifest", () => {
      const mockParent = {
        customWidgetService: {
          getWidgetDefinition: (key: string) => {
            if (key === "custom:fuel") {
              return { manifest: { name: "Fuel Gauge" } };
            }
            return null;
          },
        },
      } as any;

      const label = resolveColumnHeaderLabel(
        "custom:fuel",
        {} as any,
        mockParent,
        (k) => k,
      );
      expect(label).toBe("Fuel Gauge");

      const fallbackLabel = resolveColumnHeaderLabel(
        "custom:unknown_widget",
        {} as any,
        mockParent,
        (k) => k,
      );
      expect(fallbackLabel).toBe("unknown_widget");
    });

    it("should resolve customLabel if specified", () => {
      const label = resolveColumnHeaderLabel(
        "bestLapTime",
        { customLabel: "My Best Lap" } as any,
        {},
        (k) => k,
      );
      expect(label).toBe("My Best Lap");
    });
  });

  describe("formatAdjustedLapValue", () => {
    it("should return -- if raw is null", () => {
      expect(formatAdjustedLapValue(null, {} as any, "lapCount")).toBe("--");
    });

    it("should return raw value when no autoCalculatedLaps", () => {
      const hd: any = { autoCalculatedLaps: 0, isFinished: false };
      expect(formatAdjustedLapValue(10, hd, "lapCount")).toBe("10");
    });

    it("should adjust lap value when autoCalculatedLaps > 0 and not finished", () => {
      const hd: any = { autoCalculatedLaps: 2, isFinished: false };
      expect(formatAdjustedLapValue(10, hd, "lapCount")).toBe("8");
    });
  });

  describe("isParentRaceOver", () => {
    it("should return false if parent is undefined", () => {
      expect(isParentRaceOver(undefined)).toBeFalse();
    });

    it("should prioritize parent.isRaceOver() if defined", () => {
      expect(isParentRaceOver({ isRaceOver: () => true })).toBeTrue();
      expect(isParentRaceOver({ isRaceOver: () => false })).toBeFalse();
    });

    it("should check parent.raceState", () => {
      expect(isParentRaceOver({ raceState: RaceState.RACE_OVER })).toBeTrue();
      expect(isParentRaceOver({ raceState: RaceState.RACING })).toBeFalse();
    });

    it("should check parent.race.raceState", () => {
      expect(
        isParentRaceOver({ race: { raceState: RaceState.RACE_OVER } }),
      ).toBeTrue();
      expect(
        isParentRaceOver({ race: { raceState: RaceState.RACING } }),
      ).toBeFalse();
    });

    it("should check parent.raceService.getRace().raceState", () => {
      expect(
        isParentRaceOver({
          raceService: { getRace: () => ({ raceState: RaceState.RACE_OVER }) },
        }),
      ).toBeTrue();
    });
  });

  describe("isOverallDataSource", () => {
    it("should return true when gridType is overall", () => {
      expect(isOverallDataSource({ gridType: "overall" } as any)).toBeTrue();
    });

    it("should return true when parent gridSession has gridType overall", () => {
      const parent = { gridSession: () => ({ gridType: "overall" }) };
      expect(
        isOverallDataSource({ gridId: "grid-1" } as any, parent),
      ).toBeTrue();
    });

    it("should return true when bindingMode is overallPosition for standalone widgets", () => {
      expect(
        isOverallDataSource({ bindingMode: "overallPosition" } as any),
      ).toBeTrue();
      expect(
        isOverallDataSource({} as any, undefined, "overallPosition"),
      ).toBeTrue();
    });

    it("should return true when columnKey is an overall column key without explicit gridType on standalone widgets", () => {
      expect(
        isOverallDataSource({ columnKey: "overallLapCount" } as any),
      ).toBeTrue();
      expect(
        isOverallDataSource({ columnKey: "rankOverall" } as any),
      ).toBeTrue();
    });

    it("should return false when gridType is explicitly heat even with overallPosition or overall columns", () => {
      expect(
        isOverallDataSource({ gridType: "heat", columnKey: "lapCount" } as any),
      ).toBeFalse();
      expect(
        isOverallDataSource({
          gridType: "heat",
          gridId: "grid-1",
          bindingMode: "overallPosition",
        } as any),
      ).toBeFalse();
      expect(
        isOverallDataSource({
          gridType: "heat",
          gridId: "grid-1",
          columnKey: "overallLapCount",
        } as any),
      ).toBeFalse();
    });

    it("should return false for a grid with gridId that is not overall even if bindingMode is overallPosition", () => {
      expect(
        isOverallDataSource({
          gridId: "grid-1",
          bindingMode: "overallPosition",
        } as any),
      ).toBeFalse();
      expect(
        isOverallDataSource({
          gridId: "grid-1",
          columnKey: "overallLapCount",
        } as any),
      ).toBeFalse();
    });
  });

  describe("resolveOverallGridDriver when race is over", () => {
    const mockDriverInHeat = new DriverHeatData(
      "p1",
      { objectId: "p1", name: "Driver 1", rank: 1 } as any,
      0,
    );
    const mockDrivers = [mockDriverInHeat];
    const syntheticCreator = (p: any) =>
      new DriverHeatData(p.objectId, p, -1, p.driver);

    it("should return active heat driver with lane index during racing", () => {
      const parent = {
        participants: [{ objectId: "p1", rank: 1 }],
        raceState: RaceState.RACING,
      };

      const result = resolveOverallGridDriver(
        mockDrivers,
        parent,
        "overallPosition",
        0,
        syntheticCreator,
      );

      expect(result).toBe(mockDriverInHeat);
      expect(result?.laneIndex).toBe(0);
    });

    it("should consider all positions not in a lane (laneIndex -1) when race is over", () => {
      const parent = {
        participants: [{ objectId: "p1", rank: 1 }],
        raceState: RaceState.RACE_OVER,
      };

      const result = resolveOverallGridDriver(
        mockDrivers,
        parent,
        "overallPosition",
        0,
        syntheticCreator,
      );

      expect(result).not.toBe(mockDriverInHeat);
      expect(result?.laneIndex).toBe(-1);
    });
  });
});
