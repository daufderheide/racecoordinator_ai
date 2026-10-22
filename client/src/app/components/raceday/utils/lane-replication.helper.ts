import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

export interface LaneReplicationOptions {
  sourceBindingMode: "lane" | "position" | "overallPosition" | "seed";
  sourceIndex: number;
  direction: "horizontal" | "vertical";
  targetCount: number;
  distributionMode: "auto-fit" | "preserve-spacing";
  replaceExisting: boolean;
  baseWidth: number;
  baseHeight: number;
  headerPlacement?: "top" | "individual" | "none";
  headerHeight?: number;
  linkColumns?: boolean;
  sortByBindingMode?: boolean;
  gridType?: "heat" | "overall";
}

export class LaneReplicationHelper {
  private static computeReplicationPitch(
    options: LaneReplicationOptions,
    sourceWidth: number,
    sourceHeight: number,
  ): number {
    if (options.direction === "horizontal") {
      if (options.distributionMode === "auto-fit") {
        return options.baseWidth / options.targetCount;
      }
      return sourceWidth > 0
        ? sourceWidth + 20
        : options.baseWidth / options.targetCount;
    }
    if (options.distributionMode === "auto-fit") {
      return options.baseHeight / options.targetCount;
    }
    return sourceHeight > 0
      ? sourceHeight + 20
      : options.baseHeight / options.targetCount;
  }

  private static filterExistingWidgets(
    widgets: AbsoluteWidgetNode[],
    options: LaneReplicationOptions,
  ): AbsoluteWidgetNode[] {
    if (!options.replaceExisting) {
      return [...widgets];
    }
    return widgets.filter((w) => {
      if (w.widgetType !== "lane-column") return true;
      const mode = w.customSettings?.["bindingMode"] || "lane";
      const targetIndex = Number(w.customSettings?.["targetIndex"] ?? 0);
      if (
        mode === options.sourceBindingMode &&
        targetIndex !== Number(options.sourceIndex)
      ) {
        return targetIndex >= options.targetCount;
      }
      return true;
    });
  }

  private static createReplicatedHeaderWidgets(
    sourceWidgets: AbsoluteWidgetNode[],
    options: LaneReplicationOptions,
    minY: number,
    timestamp: number,
  ): AbsoluteWidgetNode[] {
    if (options.headerPlacement !== "top") {
      return [];
    }
    const headerH =
      options.headerHeight != null ? Math.max(20, options.headerHeight) : 36;
    const headerWidgets: AbsoluteWidgetNode[] = [];
    let counter = 0;
    for (const src of sourceWidgets) {
      counter++;
      const headerSettings = deepCopy(src.customSettings || {});
      headerSettings["isHeaderWidget"] = true;
      headerSettings["showHeader"] = true;
      headerSettings["headerPlacement"] = "top";
      headerSettings["headerHeight"] = headerH;
      if (options.linkColumns != null) {
        headerSettings["linkColumns"] = options.linkColumns;
      }

      const headerNode: AbsoluteWidgetNode = {
        ...deepCopy(src),
        id: `widget-replicated-header-${timestamp}-${counter}`,
        x: src.x,
        y: Math.max(0, minY - headerH),
        height: headerH,
        zIndex: (src.zIndex ?? 10) + 1,
        customSettings: headerSettings,
      };
      headerWidgets.push(headerNode);
    }
    return headerWidgets;
  }

  private static createReplicatedLaneWidgets(
    sourceWidgets: AbsoluteWidgetNode[],
    options: LaneReplicationOptions,
    pitch: number,
    timestamp: number,
  ): AbsoluteWidgetNode[] {
    const laneWidgets: AbsoluteWidgetNode[] = [];
    let counter = 0;
    for (let k = 0; k < options.targetCount; k++) {
      if (k === options.sourceIndex) {
        continue;
      }

      const step = k - options.sourceIndex;
      const dx = options.direction === "horizontal" ? step * pitch : 0;
      const dy = options.direction === "vertical" ? step * pitch : 0;

      for (const src of sourceWidgets) {
        counter++;
        const clonedSettings = deepCopy(src.customSettings || {});
        clonedSettings["targetIndex"] = k;
        clonedSettings["bindingMode"] = options.sourceBindingMode;

        if (options.headerPlacement === "top") {
          clonedSettings["showHeader"] = false;
          clonedSettings["headerPlacement"] = "top";
          clonedSettings["headerHeight"] = options.headerHeight ?? 36;
        } else if (options.headerPlacement === "none") {
          clonedSettings["showHeader"] = false;
          clonedSettings["headerPlacement"] = "none";
        }
        if (options.linkColumns != null) {
          clonedSettings["linkColumns"] = options.linkColumns;
        }
        if (options.sortByBindingMode != null) {
          clonedSettings["sortByBindingMode"] = options.sortByBindingMode;
        }
        if (
          options.gridType != null ||
          src.customSettings?.["gridType"] != null
        ) {
          clonedSettings["gridType"] =
            options.gridType ?? src.customSettings?.["gridType"];
        }

        const newX = Math.max(
          0,
          Math.min(options.baseWidth - src.width, Math.round(src.x + dx)),
        );
        const newY = Math.max(
          0,
          Math.min(options.baseHeight - src.height, Math.round(src.y + dy)),
        );

        const clone: AbsoluteWidgetNode = {
          ...deepCopy(src),
          id: `widget-replicated-${timestamp}-${k}-${counter}`,
          x: newX,
          y: newY,
          customSettings: clonedSettings,
        };

        laneWidgets.push(clone);
      }
    }
    return laneWidgets;
  }

  private static updateSourceWidgetsSettings(
    resultWidgets: AbsoluteWidgetNode[],
    sourceWidgets: AbsoluteWidgetNode[],
    options: LaneReplicationOptions,
  ): AbsoluteWidgetNode[] {
    if (
      options.headerPlacement !== "top" &&
      options.headerPlacement !== "none"
    ) {
      return resultWidgets;
    }
    return resultWidgets.map((w) => {
      if (sourceWidgets.some((s) => s.id === w.id)) {
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            showHeader: false,
            headerPlacement: options.headerPlacement,
            ...(options.headerHeight
              ? { headerHeight: options.headerHeight }
              : {}),
            ...(options.linkColumns != null
              ? { linkColumns: options.linkColumns }
              : {}),
            ...(options.sortByBindingMode != null
              ? { sortByBindingMode: options.sortByBindingMode }
              : {}),
          },
        };
      }
      return w;
    });
  }

  public static replicateLaneWidgets(
    widgets: AbsoluteWidgetNode[],
    options: LaneReplicationOptions,
  ): AbsoluteWidgetNode[] {
    if (!widgets || widgets.length === 0 || options.targetCount <= 1) {
      return widgets || [];
    }

    const sourceWidgets = widgets.filter((w) => {
      if (w.widgetType !== "lane-column") return false;
      const mode = w.customSettings?.["bindingMode"] || "lane";
      const targetIndex = Number(w.customSettings?.["targetIndex"] ?? 0);
      return (
        mode === options.sourceBindingMode &&
        targetIndex === Number(options.sourceIndex)
      );
    });

    if (sourceWidgets.length === 0) {
      return widgets;
    }

    const minX = Math.min(...sourceWidgets.map((w) => w.x));
    const maxX = Math.max(...sourceWidgets.map((w) => w.x + w.width));
    const minY = Math.min(...sourceWidgets.map((w) => w.y));
    const maxY = Math.max(...sourceWidgets.map((w) => w.y + w.height));
    const sourceWidth = maxX - minX;
    const sourceHeight = maxY - minY;

    const pitch = this.computeReplicationPitch(
      options,
      sourceWidth,
      sourceHeight,
    );
    const timestamp = Date.now();

    let resultWidgets = this.filterExistingWidgets(widgets, options);
    const headerWidgets = this.createReplicatedHeaderWidgets(
      sourceWidgets,
      options,
      minY,
      timestamp,
    );
    const clonedLaneWidgets = this.createReplicatedLaneWidgets(
      sourceWidgets,
      options,
      pitch,
      timestamp,
    );
    resultWidgets = this.updateSourceWidgetsSettings(
      resultWidgets,
      sourceWidgets,
      options,
    );

    return [...resultWidgets, ...headerWidgets, ...clonedLaneWidgets];
  }
}
