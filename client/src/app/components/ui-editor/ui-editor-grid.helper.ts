import {
  LaneGridBounds,
  LaneGridReplicationHelper,
  LaneGridSession,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import { CustomUI } from "@app/models/custom-ui";

import { updateLayoutOnModel } from "./ui-editor-widget.helper";

function calculateSessionBounds(
  options: any,
  sourceWidgets: any[],
  layoutWidgets: any[],
  baseWidth: number,
  baseHeight: number,
): LaneGridBounds {
  if (options.distributionMode === "auto-fit" || sourceWidgets.length === 0) {
    return LaneGridReplicationHelper.calculateAvailableGridBounds(
      sourceWidgets,
      layoutWidgets,
      baseWidth,
      baseHeight,
      options.direction,
      options.replaceExisting,
      options.sourceBindingMode,
      options.sourceIndex,
      options.targetCount,
    );
  }
  const minX = Math.min(...sourceWidgets.map((w: any) => w.x));
  const maxX = Math.max(...sourceWidgets.map((w: any) => w.x + w.width));
  const minY = Math.min(...sourceWidgets.map((w: any) => w.y));
  const maxY = Math.max(...sourceWidgets.map((w: any) => w.y + w.height));
  const wWidth = maxX - minX;
  const wHeight = maxY - minY;

  return {
    x: Math.max(0, minX - 10),
    y: Math.max(0, minY - 10),
    width: Math.min(baseWidth - minX, (wWidth + 20) * options.targetCount),
    height: Math.min(baseHeight - minY, wHeight + 20),
  };
}

function calculatePhysicalCellIndex(
  sourceWidgets: any[],
  bounds: LaneGridBounds,
  direction: "horizontal" | "vertical",
  targetCount: number,
): number {
  const pitch =
    direction === "horizontal"
      ? bounds.width / targetCount
      : bounds.height / targetCount;

  if (sourceWidgets.length === 0 || pitch <= 0) return 0;
  if (direction === "horizontal") {
    const minX = Math.min(...sourceWidgets.map((w: any) => w.x));
    return Math.max(
      0,
      Math.min(targetCount - 1, Math.round((minX - bounds.x) / pitch)),
    );
  }
  const minY = Math.min(...sourceWidgets.map((w: any) => w.y));
  return Math.max(
    0,
    Math.min(targetCount - 1, Math.round((minY - bounds.y) / pitch)),
  );
}

export function handleStartGridSession(
  comp: any,
  options: any,
  ui?: CustomUI,
): void {
  if (!options) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout) return;
  if (!layout.widgets) layout.widgets = [];

  const baseWidth = layout.baseWidth || 1920;
  const baseHeight = layout.baseHeight || 1080;

  let sourceWidgets = layout.widgets.filter((w: any) => {
    if (w.widgetType !== "lane-column") return false;
    const mode = w.customSettings?.["bindingMode"] || "lane";
    const idx = Number(w.customSettings?.["targetIndex"] ?? 0);
    return (
      mode === options.sourceBindingMode &&
      idx === Number(options.sourceIndex ?? 0)
    );
  });

  if (sourceWidgets.length === 0) {
    sourceWidgets = layout.widgets.filter((w: any) => {
      if (w.widgetType !== "lane-column") return false;
      const idx = Number(w.customSettings?.["targetIndex"] ?? 0);
      return idx === Number(options.sourceIndex ?? 0);
    });
  }

  for (const sw of sourceWidgets) {
    if (!sw.customSettings) sw.customSettings = {};
    sw.customSettings["bindingMode"] = options.sourceBindingMode ?? "lane";
  }

  const bounds = calculateSessionBounds(
    options,
    sourceWidgets,
    layout.widgets,
    baseWidth,
    baseHeight,
  );
  const physicalCellIndex = calculatePhysicalCellIndex(
    sourceWidgets,
    bounds,
    options.direction,
    options.targetCount,
  );

  const gridId = `grid-${Date.now()}`;
  const session: LaneGridSession = {
    gridId,
    bounds,
    totalLanes: options.targetCount,
    direction: options.direction,
    sourceLaneIndex: physicalCellIndex,
    bindingMode: options.sourceBindingMode ?? "lane",
  };

  comp.activeGridSession = session;

  if (options.replaceExisting) {
    const sourceIds = new Set(sourceWidgets.map((w: any) => w.id));
    layout.widgets = layout.widgets.filter((w: any) => {
      if (w.widgetType !== "lane-column") return true;
      if (sourceIds.has(w.id)) return true;
      const targetIndex = Number(w.customSettings?.["targetIndex"] ?? 0);
      if (targetIndex < options.targetCount) {
        return false;
      }
      return true;
    });
  }

  layout.widgets = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
    session,
    layout.widgets,
  );

  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.captureState?.();
  comp.cdr.markForCheck();
}

export function handleFinishGridSession(comp: any, ui?: CustomUI): void {
  if (!comp.activeGridSession) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (layout?.widgets) {
    layout.widgets = LaneGridReplicationHelper.bakeGrid(
      layout.widgets,
      comp.activeGridSession,
    );
    updateLayoutOnModel(
      layout,
      targetUi,
      comp.editingSettings,
      comp.isCustomUiPractice(targetUi),
      comp.parsedLayouts,
    );
  }
  comp.activeGridSession = null;
  comp.captureState();
  comp.cdr.markForCheck();
}

export function handleEditGridTemplate(
  comp: any,
  gridId: string,
  ui?: CustomUI,
): void {
  if (!gridId) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;

  const gridWidgets = layout.widgets.filter(
    (w: any) => w.customSettings?.["gridId"] === gridId,
  );
  if (gridWidgets.length === 0) return;

  const bounds = LaneGridReplicationHelper.calculateGridBounds(
    layout.widgets,
    gridId,
  );
  if (!bounds) return;

  const first = gridWidgets[0];
  const totalLanes =
    Number(first.customSettings?.["gridTotalLanes"]) || comp.maxTrackLanes || 4;
  const direction = first.customSettings?.["gridDirection"] || "horizontal";
  const positionWidget = gridWidgets.find(
    (w: any) => w.customSettings?.["bindingMode"] === "position",
  );
  const bindingMode = positionWidget
    ? "position"
    : first.customSettings?.["bindingMode"] || "lane";

  const session: LaneGridSession = {
    gridId,
    bounds,
    totalLanes,
    direction,
    sourceLaneIndex: 0,
    bindingMode,
  };

  comp.activeGridSession = session;
  layout.widgets = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
    session,
    layout.widgets,
  );

  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.cdr.markForCheck();
}

export function handleDetachGrid(
  comp: any,
  gridId: string,
  ui?: CustomUI,
): void {
  if (!gridId) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;

  layout.widgets = LaneGridReplicationHelper.detachGrid(layout.widgets, gridId);
  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );

  if (comp.activeGridSession?.gridId === gridId) {
    comp.activeGridSession = null;
  }
  comp.captureState();
  comp.cdr.markForCheck();
}

export function handleUpdateGridBounds(
  comp: any,
  newBounds: LaneGridBounds,
  ui?: CustomUI,
): void {
  if (!comp.activeGridSession || !newBounds) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;

  comp.activeGridSession = {
    ...comp.activeGridSession,
    bounds: newBounds,
  };

  layout.widgets = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
    comp.activeGridSession,
    layout.widgets,
  );

  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.cdr.markForCheck();
}
