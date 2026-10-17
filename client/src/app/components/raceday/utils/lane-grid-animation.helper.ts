import { AbsoluteWidgetNode } from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { RacedayLayoutUtils } from "./raceday-layout.utils";

export interface GridSlotCoordinate {
  x: number;
  y: number;
}

export interface GridShiftDelta {
  deltaX: number;
  deltaY: number;
}

interface GridTrackingState {
  activeHeatId: string | null;
  previousEntityToRow: Map<string, number>;
  currentEntityToRow: Map<string, number>;
  coordinatesByColumnAndRow: Map<string, Map<number, GridSlotCoordinate>>;
  microtaskScheduled: boolean;
}

export class LaneGridAnimationHelper {
  private static gridStates = new Map<string, GridTrackingState>();

  public static reset(gridId?: string): void {
    if (gridId) {
      this.gridStates.delete(gridId);
    } else {
      this.gridStates.clear();
    }
  }

  public static resolveEntityId(
    widget: AbsoluteWidgetNode | null | undefined,
    parent: any,
  ): string | null {
    if (!widget || !parent) return null;
    const s = widget.customSettings;
    if (!s || !s["gridId"] || s["isHeaderWidget"]) return null;
    const mode = s["bindingMode"] || "lane";
    if (mode !== "position" && mode !== "overallPosition") return null;

    const targetIndex = Number(s["targetIndex"] ?? s["gridLane"] ?? 0);
    const targetRank = targetIndex + 1;
    const isOverallGrid =
      s["gridType"] === "overall" ||
      (!s["gridType"] && RacedayLayoutUtils.isOverallColumnKey(s["columnKey"]));

    if (isOverallGrid) {
      return this.resolveOverallGridEntityId(
        mode,
        targetIndex,
        targetRank,
        parent,
      );
    }

    return this.resolveHeatGridEntityId(mode, targetIndex, targetRank, parent);
  }

  private static resolveOverallGridEntityId(
    mode: string,
    targetIndex: number,
    targetRank: number,
    parent: any,
  ): string | null {
    const participants: any[] = parent.participants || [];
    if (mode === "overallPosition") {
      const match =
        participants.find((p: any) => p.rank === targetRank) ||
        participants[targetIndex];
      return match?.driver?.entity_id || match?.objectId || null;
    }

    const drivers: DriverHeatData[] =
      parent.sortedHeatDrivers ||
      parent.heatDrivers ||
      parent.heat?.heatDrivers ||
      [];
    const sorted = [...participants].sort((a, b) => {
      const getHeatRank = (p: any) => {
        const d = drivers.find(
          (driver) =>
            driver.objectId === p.objectId ||
            driver.participant?.objectId === p.objectId ||
            driver.driver?.entity_id === (p.driver?.entity_id || p.objectId),
        );
        if (!d) return 999;
        return parent.driverRankings?.get(d.objectId) ?? 999;
      };
      const rankA = getHeatRank(a);
      const rankB = getHeatRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
    const match = sorted[targetIndex];
    return match?.driver?.entity_id || match?.objectId || null;
  }

  private static resolveHeatGridEntityId(
    mode: string,
    targetIndex: number,
    targetRank: number,
    parent: any,
  ): string | null {
    const drivers: DriverHeatData[] =
      parent.sortedHeatDrivers ||
      parent.heatDrivers ||
      parent.heat?.heatDrivers ||
      [];

    if (mode === "overallPosition") {
      const getOverallRank = (d: DriverHeatData): number => {
        if (typeof parent.getDriverOverallRanking === "function") {
          const r = parent.getDriverOverallRanking(d);
          if (r != null && r > 0) return r;
        }
        const match = (parent.participants || []).find(
          (p: any) =>
            p.objectId === d.objectId ||
            p.participant?.objectId === d.objectId ||
            p.driver?.entity_id === (d.driver?.entity_id || d.objectId) ||
            p.driver?.name === d.driver?.name,
        );
        if (match?.rank && match.rank > 0) return match.rank;
        return (d as any).overallRank ?? d.participant?.rank ?? 999;
      };
      const sorted = [...drivers].sort((a, b) => {
        const rankA = getOverallRank(a);
        const rankB = getOverallRank(b);
        if (rankA !== rankB) return rankA - rankB;
        return (a.laneIndex ?? 0) - (b.laneIndex ?? 0);
      });
      return sorted[targetIndex]?.objectId || null;
    }

    if (parent.driverRankings && parent.driverRankings.size > 0) {
      for (const d of drivers) {
        if (parent.driverRankings.get(d.objectId) === targetRank) {
          return d.objectId;
        }
      }
    }

    if (parent.heat?.standings && parent.heat.standings.length > 0) {
      const targetId = parent.heat.standings[targetIndex];
      if (targetId) {
        return targetId;
      }
    }

    const sortedByRank = [...drivers].sort((a, b) => {
      const rankA = parent.driverRankings?.get(a.objectId) ?? 999;
      const rankB = parent.driverRankings?.get(b.objectId) ?? 999;
      if (rankA !== rankB) return rankA - rankB;

      const lapsA = (a as any).lapCount ?? a.lapTimes?.length ?? 0;
      const lapsB = (b as any).lapCount ?? b.lapTimes?.length ?? 0;
      if (lapsA !== lapsB) return (lapsB as number) - (lapsA as number);

      const timeA = (a as any).totalTime ?? 0;
      const timeB = (b as any).totalTime ?? 0;
      return (timeA as number) - (timeB as number);
    });

    return sortedByRank[targetIndex]?.objectId || null;
  }

  private static getOrCreateState(
    gridId: string,
    currentHeatId: string | null,
  ): GridTrackingState {
    let state = this.gridStates.get(gridId);
    if (!state || state.activeHeatId !== currentHeatId) {
      state = {
        activeHeatId: currentHeatId,
        previousEntityToRow: new Map<string, number>(),
        currentEntityToRow: new Map<string, number>(),
        coordinatesByColumnAndRow: new Map<
          string,
          Map<number, GridSlotCoordinate>
        >(),
        microtaskScheduled: false,
      };
      this.gridStates.set(gridId, state);
    }
    return state;
  }

  public static recordPosition(
    widget: AbsoluteWidgetNode,
    entityId: string,
    currentHeatId: string | null,
  ): void {
    const gridId = widget.customSettings?.["gridId"];
    if (!gridId || !entityId) return;

    const state = this.getOrCreateState(gridId, currentHeatId);
    const rowIndex = Number(
      widget.customSettings?.["targetIndex"] ??
        widget.customSettings?.["gridLane"] ??
        0,
    );
    const colKey = (widget.customSettings?.["columnKey"] ||
      widget.customSettings?.["gridMasterId"] ||
      widget.widgetType ||
      "default") as string;

    state.currentEntityToRow.set(entityId, rowIndex);

    let colMap = state.coordinatesByColumnAndRow.get(colKey);
    if (!colMap) {
      colMap = new Map<number, GridSlotCoordinate>();
      state.coordinatesByColumnAndRow.set(colKey, colMap);
    }
    colMap.set(rowIndex, { x: widget.x, y: widget.y });

    this.scheduleCommit(state);
  }

  public static getShiftDelta(
    widget: AbsoluteWidgetNode,
    parent: any,
    isCustomizing: boolean,
  ): GridShiftDelta | null {
    if (isCustomizing) return null;
    const s = widget.customSettings;
    if (!s || !s["gridId"] || s["isHeaderWidget"]) return null;
    const mode = s["bindingMode"];
    if (mode !== "position" && mode !== "overallPosition") return null;

    const entityId = this.resolveEntityId(widget, parent);
    if (!entityId) return null;

    const gridId = s["gridId"];
    const heatId = parent?.heat?.objectId || null;
    const state = this.getOrCreateState(gridId, heatId);

    const rowIndex = Number(s["targetIndex"] ?? s["gridLane"] ?? 0);
    const colKey = (s["columnKey"] ||
      s["gridMasterId"] ||
      widget.widgetType ||
      "default") as string;

    state.currentEntityToRow.set(entityId, rowIndex);
    let colMap = state.coordinatesByColumnAndRow.get(colKey);
    if (!colMap) {
      colMap = new Map<number, GridSlotCoordinate>();
      state.coordinatesByColumnAndRow.set(colKey, colMap);
    }
    colMap.set(rowIndex, { x: widget.x, y: widget.y });

    this.scheduleCommit(state);

    const prevRow = state.previousEntityToRow.get(entityId);
    if (prevRow === undefined || prevRow === rowIndex) {
      return null;
    }

    let prevCoords = colMap.get(prevRow);
    let currentCoords = colMap.get(rowIndex) || { x: widget.x, y: widget.y };

    if (!prevCoords || !currentCoords) {
      for (const otherMap of state.coordinatesByColumnAndRow.values()) {
        const otherPrev = otherMap.get(prevRow);
        const otherCurr = otherMap.get(rowIndex);
        if (otherPrev && otherCurr) {
          prevCoords = otherPrev;
          currentCoords = otherCurr;
          break;
        }
      }
    }

    if (!prevCoords || !currentCoords) {
      return null;
    }

    const deltaX = prevCoords.x - currentCoords.x;
    const deltaY = prevCoords.y - currentCoords.y;

    if (deltaX === 0 && deltaY === 0) {
      return null;
    }

    return { deltaX, deltaY };
  }

  private static scheduleCommit(state: GridTrackingState): void {
    if (!state.microtaskScheduled) {
      state.microtaskScheduled = true;
      queueMicrotask(() => {
        state.previousEntityToRow = new Map(state.currentEntityToRow);
        state.microtaskScheduled = false;
      });
    }
  }
}
