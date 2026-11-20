import { duplicateWidgets } from "@app/components/ui-editor/duplicate.utils";
import {
  pasteStyle,
  StyleCopy,
} from "@app/components/ui-editor/style-copy.utils";
import { InspectorSchema } from "@app/components/ui-editor/inspector-kit/inspector-schema";
import {
  canMultiSelect,
  clampGroupDelta,
  movableIds,
} from "@app/components/ui-editor/multi-select.utils";
import {
  arrange,
  ArrangeAction,
  ArrangeResult,
} from "@app/components/ui-editor/arrange.utils";
import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import {
  LaneGridReplicationHelper,
  LaneGridSession,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import {
  LaneReplicationHelper,
  LaneReplicationOptions,
} from "@app/components/raceday/utils/lane-replication.helper";
import {
  LayerMove,
  moveLayer,
} from "@app/components/raceday/utils/layer-order.utils";
import { LaneViewMigrationHelper } from "@app/components/raceday/utils/lane-view-migration.helper";
import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";
import { resolveCustomWidgetName } from "@app/utils/custom-widget-name.utils";

import { handleGridWidgetInspectorSync } from "./ui-editor-grid-sync.helper";
import { WIDGET_REGISTRY } from "./widget-registry";

export function findDefaultWidgetId(
  layout: LayoutConfig | undefined,
): string | null {
  const widgets = layout?.widgets || [];
  if (widgets.length === 0) return null;
  const laneView = widgets.find((w: any) => w.widgetType === "lane-view");
  return laneView ? laneView.id : widgets[0].id;
}

export function computeWidgetDisplayName(
  widget: any,
  translationService: any,
  availableColumns?: { key: string; label: string }[],
  getWidgetTypeLabelKey?: (w: string) => string,
  selectedAnchor?: string | null,
): string {
  if (!widget) return "";
  const type = widget.widgetType;
  const key = getWidgetTypeLabelKey
    ? getWidgetTypeLabelKey(type)
    : "UE_WIDGET_TYPE_" + type?.toUpperCase().replace(/-/g, "_");
  const translatedType = translationService?.translate?.(key) || type;

  if (type === "lane-column") {
    const s = widget.customSettings || {};
    let colLabel = s.customLabel || "";
    if (!colLabel && s.columnKey) {
      const match = availableColumns?.find((c) => c.key === s.columnKey);
      if (match?.label) {
        colLabel = translationService?.translate?.(match.label) || match.label;
      } else {
        colLabel = s.columnKey
          .replace(/^driver\./, "")
          .replace(/([A-Z])/g, " $1")
          .trim();
      }
    }
    if (!colLabel) colLabel = translatedType;

    let baseDisplayName = "";
    if (s.isHeaderWidget) {
      const headerText =
        translationService?.translate?.("UE_GRID_HEADER_ROW_BADGE") || "Header";
      baseDisplayName = s.gridId
        ? `Grid · ${headerText} · ${colLabel}`
        : `${headerText} · ${colLabel}`;
    } else {
      const idx =
        (s.gridLane != null
          ? s.gridLane
          : s.targetIndex != null
            ? s.targetIndex
            : 0) + 1;
      const mode = s.bindingMode || "lane";
      let prefix = `Lane ${idx}`;
      if (mode === "position") prefix = `Pos ${idx}`;
      else if (mode === "overallPosition") prefix = `Overall Pos ${idx}`;
      else if (mode === "seed") prefix = `Seed ${idx}`;
      else if (mode === "hostLane") {
        prefix =
          translationService?.translate?.("UE_PREFIX_STATION_LANE") ||
          "Station Lane";
      } else if (mode === "hostDriver") {
        prefix =
          translationService?.translate?.("UE_PREFIX_STATION_DRIVER") ||
          "Station Driver";
      }

      baseDisplayName = s.gridId
        ? `Grid · ${prefix} · ${colLabel}`
        : `${prefix} · ${colLabel}`;
    }

    if (selectedAnchor && selectedAnchor !== "center-center") {
      const insetKey = s.insets?.[selectedAnchor];
      const anchorPosKey = "UE_ANCHOR_" + selectedAnchor;
      const anchorPosName =
        translationService?.translate?.(anchorPosKey) || selectedAnchor;
      if (insetKey) {
        const match = availableColumns?.find((c) => c.key === insetKey);
        const insetLabel = match?.label
          ? translationService?.translate?.(match.label) || match.label
          : insetKey;
        return `${baseDisplayName} · Inset (${anchorPosName}: ${insetLabel})`;
      } else {
        return `${baseDisplayName} · Inset (${anchorPosName})`;
      }
    }

    return baseDisplayName;
  }

  return translatedType;
}

export function resolveWidgetDisplayName(comp: any, widget: any): string {
  if (!widget) return "";
  if (widget.widgetType?.startsWith("custom:")) {
    return resolveCustomWidgetName(
      widget.widgetType,
      comp.customWidgetService?.getWidgetDefinition(widget.widgetType)
        ?.manifest,
      comp.translationService,
    );
  }
  const s = widget.customSettings;
  const currentLang =
    comp.translationService?.getCurrentLanguageValue?.() || "";
  const colKey = s?.["columnKey"] || "";
  const label = s?.["customLabel"] || "";
  const mode = s?.["bindingMode"] || "";
  const lane = s?.["gridLane"] ?? s?.["targetIndex"] ?? "";
  const header = s?.["isHeaderWidget"] ? "1" : "0";
  const inset = s?.["insets"]?.[comp.selectedAnchor || ""] || "";
  const cacheKey = `${widget.id}_${widget.widgetType}_${comp.selectedAnchor || ""}_${currentLang}_${colKey}_${label}_${mode}_${lane}_${header}_${inset}`;
  const cached = comp.widgetDisplayNameCache?.get(widget.id);
  if (cached && cached.key === cacheKey) {
    return cached.name;
  }
  const name = computeWidgetDisplayName(
    widget,
    comp.translationService,
    comp.availableColumns,
    (w: string) => comp.getWidgetTypeLabelKey(w),
    comp.selectedAnchor,
  );
  comp.widgetDisplayNameCache?.set(widget.id, { key: cacheKey, name });
  return name;
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
  const selectedWidget =
    layout?.widgets?.find((w: any) => w.id === comp.selectedWidgetId) ||
    comp.selectedWidget;
  const uiId = ui?.entity_id || comp.activeCustomUiId;
  if (uiId && comp.countdownPreviewActiveByUi) {
    comp.countdownPreviewActiveByUi[uiId] =
      selectedWidget?.widgetType === "countdown";
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
    if (widget.widgetType === "lane-column" && widget.customSettings) {
      if (!widget.customSettings["backgroundColor"]) {
        widget.customSettings["backgroundColor"] = "#000000";
        mutated = true;
      }
      if (
        !widget.customSettings["textColor"] ||
        (widget.customSettings["textColor"] === "#000000" &&
          widget.customSettings["backgroundColor"] === "#000000")
      ) {
        widget.customSettings["textColor"] = "#ffffff";
        mutated = true;
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
      LaneViewMigrationHelper.migrateGapWidgets(editingSettings.racedayLayout);
      return editingSettings.racedayLayout;
    }
    if (
      targetUi.entity_id === "practice_ui_layout_rc_ai" &&
      editingSettings?.practiceRacedayLayout
    ) {
      LaneViewMigrationHelper.migrateGapWidgets(
        editingSettings.practiceRacedayLayout,
      );
      return editingSettings.practiceRacedayLayout;
    }
    if (
      targetUi.entity_id === "driver_station_ui_layout_rc_ai" &&
      (!targetUi.layoutJson || targetUi.layoutJson === "[]")
    ) {
      return JSON.parse(JSON.stringify(Settings.DEFAULT_DRIVER_STATION_LAYOUT));
    }
    if (targetUi.layoutJson && targetUi.layoutJson !== "[]") {
      if (parsedLayoutsCache && parsedLayoutsCache.has(targetUi.entity_id)) {
        const cached = parsedLayoutsCache.get(targetUi.entity_id);
        LaneViewMigrationHelper.migrateGapWidgets(cached);
        return cached;
      }
      try {
        const parsed = JSON.parse(targetUi.layoutJson);
        LaneViewMigrationHelper.migrateGapWidgets(parsed);
        if (parsedLayoutsCache) {
          parsedLayoutsCache.set(targetUi.entity_id, parsed);
        }
        return parsed;
      } catch {
        // Fallback below
      }
    }
  }
  const fallback =
    editingSettings?.racedayLayout ||
    JSON.parse(JSON.stringify(Settings.DEFAULT_LAYOUT));
  LaneViewMigrationHelper.migrateGapWidgets(fallback);
  return fallback;
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

function resolveMirroredMasterId(
  layout: any,
  id: string | null,
  activeGridSession: any,
): string | null {
  if (!id || !layout?.widgets) return id;
  const target = layout.widgets.find((w: any) => w.id === id);
  const masterId = target?.customSettings?.["gridMasterId"];
  if (!masterId) return id;

  const sessionMatchesTarget =
    activeGridSession &&
    target?.customSettings?.["gridId"] &&
    activeGridSession.gridId === target.customSettings["gridId"];
  const isHoriz =
    (sessionMatchesTarget &&
      (activeGridSession.direction === "horizontal" ||
        activeGridSession.layoutOrientation === "horizontal")) ||
    target?.customSettings?.["gridDirection"] === "horizontal" ||
    target?.customSettings?.["layoutOrientation"] === "horizontal";
  const isLanesMirrored = isHoriz
    ? target?.customSettings?.["linkColumns"] !== false &&
      (!sessionMatchesTarget || activeGridSession.linkColumns !== false)
    : target?.customSettings?.["mirrorRows"] !== false &&
      (!sessionMatchesTarget || activeGridSession.mirrorRows !== false);
  if (isLanesMirrored && layout.widgets.some((w: any) => w.id === masterId)) {
    return masterId;
  }
  return id;
}

export function handleWidgetSelection(
  comp: any,
  id: string | null,
  ui?: CustomUI,
): void {
  if (ui) comp.activeCustomUiId = ui.entity_id;
  if (comp.selectedWidgetId !== id) {
    comp.selectedAnchor = null;
  }
  const layout = comp.getLayout(ui || comp.activeCustomUi);
  const resolvedId = resolveMirroredMasterId(
    layout,
    id,
    comp.activeGridSession,
  );
  comp.selectedWidgetId = resolvedId || findDefaultWidgetId(layout);
  const selectedWidget =
    layout?.widgets?.find((w: any) => w.id === comp.selectedWidgetId) ||
    comp.selectedWidget;
  const uiId = ui?.entity_id || comp.activeCustomUiId;
  if (comp.selectedWidgetId && selectedWidget) {
    if (applyWidgetDefaultSettings(selectedWidget)) {
      const target = ui || comp.activeCustomUi;
      if (target && layout?.widgets?.includes(selectedWidget)) {
        // Store the filled-in defaults on the layout the widget came from and show
        // them on the canvas straight away. Without this the layout editor (which
        // calls this without `ui`) only filled in a parsed copy: the panel showed
        // e.g. a Menu Bar font size of 24 while the canvas kept the auto-sized text
        // until the next edit saved the copy.
        target.layoutJson = JSON.stringify(layout);
        comp.syncRacedayPreview?.(layout);
      } else if (ui) {
        ui.layoutJson = JSON.stringify(comp.getLayout(ui));
      }
      if (comp.editingState?.settings) {
        comp.editingState.settings = { ...comp.editingState.settings };
      }
    }
    if (uiId && comp.countdownPreviewActiveByUi) {
      comp.countdownPreviewActiveByUi[uiId] =
        selectedWidget.widgetType === "countdown";
    }
    const gridId = selectedWidget.customSettings?.gridId;
    if (gridId && comp.activeGridSession?.gridId !== gridId) {
      if (comp.activeGridSession && comp.finishGridSession) {
        comp.finishGridSession(ui);
      }
      comp.onEditGridTemplate?.(gridId, ui);
    } else if (!gridId && comp.activeGridSession && comp.finishGridSession) {
      comp.finishGridSession(ui);
    }
  } else if (uiId && comp.countdownPreviewActiveByUi) {
    comp.countdownPreviewActiveByUi[uiId] = false;
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

export function resetCustomScalingOverrides(widget: any): void {
  if (!widget?.customSettings) return;
  const s = widget.customSettings;
  const isGrid = Boolean(s["gridId"]);
  if (widget.widgetType === "lane-column") {
    s["valueFontSize"] = isGrid ? 54 : 36;
    s["headerFontSize"] = isGrid ? 24 : 14;
    s["insetFontSize"] = isGrid ? 24 : 18;
    if (s.insetsConfig) {
      for (const anchor of Object.keys(s.insetsConfig)) {
        if (s.insetsConfig[anchor]?.fontSize) {
          delete s.insetsConfig[anchor].fontSize;
        }
      }
    }
  }
}

export function handleWidgetInspectorChange(
  comp: any,
  widget?: any,
  ui?: CustomUI,
): void {
  const targetUi = ui || comp.activeCustomUi;
  const targetWidget = widget || comp.currentSelectedWidget;
  const layout = comp.getLayout(targetUi);
  if (layout && targetWidget && layout.widgets) {
    const existingWidget = layout.widgets.find(
      (w: any) => w.id === targetWidget.id,
    );
    const targetGridId = targetWidget.customSettings?.["gridId"];
    const isTransitioningToAuto =
      targetWidget.scaleMode === "auto" &&
      ((existingWidget && existingWidget.scaleMode !== "auto") ||
        (targetGridId &&
          layout.widgets.some(
            (w: any) =>
              w.customSettings?.["gridId"] === targetGridId &&
              w.scaleMode !== "auto",
          )));

    if (isTransitioningToAuto) {
      resetCustomScalingOverrides(targetWidget);
      if (targetGridId) {
        for (const w of layout.widgets) {
          if (w.customSettings?.["gridId"] === targetGridId) {
            w.scaleMode = "auto";
            resetCustomScalingOverrides(w);
          }
        }
      }
    }
    const idx = layout.widgets.findIndex((w: any) => w.id === targetWidget.id);
    if (idx !== -1) {
      layout.widgets[idx] = targetWidget;
    }

    const gridId = targetWidget.customSettings?.["gridId"];
    if (gridId) {
      handleGridWidgetInspectorSync(comp, layout, targetWidget, gridId);
    }
    updateLayoutOnModel(
      layout,
      targetUi,
      comp.editingSettings,
      comp.isCurrentLayoutPractice,
      comp.parsedLayouts,
    );
    comp.syncRacedayPreview?.(layout, targetUi);
  }
  comp.captureState();
  comp.cdr.markForCheck();
}

export function handleReplicateLanes(
  comp: any,
  options: Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">,
  ui?: CustomUI,
): void {
  if (!options) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;
  const baseWidth = layout.baseWidth || 1920;
  const baseHeight = layout.baseHeight || 1080;
  const updated = LaneReplicationHelper.replicateLaneWidgets(layout.widgets, {
    ...options,
    baseWidth,
    baseHeight,
  });
  layout.widgets = updated;
  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.captureState();
  comp.cdr.markForCheck();
}

export function handleRemoveSelectedWidget(comp: any, ui?: CustomUI): void {
  if (!comp.selectedWidgetId) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;

  const idToRemove = comp.selectedWidgetId;
  const targetWidget = layout.widgets.find((w: any) => w.id === idToRemove);
  const gridId =
    comp.activeGridSession?.gridId || targetWidget?.customSettings?.["gridId"];

  let newWidgets: any[];
  if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
    newWidgets = LaneGridReplicationHelper.removeMasterWidgetFromLanes(
      idToRemove,
      comp.activeGridSession,
      layout.widgets,
    );
  } else if (gridId) {
    newWidgets = LaneGridReplicationHelper.removeMasterWidgetFromLanes(
      idToRemove,
      { gridId } as any,
      layout.widgets,
    );
  } else {
    newWidgets = layout.widgets.filter((w: any) => w.id !== idToRemove);
  }

  if (gridId && !LaneGridReplicationHelper.hasGridWidgets(newWidgets, gridId)) {
    newWidgets = LaneGridReplicationHelper.removeGrid(newWidgets, gridId);
    LaneGridAnimationHelper.reset(gridId);
    if (comp.activeGridSession?.gridId === gridId) {
      comp.activeGridSession = null;
    }
  }

  const updatedLayout = { ...layout, widgets: newWidgets };

  const nextWidgetId = LaneGridReplicationHelper.findNextWidgetAfterDeletion(
    idToRemove,
    layout.widgets,
    newWidgets,
    comp.activeGridSession,
  );
  if (comp.selectedWidgetId !== nextWidgetId) {
    comp.selectedAnchor = null;
  }
  comp.selectedWidgetId = nextWidgetId;

  const nextWidget = nextWidgetId
    ? newWidgets.find((w: any) => w.id === nextWidgetId)
    : null;

  if (
    gridId &&
    !comp.activeGridSession &&
    nextWidget?.customSettings?.["gridId"] === gridId
  ) {
    comp.onEditGridTemplate?.(gridId, targetUi);
  }

  const uiId = targetUi?.entity_id || comp.activeCustomUiId;
  if (uiId && comp.countdownPreviewActiveByUi) {
    comp.countdownPreviewActiveByUi[uiId] =
      nextWidget?.widgetType === "countdown";
  }

  comp.onLayoutChanged(updatedLayout, targetUi);
}

/**
 * Delete several selected widgets at once (phase 4c-2), as one undo step.
 * Only plain widgets can be part of a multi-selection, so no grid clean-up
 * is needed. Nothing stays selected afterwards.
 */
export function handleRemoveWidgets(
  comp: any,
  ids: string[],
  ui?: CustomUI,
): void {
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets || !ids.length) return;
  const newWidgets = layout.widgets.filter((w: any) => !ids.includes(w.id));
  if (newWidgets.length === layout.widgets.length) return;
  comp.selectedAnchor = null;
  comp.selectedWidgetId = null;
  comp.onLayoutChanged({ ...layout, widgets: newWidgets }, targetUi);
}

/**
 * Align / distribute / same size for the selected widgets (phase 4c-3), as
 * one undo step. Locked widgets are left as they are.
 */
export function handleArrange(
  comp: any,
  action: ArrangeAction,
  ui?: CustomUI,
): ArrangeResult {
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  const none = { changed: 0, skipped: 0 };
  if (!layout?.widgets) return none;
  const byId = new Map<string, any>(layout.widgets.map((w: any) => [w.id, w]));
  const selected = (comp.selectedWidgetIds || [])
    .map((id: string) => byId.get(id))
    .filter((w: any) => w && canMultiSelect(w));
  if (selected.length < 2) return none;
  const result = arrange(
    selected,
    action,
    comp.getLayoutBaseWidth(targetUi),
    comp.getLayoutBaseHeight(targetUi),
  );
  if (!result.changed) return result;
  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.captureState();
  comp.cdr?.markForCheck();
  return result;
}

/**
 * Paste a copied style on several selected widgets (phase 5a), as one undo
 * step. `schemaFor` gives each widget's panel schema. Returns how many
 * widgets changed.
 */
export function handlePasteStyle(
  comp: any,
  copy: StyleCopy | null,
  ids: string[],
  schemaFor: (widget: any) => InspectorSchema | null,
  ui?: CustomUI,
): number {
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!copy || !layout?.widgets) return 0;
  let changed = 0;
  for (const id of ids) {
    const w = layout.widgets.find((x: any) => x.id === id);
    if (!w || !canMultiSelect(w)) continue;
    if (pasteStyle(copy, schemaFor(w), w)) changed++;
  }
  if (!changed) return 0;
  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.captureState();
  comp.cdr?.markForCheck();
  return changed;
}

/**
 * Duplicate the given widgets (phase 5c), as one undo step. Returns the new
 * ids in the order of the widgets that could be duplicated.
 */
export function handleDuplicateWidgets(
  comp: any,
  ids: string[],
  ui?: CustomUI,
): string[] {
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return [];
  const newIds = duplicateWidgets(
    layout.widgets,
    ids,
    comp.getLayoutBaseWidth(targetUi),
    comp.getLayoutBaseHeight(targetUi),
  );
  if (!newIds.length) return [];
  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.captureState();
  comp.cdr?.markForCheck();
  return newIds;
}

export function isWidgetHeightAutoCalculated(
  widget: any,
  session?: LaneGridSession | null,
): boolean {
  if (!widget?.customSettings?.["gridId"]) return false;
  const isMirrored =
    session && session.gridId === widget.customSettings["gridId"]
      ? session.mirrorRows !== false
      : widget.customSettings["mirrorRows"] !== false;
  if (!isMirrored) return false;
  const dir =
    session && session.gridId === widget.customSettings["gridId"]
      ? session.direction
      : widget.customSettings["gridDirection"] || "vertical";
  return dir === "vertical";
}

export function isWidgetWidthAutoCalculated(
  widget: any,
  session?: LaneGridSession | null,
): boolean {
  if (!widget?.customSettings?.["gridId"]) return false;
  const isMirrored =
    session && session.gridId === widget.customSettings["gridId"]
      ? session.mirrorRows !== false
      : widget.customSettings["mirrorRows"] !== false;
  if (!isMirrored) return false;
  const dir =
    session && session.gridId === widget.customSettings["gridId"]
      ? session.direction
      : widget.customSettings["gridDirection"] || "vertical";
  return dir === "horizontal";
}

/**
 * Layer buttons in the panel (phase 4b): move a widget, or its whole grid,
 * in the saved order. One undo step.
 */
export function handleLayerOrder(
  comp: any,
  widgetId: string,
  move: LayerMove,
  ui?: CustomUI,
): void {
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets || !moveLayer(layout.widgets, widgetId, move)) return;
  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.captureState();
  comp.cdr?.markForCheck();
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

  // several selected (phase 4c-2): move them all, as one undo step
  const ids: string[] = comp.selectedWidgetIds || [];
  if (ids.length > 1) {
    const starts = movableIds(layout.widgets, ids).map((id) =>
      layout.widgets.find((w: any) => w.id === id),
    );
    if (!starts.length) return;
    const d = clampGroupDelta(
      starts,
      dx,
      dy,
      comp.getLayoutBaseWidth(targetUi),
      comp.getLayoutBaseHeight(targetUi),
    );
    if (!d.dx && !d.dy) return;
    for (const w of starts) {
      w.x += d.dx;
      w.y += d.dy;
    }
    updateLayoutOnModel(
      layout,
      targetUi,
      comp.editingSettings,
      comp.isCustomUiPractice(targetUi),
      comp.parsedLayouts,
    );
    comp.syncRacedayPreview?.(layout, targetUi);
    comp.captureState();
    comp.cdr?.markForCheck();
    return;
  }

  const widget = layout.widgets.find(
    (w: any) => w.id === comp.selectedWidgetId,
  );
  if (!widget) return;
  // a locked widget doesn't move with the arrow keys either
  if (widget.customSettings?.["locked"] === true) return;

  const canNudgeX = !isWidgetWidthAutoCalculated(
    widget,
    comp.activeGridSession,
  );
  const canNudgeY = !isWidgetHeightAutoCalculated(
    widget,
    comp.activeGridSession,
  );
  const effDx = canNudgeX ? dx : 0;
  const effDy = canNudgeY ? dy : 0;
  if (effDx === 0 && effDy === 0) return;

  const baseWidth = comp.getLayoutBaseWidth(targetUi);
  const baseHeight = comp.getLayoutBaseHeight(targetUi);

  const newX = Math.max(
    0,
    Math.min(baseWidth - widget.width, widget.x + effDx),
  );
  const newY = Math.max(
    0,
    Math.min(baseHeight - widget.height, widget.y + effDy),
  );

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
  if (!widget || isWidgetWidthAutoCalculated(widget, comp.activeGridSession))
    return;
  const baseWidth = comp.getLayoutBaseWidth
    ? comp.getLayoutBaseWidth(ui)
    : 1920;
  const rawVal =
    value && typeof value === "object" && "target" in value
      ? value.target.value
      : value;
  const num = Number(rawVal);
  const max = Math.max(0, baseWidth - (widget.width || 50));
  const val =
    rawVal === "" || rawVal === null || rawVal === undefined
      ? widget.x || 0
      : Math.max(0, Math.min(max, isNaN(num) ? 0 : Math.round(num)));
  if (value && typeof value === "object" && "target" in value && value.target) {
    value.target.value = String(val);
  }
  const hasChanged = widget.x !== val;
  widget.x = val;
  if (hasChanged) {
    comp.onWidgetInspectorChange(widget, ui);
  }
}

export function handleWidgetYChange(
  comp: any,
  value: any,
  widget: any,
  ui?: CustomUI,
): void {
  if (!widget || isWidgetHeightAutoCalculated(widget, comp.activeGridSession))
    return;
  const baseHeight = comp.getLayoutBaseHeight
    ? comp.getLayoutBaseHeight(ui)
    : 1080;
  const rawVal =
    value && typeof value === "object" && "target" in value
      ? value.target.value
      : value;
  const num = Number(rawVal);
  const max = Math.max(0, baseHeight - (widget.height || 50));
  const val =
    rawVal === "" || rawVal === null || rawVal === undefined
      ? widget.y || 0
      : Math.max(0, Math.min(max, isNaN(num) ? 0 : Math.round(num)));
  if (value && typeof value === "object" && "target" in value && value.target) {
    value.target.value = String(val);
  }
  const hasChanged = widget.y !== val;
  widget.y = val;
  if (hasChanged) {
    comp.onWidgetInspectorChange(widget, ui);
  }
}

export function handleWidgetWidthChange(
  comp: any,
  value: any,
  widget: any,
  ui?: CustomUI,
): void {
  if (!widget || isWidgetWidthAutoCalculated(widget, comp.activeGridSession))
    return;
  const baseWidth = comp.getLayoutBaseWidth
    ? comp.getLayoutBaseWidth(ui)
    : 1920;
  const rawVal =
    value && typeof value === "object" && "target" in value
      ? value.target.value
      : value;
  const num = Number(rawVal);
  const val =
    rawVal === "" || rawVal === null || rawVal === undefined
      ? widget.width || 50
      : isNaN(num)
        ? 50
        : Math.round(num);
  const clamped = Math.max(50, Math.min(baseWidth - (widget.x || 0), val));
  if (value && typeof value === "object" && "target" in value && value.target) {
    value.target.value = String(clamped);
  }
  const hasChanged = widget.width !== clamped;
  widget.width = clamped;
  if (hasChanged) {
    comp.onWidgetInspectorChange(widget, ui);
  }
}

export function handleWidgetHeightChange(
  comp: any,
  value: any,
  widget: any,
  ui?: CustomUI,
): void {
  if (!widget || isWidgetHeightAutoCalculated(widget, comp.activeGridSession))
    return;
  const baseHeight = comp.getLayoutBaseHeight
    ? comp.getLayoutBaseHeight(ui)
    : 1080;
  const rawVal =
    value && typeof value === "object" && "target" in value
      ? value.target.value
      : value;
  const num = Number(rawVal);
  const val =
    rawVal === "" || rawVal === null || rawVal === undefined
      ? widget.height || 20
      : isNaN(num)
        ? 50
        : Math.round(num);
  const clamped = Math.max(20, Math.min(baseHeight - (widget.y || 0), val));
  if (value && typeof value === "object" && "target" in value && value.target) {
    value.target.value = String(clamped);
  }
  const hasChanged = widget.height !== clamped;
  widget.height = clamped;
  if (hasChanged) {
    comp.onWidgetInspectorChange(widget, ui);
  }
}

export function handleLayoutChanged(
  comp: any,
  newLayout: any,
  ui?: CustomUI,
): void {
  updateLayoutOnModel(
    newLayout,
    ui,
    comp.editingSettings,
    comp.isCurrentLayoutPractice,
    comp.parsedLayouts,
  );
  const widgets = newLayout?.widgets || [];
  if (
    comp.activeGridSession &&
    !LaneGridReplicationHelper.hasGridWidgets(
      widgets,
      comp.activeGridSession.gridId,
    )
  ) {
    if (newLayout?.widgets) {
      newLayout.widgets = LaneGridReplicationHelper.removeGrid(
        widgets,
        comp.activeGridSession.gridId,
      );
    }
    LaneGridAnimationHelper.reset(comp.activeGridSession.gridId);
    comp.activeGridSession = null;
  }
  if (
    widgets.length > 0 &&
    (!comp.selectedWidgetId ||
      !widgets.some((w: any) => w.id === comp.selectedWidgetId))
  ) {
    comp.selectedWidgetId = findDefaultWidgetId(newLayout);
    const selectedWidget = widgets.find(
      (w: any) => w.id === comp.selectedWidgetId,
    );
    const uiId = ui?.entity_id || comp.activeCustomUiId;
    if (uiId && comp.countdownPreviewActiveByUi) {
      comp.countdownPreviewActiveByUi[uiId] =
        selectedWidget?.widgetType === "countdown";
    }
  }
  comp.captureState();
  comp.cdr.markForCheck();
}

export function handleAnchorSelection(
  comp: any,
  event: { widgetId: string; anchor: string | null },
  ui?: CustomUI,
): void {
  if (comp.selectedWidgetId !== event.widgetId) {
    handleWidgetSelection(comp, event.widgetId, ui);
  }
  comp.selectedAnchor = event.anchor;
  comp.cdr.markForCheck();
}
