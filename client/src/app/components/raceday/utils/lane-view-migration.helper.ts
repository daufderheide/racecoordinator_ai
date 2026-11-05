import {
  AbsoluteWidgetNode,
  HighlightLapStyle,
  LayoutConfig,
  Settings,
} from "@app/models/settings";

import {
  LaneGridBounds,
  LaneGridSession,
} from "./lane-grid-replication.helper";
import { LaneViewGridBuilderHelper } from "./lane-view-grid-builder.helper";

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

export interface LaneGridMigrationBuildParams {
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
  scaleMode: "auto" | "fixed" | "";
  minFontSize: number;
  maxFontSize: number;
  highlightRowOnLap: boolean;
  highlightLapStyle: HighlightLapStyle;
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
  showBorder: boolean;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
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

function migrateHighlightLapStyle(
  widget: AbsoluteWidgetNode,
  s: Record<string, any>,
): boolean {
  if (
    widget.widgetType !== "lane-view" &&
    widget.widgetType !== "lane-column"
  ) {
    return false;
  }
  if (s["highlightLapStyle"] === undefined) {
    if (s["highlightRowOnLap"] === false) {
      s["highlightLapStyle"] = "none";
    } else {
      s["highlightLapStyle"] = "classic";
    }
    s["highlightRowOnLap"] = s["highlightLapStyle"] !== "none";
    return true;
  }
  return false;
}

function migrateWidgetFontScalingForWidget(
  w: any,
  s: Record<string, any>,
): boolean {
  if (w.widgetType !== "lane-column") {
    return false;
  }
  if (s["minFontSize"] !== undefined && s["maxFontSize"] !== undefined) {
    return false;
  }
  const isAuto =
    w.scaleMode === "auto" ||
    (w.scaleMode === undefined && s["scaleMode"] === "auto");
  if (isAuto || (w.scaleMode === undefined && s["scaleMode"] === undefined)) {
    if (s["minFontSize"] === undefined) s["minFontSize"] = 0;
    if (s["maxFontSize"] === undefined) s["maxFontSize"] = 60;
  } else {
    // Custom / fixed scale mode -> min and max set to same value
    const customVal = s["valueFontSize"] ?? w.fontSize ?? 36;
    if (s["minFontSize"] === undefined) s["minFontSize"] = customVal;
    if (s["maxFontSize"] === undefined) s["maxFontSize"] = customVal;
  }
  return true;
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
      if (
        (w.widgetType === "lane-view" || w.widgetType === "lane-column") &&
        !w.customSettings
      ) {
        w.customSettings = {};
      }
      if (!w.customSettings) continue;
      const s = w.customSettings;
      if (migrateColumnKey(s)) migrated = true;
      if (migrateInsets(s)) migrated = true;
      if (migrateInsetsConfig(s)) migrated = true;
      if (migrateHighlightLapStyle(w, s)) migrated = true;
      if (migrateWidgetFontScalingForWidget(w, s)) migrated = true;
    }
    return migrated;
  }

  public static migrateWidgetFontScaling(
    layout: LayoutConfig | null | undefined,
  ): boolean {
    if (!layout?.widgets || !Array.isArray(layout.widgets)) {
      return false;
    }
    let migrated = false;
    for (const w of layout.widgets) {
      if (w.widgetType === "lane-column" && !w.customSettings) {
        w.customSettings = {};
      }
      if (!w.customSettings) continue;
      if (migrateWidgetFontScalingForWidget(w, w.customSettings)) {
        migrated = true;
      }
    }
    return migrated;
  }

  public static migrateHighlightWidgets(
    layout: LayoutConfig | null | undefined,
  ): boolean {
    if (!layout?.widgets || !Array.isArray(layout.widgets)) {
      return false;
    }
    let migrated = false;
    for (const w of layout.widgets) {
      if (
        (w.widgetType === "lane-view" || w.widgetType === "lane-column") &&
        !w.customSettings
      ) {
        w.customSettings = {};
      }
      if (!w.customSettings) continue;
      if (migrateHighlightLapStyle(w, w.customSettings)) migrated = true;
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
      ? LaneViewGridBuilderHelper.buildVerticalGridWidgets(params)
      : LaneViewGridBuilderHelper.buildHorizontalGridWidgets(params);
  }

  private static resolveMigrationBounds(
    laneView: AbsoluteWidgetNode,
  ): LaneGridBounds {
    // The legacy lane-view component applies CSS `margin: 10px 0 0 0` and `height: calc(100% - 10px)`
    // on .bottom-section. When converting to modern grid widgets (which do not have top margin),
    // shift bounds.y down by 10 and reduce bounds.height by 10 so the migrated grid aligns with
    // the pre-migration visual position and does not render under widgets directly above it.
    const LEGACY_LANE_VIEW_TOP_MARGIN = 10;
    return {
      x: laneView.x,
      y: laneView.y + LEGACY_LANE_VIEW_TOP_MARGIN,
      width: laneView.width,
      height: Math.max(20, laneView.height - LEGACY_LANE_VIEW_TOP_MARGIN),
    };
  }

  private static resolveMigrationFontScaling(
    laneView: AbsoluteWidgetNode,
    s: Record<string, any>,
    valueFontSize: number,
  ): {
    scaleMode: "auto" | "fixed" | "";
    minFontSize: number;
    maxFontSize: number;
  } {
    const rawScaleMode =
      laneView.scaleMode !== undefined
        ? laneView.scaleMode
        : (s["scaleMode"] ?? "auto");
    const scaleMode: "auto" | "fixed" | "" =
      rawScaleMode === "" || rawScaleMode === "fixed" ? rawScaleMode : "auto";

    let minFontSize: number;
    let maxFontSize: number;
    if (s["minFontSize"] != null && s["maxFontSize"] != null) {
      minFontSize = Math.max(0, Number(s["minFontSize"]));
      maxFontSize = Math.max(minFontSize, Number(s["maxFontSize"]));
    } else if (scaleMode !== "auto") {
      minFontSize = Number(s["minFontSize"] ?? valueFontSize);
      maxFontSize = Number(s["maxFontSize"] ?? valueFontSize);
    } else {
      minFontSize = Math.max(0, Number(s["minFontSize"] ?? 0));
      maxFontSize = Math.max(
        minFontSize,
        Number(s["maxFontSize"] ?? Math.max(120, valueFontSize)),
      );
    }

    return { scaleMode, minFontSize, maxFontSize };
  }

  private static createMigrationBuildParams(
    laneView: AbsoluteWidgetNode,
    options: LaneViewMigrationOptions,
  ): LaneGridMigrationBuildParams {
    const bounds = this.resolveMigrationBounds(laneView);
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

    const valueFontSize = Number(s["dataFontSize"] || 54);
    const fontScaling = this.resolveMigrationFontScaling(
      laneView,
      s,
      valueFontSize,
    );

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
      scaleMode: fontScaling.scaleMode,
      minFontSize: fontScaling.minFontSize,
      maxFontSize: fontScaling.maxFontSize,
      highlightRowOnLap:
        s["highlightLapStyle"] !== undefined
          ? s["highlightLapStyle"] !== "none"
          : s["highlightRowOnLap"] !== false,
      highlightLapStyle:
        (s["highlightLapStyle"] as HighlightLapStyle) ||
        (s["highlightRowOnLap"] === false ? "none" : "classic"),
      headerFontFamily: s["columnFontFamily"] || laneView.fontFamily || "",
      headerFontSize,
      headerTextColor: s["columnTextColor"] || laneView.textColor || "",
      valueFontFamily: s["dataFontFamily"] || laneView.fontFamily || "",
      valueFontSize,
      valueTextColor: s["dataTextColor"] || laneView.textColor || "",
      timeDecimalPlaces: Number(s["timeDecimalPlaces"] ?? 3),
      lapDecimalPlaces: Number(s["lapDecimalPlaces"] ?? 2),
      insetFontFamily: s["insetFontFamily"] || "",
      insetFontSize: Number(s["insetFontSize"] || 24),
      insetTextColor: s["insetTextColor"] || "",
      insetTimeDecimalPlaces: Number(s["insetTimeDecimalPlaces"] ?? 3),
      insetLapDecimalPlaces: Number(s["insetLapDecimalPlaces"] ?? 2),
      showBorder: s["showBorder"] !== false,
      borderColor: typeof s["borderColor"] === "string" ? s["borderColor"] : "",
      borderWidth: Number(s["borderWidth"] ?? 1),
      borderRadius: Number(s["borderRadius"] ?? 0),
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
}
