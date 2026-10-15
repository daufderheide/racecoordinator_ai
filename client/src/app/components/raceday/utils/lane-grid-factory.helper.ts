import { AbsoluteWidgetNode } from "@app/models/settings";

import {
  LaneGridBounds,
  LaneGridReplicationHelper,
  LaneGridSession,
} from "./lane-grid-replication.helper";

export class LaneGridFactoryHelper {
  public static createNewGrid(
    bounds: LaneGridBounds,
    totalLanes: number,
    baseZIndex: number,
  ): { session: LaneGridSession; widgets: AbsoluteWidgetNode[] } {
    const gridId = `grid-${Date.now()}`;
    const rowHeight = Math.max(20, Math.round(bounds.height / totalLanes));
    const session = this.createDefaultSession(gridId, bounds, totalLanes);

    const masterWidgets = this.createMasterColumns(
      gridId,
      bounds,
      rowHeight,
      totalLanes,
      baseZIndex,
    );

    for (const master of masterWidgets) {
      LaneGridReplicationHelper.updateWidgetCellRatios(master, session);
    }

    const widgets = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
      session,
      masterWidgets,
    );

    return {
      session,
      widgets: LaneGridReplicationHelper.bakeGrid(widgets, session),
    };
  }

  private static createMasterColumns(
    gridId: string,
    bounds: LaneGridBounds,
    rowHeight: number,
    totalLanes: number,
    baseZIndex: number,
  ): AbsoluteWidgetNode[] {
    const col1Width = 260;
    const col2Width = 100;
    const col3Width = Math.max(80, bounds.width - col1Width - col2Width);

    return [
      this.createMasterNode(
        `${Date.now()}-1`,
        "driver.name",
        bounds.x,
        bounds.y,
        col1Width,
        rowHeight,
        baseZIndex,
        gridId,
        totalLanes,
      ),
      this.createMasterNode(
        `${Date.now()}-2`,
        "lapCount",
        bounds.x + col1Width,
        bounds.y,
        col2Width,
        rowHeight,
        baseZIndex,
        gridId,
        totalLanes,
      ),
      this.createMasterNode(
        `${Date.now()}-3`,
        "lastLapTime",
        bounds.x + col1Width + col2Width,
        bounds.y,
        col3Width,
        rowHeight,
        baseZIndex,
        gridId,
        totalLanes,
      ),
    ];
  }

  private static createMasterNode(
    idSuffix: string,
    columnKey: string,
    x: number,
    y: number,
    width: number,
    height: number,
    zIndex: number,
    gridId: string,
    totalLanes: number,
  ): AbsoluteWidgetNode {
    return {
      id: `widget-${idSuffix}`,
      widgetType: "lane-column",
      x,
      y,
      width,
      height,
      zIndex,
      scaleMode: "auto",
      customSettings: {
        columnKey,
        gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    };
  }

  private static createDefaultSession(
    gridId: string,
    bounds: LaneGridBounds,
    totalLanes: number,
  ): LaneGridSession {
    return {
      gridId,
      bounds,
      totalLanes,
      direction: "vertical",
      sourceLaneIndex: 0,
      bindingMode: "lane",
      headerPlacement: "individual",
      headerHeight: 36,
      linkColumns: true,
      mirrorRows: true,
      layoutOrientation: "vertical",
      gridLabelPosition: "none",
      gridLabelText: "",
      gridLabelSize: 40,
      gridLabelFontFamily: "",
      gridLabelFontSize: 18,
      gridLabelTextColor: "#ffffff",
      gridLabelBackgroundColor: "rgba(15, 23, 42, 0.85)",
      gridLabelFontBold: true,
      gridLabelFontItalic: false,
      gridLabelAlignment: "center",
      gridLabelShowBorder: true,
      gridLabelBorderColor: "",
      gridLabelBorderWidth: 1,
      gridLabelBorderRadius: 4,
    };
  }
}
