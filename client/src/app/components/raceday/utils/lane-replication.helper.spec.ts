import { AbsoluteWidgetNode } from "@app/models/settings";

import {
  LaneReplicationHelper,
  LaneReplicationOptions,
} from "./lane-replication.helper";

describe("LaneReplicationHelper", () => {
  const baseOptions: LaneReplicationOptions = {
    sourceBindingMode: "lane",
    sourceIndex: 0,
    direction: "horizontal",
    targetCount: 4,
    distributionMode: "auto-fit",
    replaceExisting: true,
    baseWidth: 1920,
    baseHeight: 1080,
  };

  it("should return empty array or original widgets if targetCount <= 1 or empty widgets", () => {
    expect(LaneReplicationHelper.replicateLaneWidgets([], baseOptions)).toEqual(
      [],
    );
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w1",
        widgetType: "lane-column",
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        zIndex: 100,
      },
    ];
    expect(
      LaneReplicationHelper.replicateLaneWidgets(widgets, {
        ...baseOptions,
        targetCount: 1,
      }),
    ).toBe(widgets);
  });

  it("should do nothing if no source widgets match the bindingMode and sourceIndex", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w1",
        widgetType: "lane-column",
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        zIndex: 100,
        customSettings: { bindingMode: "lane", targetIndex: 1 },
      },
      {
        id: "w2",
        widgetType: "timer",
        x: 500,
        y: 500,
        width: 200,
        height: 100,
        zIndex: 100,
      },
    ];

    const result = LaneReplicationHelper.replicateLaneWidgets(
      widgets,
      baseOptions,
    );
    expect(result).toEqual(widgets);
  });

  it("should replicate Lane 0 widgets horizontally across 4 lanes with auto-fit pitch", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-menu",
        widgetType: "menu-bar",
        x: 0,
        y: 0,
        width: 1920,
        height: 50,
        zIndex: 100,
      },
      {
        id: "w-col1",
        widgetType: "lane-column",
        x: 20,
        y: 100,
        width: 200,
        height: 80,
        zIndex: 101,
        customSettings: {
          columnKey: "lastLapTime",
          bindingMode: "lane",
          targetIndex: 0,
          showHeader: true,
        },
      },
      {
        id: "w-col2",
        widgetType: "lane-column",
        x: 20,
        y: 200,
        width: 200,
        height: 80,
        zIndex: 102,
        customSettings: {
          columnKey: "lapCount",
          bindingMode: "lane",
          targetIndex: 0,
          showHeader: true,
        },
      },
    ];

    const result = LaneReplicationHelper.replicateLaneWidgets(
      widgets,
      baseOptions,
    );

    // Total widgets: 1 menu-bar + 2 source Lane 0 widgets + (3 other lanes * 2 widgets) = 9
    expect(result.length).toBe(9);

    // Verify menu-bar is preserved
    expect(result.find((w) => w.id === "w-menu")).toBeDefined();

    // Verify lanes 1, 2, 3 were created
    for (let k = 1; k < 4; k++) {
      const laneWidgets = result.filter(
        (w) =>
          w.widgetType === "lane-column" &&
          w.customSettings?.["targetIndex"] === k &&
          w.customSettings?.["bindingMode"] === "lane",
      );
      expect(laneWidgets.length).toBe(2);

      // pitch is 1920 / 4 = 480
      const col1 = laneWidgets.find(
        (w) => w.customSettings?.["columnKey"] === "lastLapTime",
      );
      expect(col1).toBeDefined();
      expect(col1!.x).toBe(20 + k * 480);
      expect(col1!.y).toBe(100);

      const col2 = laneWidgets.find(
        (w) => w.customSettings?.["columnKey"] === "lapCount",
      );
      expect(col2).toBeDefined();
      expect(col2!.x).toBe(20 + k * 480);
      expect(col2!.y).toBe(200);
    }
  });

  it("should replicate Position 0 widgets vertically across 3 positions with preserve-spacing mode", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-p1",
        widgetType: "lane-column",
        x: 50,
        y: 40,
        width: 300,
        height: 100,
        zIndex: 101,
        customSettings: {
          columnKey: "driver.nickname",
          bindingMode: "position",
          targetIndex: 0,
        },
      },
    ];

    const result = LaneReplicationHelper.replicateLaneWidgets(widgets, {
      sourceBindingMode: "position",
      sourceIndex: 0,
      direction: "vertical",
      targetCount: 3,
      distributionMode: "preserve-spacing",
      replaceExisting: false,
      baseWidth: 1920,
      baseHeight: 1080,
    });

    // 1 source + 2 cloned = 3
    expect(result.length).toBe(3);

    // Height is 100, preserve-spacing pitch = 100 + 20 = 120
    const p2 = result.find(
      (w) =>
        w.customSettings?.["bindingMode"] === "position" &&
        w.customSettings?.["targetIndex"] === 1,
    );
    expect(p2).toBeDefined();
    expect(p2!.x).toBe(50);
    expect(p2!.y).toBe(40 + 120);

    const p3 = result.find(
      (w) =>
        w.customSettings?.["bindingMode"] === "position" &&
        w.customSettings?.["targetIndex"] === 2,
    );
    expect(p3).toBeDefined();
    expect(p3!.x).toBe(50);
    expect(p3!.y).toBe(40 + 240);
  });

  it("should replace existing widgets of target lanes when replaceExisting is true", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-lane0",
        widgetType: "lane-column",
        x: 0,
        y: 100,
        width: 200,
        height: 100,
        zIndex: 100,
        customSettings: {
          columnKey: "lastLapTime",
          bindingMode: "lane",
          targetIndex: 0,
        },
      },
      {
        id: "old-lane1",
        widgetType: "lane-column",
        x: 500,
        y: 100,
        width: 100,
        height: 50,
        zIndex: 100,
        customSettings: {
          columnKey: "lapCount",
          bindingMode: "lane",
          targetIndex: 1,
        },
      },
    ];

    const result = LaneReplicationHelper.replicateLaneWidgets(widgets, {
      ...baseOptions,
      targetCount: 2,
      replaceExisting: true,
    });

    // old-lane1 should have been removed and replaced with new clone of lane0
    expect(result.find((w) => w.id === "old-lane1")).toBeUndefined();
    const lane1 = result.find((w) => w.customSettings?.["targetIndex"] === 1);
    expect(lane1).toBeDefined();
    expect(lane1!.customSettings?.["columnKey"]).toBe("lastLapTime");
  });

  it("should clamp coordinates within canvas boundaries", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-edge",
        widgetType: "lane-column",
        x: 1800,
        y: 100,
        width: 200,
        height: 100,
        zIndex: 100,
        customSettings: {
          columnKey: "lastLapTime",
          bindingMode: "lane",
          targetIndex: 0,
        },
      },
    ];

    const result = LaneReplicationHelper.replicateLaneWidgets(widgets, {
      ...baseOptions,
      targetCount: 2,
    });

    const lane1 = result.find((w) => w.customSettings?.["targetIndex"] === 1);
    expect(lane1).toBeDefined();
    // Clamped so x <= baseWidth - width = 1920 - 200 = 1720
    expect(lane1!.x).toBeLessThanOrEqual(1720);
  });
});
