/**
 * Layer order for the Layout Editor (phase 4b).
 *
 * The saved order is the widgets' `zIndex`. Only the Layout folder's layer
 * buttons change it; pressing or dragging a widget lifts it on top just while
 * dragging (see the wrapper and DefaultRacedayLayoutBase.liftedIds).
 *
 * - The menu bar and the countdown have fixed layers and are left out.
 * - A grid (widgets sharing a `gridId`) moves as one block and keeps its own
 *   inner order.
 * - Widgets with the same zIndex keep the order they are drawn in (their
 *   order in the layout).
 */

export type LayerMove = "front" | "forward" | "backward" | "back";

export interface LayerWidget {
  id: string;
  widgetType?: string;
  zIndex?: number | null;
  customSettings?: Record<string, any> | null;
}

/**
 * Added to a widget's zIndex while it's dragged, so it's drawn above the
 * others but still below the menu bar (99999) and countdown (100000+).
 */
export const LIFTED_Z = 90000;

/** The lowest zIndex the editor gives a widget (same as a new widget's). */
const BASE_Z = 100;

export function hasFixedLayer(w: LayerWidget | null | undefined): boolean {
  return w?.widgetType === "menu-bar" || w?.widgetType === "countdown";
}

const z = (w: LayerWidget) => (w.zIndex != null ? w.zIndex : BASE_Z);

/** Blocks from back to front: a grid is one block, any other widget its own. */
function blocks(widgets: LayerWidget[]): LayerWidget[][] {
  const byKey = new Map<string, LayerWidget[]>();
  const order: string[] = [];
  widgets.forEach((w) => {
    if (!w || hasFixedLayer(w)) return;
    const gridId = w.customSettings?.["gridId"];
    const key = gridId ? `grid:${gridId}` : `w:${w.id}`;
    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key)!.push(w);
  });
  const indexOf = new Map(widgets.map((w, i) => [w, i]));
  const list = order.map((k) =>
    // inner order: zIndex, then drawing order
    byKey
      .get(k)!
      .slice()
      .sort((a, b) => z(a) - z(b) || indexOf.get(a)! - indexOf.get(b)!),
  );
  // a block sits where its lowest member sits; ties keep drawing order
  const first = (b: LayerWidget[]) => indexOf.get(b[0])!;
  return list.sort((a, b) => z(a[0]) - z(b[0]) || first(a) - first(b));
}

function blockIndex(list: LayerWidget[][], id: string): number {
  return list.findIndex((b) => b.some((w) => w.id === id));
}

/** Whether the widget's block is already the front-most / back-most one. */
export function layerState(
  widgets: LayerWidget[],
  id: string,
): { top: boolean; bottom: boolean } | null {
  const list = blocks(widgets || []);
  const i = blockIndex(list, id);
  if (i < 0) return null;
  return { top: i === list.length - 1, bottom: i === 0 };
}

/**
 * Move the widget (or its whole grid) one step or all the way, then number
 * every block again from BASE_Z so the order is exact. Countdowns stay above
 * everything. Returns whether any zIndex changed.
 */
export function moveLayer(
  widgets: LayerWidget[],
  id: string,
  move: LayerMove,
): boolean {
  const list = blocks(widgets || []);
  const i = blockIndex(list, id);
  if (i < 0) return false;
  const [block] = list.splice(i, 1);
  const to =
    move === "front"
      ? list.length
      : move === "back"
        ? 0
        : move === "forward"
          ? Math.min(list.length, i + 1)
          : Math.max(0, i - 1);
  list.splice(to, 0, block);

  let changed = false;
  let next = BASE_Z;
  for (const b of list) {
    for (const w of b) {
      if (w.zIndex !== next) {
        w.zIndex = next;
        changed = true;
      }
      next++;
    }
  }
  // the countdown is always drawn on top (same rule as bringToFront)
  for (const w of widgets) {
    if (
      w?.widgetType === "countdown" &&
      (w.zIndex == null || w.zIndex < next)
    ) {
      w.zIndex = Math.max(2000, next + 100);
      changed = true;
    }
  }
  return changed;
}
