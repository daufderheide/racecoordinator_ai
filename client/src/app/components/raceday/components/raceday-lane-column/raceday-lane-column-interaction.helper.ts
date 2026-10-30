import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { Role } from "@app/models/role";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { TranslationService } from "@app/services/translation.service";

import {
  buildSyntheticInsetWidgetInputs,
  buildSyntheticMainWidgetInputs,
  extractDroppedColumnKey,
  fitColumnLastLaps,
  formatAdjustedLapValue,
  isOverallOrSeedDataSource,
  isParentRaceOver,
  resolveEffectiveHeaderFontSize,
} from "./raceday-lane-column.utils";

export function isLaneColumnLapCountClickable(
  parent: any,
  hd: DriverHeatData | undefined,
  columnKey: string,
  isUIEditorMode: boolean,
): boolean {
  if (!parent || !hd || isUIEditorMode) return false;
  if (parent.isLapCountColumnClickable) {
    return parent.isLapCountColumnClickable(hd, {
      propertyName: columnKey,
    } as ColumnDefinition);
  }
  return (
    columnKey === "lapCount" ||
    columnKey === "physicalLapCount" ||
    columnKey === "totalTime" ||
    columnKey === "overallTotalTime"
  );
}

export function isLaneColumnTeamDriverSwapActive(
  parent: any,
  hd: DriverHeatData | undefined,
  columnKey: string,
  isUIEditorMode: boolean,
): boolean {
  if (!parent || !hd || isUIEditorMode) return false;
  if (parent.isTeamDriverSwapActive) {
    return parent.isTeamDriverSwapActive(hd, {
      propertyName: columnKey,
    } as ColumnDefinition);
  }
  const baseKey = (columnKey || "").split("_")[0];
  const isTeamOrName =
    (parent.isNameProperty ? parent.isNameProperty(columnKey) : false) ||
    columnKey === "driver.name" ||
    columnKey === "driver.nickname" ||
    baseKey === "participant.team.name";
  if (!isTeamOrName) return false;
  if (!parent.isTeam?.(hd) || parent.isDriverSwapDisabled?.(hd)) return false;
  if (parent.authService?.currentRole === Role.VIEWER) return false;
  return true;
}

export function isLaneColumnPracticeLaneResetActive(
  parent: any,
  columnKey: string,
  isUIEditorMode: boolean,
): boolean {
  if (!parent || isUIEditorMode) return false;
  if (!parent.race?.practice) return false;
  if (parent.authService?.currentRole === Role.VIEWER) return false;
  const isName = parent.isNameProperty
    ? parent.isNameProperty(columnKey)
    : columnKey === "driver.name" || columnKey === "driver.nickname";
  return Boolean(isName || columnKey === "laneNumber");
}

export function resolveLaneColumnCardTooltip(
  translationService: TranslationService,
  isLapCountClickable: boolean,
  isTeamDriverSwapActive: boolean,
  parent: any,
  isUIEditorMode: boolean,
): string | null {
  if (isUIEditorMode) return null;
  if (isLapCountClickable) {
    return translationService.translate("RD_LAP_COLUMN_TOOLTIP");
  }
  if (isTeamDriverSwapActive) {
    return translationService.translate(
      parent?.race?.practice
        ? "RD_PRACTICE_DRIVER_TOOLTIP"
        : "RD_TEAM_DRIVER_TOOLTIP",
    );
  }
  return null;
}

export function isLaneColumnInsetLapCount(
  key: string | undefined,
  isUIEditorMode: boolean,
): boolean {
  if (isUIEditorMode || !key) return false;
  return (
    key === "lapCount" ||
    key === "physicalLapCount" ||
    key === "totalTime" ||
    key === "overallTotalTime"
  );
}

export function isNameOrNicknameProperty(property?: string): boolean {
  if (!property) return false;
  const baseKey = property.split("_")[0];
  return (
    baseKey === "driver.name" ||
    baseKey === "driver.nickname" ||
    baseKey === "name" ||
    baseKey === "nickname"
  );
}

export function formatLaneColumnInsetValue(
  hd: DriverHeatData | undefined,
  anchor: string,
  key: string | undefined,
  settings: LaneColumnWidgetSettings,
  parent: any,
): string {
  if (!key) return "";
  if (!hd) {
    if (settings.emptyRowsMode === "blank") return "";
    if (
      !isOverallOrSeedDataSource(settings, parent, settings.bindingMode) &&
      isNameOrNicknameProperty(key)
    ) {
      return (
        parent?.translationService?.translate?.("RD_EMPTY_LANE") ||
        "RD_EMPTY_LANE"
      );
    }
    return "--";
  }

  const anchorCfg = settings.insetsConfig?.[anchor];
  const insetTimeDec =
    anchorCfg?.timeDecimalPlaces !== undefined
      ? anchorCfg.timeDecimalPlaces
      : 3;
  const insetLapDec =
    anchorCfg?.lapDecimalPlaces !== undefined ? anchorCfg.lapDecimalPlaces : 2;
  const insetDec =
    anchorCfg?.decimalPlaces !== undefined
      ? anchorCfg.decimalPlaces
      : undefined;

  const insetSettings: any = {
    gapTarget: anchorCfg?.gapTarget,
    gapMode: anchorCfg?.gapMode,
    insetsConfig: settings.insetsConfig,
    insetTimeDecimalPlaces: insetTimeDec,
    insetLapDecimalPlaces: insetLapDec,
    timeDecimalPlaces: insetTimeDec,
    lapDecimalPlaces: insetLapDec,
    columnDecimals: insetDec !== undefined ? { [key]: insetDec } : {},
    timeDisplayFormat: anchorCfg?.timeDisplayFormat || "dynamic",
    timeSubsecondMode: anchorCfg?.timeSubsecondMode || "never",
    timeSubsecondThreshold: anchorCfg?.timeSubsecondThreshold ?? 10,
    timeSubsecondDecimals: anchorCfg?.timeSubsecondDecimals ?? 2,
    heatsDisplayMode: anchorCfg?.heatsDisplayMode || "raced",
    gridType: settings.gridType,
    bindingMode: settings.bindingMode,
    gridId: settings.gridId,
    emptyRowsMode: settings.emptyRowsMode,
  };

  if (parent?.formatValue) {
    const colDef = parent.columns?.find((c: any) => c.propertyName === key);
    return parent.formatValue(
      key,
      RacedayFormatUtils.getPropertyValue(hd, key, insetSettings, anchor),
      hd,
      colDef,
      anchor,
      insetSettings,
    );
  }

  if (
    (key === "driver.name" || key === "driver.nickname") &&
    isOverallOrSeedDataSource(settings, parent)
  ) {
    const teamObj =
      hd.participant?.team ||
      (hd.driver as any)?.team ||
      (hd as any)?.team ||
      (hd.actualDriver as any)?.team;
    const teamName = typeof teamObj === "string" ? teamObj : teamObj?.name;
    if (teamName) return teamName;
  }

  const raw = RacedayFormatUtils.getPropertyValue(
    hd,
    key,
    insetSettings,
    anchor,
  );
  return formatAdjustedLapValue(raw, hd, key);
}

export { fitLaneColumnHeaderText } from "./raceday-lane-column-header-fit.helper";

export { resolveEffectiveHeaderFontSize };

export function resolveEffectiveInsetFontSize(
  settings: LaneColumnWidgetSettings,
  widget: AbsoluteWidgetNode | null,
  cardEl?: HTMLElement | null,
  cachedHeight?: number,
): number {
  const custom = settings.insetFontSize;
  if (widget?.scaleMode === "auto") {
    const cardH =
      cachedHeight && cachedHeight > 0
        ? cachedHeight
        : cardEl?.clientHeight ||
          (widget?.height && widget.height > 0 ? widget.height : 0);
    if (cardH > 0) {
      const autoSize = Math.round(cardH * 0.28);
      return Math.max(14, Math.min(24, autoSize));
    }
  }
  return custom && custom > 0 ? custom : 18;
}

export function setLaneColumnInset(
  widget: AbsoluteWidgetNode | null,
  anchor: string,
  key: string,
): void {
  if (!widget) return;
  if (!widget.customSettings) {
    widget.customSettings = {} as LaneColumnWidgetSettings;
  }
  const s = widget.customSettings as LaneColumnWidgetSettings;
  if (anchor === "center-center") {
    s.columnKey = key;
  } else {
    if (!s.insets) {
      s.insets = {};
    }
    s.insets[anchor] = key;
  }
}

export function deleteLaneColumnAnchor(
  widget: AbsoluteWidgetNode | null,
  anchor: string,
  parent: any,
  selectedAnchor: string | null,
  anchorSelectedEmitter: {
    emit: (val: { widgetId: string; anchor: string | null }) => void;
  },
): void {
  if (!widget || !widget.customSettings || anchor === "center-center") return;
  const s = widget.customSettings as LaneColumnWidgetSettings;
  if (s.insets && s.insets[anchor]) {
    delete s.insets[anchor];
  }
  if (s.insetsConfig && s.insetsConfig[anchor]) {
    delete s.insetsConfig[anchor];
  }
  if (parent?.selectedAnchor?.() === anchor || selectedAnchor === anchor) {
    if (parent?.selectAnchor) {
      parent.selectAnchor(widget.id, null);
    }
    anchorSelectedEmitter.emit({ widgetId: widget.id, anchor: null });
  }
}

export function notifyLaneColumnParentChange(
  parent: any,
  widget: AbsoluteWidgetNode | null,
): void {
  if (!parent) return;
  if (widget && parent.gridSession?.() && parent.onMasterWidgetModified) {
    const session = parent.gridSession();
    const sessionGridId =
      session && typeof session === "object" ? session.gridId : null;
    const widgetGridId = widget.customSettings?.["gridId"];
    if (!sessionGridId || !widgetGridId || widgetGridId === sessionGridId) {
      let targetWidget = widget;
      const isMirroredChild = Boolean(
        (widget.customSettings?.["gridMasterId"] &&
          widget.customSettings["gridMasterId"] !== widget.id) ||
        widget.id.includes("_grid_lane_") ||
        (session &&
          typeof session === "object" &&
          session.sourceLaneIndex != null &&
          widget.customSettings?.["gridLane"] != null &&
          Number(widget.customSettings["gridLane"]) !==
            session.sourceLaneIndex),
      );

      if (
        isMirroredChild &&
        session?.mirrorRows !== false &&
        parent.layout?.widgets
      ) {
        const masterId =
          widget.customSettings?.["gridMasterId"] ||
          widget.id.replace(/_grid_lane_\d+.*$/, "");
        const master = parent.layout.widgets.find(
          (w: any) => w.id === masterId,
        );
        if (master) {
          master.customSettings = master.customSettings || {};
          if (widget.customSettings?.["insets"]) {
            master.customSettings["insets"] = {
              ...widget.customSettings["insets"],
            };
          } else {
            delete master.customSettings["insets"];
          }
          if (widget.customSettings?.["insetsConfig"]) {
            master.customSettings["insetsConfig"] = {
              ...widget.customSettings["insetsConfig"],
            };
          } else {
            delete master.customSettings["insetsConfig"];
          }
          if (widget.customSettings?.["columnKey"]) {
            master.customSettings["columnKey"] =
              widget.customSettings["columnKey"];
          }
          if (widget.customSettings?.["gapMode"] !== undefined) {
            master.customSettings["gapMode"] = widget.customSettings["gapMode"];
          } else {
            delete master.customSettings["gapMode"];
          }
          if (widget.customSettings?.["gapTarget"] !== undefined) {
            master.customSettings["gapTarget"] =
              widget.customSettings["gapTarget"];
          } else {
            delete master.customSettings["gapTarget"];
          }
          targetWidget = master;
        }
      }

      parent.onMasterWidgetModified(targetWidget);
    }
  }
  if (parent.layoutChanged?.emit && parent.layout) {
    parent.layoutChanged.emit(parent.layout);
  }
  if (parent.markLayoutDirty) {
    parent.markLayoutDirty();
  }
  if (parent.columnsChanged?.emit) {
    parent.columnsChanged.emit();
  }
  if (parent.onWidgetSettingsChanged) {
    parent.onWidgetSettingsChanged(widget);
  }
  if (parent.cdr?.markForCheck) {
    parent.cdr.markForCheck();
  }
}

export function resolveHeatEmptyLaneIndex(
  parent: any,
  targetIndex: number,
  track?: any,
): number {
  const lanesCount = track?.lanes?.length ?? 0;
  if (lanesCount <= 0 || targetIndex < 0 || targetIndex >= lanesCount) {
    return -1;
  }
  const drivers: DriverHeatData[] =
    parent?.sortedHeatDrivers ||
    parent?.heatDrivers ||
    parent?.heat?.heatDrivers ||
    [];
  const activeLanes = new Set<number>();
  let activeCount = 0;
  for (const d of drivers) {
    if (!RacedayFormatUtils.isEmptyDriver(d)) {
      activeCount++;
      if (d.laneIndex != null && d.laneIndex >= 0) {
        activeLanes.add(d.laneIndex);
      }
    }
  }
  const unoccupiedLanes: number[] = [];
  for (let i = 0; i < lanesCount; i++) {
    if (!activeLanes.has(i)) {
      unoccupiedLanes.push(i);
    }
  }
  if (targetIndex >= activeCount) {
    const offset = targetIndex - activeCount;
    if (offset < unoccupiedLanes.length) {
      return unoccupiedLanes[offset];
    }
  }
  return -1;
}

export function resolveLaneColumnBackgroundColor(
  settings: LaneColumnWidgetSettings,
  hd: DriverHeatData | undefined,
  parent: any,
  bindingMode: string,
  targetIndex: number,
): string {
  if (settings.useLaneColors === false) {
    return settings.backgroundColor || "#000000";
  }
  if (
    isOverallOrSeedDataSource(settings, parent, bindingMode) &&
    (!hd || RacedayFormatUtils.isEmptyDriver(hd) || isParentRaceOver(parent))
  ) {
    return settings.backgroundColor || "transparent";
  }
  const track =
    parent?.track ||
    parent?.race?.track ||
    parent?.raceService?.getRace()?.track;
  const trackLanesCount = track?.lanes?.length;
  if (
    trackLanesCount != null &&
    targetIndex >= trackLanesCount &&
    (!hd || RacedayFormatUtils.isEmptyDriver(hd))
  ) {
    return settings.backgroundColor || "transparent";
  }
  if (bindingMode === "hostLane" && parent?.activeLaneBackgroundColor) {
    return parent.activeLaneBackgroundColor;
  }
  if (hd && parent?.getLaneColor) {
    const bg = parent.getLaneColor(hd, "background_color");
    if (bg) return bg;
  }
  let laneIdx = hd?.laneIndex ?? -1;
  if (laneIdx < 0) {
    if (bindingMode === "hostLane") {
      laneIdx = parent?.activeLaneIndex ?? parent?.laneIndex ?? -1;
    } else if (bindingMode === "lane") {
      laneIdx = targetIndex;
    } else if (
      !isOverallOrSeedDataSource(settings, parent, bindingMode) &&
      (!hd || RacedayFormatUtils.isEmptyDriver(hd))
    ) {
      laneIdx = resolveHeatEmptyLaneIndex(parent, targetIndex, track);
    }
  }
  const trackLaneBg =
    laneIdx >= 0 ? track?.lanes?.[laneIdx]?.background_color : undefined;
  return trackLaneBg || settings.backgroundColor || "transparent";
}

export function resolveLaneColumnForegroundColor(
  settings: LaneColumnWidgetSettings,
  hd: DriverHeatData | undefined,
  parent: any,
  bindingMode: string,
  targetIndex: number,
): string {
  if (settings.useLaneColors === false) {
    return settings.textColor || "#ffffff";
  }
  if (
    isOverallOrSeedDataSource(settings, parent, bindingMode) &&
    (!hd || RacedayFormatUtils.isEmptyDriver(hd) || isParentRaceOver(parent))
  ) {
    return settings.textColor || "#ffffff";
  }
  const track =
    parent?.track ||
    parent?.race?.track ||
    parent?.raceService?.getRace()?.track;
  const trackLanesCount = track?.lanes?.length;
  if (
    trackLanesCount != null &&
    targetIndex >= trackLanesCount &&
    (!hd || RacedayFormatUtils.isEmptyDriver(hd))
  ) {
    return settings.textColor || "#ffffff";
  }
  if (bindingMode === "hostLane" && parent?.activeLaneForegroundColor) {
    return parent.activeLaneForegroundColor;
  }
  if (hd && parent?.getLaneColor) {
    const fg = parent.getLaneColor(hd, "foreground_color");
    if (fg) return fg;
  }
  let laneIdx = hd?.laneIndex ?? -1;
  if (laneIdx < 0) {
    if (bindingMode === "hostLane") {
      laneIdx = parent?.activeLaneIndex ?? parent?.laneIndex ?? -1;
    } else if (bindingMode === "lane") {
      laneIdx = targetIndex;
    } else if (
      !isOverallOrSeedDataSource(settings, parent, bindingMode) &&
      (!hd || RacedayFormatUtils.isEmptyDriver(hd))
    ) {
      laneIdx = resolveHeatEmptyLaneIndex(parent, targetIndex, track);
    }
  }
  const trackLaneFg =
    laneIdx >= 0 ? track?.lanes?.[laneIdx]?.foreground_color : undefined;
  return (
    trackLaneFg ||
    settings.textColor ||
    (bindingMode === "hostLane"
      ? parent?.activeLaneForegroundColor
      : undefined) ||
    "#ffffff"
  );
}

export function resolveLaneColumnEffectiveHeaderTextColor(
  settings: LaneColumnWidgetSettings,
  isHeaderWidget: boolean,
  getForegroundColor: () => string,
): string {
  if (settings.headerTextColor) {
    return settings.headerTextColor;
  }
  if (isHeaderWidget) {
    return "#ffffff";
  }
  const fg = getForegroundColor();
  if (settings.useLaneColors !== false) {
    return fg;
  }
  return settings.textColor || fg || "#ffffff";
}

export function resolveLaneColumnEffectiveValueTextColor(
  settings: LaneColumnWidgetSettings,
  foregroundColor: string,
): string {
  if (settings.useLaneColors !== false) {
    return foregroundColor;
  }
  return settings.valueTextColor || settings.textColor || foregroundColor;
}

export function resolveLaneColumnEffectiveInsetTextColor(
  settings: LaneColumnWidgetSettings,
  foregroundColor: string,
): string {
  if (settings.useLaneColors !== false) {
    return foregroundColor;
  }
  return settings.insetTextColor || settings.textColor || foregroundColor;
}

export function handleLaneColumnAnchorDragOver(
  event: DragEvent,
  isUIEditorMode: boolean,
  isGridCellUnselected: boolean,
): void {
  if (!isUIEditorMode || isGridCellUnselected) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) {
    const allowed = event.dataTransfer.effectAllowed;
    event.dataTransfer.dropEffect = allowed === "move" ? "move" : "copy";
  }
}

export function handleLaneColumnAnchorDragEnter(
  event: DragEvent,
  isUIEditorMode: boolean,
  isGridCellUnselected: boolean,
): void {
  if (!isUIEditorMode || isGridCellUnselected) return;
  event.preventDefault();
  event.stopPropagation();
  ((event.currentTarget || event.target) as HTMLElement)?.classList.add(
    "drag-over",
  );
}

export function handleLaneColumnAnchorDragLeave(
  event: DragEvent,
  isUIEditorMode: boolean,
): void {
  if (!isUIEditorMode) return;
  event.preventDefault();
  event.stopPropagation();
  ((event.currentTarget || event.target) as HTMLElement)?.classList.remove(
    "drag-over",
  );
}

export function handleLaneColumnAnchorDrop(
  event: DragEvent,
  anchor: string,
  isUIEditorMode: boolean,
  isGridCellUnselected: boolean,
  parent: any,
): string | undefined {
  if (!isUIEditorMode || isGridCellUnselected) return undefined;
  event.preventDefault();
  event.stopPropagation();
  ((event.currentTarget || event.target) as HTMLElement)?.classList.remove(
    "drag-over",
  );
  const droppedKey = extractDroppedColumnKey(event, parent);
  if (droppedKey && parent) {
    parent.draggedWidgetType = null;
  }
  return droppedKey;
}

export function dispatchLaneColumnAnchorSelection(
  parent: any,
  widgetId: string | undefined,
  anchor: string | null,
  outputEmitter?: any,
): void {
  if (!widgetId) return;
  if (parent?.selectAnchor) {
    parent.selectAnchor(widgetId, anchor);
  } else {
    if (parent?.widgetSelected?.emit) {
      parent.widgetSelected.emit(widgetId);
    }
    if (parent?.anchorSelected?.emit) {
      parent.anchorSelected.emit({ widgetId, anchor });
    }
  }
  outputEmitter?.emit?.({ widgetId, anchor });
}

export class LaneColumnAvatarHelper {
  readonly imageErrors = new Set<string>();
  mainImageError = false;
  private lastDriverId?: string;

  checkDriverChange(currentDriver?: DriverHeatData): void {
    const currentId =
      currentDriver?.objectId ||
      currentDriver?.driver?.entity_id ||
      (currentDriver?.driver as any)?.id;
    if (this.lastDriverId !== currentId) {
      this.lastDriverId = currentId;
      this.imageErrors.clear();
      this.mainImageError = false;
    }
  }

  isPlaceholderAvatar(
    currentDriver?: DriverHeatData,
    url?: string,
    anchor?: string,
  ): boolean {
    this.checkDriverChange(currentDriver);
    if (anchor && this.imageErrors.has(anchor)) return true;
    if (!anchor && this.mainImageError) return true;
    if (!url) return false;
    return url.includes("default_avatar.svg");
  }

  onImageError(event: Event, anchor?: string): void {
    if (anchor) {
      this.imageErrors.add(anchor);
    } else {
      this.mainImageError = true;
    }
    const target = event?.target as HTMLImageElement;
    if (target && !target.src?.includes("default_avatar.svg")) {
      target.src = "assets/images/default_avatar.svg";
    }
  }
}

export function resolveCachedSyntheticInsetInputs(
  cache: Map<string, any>,
  anchor: string,
  key: string | undefined,
  w: AbsoluteWidgetNode | null,
  bindingMode: string,
  targetIndex: number,
  fontSize: number,
  parent: any,
  isCustomizing: boolean,
  targetDriver?: DriverHeatData,
  laneFg?: string,
  laneBg?: string,
) {
  const existing = cache.get(anchor);
  if (
    existing &&
    existing.parent === parent &&
    existing.isCustomizing === isCustomizing &&
    existing.widget?.widgetType === key &&
    existing.widget?.customSettings?.["valueFontSize"] === fontSize &&
    existing.widget?.customSettings?.["gridLane"] === targetIndex &&
    existing.widget?.customSettings?.["targetDriver"] === targetDriver &&
    existing.widget?.customSettings?.["laneForegroundColor"] === laneFg &&
    existing.widget?.customSettings?.["laneBackgroundColor"] === laneBg
  ) {
    return existing;
  }
  const inputs = buildSyntheticInsetWidgetInputs(
    anchor,
    key,
    w,
    bindingMode,
    targetIndex,
    fontSize,
    parent,
    isCustomizing,
    targetDriver,
    laneFg,
    laneBg,
  );
  cache.set(anchor, inputs);
  return inputs;
}

export function resolveCachedSyntheticMainInputs(
  cachedRef: { current?: any },
  key: string,
  w: AbsoluteWidgetNode | null,
  bindingMode: string,
  targetIndex: number,
  parent: any,
  isCustomizing: boolean,
  targetDriver?: DriverHeatData,
  laneFg?: string,
  laneBg?: string,
) {
  const existing = cachedRef.current;
  if (
    existing &&
    existing.parent === parent &&
    existing.isCustomizing === isCustomizing &&
    existing.widget?.widgetType === key &&
    existing.widget?.customSettings?.["gridLane"] === targetIndex &&
    existing.widget?.customSettings?.["targetDriver"] === targetDriver &&
    existing.widget?.customSettings?.["laneForegroundColor"] === laneFg &&
    existing.widget?.customSettings?.["laneBackgroundColor"] === laneBg
  ) {
    return existing;
  }
  cachedRef.current = buildSyntheticMainWidgetInputs(
    key,
    w,
    bindingMode,
    targetIndex,
    parent,
    isCustomizing,
    targetDriver,
    laneFg,
    laneBg,
  );
  return cachedRef.current;
}

export function handleLaneColumnCardClick(
  event: MouseEvent,
  parent: any,
  hd: DriverHeatData | undefined,
  columnKey: string,
  isUIEditorMode: boolean,
  isLapCountClickable: boolean,
  isTeamDriverSwapActive: boolean,
  teammateSelect?: { toggleOpen: () => void } | null,
): void {
  if (isUIEditorMode) return;
  if (!parent || !hd) return;

  if (isLapCountClickable && parent.onCellClick) {
    parent.onCellClick(
      hd,
      { propertyName: columnKey } as ColumnDefinition,
      event,
    );
  } else if (isTeamDriverSwapActive) {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      typeof target.closest === "function" &&
      target.closest("app-custom-select")
    ) {
      return;
    }
    event.stopPropagation?.();
    teammateSelect?.toggleOpen();
  }
}

export function handleLaneColumnInsetClick(
  event: MouseEvent,
  anchor: string,
  insets: Record<string, string> | undefined,
  parent: any,
  hd: DriverHeatData | undefined,
  isUIEditorMode: boolean,
): void {
  if (isUIEditorMode) return;
  const key = insets?.[anchor];
  if (isLaneColumnInsetLapCount(key, false)) {
    event.stopPropagation();
    if (parent?.onCellClick && hd) {
      parent.onCellClick(hd, { propertyName: key } as ColumnDefinition, event);
    }
  }
}

export function resolveLaneColumnFormattedValue(
  hd: DriverHeatData | undefined,
  columnKey: string,
  parent: any,
  settings: LaneColumnWidgetSettings,
  bindingMode: string,
  colDef?: ColumnDefinition,
): string {
  if (!hd) {
    if (settings.emptyRowsMode === "blank") return "";
    if (
      !isOverallOrSeedDataSource(settings, parent, bindingMode) &&
      isNameOrNicknameProperty(columnKey)
    ) {
      return (
        parent?.translationService?.translate?.("RD_EMPTY_LANE") ||
        "RD_EMPTY_LANE"
      );
    }
    if (columnKey === "laneNumber") {
      const effLane =
        bindingMode === "hostLane"
          ? (parent?.activeLaneIndex ??
            parent?.laneIndex ??
            settings?.targetIndex ??
            0)
          : (settings?.targetIndex ?? 0);
      return String(effLane + 1);
    }
    return "--";
  }

  if (parent?.formatValue) {
    return parent.formatValue(
      columnKey,
      RacedayFormatUtils.getPropertyValue(
        hd,
        columnKey,
        settings,
        "center-center",
      ),
      hd,
      colDef,
      "center-center",
      settings,
    );
  }

  if (
    (columnKey === "driver.name" || columnKey === "driver.nickname") &&
    isOverallOrSeedDataSource(settings, parent, bindingMode)
  ) {
    const teamObj =
      hd.participant?.team ||
      (hd.driver as any)?.team ||
      (hd as any)?.team ||
      (hd.actualDriver as any)?.team;
    const teamName = typeof teamObj === "string" ? teamObj : teamObj?.name;
    if (teamName) return teamName;
  }

  const raw = RacedayFormatUtils.getPropertyValue(
    hd,
    columnKey,
    settings,
    "center-center",
  );
  return formatAdjustedLapValue(raw, hd, columnKey);
}

export function applyLaneColumnLastLapsFit(
  cardEl: HTMLElement | null | undefined,
  settings: LaneColumnWidgetSettings,
  widget: AbsoluteWidgetNode | null,
  allLapsCount: number,
  isVerticalLapsFlow: boolean,
  setMaxVisibleLaps: (count: number | undefined) => void,
): void {
  if (!cardEl) return;

  const configuredLaps =
    settings.lastLapsCount !== undefined &&
    settings.lastLapsCount !== null &&
    !isNaN(Number(settings.lastLapsCount)) &&
    Number(settings.lastLapsCount) > 0
      ? Math.max(1, Math.round(Number(settings.lastLapsCount)))
      : 5;

  const baseFontSize =
    widget?.scaleMode === "auto"
      ? 54
      : Number(
          settings.valueFontSize || (widget?.fontSize ? widget.fontSize : 54),
        );
  const explicitW = widget?.width;
  const explicitH = widget?.height;

  const scaleMode = widget?.scaleMode;
  const isCustomScaling = scaleMode !== undefined && scaleMode !== "auto";
  if (isCustomScaling) {
    setMaxVisibleLaps(allLapsCount || configuredLaps);
    cardEl.style.setProperty(
      "--lane-col-last-laps-font-size",
      `${baseFontSize}px`,
    );
  } else {
    const fit = fitColumnLastLaps(
      cardEl,
      isVerticalLapsFlow,
      baseFontSize,
      allLapsCount || configuredLaps,
      explicitW,
      explicitH,
      configuredLaps,
    );
    setMaxVisibleLaps(fit.maxLaps);
    cardEl.style.setProperty(
      "--lane-col-last-laps-font-size",
      `${fit.fontSize}px`,
    );
  }
}
