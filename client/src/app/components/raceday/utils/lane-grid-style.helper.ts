import { AbsoluteWidgetNode } from "@app/models/settings";

import type { LaneGridSession } from "./lane-grid-replication.helper";

export class LaneGridStyleHelper {
  public static syncCrossColumnProperty(
    gridId: string,
    propertyGroup: "header" | "value" | "border" | "time" | "highlight",
    sourceSettings: Record<string, any>,
    allWidgets: AbsoluteWidgetNode[],
    sourceWidgetId?: string,
    sourceScaleMode?: "auto" | "fixed" | "",
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
      "backgroundColor",
      "textColor",
      "useLaneColors",
    ];
    const borderKeys = [
      "showBorder",
      "borderColor",
      "borderWidth",
      "borderRadius",
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

    const sourceMasterId =
      sourceSettings["gridMasterId"] || sourceWidgetId || "";
    const forceAll = Boolean(sourceSettings["_forceAllColumns"]);

    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;
      if (
        (propertyGroup === "value" ||
          propertyGroup === "highlight" ||
          propertyGroup === "time") &&
        w.customSettings?.["isHeaderWidget"]
      ) {
        return w;
      }
      if (
        sourceSettings["isHeaderWidget"] &&
        propertyGroup !== "header" &&
        propertyGroup !== "border"
      ) {
        return w;
      }
      if (!forceAll && sourceSettings["linkColumns"] === false) {
        const wMasterId = w.customSettings?.["gridMasterId"] || w.id;
        if (sourceMasterId && wMasterId !== sourceMasterId) {
          return w;
        }
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
        ...(sourceScaleMode !== undefined
          ? { scaleMode: sourceScaleMode }
          : {}),
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
    const existingType = allWidgets.find(
      (w) =>
        w.customSettings?.["gridId"] === gridId &&
        w.customSettings?.["gridType"],
    )?.customSettings?.["gridType"];
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        if (w.customSettings) {
          w.customSettings["bindingMode"] = sortOrder;
          if (existingType && !w.customSettings["gridType"]) {
            w.customSettings["gridType"] = existingType;
          }
        }
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            bindingMode: sortOrder,
            ...(existingType && !w.customSettings?.["gridType"]
              ? { gridType: existingType }
              : {}),
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

  public static inheritGridStyles(
    targetWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    allWidgets: AbsoluteWidgetNode[],
  ): void {
    if (!targetWidget || !session) return;
    if (!targetWidget.customSettings) {
      targetWidget.customSettings = {};
    }

    const existing = (allWidgets || []).filter(
      (w) =>
        w.id !== targetWidget.id &&
        w.customSettings?.["gridMasterId"] !== targetWidget.id &&
        w.customSettings?.["gridId"] === session.gridId &&
        !w.customSettings?.["isHeaderWidget"],
    );

    if (existing.length === 0 && session.useLaneColors === undefined) {
      return;
    }

    const ref =
      existing.find((w) => {
        const s = w.customSettings;
        return Boolean(
          s &&
          (!s["gridMasterId"] || s["gridMasterId"] === w.id) &&
          !w.id.includes("_grid_lane_") &&
          Number(s["gridLane"] ?? s["targetIndex"]) === session.sourceLaneIndex,
        );
      }) || existing[0];

    const refSettings = ref?.customSettings;
    const isLinked =
      session.linkColumns !== false && refSettings?.["linkColumns"] !== false;

    this.applyGridColorInheritance(
      targetWidget,
      session,
      refSettings,
      existing,
      isLinked,
    );

    if (refSettings && isLinked) {
      this.applyGridValueAndBorderInheritance(targetWidget, refSettings);
      this.applyGridHeaderAndTimerInheritance(targetWidget, refSettings);
      if (ref.scaleMode !== undefined) {
        targetWidget.scaleMode = ref.scaleMode;
      }
    }
  }

  private static applyGridColorInheritance(
    targetWidget: AbsoluteWidgetNode,
    session: LaneGridSession,
    refSettings: Record<string, any> | undefined,
    existing: AbsoluteWidgetNode[],
    isLinked: boolean,
  ): void {
    const target = targetWidget.customSettings!;
    const gridHasLaneColorsDisabled =
      session.useLaneColors === false ||
      (existing.length > 0 &&
        existing.every((w) => w.customSettings?.["useLaneColors"] === false));

    const useLaneColors = gridHasLaneColorsDisabled
      ? false
      : isLinked && refSettings?.["useLaneColors"] !== undefined
        ? refSettings["useLaneColors"]
        : session.useLaneColors !== undefined
          ? session.useLaneColors
          : refSettings?.["useLaneColors"] !== undefined
            ? refSettings["useLaneColors"]
            : true;

    target["useLaneColors"] = useLaneColors;

    if (!useLaneColors) {
      target["backgroundColor"] =
        refSettings?.["backgroundColor"] ||
        session.backgroundColor ||
        target["backgroundColor"] ||
        "#000000";
      target["textColor"] =
        refSettings?.["textColor"] ||
        session.textColor ||
        target["textColor"] ||
        "#ffffff";
    } else {
      if (refSettings?.["backgroundColor"] !== undefined) {
        target["backgroundColor"] = refSettings["backgroundColor"];
      }
      if (refSettings?.["textColor"] !== undefined) {
        target["textColor"] = refSettings["textColor"];
      }
    }
  }

  private static applyGridValueAndBorderInheritance(
    targetWidget: AbsoluteWidgetNode,
    refSettings: Record<string, any>,
  ): void {
    const target = targetWidget.customSettings!;
    const copyKeys = [
      "valueFontFamily",
      "valueFontSize",
      "valueTextColor",
      "valueAlignment",
      "showBorder",
      "borderColor",
      "borderWidth",
      "borderRadius",
      "highlightRowOnLap",
    ];
    for (const key of copyKeys) {
      if (refSettings[key] !== undefined) {
        target[key] = refSettings[key];
      }
    }
  }

  private static applyGridHeaderAndTimerInheritance(
    targetWidget: AbsoluteWidgetNode,
    refSettings: Record<string, any>,
  ): void {
    const target = targetWidget.customSettings!;
    const copyKeys = [
      "headerFontFamily",
      "headerFontSize",
      "headerTextColor",
      "headerBackgroundColor",
      "headerAlignment",
      "headerHeight",
      "timeDecimalPlaces",
      "timeDisplayFormat",
      "timeSubsecondMode",
      "timeSubsecondThreshold",
      "timeSubsecondDecimals",
    ];
    for (const key of copyKeys) {
      if (refSettings[key] !== undefined) {
        target[key] = refSettings[key];
      }
    }
  }
}
