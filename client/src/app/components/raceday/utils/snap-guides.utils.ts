/**
 * Snapping with guide lines for the Layout Editor (phase 4a).
 *
 * Compared with RacedayLayoutUtils.snapToEdges (which stays for the grid
 * code), this one:
 * - also snaps to centres: the centre of other widgets and of the screen;
 * - picks the nearest target per axis, not the first one within range;
 * - returns the lines it snapped to, so the editor can draw them.
 */

export interface SnapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SnapResult extends SnapRect {
  /** Vertical guide lines (x positions in layout px). */
  guidesX: number[];
  /** Horizontal guide lines (y positions in layout px). */
  guidesY: number[];
}

export interface SnapWidget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SNAP_THRESHOLD = 10;

/** One axis: the edges / centre of the moving rect that may snap. */
type Edge = "start" | "center" | "end";

function targetsFor(
  widgets: SnapWidget[],
  ignoreId: string,
  axis: "x" | "y",
  size: number,
  extra: number[],
): number[] {
  // screen edges and centre line, plus anything the caller adds (grid bounds)
  const t = [0, size / 2, size, ...extra];
  for (const w of widgets || []) {
    if (!w || w.id === ignoreId) continue;
    const start = axis === "x" ? w.x : w.y;
    const len = axis === "x" ? w.width : w.height;
    if (typeof start !== "number" || typeof len !== "number") continue;
    t.push(start, start + len / 2, start + len);
  }
  return t;
}

/** The nearest target for any of the given edges, within the threshold. */
function nearest(
  candidates: { edge: Edge; value: number }[],
  targets: number[],
  threshold: number,
): { edge: Edge; target: number; delta: number } | null {
  let best: { edge: Edge; target: number; delta: number } | null = null;
  for (const c of candidates) {
    for (const t of targets) {
      const d = t - c.value;
      if (
        Math.abs(d) < threshold &&
        (!best || Math.abs(d) < Math.abs(best.delta))
      ) {
        best = { edge: c.edge, target: t, delta: d };
      }
    }
  }
  return best;
}

/**
 * Snap a rect being moved (`handle` "all") or resized (`handle` contains
 * n / s / e / w) to the other widgets and the screen.
 */
export function snapRect(
  widgets: SnapWidget[],
  rect: SnapRect,
  ignoreId: string,
  handle: string,
  layoutWidth = 1920,
  layoutHeight = 1080,
  extraX: number[] = [],
  extraY: number[] = [],
  threshold = SNAP_THRESHOLD,
): SnapResult {
  let { x, y, w, h } = rect;
  const guidesX: number[] = [];
  const guidesY: number[] = [];
  const tx = targetsFor(widgets, ignoreId, "x", layoutWidth, extraX);
  const ty = targetsFor(widgets, ignoreId, "y", layoutHeight, extraY);

  if (handle === "all") {
    const sx = nearest(
      [
        { edge: "start", value: x },
        { edge: "center", value: x + w / 2 },
        { edge: "end", value: x + w },
      ],
      tx,
      threshold,
    );
    if (sx) {
      x += sx.delta;
      guidesX.push(sx.target);
    }
    const sy = nearest(
      [
        { edge: "start", value: y },
        { edge: "center", value: y + h / 2 },
        { edge: "end", value: y + h },
      ],
      ty,
      threshold,
    );
    if (sy) {
      y += sy.delta;
      guidesY.push(sy.target);
    }
    return { x, y, w, h, guidesX, guidesY };
  }

  // resizing: only the edge being dragged moves
  if (handle.includes("w")) {
    const s = nearest([{ edge: "start", value: x }], tx, threshold);
    if (s) {
      x += s.delta;
      w -= s.delta;
      guidesX.push(s.target);
    }
  } else if (handle.includes("e")) {
    const s = nearest([{ edge: "end", value: x + w }], tx, threshold);
    if (s) {
      w += s.delta;
      guidesX.push(s.target);
    }
  }
  if (handle.includes("n")) {
    const s = nearest([{ edge: "start", value: y }], ty, threshold);
    if (s) {
      y += s.delta;
      h -= s.delta;
      guidesY.push(s.target);
    }
  } else if (handle.includes("s")) {
    const s = nearest([{ edge: "end", value: y + h }], ty, threshold);
    if (s) {
      h += s.delta;
      guidesY.push(s.target);
    }
  }
  return { x, y, w, h, guidesX, guidesY };
}
