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
