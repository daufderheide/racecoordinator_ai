import { LayoutConfig, Settings } from "@app/models/settings";

import {
  LaneViewMigrationHelper,
  LaneViewMigrationOptions,
} from "./lane-view-migration.helper";

describe("LaneViewMigrationHelper", () => {
  describe("hasLegacyLaneView", () => {
    it("should return false for null or empty layouts", () => {
      expect(LaneViewMigrationHelper.hasLegacyLaneView(null)).toBeFalse();
      expect(LaneViewMigrationHelper.hasLegacyLaneView(undefined)).toBeFalse();
      expect(
        LaneViewMigrationHelper.hasLegacyLaneView({ widgets: [] } as any),
      ).toBeFalse();
    });

    it("should return false when no lane-view widget exists", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w1",
            widgetType: "timer",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
          },
          {
            id: "w2",
            widgetType: "flag",
            x: 100,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
          },
        ],
      };
      expect(LaneViewMigrationHelper.hasLegacyLaneView(layout)).toBeFalse();
    });

    it("should return true when a lane-view widget exists", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w1",
            widgetType: "timer",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
          },
          {
            id: "w-lane",
            widgetType: "lane-view",
            x: 0,
            y: 300,
            width: 1920,
            height: 700,
            zIndex: 100,
          },
        ],
      };
      expect(LaneViewMigrationHelper.hasLegacyLaneView(layout)).toBeTrue();
    });
  });

  describe("convertLegacyLaneViewLayout", () => {
    it("should return original layout without migration when no lane-view exists", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w1",
            widgetType: "timer",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
          },
        ],
      };
      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout,
      });
      expect(result.migrated).toBeFalse();
      expect(result.layout.widgets.length).toBe(1);
    });

    it("should convert horizontal lane-view into replicated lane-column grid widgets", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w-timer",
            widgetType: "timer",
            x: 0,
            y: 0,
            width: 200,
            height: 80,
            zIndex: 100,
          },
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 50,
            y: 200,
            width: 1200,
            height: 600,
            zIndex: 150,
            fontFamily: "Roboto",
            textColor: "#ffffff",
            customSettings: {
              isVertical: false,
              sortByStandings: true,
              highlightRowOnLap: true,
              timeDecimalPlaces: 3,
              lapDecimalPlaces: 2,
              columnFontSize: 20,
              columnTextColor: "#aaaaaa",
              dataFontSize: 40,
              dataTextColor: "#ffffff",
              insetFontFamily: "Inter",
              insetFontSize: 18,
              insetTextColor: "#00ff00",
              insetTimeDecimalPlaces: 3,
              insetLapDecimalPlaces: 1,
              columnDecimals: {
                averageLapTime: 2,
              },
              columnLabels: {
                "driver.nickname": "Driver Name",
              },
              columnWidths: {
                averageLapTime: 300,
              },
            },
          },
          {
            id: "w-flag",
            widgetType: "flag",
            x: 200,
            y: 0,
            width: 100,
            height: 80,
            zIndex: 100,
          },
        ],
      };

      const options: LaneViewMigrationOptions = {
        layout,
        columns: ["driver.nickname", "lapCount", "averageLapTime"],
        columnLayouts: {
          "driver.nickname": {
            "center-center": "driver.nickname",
            "bottom-right": "participant.team.name",
          },
          lapCount: {
            "center-center": "lapCount",
            "bottom-left": "flag",
          },
        },
        totalLanes: 4,
      };

      const result =
        LaneViewMigrationHelper.convertLegacyLaneViewLayout(options);

      expect(result.migrated).toBeTrue();
      // Original timer and flag should remain
      expect(result.layout.widgets.some((w) => w.id === "w-timer")).toBeTrue();
      expect(result.layout.widgets.some((w) => w.id === "w-flag")).toBeTrue();
      // lane-view should be replaced
      expect(
        result.layout.widgets.some((w) => w.widgetType === "lane-view"),
      ).toBeFalse();

      // 3 columns * 4 lanes = 12 data widgets + 3 top header widgets = 15 lane-column widgets
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      expect(gridWidgets.length).toBe(15);

      const headerWidgets = gridWidgets.filter(
        (w) => w.customSettings?.["isHeaderWidget"],
      );
      expect(headerWidgets.length).toBe(3);
      for (const hw of headerWidgets) {
        expect(hw.customSettings?.["showHeader"]).toBeTrue();
        expect(hw.customSettings?.["headerPlacement"]).toBe("top");
        expect(hw.customSettings?.["useLaneColors"]).toBeFalse();
        expect(hw.y).toBe(200); // bounds.y
      }

      // Check data widgets have showHeader false
      const dataWidgets = gridWidgets.filter(
        (w) => !w.customSettings?.["isHeaderWidget"],
      );
      expect(dataWidgets.length).toBe(12);
      for (const dw of dataWidgets) {
        expect(dw.customSettings?.["showHeader"]).toBeFalse();
        expect(dw.customSettings?.["headerPlacement"]).toBe("top");
      }

      // Check master widgets (gridLane === 0)
      const masters = dataWidgets.filter(
        (w) => w.customSettings?.["gridLane"] === 0,
      );
      expect(masters.length).toBe(3);

      const driverMaster = masters.find(
        (m) => m.customSettings?.["columnKey"] === "driver.nickname",
      );
      expect(driverMaster).toBeDefined();
      expect(driverMaster?.customSettings?.["customLabel"]).toBe("Driver Name");
      expect(driverMaster?.customSettings?.["insets"]).toEqual({
        "bottom-right": "participant.team.name",
      });
      expect(driverMaster?.customSettings?.["insetFontFamily"]).toBe("Inter");
      expect(driverMaster?.customSettings?.["insetFontSize"]).toBe(18);
      expect(driverMaster?.customSettings?.["insetTextColor"]).toBe("#00ff00");
      expect(driverMaster?.customSettings?.["bindingMode"]).toBe("position");
      expect(driverMaster?.customSettings?.["headerFontSize"]).toBe(20);
      expect(driverMaster?.customSettings?.["valueFontSize"]).toBe(40);
      expect(driverMaster?.zIndex).toBe(150);

      const avgLapMaster = masters.find(
        (m) => m.customSettings?.["columnKey"] === "averageLapTime",
      );
      expect(avgLapMaster).toBeDefined();
      expect(avgLapMaster?.customSettings?.["timeDecimalPlaces"]).toBe(2);

      // Check replicated widgets for lane 2
      const lane2Widgets = dataWidgets.filter(
        (w) => w.customSettings?.["gridLane"] === 2,
      );
      expect(lane2Widgets.length).toBe(3);
      for (const w of lane2Widgets) {
        expect(w.customSettings?.["targetIndex"]).toBe(2);
      }
    });

    it("should convert vertical lane-view layout into horizontal direction grid widgets", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view-vert",
            widgetType: "lane-view",
            x: 0,
            y: 100,
            width: 1000,
            height: 800,
            zIndex: 100,
            customSettings: {
              isVertical: true,
              sortByStandings: false,
            },
          },
        ],
      };

      const options: LaneViewMigrationOptions = {
        layout,
        columns: ["laneNumber", "lastLapTime", "lapCount"],
        totalLanes: 4,
      };

      const result =
        LaneViewMigrationHelper.convertLegacyLaneViewLayout(options);

      expect(result.migrated).toBeTrue();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      expect(gridWidgets.length).toBe(15);

      const headerWidgets = gridWidgets.filter(
        (w) => w.customSettings?.["isHeaderWidget"],
      );
      expect(headerWidgets.length).toBe(3);
      for (const hw of headerWidgets) {
        expect(hw.x).toBe(0);
        expect(hw.width).toBe(200);
        expect(hw.customSettings?.["headerPlacement"]).toBe("left");
        expect(hw.customSettings?.["showHeader"]).toBeTrue();
        expect(hw.customSettings?.["useLaneColors"]).toBeFalse();
      }

      const masters = gridWidgets.filter(
        (w) =>
          w.customSettings?.["gridLane"] === 0 &&
          !w.customSettings?.["isHeaderWidget"],
      );
      expect(masters.length).toBe(3);
      expect(masters[0].customSettings?.["gridDirection"]).toBe("horizontal");
      expect(masters[0].customSettings?.["bindingMode"]).toBe("lane");
      expect(masters[0].customSettings?.["layoutOrientation"]).toBe(
        "horizontal",
      );
      expect(masters[0].customSettings?.["headerPlacement"]).toBe("left");
      expect(masters[0].customSettings?.["showHeader"]).toBeFalse();
      for (const m of masters) {
        expect(m.x).toBe(200);
        expect(m.width).toBe(200);
      }

      // Lane 1 should be shifted horizontally (x = 200 + 200 = 400)
      const lane1Widgets = gridWidgets.filter(
        (w) =>
          w.customSettings?.["gridLane"] === 1 &&
          !w.customSettings?.["isHeaderWidget"],
      );
      expect(lane1Widgets.length).toBe(3);
      for (const w of lane1Widgets) {
        expect(w.x).toBe(400);
        expect(w.width).toBe(200);
        expect(w.customSettings?.["showHeader"]).toBeFalse();
      }
    });

    it("should preserve gridType as 'heat' and bindingMode as heat standings even when overall columns like overallLapCount are present", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view-overall-cols",
            widgetType: "lane-view",
            x: 0,
            y: 0,
            width: 800,
            height: 400,
            zIndex: 100,
            customSettings: {
              isVertical: false,
              sortByStandings: true,
            },
          },
        ],
      };

      const options: LaneViewMigrationOptions = {
        layout,
        columns: ["laneNumber", "overallLapCount", "lapCount"],
        totalLanes: 4,
      };

      const result =
        LaneViewMigrationHelper.convertLegacyLaneViewLayout(options);

      expect(result.migrated).toBeTrue();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      expect(gridWidgets.length).toBeGreaterThan(0);
      for (const w of gridWidgets) {
        expect(w.customSettings?.["gridType"]).toBe("heat");
        expect(w.customSettings?.["bindingMode"]).toBe("position");
      }
    });

    it("should set bindingMode to 'lane' when sortByStandings is false even with overall columns", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view-by-lane",
            widgetType: "lane-view",
            x: 0,
            y: 0,
            width: 800,
            height: 400,
            zIndex: 100,
            customSettings: {
              isVertical: false,
              sortByStandings: false,
            },
          },
        ],
      };

      const options: LaneViewMigrationOptions = {
        layout,
        columns: ["laneNumber", "overallLapCount", "lapCount"],
        totalLanes: 4,
      };

      const result =
        LaneViewMigrationHelper.convertLegacyLaneViewLayout(options);

      expect(result.migrated).toBeTrue();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      for (const w of gridWidgets) {
        expect(w.customSettings?.["gridType"]).toBe("heat");
        expect(w.customSettings?.["bindingMode"]).toBe("lane");
      }
    });

    it("should successfully convert Settings.DEFAULT_LAYOUT into grid layout", () => {
      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout: Settings.DEFAULT_LAYOUT,
      });
      expect(result.migrated).toBeTrue();
      expect(
        result.layout.widgets.some((w) => w.widgetType === "lane-view"),
      ).toBeFalse();
      expect(
        result.layout.widgets.some((w) => w.widgetType === "lane-column"),
      ).toBeTrue();
    });

    it("should successfully convert Settings.DEFAULT_PRACTICE_LAYOUT into grid layout", () => {
      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout: Settings.DEFAULT_PRACTICE_LAYOUT,
        isPractice: true,
      });
      expect(result.migrated).toBeTrue();
      expect(
        result.layout.widgets.some((w) => w.widgetType === "lane-view"),
      ).toBeFalse();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      expect(gridWidgets.length).toBe(25);

      const headerWidgets = gridWidgets.filter(
        (w) => w.customSettings?.["isHeaderWidget"],
      );
      expect(headerWidgets.length).toBe(5);
      for (const hw of headerWidgets) {
        expect(hw.x).toBe(0);
        expect(hw.width).toBe(200);
        expect(hw.customSettings?.["showHeader"]).toBeTrue();
        expect(hw.customSettings?.["headerPlacement"]).toBe("left");
      }

      const laneWidgets = gridWidgets.filter(
        (w) => !w.customSettings?.["isHeaderWidget"],
      );
      expect(laneWidgets.length).toBe(20);
      for (const lw of laneWidgets) {
        expect(lw.x).toBeGreaterThanOrEqual(200);
        expect(lw.customSettings?.["showHeader"]).toBeFalse();
        expect(lw.customSettings?.["headerPlacement"]).toBe("left");
      }

      // Assert row heights: laneNumber row must NOT be clamped to 10% (93px), but should be 55px
      const laneNumberHeader = headerWidgets.find(
        (hw) => hw.customSettings?.["columnKey"] === "laneNumber",
      );
      expect(laneNumberHeader?.height).toBe(55);

      const laneNumberData = laneWidgets.filter(
        (lw) => lw.customSettings?.["columnKey"] === "laneNumber",
      );
      expect(laneNumberData.length).toBe(4);
      for (const lw of laneNumberData) {
        expect(lw.height).toBe(55);
      }

      const lastLapTimeHeader = headerWidgets.find(
        (hw) => hw.customSettings?.["columnKey"] === "lastLapTime",
      );
      expect(lastLapTimeHeader?.y).toBe(149 + 55);
      expect(lastLapTimeHeader?.height).toBe(110);

      const lastLapsHeader = headerWidgets.find(
        (hw) => hw.customSettings?.["columnKey"] === "lastLaps",
      );
      expect(lastLapsHeader?.height).toBe(548);
    });

    it("should honor preserveLegacyHeatView flag and allow manual upgrade", () => {
      const layout: LayoutConfig = {
        preserveLegacyHeatView: true,
        widgets: [
          {
            id: "w-lane",
            widgetType: "lane-view",
            x: 0,
            y: 0,
            width: 800,
            height: 400,
            zIndex: 100,
          },
        ],
      };

      expect(LaneViewMigrationHelper.hasLegacyLaneView(layout)).toBeFalse();
      expect(
        LaneViewMigrationHelper.canUpgradeLegacyHeatView(layout),
      ).toBeTrue();

      const convertResult = LaneViewMigrationHelper.convertLegacyLaneViewLayout(
        {
          layout,
        },
      );
      expect(convertResult.migrated).toBeFalse();
      expect(convertResult.layout.widgets[0].widgetType).toBe("lane-view");

      const upgradeResult = LaneViewMigrationHelper.upgradeLegacyHeatViewLayout(
        {
          layout,
        },
      );
      expect(upgradeResult.migrated).toBeTrue();
      expect(upgradeResult.layout.preserveLegacyHeatView).toBeUndefined();
      expect(
        upgradeResult.layout.widgets.some(
          (w) => w.widgetType === "lane-column",
        ),
      ).toBeTrue();
    });

    it("should not consider Pre-Migration Backup layouts as candidates for auto-migration or upgrade", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w-lane",
            widgetType: "lane-view",
            x: 0,
            y: 0,
            width: 800,
            height: 400,
            zIndex: 100,
          },
        ],
      };
      expect(
        LaneViewMigrationHelper.hasLegacyLaneView(
          layout,
          "RaceCoordinator AI (Pre-Migration Backup)",
        ),
      ).toBeFalse();
      expect(
        LaneViewMigrationHelper.canUpgradeLegacyHeatView(
          layout,
          "RaceCoordinator AI (Pre-Migration Backup)",
        ),
      ).toBeFalse();
    });

    it("should adjust practice layout top row widgets to y: 38 and height: 111 so they do not overlap heat data", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-menu-bar",
            widgetType: "menu-bar",
            x: 0,
            y: 0,
            width: 1920,
            height: 55,
            zIndex: 100,
          },
          {
            id: "widget-branding",
            widgetType: "branding",
            x: 0,
            y: 49,
            width: 469,
            height: 112,
            zIndex: 100,
          },
          {
            id: "widget-qr",
            widgetType: "qr",
            x: 469,
            y: 50,
            width: 132,
            height: 111,
            zIndex: 100,
          },
          {
            id: "widget-timer",
            widgetType: "timer",
            x: 779,
            y: 49,
            width: 441,
            height: 112,
            zIndex: 100,
          },
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 0,
            y: 149,
            width: 1920,
            height: 931,
            zIndex: 100,
            customSettings: { isVertical: true },
          },
        ],
      };

      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout,
        isPractice: true,
      });

      expect(result.migrated).toBeTrue();
      const menu = result.layout.widgets.find(
        (w) => w.id === "widget-menu-bar",
      );
      expect(menu?.height).toBe(38);
      const branding = result.layout.widgets.find(
        (w) => w.id === "widget-branding",
      );
      expect(branding?.y).toBe(38);
      expect(branding?.height).toBe(111);
      const qr = result.layout.widgets.find((w) => w.id === "widget-qr");
      expect(qr?.y).toBe(38);
      expect(qr?.height).toBe(111);
      const timer = result.layout.widgets.find((w) => w.id === "widget-timer");
      expect(timer?.y).toBe(38);
      expect(timer?.height).toBe(111);
    });
  });

  describe("migrateGapWidgets", () => {
    it("should return false for invalid layout", () => {
      expect(LaneViewMigrationHelper.migrateGapWidgets(null)).toBeFalse();
      expect(LaneViewMigrationHelper.migrateGapWidgets(undefined)).toBeFalse();
      expect(LaneViewMigrationHelper.migrateGapWidgets({} as any)).toBeFalse();
    });

    it("should migrate legacy gap columns and insets with matching targets and modes", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "gap-col",
            widgetType: "lane-column",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
            customSettings: {
              columnKey: "gapLeaderF1",
              insets: {
                "top-right": "overallGapPosition",
                "bottom-left": "gapPosition",
              },
            },
          },
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateGapWidgets(layout);
      expect(migrated).toBeTrue();

      const w = layout.widgets[0].customSettings as any;
      expect(w.columnKey).toBe("gap");
      expect(w.gapTarget).toBe("leader");
      expect(w.gapMode).toBe("laps_and_time");

      expect(w.insets["top-right"]).toBe("overallGap");
      expect(w.insetsConfig["top-right"].columnKey).toBe("overallGap");
      expect(w.insetsConfig["top-right"].gapTarget).toBe("position");
      expect(w.insetsConfig["top-right"].gapMode).toBe("always_time");

      expect(w.insets["bottom-left"]).toBe("gap");
      expect(w.insetsConfig["bottom-left"].columnKey).toBe("gap");
      expect(w.insetsConfig["bottom-left"].gapTarget).toBe("position");
      expect(w.insetsConfig["bottom-left"].gapMode).toBe("always_time");
    });

    it("should not modify already migrated gap widgets", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "gap-col",
            widgetType: "lane-column",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
            customSettings: {
              columnKey: "gap",
              gapTarget: "position",
              gapMode: "always_laps",
            },
          },
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateGapWidgets(layout);
      expect(migrated).toBeFalse();
      const w = layout.widgets[0].customSettings as any;
      expect(w.columnKey).toBe("gap");
      expect(w.gapTarget).toBe("position");
      expect(w.gapMode).toBe("always_laps");
    });
  });

  describe("migrateColumnList", () => {
    it("should return false for null or undefined or empty list", () => {
      expect(LaneViewMigrationHelper.migrateColumnList(undefined)).toBeFalse();
      expect(LaneViewMigrationHelper.migrateColumnList([] as any)).toBeFalse();
    });

    it("should migrate legacy gap keys in array", () => {
      const cols = [
        "lapCount",
        "gapLeader",
        "gapPositionF1",
        "overallGapPosition",
      ];
      const migrated = LaneViewMigrationHelper.migrateColumnList(cols);
      expect(migrated).toBeTrue();
      expect(cols).toEqual(["lapCount", "gap", "gap", "overallGap"]);
    });

    it("should not modify already migrated list", () => {
      const cols = ["lapCount", "gap", "overallGap"];
      const migrated = LaneViewMigrationHelper.migrateColumnList(cols);
      expect(migrated).toBeFalse();
      expect(cols).toEqual(["lapCount", "gap", "overallGap"]);
    });
  });

  describe("migrateColumnWidths", () => {
    it("should return false for null or empty object", () => {
      expect(
        LaneViewMigrationHelper.migrateColumnWidths(undefined),
      ).toBeFalse();
      expect(LaneViewMigrationHelper.migrateColumnWidths({})).toBeFalse();
    });

    it("should rename legacy gap keys to unified keys", () => {
      const widths: Record<string, number> = {
        lapCount: 200,
        gapLeader: 310,
        overallGapPosition: 320,
      };
      const migrated = LaneViewMigrationHelper.migrateColumnWidths(widths);
      expect(migrated).toBeTrue();
      expect(widths["gapLeader"]).toBeUndefined();
      expect(widths["gap"]).toBe(310);
      expect(widths["overallGap"]).toBe(320);
      expect(widths["lapCount"]).toBe(200);
    });
  });

  describe("migrateColumnLayouts", () => {
    it("should return false for null or empty layouts", () => {
      expect(
        LaneViewMigrationHelper.migrateColumnLayouts(undefined),
      ).toBeFalse();
      expect(LaneViewMigrationHelper.migrateColumnLayouts({})).toBeFalse();
    });

    it("should migrate keys and anchor values", () => {
      const layouts: Record<string, Record<string, string>> = {
        gapLeader: {
          "center-center": "gapLeader",
          "bottom-right": "gapPosition",
        },
      };
      const migrated = LaneViewMigrationHelper.migrateColumnLayouts(layouts);
      expect(migrated).toBeTrue();
      expect(layouts["gapLeader"]).toBeUndefined();
      expect(layouts["gap"]).toBeDefined();
      expect(layouts["gap"]["center-center"]).toBe("gap");
      expect(layouts["gap"]["bottom-right"]).toBe("gap");
    });
  });
});
