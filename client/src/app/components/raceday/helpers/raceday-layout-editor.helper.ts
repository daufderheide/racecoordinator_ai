import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { LaneGridFactoryHelper } from "@app/components/raceday/utils/lane-grid-factory.helper";
import { LaneGridHeaderHelper } from "@app/components/raceday/utils/lane-grid-header.helper";
import {
  LaneGridBounds,
  LaneGridReplicationHelper,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import { LaneGridStyleHelper } from "@app/components/raceday/utils/lane-grid-style.helper";
import {
  LaneReplicationHelper,
  LaneReplicationOptions,
} from "@app/components/raceday/utils/lane-replication.helper";
import { WIDGET_REGISTRY } from "@app/components/ui-editor/widget-registry";
import {
  AbsoluteWidgetNode,
  LayoutConfig,
  Settings,
} from "@app/models/settings";

export class RacedayLayoutEditorHelper {
  public static toggleLayoutCustomize(host: any): void {
    host.isLayoutCustomizing = !host.isLayoutCustomizing;
    host.cdr.detectChanges();
  }

  public static saveLayout(host: any): void {
    if (host.normalizeZIndices) {
      host.normalizeZIndices();
    } else {
      RacedayLayoutEditorHelper.normalizeZIndices(host);
    }
    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    if (host.isPracticeLayout) {
      settings.practiceRacedayLayout = host.layout;
    } else {
      settings.racedayLayout = host.layout;
    }
    host.settingsService.saveSettings(settings);
    host.isLayoutCustomizing = false;
    host.updateAudioRelevance();
    host.cdr.detectChanges();
  }

  public static cancelLayoutCustomize(host: any): void {
    if (host.currentRacedayLayout && host.currentRacedayLayout.widgets) {
      host.layout = JSON.parse(JSON.stringify(host.currentRacedayLayout));
    } else {
      host.layout = host.getDefaultLayout
        ? host.getDefaultLayout()
        : RacedayLayoutEditorHelper.getDefaultLayout(host);
    }
    host.updateScale();
    host.isLayoutCustomizing = false;
    host.updateAudioRelevance();
    host.cdr.detectChanges();
  }

  public static resetLayoutToDefaults(host: any): void {
    host.layout = host.getDefaultLayout
      ? host.getDefaultLayout()
      : RacedayLayoutEditorHelper.getDefaultLayout(host);
    const settings = host.settingsService.getSettings();
    host.currentRacedayLayout = host.layout;
    host.settingsService.saveSettings(settings);
    host.updateScale();
    host.isLayoutCustomizing = false;
    host.updateAudioRelevance();
    host.cdr.detectChanges();
  }

  public static getDefaultLayout(host: any): LayoutConfig {
    const defaultTemplate =
      host.isDriverStationLayout || host.isDriverStation
        ? Settings.DEFAULT_DRIVER_STATION_LAYOUT
        : host.isPracticeLayout
          ? Settings.DEFAULT_PRACTICE_LAYOUT
          : Settings.DEFAULT_LAYOUT;
    const layout = JSON.parse(JSON.stringify(defaultTemplate)) as LayoutConfig;

    const targetW =
      typeof window !== "undefined" && window.innerWidth > 0
        ? window.innerWidth
        : layout.baseWidth || 1920;
    const targetH =
      typeof window !== "undefined" && window.innerHeight > 0
        ? window.innerHeight
        : layout.baseHeight || 1080;
    const oldWidth = layout.baseWidth || 1920;
    const oldHeight = layout.baseHeight || 1080;

    const scaleX = targetW / oldWidth;
    const scaleY = targetH / oldHeight;

    layout.baseWidth = targetW;
    layout.baseHeight = targetH;

    if (layout.widgets) {
      layout.widgets.forEach((w) => {
        w.x = Math.round(w.x * scaleX);
        w.y = Math.round(w.y * scaleY);
        w.width = Math.round(w.width * scaleX);
        w.height = Math.round(w.height * scaleY);
      });
    }

    return layout;
  }

  public static onCanvasDragOver(host: any, event: DragEvent): void {
    if (!host.isLayoutCustomizing || !host.draggedWidgetType) return;
    event.preventDefault();
  }

  public static handleGridDrop(
    host: any,
    event: DragEvent,
    scalableContent: HTMLElement,
    rect: DOMRect,
  ): void {
    const totalLanes = Math.max(2, host.track?.lanes?.length || 4);
    const width = 500;
    const height = Math.max(160, totalLanes * 50);
    const scaleX = rect.width / scalableContent.offsetWidth || 1;
    const scaleY = rect.height / scalableContent.offsetHeight || 1;
    const baseWidth = host.layout?.baseWidth || 1920;
    const baseHeight = host.layout?.baseHeight || 1080;
    const clampedX = Math.max(
      0,
      Math.min(
        baseWidth - width,
        Math.round((event.clientX - rect.left) / scaleX - width / 2),
      ),
    );
    const clampedY = Math.max(
      0,
      Math.min(
        baseHeight - height,
        Math.round((event.clientY - rect.top) / scaleY),
      ),
    );

    const bounds: LaneGridBounds = {
      x: clampedX,
      y: clampedY,
      width,
      height,
    };
    const nextZ = host.getNextZIndex
      ? host.getNextZIndex()
      : RacedayLayoutEditorHelper.getNextZIndex(host);
    const { session, widgets } = LaneGridFactoryHelper.createNewGrid(
      bounds,
      totalLanes,
      nextZ,
    );

    if (!host.layout) {
      host.layout = host.getDefaultLayout
        ? host.getDefaultLayout()
        : RacedayLayoutEditorHelper.getDefaultLayout(host);
    }
    if (!host.layout.widgets) host.layout.widgets = [];
    host.layout.widgets = [...host.layout.widgets, ...widgets];
    host.invalidateGridCache();

    const master = widgets.find((w: any) =>
      LaneGridReplicationHelper.isMasterWidget(w, session),
    );

    host.draggedWidgetType = null;
    host.layoutChanged.emit(host.layout);
    if (master) {
      host.widgetSelected.emit(master.id);
    }
    host.updateAudioRelevance();
    host.cdr.markForCheck();
  }

  public static computeDroppedWidgetDimensions(
    host: any,
    draggedType: string,
  ): {
    width: number;
    height: number;
    isLaneColumn: boolean;
    laneColumnKey?: string;
    actualWidgetType: string;
  } {
    const isLeaderboardOrDeck =
      draggedType === "leaderboard" ||
      draggedType === "group-leaderboard" ||
      draggedType === "season-leaderboard" ||
      draggedType === "season-race-leaderboard" ||
      draggedType === "on-deck" ||
      draggedType === "next-heat" ||
      draggedType === "heat-list" ||
      draggedType === "image";

    const isHeaderWidget =
      draggedType === "event-name" ||
      draggedType === "race-name" ||
      draggedType === "season-name" ||
      draggedType === "track-name" ||
      draggedType === "heat-info";

    const isActionButton = draggedType?.startsWith("action-");

    let width = 400;
    let height = 200;

    if (draggedType?.startsWith("custom:")) {
      const def = host.customWidgetService?.getWidgetDefinition(draggedType);
      width = def?.manifest?.defaultWidth || 400;
      height = def?.manifest?.defaultHeight || 250;
    } else if (isHeaderWidget) {
      width = 200;
      height = 18;
    } else if (isLeaderboardOrDeck) {
      width = 384;
      height =
        draggedType === "heat-list"
          ? 400
          : draggedType === "leaderboard" ||
              draggedType === "group-leaderboard" ||
              draggedType === "season-leaderboard" ||
              draggedType === "season-race-leaderboard"
            ? 239
            : draggedType === "image"
              ? 300
              : 200;
    } else if (
      draggedType === "action-back" ||
      draggedType === "action-forward" ||
      draggedType === "action-close"
    ) {
      width = 36;
      height = 36;
    } else if (isActionButton) {
      width = 170;
      height = 80;
    }

    const isLaneColumn = draggedType?.startsWith("lane-col:");
    let laneColumnKey: string | undefined = undefined;
    if (isLaneColumn) {
      laneColumnKey = draggedType?.substring("lane-col:".length);
      width = laneColumnKey === "lastLaps" ? 280 : 200;
      height = laneColumnKey === "lastLaps" ? 200 : 90;
    }

    const actualWidgetType = isLaneColumn
      ? "lane-column"
      : (draggedType as any);

    return { width, height, isLaneColumn, laneColumnKey, actualWidgetType };
  }

  public static initializeDroppedWidgetSettings(
    host: any,
    newWidget: any,
    draggedType: string,
    actualWidgetType: string,
    isLaneColumn: boolean,
    laneColumnKey?: string,
  ): void {
    if (draggedType === "image") {
      newWidget.customSettings = { imageUrl: "" };
    } else if (isLaneColumn) {
      const registryEntry = WIDGET_REGISTRY["lane-column"];
      newWidget.customSettings = registryEntry?.defaultSettings
        ? registryEntry.defaultSettings()
        : {};
      newWidget.customSettings.columnKey = laneColumnKey;
    } else if (actualWidgetType.startsWith("custom:")) {
      const def =
        host.customWidgetService?.getWidgetDefinition(actualWidgetType);
      const manifestDefaults = def?.manifest?.defaultSettings
        ? { ...def.manifest.defaultSettings }
        : {};
      newWidget.customSettings = { ...manifestDefaults };
    } else {
      const registryEntry = WIDGET_REGISTRY[draggedType];
      if (registryEntry?.defaultSettings) {
        newWidget.customSettings = registryEntry.defaultSettings();
      }
    }
  }

  public static onCanvasDrop(host: any, event: DragEvent): void {
    if (!host.isLayoutCustomizing || !host.draggedWidgetType) return;
    event.preventDefault();

    const scalableContent = host.el.nativeElement.querySelector(
      ".scalable-content",
    ) as HTMLElement;
    if (!scalableContent) return;

    const rect = scalableContent.getBoundingClientRect();
    if (host.draggedWidgetType === "grid") {
      if (host.handleGridDrop) {
        host.handleGridDrop(event, scalableContent, rect);
      } else {
        RacedayLayoutEditorHelper.handleGridDrop(
          host,
          event,
          scalableContent,
          rect,
        );
      }
      return;
    }

    const draggedType = host.draggedWidgetType;
    const { width, height, isLaneColumn, laneColumnKey, actualWidgetType } =
      host.computeDroppedWidgetDimensions
        ? host.computeDroppedWidgetDimensions(draggedType)
        : RacedayLayoutEditorHelper.computeDroppedWidgetDimensions(
            host,
            draggedType,
          );

    const scaleX = rect.width / scalableContent.offsetWidth || 1;
    const scaleY = rect.height / scalableContent.offsetHeight || 1;

    const x = (event.clientX - rect.left) / scaleX - width / 2;
    const y = (event.clientY - rect.top) / scaleY;

    const baseWidth = host.layout?.baseWidth || 1920;
    const baseHeight = host.layout?.baseHeight || 1080;
    const clampedX = Math.max(0, Math.min(baseWidth - width, Math.round(x)));
    const clampedY = Math.max(0, Math.min(baseHeight - height, Math.round(y)));

    const nextZ = host.getNextZIndex
      ? host.getNextZIndex()
      : RacedayLayoutEditorHelper.getNextZIndex(host);
    const newWidget: any = {
      id: "widget-" + Date.now(),
      widgetType: actualWidgetType,
      x: clampedX,
      y: clampedY,
      width: width,
      height: height,
      zIndex: nextZ,
      scaleMode: "auto",
    };

    if (host.initializeDroppedWidgetSettings) {
      host.initializeDroppedWidgetSettings(
        newWidget,
        draggedType,
        actualWidgetType,
        isLaneColumn,
        laneColumnKey,
      );
    } else {
      RacedayLayoutEditorHelper.initializeDroppedWidgetSettings(
        host,
        newWidget,
        draggedType,
        actualWidgetType,
        isLaneColumn,
        laneColumnKey,
      );
    }

    if (!host.layout) {
      host.layout = host.getDefaultLayout
        ? host.getDefaultLayout()
        : RacedayLayoutEditorHelper.getDefaultLayout(host);
    }
    if (!host.layout.widgets) host.layout.widgets = [];
    host.layout.widgets = [...host.layout.widgets, newWidget];

    RacedayLayoutEditorHelper.syncDroppedWidgetWithGrid(
      host,
      newWidget,
      actualWidgetType,
      isLaneColumn,
    );

    host.invalidateGridCache();
    host.draggedWidgetType = null;
    host.layoutChanged.emit(host.layout);
    host.widgetSelected.emit(newWidget.id);
    host.updateAudioRelevance();
    host.cdr.markForCheck();
  }

  private static syncDroppedWidgetWithGrid(
    host: any,
    newWidget: any,
    actualWidgetType: string,
    isLaneColumn: boolean,
  ): void {
    if (host.gridSession()) {
      const session = host.gridSession()!;
      if (newWidget.customSettings) {
        newWidget.customSettings["gridType"] = session.gridType || "heat";
        newWidget.customSettings["bindingMode"] = session.bindingMode || "lane";
      }
      if (
        isLaneColumn ||
        actualWidgetType === "lane-column" ||
        actualWidgetType.startsWith("custom:")
      ) {
        LaneGridStyleHelper.inheritGridStyles(
          newWidget,
          session,
          host.layout.widgets,
        );
        host.layout.widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
          newWidget,
          session,
          host.layout.widgets,
        );
      }
    }
  }

  public static getNextZIndex(host: any): number {
    if (!host.layout?.widgets?.length) return 100;
    const nonCountdown = host.layout.widgets.filter(
      (w: any) => w.widgetType !== "countdown",
    );
    if (!nonCountdown.length) return 100;
    return (
      Math.max(
        ...nonCountdown.map((w: any) => (w.zIndex != null ? w.zIndex : 100)),
      ) + 1
    );
  }

  public static bringToFront(host: any, id: string): void {
    if (!host.layout?.widgets) return;

    const targetWidget = host.layout.widgets.find((w: any) => w.id === id);
    if (!targetWidget) return;

    const s = targetWidget.customSettings;
    const isHoriz =
      host.gridSession()?.direction === "horizontal" ||
      host.gridSession()?.layoutOrientation === "horizontal" ||
      s?.["gridDirection"] === "horizontal" ||
      s?.["layoutOrientation"] === "horizontal";
    const isLanesMirrored = isHoriz
      ? s?.["linkColumns"] !== false &&
        host.gridSession()?.linkColumns !== false
      : s?.["mirrorRows"] !== false && host.gridSession()?.mirrorRows !== false;

    if (isLanesMirrored && s?.["gridMasterId"]) {
      const masterId = s["gridMasterId"];
      const masterWidget = host.layout.widgets.find(
        (w: any) => w.id === masterId,
      );
      if (masterWidget) {
        host.bringToFront(masterId);
        return;
      }
    }

    if (targetWidget.customSettings?.["gridId"]) {
      host.bringGridToFront(targetWidget.customSettings["gridId"]);
      host.widgetSelected.emit(id);
      return;
    }

    if (targetWidget.widgetType === "countdown") {
      const otherWidgets = host.layout.widgets.filter((w: any) => w.id !== id);
      const maxOtherZ =
        otherWidgets.length > 0
          ? Math.max(
              ...otherWidgets.map((w: any) =>
                w.zIndex != null ? w.zIndex : 100,
              ),
            )
          : 100;
      if (targetWidget.zIndex == null || targetWidget.zIndex <= maxOtherZ) {
        targetWidget.zIndex = Math.max(2000, maxOtherZ + 1);
        host.layoutChanged.emit(host.layout);
      }
      host.widgetSelected.emit(id);
      return;
    }

    const otherNonCountdown = host.layout.widgets.filter(
      (w: any) => w.id !== id && w.widgetType !== "countdown",
    );
    if (otherNonCountdown.length === 0) {
      host.widgetSelected.emit(id);
      return;
    }

    const maxOtherZ = Math.max(
      ...otherNonCountdown.map((w: any) => (w.zIndex != null ? w.zIndex : 100)),
    );

    let changed = false;
    if (targetWidget.zIndex == null || targetWidget.zIndex <= maxOtherZ) {
      targetWidget.zIndex = maxOtherZ + 1;
      changed = true;
    }

    // Force countdown widget(s) to always stay strictly on top of all other widgets
    for (const cw of host.layout.widgets) {
      if (cw.widgetType === "countdown") {
        if (cw.zIndex == null || cw.zIndex <= targetWidget.zIndex) {
          cw.zIndex = Math.max(2000, targetWidget.zIndex + 100);
          changed = true;
        }
      }
    }

    if (changed) {
      host.layoutChanged.emit(host.layout);
    }
    host.widgetSelected.emit(id);
  }

  public static normalizeZIndices(host: any): void {
    if (!host.layout?.widgets) return;
    const regularWidgets = host.layout.widgets
      .filter((w: any) => w.widgetType !== "countdown")
      .sort((a: any, b: any) => (a.zIndex || 100) - (b.zIndex || 100));
    regularWidgets.forEach((w: any, index: number) => {
      w.zIndex = 100 + index;
    });

    const countdownWidgets = host.layout.widgets
      .filter((w: any) => w.widgetType === "countdown")
      .sort((a: any, b: any) => (a.zIndex || 2000) - (b.zIndex || 2000));
    const maxRegularZ =
      regularWidgets.length > 0
        ? regularWidgets[regularWidgets.length - 1].zIndex
        : 100;
    countdownWidgets.forEach((w: any, index: number) => {
      w.zIndex = Math.max(2000, maxRegularZ + 100) + index;
    });
  }

  public static removeWidget(host: any, id: string): void {
    if (!host.layout?.widgets) return;
    const widgetsBefore = [...host.layout.widgets];
    const session = host.gridSession();
    const widgetToRemove = host.layout.widgets.find((w: any) => w.id === id);
    const gridId =
      session?.gridId || widgetToRemove?.customSettings?.["gridId"];

    if (session && session.gridId === gridId) {
      host.layout.widgets =
        LaneGridReplicationHelper.removeMasterWidgetFromLanes(
          id,
          session,
          host.layout.widgets,
        );
    } else {
      const resolvedMasterId =
        widgetToRemove?.customSettings?.["gridMasterId"] || id;
      const isMasterWithReplicas = host.layout.widgets.some(
        (w: any) =>
          w.customSettings?.["gridMasterId"] === id ||
          w.id.startsWith(`${id}_grid_lane_`),
      );
      if (isMasterWithReplicas) {
        host.layout.widgets = host.layout.widgets.filter((w: any) => {
          if (w.id === resolvedMasterId) return false;
          if (w.customSettings?.["gridMasterId"] === resolvedMasterId)
            return false;
          if (w.id.startsWith(`${resolvedMasterId}_grid_lane_`)) return false;
          if (w.id === `${resolvedMasterId}_grid_header`) return false;
          return true;
        });
      } else {
        host.layout.widgets = host.layout.widgets.filter(
          (w: any) => w.id !== id,
        );
      }
    }

    host.layout.widgets = LaneGridReplicationHelper.cleanOrphanedGridWidgets(
      host.layout.widgets,
    );

    if (
      gridId &&
      !LaneGridReplicationHelper.hasGridWidgets(host.layout.widgets, gridId)
    ) {
      host.layout.widgets = LaneGridReplicationHelper.removeGrid(
        host.layout.widgets,
        gridId,
      );
      LaneGridAnimationHelper.reset(gridId);
      if (host.gridSession()?.gridId === gridId) {
        host.finishGrid.emit();
      }
    }
    host.invalidateGridCache();
    host.layoutChanged.emit(host.layout);
    const resolvedMasterId =
      widgetToRemove?.customSettings?.["gridMasterId"] || id;
    const currentSelectedId = host.selectedWidgetId();
    const isSelectedDeleted =
      currentSelectedId === id ||
      currentSelectedId === resolvedMasterId ||
      (currentSelectedId != null &&
        !host.layout.widgets.some((w: any) => w.id === currentSelectedId));

    if (isSelectedDeleted) {
      const nextWidgetId =
        LaneGridReplicationHelper.findNextWidgetAfterDeletion(
          id,
          widgetsBefore,
          host.layout.widgets,
          session,
        );
      host.widgetSelected.emit(nextWidgetId);
    }
    host.updateAudioRelevance();
  }

  public static replicateLaneWidgets(
    host: any,
    options: Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">,
  ): void {
    if (!host.layout?.widgets) return;
    const baseWidth = host.layout.baseWidth || 1920;
    const baseHeight = host.layout.baseHeight || 1080;
    const updated = LaneReplicationHelper.replicateLaneWidgets(
      host.layout.widgets,
      {
        ...options,
        baseWidth,
        baseHeight,
      },
    );
    host.layout.widgets = updated;
    host.invalidateGridCache();
    host.layoutChanged.emit(host.layout);
    host.cdr.markForCheck();
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
      RacedayLayoutEditorHelper.handleHeaderWidgetModified(
        host,
        widget,
        session,
      )
    ) {
      return;
    }

    const isMaster = LaneGridReplicationHelper.isMasterWidget(widget, session);

    if (!isMaster) {
      RacedayLayoutEditorHelper.handleReplicaWidgetModified(
        host,
        widget,
        session,
      );
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

  private static handleHeaderWidgetModified(
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
      RacedayLayoutEditorHelper.onMasterWidgetModified(host, masterWidget);
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

  private static handleReplicaWidgetModified(
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
        if (widget.customSettings?.["insets"]) {
          masterWidget.customSettings["insets"] = {
            ...widget.customSettings["insets"],
          };
        } else {
          delete masterWidget.customSettings["insets"];
        }
        if (widget.customSettings?.["insetsConfig"]) {
          masterWidget.customSettings["insetsConfig"] = {
            ...widget.customSettings["insetsConfig"],
          };
        } else {
          delete masterWidget.customSettings["insetsConfig"];
        }
        if (widget.customSettings?.["columnKey"]) {
          masterWidget.customSettings["columnKey"] =
            widget.customSettings["columnKey"];
        }
        if (widget.customSettings?.["gapMode"] !== undefined) {
          masterWidget.customSettings["gapMode"] =
            widget.customSettings["gapMode"];
        } else {
          delete masterWidget.customSettings["gapMode"];
        }
        if (widget.customSettings?.["gapTarget"] !== undefined) {
          masterWidget.customSettings["gapTarget"] =
            widget.customSettings["gapTarget"];
        } else {
          delete masterWidget.customSettings["gapTarget"];
        }
        RacedayLayoutEditorHelper.onMasterWidgetModified(host, masterWidget);
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
}
