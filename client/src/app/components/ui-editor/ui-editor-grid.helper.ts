import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { LaneGridLabelHelper } from "@app/components/raceday/utils/lane-grid-label.helper";
import {
  LaneGridBounds,
  LaneGridReplicationHelper,
  LaneGridSession,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
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

function createInitialGridSession(
  options: any,
  sourceWidgets: any[],
  bounds: LaneGridBounds,
  physicalCellIndex: number,
): LaneGridSession {
  const cs = sourceWidgets[0]?.customSettings || {};
  return {
    gridId: `grid-${Date.now()}`,
    bounds,
    totalLanes: options.targetCount,
    direction: options.direction || "vertical",
    sourceLaneIndex: physicalCellIndex,
    gridType: options.gridType || cs["gridType"] || "heat",
    bindingMode: options.sourceBindingMode ?? "lane",
    headerPlacement: options.headerPlacement ?? "individual",
    headerHeight: options.headerHeight ?? 36,
    linkColumns: options.linkColumns ?? true,
    mirrorRows: options.mirrorRows !== false,
    useLaneColors: options.useLaneColors ?? cs["useLaneColors"] ?? true,
    backgroundColor: options.backgroundColor || cs["backgroundColor"],
    textColor: options.textColor || cs["textColor"],
    layoutOrientation: cs["layoutOrientation"] || "vertical",
    gridLabelPosition: cs["gridLabelPosition"] || "none",
    gridLabelText: cs["gridLabelText"] || "",
    gridLabelSize:
      cs["gridLabelSize"] != null ? Number(cs["gridLabelSize"]) : 40,
    gridLabelFontFamily: cs["gridLabelFontFamily"] || "",
    gridLabelFontSize:
      cs["gridLabelFontSize"] != null ? Number(cs["gridLabelFontSize"]) : 18,
    gridLabelTextColor: cs["gridLabelTextColor"] || "#ffffff",
    gridLabelBackgroundColor:
      cs["gridLabelBackgroundColor"] || "rgba(15, 23, 42, 0.85)",
    gridLabelFontBold: cs["gridLabelFontBold"] !== false,
    gridLabelFontItalic: Boolean(cs["gridLabelFontItalic"]),
    gridLabelAlignment: cs["gridLabelAlignment"] || "center",
    gridLabelShowBorder: cs["gridLabelShowBorder"] !== false,
    gridLabelBorderColor: cs["gridLabelBorderColor"] || "",
    gridLabelBorderWidth:
      cs["gridLabelBorderWidth"] != null
        ? Number(cs["gridLabelBorderWidth"])
        : 1,
    gridLabelBorderRadius:
      cs["gridLabelBorderRadius"] != null
        ? Number(cs["gridLabelBorderRadius"])
        : 4,
  };
}

function isCandidateSourceWidget(w: any, options: any): boolean {
  if (w.widgetType !== "lane-column") return false;
  if (w.customSettings?.["isHeaderWidget"]) return false;
  if (w.customSettings?.["gridMasterId"]) return false;
  if (
    options.gridId &&
    w.customSettings?.["gridId"] &&
    w.customSettings["gridId"] !== options.gridId
  ) {
    return false;
  }
  if (!options.gridId && w.customSettings?.["gridId"]) return false;
  return true;
}

function resolveSourceWidgets(widgets: any[], options: any): any[] {
  let matched = widgets.filter((w: any) => {
    if (!isCandidateSourceWidget(w, options)) return false;
    const mode = w.customSettings?.["bindingMode"] || "lane";
    const idx = Number(w.customSettings?.["targetIndex"] ?? 0);
    return (
      mode === options.sourceBindingMode &&
      idx === Number(options.sourceIndex ?? 0)
    );
  });

  if (matched.length === 0) {
    matched = widgets.filter((w: any) => {
      if (!isCandidateSourceWidget(w, options)) return false;
      const idx = Number(w.customSettings?.["targetIndex"] ?? 0);
      return idx === Number(options.sourceIndex ?? 0);
    });
  }
  return matched;
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

  const sourceWidgets = resolveSourceWidgets(layout.widgets, options);

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

  const session = createInitialGridSession(
    options,
    sourceWidgets,
    bounds,
    physicalCellIndex,
  );
  comp.activeGridSession = session;

  for (const sw of sourceWidgets) {
    LaneGridReplicationHelper.updateWidgetCellRatios(sw, session);
  }

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
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.captureState?.();
  comp.cdr.markForCheck();
}

export function handleFinishGridSession(comp: any, ui?: CustomUI): void {
  if (!comp.activeGridSession) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (layout?.widgets) {
    const gridId = comp.activeGridSession.gridId;
    if (!LaneGridReplicationHelper.hasGridWidgets(layout.widgets, gridId)) {
      layout.widgets = LaneGridReplicationHelper.removeGrid(
        layout.widgets,
        gridId,
      );
      LaneGridAnimationHelper.reset(gridId);
      comp.activeGridSession = null;
      updateLayoutOnModel(
        layout,
        targetUi,
        comp.editingSettings,
        comp.isCustomUiPractice(targetUi),
        comp.parsedLayouts,
      );
      comp.syncRacedayPreview?.(layout, targetUi);
      comp.captureState();
      comp.cdr.markForCheck();
      return;
    }
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
    comp.syncRacedayPreview?.(layout, targetUi);
  }
  comp.activeGridSession = null;
  comp.captureState();
  comp.cdr.markForCheck();
}

function buildEditGridSession(
  gridId: string,
  bounds: LaneGridBounds,
  gridWidgets: any[],
  maxLanes: number,
): LaneGridSession {
  const first = gridWidgets[0];
  const totalLanes =
    Number(first.customSettings?.["gridTotalLanes"]) || maxLanes || 4;
  const direction = first.customSettings?.["gridDirection"] || "vertical";
  const positionWidget = gridWidgets.find(
    (w: any) => w.customSettings?.["bindingMode"] === "position",
  );
  const bindingMode = positionWidget
    ? "position"
    : first.customSettings?.["bindingMode"] || "lane";
  const headerPlacement =
    first.customSettings?.["headerPlacement"] || "individual";
  const headerHeight = Number(first.customSettings?.["headerHeight"]) || 36;
  const linkColumns = first.customSettings?.["linkColumns"] !== false;

  const hasOverallWidget = gridWidgets.some(
    (w: any) =>
      w.customSettings?.["gridType"] === "overall" ||
      RacedayLayoutUtils.isOverallColumnKey(w.customSettings?.["columnKey"]),
  );
  const gridType = hasOverallWidget
    ? "overall"
    : first.customSettings?.["gridType"] || "heat";

  const dataWidget = gridWidgets.find(
    (w: any) => !w.customSettings?.["isHeaderWidget"],
  );
  const useLaneColors =
    dataWidget?.customSettings?.["useLaneColors"] !== undefined
      ? Boolean(dataWidget.customSettings["useLaneColors"])
      : true;
  const backgroundColor = dataWidget?.customSettings?.["backgroundColor"];
  const textColor = dataWidget?.customSettings?.["textColor"];

  return {
    gridId,
    bounds,
    totalLanes,
    direction,
    sourceLaneIndex: 0,
    gridType,
    bindingMode,
    headerPlacement,
    headerHeight,
    linkColumns,
    mirrorRows: first.customSettings?.["mirrorRows"] !== false,
    useLaneColors,
    backgroundColor,
    textColor,
    layoutOrientation:
      first.customSettings?.["layoutOrientation"] || "vertical",
    gridLabelPosition: first.customSettings?.["gridLabelPosition"] || "none",
    gridLabelText: first.customSettings?.["gridLabelText"] || "",
    gridLabelSize:
      first.customSettings?.["gridLabelSize"] != null
        ? Number(first.customSettings["gridLabelSize"])
        : 40,
    gridLabelFontFamily: first.customSettings?.["gridLabelFontFamily"] || "",
    gridLabelFontSize:
      first.customSettings?.["gridLabelFontSize"] != null
        ? Number(first.customSettings["gridLabelFontSize"])
        : 18,
    gridLabelTextColor:
      first.customSettings?.["gridLabelTextColor"] || "#ffffff",
    gridLabelBackgroundColor:
      first.customSettings?.["gridLabelBackgroundColor"] ||
      "rgba(15, 23, 42, 0.85)",
    gridLabelFontBold: first.customSettings?.["gridLabelFontBold"] !== false,
    gridLabelFontItalic: Boolean(first.customSettings?.["gridLabelFontItalic"]),
    gridLabelAlignment:
      first.customSettings?.["gridLabelAlignment"] || "center",
    gridLabelShowBorder:
      first.customSettings?.["gridLabelShowBorder"] !== false,
    gridLabelBorderColor: first.customSettings?.["gridLabelBorderColor"] || "",
    gridLabelBorderWidth:
      first.customSettings?.["gridLabelBorderWidth"] != null
        ? Number(first.customSettings["gridLabelBorderWidth"])
        : 1,
    gridLabelBorderRadius:
      first.customSettings?.["gridLabelBorderRadius"] != null
        ? Number(first.customSettings["gridLabelBorderRadius"])
        : 4,
  };
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

  const session = buildEditGridSession(
    gridId,
    bounds,
    gridWidgets,
    comp.maxTrackLanes,
  );

  for (const w of gridWidgets) {
    if (LaneGridReplicationHelper.isMasterWidget(w, session)) {
      if (
        w.customSettings?.["cellWidthRatio"] === undefined ||
        w.customSettings?.["cellHeightRatio"] === undefined
      ) {
        LaneGridReplicationHelper.updateWidgetCellRatios(w, session);
      }
    }
  }

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
  comp.syncRacedayPreview?.(layout, targetUi);
  handleBringGridToFront(comp, gridId, targetUi);
  comp.cdr.markForCheck();
}

export function handleBringGridToFront(
  comp: any,
  gridId: string,
  ui?: CustomUI,
): void {
  if (!gridId) return;
  const targetUi = ui || comp.activeCustomUi;
  const targetComp =
    comp.racedayComponents?.find(
      (rc: any) => rc.activeCustomUi()?.entity_id === targetUi?.entity_id,
    ) || comp.racedayComponents?.first;
  if (targetComp?.bringGridToFront) {
    targetComp.bringGridToFront(gridId);
  }
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
  comp.syncRacedayPreview?.(layout, targetUi);

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

  const oldBounds = comp.activeGridSession.bounds;
  for (const w of layout.widgets) {
    if (
      w.customSettings?.["gridId"] === comp.activeGridSession.gridId &&
      LaneGridReplicationHelper.isMasterWidget(w, comp.activeGridSession)
    ) {
      if (w.customSettings) {
        if (!w.customSettings["gridBounds"]) {
          w.customSettings["gridBounds"] = { ...oldBounds };
        }
        if (
          w.customSettings["cellWidthRatio"] === undefined ||
          w.customSettings["cellHeightRatio"] === undefined
        ) {
          LaneGridReplicationHelper.updateWidgetCellRatios(
            w,
            comp.activeGridSession,
          );
        }
      }
    }
  }

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
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.cdr.markForCheck();
}

export function handleDeleteGrid(
  comp: any,
  gridId: string,
  ui?: CustomUI,
): void {
  if (!gridId) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;

  layout.widgets = LaneGridReplicationHelper.removeGrid(layout.widgets, gridId);
  LaneGridAnimationHelper.reset(gridId);

  if (comp.activeGridSession?.gridId === gridId) {
    comp.activeGridSession = null;
  }
  if (comp.currentSelectedWidget?.customSettings?.["gridId"] === gridId) {
    comp.currentSelectedWidget = null;
  }

  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.captureState?.();
  comp.cdr.markForCheck();
}

function extractGridLabelSessionSettings(
  cs: Record<string, any>,
  currentSession: any,
) {
  return {
    gridLabelPosition:
      cs["gridLabelPosition"] || currentSession.gridLabelPosition || "none",
    gridLabelText: cs["gridLabelText"] ?? currentSession.gridLabelText ?? "",
    gridLabelSize:
      cs["gridLabelSize"] != null
        ? Number(cs["gridLabelSize"])
        : currentSession.gridLabelSize,
    gridLabelFontFamily:
      cs["gridLabelFontFamily"] ?? currentSession.gridLabelFontFamily ?? "",
    gridLabelFontSize:
      cs["gridLabelFontSize"] != null
        ? Number(cs["gridLabelFontSize"])
        : currentSession.gridLabelFontSize,
    gridLabelTextColor:
      cs["gridLabelTextColor"] ??
      currentSession.gridLabelTextColor ??
      "#ffffff",
    gridLabelBackgroundColor:
      cs["gridLabelBackgroundColor"] ??
      currentSession.gridLabelBackgroundColor ??
      "rgba(15, 23, 42, 0.85)",
    gridLabelFontBold:
      cs["gridLabelFontBold"] !== undefined
        ? cs["gridLabelFontBold"] !== false
        : currentSession.gridLabelFontBold,
    gridLabelFontItalic:
      cs["gridLabelFontItalic"] !== undefined
        ? Boolean(cs["gridLabelFontItalic"])
        : currentSession.gridLabelFontItalic,
    gridLabelAlignment:
      cs["gridLabelAlignment"] || currentSession.gridLabelAlignment || "center",
    gridLabelShowBorder:
      cs["gridLabelShowBorder"] !== undefined
        ? cs["gridLabelShowBorder"] !== false
        : currentSession.gridLabelShowBorder !== false,
    gridLabelBorderColor:
      cs["gridLabelBorderColor"] ?? currentSession.gridLabelBorderColor ?? "",
    gridLabelBorderWidth:
      cs["gridLabelBorderWidth"] != null
        ? Number(cs["gridLabelBorderWidth"])
        : currentSession.gridLabelBorderWidth,
    gridLabelBorderRadius:
      cs["gridLabelBorderRadius"] != null
        ? Number(cs["gridLabelBorderRadius"])
        : currentSession.gridLabelBorderRadius,
  };
}

export function handleSyncActiveGridSessionFromLayout(comp: any): void {
  if (!comp.activeGridSession) return;
  const targetUi = comp.activeCustomUi;
  const layout = comp.getLayout?.(targetUi);
  const gridId = comp.activeGridSession.gridId;
  if (
    !layout?.widgets ||
    !LaneGridReplicationHelper.hasGridWidgets(layout.widgets, gridId)
  ) {
    LaneGridAnimationHelper.reset(gridId);
    comp.activeGridSession = null;
    return;
  }
  const bounds = LaneGridReplicationHelper.calculateGridBounds(
    layout.widgets,
    gridId,
  );
  const gridWidgets = layout.widgets.filter(
    (w: any) => w.customSettings?.["gridId"] === gridId,
  );
  const first = gridWidgets[0];
  if (first?.customSettings) {
    const cs = first.customSettings;
    const totalLanes =
      Number(cs["gridTotalLanes"]) || comp.activeGridSession.totalLanes;
    const direction = cs["gridDirection"] || comp.activeGridSession.direction;
    const positionWidget = gridWidgets.find(
      (w: any) => w.customSettings?.["bindingMode"] === "position",
    );
    const bindingMode = positionWidget
      ? "position"
      : cs["bindingMode"] || comp.activeGridSession.bindingMode;

    const hasOverallWidget = gridWidgets.some(
      (w: any) =>
        w.customSettings?.["gridType"] === "overall" ||
        RacedayLayoutUtils.isOverallColumnKey(w.customSettings?.["columnKey"]),
    );
    const gridType =
      comp.activeGridSession.gridType === "overall" || hasOverallWidget
        ? "overall"
        : cs["gridType"] || comp.activeGridSession.gridType || "heat";

    const dataWidget = gridWidgets.find(
      (w: any) => !w.customSettings?.["isHeaderWidget"],
    );
    const useLaneColors =
      dataWidget?.customSettings?.["useLaneColors"] !== undefined
        ? Boolean(dataWidget.customSettings["useLaneColors"])
        : comp.activeGridSession.useLaneColors;
    const backgroundColor =
      dataWidget?.customSettings?.["backgroundColor"] ||
      comp.activeGridSession.backgroundColor;
    const textColor =
      dataWidget?.customSettings?.["textColor"] ||
      comp.activeGridSession.textColor;

    comp.activeGridSession = {
      ...comp.activeGridSession,
      bounds: bounds || comp.activeGridSession.bounds,
      totalLanes,
      direction,
      bindingMode,
      gridType,
      useLaneColors,
      backgroundColor,
      textColor,
      headerPlacement:
        cs["headerPlacement"] || comp.activeGridSession.headerPlacement,
      headerHeight:
        cs["headerHeight"] != null
          ? Number(cs["headerHeight"])
          : comp.activeGridSession.headerHeight,
      linkColumns: cs["linkColumns"] !== false,
      mirrorRows: cs["mirrorRows"] !== false,
      layoutOrientation:
        cs["layoutOrientation"] || comp.activeGridSession.layoutOrientation,
      ...extractGridLabelSessionSettings(cs, comp.activeGridSession),
    };
  } else if (bounds) {
    comp.activeGridSession = {
      ...comp.activeGridSession,
      bounds,
    };
  }
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.cdr?.markForCheck();
}

export function handleReMirrorGrid(
  comp: any,
  gridId: string,
  ui?: CustomUI,
): void {
  if (!gridId) return;
  const targetUi = ui || comp.activeCustomUi;
  const layout = comp.getLayout(targetUi);
  if (!layout?.widgets) return;

  for (const w of layout.widgets) {
    if (w.customSettings?.["gridId"] === gridId) {
      if (!w.customSettings) w.customSettings = {};
      w.customSettings["mirrorRows"] = true;
      w.customSettings["linkColumns"] = true;
    }
  }

  if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
    comp.activeGridSession.mirrorRows = true;
    comp.activeGridSession.linkColumns = true;
    const synced = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
      comp.activeGridSession,
      layout.widgets,
    );
    layout.widgets = LaneGridReplicationHelper.bakeGrid(
      synced,
      comp.activeGridSession,
    );
  } else {
    const session = LaneGridLabelHelper.buildGridLabelSession(
      layout.widgets,
      gridId,
      {},
    );
    if (session) {
      session.mirrorRows = true;
      session.linkColumns = true;
      const synced = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
        session,
        layout.widgets,
      );
      layout.widgets = LaneGridReplicationHelper.bakeGrid(synced, session);
    }
  }

  updateLayoutOnModel(
    layout,
    targetUi,
    comp.editingSettings,
    comp.isCustomUiPractice(targetUi),
    comp.parsedLayouts,
  );
  comp.syncRacedayPreview?.(layout, targetUi);
  comp.captureState?.();
  comp.cdr?.markForCheck();
}
