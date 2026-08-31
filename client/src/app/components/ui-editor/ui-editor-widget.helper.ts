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
