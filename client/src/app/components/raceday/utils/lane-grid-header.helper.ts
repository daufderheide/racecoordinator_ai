import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import { LaneGridBounds } from "./lane-grid-replication.helper";

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
}
