import { AnchorPoint } from "@app/components/raceday/column_definition";
import { AbsoluteWidgetNode, LayoutConfig } from "@app/models/settings";

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

function migrateDriftIndicatorInsets(s: Record<string, any>): boolean {
  const colKey = s["columnKey"];
  if (colKey === "lastLapTime" || colKey === "lapTime") {
    if (!s["insets"] || typeof s["insets"] !== "object") {
      s["insets"] = {};
    }
    if (!s["insets"]["bottom-center"]) {
      s["insets"]["bottom-center"] = "driftIndicator";
      return true;
    }
  }
  return false;
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
      if (w.widgetType !== "lane-view") {
        if (migrateColumnKey(s)) migrated = true;
        if (migrateInsets(s)) migrated = true;
        if (migrateInsetsConfig(s)) migrated = true;
      }
      if (migrateDriftIndicatorInsets(s)) migrated = true;
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

  // A native table uses each gap key to select its target and display mode.
  // Keep settings-only column mappings intact until the fallback layout is resolved.
  public static usesLaneViewColumns(
    layout: LayoutConfig | null | undefined,
  ): boolean {
    return (
      !Array.isArray(layout?.widgets) ||
      layout.widgets.some((w) => w?.widgetType === "lane-view")
    );
  }

  public static migrateLayoutColumns(
    layout: LayoutConfig | null | undefined,
    columns: string[] | undefined,
    columnLayouts: Record<string, Record<string, string>> | undefined,
    columnWidths: Record<string, number> | undefined,
  ): void {
    const preserveGapKeys = this.usesLaneViewColumns(layout);
    if (!preserveGapKeys) {
      this.migrateColumnList(columns);
      this.migrateColumnWidths(columnWidths);
    }
    this.migrateColumnLayouts(columnLayouts, preserveGapKeys);
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
    preserveGapKeys = false,
  ): boolean {
    if (!layouts || typeof layouts !== "object") return false;
    let migrated = false;
    if (!preserveGapKeys) {
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
    }
    for (const key of ["lastLapTime", "lapTime"]) {
      if (layouts[key] && typeof layouts[key] === "object") {
        if (
          !layouts[key]["bottom-center"] &&
          !layouts[key][AnchorPoint.BottomCenter]
        ) {
          layouts[key][AnchorPoint.BottomCenter] = "driftIndicator";
          migrated = true;
        }
      }
    }
    return migrated;
  }
}
