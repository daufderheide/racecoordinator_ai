import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

import { WIDGET_REGISTRY } from "./widget-registry";

export function findDefaultWidgetId(
  layout: LayoutConfig | undefined,
): string | null {
  const widgets = layout?.widgets || [];
  if (widgets.length === 0) return null;
  const laneView = widgets.find((w: any) => w.widgetType === "lane-view");
  return laneView ? laneView.id : widgets[0].id;
}

export function ensureWidgetSelectedHelper(comp: any, ui?: CustomUI): void {
  const layout = comp.getLayout(ui || comp.activeCustomUi);
  const widgets = layout?.widgets || [];
  if (widgets.length === 0) {
    comp.selectedWidgetId = null;
  } else if (
    !comp.selectedWidgetId ||
    !widgets.some((w: any) => w.id === comp.selectedWidgetId)
  ) {
    comp.selectedWidgetId = findDefaultWidgetId(layout);
  }
}

export function applyWidgetDefaultSettings(widget: any): boolean {
  if (!widget) return false;
  let mutated = false;

  if (widget.fontFamily === undefined || widget.fontFamily === null) {
    widget.fontFamily = "";
    mutated = true;
  }
  if (widget.scaleMode === undefined || widget.scaleMode === null) {
    widget.scaleMode = "auto";
    mutated = true;
  }
  if (
    widget.widgetType === "branding" ||
    widget.widgetType === "qr" ||
    widget.widgetType === "camera-qr" ||
    widget.widgetType === "flag"
  ) {
    if (widget.scaleMode !== "auto") {
      widget.scaleMode = "auto";
      mutated = true;
    }
  }
  if (widget.textColor === undefined || widget.textColor === null) {
    widget.textColor = "";
    mutated = true;
  }
  if (widget.backgroundColor === undefined || widget.backgroundColor === null) {
    widget.backgroundColor = "";
    mutated = true;
  }
  if (widget.fontSize === undefined) {
    widget.fontSize = 24;
    mutated = true;
  }
  if (widget.textScaleFactor === undefined) {
    widget.textScaleFactor = 1.0;
    mutated = true;
  }

  const registryEntry = WIDGET_REGISTRY[widget.widgetType];
  if (registryEntry?.defaultSettings) {
    if (!widget.customSettings) {
      widget.customSettings = registryEntry.defaultSettings();
      mutated = true;
    } else {
      const defaults = registryEntry.defaultSettings();
      for (const key of Object.keys(defaults)) {
        if (widget.customSettings[key] === undefined) {
          widget.customSettings[key] = defaults[key];
          mutated = true;
        }
      }
    }
  }
  return mutated;
}

export function resolveActiveLayout(
  targetUi: CustomUI | undefined,
  editingSettings: Settings | undefined,
  parsedLayoutsCache?: Map<string, LayoutConfig>,
): LayoutConfig | undefined {
  if (targetUi) {
    if (
      targetUi.entity_id === "default_ui_layout_rc_ai" &&
      editingSettings?.racedayLayout
    ) {
      return editingSettings.racedayLayout;
    }
    if (
      targetUi.entity_id === "practice_ui_layout_rc_ai" &&
      editingSettings?.practiceRacedayLayout
    ) {
      return editingSettings.practiceRacedayLayout;
    }
    if (targetUi.layoutJson && targetUi.layoutJson !== "[]") {
      if (parsedLayoutsCache && parsedLayoutsCache.has(targetUi.entity_id)) {
        return parsedLayoutsCache.get(targetUi.entity_id);
      }
      try {
        const parsed = JSON.parse(targetUi.layoutJson);
        if (parsedLayoutsCache) {
          parsedLayoutsCache.set(targetUi.entity_id, parsed);
        }
        return parsed;
      } catch {
        // Fallback below
      }
    }
  }
  return (
    editingSettings?.racedayLayout ||
    JSON.parse(JSON.stringify(Settings.DEFAULT_LAYOUT))
  );
}

export function updateLayoutOnModel(
  newLayout: any,
  ui: CustomUI | undefined,
  editingSettings: Settings,
  isCurrentLayoutPractice: boolean,
  parsedLayoutsCache?: Map<string, LayoutConfig>,
): void {
  if (ui) {
    ui.layoutJson = JSON.stringify(newLayout);
    if (parsedLayoutsCache) {
      parsedLayoutsCache.set(ui.entity_id, newLayout);
    }
    if (ui.entity_id === "default_ui_layout_rc_ai" && editingSettings) {
      editingSettings.racedayLayout = newLayout;
    } else if (ui.entity_id === "practice_ui_layout_rc_ai" && editingSettings) {
      editingSettings.practiceRacedayLayout = newLayout;
    }
  } else if (isCurrentLayoutPractice) {
    editingSettings.practiceRacedayLayout = newLayout;
  } else {
    editingSettings.racedayLayout = newLayout;
  }
}

export function handleWidgetSelection(
  comp: any,
  id: string | null,
  ui?: CustomUI,
): void {
  if (ui) comp.activeCustomUiId = ui.entity_id;
  const layout = comp.getLayout(ui || comp.activeCustomUi);
  comp.selectedWidgetId = id || findDefaultWidgetId(layout);
  if (comp.selectedWidgetId && comp.selectedWidget) {
    if (applyWidgetDefaultSettings(comp.selectedWidget)) {
      if (ui) ui.layoutJson = JSON.stringify(comp.getLayout(ui));
      if (comp.editingState?.settings) {
        comp.editingState.settings = { ...comp.editingState.settings };
      }
    }
  }
  comp.cdr.markForCheck();
}

export function handleWidgetColorChange(
  comp: any,
  property: "textColor" | "backgroundColor",
  event: Event,
): void {
  if (comp.selectedWidget) {
    comp.selectedWidget[property] = (event.target as HTMLInputElement).value;
    comp.captureState();
    comp.cdr.markForCheck();
  }
}

export function handleWidgetInspectorChange(
  comp: any,
  widget?: any,
  ui?: CustomUI,
): void {
  if (comp.isSaving) return;
  const targetUi = ui || comp.activeCustomUi;
  const targetWidget = widget || comp.currentSelectedWidget;
  const layout = comp.getLayout(targetUi);
  if (layout && targetWidget && layout.widgets) {
    const idx = layout.widgets.findIndex((w: any) => w.id === targetWidget.id);
    if (idx !== -1) {
      layout.widgets[idx] = targetWidget;
    }
    updateLayoutOnModel(
      layout,
      targetUi,
      comp.editingSettings,
      comp.isCurrentLayoutPractice,
      comp.parsedLayouts,
    );
  }
  comp.captureState();
  comp.cdr.markForCheck();
}

export function handleRemoveSelectedWidget(comp: any, ui?: CustomUI): void {
  if (!comp.selectedWidgetId) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;

  const idToRemove = comp.selectedWidgetId;
  const newWidgets = layout.widgets.filter((w: any) => w.id !== idToRemove);
  const updatedLayout = { ...layout, widgets: newWidgets };

  const laneView = newWidgets.find((w: any) => w.widgetType === "lane-view");
  const nextWidget = laneView || newWidgets[0];
  comp.selectedWidgetId = nextWidget ? nextWidget.id : null;

  comp.onLayoutChanged(updatedLayout, targetUi);
}

export function handleNudgeSelectedWidget(
  comp: any,
  dx: number,
  dy: number,
  ui?: CustomUI,
): void {
  if (!comp.selectedWidgetId) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;

  const widget = layout.widgets.find(
    (w: any) => w.id === comp.selectedWidgetId,
  );
  if (!widget) return;

  const baseWidth = comp.getLayoutBaseWidth(targetUi);
  const baseHeight = comp.getLayoutBaseHeight(targetUi);

  const newX = Math.max(0, Math.min(baseWidth - widget.width, widget.x + dx));
  const newY = Math.max(0, Math.min(baseHeight - widget.height, widget.y + dy));

  if (newX !== widget.x || newY !== widget.y) {
    widget.x = newX;
    widget.y = newY;
    comp.onWidgetInspectorChange(widget, targetUi);
  }
}

export function handleWidgetXChange(
  comp: any,
  value: any,
  widget: any,
  ui?: CustomUI,
): void {
  if (!widget) return;
  const baseWidth = comp.getLayoutBaseWidth(ui);
  const num = Number(value);
  const val = isNaN(num) ? 0 : num;
  widget.x = Math.max(
    0,
    Math.min(baseWidth - (widget.width || 50), Math.round(val)),
  );
  comp.onWidgetInspectorChange(widget, ui);
}

export function handleWidgetYChange(
  comp: any,
  value: any,
  widget: any,
  ui?: CustomUI,
): void {
  if (!widget) return;
  const baseHeight = comp.getLayoutBaseHeight(ui);
  const num = Number(value);
  const val = isNaN(num) ? 0 : num;
  widget.y = Math.max(
    0,
    Math.min(baseHeight - (widget.height || 50), Math.round(val)),
  );
  comp.onWidgetInspectorChange(widget, ui);
}

export function handleWidgetWidthChange(
  comp: any,
  value: any,
  widget: any,
  ui?: CustomUI,
): void {
  if (!widget) return;
  const baseWidth = comp.getLayoutBaseWidth(ui);
  const num = Number(value);
  const val = isNaN(num) ? 50 : num;
  widget.width = Math.max(
    50,
    Math.min(baseWidth - (widget.x || 0), Math.round(val)),
  );
  comp.onWidgetInspectorChange(widget, ui);
}

export function handleWidgetHeightChange(
  comp: any,
  value: any,
  widget: any,
  ui?: CustomUI,
): void {
  if (!widget) return;
  const baseHeight = comp.getLayoutBaseHeight(ui);
  const num = Number(value);
  const val = isNaN(num) ? 50 : num;
  widget.height = Math.max(
    20,
    Math.min(baseHeight - (widget.y || 0), Math.round(val)),
  );
  comp.onWidgetInspectorChange(widget, ui);
}

export function handleLayoutChanged(
  comp: any,
  newLayout: any,
  ui?: CustomUI,
): void {
  if (comp.isSaving) return;
  updateLayoutOnModel(
    newLayout,
    ui,
    comp.editingSettings,
    comp.isCurrentLayoutPractice,
    comp.parsedLayouts,
  );
  const widgets = newLayout?.widgets || [];
  if (
    widgets.length > 0 &&
    (!comp.selectedWidgetId ||
      !widgets.some((w: any) => w.id === comp.selectedWidgetId))
  ) {
    comp.selectedWidgetId = findDefaultWidgetId(newLayout);
  }
  comp.captureState();
  comp.cdr.markForCheck();
}
