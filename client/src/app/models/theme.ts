import { AudioConfig } from "./driver";
import { Model } from "./model";

/**
 * A theme groups visual and audio asset assignments into logical "slots."
 * Each slot maps a purpose (e.g., "flag.racing", "lamp.red.on") to an asset entity ID.
 *
 * Themes are stored server-side (SQLite) and selected per-client via Settings.
 */
export interface Theme extends Model {
  entity_id: string;
  name: string;
  is_default: boolean;
  slots: { [key: string]: string }; // image slot key → asset entity ID
  audio_slots: { [key: string]: AudioConfig }; // audio slot key → AudioConfig

  uiId?: string;
}

/** All known theme slot keys for Phase 1 (images). */
export const THEME_SLOT_KEYS = {
  // Flags (Behavioral)
  FLAG_RACING: "flag.racing",
  FLAG_HEAT_PAUSED: "flag.heat_paused",
  FLAG_HEAT_OVER: "flag.heat_over",
  FLAG_RACE_OVER: "flag.race_over",
  FLAG_NOT_STARTED: "flag.not_started",
  FLAG_STARTING: "flag.starting",
  FLAG_RESTARTING: "flag.restarting",
  FLAG_ONE_LAP_TO_GO: "flag.one_lap_to_go",
  FLAG_HEAT_FINISHING: "flag.heat_finishing",
  FLAG_WARMUP: "flag.warmup",
  FLAG_DRIVER_FINISHED: "flag.driver_finished",
  FLAG_PENALTY: "flag.penalty",

  // Start lamps
  LAMP_RED_ON: "lamp.red.on",
  LAMP_RED_DIM: "lamp.red.dim",
  LAMP_GREEN: "lamp.green",

  // Fuel gauge
  FUEL_GAUGE: "gauge.fuel",

  // Audio Sets
  AUDIO_COUNTDOWN: "audio.countdown",
  AUDIO_SECONDS_LEFT: "audio.seconds_left",

  // Audio (these keys map to audio_slots)
  AUDIO_YELLOW_FLAG: "audio.yellowflag",
  AUDIO_SECONDS_LEFT_HALFWAY: "audio.seconds_left.halfway",
  AUDIO_HEAT_OVER: "audio.heat_over",
  AUDIO_RACE_OVER: "audio.race_over",
  AUDIO_PENALTY: "audio.penalty",
  AUDIO_MIN_LAP_TIME: "audio.min_lap_time",
  AUDIO_DRIFT_LAP: "audio.drift_lap",
} as const;
