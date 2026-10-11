import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridBounds } from "./lane-grid-replication.helper";

export class LaneGridGeometryHelper {
  public static extractObstacles(
    allWidgets: AbsoluteWidgetNode[],
    sourceWidgets: AbsoluteWidgetNode[],
    replaceExisting: boolean,
    sourceBindingMode: "lane" | "position" | "overallPosition" | "seed",
    sourceIndex: number,
    targetCount: number,
    gridId?: string,
  ): { x1: number; x2: number; y1: number; y2: number }[] {
    const sourceIds = new Set(sourceWidgets.map((w) => w.id));
    const obstacles: { x1: number; x2: number; y1: number; y2: number }[] = [];
    for (const w of allWidgets || []) {
      if (sourceIds.has(w.id)) continue;
      if (gridId && w.customSettings?.["gridId"] === gridId) continue;

      if (replaceExisting && w.widgetType === "lane-column") {
        const idx = Number(w.customSettings?.["targetIndex"] ?? 0);
        if (idx !== Number(sourceIndex) && idx < targetCount) {
          continue;
        }
      }

      obstacles.push({
        x1: w.x,
        x2: w.x + w.width,
        y1: w.y,
        y2: w.y + w.height,
      });
    }
    return obstacles;
  }

  public static expandVerticallyFirst(
    seed: { x1: number; x2: number; y1: number; y2: number },
    obstacles: { x1: number; x2: number; y1: number; y2: number }[],
    baseWidth: number,
    baseHeight: number,
  ): LaneGridBounds {
    let topY = 0;
    let bottomY = baseHeight;
    for (const o of obstacles) {
      const xOverlap = Math.max(
        0,
        Math.min(seed.x2, o.x2) - Math.max(seed.x1, o.x1),
      );
      if (xOverlap > 0) {
        if (o.y2 <= seed.y1) topY = Math.max(topY, o.y2);
        if (o.y1 >= seed.y2) bottomY = Math.min(bottomY, o.y1);
      }
    }
    let leftX = 0;
    let rightX = baseWidth;
    for (const o of obstacles) {
      const yOverlap = Math.max(
        0,
        Math.min(bottomY, o.y2) - Math.max(topY, o.y1),
      );
      if (yOverlap > 0) {
        if (o.x2 <= seed.x1) leftX = Math.max(leftX, o.x2);
        if (o.x1 >= seed.x2) rightX = Math.min(rightX, o.x1);
      }
    }
    return {
      x: leftX,
      y: topY,
      width: Math.max(100, rightX - leftX),
      height: Math.max(50, bottomY - topY),
    };
  }

  public static expandHorizontallyFirst(
    seed: { x1: number; x2: number; y1: number; y2: number },
    obstacles: { x1: number; x2: number; y1: number; y2: number }[],
    baseWidth: number,
    baseHeight: number,
  ): LaneGridBounds {
    let leftX = 0;
    let rightX = baseWidth;
    for (const o of obstacles) {
      const yOverlap = Math.max(
        0,
        Math.min(seed.y2, o.y2) - Math.max(seed.y1, o.y1),
      );
      if (yOverlap > 0) {
        if (o.x2 <= seed.x1) leftX = Math.max(leftX, o.x2);
        if (o.x1 >= seed.x2) rightX = Math.min(rightX, o.x1);
      }
    }
    let topY = 0;
    let bottomY = baseHeight;
    for (const o of obstacles) {
      const xOverlap = Math.max(
        0,
        Math.min(rightX, o.x2) - Math.max(leftX, o.x1),
      );
      if (xOverlap > 0) {
        if (o.y2 <= seed.y1) topY = Math.max(topY, o.y2);
        if (o.y1 >= seed.y2) bottomY = Math.min(bottomY, o.y1);
      }
    }
    return {
      x: leftX,
      y: topY,
      width: Math.max(100, rightX - leftX),
      height: Math.max(50, bottomY - topY),
    };
  }

  public static calculateAvailableGridBounds(
    sourceWidgets: AbsoluteWidgetNode[],
    allWidgets: AbsoluteWidgetNode[],
    baseWidth: number,
    baseHeight: number,
    direction: "horizontal" | "vertical" = "horizontal",
    replaceExisting: boolean = true,
    sourceBindingMode:
      | "lane"
      | "position"
      | "overallPosition"
      | "seed" = "lane",
    sourceIndex: number = 0,
    targetCount: number = 4,
    gridId?: string,
  ): LaneGridBounds {
    const obstacles = this.extractObstacles(
      allWidgets,
      sourceWidgets,
      replaceExisting,
      sourceBindingMode,
      sourceIndex,
      targetCount,
      gridId,
    );

    let seed: { x1: number; x2: number; y1: number; y2: number };
    if (sourceWidgets.length > 0) {
      seed = {
        x1: Math.min(...sourceWidgets.map((w) => w.x)),
        x2: Math.max(...sourceWidgets.map((w) => w.x + w.width)),
        y1: Math.min(...sourceWidgets.map((w) => w.y)),
        y2: Math.max(...sourceWidgets.map((w) => w.y + w.height)),
      };
    } else {
      seed = {
        x1: Math.round(baseWidth * 0.1),
        x2: Math.round(baseWidth * 0.9),
        y1: Math.round(baseHeight * 0.1),
        y2: Math.round(baseHeight * 0.9),
      };
    }

    const cand1 = this.expandVerticallyFirst(
      seed,
      obstacles,
      baseWidth,
      baseHeight,
    );
    const cand2 = this.expandHorizontallyFirst(
      seed,
      obstacles,
      baseWidth,
      baseHeight,
    );
    const area1 = cand1.width * cand1.height;
    const area2 = cand2.width * cand2.height;

    if (direction === "horizontal") {
      if (cand2.width >= cand1.width && area2 >= area1 * 0.85) {
        return cand2;
      }
      return area1 >= area2 ? cand1 : cand2;
    } else {
      if (cand1.height >= cand2.height && area1 >= area2 * 0.85) {
        return cand1;
      }
      return area2 >= area1 ? cand2 : cand1;
    }
  }

  public static resizeGridBounds(
    current: LaneGridBounds,
    handle: "n" | "s" | "e" | "w" | "nw" | "ne" | "se" | "sw",
    deltaX: number,
    deltaY: number,
    baseWidth: number,
    baseHeight: number,
    minWidth = 100,
    minHeight = 60,
    snapEdgesX: number[] = [],
    snapEdgesY: number[] = [],
    snapThreshold = 10,
  ): LaneGridBounds {
    let newX = current.x;
    let newY = current.y;
    let newW = current.width;
    let newH = current.height;

    const snapValue = (val: number, edges: number[]): number => {
      for (const edge of edges) {
        if (Math.abs(val - edge) <= snapThreshold) {
          return edge;
        }
      }
      return val;
    };

    if (handle.includes("e")) {
      let rawRight = current.x + current.width + deltaX;
      rawRight = snapValue(rawRight, [...snapEdgesX, baseWidth]);
      rawRight = Math.min(baseWidth, Math.max(current.x + minWidth, rawRight));
      newW = rawRight - current.x;
    } else if (handle.includes("w")) {
      let rawLeft = current.x + deltaX;
      rawLeft = snapValue(rawLeft, [...snapEdgesX, 0]);
      rawLeft = Math.max(
        0,
        Math.min(current.x + current.width - minWidth, rawLeft),
      );
      newW = current.x + current.width - rawLeft;
      newX = rawLeft;
    }

    if (handle.includes("s")) {
      let rawBottom = current.y + current.height + deltaY;
      rawBottom = snapValue(rawBottom, [...snapEdgesY, baseHeight]);
      rawBottom = Math.min(
        baseHeight,
        Math.max(current.y + minHeight, rawBottom),
      );
      newH = rawBottom - current.y;
    } else if (handle.includes("n")) {
      let rawTop = current.y + deltaY;
      rawTop = snapValue(rawTop, [...snapEdgesY, 0]);
      rawTop = Math.max(
        0,
        Math.min(current.y + current.height - minHeight, rawTop),
      );
      newH = current.y + current.height - rawTop;
      newY = rawTop;
    }

    return {
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH),
    };
  }

  public static calculateGridBounds(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
  ): LaneGridBounds | null {
    if (!widgets || !gridId) return null;
    const gridWidgets = widgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return null;

    const minX = Math.min(...gridWidgets.map((w) => w.x));
    const maxX = Math.max(...gridWidgets.map((w) => w.x + w.width));
    const minY = Math.min(...gridWidgets.map((w) => w.y));
    const maxY = Math.max(...gridWidgets.map((w) => w.y + w.height));

    return {
      x: minX,
      y: minY,
      width: Math.max(100, maxX - minX),
      height: Math.max(50, maxY - minY),
    };
  }
}
