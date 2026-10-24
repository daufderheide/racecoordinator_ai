import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import { LaneGridLabelHelper } from "./lane-grid-label.helper";
import { LaneGridSession } from "./lane-grid-replication.helper";
import { RacedayLayoutUtils } from "./raceday-layout.utils";

export class LaneGridScrollHelper {
  private static extractGridMetadata(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
  ): {
    hasGridWidget: boolean;
    finalTotalLanes: number;
    explicitGridType?: string;
    mode: string;
  } {
    let hasGridWidget = false;
    let gridTotalLanes: number | null = null;
    let explicitGridType: string | undefined;
    let mode = "lane";
    let hasOverallSignals = false;

    for (let i = 0; i < widgets.length; i++) {
      const s = widgets[i]?.customSettings;
      if (s?.["gridId"] === gridId) {
        if (!hasGridWidget) {
          hasGridWidget = true;
          mode = s["bindingMode"] || "lane";
        }
        if (gridTotalLanes == null && s["gridTotalLanes"] != null) {
          gridTotalLanes = Number(s["gridTotalLanes"]);
        }
        if (s["gridType"] === "overall") {
          explicitGridType = "overall";
        } else if (s["gridType"] === "heat") {
          if (explicitGridType !== "overall") {
            explicitGridType = "heat";
          }
        } else if (
          s["bindingMode"] === "overallPosition" ||
          RacedayLayoutUtils.isOverallColumnKey(s["columnKey"])
        ) {
          hasOverallSignals = true;
        }
      }
    }
    if (!explicitGridType && hasOverallSignals) {
      explicitGridType = "overall";
    }
    return {
      hasGridWidget,
      finalTotalLanes: gridTotalLanes || 4,
      explicitGridType,
      mode,
    };
  }

  private static resolveDataCount(
    explicitGridType: string | undefined,
    mode: string,
    parent: any,
  ): number {
    if (explicitGridType === "overall") {
      return (
        parent?.race?.standings?.length ||
        parent?.raceStandings?.length ||
        parent?.participants?.length ||
        parent?.race?.participants?.length ||
        parent?.raceParticipants?.length ||
        0
      );
    }
    if (explicitGridType === "heat") {
      const heatCount =
        parent?.heat?.heatDrivers?.length ||
        parent?.heatDrivers?.length ||
        parent?.sortedHeatDrivers?.length ||
        parent?.heat?.standings?.length ||
        parent?.heatStandings?.length ||
        0;
      const trackCount =
        parent?.track?.lanes?.length ||
        parent?.currentTrack?.lanes?.length ||
        parent?.race?.track?.lanes?.length ||
        parent?.maxTrackLanes ||
        0;
      return Math.max(heatCount, trackCount);
    }
    if (mode === "lane") {
      return (
        parent?.track?.lanes?.length ||
        parent?.currentTrack?.lanes?.length ||
        parent?.race?.track?.lanes?.length ||
        parent?.maxTrackLanes ||
        0
      );
    }
    if (mode === "position") {
      return (
        parent?.heat?.standings?.length ||
        parent?.heatStandings?.length ||
        parent?.heat?.heatDrivers?.length ||
        parent?.heatDrivers?.length ||
        parent?.track?.lanes?.length ||
        parent?.currentTrack?.lanes?.length ||
        parent?.race?.track?.lanes?.length ||
        parent?.maxTrackLanes ||
        0
      );
    }
    if (mode === "overallPosition") {
      return (
        parent?.race?.standings?.length ||
        parent?.raceStandings?.length ||
        parent?.participants?.length ||
        parent?.race?.participants?.length ||
        parent?.raceParticipants?.length ||
        0
      );
    }
    if (mode === "seed") {
      return (
        parent?.race?.participants?.length ||
        parent?.participants?.length ||
        parent?.raceParticipants?.length ||
        0
      );
    }
    return 0;
  }

  public static getGridDataCount(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
    parent: any,
  ): number {
    if (!widgets || widgets.length === 0 || !gridId) return 0;

    const { hasGridWidget, finalTotalLanes, explicitGridType, mode } =
      this.extractGridMetadata(widgets, gridId);

    if (!hasGridWidget) return 0;

    const isEditor = Boolean(
      (typeof parent?.isUIEditorMode === "function"
        ? parent.isUIEditorMode()
        : parent?.isUIEditorMode) || parent?.isLayoutCustomizing,
    );
    if (isEditor) {
      return finalTotalLanes;
    }

    const count = this.resolveDataCount(explicitGridType, mode, parent);
    const isOverallOrSeed =
      explicitGridType === "overall" ||
      mode === "overallPosition" ||
      mode === "seed";
    if (isOverallOrSeed) {
      return count;
    }
    return count > 0 ? count : finalTotalLanes;
  }

  private static resolveExplicitGridType(
    gridWidgets: AbsoluteWidgetNode[],
  ): string | undefined {
    const hasExplicitOverall = gridWidgets.some(
      (w) => w.customSettings?.["gridType"] === "overall",
    );
    if (hasExplicitOverall) {
      return "overall";
    }
    const hasExplicitHeat = gridWidgets.some(
      (w) => w.customSettings?.["gridType"] === "heat",
    );
    if (hasExplicitHeat) {
      return "heat";
    }
    const hasOverallSignals = gridWidgets.some(
      (w) =>
        !w.customSettings?.["gridType"] &&
        (w.customSettings?.["bindingMode"] === "overallPosition" ||
          RacedayLayoutUtils.isOverallColumnKey(
            w.customSettings?.["columnKey"],
          )),
    );
    return hasOverallSignals
      ? "overall"
      : gridWidgets[0]?.customSettings?.["gridType"] || "heat";
  }

  private static filterOverallGridRows(
    gridWidgets: AbsoluteWidgetNode[],
    dataCount: number,
  ): AbsoluteWidgetNode[] {
    return gridWidgets.filter((w) => {
      if (w.customSettings?.["isHeaderWidget"]) return true;
      const lane = Number(
        w.customSettings?.["gridLane"] ??
          w.customSettings?.["targetIndex"] ??
          0,
      );
      return lane < dataCount;
    });
  }

  private static generateVirtualGridWidgets(
    allWidgets: AbsoluteWidgetNode[],
    gridWidgets: AbsoluteWidgetNode[],
    gridId: string,
    gridTotalLanes: number,
    dataCount: number,
    explicitGridType?: any,
  ): AbsoluteWidgetNode[] {
    const bounds = LaneGridGeometryHelper.calculateGridBounds(
      allWidgets,
      gridId,
    );
    if (!bounds) return gridWidgets;

    const first = gridWidgets[0];
    const direction = first.customSettings?.["gridDirection"] || "vertical";
    const headerPlacement =
      first.customSettings?.["headerPlacement"] || "individual";
    const headerHeight = Number(first.customSettings?.["headerHeight"]) || 36;
    const bindingMode = first.customSettings?.["bindingMode"] || "lane";
    const isSeed = gridWidgets.some(
      (w) => w.customSettings?.["bindingMode"] === "seed",
    );
    const isOverallOrSeed = explicitGridType === "overall" || isSeed;
    const defaultMode = isOverallOrSeed ? "remove" : "empty";
    const emptyRowsMode =
      first.customSettings?.["emptyRowsMode"] || defaultMode;

    const masterWidgets = gridWidgets.filter((w) => {
      if (w.customSettings?.["isHeaderWidget"]) return false;
      const lane = Number(
        w.customSettings?.["gridLane"] ??
          w.customSettings?.["targetIndex"] ??
          0,
      );
      return lane === 0;
    });

    const sessionLike: LaneGridSession = {
      gridId,
      bounds,
      totalLanes: gridTotalLanes,
      direction,
      sourceLaneIndex: 0,
      bindingMode,
      gridType: explicitGridType,
      emptyRowsMode,
      headerPlacement,
      headerHeight,
      gridLabelPosition: first.customSettings?.["gridLabelPosition"] || "none",
      gridLabelSize: Number(first.customSettings?.["gridLabelSize"]) || 40,
    };
    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(sessionLike);

    const availHeight =
      headerPlacement === "top"
        ? Math.max(0, dataBounds.height - headerHeight)
        : dataBounds.height;
    const pitch =
      direction === "horizontal"
        ? dataBounds.width / gridTotalLanes
        : availHeight / gridTotalLanes;

    const result = [...gridWidgets];
    for (let k = gridTotalLanes; k < dataCount; k++) {
      for (const master of masterWidgets) {
        result.push(
          this.createScrollableCellWidget(
            master,
            k,
            pitch,
            dataBounds,
            direction,
            headerPlacement,
            headerHeight,
            bindingMode,
            gridTotalLanes,
            explicitGridType,
          ),
        );
      }
    }

    return result;
  }

  public static generateScrollableGridWidgets(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    dataCount: number,
  ): AbsoluteWidgetNode[] {
    const gridWidgets = (allWidgets || []).filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return [];
    const first = gridWidgets[0];
    const gridTotalLanes =
      Number(first.customSettings?.["gridTotalLanes"]) || 4;

    const explicitGridType = this.resolveExplicitGridType(gridWidgets);
    const isSeed = gridWidgets.some(
      (w) => w.customSettings?.["bindingMode"] === "seed",
    );
    const isOverallOrSeed = explicitGridType === "overall" || isSeed;
    const defaultMode = isOverallOrSeed ? "remove" : "empty";
    const emptyRowsMode =
      (gridWidgets.find((w) => w.customSettings?.["emptyRowsMode"])
        ?.customSettings?.["emptyRowsMode"] as "remove" | "empty" | "blank") ||
      defaultMode;

    if (emptyRowsMode === "remove" && dataCount < gridTotalLanes) {
      return this.filterOverallGridRows(gridWidgets, dataCount);
    }

    if (dataCount <= gridTotalLanes) {
      return gridWidgets;
    }

    return this.generateVirtualGridWidgets(
      allWidgets,
      gridWidgets,
      gridId,
      gridTotalLanes,
      dataCount,
      explicitGridType,
    );
  }

  private static createScrollableCellWidget(
    master: AbsoluteWidgetNode,
    k: number,
    pitch: number,
    dataBounds: { x: number; y: number; width: number; height: number },
    direction: "horizontal" | "vertical",
    headerPlacement: string,
    headerHeight: number,
    bindingMode: string,
    gridTotalLanes: number,
    explicitGridType?: "heat" | "overall",
  ): AbsoluteWidgetNode {
    let cellX = master.x;
    let cellY = master.y;
    let cellW = master.width;
    let cellH = master.height;

    if (direction === "vertical") {
      cellY = Math.round(
        dataBounds.y +
          (headerPlacement === "top" ? headerHeight : 0) +
          k * pitch,
      );
      cellH = Math.round(pitch);
    } else {
      cellX = Math.round(dataBounds.x + k * pitch);
      cellW = Math.round(pitch);
    }

    const clonedSettings = deepCopy(master.customSettings || {});
    clonedSettings["targetIndex"] = k;
    clonedSettings["gridLane"] = k;
    clonedSettings["gridMasterId"] = master.id;
    clonedSettings["bindingMode"] = bindingMode;
    if (explicitGridType) {
      clonedSettings["gridType"] = explicitGridType;
    }
    clonedSettings["showHeader"] =
      headerPlacement !== "top" &&
      master.customSettings?.["showHeader"] !== false;
    clonedSettings["isHeaderWidget"] = false;
    clonedSettings["gridTotalLanes"] = gridTotalLanes;

    return {
      ...deepCopy(master),
      id: `${master.id}_grid_lane_${k}`,
      x: cellX,
      y: cellY,
      width: cellW,
      height: cellH,
      zIndex: master.zIndex,
      customSettings: clonedSettings,
    };
  }
}
