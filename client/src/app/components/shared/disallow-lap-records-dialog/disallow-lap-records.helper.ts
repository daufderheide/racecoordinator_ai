import { DriverConverter } from "@app/converters/driver.converter";
import { naturalSortCompare } from "@app/utils/sorting.utils";

export type SortColumn =
  | "race"
  | "date"
  | "driver"
  | "heat"
  | "lane"
  | "lap"
  | "time"
  | "status"
  | "action";
export type SortDirection = "asc" | "desc";

export type RecordTier = "gold" | "silver" | "bronze" | null;

export interface NormalizedLap {
  raceId?: string;
  raceName: string;
  raceDate?: Date | number | string | null;
  heatNumber: number;
  laneIndex: number;
  driverName: string;
  teamName?: string;
  laneColor?: string;
  laneTextColor?: string;
  lapIndex: number;
  lapNumber: number;
  lapTime: number;
  countTowardsRecords: boolean;
  isFastest: boolean;
  recordTier?: RecordTier;
  isOverallLaneRecord?: boolean;
  isRaceLaneRecord?: boolean;
  isDriverBest?: boolean;
}

export interface RaceFilterOption {
  id: string;
  name: string;
  date: Date | number | string | null;
}

export interface DriverFilterOption {
  driverName: string;
  teamName?: string;
}

export interface LaneOption {
  laneIndex: number;
  laneColor?: string;
  laneTextColor?: string;
}

export function getDriverLaps(driverData: any): any[] {
  if (!driverData) return [];
  try {
    if (
      Array.isArray(driverData.lapsWithDetails) &&
      driverData.lapsWithDetails.length > 0
    ) {
      return driverData.lapsWithDetails;
    }
    if (
      Array.isArray(driverData._lapsWithDetails) &&
      driverData._lapsWithDetails.length > 0
    ) {
      return driverData._lapsWithDetails;
    }
    if (Array.isArray(driverData.laps) && driverData.laps.length > 0) {
      return driverData.laps;
    }
    if (Array.isArray(driverData._laps) && driverData._laps.length > 0) {
      return driverData._laps;
    }
    if (Array.isArray(driverData.lapTimes) && driverData.lapTimes.length > 0) {
      return driverData.lapTimes;
    }
    if (
      Array.isArray(driverData._lapTimes) &&
      driverData._lapTimes.length > 0
    ) {
      return driverData._lapTimes;
    }
    if (
      driverData.lapsWithDetails &&
      Array.isArray(driverData.lapsWithDetails)
    ) {
      return driverData.lapsWithDetails;
    }
    if (
      driverData._lapsWithDetails &&
      Array.isArray(driverData._lapsWithDetails)
    ) {
      return driverData._lapsWithDetails;
    }
    if (driverData.laps && Array.isArray(driverData.laps)) {
      return driverData.laps;
    }
    if (driverData._laps && Array.isArray(driverData._laps)) {
      return driverData._laps;
    }
    if (driverData.lapTimes && Array.isArray(driverData.lapTimes)) {
      return driverData.lapTimes;
    }
    if (driverData._lapTimes && Array.isArray(driverData._lapTimes)) {
      return driverData._lapTimes;
    }
  } catch {
    return [];
  }
  return [];
}

export function isEmptyLane(driverData: any): boolean {
  if (!driverData) return true;
  if (getDriverLaps(driverData).length > 0) {
    return false;
  }
  if (
    driverData.isEmptyLane === true ||
    driverData.isEmpty === true ||
    (typeof driverData.isEmptyLane === "function" &&
      driverData.isEmptyLane()) ||
    (typeof driverData.isEmpty === "function" && driverData.isEmpty())
  ) {
    return true;
  }
  const d =
    driverData.actualDriver ||
    driverData.participant?.driver ||
    (driverData.driver?.driver ? driverData.driver.driver : driverData.driver);
  const id = (d?.entity_id || d?.entityId || d?.id || "")
    .toString()
    .toUpperCase();
  if (id === "EMPTY_LANE" || id.startsWith("EMPTY_") || id === "EMPTY")
    return true;

  if (!d && !driverData.participant?.team && !driverData.team) return true;
  return false;
}

export function resolveTeamName(driverData: any): string | undefined {
  const participant =
    driverData.participant ||
    (driverData.driver && (driverData.driver.driver || driverData.driver.team)
      ? driverData.driver
      : null);
  const teamObj = participant?.team || driverData.team;
  if (teamObj && typeof teamObj === "object" && teamObj.name) {
    return teamObj.name.trim();
  }
  if (typeof teamObj === "string") {
    return teamObj.trim();
  }
  return undefined;
}

export function resolveTeammateDriverName(
  lapDriverId: string,
  allDrivers: any[],
): string | undefined {
  const found = allDrivers.find(
    (d) => (d.entity_id || d.entityId || d.id || "").toString() === lapDriverId,
  );
  if (found) {
    const nickname = (found.nickname || found.nickName || "").trim();
    const name = (found.name || found.driverName || "").trim();
    return nickname || name || lapDriverId;
  }
  try {
    const cached = DriverConverter.get(lapDriverId);
    if (cached) {
      const nickname = (cached.nickname || "").trim();
      const name = (cached.name || "").trim();
      return nickname || (name !== "Unknown" ? name : "") || lapDriverId;
    }
  } catch {
    // Ignored
  }
  return undefined;
}

export function resolveLaneDriverName(
  driverData: any,
  teamObj: any,
  teamName: string | undefined,
  allDrivers: any[],
): string {
  const participant =
    driverData.participant ||
    (driverData.driver && (driverData.driver.driver || driverData.driver.team)
      ? driverData.driver
      : null);
  const d =
    driverData.actualDriver ||
    participant?.driver ||
    (driverData.driver?.driver ? driverData.driver.driver : driverData.driver);

  let nickname = "";
  let name = "";

  if (d && typeof d === "object") {
    nickname = (d.nickname || d.nickName || "").trim();
    name = (d.name || d.driverName || "").trim();
    if (!nickname && (d.entity_id || d.entityId || d.id)) {
      const dId = (d.entity_id || d.entityId || d.id).toString();
      const found = allDrivers.find(
        (x) => (x.entity_id || x.entityId || x.id || "").toString() === dId,
      );
      if (found) {
        nickname = (found.nickname || found.nickName || "").trim();
        if (!name) name = (found.name || found.driverName || "").trim();
      }
    }
  }

  if (
    teamObj &&
    Array.isArray(teamObj.driverIds) &&
    teamObj.driverIds.length > 0 &&
    (!nickname || (teamName && name.toLowerCase() === teamName.toLowerCase()))
  ) {
    const firstMemberId = teamObj.driverIds[0];
    const member = allDrivers.find(
      (x) =>
        (x.entity_id || x.entityId || x.id || "").toString() === firstMemberId,
    );
    if (member) {
      nickname = (member.nickname || member.nickName || "").trim();
      if (!name) name = (member.name || member.driverName || "").trim();
    }
  }

  const isPlaceholder = (val: string) => {
    const lower = (val || "").trim().toLowerCase();
    return (
      lower === "empty" ||
      lower === "empty lane" ||
      lower === "rd_empty_lane" ||
      lower === "(empty)" ||
      lower === "unknown"
    );
  };
  if (isPlaceholder(nickname)) nickname = "";
  if (isPlaceholder(name)) name = "";

  return (
    nickname ||
    (name && name !== "Unknown" ? name : "") ||
    driverData.driverName ||
    `Driver ${(driverData.laneIndex ?? driverData.lane ?? 0) + 1}`
  );
}

export function resolveDriverAndTeam(
  driverData: any,
  lap?: any,
  allDrivers: any[] = [],
): { driverName: string; teamName?: string } {
  if (!driverData || isEmptyLane(driverData)) {
    return { driverName: "" };
  }

  const teamName = resolveTeamName(driverData);
  const lapDriverId =
    lap && typeof lap === "object"
      ? (lap.driverId || lap.driver_id || "").toString().trim()
      : "";

  if (lapDriverId) {
    const display = resolveTeammateDriverName(lapDriverId, allDrivers);
    if (display) {
      return {
        driverName: display,
        teamName:
          teamName && teamName.toLowerCase() !== display.toLowerCase()
            ? teamName
            : undefined,
      };
    }
  }

  const participant =
    driverData.participant ||
    (driverData.driver && (driverData.driver.driver || driverData.driver.team)
      ? driverData.driver
      : null);
  const teamObj = participant?.team || driverData.team;
  const finalDriverName = resolveLaneDriverName(
    driverData,
    teamObj,
    teamName,
    allDrivers,
  );

  return {
    driverName: finalDriverName,
    teamName:
      teamName && teamName.toLowerCase() !== finalDriverName.toLowerCase()
        ? teamName
        : undefined,
  };
}

export function computeMinAllowedTime(rawLaps: any[]): number {
  let minAllowedTime = Infinity;
  rawLaps.forEach((lap: any) => {
    if (!lap) return;
    const num =
      typeof lap === "number"
        ? lap
        : parseFloat(lap?.time ?? lap?.lapTime ?? lap?.lap_time ?? 0);
    const time = isNaN(num) ? 0 : num;
    const countTowardsRecords =
      typeof lap === "object" && lap !== null
        ? (lap.countTowardsRecords ?? lap.count_towards_records ?? true)
        : true;
    if (countTowardsRecords && time > 0 && time < minAllowedTime) {
      minAllowedTime = time;
    }
  });
  return minAllowedTime;
}

export function hasDuplicateLanes(drivers: any[]): boolean {
  if (!drivers || drivers.length <= 1) return false;
  const laneCounts = new Map<number, number>();
  for (const d of drivers) {
    if (!d) continue;
    const l = typeof d.laneIndex === "number" ? d.laneIndex : d.lane;
    if (typeof l === "number" && l >= 0) {
      laneCounts.set(l, (laneCounts.get(l) || 0) + 1);
      if (laneCounts.get(l)! > 1) {
        return true;
      }
    }
  }
  return false;
}

export function extractDriverLaps(
  driverData: any,
  heatNum: number,
  dIndex: number,
  trackData: any,
  dupLanes: boolean = false,
  raceId: string | undefined = undefined,
  raceName: string = "",
  raceDate: Date | number | string | null = null,
  selectedLaneIndex: number = -1,
  selectedDriverName: string = "",
  allDrivers: any[] = [],
): NormalizedLap[] {
  const rawLaps = getDriverLaps(driverData);
  if (!driverData || rawLaps.length === 0 || isEmptyLane(driverData)) {
    return [];
  }
  const laneIndex =
    typeof driverData.laneIndex === "number" && driverData.laneIndex >= 0
      ? driverData.laneIndex
      : typeof driverData.lane_index === "number" && driverData.lane_index >= 0
        ? driverData.lane_index
        : !dupLanes &&
            typeof driverData.lane === "number" &&
            driverData.lane >= 0
          ? driverData.lane
          : dIndex >= 0
            ? dIndex
            : typeof driverData.lane === "number" && driverData.lane >= 0
              ? driverData.lane
              : 0;

  if (selectedLaneIndex !== -1 && laneIndex !== selectedLaneIndex) {
    return [];
  }

  const laneConfig =
    trackData?.lanes && trackData.lanes[laneIndex]
      ? trackData.lanes[laneIndex]
      : null;
  const laneColor = laneConfig?.background_color || laneConfig?.backgroundColor;
  const laneTextColor =
    laneConfig?.foreground_color || laneConfig?.foregroundColor;

  const minAllowedTime = computeMinAllowedTime(rawLaps);
  const result: NormalizedLap[] = [];

  rawLaps.forEach((lap: any, index: number) => {
    if (!lap) return;
    const num =
      typeof lap === "number"
        ? lap
        : parseFloat(lap?.time ?? lap?.lapTime ?? lap?.lap_time ?? 0);
    const time = isNaN(num) ? 0 : num;
    if (time <= 0) return;

    const resolved = resolveDriverAndTeam(driverData, lap, allDrivers);

    if (selectedDriverName && resolved.driverName !== selectedDriverName) {
      return;
    }

    const countTowardsRecords =
      typeof lap === "object" && lap !== null
        ? (lap.countTowardsRecords ?? lap.count_towards_records ?? true)
        : true;

    const isFastest =
      countTowardsRecords &&
      minAllowedTime < Infinity &&
      Math.abs(time - minAllowedTime) < 0.0001;

    result.push({
      raceId,
      raceName,
      raceDate,
      heatNumber: heatNum,
      laneIndex,
      driverName: resolved.driverName,
      teamName: resolved.teamName,
      laneColor,
      laneTextColor,
      lapIndex: index,
      lapNumber: index + 1,
      lapTime: time,
      countTowardsRecords,
      isFastest,
    });
  });

  return result;
}

export interface AssignRecordTiersOptions {
  overallLaneFastestTimes?:
    | Map<number, number>
    | number[]
    | Record<number, number>
    | null;
}

export function assignRecordTiers(
  laps: NormalizedLap[],
  options?: AssignRecordTiersOptions,
): NormalizedLap[] {
  if (!laps || laps.length === 0) return [];

  // 1. Overall lane bests baseline from options if available
  const overallLaneBests = new Map<number, number>();
  if (options?.overallLaneFastestTimes) {
    const raw = options.overallLaneFastestTimes;
    if (raw instanceof Map) {
      raw.forEach((time, lane) => {
        if (time > 0 && time < Infinity) overallLaneBests.set(lane, time);
      });
    } else if (Array.isArray(raw)) {
      raw.forEach((entry: any, lane: number) => {
        const time =
          typeof entry === "number"
            ? entry
            : parseFloat(entry?.value ?? entry?.time ?? entry?.lapTime ?? 0);
        if (!isNaN(time) && time > 0 && time < Infinity) {
          overallLaneBests.set(lane, time);
        }
      });
    } else if (typeof raw === "object") {
      Object.entries(raw).forEach(([k, v]) => {
        const lane = parseInt(k, 10);
        const time = typeof v === "number" ? v : parseFloat(String(v));
        if (!isNaN(lane) && !isNaN(time) && time > 0 && time < Infinity) {
          overallLaneBests.set(lane, time);
        }
      });
    }
  }

  // 2. Calculate minimum eligible lap time across all laps for:
  //    - overall lane bests
  //    - race lane bests
  //    - race driver bests
  const raceLaneBests = new Map<string, number>();
  const raceDriverBests = new Map<string, number>();

  for (const lap of laps) {
    if (!lap.countTowardsRecords || lap.lapTime <= 0) continue;

    // Overall Lane
    const currentOverall = overallLaneBests.get(lap.laneIndex) ?? Infinity;
    if (lap.lapTime < currentOverall) {
      overallLaneBests.set(lap.laneIndex, lap.lapTime);
    }

    // Race Lane
    const raceLaneKey = `${lap.raceId || ""}:${lap.laneIndex}`;
    const currentRaceLane = raceLaneBests.get(raceLaneKey) ?? Infinity;
    if (lap.lapTime < currentRaceLane) {
      raceLaneBests.set(raceLaneKey, lap.lapTime);
    }

    // Race Driver
    const raceDriverKey = `${lap.raceId || ""}:${lap.driverName}`;
    const currentRaceDriver = raceDriverBests.get(raceDriverKey) ?? Infinity;
    if (lap.lapTime < currentRaceDriver) {
      raceDriverBests.set(raceDriverKey, lap.lapTime);
    }
  }

  // 3. Assign flags and tiers
  for (const lap of laps) {
    if (!lap.countTowardsRecords || lap.lapTime <= 0) {
      lap.recordTier = null;
      lap.isOverallLaneRecord = false;
      lap.isRaceLaneRecord = false;
      lap.isDriverBest = false;
      lap.isFastest = false;
      continue;
    }

    const overallBest = overallLaneBests.get(lap.laneIndex) ?? Infinity;
    const raceLaneKey = `${lap.raceId || ""}:${lap.laneIndex}`;
    const raceLaneBest = raceLaneBests.get(raceLaneKey) ?? Infinity;
    const raceDriverKey = `${lap.raceId || ""}:${lap.driverName}`;
    const raceDriverBest = raceDriverBests.get(raceDriverKey) ?? Infinity;

    const isOverall =
      overallBest < Infinity && Math.abs(lap.lapTime - overallBest) < 0.0001;
    const isRaceLane =
      raceLaneBest < Infinity && Math.abs(lap.lapTime - raceLaneBest) < 0.0001;
    const isDriverBest =
      raceDriverBest < Infinity &&
      Math.abs(lap.lapTime - raceDriverBest) < 0.0001;

    lap.isOverallLaneRecord = isOverall;
    lap.isRaceLaneRecord = isRaceLane;
    lap.isDriverBest = isDriverBest;

    if (isOverall) {
      lap.recordTier = "gold";
    } else if (isRaceLane) {
      lap.recordTier = "silver";
    } else if (isDriverBest) {
      lap.recordTier = "bronze";
    } else {
      lap.recordTier = null;
    }

    lap.isFastest = lap.recordTier !== null;
  }

  return laps;
}

export function getStatusPriority(lap: NormalizedLap): number {
  if (!lap.countTowardsRecords) return 0;
  if (lap.recordTier === "gold") return 4;
  if (lap.recordTier === "silver") return 3;
  if (lap.recordTier === "bronze") return 2;
  if (lap.isFastest) return 2;
  return 1;
}

export function compareNormalizedLaps(
  a: NormalizedLap,
  b: NormalizedLap,
  sortColumn: SortColumn,
  sortDirection: SortDirection,
): number {
  let diff = 0;
  switch (sortColumn) {
    case "race":
      diff = naturalSortCompare(a.raceName || "", b.raceName || "");
      break;
    case "date": {
      const dateA = a.raceDate
        ? typeof a.raceDate === "number"
          ? a.raceDate
          : new Date(a.raceDate).getTime() || 0
        : 0;
      const dateB = b.raceDate
        ? typeof b.raceDate === "number"
          ? b.raceDate
          : new Date(b.raceDate).getTime() || 0
        : 0;
      diff = dateA - dateB;
      break;
    }
    case "driver":
      diff = naturalSortCompare(a.driverName || "", b.driverName || "");
      break;
    case "heat":
      diff = a.heatNumber - b.heatNumber;
      break;
    case "lane":
      diff = a.laneIndex - b.laneIndex;
      break;
    case "lap":
      diff = a.lapNumber - b.lapNumber;
      break;
    case "time":
      diff = a.lapTime - b.lapTime;
      break;
    case "status":
    case "action":
      diff = getStatusPriority(a) - getStatusPriority(b);
      break;
  }

  if (sortDirection === "desc") {
    diff = -diff;
  }

  if (diff !== 0) {
    return diff;
  }

  // Secondary sorting: Always by time in ascending order (fastest time first)
  if (sortColumn !== "time") {
    const timeDiff = a.lapTime - b.lapTime;
    if (timeDiff !== 0) {
      return timeDiff;
    }
  }

  // Tertiary / fallback tie-breaker (and secondary when sorted by time):
  if (a.raceName !== b.raceName) {
    return naturalSortCompare(a.raceName || "", b.raceName || "");
  }
  if (a.heatNumber !== b.heatNumber) {
    return a.heatNumber - b.heatNumber;
  }
  if (a.laneIndex !== b.laneIndex) {
    return a.laneIndex - b.laneIndex;
  }
  return a.lapNumber - b.lapNumber;
}
