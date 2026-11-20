import { LayoutConfig } from "@app/models/settings";

import { LaneViewMigrationHelper } from "./lane-view-migration.helper";

describe("LaneViewMigrationHelper", () => {
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
              columnKey: "driver.name",
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

    it("should migrate lastLapTime and lapTime widgets to include bottom-center driftIndicator inset", () => {
      const layout: LayoutConfig = {
        widgets: [
          {
            id: "w-last-lap",
            widgetType: "lane-column",
            customSettings: {
              columnKey: "lastLapTime",
              highlightLapStyle: "classic",
              minFontSize: 0,
              maxFontSize: 60,
            },
          } as any,
          {
            id: "w-lap-time",
            widgetType: "lane-column",
            customSettings: {
              columnKey: "lapTime",
              insets: { "top-left": "flag" },
              highlightLapStyle: "classic",
              minFontSize: 0,
              maxFontSize: 60,
            },
          } as any,
        ],
      };
      const migrated = LaneViewMigrationHelper.migrateGapWidgets(layout);
      expect(migrated).toBeTrue();
      expect(layout.widgets[0].customSettings?.["insets"]).toEqual({
        "bottom-center": "driftIndicator",
      });
      expect(layout.widgets[1].customSettings?.["insets"]).toEqual({
        "top-left": "flag",
        "bottom-center": "driftIndicator",
      });
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

    it("should ensure bottom-center driftIndicator on lastLapTime and lapTime column layouts", () => {
      const layouts: Record<string, Record<string, string>> = {
        lastLapTime: {
          "center-center": "lastLapTime",
        },
        lapTime: {
          "center-center": "lapTime",
        },
      };
      const migrated = LaneViewMigrationHelper.migrateColumnLayouts(layouts);
      expect(migrated).toBeTrue();
      expect(layouts["lastLapTime"]["bottom-center"]).toBe("driftIndicator");
      expect(layouts["lapTime"]["bottom-center"]).toBe("driftIndicator");
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
