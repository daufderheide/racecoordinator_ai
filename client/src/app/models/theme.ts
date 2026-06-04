import { AudioConfig } from "./driver";
import { Model } from "./model";

/**
 * A theme groups visual and audio asset assignments into logical "slots."
 * Each slot maps a purpose (e.g., "flag.green", "lamp.red_on") to an asset entity ID.
 *
 * Themes are stored server-side (MongoDB) and selected per-client via Settings.
 */
export interface Theme extends Model {
  entity_id: string;
  name: string;
  is_default: boolean;
  slots: { [key: string]: string }; // image slot key → asset entity ID
  audio_slots: { [key: string]: AudioConfig }; // audio slot key → AudioConfig
}

/** All known theme slot keys for Phase 1 (images). */
export const THEME_SLOT_KEYS = {
  // Flags
  FLAG_GREEN: "flag.green",
  FLAG_RED: "flag.red",
  FLAG_YELLOW: "flag.yellow",
  FLAG_WHITE: "flag.white",
  FLAG_YELLOWGREEN: "flag.yellowgreen",
  FLAG_CHECKERED: "flag.checkered",
  FLAG_BLACK: "flag.black",

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
