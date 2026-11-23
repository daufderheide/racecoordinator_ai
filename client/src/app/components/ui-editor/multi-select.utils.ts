/**
 * Selecting several widgets in the Layout Editor (phase 4c-1).
 *
 * The editor keeps one main widget (`selectedWidgetId`, the last one
 * clicked: the panel and everything else read it) plus extras. These helpers
 * work out the new main + extras; they never change the layout.
 */

export interface Selection {
  main: string | null;
  extras: string[];
}

export interface SelectableWidget {
  id: string;
  widgetType?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  customSettings?: Record<string, any> | null;
}

/** Grid members move through their grid, so they can't join a multi-selection (yet). */
export function canMultiSelect(
  w: SelectableWidget | null | undefined,
): boolean {
  return !!w && !w.customSettings?.["gridId"];
}

/** All selected ids, main first, without ids that are gone or doubled. */
export function selectedIds(sel: Selection, existing?: Set<string>): string[] {
  const out: string[] = [];
  for (const id of [sel.main, ...sel.extras]) {
    if (!id || out.includes(id)) continue;
    if (existing && !existing.has(id)) continue;
    out.push(id);
  }
  return out;
}

/**
 * Shift / Ctrl-click: add a widget (it becomes the main one, the old main
 * stays selected) or take it out again (the most recent extra becomes main).
 */
export function toggleSelection(sel: Selection, id: string): Selection {
  const all = selectedIds(sel);
  if (!all.includes(id)) {
    return {
      main: id,
      extras: sel.main ? [...sel.extras.filter((e) => e !== id), sel.main] : [],
    };
  }
  const rest = all.filter((x) => x !== id);
  if (sel.main !== id) {
    return { main: sel.main, extras: rest.filter((x) => x !== sel.main) };
  }
  const main = rest.length ? rest[rest.length - 1] : null;
  return { main, extras: rest.filter((x) => x !== main) };
}

/** Make an already selected widget the main one; the others stay selected. */
export function makeMain(sel: Selection, id: string): Selection {
  const all = selectedIds(sel);
  if (!all.includes(id)) return sel;
  return { main: id, extras: all.filter((x) => x !== id) };
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A box from two corners, in any direction. */
export function boxFromPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Box {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

/**
 * Widgets fully inside the box (a full-screen background would otherwise be
 * caught every time). Grid members are skipped.
 */
export function widgetsInBox(
  widgets: SelectableWidget[],
  box: Box,
  skip: (w: SelectableWidget) => boolean = () => false,
): string[] {
  return (widgets || [])
    .filter(
      (w) =>
        canMultiSelect(w) &&
        !skip(w) &&
        w.x >= box.x &&
        w.y >= box.y &&
        w.x + w.width <= box.x + box.w &&
        w.y + w.height <= box.y + box.h,
    )
    .map((w) => w.id);
}

/**
 * The selection after a box: the boxed widgets, or (with Shift) the boxed
 * widgets added to what was selected. The main widget stays main when it is
 * still selected; otherwise the first boxed one becomes main.
 */
export function selectionFromBox(
  sel: Selection,
  boxed: string[],
  additive: boolean,
): Selection {
  const all = additive
    ? [
        ...selectedIds(sel),
        ...boxed.filter((id) => !selectedIds(sel).includes(id)),
      ]
    : boxed;
  if (!all.length) return additive ? sel : { main: null, extras: [] };
  const main = sel.main && all.includes(sel.main) ? sel.main : all[0];
  return { main, extras: all.filter((x) => x !== main) };
}

export interface GroupStart {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How far a group can move: the wanted dx / dy, cut so no member leaves the
 * canvas (phase 4c-2). The group keeps its shape.
 */
export function clampGroupDelta(
  starts: GroupStart[],
  dx: number,
  dy: number,
  baseWidth: number,
  baseHeight: number,
): { dx: number; dy: number } {
  let minDx = -Infinity;
  let maxDx = Infinity;
  let minDy = -Infinity;
  let maxDy = Infinity;
  for (const s of starts) {
    minDx = Math.max(minDx, -s.x);
    maxDx = Math.min(maxDx, baseWidth - s.width - s.x);
    minDy = Math.max(minDy, -s.y);
    maxDy = Math.min(maxDy, baseHeight - s.height - s.y);
  }
  const clamp = (v: number, lo: number, hi: number) =>
    lo > hi ? 0 : Math.max(lo, Math.min(hi, v));
  return { dx: clamp(dx, minDx, maxDx), dy: clamp(dy, minDy, maxDy) };
}

/** Widgets of a selection that may move: not locked, not in a grid. */
export function movableIds(widgets: any[], ids: string[]): string[] {
  const byId = new Map<string, any>((widgets || []).map((w) => [w.id, w]));
  return ids.filter((id) => {
    const w = byId.get(id);
    return w && canMultiSelect(w) && w.customSettings?.["locked"] !== true;
  });
}

/**
 * Moves the dragged widget and the others selected with it by the same
 * amount, cut so nobody leaves the canvas (phase 4c-2). `lead` is where the
 * dragged widget started, `widget` its live layout entry (already moved to
 * where the pointer wants it), `find` gives the others' live entries.
 */
export function moveGroup(
  lead: GroupStart,
  widget: { x: number; y: number },
  group: GroupStart[],
  find: (id: string) => { x: number; y: number } | undefined,
  baseWidth: number,
  baseHeight: number,
): void {
  const d = clampGroupDelta(
    [lead, ...group],
    widget.x - lead.x,
    widget.y - lead.y,
    baseWidth,
    baseHeight,
  );
  widget.x = lead.x + d.dx;
  widget.y = lead.y + d.dy;
  for (const g of group) {
    const other = find(g.id);
    if (other) {
      other.x = g.x + d.dx;
      other.y = g.y + d.dy;
    }
  }
}
