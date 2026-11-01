import { AudioConfig } from "@app/models/driver";

export type AudioPriority = "low" | "normal" | "high" | "urgent";

export const AUDIO_PRIORITY_WEIGHT: Record<AudioPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
};

export interface AudioAssociation {
  widgetType?: "lane-view" | "timer" | "flag" | "countdown" | string;
  laneIndex?: number;
  driverId?: string;
  eventType?: string;
}

export type DriverAudioMode = "all" | "none" | "scoped";

export interface AudioRelevanceFilter {
  /** Driver audio mode: 'all' (all lanes), 'none' (no driver audio), 'scoped' (specific lanes/drivers) */
  driverAudioMode: DriverAudioMode;
  /** When driverAudioMode is 'scoped', set of allowed 0-indexed lane numbers */
  allowedLanes?: Set<number>;
  /** When driverAudioMode is 'scoped', set of allowed driver entity IDs / object IDs */
  allowedDriverIds?: Set<string>;

  /** Whether countdown audio is allowed */
  allowCountdown?: boolean;
  /** Whether timer audio (seconds left, halfway) is allowed */
  allowTimer?: boolean;
  /** Whether race state audio (yellow flag, heat over, race over) is allowed */
  allowRaceState?: boolean;
}

export interface UrgentQueueItem {
  config: AudioConfig;
  priority: AudioPriority;
  context?: any;
  resolvedUrl?: string;
  enqueuedAt: number;
  association?: AudioAssociation;
}

export type CalloutQueueItem = UrgentQueueItem;

export const ANNOUNCEMENT_SLOTS = [
  "audio.yellowflag",
  "audio.seconds_left",
  "audio.seconds_left.halfway",
  "audio.heat_over",
  "audio.race_over",
  "audio.min_lap_time",
  "audio.drift_lap",
  "driftLap",
  "drift_lap",
  "penalty",
  "falseStart",
  "false_start",
  "overallBestLap",
  "overall_best_lap",
  "overallRecordLap",
  "overall_record_lap",
  "overallLaneBestLap",
  "overall_lane_best_lap",
  "overallLaneRecordLap",
  "overall_lane_record_lap",
  "raceBestLap",
  "race_best_lap",
  "raceLaneBestLap",
  "race_lane_best_lap",
  "heatBestLap",
  "heat_best_lap",
  "newRaceLeader",
  "new_race_leader",
  "newHeatLeader",
  "new_heat_leader",
  "pitIn",
  "pit_in",
  "fuel",
  "fuel_level",
  "fuelLevel",
];

export interface ActiveVoiceCallout {
  priority: AudioPriority;
  stop: () => void;
}
