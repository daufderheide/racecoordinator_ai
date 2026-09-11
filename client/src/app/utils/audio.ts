export interface TTSDriverData {
  name: string;
  nickname: string;
}

import { LoggerService } from "@app/services/logger.service";

export interface TTSLapData {
  lastLapTime: number;
  bestLapTime: number;
  averageLapTime: number;
  lapCount: number;
}

export interface TTSContext {
  driver: TTSDriverData & TTSLapData;
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
  const defaultUrls: Record<string, string> = {
    default_beep: "/assets/default_beep_Lap_Beep",
    default_chimes: "/assets/default_chimes_Lap_Chimes",
    default_driveby: "/assets/default_driveby_Lap_Driveby",
    default_penalty: "/assets/default_penalty_Penalty",
    default_false_start: "/assets/default_penalty_Penalty",
    default_yellow_flag: "/assets/default_yellow_flag_Yellow_Flag",
  };
  if (defaultUrls[url]) {
    return `${serverUrl}${defaultUrls[url]}`;
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
  return text.replace(/\{+([^{}]+)\}+/g, (match, path) => {
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
): TTSContext {
  const driverName = driver?.name ?? "";
  const driverNickname = driver?.nickname || driverName;
  return {
    driver: {
      name: driverName,
      nickname: driverNickname,
      lastLapTime: driverData?.lastLapTime ?? 0,
      bestLapTime: driverData?.bestLapTime ?? 0,
      averageLapTime: driverData?.averageLapTime ?? 0,
      lapCount: driverData?.lapCount ?? 0,
    },
  };
}

export function mockTTSContext(): TTSContext {
  return createTTSContext(
    { name: "Dave", nickname: "Dave" },
    {
      lastLapTime: 1.234,
      bestLapTime: 1.234,
      averageLapTime: 1.5,
      lapCount: 10,
    },
  );
}
