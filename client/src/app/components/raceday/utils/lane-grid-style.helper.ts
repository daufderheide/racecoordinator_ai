import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import type {
  LaneGridBounds,
  LaneGridSession,
} from "./lane-grid-replication.helper";

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

    const targetKeys = this.getTargetKeys(propertyGroup);
    const sourceMasterId =
      sourceSettings["gridMasterId"] || sourceWidgetId || "";
    const forceAll = Boolean(sourceSettings["_forceAllColumns"]);
    const isHorizontal =
      sourceSettings["layoutOrientation"] === "horizontal" ||
      sourceSettings["gridDirection"] === "horizontal" ||
      allWidgets.some(
        (w) =>
          w.customSettings?.["gridId"] === gridId &&
          (w.customSettings?.["layoutOrientation"] === "horizontal" ||
            w.customSettings?.["gridDirection"] === "horizontal"),
      );

    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;
      if (
        this.shouldSkipCrossColumnWidget(
          w,
          sourceSettings,
          propertyGroup,
          sourceMasterId,
          forceAll,
          isHorizontal,
        )
      ) {
        return w;
      }
      return this.applyTargetSettings(
        w,
        targetKeys,
        sourceSettings,
        sourceScaleMode,
      );
    });
  }

  private static getTargetKeys(
    propertyGroup: "header" | "value" | "border" | "time" | "highlight",
  ): string[] {
    switch (propertyGroup) {
      case "header":
        return [
          "headerFontFamily",
          "headerFontSize",
          "headerTextColor",
          "headerBackgroundColor",
          "headerAlignment",
          "headerHeight",
        ];
      case "value":
        return [
          "valueFontFamily",
          "valueFontSize",
          "valueTextColor",
          "valueAlignment",
          "backgroundColor",
          "textColor",
          "useLaneColors",
        ];
      case "border":
        return [
          "showBorder",
          "borderColor",
          "borderStyle",
          "borderWidth",
          "borderRadius",
        ];
      case "highlight":
        return ["highlightRowOnLap", "highlightLapStyle"];
      case "time":
        return [
          "timeDecimalPlaces",
          "timeDisplayFormat",
          "timeSubsecondMode",
          "timeSubsecondThreshold",
          "timeSubsecondDecimals",
          "lastLapsCount",
          "lastLapsShowBorder",
          "lastLapsBorderMode",
          "lastLapsBorderStyle",
          "lastLapsBorderColor",
          "lastLapsBorderWidth",
          "lastLapsBorderRadius",
          "lastLapsBorderMargin",
          "lastLapsBestLapHighlight",
          "lastLapsBestLapTextColor",
          "lastLapsBestLapBackgroundColor",
          "lastLapsBestLapFontWeight",
          "lastLapsBestLapUnderline",
          "lastLapsBestLapItalic",
          "lastLapsBestLapShowBorder",
          "lastLapsBestLapBorderColor",
          "lastLapsBestLapBorderStyle",
          "lastLapsBestLapBorderWidth",
          "lastLapsBestLapBorderRadius",
        ];
    }
  }

  private static shouldSkipCrossColumnWidget(
    w: AbsoluteWidgetNode,
    sourceSettings: Record<string, any>,
    propertyGroup: "header" | "value" | "border" | "time" | "highlight",
    sourceMasterId: string,
    forceAll: boolean,
    isHorizontal: boolean,
  ): boolean {
    if (
      (propertyGroup === "value" ||
        propertyGroup === "highlight" ||
        propertyGroup === "time") &&
      w.customSettings?.["isHeaderWidget"]
    ) {
      return true;
    }
    if (
      sourceSettings["isHeaderWidget"] &&
      propertyGroup !== "header" &&
      propertyGroup !== "border"
    ) {
      return true;
    }

    const wLane = Number(
      w.customSettings?.["gridLane"] ?? w.customSettings?.["targetIndex"],
    );
    const sourceLane = Number(
      sourceSettings["gridLane"] ?? sourceSettings["targetIndex"],
    );
    const wMasterId = w.customSettings?.["gridMasterId"] || w.id;
    const isHeader =
      Boolean(sourceSettings["isHeaderWidget"]) ||
      Boolean(w.customSettings?.["isHeaderWidget"]);

    if (!isHorizontal) {
      if (
        propertyGroup === "time" &&
        !forceAll &&
        sourceMasterId &&
        wMasterId !== sourceMasterId
      ) {
        return true;
      }
      if (!forceAll && sourceSettings["linkColumns"] === false) {
        if (sourceMasterId && wMasterId !== sourceMasterId) return true;
      }
      if (
        sourceSettings["mirrorRows"] === false &&
        !isHeader &&
        wLane !== sourceLane
      ) {
        return true;
      }
    } else {
      if (
        propertyGroup === "time" &&
        !forceAll &&
        sourceMasterId &&
        wMasterId !== sourceMasterId
      ) {
        return true;
      }
      if (
        !forceAll &&
        sourceSettings["linkColumns"] === false &&
        !isHeader &&
        wLane !== sourceLane
      ) {
        return true;
      }
      if (
        sourceSettings["mirrorRows"] === false &&
        sourceMasterId &&
        wMasterId !== sourceMasterId
      ) {
        return true;
      }
    }
    return false;
  }

  private static applyTargetSettings(
    w: AbsoluteWidgetNode,
    targetKeys: string[],
    sourceSettings: Record<string, any>,
    sourceScaleMode?: "auto" | "fixed" | "",
  ): AbsoluteWidgetNode {
    const nextSettings = { ...(w.customSettings || {}) };
    for (const k of targetKeys) {
      if (
        k.startsWith("lastLaps") &&
        sourceSettings["columnKey"] &&
        sourceSettings["columnKey"] !== "lastLaps" &&
        w.customSettings?.["columnKey"] === "lastLaps"
      ) {
        continue;
      }
      if (sourceSettings[k] !== undefined) {
        nextSettings[k] = sourceSettings[k];
      } else if (sourceSettings["_reset_" + k]) {
        delete nextSettings[k];
      }
    }
    return {
      ...w,
      ...(sourceScaleMode !== undefined ? { scaleMode: sourceScaleMode } : {}),
      customSettings: nextSettings,
    };
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

  public static updateGridStartRowOffset(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    startRowOffset: number,
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    const offset = Math.max(1, Math.round(Number(startRowOffset) || 1));
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        if (w.customSettings) {
          w.customSettings["startRowOffset"] = offset;
        }
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            startRowOffset: offset,
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

  public static updateGridEmptyRowsMode(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    emptyRowsMode: "remove" | "empty" | "blank",
  ): AbsoluteWidgetNode[] {
    if (!gridId || !allWidgets) return allWidgets || [];
    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] === gridId) {
        if (w.customSettings) {
          w.customSettings["emptyRowsMode"] = emptyRowsMode;
        }
        return {
          ...w,
          customSettings: {
            ...(w.customSettings || {}),
            emptyRowsMode,
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
            gridDirection: validOrientation,
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

    const effectiveGridType = session.gridType || refSettings?.["gridType"];
    if (effectiveGridType && !targetWidget.customSettings["gridType"]) {
      targetWidget.customSettings["gridType"] = effectiveGridType;
    }
    const effectiveBindingMode =
      session.bindingMode || refSettings?.["bindingMode"];
    if (effectiveBindingMode && !targetWidget.customSettings["bindingMode"]) {
      targetWidget.customSettings["bindingMode"] = effectiveBindingMode;
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
      "highlightLapStyle",
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
      "lastLapsCount",
      "lastLapsShowBorder",
      "lastLapsBorderMode",
      "lastLapsBorderStyle",
      "lastLapsBorderColor",
      "lastLapsBorderWidth",
      "lastLapsBorderRadius",
      "lastLapsBestLapHighlight",
      "lastLapsBestLapTextColor",
      "lastLapsBestLapBackgroundColor",
      "lastLapsBestLapFontWeight",
      "lastLapsBestLapUnderline",
      "lastLapsBestLapItalic",
      "lastLapsBestLapShowBorder",
      "lastLapsBestLapBorderColor",
      "lastLapsBestLapBorderStyle",
      "lastLapsBestLapBorderWidth",
      "lastLapsBestLapBorderRadius",
    ];
    for (const key of copyKeys) {
      if (
        key.startsWith("lastLaps") &&
        refSettings["columnKey"] &&
        refSettings["columnKey"] !== "lastLaps" &&
        target["columnKey"] === "lastLaps"
      ) {
        continue;
      }
      if (refSettings[key] !== undefined) {
        target[key] = refSettings[key];
      }
    }
  }

  public static buildSessionFromGridWidgets(
    gridId: string,
    allWidgets: AbsoluteWidgetNode[],
    newTotalLanes?: number,
    existingBounds?: LaneGridBounds | null,
  ): LaneGridSession | null {
    if (!gridId || !allWidgets) return null;
    const gridWidgets = allWidgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return null;
    const first = gridWidgets[0];

    const bounds =
      existingBounds ||
      LaneGridGeometryHelper.calculateGridBounds(allWidgets, gridId);
    if (!bounds) return null;

    let validCount = Number(first.customSettings?.["gridTotalLanes"]) || 4;
    if (newTotalLanes != null && Number(newTotalLanes) > 0) {
      validCount = Math.max(1, Math.min(32, Math.round(Number(newTotalLanes))));
    }

    return {
      gridId,
      bounds,
      totalLanes: validCount,
      direction:
        first.customSettings?.["gridDirection"] ||
        first.customSettings?.["layoutOrientation"] ||
        "vertical",
      sourceLaneIndex: 0,
      bindingMode: first.customSettings?.["bindingMode"] || "lane",
      gridType:
        first.customSettings?.["gridType"] ||
        (gridWidgets.some((w) => w.customSettings?.["gridType"] === "overall")
          ? "overall"
          : "heat"),
      headerPlacement:
        first.customSettings?.["headerPlacement"] || "individual",
      headerHeight: Number(first.customSettings?.["headerHeight"]) || 36,
      linkColumns: first.customSettings?.["linkColumns"] !== false,
      mirrorRows: first.customSettings?.["mirrorRows"] !== false,
      startRowOffset: Math.max(
        1,
        Number(first.customSettings?.["startRowOffset"]) || 1,
      ),
      sortByBindingMode: first.customSettings?.["sortByBindingMode"] !== false,
      layoutOrientation:
        first.customSettings?.["layoutOrientation"] ||
        first.customSettings?.["gridDirection"] ||
        "vertical",
      gridLabelPosition: first.customSettings?.["gridLabelPosition"] || "none",
      gridLabelText: first.customSettings?.["gridLabelText"] || "",
      gridLabelSize: Number(first.customSettings?.["gridLabelSize"]) || 40,
      gridLabelFontFamily: first.customSettings?.["gridLabelFontFamily"] || "",
      gridLabelFontSize:
        Number(first.customSettings?.["gridLabelFontSize"]) || 18,
      gridLabelTextColor:
        first.customSettings?.["gridLabelTextColor"] || "#ffffff",
      gridLabelBackgroundColor:
        first.customSettings?.["gridLabelBackgroundColor"] ||
        "rgba(15, 23, 42, 0.85)",
      gridLabelFontBold: first.customSettings?.["gridLabelFontBold"] !== false,
      gridLabelFontItalic: Boolean(
        first.customSettings?.["gridLabelFontItalic"],
      ),
      gridLabelAlignment:
        first.customSettings?.["gridLabelAlignment"] || "center",
      gridLabelShowBorder:
        first.customSettings?.["gridLabelShowBorder"] !== false,
      gridLabelBorderColor:
        first.customSettings?.["gridLabelBorderColor"] || "",
      gridLabelBorderWidth:
        first.customSettings?.["gridLabelBorderWidth"] != null
          ? Number(first.customSettings["gridLabelBorderWidth"])
          : 1,
      gridLabelBorderRadius:
        first.customSettings?.["gridLabelBorderRadius"] != null
          ? Number(first.customSettings["gridLabelBorderRadius"])
          : 4,
    };
  }
}
