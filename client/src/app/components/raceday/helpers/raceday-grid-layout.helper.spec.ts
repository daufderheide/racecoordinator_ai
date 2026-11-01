import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridSession } from "../utils/lane-grid-replication.helper";
import { RacedayGridLayoutHelper } from "./raceday-grid-layout.helper";

describe("RacedayGridLayoutHelper", () => {
  let mockHost: any;
  let mockSession: LaneGridSession;
  let mockWidgets: AbsoluteWidgetNode[];

  beforeEach(() => {
    mockSession = {
      gridId: "grid-1",
      gridType: "heat",
      bindingMode: "lane",
      bounds: { x: 200, y: 150, width: 600, height: 400 },
      totalLanes: 4,
      sourceLaneIndex: 0,
      direction: "vertical",
      headerPlacement: "top",
      headerHeight: 40,
      linkColumns: true,
      mirrorRows: true,
    };

    mockWidgets = [
      {
        id: "w1",
        widgetType: "timer",
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        zIndex: 100,
      },
      {
        id: "w2",
        widgetType: "branding",
        x: 400,
        y: 300,
        width: 150,
        height: 80,
        zIndex: 101,
      },
    ];

    mockHost = {
      layout: {
        widgets: [...mockWidgets],
        baseWidth: 1920,
        baseHeight: 1080,
      },
      gridSession: () => mockSession,
      selectedWidgetId: () => "w1",
      layoutChanged: {
        emit: jasmine.createSpy("emit"),
      },
      cdr: {
        markForCheck: jasmine.createSpy("markForCheck"),
      },
      getGrids: () => [
        {
          gridId: "grid-1",
          bounds: { x: 200, y: 150, width: 600, height: 400 },
          labelBounds: { x: 200, y: 100, width: 600, height: 40 },
        },
      ],
      translationService: {
        translate: jasmine
          .createSpy("translate")
          .and.callFake((k: string) => k),
      },
    };
  });

  describe("snapToEdges", () => {
    it("should snap to canvas borders when close to 0 or baseWidth/baseHeight", () => {
      // Near left canvas border (0)
      const snapLeft = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        6,
        500,
        100,
        100,
        "w1",
        "all",
        1920,
        1080,
      );
      expect(snapLeft.x).toBe(0);

      // Near top canvas border (0)
      const snapTop = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        500,
        7,
        100,
        100,
        "w1",
        "all",
        1920,
        1080,
      );
      expect(snapTop.y).toBe(0);

      // Near right canvas border (1920)
      const snapRight = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        1815,
        500,
        100,
        100,
        "w1",
        "all",
        1920,
        1080,
      );
      expect(snapRight.x).toBe(1820); // 1920 - 100

      // Near bottom canvas border (1080)
      const snapBottom = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        500,
        975,
        100,
        100,
        "w1",
        "all",
        1920,
        1080,
      );
      expect(snapBottom.y).toBe(980); // 1080 - 100
    });

    it("should snap to adjacent widget edges and ignore the dragged widget itself", () => {
      // w2 is at x=400, y=300, width=150, height=80 (right edge = 550, bottom edge = 380)
      // Moving a widget near w2's right edge (550)
      const snapNearRight = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        545,
        300,
        100,
        50,
        "test-drag",
        "all",
        1920,
        1080,
      );
      expect(snapNearRight.x).toBe(550);

      // Moving a widget near w2's bottom edge (380) with y=383
      const snapNearBottom = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        400,
        383,
        100,
        50,
        "test-drag",
        "all",
        1920,
        1080,
      );
      expect(snapNearBottom.y).toBe(380);

      // Should ignore the dragged widget itself (ignoreId = "w2")
      const snapIgnore = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        404,
        300,
        150,
        80,
        "w2",
        "all",
        1920,
        1080,
      );
      // Because w2 is ignored, 404 is not snapped to w2's x (400)
      expect(snapIgnore.x).toBe(404);
    });

    it("should snap to grid boundaries and grid dividers", () => {
      // Grid is at bounds x=200, y=150, width=600, height=400
      // Left boundary = 200, right boundary = 800
      const snapGridLeft = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        205,
        600,
        100,
        50,
        "new-widget",
        "all",
        1920,
        1080,
      );
      expect(snapGridLeft.x).toBe(200);

      const snapGridRight = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        797,
        600,
        100,
        50,
        "new-widget",
        "all",
        1920,
        1080,
      );
      expect(snapGridRight.x).toBe(800);
    });

    it("should handle horizontal grid dividers", () => {
      mockSession.direction = "horizontal";
      mockSession.headerPlacement = "left";
      mockSession.headerWidth = 50;
      mockHost.gridSession = () => mockSession;

      const dividers = RacedayGridLayoutHelper.getGridDividers(mockHost);
      expect(dividers.length).toBeGreaterThan(0);

      // Pick a lane divider strictly away from the outer grid boundary (200)
      const targetDivider = dividers[dividers.length - 1];
      const snapDivider = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        targetDivider + 3,
        600,
        100,
        50,
        "test-w",
        "all",
        1920,
        1080,
      );
      expect(snapDivider.x).toBe(targetDivider);
    });

    it("should snap to grid label bounds when present", () => {
      // Grid labelBounds: x: 200, y: 100, width: 600, height: 40 (bottom edge = 140)
      const snapLabelBottom = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        250,
        143,
        100,
        50,
        "test-w",
        "all",
        1920,
        1080,
      );
      expect(snapLabelBottom.y).toBe(140);
    });

    it("should handle null or non-function gridSession gracefully", () => {
      mockHost.gridSession = null;
      mockHost.getGrids = null;

      const snap = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        5,
        5,
        100,
        100,
        "w1",
        "all",
        1920,
        1080,
      );
      expect(snap.x).toBe(0);
      expect(snap.y).toBe(0);
    });

    it("should handle empty or null layout widgets gracefully", () => {
      mockHost.layout = null;
      mockHost.gridSession = null;
      mockHost.getGrids = null;

      const snap = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        4,
        4,
        50,
        50,
        "w1",
        "all",
        1920,
        1080,
      );
      expect(snap.x).toBe(0);
      expect(snap.y).toBe(0);
    });

    it("should handle specific resize handles (e, w, n, s)", () => {
      // Resizing 'e' handle near edge 400 (w2's left edge)
      const snapE = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        100,
        100,
        295, // x + w = 395, near 400
        100,
        "w1",
        "e",
        1920,
        1080,
      );
      expect(snapE.w).toBe(300); // 400 - 100 = 300

      // Resizing 's' handle near edge 300 (w2's top edge)
      const snapS = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        100,
        100,
        100,
        196, // y + h = 296, near 300
        "w1",
        "s",
        1920,
        1080,
      );
      expect(snapS.h).toBe(200); // 300 - 100 = 200

      // Resizing 'w' handle near edge 0
      const snapW = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        5,
        100,
        200,
        100,
        "w1",
        "w",
        1920,
        1080,
      );
      expect(snapW.x).toBe(0);
      expect(snapW.w).toBe(205);

      // Resizing 'n' handle near edge 0
      const snapN = RacedayGridLayoutHelper.snapToEdges(
        mockHost,
        100,
        4,
        100,
        200,
        "w1",
        "n",
        1920,
        1080,
      );
      expect(snapN.y).toBe(0);
      expect(snapN.h).toBe(204);
    });
  });

  describe("getGridDividers and getGridCells", () => {
    it("should return grid dividers when session is present", () => {
      const dividers = RacedayGridLayoutHelper.getGridDividers(mockHost);
      expect(dividers.length).toBe(4); // 1 header divider + 3 lane dividers
    });

    it("should return empty array when gridSession is null", () => {
      mockHost.gridSession = () => null;
      expect(RacedayGridLayoutHelper.getGridDividers(mockHost)).toEqual([]);
    });

    it("should return grid cells with correct master lane index", () => {
      const cells = RacedayGridLayoutHelper.getGridCells(mockHost);
      expect(cells.length).toBe(4);
      expect(cells[0].isMaster).toBeTrue();
      expect(cells[1].isMaster).toBeFalse();
    });

    it("should return empty cells when gridSession is null", () => {
      mockHost.gridSession = () => null;
      expect(RacedayGridLayoutHelper.getGridCells(mockHost)).toEqual([]);
    });
  });

  describe("header and label bounds", () => {
    it("should compute header row bounds when top or left", () => {
      const bounds = RacedayGridLayoutHelper.getHeaderRowBounds(mockHost);
      expect(bounds).toBeTruthy();
      expect(bounds?.height).toBe(40);
    });

    it("should return null for header bounds when placement is individual or none", () => {
      mockSession.headerPlacement = "none";
      expect(RacedayGridLayoutHelper.getHeaderRowBounds(mockHost)).toBeNull();
    });

    it("should compute grid label bounds", () => {
      const labelBounds = RacedayGridLayoutHelper.getGridLabelBounds(mockHost);
      expect(labelBounds).toBeDefined();
    });

    it("should return justify content based on position and alignment", () => {
      expect(RacedayGridLayoutHelper.getGridLabelJustify("top", "left")).toBe(
        "flex-start",
      );
      expect(RacedayGridLayoutHelper.getGridLabelJustify("top", "center")).toBe(
        "center",
      );
      expect(RacedayGridLayoutHelper.getGridLabelJustify("top", "right")).toBe(
        "flex-end",
      );
    });
  });

  describe("widget and grid lookup helpers", () => {
    it("should return selected widget and cache the result", () => {
      const widget = RacedayGridLayoutHelper.getSelectedWidget(mockHost);
      expect(widget).toEqual(mockWidgets[0]);

      // Cache hit
      const cached = RacedayGridLayoutHelper.getSelectedWidget(mockHost);
      expect(cached).toBe(widget);
    });

    it("should correctly check hasWidgetId and cache lookup set", () => {
      expect(RacedayGridLayoutHelper.hasWidgetId(mockHost, "w1")).toBeTrue();
      expect(
        RacedayGridLayoutHelper.hasWidgetId(mockHost, "nonexistent"),
      ).toBeFalse();
    });

    it("should get selected grid bounds when in customize mode and widget is in grid", () => {
      mockHost.isLayoutCustomizing = true;
      mockHost.gridSession = () => null;
      mockHost.selectedWidget = {
        id: "gw1",
        customSettings: { gridId: "grid-1" },
      };
      mockHost.layout.widgets.push({
        id: "gw1",
        customSettings: { gridId: "grid-1" },
        x: 100,
        y: 100,
        width: 300,
        height: 200,
      });

      const bounds = RacedayGridLayoutHelper.getSelectedGridBounds(mockHost);
      expect(bounds).toBeTruthy();
      expect(bounds?.x).toBe(100);
    });

    it("should resolve custom grid title and label position", () => {
      mockHost.layout.widgets.push({
        id: "gw2",
        customSettings: {
          gridId: "grid-custom",
          gridLabelText: "My Grid Title",
          gridLabelPosition: "top",
        },
      });

      expect(
        RacedayGridLayoutHelper.getGridCustomTitle(mockHost, "grid-custom"),
      ).toBe("My Grid Title");
      expect(
        RacedayGridLayoutHelper.getGridLabelPosition(mockHost, "grid-custom"),
      ).toBe("top");
    });
  });

  describe("master and replica widget modification", () => {
    it("should copy replica custom settings to master widget when mirrorRows is true", () => {
      const master: AbsoluteWidgetNode = {
        id: "master-1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 40,
        zIndex: 100,
        customSettings: {},
      };
      const replica: AbsoluteWidgetNode = {
        id: "master-1_grid_lane_1",
        widgetType: "lane-column",
        x: 0,
        y: 40,
        width: 100,
        height: 40,
        zIndex: 101,
        customSettings: {
          gridMasterId: "master-1",
          columnKey: "driver.bestLapTime",
          gapMode: "leader",
          gapTarget: 1,
          insets: { top: 2, right: 2, bottom: 2, left: 2 },
          insetsConfig: { top: 2, right: 2, bottom: 2, left: 2 },
        },
      };

      mockHost.layout.widgets = [master, replica];
      mockHost.onMasterWidgetModified = jasmine.createSpy(
        "onMasterWidgetModified",
      );
      mockHost.invalidateGridCache = jasmine.createSpy("invalidateGridCache");

      RacedayGridLayoutHelper.handleReplicaWidgetModified(
        mockHost,
        replica,
        mockSession,
      );

      expect(master.customSettings?.["columnKey"]).toBe("driver.bestLapTime");
      expect(master.customSettings?.["gapMode"]).toBe("leader");
      expect(master.customSettings?.["gapTarget"]).toBe(1);
      expect(mockHost.onMasterWidgetModified).toHaveBeenCalledWith(master);
    });
  });
});
