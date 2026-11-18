export type TimerDisplayFormat =
  | "dynamic"
  | "mm_ss"
  | "m_ss"
  | "hh_mm_ss"
  | "seconds";

export type TimerSubsecondMode = "threshold" | "always" | "never";

export interface TimerFormatOptions {
  format?: TimerDisplayFormat;
  subsecondMode?: TimerSubsecondMode;
  subsecondThreshold?: number;
  subsecondDecimals?: number;
}

function pad2(val: number): string {
  return val.toString().padStart(2, "0");
}

/**
 * Checks whether sub-second timing should be displayed for the given time and options.
 */
export function isSubsecondActive(
  time: number,
  options?: TimerFormatOptions,
): boolean {
  const decimals = Math.max(
    0,
    Math.min(3, Math.floor(options?.subsecondDecimals ?? 2)),
  );
  if (decimals <= 0) return false;

  const mode = options?.subsecondMode ?? "threshold";
  if (mode === "never") return false;
  if (mode === "always") return true;

  if (mode === "threshold") {
    const threshold = options?.subsecondThreshold ?? 10;
    return time > 0 && time <= threshold;
  }

  return false;
}

/**
 * Formats race/heat time according to the configured display format preset and sub-second mode.
 *
 * @param time Time in seconds (floating point or integer)
 * @param options Timer formatting preferences
 * @returns Formatted time string
 */
export function formatTimerDisplay(
  time: number,
  options?: TimerFormatOptions,
): string {
  const format: TimerDisplayFormat = options?.format ?? "dynamic";
  const decimals = Math.max(
    0,
    Math.min(3, Math.floor(options?.subsecondDecimals ?? 2)),
  );
  const showSubseconds = isSubsecondActive(time, options);

  if (time <= 0) {
    const zeroFractions = showSubseconds ? `.${"0".repeat(decimals)}` : "";
    switch (format) {
      case "hh_mm_ss":
        return `00:00:00${zeroFractions}`;
      case "mm_ss":
        return `00:00${zeroFractions}`;
      case "m_ss":
        return `0:00${zeroFractions}`;
      case "seconds":
      case "dynamic":
      default:
        return `0${zeroFractions}`;
    }
  }

  let totalSec: number;
  let fractionStr = "";

  if (showSubseconds) {
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(time * factor) / factor;
    totalSec = Math.floor(rounded);
    const fracVal = Math.round((rounded - totalSec) * factor);
    fractionStr = `.${fracVal.toString().padStart(decimals, "0")}`;
  } else {
    totalSec = Math.floor(time);
  }

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);

  switch (format) {
    case "seconds":
      return `${totalSec}${fractionStr}`;

    case "hh_mm_ss":
      return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}${fractionStr}`;

    case "mm_ss":
      if (hours > 0) {
        return `${hours}:${pad2(minutes)}:${pad2(seconds)}${fractionStr}`;
      }
      return `${pad2(minutes)}:${pad2(seconds)}${fractionStr}`;

    case "m_ss":
      if (hours > 0) {
        return `${hours}:${pad2(minutes)}:${pad2(seconds)}${fractionStr}`;
      }
      return `${minutes}:${pad2(seconds)}${fractionStr}`;

    case "dynamic":
    default:
      if (hours > 0) {
        return `${hours}:${pad2(minutes)}:${pad2(seconds)}${fractionStr}`;
      }
      if (minutes > 0) {
        return `${minutes}:${pad2(seconds)}${fractionStr}`;
      }
      return `${seconds}${fractionStr}`;
  }
}

/**
 * Practice sessions with a set length count UP (0:00 → 3:00) instead of down,
 * like RC1. Returns the session length in seconds, or 0 when the clock should
 * behave as usual. https://github.com/daufderheide/racecoordinator_ai/issues/471
 */
export function practiceCountUpLimit(race: any): number {
  if (!race?.practice) return 0;
  const scoring = race.heat_scoring;
  if (!scoring || scoring.finishMethod !== "Timed") return 0;
  const limit = Number(scoring.finishValue) || 0;
  return limit > 0 ? limit : 0;
}

/**
 * The elapsed session time to show for a counting-up practice, or null when
 * the clock shows something else (the break countdown, or no practice).
 * `remaining` is the server's count-down time.
 */
export function practiceElapsedTime(
  race: any,
  state: number,
  remaining: number,
  isRestarting = false,
): number | null {
  const limit = practiceCountUpLimit(race);
  if (!limit) return null;
  // RaceState: 1 NOT_STARTED, 2 STARTING, 3 RACING, 4 PAUSED, 5 HEAT_OVER, 6 RACE_OVER
  if (state === 2 && !isRestarting) return 0;
  if (state === 2 || state === 3 || state === 4) {
    return Math.min(limit, Math.max(0, limit - (remaining || 0)));
  }
  if ((state === 5 || state === 6) && (remaining || 0) <= 0) return limit;
  return null;
}
