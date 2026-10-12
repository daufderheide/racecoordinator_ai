import { AbsoluteWidgetNode } from "@app/models/settings";

export class LaneGridCleanupHelper {
  public static cleanOrphanedGridWidgets(
    widgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    if (!widgets || widgets.length === 0) return widgets || [];
    const widgetIds = new Set(widgets.map((w) => w.id));
    return widgets.filter((w) => {
      const masterId = w.customSettings?.["gridMasterId"];
      if (masterId && !widgetIds.has(masterId)) {
        return false;
      }
      return true;
    });
  }
}
