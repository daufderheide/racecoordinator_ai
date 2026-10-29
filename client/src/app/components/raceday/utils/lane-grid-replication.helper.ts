import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridCleanupHelper } from "./lane-grid-cleanup.helper";
import { LaneGridDetachHelper } from "./lane-grid-detach.helper";
import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import { LaneGridHeaderHelper } from "./lane-grid-header.helper";
import {
  GridLabelConfig,
  GridLabelPosition,
  LaneGridLabelHelper,
} from "./lane-grid-label.helper";
import { LaneGridScrollHelper } from "./lane-grid-scroll.helper";
import { LaneGridSelectionHelper } from "./lane-grid-selection.helper";
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
  gridType?: "heat" | "overall";
  emptyRowsMode?: "remove" | "empty" | "blank";
  headerPlacement?: "top" | "individual" | "none" | "left";
  headerHeight?: number;
  headerWidth?: number;
  linkColumns?: boolean;
  mirrorRows?: boolean;
  startRowOffset?: number;
  sortByBindingMode?: boolean;
  layoutOrientation?: "vertical" | "horizontal";
  useLaneColors?: boolean;
  backgroundColor?: string;
  textColor?: string;
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
    return LaneGridGeometryHelper.computePitch(session);
  }

  public static computeGridDividers(session: LaneGridSession): number[] {
    return LaneGridGeometryHelper.computeGridDividers(session);
  }

  public static computeMasterBounds(session: LaneGridSession): LaneGridBounds {
    return LaneGridGeometryHelper.computeMasterBounds(session);
  }

  public static computeLaneCellBounds(
    session: LaneGridSession,
    laneIndex: number,
  ): LaneGridBounds {
    return LaneGridGeometryHelper.computeLaneCellBounds(session, laneIndex);
  }

  public static computeHeaderRowBounds(
    session: LaneGridSession,
  ): LaneGridBounds {
    return LaneGridGeometryHelper.computeHeaderRowBounds(session);
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
      if (s?.["gridMasterId"] && s?.["gridMasterId"] !== widget.id)
        return false;
      if (widget.id.includes("_grid_lane_")) return false;
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
    const isHorizontal =
      session.direction === "horizontal" ||
      session.layoutOrientation === "horizontal";
    const isLanesMirrored = isHorizontal
      ? session.linkColumns !== false
      : session.mirrorRows !== false;

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
      clonedSettings["mirrorRows"] = session.mirrorRows !== false;
      clonedSettings["linkColumns"] = session.linkColumns !== false;
      clonedSettings["bindingMode"] = effectiveBindingMode;
      clonedSettings["showHeader"] = showHeader;
      clonedSettings["isHeaderWidget"] = false;
      clonedSettings["gridType"] = session.gridType || "heat";
      clonedSettings["startRowOffset"] =
        updatedMaster.customSettings?.["startRowOffset"] ??
        session.startRowOffset ??
        1;

      if (!isLanesMirrored && existingIndex >= 0) {
        const existing = result[existingIndex];
        result[existingIndex] = {
          ...existing,
          x: existing.x,
          y: existing.y,
          width: existing.width,
          height: existing.height,
          customSettings: {
            ...(existing.customSettings || {}),
            targetIndex: k,
            gridLane: k,
            mirrorRows: session.mirrorRows !== false,
            startRowOffset:
              updatedMaster.customSettings?.["startRowOffset"] ??
              session.startRowOffset ??
              1,
            linkColumns: session.linkColumns !== false,
            bindingMode: effectiveBindingMode,
            showHeader,
            isHeaderWidget: false,
            gridType: session.gridType || "heat",
          },
        };
      } else {
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
        gridType: session.gridType || "heat",
        emptyRowsMode:
          session.emptyRowsMode ||
          masterWidget.customSettings?.["emptyRowsMode"] ||
          (session.gridType === "overall" ||
          session.bindingMode === "seed" ||
          session.bindingMode === "overallPosition"
            ? "remove"
            : "empty"),
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
        gridLabelShowBorder: session.gridLabelShowBorder !== false,
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
    if (!isHeader && !masterWidget.customSettings?.["gridId"]) {
      LaneGridStyleHelper.inheritGridStyles(masterWidget, session, allWidgets);
    }
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
    const ratios = LaneGridGeometryHelper.resolveCellRatios(
      masterWidget,
      session,
      masterCell,
      headerHeight,
    );

    const { targetBounds, offsetInCellX, offsetInCellY } =
      LaneGridGeometryHelper.computeMasterGeometry(session, masterCell, ratios);

    const effectiveBindingMode =
      (masterWidget.customSettings?.["bindingMode"] as any) ||
      session.bindingMode ||
      "lane";
    session.bindingMode = effectiveBindingMode;

    const showHeader = session.headerPlacement === "individual";

    const updatedMaster = this.buildUpdatedMaster(
      masterWidget,
      session,
      targetBounds,
      ratios,
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

    LaneGridHeaderHelper.syncPlacementHeaderWidget(
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
      if (
        w.widgetType === "lane-column" ||
        w.widgetType.startsWith("custom:")
      ) {
        if (w.customSettings?.["isHeaderWidget"]) return false;
        if (w.customSettings?.["gridMasterId"]) return false;
        if (
          w.customSettings?.["gridId"] &&
          w.customSettings["gridId"] !== session.gridId
        ) {
          return false;
        }
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

    if (!session.bindingMode) {
      const bindingModeOverride = masterWidgets.find(
        (m) => m.customSettings?.["bindingMode"],
      )?.customSettings?.["bindingMode"];
      session.bindingMode = (bindingModeOverride as any) || "lane";
    }
    if (!session.gridType) {
      session.gridType = this.resolveGridTypeForMasterWidgets(masterWidgets);
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
            (session.headerPlacement === "top" ||
              session.headerPlacement === "left") &&
            Boolean(masterId && masterIds.has(masterId))
          );
        }
        const isMaster =
          Number(w.customSettings?.["gridLane"]) === session.sourceLaneIndex;
        if (!isMaster) {
          const masterId = w.customSettings?.["gridMasterId"];
          const lane = Number(w.customSettings?.["gridLane"]);
          if (lane >= session.totalLanes) return false;
          return Boolean(masterId && masterIds.has(masterId));
        }
      }
      return true;
    });

    return LaneGridCleanupHelper.cleanOrphanedGridWidgets(currentWidgets);
  }

  private static resolveGridTypeForMasterWidgets(
    masterWidgets: AbsoluteWidgetNode[],
  ): "heat" | "overall" {
    const anyOverall = masterWidgets.some(
      (m) => m.customSettings?.["gridType"] === "overall",
    );
    if (anyOverall) {
      return "overall";
    }
    const anyHeat = masterWidgets.some(
      (m) => m.customSettings?.["gridType"] === "heat",
    );
    if (anyHeat) {
      return "heat";
    }
    const anyLegacyOverall = masterWidgets.some(
      (m) =>
        !m.customSettings?.["gridType"] &&
        m.customSettings?.["bindingMode"] === "overallPosition",
    );
    if (anyLegacyOverall) {
      return "overall";
    }
    return "heat";
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
      if (w.id === masterWidgetId || w.id === resolvedMasterId) return false;
      if (
        (w.customSettings?.["gridId"] === session?.gridId ||
          !session?.gridId) &&
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

    const cleaned = LaneGridCleanupHelper.cleanOrphanedGridWidgets(filtered);
    if (session?.gridId && !this.hasGridWidgets(cleaned, session.gridId)) {
      return this.removeGrid(cleaned, session.gridId);
    }

    return cleaned;
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
    return LaneGridDetachHelper.detachGrid(widgets, gridId);
  }

  public static cleanOrphanedGridWidgets(
    widgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    return LaneGridCleanupHelper.cleanOrphanedGridWidgets(widgets);
  }

  public static findNextWidgetAfterDeletion(
    deletedId: string,
    widgetsBefore: AbsoluteWidgetNode[],
    widgetsAfter: AbsoluteWidgetNode[],
    session?: LaneGridSession | null,
  ): string | null {
    return LaneGridSelectionHelper.findNextWidgetAfterDeletion(
      deletedId,
      widgetsBefore,
      widgetsAfter,
      session,
    );
  }

  public static bakeGrid(
    widgets: AbsoluteWidgetNode[],
    session: LaneGridSession,
  ): AbsoluteWidgetNode[] {
    if (!widgets || !session) return widgets || [];
    let effectiveGridType: "heat" | "overall";
    if (session.gridType) {
      effectiveGridType = session.gridType;
    } else {
      const gridWidgets = widgets.filter(
        (w) => w.customSettings?.["gridId"] === session.gridId,
      );
      const anyOverall = gridWidgets.some(
        (w) => w.customSettings?.["gridType"] === "overall",
      );
      if (anyOverall) {
        effectiveGridType = "overall";
      } else {
        const anyHeat = gridWidgets.some(
          (w) => w.customSettings?.["gridType"] === "heat",
        );
        if (anyHeat) {
          effectiveGridType = "heat";
        } else {
          const anyLegacyOverall = gridWidgets.some(
            (w) =>
              !w.customSettings?.["gridType"] &&
              w.customSettings?.["bindingMode"] === "overallPosition",
          );
          if (anyLegacyOverall) {
            effectiveGridType = "overall";
          } else {
            effectiveGridType = "heat";
          }
        }
      }
    }
    const mapped = widgets.map((w) => {
      if (w.customSettings?.["gridId"] === session.gridId) {
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            gridId: session.gridId,
            gridTotalLanes: session.totalLanes,
            gridDirection:
              session.direction || session.layoutOrientation || "vertical",
            layoutOrientation:
              session.layoutOrientation || session.direction || "vertical",
            gridType: effectiveGridType,
            gridBounds: { ...session.bounds },
            headerPlacement: session.headerPlacement ?? "individual",
            headerHeight: session.headerHeight ?? 36,
            headerWidth: session.headerWidth ?? 200,
            linkColumns: session.linkColumns ?? true,
            mirrorRows: session.mirrorRows !== false,
            startRowOffset:
              session.startRowOffset ??
              w.customSettings?.["startRowOffset"] ??
              1,
            emptyRowsMode:
              session.emptyRowsMode ||
              w.customSettings?.["emptyRowsMode"] ||
              (session.gridType === "overall" ||
              session.bindingMode === "seed" ||
              session.bindingMode === "overallPosition"
                ? "remove"
                : "empty"),
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
            gridLabelShowBorder: session.gridLabelShowBorder !== false,
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
    return LaneGridCleanupHelper.cleanOrphanedGridWidgets(mapped);
  }

  public static syncCrossColumnProperty(
    gridId: string,
    propertyGroup: "header" | "value" | "border" | "time" | "highlight",
    sourceSettings: Record<string, any>,
    allWidgets: AbsoluteWidgetNode[],
    sourceWidgetId?: string,
    sourceScaleMode?: "auto" | "fixed" | "",
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      propertyGroup,
      sourceSettings,
      allWidgets,
      sourceWidgetId,
      sourceScaleMode,
    );
  }

  public static updateGridLinkColumns(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    link: boolean,
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.updateGridLinkColumns(allWidgets, gridId, link);
  }

  public static updateGridStartRowOffset(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    startRowOffset: number,
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.updateGridStartRowOffset(
      allWidgets,
      gridId,
      startRowOffset,
    );
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

  public static updateGridSortOrder(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    sortOrder: "lane" | "position" | "overallPosition" | "seed",
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.updateGridSortOrder(
      allWidgets,
      gridId,
      sortOrder,
    );
  }

  public static updateGridType(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    gridType: "heat" | "overall",
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.updateGridType(allWidgets, gridId, gridType);
  }

  public static updateGridEmptyRowsMode(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    emptyRowsMode: "remove" | "empty" | "blank",
  ): AbsoluteWidgetNode[] {
    return LaneGridStyleHelper.updateGridEmptyRowsMode(
      allWidgets,
      gridId,
      emptyRowsMode,
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
    const session = LaneGridStyleHelper.buildSessionFromGridWidgets(
      gridId,
      allWidgets,
      newTotalLanes,
      existingBounds,
    );
    if (!session) return allWidgets || [];

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
    newPlacement: "top" | "individual" | "none" | "left",
    headerHeight?: number,
    headerWidth?: number,
  ): AbsoluteWidgetNode[] {
    return LaneGridHeaderHelper.updateGridHeaderPlacement(
      allWidgets,
      gridId,
      newPlacement,
      headerHeight,
      headerWidth,
    );
  }

  public static updateGridHeaderWidth(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newWidth: number,
  ): AbsoluteWidgetNode[] {
    return LaneGridHeaderHelper.updateGridHeaderWidth(
      allWidgets,
      gridId,
      newWidth,
    );
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
    existingBounds?: LaneGridBounds | null,
  ): AbsoluteWidgetNode[] {
    const session = LaneGridLabelHelper.buildGridLabelSession(
      allWidgets,
      gridId,
      config,
      existingBounds,
    );
    if (!session) {
      return LaneGridLabelHelper.updateGridLabelSettings(
        allWidgets,
        gridId,
        config,
      );
    }

    const gridWidgets = allWidgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (
      LaneGridLabelHelper.shouldResyncForGridLabel(gridWidgets, session, config)
    ) {
      const synced = this.syncAllMasterWidgetsToLanes(session, allWidgets);
      return this.bakeGrid(synced, session);
    }

    return this.bakeGrid(
      LaneGridLabelHelper.updateGridLabelSettings(allWidgets, gridId, config),
      session,
    );
  }
}
