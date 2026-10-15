import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import {
  LaneGridReplicationHelper,
  LaneGridSession,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import {
  LaneReplicationHelper,
  LaneReplicationOptions,
} from "@app/components/raceday/utils/lane-replication.helper";
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
  if (comp.selectedWidgetId !== id) {
    comp.selectedAnchor = null;
  }
  const layout = comp.getLayout(ui || comp.activeCustomUi);
  comp.selectedWidgetId = id || findDefaultWidgetId(layout);
  const selectedWidget =
    layout?.widgets?.find((w: any) => w.id === comp.selectedWidgetId) ||
    comp.selectedWidget;
  const uiId = ui?.entity_id || comp.activeCustomUiId;
  if (comp.selectedWidgetId && selectedWidget) {
    if (applyWidgetDefaultSettings(selectedWidget)) {
      if (ui) ui.layoutJson = JSON.stringify(comp.getLayout(ui));
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

function handleGridBindingModeSync(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  const newBindingMode = targetWidget.customSettings?.["bindingMode"];
  if (!newBindingMode) return;

  if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
    comp.activeGridSession.bindingMode = newBindingMode;
  }
  for (const w of layout.widgets) {
    if (w.customSettings?.["gridId"] === gridId && w.id !== targetWidget.id) {
      if (!w.customSettings) w.customSettings = {};
      w.customSettings["bindingMode"] = newBindingMode;
    }
  }
}

function handleGridSyncAction(
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (!targetWidget.customSettings?.["_syncAction"]) return;
  const syncAction = targetWidget.customSettings["_syncAction"];
  delete targetWidget.customSettings["_syncAction"];
  layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
    gridId,
    syncAction,
    targetWidget.customSettings,
    layout.widgets,
  );
}

function handleGridHeaderStructureChanges(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (targetWidget.customSettings?.["_headerPlacementChanged"]) {
    delete targetWidget.customSettings["_headerPlacementChanged"];
    const newPlacement =
      targetWidget.customSettings?.["headerPlacement"] || "individual";
    const headerH = targetWidget.customSettings?.["headerHeight"] || 36;
    layout.widgets = LaneGridReplicationHelper.updateGridHeaderPlacement(
      layout.widgets,
      gridId,
      newPlacement,
      headerH,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.headerPlacement = newPlacement;
      comp.activeGridSession.headerHeight = headerH;
    }
  }

  if (targetWidget.customSettings?.["_headerHeightChanged"]) {
    delete targetWidget.customSettings["_headerHeightChanged"];
    const newH = targetWidget.customSettings?.["headerHeight"] || 36;
    layout.widgets = LaneGridReplicationHelper.updateGridHeaderHeight(
      layout.widgets,
      gridId,
      newH,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.headerHeight = newH;
    }
  }
}

function handleGridTotalLanesStructureChange(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  delete targetWidget.customSettings["_gridTotalLanesChanged"];
  const newTotal = Math.max(
    1,
    Math.min(32, Number(targetWidget.customSettings?.["gridTotalLanes"]) || 4),
  );
  const existingBounds =
    comp.activeGridSession && comp.activeGridSession.gridId === gridId
      ? comp.activeGridSession.bounds
      : null;
  layout.widgets = LaneGridReplicationHelper.updateGridTotalLanes(
    layout.widgets,
    gridId,
    newTotal,
    existingBounds,
  );
  if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
    comp.activeGridSession.totalLanes = newTotal;
    if (comp.activeGridSession.bounds) {
      layout.widgets = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
        comp.activeGridSession,
        layout.widgets,
      );
    }
  }
}

function handleGridLabelStructureChange(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  delete targetWidget.customSettings["_gridLabelChanged"];
  const labelConfig = {
    gridLabelPosition: targetWidget.customSettings?.["gridLabelPosition"],
    gridLabelText: targetWidget.customSettings?.["gridLabelText"],
    gridLabelSize: targetWidget.customSettings?.["gridLabelSize"],
    gridLabelFontFamily: targetWidget.customSettings?.["gridLabelFontFamily"],
    gridLabelFontSize: targetWidget.customSettings?.["gridLabelFontSize"],
    gridLabelTextColor: targetWidget.customSettings?.["gridLabelTextColor"],
    gridLabelBackgroundColor:
      targetWidget.customSettings?.["gridLabelBackgroundColor"],
    gridLabelFontBold: targetWidget.customSettings?.["gridLabelFontBold"],
    gridLabelFontItalic: targetWidget.customSettings?.["gridLabelFontItalic"],
    gridLabelAlignment: targetWidget.customSettings?.["gridLabelAlignment"],
    gridLabelShowBorder: targetWidget.customSettings?.["gridLabelShowBorder"],
    gridLabelBorderColor: targetWidget.customSettings?.["gridLabelBorderColor"],
    gridLabelBorderWidth: targetWidget.customSettings?.["gridLabelBorderWidth"],
    gridLabelBorderRadius:
      targetWidget.customSettings?.["gridLabelBorderRadius"],
  };
  const existingBounds =
    comp.activeGridSession && comp.activeGridSession.gridId === gridId
      ? comp.activeGridSession.bounds
      : LaneGridReplicationHelper.calculateGridBounds(layout.widgets, gridId);

  layout.widgets = LaneGridReplicationHelper.updateGridLabel(
    layout.widgets,
    gridId,
    labelConfig,
    existingBounds,
  );
  if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
    Object.assign(comp.activeGridSession, labelConfig);
  }
}

function handleGridColumnStructureChanges(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (targetWidget.customSettings?.["_linkColumnsChanged"]) {
    delete targetWidget.customSettings["_linkColumnsChanged"];
    const isLinked = targetWidget.customSettings?.["linkColumns"] !== false;
    layout.widgets = LaneGridReplicationHelper.updateGridLinkColumns(
      layout.widgets,
      gridId,
      isLinked,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.linkColumns = isLinked;
    }
  }

  if (targetWidget.customSettings?.["_mirrorRowsChanged"]) {
    delete targetWidget.customSettings["_mirrorRowsChanged"];
    const isMirrored = targetWidget.customSettings?.["mirrorRows"] !== false;
    for (const w of layout.widgets) {
      if (w.customSettings?.["gridId"] === gridId) {
        if (!w.customSettings) w.customSettings = {};
        w.customSettings["mirrorRows"] = isMirrored;
      }
    }
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.mirrorRows = isMirrored;
    }
  }

  if (targetWidget.customSettings?.["_sortByBindingModeChanged"]) {
    delete targetWidget.customSettings["_sortByBindingModeChanged"];
    const sort = targetWidget.customSettings?.["sortByBindingMode"] !== false;
    layout.widgets = LaneGridReplicationHelper.updateGridSortByBindingMode(
      layout.widgets,
      gridId,
      sort,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.sortByBindingMode = sort;
    }
  }

  if (targetWidget.customSettings?.["_layoutOrientationChanged"]) {
    delete targetWidget.customSettings["_layoutOrientationChanged"];
    const orientation =
      targetWidget.customSettings?.["layoutOrientation"] || "vertical";
    layout.widgets = LaneGridReplicationHelper.updateGridLayoutOrientation(
      layout.widgets,
      gridId,
      orientation,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.layoutOrientation = orientation;
    }
  }

  if (targetWidget.customSettings?.["_gridTotalLanesChanged"]) {
    handleGridTotalLanesStructureChange(comp, layout, targetWidget, gridId);
  }

  if (targetWidget.customSettings?.["_gridLabelChanged"]) {
    handleGridLabelStructureChange(comp, layout, targetWidget, gridId);
  }
}

function handleGridStructureChanges(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  handleGridHeaderStructureChanges(comp, layout, targetWidget, gridId);
  handleGridColumnStructureChanges(comp, layout, targetWidget, gridId);
}

function handleCrossColumnLiveSync(
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (targetWidget.customSettings?.["linkColumns"] === false) return;

  if (targetWidget.customSettings?.["isHeaderWidget"]) {
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "header",
      targetWidget.customSettings,
      layout.widgets,
    );
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "border",
      targetWidget.customSettings,
      layout.widgets,
    );
  } else {
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "value",
      targetWidget.customSettings,
      layout.widgets,
    );
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "border",
      targetWidget.customSettings,
      layout.widgets,
    );
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "highlight",
      targetWidget.customSettings,
      layout.widgets,
    );
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "header",
      targetWidget.customSettings,
      layout.widgets,
    );
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

    const gridId = targetWidget.customSettings?.["gridId"];
    if (gridId) {
      handleGridBindingModeSync(comp, layout, targetWidget, gridId);
      handleGridSyncAction(layout, targetWidget, gridId);
      handleGridStructureChanges(comp, layout, targetWidget, gridId);

      if (
        comp.activeGridSession &&
        LaneGridReplicationHelper.isMasterWidget(
          targetWidget,
          comp.activeGridSession,
        )
      ) {
        LaneGridReplicationHelper.updateWidgetCellRatios(
          targetWidget,
          comp.activeGridSession,
        );
        if (targetWidget.customSettings?.["mirrorRows"] !== false) {
          layout.widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
            targetWidget,
            comp.activeGridSession,
            layout.widgets,
          );
        }
      }

      handleCrossColumnLiveSync(layout, targetWidget, gridId);

      if (targetWidget.customSettings?.["customLabel"] !== undefined) {
        const masterId =
          targetWidget.customSettings?.["gridMasterId"] || targetWidget.id;
        for (const w of layout.widgets) {
          if (
            w.customSettings?.["gridId"] === gridId &&
            (w.id === masterId ||
              w.customSettings?.["gridMasterId"] === masterId)
          ) {
            if (!w.customSettings) w.customSettings = {};
            w.customSettings["customLabel"] =
              targetWidget.customSettings["customLabel"];
          }
        }
      }

      if (targetWidget.customSettings) {
        for (const k of Object.keys(targetWidget.customSettings)) {
          if (k.startsWith("_reset_")) {
            delete targetWidget.customSettings[k];
          }
        }
      }
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

  const laneView = newWidgets.find((w: any) => w.widgetType === "lane-view");
  const nextWidget = laneView || newWidgets[0];
  comp.selectedWidgetId = nextWidget ? nextWidget.id : null;

  const uiId = targetUi?.entity_id || comp.activeCustomUiId;
  if (uiId && comp.countdownPreviewActiveByUi) {
    comp.countdownPreviewActiveByUi[uiId] =
      nextWidget?.widgetType === "countdown";
  }

  comp.onLayoutChanged(updatedLayout, targetUi);
}

export function isWidgetHeightAutoCalculated(
  widget: any,
  session?: LaneGridSession | null,
): boolean {
  if (!widget?.customSettings?.["gridId"]) return false;
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
  const dir =
    session && session.gridId === widget.customSettings["gridId"]
      ? session.direction
      : widget.customSettings["gridDirection"] || "vertical";
  return dir === "horizontal";
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
  if (!widget || isWidgetHeightAutoCalculated(widget, comp.activeGridSession))
    return;
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
  if (!widget || isWidgetWidthAutoCalculated(widget, comp.activeGridSession))
    return;
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
  if (!widget || isWidgetHeightAutoCalculated(widget, comp.activeGridSession))
    return;
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
