import { AbsoluteWidgetNode } from "@app/models/settings";

import {
  LaneGridBounds,
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
    expect(lane1.x).toBe(300); // 100 + 200 (auto-calculated for horizontal grid)
    expect(lane1.y).toBe(60);
    expect(lane1.width).toBe(200); // auto-calculated for horizontal grid
    expect(lane1.height).toBe(90);
    expect(lane1.customSettings?.["targetIndex"]).toBe(1);
    expect(lane1.customSettings?.["gridMasterId"]).toBe("w-1");

    const lane3 = synced.find((w) => w.id === "w-1_grid_lane_3")!;
    expect(lane3).toBeDefined();
    expect(lane3.x).toBe(700); // 100 + 3 * 200 (auto-calculated for horizontal grid)
    expect(lane3.width).toBe(200);
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
    expect(lane2.x).toBe(500); // 100 + 2 * 200 (auto-calculated for horizontal grid)
    expect(lane2.y).toBe(70);
    expect(lane2.width).toBe(200); // auto-calculated for horizontal grid
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
    // Cell 0 should be at x = 100 (auto-calculated column width and x)
    const pos1 = synced.find((w) => w.id === "w-pos-2_grid_lane_0")!;
    expect(pos1.x).toBe(100);
    expect(pos1.width).toBe(200);
    expect(pos1.customSettings?.["targetIndex"]).toBe(0);

    // Cell 1 is master at x = 300
    const master = synced.find((w) => w.id === "w-pos-2")!;
    expect(master.x).toBe(300);
    expect(master.width).toBe(200);
    expect(master.customSettings?.["targetIndex"]).toBe(1);

    // Cell 2 should be at x = 500
    const pos3 = synced.find((w) => w.id === "w-pos-2_grid_lane_2")!;
    expect(pos3.x).toBe(500);
    expect(pos3.width).toBe(200);
    expect(pos3.customSettings?.["targetIndex"]).toBe(2);

    // Cell 3 should be at x = 700
    const pos4 = synced.find((w) => w.id === "w-pos-2_grid_lane_3")!;
    expect(pos4.x).toBe(700);
    expect(pos4.width).toBe(200);
    expect(pos4.customSettings?.["targetIndex"]).toBe(3);
  });

  it("should scale master and mirrored widgets proportionally when session bounds resize", () => {
    const session: LaneGridSession = {
      gridId: "scale-test",
      bounds: { x: 100, y: 100, width: 800, height: 400 },
      totalLanes: 4,
      direction: "horizontal",
      sourceLaneIndex: 0,
      bindingMode: "lane",
    };

    const master: AbsoluteWidgetNode = {
      id: "w-scale-master",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 200,
      height: 400,
      zIndex: 1,
      customSettings: {
        gridId: "scale-test",
        gridLane: 0,
        gridBounds: { x: 100, y: 100, width: 800, height: 400 },
        cellWidthRatio: 1.0,
        cellHeightRatio: 1.0,
        cellOffsetXRatio: 0,
        cellOffsetYRatio: 0,
      },
    };

    // Resized session bounds: 1000 width (pitch 250), 500 height
    const resizedSession: LaneGridSession = {
      ...session,
      bounds: { x: 100, y: 100, width: 1000, height: 500 },
    };

    const synced = LaneGridReplicationHelper.syncMasterWidgetToLanes(
      master,
      resizedSession,
      [master],
    );

    const updatedMaster = synced.find((w) => w.id === master.id)!;
    expect(updatedMaster.width).toBe(250);
    expect(updatedMaster.height).toBe(500);

    const mirroredLane1 = synced.find(
      (w) => w.id === `${master.id}_grid_lane_1`,
    )!;
    expect(mirroredLane1.width).toBe(250);
    expect(mirroredLane1.height).toBe(500);
    expect(mirroredLane1.x).toBe(350); // 100 + 250
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

  it("should detect whether widgets in a grid exist with hasGridWidgets", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-data",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 10,
        customSettings: { gridId: "g-test" },
      },
      {
        id: "w-header",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        zIndex: 10,
        customSettings: { gridId: "g-test", isHeaderWidget: true },
      },
    ];

    expect(
      LaneGridReplicationHelper.hasGridWidgets(widgets, "g-test"),
    ).toBeTrue();
    expect(
      LaneGridReplicationHelper.hasGridWidgets(widgets, "other-grid"),
    ).toBeFalse();
    expect(
      LaneGridReplicationHelper.hasGridWidgets([widgets[1]], "g-test"),
    ).toBeFalse();
    expect(LaneGridReplicationHelper.hasGridWidgets([], "g-test")).toBeFalse();
    expect(
      LaneGridReplicationHelper.hasGridWidgets(null, "g-test"),
    ).toBeFalse();
  });

  it("should remove all widgets for a grid with removeGrid", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 10,
        customSettings: { gridId: "g-delete" },
      },
      {
        id: "w-2",
        widgetType: "clock",
        x: 100,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 10,
      },
    ];

    const result = LaneGridReplicationHelper.removeGrid(widgets, "g-delete");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("w-2");
  });

  it("should remove lingering header when the last master widget in a grid is removed", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "w-master",
        widgetType: "lane-column",
        x: 0,
        y: 50,
        width: 100,
        height: 50,
        zIndex: 10,
        customSettings: { gridId: mockHorizontalSession.gridId },
      },
      {
        id: "w-master_grid_header",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 36,
        zIndex: 11,
        customSettings: {
          gridId: mockHorizontalSession.gridId,
          isHeaderWidget: true,
          gridMasterId: "w-master",
        },
      },
    ];

    const remaining = LaneGridReplicationHelper.removeMasterWidgetFromLanes(
      "w-master",
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

  describe("Header placement and cross-column synchronization", () => {
    const topHeaderSession: LaneGridSession = {
      gridId: "grid-top-headers",
      bounds: { x: 100, y: 100, width: 400, height: 440 },
      totalLanes: 4,
      direction: "vertical",
      sourceLaneIndex: 0,
      bindingMode: "lane",
      headerPlacement: "top",
      headerHeight: 40,
      linkColumns: true,
    };

    it("should account for headerHeight when computing pitch and lane cell bounds", () => {
      // available height = 440 - 40 = 400. 4 lanes => pitch = 100
      expect(LaneGridReplicationHelper.computePitch(topHeaderSession)).toBe(
        100,
      );

      const headerBounds =
        LaneGridReplicationHelper.computeHeaderRowBounds(topHeaderSession);
      expect(headerBounds).toEqual({
        x: 100,
        y: 100,
        width: 400,
        height: 40,
      });

      const lane0Bounds = LaneGridReplicationHelper.computeLaneCellBounds(
        topHeaderSession,
        0,
      );
      expect(lane0Bounds).toEqual({
        x: 100,
        y: 140, // 100 + 40
        width: 400,
        height: 100,
      });

      const lane1Bounds = LaneGridReplicationHelper.computeLaneCellBounds(
        topHeaderSession,
        1,
      );
      expect(lane1Bounds).toEqual({
        x: 100,
        y: 240,
        width: 400,
        height: 100,
      });
    });

    it("should identify header widgets and header widget IDs correctly", () => {
      expect(LaneGridReplicationHelper.getHeaderWidgetId("col1")).toBe(
        "col1_grid_header",
      );
      expect(
        LaneGridReplicationHelper.isHeaderWidgetId("col1_grid_header"),
      ).toBeTrue();
      expect(
        LaneGridReplicationHelper.isHeaderWidgetId("col1_lane1"),
      ).toBeFalse();

      const headerNode: AbsoluteWidgetNode = {
        id: "col1_grid_header",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 200,
        height: 40,
        zIndex: 1,
        customSettings: {
          gridId: "grid-top-headers",
          isHeaderWidget: true,
        },
      };
      expect(LaneGridReplicationHelper.isHeaderWidget(headerNode)).toBeTrue();
    });

    it("should synchronize cross-column properties when syncCrossColumnProperty is called", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 100,
          y: 140,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: {
            gridId: "grid-top-headers",
            headerFontFamily: "Roboto",
            headerFontSize: 16,
            headerTextColor: "#ff0000",
            headerBackgroundColor: "#333333",
            valueFontFamily: "Roboto",
            valueFontSize: 24,
            borderColor: "#00ff00",
            borderWidth: 2,
            borderRadius: 6,
            timeDisplayFormat: "seconds",
            timeSubsecondMode: "always",
            timeSubsecondDecimals: 3,
          },
        },
        {
          id: "w2",
          widgetType: "lane-column",
          x: 200,
          y: 140,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: {
            gridId: "grid-top-headers",
            headerFontFamily: "Arial",
            headerFontSize: 12,
            valueFontFamily: "Arial",
            valueFontSize: 14,
            borderColor: "#ffffff",
            borderWidth: 1,
            borderRadius: 2,
          },
        },
      ];

      // Sync header style from w1
      const syncedHeader = LaneGridReplicationHelper.syncCrossColumnProperty(
        "grid-top-headers",
        "header",
        widgets[0].customSettings!,
        widgets,
      );
      expect(syncedHeader[1].customSettings?.["headerFontFamily"]).toBe(
        "Roboto",
      );
      expect(syncedHeader[1].customSettings?.["headerFontSize"]).toBe(16);
      expect(syncedHeader[1].customSettings?.["headerTextColor"]).toBe(
        "#ff0000",
      );

      const resetSource = {
        _reset_headerTextColor: true,
      };
      const syncedHeaderReset =
        LaneGridReplicationHelper.syncCrossColumnProperty(
          "grid-top-headers",
          "header",
          resetSource,
          syncedHeader,
        );
      expect(
        syncedHeaderReset[1].customSettings?.["headerTextColor"],
      ).toBeUndefined();

      // Sync value style from w1
      const syncedValue = LaneGridReplicationHelper.syncCrossColumnProperty(
        "grid-top-headers",
        "value",
        widgets[0].customSettings!,
        widgets,
      );
      expect(syncedValue[1].customSettings?.["valueFontFamily"]).toBe("Roboto");
      expect(syncedValue[1].customSettings?.["valueFontSize"]).toBe(24);

      // Sync border style from w1
      const syncedBorder = LaneGridReplicationHelper.syncCrossColumnProperty(
        "grid-top-headers",
        "border",
        widgets[0].customSettings!,
        widgets,
      );
      expect(syncedBorder[1].customSettings?.["borderColor"]).toBe("#00ff00");
      expect(syncedBorder[1].customSettings?.["borderWidth"]).toBe(2);
      expect(syncedBorder[1].customSettings?.["borderRadius"]).toBe(6);

      // Sync time format from w1
      const syncedTime = LaneGridReplicationHelper.syncCrossColumnProperty(
        "grid-top-headers",
        "time",
        widgets[0].customSettings!,
        widgets,
      );
      expect(syncedTime[1].customSettings?.["timeDisplayFormat"]).toBe(
        "seconds",
      );
      expect(syncedTime[1].customSettings?.["timeSubsecondMode"]).toBe(
        "always",
      );
      expect(syncedTime[1].customSettings?.["timeSubsecondDecimals"]).toBe(3);
    });

    it("should update grid linkColumns, headerHeight, and headerPlacement", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "col1",
          widgetType: "lane-column",
          x: 100,
          y: 140,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: {
            gridId: "grid-top-headers",
            linkColumns: true,
            headerHeight: 40,
            headerPlacement: "top",
          },
        },
      ];

      const updatedLinks = LaneGridReplicationHelper.updateGridLinkColumns(
        widgets,
        "grid-top-headers",
        false,
      );
      expect(updatedLinks[0].customSettings?.["linkColumns"]).toBeFalse();

      const updatedHeight = LaneGridReplicationHelper.updateGridHeaderHeight(
        widgets,
        "grid-top-headers",
        50,
      );
      expect(updatedHeight[0].customSettings?.["headerHeight"]).toBe(50);

      const updatedPlacement =
        LaneGridReplicationHelper.updateGridHeaderPlacement(
          widgets,
          "grid-top-headers",
          "individual",
        );
      expect(updatedPlacement[0].customSettings?.["headerPlacement"]).toBe(
        "individual",
      );
      expect(updatedPlacement[0].customSettings?.["showHeader"]).toBeTrue();
    });

    it("should update grid layoutOrientation across all matching grid widgets", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "col1",
          widgetType: "lane-column",
          x: 100,
          y: 140,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: {
            gridId: "grid-test",
            layoutOrientation: "vertical",
          },
        },
        {
          id: "col2",
          widgetType: "lane-column",
          x: 200,
          y: 140,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: {
            gridId: "grid-test",
            layoutOrientation: "vertical",
          },
        },
        {
          id: "standalone",
          widgetType: "lane-column",
          x: 300,
          y: 140,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: {
            layoutOrientation: "vertical",
          },
        },
      ];

      const updated = LaneGridReplicationHelper.updateGridLayoutOrientation(
        widgets,
        "grid-test",
        "horizontal",
      );
      expect(updated[0].customSettings?.["layoutOrientation"]).toBe(
        "horizontal",
      );
      expect(updated[1].customSettings?.["layoutOrientation"]).toBe(
        "horizontal",
      );
      expect(updated[2].customSettings?.["layoutOrientation"]).toBe("vertical");

      // Invalid inputs
      expect(
        LaneGridReplicationHelper.updateGridLayoutOrientation(
          null as any,
          "grid-test",
          "horizontal",
        ),
      ).toEqual([]);
      expect(
        LaneGridReplicationHelper.updateGridLayoutOrientation(
          widgets,
          "",
          "horizontal",
        ),
      ).toBe(widgets);
    });
  });

  describe("updateGridTotalLanes", () => {
    const gridId = "test-grid-total-lanes";
    const initialWidgets: AbsoluteWidgetNode[] = [
      {
        id: "w-master",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 300,
        height: 100,
        zIndex: 10,
        customSettings: {
          gridId,
          gridLane: 0,
          targetIndex: 0,
          gridTotalLanes: 2,
          gridDirection: "vertical",
          headerPlacement: "individual",
        },
      },
      {
        id: "w-master_grid_lane_1",
        widgetType: "lane-column",
        x: 100,
        y: 200,
        width: 300,
        height: 100,
        zIndex: 10,
        customSettings: {
          gridId,
          gridLane: 1,
          gridMasterId: "w-master",
          targetIndex: 1,
          gridTotalLanes: 2,
          gridDirection: "vertical",
          headerPlacement: "individual",
        },
      },
    ];

    it("should handle null or invalid parameters safely", () => {
      expect(
        LaneGridReplicationHelper.updateGridTotalLanes([], gridId, 4),
      ).toEqual([]);
      expect(
        LaneGridReplicationHelper.updateGridTotalLanes(null as any, gridId, 4),
      ).toEqual([]);
      expect(
        LaneGridReplicationHelper.updateGridTotalLanes(initialWidgets, "", 4),
      ).toBe(initialWidgets);
      expect(
        LaneGridReplicationHelper.updateGridTotalLanes(
          initialWidgets,
          gridId,
          0,
        ),
      ).toBe(initialWidgets);
      expect(
        LaneGridReplicationHelper.updateGridTotalLanes(
          initialWidgets,
          gridId,
          -1,
        ),
      ).toBe(initialWidgets);
    });

    it("should increase total lanes and replicate master widgets to new rows", () => {
      const updated = LaneGridReplicationHelper.updateGridTotalLanes(
        initialWidgets,
        gridId,
        4,
      );

      const gridWidgets = updated.filter(
        (w) => w.customSettings?.["gridId"] === gridId,
      );
      expect(gridWidgets.length).toBe(4);
      expect(
        gridWidgets.every((w) => w.customSettings?.["gridTotalLanes"] === 4),
      ).toBeTrue();

      // Pitch for height 200 with 4 lanes is 50, so rows start at 100, 150, 200, 250
      expect(gridWidgets[0].y).toBe(100);
      expect(gridWidgets[1].y).toBe(150);
      expect(gridWidgets[2].y).toBe(200);
      expect(gridWidgets[3].y).toBe(250);

      expect(gridWidgets[2].customSettings?.["gridLane"]).toBe(2);
      expect(gridWidgets[3].customSettings?.["gridLane"]).toBe(3);
    });

    it("should decrease total lanes and prune extra mirrored rows", () => {
      const fourLaneWidgets: AbsoluteWidgetNode[] = [
        ...initialWidgets,
        {
          id: "w-master_grid_lane_2",
          widgetType: "lane-column",
          x: 100,
          y: 300,
          width: 300,
          height: 100,
          zIndex: 10,
          customSettings: {
            gridId,
            gridLane: 2,
            gridMasterId: "w-master",
            targetIndex: 2,
            gridTotalLanes: 4,
            gridDirection: "vertical",
          },
        },
        {
          id: "w-master_grid_lane_3",
          widgetType: "lane-column",
          x: 100,
          y: 400,
          width: 300,
          height: 100,
          zIndex: 10,
          customSettings: {
            gridId,
            gridLane: 3,
            gridMasterId: "w-master",
            targetIndex: 3,
            gridTotalLanes: 4,
            gridDirection: "vertical",
          },
        },
      ];

      const reduced = LaneGridReplicationHelper.updateGridTotalLanes(
        fourLaneWidgets,
        gridId,
        2,
      );

      const gridWidgets = reduced.filter(
        (w) => w.customSettings?.["gridId"] === gridId,
      );
      expect(gridWidgets.length).toBe(2);
      expect(
        gridWidgets.every((w) => w.customSettings?.["gridTotalLanes"] === 2),
      ).toBeTrue();
      expect(
        gridWidgets.some((w) => Number(w.customSettings?.["gridLane"]) >= 2),
      ).toBeFalse();
    });

    it("should preserve grid size and adjust widget heights when mirror count changes with existingBounds", () => {
      const explicitBounds = { x: 100, y: 100, width: 300, height: 200 };
      const updated = LaneGridReplicationHelper.updateGridTotalLanes(
        initialWidgets,
        gridId,
        4,
        explicitBounds,
      );

      const gridWidgets = updated.filter(
        (w) => w.customSettings?.["gridId"] === gridId,
      );
      expect(gridWidgets.length).toBe(4);
      // For height 200 with 4 lanes, pitch is 50, widgets adjust to 50
      expect(gridWidgets[0].height).toBe(50);
      expect(gridWidgets[1].height).toBe(50);
      expect(gridWidgets[2].height).toBe(50);
      expect(gridWidgets[3].height).toBe(50);
      expect(gridWidgets[0].customSettings?.["gridBounds"]).toEqual(
        explicitBounds,
      );
    });

    it("should adjust widget widths and keep grid size unchanged in horizontal direction", () => {
      const horizWidgets: AbsoluteWidgetNode[] = [
        {
          id: "hw-0",
          widgetType: "lane-column",
          x: 50,
          y: 50,
          width: 200,
          height: 300,
          zIndex: 1,
          customSettings: {
            gridId: "h-grid",
            gridLane: 0,
            targetIndex: 0,
            gridTotalLanes: 2,
            gridDirection: "horizontal",
            gridBounds: { x: 50, y: 50, width: 400, height: 300 },
          },
        },
        {
          id: "hw-1",
          widgetType: "lane-column",
          x: 250,
          y: 50,
          width: 200,
          height: 300,
          zIndex: 1,
          customSettings: {
            gridId: "h-grid",
            gridLane: 1,
            gridMasterId: "hw-0",
            targetIndex: 1,
            gridTotalLanes: 2,
            gridDirection: "horizontal",
            gridBounds: { x: 50, y: 50, width: 400, height: 300 },
          },
        },
      ];

      const updated = LaneGridReplicationHelper.updateGridTotalLanes(
        horizWidgets,
        "h-grid",
        4,
      );
      const gridWidgets = updated.filter(
        (w) => w.customSettings?.["gridId"] === "h-grid",
      );
      expect(gridWidgets.length).toBe(4);
      // In 400 width with 4 lanes, pitch is 100, width scales to 100
      expect(gridWidgets[0].width).toBe(100);
      expect(gridWidgets[1].width).toBe(100);
      expect(gridWidgets[2].width).toBe(100);
      expect(gridWidgets[3].width).toBe(100);
      expect(gridWidgets[0].height).toBe(300);
    });
  });

  describe("getGridDataCount", () => {
    const gridId = "count-grid";
    const widgets: AbsoluteWidgetNode[] = [
      {
        id: "col-1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          bindingMode: "lane",
          gridTotalLanes: 4,
        },
      },
    ];

    it("should return 0 when widgets are empty or grid is not found", () => {
      expect(LaneGridReplicationHelper.getGridDataCount([], gridId, {})).toBe(
        0,
      );
      expect(
        LaneGridReplicationHelper.getGridDataCount(widgets, "unknown", {}),
      ).toBe(0);
    });

    it("should resolve count from track lanes for lane bindingMode", () => {
      const parent = {
        currentTrack: { lanes: [{}, {}, {}, {}, {}, {}] },
      };
      expect(
        LaneGridReplicationHelper.getGridDataCount(widgets, gridId, parent),
      ).toBe(6);
    });

    it("should resolve count from heat standings for position bindingMode", () => {
      const posWidgets: AbsoluteWidgetNode[] = [
        {
          ...widgets[0],
          customSettings: {
            gridId,
            bindingMode: "position",
            gridTotalLanes: 3,
          },
        },
      ];
      const parent = {
        heatStandings: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      };
      expect(
        LaneGridReplicationHelper.getGridDataCount(posWidgets, gridId, parent),
      ).toBe(5);
    });

    it("should resolve count from race standings for overallPosition bindingMode", () => {
      const opWidgets: AbsoluteWidgetNode[] = [
        {
          ...widgets[0],
          customSettings: {
            gridId,
            bindingMode: "overallPosition",
            gridTotalLanes: 4,
          },
        },
      ];
      const parent = {
        raceStandings: [{ id: "d1" }, { id: "d2" }, { id: "d3" }],
      };
      expect(
        LaneGridReplicationHelper.getGridDataCount(opWidgets, gridId, parent),
      ).toBe(3);
    });

    it("should resolve count from race participants for seed bindingMode", () => {
      const seedWidgets: AbsoluteWidgetNode[] = [
        {
          ...widgets[0],
          customSettings: {
            gridId,
            bindingMode: "seed",
            gridTotalLanes: 4,
          },
        },
      ];
      const parent = {
        raceParticipants: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
          { id: 5 },
          { id: 6 },
          { id: 7 },
        ],
      };
      expect(
        LaneGridReplicationHelper.getGridDataCount(seedWidgets, gridId, parent),
      ).toBe(7);
    });

    it("should fallback to gridTotalLanes when parent has no data", () => {
      expect(
        LaneGridReplicationHelper.getGridDataCount(widgets, gridId, null),
      ).toBe(4);
    });
  });

  describe("generateScrollableGridWidgets", () => {
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

    it("should return unmodified widgets if dataCount is less than or equal to total lanes", () => {
      const result = LaneGridReplicationHelper.generateScrollableGridWidgets(
        widgets,
        gridId,
        2,
      );
      expect(result.length).toBe(2);
      expect(result).toEqual(widgets);
    });

    it("should dynamically generate extra virtual rows when dataCount exceeds total lanes", () => {
      const result = LaneGridReplicationHelper.generateScrollableGridWidgets(
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
      expect(generatedRow2?.y).toBe(200); // 100 + 2 * 50
      expect(generatedRow3?.y).toBe(250); // 100 + 3 * 50
      expect(generatedRow2?.customSettings?.["targetIndex"]).toBe(2);
      expect(generatedRow3?.customSettings?.["targetIndex"]).toBe(3);
    });
  });

  describe("moveGridBounds", () => {
    it("should delegate to LaneGridGeometryHelper.moveGridBounds", () => {
      const bounds = { x: 100, y: 100, width: 300, height: 200 };
      const moved = LaneGridReplicationHelper.moveGridBounds(
        bounds,
        50,
        50,
        1920,
        1080,
      );
      expect(moved).toEqual({ x: 150, y: 150, width: 300, height: 200 });
    });
  });

  describe("Widget scaling on grid size change and mirror count change", () => {
    it("should scale widgets proportionally when grid session bounds resize", () => {
      const master: AbsoluteWidgetNode = {
        id: "master-w1",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        zIndex: 100,
        customSettings: {
          gridId: "g-scale-1",
          gridLane: 0,
          bindingMode: "lane",
          cellWidthRatio: 1.0,
          cellHeightRatio: 1.0,
          cellOffsetXRatio: 0,
          cellOffsetYRatio: 0,
        },
      };

      const session: LaneGridSession = {
        gridId: "g-scale-1",
        bounds: { x: 100, y: 100, width: 400, height: 400 },
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        headerPlacement: "none",
      };

      const widgets = [master];
      const result = LaneGridReplicationHelper.syncMasterWidgetToLanes(
        master,
        session,
        widgets,
      );

      // In a 400x400 grid with 4 vertical lanes, each lane cell height is 100, width is 400
      const updatedMaster = result.find((w) => w.id === "master-w1");
      expect(updatedMaster).toBeDefined();
      expect(updatedMaster?.width).toBe(400);
      expect(updatedMaster?.height).toBe(100);

      // Now expand session bounds to 800 width, 800 height (cell height becomes 200, width becomes 800)
      const expandedSession: LaneGridSession = {
        ...session,
        bounds: { x: 100, y: 100, width: 800, height: 800 },
      };

      const expandedResult = LaneGridReplicationHelper.syncMasterWidgetToLanes(
        updatedMaster!,
        expandedSession,
        result,
      );

      const scaledMaster = expandedResult.find((w) => w.id === "master-w1");
      expect(scaledMaster?.width).toBe(800);
      expect(scaledMaster?.height).toBe(200);

      // Verify mirrored lanes also scaled to 800x200
      const mirroredLane1 = expandedResult.find(
        (w) => w.customSettings?.["gridLane"] === 1,
      );
      expect(mirroredLane1?.width).toBe(800);
      expect(mirroredLane1?.height).toBe(200);
      expect(mirroredLane1?.y).toBe(300); // 100 + 200
    });

    it("should adjust widget height when mirror count increases in vertical grid without expanding grid bounds", () => {
      const master: AbsoluteWidgetNode = {
        id: "master-vert",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 300,
        height: 100,
        zIndex: 100,
        customSettings: {
          gridId: "g-mirror-change",
          gridLane: 0,
          gridTotalLanes: 4,
          bindingMode: "position",
          cellWidthRatio: 1.0,
          cellHeightRatio: 1.0,
        },
      };

      // Initial grid: 4 lanes, bounds height 400 (each cell is 100px high)
      const initialWidgets = [master];
      const bounds = { x: 100, y: 100, width: 300, height: 400 };

      // Change total lanes to 8 (each cell is now 50px high)
      const updated = LaneGridReplicationHelper.updateGridTotalLanes(
        initialWidgets,
        "g-mirror-change",
        8,
        bounds,
      );

      const updatedMaster = updated.find((w) => w.id === "master-vert");
      expect(updatedMaster).toBeDefined();
      expect(updatedMaster?.height).toBe(50); // Scaled by 4/8 = 0.5

      // All 8 rows should exist and fit within the original 400px bounds (100 to 500)
      const allRows = updated.filter(
        (w) => w.customSettings?.["gridId"] === "g-mirror-change",
      );
      expect(allRows.length).toBe(8);
      const lastRow = updated.find((w) => w.customSettings?.["gridLane"] === 7);
      expect(lastRow).toBeDefined();
      expect(lastRow?.y).toBe(450); // 100 + 7 * 50
      expect(lastRow!.y + lastRow!.height).toBe(500); // exactly bounds.y + bounds.height
    });

    it("should preserve authoritative gridBounds in customSettings", () => {
      const master: AbsoluteWidgetNode = {
        id: "m-b",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 300,
        height: 100,
        zIndex: 100,
        customSettings: {
          gridId: "g-bounds-save",
          gridLane: 0,
        },
      };
      const session: LaneGridSession = {
        gridId: "g-bounds-save",
        bounds: { x: 100, y: 100, width: 300, height: 400 },
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };

      const baked = LaneGridReplicationHelper.bakeGrid([master], session);
      expect(baked[0].customSettings?.["gridBounds"]).toEqual({
        x: 100,
        y: 100,
        width: 300,
        height: 400,
      });

      const calculated = LaneGridReplicationHelper.calculateGridBounds(
        baked,
        "g-bounds-save",
      );
      expect(calculated).toEqual({
        x: 100,
        y: 100,
        width: 300,
        height: 400,
      });
    });

    it("should adjust existing mirrored vertical grid rows when adding a top grid label so row 1 is below title and rows fill bounds", () => {
      const gridId = "g-top-label";
      const bounds: LaneGridBounds = {
        x: 100,
        y: 100,
        width: 400,
        height: 400,
      };
      const master: AbsoluteWidgetNode = {
        id: "m-col",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 400,
        height: 100,
        zIndex: 10,
        customSettings: {
          gridId,
          gridLane: 0,
          gridTotalLanes: 4,
          gridDirection: "vertical",
          gridBounds: bounds,
          gridLabelPosition: "none",
        },
      };

      const initialSession: LaneGridSession = {
        gridId,
        bounds,
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        gridLabelPosition: "none",
      };
      const initialWidgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
        master,
        initialSession,
        [master],
      );
      expect(initialWidgets.length).toBe(4);
      expect(initialWidgets[0].y).toBe(100);
      expect(initialWidgets[3].y).toBe(400);

      const updated = LaneGridReplicationHelper.updateGridLabel(
        initialWidgets,
        gridId,
        {
          gridLabelPosition: "top",
          gridLabelSize: 40,
        },
      );

      const row0 = updated.find(
        (w) => Number(w.customSettings?.["gridLane"]) === 0,
      )!;
      const row1 = updated.find(
        (w) => Number(w.customSettings?.["gridLane"]) === 1,
      )!;
      const row2 = updated.find(
        (w) => Number(w.customSettings?.["gridLane"]) === 2,
      )!;
      const row3 = updated.find(
        (w) => Number(w.customSettings?.["gridLane"]) === 3,
      )!;

      expect(row0).toBeDefined();
      expect(row0.y).toBe(140);
      expect(row0.height).toBe(90);

      expect(row1.y).toBe(230);
      expect(row1.height).toBe(90);

      expect(row2.y).toBe(320);
      expect(row2.height).toBe(90);

      expect(row3.y).toBe(410);
      expect(row3.height).toBe(90);
      expect(row3.y + row3.height).toBe(bounds.y + bounds.height);
    });

    it("should auto-heal corrupted layout where rows are placed under label", () => {
      const gridId = "g-heal";
      const bounds: LaneGridBounds = {
        x: 50,
        y: 100,
        width: 300,
        height: 400,
      };
      const corruptedMaster: AbsoluteWidgetNode = {
        id: "m-corrupted",
        widgetType: "lane-column",
        x: 50,
        y: 100,
        width: 300,
        height: 100,
        zIndex: 10,
        customSettings: {
          gridId,
          gridLane: 0,
          gridTotalLanes: 4,
          gridDirection: "vertical",
          gridBounds: bounds,
          gridLabelPosition: "top",
          gridLabelSize: 40,
          cellOffsetYRatio: -0.4,
        },
      };

      const session: LaneGridSession = {
        gridId,
        bounds,
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        gridLabelPosition: "top",
        gridLabelSize: 40,
      };

      const healed = LaneGridReplicationHelper.syncMasterWidgetToLanes(
        corruptedMaster,
        session,
        [corruptedMaster],
      );

      const healedMaster = healed.find((w) => w.id === corruptedMaster.id)!;
      expect(healedMaster.y).toBe(140);
      expect(healedMaster.customSettings?.["cellOffsetYRatio"]).toBe(0);
      expect(healedMaster.y >= 140).toBeTrue();
    });
  });
});
