import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { LaneColumnWidgetSettings } from "@app/models/settings";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { isEditorMode } from "./raceday-lane-column.utils";

export function resolveHeatDriverByPosition(
  drivers: DriverHeatData[],
  parent: any,
  targetIndex: number,
): DriverHeatData | undefined {
  const targetRank = targetIndex + 1;
  if (parent.driverRankings && parent.driverRankings.size > 0) {
    for (const d of drivers) {
      if (parent.driverRankings.get(d.objectId) === targetRank) {
        return d;
      }
    }
  }
  if (parent.heat?.standings && parent.heat.standings.length > 0) {
    const targetId = parent.heat.standings[targetIndex];
    if (targetId) {
      const found = drivers.find((d) => d.objectId === targetId);
      if (found) return found;
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
  return sortedByRank[targetIndex];
}

export function getDriverOverallRank(d: DriverHeatData, parent: any): number {
  if (!d) return 999;
  if (typeof parent?.getDriverOverallRanking === "function") {
    const r = parent.getDriverOverallRanking(d);
    if (r != null && r > 0) return r;
  }
  const match = (parent?.participants || []).find(
    (p: any) =>
      p.objectId === d.objectId ||
      p.participant?.objectId === d.objectId ||
      p.driver?.entity_id === (d.driver?.entity_id || d.objectId) ||
      p.driver?.name === d.driver?.name,
  );
  if (match?.rank && match.rank > 0) return match.rank;
  return (d as any).overallRank ?? d.participant?.rank ?? 999;
}

export function getParticipantHeatRank(
  p: any,
  drivers: DriverHeatData[],
  parent: any,
): number {
  const d = drivers.find(
    (driver) =>
      driver.objectId === p.objectId ||
      driver.participant?.objectId === p.objectId ||
      driver.driver?.entity_id === (p.driver?.entity_id || p.objectId),
  );
  if (!d) return 999;
  if (parent?.driverRankings?.has(d.objectId)) {
    return parent.driverRankings.get(d.objectId)!;
  }
  if (parent?.heat?.standings) {
    const idx = parent.heat.standings.indexOf(d.objectId);
    if (idx >= 0) return idx + 1;
  }
  return 999;
}

export function getParticipantHeatLane(
  p: any,
  drivers: DriverHeatData[],
): number {
  const d = drivers.find(
    (driver) =>
      driver.objectId === p.objectId ||
      driver.participant?.objectId === p.objectId ||
      driver.driver?.entity_id === (p.driver?.entity_id || p.objectId),
  );
  if (!d) return 999;
  return d.laneIndex ?? 999;
}

export function resolveStandaloneDriver(
  drivers: DriverHeatData[],
  parent: any,
  bindingMode: string,
  targetIndex: number,
  getOrCreateSyntheticDriver: (p: any) => DriverHeatData,
  settings?: LaneColumnWidgetSettings,
): DriverHeatData | undefined {
  if (bindingMode === "overallPosition") {
    const targetRank = targetIndex + 1;
    const participants: any[] = parent.participants || [];
    const match =
      participants.find((p: any) => p.rank === targetRank) ||
      participants[targetIndex];
    if (!match) return undefined;
    if (isParentRaceOver(parent)) {
      return getOrCreateSyntheticDriver(match);
    }
    const activeHeatDriver = drivers.find(
      (d) =>
        d.objectId === match.objectId ||
        d.participant?.objectId === match.objectId,
    );
    return activeHeatDriver || getOrCreateSyntheticDriver(match);
  }

  if (bindingMode === "seed") {
    const targetSeed = targetIndex + 1;
    const participants: any[] = parent.participants || [];
    const match =
      participants.find((p: any) => p.seed === targetSeed) ||
      participants[targetIndex];
    if (!match) return undefined;
    if (
      isParentRaceOver(parent) &&
      isOverallDataSource(settings, parent, bindingMode)
    ) {
      return getOrCreateSyntheticDriver(match);
    }
    const activeHeatDriver = drivers.find(
      (d) =>
        d.objectId === match.objectId ||
        d.participant?.objectId === match.objectId,
    );
    return activeHeatDriver || getOrCreateSyntheticDriver(match);
  }

  if (bindingMode === "position") {
    return resolveHeatDriverByPosition(drivers, parent, targetIndex);
  }

  return (
    drivers.find((d) => d.laneIndex === targetIndex) || drivers[targetIndex]
  );
}

export function resolveHeatGridDriver(
  drivers: DriverHeatData[],
  parent: any,
  bindingMode: string,
  targetIndex: number,
  getOrCreateSyntheticDriver?: (p: any) => DriverHeatData,
): DriverHeatData | undefined {
  if (bindingMode === "lane") {
    const found =
      drivers.find((d) => d.laneIndex === targetIndex) || drivers[targetIndex];
    if (found) return found;
    if (
      isEditorMode(parent) &&
      getOrCreateSyntheticDriver &&
      parent?.participants?.length
    ) {
      const p = parent.participants[targetIndex % parent.participants.length];
      if (p) return getOrCreateSyntheticDriver(p);
    }
    return undefined;
  }

  if (bindingMode === "position") {
    const found = resolveHeatDriverByPosition(drivers, parent, targetIndex);
    if (found) return found;
    if (
      isEditorMode(parent) &&
      getOrCreateSyntheticDriver &&
      parent?.participants?.length
    ) {
      const p = parent.participants[targetIndex % parent.participants.length];
      if (p) return getOrCreateSyntheticDriver(p);
    }
    return undefined;
  }

  if (bindingMode === "overallPosition") {
    const sorted = [...drivers].sort((a, b) => {
      const rankA = getDriverOverallRank(a, parent);
      const rankB = getDriverOverallRank(b, parent);
      if (rankA !== rankB) return rankA - rankB;
      return (a.laneIndex ?? 0) - (b.laneIndex ?? 0);
    });
    const found = sorted[targetIndex];
    if (found) return found;
    if (
      isEditorMode(parent) &&
      getOrCreateSyntheticDriver &&
      parent?.participants?.length
    ) {
      const p = parent.participants[targetIndex % parent.participants.length];
      if (p) return getOrCreateSyntheticDriver(p);
    }
    return undefined;
  }

  if (bindingMode === "seed") {
    const sorted = [...drivers].sort((a, b) => {
      const seedA =
        a.participant?.seed ??
        (a.driver as any)?.seed ??
        (a as any).seed ??
        999;
      const seedB =
        b.participant?.seed ??
        (b.driver as any)?.seed ??
        (b as any).seed ??
        999;
      if (seedA !== seedB) return seedA - seedB;
      return (a.laneIndex ?? 0) - (b.laneIndex ?? 0);
    });
    const found = sorted[targetIndex];
    if (found) return found;
    if (
      isEditorMode(parent) &&
      getOrCreateSyntheticDriver &&
      parent?.participants?.length
    ) {
      const p = parent.participants[targetIndex % parent.participants.length];
      if (p) return getOrCreateSyntheticDriver(p);
    }
    return undefined;
  }

  const found = drivers[targetIndex];
  if (found) return found;
  if (
    isEditorMode(parent) &&
    getOrCreateSyntheticDriver &&
    parent?.participants?.length
  ) {
    const p = parent.participants[targetIndex % parent.participants.length];
    if (p) return getOrCreateSyntheticDriver(p);
  }
  return undefined;
}

export function isParentRaceOver(parent: any): boolean {
  if (!parent) return false;
  if (typeof parent.isRaceOver === "function") {
    return Boolean(parent.isRaceOver());
  }
  if (
    parent.raceState !== undefined &&
    parent.raceState !== RaceState.UNKNOWN_STATE
  ) {
    return parent.raceState === RaceState.RACE_OVER;
  }
  const race = parent.race || parent.raceService?.getRace?.();
  const raceState = race?.raceState ?? race?.state;
  if (raceState !== undefined && raceState !== RaceState.UNKNOWN_STATE) {
    return raceState === RaceState.RACE_OVER;
  }
  return false;
}

export function isOverallDataSource(
  settings: LaneColumnWidgetSettings | undefined,
  parent?: any,
  bindingMode?: string,
): boolean {
  if (!settings) return false;

  // Explicit gridType takes precedence
  if (settings.gridType === "heat") return false;
  if (settings.gridType === "overall") return true;

  // If part of a grid, check if the grid session or siblings declare overall
  if (settings.gridId) {
    if (
      parent?.gridSession?.()?.gridType === "overall" ||
      parent?.activeGridSession?.gridType === "overall" ||
      Boolean(
        parent?.layout?.widgets?.some(
          (w: any) =>
            w.customSettings?.gridId === settings.gridId &&
            w.customSettings?.gridType === "overall",
        ),
      )
    ) {
      return true;
    }
    // Any grid that is not overall is a Heat Data grid
    return false;
  }

  // Standalone widgets (not part of a grid)
  const mode = bindingMode || settings.bindingMode;
  if (mode === "overallPosition") return true;
  if (RacedayLayoutUtils.isOverallColumnKey(settings.columnKey)) {
    return true;
  }

  return false;
}

export function resolveOverallGridDriver(
  drivers: DriverHeatData[],
  parent: any,
  bindingMode: string,
  targetIndex: number,
  getOrCreateSyntheticDriver: (p: any) => DriverHeatData,
): DriverHeatData | undefined {
  const participants: any[] = parent.participants || [];
  let match: any;

  if (bindingMode === "overallPosition") {
    const targetRank = targetIndex + 1;
    match =
      participants.find((p: any) => p.rank === targetRank) ||
      participants[targetIndex];
  } else if (bindingMode === "seed") {
    const targetSeed = targetIndex + 1;
    const sorted = [...participants].sort(
      (a, b) => (a.seed ?? 999) - (b.seed ?? 999),
    );
    match =
      participants.find((p: any) => p.seed === targetSeed) ||
      sorted[targetIndex];
  } else if (bindingMode === "position") {
    const sorted = [...participants].sort((a, b) => {
      const rankA = getParticipantHeatRank(a, drivers, parent);
      const rankB = getParticipantHeatRank(b, drivers, parent);
      if (rankA !== rankB) return rankA - rankB;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
    match = sorted[targetIndex];
  } else {
    const sorted = [...participants].sort((a, b) => {
      const laneA = getParticipantHeatLane(a, drivers);
      const laneB = getParticipantHeatLane(b, drivers);
      if (laneA !== laneB) return laneA - laneB;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
    match = sorted[targetIndex];
  }

  if (!match) return undefined;
  if (isParentRaceOver(parent)) {
    return getOrCreateSyntheticDriver(match);
  }
  const activeHeatDriver = drivers.find(
    (d) =>
      d.objectId === match.objectId ||
      d.participant?.objectId === match.objectId,
  );
  return activeHeatDriver || getOrCreateSyntheticDriver(match);
}

export function resolveTargetDriver(
  settings: LaneColumnWidgetSettings,
  columnKey: string,
  parent: any,
  getOrCreateSyntheticDriver: (p: any) => DriverHeatData,
): DriverHeatData | undefined {
  if (!parent) return undefined;

  const drivers: DriverHeatData[] =
    parent.sortedHeatDrivers ||
    parent.heatDrivers ||
    parent.heat?.heatDrivers ||
    [];

  const isGrid = Boolean(settings.gridId);
  const isOverallGrid =
    isGrid &&
    (settings.gridType === "overall" ||
      parent?.gridSession?.()?.gridType === "overall" ||
      parent?.activeGridSession?.gridType === "overall" ||
      Boolean(
        parent?.layout?.widgets?.some(
          (w: any) =>
            w.customSettings?.gridId === settings.gridId &&
            w.customSettings?.gridType === "overall",
        ),
      ));

  const bindingMode = settings.bindingMode || "lane";
  const targetIndex = settings.targetIndex ?? 0;

  if (!isGrid) {
    return resolveStandaloneDriver(
      drivers,
      parent,
      bindingMode,
      targetIndex,
      getOrCreateSyntheticDriver,
      settings,
    );
  }

  if (isOverallGrid) {
    return resolveOverallGridDriver(
      drivers,
      parent,
      bindingMode,
      targetIndex,
      getOrCreateSyntheticDriver,
    );
  }

  return resolveHeatGridDriver(
    drivers,
    parent,
    bindingMode,
    targetIndex,
    getOrCreateSyntheticDriver,
  );
}
