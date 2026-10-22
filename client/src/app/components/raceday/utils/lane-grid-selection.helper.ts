import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridSession } from "./lane-grid-replication.helper";

export class LaneGridSelectionHelper {
  public static findNextWidgetAfterDeletion(
    deletedId: string,
    widgetsBefore: AbsoluteWidgetNode[],
    widgetsAfter: AbsoluteWidgetNode[],
    session?: LaneGridSession | null,
  ): string | null {
    if (!widgetsAfter || widgetsAfter.length === 0) {
      return null;
    }

    const beforeList = widgetsBefore || [];
    const deletedWidget = beforeList.find((w) => w.id === deletedId);
    const gridId = session?.gridId || deletedWidget?.customSettings?.["gridId"];

    // If deleted widget was not part of a grid, or no widgets remaining in that grid
    if (!gridId || !this.hasGridWidgets(widgetsAfter, gridId)) {
      return this.findDefaultWidget(widgetsAfter);
    }

    const resolvedMasterId =
      deletedWidget?.customSettings?.["gridMasterId"] || deletedId;

    let gridWidgetsBefore = beforeList.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgetsBefore.length === 0) {
      gridWidgetsBefore = widgetsAfter.filter(
        (w) => w.customSettings?.["gridId"] === gridId,
      );
    }

    const isMaster = (w: AbsoluteWidgetNode): boolean => {
      const s = w.customSettings;
      if (s?.["isHeaderWidget"]) return false;
      if (s?.["gridMasterId"] && s?.["gridMasterId"] !== w.id) return false;
      const lane = Number(s?.["gridLane"] ?? s?.["targetIndex"] ?? 0);
      return lane === (session?.sourceLaneIndex ?? 0);
    };

    let candidates = gridWidgetsBefore.filter(isMaster);

    if (candidates.length === 0) {
      // Fallback: non-replica, non-header widgets
      candidates = gridWidgetsBefore.filter(
        (w) =>
          !w.customSettings?.["isHeaderWidget"] &&
          (!w.customSettings?.["gridMasterId"] ||
            w.customSettings["gridMasterId"] === w.id),
      );
    }

    if (candidates.length === 0) {
      // Fallback: non-replica widgets
      candidates = gridWidgetsBefore.filter(
        (w) =>
          !w.customSettings?.["gridMasterId"] ||
          w.customSettings["gridMasterId"] === w.id,
      );
    }

    if (candidates.length === 0) {
      candidates = [...gridWidgetsBefore];
    }

    const direction =
      session?.direction ||
      gridWidgetsBefore[0]?.customSettings?.["gridDirection"] ||
      "vertical";

    // Sort candidates according to layout flow:
    // Vertical grid: columns are arranged left-to-right (x ascending), then top-to-bottom (y ascending)
    // Horizontal grid: rows are arranged top-to-bottom (y ascending), then left-to-right (x ascending)
    candidates.sort((a, b) => {
      if (direction === "horizontal") {
        if (a.y !== b.y) return (a.y ?? 0) - (b.y ?? 0);
        if (a.x !== b.x) return (a.x ?? 0) - (b.x ?? 0);
      } else {
        if (a.x !== b.x) return (a.x ?? 0) - (b.x ?? 0);
        if (a.y !== b.y) return (a.y ?? 0) - (b.y ?? 0);
      }
      return beforeList.indexOf(a) - beforeList.indexOf(b);
    });

    const deletedIndex = candidates.findIndex(
      (w) => w.id === resolvedMasterId || w.id === deletedId,
    );

    const remainingCandidates = candidates.filter(
      (w) =>
        w.id !== resolvedMasterId &&
        w.id !== deletedId &&
        widgetsAfter.some((rw) => rw.id === w.id),
    );

    if (remainingCandidates.length > 0) {
      const nextIndex =
        deletedIndex >= 0
          ? Math.min(deletedIndex, remainingCandidates.length - 1)
          : 0;
      return remainingCandidates[nextIndex].id;
    }

    // If no candidate master widgets remain in widgetsAfter, select any remaining widget in this grid
    const remainingInGrid = widgetsAfter.find(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    return remainingInGrid
      ? remainingInGrid.id
      : this.findDefaultWidget(widgetsAfter);
  }

  public static hasGridWidgets(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
  ): boolean {
    if (!widgets || !gridId) return false;
    return widgets.some((w) => w.customSettings?.["gridId"] === gridId);
  }

  public static findDefaultWidget(
    widgets: AbsoluteWidgetNode[],
  ): string | null {
    if (!widgets || widgets.length === 0) return null;
    const laneView = widgets.find((w) => w.widgetType === "lane-view");
    return laneView ? laneView.id : widgets[0].id;
  }
}
