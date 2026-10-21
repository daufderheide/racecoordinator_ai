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
  formatAdjustedLapValue,
  isOverallDataSource,
  isParentRaceOver,
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

export function formatLaneColumnInsetValue(
  hd: DriverHeatData | undefined,
  anchor: string,
  key: string | undefined,
  settings: LaneColumnWidgetSettings,
  parent: any,
): string {
  if (!key) return "";
  if (!hd) return "--";

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
  };

  if (parent?.formatValue) {
    const colDef = parent.columns?.find((c: any) => c.propertyName === key);
    return parent.formatValue(
      key,
      RacedayFormatUtils.getPropertyValue(hd, key),
      hd,
      colDef,
      anchor,
      insetSettings,
    );
  }

  const raw = RacedayFormatUtils.getPropertyValue(hd, key);
  return formatAdjustedLapValue(raw, hd, key);
}

export function fitLaneColumnHeaderText(
  cardEl: HTMLElement,
  settings: LaneColumnWidgetSettings,
  widget: AbsoluteWidgetNode | null,
  headerLabel: string,
): void {
  const headerEl = cardEl.querySelector(
    ".lane-col-header",
  ) as HTMLElement | null;
  if (!headerEl) return;

  const baseFontSize = Number(
    settings.headerFontSize || (widget?.fontSize ? widget.fontSize : 24),
  );
  const availWidth = Math.max(10, cardEl.clientWidth - 16);
  const availHeight = Math.max(10, cardEl.clientHeight - 8);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const family =
    settings.headerFontFamily ||
    (typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(headerEl).fontFamily
      : "") ||
    "sans-serif";
  ctx.font = `700 ${baseFontSize}px ${family}`;
  const textWidth = ctx.measureText(headerLabel || "").width || 1;

  if (widget?.scaleMode !== undefined && widget?.scaleMode !== "auto") {
    headerEl.style.fontSize = `${baseFontSize}px`;
    return;
  }

  let scale = 1.0;
  if (textWidth > availWidth) {
    scale = Math.min(scale, availWidth / textWidth);
  }
  if (baseFontSize > availHeight) {
    scale = Math.min(scale, availHeight / baseFontSize);
  }

  const fittedSize = Math.max(10, Math.floor(baseFontSize * scale));
  headerEl.style.fontSize = `${fittedSize}px`;
}

export function resolveEffectiveHeaderFontSize(
  settings: LaneColumnWidgetSettings,
  widget: AbsoluteWidgetNode | null,
  cardEl?: HTMLElement | null,
): number {
  const custom = settings.headerFontSize;
  if (widget?.scaleMode === "auto") {
    const cardH = cardEl?.clientHeight || 0;
    if (cardH > 0) {
      const autoSize = Math.round(cardH * 0.18);
      return Math.max(10, Math.min(28, autoSize));
    }
  }
  return custom && custom > 0 ? custom : 14;
}

export function resolveEffectiveInsetFontSize(
  settings: LaneColumnWidgetSettings,
  widget: AbsoluteWidgetNode | null,
  cardEl?: HTMLElement | null,
): number {
  const custom = settings.insetFontSize;
  if (widget?.scaleMode === "auto") {
    const cardH = cardEl?.clientHeight || 0;
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
  if (bindingMode !== "lane" && (!hd || RacedayFormatUtils.isEmptyDriver(hd))) {
    return settings.backgroundColor || "transparent";
  }
  if (
    isOverallDataSource(settings, parent, bindingMode) &&
    isParentRaceOver(parent)
  ) {
    return settings.backgroundColor || "transparent";
  }
  if (hd && parent?.getLaneColor) {
    const bg = parent.getLaneColor(hd, "background_color");
    if (bg) return bg;
  }
  const laneIdx = hd?.laneIndex ?? (bindingMode === "lane" ? targetIndex : -1);
  const track =
    parent?.track ||
    parent?.race?.track ||
    parent?.raceService?.getRace()?.track;
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
  if (bindingMode !== "lane" && (!hd || RacedayFormatUtils.isEmptyDriver(hd))) {
    return settings.textColor || "#ffffff";
  }
  if (
    isOverallDataSource(settings, parent, bindingMode) &&
    isParentRaceOver(parent)
  ) {
    return settings.textColor || "#ffffff";
  }
  if (hd && parent?.getLaneColor) {
    const fg = parent.getLaneColor(hd, "foreground_color");
    if (fg) return fg;
  }
  const laneIdx = hd?.laneIndex ?? (bindingMode === "lane" ? targetIndex : -1);
  const track =
    parent?.track ||
    parent?.race?.track ||
    parent?.raceService?.getRace()?.track;
  const trackLaneFg =
    laneIdx >= 0 ? track?.lanes?.[laneIdx]?.foreground_color : undefined;
  return trackLaneFg || settings.textColor || "#ffffff";
}
