import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { LayoutConfig } from "@app/models/settings";

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

  static getTableBodyHeight(
    layout: LayoutConfig | undefined,
    isLayoutCustomizing: boolean,
  ): number {
    const widget = layout?.widgets?.find(
      (w: any) => w.widgetType === "lane-view",
    );
    if (!widget) return 672;
    const editModeOffset = isLayoutCustomizing ? 28 : 0;
    return Math.max(100, widget.height - editModeOffset - 10 - 36);
  }

  static getRowHeight(
    layout: LayoutConfig | undefined,
    numLanes: number,
    isLayoutCustomizing: boolean,
  ): number {
    const totalGaps = (Math.max(1, numLanes) - 1) * 2;
    const activeHeight = RacedayLayoutUtils.getTableBodyHeight(
      layout,
      isLayoutCustomizing,
    );
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
    const property =
      RacedayLayoutUtils.getLayoutEntries(col)[0]?.property || "";
    const baseKey = property.split("_")[0];
    return (
      baseKey === "lastLapTime" ||
      baseKey === "bestLapTime" ||
      baseKey === "averageLapTime" ||
      baseKey === "medianLapTime" ||
      baseKey === "segmentTime"
    );
  }

  static isImageProperty(prop: string): boolean {
    if (!prop) return false;
    const base = prop.split("_")[0];
    return (
      base === "driver.avatarUrl" ||
      base.startsWith("imageset") ||
      base === "fuel-gauge-builtin" ||
      base === "flag"
    );
  }

  static isAvatarProperty(prop: string): boolean {
    if (!prop) return false;
    return prop.split("_")[0] === "driver.avatarUrl";
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
  static getLabelKeyForColumn(
    key: string,
    layout?: { [A in AnchorPoint]?: string },
  ): string {
    const propertyKey =
      layout?.[AnchorPoint.CenterCenter] ||
      (layout ? Object.values(layout)[0] : null) ||
      key;

    const baseKey = (propertyKey as string).split("_")[0];
    const labels: { [key: string]: string } = {
      lapCount: "RD_COL_LAP",
      lastLapTime: "RD_COL_LAP_TIME",
      medianLapTime: "RD_COL_MEDIAN_LAP",
      averageLapTime: "RD_COL_AVG_LAP",
      bestLapTime: "RD_COL_BEST_LAP",
      totalTime: "RD_COL_TOTAL_TIME",
      gapLeader: "RD_COL_GAP_LEADER",
      gapPosition: "RD_COL_GAP_POSITION",
      reactionTime: "RD_COL_REACTION_TIME",
      "participant.team.name": "RD_COL_TEAM",
      "driver.name": "RD_COL_NAME",
      "driver.nickname": "RD_COL_NICKNAME",
      "participant.fuelLevel": "RD_COL_FUEL_LEVEL",
      fuelCapacity: "RD_COL_FUEL_CAPACITY",
      fuelPercentage: "RD_COL_FUEL_PERCENTAGE",
      seed: "RD_COL_SEED",
      rankHeat: "RD_COL_RANK_HEAT",
      rankOverall: "RD_COL_RANK_OVERALL",
      mph: "RD_COL_MPH",
      kph: "RD_COL_KPH",
      fph: "RD_COL_FPH",
      segmentTime: "RD_COL_SEGMENT_TIME",
      "driver.avatarUrl": "RD_COL_AVATAR",
      flag: "",
    };
    return labels[baseKey] ?? "UNKNOWN";
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
  ): { x: number; y: number; w: number; h: number } {
    const snapThreshold = 10;
    let newX = x;
    let newY = y;
    let newW = w;
    let newH = h;

    const edgesX: number[] = [0, 1920];
    const edgesY: number[] = [0, 1080];

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
}
