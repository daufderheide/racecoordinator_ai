import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridSession } from "./lane-grid-replication.helper";
import { LaneGridSelectionHelper } from "./lane-grid-selection.helper";

describe("LaneGridSelectionHelper", () => {
  const createMockSession = (
    direction: "vertical" | "horizontal" = "vertical",
    gridId = "grid-test",
    sourceLaneIndex = 0,
  ): LaneGridSession => ({
    gridId,
    bounds: { x: 100, y: 100, width: 600, height: 300 },
    totalLanes: 3,
    direction,
    sourceLaneIndex,
    bindingMode: "lane",
    headerPlacement: "top",
    headerHeight: 36,
  });

  const createMockWidget = (
    partial: Partial<AbsoluteWidgetNode> & { id: string; widgetType: any },
  ): AbsoluteWidgetNode => ({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    zIndex: 100,
    ...partial,
  });

  it("should return null if widgetsAfter is empty or undefined", () => {
    expect(
      LaneGridSelectionHelper.findNextWidgetAfterDeletion("w1", [], []),
    ).toBeNull();
    expect(
      LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "w1",
        [],
        null as any,
      ),
    ).toBeNull();
  });

  it("should return default widget (lane-view or first widget) if deleted widget is not in a grid", () => {
    const widgetsBefore: AbsoluteWidgetNode[] = [
      createMockWidget({
        id: "stand-alone-1",
        widgetType: "timer",
        x: 10,
        y: 10,
        width: 100,
        height: 50,
      }),
      createMockWidget({
        id: "lv-1",
        widgetType: "lane-view",
        x: 100,
        y: 100,
        width: 400,
        height: 200,
      }),
      createMockWidget({
        id: "clock-1",
        widgetType: "clock",
        x: 200,
        y: 200,
        width: 80,
        height: 40,
      }),
    ];
    const widgetsAfter: AbsoluteWidgetNode[] = [
      widgetsBefore[1],
      widgetsBefore[2],
    ];

    const result = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
      "stand-alone-1",
      widgetsBefore,
      widgetsAfter,
    );
    expect(result).toBe("lv-1");
  });

  it("should return first widget if lane-view does not exist and deleted widget is not in a grid", () => {
    const widgetsBefore: AbsoluteWidgetNode[] = [
      createMockWidget({
        id: "w1",
        widgetType: "timer",
        x: 10,
        y: 10,
        width: 100,
        height: 50,
      }),
      createMockWidget({
        id: "w2",
        widgetType: "clock",
        x: 200,
        y: 200,
        width: 80,
        height: 40,
      }),
    ];
    const widgetsAfter: AbsoluteWidgetNode[] = [widgetsBefore[1]];

    const result = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
      "w1",
      widgetsBefore,
      widgetsAfter,
    );
    expect(result).toBe("w2");
  });

  it("should return default widget if deleted widget was the last widget in the grid", () => {
    const session = createMockSession("vertical", "grid-only");
    const widgetsBefore: AbsoluteWidgetNode[] = [
      createMockWidget({
        id: "col1",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        customSettings: { gridId: "grid-only", gridLane: 0 },
      }),
      createMockWidget({
        id: "lv",
        widgetType: "lane-view",
        x: 0,
        y: 0,
        width: 400,
        height: 200,
      }),
    ];
    const widgetsAfter: AbsoluteWidgetNode[] = [widgetsBefore[1]];

    const result = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
      "col1",
      widgetsBefore,
      widgetsAfter,
      session,
    );
    expect(result).toBe("lv");
  });

  describe("vertical grid column selection", () => {
    const session = createMockSession("vertical", "grid-vert");
    const colA = createMockWidget({
      id: "colA",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 80,
      height: 40,
      customSettings: { gridId: "grid-vert", gridLane: 0, columnKey: "pos" },
    });
    const colB = createMockWidget({
      id: "colB",
      widgetType: "lane-column",
      x: 190,
      y: 100,
      width: 120,
      height: 40,
      customSettings: { gridId: "grid-vert", gridLane: 0, columnKey: "driver" },
    });
    const colC = createMockWidget({
      id: "colC",
      widgetType: "lane-column",
      x: 320,
      y: 100,
      width: 100,
      height: 40,
      customSettings: {
        gridId: "grid-vert",
        gridLane: 0,
        columnKey: "lapTime",
      },
    });
    const nonGridWidget = createMockWidget({
      id: "lv-main",
      widgetType: "lane-view",
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });

    it("should advance to next column when first column (leftmost) is deleted", () => {
      const before = [colA, colB, colC, nonGridWidget];
      const after = [colB, colC, nonGridWidget];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "colA",
        before,
        after,
        session,
      );
      expect(next).toBe("colB");
    });

    it("should advance to next column when middle column is deleted", () => {
      const before = [colA, colB, colC, nonGridWidget];
      const after = [colA, colC, nonGridWidget];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "colB",
        before,
        after,
        session,
      );
      expect(next).toBe("colC");
    });

    it("should select previous column when last column (rightmost) is deleted", () => {
      const before = [colA, colB, colC, nonGridWidget];
      const after = [colA, colB, nonGridWidget];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "colC",
        before,
        after,
        session,
      );
      expect(next).toBe("colB");
    });

    it("should resolve master id when deleting replica widget and stay within grid", () => {
      const replicaColB = createMockWidget({
        id: "colB_grid_lane_1",
        widgetType: "lane-column",
        x: 190,
        y: 150,
        width: 120,
        height: 40,
        customSettings: {
          gridId: "grid-vert",
          gridLane: 1,
          gridMasterId: "colB",
        },
      });
      const before = [colA, colB, replicaColB, colC, nonGridWidget];
      const after = [colA, colC, nonGridWidget];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "colB_grid_lane_1",
        before,
        after,
        session,
      );
      expect(next).toBe("colC");
    });

    it("should resolve master id when deleting header widget and stay within grid", () => {
      const headerColB = createMockWidget({
        id: "colB_grid_header",
        widgetType: "lane-column",
        x: 190,
        y: 60,
        width: 120,
        height: 36,
        customSettings: {
          gridId: "grid-vert",
          isHeaderWidget: true,
          gridMasterId: "colB",
        },
      });
      const before = [colA, colB, headerColB, colC, nonGridWidget];
      const after = [colA, colC, nonGridWidget];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "colB_grid_header",
        before,
        after,
        session,
      );
      expect(next).toBe("colC");
    });
  });

  describe("horizontal grid row selection", () => {
    const session = createMockSession("horizontal", "grid-horiz");
    const row1 = createMockWidget({
      id: "row1",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 200,
      height: 30,
      customSettings: { gridId: "grid-horiz", gridLane: 0 },
    });
    const row2 = createMockWidget({
      id: "row2",
      widgetType: "lane-column",
      x: 100,
      y: 140,
      width: 200,
      height: 30,
      customSettings: { gridId: "grid-horiz", gridLane: 0 },
    });
    const row3 = createMockWidget({
      id: "row3",
      widgetType: "lane-column",
      x: 100,
      y: 180,
      width: 200,
      height: 30,
      customSettings: { gridId: "grid-horiz", gridLane: 0 },
    });
    const nonGridWidget = createMockWidget({
      id: "lv-main",
      widgetType: "lane-view",
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });

    it("should advance to next row when middle row is deleted in horizontal grid", () => {
      const before = [row1, row2, row3, nonGridWidget];
      const after = [row1, row3, nonGridWidget];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "row2",
        before,
        after,
        session,
      );
      expect(next).toBe("row3");
    });

    it("should select previous row when bottom row is deleted in horizontal grid", () => {
      const before = [row1, row2, row3, nonGridWidget];
      const after = [row1, row2, nonGridWidget];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "row3",
        before,
        after,
        session,
      );
      expect(next).toBe("row2");
    });
  });

  describe("edge cases & fallbacks", () => {
    it("should work when session is null but widget has gridId in customSettings", () => {
      const col1 = createMockWidget({
        id: "c1",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 100,
        height: 40,
        customSettings: { gridId: "grid-no-session", gridLane: 0 },
      });
      const col2 = createMockWidget({
        id: "c2",
        widgetType: "lane-column",
        x: 210,
        y: 100,
        width: 100,
        height: 40,
        customSettings: { gridId: "grid-no-session", gridLane: 0 },
      });
      const before = [col1, col2];
      const after = [col2];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "c1",
        before,
        after,
        null,
      );
      expect(next).toBe("c2");
    });

    it("should fallback to any remaining widget in grid if no candidate master widgets remain", () => {
      const w1 = createMockWidget({
        id: "w1",
        widgetType: "custom:test",
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        customSettings: { gridId: "grid-unconventional" },
      });
      const w2 = createMockWidget({
        id: "w2",
        widgetType: "custom:test",
        x: 210,
        y: 100,
        width: 100,
        height: 50,
        customSettings: { gridId: "grid-unconventional" },
      });

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "w1",
        [w1, w2],
        [w2],
        null,
      );
      expect(next).toBe("w2");
    });

    it("should handle multi-widget cell stacked vertically in vertical grid", () => {
      const session = createMockSession("vertical", "grid-2d");
      const col1Top = createMockWidget({
        id: "c1-top",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 100,
        height: 25,
        customSettings: { gridId: "grid-2d", gridLane: 0 },
      });
      const col1Bottom = createMockWidget({
        id: "c1-bottom",
        widgetType: "lane-column",
        x: 100,
        y: 130,
        width: 100,
        height: 25,
        customSettings: { gridId: "grid-2d", gridLane: 0 },
      });
      const col2 = createMockWidget({
        id: "c2",
        widgetType: "lane-column",
        x: 220,
        y: 100,
        width: 100,
        height: 55,
        customSettings: { gridId: "grid-2d", gridLane: 0 },
      });

      const before = [col1Top, col1Bottom, col2];
      const after = [col1Bottom, col2];

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "c1-top",
        before,
        after,
        session,
      );
      expect(next).toBe("c1-bottom");
    });

    it("should derive grid widgets from widgetsAfter when widgetsBefore is empty", () => {
      const session = createMockSession("vertical", "grid-empty-before");
      const col2 = createMockWidget({
        id: "c2",
        widgetType: "lane-column",
        x: 210,
        y: 100,
        width: 100,
        height: 40,
        customSettings: { gridId: "grid-empty-before", gridLane: 0 },
      });

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "c1",
        [],
        [col2],
        session,
      );
      expect(next).toBe("c2");
    });

    it("should fallback to non-replica widgets if no widgets match sourceLaneIndex", () => {
      const session = createMockSession("vertical", "grid-fallback-lane", 5);
      const col1 = createMockWidget({
        id: "c1",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 100,
        height: 40,
        customSettings: { gridId: "grid-fallback-lane", gridLane: 1 },
      });
      const col2 = createMockWidget({
        id: "c2",
        widgetType: "lane-column",
        x: 210,
        y: 100,
        width: 100,
        height: 40,
        customSettings: { gridId: "grid-fallback-lane", gridLane: 1 },
      });

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "c1",
        [col1, col2],
        [col2],
        session,
      );
      expect(next).toBe("c2");
    });

    it("should fallback to all grid widgets if only replicas exist", () => {
      const session = createMockSession("vertical", "grid-fallback-replica", 0);
      const rep1 = createMockWidget({
        id: "r1",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 100,
        height: 40,
        customSettings: {
          gridId: "grid-fallback-replica",
          gridMasterId: "external-master",
          isHeaderWidget: true,
        },
      });
      const rep2 = createMockWidget({
        id: "r2",
        widgetType: "lane-column",
        x: 210,
        y: 100,
        width: 100,
        height: 40,
        customSettings: {
          gridId: "grid-fallback-replica",
          gridMasterId: "external-master",
          isHeaderWidget: true,
        },
      });

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "r1",
        [rep1, rep2],
        [rep2],
        session,
      );
      expect(next).toBe("r2");
    });

    it("should select remaining replica in grid if no candidate masters remain in widgetsAfter", () => {
      const session = createMockSession("vertical", "grid-rep-remaining", 0);
      const master = createMockWidget({
        id: "m1",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 100,
        height: 40,
        customSettings: { gridId: "grid-rep-remaining", gridLane: 0 },
      });
      const replica = createMockWidget({
        id: "rep1",
        widgetType: "lane-column",
        x: 100,
        y: 150,
        width: 100,
        height: 40,
        customSettings: {
          gridId: "grid-rep-remaining",
          gridLane: 1,
          gridMasterId: "m1",
        },
      });

      const next = LaneGridSelectionHelper.findNextWidgetAfterDeletion(
        "m1",
        [master, replica],
        [replica],
        session,
      );
      expect(next).toBe("rep1");
    });

    it("should handle null or empty inputs in static helpers", () => {
      expect(LaneGridSelectionHelper.hasGridWidgets([], "g1")).toBeFalse();
      expect(
        LaneGridSelectionHelper.hasGridWidgets(null as any, "g1"),
      ).toBeFalse();
      expect(LaneGridSelectionHelper.findDefaultWidget([])).toBeNull();
      expect(LaneGridSelectionHelper.findDefaultWidget(null as any)).toBeNull();
    });
  });
});
