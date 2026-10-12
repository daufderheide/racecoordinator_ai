import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import {
  GridLabelPosition,
  LaneGridLabelHelper,
} from "./lane-grid-label.helper";
import { LaneGridSession } from "./lane-grid-replication.helper";

export class LaneGridDetachHelper {
  public static detachGrid(
    widgets: AbsoluteWidgetNode[],
    gridId: string,
  ): AbsoluteWidgetNode[] {
    if (!widgets || !gridId) return widgets || [];

    const gridWidgets = widgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return widgets;

    const first = gridWidgets[0];
    const labelPosition = first.customSettings?.[
      "gridLabelPosition"
    ] as GridLabelPosition;
    const labelText = first.customSettings?.["gridLabelText"];

    const titleWidget = this.createTitleWidgetIfPresent(
      widgets,
      gridWidgets,
      gridId,
      first,
      labelPosition,
      labelText,
    );

    const detached = widgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        return {
          ...w,
          customSettings: this.stripGridSettings(w.customSettings),
        };
      }
      return w;
    });

    if (titleWidget) {
      detached.push(titleWidget);
    }

    return detached;
  }

  private static createTitleWidgetIfPresent(
    allWidgets: AbsoluteWidgetNode[],
    gridWidgets: AbsoluteWidgetNode[],
    gridId: string,
    first: AbsoluteWidgetNode,
    labelPosition?: GridLabelPosition,
    labelText?: string,
  ): AbsoluteWidgetNode | null {
    if (!labelPosition || labelPosition === "none") return null;

    const bounds = LaneGridGeometryHelper.calculateGridBounds(
      allWidgets,
      gridId,
    );
    if (!bounds) return null;

    const sessionLike: LaneGridSession = {
      gridId,
      bounds,
      totalLanes: Number(first.customSettings?.["gridTotalLanes"]) || 4,
      direction: first.customSettings?.["gridDirection"] || "vertical",
      sourceLaneIndex: 0,
      bindingMode: first.customSettings?.["bindingMode"] || "lane",
      headerPlacement:
        first.customSettings?.["headerPlacement"] || "individual",
      headerHeight: Number(first.customSettings?.["headerHeight"]) || 36,
      gridLabelPosition: labelPosition,
      gridLabelText: labelText || "",
      gridLabelSize: Number(first.customSettings?.["gridLabelSize"]) || 40,
    };

    const labelBounds = LaneGridLabelHelper.computeGridLabelBounds(sessionLike);
    if (!labelBounds) return null;

    const maxZ = Math.max(150, ...gridWidgets.map((w) => (w.zIndex || 10) + 1));
    return {
      id: `label-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      widgetType: "label",
      x: labelBounds.x,
      y: labelBounds.y,
      width: labelBounds.width,
      height: labelBounds.height,
      zIndex: maxZ,
      customSettings: {
        text: labelText || "",
        fontFamily: first.customSettings?.["gridLabelFontFamily"] || "",
        fontSize:
          first.customSettings?.["gridLabelFontSize"] != null
            ? Number(first.customSettings["gridLabelFontSize"])
            : 18,
        textColor: first.customSettings?.["gridLabelTextColor"] || "#ffffff",
        backgroundColor:
          first.customSettings?.["gridLabelBackgroundColor"] ||
          "rgba(15, 23, 42, 0.85)",
        fontBold: first.customSettings?.["gridLabelFontBold"] !== false,
        fontItalic: Boolean(first.customSettings?.["gridLabelFontItalic"]),
        alignment: first.customSettings?.["gridLabelAlignment"] || "center",
        vertical: labelPosition === "left" || labelPosition === "right",
        showBorder: first.customSettings?.["gridLabelShowBorder"] !== false,
        borderColor: first.customSettings?.["gridLabelBorderColor"] || "",
        borderWidth:
          first.customSettings?.["gridLabelBorderWidth"] != null
            ? Number(first.customSettings["gridLabelBorderWidth"])
            : 1,
        borderRadius:
          first.customSettings?.["gridLabelBorderRadius"] != null
            ? Number(first.customSettings["gridLabelBorderRadius"])
            : 4,
      },
    };
  }

  private static stripGridSettings(
    source?: Record<string, any>,
  ): Record<string, any> {
    const nextSettings = { ...(source || {}) };
    const gridKeys = [
      "gridId",
      "gridLane",
      "gridTotalLanes",
      "gridDirection",
      "gridBounds",
      "gridMasterId",
      "cellWidthRatio",
      "cellHeightRatio",
      "cellOffsetXRatio",
      "cellOffsetYRatio",
      "headerPlacement",
      "headerHeight",
      "linkColumns",
      "mirrorRows",
      "sortByBindingMode",
      "gridLabelPosition",
      "gridLabelText",
      "gridLabelSize",
      "gridLabelFontFamily",
      "gridLabelFontSize",
      "gridLabelTextColor",
      "gridLabelBackgroundColor",
      "gridLabelFontBold",
      "gridLabelFontItalic",
      "gridLabelAlignment",
      "gridLabelShowBorder",
      "gridLabelBorderColor",
      "gridLabelBorderWidth",
      "gridLabelBorderRadius",
    ];
    for (const key of gridKeys) {
      delete nextSettings[key];
    }
    return nextSettings;
  }
}
