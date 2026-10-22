import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridLabelHelper } from "./lane-grid-label.helper";
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
    direction: "horizontal" | "vertical" = "vertical",
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
    if (session.direction === "vertical") {
      if (session.mirrorRows !== false) {
        widget.height = cellH;
        widget.y = masterCell.y;
        widget.customSettings["cellHeightRatio"] = 1.0;
        widget.customSettings["cellOffsetYRatio"] = 0;
      } else {
        widget.customSettings["cellHeightRatio"] = widget.height / cellH;
        widget.customSettings["cellOffsetYRatio"] =
          (widget.y - masterCell.y) / cellH;
      }
      widget.customSettings["cellWidthRatio"] = widget.width / cellW;
      widget.customSettings["cellOffsetXRatio"] =
        (widget.x - masterCell.x) / cellW;
    } else {
      if (session.mirrorRows !== false) {
        widget.width = cellW;
        widget.x = masterCell.x;
        widget.customSettings["cellWidthRatio"] = 1.0;
        widget.customSettings["cellOffsetXRatio"] = 0;
      } else {
        widget.customSettings["cellWidthRatio"] = widget.width / cellW;
        widget.customSettings["cellOffsetXRatio"] =
          (widget.x - masterCell.x) / cellW;
      }
      widget.customSettings["cellHeightRatio"] = widget.height / cellH;
      widget.customSettings["cellOffsetYRatio"] =
        (widget.y - masterCell.y) / cellH;
    }
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

  public static computePitch(session: LaneGridSession): number {
    if (!session || session.totalLanes <= 0) return 0;
    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(session);
    if (session.headerPlacement === "top") {
      const headerH =
        session.headerHeight != null ? Math.max(20, session.headerHeight) : 36;
      const availH = Math.max(0, dataBounds.height - headerH);
      return session.direction === "horizontal"
        ? dataBounds.width / session.totalLanes
        : availH / session.totalLanes;
    }
    if (
      session.headerPlacement === "left" &&
      session.direction === "horizontal"
    ) {
      const headerW =
        session.headerWidth != null ? Math.max(40, session.headerWidth) : 200;
      const availW = Math.max(0, dataBounds.width - headerW);
      return availW / session.totalLanes;
    }
    return session.direction === "horizontal"
      ? dataBounds.width / session.totalLanes
      : dataBounds.height / session.totalLanes;
  }

  public static computeGridDividers(session: LaneGridSession): number[] {
    if (!session || session.totalLanes <= 0) return [];
    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(session);
    const dividers: number[] = [];
    const headerH =
      session.headerPlacement === "top"
        ? session.headerHeight != null
          ? Math.max(20, session.headerHeight)
          : 36
        : 0;
    const headerW =
      session.headerPlacement === "left" && session.direction === "horizontal"
        ? session.headerWidth != null
          ? Math.max(40, session.headerWidth)
          : 200
        : 0;

    if (session.headerPlacement === "top") {
      dividers.push(Math.round(dataBounds.y + headerH));
    }
    if (
      session.headerPlacement === "left" &&
      session.direction === "horizontal"
    ) {
      dividers.push(Math.round(dataBounds.x + headerW));
    }
    if (session.totalLanes <= 1) return dividers;

    const pitch = this.computePitch(session);
    const base =
      session.direction === "horizontal"
        ? dataBounds.x + headerW
        : dataBounds.y + headerH;
    for (let k = 1; k < session.totalLanes; k++) {
      dividers.push(Math.round(base + k * pitch));
    }
    return dividers;
  }

  public static computeMasterBounds(session: LaneGridSession): LaneGridBounds {
    return this.computeLaneCellBounds(session, session.sourceLaneIndex ?? 0);
  }

  public static computeLaneCellBounds(
    session: LaneGridSession,
    laneIndex: number,
  ): LaneGridBounds {
    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(session);
    const pitch = this.computePitch(session);
    const headerH =
      session.headerPlacement === "top"
        ? session.headerHeight != null
          ? Math.max(20, session.headerHeight)
          : 36
        : 0;
    const headerW =
      session.headerPlacement === "left" && session.direction === "horizontal"
        ? session.headerWidth != null
          ? Math.max(40, session.headerWidth)
          : 200
        : 0;

    if (session.direction === "horizontal") {
      const x = Math.round(dataBounds.x + headerW + laneIndex * pitch);
      const isLastLane = laneIndex === session.totalLanes - 1;
      const width = isLastLane
        ? Math.round(dataBounds.x + dataBounds.width - x)
        : Math.round(pitch);
      return {
        x,
        y: Math.round(dataBounds.y + headerH),
        width: Math.max(10, width),
        height: Math.round(Math.max(0, dataBounds.height - headerH)),
      };
    } else {
      return {
        x: dataBounds.x,
        y: Math.round(dataBounds.y + headerH + laneIndex * pitch),
        width: dataBounds.width,
        height: Math.round(pitch),
      };
    }
  }

  public static computeHeaderRowBounds(
    session: LaneGridSession,
  ): LaneGridBounds {
    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(session);
    if (
      session.headerPlacement === "left" &&
      session.direction === "horizontal"
    ) {
      const headerW =
        session.headerWidth != null ? Math.max(40, session.headerWidth) : 200;
      return {
        x: dataBounds.x,
        y: dataBounds.y,
        width: headerW,
        height: dataBounds.height,
      };
    }
    const headerH =
      session.headerHeight != null ? Math.max(20, session.headerHeight) : 36;
    return {
      x: dataBounds.x,
      y: dataBounds.y,
      width: dataBounds.width,
      height: headerH,
    };
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
    const boundsForOld = savedBounds || session.bounds;
    if (boundsForOld) {
      const savedLabelPos =
        (masterWidget.customSettings?.["gridLabelPosition"] as any) || "none";
      const savedLabelSize =
        Number(masterWidget.customSettings?.["gridLabelSize"]) || 40;
      const savedDirection =
        (masterWidget.customSettings?.["gridDirection"] as any) ||
        session.direction;
      const savedHeaderPlacement =
        (masterWidget.customSettings?.["headerPlacement"] as any) ||
        session.headerPlacement;
      const savedHeaderH =
        masterWidget.customSettings?.["headerHeight"] != null
          ? Number(masterWidget.customSettings["headerHeight"])
          : headerHeight;

      const oldSession: LaneGridSession = {
        gridId: session.gridId,
        bounds: boundsForOld,
        totalLanes: savedTotalLanes > 0 ? savedTotalLanes : session.totalLanes,
        direction: savedDirection,
        sourceLaneIndex: session.sourceLaneIndex ?? 0,
        bindingMode: session.bindingMode,
        headerPlacement: savedHeaderPlacement,
        headerHeight: savedHeaderH,
        gridLabelPosition: savedLabelPos,
        gridLabelSize: savedLabelSize,
      };

      const oldCell = this.computeLaneCellBounds(
        oldSession,
        session.sourceLaneIndex ?? 0,
      );
      const oldW = oldCell.width > 0 ? oldCell.width : cellW;
      const oldH = oldCell.height > 0 ? oldCell.height : cellH;

      return {
        cellWidthRatio: Math.max(0.001, masterWidget.width / oldW),
        cellHeightRatio: Math.max(0.001, masterWidget.height / oldH),
        cellOffsetXRatio: Math.max(0, (masterWidget.x - oldCell.x) / oldW),
        cellOffsetYRatio: Math.max(0, (masterWidget.y - oldCell.y) / oldH),
      };
    }

    return {
      cellWidthRatio: Math.max(0.001, masterWidget.width / cellW),
      cellHeightRatio: Math.max(0.001, masterWidget.height / cellH),
      cellOffsetXRatio: Math.max(0, (masterWidget.x - masterCell.x) / cellW),
      cellOffsetYRatio: Math.max(0, (masterWidget.y - masterCell.y) / cellH),
    };
  }

  public static isUnderLabel(
    currentLabelPos: string,
    masterWidget: AbsoluteWidgetNode,
    masterCell: LaneGridBounds,
    cellOffsetXRatio?: number,
    cellOffsetYRatio?: number,
  ): boolean {
    return (
      (currentLabelPos === "top" &&
        (masterWidget.y < masterCell.y ||
          (cellOffsetYRatio != null && cellOffsetYRatio < 0))) ||
      (currentLabelPos === "left" &&
        (masterWidget.x < masterCell.x ||
          (cellOffsetXRatio != null && cellOffsetXRatio < 0)))
    );
  }

  private static extractStoredRatios(masterWidget: AbsoluteWidgetNode): {
    cellWidthRatio?: number;
    cellHeightRatio?: number;
    cellOffsetXRatio?: number;
    cellOffsetYRatio?: number;
  } {
    const s = masterWidget.customSettings || {};
    return {
      cellWidthRatio:
        s["cellWidthRatio"] != null ? Number(s["cellWidthRatio"]) : undefined,
      cellHeightRatio:
        s["cellHeightRatio"] != null ? Number(s["cellHeightRatio"]) : undefined,
      cellOffsetXRatio:
        s["cellOffsetXRatio"] != null
          ? Number(s["cellOffsetXRatio"])
          : undefined,
      cellOffsetYRatio:
        s["cellOffsetYRatio"] != null
          ? Number(s["cellOffsetYRatio"])
          : undefined,
    };
  }

  private static checkGridResizeState(
    masterWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    masterCell: LaneGridBounds,
    cellOffsetXRatio?: number,
    cellOffsetYRatio?: number,
  ): { isGridResized: boolean; isUnderLabel: boolean } {
    const s = masterWidget.customSettings || {};
    const savedBounds = s["gridBounds"] as LaneGridBounds | undefined;
    const savedTotalLanes = Number(s["gridTotalLanes"]);
    const savedLabelPos = s["gridLabelPosition"] || "none";
    const savedLabelSize = Number(s["gridLabelSize"]) || 40;

    const currentLabelPos = session.gridLabelPosition || "none";
    const currentLabelSize = Number(session.gridLabelSize) || 40;

    const isUnderLabel = this.isUnderLabel(
      currentLabelPos,
      masterWidget,
      masterCell,
      cellOffsetXRatio,
      cellOffsetYRatio,
    );

    const isGridResized =
      isUnderLabel ||
      this.isGridResized(
        savedBounds,
        session.bounds,
        savedTotalLanes,
        session.totalLanes,
        savedLabelPos,
        currentLabelPos,
        savedLabelSize,
        currentLabelSize,
      );

    return { isGridResized, isUnderLabel };
  }

  private static finalizeResolvedRatios(
    session: LaneGridSession,
    masterWidget: AbsoluteWidgetNode,
    masterCell: LaneGridBounds,
    cellW: number,
    cellH: number,
    ratios: {
      cellWidthRatio?: number;
      cellHeightRatio?: number;
      cellOffsetXRatio?: number;
      cellOffsetYRatio?: number;
    },
  ): {
    cellWidthRatio: number;
    cellHeightRatio: number;
    cellOffsetXRatio: number;
    cellOffsetYRatio: number;
  } {
    let {
      cellWidthRatio,
      cellHeightRatio,
      cellOffsetXRatio,
      cellOffsetYRatio,
    } = ratios;

    if (
      cellOffsetXRatio == null ||
      isNaN(cellOffsetXRatio) ||
      cellOffsetXRatio < 0
    ) {
      cellOffsetXRatio = Math.max(0, (masterWidget.x - masterCell.x) / cellW);
    }
    if (
      cellOffsetYRatio == null ||
      isNaN(cellOffsetYRatio) ||
      cellOffsetYRatio < 0
    ) {
      cellOffsetYRatio = Math.max(0, (masterWidget.y - masterCell.y) / cellH);
    }

    const isVertical = session.direction === "vertical";
    const allowCustomWidth = isVertical || session.mirrorRows === false;
    const allowCustomHeight = !isVertical || session.mirrorRows === false;
    return {
      cellWidthRatio: allowCustomWidth
        ? Math.max(0.001, cellWidthRatio ?? masterWidget.width / cellW)
        : 1.0,
      cellHeightRatio: allowCustomHeight
        ? Math.max(0.001, cellHeightRatio ?? masterWidget.height / cellH)
        : 1.0,
      cellOffsetXRatio: isVertical ? Math.max(0, cellOffsetXRatio ?? 0) : 0,
      cellOffsetYRatio: isVertical ? 0 : Math.max(0, cellOffsetYRatio ?? 0),
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
    const s = masterWidget.customSettings || {};

    const savedBounds = s["gridBounds"] as LaneGridBounds | undefined;
    const savedTotalLanes = Number(s["gridTotalLanes"]);

    const stored = this.extractStoredRatios(masterWidget);
    let {
      cellWidthRatio,
      cellHeightRatio,
      cellOffsetXRatio,
      cellOffsetYRatio,
    } = stored;

    const { isGridResized, isUnderLabel } = this.checkGridResizeState(
      masterWidget,
      session,
      masterCell,
      cellOffsetXRatio,
      cellOffsetYRatio,
    );

    const hasExistingRatios =
      !isUnderLabel &&
      cellWidthRatio != null &&
      !isNaN(cellWidthRatio) &&
      cellHeightRatio != null &&
      !isNaN(cellHeightRatio);

    if (savedBounds && !isGridResized) {
      cellWidthRatio = masterWidget.width / cellW;
      cellHeightRatio = masterWidget.height / cellH;
      cellOffsetXRatio = Math.max(0, (masterWidget.x - masterCell.x) / cellW);
      cellOffsetYRatio = Math.max(0, (masterWidget.y - masterCell.y) / cellH);
    } else if (isGridResized || !hasExistingRatios) {
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
    }

    return this.finalizeResolvedRatios(
      session,
      masterWidget,
      masterCell,
      cellW,
      cellH,
      {
        cellWidthRatio,
        cellHeightRatio,
        cellOffsetXRatio,
        cellOffsetYRatio,
      },
    );
  }
}
