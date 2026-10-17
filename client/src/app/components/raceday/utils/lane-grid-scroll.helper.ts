import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import { LaneGridLabelHelper } from "./lane-grid-label.helper";
import { LaneGridSession } from "./lane-grid-replication.helper";
import { RacedayLayoutUtils } from "./raceday-layout.utils";

export class LaneGridScrollHelper {
  public static getGridDataCount(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
    parent: any,
  ): number {
    const gridWidgets = (widgets || []).filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return 0;
    const first = gridWidgets[0];
    const gridTotalLanes =
      Number(first.customSettings?.["gridTotalLanes"]) || 4;
    const mode = first.customSettings?.["bindingMode"] || "lane";
    const explicitGridType =
      gridWidgets.find((w) => w.customSettings?.["gridType"])?.customSettings?.[
        "gridType"
      ] || first.customSettings?.["gridType"];

    let count = 0;
    if (explicitGridType === "heat") {
      const heatCount =
        parent?.heat?.heatDrivers?.length ??
        parent?.heatDrivers?.length ??
        parent?.sortedHeatDrivers?.length ??
        parent?.heat?.standings?.length ??
        parent?.heatStandings?.length ??
        0;
      const trackCount =
        parent?.track?.lanes?.length ??
        parent?.currentTrack?.lanes?.length ??
        parent?.race?.track?.lanes?.length ??
        parent?.maxTrackLanes ??
        0;
      count = Math.max(heatCount, trackCount);
    } else if (
      explicitGridType === "overall" ||
      gridWidgets.some((w) =>
        RacedayLayoutUtils.isOverallColumnKey(w.customSettings?.["columnKey"]),
      )
    ) {
      count =
        parent?.race?.standings?.length ??
        parent?.raceStandings?.length ??
        parent?.participants?.length ??
        parent?.race?.participants?.length ??
        parent?.raceParticipants?.length ??
        0;
    } else {
      if (mode === "lane") {
        count =
          parent?.track?.lanes?.length ??
          parent?.currentTrack?.lanes?.length ??
          parent?.race?.track?.lanes?.length ??
          parent?.maxTrackLanes ??
          0;
      } else if (mode === "position") {
        count =
          parent?.heat?.standings?.length ??
          parent?.heatStandings?.length ??
          parent?.heat?.heatDrivers?.length ??
          parent?.heatDrivers?.length ??
          parent?.track?.lanes?.length ??
          parent?.currentTrack?.lanes?.length ??
          parent?.race?.track?.lanes?.length ??
          parent?.maxTrackLanes ??
          0;
      } else if (mode === "overallPosition") {
        count =
          parent?.race?.standings?.length ??
          parent?.raceStandings?.length ??
          parent?.participants?.length ??
          parent?.race?.participants?.length ??
          parent?.raceParticipants?.length ??
          0;
      } else if (mode === "seed") {
        count =
          parent?.race?.participants?.length ??
          parent?.participants?.length ??
          parent?.raceParticipants?.length ??
          0;
      }
    }
    return count > 0 ? count : gridTotalLanes;
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
    if (dataCount <= gridTotalLanes) {
      return gridWidgets;
    }

    const bounds = LaneGridGeometryHelper.calculateGridBounds(
      allWidgets,
      gridId,
    );
    if (!bounds) return gridWidgets;

    const direction = first.customSettings?.["gridDirection"] || "vertical";
    const headerPlacement =
      first.customSettings?.["headerPlacement"] || "individual";
    const headerHeight = Number(first.customSettings?.["headerHeight"]) || 36;
    const bindingMode = first.customSettings?.["bindingMode"] || "lane";

    const masterWidgets = gridWidgets.filter((w) => {
      if (w.customSettings?.["isHeaderWidget"]) return false;
      const lane = Number(
        w.customSettings?.["gridLane"] ??
          w.customSettings?.["targetIndex"] ??
          0,
      );
      return lane === 0;
    });

    const explicitGridType =
      gridWidgets.find((w) => w.customSettings?.["gridType"])?.customSettings?.[
        "gridType"
      ] || first.customSettings?.["gridType"];

    const sessionLike: LaneGridSession = {
      gridId,
      bounds,
      totalLanes: gridTotalLanes,
      direction,
      sourceLaneIndex: 0,
      bindingMode,
      gridType: explicitGridType,
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
