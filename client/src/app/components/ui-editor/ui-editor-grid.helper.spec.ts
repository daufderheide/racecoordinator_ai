import { CustomUI } from "@app/models/custom-ui";
import { AbsoluteWidgetNode } from "@app/models/settings";

import {
  handleDetachGrid,
  handleEditGridTemplate,
  handleFinishGridSession,
  handleStartGridSession,
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
  });
});
