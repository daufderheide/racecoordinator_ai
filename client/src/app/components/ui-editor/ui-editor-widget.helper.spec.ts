import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

import {
  applyWidgetDefaultSettings,
  findDefaultWidgetId,
  resolveActiveLayout,
  updateLayoutOnModel,
} from "./ui-editor-widget.helper";

describe("ui-editor-widget.helper", () => {
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
});
