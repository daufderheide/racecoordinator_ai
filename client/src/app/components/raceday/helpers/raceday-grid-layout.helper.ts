import { LaneGridHeaderHelper } from "@app/components/raceday/utils/lane-grid-header.helper";
import { LaneGridLabelHelper } from "@app/components/raceday/utils/lane-grid-label.helper";
import {
  LaneGridBounds,
  LaneGridReplicationHelper,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { AbsoluteWidgetNode } from "@app/models/settings";

export class RacedayGridLayoutHelper {
  public static getGridDividers(host: any): number[] {
    const s = host.gridSession();
    return s ? LaneGridReplicationHelper.computeGridDividers(s) : [];
  }

  public static getGridCells(host: any): {
    bounds: LaneGridBounds;
    laneIndex: number;
    isMaster: boolean;
  }[] {
    const s = host.gridSession();
    if (!s) return [];
    const cells: {
      bounds: LaneGridBounds;
      laneIndex: number;
      isMaster: boolean;
    }[] = [];
    for (let k = 0; k < s.totalLanes; k++) {
      cells.push({
        bounds: LaneGridReplicationHelper.computeLaneCellBounds(s, k),
        laneIndex: k,
        isMaster: k === s.sourceLaneIndex,
      });
    }
    return cells;
  }

  public static getHeaderRowBounds(host: any): LaneGridBounds | null {
    const s = host.gridSession();
    if (!s || (s.headerPlacement !== "top" && s.headerPlacement !== "left"))
      return null;
    return LaneGridReplicationHelper.computeHeaderRowBounds(s);
  }

  public static getGridLabelBounds(host: any): LaneGridBounds | null {
    const s = host.gridSession();
    return s ? LaneGridLabelHelper.computeGridLabelBounds(s) : null;
  }

  public static getGridLabelJustify(
    position?: string,
    alignment?: string,
  ): string {
    return LaneGridLabelHelper.getLabelJustifyContent(position, alignment);
  }

  public static getSelectedWidget(host: any): AbsoluteWidgetNode | null {
    const id = host.selectedWidgetId();
    const widgets = host.layout?.widgets;
    if (!id || !widgets) return null;
    if (
      id === host.cachedSelectedWidgetId &&
      widgets === host.cachedSelectedWidgetWidgetsRef
    ) {
      return host.cachedSelectedWidget;
    }
    host.cachedSelectedWidgetId = id;
    host.cachedSelectedWidgetWidgetsRef = widgets;
    host.cachedSelectedWidget = widgets.find((w: any) => w.id === id) || null;
    return host.cachedSelectedWidget;
  }

  public static hasWidgetId(host: any, id: string): boolean {
    const widgets = host.layout?.widgets;
    if (!widgets) return false;
    if (widgets !== host.cachedWidgetIdSetWidgetsRef) {
      host.cachedWidgetIdSetWidgetsRef = widgets;
      host.cachedWidgetIdSet = new Set(widgets.map((w: any) => w.id));
    }
    return host.cachedWidgetIdSet.has(id);
  }

  public static getSelectedGridBounds(host: any): LaneGridBounds | null {
    const isEditing = host.isLayoutCustomizing || host.isUIEditorMode();
    if (!isEditing || host.gridSession()) return null;
    const sel = host.selectedWidget;
    const gridId = sel?.customSettings?.["gridId"];
    const widgets = host.layout?.widgets;
    if (!gridId || !widgets) return null;
    if (
      sel === host.cachedGridBoundsSelWidget &&
      widgets === host.cachedGridBoundsWidgetsRef
    ) {
      return host.cachedGridBounds;
    }
    host.cachedGridBoundsSelWidget = sel;
    host.cachedGridBoundsWidgetsRef = widgets;
    host.cachedGridBounds = LaneGridReplicationHelper.calculateGridBounds(
      widgets,
      gridId,
    );
    return host.cachedGridBounds;
  }

  public static getSelectedGridLabel(host: any): string {
    const sel = host.selectedWidget;
    const customTitle =
      sel?.customSettings?.["gridLabelText"]?.trim() ||
      (host.getGridCustomTitle
        ? host.getGridCustomTitle(sel?.customSettings?.["gridId"])
        : RacedayGridLayoutHelper.getGridCustomTitle(
            host,
            sel?.customSettings?.["gridId"],
          ));
    if (customTitle) {
      return customTitle;
    }
    const labelPos =
      sel?.customSettings?.["gridLabelPosition"] ||
      (host.getGridLabelPosition
        ? host.getGridLabelPosition(sel?.customSettings?.["gridId"])
        : RacedayGridLayoutHelper.getGridLabelPosition(
            host,
            sel?.customSettings?.["gridId"],
          ));
    if (labelPos && labelPos !== "none") {
      const defaultLabel = host.translationService?.translate(
        "UE_GRID_LABEL_DEFAULT",
      );
      if (defaultLabel && defaultLabel !== "UE_GRID_LABEL_DEFAULT") {
        return defaultLabel;
      }
    }
    const count =
      sel?.customSettings?.["gridTotalLanes"] || host.track?.lanes?.length || 4;
    const mode = sel?.customSettings?.["bindingMode"];
    const key =
      mode === "position"
        ? "UE_GRID_POSITION_CONTAINER_LABEL"
        : "UE_GRID_CONTAINER_LABEL";
    const translated = host.translationService?.translate(key, { count });
    if (translated && translated !== key) {
      return translated;
    }
    return mode === "position"
      ? `Position Grid (${count} Positions)`
      : `Lane Grid (${count} Lanes)`;
  }

  public static getGridCustomTitle(host: any, gridId?: string): string | null {
    if (!gridId || !host.layout?.widgets) return null;
    const match = host.layout.widgets.find(
      (w: any) =>
        w.customSettings?.["gridId"] === gridId &&
        w.customSettings?.["gridLabelText"]?.trim(),
    );
    return match?.customSettings?.["gridLabelText"]?.trim() || null;
  }

  public static getGridLabelPosition(
    host: any,
    gridId?: string,
  ): string | null {
    if (!gridId || !host.layout?.widgets) return null;
    const match = host.layout.widgets.find(
      (w: any) =>
        w.customSettings?.["gridId"] === gridId &&
        w.customSettings?.["gridLabelPosition"],
    );
    return match?.customSettings?.["gridLabelPosition"] || null;
  }

  public static handleHeaderWidgetModified(
    host: any,
    widget: AbsoluteWidgetNode,
    session: any,
  ): boolean {
    if (!LaneGridReplicationHelper.isHeaderWidget(widget)) return false;

    const masterId = widget.customSettings?.["gridMasterId"];
    const masterWidget = masterId
      ? host.layout.widgets.find((w: any) => w.id === masterId)
      : null;
    if (masterWidget && masterWidget.id !== widget.id) {
      if (session.headerPlacement === "left") {
        masterWidget.y = widget.y;
        masterWidget.height = widget.height;
      } else {
        masterWidget.x = widget.x;
        masterWidget.width = widget.width;
      }
      host.onMasterWidgetModified(masterWidget);
      return true;
    }
    host.layout.widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
      widget,
      session,
      host.layout.widgets,
    );
    host.layoutChanged.emit(host.layout);
    host.cdr.markForCheck();
    return true;
  }

  public static handleReplicaWidgetModified(
    host: any,
    widget: AbsoluteWidgetNode,
    session: any,
  ): void {
    if (session.mirrorRows !== false) {
      const masterId =
        widget.customSettings?.["gridMasterId"] ||
        widget.id.replace(/_grid_lane_\d+.*$/, "");
      const masterWidget = host.layout.widgets.find(
        (w: any) => w.id === masterId,
      );
      if (masterWidget && masterWidget.id !== widget.id) {
        masterWidget.customSettings = masterWidget.customSettings || {};
        RacedayGridLayoutHelper.copyReplicaCustomSettings(widget, masterWidget);
        host.onMasterWidgetModified(masterWidget);
      }
    } else {
      const idx = host.layout.widgets.findIndex((w: any) => w.id === widget.id);
      if (idx >= 0) {
        const nextWidgets = [...host.layout.widgets];
        nextWidgets[idx] = widget;
        host.layout.widgets = nextWidgets;
      }
      host.invalidateGridCache();
      host.layoutChanged.emit(host.layout);
      host.cdr.markForCheck();
    }
  }

  private static copyReplicaCustomSettings(
    widget: AbsoluteWidgetNode,
    masterWidget: AbsoluteWidgetNode,
  ): void {
    if (widget.customSettings?.["insets"]) {
      masterWidget.customSettings!["insets"] = {
        ...widget.customSettings["insets"],
      };
    } else {
      delete masterWidget.customSettings!["insets"];
    }
    if (widget.customSettings?.["insetsConfig"]) {
      masterWidget.customSettings!["insetsConfig"] = {
        ...widget.customSettings["insetsConfig"],
      };
    } else {
      delete masterWidget.customSettings!["insetsConfig"];
    }
    if (widget.customSettings?.["columnKey"]) {
      masterWidget.customSettings!["columnKey"] =
        widget.customSettings["columnKey"];
    }
    if (widget.customSettings?.["gapMode"] !== undefined) {
      masterWidget.customSettings!["gapMode"] =
        widget.customSettings["gapMode"];
    } else {
      delete masterWidget.customSettings!["gapMode"];
    }
    if (widget.customSettings?.["gapTarget"] !== undefined) {
      masterWidget.customSettings!["gapTarget"] =
        widget.customSettings["gapTarget"];
    } else {
      delete masterWidget.customSettings!["gapTarget"];
    }
  }

  public static onMasterWidgetModified(
    host: any,
    widget: AbsoluteWidgetNode,
  ): void {
    const session = host.gridSession();
    if (!session || !host.layout?.widgets || !widget) return;
    if (
      widget.customSettings?.["gridId"] &&
      widget.customSettings["gridId"] !== session.gridId
    ) {
      return;
    }
    host.invalidateGridCache();

    if (
      host.handleHeaderWidgetModified
        ? host.handleHeaderWidgetModified(widget, session)
        : RacedayGridLayoutHelper.handleHeaderWidgetModified(
            host,
            widget,
            session,
          )
    ) {
      return;
    }

    const isMaster = LaneGridReplicationHelper.isMasterWidget(widget, session);

    if (!isMaster) {
      if (host.handleReplicaWidgetModified) {
        host.handleReplicaWidgetModified(widget, session);
      } else {
        RacedayGridLayoutHelper.handleReplicaWidgetModified(
          host,
          widget,
          session,
        );
      }
      return;
    }

    LaneGridReplicationHelper.updateWidgetCellRatios(widget, session);
    if (session.mirrorRows !== false) {
      host.layout.widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
        widget,
        session,
        host.layout.widgets,
      );
    } else {
      const idx = host.layout.widgets.findIndex((w: any) => w.id === widget.id);
      if (idx >= 0) {
        host.layout.widgets[idx] = widget;
      }
      const headerHeight =
        session.headerHeight != null ? Math.max(20, session.headerHeight) : 36;
      LaneGridHeaderHelper.syncPlacementHeaderWidget(
        widget,
        widget,
        session,
        headerHeight,
        host.layout.widgets,
      );
    }
    host.layoutChanged.emit(host.layout);
    host.cdr.markForCheck();
  }

  public static snapToEdges(
    host: any,
    x: number,
    y: number,
    w: number,
    h: number,
    ignoreId: string,
    handle: string,
    layoutWidth: number = 1920,
    layoutHeight: number = 1080,
  ): { x: number; y: number; w: number; h: number } {
    const extraX: number[] = [];
    const extraY: number[] = [];
    const s = host.gridSession();
    if (s) {
      extraX.push(s.bounds.x, s.bounds.x + s.bounds.width);
      extraY.push(s.bounds.y, s.bounds.y + s.bounds.height);
      const dividers = LaneGridReplicationHelper.computeGridDividers(s);
      if (s.direction === "horizontal") {
        extraX.push(...dividers);
      } else {
        extraY.push(...dividers);
      }
    }

    return RacedayLayoutUtils.snapToEdges(
      host.layout?.widgets || [],
      x,
      y,
      w,
      h,
      ignoreId,
      handle,
      layoutWidth,
      layoutHeight,
      extraX,
      extraY,
    );
  }
}
