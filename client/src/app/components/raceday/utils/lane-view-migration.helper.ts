import { AnchorPoint } from "@app/components/raceday/column_definition";
import {
  AbsoluteWidgetNode,
  LayoutConfig,
  Settings,
} from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import {
  LaneGridBounds,
  LaneGridReplicationHelper,
  LaneGridSession,
} from "./lane-grid-replication.helper";
import { RacedayLayoutUtils } from "./raceday-layout.utils";

export interface LaneViewMigrationOptions {
  layout: LayoutConfig;
  columns?: string[];
  columnLayouts?: Record<string, Record<string, string>>;
  columnWidths?: Record<string, number>;
  columnVisibility?: Record<string, string>;
  columnAnchors?: Record<string, string>;
  totalLanes?: number;
  isPractice?: boolean;
}

export interface LaneViewMigrationResult {
  layout: LayoutConfig;
  migrated: boolean;
}

interface LaneGridMigrationBuildParams {
  baseWidgetId: string;
  session: LaneGridSession;
  bounds: LaneGridBounds;
  totalLanes: number;
  selectedColumns: string[];
  options: LaneViewMigrationOptions;
  customColumnWidths: Record<string, number>;
  columnLabels: Record<string, string>;
  columnDecimals: Record<string, number>;
  baseZIndex: number;
  highlightRowOnLap: boolean;
  headerFontFamily: string;
  headerFontSize: number;
  headerTextColor: string;
  valueFontFamily: string;
  valueFontSize: number;
  valueTextColor: string;
  timeDecimalPlaces: number;
  lapDecimalPlaces: number;
  insetFontFamily: string;
  insetFontSize: number;
  insetTextColor: string;
  insetTimeDecimalPlaces: number;
  insetLapDecimalPlaces: number;
}

export const GAP_MIGRATION_MAP: Record<
  string,
  {
    columnKey: string;
    gapTarget: "leader" | "position";
    gapMode: "always_time" | "laps_and_time";
  }
> = {
  gapLeader: {
    columnKey: "gap",
    gapTarget: "leader",
    gapMode: "always_time",
  },
  gapPosition: {
    columnKey: "gap",
    gapTarget: "position",
    gapMode: "always_time",
  },
  gapLeaderF1: {
    columnKey: "gap",
    gapTarget: "leader",
    gapMode: "laps_and_time",
  },
  gapPositionF1: {
    columnKey: "gap",
    gapTarget: "position",
    gapMode: "laps_and_time",
  },
  overallGapLeader: {
    columnKey: "overallGap",
    gapTarget: "leader",
    gapMode: "always_time",
  },
  overallGapPosition: {
    columnKey: "overallGap",
    gapTarget: "position",
    gapMode: "always_time",
  },
  overallGapLeaderF1: {
    columnKey: "overallGap",
    gapTarget: "leader",
    gapMode: "laps_and_time",
  },
  overallGapPositionF1: {
    columnKey: "overallGap",
    gapTarget: "position",
    gapMode: "laps_and_time",
  },
};

function migrateColumnKey(s: Record<string, any>): boolean {
  const colKey = s["columnKey"];
  if (colKey && GAP_MIGRATION_MAP[colKey]) {
    const mapping = GAP_MIGRATION_MAP[colKey];
    s["columnKey"] = mapping.columnKey;
    if (!s["gapTarget"]) s["gapTarget"] = mapping.gapTarget;
    if (!s["gapMode"]) s["gapMode"] = mapping.gapMode;
    return true;
  }
  return false;
}

function migrateInsets(s: Record<string, any>): boolean {
  if (!s["insets"] || typeof s["insets"] !== "object") return false;
  let migrated = false;
  for (const [anchor, insetVal] of Object.entries(s["insets"])) {
    if (typeof insetVal === "string" && GAP_MIGRATION_MAP[insetVal]) {
      const mapping = GAP_MIGRATION_MAP[insetVal];
      s["insets"][anchor] = mapping.columnKey;
      if (!s["insetsConfig"]) s["insetsConfig"] = {};
      if (!s["insetsConfig"][anchor]) s["insetsConfig"][anchor] = {};
      s["insetsConfig"][anchor].columnKey = mapping.columnKey;
      if (!s["insetsConfig"][anchor].gapTarget) {
        s["insetsConfig"][anchor].gapTarget = mapping.gapTarget;
      }
      if (!s["insetsConfig"][anchor].gapMode) {
        s["insetsConfig"][anchor].gapMode = mapping.gapMode;
      }
      migrated = true;
    }
  }
  return migrated;
}

function migrateInsetsConfig(s: Record<string, any>): boolean {
  if (!s["insetsConfig"] || typeof s["insetsConfig"] !== "object") return false;
  let migrated = false;
  for (const [, cfg] of Object.entries(s["insetsConfig"])) {
    if (
      cfg &&
      (cfg as any).columnKey &&
      GAP_MIGRATION_MAP[(cfg as any).columnKey]
    ) {
      const mapping = GAP_MIGRATION_MAP[(cfg as any).columnKey];
      (cfg as any).columnKey = mapping.columnKey;
      if (!(cfg as any).gapTarget) {
        (cfg as any).gapTarget = mapping.gapTarget;
      }
      if (!(cfg as any).gapMode) {
        (cfg as any).gapMode = mapping.gapMode;
      }
      migrated = true;
    }
  }
  return migrated;
}

export class LaneViewMigrationHelper {
  public static migrateGapWidgets(
    layout: LayoutConfig | null | undefined,
  ): boolean {
    if (!layout?.widgets || !Array.isArray(layout.widgets)) {
      return false;
    }
    let migrated = false;
    for (const w of layout.widgets) {
      if (!w.customSettings) continue;
      const s = w.customSettings;
      if (migrateColumnKey(s)) migrated = true;
      if (migrateInsets(s)) migrated = true;
      if (migrateInsetsConfig(s)) migrated = true;
    }
    return migrated;
  }

  public static migrateColumnList(columns: string[] | undefined): boolean {
    if (!columns || !Array.isArray(columns)) return false;
    let migrated = false;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (col && GAP_MIGRATION_MAP[col]) {
        columns[i] = GAP_MIGRATION_MAP[col].columnKey;
        migrated = true;
      }
    }
    return migrated;
  }

  public static migrateColumnWidths(
    widths: Record<string, number> | undefined,
  ): boolean {
    if (!widths || typeof widths !== "object") return false;
    let migrated = false;
    for (const [key, val] of Object.entries(widths)) {
      if (GAP_MIGRATION_MAP[key]) {
        const newKey = GAP_MIGRATION_MAP[key].columnKey;
        if (widths[newKey] === undefined) {
          widths[newKey] = val;
        }
        delete widths[key];
        migrated = true;
      }
    }
    return migrated;
  }

  public static migrateColumnLayouts(
    layouts: Record<string, Record<string, string>> | undefined,
  ): boolean {
    if (!layouts || typeof layouts !== "object") return false;
    let migrated = false;
    for (const [key, layout] of Object.entries(layouts)) {
      if (layout && typeof layout === "object") {
        for (const [anchor, val] of Object.entries(layout)) {
          if (typeof val === "string" && GAP_MIGRATION_MAP[val]) {
            layout[anchor] = GAP_MIGRATION_MAP[val].columnKey;
            migrated = true;
          }
        }
      }
      if (GAP_MIGRATION_MAP[key]) {
        const newKey = GAP_MIGRATION_MAP[key].columnKey;
        if (!layouts[newKey]) {
          layouts[newKey] = layout;
        }
        delete layouts[key];
        migrated = true;
      }
    }
    return migrated;
  }
  public static hasLegacyLaneView(
    layout: LayoutConfig | null | undefined,
    uiName?: string,
  ): boolean {
    if (layout?.preserveLegacyHeatView) {
      return false;
    }
    if (uiName && uiName.endsWith(" (Pre-Migration Backup)")) {
      return false;
    }
    return Boolean(layout?.widgets?.some((w) => w.widgetType === "lane-view"));
  }

  public static canUpgradeLegacyHeatView(
    layout: LayoutConfig | null | undefined,
    uiName?: string,
  ): boolean {
    if (uiName && uiName.endsWith(" (Pre-Migration Backup)")) {
      return false;
    }
    return Boolean(
      layout?.preserveLegacyHeatView &&
      layout?.widgets?.some((w) => w.widgetType === "lane-view"),
    );
  }

  public static upgradeLegacyHeatViewLayout(
    options: LaneViewMigrationOptions,
  ): LaneViewMigrationResult {
    if (!options?.layout) {
      return { layout: options.layout, migrated: false };
    }
    const unpreservedLayout: LayoutConfig = JSON.parse(
      JSON.stringify(options.layout),
    );
    delete unpreservedLayout.preserveLegacyHeatView;
    return this.convertLegacyLaneViewLayout({
      ...options,
      layout: unpreservedLayout,
    });
  }

  public static convertLegacyLaneViewLayout(
    options: LaneViewMigrationOptions,
  ): LaneViewMigrationResult {
    if (!options?.layout || !this.hasLegacyLaneView(options.layout)) {
      if (options?.layout) {
        const cloned: LayoutConfig = JSON.parse(JSON.stringify(options.layout));
        const migratedGaps = this.migrateGapWidgets(cloned);
        if (migratedGaps) {
          return { layout: cloned, migrated: true };
        }
      }
      return { layout: options.layout, migrated: false };
    }

    let currentLayout: LayoutConfig = JSON.parse(
      JSON.stringify(options.layout),
    );
    let migratedAny = false;

    let laneViewIndex = currentLayout.widgets.findIndex(
      (w) => w.widgetType === "lane-view",
    );
    while (laneViewIndex !== -1) {
      migratedAny = true;
      const laneView = currentLayout.widgets[laneViewIndex];
      const bakedWidgets = this.convertSingleLaneView(laneView, options);

      currentLayout.widgets.splice(laneViewIndex, 1, ...bakedWidgets);
      laneViewIndex = currentLayout.widgets.findIndex(
        (w) => w.widgetType === "lane-view",
      );
    }

    if (migratedAny) {
      // In practice layout, ensure top row widgets (y: 49/50) do not overlap lane grid bounds (y: 149)
      for (const w of currentLayout.widgets) {
        if ((w.y === 49 || w.y === 50) && w.height && w.y + w.height > 149) {
          w.y = 38;
          w.height = 111;
        } else if (w.widgetType === "menu-bar" && w.height === 55) {
          w.height = 38;
        }
      }
    }

    const migratedGaps = this.migrateGapWidgets(currentLayout);
    return { layout: currentLayout, migrated: migratedAny || migratedGaps };
  }

  private static convertSingleLaneView(
    laneView: AbsoluteWidgetNode,
    options: LaneViewMigrationOptions,
  ): AbsoluteWidgetNode[] {
    const isVertical = Boolean(laneView.customSettings?.["isVertical"]);
    const params = this.createMigrationBuildParams(laneView, options);
    return isVertical
      ? this.buildVerticalGridWidgets(params)
      : this.buildHorizontalGridWidgets(params);
  }

  private static createMigrationBuildParams(
    laneView: AbsoluteWidgetNode,
    options: LaneViewMigrationOptions,
  ): LaneGridMigrationBuildParams {
    const bounds: LaneGridBounds = {
      x: laneView.x,
      y: laneView.y,
      width: laneView.width,
      height: laneView.height,
    };
    const s = laneView.customSettings || {};
    const isVertical = Boolean(s["isVertical"]);
    const customColumnWidths = (s["columnWidths"] || {}) as Record<
      string,
      number
    >;
    const headerFontSize = Number(
      s["columnFontSize"] || laneView.fontSize || 24,
    );
    const headerHeight = Math.max(20, Math.min(60, headerFontSize + 12));
    const headerWidth = Math.min(
      260,
      Math.max(
        120,
        Number(
          customColumnWidths["_header"] ??
            options.columnWidths?.["_header"] ??
            200,
        ),
      ),
    );

    const baseWidgetId = laneView.id
      ? `${laneView.id}-migrated`
      : "widget-migrated";
    const totalLanes = Math.max(2, options.totalLanes || 4);
    const selectedColumns = this.resolveSelectedColumns(options);
    const session = this.buildLaneGridSession({
      gridId: `grid-${baseWidgetId}`,
      bounds,
      totalLanes,
      isVertical,
      sortByStandings: s["sortByStandings"] !== false,
      headerHeight,
      headerWidth,
    });

    return {
      baseWidgetId,
      session,
      bounds,
      totalLanes,
      selectedColumns,
      options,
      customColumnWidths,
      columnLabels: (s["columnLabels"] || {}) as Record<string, string>,
      columnDecimals: (s["columnDecimals"] || {}) as Record<string, number>,
      baseZIndex: laneView.zIndex ?? 100,
      highlightRowOnLap: s["highlightRowOnLap"] !== false,
      headerFontFamily: s["columnFontFamily"] || laneView.fontFamily || "",
      headerFontSize,
      headerTextColor: s["columnTextColor"] || laneView.textColor || "",
      valueFontFamily: s["dataFontFamily"] || laneView.fontFamily || "",
      valueFontSize: Number(s["dataFontSize"] || 54),
      valueTextColor: s["dataTextColor"] || laneView.textColor || "",
      timeDecimalPlaces: Number(s["timeDecimalPlaces"] ?? 3),
      lapDecimalPlaces: Number(s["lapDecimalPlaces"] ?? 2),
      insetFontFamily: s["insetFontFamily"] || "",
      insetFontSize: Number(s["insetFontSize"] || 24),
      insetTextColor: s["insetTextColor"] || "",
      insetTimeDecimalPlaces: Number(s["insetTimeDecimalPlaces"] ?? 3),
      insetLapDecimalPlaces: Number(s["insetLapDecimalPlaces"] ?? 2),
    };
  }

  private static resolveSelectedColumns(
    options: LaneViewMigrationOptions,
  ): string[] {
    if (options.columns && options.columns.length > 0) {
      return [...options.columns];
    }
    return options.isPractice
      ? [...Settings.DEFAULT_PRACTICE_COLUMNS]
      : [...Settings.DEFAULT_COLUMNS];
  }

  private static buildLaneGridSession(config: {
    gridId: string;
    bounds: LaneGridBounds;
    totalLanes: number;
    isVertical: boolean;
    sortByStandings: boolean;
    headerHeight: number;
    headerWidth: number;
  }): LaneGridSession {
    return {
      gridId: config.gridId,
      bounds: config.bounds,
      totalLanes: config.totalLanes,
      direction: config.isVertical ? "horizontal" : "vertical",
      sourceLaneIndex: 0,
      bindingMode: config.sortByStandings ? "position" : "lane",
      gridType: "heat",
      headerPlacement: config.isVertical ? "left" : "top",
      headerHeight: config.headerHeight,
      headerWidth: config.headerWidth,
      linkColumns: true,
      mirrorRows: true,
      sortByBindingMode: true,
      layoutOrientation: config.isVertical ? "horizontal" : "vertical",
      gridLabelPosition: "none",
      gridLabelText: "",
      gridLabelSize: 40,
      gridLabelFontFamily: "",
      gridLabelFontSize: 18,
      gridLabelTextColor: "#ffffff",
      gridLabelBackgroundColor: "rgba(15, 23, 42, 0.85)",
      gridLabelFontBold: true,
      gridLabelFontItalic: false,
      gridLabelAlignment: "center",
      gridLabelShowBorder: true,
      gridLabelBorderColor: "",
      gridLabelBorderWidth: 1,
      gridLabelBorderRadius: 4,
    };
  }

  private static buildHorizontalGridWidgets(
    params: LaneGridMigrationBuildParams,
  ): AbsoluteWidgetNode[] {
    const { bounds, selectedColumns, session } = params;
    const rowHeight = Math.max(
      20,
      Math.round(bounds.height / params.totalLanes),
    );

    const finalWidths = this.computeHorizontalColumnWidths(
      selectedColumns,
      bounds.width,
      params.customColumnWidths,
      params.options,
    );

    const masterWidgets: AbsoluteWidgetNode[] = [];
    let currentX = bounds.x;

    for (let i = 0; i < selectedColumns.length; i++) {
      const colKey = selectedColumns[i];
      const colW = finalWidths[colKey] || 150;
      masterWidgets.push(
        this.buildHorizontalMasterWidget(
          params,
          colKey,
          i,
          currentX,
          colW,
          rowHeight,
        ),
      );
      currentX += colW;
    }

    for (const master of masterWidgets) {
      LaneGridReplicationHelper.updateWidgetCellRatios(master, session);
    }
    const replicated = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
      session,
      masterWidgets,
    );
    return LaneGridReplicationHelper.bakeGrid(replicated, session);
  }

  private static buildHorizontalMasterWidget(
    params: LaneGridMigrationBuildParams,
    colKey: string,
    index: number,
    x: number,
    width: number,
    height: number,
  ): AbsoluteWidgetNode {
    const colLayout = (params.options.columnLayouts || {})[colKey] || {
      [AnchorPoint.CenterCenter]: colKey,
    };

    const insets: Record<string, string> = {};
    for (const [anchor, prop] of Object.entries(colLayout)) {
      if (
        anchor !== AnchorPoint.CenterCenter &&
        anchor !== "center-center" &&
        prop
      ) {
        insets[anchor] = prop;
      }
    }

    return {
      id: `${params.baseWidgetId}-${index + 1}`,
      widgetType: "lane-column",
      x,
      y: params.bounds.y,
      width,
      height,
      zIndex: params.baseZIndex,
      scaleMode: "auto",
      customSettings: {
        columnKey: colKey,
        gridId: params.session.gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: params.totalLanes,
        gridDirection: params.session.direction,
        gridType: "heat",
        bindingMode: params.session.bindingMode,
        sortByStandings: params.session.bindingMode === "position",
        showHeader: false,
        headerPlacement: "top",
        headerHeight: params.session.headerHeight,
        layoutOrientation: params.session.layoutOrientation,
        linkColumns: true,
        sortByBindingMode: true,
        highlightRowOnLap: params.highlightRowOnLap,
        customLabel: params.columnLabels[colKey] || "",
        headerFontFamily: params.headerFontFamily,
        headerFontSize: params.headerFontSize,
        headerTextColor: params.headerTextColor,
        headerAlignment: "center",
        valueFontFamily: params.valueFontFamily,
        valueFontSize: params.valueFontSize,
        valueTextColor: params.valueTextColor,
        valueAlignment: "center",
        timeDecimalPlaces:
          params.columnDecimals[colKey] ?? params.timeDecimalPlaces,
        lapDecimalPlaces: params.lapDecimalPlaces,
        useLaneColors: true,
        ...(Object.keys(insets).length > 0 ? { insets } : {}),
        insetFontFamily: params.insetFontFamily,
        insetFontSize: params.insetFontSize,
        insetTextColor: params.insetTextColor,
        insetTimeDecimalPlaces: params.insetTimeDecimalPlaces,
        insetLapDecimalPlaces: params.insetLapDecimalPlaces,
        backgroundColor: "",
        textColor: "",
        showBorder: false,
        borderColor: "",
        borderWidth: 1,
        borderRadius: 0,
      },
    };
  }

  private static computeHorizontalColumnWidths(
    selectedColumns: string[],
    totalWidth: number,
    customColumnWidths: Record<string, number>,
    options: LaneViewMigrationOptions,
  ): Record<string, number> {
    const configuredWidths: Record<string, number> = {};
    const zeroWidthKeys = new Set<string>();
    let totalFixed = 0;

    for (const colKey of selectedColumns) {
      const layout = (options.columnLayouts || {})[colKey] || {
        [AnchorPoint.CenterCenter]: colKey,
      };
      let w: number | undefined;

      if (customColumnWidths[colKey] != null) {
        w = Number(customColumnWidths[colKey]);
      } else if (options.columnWidths?.[colKey] != null) {
        w = Number(options.columnWidths[colKey]);
      } else {
        w = RacedayLayoutUtils.getDefaultColumnWidth(colKey, layout, {
          isPractice: options.isPractice,
          isVertical: false,
        });
      }

      configuredWidths[colKey] = w;
      if (w === 0) {
        zeroWidthKeys.add(colKey);
      } else {
        totalFixed += w;
      }
    }

    const totalRemaining = Math.max(0, totalWidth - totalFixed);
    const zeroCount = zeroWidthKeys.size;
    const sharedWidth =
      zeroCount > 0 ? Math.max(80, Math.floor(totalRemaining / zeroCount)) : 0;

    const finalWidths: Record<string, number> = {};
    for (const colKey of selectedColumns) {
      finalWidths[colKey] = zeroWidthKeys.has(colKey)
        ? sharedWidth
        : configuredWidths[colKey] || 150;
    }

    const sumWidths = selectedColumns.reduce(
      (sum, k) => sum + finalWidths[k],
      0,
    );
    if (sumWidths > 0 && Math.abs(sumWidths - totalWidth) > 2) {
      const ratio = totalWidth / sumWidths;
      let accWidth = 0;
      for (let i = 0; i < selectedColumns.length; i++) {
        const k = selectedColumns[i];
        if (i === selectedColumns.length - 1) {
          finalWidths[k] = Math.max(50, totalWidth - accWidth);
        } else {
          finalWidths[k] = Math.max(50, Math.round(finalWidths[k] * ratio));
          accWidth += finalWidths[k];
        }
      }
    }

    return finalWidths;
  }

  private static buildVerticalGridWidgets(
    params: LaneGridMigrationBuildParams,
  ): AbsoluteWidgetNode[] {
    const { bounds, selectedColumns, session } = params;
    const headerWidth = Math.min(
      260,
      Math.max(
        120,
        Number(
          params.customColumnWidths["_header"] ??
            params.options.columnWidths?.["_header"] ??
            200,
        ),
      ),
    );
    session.headerPlacement = "left";
    session.headerWidth = headerWidth;

    const availWidth = Math.max(0, bounds.width - headerWidth);
    const colWidth = Math.max(50, Math.floor(availWidth / params.totalLanes));
    const rowHeights = this.computeVerticalRowHeights(
      selectedColumns,
      bounds.height,
    );

    const masterWidgets: AbsoluteWidgetNode[] = [];
    const headerWidgets: AbsoluteWidgetNode[] = [];
    let currentY = bounds.y;

    for (let i = 0; i < selectedColumns.length; i++) {
      const colKey = selectedColumns[i];
      const rowH = rowHeights[colKey];
      const { master, header } = this.buildVerticalMasterAndHeaderNodes(
        params,
        colKey,
        i,
        currentY,
        colWidth,
        headerWidth,
        rowH,
      );

      masterWidgets.push(master);
      headerWidgets.push(header);
      currentY += rowH;
    }

    for (const master of masterWidgets) {
      LaneGridReplicationHelper.updateWidgetCellRatios(master, session);
    }
    const replicated = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
      session,
      [...masterWidgets, ...headerWidgets],
    );
    return LaneGridReplicationHelper.bakeGrid(replicated, session);
  }

  private static computeVerticalRowHeights(
    selectedColumns: string[],
    totalHeight: number,
  ): Record<string, number> {
    const weights: Record<string, number> = {};
    let totalWeight = 0;
    for (const colKey of selectedColumns) {
      let weight = 1;
      if (colKey === "lastLaps") {
        weight = 10;
      } else if (
        colKey === "lapCount" ||
        colKey === "physicalLapCount" ||
        colKey.toLowerCase().includes("laptime") ||
        colKey.toLowerCase().includes("time")
      ) {
        weight = 2;
      }
      weights[colKey] = weight;
      totalWeight += weight;
    }

    const rowHeights: Record<string, number> = {};
    let accHeight = 0;
    for (let i = 0; i < selectedColumns.length; i++) {
      const colKey = selectedColumns[i];
      if (i === selectedColumns.length - 1) {
        rowHeights[colKey] = Math.max(20, totalHeight - accHeight);
      } else {
        const h = Math.max(
          20,
          Math.round((totalHeight * weights[colKey]) / totalWeight),
        );
        rowHeights[colKey] = h;
        accHeight += h;
      }
    }
    return rowHeights;
  }

  private static buildVerticalMasterAndHeaderNodes(
    params: LaneGridMigrationBuildParams,
    colKey: string,
    index: number,
    y: number,
    colWidth: number,
    headerWidth: number,
    rowH: number,
  ): { master: AbsoluteWidgetNode; header: AbsoluteWidgetNode } {
    const master = this.buildVerticalMasterNode(
      params,
      colKey,
      index,
      y,
      colWidth,
      headerWidth,
      rowH,
    );
    const header = this.buildVerticalHeaderNode(
      master,
      params.bounds.x,
      y,
      headerWidth,
      rowH,
      params.baseZIndex + 1,
      params.session.gridId,
    );
    return { master, header };
  }

  private static buildVerticalMasterNode(
    params: LaneGridMigrationBuildParams,
    colKey: string,
    index: number,
    y: number,
    colWidth: number,
    headerWidth: number,
    rowH: number,
  ): AbsoluteWidgetNode {
    const colLayout = (params.options.columnLayouts || {})[colKey] || {
      [AnchorPoint.CenterCenter]: colKey,
    };

    const insets: Record<string, string> = {};
    for (const [anchor, prop] of Object.entries(colLayout)) {
      if (
        anchor !== AnchorPoint.CenterCenter &&
        anchor !== "center-center" &&
        prop
      ) {
        insets[anchor] = prop;
      }
    }

    return {
      id: `${params.baseWidgetId}-${index + 1}`,
      widgetType: "lane-column",
      x: params.bounds.x + headerWidth,
      y,
      width: colWidth,
      height: rowH,
      zIndex: params.baseZIndex,
      scaleMode: "auto",
      customSettings: {
        columnKey: colKey,
        gridId: params.session.gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: params.totalLanes,
        gridDirection: params.session.direction,
        gridType: "heat",
        bindingMode: params.session.bindingMode,
        sortByStandings: params.session.bindingMode === "position",
        showHeader: false,
        headerPlacement: "left",
        headerHeight: params.session.headerHeight,
        headerWidth,
        layoutOrientation: params.session.layoutOrientation,
        linkColumns: true,
        sortByBindingMode: true,
        highlightRowOnLap: params.highlightRowOnLap,
        customLabel: params.columnLabels[colKey] || "",
        headerFontFamily: params.headerFontFamily,
        headerFontSize: params.headerFontSize,
        headerTextColor: params.headerTextColor,
        headerAlignment: "center",
        valueFontFamily: params.valueFontFamily,
        valueFontSize: params.valueFontSize,
        valueTextColor: params.valueTextColor,
        valueAlignment: "center",
        timeDecimalPlaces:
          params.columnDecimals[colKey] ?? params.timeDecimalPlaces,
        lapDecimalPlaces: params.lapDecimalPlaces,
        useLaneColors: true,
        ...(Object.keys(insets).length > 0 ? { insets } : {}),
        insetFontFamily: params.insetFontFamily,
        insetFontSize: params.insetFontSize,
        insetTextColor: params.insetTextColor,
        insetTimeDecimalPlaces: params.insetTimeDecimalPlaces,
        insetLapDecimalPlaces: params.insetLapDecimalPlaces,
        backgroundColor: "",
        textColor: "",
        showBorder: true,
        borderColor: "rgba(255, 255, 255, 0.4)",
        borderWidth: 1,
        borderRadius: 0,
      },
    };
  }

  private static buildVerticalHeaderNode(
    masterNode: AbsoluteWidgetNode,
    x: number,
    y: number,
    width: number,
    height: number,
    zIndex: number,
    gridId: string,
  ): AbsoluteWidgetNode {
    const headerNode: AbsoluteWidgetNode = {
      id: `${masterNode.id}_grid_header`,
      widgetType: "lane-column",
      x,
      y,
      width,
      height,
      zIndex,
      scaleMode: "auto",
      customSettings: {
        ...deepCopy(masterNode.customSettings),
        isHeaderWidget: true,
        showHeader: true,
        headerPlacement: "left",
        headerWidth: width,
        gridMasterId: masterNode.id,
        gridId,
        useLaneColors: false,
        showBorder: true,
        borderColor: "rgba(255, 255, 255, 0.4)",
        borderWidth: 1,
        borderRadius: 0,
      },
    };
    delete headerNode.customSettings?.["targetIndex"];
    delete headerNode.customSettings?.["gridLane"];
    return headerNode;
  }
}
