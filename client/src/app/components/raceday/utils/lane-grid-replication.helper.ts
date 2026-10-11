import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import { LaneGridHeaderHelper } from "./lane-grid-header.helper";
import { LaneGridScrollHelper } from "./lane-grid-scroll.helper";
import { LaneGridStyleHelper } from "./lane-grid-style.helper";

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
  bindingMode: "lane" | "position" | "overallPosition" | "seed";
  headerPlacement?: "top" | "individual" | "none";
  headerHeight?: number;
  linkColumns?: boolean;
  sortByBindingMode?: boolean;
  layoutOrientation?: "vertical" | "horizontal";
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
    if (session.headerPlacement === "top") {
      const headerH =
        session.headerHeight != null ? Math.max(20, session.headerHeight) : 36;
      const availH = Math.max(0, session.bounds.height - headerH);
      return session.direction === "horizontal"
        ? session.bounds.width / session.totalLanes
        : availH / session.totalLanes;
    }
    return session.direction === "horizontal"
      ? session.bounds.width / session.totalLanes
      : session.bounds.height / session.totalLanes;
  }

  public static computeGridDividers(session: LaneGridSession): number[] {
    if (!session || session.totalLanes <= 0) return [];
    const dividers: number[] = [];
    const headerH =
      session.headerPlacement === "top"
        ? session.headerHeight != null
          ? Math.max(20, session.headerHeight)
          : 36
        : 0;

    if (session.headerPlacement === "top") {
      dividers.push(Math.round(session.bounds.y + headerH));
    }
    if (session.totalLanes <= 1) return dividers;

    const pitch = this.computePitch(session);
    const base =
      session.direction === "horizontal"
        ? session.bounds.x
        : session.bounds.y + headerH;
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
    const headerH =
      session.headerPlacement === "top"
        ? session.headerHeight != null
          ? Math.max(20, session.headerHeight)
          : 36
        : 0;

    if (session.direction === "horizontal") {
      return {
        x: Math.round(session.bounds.x + laneIndex * pitch),
        y: Math.round(session.bounds.y + headerH),
        width: Math.round(pitch),
        height: Math.round(Math.max(0, session.bounds.height - headerH)),
      };
    } else {
      return {
        x: session.bounds.x,
        y: Math.round(session.bounds.y + headerH + laneIndex * pitch),
        width: session.bounds.width,
        height: Math.round(pitch),
      };
    }
  }

  public static computeHeaderRowBounds(
    session: LaneGridSession,
  ): LaneGridBounds {
    const headerH =
      session.headerHeight != null ? Math.max(20, session.headerHeight) : 36;
    return {
      x: session.bounds.x,
      y: session.bounds.y,
      width: session.bounds.width,
      height: headerH,
    };
  }

  public static getMirroredWidgetId(
    masterId: string,
    targetLane: number,
  ): string {
    return `${masterId}_grid_lane_${targetLane}`;
  }

  public static getHeaderWidgetId(masterId: string): string {
    return LaneGridHeaderHelper.getHeaderWidgetId(masterId);
  }

  public static isHeaderWidgetId(id: string): boolean {
    return Boolean(id && id.endsWith("_grid_header"));
  }

  public static isMasterWidget(
    widget: AbsoluteWidgetNode,
    session: LaneGridSession,
  ): boolean {
    if (!widget || !session) return false;
    const s = widget.customSettings;
    if (s?.["gridId"] === session.gridId) {
      if (s?.["isHeaderWidget"]) return false;
      return (
        Number(s?.["gridLane"] ?? s?.["targetIndex"]) ===
        session.sourceLaneIndex
      );
    }
    return false;
  }

  public static isHeaderWidget(widget: AbsoluteWidgetNode): boolean {
    return Boolean(widget?.customSettings?.["isHeaderWidget"]);
  }

  private static syncHeaderWidgetOnly(
    masterWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    allWidgets: AbsoluteWidgetNode[],
    headerHeight: number,
  ): AbsoluteWidgetNode[] {
    const updatedHeader: AbsoluteWidgetNode = {
      ...masterWidget,
      y: session.bounds.y,
      height: headerHeight,
      customSettings: {
        ...(masterWidget.customSettings || {}),
        gridId: session.gridId,
        isHeaderWidget: true,
        showHeader: true,
        headerHeight,
        headerPlacement: session.headerPlacement ?? "top",
        linkColumns: session.linkColumns ?? true,
        layoutOrientation:
          masterWidget.customSettings?.["layoutOrientation"] ||
          session.layoutOrientation ||
          "vertical",
      },
    };
    return (allWidgets || []).map((w) =>
      w.id === masterWidget.id ? updatedHeader : w,
    );
  }

  private static syncMirroredLanes(
    masterWidget: AbsoluteWidgetNode,
    updatedMaster: AbsoluteWidgetNode,
    session: LaneGridSession,
    offsetInCellX: number,
    offsetInCellY: number,
    effectiveBindingMode: "lane" | "position" | "overallPosition" | "seed",
    showHeader: boolean,
    result: AbsoluteWidgetNode[],
  ): void {
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
      clonedSettings["showHeader"] = showHeader;
      clonedSettings["isHeaderWidget"] = false;

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
  }

  public static updateWidgetCellRatios(
    widget: AbsoluteWidgetNode,
    session: LaneGridSession,
  ): void {
    if (!widget || !session) return;
    const masterCell = this.computeLaneCellBounds(
      session,
      session.sourceLaneIndex ?? 0,
    );
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

  private static calculateFallbackRatiosForResizedGrid(
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

  private static resolveCellRatios(
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

    const boundsChanged =
      savedBounds &&
      (savedBounds.x !== session.bounds.x ||
        savedBounds.y !== session.bounds.y ||
        savedBounds.width !== session.bounds.width ||
        savedBounds.height !== session.bounds.height);

    const totalLanesChanged =
      savedTotalLanes != null &&
      savedTotalLanes > 0 &&
      savedTotalLanes !== session.totalLanes;

    const isGridResized = boundsChanged || totalLanesChanged;

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

    if (!isGridResized) {
      cellWidthRatio = masterWidget.width / cellW;
      cellHeightRatio = masterWidget.height / cellH;
      cellOffsetXRatio = (masterWidget.x - masterCell.x) / cellW;
      cellOffsetYRatio = (masterWidget.y - masterCell.y) / cellH;
    } else if (
      cellWidthRatio == null ||
      isNaN(cellWidthRatio) ||
      cellHeightRatio == null ||
      isNaN(cellHeightRatio)
    ) {
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

    if (cellOffsetXRatio == null || isNaN(cellOffsetXRatio)) {
      cellOffsetXRatio = (masterWidget.x - masterCell.x) / cellW;
    }
    if (cellOffsetYRatio == null || isNaN(cellOffsetYRatio)) {
      cellOffsetYRatio = (masterWidget.y - masterCell.y) / cellH;
    }

    return {
      cellWidthRatio,
      cellHeightRatio,
      cellOffsetXRatio,
      cellOffsetYRatio,
    };
  }

  private static syncTopHeaderWidget(
    masterWidget: AbsoluteWidgetNode,
    updatedMaster: AbsoluteWidgetNode,
    session: LaneGridSession,
    headerHeight: number,
    result: AbsoluteWidgetNode[],
  ): void {
    const headerId = this.getHeaderWidgetId(masterWidget.id);
    const existingHeaderIdx = result.findIndex(
      (w) =>
        w.id === headerId ||
        (w.customSettings?.["gridMasterId"] === masterWidget.id &&
          w.customSettings?.["isHeaderWidget"]),
    );

    if (session.headerPlacement === "top") {
      const headerSettings = deepCopy(updatedMaster.customSettings || {});
      headerSettings["isHeaderWidget"] = true;
      headerSettings["showHeader"] = true;
      headerSettings["headerPlacement"] = "top";
      headerSettings["headerHeight"] = headerHeight;
      headerSettings["gridMasterId"] = masterWidget.id;
      headerSettings["gridId"] = session.gridId;
      delete headerSettings["targetIndex"];
      delete headerSettings["gridLane"];

      const headerWidget: AbsoluteWidgetNode = {
        ...deepCopy(updatedMaster),
        id: existingHeaderIdx >= 0 ? result[existingHeaderIdx].id : headerId,
        x: updatedMaster.x,
        y: session.bounds.y,
        width: updatedMaster.width,
        height: headerHeight,
        zIndex: (updatedMaster.zIndex ?? 10) + 1,
        customSettings: {
          ...(existingHeaderIdx >= 0
            ? result[existingHeaderIdx].customSettings
            : {}),
          ...headerSettings,
        },
      };

      if (existingHeaderIdx >= 0) {
        result[existingHeaderIdx] = headerWidget;
      } else {
        result.push(headerWidget);
      }
    } else if (existingHeaderIdx >= 0) {
      result.splice(existingHeaderIdx, 1);
    }
  }

  private static buildUpdatedMaster(
    masterWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    targetBounds: { x: number; y: number; width: number; height: number },
    ratios: {
      cellWidthRatio: number;
      cellHeightRatio: number;
      cellOffsetXRatio: number;
      cellOffsetYRatio: number;
    },
    bindingMode: "lane" | "position" | "overallPosition" | "seed",
    showHeader: boolean,
    headerHeight: number,
  ): AbsoluteWidgetNode {
    return {
      ...masterWidget,
      x: targetBounds.x,
      y: targetBounds.y,
      width: targetBounds.width,
      height: targetBounds.height,
      customSettings: {
        ...(masterWidget.customSettings || {}),
        gridId: session.gridId,
        gridLane: session.sourceLaneIndex,
        gridTotalLanes: session.totalLanes,
        gridDirection: session.direction,
        gridBounds: { ...session.bounds },
        cellWidthRatio: ratios.cellWidthRatio,
        cellHeightRatio: ratios.cellHeightRatio,
        cellOffsetXRatio: ratios.cellOffsetXRatio,
        cellOffsetYRatio: ratios.cellOffsetYRatio,
        bindingMode,
        targetIndex: session.sourceLaneIndex,
        showHeader,
        headerPlacement: session.headerPlacement ?? "individual",
        headerHeight,
        linkColumns: session.linkColumns ?? true,
        layoutOrientation:
          masterWidget.customSettings?.["layoutOrientation"] ||
          session.layoutOrientation ||
          "vertical",
        isHeaderWidget: false,
      },
    };
  }

  public static syncMasterWidgetToLanes(
    masterWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    allWidgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    if (!masterWidget || !session) return allWidgets || [];

    const isHeader = Boolean(masterWidget.customSettings?.["isHeaderWidget"]);
    const headerHeight =
      session.headerHeight != null ? Math.max(20, session.headerHeight) : 36;

    if (isHeader) {
      return this.syncHeaderWidgetOnly(
        masterWidget,
        session,
        allWidgets,
        headerHeight,
      );
    }

    const masterCell = this.computeLaneCellBounds(
      session,
      session.sourceLaneIndex,
    );
    const {
      cellWidthRatio,
      cellHeightRatio,
      cellOffsetXRatio,
      cellOffsetYRatio,
    } = this.resolveCellRatios(masterWidget, session, masterCell, headerHeight);

    const cellW = masterCell.width > 0 ? masterCell.width : 1;
    const cellH = masterCell.height > 0 ? masterCell.height : 1;
    const targetWidth = Math.max(10, Math.round(cellW * cellWidthRatio));
    const targetHeight = Math.max(10, Math.round(cellH * cellHeightRatio));
    const targetX = Math.round(masterCell.x + cellW * cellOffsetXRatio);
    const targetY = Math.round(masterCell.y + cellH * cellOffsetYRatio);

    const offsetInCellX = targetX - masterCell.x;
    const offsetInCellY = targetY - masterCell.y;

    const effectiveBindingMode =
      (masterWidget.customSettings?.["bindingMode"] as any) ||
      session.bindingMode ||
      "lane";
    session.bindingMode = effectiveBindingMode;

    const showHeader = session.headerPlacement === "individual";

    const updatedMaster = this.buildUpdatedMaster(
      masterWidget,
      session,
      { x: targetX, y: targetY, width: targetWidth, height: targetHeight },
      { cellWidthRatio, cellHeightRatio, cellOffsetXRatio, cellOffsetYRatio },
      effectiveBindingMode,
      showHeader,
      headerHeight,
    );

    let result = (allWidgets || []).map((w) =>
      w.id === masterWidget.id ? updatedMaster : w,
    );
    if (!result.some((w) => w.id === masterWidget.id)) {
      result.push(updatedMaster);
    }

    this.syncMirroredLanes(
      masterWidget,
      updatedMaster,
      session,
      offsetInCellX,
      offsetInCellY,
      effectiveBindingMode,
      showHeader,
      result,
    );

    this.syncTopHeaderWidget(
      masterWidget,
      updatedMaster,
      session,
      headerHeight,
      result,
    );

    return result;
  }

  public static syncAllMasterWidgetsToLanes(
    session: LaneGridSession,
    allWidgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    if (!session || !allWidgets) return allWidgets || [];
    if (session.sourceLaneIndex >= session.totalLanes) {
      session.sourceLaneIndex = Math.max(0, session.totalLanes - 1);
    }

    const masterBounds = this.computeMasterBounds(session);
    const masterWidgets = allWidgets.filter((w) => {
      if (w.customSettings?.["gridId"] === session.gridId) {
        if (w.customSettings?.["isHeaderWidget"]) return false;
        return (
          Number(
            w.customSettings?.["gridLane"] ?? w.customSettings?.["targetIndex"],
          ) === session.sourceLaneIndex
        );
      }
      if (w.widgetType === "lane-column") {
        if (w.customSettings?.["isHeaderWidget"]) return false;
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
        if (w.customSettings?.["isHeaderWidget"]) {
          const masterId = w.customSettings?.["gridMasterId"];
          return (
            session.headerPlacement === "top" &&
            (masterId ? masterIds.has(masterId) : true)
          );
        }
        const isMaster =
          Number(w.customSettings?.["gridLane"]) === session.sourceLaneIndex;
        if (!isMaster) {
          const masterId = w.customSettings?.["gridMasterId"];
          const lane = Number(w.customSettings?.["gridLane"]);
          if (lane >= session.totalLanes) return false;
          return masterId ? masterIds.has(masterId) : true;
        }
      }
      return true;
    });

    return currentWidgets;
  }

  public static hasGridWidgets(
    widgets: AbsoluteWidgetNode[] | null | undefined,
    gridId: string | null | undefined,
  ): boolean {
    if (!widgets || !gridId) return false;
    return widgets.some(
      (w) =>
        w.customSettings?.["gridId"] === gridId &&
        !w.customSettings?.["isHeaderWidget"],
    );
  }

  public static removeGrid(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
  ): AbsoluteWidgetNode[] {
    if (!widgets || !gridId) return widgets || [];
    return widgets.filter((w) => w.customSettings?.["gridId"] !== gridId);
  }

  public static removeMasterWidgetFromLanes(
    masterWidgetId: string,
    session: LaneGridSession,
    allWidgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    if (!masterWidgetId || !allWidgets) return allWidgets || [];
    const target = allWidgets.find((w) => w.id === masterWidgetId);
    const resolvedMasterId =
      target?.customSettings?.["gridMasterId"] || masterWidgetId;
    const filtered = allWidgets.filter((w) => {
      if (w.id === resolvedMasterId) return false;
      if (
        w.customSettings?.["gridId"] === session?.gridId &&
        w.customSettings?.["gridMasterId"] === resolvedMasterId
      ) {
        return false;
      }
      if (w.id.startsWith(`${resolvedMasterId}_grid_lane_`)) {
        return false;
      }
      if (w.id === `${resolvedMasterId}_grid_header`) {
        return false;
      }
      return true;
    });

    if (session?.gridId && !this.hasGridWidgets(filtered, session.gridId)) {
      return this.removeGrid(filtered, session.gridId);
    }

    return filtered;
  }

  public static calculateGridBounds(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
  ): LaneGridBounds | null {
    return LaneGridGeometryHelper.calculateGridBounds(widgets, gridId);
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
        delete nextSettings["gridBounds"];
        delete nextSettings["gridMasterId"];
        delete nextSettings["cellWidthRatio"];
        delete nextSettings["cellHeightRatio"];
        delete nextSettings["cellOffsetXRatio"];
        delete nextSettings["cellOffsetYRatio"];
        delete nextSettings["headerPlacement"];
        delete nextSettings["headerHeight"];
        delete nextSettings["linkColumns"];
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
            gridBounds: { ...session.bounds },
            headerPlacement: session.headerPlacement ?? "individual",
            headerHeight: session.headerHeight ?? 36,
            linkColumns: session.linkColumns ?? true,
          },
        };
      }
      return w;
    });
  }

  public static syncCrossColumnProperty(
    gridId: string,
    propertyGroup: "header" | "value" | "border" | "time" | "highlight",
    sourceSettings: Record<string, any>,
    allWidgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      propertyGroup,
      sourceSettings,
      allWidgets,
    );
  }

  public static updateGridLinkColumns(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    link: boolean,
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.updateGridLinkColumns(allWidgets, gridId, link);
  }

  public static updateGridSortByBindingMode(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    sortByBindingMode: boolean,
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.updateGridSortByBindingMode(
      allWidgets,
      gridId,
      sortByBindingMode,
    );
  }

  public static updateGridLayoutOrientation(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    orientation: "vertical" | "horizontal",
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.updateGridLayoutOrientation(
      allWidgets,
      gridId,
      orientation,
    );
  }

  public static updateGridTotalLanes(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newTotalLanes: number,
    existingBounds?: LaneGridBounds | null,
  ): AbsoluteWidgetNode[] {
    if (
      !gridId ||
      !allWidgets ||
      newTotalLanes == null ||
      Number(newTotalLanes) <= 0
    ) {
      return allWidgets || [];
    }
    const validCount = Math.max(
      1,
      Math.min(32, Math.round(Number(newTotalLanes))),
    );
    const bounds =
      existingBounds || this.calculateGridBounds(allWidgets, gridId);
    if (!bounds) return allWidgets;

    const gridWidgets = allWidgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return allWidgets;
    const first = gridWidgets[0];

    const session: LaneGridSession = {
      gridId,
      bounds,
      totalLanes: validCount,
      direction: first.customSettings?.["gridDirection"] || "vertical",
      sourceLaneIndex: 0,
      bindingMode: first.customSettings?.["bindingMode"] || "lane",
      headerPlacement:
        first.customSettings?.["headerPlacement"] || "individual",
      headerHeight: Number(first.customSettings?.["headerHeight"]) || 36,
      linkColumns: first.customSettings?.["linkColumns"] !== false,
      sortByBindingMode: first.customSettings?.["sortByBindingMode"] !== false,
      layoutOrientation:
        first.customSettings?.["layoutOrientation"] || "vertical",
    };

    const synced = this.syncAllMasterWidgetsToLanes(session, allWidgets);
    return this.bakeGrid(synced, session);
  }

  public static getGridDataCount(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
    parent: any,
  ): number {
    return LaneGridScrollHelper.getGridDataCount(widgets, gridId, parent);
  }

  public static generateScrollableGridWidgets(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    dataCount: number,
  ): AbsoluteWidgetNode[] {
    return LaneGridScrollHelper.generateScrollableGridWidgets(
      allWidgets,
      gridId,
      dataCount,
    );
  }

  public static updateGridHeaderHeight(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newHeight: number,
  ): AbsoluteWidgetNode[] {
    return LaneGridHeaderHelper.updateGridHeaderHeight(
      allWidgets,
      gridId,
      newHeight,
    );
  }

  public static updateGridHeaderPlacement(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newPlacement: "top" | "individual" | "none",
    headerHeight?: number,
  ): AbsoluteWidgetNode[] {
    return LaneGridHeaderHelper.updateGridHeaderPlacement(
      allWidgets,
      gridId,
      newPlacement,
      headerHeight,
    );
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
    return LaneGridGeometryHelper.calculateAvailableGridBounds(
      sourceWidgets,
      allWidgets,
      baseWidth,
      baseHeight,
      direction,
      replaceExisting,
      sourceBindingMode,
      sourceIndex,
      targetCount,
      gridId,
    );
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
    return LaneGridGeometryHelper.resizeGridBounds(
      current,
      handle,
      deltaX,
      deltaY,
      baseWidth,
      baseHeight,
      minWidth,
      minHeight,
      snapEdgesX,
      snapEdgesY,
      snapThreshold,
    );
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
    return LaneGridGeometryHelper.moveGridBounds(
      current,
      deltaX,
      deltaY,
      baseWidth,
      baseHeight,
      snapEdgesX,
      snapEdgesY,
      snapThreshold,
    );
  }
}
