import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridCleanupHelper } from "./lane-grid-cleanup.helper";

describe("LaneGridCleanupHelper", () => {
  it("should handle empty or null widgets array", () => {
    expect(LaneGridCleanupHelper.cleanOrphanedGridWidgets([])).toEqual([]);
    expect(
      LaneGridCleanupHelper.cleanOrphanedGridWidgets(
        null as unknown as AbsoluteWidgetNode[],
      ),
    ).toEqual([]);
  });

  it("should retain widgets that do not have a gridMasterId", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w1",
        widgetType: "label",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 1,
      },
      {
        id: "w2",
        widgetType: "timer",
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        zIndex: 1,
      },
    ];
    const result = LaneGridCleanupHelper.cleanOrphanedGridWidgets(widgets);
    expect(result.length).toBe(2);
    expect(result.map((w) => w.id)).toEqual(["w1", "w2"]);
  });

  it("should retain mirrored widgets whose master exists in the list", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "master-1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: { gridId: "g1", gridLane: 0 },
      },
      {
        id: "master-1_grid_lane_1",
        widgetType: "lane-column",
        x: 0,
        y: 60,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId: "g1",
          gridLane: 1,
          gridMasterId: "master-1",
        },
      },
    ];
    const result = LaneGridCleanupHelper.cleanOrphanedGridWidgets(widgets);
    expect(result.length).toBe(2);
  });

  it("should prune orphaned mirrored widgets whose master does not exist", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "master-1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: { gridId: "g1", gridLane: 0 },
      },
      {
        id: "master-deleted_grid_lane_1",
        widgetType: "lane-column",
        x: 0,
        y: 60,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId: "g1",
          gridLane: 1,
          gridMasterId: "master-deleted",
        },
      },
      {
        id: "master-1_grid_lane_1",
        widgetType: "lane-column",
        x: 0,
        y: 120,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId: "g1",
          gridLane: 1,
          gridMasterId: "master-1",
        },
      },
    ];
    const result = LaneGridCleanupHelper.cleanOrphanedGridWidgets(widgets);
    expect(result.length).toBe(2);
    expect(result.map((w) => w.id)).toEqual([
      "master-1",
      "master-1_grid_lane_1",
    ]);
  });
});
