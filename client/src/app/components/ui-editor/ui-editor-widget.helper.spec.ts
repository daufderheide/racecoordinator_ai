import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

import {
  applyWidgetDefaultSettings,
  computeWidgetDisplayName,
  findDefaultWidgetId,
  handleWidgetInspectorChange,
  resetCustomScalingOverrides,
  resolveActiveLayout,
  updateLayoutOnModel,
} from "./ui-editor-widget.helper";

describe("ui-editor-widget.helper", () => {
  describe("computeWidgetDisplayName", () => {
    const mockTranslationService = {
      translate: (key: string) => {
        if (key === "UE_WIDGET_TYPE_FLAG") return "Flag";
        if (key === "UE_WIDGET_TYPE_LANE_COLUMN") return "Lane Column";
        if (key === "UE_GRID_HEADER_ROW_BADGE") return "Header";
        if (key === "RD_BEST_LAP_TIME") return "Best Lap Time";
        return key;
      },
    };

    it("should return empty string if widget is null", () => {
      expect(computeWidgetDisplayName(null, mockTranslationService)).toBe("");
      expect(computeWidgetDisplayName(undefined, mockTranslationService)).toBe(
        "",
      );
    });

    it("should return translated type for non-lane-column widgets", () => {
      const widget = { widgetType: "flag" };
      expect(computeWidgetDisplayName(widget, mockTranslationService)).toBe(
        "Flag",
      );
    });

    it("should compute descriptive name for grid cell with lane binding", () => {
      const widget = {
        widgetType: "lane-column",
        customSettings: {
          gridId: "grid-1",
          gridLane: 1,
          customLabel: "Driver Name",
        },
      };
      expect(computeWidgetDisplayName(widget, mockTranslationService)).toBe(
        "Grid · Lane 2 · Driver Name",
      );
    });

    it("should compute descriptive name for grid header widget", () => {
      const widget = {
        widgetType: "lane-column",
        customSettings: {
          gridId: "grid-1",
          isHeaderWidget: true,
          customLabel: "Best Lap",
        },
      };
      expect(computeWidgetDisplayName(widget, mockTranslationService)).toBe(
        "Grid · Header · Best Lap",
      );
    });

    it("should compute descriptive name for position, overallPosition, and seed binding modes", () => {
      const posWidget = {
        widgetType: "lane-column",
        customSettings: {
          gridId: "grid-1",
          bindingMode: "position",
          gridLane: 0,
          customLabel: "Time",
        },
      };
      expect(computeWidgetDisplayName(posWidget, mockTranslationService)).toBe(
        "Grid · Pos 1 · Time",
      );

      const opWidget = {
        widgetType: "lane-column",
        customSettings: {
          bindingMode: "overallPosition",
          targetIndex: 2,
          customLabel: "Gap",
        },
      };
      expect(computeWidgetDisplayName(opWidget, mockTranslationService)).toBe(
        "Overall Pos 3 · Gap",
      );

      const seedWidget = {
        widgetType: "lane-column",
        customSettings: {
          bindingMode: "seed",
          targetIndex: 3,
          customLabel: "Rank",
        },
      };
      expect(computeWidgetDisplayName(seedWidget, mockTranslationService)).toBe(
        "Seed 4 · Rank",
      );
    });

    it("should resolve column label from availableColumns when customLabel is not set", () => {
      const widget = {
        widgetType: "lane-column",
        customSettings: {
          gridId: "grid-1",
          gridLane: 0,
          columnKey: "bestLapTime",
        },
      };
      const availableCols = [{ key: "bestLapTime", label: "RD_BEST_LAP_TIME" }];
      expect(
        computeWidgetDisplayName(widget, mockTranslationService, availableCols),
      ).toBe("Grid · Lane 1 · Best Lap Time");
    });

    it("should append Inset name when selectedAnchor is specified on a lane-column widget", () => {
      const widget = {
        widgetType: "lane-column",
        customSettings: {
          gridId: "grid-1",
          gridLane: 0,
          columnKey: "lastLapTime",
          insets: {
            "top-left": "bestLapTime",
            "bottom-right": "totalTime",
          },
        },
      };
      const availableCols = [
        { key: "lastLapTime", label: "RD_LAST_LAP_TIME" },
        { key: "bestLapTime", label: "RD_BEST_LAP_TIME" },
      ];
      mockTranslationService.translate = (key: string) => {
        if (key === "RD_LAST_LAP_TIME") return "Last Lap";
        if (key === "RD_BEST_LAP_TIME") return "Best Lap";
        if (key === "UE_ANCHOR_top-left") return "Top Left";
        if (key === "UE_ANCHOR_top-right") return "Top Right";
        return key;
      };

      // With placed inset column found in availableColumns
      expect(
        computeWidgetDisplayName(
          widget,
          mockTranslationService,
          availableCols,
          undefined,
          "top-left",
        ),
      ).toBe("Grid · Lane 1 · Last Lap · Inset (Top Left: Best Lap)");

      // With empty inset slot
      expect(
        computeWidgetDisplayName(
          widget,
          mockTranslationService,
          availableCols,
          undefined,
          "top-right",
        ),
      ).toBe("Grid · Lane 1 · Last Lap · Inset (Top Right)");

      // Center-center anchor should not append Inset suffix
      expect(
        computeWidgetDisplayName(
          widget,
          mockTranslationService,
          availableCols,
          undefined,
          "center-center",
        ),
      ).toBe("Grid · Lane 1 · Last Lap");
    });
  });
  it("should find default widget id prioritizing lane-view", () => {
    const layout: LayoutConfig = {
      baseWidth: 1920,
      baseHeight: 1080,
      widgets: [
        {
          id: "w1",
          widgetType: "flag",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
        },
        {
          id: "w2",
          widgetType: "lane-view",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 2,
        },
      ],
    };
    expect(findDefaultWidgetId(layout)).toBe("w2");

    const layoutNoLane: LayoutConfig = {
      baseWidth: 1920,
      baseHeight: 1080,
      widgets: [
        {
          id: "w1",
          widgetType: "flag",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
        },
      ],
    };
    expect(findDefaultWidgetId(layoutNoLane)).toBe("w1");
    expect(findDefaultWidgetId(undefined)).toBeNull();
  });

  it("should apply widget default settings", () => {
    const widget: any = { widgetType: "flag" };
    const mutated = applyWidgetDefaultSettings(widget);
    expect(mutated).toBeTrue();
    expect(widget.fontFamily).toBe("");
    expect(widget.scaleMode).toBe("auto");
    expect(widget.fontSize).toBe(24);
  });

  it("should default lane-column customSettings colors to black background and white text", () => {
    const widget: any = {
      widgetType: "lane-column",
      customSettings: {
        useLaneColors: true,
        backgroundColor: "",
        textColor: "",
      },
    };
    const mutated = applyWidgetDefaultSettings(widget);
    expect(mutated).toBeTrue();
    expect(widget.customSettings.backgroundColor).toBe("#000000");
    expect(widget.customSettings.textColor).toBe("#ffffff");
  });

  it("should resolve active layout from custom UI or settings", () => {
    const ui: CustomUI = {
      _id: "default_ui_layout_rc_ai",
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
    };
    const settings = new Settings();
    settings.racedayLayout = { baseWidth: 1920, baseHeight: 1080, widgets: [] };

    const layout = resolveActiveLayout(ui, settings);
    expect(layout).toBe(settings.racedayLayout);
  });

  it("should update layout on model for custom UI and settings", () => {
    const ui: CustomUI = {
      _id: "default_ui_layout_rc_ai",
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
    };
    const settings = new Settings();
    const newLayout = { baseWidth: 1600, baseHeight: 900, widgets: [] };

    updateLayoutOnModel(newLayout, ui, settings, false);
    expect(settings.racedayLayout).toBe(newLayout);
    expect(JSON.parse(ui.layoutJson || "{}").baseWidth).toBe(1600);
  });

  it("should handle widget configuration change and update layout", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const targetWidget = { id: "w1", width: 200 };
    const layout = { widgets: [{ id: "w1", width: 100 }] };
    const comp = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: targetWidget,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetInspectorChange(comp, targetWidget);
    expect(layout.widgets[0].width).toBe(200);
    expect(comp.captureState).toHaveBeenCalled();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should synchronize bindingMode across grid widgets when inspector changes bindingMode", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const targetWidget = {
      id: "w1",
      customSettings: { gridId: "grid-abc", bindingMode: "position" },
    };
    const widget2 = {
      id: "w2",
      customSettings: { gridId: "grid-abc", bindingMode: "lane" },
    };
    const layout = { widgets: [targetWidget, widget2] };
    const comp = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: targetWidget,
      activeGridSession: { gridId: "grid-abc", bindingMode: "lane" },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetInspectorChange(comp, targetWidget);

    expect(widget2.customSettings.bindingMode).toBe("position");
    expect(comp.activeGridSession.bindingMode).toBe("position");
    expect(comp.captureState).toHaveBeenCalled();
  });

  it("should synchronize sortByBindingMode across grid widgets when _sortByBindingModeChanged is set", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const targetWidget = {
      id: "w1",
      customSettings: {
        gridId: "grid-abc",
        sortByBindingMode: false,
        _sortByBindingModeChanged: true,
      },
    };
    const widget2 = {
      id: "w2",
      customSettings: { gridId: "grid-abc", sortByBindingMode: true },
    };
    const layout = { widgets: [targetWidget, widget2] };
    const comp = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: targetWidget,
      activeGridSession: { gridId: "grid-abc", sortByBindingMode: true },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetInspectorChange(comp, targetWidget);

    expect(widget2.customSettings.sortByBindingMode).toBeFalse();
    expect(comp.activeGridSession.sortByBindingMode).toBeFalse();
    expect(
      targetWidget.customSettings._sortByBindingModeChanged,
    ).toBeUndefined();
  });

  it("should synchronize gridSortOrder across grid widgets when _gridSortOrderChanged is set", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const targetWidget = {
      id: "w1",
      customSettings: {
        gridId: "grid-abc",
        bindingMode: "position",
        _gridSortOrderChanged: true,
      },
    };
    const widget2 = {
      id: "w2",
      customSettings: { gridId: "grid-abc", bindingMode: "lane" },
    };
    const layout = { widgets: [targetWidget, widget2] };
    const comp = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: targetWidget,
      activeGridSession: { gridId: "grid-abc", bindingMode: "lane" },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetInspectorChange(comp, targetWidget);

    expect(widget2.customSettings.bindingMode).toBe("position");
    expect(comp.activeGridSession.bindingMode).toBe("position");
    expect(targetWidget.customSettings._gridSortOrderChanged).toBeUndefined();
  });

  it("should synchronize gridType across grid widgets when _gridTypeChanged is set", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const targetWidget = {
      id: "w1",
      customSettings: {
        gridId: "grid-abc",
        gridType: "overall",
        _gridTypeChanged: true,
      },
    };
    const widget2 = {
      id: "w2",
      customSettings: { gridId: "grid-abc", gridType: "heat" },
    };
    const layout = { widgets: [targetWidget, widget2] };
    const comp = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: targetWidget,
      activeGridSession: { gridId: "grid-abc", gridType: "heat" },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetInspectorChange(comp, targetWidget);

    expect(widget2.customSettings.gridType).toBe("overall");
    expect(comp.activeGridSession.gridType).toBe("overall");
    expect(targetWidget.customSettings._gridTypeChanged).toBeUndefined();
  });

  it("should preserve gridType as heat when deselecting and reselecting grid even with overall columnKey", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const {
      handleFinishGridSession,
      handleEditGridTemplate,
    } = require("./ui-editor-grid.helper");

    const widget1 = {
      id: "w1",
      widgetType: "lane-column",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 100,
      customSettings: {
        gridId: "grid-test-revert",
        gridLane: 0,
        gridTotalLanes: 2,
        gridType: "heat",
        _gridTypeChanged: true,
      },
    };
    const widget2 = {
      id: "w2",
      widgetType: "lane-column",
      x: 100,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 100,
      customSettings: {
        gridId: "grid-test-revert",
        gridLane: 0,
        gridTotalLanes: 2,
        columnKey: "overallLapCount",
        gridType: "overall",
      },
    };
    const otherWidget = {
      id: "other-w",
      widgetType: "flag",
      x: 300,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 100,
      customSettings: {},
    };
    const layout = { widgets: [widget1, widget2, otherWidget] };
    const comp: any = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: widget1,
      activeGridSession: {
        gridId: "grid-test-revert",
        bounds: { x: 0, y: 0, width: 200, height: 100 },
        totalLanes: 2,
        direction: "vertical",
        sourceLaneIndex: 0,
        gridType: "overall",
      },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      isCustomUiPractice: () => false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
      maxTrackLanes: 2,
    };

    // 1. Change gridType to "heat"
    handleWidgetInspectorChange(comp, widget1);
    expect(widget2.customSettings.gridType).toBe("heat");
    expect(comp.activeGridSession.gridType).toBe("heat");

    // 2. Select another widget (finishes grid session / bakes grid)
    handleFinishGridSession(comp);
    expect(comp.activeGridSession).toBeNull();
    expect(widget1.customSettings.gridType).toBe("heat");
    expect(widget2.customSettings.gridType).toBe("heat");

    // 3. Select the grid again (re-opens edit grid template session)
    handleEditGridTemplate(comp, "grid-test-revert");
    expect(comp.activeGridSession).toBeDefined();
    expect(comp.activeGridSession.gridType).toBe("heat");
  });

  describe("resetCustomScalingOverrides", () => {
    it("should reset custom font sizes to 54/24/24 for grid lane column", () => {
      const widget: any = {
        widgetType: "lane-column",
        customSettings: {
          gridId: "grid-test",
          valueFontSize: 12,
          headerFontSize: 8,
          insetFontSize: 10,
          insetsConfig: {
            "top-left": { fontSize: 9 },
          },
        },
      };
      resetCustomScalingOverrides(widget);
      expect(widget.customSettings.valueFontSize).toBe(54);
      expect(widget.customSettings.headerFontSize).toBe(24);
      expect(widget.customSettings.insetFontSize).toBe(24);
      expect(
        widget.customSettings.insetsConfig["top-left"].fontSize,
      ).toBeUndefined();
    });

    it("should reset custom font sizes to 36/14/18 for standalone lane column", () => {
      const widget: any = {
        widgetType: "lane-column",
        customSettings: {
          valueFontSize: 12,
          headerFontSize: 8,
          insetFontSize: 10,
        },
      };
      resetCustomScalingOverrides(widget);
      expect(widget.customSettings.valueFontSize).toBe(36);
      expect(widget.customSettings.headerFontSize).toBe(14);
      expect(widget.customSettings.insetFontSize).toBe(18);
    });

    it("should gracefully do nothing for widgets without customSettings", () => {
      expect(() => resetCustomScalingOverrides(null)).not.toThrow();
      expect(() => resetCustomScalingOverrides({})).not.toThrow();
    });
  });

  it("should reset custom font sizes and propagate scaleMode auto across all grid widgets when handleWidgetInspectorChange is called", () => {
    const targetWidget = {
      id: "w1",
      widgetType: "lane-column",
      scaleMode: "auto",
      customSettings: {
        gridId: "grid-test",
        valueFontSize: 12,
        headerFontSize: 8,
        insetFontSize: 10,
      },
    };
    const siblingGridWidget = {
      id: "w2",
      widgetType: "lane-column",
      scaleMode: "fixed",
      customSettings: {
        gridId: "grid-test",
        valueFontSize: 14,
        headerFontSize: 10,
        insetFontSize: 12,
      },
    };
    const layout = { widgets: [targetWidget, siblingGridWidget] };
    const comp = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: targetWidget,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
    };

    handleWidgetInspectorChange(comp, targetWidget);

    expect(targetWidget.customSettings.valueFontSize).toBe(54);
    expect(targetWidget.customSettings.headerFontSize).toBe(24);
    expect(targetWidget.customSettings.insetFontSize).toBe(24);

    expect(siblingGridWidget.scaleMode).toBe("auto");
    expect(siblingGridWidget.customSettings.valueFontSize).toBe(54);
    expect(siblingGridWidget.customSettings.headerFontSize).toBe(24);
    expect(siblingGridWidget.customSettings.insetFontSize).toBe(24);
  });

  it("should handle removing selected widget", () => {
    const { handleRemoveSelectedWidget } = require("./ui-editor-widget.helper");
    const layout = {
      widgets: [
        { id: "w1", widgetType: "flag" },
        { id: "w2", widgetType: "lane-view" },
      ],
    };
    const comp = {
      selectedWidgetId: "w1",
      activeCustomUi: { entity_id: "ui1" },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      onLayoutChanged: jasmine.createSpy("onLayoutChanged"),
    };

    handleRemoveSelectedWidget(comp);
    expect(comp.selectedWidgetId).toBe("w2");
    expect(comp.onLayoutChanged).toHaveBeenCalledWith(
      { widgets: [{ id: "w2", widgetType: "lane-view" }] },
      comp.activeCustomUi,
    );
  });

  it("should remove grid and clear activeGridSession when all elements in a grid are removed via handleRemoveSelectedWidget", () => {
    const { handleRemoveSelectedWidget } = require("./ui-editor-widget.helper");
    const {
      LaneGridAnimationHelper,
    } = require("@app/components/raceday/utils/lane-grid-animation.helper");
    spyOn(LaneGridAnimationHelper, "reset");

    const layout = {
      widgets: [
        {
          id: "col1",
          widgetType: "lane-column",
          customSettings: { gridId: "grid-test-del" },
        },
        {
          id: "col1_grid_lane_1",
          widgetType: "lane-column",
          customSettings: {
            gridId: "grid-test-del",
            gridMasterId: "col1",
          },
        },
        {
          id: "other",
          widgetType: "clock",
        },
      ],
    };
    const comp = {
      selectedWidgetId: "col1",
      activeCustomUi: { entity_id: "ui1" },
      activeGridSession: { gridId: "grid-test-del" },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      onLayoutChanged: jasmine.createSpy("onLayoutChanged"),
    };

    handleRemoveSelectedWidget(comp);

    expect(comp.activeGridSession).toBeNull();
    expect(LaneGridAnimationHelper.reset).toHaveBeenCalledWith("grid-test-del");
    expect(comp.onLayoutChanged).toHaveBeenCalledWith(
      { widgets: [{ id: "other", widgetType: "clock" }] },
      comp.activeCustomUi,
    );
  });

  it("should keep grid session when some elements remain in the grid via handleRemoveSelectedWidget", () => {
    const { handleRemoveSelectedWidget } = require("./ui-editor-widget.helper");
    const layout = {
      widgets: [
        {
          id: "col1",
          widgetType: "lane-column",
          customSettings: { gridId: "grid-multi" },
        },
        {
          id: "col1_grid_lane_1",
          widgetType: "lane-column",
          customSettings: { gridId: "grid-multi", gridMasterId: "col1" },
        },
        {
          id: "col2",
          widgetType: "lane-column",
          customSettings: { gridId: "grid-multi" },
        },
        {
          id: "col2_grid_lane_1",
          widgetType: "lane-column",
          customSettings: { gridId: "grid-multi", gridMasterId: "col2" },
        },
      ],
    };
    const comp = {
      selectedWidgetId: "col1",
      activeCustomUi: { entity_id: "ui1" },
      activeGridSession: { gridId: "grid-multi" },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      onLayoutChanged: jasmine.createSpy("onLayoutChanged"),
    };

    handleRemoveSelectedWidget(comp);

    expect(comp.activeGridSession).toBeDefined();
    expect(comp.activeGridSession.gridId).toBe("grid-multi");
    expect(comp.selectedWidgetId).toBe("col2");
    expect(comp.onLayoutChanged).toHaveBeenCalled();
  });

  it("should preserve grid selection and select next column even when lane-view exists in layout", () => {
    const { handleRemoveSelectedWidget } = require("./ui-editor-widget.helper");
    const layout = {
      widgets: [
        {
          id: "col1",
          widgetType: "lane-column",
          x: 100,
          y: 100,
          customSettings: { gridId: "grid-test-lv", gridLane: 0 },
        },
        {
          id: "col2",
          widgetType: "lane-column",
          x: 200,
          y: 100,
          customSettings: { gridId: "grid-test-lv", gridLane: 0 },
        },
        {
          id: "lane-view-main",
          widgetType: "lane-view",
          x: 0,
          y: 0,
        },
      ],
    };
    const comp = {
      selectedWidgetId: "col1",
      activeCustomUi: { entity_id: "ui1" },
      activeGridSession: { gridId: "grid-test-lv" },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      onLayoutChanged: jasmine.createSpy("onLayoutChanged"),
    };

    handleRemoveSelectedWidget(comp);

    expect(comp.activeGridSession).toBeDefined();
    expect(comp.activeGridSession.gridId).toBe("grid-test-lv");
    // Must NOT select lane-view-main; must stay in grid and select col2
    expect(comp.selectedWidgetId).toBe("col2");
  });

  it("should handle nudging selected widget within bounds", () => {
    const { handleNudgeSelectedWidget } = require("./ui-editor-widget.helper");
    const widget = { id: "w1", x: 10, y: 20, width: 100, height: 100 };
    const layout = { widgets: [widget] };
    const comp = {
      selectedWidgetId: "w1",
      activeCustomUi: { entity_id: "ui1" },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      getLayoutBaseWidth: jasmine
        .createSpy("getLayoutBaseWidth")
        .and.returnValue(1920),
      getLayoutBaseHeight: jasmine
        .createSpy("getLayoutBaseHeight")
        .and.returnValue(1080),
      onWidgetInspectorChange: jasmine.createSpy("onWidgetInspectorChange"),
    };

    handleNudgeSelectedWidget(comp, 5, -10);
    expect(widget.x).toBe(15);
    expect(widget.y).toBe(10);
    expect(comp.onWidgetInspectorChange).toHaveBeenCalledWith(
      widget,
      comp.activeCustomUi,
    );
  });

  it("should clamp dimension and position changes", () => {
    const {
      handleWidgetXChange,
      handleWidgetYChange,
      handleWidgetWidthChange,
      handleWidgetHeightChange,
    } = require("./ui-editor-widget.helper");
    const widget = { id: "w1", x: 10, y: 10, width: 100, height: 100 };
    const comp = {
      getLayoutBaseWidth: jasmine
        .createSpy("getLayoutBaseWidth")
        .and.returnValue(1000),
      getLayoutBaseHeight: jasmine
        .createSpy("getLayoutBaseHeight")
        .and.returnValue(800),
      onWidgetInspectorChange: jasmine.createSpy("onWidgetInspectorChange"),
    };

    handleWidgetXChange(comp, -50, widget);
    expect(widget.x).toBe(0);

    handleWidgetYChange(comp, 9999, widget);
    expect(widget.y).toBe(700);

    handleWidgetWidthChange(comp, 20, widget);
    expect(widget.width).toBe(50); // min 50

    handleWidgetHeightChange(comp, 5, widget);
    expect(widget.height).toBe(20); // min 20
  });

  it("should handle layout change and set default widget selection", () => {
    const { handleLayoutChanged } = require("./ui-editor-widget.helper");
    const newLayout = {
      widgets: [{ id: "w1", widgetType: "lane-view" }],
    };
    const comp = {
      isSaving: false,
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      selectedWidgetId: null as string | null,
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleLayoutChanged(comp, newLayout);
    expect(comp.selectedWidgetId).toBe("w1");
    expect(comp.captureState).toHaveBeenCalled();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should clear activeGridSession and reset animation helper when handleLayoutChanged has no widgets for the grid", () => {
    const { handleLayoutChanged } = require("./ui-editor-widget.helper");
    const {
      LaneGridAnimationHelper,
    } = require("@app/components/raceday/utils/lane-grid-animation.helper");
    spyOn(LaneGridAnimationHelper, "reset");

    const newLayout = {
      widgets: [{ id: "w-other", widgetType: "clock" }],
    };
    const comp = {
      isSaving: false,
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      activeGridSession: { gridId: "grid-empty" },
      selectedWidgetId: null as string | null,
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleLayoutChanged(comp, newLayout);
    expect(comp.activeGridSession).toBeNull();
    expect(LaneGridAnimationHelper.reset).toHaveBeenCalledWith("grid-empty");
  });

  it("should automatically activate countdown preview when countdown widget is selected in handleWidgetSelection", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const countdownWidget = { id: "w-countdown", widgetType: "countdown" };
    const layout = { widgets: [countdownWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      countdownPreviewActiveByUi: {} as Record<string, boolean>,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-countdown");
    expect(comp.countdownPreviewActiveByUi["ui-1"]).toBeTrue();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should automatically activate countdown preview in ensureWidgetSelectedHelper when countdown widget is selected", () => {
    const { ensureWidgetSelectedHelper } = require("./ui-editor-widget.helper");
    const countdownWidget = { id: "w-countdown", widgetType: "countdown" };
    const layout = { widgets: [countdownWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      selectedWidgetId: null as string | null,
      countdownPreviewActiveByUi: {} as Record<string, boolean>,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
    };

    ensureWidgetSelectedHelper(comp);
    expect(comp.selectedWidgetId).toBe("w-countdown");
    expect(comp.countdownPreviewActiveByUi["ui-1"]).toBeTrue();
  });

  it("should automatically deactivate countdown preview when non-countdown widget is selected in handleWidgetSelection", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const countdownWidget = { id: "w-countdown", widgetType: "countdown" };
    const laneWidget = { id: "w-lane", widgetType: "lane-view" };
    const layout = { widgets: [countdownWidget, laneWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      countdownPreviewActiveByUi: { "ui-1": true } as Record<string, boolean>,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-lane");
    expect(comp.countdownPreviewActiveByUi["ui-1"]).toBeFalse();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should automatically apply edit grid template when selecting a widget in a grid", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const gridWidget = {
      id: "w-grid-1",
      widgetType: "lane-column",
      customSettings: { gridId: "grid-test-42" },
    };
    const layout = { widgets: [gridWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      activeGridSession: null,
      onEditGridTemplate: jasmine.createSpy("onEditGridTemplate"),
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-grid-1");
    expect(comp.onEditGridTemplate).toHaveBeenCalledWith(
      "grid-test-42",
      undefined,
    );
  });

  it("should not trigger onEditGridTemplate if grid is already in edit mode", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const gridWidget = {
      id: "w-grid-1",
      widgetType: "lane-column",
      customSettings: { gridId: "grid-test-42" },
    };
    const layout = { widgets: [gridWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      activeGridSession: { gridId: "grid-test-42" },
      onEditGridTemplate: jasmine.createSpy("onEditGridTemplate"),
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-grid-1");
    expect(comp.onEditGridTemplate).not.toHaveBeenCalled();
  });

  it("should finish previous grid session when selecting a widget from a different grid", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const gridWidget = {
      id: "w-grid-2",
      widgetType: "lane-column",
      customSettings: { gridId: "grid-new" },
    };
    const layout = { widgets: [gridWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      activeGridSession: { gridId: "grid-old" },
      finishGridSession: jasmine.createSpy("finishGridSession"),
      onEditGridTemplate: jasmine.createSpy("onEditGridTemplate"),
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-grid-2");
    expect(comp.finishGridSession).toHaveBeenCalledWith(undefined);
    expect(comp.onEditGridTemplate).toHaveBeenCalledWith("grid-new", undefined);
  });

  it("should finish previous grid session when selecting a widget without gridId", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const standaloneWidget = {
      id: "w-standalone",
      widgetType: "lane-column",
      customSettings: {},
    };
    const layout = { widgets: [standaloneWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      activeGridSession: { gridId: "grid-old" },
      finishGridSession: jasmine.createSpy("finishGridSession"),
      onEditGridTemplate: jasmine.createSpy("onEditGridTemplate"),
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-standalone");
    expect(comp.finishGridSession).toHaveBeenCalledWith(undefined);
    expect(comp.onEditGridTemplate).not.toHaveBeenCalled();
  });

  it("should reset selectedAnchor when selecting a different widget in handleWidgetSelection", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const layout = { widgets: [{ id: "w-1", widgetType: "lane-column" }] };
    const comp = {
      selectedWidgetId: "w-0",
      selectedAnchor: "top-left",
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-1");
    expect(comp.selectedAnchor).toBeNull();
    expect(comp.selectedWidgetId).toBe("w-1");
  });

  it("should resolve mirrored child widget to masterId in handleWidgetSelection", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const masterWidget = {
      id: "w-master-gap",
      widgetType: "lane-column",
      customSettings: { gridId: "grid-gaps", gridLane: 0, mirrorRows: true },
    };
    const childWidget = {
      id: "w-child-gap-lane1",
      widgetType: "lane-column",
      customSettings: {
        gridId: "grid-gaps",
        gridMasterId: "w-master-gap",
        gridLane: 1,
        mirrorRows: true,
      },
    };
    const layout = { widgets: [masterWidget, childWidget] };
    const comp = {
      selectedWidgetId: null as string | null,
      activeGridSession: { gridId: "grid-gaps", mirrorRows: true },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-child-gap-lane1");
    expect(comp.selectedWidgetId).toBe("w-master-gap");
  });

  it("should preserve child widget ID in handleWidgetSelection when rows are not mirrored", () => {
    const { handleWidgetSelection } = require("./ui-editor-widget.helper");
    const masterWidget = {
      id: "w-master-gap",
      widgetType: "lane-column",
      customSettings: { gridId: "grid-gaps", gridLane: 0, mirrorRows: false },
    };
    const childWidget = {
      id: "w-child-gap-lane1",
      widgetType: "lane-column",
      customSettings: {
        gridId: "grid-gaps",
        gridMasterId: "w-master-gap",
        gridLane: 1,
        mirrorRows: false,
      },
    };
    const layout = { widgets: [masterWidget, childWidget] };
    const comp = {
      selectedWidgetId: null as string | null,
      activeGridSession: { gridId: "grid-gaps", mirrorRows: false },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleWidgetSelection(comp, "w-child-gap-lane1");
    expect(comp.selectedWidgetId).toBe("w-child-gap-lane1");
  });

  it("should handle handleAnchorSelection by selecting widget and setting anchor", () => {
    const { handleAnchorSelection } = require("./ui-editor-widget.helper");
    const layout = { widgets: [{ id: "w-1", widgetType: "lane-column" }] };
    const comp = {
      selectedWidgetId: "w-0",
      selectedAnchor: null as string | null,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    handleAnchorSelection(comp, { widgetId: "w-1", anchor: "top-right" });
    expect(comp.selectedWidgetId).toBe("w-1");
    expect(comp.selectedAnchor).toBe("top-right");
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should automatically deactivate countdown preview in ensureWidgetSelectedHelper when non-countdown widget is selected", () => {
    const { ensureWidgetSelectedHelper } = require("./ui-editor-widget.helper");
    const laneWidget = { id: "w-lane", widgetType: "lane-view" };
    const layout = { widgets: [laneWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      selectedWidgetId: null as string | null,
      countdownPreviewActiveByUi: { "ui-1": true } as Record<string, boolean>,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
    };

    ensureWidgetSelectedHelper(comp);
    expect(comp.selectedWidgetId).toBe("w-lane");
    expect(comp.countdownPreviewActiveByUi["ui-1"]).toBeFalse();
  });

  it("should automatically deactivate countdown preview in handleRemoveSelectedWidget when countdown widget is removed", () => {
    const { handleRemoveSelectedWidget } = require("./ui-editor-widget.helper");
    const countdownWidget = { id: "w-countdown", widgetType: "countdown" };
    const laneWidget = { id: "w-lane", widgetType: "lane-view" };
    const layout = { widgets: [countdownWidget, laneWidget] };
    const comp = {
      activeCustomUiId: "ui-1",
      selectedWidgetId: "w-countdown",
      countdownPreviewActiveByUi: { "ui-1": true } as Record<string, boolean>,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      onLayoutChanged: jasmine.createSpy("onLayoutChanged"),
    };

    handleRemoveSelectedWidget(comp);
    expect(comp.selectedWidgetId).toBe("w-lane");
    expect(comp.countdownPreviewActiveByUi["ui-1"]).toBeFalse();
    expect(comp.onLayoutChanged).toHaveBeenCalled();
  });

  it("should sync customLabel across column widgets, clean _reset_ flags, and call syncRacedayPreview", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const masterCol = {
      id: "col-1",
      customSettings: {
        gridId: "g1",
        gridLane: 0,
        customLabel: "Best Lap",
        _reset_headerTextColor: true,
      },
    };
    const headerWidget = {
      id: "col-1_header",
      customSettings: {
        gridId: "g1",
        gridMasterId: "col-1",
        isHeaderWidget: true,
        customLabel: "Old Label",
      },
    };
    const lane2Widget = {
      id: "col-1_lane_1",
      customSettings: {
        gridId: "g1",
        gridMasterId: "col-1",
        gridLane: 1,
        customLabel: "Old Label",
      },
    };
    const col2Widget = {
      id: "col-2",
      customSettings: {
        gridId: "g1",
        customLabel: "Position",
      },
    };
    const layout = {
      widgets: [masterCol, headerWidget, lane2Widget, col2Widget],
    };
    const comp = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: masterCol,
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
    };

    handleWidgetInspectorChange(comp, masterCol);

    // customLabel should sync to headerWidget and lane2Widget, but NOT col2Widget
    const updatedHeader = layout.widgets.find(
      (w: any) => w.id === "col-1_header",
    );
    const updatedLane2 = layout.widgets.find(
      (w: any) => w.id === "col-1_lane_1",
    );
    const updatedCol2 = layout.widgets.find((w: any) => w.id === "col-2");

    expect(updatedHeader?.customSettings?.customLabel).toBe("Best Lap");
    expect(updatedLane2?.customSettings?.customLabel).toBe("Best Lap");
    expect(updatedCol2?.customSettings?.customLabel).toBe("Position");

    // _reset_ flags should be cleaned up from target widget
    expect(masterCol.customSettings._reset_headerTextColor).toBeUndefined();

    // syncRacedayPreview should have been called
    expect(comp.syncRacedayPreview).toHaveBeenCalledWith(
      layout,
      comp.activeCustomUi,
    );
  });

  it("should handle _layoutOrientationChanged and update all widgets in grid", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const masterCol: any = {
      id: "col-1",
      widgetType: "lane-column",
      customSettings: {
        gridId: "grid-test-orientation",
        layoutOrientation: "horizontal",
        _layoutOrientationChanged: true,
      },
    };
    const col2: any = {
      id: "col-2",
      widgetType: "lane-column",
      customSettings: {
        gridId: "grid-test-orientation",
        layoutOrientation: "vertical",
      },
    };
    const layout = { widgets: [masterCol, col2] };
    const comp: any = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: masterCol,
      activeGridSession: {
        gridId: "grid-test-orientation",
        layoutOrientation: "vertical",
      },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
    };

    handleWidgetInspectorChange(comp, masterCol);

    const updatedCol2 = layout.widgets.find((w: any) => w.id === "col-2");
    expect(masterCol.customSettings._layoutOrientationChanged).toBeUndefined();
    expect(masterCol.customSettings.layoutOrientation).toBe("horizontal");
    expect(updatedCol2?.customSettings?.layoutOrientation).toBe("horizontal");
    expect(comp.activeGridSession.layoutOrientation).toBe("horizontal");
  });

  it("should handle _gridTotalLanesChanged and update grid total lanes across layout", () => {
    const {
      handleWidgetInspectorChange,
    } = require("./ui-editor-widget.helper");
    const masterCol: any = {
      id: "col-1",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      customSettings: {
        gridId: "grid-test-lanes",
        gridLane: 0,
        gridTotalLanes: 4,
        _gridTotalLanesChanged: true,
      },
    };
    const colLane1: any = {
      id: "col-1_grid_lane_1",
      widgetType: "lane-column",
      x: 100,
      y: 200,
      width: 200,
      height: 100,
      customSettings: {
        gridId: "grid-test-lanes",
        gridLane: 1,
        gridMasterId: "col-1",
        gridTotalLanes: 2,
      },
    };
    const layout = { widgets: [masterCol, colLane1] };
    const comp: any = {
      isSaving: false,
      activeCustomUi: { entity_id: "ui1" },
      currentSelectedWidget: masterCol,
      activeGridSession: {
        gridId: "grid-test-lanes",
        totalLanes: 2,
        direction: "vertical",
        bounds: { x: 100, y: 100, width: 200, height: 200 },
        sourceLaneIndex: 0,
        bindingMode: "lane",
      },
      getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
    };

    handleWidgetInspectorChange(comp, masterCol);

    expect(masterCol.customSettings._gridTotalLanesChanged).toBeUndefined();
    expect(comp.activeGridSession.totalLanes).toBe(4);
    expect(comp.captureState).toHaveBeenCalled();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should handle _gridLabelChanged and sync grid label and session", () => {
    const masterCol: any = {
      id: "lane-col-label",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 400,
      height: 100,
      zIndex: 10,
      customSettings: {
        gridId: "grid-lbl",
        gridLane: 0,
        gridTotalLanes: 4,
        gridDirection: "vertical",
        gridBounds: { x: 100, y: 100, width: 400, height: 400 },
        gridLabelPosition: "top",
        gridLabelSize: 40,
        _gridLabelChanged: true,
      },
    };

    const comp: any = {
      activeCustomUi: {
        layout: {
          widgets: [masterCol],
        },
      },
      getLayout: (ui: any) => ui.layout,
      activeGridSession: {
        gridId: "grid-lbl",
        bounds: { x: 100, y: 100, width: 400, height: 400 },
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      },
      editingSettings: { customUiList: [] },
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
    };

    handleWidgetInspectorChange(comp, masterCol);

    expect(masterCol.customSettings._gridLabelChanged).toBeUndefined();
    expect(comp.activeGridSession.gridLabelPosition).toBe("top");
    expect(comp.activeGridSession.gridLabelSize).toBe(40);
    expect(comp.captureState).toHaveBeenCalled();
  });

  it("should sync master and mirrored lanes and preserve useLaneColors when moving a column header widget", () => {
    const masterCol: any = {
      id: "col-1",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 80,
      height: 200,
      zIndex: 1,
      customSettings: {
        gridId: "grid-test-header-move",
        gridLane: 0,
        gridTotalLanes: 2,
        useLaneColors: true,
        mirrorRows: true,
      },
    };
    const mirroredLane: any = {
      id: "col-1_grid_lane_1",
      widgetType: "lane-column",
      x: 100,
      y: 300,
      width: 80,
      height: 200,
      zIndex: 1,
      customSettings: {
        gridId: "grid-test-header-move",
        gridMasterId: "col-1",
        gridLane: 1,
        gridTotalLanes: 2,
        useLaneColors: true,
      },
    };
    const headerWidget: any = {
      id: "col-1_header",
      widgetType: "lane-column",
      x: 150,
      y: 60,
      width: 90,
      height: 40,
      zIndex: 2,
      customSettings: {
        gridId: "grid-test-header-move",
        gridMasterId: "col-1",
        isHeaderWidget: true,
        useLaneColors: false,
      },
    };

    const layout = {
      widgets: [masterCol, mirroredLane, headerWidget],
    };

    const comp: any = {
      activeCustomUi: { layout },
      getLayout: () => layout,
      activeGridSession: {
        gridId: "grid-test-header-move",
        direction: "vertical",
        totalLanes: 2,
        bounds: { x: 100, y: 100, width: 400, height: 400 },
        sourceLaneIndex: 0,
        bindingMode: "lane",
      },
      editingSettings: new Settings(),
      isCurrentLayoutPractice: false,
      parsedLayouts: new Map(),
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
    };

    handleWidgetInspectorChange(comp, headerWidget);

    expect(masterCol.x).toBe(150);
    expect(masterCol.width).toBe(90);

    const updatedLane1 = layout.widgets.find(
      (w: any) => w.id === "col-1_grid_lane_1",
    );
    expect(updatedLane1?.x).toBe(150);
    expect(updatedLane1?.width).toBe(90);

    expect(masterCol.customSettings.useLaneColors).toBeTrue();
    expect(updatedLane1?.customSettings.useLaneColors).toBeTrue();
  });

  it("should process _syncAction with _forceAllColumns and clean up flags", () => {
    const col1: any = {
      id: "c1",
      widgetType: "lane-column",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      customSettings: {
        gridId: "force-grid",
        gridLane: 0,
        linkColumns: false,
        _syncAction: "value",
        _forceAllColumns: true,
        backgroundColor: "#abcdef",
        textColor: "#123456",
      },
    };
    const col2: any = {
      id: "c2",
      widgetType: "lane-column",
      x: 100,
      y: 0,
      width: 100,
      height: 50,
      customSettings: {
        gridId: "force-grid",
        gridLane: 0,
        linkColumns: false,
      },
    };

    const comp: any = {
      activeCustomUi: {
        layout: {
          widgets: [col1, col2],
        },
      },
      getLayout: (ui: any) => ui.layout,
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
    };

    handleWidgetInspectorChange(comp, col1);

    expect(col1.customSettings._syncAction).toBeUndefined();
    expect(col1.customSettings._forceAllColumns).toBeUndefined();
    expect(
      comp.activeCustomUi.layout.widgets[1].customSettings.backgroundColor,
    ).toBe("#abcdef");
    expect(comp.activeCustomUi.layout.widgets[1].customSettings.textColor).toBe(
      "#123456",
    );
  });

  describe("auto-calculated dimensions for grid widgets", () => {
    const {
      isWidgetHeightAutoCalculated,
      isWidgetWidthAutoCalculated,
      handleWidgetXChange,
      handleWidgetYChange,
      handleWidgetWidthChange,
      handleWidgetHeightChange,
      handleNudgeSelectedWidget,
    } = require("./ui-editor-widget.helper");

    it("should correctly identify auto-calculated dimensions based on grid direction", () => {
      const vertWidget = {
        customSettings: { gridId: "g1", gridDirection: "vertical" },
      };
      const horizWidget = {
        customSettings: { gridId: "g2", gridDirection: "horizontal" },
      };
      const nonGridWidget = { customSettings: {} };

      expect(isWidgetHeightAutoCalculated(vertWidget)).toBeTrue();
      expect(isWidgetWidthAutoCalculated(vertWidget)).toBeFalse();

      expect(isWidgetHeightAutoCalculated(horizWidget)).toBeFalse();
      expect(isWidgetWidthAutoCalculated(horizWidget)).toBeTrue();

      expect(isWidgetHeightAutoCalculated(nonGridWidget)).toBeFalse();
      expect(isWidgetWidthAutoCalculated(nonGridWidget)).toBeFalse();

      const vertNoMirror = {
        customSettings: {
          gridId: "g1",
          gridDirection: "vertical",
          mirrorRows: false,
        },
      };
      const horizNoMirror = {
        customSettings: {
          gridId: "g2",
          gridDirection: "horizontal",
          mirrorRows: false,
        },
      };
      expect(isWidgetHeightAutoCalculated(vertNoMirror)).toBeFalse();
      expect(isWidgetWidthAutoCalculated(horizNoMirror)).toBeFalse();
    });

    it("should ignore manual height and y changes for vertical grid widgets", () => {
      const widget = {
        id: "w-vert",
        x: 50,
        y: 100,
        width: 200,
        height: 150,
        customSettings: { gridId: "g1", gridDirection: "vertical" },
      };
      const comp = {
        getLayoutBaseWidth: () => 1920,
        getLayoutBaseHeight: () => 1080,
        onWidgetInspectorChange: jasmine.createSpy("onWidgetInspectorChange"),
      };

      handleWidgetHeightChange(comp, 300, widget);
      expect(widget.height).toBe(150);
      handleWidgetYChange(comp, 200, widget);
      expect(widget.y).toBe(100);
      expect(comp.onWidgetInspectorChange).not.toHaveBeenCalled();

      // Width and X should still be changeable
      handleWidgetWidthChange(comp, 250, widget);
      expect(widget.width).toBe(250);
      expect(comp.onWidgetInspectorChange).toHaveBeenCalled();
    });

    it("should ignore manual width and x changes for horizontal grid widgets", () => {
      const widget = {
        id: "w-horiz",
        x: 50,
        y: 100,
        width: 200,
        height: 150,
        customSettings: { gridId: "g2", gridDirection: "horizontal" },
      };
      const comp = {
        getLayoutBaseWidth: () => 1920,
        getLayoutBaseHeight: () => 1080,
        onWidgetInspectorChange: jasmine.createSpy("onWidgetInspectorChange"),
      };

      handleWidgetWidthChange(comp, 300, widget);
      expect(widget.width).toBe(200);
      handleWidgetXChange(comp, 80, widget);
      expect(widget.x).toBe(50);
      expect(comp.onWidgetInspectorChange).not.toHaveBeenCalled();

      // Height and Y should still be changeable
      handleWidgetHeightChange(comp, 180, widget);
      expect(widget.height).toBe(180);
      expect(comp.onWidgetInspectorChange).toHaveBeenCalled();
    });

    it("should lock dy when nudging vertical grid widgets and dx when nudging horizontal grid widgets", () => {
      const vertWidget = {
        id: "w-vert",
        x: 50,
        y: 100,
        width: 200,
        height: 150,
        customSettings: { gridId: "g1", gridDirection: "vertical" },
      };
      const compVert = {
        selectedWidgetId: "w-vert",
        activeCustomUi: { entity_id: "ui1" },
        getLayout: () => ({ widgets: [vertWidget] }),
        getLayoutBaseWidth: () => 1920,
        getLayoutBaseHeight: () => 1080,
        onWidgetInspectorChange: jasmine.createSpy("onWidgetInspectorChange"),
      };

      handleNudgeSelectedWidget(compVert, 10, 20);
      expect(vertWidget.x).toBe(60);
      expect(vertWidget.y).toBe(100); // dy locked!
    });
  });
});
