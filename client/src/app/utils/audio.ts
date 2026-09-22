export interface TTSDriverData {
  name: string;
  nickname: string;
}

import { AudioConfig } from "@app/models/driver";
import type {
  AudioAssociation,
  AudioPriority,
} from "@app/services/audio.service";
import { LoggerService } from "@app/services/logger.service";

export interface TTSLapData {
  lastLapTime?: number;
  bestLapTime?: number;
  averageLapTime?: number;
  medianLapTime?: number;
  lapCount?: number;
  totalLaps?: number;
  totalTime?: number;
  gapLeader?: number | string;
  gapPosition?: number | string;
  rank?: number;
  lane?: number;
}

export interface TTSRaceData {
  name?: string;
  trackName?: string;
  totalHeats?: number;
}

export interface TTSTrackData {
  name?: string;
}

export interface TTSHeatData {
  heatNumber?: number;
  number?: number;
}

export interface TTSContext {
  driver: TTSDriverData &
    TTSLapData & { driver: { name: string; nickname: string } };
  race?: TTSRaceData;
  track?: TTSTrackData;
  heat?: TTSHeatData;
  [key: string]: any;
}

export interface LapAudioCalloutInfo {
  config: AudioConfig;
  isVoice: boolean;
  priority: AudioPriority;
}

/**
 * Checks whether an audio configuration is defined, not set to 'none',
 * and contains playable content (non-empty URL or non-empty TTS text).
 */
export function isAudioConfigured(config?: AudioConfig | null): boolean {
  if (!config) return false;
  if (config.type === "none") return false;
  if (config.type === "tts") {
    return !!config.text && config.text.trim().length > 0;
  }
  return !!config.url && config.url.trim().length > 0;
}

/**
 * Resolves which audio configuration, voice status, and priority should be played for a lap
 * based on record tiers, leader status, and personal best status.
 *
 * All candidate milestone events are evaluated in descending priority order:
 * 1. Overall Best (Tier 6) - high
 * 2. Overall Lane Best (Tier 5 or 6) - high
 * 3. New Race Leader - high
 * 4. New Heat Leader - normal
 * 5. Race Best (Tier 4 or 6) - high
 * 6. Race Lane Best (Tier 3, 4, 5, or 6) - normal
 * 7. Heat Best (Tier 2, 4, or 6) - normal
 * 8. Personal Best (Tier 1..6 or isBestLap) - normal/high (SFX if preset, Voice if TTS)
 *
 * If the highest priority sound is configured as 'none' (or unconfigured), the system
 * cascades to the next highest priority sound triggered by that lap, and so on.
 */
export function resolveLapAudio(
  driver: any,
  recordTier?: number | string | null,
  isBestLap?: boolean | null,
  isNewRaceLeader?: boolean | null,
  isNewHeatLeader?: boolean | null,
): LapAudioCalloutInfo | undefined {
  if (!driver) return undefined;

  const tier =
    typeof recordTier === "string"
      ? parseInt(recordTier, 10)
      : (recordTier ?? 0);

  const isTier6 = tier === 6 || recordTier === "RECORD_TIER_OVERALL_BEST";
  const isTier5 = tier === 5 || recordTier === "RECORD_TIER_OVERALL_LANE_BEST";
  const isTier4 = tier === 4 || recordTier === "RECORD_TIER_RACE_BEST";
  const isTier3 = tier === 3 || recordTier === "RECORD_TIER_RACE_LANE_BEST";
  const isTier2 = tier === 2 || recordTier === "RECORD_TIER_HEAT_BEST";
  const isTier1 =
    tier === 1 || recordTier === "RECORD_TIER_PERSONAL_BEST" || !!isBestLap;

  // 1. Overall Best (Tier 6)
  if (isTier6 && isAudioConfigured(driver.overallBestLapAudio)) {
    return {
      config: driver.overallBestLapAudio,
      isVoice: true,
      priority: "high",
    };
  }

  // 2. Overall Lane Best (Tier 5 or Tier 6)
  if (
    (isTier5 || isTier6) &&
    isAudioConfigured(driver.overallLaneBestLapAudio)
  ) {
    return {
      config: driver.overallLaneBestLapAudio,
      isVoice: true,
      priority: "high",
    };
  }

  // 3. New Race Leader
  if (isNewRaceLeader && isAudioConfigured(driver.newRaceLeaderAudio)) {
    return {
      config: driver.newRaceLeaderAudio,
      isVoice: true,
      priority: "high",
    };
  }

  // 4. New Heat Leader
  if (isNewHeatLeader && isAudioConfigured(driver.newHeatLeaderAudio)) {
    return {
      config: driver.newHeatLeaderAudio,
      isVoice: true,
      priority: "normal",
    };
  }

  // 5. Race Best (Tier 4 or Tier 6)
  if ((isTier4 || isTier6) && isAudioConfigured(driver.raceBestLapAudio)) {
    return {
      config: driver.raceBestLapAudio,
      isVoice: true,
      priority: "high",
    };
  }

  // 6. Race Lane Best (Tier 3, 4, 5, or 6)
  if (
    (isTier3 || isTier4 || isTier5 || isTier6) &&
    isAudioConfigured(driver.raceLaneBestLapAudio)
  ) {
    return {
      config: driver.raceLaneBestLapAudio,
      isVoice: true,
      priority: "normal",
    };
  }

  // 7. Heat Best (Tier 2, 4, or 6)
  if (
    (isTier2 || isTier4 || isTier6) &&
    isAudioConfigured(driver.heatBestLapAudio)
  ) {
    return {
      config: driver.heatBestLapAudio,
      isVoice: true,
      priority: "normal",
    };
  }

  // 8. Personal Best (Tier 1..6 or isBestLap)
  if (
    (isTier1 || isTier2 || isTier3 || isTier4 || isTier5 || isTier6) &&
    isAudioConfigured(driver.bestLapAudio)
  ) {
    const config = driver.bestLapAudio;
    const isVoice = config.type === "tts";
    const priority = isTier6 || isTier5 || isTier4 ? "high" : "normal";
    return { config, isVoice, priority };
  }

  return undefined;
}

/**
 * Resolves which audio configuration should be played for a lap based on record tiers
 * and personal best status.
 */
export function getLapAudioConfig(
  driver: any,
  recordTier?: number | string | null,
  isBestLap?: boolean | null,
  isNewRaceLeader?: boolean | null,
  isNewHeatLeader?: boolean | null,
): AudioConfig | undefined {
  return resolveLapAudio(
    driver,
    recordTier,
    isBestLap,
    isNewRaceLeader,
    isNewHeatLeader,
  )?.config;
}

export interface AudioPlayer {
  playCallout(
    config: AudioConfig | undefined,
    priority: AudioPriority,
    context?: any,
    resolvedUrl?: string,
    association?: AudioAssociation,
  ): boolean;
  playSfx(
    url: string | undefined,
    association?: AudioAssociation,
  ): HTMLAudioElement | void;
}

/**
 * Dispatches audio for a lap event according to priority and fallback rules:
 * 1. Resolves candidate milestone audio (Overall Best, Lane Best, Leader, Race Best, Heat Best).
 * 2. If milestone audio is configured and not 'none', attempts to play it via playCallout().
 * 3. If milestone audio wasn't played (due to priority drop, cooldown, set to 'none', or missing),
 *    falls back to personal best lap sound (if isBestLap) or normal lap sound.
 * 4. If fallback sound is set to 'none' or missing, no sound plays.
 * 5. Otherwise, if fallback is a preset SFX, it plays polyphonically via playSfx();
 *    if configured as TTS, it attempts playCallout().
 */
export function dispatchLapAudio(
  audioPlayer: AudioPlayer,
  driver: any,
  recordTier?: number | string | null,
  isBestLap?: boolean | null,
  isNewRaceLeader?: boolean | null,
  isNewHeatLeader?: boolean | null,
  ttsContext?: any,
  association?: AudioAssociation,
): void {
  if (!driver) return;

  let played = false;
  const specialAudio = resolveLapAudio(
    driver,
    recordTier,
    isBestLap,
    isNewRaceLeader,
    isNewHeatLeader,
  );

  if (specialAudio && isAudioConfigured(specialAudio.config)) {
    const config = specialAudio.config;
    if (specialAudio.isVoice) {
      const result = association
        ? audioPlayer.playCallout(
            config,
            specialAudio.priority,
            ttsContext,
            undefined,
            association,
          )
        : audioPlayer.playCallout(config, specialAudio.priority, ttsContext);
      played = result !== false;
    } else {
      if (association) {
        audioPlayer.playSfx(config.url, association);
      } else {
        audioPlayer.playSfx(config.url);
      }
      played = true;
    }
  }

  // If the sound for that lap wasn't played (either because of priority, set to none, or missing),
  // fallback to personal best lap sound (if isBestLap) or normal lap sound.
  let fallbackAudio = isBestLap ? driver.bestLapAudio : driver.lapAudio;

  // If the special audio that failed WAS the bestLapAudio, we should fallback to the normal lapAudio instead
  if (
    specialAudio &&
    specialAudio.config === fallbackAudio &&
    fallbackAudio === driver.bestLapAudio
  ) {
    fallbackAudio = driver.lapAudio;
  }

  // Make sure we don't try to fallback to the exact same audio that just got dropped
  if (!played && (!specialAudio || specialAudio.config !== fallbackAudio)) {
    if (isAudioConfigured(fallbackAudio)) {
      if (fallbackAudio.type === "tts") {
        if (association) {
          audioPlayer.playCallout(
            fallbackAudio,
            isBestLap ? "normal" : "low",
            ttsContext,
            undefined,
            association,
          );
        } else {
          audioPlayer.playCallout(
            fallbackAudio,
            isBestLap ? "normal" : "low",
            ttsContext,
          );
        }
      } else {
        if (association) {
          audioPlayer.playSfx(fallbackAudio.url, association);
        } else {
          audioPlayer.playSfx(fallbackAudio.url);
        }
      }
    }
  }
}

export const DEFAULT_AUDIO_URLS: Record<string, string> = {
  default_beep: "/assets/default_beep_Lap_Beep",
  default_chimes: "/assets/default_chimes_Lap_Chimes",
  default_driveby: "/assets/default_driveby_Lap_Driveby",
  default_penalty: "/assets/default_penalty_Penalty",
  default_false_start: "/assets/default_penalty_Penalty",
  default_yellow_flag: "/assets/default_yellow_flag_Yellow_Flag",
  default_record_lap: "/assets/default_record_lap_Overall_Record_Lap",
  default_record_lane_lap:
    "/assets/default_record_lane_lap_Overall_Lane_Record_Lap",
  default_best_race_lap: "/assets/default_best_race_lap_Race_Best_Lap",
  default_best_race_lane_lap:
    "/assets/default_best_race_lane_lap_Race_Lane_Best_Lap",
  default_best_heat_lap: "/assets/default_best_heat_lap_Heat_Best_Lap",
  default_new_race_leader: "/assets/default_new_race_leader_New_Race_Leader",
  default_new_heat_leader: "/assets/default_new_heat_leader_New_Heat_Leader",
  default_pit_in: "/assets/default_pit_in_Pit_In",
  default_fuel_empty: "/assets/default_fuel_empty_Fuel_Empty",
  default_fuel_low: "/assets/default_fuel_low_Fuel_Low",
  default_fuel_full: "/assets/default_fuel_full_Fuel_Full",
  default_fuel_level: "/assets/default_best_heat_lap_Heat_Best_Lap",
  default_countdown_go: "/assets/default_countdown_go_Countdown_Go",
  default_countdown_1: "/assets/default_countdown_1_Countdown_1",
  default_countdown_2: "/assets/default_countdown_2_Countdown_2",
  default_countdown_3: "/assets/default_countdown_3_Countdown_3",
  default_countdown_4: "/assets/default_countdown_4_Countdown_4",
  default_countdown_5: "/assets/default_countdown_5_Countdown_5",
  default_heat_half: "/assets/default_heat_half_Seconds_Left_--_Halfway",
  default_heat_over: "/assets/default_heat_over_Heat_Over",
  default_race_over: "/assets/default_race_over_Race_Over",
};

export const DEFAULT_AUDIO_NAMES: Record<string, string> = {
  default_beep: "Lap Beep",
  default_chimes: "Lap Chimes",
  default_driveby: "Lap Driveby",
  default_penalty: "Penalty",
  default_false_start: "Penalty",
  default_yellow_flag: "Yellow Flag",
  default_record_lap: "Overall Record Lap",
  default_record_lane_lap: "Overall Lane Record Lap",
  default_best_race_lap: "Race Best Lap",
  default_best_race_lane_lap: "Race Lane Best Lap",
  default_best_heat_lap: "Heat Best Lap",
  default_new_race_leader: "New Race Leader",
  default_new_heat_leader: "New Heat Leader",
  default_pit_in: "Pit In",
  default_fuel_empty: "Fuel Empty",
  default_fuel_low: "Fuel Low",
  default_fuel_full: "Fuel Full",
  default_fuel_level: "Default Fuel Level",
  default_countdown: "Default Countdown",
  default_countdown_go: "Countdown Go",
  default_countdown_1: "Countdown 1",
  default_countdown_2: "Countdown 2",
  default_countdown_3: "Countdown 3",
  default_countdown_4: "Countdown 4",
  default_countdown_5: "Countdown 5",
  default_seconds_left: "Default Seconds Left",
  default_seconds_left_300: "Seconds Left -- 5 Minutes",
  default_seconds_left_240: "Seconds Left -- 4 Minutes",
  default_seconds_left_180: "Seconds Left -- 3 Minutes",
  default_seconds_left_120: "Seconds Left -- 2 Minutes",
  default_seconds_left_60: "Seconds Left -- 1 Minute",
  default_seconds_left_30: "Seconds Left -- 30 Seconds",
  default_seconds_left_25: "Seconds Left -- 25 Seconds",
  default_seconds_left_20: "Seconds Left -- 20 Seconds",
  default_seconds_left_15: "Seconds Left -- 15 Seconds",
  default_seconds_left_10: "Seconds Left -- 10 Seconds",
  default_seconds_left_5: "Seconds Left -- 5 Seconds",
  default_heat_half: "Seconds Left -- Halfway",
  default_heat_over: "Heat Over",
  default_race_over: "Race Over",
};

/** Resolves a human-readable display name for a default preset ID or asset path. */
export function getDefaultAudioName(
  idOrUrl: string | undefined,
): string | undefined {
  if (!idOrUrl) return undefined;

  const trimmed = idOrUrl.trim();
  if (DEFAULT_AUDIO_NAMES[trimmed]) {
    return DEFAULT_AUDIO_NAMES[trimmed];
  }

  // Check reverse lookup in DEFAULT_AUDIO_URLS
  for (const [key, url] of Object.entries(DEFAULT_AUDIO_URLS)) {
    if (url === trimmed || trimmed.endsWith(url)) {
      return DEFAULT_AUDIO_NAMES[key];
    }
  }

  // Handle legacy filenames like /assets/default_beep_beep.wav or /assets/default_beep_Lap_Beep
  if (trimmed.includes("default_beep")) return "Lap Beep";
  if (trimmed.includes("default_chimes")) return "Lap Chimes";
  if (trimmed.includes("default_driveby")) return "Lap Driveby";
  if (
    trimmed.includes("default_penalty") ||
    trimmed.includes("default_false_start")
  )
    return "Penalty";
  if (trimmed.includes("default_record_lane_lap"))
    return "Overall Lane Record Lap";
  if (trimmed.includes("default_record_lap")) return "Overall Record Lap";
  if (trimmed.includes("default_best_race_lane_lap"))
    return "Race Lane Best Lap";
  if (trimmed.includes("default_best_race_lap")) return "Race Best Lap";
  if (trimmed.includes("default_best_heat_lap")) return "Heat Best Lap";
  if (trimmed.includes("default_new_race_leader")) return "New Race Leader";
  if (trimmed.includes("default_new_heat_leader")) return "New Heat Leader";
  if (trimmed.includes("default_pit_in")) return "Pit In";
  if (trimmed.includes("default_fuel_level")) return "Default Fuel Level";
  if (trimmed.includes("default_yellow_flag")) return "Yellow Flag";

  return undefined;
}

/** Resolves an audio URL or asset ID to a fully qualified URL for playback. */
export function resolveAudioUrl(
  url: string | undefined,
  serverUrl: string,
): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${serverUrl}${url}`;
  }
  if (DEFAULT_AUDIO_URLS[url]) {
    return `${serverUrl}${DEFAULT_AUDIO_URLS[url]}`;
  }
  return `${serverUrl}/api/assets/download/${url}`;
}

export interface PlaySoundOptions {
  masterVolume?: number;
  ttsVoice?: string;
  ttsRate?: number;
  ttsPitch?: number;
  ttsVolume?: number;
}

function getSavedAudioSettings(): PlaySoundOptions {
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("racecoordinator_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          masterVolume: parsed.masterVolume,
          ttsVoice: parsed.ttsVoice,
          ttsRate: parsed.ttsRate,
          ttsPitch: parsed.ttsPitch,
          ttsVolume: parsed.ttsVolume,
        };
      }
    }
  } catch {
    // LocalStorage unavailable or invalid JSON
  }
  return {};
}

/** Plays a sound based on the provided configuration. */
export function playSound(
  type: "preset" | "tts" | "none" | "audio_set" | undefined,
  url: string | undefined,
  text: string | undefined,
  serverUrl: string,
  data?: any,
  logger?: LoggerService,
  options?: PlaySoundOptions,
): HTMLAudioElement | void {
  if (type === "none") return;
  const saved = getSavedAudioSettings();
  const masterVolume =
    options?.masterVolume !== undefined
      ? options.masterVolume
      : (saved.masterVolume ?? 100);
  const ttsVoice =
    options?.ttsVoice !== undefined ? options.ttsVoice : saved.ttsVoice;
  const ttsRate =
    options?.ttsRate !== undefined ? options.ttsRate : (saved.ttsRate ?? 1.0);
  const ttsPitch =
    options?.ttsPitch !== undefined
      ? options.ttsPitch
      : (saved.ttsPitch ?? 1.0);
  const ttsVolume =
    options?.ttsVolume !== undefined
      ? options.ttsVolume
      : (saved.ttsVolume ?? 100);

  if (type === "preset" && url) {
    const playableUrl = resolveAudioUrl(url, serverUrl);
    if (logger) logger.debug("Playing audio from URL:", playableUrl);
    const audio = new Audio(playableUrl);
    audio.volume = Math.max(0, Math.min(1, masterVolume / 100));
    audio.play().catch((err) => {
      if (logger) logger.error("Error playing sound", err);
    });
    return audio;
  } else if (type === "tts" && text) {
    let interpolatedText = text;
    if (data) {
      interpolatedText = interpolate(text, data);
    }

    if (!(window as any).SUPPRESS_AUDIO_LOGS && logger) {
      logger.debug("Playing TTS:", interpolatedText);
    }
    if (window.speechSynthesis) {
      // Cancel any current speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(interpolatedText);
      if (ttsVoice && typeof window.speechSynthesis.getVoices === "function") {
        try {
          const voices = window.speechSynthesis.getVoices() || [];
          const trimmed = ttsVoice.trim().toLowerCase();
          const match = voices.find(
            (v) =>
              v.name === ttsVoice ||
              v.voiceURI === ttsVoice ||
              (v.name && v.name.trim().toLowerCase() === trimmed) ||
              (v.voiceURI && v.voiceURI.trim().toLowerCase() === trimmed),
          );
          if (match) {
            utterance.voice = match;
          }
        } catch {
          // Ignored
        }
      }
      if (ttsRate != null) {
        utterance.rate = Math.max(0.1, Math.min(10, ttsRate));
      }
      if (ttsPitch != null) {
        utterance.pitch = Math.max(0, Math.min(2, ttsPitch));
      }
      const masterVol = Math.max(0, Math.min(1, masterVolume / 100));
      const ttsVol = Math.max(0, Math.min(1, ttsVolume / 100));
      utterance.volume = masterVol * ttsVol;

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } else {
      if (logger) logger.warn("Text-to-speech not supported in this browser.");
    }
  } else {
    if (logger) logger.debug("No sound to play (missing type, url, or text)");
  }
}

export function interpolate(text: string, data: any): string {
  if (!text || !data) {
    return text || "";
  }
  return text.replace(/\$?\{([^{}]+)\}/g, (match, path) => {
    const cleanPath = path.trim();
    if (!cleanPath) {
      return match;
    }
    const parts = cleanPath.toLowerCase().split(".");
    let value: any = data;
    for (const part of parts) {
      if (value === undefined || value === null || typeof value !== "object") {
        value = undefined;
        break;
      }

      // Case-insensitive property lookup
      const keys = Object.keys(value);
      const key = keys.find((k) => k.toLowerCase() === part);
      value = key !== undefined ? value[key] : undefined;
    }

    if (value === undefined || value === null || typeof value === "object") {
      return match;
    }

    if (typeof value === "number") {
      // Format numbers to 3 decimal places if they have decimals
      return Number.isInteger(value) ? value.toString() : value.toFixed(3);
    }

    return value.toString();
  });
}

export function createTTSContext(
  driver?: TTSDriverData | null,
  driverData?: TTSLapData | null,
  race?: TTSRaceData | null,
  track?: TTSTrackData | null,
  heat?: TTSHeatData | null,
): TTSContext {
  const driverName = driver?.name ?? "";
  const driverNickname = driver?.nickname || driverName;
  const laps = driverData?.totalLaps ?? driverData?.lapCount ?? 0;
  return {
    name: driverName,
    nickname: driverNickname,
    driver: {
      name: driverName,
      nickname: driverNickname,
      driver: {
        name: driverName,
        nickname: driverNickname,
      },
      lastLapTime: driverData?.lastLapTime ?? 0,
      bestLapTime: driverData?.bestLapTime ?? 0,
      averageLapTime: driverData?.averageLapTime ?? 0,
      medianLapTime: driverData?.medianLapTime ?? 0,
      lapCount: laps,
      totalLaps: laps,
      totalTime: driverData?.totalTime ?? 0,
      gapLeader: driverData?.gapLeader ?? 0,
      gapPosition: driverData?.gapPosition ?? 0,
      rank: driverData?.rank ?? 0,
      lane: driverData?.lane ?? 0,
    },
    ...(race
      ? {
          race: {
            name: race.name || "",
            trackName: race.trackName || "",
            totalHeats: race.totalHeats || 0,
          },
        }
      : {}),
    ...(track
      ? {
          track: {
            name: track.name || "",
          },
        }
      : race?.trackName
        ? {
            track: {
              name: race.trackName,
            },
          }
        : {}),
    ...(heat
      ? {
          heat: {
            heatNumber: heat.heatNumber ?? heat.number ?? 0,
            number: heat.number ?? heat.heatNumber ?? 0,
          },
        }
      : {}),
  };
}

export function mockTTSContext(): TTSContext {
  return createTTSContext(
    { name: "Dave", nickname: "Dave" },
    {
      lastLapTime: 1.234,
      bestLapTime: 1.234,
      averageLapTime: 1.5,
      medianLapTime: 1.5,
      lapCount: 10,
      totalLaps: 10,
      totalTime: 15.0,
      gapLeader: "+0.500",
      gapPosition: "+0.200",
      rank: 1,
      lane: 1,
    },
    {
      name: "Grand Prix",
      trackName: "Speedway",
      totalHeats: 4,
    },
    {
      name: "Speedway",
    },
    {
      heatNumber: 1,
      number: 1,
    },
  );
}
