/**
 * Frame options every widget gets from the shared wrapper
 * (raceday-absolute-widget): a shadow and the opacity of its background.
 * Layouts without these settings look exactly as before.
 */

export type WidgetShadow = "none" | "soft" | "raised";

const SHADOWS: Record<Exclude<WidgetShadow, "none">, string> = {
  soft: "0 4px 14px rgba(0, 0, 0, 0.45)",
  raised: "0 7px 0 rgba(0, 0, 0, 0.55), 0 9px 18px rgba(0, 0, 0, 0.35)",
};

/** The CSS box-shadow for a widget's `shadow` setting, or null for none. */
export function shadowFor(shadow: unknown): string | null {
  return shadow === "soft" || shadow === "raised" ? SHADOWS[shadow] : null;
}

/**
 * A colour with the widget's background opacity (0–100) applied. Hex and
 * rgb()/rgba() colours are supported; anything else (a CSS name, a gradient)
 * is returned unchanged. 100, empty or invalid opacity = the colour as is.
 */
export function withOpacity(
  color: string | null | undefined,
  opacity: unknown,
): string | null {
  if (!color) return null;
  const pct = Number(opacity);
  if (
    opacity === undefined ||
    opacity === null ||
    opacity === "" ||
    isNaN(pct) ||
    pct >= 100
  ) {
    return color;
  }
  const a = Math.max(0, Math.min(100, pct)) / 100;
  const c = color.trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(c);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split("")
        .map((x) => x + x)
        .join("");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const base = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return `rgba(${r}, ${g}, ${b}, ${round(base * a)})`;
  }

  const rgb =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(
      c,
    );
  if (rgb) {
    const base = rgb[4] !== undefined ? Number(rgb[4]) : 1;
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${round(base * a)})`;
  }

  return color;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
