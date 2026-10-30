import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridSession } from "./lane-grid-replication.helper";
import { LaneGridScrollHelper } from "./lane-grid-scroll.helper";

describe("LaneGridScrollHelper", () => {
  const gridId = "scroll-grid";
  const widgets: AbsoluteWidgetNode[] = [
    {
      id: "c-0",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      zIndex: 5,
      customSettings: {
        gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: 2,
        gridDirection: "vertical",
      },
    },
    {
      id: "c-0_grid_lane_1",
      widgetType: "lane-column",
      x: 100,
      y: 150,
      width: 200,
      height: 50,
      zIndex: 5,
      customSettings: {
        gridId,
        gridLane: 1,
        gridMasterId: "c-0",
        targetIndex: 1,
        gridTotalLanes: 2,
        gridDirection: "vertical",
      },
    },
  ];

  describe("getGridDataCount", () => {
    it("should return 0 when no widgets belong to gridId", () => {
      expect(LaneGridScrollHelper.getGridDataCount([], "unknown", {})).toBe(0);
    });

    it("should count lane mode items from parent track", () => {
      const parent = { track: { lanes: [{}, {}, {}] } };
      expect(
        LaneGridScrollHelper.getGridDataCount(widgets, gridId, parent),
      ).toBe(3);
    });

    it("should count position mode items from parent heat standings", () => {
      const posWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            bindingMode: "position",
          },
        },
      ];
      const parent = { heatStandings: [{}, {}, {}, {}] };
      expect(
        LaneGridScrollHelper.getGridDataCount(posWidgets, gridId, parent),
      ).toBe(4);
    });

    it("should count overallPosition mode items from parent race participants", () => {
      const overallWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            bindingMode: "overallPosition",
          },
        },
      ];
      const parent = { participants: [{}, {}, {}, {}, {}] };
      expect(
        LaneGridScrollHelper.getGridDataCount(overallWidgets, gridId, parent),
      ).toBe(5);
    });

    it("should count seed mode items from parent participants", () => {
      const seedWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            bindingMode: "seed",
          },
        },
      ];
      const parent = { participants: [{}, {}] };
      expect(
        LaneGridScrollHelper.getGridDataCount(seedWidgets, gridId, parent),
      ).toBe(2);
    });

    it("should fallback to gridTotalLanes when count is 0", () => {
      expect(LaneGridScrollHelper.getGridDataCount(widgets, gridId, {})).toBe(
        2,
      );
    });

    it("should return gridTotalLanes when parent is in UI editor mode", () => {
      const parent = {
        isUIEditorMode: () => true,
        track: { lanes: [{}, {}, {}, {}] },
      };
      expect(
        LaneGridScrollHelper.getGridDataCount(widgets, gridId, parent),
      ).toBe(2);
    });

    it("should return gridTotalLanes when parent isLayoutCustomizing is true", () => {
      const parent = {
        isLayoutCustomizing: true,
        track: { lanes: [{}, {}, {}, {}] },
      };
      expect(
        LaneGridScrollHelper.getGridDataCount(widgets, gridId, parent),
      ).toBe(2);
    });

    it("should count heat data items rather than overall race participants when gridType is heat even with overallPosition bindingMode", () => {
      const heatWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            gridType: "heat",
            bindingMode: "overallPosition",
            gridTotalLanes: 4,
          },
        },
      ];
      const parent = {
        participants: [{}, {}, {}, {}, {}, {}, {}, {}], // 8 overall drivers
        track: { lanes: [{}, {}, {}, {}] }, // 4 lanes
        heat: { heatDrivers: [{}, {}, {}, {}] }, // 4 heat drivers
      };
      expect(
        LaneGridScrollHelper.getGridDataCount(heatWidgets, gridId, parent),
      ).toBe(4);
    });

    it("should count overall race participants when gridType is overall even with lane bindingMode", () => {
      const overallWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            gridType: "overall",
            bindingMode: "lane",
            gridTotalLanes: 4,
          },
        },
      ];
      const parent = {
        participants: [{}, {}, {}, {}, {}, {}, {}, {}], // 8 overall drivers
        track: { lanes: [{}, {}, {}, {}] }, // 4 lanes
      };
      expect(
        LaneGridScrollHelper.getGridDataCount(overallWidgets, gridId, parent),
      ).toBe(8);
    });

    it("should count track lanes when columnKey is an overall column key in a heat grid", () => {
      const overallColWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            columnKey: "overallLapCount",
            bindingMode: "lane",
            gridTotalLanes: 4,
          },
        },
      ];
      const parent = {
        participants: [{}, {}, {}, {}, {}, {}], // 6 overall drivers
        track: { lanes: [{}, {}, {}, {}] }, // 4 lanes
      };
      expect(
        LaneGridScrollHelper.getGridDataCount(
          overallColWidgets,
          gridId,
          parent,
        ),
      ).toBe(4);
    });

    it("should count overall race participants when any widget has gridType overall even if first widget is heat", () => {
      const mixedWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            gridType: "heat",
            gridTotalLanes: 2,
          },
        },
        {
          ...widgets[1],
          customSettings: {
            ...widgets[1].customSettings,
            gridType: "overall",
            gridTotalLanes: 2,
          },
        },
      ];
      const parent = {
        participants: [{}, {}, {}, {}, {}, {}], // 6 overall drivers
        track: { lanes: [{}, {}] }, // 2 lanes
      };
      expect(
        LaneGridScrollHelper.getGridDataCount(mixedWidgets, gridId, parent),
      ).toBe(6);
    });

    it("should return 0 for overall grids when count is 0 outside editor mode", () => {
      const overallWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            gridType: "overall",
            gridTotalLanes: 10,
          },
        },
      ];
      expect(
        LaneGridScrollHelper.getGridDataCount(overallWidgets, gridId, {
          participants: [],
        }),
      ).toBe(0);
    });

    it("should return gridTotalLanes for overall grids when in editor mode even if count is 0", () => {
      const overallWidgets = [
        {
          ...widgets[0],
          customSettings: {
            ...widgets[0].customSettings,
            gridType: "overall",
            gridTotalLanes: 10,
          },
        },
      ];
      expect(
        LaneGridScrollHelper.getGridDataCount(overallWidgets, gridId, {
          participants: [],
          isUIEditorMode: () => true,
        }),
      ).toBe(10);
    });
  });

  describe("generateScrollableGridWidgets", () => {
    it("should return empty array if widgets do not match gridId", () => {
      expect(
        LaneGridScrollHelper.generateScrollableGridWidgets([], gridId, 5),
      ).toEqual([]);
    });

    it("should return unmodified widgets if dataCount is less than or equal to total lanes", () => {
      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        widgets,
        gridId,
        2,
      );
      expect(result.length).toBe(2);
      expect(result).toEqual(widgets);
    });

    it("should dynamically generate extra virtual rows when dataCount exceeds total lanes", () => {
      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        widgets,
        gridId,
        4,
      );

      expect(result.length).toBe(4);
      expect(result[0].id).toBe("c-0");
      expect(result[1].id).toBe("c-0_grid_lane_1");

      const generatedRow2 = result.find(
        (w) => w.customSettings?.["gridLane"] === 2,
      );
      const generatedRow3 = result.find(
        (w) => w.customSettings?.["gridLane"] === 3,
      );

      expect(generatedRow2).toBeDefined();
      expect(generatedRow3).toBeDefined();
      expect(generatedRow2?.y).toBe(200);
      expect(generatedRow3?.y).toBe(250);
      expect(generatedRow2?.customSettings?.["targetIndex"]).toBe(2);
      expect(generatedRow3?.customSettings?.["targetIndex"]).toBe(3);
    });

    it("should generate extra columns in horizontal direction", () => {
      const horizWidgets: AbsoluteWidgetNode[] = [
        {
          id: "h-0",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 200,
          zIndex: 5,
          customSettings: {
            gridId: "h-grid",
            gridLane: 0,
            targetIndex: 0,
            gridTotalLanes: 1,
            gridDirection: "horizontal",
          },
        },
      ];
      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        horizWidgets,
        "h-grid",
        2,
      );
      expect(result.length).toBe(2);
      expect(result[1].x).toBe(100);
    });

    it("should generate extra rows taking grid label into account", () => {
      const labeledWidgets: AbsoluteWidgetNode[] = [
        {
          id: "lbl-0",
          widgetType: "lane-column",
          x: 0,
          y: 40,
          width: 200,
          height: 80,
          zIndex: 5,
          customSettings: {
            gridId: "lbl-grid",
            gridLane: 0,
            targetIndex: 0,
            gridTotalLanes: 1,
            gridDirection: "vertical",
            gridBounds: { x: 0, y: 0, width: 200, height: 200 },
            gridLabelPosition: "top",
            gridLabelSize: 40,
          },
        },
      ];
      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        labeledWidgets,
        "lbl-grid",
        2,
      );
      expect(result.length).toBe(2);
      expect(result[1].y).toBe(200);
      expect(result[1].height).toBe(160);
    });

    it("should set explicitGridType to overall on generated widgets when any widget has gridType overall", () => {
      const mixedWidgets: AbsoluteWidgetNode[] = [
        {
          id: "m-0",
          widgetType: "lane-column",
          x: 100,
          y: 100,
          width: 200,
          height: 50,
          zIndex: 5,
          customSettings: {
            gridId,
            gridLane: 0,
            targetIndex: 0,
            gridTotalLanes: 2,
            gridDirection: "vertical",
            gridType: "heat",
          },
        },
        {
          id: "m-1",
          widgetType: "lane-column",
          x: 300,
          y: 100,
          width: 200,
          height: 50,
          zIndex: 5,
          customSettings: {
            gridId,
            gridLane: 0,
            targetIndex: 0,
            gridTotalLanes: 2,
            gridDirection: "vertical",
            gridType: "overall",
          },
        },
      ];
      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        mixedWidgets,
        gridId,
        4,
      );
      const generatedRow = result.filter(
        (w) => w.customSettings?.["gridLane"] === 2,
      );
      expect(generatedRow.length).toBe(2);
      expect(generatedRow[0].customSettings?.["gridType"]).toBe("overall");
      expect(generatedRow[1].customSettings?.["gridType"]).toBe("overall");
    });

    it("should omit rows where lane >= dataCount when dataCount is less than gridTotalLanes for overall grids", () => {
      // 10-row overall grid with 5 drivers
      const tenRowWidgets: AbsoluteWidgetNode[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `w-row-${i}`,
          widgetType: "lane-column",
          x: 100,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId,
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 10,
            gridType: "overall",
          },
        }),
      );

      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        tenRowWidgets,
        gridId,
        5,
      );

      // Only rows 0..4 should be present, rows 5..9 must be omitted
      expect(result.length).toBe(5);
      const lanes = result.map((w) => w.customSettings?.["gridLane"]);
      expect(lanes).toEqual([0, 1, 2, 3, 4]);
    });

    it("should respect startRowOffset when omitting rows for offset overall grids", () => {
      // 10-row overall grid with startRowOffset 11 (showing drivers 11-20)
      const offsetWidgets: AbsoluteWidgetNode[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `w-offset-row-${i}`,
          widgetType: "lane-column",
          x: 100,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId,
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 10,
            startRowOffset: 11,
            gridType: "overall",
          },
        }),
      );

      // When there are 15 drivers, rows 0..4 (drivers 11..15) are kept, rows 5..9 (drivers 16..20) are omitted
      const result15 = LaneGridScrollHelper.generateScrollableGridWidgets(
        offsetWidgets,
        gridId,
        15,
      );
      expect(result15.length).toBe(5);
      expect(result15.map((w) => w.customSettings?.["gridLane"])).toEqual([
        0, 1, 2, 3, 4,
      ]);

      // When there are only 10 drivers, all rows (drivers 11..20) are omitted
      const result10 = LaneGridScrollHelper.generateScrollableGridWidgets(
        offsetWidgets,
        gridId,
        10,
      );
      expect(result10.length).toBe(0);
    });

    it("should return only header widgets and 0 data rows when dataCount is 0 for overall grids", () => {
      const widgetsWithHeader: AbsoluteWidgetNode[] = [
        {
          id: "header-1",
          widgetType: "lane-column",
          x: 100,
          y: 60,
          width: 200,
          height: 36,
          zIndex: 5,
          customSettings: {
            gridId,
            gridTotalLanes: 10,
            gridType: "overall",
            isHeaderWidget: true,
          },
        },
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `data-row-${i}`,
          widgetType: "lane-column",
          x: 100,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId,
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 10,
            gridType: "overall",
            isHeaderWidget: false,
          },
        })),
      ];

      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        widgetsWithHeader,
        gridId,
        0,
      );

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("header-1");
    });

    it("should keep all rows when emptyRowsMode is empty or blank on overall grids", () => {
      const widgetsEmptyMode: AbsoluteWidgetNode[] = Array.from(
        { length: 4 },
        (_, i) => ({
          id: `row-${i}`,
          widgetType: "lane-column",
          x: 100,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId,
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 4,
            gridType: "overall",
            emptyRowsMode: "empty",
          },
        }),
      );

      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        widgetsEmptyMode,
        gridId,
        2,
      );
      expect(result.length).toBe(4);

      const widgetsBlankMode = widgetsEmptyMode.map((w) => ({
        ...w,
        customSettings: {
          ...w.customSettings,
          emptyRowsMode: "blank" as const,
        },
      }));
      const resultBlank = LaneGridScrollHelper.generateScrollableGridWidgets(
        widgetsBlankMode,
        gridId,
        2,
      );
      expect(resultBlank.length).toBe(4);
    });

    it("should filter rows when emptyRowsMode is remove on heat grids", () => {
      const heatWidgetsRemove: AbsoluteWidgetNode[] = Array.from(
        { length: 4 },
        (_, i) => ({
          id: `row-${i}`,
          widgetType: "lane-column",
          x: 100,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId,
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 4,
            gridType: "heat",
            emptyRowsMode: "remove",
          },
        }),
      );

      const result = LaneGridScrollHelper.generateScrollableGridWidgets(
        heatWidgetsRemove,
        gridId,
        2,
      );
      expect(result.length).toBe(2);
    });

    it("should prevent scrolling on earlier grids and only scroll excess drivers on the last grid for split offset grids", () => {
      // Setup user's scenario:
      // Grid 1 (left): rows 1-10 (startRowOffset: 1, gridTotalLanes: 10)
      // Grid 2 (right): rows 11-20 (startRowOffset: 11, gridTotalLanes: 10)
      const grid1Widgets: AbsoluteWidgetNode[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `g1-row-${i}`,
          widgetType: "lane-column",
          x: 100,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId: "grid-left",
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 10,
            startRowOffset: 1,
            gridType: "overall",
            bindingMode: "overallPosition",
            emptyRowsMode: "empty",
          },
        }),
      );

      const grid2Widgets: AbsoluteWidgetNode[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `g2-row-${i}`,
          widgetType: "lane-column",
          x: 400,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId: "grid-right",
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 10,
            startRowOffset: 11,
            gridType: "overall",
            bindingMode: "overallPosition",
            emptyRowsMode: "empty",
          },
        }),
      );

      const allWidgets = [...grid1Widgets, ...grid2Widgets];

      // When 25 drivers exist:
      // Left grid should NOT scroll at all and return only its 10 base widgets
      const leftResult25 = LaneGridScrollHelper.generateScrollableGridWidgets(
        allWidgets,
        "grid-left",
        25,
      );
      expect(leftResult25.length).toBe(10);
      expect(leftResult25.map((w) => w.customSettings?.["gridLane"])).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);

      // Right grid should only scroll drivers beyond index 20 (exactly 5 virtual rows for 25 drivers)
      const rightResult25 = LaneGridScrollHelper.generateScrollableGridWidgets(
        allWidgets,
        "grid-right",
        25,
      );
      expect(rightResult25.length).toBe(15);
      const rightLanes = rightResult25.map(
        (w) => w.customSettings?.["gridLane"],
      );
      expect(rightLanes).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      ]);
      // Verify virtual widget targetIndex and startRowOffset
      expect(rightResult25[10].customSettings?.["targetIndex"]).toBe(10);
      expect(rightResult25[10].customSettings?.["startRowOffset"]).toBe(11);
      expect(rightResult25[14].customSettings?.["targetIndex"]).toBe(14);
      expect(rightResult25[14].customSettings?.["startRowOffset"]).toBe(11);

      // When 20 drivers exist: right grid should have 0 virtual rows (no scrolling)
      const rightResult20 = LaneGridScrollHelper.generateScrollableGridWidgets(
        allWidgets,
        "grid-right",
        20,
      );
      expect(rightResult20.length).toBe(10);
    });

    it("should only scroll the last grid when 3 grids share the same data source", () => {
      // 3 grids of 10 lanes each (1-10, 11-20, 21-30)
      const g1Widgets: AbsoluteWidgetNode[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `g1-row-${i}`,
          widgetType: "lane-column",
          x: 100,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId: "g1",
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 10,
            startRowOffset: 1,
            gridType: "overall",
            bindingMode: "overallPosition",
          },
        }),
      );
      const g2Widgets: AbsoluteWidgetNode[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `g2-row-${i}`,
          widgetType: "lane-column",
          x: 350,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId: "g2",
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 10,
            startRowOffset: 11,
            gridType: "overall",
            bindingMode: "overallPosition",
          },
        }),
      );
      const g3Widgets: AbsoluteWidgetNode[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `g3-row-${i}`,
          widgetType: "lane-column",
          x: 600,
          y: 100 + i * 40,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId: "g3",
            gridLane: i,
            targetIndex: i,
            gridTotalLanes: 10,
            startRowOffset: 21,
            gridType: "overall",
            bindingMode: "overallPosition",
          },
        }),
      );

      const allWidgets = [...g1Widgets, ...g2Widgets, ...g3Widgets];

      // 35 drivers: Grid 1 and 2 do NOT scroll, Grid 3 scrolls 5 drivers (drivers 31-35)
      const resG1 = LaneGridScrollHelper.generateScrollableGridWidgets(
        allWidgets,
        "g1",
        35,
      );
      const resG2 = LaneGridScrollHelper.generateScrollableGridWidgets(
        allWidgets,
        "g2",
        35,
      );
      const resG3 = LaneGridScrollHelper.generateScrollableGridWidgets(
        allWidgets,
        "g3",
        35,
      );

      expect(resG1.length).toBe(10);
      expect(resG2.length).toBe(10);
      expect(resG3.length).toBe(15);
      expect(resG3[14].customSettings?.["targetIndex"]).toBe(14);
      expect(resG3[14].customSettings?.["startRowOffset"]).toBe(21);
    });
  });

  describe("getGridDataSourceKey", () => {
    it("should return correct keys for overall and heat configurations", () => {
      expect(
        LaneGridScrollHelper.getGridDataSourceKey("overall", "overallPosition"),
      ).toBe("overall:standings");
      expect(LaneGridScrollHelper.getGridDataSourceKey("overall", "lane")).toBe(
        "overall:standings",
      );
      expect(LaneGridScrollHelper.getGridDataSourceKey("overall", "seed")).toBe(
        "overall:seed",
      );
      expect(
        LaneGridScrollHelper.getGridDataSourceKey(undefined, "overallPosition"),
      ).toBe("overall:standings");
      expect(LaneGridScrollHelper.getGridDataSourceKey(undefined, "seed")).toBe(
        "overall:seed",
      );
      expect(
        LaneGridScrollHelper.getGridDataSourceKey("heat", "position"),
      ).toBe("heat:position");
      expect(LaneGridScrollHelper.getGridDataSourceKey("heat", "lane")).toBe(
        "heat:lane",
      );
      expect(
        LaneGridScrollHelper.getGridDataSourceKey(undefined, "position"),
      ).toBe("heat:position");
      expect(LaneGridScrollHelper.getGridDataSourceKey(undefined, "lane")).toBe(
        "heat:lane",
      );
    });
  });

  describe("hasHigherOffsetGrid", () => {
    it("should return false for empty or single grid layouts", () => {
      expect(LaneGridScrollHelper.hasHigherOffsetGrid([], "g1")).toBeFalse();
      const singleGrid: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 30,
          zIndex: 5,
          customSettings: { gridId: "g1", startRowOffset: 1 },
        },
      ];
      expect(
        LaneGridScrollHelper.hasHigherOffsetGrid(singleGrid, "g1"),
      ).toBeFalse();
    });

    it("should return true when a higher offset grid with the same data source exists", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 30,
          zIndex: 5,
          customSettings: {
            gridId: "g1",
            startRowOffset: 1,
            gridType: "overall",
            bindingMode: "overallPosition",
          },
        },
        {
          id: "w2",
          widgetType: "lane-column",
          x: 200,
          y: 0,
          width: 100,
          height: 30,
          zIndex: 5,
          customSettings: {
            gridId: "g2",
            startRowOffset: 11,
            gridType: "overall",
            bindingMode: "overallPosition",
          },
        },
      ];

      expect(
        LaneGridScrollHelper.hasHigherOffsetGrid(widgets, "g1"),
      ).toBeTrue();
      expect(
        LaneGridScrollHelper.hasHigherOffsetGrid(widgets, "g2"),
      ).toBeFalse();
    });

    it("should return false when higher offset grid is a different data source", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 30,
          zIndex: 5,
          customSettings: {
            gridId: "g1",
            startRowOffset: 1,
            gridType: "overall",
            bindingMode: "overallPosition",
          },
        },
        {
          id: "w2",
          widgetType: "lane-column",
          x: 200,
          y: 0,
          width: 100,
          height: 30,
          zIndex: 5,
          customSettings: {
            gridId: "g2",
            startRowOffset: 11,
            gridType: "heat",
            bindingMode: "position",
          },
        },
      ];

      // g1 is overall:standings, g2 is heat:position
      expect(
        LaneGridScrollHelper.hasHigherOffsetGrid(widgets, "g1"),
      ).toBeFalse();
      expect(
        LaneGridScrollHelper.hasHigherOffsetGrid(widgets, "g2"),
      ).toBeFalse();
    });
  });

  describe("computeGridDimensions", () => {
    const dataBounds = { x: 0, y: 0, width: 400, height: 400 };

    it("should allow scroll and compute height for single grid when dataCount exceeds lanes", () => {
      const session: LaneGridSession = {
        gridId: "single-grid",
        bounds: dataBounds,
        totalLanes: 10,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "overallPosition",
        gridType: "overall",
        startRowOffset: 1,
      };

      const result = LaneGridScrollHelper.computeGridDimensions(
        session,
        dataBounds,
        25,
      );

      expect(result.isVertical).toBeTrue();
      expect(result.pitch).toBe(40);
      expect(result.hasScroll).toBeTrue();
      expect(result.contentHeight).toBe(25 * 40);
      expect(result.contentWidth).toBe(400);
    });

    it("should disable scroll on left grid and scroll only excess on right grid when widgets are provided", () => {
      const allWidgets: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId: "grid-left",
            startRowOffset: 1,
            gridTotalLanes: 10,
            gridType: "overall",
            bindingMode: "overallPosition",
          },
        },
        {
          id: "w2",
          widgetType: "lane-column",
          x: 300,
          y: 0,
          width: 200,
          height: 40,
          zIndex: 5,
          customSettings: {
            gridId: "grid-right",
            startRowOffset: 11,
            gridTotalLanes: 10,
            gridType: "overall",
            bindingMode: "overallPosition",
          },
        },
      ];

      const leftSession: LaneGridSession = {
        gridId: "grid-left",
        bounds: dataBounds,
        totalLanes: 10,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "overallPosition",
        gridType: "overall",
        startRowOffset: 1,
      };

      const rightSession: LaneGridSession = {
        gridId: "grid-right",
        bounds: dataBounds,
        totalLanes: 10,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "overallPosition",
        gridType: "overall",
        startRowOffset: 11,
      };

      // 25 drivers
      const leftResult = LaneGridScrollHelper.computeGridDimensions(
        leftSession,
        dataBounds,
        25,
        allWidgets,
      );
      expect(leftResult.hasScroll).toBeFalse();
      expect(leftResult.contentHeight).toBe(10 * 40);

      const rightResult = LaneGridScrollHelper.computeGridDimensions(
        rightSession,
        dataBounds,
        25,
        allWidgets,
      );
      expect(rightResult.hasScroll).toBeTrue();
      expect(rightResult.contentHeight).toBe(15 * 40); // 10 base + 5 scroll

      // 20 drivers: right grid should not scroll
      const rightResult20 = LaneGridScrollHelper.computeGridDimensions(
        rightSession,
        dataBounds,
        20,
        allWidgets,
      );
      expect(rightResult20.hasScroll).toBeFalse();
      expect(rightResult20.contentHeight).toBe(10 * 40);

      // 15 drivers with remove empty rows: right grid contentHeight is 5 rows
      const rightRemoveSession: LaneGridSession = {
        ...rightSession,
        emptyRowsMode: "remove",
      };
      const rightResult15 = LaneGridScrollHelper.computeGridDimensions(
        rightRemoveSession,
        dataBounds,
        15,
        allWidgets,
      );
      expect(rightResult15.hasScroll).toBeFalse();
      expect(rightResult15.contentHeight).toBe(5 * 40);
    });
  });
});
