import { AbsoluteWidgetNode } from "@app/models/settings";

import {
  LaneGridReplicationHelper,
  LaneGridSession,
} from "./lane-grid-replication.helper";

describe("LaneGridReplicationHelper", () => {
  const mockHorizontalSession: LaneGridSession = {
    gridId: "test-grid-1",
    bounds: { x: 100, y: 50, width: 800, height: 400 },
    totalLanes: 4,
    direction: "horizontal",
    sourceLaneIndex: 0,
    bindingMode: "lane",
  };

  const mockVerticalSession: LaneGridSession = {
    gridId: "test-grid-2",
    bounds: { x: 50, y: 100, width: 300, height: 600 },
    totalLanes: 3,
    direction: "vertical",
    sourceLaneIndex: 0,
    bindingMode: "position",
  };

  it("should compute pitch correctly for horizontal and vertical sessions", () => {
    expect(LaneGridReplicationHelper.computePitch(mockHorizontalSession)).toBe(
      200,
    );
    expect(LaneGridReplicationHelper.computePitch(mockVerticalSession)).toBe(
      200,
    );
  });

  it("should compute grid dividers correctly", () => {
    const horizDividers = LaneGridReplicationHelper.computeGridDividers(
      mockHorizontalSession,
    );
    expect(horizDividers).toEqual([300, 500, 700]);

    const vertDividers =
      LaneGridReplicationHelper.computeGridDividers(mockVerticalSession);
    expect(vertDividers).toEqual([300, 500]);
  });

  it("should compute master bounds and lane cell bounds", () => {
    const masterBounds = LaneGridReplicationHelper.computeMasterBounds(
      mockHorizontalSession,
    );
    expect(masterBounds).toEqual({
      x: 100,
      y: 50,
      width: 200,
      height: 400,
    });

    const lane2Bounds = LaneGridReplicationHelper.computeLaneCellBounds(
      mockHorizontalSession,
      2,
    );
    expect(lane2Bounds).toEqual({
      x: 500,
      y: 50,
      width: 200,
      height: 400,
    });

    const vertMaster =
      LaneGridReplicationHelper.computeMasterBounds(mockVerticalSession);
    expect(vertMaster).toEqual({
      x: 50,
      y: 100,
      width: 300,
      height: 200,
    });
  });

  it("should identify master widget correctly", () => {
    const masterWidget: AbsoluteWidgetNode = {
      id: "w-master",
      widgetType: "lane-column",
      x: 120,
      y: 60,
      width: 160,
      height: 80,
      zIndex: 100,
      customSettings: {
        gridId: "test-grid-1",
        gridLane: 0,
      },
    };
    expect(
      LaneGridReplicationHelper.isMasterWidget(
        masterWidget,
        mockHorizontalSession,
      ),
    ).toBeTrue();

    const mirroredWidget: AbsoluteWidgetNode = {
      id: "w-mirror",
      widgetType: "lane-column",
      x: 320,
      y: 60,
      width: 160,
      height: 80,
      zIndex: 100,
      customSettings: {
        gridId: "test-grid-1",
        gridLane: 1,
      },
    };
    expect(
      LaneGridReplicationHelper.isMasterWidget(
        mirroredWidget,
        mockHorizontalSession,
      ),
    ).toBeFalse();
  });

  it("should sync master widget to all other lanes", () => {
    const masterWidget: AbsoluteWidgetNode = {
      id: "w-1",
      widgetType: "lane-column",
      x: 110,
      y: 60,
      width: 180,
      height: 90,
      zIndex: 100,
      customSettings: {
        columnKey: "driver",
      },
    };

    const initialWidgets: AbsoluteWidgetNode[] = [masterWidget];
    const synced = LaneGridReplicationHelper.syncMasterWidgetToLanes(
      masterWidget,
      mockHorizontalSession,
      initialWidgets,
    );

    // Total widgets should now be 4 (1 master + 3 mirrored)
    expect(synced.length).toBe(4);

    const master = synced.find((w) => w.id === "w-1")!;
    expect(master.customSettings?.["gridId"]).toBe("test-grid-1");
    expect(master.customSettings?.["gridLane"]).toBe(0);
    expect(master.customSettings?.["targetIndex"]).toBe(0);

    const lane1 = synced.find((w) => w.id === "w-1_grid_lane_1")!;
    expect(lane1).toBeDefined();
    expect(lane1.x).toBe(310); // 110 + 200
    expect(lane1.y).toBe(60);
    expect(lane1.width).toBe(180);
    expect(lane1.height).toBe(90);
    expect(lane1.customSettings?.["targetIndex"]).toBe(1);
    expect(lane1.customSettings?.["gridMasterId"]).toBe("w-1");

    const lane3 = synced.find((w) => w.id === "w-1_grid_lane_3")!;
    expect(lane3).toBeDefined();
    expect(lane3.x).toBe(710); // 110 + 3 * 200
    expect(lane3.customSettings?.["targetIndex"]).toBe(3);
  });

  it("should synchronize bindingMode to position across session and mirrored widgets", () => {
    const session: LaneGridSession = {
      gridId: "test-grid-pos",
      bounds: { x: 100, y: 50, width: 800, height: 400 },
      totalLanes: 4,
      direction: "horizontal",
      sourceLaneIndex: 0,
      bindingMode: "lane",
    };

    const masterWidget: AbsoluteWidgetNode = {
      id: "w-pos-1",
      widgetType: "lane-column",
      x: 110,
      y: 60,
      width: 180,
      height: 90,
      zIndex: 100,
      customSettings: {
        bindingMode: "position",
      },
    };

    const synced = LaneGridReplicationHelper.syncMasterWidgetToLanes(
      masterWidget,
      session,
      [masterWidget],
    );

    expect(session.bindingMode).toBe("position");
    const master = synced.find((w) => w.id === "w-pos-1")!;
    expect(master.customSettings?.["bindingMode"]).toBe("position");

    const mirrored1 = synced.find((w) => w.id === "w-pos-1_grid_lane_1")!;
    expect(mirrored1).toBeDefined();
    expect(mirrored1.customSettings?.["bindingMode"]).toBe("position");
    expect(mirrored1.customSettings?.["targetIndex"]).toBe(1);
  });

  it("should update existing mirrored widgets when master moves or resizes", () => {
    const masterWidget: AbsoluteWidgetNode = {
      id: "w-1",
      widgetType: "lane-column",
      x: 110,
      y: 60,
      width: 180,
      height: 90,
      zIndex: 100,
    };

    let widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
      masterWidget,
      mockHorizontalSession,
      [masterWidget],
    );

    // Move and resize master
    const updatedMaster: AbsoluteWidgetNode = {
      ...widgets.find((w) => w.id === "w-1")!,
      x: 120,
      y: 70,
      width: 150,
      height: 100,
    };

    widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
      updatedMaster,
      mockHorizontalSession,
      widgets,
    );

    expect(widgets.length).toBe(4);
    const lane2 = widgets.find((w) => w.id === "w-1_grid_lane_2")!;
    expect(lane2.x).toBe(520); // 120 + 2 * 200
    expect(lane2.y).toBe(70);
    expect(lane2.width).toBe(150);
    expect(lane2.height).toBe(100);
  });

  it("should position mirrored widgets correctly when sourceLaneIndex is greater than 0", () => {
    const sessionWithSource1: LaneGridSession = {
      gridId: "test-grid-src1",
      bounds: { x: 100, y: 50, width: 800, height: 400 },
      totalLanes: 4,
      direction: "horizontal",
      sourceLaneIndex: 1, // Master is in cell 1 (x: 300..500)
      bindingMode: "position",
    };

    // Master widget physically inside cell 1 at x = 310
    const masterInCell1: AbsoluteWidgetNode = {
      id: "w-pos-2",
      widgetType: "lane-column",
      x: 310,
      y: 60,
      width: 180,
      height: 90,
      zIndex: 100,
    };

    const synced = LaneGridReplicationHelper.syncMasterWidgetToLanes(
      masterInCell1,
      sessionWithSource1,
      [masterInCell1],
    );

    expect(synced.length).toBe(4);
    // Cell 0 should be at x = 110 (100 + 10)
    const pos1 = synced.find((w) => w.id === "w-pos-2_grid_lane_0")!;
    expect(pos1.x).toBe(110);
    expect(pos1.customSettings?.["targetIndex"]).toBe(0);

    // Cell 1 is master at x = 310
    const master = synced.find((w) => w.id === "w-pos-2")!;
    expect(master.x).toBe(310);
    expect(master.customSettings?.["targetIndex"]).toBe(1);

    // Cell 2 should be at x = 510
    const pos3 = synced.find((w) => w.id === "w-pos-2_grid_lane_2")!;
    expect(pos3.x).toBe(510);
    expect(pos3.customSettings?.["targetIndex"]).toBe(2);

    // Cell 3 should be at x = 710
    const pos4 = synced.find((w) => w.id === "w-pos-2_grid_lane_3")!;
    expect(pos4.x).toBe(710);
    expect(pos4.customSettings?.["targetIndex"]).toBe(3);
  });

  it("should sync all master widgets and clean up orphans", () => {
    const w1: AbsoluteWidgetNode = {
      id: "w-1",
      widgetType: "lane-column",
      x: 110,
      y: 60,
      width: 180,
      height: 50,
      zIndex: 100,
      customSettings: { gridId: "test-grid-1", gridLane: 0 },
    };
    const w2: AbsoluteWidgetNode = {
      id: "w-2",
      widgetType: "lane-column",
      x: 110,
      y: 120,
      width: 180,
      height: 50,
      zIndex: 100,
      customSettings: { gridId: "test-grid-1", gridLane: 0 },
    };

    const synced = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
      mockHorizontalSession,
      [w1, w2],
    );

    expect(synced.length).toBe(8); // 2 master * 4 lanes
  });

  it("should remove master widget and all its mirrored widgets", () => {
    const masterWidget: AbsoluteWidgetNode = {
      id: "w-1",
      widgetType: "lane-column",
      x: 110,
      y: 60,
      width: 180,
      height: 90,
      zIndex: 100,
    };

    const widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
      masterWidget,
      mockHorizontalSession,
      [masterWidget],
    );
    expect(widgets.length).toBe(4);

    const remaining = LaneGridReplicationHelper.removeMasterWidgetFromLanes(
      "w-1",
      mockHorizontalSession,
      widgets,
    );
    expect(remaining.length).toBe(0);
  });

  it("should calculate grid bounds from widgets with matching gridId", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-1",
        widgetType: "lane-column",
        x: 100,
        y: 50,
        width: 200,
        height: 300,
        zIndex: 100,
        customSettings: { gridId: "g-1" },
      },
      {
        id: "w-2",
        widgetType: "lane-column",
        x: 700,
        y: 150,
        width: 200,
        height: 300,
        zIndex: 100,
        customSettings: { gridId: "g-1" },
      },
      {
        id: "w-3",
        widgetType: "clock",
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        zIndex: 100,
        customSettings: {},
      },
    ];

    const bounds = LaneGridReplicationHelper.calculateGridBounds(
      widgets,
      "g-1",
    );
    expect(bounds).toEqual({
      x: 100,
      y: 50,
      width: 800, // 900 - 100
      height: 400, // 450 - 50
    });

    expect(
      LaneGridReplicationHelper.calculateGridBounds(widgets, "non-existent"),
    ).toBeNull();
  });

  it("should detach widgets from grid", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-1",
        widgetType: "lane-column",
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        zIndex: 100,
        customSettings: {
          gridId: "g-1",
          gridLane: 0,
          gridTotalLanes: 4,
          columnKey: "driver",
        },
      },
    ];

    const detached = LaneGridReplicationHelper.detachGrid(widgets, "g-1");
    expect(detached[0].customSettings?.["gridId"]).toBeUndefined();
    expect(detached[0].customSettings?.["gridLane"]).toBeUndefined();
    expect(detached[0].customSettings?.["columnKey"]).toBe("driver");
  });

  it("should bake grid metadata into widgets", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-1",
        widgetType: "lane-column",
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        zIndex: 100,
        customSettings: {
          gridId: "test-grid-1",
          columnKey: "driver",
        },
      },
    ];

    const baked = LaneGridReplicationHelper.bakeGrid(
      widgets,
      mockHorizontalSession,
    );
    expect(baked[0].customSettings?.["gridTotalLanes"]).toBe(4);
    expect(baked[0].customSettings?.["gridDirection"]).toBe("horizontal");
  });

  describe("calculateAvailableGridBounds", () => {
    it("should expand to full canvas when no obstacles exist", () => {
      const source: AbsoluteWidgetNode[] = [
        {
          id: "src-1",
          widgetType: "lane-column",
          x: 100,
          y: 200,
          width: 200,
          height: 100,
          zIndex: 10,
        },
      ];

      const bounds = LaneGridReplicationHelper.calculateAvailableGridBounds(
        source,
        source,
        1920,
        1080,
        "horizontal",
      );

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(1920);
      expect(bounds.height).toBe(1080);
    });

    it("should stop expansion at top and bottom obstacle widgets", () => {
      const source: AbsoluteWidgetNode[] = [
        {
          id: "src-1",
          widgetType: "lane-column",
          x: 100,
          y: 200,
          width: 200,
          height: 100,
          zIndex: 10,
        },
      ];
      const allWidgets: AbsoluteWidgetNode[] = [
        ...source,
        // Top banner widget
        {
          id: "top-bar",
          widgetType: "leaderboard",
          x: 0,
          y: 0,
          width: 1920,
          height: 120,
          zIndex: 5,
        },
        // Bottom sponsor widget
        {
          id: "bottom-bar",
          widgetType: "sponsor-banner",
          x: 0,
          y: 980,
          width: 1920,
          height: 100,
          zIndex: 5,
        },
      ];

      const bounds = LaneGridReplicationHelper.calculateAvailableGridBounds(
        source,
        allWidgets,
        1920,
        1080,
        "horizontal",
      );

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(120);
      expect(bounds.width).toBe(1920);
      expect(bounds.height).toBe(860); // 980 - 120
    });

    it("should stop expansion at left sidebar obstacle", () => {
      const source: AbsoluteWidgetNode[] = [
        {
          id: "src-1",
          widgetType: "lane-column",
          x: 400,
          y: 300,
          width: 200,
          height: 100,
          zIndex: 10,
        },
      ];
      const allWidgets: AbsoluteWidgetNode[] = [
        ...source,
        {
          id: "left-sidebar",
          widgetType: "driver-list",
          x: 0,
          y: 0,
          width: 250,
          height: 1080,
          zIndex: 5,
        },
      ];

      const bounds = LaneGridReplicationHelper.calculateAvailableGridBounds(
        source,
        allWidgets,
        1920,
        1080,
        "horizontal",
      );

      expect(bounds.x).toBe(250);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(1670); // 1920 - 250
      expect(bounds.height).toBe(1080);
    });

    it("should ignore replaced lane widgets when replaceExisting is true", () => {
      const source: AbsoluteWidgetNode[] = [
        {
          id: "src-1",
          widgetType: "lane-column",
          x: 100,
          y: 200,
          width: 200,
          height: 100,
          zIndex: 10,
          customSettings: { bindingMode: "lane", targetIndex: 0 },
        },
      ];
      const allWidgets: AbsoluteWidgetNode[] = [
        ...source,
        // Existing lane 2 widget that will be replaced
        {
          id: "lane-2-old",
          widgetType: "lane-column",
          x: 400,
          y: 200,
          width: 200,
          height: 100,
          zIndex: 10,
          customSettings: { bindingMode: "lane", targetIndex: 1 },
        },
      ];

      const bounds = LaneGridReplicationHelper.calculateAvailableGridBounds(
        source,
        allWidgets,
        1920,
        1080,
        "horizontal",
        true,
        "lane",
        0,
        4,
      );

      // lane-2-old was ignored as an obstacle
      expect(bounds.x).toBe(0);
      expect(bounds.width).toBe(1920);
    });
  });

  describe("resizeGridBounds", () => {
    const initialBounds = { x: 200, y: 150, width: 800, height: 400 };

    it("should resize width when dragging 'e' handle", () => {
      const resized = LaneGridReplicationHelper.resizeGridBounds(
        initialBounds,
        "e",
        50,
        0,
        1920,
        1080,
      );
      expect(resized.x).toBe(200);
      expect(resized.width).toBe(850);
      expect(resized.y).toBe(150);
      expect(resized.height).toBe(400);
    });

    it("should resize x and width when dragging 'w' handle", () => {
      const resized = LaneGridReplicationHelper.resizeGridBounds(
        initialBounds,
        "w",
        -40,
        0,
        1920,
        1080,
      );
      expect(resized.x).toBe(160);
      expect(resized.width).toBe(840);
    });

    it("should resize height when dragging 's' handle", () => {
      const resized = LaneGridReplicationHelper.resizeGridBounds(
        initialBounds,
        "s",
        0,
        60,
        1920,
        1080,
      );
      expect(resized.height).toBe(460);
      expect(resized.y).toBe(150);
    });

    it("should resize y and height when dragging 'n' handle", () => {
      const resized = LaneGridReplicationHelper.resizeGridBounds(
        initialBounds,
        "n",
        0,
        -30,
        1920,
        1080,
      );
      expect(resized.y).toBe(120);
      expect(resized.height).toBe(430);
    });

    it("should resize both axes when dragging 'se' corner handle", () => {
      const resized = LaneGridReplicationHelper.resizeGridBounds(
        initialBounds,
        "se",
        100,
        50,
        1920,
        1080,
      );
      expect(resized.width).toBe(900);
      expect(resized.height).toBe(450);
    });

    it("should respect minWidth and minHeight constraints", () => {
      const resized = LaneGridReplicationHelper.resizeGridBounds(
        initialBounds,
        "e",
        -1000,
        0,
        1920,
        1080,
        100,
        60,
      );
      expect(resized.width).toBe(100);
    });

    it("should snap to edge when within snap threshold", () => {
      const resized = LaneGridReplicationHelper.resizeGridBounds(
        initialBounds,
        "e",
        22, // 200 + 800 + 22 = 1022
        0,
        1920,
        1080,
        100,
        60,
        [1020], // snap target at 1020 (diff is 2, within threshold 10)
      );
      expect(resized.width).toBe(820); // 1020 - 200
    });
  });
});
