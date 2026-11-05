import { AnchorPoint } from "@app/components/raceday/column_definition";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridReplicationHelper } from "./lane-grid-replication.helper";
import {
  LaneGridMigrationBuildParams,
  LaneViewMigrationOptions,
} from "./lane-view-migration.helper";
import { RacedayLayoutUtils } from "./raceday-layout.utils";

export class LaneViewGridBuilderHelper {
  public static buildHorizontalGridWidgets(
    params: LaneGridMigrationBuildParams,
  ): AbsoluteWidgetNode[] {
    const { bounds, selectedColumns, session } = params;
    const rowHeight = Math.max(
      20,
      Math.round(bounds.height / params.totalLanes),
    );

    const finalWidths = this.computeHorizontalColumnWidths(
      selectedColumns,
      bounds.width,
      params.customColumnWidths,
      params.options,
    );

    const masterWidgets: AbsoluteWidgetNode[] = [];
    let currentX = bounds.x;

    for (let i = 0; i < selectedColumns.length; i++) {
      const colKey = selectedColumns[i];
      const colW = finalWidths[colKey] || 150;
      masterWidgets.push(
        this.buildHorizontalMasterWidget(
          params,
          colKey,
          i,
          currentX,
          colW,
          rowHeight,
        ),
      );
      currentX += colW;
    }

    for (const master of masterWidgets) {
      LaneGridReplicationHelper.updateWidgetCellRatios(master, session);
    }
    const replicated = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
      session,
      masterWidgets,
    );
    return LaneGridReplicationHelper.bakeGrid(replicated, session);
  }

  public static buildHorizontalMasterWidget(
    params: LaneGridMigrationBuildParams,
    colKey: string,
    index: number,
    x: number,
    width: number,
    height: number,
  ): AbsoluteWidgetNode {
    const colLayout = (params.options.columnLayouts || {})[colKey] || {
      [AnchorPoint.CenterCenter]: colKey,
    };

    const insets: Record<string, string> = {};
    for (const [anchor, prop] of Object.entries(colLayout)) {
      if (
        anchor !== AnchorPoint.CenterCenter &&
        anchor !== "center-center" &&
        prop
      ) {
        insets[anchor] = prop;
      }
    }

    return {
      id: `${params.baseWidgetId}-${index + 1}`,
      widgetType: "lane-column",
      x,
      y: params.bounds.y,
      width,
      height,
      zIndex: params.baseZIndex,
      scaleMode: params.scaleMode,
      customSettings: {
        columnKey: colKey,
        gridId: params.session.gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: params.totalLanes,
        gridDirection: params.session.direction,
        gridType: "heat",
        bindingMode: params.session.bindingMode,
        sortByStandings: params.session.bindingMode === "position",
        showHeader: false,
        headerPlacement: "top",
        headerHeight: params.session.headerHeight,
        layoutOrientation: params.session.layoutOrientation,
        linkColumns: true,
        sortByBindingMode: true,
        highlightRowOnLap: params.highlightRowOnLap,
        highlightLapStyle: params.highlightLapStyle,
        customLabel: params.columnLabels[colKey] || "",
        headerFontFamily: params.headerFontFamily,
        headerFontSize: params.headerFontSize,
        headerTextColor: params.headerTextColor,
        headerAlignment: "center",
        valueFontFamily: params.valueFontFamily,
        valueFontSize: params.valueFontSize,
        minFontSize: params.minFontSize,
        maxFontSize: params.maxFontSize,
        valueTextColor: params.valueTextColor,
        valueAlignment: "center",
        timeDecimalPlaces:
          params.columnDecimals[colKey] ?? params.timeDecimalPlaces,
        lapDecimalPlaces: params.lapDecimalPlaces,
        useLaneColors: true,
        ...(Object.keys(insets).length > 0 ? { insets } : {}),
        insetFontFamily: params.insetFontFamily,
        insetFontSize: params.insetFontSize,
        insetTextColor: params.insetTextColor,
        insetTimeDecimalPlaces: params.insetTimeDecimalPlaces,
        insetLapDecimalPlaces: params.insetLapDecimalPlaces,
        backgroundColor: "",
        textColor: "",
        showBorder: params.showBorder,
        borderColor: params.borderColor,
        borderWidth: params.borderWidth,
        borderRadius: params.borderRadius,
      },
    };
  }

  public static computeHorizontalColumnWidths(
    selectedColumns: string[],
    totalWidth: number,
    customColumnWidths: Record<string, number>,
    options: LaneViewMigrationOptions,
  ): Record<string, number> {
    const configuredWidths: Record<string, number> = {};
    const zeroWidthKeys = new Set<string>();
    let totalFixed = 0;

    for (const colKey of selectedColumns) {
      const layout = (options.columnLayouts || {})[colKey] || {
        [AnchorPoint.CenterCenter]: colKey,
      };
      let w: number | undefined;

      if (customColumnWidths[colKey] != null) {
        w = Number(customColumnWidths[colKey]);
      } else if (options.columnWidths?.[colKey] != null) {
        w = Number(options.columnWidths[colKey]);
      } else {
        w = RacedayLayoutUtils.getDefaultColumnWidth(colKey, layout, {
          isPractice: options.isPractice,
          isVertical: false,
        });
      }

      configuredWidths[colKey] = w;
      if (w === 0) {
        zeroWidthKeys.add(colKey);
      } else {
        totalFixed += w;
      }
    }

    const totalRemaining = Math.max(0, totalWidth - totalFixed);
    const zeroCount = zeroWidthKeys.size;
    const sharedWidth =
      zeroCount > 0 ? Math.max(80, Math.floor(totalRemaining / zeroCount)) : 0;

    const finalWidths: Record<string, number> = {};
    for (const colKey of selectedColumns) {
      finalWidths[colKey] = zeroWidthKeys.has(colKey)
        ? sharedWidth
        : configuredWidths[colKey] || 150;
    }

    const sumWidths = selectedColumns.reduce(
      (sum, k) => sum + finalWidths[k],
      0,
    );
    if (sumWidths > 0 && Math.abs(sumWidths - totalWidth) > 2) {
      const ratio = totalWidth / sumWidths;
      let accWidth = 0;
      for (let i = 0; i < selectedColumns.length; i++) {
        const k = selectedColumns[i];
        if (i === selectedColumns.length - 1) {
          finalWidths[k] = Math.max(50, totalWidth - accWidth);
        } else {
          finalWidths[k] = Math.max(50, Math.round(finalWidths[k] * ratio));
          accWidth += finalWidths[k];
        }
      }
    }

    return finalWidths;
  }

  public static buildVerticalGridWidgets(
    params: LaneGridMigrationBuildParams,
  ): AbsoluteWidgetNode[] {
    const { bounds, selectedColumns, session } = params;
    const headerWidth = Math.min(
      260,
      Math.max(
        120,
        Number(
          params.customColumnWidths["_header"] ??
            params.options.columnWidths?.["_header"] ??
            200,
        ),
      ),
    );
    session.headerPlacement = "left";
    session.headerWidth = headerWidth;

    const availWidth = Math.max(0, bounds.width - headerWidth);
    const colWidth = Math.max(50, Math.floor(availWidth / params.totalLanes));
    const rowHeights = this.computeVerticalRowHeights(
      selectedColumns,
      bounds.height,
    );

    const masterWidgets: AbsoluteWidgetNode[] = [];
    const headerWidgets: AbsoluteWidgetNode[] = [];
    let currentY = bounds.y;

    for (let i = 0; i < selectedColumns.length; i++) {
      const colKey = selectedColumns[i];
      const rowH = rowHeights[colKey];
      const { master, header } = this.buildVerticalMasterAndHeaderNodes(
        params,
        colKey,
        i,
        currentY,
        colWidth,
        headerWidth,
        rowH,
      );

      masterWidgets.push(master);
      headerWidgets.push(header);
      currentY += rowH;
    }

    for (const master of masterWidgets) {
      LaneGridReplicationHelper.updateWidgetCellRatios(master, session);
    }
    const replicated = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
      session,
      [...masterWidgets, ...headerWidgets],
    );
    return LaneGridReplicationHelper.bakeGrid(replicated, session);
  }

  public static computeVerticalRowHeights(
    selectedColumns: string[],
    totalHeight: number,
  ): Record<string, number> {
    const weights: Record<string, number> = {};
    let totalWeight = 0;
    for (const colKey of selectedColumns) {
      let weight = 1;
      if (colKey === "lastLaps") {
        weight = 10;
      } else if (
        colKey === "lapCount" ||
        colKey === "physicalLapCount" ||
        colKey.toLowerCase().includes("laptime") ||
        colKey.toLowerCase().includes("time")
      ) {
        weight = 2;
      }
      weights[colKey] = weight;
      totalWeight += weight;
    }

    const rowHeights: Record<string, number> = {};
    let accHeight = 0;
    for (let i = 0; i < selectedColumns.length; i++) {
      const colKey = selectedColumns[i];
      if (i === selectedColumns.length - 1) {
        rowHeights[colKey] = Math.max(20, totalHeight - accHeight);
      } else {
        const h = Math.max(
          20,
          Math.round((totalHeight * weights[colKey]) / totalWeight),
        );
        rowHeights[colKey] = h;
        accHeight += h;
      }
    }
    return rowHeights;
  }

  public static buildVerticalMasterAndHeaderNodes(
    params: LaneGridMigrationBuildParams,
    colKey: string,
    index: number,
    y: number,
    colWidth: number,
    headerWidth: number,
    rowH: number,
  ): { master: AbsoluteWidgetNode; header: AbsoluteWidgetNode } {
    const master = this.buildVerticalMasterNode(
      params,
      colKey,
      index,
      y,
      colWidth,
      headerWidth,
      rowH,
    );
    const header = this.buildVerticalHeaderNode(
      master,
      params.bounds.x,
      y,
      headerWidth,
      rowH,
      params.baseZIndex + 1,
      params.session.gridId,
    );
    return { master, header };
  }

  public static buildVerticalMasterNode(
    params: LaneGridMigrationBuildParams,
    colKey: string,
    index: number,
    y: number,
    colWidth: number,
    headerWidth: number,
    rowH: number,
  ): AbsoluteWidgetNode {
    const colLayout = (params.options.columnLayouts || {})[colKey] || {
      [AnchorPoint.CenterCenter]: colKey,
    };

    const insets: Record<string, string> = {};
    for (const [anchor, prop] of Object.entries(colLayout)) {
      if (
        anchor !== AnchorPoint.CenterCenter &&
        anchor !== "center-center" &&
        prop
      ) {
        insets[anchor] = prop;
      }
    }

    return {
      id: `${params.baseWidgetId}-${index + 1}`,
      widgetType: "lane-column",
      x: params.bounds.x + headerWidth,
      y,
      width: colWidth,
      height: rowH,
      zIndex: params.baseZIndex,
      scaleMode: params.scaleMode,
      customSettings: {
        columnKey: colKey,
        gridId: params.session.gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: params.totalLanes,
        gridDirection: params.session.direction,
        gridType: "heat",
        bindingMode: params.session.bindingMode,
        sortByStandings: params.session.bindingMode === "position",
        showHeader: false,
        headerPlacement: "left",
        headerHeight: params.session.headerHeight,
        headerWidth,
        layoutOrientation: params.session.layoutOrientation,
        linkColumns: true,
        sortByBindingMode: true,
        highlightRowOnLap: params.highlightRowOnLap,
        highlightLapStyle: params.highlightLapStyle,
        customLabel: params.columnLabels[colKey] || "",
        headerFontFamily: params.headerFontFamily,
        headerFontSize: params.headerFontSize,
        headerTextColor: params.headerTextColor,
        headerAlignment: "center",
        valueFontFamily: params.valueFontFamily,
        valueFontSize: params.valueFontSize,
        minFontSize: params.minFontSize,
        maxFontSize: params.maxFontSize,
        valueTextColor: params.valueTextColor,
        valueAlignment: "center",
        timeDecimalPlaces:
          params.columnDecimals[colKey] ?? params.timeDecimalPlaces,
        lapDecimalPlaces: params.lapDecimalPlaces,
        useLaneColors: true,
        ...(Object.keys(insets).length > 0 ? { insets } : {}),
        insetFontFamily: params.insetFontFamily,
        insetFontSize: params.insetFontSize,
        insetTextColor: params.insetTextColor,
        insetTimeDecimalPlaces: params.insetTimeDecimalPlaces,
        insetLapDecimalPlaces: params.insetLapDecimalPlaces,
        backgroundColor: "",
        textColor: "",
        showBorder: params.showBorder,
        borderColor: params.borderColor || "rgba(255, 255, 255, 0.4)",
        borderWidth: params.borderWidth,
        borderRadius: params.borderRadius,
      },
    };
  }

  public static buildVerticalHeaderNode(
    masterNode: AbsoluteWidgetNode,
    x: number,
    y: number,
    width: number,
    height: number,
    zIndex: number,
    gridId: string,
  ): AbsoluteWidgetNode {
    const headerNode: AbsoluteWidgetNode = {
      id: `${masterNode.id}_grid_header`,
      widgetType: "lane-column",
      x,
      y,
      width,
      height,
      zIndex,
      scaleMode: masterNode.scaleMode,
      customSettings: {
        ...deepCopy(masterNode.customSettings),
        isHeaderWidget: true,
        showHeader: true,
        headerPlacement: "left",
        headerWidth: width,
        gridMasterId: masterNode.id,
        gridId,
        useLaneColors: false,
        showBorder: masterNode.customSettings?.["showBorder"] ?? true,
        borderColor:
          masterNode.customSettings?.["borderColor"] ||
          "rgba(255, 255, 255, 0.4)",
        borderWidth: masterNode.customSettings?.["borderWidth"] ?? 1,
        borderRadius: masterNode.customSettings?.["borderRadius"] ?? 0,
      },
    };
    delete headerNode.customSettings?.["targetIndex"];
    delete headerNode.customSettings?.["gridLane"];
    return headerNode;
  }
}
