/**
 * What a widget shows where it has no value (phase 3c): its own placeholder
 * ("--", "---", "Empty Lane"...), nothing, or a text of your own.
 *
 * - `emptyValueMode`: "" (the widget's own, as before) | "blank" | "text",
 *   with `emptyValueText`.
 * - `emptyLaneMode` / `emptyLaneText`: the same for the "Empty Lane" label.
 *
 * Blank is a no-break space, so rows keep their height.
 */
export const BLANK = "\u00a0";

function pick(
  settings: Record<string, any> | null | undefined,
  modeKey: string,
  textKey: string,
  fallback: string,
): string {
  const mode = settings?.[modeKey];
  if (mode === "blank") return BLANK;
  if (mode === "text") {
    const text = String(settings?.[textKey] ?? "");
    return text.trim() ? text : BLANK;
  }
  return fallback;
}

export function emptyValue(
  settings: Record<string, any> | null | undefined,
  fallback: string,
): string {
  return pick(settings, "emptyValueMode", "emptyValueText", fallback);
}

export function emptyLaneLabel(
  settings: Record<string, any> | null | undefined,
  fallback: string,
): string {
  return pick(settings, "emptyLaneMode", "emptyLaneText", fallback);
}
