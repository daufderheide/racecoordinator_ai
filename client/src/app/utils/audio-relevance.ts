import {
  ANNOUNCEMENT_SLOTS,
  AudioAssociation,
  AudioRelevanceFilter,
} from "@app/models/audio";
import { AudioConfig } from "@app/models/driver";

/**
 * Determines whether an audio slot or configuration represents a verbal callout
 * versus a sound effect (SFX) based on Option 1 (Convention by Slot & Type).
 */
export function isVoiceCalloutSlot(
  slotOrCategory: string,
  config?: AudioConfig,
): boolean {
  if (!config || config.type === "none") return false;
  if (config.type === "tts") return true;
  return ANNOUNCEMENT_SLOTS.some((s) => slotOrCategory.includes(s));
}

/**
 * Determines whether an audio association matches the current relevance filter.
 */
export function isAudioRelevant(
  filter: AudioRelevanceFilter | null,
  association?: AudioAssociation,
): boolean {
  if (!filter) {
    return true;
  }

  // 1. Countdown audio
  if (association?.widgetType === "countdown") {
    return !!filter.allowCountdown;
  }

  // 2. Timer audio (seconds left, halfway)
  if (association?.widgetType === "timer") {
    return !!filter.allowTimer;
  }

  // 3. Race state audio (flag, yellow flag, heat over, race over)
  if (
    association?.widgetType === "flag" ||
    association?.widgetType === "race-state"
  ) {
    return !!filter.allowRaceState;
  }

  // 4. Driver / Lane audio (lane-view / driver station)
  if (
    association?.widgetType === "lane-view" ||
    association?.widgetType === "driver" ||
    association?.laneIndex != null ||
    association?.driverId != null
  ) {
    if (filter.driverAudioMode === "all") {
      return true;
    }
    if (filter.driverAudioMode === "scoped") {
      if (
        association.laneIndex != null &&
        filter.allowedLanes?.has(association.laneIndex)
      ) {
        return true;
      }
      if (
        association.driverId &&
        filter.allowedDriverIds?.has(association.driverId)
      ) {
        return true;
      }
      return false;
    }
    return false;
  }

  // Unassociated fallback
  return true;
}
