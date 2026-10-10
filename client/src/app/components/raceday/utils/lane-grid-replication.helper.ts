import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";

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
    return `${masterId}_grid_header`;
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
        x: masterWidget.x,
        y: session.bounds.y,
        width: masterWidget.width,
        height: headerHeight,
        zIndex: (masterWidget.zIndex ?? 10) + 1,
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
    const offsetInCellX = masterWidget.x - masterCell.x;
    const offsetInCellY = masterWidget.y - masterCell.y;

    const effectiveBindingMode =
      (masterWidget.customSettings?.["bindingMode"] as any) ||
      session.bindingMode ||
      "lane";
    session.bindingMode = effectiveBindingMode;

    const showHeader = session.headerPlacement === "individual";

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
      if (w.id === `${masterWidgetId}_grid_header`) {
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
    if (!gridId || !sourceSettings || !allWidgets) return allWidgets || [];

    const headerKeys = [
      "headerFontFamily",
      "headerFontSize",
      "headerTextColor",
      "headerBackgroundColor",
      "headerAlignment",
      "headerHeight",
    ];
    const valueKeys = [
      "valueFontFamily",
      "valueFontSize",
      "valueTextColor",
      "valueAlignment",
    ];
    const borderKeys = [
      "showBorder",
      "borderColor",
      "borderWidth",
      "borderRadius",
      "useLaneColors",
      "backgroundColor",
      "textColor",
    ];
    const highlightKeys = ["highlightRowOnLap"];
    const timeKeys = [
      "timeDecimalPlaces",
      "timeDisplayFormat",
      "timeSubsecondMode",
      "timeSubsecondThreshold",
      "timeSubsecondDecimals",
    ];

    let targetKeys: string[] = [];
    if (propertyGroup === "header") targetKeys = headerKeys;
    else if (propertyGroup === "value") targetKeys = valueKeys;
    else if (propertyGroup === "border") targetKeys = borderKeys;
    else if (propertyGroup === "highlight") targetKeys = highlightKeys;
    else if (propertyGroup === "time") targetKeys = timeKeys;

    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;
      if (propertyGroup === "value" && w.customSettings?.["isHeaderWidget"]) {
        return w;
      }

      const nextSettings = { ...(w.customSettings || {}) };
      for (const k of targetKeys) {
        if (sourceSettings[k] !== undefined) {
          nextSettings[k] = sourceSettings[k];
        } else if (sourceSettings["_reset_" + k]) {
          delete nextSettings[k];
        }
      }
      return {
        ...w,
        customSettings: nextSettings,
      };
    });
  }

  public static updateGridLinkColumns(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    link: boolean,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            linkColumns: link,
          },
        };
      }
      return w;
    });
  }

  public static updateGridLayoutOrientation(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    orientation: "vertical" | "horizontal",
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    const validOrientation =
      orientation === "horizontal" ? "horizontal" : "vertical";
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            layoutOrientation: validOrientation,
          },
        };
      }
      return w;
    });
  }

  public static updateGridHeaderHeight(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newHeight: number,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    const height = Math.max(20, Math.min(200, Number(newHeight) || 36));
    const bounds = this.calculateGridBounds(allWidgets, gridId);
    if (!bounds) return allWidgets;

    const gridWidgets = allWidgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    const first = gridWidgets[0];
    const totalLanes = Number(first?.customSettings?.["gridTotalLanes"]) || 4;
    const direction = first?.customSettings?.["gridDirection"] || "vertical";
    const headerPlacement =
      first?.customSettings?.["headerPlacement"] || "individual";

    if (headerPlacement !== "top") {
      return allWidgets.map((w) => {
        if (w.customSettings?.["gridId"] === gridId) {
          return {
            ...w,
            customSettings: {
              ...(w.customSettings || {}),
              headerHeight: height,
            },
          };
        }
        return w;
      });
    }

    const availH = Math.max(0, bounds.height - height);
    const pitch =
      direction === "horizontal"
        ? bounds.width / totalLanes
        : availH / totalLanes;

    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;

      if (w.customSettings?.["isHeaderWidget"]) {
        return {
          ...w,
          y: bounds.y,
          height,
          customSettings: {
            ...(w.customSettings || {}),
            headerHeight: height,
          },
        };
      }

      if (direction === "vertical") {
        const laneIndex = Number(
          w.customSettings?.["gridLane"] ??
            w.customSettings?.["targetIndex"] ??
            0,
        );
        const newY = Math.round(bounds.y + height + laneIndex * pitch);
        const newH = Math.round(pitch);
        return {
          ...w,
          y: newY,
          height: newH,
          customSettings: {
            ...(w.customSettings || {}),
            headerHeight: height,
          },
        };
      }

      return {
        ...w,
        customSettings: {
          ...(w.customSettings || {}),
          headerHeight: height,
        },
      };
    });
  }

  private static createMissingGridTopHeaders(
    result: AbsoluteWidgetNode[],
    gridId: string,
    bounds: { x: number; y: number; width: number; height: number },
    height: number,
    sourceLaneIndex: number,
  ): void {
    const dataWidgets = result.filter(
      (w) =>
        w.customSettings?.["gridId"] === gridId &&
        !w.customSettings?.["isHeaderWidget"],
    );

    const masterWidgets = dataWidgets.filter((w) => {
      const lane = Number(
        w.customSettings?.["gridLane"] ??
          w.customSettings?.["targetIndex"] ??
          0,
      );
      return lane === sourceLaneIndex;
    });

    for (const master of masterWidgets) {
      const headerId = this.getHeaderWidgetId(master.id);
      const exists = result.some(
        (w) =>
          w.id === headerId ||
          (w.customSettings?.["gridMasterId"] === master.id &&
            w.customSettings?.["isHeaderWidget"]),
      );
      if (!exists) {
        const headerSettings = deepCopy(master.customSettings || {});
        headerSettings["isHeaderWidget"] = true;
        headerSettings["showHeader"] = true;
        headerSettings["headerPlacement"] = "top";
        headerSettings["headerHeight"] = height;
        headerSettings["gridMasterId"] = master.id;
        headerSettings["gridId"] = gridId;
        delete headerSettings["targetIndex"];
        delete headerSettings["gridLane"];

        const headerWidget: AbsoluteWidgetNode = {
          ...deepCopy(master),
          id: headerId,
          x: master.x,
          y: bounds.y,
          width: master.width,
          height,
          zIndex: (master.zIndex ?? 10) + 1,
          customSettings: headerSettings,
        };
        result.push(headerWidget);
      }
    }
  }

  private static applyTopHeaderPlacement(
    result: AbsoluteWidgetNode[],
    gridId: string,
    bounds: { x: number; y: number; width: number; height: number },
    height: number,
    direction: "horizontal" | "vertical",
    totalLanes: number,
    sourceLaneIndex: number,
  ): AbsoluteWidgetNode[] {
    this.createMissingGridTopHeaders(
      result,
      gridId,
      bounds,
      height,
      sourceLaneIndex,
    );

    const availH = Math.max(0, bounds.height - height);
    const pitch =
      direction === "horizontal"
        ? bounds.width / totalLanes
        : availH / totalLanes;

    return result.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;
      if (w.customSettings?.["isHeaderWidget"]) {
        return {
          ...w,
          y: bounds.y,
          height,
          customSettings: {
            ...(w.customSettings || {}),
            headerPlacement: "top",
            headerHeight: height,
            showHeader: true,
          },
        };
      }

      const laneIndex = Number(
        w.customSettings?.["gridLane"] ??
          w.customSettings?.["targetIndex"] ??
          0,
      );
      const newY =
        direction === "vertical"
          ? Math.round(bounds.y + height + laneIndex * pitch)
          : Math.round(bounds.y + height);
      const newH =
        direction === "vertical" ? Math.round(pitch) : Math.round(availH);

      return {
        ...w,
        y: newY,
        height: newH,
        customSettings: {
          ...(w.customSettings || {}),
          showHeader: false,
          headerPlacement: "top",
          headerHeight: height,
        },
      };
    });
  }

  private static applyNonTopHeaderPlacement(
    result: AbsoluteWidgetNode[],
    gridId: string,
    bounds: { x: number; y: number; width: number; height: number },
    direction: "horizontal" | "vertical",
    totalLanes: number,
    newPlacement: "individual" | "none",
  ): AbsoluteWidgetNode[] {
    const showHeader = newPlacement === "individual";
    const pitch =
      direction === "horizontal"
        ? bounds.width / totalLanes
        : bounds.height / totalLanes;

    return result
      .filter(
        (w) =>
          !(
            w.customSettings?.["gridId"] === gridId &&
            w.customSettings?.["isHeaderWidget"]
          ),
      )
      .map((w) => {
        if (w.customSettings?.["gridId"] !== gridId) return w;

        const laneIndex = Number(
          w.customSettings?.["gridLane"] ??
            w.customSettings?.["targetIndex"] ??
            0,
        );
        const newY =
          direction === "vertical"
            ? Math.round(bounds.y + laneIndex * pitch)
            : bounds.y;
        const newH =
          direction === "vertical" ? Math.round(pitch) : bounds.height;

        return {
          ...w,
          y: newY,
          height: newH,
          customSettings: {
            ...(w.customSettings || {}),
            showHeader,
            headerPlacement: newPlacement,
          },
        };
      });
  }

  public static updateGridHeaderPlacement(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newPlacement: "top" | "individual" | "none",
    headerHeight?: number,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];

    const height =
      headerHeight != null
        ? Math.max(20, Math.min(200, Number(headerHeight)))
        : 36;
    const bounds = this.calculateGridBounds(allWidgets, gridId);
    if (!bounds) return allWidgets;

    const gridWidgets = allWidgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    const first = gridWidgets[0];
    const totalLanes = Number(first?.customSettings?.["gridTotalLanes"]) || 4;
    const direction = first?.customSettings?.["gridDirection"] || "vertical";
    const sourceLaneIndex = 0;

    let result = allWidgets.filter((w) => {
      if (
        w.customSettings?.["gridId"] === gridId &&
        w.customSettings?.["isHeaderWidget"]
      ) {
        return newPlacement === "top";
      }
      return true;
    });

    if (newPlacement === "top") {
      return this.applyTopHeaderPlacement(
        result,
        gridId,
        bounds,
        height,
        direction,
        totalLanes,
        sourceLaneIndex,
      );
    }
    return this.applyNonTopHeaderPlacement(
      result,
      gridId,
      bounds,
      direction,
      totalLanes,
      newPlacement,
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
}
