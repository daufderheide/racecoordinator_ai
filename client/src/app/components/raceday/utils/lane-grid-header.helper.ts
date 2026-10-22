import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import { LaneGridLabelHelper } from "./lane-grid-label.helper";
import {
  LaneGridBounds,
  LaneGridSession,
} from "./lane-grid-replication.helper";

export class LaneGridHeaderHelper {
  public static getHeaderWidgetId(masterId: string): string {
    return `${masterId}_grid_header`;
  }

  public static updateGridHeaderHeight(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newHeight: number,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    const height = Math.max(20, Math.min(200, Number(newHeight) || 36));
    const bounds = LaneGridGeometryHelper.calculateGridBounds(
      allWidgets,
      gridId,
    );
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

  public static createMissingGridTopHeaders(
    result: AbsoluteWidgetNode[],
    gridId: string,
    bounds: LaneGridBounds,
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
        headerSettings["useLaneColors"] = false;
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

  public static applyTopHeaderPlacement(
    result: AbsoluteWidgetNode[],
    gridId: string,
    bounds: LaneGridBounds,
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

  public static applyNonTopHeaderPlacement(
    result: AbsoluteWidgetNode[],
    gridId: string,
    bounds: LaneGridBounds,
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
        const newX =
          direction === "horizontal"
            ? Math.round(bounds.x + laneIndex * pitch)
            : w.x;
        const isLastLane = laneIndex === totalLanes - 1;
        const newW =
          direction === "horizontal"
            ? isLastLane
              ? Math.max(10, bounds.x + bounds.width - newX)
              : Math.round(pitch)
            : w.width;
        const newY =
          direction === "vertical"
            ? Math.round(bounds.y + laneIndex * pitch)
            : w.y;
        const newH = direction === "vertical" ? Math.round(pitch) : w.height;

        return {
          ...w,
          x: newX,
          y: newY,
          width: newW,
          height: newH,
          customSettings: {
            ...(w.customSettings || {}),
            showHeader,
            headerPlacement: newPlacement,
          },
        };
      });
  }

  public static createMissingGridLeftHeaders(
    result: AbsoluteWidgetNode[],
    gridId: string,
    bounds: LaneGridBounds,
    width: number,
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
        headerSettings["headerPlacement"] = "left";
        headerSettings["headerWidth"] = width;
        headerSettings["gridMasterId"] = master.id;
        headerSettings["gridId"] = gridId;
        headerSettings["useLaneColors"] = false;
        headerSettings["showBorder"] = true;
        headerSettings["borderColor"] =
          headerSettings["borderColor"] || "rgba(255, 255, 255, 0.4)";
        headerSettings["borderWidth"] = headerSettings["borderWidth"] ?? 1;
        headerSettings["borderRadius"] = 0;
        delete headerSettings["targetIndex"];
        delete headerSettings["gridLane"];

        const headerWidget: AbsoluteWidgetNode = {
          ...deepCopy(master),
          id: headerId,
          x: bounds.x,
          y: master.y,
          width,
          height: master.height,
          zIndex: (master.zIndex ?? 10) + 1,
          customSettings: headerSettings,
        };
        result.push(headerWidget);
      }
    }
  }

  public static applyLeftHeaderPlacement(
    result: AbsoluteWidgetNode[],
    gridId: string,
    bounds: LaneGridBounds,
    width: number,
    direction: "horizontal" | "vertical",
    totalLanes: number,
    sourceLaneIndex: number,
  ): AbsoluteWidgetNode[] {
    this.createMissingGridLeftHeaders(
      result,
      gridId,
      bounds,
      width,
      sourceLaneIndex,
    );

    const availW = Math.max(0, bounds.width - width);
    const pitch =
      direction === "horizontal"
        ? availW / totalLanes
        : bounds.width / totalLanes;

    return result.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;
      if (w.customSettings?.["isHeaderWidget"]) {
        return {
          ...w,
          x: bounds.x,
          width,
          customSettings: {
            ...(w.customSettings || {}),
            headerPlacement: "left",
            headerWidth: width,
            showHeader: true,
          },
        };
      }

      const laneIndex = Number(
        w.customSettings?.["gridLane"] ??
          w.customSettings?.["targetIndex"] ??
          0,
      );
      const newX =
        direction === "horizontal"
          ? Math.round(bounds.x + width + laneIndex * pitch)
          : w.x;
      const isLastLane = laneIndex === totalLanes - 1;
      const newW =
        direction === "horizontal"
          ? isLastLane
            ? Math.max(10, bounds.x + bounds.width - newX)
            : Math.round(pitch)
          : w.width;

      return {
        ...w,
        x: newX,
        width: newW,
        customSettings: {
          ...(w.customSettings || {}),
          showHeader: false,
          headerPlacement: "left",
          headerWidth: width,
        },
      };
    });
  }

  public static updateGridHeaderWidth(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newWidth: number,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    const width = Math.max(40, Math.min(600, Number(newWidth) || 200));
    const bounds = LaneGridGeometryHelper.calculateGridBounds(
      allWidgets,
      gridId,
    );
    if (!bounds) return allWidgets;

    const gridWidgets = allWidgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    const first = gridWidgets[0];
    const totalLanes = Number(first?.customSettings?.["gridTotalLanes"]) || 4;
    const direction = first?.customSettings?.["gridDirection"] || "horizontal";
    const headerPlacement =
      first?.customSettings?.["headerPlacement"] || "individual";

    if (headerPlacement !== "left") {
      return allWidgets.map((w) => {
        if (w.customSettings?.["gridId"] === gridId) {
          return {
            ...w,
            customSettings: {
              ...(w.customSettings || {}),
              headerWidth: width,
            },
          };
        }
        return w;
      });
    }

    const availW = Math.max(0, bounds.width - width);
    const pitch =
      direction === "horizontal"
        ? availW / totalLanes
        : bounds.width / totalLanes;

    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;

      if (w.customSettings?.["isHeaderWidget"]) {
        return {
          ...w,
          x: bounds.x,
          width,
          customSettings: {
            ...(w.customSettings || {}),
            headerWidth: width,
          },
        };
      }

      if (direction === "horizontal") {
        const laneIndex = Number(
          w.customSettings?.["gridLane"] ??
            w.customSettings?.["targetIndex"] ??
            0,
        );
        const newX = Math.round(bounds.x + width + laneIndex * pitch);
        const isLastLane = laneIndex === totalLanes - 1;
        const newW = isLastLane
          ? Math.max(10, bounds.x + bounds.width - newX)
          : Math.round(pitch);
        return {
          ...w,
          x: newX,
          width: newW,
          customSettings: {
            ...(w.customSettings || {}),
            headerWidth: width,
          },
        };
      }

      return {
        ...w,
        customSettings: {
          ...(w.customSettings || {}),
          headerWidth: width,
        },
      };
    });
  }

  public static updateGridHeaderPlacement(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    newPlacement: "top" | "individual" | "none" | "left",
    headerHeight?: number,
    headerWidth?: number,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];

    const height =
      headerHeight != null
        ? Math.max(20, Math.min(200, Number(headerHeight)))
        : 36;
    const width =
      headerWidth != null
        ? Math.max(40, Math.min(600, Number(headerWidth)))
        : 200;
    const bounds = LaneGridGeometryHelper.calculateGridBounds(
      allWidgets,
      gridId,
    );
    if (!bounds) return allWidgets;

    const gridWidgets = allWidgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    const first = gridWidgets[0];
    const totalLanes = Number(first?.customSettings?.["gridTotalLanes"]) || 4;
    const direction = first?.customSettings?.["gridDirection"] || "vertical";
    const sourceLaneIndex = 0;

    const result = allWidgets.filter((w) => {
      if (
        w.customSettings?.["gridId"] === gridId &&
        w.customSettings?.["isHeaderWidget"]
      ) {
        return newPlacement === "top" || newPlacement === "left";
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
    if (newPlacement === "left") {
      return this.applyLeftHeaderPlacement(
        result,
        gridId,
        bounds,
        width,
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

  public static syncPlacementHeaderWidget(
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
      this.syncTopPlacementHeader(
        masterWidget,
        updatedMaster,
        session,
        headerHeight,
        headerId,
        existingHeaderIdx,
        result,
      );
    } else if (session.headerPlacement === "left") {
      this.syncLeftPlacementHeader(
        masterWidget,
        updatedMaster,
        session,
        headerId,
        existingHeaderIdx,
        result,
      );
    } else if (existingHeaderIdx >= 0) {
      result.splice(existingHeaderIdx, 1);
    }
  }

  private static syncTopPlacementHeader(
    masterWidget: AbsoluteWidgetNode,
    updatedMaster: AbsoluteWidgetNode,
    session: LaneGridSession,
    headerHeight: number,
    headerId: string,
    existingHeaderIdx: number,
    result: AbsoluteWidgetNode[],
  ): void {
    const headerSettings = deepCopy(updatedMaster.customSettings || {});
    headerSettings["isHeaderWidget"] = true;
    headerSettings["showHeader"] = true;
    headerSettings["headerPlacement"] = "top";
    headerSettings["headerHeight"] = headerHeight;
    headerSettings["gridMasterId"] = masterWidget.id;
    headerSettings["gridId"] = session.gridId;
    headerSettings["useLaneColors"] = false;
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
        ...headerSettings,
        isHeaderWidget: true,
        showHeader: true,
        headerPlacement: "top",
        headerHeight,
        gridMasterId: masterWidget.id,
        gridId: session.gridId,
        useLaneColors: false,
      },
    };

    if (existingHeaderIdx >= 0) {
      result[existingHeaderIdx] = headerWidget;
    } else {
      result.push(headerWidget);
    }
  }

  private static syncLeftPlacementHeader(
    masterWidget: AbsoluteWidgetNode,
    updatedMaster: AbsoluteWidgetNode,
    session: LaneGridSession,
    headerId: string,
    existingHeaderIdx: number,
    result: AbsoluteWidgetNode[],
  ): void {
    const headerWidth =
      session.headerWidth != null ? Math.max(40, session.headerWidth) : 200;
    const headerSettings = deepCopy(updatedMaster.customSettings || {});
    headerSettings["isHeaderWidget"] = true;
    headerSettings["showHeader"] = true;
    headerSettings["headerPlacement"] = "left";
    headerSettings["headerWidth"] = headerWidth;
    headerSettings["gridMasterId"] = masterWidget.id;
    headerSettings["gridId"] = session.gridId;
    headerSettings["useLaneColors"] = false;
    headerSettings["showBorder"] = true;
    headerSettings["borderColor"] =
      headerSettings["borderColor"] || "rgba(255, 255, 255, 0.4)";
    headerSettings["borderWidth"] = headerSettings["borderWidth"] ?? 1;
    headerSettings["borderRadius"] = 0;
    delete headerSettings["targetIndex"];
    delete headerSettings["gridLane"];

    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(session);
    const headerWidget: AbsoluteWidgetNode = {
      ...deepCopy(updatedMaster),
      id: existingHeaderIdx >= 0 ? result[existingHeaderIdx].id : headerId,
      x: dataBounds.x,
      y: updatedMaster.y,
      width: headerWidth,
      height: updatedMaster.height,
      zIndex: (updatedMaster.zIndex ?? 10) + 1,
      customSettings: {
        ...headerSettings,
        isHeaderWidget: true,
        showHeader: true,
        headerPlacement: "left",
        headerWidth,
        gridMasterId: masterWidget.id,
        gridId: session.gridId,
        useLaneColors: false,
      },
    };

    if (existingHeaderIdx >= 0) {
      result[existingHeaderIdx] = headerWidget;
    } else {
      result.push(headerWidget);
    }
  }
}
