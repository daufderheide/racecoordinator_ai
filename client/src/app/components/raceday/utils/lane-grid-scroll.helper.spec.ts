import { AbsoluteWidgetNode } from "@app/models/settings";

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
  });
});
