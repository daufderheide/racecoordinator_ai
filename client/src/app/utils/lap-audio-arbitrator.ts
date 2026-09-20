import { AudioConfig } from "@app/models/driver";
import {
  AUDIO_PRIORITY_WEIGHT,
  AudioAssociation,
  AudioPriority,
} from "@app/services/audio.service";

export interface LapAudioCandidate {
  id: string; // e.g. "halfway", "laps_left", "milestone", "infraction"
  config: AudioConfig;
  priority: AudioPriority;
  context?: any;
  resolvedUrl?: string;
  association?: AudioAssociation;
  isVoice?: boolean;
}

export interface LapArbitrationResult {
  winner: LapAudioCandidate | null;
  toQueue: LapAudioCandidate[];
  dropped: LapAudioCandidate[];
}

/**
 * Arbitrates multiple candidate audio callouts triggered for the exact same lap event.
 *
 * Rules:
 * 1. Finds the highest priority weight among all valid candidates for that lap.
 * 2. Any candidates with priority lower than the highest weight are dropped (discarded before play).
 * 3. Candidates matching the highest weight:
 *    - The first candidate is selected as the winner to play immediately.
 *    - Any subsequent candidates of the same priority are returned in `toQueue` to be played
 *      sequentially via the audio queue after the cadence spacing pause.
 */
export function arbitrateLapAudioCandidates(
  candidates: (LapAudioCandidate | null | undefined)[],
): LapArbitrationResult {
  const validCandidates = candidates.filter(
    (c): c is LapAudioCandidate =>
      !!c &&
      !!c.config &&
      c.config.type !== "none" &&
      (c.id === "halfway" ||
        (c.config.type === "preset" &&
          !!(c.resolvedUrl || c.config.url?.trim())) ||
        (c.config.type === "tts" && !!c.config.text?.trim())),
  );

  if (validCandidates.length === 0) {
    return { winner: null, toQueue: [], dropped: [] };
  }

  let maxWeight = -1;
  for (const c of validCandidates) {
    const w = AUDIO_PRIORITY_WEIGHT[c.priority] ?? 0;
    if (w > maxWeight) {
      maxWeight = w;
    }
  }

  const topCandidates: LapAudioCandidate[] = [];
  const dropped: LapAudioCandidate[] = [];

  for (const c of validCandidates) {
    const w = AUDIO_PRIORITY_WEIGHT[c.priority] ?? 0;
    if (w === maxWeight) {
      topCandidates.push(c);
    } else {
      dropped.push(c);
    }
  }

  const winner = topCandidates[0] || null;
  const toQueue = topCandidates.slice(1);

  return {
    winner,
    toQueue,
    dropped,
  };
}
