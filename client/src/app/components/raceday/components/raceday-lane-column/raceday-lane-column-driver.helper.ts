import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { LaneColumnWidgetSettings } from "@app/models/settings";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { isEditorMode } from "./raceday-lane-column.utils";

interface OverallCacheEntry {
  participantsRef: any[];
  driversRef: DriverHeatData[];
  driverRankingsRef: any;
  standingsRef: any;
  sortedByMode: Map<string, any[]>;
  rankMap?: Map<number, any>;
  seedMap?: Map<number, any>;
}

interface HeatGridCacheEntry {
  driversRef: DriverHeatData[];
  rankingsRef: any;
  standingsRef: any;
  sortedByRank?: DriverHeatData[];
  sortedByOverallRank?: DriverHeatData[];
  sortedBySeed?: DriverHeatData[];
}

const overallCache = new WeakMap<any, OverallCacheEntry>();
const heatGridCache = new WeakMap<any, HeatGridCacheEntry>();

function buildDriverLookupMap(
  drivers: DriverHeatData[],
): Map<string, DriverHeatData> {
  const map = new Map<string, DriverHeatData>();
  for (let i = 0; i < drivers.length; i++) {
    const d = drivers[i];
    if (d.objectId) map.set(d.objectId, d);
    if (d.participant?.objectId) map.set(d.participant.objectId, d);
    const entityId = d.driver?.entity_id;
    if (entityId) map.set(entityId, d);
  }
  return map;
}

function getFastParticipantHeatRank(
  p: any,
  driverMap: Map<string, DriverHeatData>,
  parent: any,
): number {
  const d =
    driverMap.get(p.objectId) ||
    driverMap.get(p.participant?.objectId) ||
    (p.driver?.entity_id ? driverMap.get(p.driver.entity_id) : undefined);
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

function getFastParticipantHeatLane(
  p: any,
  driverMap: Map<string, DriverHeatData>,
): number {
  const d =
    driverMap.get(p.objectId) ||
    driverMap.get(p.participant?.objectId) ||
    (p.driver?.entity_id ? driverMap.get(p.driver.entity_id) : undefined);
  if (!d) return 999;
  return d.laneIndex ?? 999;
}

export function getCachedOverallParticipants(
  parent: any,
  drivers: DriverHeatData[],
  bindingMode: string,
): any[] {
  const participants: any[] = parent?.participants || [];
  if (!parent || typeof parent !== "object" || participants.length === 0) {
    return participants;
  }

  let entry = overallCache.get(parent);
  if (
    !entry ||
    entry.participantsRef !== participants ||
    entry.driversRef !== drivers ||
    entry.driverRankingsRef !== parent.driverRankings ||
    entry.standingsRef !== parent.heat?.standings
  ) {
    entry = {
      participantsRef: participants,
      driversRef: drivers,
      driverRankingsRef: parent.driverRankings,
      standingsRef: parent.heat?.standings,
      sortedByMode: new Map<string, any[]>(),
    };
    overallCache.set(parent, entry);
  }

  let sorted = entry.sortedByMode.get(bindingMode);
  if (!sorted) {
    if (bindingMode === "overallPosition") {
      sorted = participants;
    } else if (bindingMode === "seed") {
      sorted = [...participants].sort(
        (a, b) => (a.seed ?? 999) - (b.seed ?? 999),
      );
    } else if (bindingMode === "position") {
      const driverMap = buildDriverLookupMap(drivers);
      sorted = [...participants].sort((a, b) => {
        const rankA = getFastParticipantHeatRank(a, driverMap, parent);
        const rankB = getFastParticipantHeatRank(b, driverMap, parent);
        if (rankA !== rankB) return rankA - rankB;
        return (a.rank ?? 999) - (b.rank ?? 999);
      });
    } else {
      const driverMap = buildDriverLookupMap(drivers);
      sorted = [...participants].sort((a, b) => {
        const laneA = getFastParticipantHeatLane(a, driverMap);
        const laneB = getFastParticipantHeatLane(b, driverMap);
        if (laneA !== laneB) return laneA - laneB;
        return (a.rank ?? 999) - (b.rank ?? 999);
      });
    }
    entry.sortedByMode.set(bindingMode, sorted);
  }
  return sorted;
}

export function getCachedSortedHeatDriversByRank(
  drivers: DriverHeatData[],
  parent: any,
): DriverHeatData[] {
  if (!parent || typeof parent !== "object" || drivers.length === 0) {
    return drivers;
  }

  let entry = heatGridCache.get(parent);
  if (
    !entry ||
    entry.driversRef !== drivers ||
    entry.rankingsRef !== parent.driverRankings ||
    entry.standingsRef !== parent.heat?.standings
  ) {
    entry = {
      driversRef: drivers,
      rankingsRef: parent.driverRankings,
      standingsRef: parent.heat?.standings,
    };
    heatGridCache.set(parent, entry);
  }

  if (!entry.sortedByRank) {
    const standings = parent.heat?.standings;
    const standingsMap =
      standings && Array.isArray(standings) && standings.length > 0
        ? new Map<string, number>(
            standings.map((id: string, idx: number) => [id, idx + 1]),
          )
        : null;

    entry.sortedByRank = [...drivers].sort((a, b) => {
      if (parent.driverRankings && parent.driverRankings.size > 0) {
        const rankA = parent.driverRankings.get(a.objectId) ?? 999;
        const rankB = parent.driverRankings.get(b.objectId) ?? 999;
        if (rankA !== rankB) return rankA - rankB;
      } else if (standingsMap) {
        const rankA = standingsMap.get(a.objectId) ?? 999;
        const rankB = standingsMap.get(b.objectId) ?? 999;
        if (rankA !== rankB) return rankA - rankB;
      }

      const lapsA = (a as any).lapCount ?? a.lapTimes?.length ?? 0;
      const lapsB = (b as any).lapCount ?? b.lapTimes?.length ?? 0;
      if (lapsA !== lapsB) return (lapsB as number) - (lapsA as number);

      const timeA = (a as any).totalTime ?? 0;
      const timeB = (b as any).totalTime ?? 0;
      return (timeA as number) - (timeB as number);
    });
  }
  return entry.sortedByRank;
}

export function getCachedSortedHeatDriversByOverallRank(
  drivers: DriverHeatData[],
  parent: any,
): DriverHeatData[] {
  if (!parent || typeof parent !== "object" || drivers.length === 0) {
    return drivers;
  }

  let entry = heatGridCache.get(parent);
  if (
    !entry ||
    entry.driversRef !== drivers ||
    entry.rankingsRef !== parent.driverRankings ||
    entry.standingsRef !== parent.heat?.standings
  ) {
    entry = {
      driversRef: drivers,
      rankingsRef: parent.driverRankings,
      standingsRef: parent.heat?.standings,
    };
    heatGridCache.set(parent, entry);
  }

  if (!entry.sortedByOverallRank) {
    entry.sortedByOverallRank = [...drivers].sort((a, b) => {
      const rankA = getDriverOverallRank(a, parent);
      const rankB = getDriverOverallRank(b, parent);
      if (rankA !== rankB) return rankA - rankB;
      return (a.laneIndex ?? 0) - (b.laneIndex ?? 0);
    });
  }
  return entry.sortedByOverallRank;
}

export function getCachedSortedHeatDriversBySeed(
  drivers: DriverHeatData[],
  parent?: any,
): DriverHeatData[] {
  if (!parent || typeof parent !== "object" || drivers.length === 0) {
    return [...drivers].sort((a, b) => {
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
  }

  let entry = heatGridCache.get(parent);
  if (!entry || entry.driversRef !== drivers) {
    entry = {
      driversRef: drivers,
      rankingsRef: parent.driverRankings,
      standingsRef: parent.heat?.standings,
    };
    heatGridCache.set(parent, entry);
  }

  if (!entry.sortedBySeed) {
    entry.sortedBySeed = [...drivers].sort((a, b) => {
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
  }
  return entry.sortedBySeed;
}

export function isParentGridOverall(parent: any, gridId?: string): boolean {
  if (!gridId || !parent) return false;
  if (typeof parent.isGridOverall === "function") {
    return Boolean(parent.isGridOverall(gridId));
  }
  if (
    parent?.gridSession?.()?.gridType === "overall" ||
    parent?.activeGridSession?.gridType === "overall"
  ) {
    return true;
  }
  if (
    parent?.gridSession?.()?.gridType === "heat" ||
    parent?.activeGridSession?.gridType === "heat"
  ) {
    return false;
  }
  const gridWidgets = parent?.layout?.widgets?.filter(
    (w: any) => w.customSettings?.gridId === gridId,
  );
  if (!gridWidgets || gridWidgets.length === 0) return false;
  const allHeat = gridWidgets.every(
    (w: any) => w.customSettings?.gridType === "heat",
  );
  if (allHeat) return false;
  const anyOverall = gridWidgets.some(
    (w: any) => w.customSettings?.gridType === "overall",
  );
  if (anyOverall) return true;

  return Boolean(
    gridWidgets.some(
      (w: any) =>
        !w.customSettings?.gridType &&
        (w.customSettings?.bindingMode === "overallPosition" ||
          RacedayLayoutUtils.isOverallColumnKey(w.customSettings?.columnKey)),
    ),
  );
}

export function isParentGridSeed(parent: any, gridId?: string): boolean {
  if (!gridId || !parent) return false;
  if (typeof parent.isGridSeed === "function") {
    return Boolean(parent.isGridSeed(gridId));
  }
  if (
    parent?.gridSession?.()?.bindingMode === "seed" ||
    parent?.activeGridSession?.bindingMode === "seed"
  ) {
    return true;
  }
  const gridWidgets = parent?.layout?.widgets?.filter(
    (w: any) => w.customSettings?.gridId === gridId,
  );
  if (!gridWidgets || gridWidgets.length === 0) return false;
  return Boolean(
    gridWidgets.some((w: any) => w.customSettings?.bindingMode === "seed"),
  );
}

export function resolveHeatDriverByPosition(
  drivers: DriverHeatData[],
  parent: any,
  targetIndex: number,
): DriverHeatData | undefined {
  const targetRank = targetIndex + 1;
  if (parent?.driverRankings && parent.driverRankings.size > 0) {
    for (const d of drivers) {
      if (parent.driverRankings.get(d.objectId) === targetRank) {
        return d;
      }
    }
  }
  if (parent?.heat?.standings && parent.heat.standings.length > 0) {
    const targetId = parent.heat.standings[targetIndex];
    if (targetId) {
      const found = drivers.find((d) => d.objectId === targetId);
      if (found) return found;
    }
  }
  const sortedByRank = getCachedSortedHeatDriversByRank(drivers, parent);
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
    const sorted = getCachedSortedHeatDriversByOverallRank(drivers, parent);
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
    const sorted = getCachedSortedHeatDriversBySeed(drivers, parent);
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
    if (isParentGridOverall(parent, settings.gridId)) {
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

export function isOverallOrSeedDataSource(
  settings: LaneColumnWidgetSettings | undefined,
  parent?: any,
  bindingMode?: string,
): boolean {
  if (!settings) return false;
  const mode = bindingMode || settings.bindingMode;
  if (mode === "seed") return true;
  if (settings.gridId && isParentGridSeed(parent, settings.gridId)) {
    return true;
  }
  return isOverallDataSource(settings, parent, bindingMode);
}

export function resolveOverallGridDriver(
  drivers: DriverHeatData[],
  parent: any,
  bindingMode: string,
  targetIndex: number,
  getOrCreateSyntheticDriver: (p: any) => DriverHeatData,
): DriverHeatData | undefined {
  const participants: any[] = parent?.participants || [];
  let match: any;

  if (bindingMode === "overallPosition") {
    const targetRank = targetIndex + 1;
    const entry =
      parent && typeof parent === "object"
        ? overallCache.get(parent)
        : undefined;
    if (entry && entry.participantsRef === participants && entry.rankMap) {
      match = entry.rankMap.get(targetRank) || participants[targetIndex];
    } else if (entry && entry.participantsRef === participants) {
      entry.rankMap = new Map<number, any>();
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        if (p.rank != null && !entry.rankMap.has(p.rank)) {
          entry.rankMap.set(p.rank, p);
        }
      }
      match = entry.rankMap.get(targetRank) || participants[targetIndex];
    } else {
      match =
        participants.find((p: any) => p.rank === targetRank) ||
        participants[targetIndex];
    }
  } else if (bindingMode === "seed") {
    const targetSeed = targetIndex + 1;
    const sorted = getCachedOverallParticipants(parent, drivers, bindingMode);
    const entry =
      parent && typeof parent === "object"
        ? overallCache.get(parent)
        : undefined;
    if (entry && entry.participantsRef === participants && entry.seedMap) {
      match = entry.seedMap.get(targetSeed) || sorted[targetIndex];
    } else if (entry && entry.participantsRef === participants) {
      entry.seedMap = new Map<number, any>();
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        if (p.seed != null && !entry.seedMap.has(p.seed)) {
          entry.seedMap.set(p.seed, p);
        }
      }
      match = entry.seedMap.get(targetSeed) || sorted[targetIndex];
    } else {
      match =
        participants.find((p: any) => p.seed === targetSeed) ||
        sorted[targetIndex];
    }
  } else {
    const sorted = getCachedOverallParticipants(parent, drivers, bindingMode);
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
  const bindingMode = settings.bindingMode || "lane";
  const targetIndex = settings.targetIndex ?? 0;

  const isOverallGrid =
    isGrid &&
    settings.gridType !== "heat" &&
    (settings.gridType === "overall" ||
      bindingMode === "overallPosition" ||
      bindingMode === "seed" ||
      RacedayLayoutUtils.isOverallColumnKey(columnKey || settings.columnKey) ||
      isParentGridOverall(parent, settings.gridId) ||
      isParentGridSeed(parent, settings.gridId));

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
