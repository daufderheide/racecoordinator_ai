import { CustomUI } from "@app/models/custom-ui";
import { AbsoluteWidgetNode } from "@app/models/settings";

import {
  handleBringGridToFront,
  handleDeleteGrid,
  handleDetachGrid,
  handleEditGridTemplate,
  handleFinishGridSession,
  handleReMirrorGrid,
  handleStartGridSession,
  handleSyncActiveGridSessionFromLayout,
  handleUpdateGridBounds,
} from "./ui-editor-grid.helper";

describe("ui-editor-grid.helper", () => {
  let mockComp: any;
  let mockUi: CustomUI;
  let mockWidgets: AbsoluteWidgetNode[];

  beforeEach(() => {
    mockWidgets = [
      {
        id: "w-lane-1",
        widgetType: "lane-column",
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        zIndex: 100,
        customSettings: {
          bindingMode: "lane",
          targetIndex: 0,
          columnKey: "driver",
        },
      },
      {
        id: "w-lane-2-old",
        widgetType: "lane-column",
        x: 300,
        y: 50,
        width: 200,
        height: 100,
        zIndex: 100,
        customSettings: {
          bindingMode: "lane",
          targetIndex: 1,
        },
      },
    ];

    mockUi = {
      entity_id: "test-ui",
      name: "Test UI",
      is_default: false,
      layoutJson: JSON.stringify({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: mockWidgets,
      }),
    };

    let mockLayout = {
      baseWidth: 1920,
      baseHeight: 1080,
      widgets: mockWidgets,
    };

    mockComp = {
      activeCustomUi: mockUi,
      activeGridSession: null,
      maxTrackLanes: 4,
      editingSettings: {},
      parsedLayouts: new Map(),
      getLayout: jasmine.createSpy("getLayout").and.callFake(() => mockLayout),
      isCustomUiPractice: jasmine
        .createSpy("isCustomUiPractice")
        .and.returnValue(false),
      captureState: jasmine.createSpy("captureState"),
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
      cdr: {
        markForCheck: jasmine.createSpy("markForCheck"),
      },
    };
  });

  describe("handleStartGridSession", () => {
    it("should initialize activeGridSession and sync Lane 1 widgets across lanes", () => {
      const options = {
        targetCount: 4,
        direction: "horizontal",
        sourceIndex: 0,
        sourceBindingMode: "lane",
        distributionMode: "auto-fit",
        replaceExisting: true,
      };

      handleStartGridSession(mockComp, options, mockUi);

      expect(mockComp.activeGridSession).toBeDefined();
      expect(mockComp.activeGridSession.totalLanes).toBe(4);
      expect(mockComp.activeGridSession.direction).toBe("horizontal");
      expect(mockComp.activeGridSession.gridLabelShowBorder).toBeTrue();
      expect(mockComp.cdr.markForCheck).toHaveBeenCalled();

      const widgets = mockComp.getLayout().widgets;
      // Master widget + 3 mirrored widgets (old lane-2 was replaced)
      expect(widgets.length).toBe(4);
      expect(
        widgets.some((w: any) => w.id === "w-lane-1_grid_lane_1"),
      ).toBeTrue();
      expect(
        widgets.some((w: any) => w.id === "w-lane-1_grid_lane_2"),
      ).toBeTrue();
      expect(
        widgets.some((w: any) => w.id === "w-lane-1_grid_lane_3"),
      ).toBeTrue();
    });

    it("should handle empty widgets array gracefully", () => {
      mockComp.getLayout.and.returnValue({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [],
      });

      const options = {
        targetCount: 3,
        direction: "vertical",
        sourceIndex: 0,
        sourceBindingMode: "position",
      };

      handleStartGridSession(mockComp, options, mockUi);

      expect(mockComp.activeGridSession).toBeDefined();
      expect(mockComp.activeGridSession.direction).toBe("vertical");
      expect(mockComp.activeGridSession.totalLanes).toBe(3);
    });

    it("should correctly calculate physicalCellIndex and replicate all positions when source widget has targetIndex 1 but is at the start of the grid", () => {
      const posWidgets: AbsoluteWidgetNode[] = [
        {
          id: "w-pos-seed",
          widgetType: "lane-column",
          x: 0,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 100,
          customSettings: {
            bindingMode: "position",
            targetIndex: 1,
            columnKey: "physicalLapCount",
          },
        },
      ];

      mockComp.getLayout.and.returnValue({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: posWidgets,
      });

      const options = {
        targetCount: 4,
        direction: "horizontal",
        sourceIndex: 1,
        sourceBindingMode: "position",
        distributionMode: "auto-fit",
        replaceExisting: true,
      };

      handleStartGridSession(mockComp, options, mockUi);

      expect(mockComp.activeGridSession).toBeDefined();
      expect(mockComp.activeGridSession.totalLanes).toBe(4);
      // physicalCellIndex must be 0 because w-pos-seed is at x: 0 (Cell 0)
      expect(mockComp.activeGridSession.sourceLaneIndex).toBe(0);

      const widgets = mockComp.getLayout().widgets;
      expect(widgets.length).toBe(4);
      const master = widgets.find((w: any) => w.id === "w-pos-seed")!;
      expect(master.customSettings?.["targetIndex"]).toBe(0);
      expect(master.x).toBe(0);

      const mirr1 = widgets.find(
        (w: any) => w.id === "w-pos-seed_grid_lane_1",
      )!;
      expect(mirr1).toBeDefined();
      expect(mirr1.customSettings?.["targetIndex"]).toBe(1);

      const mirr2 = widgets.find(
        (w: any) => w.id === "w-pos-seed_grid_lane_2",
      )!;
      expect(mirr2).toBeDefined();
      expect(mirr2.customSettings?.["targetIndex"]).toBe(2);

      const mirr3 = widgets.find(
        (w: any) => w.id === "w-pos-seed_grid_lane_3",
      )!;
      expect(mirr3).toBeDefined();
      expect(mirr3.customSettings?.["targetIndex"]).toBe(3);
    });
  });

  describe("handleFinishGridSession", () => {
    it("should bake grid session metadata and clear activeGridSession", () => {
      mockComp.activeGridSession = {
        gridId: "test-grid-99",
        bounds: { x: 0, y: 0, width: 800, height: 400 },
        totalLanes: 4,
        direction: "horizontal",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };
      mockWidgets[0].customSettings = {
        gridId: "test-grid-99",
        gridLane: 0,
      };

      handleFinishGridSession(mockComp, mockUi);

      expect(mockComp.activeGridSession).toBeNull();
      expect(mockComp.captureState).toHaveBeenCalled();
      expect(mockComp.cdr.markForCheck).toHaveBeenCalled();
      const widgets = mockComp.getLayout().widgets;
      expect(widgets[0].customSettings?.["gridTotalLanes"]).toBe(4);
      expect(widgets[0].customSettings?.["gridDirection"]).toBe("horizontal");
    });
  });

  describe("handleEditGridTemplate", () => {
    it("should reconstruct grid session from existing tagged widgets", () => {
      mockWidgets = [
        {
          id: "w-1",
          widgetType: "lane-column",
          x: 100,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 100,
          customSettings: {
            gridId: "existing-grid-42",
            gridLane: 0,
            gridTotalLanes: 4,
            gridDirection: "horizontal",
            bindingMode: "lane",
            useLaneColors: false,
            backgroundColor: "#202020",
            textColor: "#e0e0e0",
          },
        },
        {
          id: "w-1_grid_lane_1",
          widgetType: "lane-column",
          x: 300,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 100,
          customSettings: {
            gridId: "existing-grid-42",
            gridLane: 1,
            gridTotalLanes: 4,
            gridDirection: "horizontal",
            gridMasterId: "w-1",
            bindingMode: "lane",
          },
        },
      ];
      mockComp.getLayout.and.returnValue({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: mockWidgets,
      });

      handleEditGridTemplate(mockComp, "existing-grid-42", mockUi);

      expect(mockComp.activeGridSession).toBeDefined();
      expect(mockComp.activeGridSession.gridId).toBe("existing-grid-42");
      expect(mockComp.activeGridSession.totalLanes).toBe(4);
      expect(mockComp.activeGridSession.direction).toBe("horizontal");
      expect(mockComp.activeGridSession.useLaneColors).toBeFalse();
      expect(mockComp.activeGridSession.backgroundColor).toBe("#202020");
      expect(mockComp.activeGridSession.textColor).toBe("#e0e0e0");
      expect(mockComp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should preserve position bindingMode when grid widget has bindingMode position", () => {
      mockWidgets = [
        {
          id: "w-pos-0",
          widgetType: "lane-column",
          x: 100,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 100,
          customSettings: {
            gridId: "pos-grid-100",
            gridLane: 0,
            gridTotalLanes: 4,
            gridDirection: "horizontal",
            bindingMode: "position",
          },
        },
      ];
      mockComp.getLayout.and.returnValue({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: mockWidgets,
      });

      handleEditGridTemplate(mockComp, "pos-grid-100", mockUi);

      expect(mockComp.activeGridSession).toBeDefined();
      expect(mockComp.activeGridSession.bindingMode).toBe("position");
    });

    it("should resolve gridType as overall when a widget in the grid has gridType overall even if first widget is heat", () => {
      mockWidgets = [
        {
          id: "w-heat",
          widgetType: "lane-column",
          x: 100,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 100,
          customSettings: {
            gridId: "overall-grid-1",
            gridLane: 0,
            gridTotalLanes: 4,
            gridDirection: "vertical",
            gridType: "heat",
          },
        },
        {
          id: "w-overall",
          widgetType: "lane-column",
          x: 300,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 100,
          customSettings: {
            gridId: "overall-grid-1",
            gridLane: 0,
            gridTotalLanes: 4,
            gridDirection: "vertical",
            gridType: "overall",
          },
        },
      ];
      mockComp.getLayout.and.returnValue({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: mockWidgets,
      });

      handleEditGridTemplate(mockComp, "overall-grid-1", mockUi);

      expect(mockComp.activeGridSession).toBeDefined();
      expect(mockComp.activeGridSession.gridType).toBe("overall");
    });

    it("should resolve gridType as heat when a widget has an overall columnKey without explicit gridType", () => {
      mockWidgets = [
        {
          id: "w-col",
          widgetType: "lane-column",
          x: 100,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 100,
          customSettings: {
            gridId: "overall-grid-2",
            gridLane: 0,
            gridTotalLanes: 4,
            gridDirection: "vertical",
            columnKey: "overallLapCount",
          },
        },
      ];
      mockComp.getLayout.and.returnValue({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: mockWidgets,
      });

      handleEditGridTemplate(mockComp, "overall-grid-2", mockUi);

      expect(mockComp.activeGridSession).toBeDefined();
      expect(mockComp.activeGridSession.gridType).toBe("heat");
    });

    it("should resolve gridType as heat when all widgets have gridType heat even if a widget has an overall columnKey", () => {
      mockWidgets = [
        {
          id: "w-heat-col",
          widgetType: "lane-column",
          x: 100,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 100,
          customSettings: {
            gridId: "heat-grid-with-overall-col",
            gridLane: 0,
            gridTotalLanes: 4,
            gridDirection: "vertical",
            columnKey: "overallLapCount",
            gridType: "heat",
          },
        },
      ];
      mockComp.getLayout.and.returnValue({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: mockWidgets,
      });

      handleEditGridTemplate(mockComp, "heat-grid-with-overall-col", mockUi);

      expect(mockComp.activeGridSession).toBeDefined();
      expect(mockComp.activeGridSession.gridType).toBe("heat");
    });

    it("should ignore invalid or non-existent gridId", () => {
      handleEditGridTemplate(mockComp, "unknown-grid", mockUi);
      expect(mockComp.activeGridSession).toBeNull();
    });
  });

  describe("handleDetachGrid", () => {
    it("should strip grid metadata and clear activeGridSession if matched", () => {
      mockWidgets[0].customSettings = {
        gridId: "detach-me",
        gridLane: 0,
        gridTotalLanes: 4,
        columnKey: "driver",
      };
      mockComp.activeGridSession = { gridId: "detach-me" };

      handleDetachGrid(mockComp, "detach-me", mockUi);

      const widgets = mockComp.getLayout().widgets;
      expect(widgets[0].customSettings?.["gridId"]).toBeUndefined();
      expect(widgets[0].customSettings?.["gridLane"]).toBeUndefined();
      expect(widgets[0].customSettings?.["columnKey"]).toBe("driver");
      expect(mockComp.activeGridSession).toBeNull();
      expect(mockComp.captureState).toHaveBeenCalled();
    });
  });

  describe("handleUpdateGridBounds", () => {
    it("should update bounds on activeGridSession and re-sync mirrored widgets", () => {
      mockComp.activeGridSession = {
        gridId: "test-grid-update",
        bounds: { x: 100, y: 50, width: 800, height: 400 },
        totalLanes: 4,
        direction: "horizontal",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };

      const newBounds = { x: 50, y: 30, width: 1000, height: 500 };
      handleUpdateGridBounds(mockComp, newBounds, mockUi);

      expect(mockComp.activeGridSession.bounds).toEqual(newBounds);
      expect(mockComp.cdr.markForCheck).toHaveBeenCalled();
      const widgets = mockComp.getLayout().widgets;
      expect(widgets.length).toBeGreaterThanOrEqual(2);
    });

    it("should translate master widgets by dx and dy when bounds move", () => {
      mockWidgets[0].customSettings = {
        gridId: "test-grid-move",
        gridLane: 0,
        bindingMode: "lane",
      };
      mockWidgets[0].x = 100;
      mockWidgets[0].y = 50;

      mockComp.activeGridSession = {
        gridId: "test-grid-move",
        bounds: { x: 100, y: 50, width: 800, height: 400 },
        totalLanes: 4,
        direction: "horizontal",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };

      const newBounds = { x: 150, y: 80, width: 800, height: 400 };
      handleUpdateGridBounds(mockComp, newBounds, mockUi);

      const widgets = mockComp.getLayout().widgets;
      const master = widgets.find((w: any) => w.id === mockWidgets[0].id);
      expect(master.x).toBe(150);
      expect(master.y).toBe(80);
    });

    it("should scale placed widgets when grid bounds resize", () => {
      mockWidgets[0].customSettings = {
        gridId: "test-grid-scale-bounds",
        gridLane: 0,
        bindingMode: "lane",
        cellWidthRatio: 0.8,
        cellHeightRatio: 0.5,
      };
      mockWidgets[0].x = 100;
      mockWidgets[0].y = 50;
      mockWidgets[0].width = 160;
      mockWidgets[0].height = 200;

      mockComp.activeGridSession = {
        gridId: "test-grid-scale-bounds",
        bounds: { x: 100, y: 50, width: 800, height: 400 },
        totalLanes: 4,
        direction: "horizontal",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };

      const newBounds = { x: 100, y: 50, width: 1200, height: 600 };
      handleUpdateGridBounds(mockComp, newBounds, mockUi);

      const widgets = mockComp.getLayout().widgets;
      const master = widgets.find((w: any) => w.id === mockWidgets[0].id);
      expect(master.width).toBe(300); // Auto-calculated to column width (1200 / 4)
      expect(master.height).toBe(300); // 600 * 0.5
    });

    it("should auto-calculate height for vertical stack grids when grid bounds resize", () => {
      mockWidgets[0].customSettings = {
        gridId: "test-grid-scale-vert",
        gridLane: 0,
        bindingMode: "lane",
        cellWidthRatio: 0.8,
        cellHeightRatio: 0.5,
      };
      mockWidgets[0].x = 100;
      mockWidgets[0].y = 50;
      mockWidgets[0].width = 160;
      mockWidgets[0].height = 100;

      mockComp.activeGridSession = {
        gridId: "test-grid-scale-vert",
        bounds: { x: 100, y: 50, width: 800, height: 400 },
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };

      const newBounds = { x: 100, y: 50, width: 1000, height: 800 };
      handleUpdateGridBounds(mockComp, newBounds, mockUi);

      const widgets = mockComp.getLayout().widgets;
      const master = widgets.find((w: any) => w.id === mockWidgets[0].id);
      expect(master.height).toBe(200); // Auto-calculated to row height (800 / 4)
      expect(master.width).toBe(200); // 1000 * (160 / 800)
    });
  });

  describe("handleDeleteGrid", () => {
    it("should delete all widgets belonging to gridId in one shot", () => {
      mockWidgets[0].customSettings = { gridId: "delete-me", gridLane: 0 };
      mockWidgets[1].customSettings = { gridId: "keep-me", gridLane: 0 };
      const mirroredWidget: AbsoluteWidgetNode = {
        id: "w-mirrored-1",
        widgetType: "lane-column",
        x: 300,
        y: 100,
        width: 200,
        height: 100,
        zIndex: 10,
        customSettings: { gridId: "delete-me", gridLane: 1 },
      };
      mockComp.getLayout().widgets.push(mirroredWidget);
      mockComp.activeGridSession = { gridId: "delete-me" };
      mockComp.currentSelectedWidget = mockWidgets[0];

      handleDeleteGrid(mockComp, "delete-me", mockUi);

      const remaining = mockComp.getLayout().widgets;
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(mockWidgets[1].id);
      expect(mockComp.activeGridSession).toBeNull();
      expect(mockComp.currentSelectedWidget).toBeNull();
      expect(mockComp.captureState).toHaveBeenCalled();
      expect(mockComp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should handle empty or null gridId gracefully", () => {
      handleDeleteGrid(mockComp, "", mockUi);
      expect(mockComp.captureState).not.toHaveBeenCalled();
    });
  });

  describe("handleSyncActiveGridSessionFromLayout", () => {
    it("should return early when activeGridSession is null", () => {
      mockComp.activeGridSession = null;
      handleSyncActiveGridSessionFromLayout(mockComp);
      expect(mockComp.activeGridSession).toBeNull();
      expect(mockComp.cdr.markForCheck).not.toHaveBeenCalled();
    });

    it("should clear activeGridSession and reset animation helper when grid widgets no longer exist in layout", () => {
      mockComp.activeGridSession = {
        gridId: "removed-grid",
        bounds: { x: 100, y: 50, width: 800, height: 400 },
      };
      mockWidgets[0].customSettings = { gridId: "different-grid" };
      mockWidgets[1].customSettings = { gridId: "different-grid" };

      handleSyncActiveGridSessionFromLayout(mockComp);

      expect(mockComp.activeGridSession).toBeNull();
    });

    it("should synchronize activeGridSession bounds and configuration from restored layout widgets", () => {
      mockWidgets[0].customSettings = {
        gridId: "sync-grid",
        gridLane: 0,
        gridTotalLanes: 6,
        gridDirection: "vertical",
        bindingMode: "position",
        headerPlacement: "top",
        headerHeight: 48,
        linkColumns: true,
        layoutOrientation: "horizontal",
        gridLabelPosition: "top",
        gridLabelText: "Leaderboard",
        gridLabelSize: 50,
        gridLabelFontFamily: "Roboto",
        gridLabelFontSize: 20,
        gridLabelTextColor: "#ffff00",
        gridLabelBackgroundColor: "#000000",
        gridLabelFontBold: true,
        gridLabelFontItalic: true,
        gridLabelAlignment: "left",
        gridLabelShowBorder: true,
        gridLabelBorderColor: "#38bdf8",
        gridLabelBorderWidth: 2,
        gridLabelBorderRadius: 6,
        gridBounds: { x: 120, y: 80, width: 900, height: 450 },
        useLaneColors: false,
        backgroundColor: "#123456",
        textColor: "#654321",
      };
      mockWidgets[0].x = 120;
      mockWidgets[0].y = 80;
      mockWidgets[0].width = 150;
      mockWidgets[0].height = 450;

      mockComp.activeGridSession = {
        gridId: "sync-grid",
        bounds: { x: 100, y: 50, width: 800, height: 400 },
        totalLanes: 4,
        direction: "horizontal",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };

      handleSyncActiveGridSessionFromLayout(mockComp);

      expect(mockComp.activeGridSession).toBeTruthy();
      expect(mockComp.activeGridSession.bounds).toEqual({
        x: 120,
        y: 80,
        width: 900,
        height: 450,
      });
      expect(mockComp.activeGridSession.totalLanes).toBe(6);
      expect(mockComp.activeGridSession.direction).toBe("vertical");
      expect(mockComp.activeGridSession.bindingMode).toBe("position");
      expect(mockComp.activeGridSession.headerPlacement).toBe("top");
      expect(mockComp.activeGridSession.headerHeight).toBe(48);
      expect(mockComp.activeGridSession.linkColumns).toBeTrue();
      expect(mockComp.activeGridSession.layoutOrientation).toBe("horizontal");
      expect(mockComp.activeGridSession.gridLabelPosition).toBe("top");
      expect(mockComp.activeGridSession.gridLabelText).toBe("Leaderboard");
      expect(mockComp.activeGridSession.gridLabelSize).toBe(50);
      expect(mockComp.activeGridSession.gridLabelFontFamily).toBe("Roboto");
      expect(mockComp.activeGridSession.gridLabelFontSize).toBe(20);
      expect(mockComp.activeGridSession.gridLabelTextColor).toBe("#ffff00");
      expect(mockComp.activeGridSession.gridLabelBackgroundColor).toBe(
        "#000000",
      );
      expect(mockComp.activeGridSession.gridLabelFontBold).toBeTrue();
      expect(mockComp.activeGridSession.gridLabelFontItalic).toBeTrue();
      expect(mockComp.activeGridSession.gridLabelAlignment).toBe("left");
      expect(mockComp.activeGridSession.gridLabelShowBorder).toBeTrue();
      expect(mockComp.activeGridSession.gridLabelBorderColor).toBe("#38bdf8");
      expect(mockComp.activeGridSession.gridLabelBorderWidth).toBe(2);
      expect(mockComp.activeGridSession.gridLabelBorderRadius).toBe(6);
      expect(mockComp.activeGridSession.useLaneColors).toBeFalse();
      expect(mockComp.activeGridSession.backgroundColor).toBe("#123456");
      expect(mockComp.activeGridSession.textColor).toBe("#654321");
      expect(mockComp.syncRacedayPreview).toHaveBeenCalled();
      expect(mockComp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should respect gridLabelShowBorder as false or default to true when syncing from layout", () => {
      mockWidgets[0].customSettings = {
        gridId: "sync-grid-border",
        gridLane: 0,
        gridTotalLanes: 2,
        gridDirection: "vertical",
        gridLabelShowBorder: false,
      };
      mockComp.activeGridSession = {
        gridId: "sync-grid-border",
        bounds: { x: 0, y: 0, width: 200, height: 200 },
        totalLanes: 2,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };

      handleSyncActiveGridSessionFromLayout(mockComp);
      expect(mockComp.activeGridSession.gridLabelShowBorder).toBeFalse();

      delete mockWidgets[0].customSettings["gridLabelShowBorder"];
      delete mockComp.activeGridSession.gridLabelShowBorder;
      handleSyncActiveGridSessionFromLayout(mockComp);
      expect(mockComp.activeGridSession.gridLabelShowBorder).toBeTrue();
    });

    it("should synchronize gridType as overall when layout contains overall grid widgets", () => {
      mockWidgets[0].customSettings = {
        gridId: "sync-grid-overall",
        gridLane: 0,
        gridTotalLanes: 2,
        gridType: "overall",
      };
      mockComp.activeGridSession = {
        gridId: "sync-grid-overall",
        bounds: { x: 0, y: 0, width: 200, height: 200 },
        totalLanes: 2,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        gridType: "heat",
      };

      handleSyncActiveGridSessionFromLayout(mockComp);
      expect(mockComp.activeGridSession.gridType).toBe("overall");
    });
  });

  describe("handleReMirrorGrid", () => {
    it("should set mirrorRows to true on grid widgets and sync master to lanes", () => {
      mockWidgets[0].customSettings = {
        gridId: "test-grid",
        gridLane: 0,
        gridTotalLanes: 2,
        mirrorRows: false,
        backgroundColor: "#111111",
      };
      mockWidgets[1].customSettings = {
        gridId: "test-grid",
        gridLane: 1,
        gridTotalLanes: 2,
        gridMasterId: "w-lane-1",
        mirrorRows: false,
        backgroundColor: "#222222",
      };

      mockComp.activeGridSession = {
        gridId: "test-grid",
        bounds: { x: 100, y: 50, width: 800, height: 400 },
        totalLanes: 2,
        direction: "horizontal",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        mirrorRows: false,
      };

      handleReMirrorGrid(mockComp, "test-grid", mockUi);

      expect(mockComp.activeGridSession.mirrorRows).toBeTrue();
      expect(mockWidgets[0].customSettings?.["mirrorRows"]).toBeTrue();
      expect(mockWidgets[1].customSettings?.["mirrorRows"]).toBeTrue();
      expect(mockComp.captureState).toHaveBeenCalled();
      expect(mockComp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should preserve grid label settings when activeGridSession is null and re-mirroring", () => {
      mockWidgets[0].customSettings = {
        gridId: "test-grid-label",
        gridLane: 0,
        gridTotalLanes: 2,
        gridBounds: { x: 100, y: 50, width: 800, height: 400 },
        mirrorRows: false,
        gridLabelPosition: "top",
        gridLabelText: "TOP TITLE",
        gridLabelSize: 40,
      };
      mockWidgets[1].customSettings = {
        gridId: "test-grid-label",
        gridLane: 1,
        gridTotalLanes: 2,
        gridBounds: { x: 100, y: 50, width: 800, height: 400 },
        gridMasterId: "w-lane-1",
        mirrorRows: false,
        gridLabelPosition: "top",
        gridLabelText: "TOP TITLE",
        gridLabelSize: 40,
      };

      mockComp.activeGridSession = null;

      handleReMirrorGrid(mockComp, "test-grid-label", mockUi);

      expect(mockWidgets[0].customSettings?.["mirrorRows"]).toBeTrue();
      expect(mockWidgets[0].customSettings?.["gridLabelPosition"]).toBe("top");
      expect(mockWidgets[0].customSettings?.["gridLabelText"]).toBe(
        "TOP TITLE",
      );
    });
  });

  describe("handleBringGridToFront", () => {
    it("should delegate to racedayComponent bringGridToFront", () => {
      const mockRacedayComp = {
        activeCustomUi: () => mockUi,
        bringGridToFront: jasmine.createSpy("bringGridToFront"),
      };
      mockComp.racedayComponents = [mockRacedayComp];

      handleBringGridToFront(mockComp, "grid-123", mockUi);

      expect(mockRacedayComp.bringGridToFront).toHaveBeenCalledWith("grid-123");
    });

    it("should return early if gridId is empty", () => {
      const mockRacedayComp = {
        activeCustomUi: () => mockUi,
        bringGridToFront: jasmine.createSpy("bringGridToFront"),
      };
      mockComp.racedayComponents = [mockRacedayComp];

      handleBringGridToFront(mockComp, "", mockUi);

      expect(mockRacedayComp.bringGridToFront).not.toHaveBeenCalled();
    });
  });
});
