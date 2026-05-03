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

/** Plays a sound based on the provided configuration. */
export function playSound(
  type: "preset" | "tts" | "none" | "audio_set" | undefined,
  url: string | undefined,
  text: string | undefined,
  serverUrl: string,
  data?: any,
  logger?: LoggerService,
): void {
  if (type === "none") return;
  if (type === "preset" && url) {
    // Ensure absolute URL if it's relative
    let playableUrl = url;
    if (url.startsWith("/")) {
      playableUrl = `${serverUrl}${url}`;
    }
    if (logger) logger.info("Playing audio from URL:", playableUrl);
    const audio = new Audio(playableUrl);
    audio.play().catch((err) => {
      if (logger) logger.error("Error playing sound", err);
    });
  } else if (type === "tts" && text) {
    let interpolatedText = text;
    if (data) {
      interpolatedText = interpolate(text, data);
    }

    if (!(window as any).SUPPRESS_AUDIO_LOGS && logger) {
      logger.info("Playing TTS:", interpolatedText);
    }
    if (window.speechSynthesis) {
      // Cancel any current speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(interpolatedText);
      window.speechSynthesis.speak(utterance);
    } else {
      if (logger) logger.warn("Text-to-speech not supported in this browser.");
    }
  } else {
    if (logger) logger.info("No sound to play (missing type, url, or text)");
  }
}

function interpolate(text: string, data: any): string {
  return text.replace(/\{([^}]+)\}/g, (match, path) => {
    const parts = path.toLowerCase().split(".");
    let value = data;
    for (const part of parts) {
      if (value === undefined || value === null) break;

      // Case-insensitive property lookup
      const keys = Object.keys(value);
      const key = keys.find((k) => k.toLowerCase() === part);
      value = key ? value[key] : undefined;
    }

    if (value === undefined || value === null) {
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
  driver: TTSDriverData,
  driverData: TTSLapData,
): TTSContext {
  return {
    driver: {
      name: driver.name,
      nickname: driver.nickname || driver.name,
      lastLapTime: driverData.lastLapTime,
      bestLapTime: driverData.bestLapTime,
      averageLapTime: driverData.averageLapTime,
      lapCount: driverData.lapCount,
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
