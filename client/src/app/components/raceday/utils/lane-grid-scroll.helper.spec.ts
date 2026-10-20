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

    it("should count overall race participants when columnKey is an overall column key", () => {
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
      ).toBe(6);
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
  });
});
