/**
 * Align, distribute and same size for several selected widgets in the Layout
 * Editor (phase 4c-3). Pure: changes x / y / width / height of the widgets it
 * is given and says how many it changed.
 *
 * - `all`: every selected widget, in selection order (main first). Locked
 *   ones count for the box around the selection and for distributing, but
 *   are never moved.
 * - Results are whole pixels and stay on the canvas.
 */

export type ArrangeAction =
  | "left"
  | "centre"
  | "right"
  | "top"
  | "middle"
  | "bottom"
  | "distributeX"
  | "distributeY"
  | "sameWidth"
  | "sameHeight";

export interface ArrangeWidget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  customSettings?: Record<string, any> | null;
}

export interface ArrangeResult {
  /** Widgets whose position or size changed. */
  changed: number;
  /** Locked widgets that were left as they are. */
  skipped: number;
}

export const isLocked = (w: ArrangeWidget) =>
  w.customSettings?.["locked"] === true;

/** Distributing needs two outer widgets and at least one between them. */
export const MIN_TO_DISTRIBUTE = 3;

export function arrange(
  all: ArrangeWidget[],
  action: ArrangeAction,
  baseWidth = 1920,
  baseHeight = 1080,
): ArrangeResult {
  const list = (all || []).filter(Boolean);
  if (list.length < 2) return { changed: 0, skipped: 0 };
  const skipped = list.filter(isLocked).length;
  const before = new Map(
    list.map((w) => [w, [w.x, w.y, w.width, w.height].join()]),
  );
  const set = (
    w: ArrangeWidget,
    k: "x" | "y" | "width" | "height",
    v: number,
  ) => {
    if (!isLocked(w)) w[k] = Math.round(v);
  };

  const left = Math.min(...list.map((w) => w.x));
  const top = Math.min(...list.map((w) => w.y));
  const right = Math.max(...list.map((w) => w.x + w.width));
  const bottom = Math.max(...list.map((w) => w.y + w.height));

  switch (action) {
    case "left":
      list.forEach((w) => set(w, "x", left));
      break;
    case "centre":
      list.forEach((w) => set(w, "x", (left + right) / 2 - w.width / 2));
      break;
    case "right":
      list.forEach((w) => set(w, "x", right - w.width));
      break;
    case "top":
      list.forEach((w) => set(w, "y", top));
      break;
    case "middle":
      list.forEach((w) => set(w, "y", (top + bottom) / 2 - w.height / 2));
      break;
    case "bottom":
      list.forEach((w) => set(w, "y", bottom - w.height));
      break;
    case "distributeX":
    case "distributeY": {
      if (list.length < MIN_TO_DISTRIBUTE) break;
      const horiz = action === "distributeX";
      const pos = (w: ArrangeWidget) => (horiz ? w.x : w.y);
      const size = (w: ArrangeWidget) => (horiz ? w.width : w.height);
      // left to right (top to bottom); the outer two stay where they are
      const sorted = list
        .map((w, i) => ({ w, i }))
        .sort((a, b) => pos(a.w) - pos(b.w) || a.i - b.i)
        .map((e) => e.w);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const span = pos(last) + size(last) - pos(first);
      const used = sorted.reduce((sum, w) => sum + size(w), 0);
      const gap = (span - used) / (sorted.length - 1);
      let at = pos(first) + size(first) + gap;
      for (const w of sorted.slice(1, -1)) {
        set(w, horiz ? "x" : "y", at);
        at += size(w) + gap;
      }
      break;
    }
    case "sameWidth":
    case "sameHeight": {
      // as the main widget (the first one)
      const main = list[0];
      const horiz = action === "sameWidth";
      for (const w of list.slice(1)) {
        if (horiz) set(w, "width", Math.min(main.width, baseWidth - w.x));
        else set(w, "height", Math.min(main.height, baseHeight - w.y));
      }
      break;
    }
  }

  const changed = list.filter(
    (w) => before.get(w) !== [w.x, w.y, w.width, w.height].join(),
  ).length;
  return { changed, skipped };
}
