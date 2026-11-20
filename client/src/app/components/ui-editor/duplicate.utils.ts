/**
 * Duplicate widgets in the Layout Editor (phase 5c).
 *
 * - Copies get a new id ("widget-" + time, like a dropped widget), the same
 *   settings, and sit 20 px down-right (kept on the canvas).
 * - They go on top of the layer order, in the same order as the originals.
 * - A copy of a locked widget is not locked, so it can be moved away.
 * - Grid columns (they have Replicate) and the fixed-layer menu bar and
 *   countdown are not duplicated.
 */
import { hasFixedLayer } from "@app/components/raceday/utils/layer-order.utils";

import { canMultiSelect } from "./multi-select.utils";

export const DUPLICATE_OFFSET = 20;

export function canDuplicate(w: any): boolean {
  return !!w && canMultiSelect(w) && !hasFixedLayer(w);
}

/**
 * Adds copies of the given widgets to `widgets` (in place) and returns the
 * new ids, in the order of `ids`.
 */
export function duplicateWidgets(
  widgets: any[],
  ids: string[],
  baseWidth = 1920,
  baseHeight = 1080,
  now = Date.now(),
): string[] {
  if (!widgets) return [];
  const byId = new Map<string, any>(widgets.map((w) => [w.id, w]));
  const sources = ids.map((id) => byId.get(id)).filter(canDuplicate);
  if (!sources.length) return [];

  const taken = new Set(widgets.map((w) => w.id));
  let stamp = now;
  const nextId = () => {
    while (taken.has(`widget-${stamp}`)) stamp++;
    const id = `widget-${stamp}`;
    taken.add(id);
    return id;
  };
  // on top, keeping the originals' order among themselves
  let z =
    Math.max(
      100,
      ...widgets
        .filter((w) => !hasFixedLayer(w))
        .map((w) => (w.zIndex != null ? w.zIndex : 100)),
    ) + 1;
  const ordered = [...sources].sort(
    (a, b) => (a.zIndex ?? 100) - (b.zIndex ?? 100),
  );
  const zFor = new Map<any, number>(ordered.map((w) => [w, z++]));

  const newIds: string[] = [];
  for (const src of sources) {
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = nextId();
    copy.x = Math.max(
      0,
      Math.min(baseWidth - (copy.width || 0), (src.x || 0) + DUPLICATE_OFFSET),
    );
    copy.y = Math.max(
      0,
      Math.min(
        baseHeight - (copy.height || 0),
        (src.y || 0) + DUPLICATE_OFFSET,
      ),
    );
    copy.zIndex = zFor.get(src);
    if (copy.customSettings?.["locked"] === true) {
      copy.customSettings["locked"] = false;
    }
    widgets.push(copy);
    newIds.push(copy.id);
  }
  // the countdown stays drawn above everything
  for (const w of widgets) {
    if (w.widgetType === "countdown" && (w.zIndex == null || w.zIndex <= z)) {
      w.zIndex = Math.max(2000, z + 100);
    }
  }
  return newIds;
}
