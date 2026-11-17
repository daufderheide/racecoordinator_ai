import {
  AUDIO_PRIORITY_WEIGHT,
  AudioAssociation,
  CalloutQueueItem,
} from "@app/models/audio";
import { AudioConfig } from "@app/models/driver";

/**
 * Returns a human-readable description for an AudioConfig.
 */
export function describeAudioConfig(
  config?: AudioConfig,
  resolvedUrl?: string,
): string {
  if (!config) return "undefined";
  if (config.type === "tts") {
    return `TTS("${config.text || ""}")`;
  }
  return `Preset("${resolvedUrl || config.url || ""}")`;
}

/**
 * Retrieves a paused or ended cached audio element or creates and caches a new one.
 */
export function getOrCreateCachedAudio(
  map: Map<string, HTMLAudioElement>,
  playableUrl: string,
  excludeElement?: HTMLAudioElement | null,
): HTMLAudioElement {
  const cached = map.get(playableUrl);
  if (cached && cached !== excludeElement && (cached.paused || cached.ended)) {
    try {
      cached.currentTime = 0;
    } catch {
      // ignore
    }
    return cached;
  }
  const audio = new Audio(playableUrl);
  map.set(playableUrl, audio);
  return audio;
}

/**
 * Finds the index of a matching queued callout by association (lane, driver, or widget).
 */
export function findQueuedCalloutIndex(
  queue: CalloutQueueItem[],
  association?: AudioAssociation,
): number {
  return queue.findIndex((item) => {
    if (
      association?.laneIndex !== undefined &&
      item.association?.laneIndex !== undefined
    ) {
      return item.association.laneIndex === association.laneIndex;
    }
    if (association?.driverId && item.association?.driverId) {
      return item.association.driverId === association.driverId;
    }
    if (
      (association?.widgetType === "timer" &&
        item.association?.widgetType === "timer") ||
      (association?.widgetType === "countdown" &&
        item.association?.widgetType === "countdown")
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Sorts a callout queue by priority descending, then by enqueue timestamp ascending.
 */
export function sortCalloutQueue(queue: CalloutQueueItem[]): void {
  queue.sort((a, b) => {
    const pDiff =
      AUDIO_PRIORITY_WEIGHT[b.priority] - AUDIO_PRIORITY_WEIGHT[a.priority];
    if (pDiff !== 0) return pDiff;
    return a.enqueuedAt - b.enqueuedAt;
  });
}

/**
 * Sets up a watchdog failsafe for HTMLAudioElement playback.
 */
export function setupAudioWatchdog(
  audio: HTMLAudioElement,
  isEnded: () => boolean,
  onTimeout: () => void,
): { clear: () => void } {
  let timer: any = null;
  const startWatchdog = (timeoutMs: number) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(onTimeout, timeoutMs);
  };

  startWatchdog(10000);

  audio.onloadedmetadata = () => {
    if (
      !isEnded() &&
      audio.duration &&
      !isNaN(audio.duration) &&
      isFinite(audio.duration)
    ) {
      const dynamicTimeout = Math.max(
        3000,
        Math.min(10000, Math.ceil(audio.duration * 1000) + 1500),
      );
      startWatchdog(dynamicTimeout);
    }
  };

  return {
    clear: () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
