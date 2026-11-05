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
              highlightLapStyle: "scale-pulse",
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
        expect(hw.customSettings?.["showBorder"]).toBeTrue();
        expect(hw.customSettings?.["borderColor"]).toBe("");
        expect(hw.customSettings?.["borderWidth"]).toBe(1);
        expect(hw.customSettings?.["borderRadius"]).toBe(0);
        expect(hw.y).toBe(210); // bounds.y (200 + 10px legacy lane-view top margin)
      }

      // Check data widgets have showHeader false
      const dataWidgets = gridWidgets.filter(
        (w) => !w.customSettings?.["isHeaderWidget"],
      );
      expect(dataWidgets.length).toBe(12);
      for (const dw of dataWidgets) {
        expect(dw.customSettings?.["showHeader"]).toBeFalse();
        expect(dw.customSettings?.["headerPlacement"]).toBe("top");
        expect(dw.customSettings?.["showBorder"]).toBeTrue();
        expect(dw.customSettings?.["borderColor"]).toBe("");
        expect(dw.customSettings?.["borderWidth"]).toBe(1);
        expect(dw.customSettings?.["borderRadius"]).toBe(0);
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
      expect(driverMaster?.customSettings?.["highlightLapStyle"]).toBe(
        "scale-pulse",
      );
      expect(driverMaster?.customSettings?.["showBorder"]).toBeTrue();
      expect(driverMaster?.customSettings?.["borderColor"]).toBe("");
      expect(driverMaster?.customSettings?.["borderWidth"]).toBe(1);
      expect(driverMaster?.customSettings?.["borderRadius"]).toBe(0);
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
        expect(hw.customSettings?.["showBorder"]).toBeTrue();
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
      expect(masters[0].customSettings?.["showBorder"]).toBeTrue();
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

    it("should preserve custom border settings when migrating lane-view to data grid", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view-custom-borders",
            widgetType: "lane-view",
            x: 0,
            y: 300,
            width: 1000,
            height: 400,
            zIndex: 100,
            customSettings: {
              isVertical: false,
              showBorder: false,
              borderColor: "#ff0000",
              borderWidth: 3,
              borderRadius: 6,
            },
          },
        ],
      };

      const options: LaneViewMigrationOptions = {
        layout,
        columns: ["laneNumber", "lastLapTime"],
        totalLanes: 2,
      };

      const result =
        LaneViewMigrationHelper.convertLegacyLaneViewLayout(options);

      expect(result.migrated).toBeTrue();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      expect(gridWidgets.length).toBe(6); // 2 cols * 2 lanes = 4 data + 2 top headers

      for (const w of gridWidgets) {
        expect(w.customSettings?.["showBorder"]).toBeFalse();
        expect(w.customSettings?.["borderColor"]).toBe("#ff0000");
        expect(w.customSettings?.["borderWidth"]).toBe(3);
        expect(w.customSettings?.["borderRadius"]).toBe(6);
      }
    });

    it("should default borders to showBorder=true with 1px border and 0 radius when migrating lane-view", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view-default-borders",
            widgetType: "lane-view",
            x: 0,
            y: 300,
            width: 1000,
            height: 400,
            zIndex: 100,
            customSettings: {
              isVertical: false,
            },
          },
        ],
      };

      const options: LaneViewMigrationOptions = {
        layout,
        columns: ["laneNumber", "lastLapTime"],
        totalLanes: 2,
      };

      const result =
        LaneViewMigrationHelper.convertLegacyLaneViewLayout(options);

      expect(result.migrated).toBeTrue();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      expect(gridWidgets.length).toBe(6);

      for (const w of gridWidgets) {
        expect(w.customSettings?.["showBorder"]).toBeTrue();
        expect(w.customSettings?.["borderColor"]).toBe("");
        expect(w.customSettings?.["borderWidth"]).toBe(1);
        expect(w.customSettings?.["borderRadius"]).toBe(0);
      }
    });

    it("should adjust grid y position and height by 10px to account for legacy lane-view margin-top and prevent overlapping widgets above", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-top-image",
            widgetType: "image",
            x: 0,
            y: 40,
            width: 300,
            height: 230,
            zIndex: 220,
          },
          {
            id: "widget-lane-view-below-image",
            widgetType: "lane-view",
            x: 0,
            y: 270,
            width: 1200,
            height: 750,
            zIndex: 190,
            customSettings: {
              isVertical: false,
            },
          },
        ],
      };

      const options: LaneViewMigrationOptions = {
        layout,
        columns: ["laneNumber", "lastLapTime"],
        totalLanes: 2,
      };

      const result =
        LaneViewMigrationHelper.convertLegacyLaneViewLayout(options);

      expect(result.migrated).toBeTrue();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      const headers = gridWidgets.filter(
        (w) => w.customSettings?.["isHeaderWidget"],
      );
      expect(headers.length).toBe(2);
      // Legacy lane-view had margin: 10px 0 0 0, so header rendered at y=280 (not y=270).
      // Migrated grid must start at y=280 to preserve the 10px gap below the image (y=40+230=270).
      for (const h of headers) {
        expect(h.y).toBe(280);
      }

      // Total height of grid should be 740 (750 - 10px margin), bottom remains 280 + 740 = 1020 (270 + 750)
      const lane0Widgets = gridWidgets.filter(
        (w) =>
          !w.customSettings?.["isHeaderWidget"] &&
          w.customSettings?.["gridLane"] === 0,
      );
      const lane1Widgets = gridWidgets.filter(
        (w) =>
          !w.customSettings?.["isHeaderWidget"] &&
          w.customSettings?.["gridLane"] === 1,
      );
      for (const w of lane0Widgets) {
        expect(w.y).toBeGreaterThanOrEqual(280);
      }
      for (const w of lane1Widgets) {
        expect(w.y + w.height).toBeLessThanOrEqual(1020);
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

    it("should successfully convert Settings.LEGACY_DEFAULT_LAYOUT into grid layout", () => {
      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout: Settings.LEGACY_DEFAULT_LAYOUT,
      });
      expect(result.migrated).toBeTrue();
      expect(
        result.layout.widgets.some((w) => w.widgetType === "lane-view"),
      ).toBeFalse();
      expect(
        result.layout.widgets.some((w) => w.widgetType === "lane-column"),
      ).toBeTrue();
    });

    it("should successfully convert Settings.LEGACY_DEFAULT_PRACTICE_LAYOUT into grid layout", () => {
      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout: Settings.LEGACY_DEFAULT_PRACTICE_LAYOUT,
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

      // Assert row heights: laneNumber row must NOT be clamped to 10% (92px), but should be 54px
      const laneNumberHeader = headerWidgets.find(
        (hw) => hw.customSettings?.["columnKey"] === "laneNumber",
      );
      expect(laneNumberHeader?.height).toBe(54);

      const laneNumberData = laneWidgets.filter(
        (lw) => lw.customSettings?.["columnKey"] === "laneNumber",
      );
      expect(laneNumberData.length).toBe(4);
      for (const lw of laneNumberData) {
        expect(lw.height).toBe(54);
      }

      const lastLapTimeHeader = headerWidgets.find(
        (hw) => hw.customSettings?.["columnKey"] === "lastLapTime",
      );
      expect(lastLapTimeHeader?.y).toBe(159 + 54);
      expect(lastLapTimeHeader?.height).toBe(108);

      const lastLapsHeader = headerWidgets.find(
        (hw) => hw.customSettings?.["columnKey"] === "lastLaps",
      );
      expect(lastLapsHeader?.height).toBe(542);
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
            customSettings: {
              highlightLapStyle: "classic",
              highlightRowOnLap: true,
            },
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

    it("should preserve custom font sizes and scaleMode '' as fixed scaling during migration", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 0,
            y: 200,
            width: 1440,
            height: 750,
            zIndex: 190,
            scaleMode: "",
            customSettings: {
              isVertical: false,
              columnFontFamily: "Burbank Big",
              columnFontSize: 40,
              dataFontFamily: "Burbank Big",
              dataFontSize: 78,
              insetFontFamily: "Burbank Big",
              insetFontSize: 24,
            },
          },
        ],
      };

      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout,
        totalLanes: 4,
      });

      expect(result.migrated).toBeTrue();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      expect(gridWidgets.length).toBeGreaterThan(0);

      const headerWidgets = gridWidgets.filter(
        (w) => w.customSettings?.["isHeaderWidget"],
      );
      expect(headerWidgets.length).toBeGreaterThan(0);
      for (const hw of headerWidgets) {
        expect(hw.scaleMode).toBe("");
        expect(hw.customSettings?.["headerFontSize"]).toBe(40);
        expect(hw.customSettings?.["headerFontFamily"]).toBe("Burbank Big");
      }

      const dataWidgets = gridWidgets.filter(
        (w) => !w.customSettings?.["isHeaderWidget"],
      );
      expect(dataWidgets.length).toBeGreaterThan(0);
      for (const dw of dataWidgets) {
        expect(dw.scaleMode).toBe("");
        expect(dw.customSettings?.["valueFontSize"]).toBe(78);
        expect(dw.customSettings?.["minFontSize"]).toBe(78);
        expect(dw.customSettings?.["maxFontSize"]).toBe(78);
        expect(dw.customSettings?.["valueFontFamily"]).toBe("Burbank Big");
        expect(dw.customSettings?.["headerFontSize"]).toBe(40);
        expect(dw.customSettings?.["headerFontFamily"]).toBe("Burbank Big");
      }
    });

    it("should preserve scaleMode 'fixed' with equal min and max font size", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 0,
            y: 200,
            width: 1200,
            height: 600,
            zIndex: 100,
            scaleMode: "fixed",
            customSettings: {
              dataFontSize: 64,
              columnFontSize: 32,
            },
          },
        ],
      };

      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout,
        totalLanes: 4,
      });

      expect(result.migrated).toBeTrue();
      const dataWidgets = result.layout.widgets.filter(
        (w) =>
          w.widgetType === "lane-column" &&
          !w.customSettings?.["isHeaderWidget"],
      );
      for (const dw of dataWidgets) {
        expect(dw.scaleMode).toBe("fixed");
        expect(dw.customSettings?.["valueFontSize"]).toBe(64);
        expect(dw.customSettings?.["minFontSize"]).toBe(64);
        expect(dw.customSettings?.["maxFontSize"]).toBe(64);
        expect(dw.customSettings?.["headerFontSize"]).toBe(32);
      }
    });

    it("should preserve scaleMode 'auto' and set maxFontSize to max of 120 or dataFontSize", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 0,
            y: 200,
            width: 1200,
            height: 600,
            zIndex: 100,
            scaleMode: "auto",
            customSettings: {
              dataFontSize: 85,
              columnFontSize: 40,
            },
          },
        ],
      };

      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout,
        totalLanes: 4,
      });

      expect(result.migrated).toBeTrue();
      const dataWidgets = result.layout.widgets.filter(
        (w) =>
          w.widgetType === "lane-column" &&
          !w.customSettings?.["isHeaderWidget"],
      );
      for (const dw of dataWidgets) {
        expect(dw.scaleMode).toBe("auto");
        expect(dw.customSettings?.["minFontSize"]).toBe(0);
        expect(dw.customSettings?.["maxFontSize"]).toBe(120);
        expect(dw.customSettings?.["valueFontSize"]).toBe(85);
      }
    });

    it("should allow maxFontSize to exceed 120 when legacy dataFontSize is larger", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 0,
            y: 200,
            width: 1200,
            height: 600,
            zIndex: 100,
            scaleMode: "auto",
            customSettings: {
              dataFontSize: 140,
            },
          },
        ],
      };

      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout,
        totalLanes: 4,
      });

      expect(result.migrated).toBeTrue();
      const dataWidgets = result.layout.widgets.filter(
        (w) =>
          w.widgetType === "lane-column" &&
          !w.customSettings?.["isHeaderWidget"],
      );
      for (const dw of dataWidgets) {
        expect(dw.scaleMode).toBe("auto");
        expect(dw.customSettings?.["minFontSize"]).toBe(0);
        expect(dw.customSettings?.["maxFontSize"]).toBe(140);
        expect(dw.customSettings?.["valueFontSize"]).toBe(140);
      }
    });

    it("should preserve explicit minFontSize and maxFontSize from customSettings", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 0,
            y: 200,
            width: 1200,
            height: 600,
            zIndex: 100,
            scaleMode: "auto",
            customSettings: {
              dataFontSize: 50,
              minFontSize: 16,
              maxFontSize: 48,
            },
          },
        ],
      };

      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout,
        totalLanes: 4,
      });

      expect(result.migrated).toBeTrue();
      const dataWidgets = result.layout.widgets.filter(
        (w) =>
          w.widgetType === "lane-column" &&
          !w.customSettings?.["isHeaderWidget"],
      );
      for (const dw of dataWidgets) {
        expect(dw.customSettings?.["minFontSize"]).toBe(16);
        expect(dw.customSettings?.["maxFontSize"]).toBe(48);
      }
    });

    it("should preserve scaleMode and font sizes for vertical layouts", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "widget-lane-view",
            widgetType: "lane-view",
            x: 0,
            y: 200,
            width: 1200,
            height: 600,
            zIndex: 100,
            scaleMode: "",
            customSettings: {
              isVertical: true,
              dataFontSize: 72,
              columnFontSize: 36,
            },
          },
        ],
      };

      const result = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout,
        totalLanes: 4,
      });

      expect(result.migrated).toBeTrue();
      const gridWidgets = result.layout.widgets.filter(
        (w) => w.widgetType === "lane-column",
      );
      for (const w of gridWidgets) {
        expect(w.scaleMode).toBe("");
        expect(w.customSettings?.["valueFontSize"]).toBe(72);
        expect(w.customSettings?.["minFontSize"]).toBe(72);
        expect(w.customSettings?.["maxFontSize"]).toBe(72);
        expect(w.customSettings?.["headerFontSize"]).toBe(36);
      }
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
              highlightLapStyle: "classic",
              minFontSize: 0,
              maxFontSize: 60,
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

    it("should migrate widgets without highlightLapStyle to classic when highlightRowOnLap is true or unset", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "lane-col-1",
            widgetType: "lane-column",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
            customSettings: {
              columnKey: "lastLapTime",
              highlightRowOnLap: true,
            },
          },
          {
            id: "lane-view-1",
            widgetType: "lane-view",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
            customSettings: {},
          },
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateGapWidgets(layout);
      expect(migrated).toBeTrue();
      expect(layout.widgets[0].customSettings?.["highlightLapStyle"]).toBe(
        "classic",
      );
      expect(
        layout.widgets[0].customSettings?.["highlightRowOnLap"],
      ).toBeTrue();
      expect(layout.widgets[1].customSettings?.["highlightLapStyle"]).toBe(
        "classic",
      );
      expect(
        layout.widgets[1].customSettings?.["highlightRowOnLap"],
      ).toBeTrue();
    });

    it("should migrate widgets without highlightLapStyle to none when highlightRowOnLap is false", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "lane-col-1",
            widgetType: "lane-column",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
            customSettings: {
              columnKey: "lastLapTime",
              highlightRowOnLap: false,
            },
          },
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateGapWidgets(layout);
      expect(migrated).toBeTrue();
      expect(layout.widgets[0].customSettings?.["highlightLapStyle"]).toBe(
        "none",
      );
      expect(
        layout.widgets[0].customSettings?.["highlightRowOnLap"],
      ).toBeFalse();
    });

    it("should not modify widgets that already have highlightLapStyle", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "lane-col-1",
            widgetType: "lane-column",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            zIndex: 100,
            customSettings: {
              columnKey: "lastLapTime",
              highlightLapStyle: "shimmer",
              highlightRowOnLap: true,
              minFontSize: 0,
              maxFontSize: 60,
            },
          },
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateGapWidgets(layout);
      expect(migrated).toBeFalse();
      expect(layout.widgets[0].customSettings?.["highlightLapStyle"]).toBe(
        "shimmer",
      );
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

  describe("migrateWidgetFontScaling", () => {
    it("should return false for null or undefined or empty layouts", () => {
      expect(
        LaneViewMigrationHelper.migrateWidgetFontScaling(null),
      ).toBeFalse();
      expect(
        LaneViewMigrationHelper.migrateWidgetFontScaling(undefined),
      ).toBeFalse();
      expect(
        LaneViewMigrationHelper.migrateWidgetFontScaling({ widgets: [] }),
      ).toBeFalse();
    });

    it("should migrate scaleMode 'auto' to minFontSize 0 and maxFontSize 60", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w1",
            widgetType: "lane-column",
            scaleMode: "auto",
            customSettings: {
              columnKey: "driver.name",
            },
          } as any,
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateWidgetFontScaling(layout);
      expect(migrated).toBeTrue();
      expect(layout.widgets[0].customSettings?.["minFontSize"]).toBe(0);
      expect(layout.widgets[0].customSettings?.["maxFontSize"]).toBe(60);
    });

    it("should migrate scaleMode undefined / default to minFontSize 0 and maxFontSize 60", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w1",
            widgetType: "lane-column",
            customSettings: {
              columnKey: "driver.name",
            },
          } as any,
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateWidgetFontScaling(layout);
      expect(migrated).toBeTrue();
      expect(layout.widgets[0].customSettings?.["minFontSize"]).toBe(0);
      expect(layout.widgets[0].customSettings?.["maxFontSize"]).toBe(60);
    });

    it("should migrate custom / fixed scaleMode to same min and max font size", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w1",
            widgetType: "lane-column",
            scaleMode: "fixed",
            customSettings: {
              columnKey: "driver.name",
              valueFontSize: 42,
            },
          } as any,
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateWidgetFontScaling(layout);
      expect(migrated).toBeTrue();
      expect(layout.widgets[0].customSettings?.["minFontSize"]).toBe(42);
      expect(layout.widgets[0].customSettings?.["maxFontSize"]).toBe(42);
    });

    it("should not modify widgets that already have minFontSize and maxFontSize defined", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w1",
            widgetType: "lane-column",
            customSettings: {
              columnKey: "driver.name",
              minFontSize: 14,
              maxFontSize: 28,
            },
          } as any,
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateWidgetFontScaling(layout);
      expect(migrated).toBeFalse();
      expect(layout.widgets[0].customSettings?.["minFontSize"]).toBe(14);
      expect(layout.widgets[0].customSettings?.["maxFontSize"]).toBe(28);
    });

    it("should ignore non-lane-column widgets", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w1",
            widgetType: "timer",
            scaleMode: "auto",
            customSettings: {},
          } as any,
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateWidgetFontScaling(layout);
      expect(migrated).toBeFalse();
    });
  });
});
