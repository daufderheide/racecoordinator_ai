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
});
