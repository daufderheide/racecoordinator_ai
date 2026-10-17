import { AbsoluteWidgetNode } from "@app/models/settings";

export class LaneGridStyleHelper {
  public static syncCrossColumnProperty(
    gridId: string,
    propertyGroup: "header" | "value" | "border" | "time" | "highlight",
    sourceSettings: Record<string, any>,
    allWidgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[] {
    if (!gridId || !sourceSettings || !allWidgets) return allWidgets || [];

    const headerKeys = [
      "headerFontFamily",
      "headerFontSize",
      "headerTextColor",
      "headerBackgroundColor",
      "headerAlignment",
      "headerHeight",
    ];
    const valueKeys = [
      "valueFontFamily",
      "valueFontSize",
      "valueTextColor",
      "valueAlignment",
    ];
    const borderKeys = [
      "showBorder",
      "borderColor",
      "borderWidth",
      "borderRadius",
      "useLaneColors",
      "backgroundColor",
      "textColor",
    ];
    const highlightKeys = ["highlightRowOnLap"];
    const timeKeys = [
      "timeDecimalPlaces",
      "timeDisplayFormat",
      "timeSubsecondMode",
      "timeSubsecondThreshold",
      "timeSubsecondDecimals",
    ];

    let targetKeys: string[] = [];
    if (propertyGroup === "header") targetKeys = headerKeys;
    else if (propertyGroup === "value") targetKeys = valueKeys;
    else if (propertyGroup === "border") targetKeys = borderKeys;
    else if (propertyGroup === "highlight") targetKeys = highlightKeys;
    else if (propertyGroup === "time") targetKeys = timeKeys;

    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;
      if (propertyGroup === "value" && w.customSettings?.["isHeaderWidget"]) {
        return w;
      }
      if (
        sourceSettings["mirrorRows"] === false &&
        !sourceSettings["isHeaderWidget"] &&
        !w.customSettings?.["isHeaderWidget"] &&
        Number(
          w.customSettings?.["gridLane"] ?? w.customSettings?.["targetIndex"],
        ) !==
          Number(sourceSettings["gridLane"] ?? sourceSettings["targetIndex"])
      ) {
        return w;
      }

      const nextSettings = { ...(w.customSettings || {}) };
      for (const k of targetKeys) {
        if (sourceSettings[k] !== undefined) {
          nextSettings[k] = sourceSettings[k];
        } else if (sourceSettings["_reset_" + k]) {
          delete nextSettings[k];
        }
      }
      return {
        ...w,
        customSettings: nextSettings,
      };
    });
  }

  public static updateGridLinkColumns(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    link: boolean,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        if (w.customSettings) {
          w.customSettings["linkColumns"] = link;
        }
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            linkColumns: link,
          },
        };
      }
      return w;
    });
  }

  public static updateGridSortByBindingMode(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    sortByBindingMode: boolean,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        if (w.customSettings) {
          w.customSettings["sortByBindingMode"] = sortByBindingMode;
        }
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            sortByBindingMode,
          },
        };
      }
      return w;
    });
  }

  public static updateGridSortOrder(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    sortOrder: "lane" | "position" | "overallPosition" | "seed",
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        if (w.customSettings) {
          w.customSettings["bindingMode"] = sortOrder;
        }
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            bindingMode: sortOrder,
          },
        };
      }
      return w;
    });
  }

  public static updateGridLayoutOrientation(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    orientation: "vertical" | "horizontal",
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    const validOrientation =
      orientation === "horizontal" ? "horizontal" : "vertical";
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            layoutOrientation: validOrientation,
          },
        };
      }
      return w;
    });
  }

  public static updateGridType(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    gridType: "heat" | "overall",
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    const validGridType = gridType === "overall" ? "overall" : "heat";
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        if (w.customSettings) {
          w.customSettings["gridType"] = validGridType;
        }
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            gridType: validGridType,
          },
        };
      }
      return w;
    });
  }
}
