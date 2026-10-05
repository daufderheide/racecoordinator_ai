import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { AbsoluteWidgetNode, LayoutConfig } from "@app/models/settings";

export class RacedayLayoutUtils {
  static getColumnX(columns: ColumnDefinition[], columnIndex: number): number {
    if (!columns || columns.length === 0) return 0;
    let x = 0;
    const limit = Math.min(columnIndex, columns.length);
    for (let i = 0; i < limit; i++) {
      x += columns[i].width;
    }
    return x;
  }

  static getColumnCenterX(
    columns: ColumnDefinition[],
    columnIndex: number,
  ): number {
    if (!columns || !columns[columnIndex]) return 0;
    return (
      RacedayLayoutUtils.getColumnX(columns, columnIndex) +
      columns[columnIndex].width / 2
    );
  }

  static getHeaderHeight(layout: LayoutConfig | undefined): number {
    const widget = layout?.widgets?.find(
      (w: any) => w.widgetType === "lane-view",
    );
    if (!widget) return 36;
    const columnFontSize = widget.customSettings?.["columnFontSize"];
    return columnFontSize
      ? Math.max(36, Math.round(Number(columnFontSize) * 1.3 + 8))
      : 36;
  }

  static getTableBodyHeight(layout: LayoutConfig | undefined): number {
    const widget = layout?.widgets?.find(
      (w: any) => w.widgetType === "lane-view",
    );
    if (!widget) return 672;
    const headerHeight = RacedayLayoutUtils.getHeaderHeight(layout);
    return Math.max(100, widget.height - 10 - headerHeight);
  }

  static getRowHeight(
    layout: LayoutConfig | undefined,
    numLanes: number,
  ): number {
    const totalGaps = (Math.max(1, numLanes) - 1) * 2;
    const activeHeight = RacedayLayoutUtils.getTableBodyHeight(layout);
    return (activeHeight - totalGaps) / Math.max(1, numLanes);
  }

  static getImageMetrics(
    columns: ColumnDefinition[],
    colIndex: number,
    rowHeight: number,
  ) {
    const column = columns ? columns[colIndex] : undefined;
    const colWidth = column ? column.width : 100;
    const targetSize = Math.min(rowHeight * 0.8, colWidth * 0.9);
    return {
      width: targetSize,
      height: targetSize,
      x:
        RacedayLayoutUtils.getColumnCenterX(columns, colIndex) - targetSize / 2,
      y: (rowHeight - targetSize) / 2,
    };
  }

  static getColumnTextX(
    columns: ColumnDefinition[],
    columnIndex: number,
    anchor?: any,
  ): number {
    const column = columns ? columns[columnIndex] : undefined;
    if (!column) return 0;
    const xBase = RacedayLayoutUtils.getColumnX(columns, columnIndex);
    const width = column.width;
    const padding = column.padding || 10;
    const targetAnchor = anchor || column.anchor;

    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.CenterLeft:
      case AnchorPoint.BottomLeft:
        return xBase + padding;
      case AnchorPoint.TopRight:
      case AnchorPoint.CenterRight:
      case AnchorPoint.BottomRight:
        return xBase + width - padding;
      case AnchorPoint.TopCenter:
      case AnchorPoint.CenterCenter:
      case AnchorPoint.BottomCenter:
      default:
        return xBase + width / 2;
    }
  }

  static getColumnTextY(rowHeight: number, anchor?: any): number {
    const targetAnchor = anchor || AnchorPoint.CenterCenter;
    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.TopCenter:
      case AnchorPoint.TopRight:
        return rowHeight * 0.22;
      case AnchorPoint.BottomLeft:
      case AnchorPoint.BottomCenter:
      case AnchorPoint.BottomRight:
        return rowHeight * 0.78;
      default:
        return rowHeight * 0.52;
    }
  }

  static getColumnTextAnchor(
    columns: ColumnDefinition[],
    columnIndex: number,
    anchor?: any,
  ): string {
    const column = columns ? columns[columnIndex] : undefined;
    if (!column) return "middle";
    const targetAnchor = anchor || column.anchor;
    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.CenterLeft:
      case AnchorPoint.BottomLeft:
        return "start";
      case AnchorPoint.TopRight:
      case AnchorPoint.CenterRight:
      case AnchorPoint.BottomRight:
        return "end";
      default:
        return "middle";
    }
  }

  static getColumnMaxWidth(
    columns: ColumnDefinition[],
    columnIndex: number,
  ): number {
    const column = columns ? columns[columnIndex] : undefined;
    if (!column) return 0;
    return column.width - column.padding * 2;
  }

  static getAnchorFontSize(anchor: string): number {
    return anchor === AnchorPoint.CenterCenter ? 45 : 20;
  }

  static getLayoutEntries(
    column: ColumnDefinition,
  ): { anchor: string; property: string }[] {
    if (!column || !column.layout || Object.keys(column.layout).length === 0) {
      if (column) {
        return [
          {
            anchor: column.anchor || AnchorPoint.CenterCenter,
            property: column.propertyName,
          },
        ];
      }
      return [];
    }
    return Object.entries(column.layout).map(([anchor, property]) => ({
      anchor,
      property: property as string,
    }));
  }

  static getAnchorClass(anchor: string): string {
    return `anchor-${anchor.toLowerCase()}`;
  }

  static isLapTimeColumn(col: ColumnDefinition): boolean {
    if (!col) return false;
    const property =
      col.layout?.[AnchorPoint.CenterCenter] ||
      RacedayLayoutUtils.getLayoutEntries(col)[0]?.property ||
      col.propertyName ||
      "";
    const baseKey = property.split("_")[0];
    return (
      baseKey === "lastLapTime" ||
      baseKey === "bestLapTime" ||
      baseKey === "bestRaceLapTime" ||
      baseKey === "averageLapTime" ||
      baseKey === "medianLapTime" ||
      baseKey === "recordLapTime" ||
      baseKey === "segmentTime" ||
      baseKey === "standardDeviation" ||
      baseKey === "averageTop5" ||
      baseKey === "averageTop10" ||
      baseKey === "averageTop15" ||
      baseKey === "top2Consecutive" ||
      baseKey === "top3Consecutive" ||
      baseKey === "overallAverageTop5" ||
      baseKey === "overallAverageTop10" ||
      baseKey === "overallAverageTop15" ||
      baseKey === "overallTop2Consecutive" ||
      baseKey === "overallTop3Consecutive"
    );
  }

  static isTimeColumnKey(key: string): boolean {
    if (!key) return false;
    const baseKey = key.split("_")[0];
    const isTimeBase = (k: string) =>
      k.includes("LapTime") ||
      k === "lastLaps" ||
      k === "reactionTime" ||
      k === "totalTime" ||
      k === "overallTotalTime" ||
      k === "segmentTime" ||
      k === "standardDeviation" ||
      k === "overallStandardDeviation" ||
      k === "averageTop5" ||
      k === "averageTop10" ||
      k === "averageTop15" ||
      k === "top2Consecutive" ||
      k === "top3Consecutive" ||
      k === "overallAverageTop5" ||
      k === "overallAverageTop10" ||
      k === "overallAverageTop15" ||
      k === "overallTop2Consecutive" ||
      k === "overallTop3Consecutive" ||
      k === "gapLeader" ||
      k === "gapPosition" ||
      k === "gapLeaderF1" ||
      k === "gapPositionF1" ||
      k === "overallGapLeader" ||
      k === "overallGapPosition" ||
      k === "overallGapLeaderF1" ||
      k === "overallGapPositionF1" ||
      k.startsWith("ghostPacing");

    if (isTimeBase(baseKey)) return true;
    const parts = key.split("_");
    return parts.some((p) => isTimeBase(p));
  }

  static isLapColumnKey(key: string): boolean {
    if (!key) return false;
    const baseKey = key.split("_")[0];
    const isLapBase = (k: string) =>
      k === "lapCount" || k === "overallLapCount";
    if (isLapBase(baseKey)) return true;
    const parts = key.split("_");
    return parts.some((p) => isLapBase(p));
  }

  static isLapOrTimeColumnKey(key: string): boolean {
    return (
      RacedayLayoutUtils.isTimeColumnKey(key) ||
      RacedayLayoutUtils.isLapColumnKey(key)
    );
  }

  static isTimeColumn(col: ColumnDefinition | string): boolean {
    if (!col) return false;
    const key = typeof col === "string" ? col : col.propertyName || "";
    return RacedayLayoutUtils.isTimeColumnKey(key);
  }

  static isLapColumn(col: ColumnDefinition | string): boolean {
    if (!col) return false;
    const key = typeof col === "string" ? col : col.propertyName || "";
    return RacedayLayoutUtils.isLapColumnKey(key);
  }

  static isLapOrTimeColumn(col: ColumnDefinition | string): boolean {
    if (!col) return false;
    const key = typeof col === "string" ? col : col.propertyName || "";
    return RacedayLayoutUtils.isLapOrTimeColumnKey(key);
  }

  static isImageProperty(prop: string): boolean {
    if (!prop) return false;
    const base = prop.split("_")[0];
    return (
      base === "driver.avatarUrl" ||
      base.startsWith("imageset") ||
      base === "fuel-gauge-builtin" ||
      base === "flag" ||
      base === "qrCode" ||
      base === "driverViewQrCode"
    );
  }

  static isAvatarProperty(prop: string): boolean {
    if (!prop) return false;
    return prop.split("_")[0] === "driver.avatarUrl";
  }

  static isPacingProperty(prop: string): boolean {
    if (!prop) return false;
    const base = prop.split("_")[0];
    return (
      base === "ghostPacing" ||
      base === "ghostPacingPB" ||
      base === "ghostPacingPersonalAvg" ||
      base === "ghostPacingPersonalMedian" ||
      base === "ghostPacingLeaderAvg" ||
      base === "ghostPacingLeaderMedian" ||
      base === "ghostPacingLeaderBest" ||
      base.startsWith("ghostPacing")
    );
  }

  static shouldShowLaneColor(col: ColumnDefinition): boolean {
    if (!col) return false;
    const nameKeys = ["driver.name", "driver.nickname"];
    if (nameKeys.includes(col.propertyName.split("_")[0])) return true;
    if (col.layout) {
      return Object.values(col.layout).some(
        (v) => v && nameKeys.includes(v.split("_")[0]),
      );
    }
    return false;
  }
  private static readonly COLUMN_LABELS: Record<string, string> = {
    lapCount: "RD_COL_LAP",
    physicalLapCount: "UI_EDITOR_COL_LAP_COUNT",
    lapsLed: "RD_COL_LAPS_LED",
    trackCalls: "RD_COL_TRACK_CALLS",
    lastLapTime: "RD_COL_LAP_TIME",
    lastLaps: "RD_COL_LAST_LAPS",
    medianLapTime: "RD_COL_MEDIAN_LAP",
    averageLapTime: "RD_COL_AVG_LAP",
    bestLapTime: "RD_COL_BEST_LAP",
    bestRaceLapTime: "RD_COL_BEST_RACE_LAP_TIME",
    recordLapTime: "RD_COL_RECORD_LAP_TIME",
    standardDeviation: "RD_COL_STD_DEV",
    consistencyScore: "RD_COL_CONSISTENCY",
    averageTop5: "RD_COL_AVG_TOP_5",
    averageTop10: "RD_COL_AVG_TOP_10",
    averageTop15: "RD_COL_AVG_TOP_15",
    top2Consecutive: "RD_COL_TOP_2_CONSECUTIVE",
    top3Consecutive: "RD_COL_TOP_3_CONSECUTIVE",
    totalTime: "RD_COL_TOTAL_TIME",
    gapLeader: "RD_COL_GAP_LEADER",
    gapPosition: "RD_COL_GAP_POSITION",
    gapLeaderF1: "RD_COL_GAP_LEADER_F1",
    gapPositionF1: "RD_COL_GAP_POSITION_F1",
    reactionTime: "RD_COL_REACTION_TIME",
    "participant.team.name": "RD_COL_TEAM",
    "driver.name": "RD_COL_NAME",
    "driver.nickname": "RD_COL_NICKNAME",
    "participant.fuelLevel": "RD_COL_FUEL_LEVEL",
    fuelCapacity: "RD_COL_FUEL_CAPACITY",
    fuelPercentage: "RD_COL_FUEL_PERCENTAGE",
    "imageset_fuel-gauge-builtin": "RD_COL_FUEL_GAUGE",
    imageset_default_fuel_gauge: "RD_COL_FUEL_GAUGE",
    "imageset_default_fuel-gauge-builtin": "RD_COL_FUEL_GAUGE",
    "fuel-gauge-builtin": "RD_COL_FUEL_GAUGE",
    default_fuel_gauge: "RD_COL_FUEL_GAUGE",
    seed: "RD_COL_SEED",
    rankHeat: "RD_COL_RANK_HEAT",
    rankOverall: "RD_COL_RANK_OVERALL",
    rankGroup: "RD_COL_RANK_GROUP",
    overallLapCount: "RD_COL_LAP",
    overallPhysicalLapCount: "UI_EDITOR_COL_LAP_COUNT",
    overallTotalTime: "RD_COL_TOTAL_TIME",
    overallBestLapTime: "RD_COL_BEST_LAP",
    overallAverageLapTime: "RD_COL_AVG_LAP",
    overallMedianLapTime: "RD_COL_MEDIAN_LAP",
    overallConsistencyScore: "RD_COL_CONSISTENCY",
    overallStandardDeviation: "RD_COL_STD_DEV",
    overallAverageTop5: "RD_COL_AVG_TOP_5",
    overallAverageTop10: "RD_COL_AVG_TOP_10",
    overallAverageTop15: "RD_COL_AVG_TOP_15",
    overallTop2Consecutive: "RD_COL_TOP_2_CONSECUTIVE",
    overallTop3Consecutive: "RD_COL_TOP_3_CONSECUTIVE",
    overallGapLeader: "RD_COL_GAP_LEADER",
    overallGapPosition: "RD_COL_GAP_POSITION",
    overallGapLeaderF1: "RD_COL_GAP_LEADER_F1",
    overallGapPositionF1: "RD_COL_GAP_POSITION_F1",
    overallLapsLed: "RD_COL_LAPS_LED",
    overallTrackCalls: "RD_COL_TRACK_CALLS",
    overallPoints: "RD_COL_POINTS",
    winProbability: "RD_COL_WIN_PROB",
    projectedRank: "RD_COL_PROJ_RANK",
    projectedLaps: "RD_COL_PROJ_LAPS",
    mph: "RD_COL_MPH",
    kph: "RD_COL_KPH",
    fph: "RD_COL_FPH",
    segmentTime: "RD_COL_SEGMENT_TIME",
    "driver.avatarUrl": "RD_COL_AVATAR",
    flag: "",
    qrCode: "RD_COL_LANE_QR",
    driverViewQrCode: "RD_COL_DRIVER_VIEW_QR",
    laneNumber: "RD_COL_LANE",
    ghostPacing: "RD_COL_GHOST_PACING",
    ghostPacingPB: "RD_COL_GHOST_PACING",
    ghostPacingPersonalAvg: "RD_COL_GHOST_PACING",
    ghostPacingPersonalMedian: "RD_COL_GHOST_PACING",
    ghostPacingLeaderAvg: "RD_COL_GHOST_PACING",
    ghostPacingLeaderMedian: "RD_COL_GHOST_PACING",
    ghostPacingLeaderBest: "RD_COL_GHOST_PACING",
  };

  private static readonly COLUMN_WIDTHS: Record<string, number> = {
    "driver.name": 0,
    "driver.nickname": 0,
    "driver.avatarUrl": 120,
    lapCount: 216,
    physicalLapCount: 210,
    lapsLed: 216,
    trackCalls: 216,
    overallLapCount: 216,
    overallPhysicalLapCount: 210,
    overallTotalTime: 330,
    overallBestLapTime: 330,
    overallAverageLapTime: 330,
    overallMedianLapTime: 330,
    overallConsistencyScore: 330,
    overallStandardDeviation: 330,
    overallAverageTop5: 330,
    overallAverageTop10: 330,
    overallAverageTop15: 330,
    overallTop2Consecutive: 330,
    overallTop3Consecutive: 330,
    overallGapLeader: 330,
    overallGapPosition: 330,
    overallGapLeaderF1: 330,
    overallGapPositionF1: 330,
    overallLapsLed: 216,
    overallTrackCalls: 216,
    overallPoints: 216,
    reactionTime: 330,
    lastLapTime: 330,
    lastLaps: 1650,
    medianLapTime: 330,
    averageLapTime: 330,
    bestLapTime: 330,
    bestRaceLapTime: 330,
    recordLapTime: 330,
    standardDeviation: 330,
    consistencyScore: 330,
    averageTop5: 330,
    averageTop10: 330,
    averageTop15: 330,
    top2Consecutive: 330,
    top3Consecutive: 330,
    totalTime: 330,
    gapLeader: 330,
    gapPosition: 330,
    gapLeaderF1: 330,
    gapPositionF1: 330,
    "participant.team.name": 330,
    "participant.fuelLevel": 216,
    fuelCapacity: 216,
    fuelPercentage: 216,
    "imageset_fuel-gauge-builtin": 216,
    imageset_default_fuel_gauge: 216,
    "imageset_default_fuel-gauge-builtin": 216,
    "fuel-gauge-builtin": 216,
    default_fuel_gauge: 216,
    seed: 216,
    rankHeat: 108,
    rankOverall: 108,
    rankGroup: 108,
    winProbability: 330,
    projectedRank: 216,
    projectedLaps: 216,
    mph: 330,
    kph: 330,
    fph: 330,
    segmentTime: 330,
    flag: 120,
    qrCode: 120,
    driverViewQrCode: 120,
    laneNumber: 120,
    imageset: 216,
    ghostPacing: 330,
    ghostPacingPB: 330,
    ghostPacingPersonalAvg: 330,
    ghostPacingPersonalMedian: 330,
    ghostPacingLeaderAvg: 330,
    ghostPacingLeaderMedian: 330,
    ghostPacingLeaderBest: 330,
  };

  static getLabelKeyForColumn(
    key: string,
    layout?: { [A in AnchorPoint]?: string },
  ): string {
    const propertyKey =
      layout?.[AnchorPoint.CenterCenter] ||
      (layout ? Object.values(layout)[0] : null) ||
      key;

    const baseKey = (propertyKey as string).split("_")[0];
    if (
      typeof propertyKey === "string" &&
      RacedayLayoutUtils.COLUMN_LABELS[propertyKey]
    ) {
      return RacedayLayoutUtils.COLUMN_LABELS[propertyKey];
    }
    if (
      typeof propertyKey === "string" &&
      propertyKey.startsWith("ghostPacing")
    ) {
      return "RD_COL_GHOST_PACING";
    }
    if (
      typeof propertyKey === "string" &&
      (propertyKey.startsWith("imageset_fuel-gauge") ||
        propertyKey.startsWith("imageset_default_fuel") ||
        propertyKey.includes("fuel-gauge") ||
        propertyKey.includes("fuel_gauge"))
    ) {
      return "RD_COL_FUEL_GAUGE";
    }
    return RacedayLayoutUtils.COLUMN_LABELS[baseKey] ?? "UNKNOWN";
  }

  static getDefaultColumnWidth(
    key: string,
    layout?: { [A in AnchorPoint]?: string },
    options?: { isPractice?: boolean; isVertical?: boolean },
  ): number {
    const propertyKey =
      layout?.[AnchorPoint.CenterCenter] ||
      (layout ? Object.values(layout)[0] : null) ||
      key;

    const baseKey = (propertyKey as string).split("_")[0];
    if (
      (propertyKey === "laneNumber" || baseKey === "laneNumber") &&
      options?.isPractice &&
      !options?.isVertical
    ) {
      return 170;
    }

    if (
      typeof propertyKey === "string" &&
      RacedayLayoutUtils.COLUMN_WIDTHS[propertyKey] !== undefined
    ) {
      return RacedayLayoutUtils.COLUMN_WIDTHS[propertyKey];
    }
    if (
      typeof propertyKey === "string" &&
      propertyKey.startsWith("ghostPacing")
    ) {
      return 330;
    }
    if (
      typeof propertyKey === "string" &&
      (propertyKey.startsWith("imageset") ||
        propertyKey.includes("fuel-gauge") ||
        propertyKey.includes("fuel_gauge"))
    ) {
      return 216;
    }
    return RacedayLayoutUtils.COLUMN_WIDTHS[baseKey] ?? 275;
  }

  static reindexColumnLayout(layout: { [A in AnchorPoint]?: string }): {
    [A in AnchorPoint]?: string;
  } {
    const anchorOrder = [
      AnchorPoint.TopLeft,
      AnchorPoint.TopCenter,
      AnchorPoint.TopRight,
      AnchorPoint.CenterLeft,
      AnchorPoint.CenterCenter,
      AnchorPoint.CenterRight,
      AnchorPoint.BottomLeft,
      AnchorPoint.BottomCenter,
      AnchorPoint.BottomRight,
    ];

    let segmentCounter = 0;
    const newLayout = { ...layout };
    anchorOrder.forEach((anchor) => {
      const prop = newLayout[anchor];
      if (prop && prop.split("_")[0] === "segmentTime") {
        const newProp =
          segmentCounter === 0
            ? "segmentTime"
            : `segmentTime_${segmentCounter}`;
        newLayout[anchor] = newProp;
        segmentCounter++;
      }
    });
    return newLayout;
  }

  static snapToEdges(
    widgets: any[],
    x: number,
    y: number,
    w: number,
    h: number,
    ignoreId: string,
    handle: string,
    layoutWidth: number = 1920,
    layoutHeight: number = 1080,
    extraSnapEdgesX: number[] = [],
    extraSnapEdgesY: number[] = [],
  ): { x: number; y: number; w: number; h: number } {
    const snapThreshold = 10;
    let newX = x;
    let newY = y;
    let newW = w;
    let newH = h;

    const edgesX: number[] = [0, layoutWidth, ...extraSnapEdgesX];
    const edgesY: number[] = [0, layoutHeight, ...extraSnapEdgesY];

    for (const widget of widgets || []) {
      if (widget.id === ignoreId) continue;
      edgesX.push(widget.x, widget.x + widget.width);
      edgesY.push(widget.y, widget.y + widget.height);
    }

    if (handle.includes("w") || handle === "all") {
      for (const e of edgesX) {
        if (Math.abs(x - e) < snapThreshold) {
          if (handle === "all") newX = e;
          else {
            newW += x - e;
            newX = e;
          }
          break;
        }
      }
    }
    if (handle.includes("e") || handle === "all") {
      for (const e of edgesX) {
        if (Math.abs(x + w - e) < snapThreshold) {
          if (handle === "all") newX = e - w;
          else newW = e - x;
          break;
        }
      }
    }

    if (handle.includes("n") || handle === "all") {
      for (const e of edgesY) {
        if (Math.abs(y - e) < snapThreshold) {
          if (handle === "all") newY = e;
          else {
            newH += y - e;
            newY = e;
          }
          break;
        }
      }
    }
    if (handle.includes("s") || handle === "all") {
      for (const e of edgesY) {
        if (Math.abs(y + h - e) < snapThreshold) {
          if (handle === "all") newY = e - h;
          else newH = e - y;
          break;
        }
      }
    }

    return { x: newX, y: newY, w: newW, h: newH };
  }

  static isPortraitLayout(
    layout?: LayoutConfig,
    dashboardWidth: number = 1920,
    dashboardHeight: number = 1080,
  ): boolean {
    const width = layout?.baseWidth ?? dashboardWidth;
    const height = layout?.baseHeight ?? dashboardHeight;
    return width < height;
  }

  static ensureCountdownWidget(
    layout?: LayoutConfig,
  ): LayoutConfig | undefined {
    if (!layout || !layout.widgets) return layout;
    const hasCountdown = layout.widgets.some(
      (w) => w.widgetType === "countdown",
    );
    if (hasCountdown) {
      for (const w of layout.widgets) {
        if (w.widgetType === "countdown") {
          w.customSettings = this.backfillCountdownSettings(w.customSettings);
        }
      }
      return layout;
    }

    const baseWidth = layout.baseWidth || 1920;
    const baseHeight = layout.baseHeight || 1080;
    const countdownWidget = this.createDefaultCountdownWidget(
      baseWidth,
      baseHeight,
    );

    return {
      ...layout,
      widgets: [...layout.widgets, countdownWidget],
    };
  }

  private static backfillCountdownSettings(
    customSettings?: Record<string, any>,
  ): Record<string, any> {
    const s: Record<string, any> = {
      orientation: "horizontal",
      lampScale: 1.0,
      blurArea: "fullscreen",
      blurAmount: 50,
      lampSizingMode: "custom",
      previewLampCount: 5,
      maxLamps: 5,
      fadeIn: true,
      glowEffect: true,
      glowOverlap: 30,
      glowRedOverlap: 30,
      glowGreenOverlap: 25,
      ...customSettings,
    };
    if (!s["lampSizingMode"]) {
      s["lampSizingMode"] = "custom";
    }
    if (!s["previewLampCount"] && !s["maxLamps"]) {
      s["previewLampCount"] = 5;
      s["maxLamps"] = 5;
    } else if (!s["maxLamps"]) {
      s["maxLamps"] = s["previewLampCount"] || 5;
    } else if (!s["previewLampCount"]) {
      s["previewLampCount"] = s["maxLamps"] || 5;
    }
    if (s["fadeIn"] === undefined) {
      s["fadeIn"] = true;
    }
    if (s["glowEffect"] === undefined) {
      s["glowEffect"] = true;
    }
    if (s["glowOverlap"] === undefined || s["glowOverlap"] === 100) {
      s["glowOverlap"] = 30;
    }
    if (s["glowRedOverlap"] === undefined || s["glowRedOverlap"] === 100) {
      s["glowRedOverlap"] = 30;
    }
    if (s["glowGreenOverlap"] === undefined || s["glowGreenOverlap"] === 100) {
      s["glowGreenOverlap"] = 25;
    }
    return s;
  }

  private static createDefaultCountdownWidget(
    baseWidth: number,
    baseHeight: number,
  ): AbsoluteWidgetNode {
    const isPortrait = baseWidth < baseHeight;
    const widgetWidth = isPortrait ? 250 : 1000;
    const widgetHeight = isPortrait ? 800 : 250;
    const x = Math.max(0, Math.round((baseWidth - widgetWidth) / 2));
    const y = Math.max(0, Math.round((baseHeight - widgetHeight) / 2));

    return {
      id: "widget-countdown",
      widgetType: "countdown",
      x,
      y,
      width: widgetWidth,
      height: widgetHeight,
      zIndex: 2000,
      scaleMode: "auto",
      customSettings: {
        orientation: isPortrait ? "vertical" : "horizontal",
        lampScale: 1.0,
        blurArea: "fullscreen",
        blurAmount: 50,
        lampSizingMode: "custom",
        previewLampCount: 5,
        maxLamps: 5,
        fadeIn: true,
        glowEffect: true,
        glowOverlap: 30,
        glowRedOverlap: 30,
        glowGreenOverlap: 25,
      },
    };
  }
}
