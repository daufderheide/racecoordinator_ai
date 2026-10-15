import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridAnimationHelper } from "./lane-grid-animation.helper";

describe("LaneGridAnimationHelper", () => {
  beforeEach(() => {
    LaneGridAnimationHelper.reset();
  });

  afterEach(() => {
    LaneGridAnimationHelper.reset();
  });

  function createWidget(
    overrides: Partial<AbsoluteWidgetNode> = {},
    customSettings: Record<string, any> = {},
  ): AbsoluteWidgetNode {
    return {
      id: "widget-1",
      widgetType: "lane-column",
      x: 100,
      y: 200,
      width: 150,
      height: 50,
      zIndex: 100,
      customSettings: {
        gridId: "grid-test-1",
        gridLane: 0,
        targetIndex: 0,
        bindingMode: "position",
        columnKey: "driver.name",
        ...customSettings,
      },
      ...overrides,
    };
  }

  describe("resolveEntityId", () => {
    it("should return null if widget or parent is missing", () => {
      expect(LaneGridAnimationHelper.resolveEntityId(null, {})).toBeNull();
      expect(
        LaneGridAnimationHelper.resolveEntityId(createWidget(), null),
      ).toBeNull();
    });

    it("should return null for header widgets or widgets without gridId", () => {
      const headerWidget = createWidget({}, { isHeaderWidget: true });
      expect(
        LaneGridAnimationHelper.resolveEntityId(headerWidget, {}),
      ).toBeNull();

      const nonGridWidget = createWidget({}, { gridId: undefined });
      expect(
        LaneGridAnimationHelper.resolveEntityId(nonGridWidget, {}),
      ).toBeNull();
    });

    it("should return null if bindingMode is lane or seed", () => {
      const laneWidget = createWidget({}, { bindingMode: "lane" });
      expect(
        LaneGridAnimationHelper.resolveEntityId(laneWidget, {}),
      ).toBeNull();

      const seedWidget = createWidget({}, { bindingMode: "seed" });
      expect(
        LaneGridAnimationHelper.resolveEntityId(seedWidget, {}),
      ).toBeNull();
    });

    it("should resolve entityId in position mode regardless of sortByBindingMode setting", () => {
      const widget = createWidget(
        {},
        { targetIndex: 0, bindingMode: "position", sortByBindingMode: false },
      );
      const parent = {
        driverRankings: new Map([["driver-a", 1]]),
        heatDrivers: [{ objectId: "driver-a", laneIndex: 0 }],
      };
      expect(LaneGridAnimationHelper.resolveEntityId(widget, parent)).toBe(
        "driver-a",
      );
    });

    it("should resolve entityId in position mode using driverRankings map", () => {
      const widget = createWidget(
        {},
        { targetIndex: 0, bindingMode: "position" },
      );
      const parent = {
        driverRankings: new Map([
          ["driver-a", 2],
          ["driver-b", 1],
        ]),
        heatDrivers: [
          { objectId: "driver-a", laneIndex: 0 },
          { objectId: "driver-b", laneIndex: 1 },
        ],
      };

      // targetIndex 0 -> rank 1 -> driver-b
      expect(LaneGridAnimationHelper.resolveEntityId(widget, parent)).toBe(
        "driver-b",
      );
    });

    it("should resolve entityId in position mode using heat.standings array", () => {
      const widget = createWidget(
        {},
        { targetIndex: 1, bindingMode: "position" },
      );
      const parent = {
        heat: {
          objectId: "heat-1",
          standings: ["driver-x", "driver-y"],
          heatDrivers: [
            { objectId: "driver-x", laneIndex: 0 },
            { objectId: "driver-y", laneIndex: 1 },
          ],
        },
      };

      // targetIndex 1 -> standings[1] -> driver-y
      expect(LaneGridAnimationHelper.resolveEntityId(widget, parent)).toBe(
        "driver-y",
      );
    });

    it("should fallback to performance sorting in position mode when standings and rankings are absent", () => {
      const widget = createWidget(
        {},
        { targetIndex: 0, bindingMode: "position" },
      );
      const parent = {
        sortedHeatDrivers: [
          { objectId: "driver-slow", lapCount: 5, totalTime: 10 },
          { objectId: "driver-fast", lapCount: 10, totalTime: 9 },
        ] as any[],
      };

      expect(LaneGridAnimationHelper.resolveEntityId(widget, parent)).toBe(
        "driver-fast",
      );
    });

    it("should resolve entityId in overallPosition mode using participants rank", () => {
      const widget = createWidget(
        {},
        { targetIndex: 0, bindingMode: "overallPosition" },
      );
      const parent = {
        participants: [
          { rank: 2, driver: { entity_id: "p-driver-2" }, objectId: "part-2" },
          { rank: 1, driver: { entity_id: "p-driver-1" }, objectId: "part-1" },
        ],
      };

      // targetIndex 0 -> rank 1 -> p-driver-1
      expect(LaneGridAnimationHelper.resolveEntityId(widget, parent)).toBe(
        "p-driver-1",
      );
    });

    it("should fallback to participant index in overallPosition mode when rank is not matched", () => {
      const widget = createWidget(
        {},
        { targetIndex: 1, bindingMode: "overallPosition" },
      );
      const parent = {
        participants: [
          { rank: 5, objectId: "part-zero" },
          { rank: 6, objectId: "part-one" },
        ],
      };

      expect(LaneGridAnimationHelper.resolveEntityId(widget, parent)).toBe(
        "part-one",
      );
    });
  });

  describe("getShiftDelta and recordPosition", () => {
    it("should return null if isCustomizing is true", () => {
      const widget = createWidget();
      const parent = {
        driverRankings: new Map([["driver-1", 1]]),
        heatDrivers: [{ objectId: "driver-1", laneIndex: 0 }],
      };

      expect(
        LaneGridAnimationHelper.getShiftDelta(widget, parent, true),
      ).toBeNull();
    });

    it("should return null on initial render when no previous row exists", () => {
      const widget = createWidget(
        { x: 100, y: 200 },
        { targetIndex: 0, gridLane: 0 },
      );
      const parent = {
        heat: { objectId: "heat-1" },
        driverRankings: new Map([["driver-1", 1]]),
        heatDrivers: [{ objectId: "driver-1", laneIndex: 0 }],
      };

      const delta = LaneGridAnimationHelper.getShiftDelta(
        widget,
        parent,
        false,
      );
      expect(delta).toBeNull();
    });

    it("should return null if entity remained in the same row", async () => {
      const widget = createWidget(
        { x: 100, y: 200 },
        { targetIndex: 0, gridLane: 0 },
      );
      const parent = {
        heat: { objectId: "heat-1" },
        driverRankings: new Map([["driver-1", 1]]),
        heatDrivers: [{ objectId: "driver-1", laneIndex: 0 }],
      };

      // Initial record
      LaneGridAnimationHelper.recordPosition(widget, "driver-1", "heat-1");

      // Wait for microtask commit
      await Promise.resolve();

      // Same row (0 -> 0)
      const delta = LaneGridAnimationHelper.getShiftDelta(
        widget,
        parent,
        false,
      );
      expect(delta).toBeNull();
    });

    it("should return null if bindingMode is lane", () => {
      const widget = createWidget({}, { targetIndex: 0, bindingMode: "lane" });
      const parent = {
        heat: { objectId: "heat-1" },
        driverRankings: new Map([["driver-a", 1]]),
        heatDrivers: [{ objectId: "driver-a", laneIndex: 0 }],
      };
      expect(
        LaneGridAnimationHelper.getShiftDelta(widget, parent, false),
      ).toBeNull();
    });

    it("should return correct vertical shift delta when driver moves between rows", async () => {
      const widgetRow0 = createWidget(
        { id: "w-row0", x: 100, y: 200 },
        { targetIndex: 0, gridLane: 0 },
      );
      const widgetRow1 = createWidget(
        { id: "w-row1", x: 100, y: 260 },
        { targetIndex: 1, gridLane: 1 },
      );

      // Baseline: Alice in row 0, Bob in row 1
      LaneGridAnimationHelper.recordPosition(widgetRow0, "alice", "heat-1");
      LaneGridAnimationHelper.recordPosition(widgetRow1, "bob", "heat-1");

      await Promise.resolve();

      // Now Bob overtakes Alice!
      // Row 0 now resolves Bob
      const parentWithBobLeading = {
        heat: { objectId: "heat-1" },
        driverRankings: new Map([
          ["bob", 1],
          ["alice", 2],
        ]),
        heatDrivers: [
          { objectId: "alice", laneIndex: 0 },
          { objectId: "bob", laneIndex: 1 },
        ],
      };

      // Check Row 0 (Bob was in row 1 at y=260, now at y=200 -> deltaY = +60px)
      const deltaRow0 = LaneGridAnimationHelper.getShiftDelta(
        widgetRow0,
        parentWithBobLeading,
        false,
      );
      expect(deltaRow0).toEqual({ deltaX: 0, deltaY: 60 });

      // Check Row 1 (Alice was in row 0 at y=200, now at y=260 -> deltaY = -60px)
      const deltaRow1 = LaneGridAnimationHelper.getShiftDelta(
        widgetRow1,
        parentWithBobLeading,
        false,
      );
      expect(deltaRow1).toEqual({ deltaX: 0, deltaY: -60 });
    });

    it("should return correct horizontal shift delta when driver moves between columns", async () => {
      const widgetCol0 = createWidget(
        { id: "w-col0", x: 100, y: 200 },
        { targetIndex: 0, gridLane: 0 },
      );
      const widgetCol1 = createWidget(
        { id: "w-col1", x: 250, y: 200 },
        { targetIndex: 1, gridLane: 1 },
      );

      // Baseline: Driver 1 in Col 0, Driver 2 in Col 1
      LaneGridAnimationHelper.recordPosition(widgetCol0, "driver-1", "heat-1");
      LaneGridAnimationHelper.recordPosition(widgetCol1, "driver-2", "heat-1");

      await Promise.resolve();

      // Standings change: Driver 2 in Col 0 (x=100), Driver 1 in Col 1 (x=250)
      const parent = {
        heat: { objectId: "heat-1" },
        driverRankings: new Map([
          ["driver-2", 1],
          ["driver-1", 2],
        ]),
        heatDrivers: [
          { objectId: "driver-1", laneIndex: 0 },
          { objectId: "driver-2", laneIndex: 1 },
        ],
      };

      // Col 0: Driver 2 came from Col 1 (x=250), current x=100 -> deltaX = +150px
      const deltaCol0 = LaneGridAnimationHelper.getShiftDelta(
        widgetCol0,
        parent,
        false,
      );
      expect(deltaCol0).toEqual({ deltaX: 150, deltaY: 0 });

      // Col 1: Driver 1 came from Col 0 (x=100), current x=250 -> deltaX = -150px
      const deltaCol1 = LaneGridAnimationHelper.getShiftDelta(
        widgetCol1,
        parent,
        false,
      );
      expect(deltaCol1).toEqual({ deltaX: -150, deltaY: 0 });
    });

    it("should reset tracking state when heat objectId changes", async () => {
      const widgetRow0 = createWidget(
        { id: "w-row0", x: 100, y: 200 },
        { targetIndex: 0, gridLane: 0 },
      );
      const widgetRow1 = createWidget(
        { id: "w-row1", x: 100, y: 260 },
        { targetIndex: 1, gridLane: 1 },
      );

      // Heat 1 baseline
      LaneGridAnimationHelper.recordPosition(widgetRow0, "alice", "heat-1");
      LaneGridAnimationHelper.recordPosition(widgetRow1, "bob", "heat-1");
      await Promise.resolve();

      // Now heat changes to Heat 2
      const parentHeat2 = {
        heat: { objectId: "heat-2" },
        driverRankings: new Map([
          ["bob", 1],
          ["alice", 2],
        ]),
        heatDrivers: [
          { objectId: "alice", laneIndex: 0 },
          { objectId: "bob", laneIndex: 1 },
        ],
      };

      // First render of Heat 2 should reset and return null (no animation across heats)
      const delta = LaneGridAnimationHelper.getShiftDelta(
        widgetRow0,
        parentHeat2,
        false,
      );
      expect(delta).toBeNull();
    });

    it("should reset tracking state when reset() is explicitly called", async () => {
      const widgetRow0 = createWidget(
        { id: "w-row0", x: 100, y: 200 },
        { targetIndex: 0, gridLane: 0 },
      );
      const widgetRow1 = createWidget(
        { id: "w-row1", x: 100, y: 260 },
        { targetIndex: 1, gridLane: 1 },
      );

      LaneGridAnimationHelper.recordPosition(widgetRow0, "alice", "heat-1");
      LaneGridAnimationHelper.recordPosition(widgetRow1, "bob", "heat-1");
      await Promise.resolve();

      // Explicit reset
      LaneGridAnimationHelper.reset();

      const parent = {
        heat: { objectId: "heat-1" },
        driverRankings: new Map([
          ["bob", 1],
          ["alice", 2],
        ]),
        heatDrivers: [
          { objectId: "alice", laneIndex: 0 },
          { objectId: "bob", laneIndex: 1 },
        ],
      };

      const delta = LaneGridAnimationHelper.getShiftDelta(
        widgetRow0,
        parent,
        false,
      );
      expect(delta).toBeNull();
    });

    it("should handle multiple columns in the same row uniformly", async () => {
      const nameColRow0 = createWidget(
        { id: "w-name-0", x: 100, y: 200 },
        { targetIndex: 0, gridLane: 0, columnKey: "driver.name" },
      );
      const lapsColRow0 = createWidget(
        { id: "w-laps-0", x: 300, y: 200 },
        { targetIndex: 0, gridLane: 0, columnKey: "driver.lapCount" },
      );
      const nameColRow1 = createWidget(
        { id: "w-name-1", x: 100, y: 280 },
        { targetIndex: 1, gridLane: 1, columnKey: "driver.name" },
      );
      const lapsColRow1 = createWidget(
        { id: "w-laps-1", x: 300, y: 280 },
        { targetIndex: 1, gridLane: 1, columnKey: "driver.lapCount" },
      );

      // Baseline
      LaneGridAnimationHelper.recordPosition(nameColRow0, "alice", "heat-1");
      LaneGridAnimationHelper.recordPosition(lapsColRow0, "alice", "heat-1");
      LaneGridAnimationHelper.recordPosition(nameColRow1, "bob", "heat-1");
      LaneGridAnimationHelper.recordPosition(lapsColRow1, "bob", "heat-1");
      await Promise.resolve();

      // Bob moves to Row 0
      const parent = {
        heat: { objectId: "heat-1" },
        driverRankings: new Map([
          ["bob", 1],
          ["alice", 2],
        ]),
        heatDrivers: [
          { objectId: "alice", laneIndex: 0 },
          { objectId: "bob", laneIndex: 1 },
        ],
      };

      const deltaName0 = LaneGridAnimationHelper.getShiftDelta(
        nameColRow0,
        parent,
        false,
      );
      const deltaLaps0 = LaneGridAnimationHelper.getShiftDelta(
        lapsColRow0,
        parent,
        false,
      );

      expect(deltaName0).toEqual({ deltaX: 0, deltaY: 80 });
      expect(deltaLaps0).toEqual({ deltaX: 0, deltaY: 80 });
    });

    it("should animate custom widgets in grids using widgetType as fallback columnKey", async () => {
      const customRow0 = createWidget(
        { id: "w-c0", widgetType: "custom:gauge" as any, x: 100, y: 100 },
        {
          gridId: "grid-test",
          targetIndex: 0,
          gridLane: 0,
          bindingMode: "position",
        },
      );
      const customRow1 = createWidget(
        { id: "w-c1", widgetType: "custom:gauge" as any, x: 100, y: 160 },
        {
          gridId: "grid-test",
          targetIndex: 1,
          gridLane: 1,
          bindingMode: "position",
        },
      );

      LaneGridAnimationHelper.recordPosition(customRow0, "driver-1", "heat-1");
      LaneGridAnimationHelper.recordPosition(customRow1, "driver-2", "heat-1");
      await Promise.resolve();

      // Driver 2 takes lead -> moves to Row 0
      const parent = {
        heat: { objectId: "heat-1" },
        driverRankings: new Map([
          ["driver-2", 1],
          ["driver-1", 2],
        ]),
        heatDrivers: [
          { objectId: "driver-1", laneIndex: 0 },
          { objectId: "driver-2", laneIndex: 1 },
        ],
      };

      const deltaRow0 = LaneGridAnimationHelper.getShiftDelta(
        customRow0,
        parent,
        false,
      );
      expect(deltaRow0).toEqual({ deltaX: 0, deltaY: 60 });
    });
  });
});
