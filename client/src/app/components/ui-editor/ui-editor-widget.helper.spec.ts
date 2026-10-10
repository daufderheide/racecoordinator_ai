import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

import {
  applyWidgetDefaultSettings,
  computeWidgetDisplayName,
  findDefaultWidgetId,
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

  it("should handle widget inspector change and update layout", () => {
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
});
