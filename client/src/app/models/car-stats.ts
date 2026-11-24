import { CarField } from "./car-field";

/**
 * Car stats (step 5 of #1210): one row per group, worked out by the server
 * from the saved races. Times are in seconds; 0 means no valid lap.
 */
export interface CarStatRow {
  key: string;
  label: string;
  races: number;
  heats: number;
  laps: number;
  best_lap_time: number;
  median_lap_time: number;
  average_lap_time: number;
  best_lap_driver: string;
  /** When the group last raced (ms since epoch). */
  last_raced: number;
}

/** What to group by and which saved races and heats to look at. */
export interface CarStatsQuery {
  groupBy?: string;
  carId?: string;
  carClass?: string;
  trackId?: string;
  driverId?: string;
  isDemo?: boolean;
}

/** A "Group by" choice: the value sent to the server and its label. */
export interface CarStatsGroup {
  value: string;
  /** A translation key, or the user's own field name when `custom` is true. */
  label: string;
  custom?: boolean;
}

/** The fixed groups, in menu order: car, class, the setup fields, track, driver. */
export const CAR_STATS_FIXED_GROUPS: CarStatsGroup[] = [
  { value: "car", label: "CS_GROUP_CAR" },
  { value: "class", label: "CE_LABEL_CLASS" },
  { value: "brand", label: "CE_LABEL_BRAND" },
  { value: "scale", label: "CE_LABEL_SCALE" },
  { value: "motor", label: "CE_LABEL_MOTOR" },
  { value: "magnet", label: "CE_LABEL_MAGNET" },
  { value: "chassis", label: "CE_LABEL_CHASSIS" },
  { value: "gears", label: "CE_LABEL_GEARS" },
  { value: "tyres", label: "CE_LABEL_TYRES" },
  { value: "track", label: "CS_GROUP_TRACK" },
  { value: "driver", label: "CS_GROUP_DRIVER" },
];

/** All "Group by" choices: the fixed ones, then the user's own fields before track and driver. */
export function carStatsGroups(fields: CarField[]): CarStatsGroup[] {
  const own: CarStatsGroup[] = fields
    .filter((f) => f.entity_id && f.name)
    .map((f) => ({
      value: `custom:${f.entity_id}`,
      label: f.name,
      custom: true,
    }));
  const fixed = CAR_STATS_FIXED_GROUPS;
  const beforeTrack = fixed.findIndex((g) => g.value === "track");
  return [...fixed.slice(0, beforeTrack), ...own, ...fixed.slice(beforeTrack)];
}

/** A lap time for the table: three decimals, or a dash when there is none. */
export function formatCarStatTime(seconds: number): string {
  return seconds > 0 ? seconds.toFixed(3) : "--.---";
}
