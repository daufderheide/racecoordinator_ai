import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

export interface LaneGridBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaneGridSession {
  gridId: string;
  bounds: LaneGridBounds;
  totalLanes: number;
  direction: "horizontal" | "vertical";
  sourceLaneIndex: number;
  bindingMode: "lane" | "position";
}

export type GridResizeHandle =
  | "n"
  | "s"
  | "e"
  | "w"
  | "nw"
  | "ne"
  | "se"
  | "sw";

export class LaneGridReplicationHelper {
  public static computePitch(session: LaneGridSession): number {
    if (!session || session.totalLanes <= 0) return 0;
    return session.direction === "horizontal"
      ? session.bounds.width / session.totalLanes
      : session.bounds.height / session.totalLanes;
  }

  public static computeGridDividers(session: LaneGridSession): number[] {
    if (!session || session.totalLanes <= 1) return [];
    const pitch = this.computePitch(session);
    const base =
      session.direction === "horizontal" ? session.bounds.x : session.bounds.y;
    const dividers: number[] = [];
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
    const pitch = this.computePitch(session);
    if (session.direction === "horizontal") {
      return {
        x: Math.round(session.bounds.x + laneIndex * pitch),
        y: session.bounds.y,
        width: Math.round(pitch),
        height: session.bounds.height,
      };
    } else {
      return {
        x: session.bounds.x,
        y: Math.round(session.bounds.y + laneIndex * pitch),
        width: session.bounds.width,
        height: Math.round(pitch),
      };
    }
  }

  public static getMirroredWidgetId(
    masterId: string,
    targetLane: number,
  ): string {
    return `${masterId}_grid_lane_${targetLane}`;
  }

  public static isMasterWidget(
    widget: AbsoluteWidgetNode,
    session: LaneGridSession,
  ): boolean {
    if (!widget || !session) return false;
    const s = widget.customSettings;
    if (s?.["gridId"] === session.gridId) {
      return (
        Number(s?.["gridLane"] ?? s?.["targetIndex"]) ===
        session.sourceLaneIndex
      );
    }
    return false;
  }

  public static syncMasterWidgetToLanes(
    masterWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    allWidgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    if (!masterWidget || !session) return allWidgets || [];

    const masterCell = this.computeLaneCellBounds(
      session,
      session.sourceLaneIndex,
    );
    const offsetInCellX = masterWidget.x - masterCell.x;
    const offsetInCellY = masterWidget.y - masterCell.y;

    const effectiveBindingMode =
      (masterWidget.customSettings?.["bindingMode"] as any) ||
      session.bindingMode ||
      "lane";
    session.bindingMode = effectiveBindingMode;

    const updatedMaster: AbsoluteWidgetNode = {
      ...masterWidget,
      customSettings: {
        ...(masterWidget.customSettings || {}),
        gridId: session.gridId,
        gridLane: session.sourceLaneIndex,
        gridTotalLanes: session.totalLanes,
        gridDirection: session.direction,
        bindingMode: effectiveBindingMode,
        targetIndex: session.sourceLaneIndex,
      },
    };

    let result = (allWidgets || []).map((w) =>
      w.id === masterWidget.id ? updatedMaster : w,
    );
    if (!result.some((w) => w.id === masterWidget.id)) {
      result.push(updatedMaster);
    }

    for (let k = 0; k < session.totalLanes; k++) {
      if (k === session.sourceLaneIndex) continue;

      const targetCell = this.computeLaneCellBounds(session, k);
      const mirroredId = this.getMirroredWidgetId(masterWidget.id, k);

      const existingIndex = result.findIndex(
        (w) =>
          w.id === mirroredId ||
          (w.customSettings?.["gridMasterId"] === masterWidget.id &&
            Number(w.customSettings?.["gridLane"]) === k),
      );

      const clonedSettings = deepCopy(updatedMaster.customSettings || {});
      clonedSettings["targetIndex"] = k;
      clonedSettings["gridLane"] = k;
      clonedSettings["gridMasterId"] = masterWidget.id;
      clonedSettings["bindingMode"] = effectiveBindingMode;

      const mirroredWidget: AbsoluteWidgetNode = {
        ...deepCopy(updatedMaster),
        id: mirroredId,
        x: Math.round(targetCell.x + offsetInCellX),
        y: Math.round(targetCell.y + offsetInCellY),
        width: updatedMaster.width,
        height: updatedMaster.height,
        zIndex: updatedMaster.zIndex,
        customSettings: clonedSettings,
      };

      if (existingIndex >= 0) {
        result[existingIndex] = mirroredWidget;
      } else {
        result.push(mirroredWidget);
      }
    }

    return result;
  }

  public static syncAllMasterWidgetsToLanes(
    session: LaneGridSession,
    allWidgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    if (!session || !allWidgets) return allWidgets || [];

    const masterBounds = this.computeMasterBounds(session);
    const masterWidgets = allWidgets.filter((w) => {
      if (w.customSettings?.["gridId"] === session.gridId) {
        return (
          Number(
            w.customSettings?.["gridLane"] ?? w.customSettings?.["targetIndex"],
          ) === session.sourceLaneIndex
        );
      }
      if (w.widgetType === "lane-column") {
        const midX = w.x + w.width / 2;
        const midY = w.y + w.height / 2;
        return (
          midX >= masterBounds.x &&
          midX <= masterBounds.x + masterBounds.width &&
          midY >= masterBounds.y &&
          midY <= masterBounds.y + masterBounds.height
        );
      }
      return false;
    });

    const bindingModeOverride = masterWidgets.find(
      (m) => m.customSettings?.["bindingMode"],
    )?.customSettings?.["bindingMode"];
    if (bindingModeOverride) {
      session.bindingMode = bindingModeOverride as any;
    }

    let currentWidgets = [...allWidgets];
    for (const master of masterWidgets) {
      currentWidgets = this.syncMasterWidgetToLanes(
        master,
        session,
        currentWidgets,
      );
    }

    const masterIds = new Set(masterWidgets.map((m) => m.id));
    currentWidgets = currentWidgets.filter((w) => {
      if (w.customSettings?.["gridId"] === session.gridId) {
        const isMaster =
          Number(w.customSettings?.["gridLane"]) === session.sourceLaneIndex;
        if (!isMaster) {
          const masterId = w.customSettings?.["gridMasterId"];
          return masterId ? masterIds.has(masterId) : true;
        }
      }
      return true;
    });

    return currentWidgets;
  }

  public static removeMasterWidgetFromLanes(
    masterWidgetId: string,
    session: LaneGridSession,
    allWidgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    if (!masterWidgetId || !allWidgets) return allWidgets || [];
    return allWidgets.filter((w) => {
      if (w.id === masterWidgetId) return false;
      if (
        w.customSettings?.["gridId"] === session?.gridId &&
        w.customSettings?.["gridMasterId"] === masterWidgetId
      ) {
        return false;
      }
      if (w.id.startsWith(`${masterWidgetId}_grid_lane_`)) {
        return false;
      }
      return true;
    });
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

  public static detachGrid(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
  ): AbsoluteWidgetNode[] {
    if (!widgets || !gridId) return widgets || [];
    return widgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        const nextSettings = { ...(w.customSettings || {}) };
        delete nextSettings["gridId"];
        delete nextSettings["gridLane"];
        delete nextSettings["gridTotalLanes"];
        delete nextSettings["gridDirection"];
        delete nextSettings["gridMasterId"];
        return {
          ...w,
          customSettings: nextSettings,
        };
      }
      return w;
    });
  }

  public static bakeGrid(
    widgets: AbsoluteWidgetNode[],
    session: LaneGridSession,
  ): AbsoluteWidgetNode[] {
    if (!widgets || !session) return widgets || [];
    return widgets.map((w) => {
      if (w.customSettings?.["gridId"] === session.gridId) {
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            gridId: session.gridId,
            gridTotalLanes: session.totalLanes,
            gridDirection: session.direction,
          },
        };
      }
      return w;
    });
  }

  private static extractObstacles(
    allWidgets: AbsoluteWidgetNode[],
    sourceWidgets: AbsoluteWidgetNode[],
    replaceExisting: boolean,
    sourceBindingMode: "lane" | "position",
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

  private static expandVerticallyFirst(
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

  private static expandHorizontallyFirst(
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
    sourceBindingMode: "lane" | "position" = "lane",
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

    // Helper for snapping
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
}
