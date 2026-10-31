import {
  GridLabelPosition,
  LaneGridLabelHelper,
} from "@app/components/raceday/utils/lane-grid-label.helper";
import {
  LaneGridBounds,
  LaneGridReplicationHelper,
  LaneGridSession,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { AbsoluteWidgetNode } from "@app/models/settings";

export interface RacedayGridDescriptor {
  gridId: string;
  gridType?: "heat" | "overall";
  bounds: LaneGridBounds;
  direction: "horizontal" | "vertical";
  headerPlacement: "top" | "individual" | "none";
  headerHeight: number;
  gridTotalLanes: number;
  dataCount: number;
  hasScroll: boolean;
  zIndex: number;
  contentWidth: number;
  contentHeight: number;
  headerWidgets: AbsoluteWidgetNode[];
  cellWidgets: AbsoluteWidgetNode[];
  contentOffset: { x: number; y: number };
  headerOffset: { x: number; y: number };
  labelPosition: "none" | "top" | "bottom" | "left" | "right";
  labelText: string;
  labelSize: number;
  labelFontFamily?: string;
  labelFontSize?: number;
  labelTextColor?: string;
  labelBackgroundColor?: string;
  labelFontBold?: boolean;
  labelFontItalic?: boolean;
  labelAlignment?: "left" | "center" | "right";
  labelShowBorder?: boolean;
  labelBorderColor?: string;
  labelBorderWidth?: number;
  labelBorderRadius?: number;
  labelBounds: LaneGridBounds | null;
  dataBounds: LaneGridBounds;
  isScaleAuto?: boolean;
  effectiveLabelFontSize?: number;
  labelShouldWrap?: boolean;
}

export class RacedayGridDescriptorHelper {
  static getWidgets(host: any): any[] {
    if (!host.layout) {
      if (host.currentRacedayLayout?.widgets) {
        host.layout = JSON.parse(JSON.stringify(host.currentRacedayLayout));
      } else {
        host.layout = host.getDefaultLayout();
      }
    }
    return host.layout?.widgets || [];
  }

  static invalidateGridCache(host: any): void {
    host.cachedGridsWidgetsRef = null;
    host.cachedGridsWidgetsLength = -1;
    host.cachedNonGridWidgetsRef = null;
    host.cachedNonGridWidgetsLength = -1;
    host.cachedGridsDataCounts = "";
    host.cachedGridsParticipantsCount = -1;
    host.cachedGridsHeatDriversCount = -1;
    host.cachedGridIdsWidgetsRef = null;
    host.cachedGridIds = [];
    host.cachedOverallGridIds = undefined;
    host.cachedOverallGridWidgetsRef = null;
    host.cachedSeedGridIds = undefined;
    host.cachedSeedGridWidgetsRef = null;
    host.cachedDefaultLaneWidgetSettings = null;
    host.cachedDefaultLaneWidgetsRef = null;
    host.cachedSelectedWidgetWidgetsRef = null;
    host.cachedSelectedWidget = null;
    host.cachedWidgetIdSetWidgetsRef = null;
    host.cachedWidgetIdSet?.clear();
    host.cachedGridBoundsWidgetsRef = null;
    host.cachedGridBoundsSelWidget = null;
    host.cachedGridBounds = null;
  }

  static isGridOverall(host: any, gridId?: string): boolean {
    if (!gridId) return false;
    const session = host.gridSession();
    if (session && (!session.gridId || session.gridId === gridId)) {
      if (session.gridType === "overall") return true;
      if (session.gridType === "heat") return false;
    }

    const widgets = host.getWidgets();
    if (
      widgets !== host.cachedOverallGridWidgetsRef ||
      !host.cachedOverallGridIds
    ) {
      host.cachedOverallGridWidgetsRef = widgets;
      const set = new Set<string>();
      if (widgets) {
        const gridMap = new Map<string, any[]>();
        for (let i = 0; i < widgets.length; i++) {
          const s = widgets[i]?.customSettings;
          if (s?.["gridId"]) {
            let list = gridMap.get(s["gridId"]);
            if (!list) {
              list = [];
              gridMap.set(s["gridId"], list);
            }
            list.push(s);
          }
        }
        for (const [gid, settingsList] of gridMap.entries()) {
          const hasExplicitOverall = settingsList.some(
            (s) => s["gridType"] === "overall",
          );
          if (hasExplicitOverall) {
            set.add(gid);
            continue;
          }
          const hasExplicitHeat = settingsList.some(
            (s) => s["gridType"] === "heat",
          );
          if (hasExplicitHeat) {
            continue;
          }
          const hasLegacyOverall = settingsList.some(
            (s) => !s["gridType"] && s["bindingMode"] === "overallPosition",
          );
          if (hasLegacyOverall) {
            set.add(gid);
          }
        }
      }
      host.cachedOverallGridIds = set;
    }
    return host.cachedOverallGridIds.has(gridId);
  }

  static isGridSeed(host: any, gridId?: string): boolean {
    if (!gridId) return false;
    const session = host.gridSession();
    if (session && (!session.gridId || session.gridId === gridId)) {
      if (session.bindingMode === "seed") return true;
    }

    const widgets = host.getWidgets();
    if (widgets !== host.cachedSeedGridWidgetsRef || !host.cachedSeedGridIds) {
      host.cachedSeedGridWidgetsRef = widgets;
      const set = new Set<string>();
      if (widgets) {
        for (let i = 0; i < widgets.length; i++) {
          const s = widgets[i]?.customSettings;
          if (s?.["gridId"] && s["bindingMode"] === "seed") {
            set.add(s["gridId"]);
          }
        }
      }
      host.cachedSeedGridIds = set;
    }
    return host.cachedSeedGridIds.has(gridId);
  }

  static getGridEmptyRowsMode(
    host: any,
    gridId?: string,
  ): "remove" | "empty" | "blank" {
    if (!gridId) return "empty";
    const session = host.gridSession();
    if (session && session.gridId === gridId && session.emptyRowsMode) {
      return session.emptyRowsMode;
    }
    const widgets = host.getWidgets();
    const isOverallOrSeed =
      host.isGridOverall(gridId) || host.isGridSeed(gridId);
    if (widgets) {
      for (let i = 0; i < widgets.length; i++) {
        const s = widgets[i]?.customSettings;
        if (s?.["gridId"] === gridId) {
          if (s["emptyRowsMode"]) {
            return s["emptyRowsMode"];
          }
          if (
            s["bindingMode"] === "seed" ||
            s["gridType"] === "overall" ||
            s["bindingMode"] === "overallPosition"
          ) {
            return "remove";
          }
        }
      }
    }
    return isOverallOrSeed ? "remove" : "empty";
  }

  static getDefaultLaneWidgetSettings(host: any): any {
    const widgets = host.currentRacedayLayout?.widgets;
    if (widgets !== host.cachedDefaultLaneWidgetsRef) {
      host.cachedDefaultLaneWidgetsRef = widgets;
      const found = widgets?.find(
        (w: any) =>
          w.widgetType === "lane-view" || w.widgetType === "lane-column",
      );
      host.cachedDefaultLaneWidgetSettings = found?.customSettings || null;
    }
    return host.cachedDefaultLaneWidgetSettings;
  }

  static getNonGridWidgets(host: any): any[] {
    const widgets = host.getWidgets();
    if (
      widgets === host.cachedNonGridWidgetsRef &&
      widgets?.length === host.cachedNonGridWidgetsLength
    ) {
      return host.cachedNonGridWidgets;
    }
    host.cachedNonGridWidgetsRef = widgets;
    host.cachedNonGridWidgetsLength = widgets?.length ?? 0;
    host.cachedNonGridWidgets = widgets.filter(
      (w: any) => !w.customSettings?.["gridId"],
    );
    return host.cachedNonGridWidgets;
  }

  static getGrids(host: any): RacedayGridDescriptor[] {
    const widgets = host.getWidgets();
    if (!widgets || widgets.length === 0) {
      host.cachedGrids = [];
      host.cachedGridsWidgetsRef = null;
      host.cachedGridsWidgetsLength = -1;
      host.cachedGridsDataCounts = "";
      host.cachedGridsParticipantsCount = -1;
      host.cachedGridsHeatDriversCount = -1;
      return [];
    }

    const participantsCount = host.participants?.length || 0;
    const heatDriversCount =
      host.sortedHeatDrivers?.length || host.heat?.heatDrivers?.length || 0;

    if (
      widgets === host.cachedGridsWidgetsRef &&
      widgets.length === host.cachedGridsWidgetsLength &&
      participantsCount === host.cachedGridsParticipantsCount &&
      heatDriversCount === host.cachedGridsHeatDriversCount
    ) {
      return host.cachedGrids;
    }

    if (widgets !== host.cachedGridIdsWidgetsRef) {
      host.cachedGridIdsWidgetsRef = widgets;
      const seen = new Set<string>();
      const ids: string[] = [];
      for (let i = 0; i < widgets.length; i++) {
        const id = widgets[i]?.customSettings?.["gridId"];
        if (id && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
      host.cachedGridIds = ids;
    }
    const gridIds = host.cachedGridIds;

    const dataCountsKey = gridIds
      .map(
        (id: string) =>
          `${id}:${LaneGridReplicationHelper.getGridDataCount(widgets, id, host)}`,
      )
      .join("|");

    if (
      widgets === host.cachedGridsWidgetsRef &&
      dataCountsKey === host.cachedGridsDataCounts
    ) {
      host.cachedGridsParticipantsCount = participantsCount;
      host.cachedGridsHeatDriversCount = heatDriversCount;
      return host.cachedGrids;
    }

    const descriptors: RacedayGridDescriptor[] = [];
    for (const gridId of gridIds) {
      const desc = host.buildGridDescriptor(gridId, widgets);
      if (desc) descriptors.push(desc);
    }

    host.cachedGrids = descriptors;
    host.cachedGridsWidgetsRef = widgets;
    host.cachedGridsWidgetsLength = widgets.length;
    host.cachedGridsDataCounts = dataCountsKey;
    host.cachedGridsParticipantsCount = participantsCount;
    host.cachedGridsHeatDriversCount = heatDriversCount;

    return host.cachedGrids;
  }

  static buildGridSession(
    host: any,
    gridId: string,
    gridWidgets: AbsoluteWidgetNode[],
    bounds: any,
  ): { session: LaneGridSession; labelWidget: any } {
    const first = gridWidgets[0];
    const gridTotalLanes =
      Number(first.customSettings?.["gridTotalLanes"]) || 4;
    const direction = first.customSettings?.["gridDirection"] || "vertical";
    const headerPlacement =
      first.customSettings?.["headerPlacement"] || "individual";
    const headerHeight = Number(first.customSettings?.["headerHeight"]) || 36;
    const labelWidget =
      gridWidgets.find(
        (w: any) =>
          w.customSettings?.["gridLabelPosition"] &&
          w.customSettings?.["gridLabelPosition"] !== "none",
      ) ||
      gridWidgets.find(
        (w: any) =>
          w.customSettings?.["gridLabelText"] &&
          String(w.customSettings["gridLabelText"]).trim() !== "",
      ) ||
      gridWidgets.find((w: any) => !w.customSettings?.["isHeaderWidget"]) ||
      first;

    const labelPosition: GridLabelPosition =
      (labelWidget?.customSettings?.["gridLabelPosition"] as any) ||
      (host.getGridLabelPosition(gridId) as any) ||
      "none";
    const labelText =
      labelWidget?.customSettings?.["gridLabelText"] ??
      host.getGridCustomTitle(gridId) ??
      "";
    const labelSize =
      Number(labelWidget?.customSettings?.["gridLabelSize"]) || 40;

    const isOverallOrSeed = gridWidgets.some(
      (w: any) =>
        w.customSettings?.["gridType"] === "overall" ||
        w.customSettings?.["bindingMode"] === "overallPosition" ||
        w.customSettings?.["bindingMode"] === "seed",
    );
    const emptyRowsMode =
      (gridWidgets.find((w: any) => w.customSettings?.["emptyRowsMode"])
        ?.customSettings?.["emptyRowsMode"] as "remove" | "empty" | "blank") ||
      host.getGridEmptyRowsMode(gridId);
    const startRowOffset = Math.max(
      1,
      Number(first.customSettings?.["startRowOffset"]) || 1,
    );

    const session: LaneGridSession = {
      gridId,
      bounds,
      totalLanes: gridTotalLanes,
      direction,
      sourceLaneIndex: 0,
      bindingMode: first.customSettings?.["bindingMode"] || "lane",
      gridType: isOverallOrSeed
        ? "overall"
        : first.customSettings?.["gridType"] || "heat",
      emptyRowsMode,
      headerPlacement,
      headerHeight,
      gridLabelPosition: labelPosition,
      gridLabelText: labelText,
      gridLabelSize: labelSize,
      gridLabelShowBorder:
        labelWidget?.customSettings?.["gridLabelShowBorder"] !== false,
      gridLabelBorderColor:
        labelWidget?.customSettings?.["gridLabelBorderColor"] || "",
      gridLabelBorderWidth:
        labelWidget?.customSettings?.["gridLabelBorderWidth"] != null
          ? Number(labelWidget.customSettings["gridLabelBorderWidth"])
          : 1,
      gridLabelBorderRadius:
        labelWidget?.customSettings?.["gridLabelBorderRadius"] != null
          ? Number(labelWidget.customSettings["gridLabelBorderRadius"])
          : 4,
      startRowOffset,
    };

    return { session, labelWidget };
  }

  static partitionGridWidgets(
    sessionLike: LaneGridSession,
    allGridWidgets: AbsoluteWidgetNode[],
    headerPlacement: string,
    isVertical: boolean,
  ): {
    headerWidgets: AbsoluteWidgetNode[];
    cellWidgets: AbsoluteWidgetNode[];
  } {
    const normalizedGridWidgets =
      sessionLike.gridType === "overall"
        ? allGridWidgets.map((w) =>
            w.customSettings?.["gridType"] === "overall"
              ? w
              : {
                  ...w,
                  customSettings: {
                    ...(w.customSettings || {}),
                    gridType: "overall",
                  },
                },
          )
        : allGridWidgets;

    if (headerPlacement === "top" && isVertical) {
      return {
        headerWidgets: normalizedGridWidgets.filter(
          (w) => w.customSettings?.["isHeaderWidget"],
        ),
        cellWidgets: normalizedGridWidgets.filter(
          (w) => !w.customSettings?.["isHeaderWidget"],
        ),
      };
    }
    return {
      headerWidgets: [],
      cellWidgets: normalizedGridWidgets,
    };
  }

  static extractGridLabelSettings(
    labelWidget: any,
    sessionLike: LaneGridSession,
  ) {
    return {
      labelPosition: sessionLike.gridLabelPosition || "none",
      labelText: sessionLike.gridLabelText || "",
      labelSize: sessionLike.gridLabelSize || 40,
      labelFontFamily: labelWidget?.customSettings?.["gridLabelFontFamily"],
      labelFontSize:
        Number(labelWidget?.customSettings?.["gridLabelFontSize"]) || 18,
      labelTextColor:
        labelWidget?.customSettings?.["gridLabelTextColor"] || "#ffffff",
      labelBackgroundColor:
        labelWidget?.customSettings?.["gridLabelBackgroundColor"] ||
        "rgba(15, 23, 42, 0.85)",
      labelFontBold:
        labelWidget?.customSettings?.["gridLabelFontBold"] !== false,
      labelFontItalic: Boolean(
        labelWidget?.customSettings?.["gridLabelFontItalic"],
      ),
      labelAlignment:
        labelWidget?.customSettings?.["gridLabelAlignment"] || "center",
      labelShowBorder:
        labelWidget?.customSettings?.["gridLabelShowBorder"] !== false,
      labelBorderColor:
        labelWidget?.customSettings?.["gridLabelBorderColor"] || "",
      labelBorderWidth:
        labelWidget?.customSettings?.["gridLabelBorderWidth"] != null
          ? Number(labelWidget.customSettings["gridLabelBorderWidth"])
          : 1,
      labelBorderRadius:
        labelWidget?.customSettings?.["gridLabelBorderRadius"] != null
          ? Number(labelWidget.customSettings["gridLabelBorderRadius"])
          : 4,
    };
  }

  static syncWidgetsUnderLabel(
    host: any,
    sessionLike: LaneGridSession,
    widgets: AbsoluteWidgetNode[],
    gridWidgets: AbsoluteWidgetNode[],
    dataBounds: any,
  ): AbsoluteWidgetNode[] {
    const isAnyUnderLabel = gridWidgets.some((w: any) => {
      if (w.customSettings?.["isHeaderWidget"]) return false;
      return (
        (sessionLike.gridLabelPosition === "top" && w.y < dataBounds.y) ||
        (sessionLike.gridLabelPosition === "left" && w.x < dataBounds.x)
      );
    });
    const effectiveWidgets = isAnyUnderLabel
      ? LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
          sessionLike,
          widgets,
        )
      : widgets;
    if (isAnyUnderLabel && host.layout?.widgets === widgets) {
      host.layout.widgets = effectiveWidgets;
    }
    return effectiveWidgets;
  }

  static computeGridDimensions(
    sessionLike: LaneGridSession,
    dataBounds: any,
    dataCount: number,
    allWidgets?: AbsoluteWidgetNode[],
  ) {
    return LaneGridReplicationHelper.computeGridDimensions(
      sessionLike,
      dataBounds,
      dataCount,
      allWidgets,
    );
  }

  static buildGridDescriptor(
    host: any,
    gridId: string,
    widgets: AbsoluteWidgetNode[],
  ): RacedayGridDescriptor | null {
    const bounds = LaneGridReplicationHelper.calculateGridBounds(
      widgets,
      gridId,
    );
    if (!bounds) return null;

    const gridWidgets = widgets.filter(
      (w: any) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return null;

    const { session: sessionLike, labelWidget } = host.buildGridSession(
      gridId,
      gridWidgets,
      bounds,
    );

    const labelBounds = LaneGridLabelHelper.computeGridLabelBounds(sessionLike);
    const dataBounds = LaneGridLabelHelper.computeGridDataBounds(sessionLike);

    const effectiveWidgets = host.syncWidgetsUnderLabel(
      sessionLike,
      widgets,
      gridWidgets,
      dataBounds,
    );

    const dataCount = LaneGridReplicationHelper.getGridDataCount(
      effectiveWidgets,
      gridId,
      host,
    );
    const allGridWidgets =
      LaneGridReplicationHelper.generateScrollableGridWidgets(
        effectiveWidgets,
        gridId,
        dataCount,
      );

    const { isVertical, hasScroll, contentWidth, contentHeight } =
      host.computeGridDimensions(
        sessionLike,
        dataBounds,
        dataCount,
        effectiveWidgets,
      );

    const { headerWidgets, cellWidgets } = host.partitionGridWidgets(
      sessionLike,
      allGridWidgets,
      sessionLike.headerPlacement || "individual",
      isVertical,
    );

    const zIndex = Math.max(
      1,
      ...gridWidgets.map((w: any) => (w.zIndex != null ? w.zIndex : 100)),
    );

    const {
      labelSettings,
      isScaleAuto,
      effectiveLabelFontSize,
      labelShouldWrap,
    } = host.resolveGridLabelDescriptorData(
      sessionLike,
      labelWidget,
      gridWidgets,
      labelBounds,
    );

    return {
      gridId,
      gridType: sessionLike.gridType,
      bounds,
      direction: sessionLike.direction,
      headerPlacement: (sessionLike.headerPlacement as any) || "individual",
      headerHeight: sessionLike.headerHeight ?? 36,
      gridTotalLanes: sessionLike.totalLanes,
      dataCount,
      hasScroll,
      zIndex,
      contentWidth,
      contentHeight,
      headerWidgets,
      cellWidgets,
      contentOffset: {
        x: dataBounds.x,
        y:
          sessionLike.headerPlacement === "top" && isVertical
            ? dataBounds.y + (sessionLike.headerHeight || 36)
            : dataBounds.y,
      },
      headerOffset: {
        x: dataBounds.x,
        y: dataBounds.y,
      },
      ...labelSettings,
      labelBounds,
      dataBounds,
      isScaleAuto,
      effectiveLabelFontSize,
      labelShouldWrap,
    };
  }

  static resolveGridLabelDescriptorData(
    sessionLike: any,
    labelWidget: any,
    gridWidgets: any[],
    labelBounds: LaneGridBounds | null,
  ) {
    const labelSettings = RacedayGridDescriptorHelper.extractGridLabelSettings(
      labelWidget,
      sessionLike,
    );

    const isScaleAuto =
      gridWidgets.some((w: any) => w.scaleMode === "auto") ||
      (sessionLike as any)?.scaleMode === "auto" ||
      labelWidget?.scaleMode === "auto";

    const labelText =
      sessionLike.gridLabelText || labelSettings.labelText || "";

    const labelFontResult = LaneGridLabelHelper.computeEffectiveLabelFont(
      labelText,
      labelBounds,
      sessionLike.gridLabelPosition,
      labelSettings.labelFontSize,
      labelSettings.labelFontFamily,
      labelSettings.labelFontBold,
      isScaleAuto,
    );

    return {
      labelSettings,
      isScaleAuto,
      effectiveLabelFontSize: labelFontResult.fontSize,
      labelShouldWrap: labelFontResult.shouldWrap,
    };
  }

  static getBlueprintGridLabelFontSize(
    host: any,
    labelBounds: LaneGridBounds | null,
  ): number {
    const session = host.gridSession();
    if (!session) return 18;
    const isAuto = host.isGridSessionScaleAuto();
    const text = session.gridLabelText || "";
    const result = LaneGridLabelHelper.computeEffectiveLabelFont(
      text,
      labelBounds,
      session.gridLabelPosition,
      session.gridLabelFontSize,
      session.gridLabelFontFamily,
      session.gridLabelFontBold,
      isAuto,
    );
    return result.fontSize;
  }

  static getBlueprintGridLabelWrap(
    host: any,
    labelBounds: LaneGridBounds | null,
  ): boolean {
    const session = host.gridSession();
    if (!session) return false;
    const isAuto = host.isGridSessionScaleAuto();
    const text = session.gridLabelText || "";
    const result = LaneGridLabelHelper.computeEffectiveLabelFont(
      text,
      labelBounds,
      session.gridLabelPosition,
      session.gridLabelFontSize,
      session.gridLabelFontFamily,
      session.gridLabelFontBold,
      isAuto,
    );
    return result.shouldWrap;
  }

  static isGridSessionScaleAuto(host: any): boolean {
    const session = host.gridSession();
    if (!session) return false;
    return (
      host.layout?.widgets?.some(
        (w: any) =>
          w.customSettings?.["gridId"] === session.gridId &&
          w.scaleMode === "auto",
      ) ?? false
    );
  }

  static getTableBodyHeight(host: any): number {
    return RacedayLayoutUtils.getTableBodyHeight(host.layout);
  }

  static getRowHeight(host: any): number {
    return RacedayLayoutUtils.getRowHeight(
      host.layout,
      host.track?.lanes?.length || 1,
    );
  }

  static getImageMetrics(host: any, colIndex: number) {
    return RacedayLayoutUtils.getImageMetrics(
      host.columns,
      colIndex,
      host.getRowHeight(),
    );
  }

  static getColumnTextX(host: any, columnIndex: number, anchor?: any): number {
    return RacedayLayoutUtils.getColumnTextX(host.columns, columnIndex, anchor);
  }

  static getColumnTextY(
    host: any,
    _columnIndex: number,
    _hasTeam: boolean = false,
    anchor?: any,
  ): number {
    return RacedayLayoutUtils.getColumnTextY(host.getRowHeight(), anchor);
  }

  static getColumnTextAnchor(
    host: any,
    columnIndex: number,
    anchor?: any,
  ): string {
    return RacedayLayoutUtils.getColumnTextAnchor(
      host.columns,
      columnIndex,
      anchor,
    );
  }

  static getColumnMaxWidth(host: any, columnIndex: number): number {
    return RacedayLayoutUtils.getColumnMaxWidth(host.columns, columnIndex);
  }

  static getAnchorFontSize(anchor: string): number {
    return RacedayLayoutUtils.getAnchorFontSize(anchor);
  }
}
