import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import { LaneGridHeaderHelper } from "./lane-grid-header.helper";
import {
  GridLabelConfig,
  GridLabelPosition,
  LaneGridLabelHelper,
} from "./lane-grid-label.helper";
import { LaneGridScrollHelper } from "./lane-grid-scroll.helper";
import { LaneGridStyleHelper } from "./lane-grid-style.helper";

export type { GridLabelConfig, GridLabelPosition };

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
  gridLabelPosition?: GridLabelPosition;
  gridLabelText?: string;
  gridLabelSize?: number;
  gridLabelFontFamily?: string;
  gridLabelFontSize?: number;
  gridLabelTextColor?: string;
  gridLabelBackgroundColor?: string;
  gridLabelFontBold?: boolean;
  gridLabelFontItalic?: boolean;
  gridLabelAlignment?: "left" | "center" | "right";
  gridLabelShowBorder?: boolean;
  gridLabelBorderColor?: string;
  gridLabelBorderWidth?: number;
  gridLabelBorderRadius?: number;
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
    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(session);
    if (session.headerPlacement === "top") {
      const headerH =
        session.headerHeight != null ? Math.max(20, session.headerHeight) : 36;
      const availH = Math.max(0, dataBounds.height - headerH);
      return session.direction === "horizontal"
        ? dataBounds.width / session.totalLanes
        : availH / session.totalLanes;
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

    if (session.headerPlacement === "top") {
      dividers.push(Math.round(dataBounds.y + headerH));
    }
    if (session.totalLanes <= 1) return dividers;

    const pitch = this.computePitch(session);
    const base =
      session.direction === "horizontal"
        ? dataBounds.x
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

    if (session.direction === "horizontal") {
      return {
        x: Math.round(dataBounds.x + laneIndex * pitch),
        y: Math.round(dataBounds.y + headerH),
        width: Math.round(pitch),
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
    const headerH =
      session.headerHeight != null ? Math.max(20, session.headerHeight) : 36;
    return {
      x: dataBounds.x,
      y: dataBounds.y,
      width: dataBounds.width,
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
    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(session);
    const updatedHeader: AbsoluteWidgetNode = {
      ...masterWidget,
      y: dataBounds.y,
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
    LaneGridGeometryHelper.updateWidgetCellRatios(widget, session, masterCell);
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

      const dataBounds = LaneGridLabelHelper.computeGridDataBounds(session);
      const headerWidget: AbsoluteWidgetNode = {
        ...deepCopy(updatedMaster),
        id: existingHeaderIdx >= 0 ? result[existingHeaderIdx].id : headerId,
        x: updatedMaster.x,
        y: dataBounds.y,
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
        gridLabelPosition: session.gridLabelPosition || "none",
        gridLabelText: session.gridLabelText || "",
        gridLabelSize: session.gridLabelSize || 40,
        gridLabelFontFamily: session.gridLabelFontFamily || "",
        gridLabelFontSize: session.gridLabelFontSize || 18,
        gridLabelTextColor: session.gridLabelTextColor || "#ffffff",
        gridLabelBackgroundColor:
          session.gridLabelBackgroundColor || "rgba(15, 23, 42, 0.85)",
        gridLabelFontBold: session.gridLabelFontBold !== false,
        gridLabelFontItalic: Boolean(session.gridLabelFontItalic),
        gridLabelAlignment: session.gridLabelAlignment || "center",
        gridLabelShowBorder: Boolean(session.gridLabelShowBorder),
        gridLabelBorderColor: session.gridLabelBorderColor || "",
        gridLabelBorderWidth:
          session.gridLabelBorderWidth != null
            ? session.gridLabelBorderWidth
            : 1,
        gridLabelBorderRadius:
          session.gridLabelBorderRadius != null
            ? session.gridLabelBorderRadius
            : 4,
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
    } = LaneGridGeometryHelper.resolveCellRatios(
      masterWidget,
      session,
      masterCell,
      headerHeight,
    );

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
            gridLabelPosition: session.gridLabelPosition || "none",
            gridLabelText: session.gridLabelText || "",
            gridLabelSize: session.gridLabelSize || 40,
            gridLabelFontFamily: session.gridLabelFontFamily || "",
            gridLabelFontSize: session.gridLabelFontSize || 18,
            gridLabelTextColor: session.gridLabelTextColor || "#ffffff",
            gridLabelBackgroundColor:
              session.gridLabelBackgroundColor || "rgba(15, 23, 42, 0.85)",
            gridLabelFontBold: session.gridLabelFontBold !== false,
            gridLabelFontItalic: Boolean(session.gridLabelFontItalic),
            gridLabelAlignment: session.gridLabelAlignment || "center",
            gridLabelShowBorder: Boolean(session.gridLabelShowBorder),
            gridLabelBorderColor: session.gridLabelBorderColor || "",
            gridLabelBorderWidth:
              session.gridLabelBorderWidth != null
                ? session.gridLabelBorderWidth
                : 1,
            gridLabelBorderRadius:
              session.gridLabelBorderRadius != null
                ? session.gridLabelBorderRadius
                : 4,
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
      gridLabelPosition: first.customSettings?.["gridLabelPosition"] || "none",
      gridLabelText: first.customSettings?.["gridLabelText"] || "",
      gridLabelSize: Number(first.customSettings?.["gridLabelSize"]) || 40,
      gridLabelFontFamily: first.customSettings?.["gridLabelFontFamily"] || "",
      gridLabelFontSize:
        Number(first.customSettings?.["gridLabelFontSize"]) || 18,
      gridLabelTextColor:
        first.customSettings?.["gridLabelTextColor"] || "#ffffff",
      gridLabelBackgroundColor:
        first.customSettings?.["gridLabelBackgroundColor"] ||
        "rgba(15, 23, 42, 0.85)",
      gridLabelFontBold: first.customSettings?.["gridLabelFontBold"] !== false,
      gridLabelFontItalic: Boolean(
        first.customSettings?.["gridLabelFontItalic"],
      ),
      gridLabelAlignment:
        first.customSettings?.["gridLabelAlignment"] || "center",
      gridLabelShowBorder: Boolean(
        first.customSettings?.["gridLabelShowBorder"],
      ),
      gridLabelBorderColor:
        first.customSettings?.["gridLabelBorderColor"] || "",
      gridLabelBorderWidth:
        first.customSettings?.["gridLabelBorderWidth"] != null
          ? Number(first.customSettings["gridLabelBorderWidth"])
          : 1,
      gridLabelBorderRadius:
        first.customSettings?.["gridLabelBorderRadius"] != null
          ? Number(first.customSettings["gridLabelBorderRadius"])
          : 4,
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

  public static updateGridLabel(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    config: GridLabelConfig,
  ): AbsoluteWidgetNode[] {
    return LaneGridLabelHelper.updateGridLabelSettings(
      allWidgets,
      gridId,
      config,
    );
  }
}
