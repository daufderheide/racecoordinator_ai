import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

export interface LaneReplicationOptions {
  sourceBindingMode: "lane" | "position";
  sourceIndex: number;
  direction: "horizontal" | "vertical";
  targetCount: number;
  distributionMode: "auto-fit" | "preserve-spacing";
  replaceExisting: boolean;
  baseWidth: number;
  baseHeight: number;
}

export class LaneReplicationHelper {
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

    let pitch: number;
    if (options.direction === "horizontal") {
      if (options.distributionMode === "auto-fit") {
        pitch = options.baseWidth / options.targetCount;
      } else {
        pitch =
          sourceWidth > 0
            ? sourceWidth + 20
            : options.baseWidth / options.targetCount;
      }
    } else {
      if (options.distributionMode === "auto-fit") {
        pitch = options.baseHeight / options.targetCount;
      } else {
        pitch =
          sourceHeight > 0
            ? sourceHeight + 20
            : options.baseHeight / options.targetCount;
      }
    }

    let resultWidgets = [...widgets];

    if (options.replaceExisting) {
      resultWidgets = resultWidgets.filter((w) => {
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

    const newClonedWidgets: AbsoluteWidgetNode[] = [];
    const timestamp = Date.now();
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

        newClonedWidgets.push(clone);
      }
    }

    return [...resultWidgets, ...newClonedWidgets];
  }
}
