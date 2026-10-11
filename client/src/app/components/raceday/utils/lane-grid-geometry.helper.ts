import { AbsoluteWidgetNode } from "@app/models/settings";

import {
  LaneGridBounds,
  LaneGridSession,
} from "./lane-grid-replication.helper";

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

  public static moveGridBounds(
    current: LaneGridBounds,
    deltaX: number,
    deltaY: number,
    baseWidth: number,
    baseHeight: number,
    snapEdgesX: number[] = [],
    snapEdgesY: number[] = [],
    snapThreshold = 8,
  ): LaneGridBounds {
    const rawX = current.x + deltaX;
    const rawY = current.y + deltaY;

    const snapValue = (val: number, edges: number[]): number => {
      for (const edge of edges) {
        if (Math.abs(val - edge) <= snapThreshold) {
          return edge;
        }
      }
      return val;
    };

    let newX = rawX;
    const snappedLeft = snapValue(rawX, [...snapEdgesX, 0]);
    if (snappedLeft !== rawX) {
      newX = snappedLeft;
    } else {
      const snappedRight = snapValue(rawX + current.width, [
        ...snapEdgesX,
        baseWidth,
      ]);
      if (snappedRight !== rawX + current.width) {
        newX = snappedRight - current.width;
      }
    }

    let newY = rawY;
    const snappedTop = snapValue(rawY, [...snapEdgesY, 0]);
    if (snappedTop !== rawY) {
      newY = snappedTop;
    } else {
      const snappedBottom = snapValue(rawY + current.height, [
        ...snapEdgesY,
        baseHeight,
      ]);
      if (snappedBottom !== rawY + current.height) {
        newY = snappedBottom - current.height;
      }
    }

    let minX: number;
    let maxX: number;
    if (current.width <= baseWidth) {
      minX = 0;
      maxX = Math.max(0, baseWidth - current.width);
    } else {
      minX = baseWidth - current.width;
      maxX = 0;
    }
    newX = Math.max(minX, Math.min(maxX, newX));

    let minY: number;
    let maxY: number;
    if (current.height <= baseHeight) {
      minY = 0;
      maxY = Math.max(0, baseHeight - current.height);
    } else {
      minY = baseHeight - current.height;
      maxY = 0;
    }
    newY = Math.max(minY, Math.min(maxY, newY));

    return {
      x: Math.round(newX),
      y: Math.round(newY),
      width: current.width,
      height: current.height,
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

    for (const w of gridWidgets) {
      const saved = w.customSettings?.["gridBounds"];
      if (
        saved &&
        typeof saved.x === "number" &&
        typeof saved.y === "number" &&
        typeof saved.width === "number" &&
        typeof saved.height === "number"
      ) {
        return {
          x: saved.x,
          y: saved.y,
          width: Math.max(100, saved.width),
          height: Math.max(50, saved.height),
        };
      }
    }

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

  public static updateWidgetCellRatios(
    widget: AbsoluteWidgetNode,
    session: LaneGridSession,
    masterCell: LaneGridBounds,
  ): void {
    if (!widget || !session) return;
    if (!widget.customSettings) {
      widget.customSettings = {};
    }
    const cellW = masterCell.width > 0 ? masterCell.width : 1;
    const cellH = masterCell.height > 0 ? masterCell.height : 1;
    widget.customSettings["cellWidthRatio"] = widget.width / cellW;
    widget.customSettings["cellHeightRatio"] = widget.height / cellH;
    widget.customSettings["cellOffsetXRatio"] =
      (widget.x - masterCell.x) / cellW;
    widget.customSettings["cellOffsetYRatio"] =
      (widget.y - masterCell.y) / cellH;
  }

  public static isGridResized(
    savedBounds: LaneGridBounds | undefined,
    sessionBounds: LaneGridBounds,
    savedTotalLanes: number,
    sessionTotalLanes: number,
    savedLabelPos: string,
    currentLabelPos: string,
    savedLabelSize: number,
    currentLabelSize: number,
  ): boolean {
    const labelChanged =
      savedLabelPos !== currentLabelPos ||
      (currentLabelPos !== "none" && savedLabelSize !== currentLabelSize);

    const boundsChanged =
      Boolean(savedBounds) &&
      (savedBounds!.x !== sessionBounds.x ||
        savedBounds!.y !== sessionBounds.y ||
        savedBounds!.width !== sessionBounds.width ||
        savedBounds!.height !== sessionBounds.height);

    const totalLanesChanged =
      savedTotalLanes != null &&
      savedTotalLanes > 0 &&
      savedTotalLanes !== sessionTotalLanes;

    return Boolean(boundsChanged || totalLanesChanged || labelChanged);
  }

  public static calculateFallbackRatiosForResizedGrid(
    masterWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    masterCell: LaneGridBounds,
    headerHeight: number,
    savedBounds: LaneGridBounds | undefined,
    savedTotalLanes: number,
    cellW: number,
    cellH: number,
  ): {
    cellWidthRatio: number;
    cellHeightRatio: number;
    cellOffsetXRatio: number;
    cellOffsetYRatio: number;
  } {
    if (
      savedTotalLanes &&
      savedTotalLanes !== session.totalLanes &&
      savedTotalLanes > 0
    ) {
      if (session.direction === "horizontal") {
        const oldPitch =
          (savedBounds?.width || session.bounds.width) / savedTotalLanes;
        const safePitch = oldPitch > 0 ? oldPitch : 1;
        return {
          cellWidthRatio: masterWidget.width / safePitch,
          cellHeightRatio: masterWidget.height / cellH,
          cellOffsetXRatio:
            (masterWidget.x - (savedBounds?.x || session.bounds.x)) / safePitch,
          cellOffsetYRatio: (masterWidget.y - masterCell.y) / cellH,
        };
      }
      const baseH = savedBounds?.height || session.bounds.height;
      const availH =
        session.headerPlacement === "top"
          ? Math.max(0, baseH - headerHeight)
          : baseH;
      const oldPitch = availH / savedTotalLanes;
      const safePitch = oldPitch > 0 ? oldPitch : 1;
      const oldCellY =
        (savedBounds?.y || session.bounds.y) +
        (session.headerPlacement === "top" ? headerHeight : 0) +
        (session.sourceLaneIndex ?? 0) * oldPitch;
      return {
        cellHeightRatio: masterWidget.height / safePitch,
        cellWidthRatio: masterWidget.width / cellW,
        cellOffsetXRatio: (masterWidget.x - masterCell.x) / cellW,
        cellOffsetYRatio: (masterWidget.y - oldCellY) / safePitch,
      };
    }
    return {
      cellWidthRatio: masterWidget.width / cellW,
      cellHeightRatio: masterWidget.height / cellH,
      cellOffsetXRatio: (masterWidget.x - masterCell.x) / cellW,
      cellOffsetYRatio: (masterWidget.y - masterCell.y) / cellH,
    };
  }

  public static resolveCellRatios(
    masterWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    masterCell: LaneGridBounds,
    headerHeight: number,
  ): {
    cellWidthRatio: number;
    cellHeightRatio: number;
    cellOffsetXRatio: number;
    cellOffsetYRatio: number;
  } {
    const cellW = masterCell.width > 0 ? masterCell.width : 1;
    const cellH = masterCell.height > 0 ? masterCell.height : 1;

    const savedBounds = masterWidget.customSettings?.["gridBounds"] as
      | LaneGridBounds
      | undefined;
    const savedTotalLanes = Number(
      masterWidget.customSettings?.["gridTotalLanes"],
    );
    const savedLabelPos =
      masterWidget.customSettings?.["gridLabelPosition"] || "none";
    const savedLabelSize =
      Number(masterWidget.customSettings?.["gridLabelSize"]) || 40;

    const currentLabelPos = session.gridLabelPosition || "none";
    const currentLabelSize = Number(session.gridLabelSize) || 40;

    const isGridResized = this.isGridResized(
      savedBounds,
      session.bounds,
      savedTotalLanes,
      session.totalLanes,
      savedLabelPos,
      currentLabelPos,
      savedLabelSize,
      currentLabelSize,
    );

    let cellWidthRatio =
      masterWidget.customSettings?.["cellWidthRatio"] != null
        ? Number(masterWidget.customSettings["cellWidthRatio"])
        : undefined;
    let cellHeightRatio =
      masterWidget.customSettings?.["cellHeightRatio"] != null
        ? Number(masterWidget.customSettings["cellHeightRatio"])
        : undefined;
    let cellOffsetXRatio =
      masterWidget.customSettings?.["cellOffsetXRatio"] != null
        ? Number(masterWidget.customSettings["cellOffsetXRatio"])
        : undefined;
    let cellOffsetYRatio =
      masterWidget.customSettings?.["cellOffsetYRatio"] != null
        ? Number(masterWidget.customSettings["cellOffsetYRatio"])
        : undefined;

    const hasExistingRatios =
      cellWidthRatio != null &&
      !isNaN(cellWidthRatio) &&
      cellHeightRatio != null &&
      !isNaN(cellHeightRatio);

    if (savedBounds && !isGridResized) {
      cellWidthRatio = masterWidget.width / cellW;
      cellHeightRatio = masterWidget.height / cellH;
      cellOffsetXRatio = (masterWidget.x - masterCell.x) / cellW;
      cellOffsetYRatio = (masterWidget.y - masterCell.y) / cellH;
    } else if (!hasExistingRatios) {
      if (isGridResized) {
        const fallback = this.calculateFallbackRatiosForResizedGrid(
          masterWidget,
          session,
          masterCell,
          headerHeight,
          savedBounds,
          savedTotalLanes,
          cellW,
          cellH,
        );
        cellWidthRatio = fallback.cellWidthRatio;
        cellHeightRatio = fallback.cellHeightRatio;
        cellOffsetXRatio = fallback.cellOffsetXRatio;
        cellOffsetYRatio = fallback.cellOffsetYRatio;
      } else {
        cellWidthRatio = masterWidget.width / cellW;
        cellHeightRatio = masterWidget.height / cellH;
        cellOffsetXRatio = (masterWidget.x - masterCell.x) / cellW;
        cellOffsetYRatio = (masterWidget.y - masterCell.y) / cellH;
      }
    }

    if (cellOffsetXRatio == null || isNaN(cellOffsetXRatio)) {
      cellOffsetXRatio = (masterWidget.x - masterCell.x) / cellW;
    }
    if (cellOffsetYRatio == null || isNaN(cellOffsetYRatio)) {
      cellOffsetYRatio = (masterWidget.y - masterCell.y) / cellH;
    }

    return {
      cellWidthRatio: cellWidthRatio ?? masterWidget.width / cellW,
      cellHeightRatio: cellHeightRatio ?? masterWidget.height / cellH,
      cellOffsetXRatio:
        cellOffsetXRatio ?? (masterWidget.x - masterCell.x) / cellW,
      cellOffsetYRatio:
        cellOffsetYRatio ?? (masterWidget.y - masterCell.y) / cellH,
    };
  }
}
