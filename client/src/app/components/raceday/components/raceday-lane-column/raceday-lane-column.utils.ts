import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";

export function isCustomWidgetKey(key: string | undefined): boolean {
  return Boolean(key && key.startsWith("custom:"));
}

export function buildSyntheticInsetWidgetInputs(
  anchor: string,
  key: string | undefined,
  widget: AbsoluteWidgetNode | null,
  bindingMode: string,
  targetIndex: number,
  insetFontSize: number,
  parent: any,
  isCustomizing: boolean,
): { widget: AbsoluteWidgetNode; parent: any; isCustomizing: boolean } {
  const customSettings: Record<string, any> = {
    ...(widget?.customSettings?.["insetsConfig"]?.[anchor] || {}),
    showHeader: false,
    bindingMode,
    gridLane: targetIndex,
    targetIndex: targetIndex + 1,
    valueFontSize: insetFontSize,
  };

  const syntheticWidget: AbsoluteWidgetNode = {
    ...(widget || ({} as AbsoluteWidgetNode)),
    id: `${widget?.id || "lane-col"}-inset-${anchor}`,
    widgetType: (key as any) || "lane-column",
    customSettings,
  };

  return {
    widget: syntheticWidget,
    parent,
    isCustomizing,
  };
}

export function buildSyntheticMainWidgetInputs(
  key: string | undefined,
  widget: AbsoluteWidgetNode | null,
  bindingMode: string,
  targetIndex: number,
  parent: any,
  isCustomizing: boolean,
): { widget: AbsoluteWidgetNode; parent: any; isCustomizing: boolean } {
  const customSettings: Record<string, any> = {
    ...(widget?.customSettings || {}),
    showHeader: false,
    bindingMode,
    gridLane: targetIndex,
    targetIndex: targetIndex + 1,
  };

  const syntheticWidget: AbsoluteWidgetNode = {
    ...(widget || ({} as AbsoluteWidgetNode)),
    id: `${widget?.id || "lane-col"}-main`,
    widgetType: (key as any) || "lane-column",
    customSettings,
  };

  return {
    widget: syntheticWidget,
    parent,
    isCustomizing,
  };
}

export function formatAdjustedLapValue(
  raw: any,
  hd: DriverHeatData,
  key: string,
): string {
  if (raw == null) return "--";
  if (
    (key === "lapCount" ||
      key === "heatTotalLaps" ||
      key === "overallLapCount" ||
      key === "totalLaps" ||
      key === "raceTotalLaps" ||
      key === "overallTotalLaps") &&
    (hd.autoCalculatedLaps || 0) > 0 &&
    !hd.isFinished
  ) {
    const adjusted =
      Math.round((Number(raw) - hd.autoCalculatedLaps + Number.EPSILON) * 1e6) /
      1e6;
    return String(adjusted);
  }
  return String(raw);
}

export function resolveColumnHeaderLabel(
  key: string,
  settings: LaneColumnWidgetSettings,
  parent: any,
  translate: (k: string) => string,
): string {
  if (settings.customLabel && settings.customLabel.trim()) {
    return settings.customLabel;
  }
  if (isCustomWidgetKey(key)) {
    const customDef = parent?.customWidgetService?.getWidgetDefinition?.(key);
    if (customDef?.manifest?.name) {
      return customDef.manifest.name;
    }
    return key.substring("custom:".length);
  }
  const labelKey = RacedayLayoutUtils.getLabelKeyForColumn(key);
  const resolvedLabelKey =
    labelKey && labelKey !== "UNKNOWN"
      ? labelKey
      : `RD_COL_${key.toUpperCase()}`;

  if (parent?.getColumnLabel) {
    const colDef = parent.columns?.find((c: any) => c.propertyName === key) || {
      propertyName: key,
      labelKey: resolvedLabelKey,
    };
    return parent.getColumnLabel(colDef);
  }
  if (labelKey && labelKey !== "UNKNOWN") {
    return translate(labelKey);
  }
  return key;
}

export interface HeatDataLapItem {
  lapNumber: number;
  lapTime: string;
  isBest: boolean;
  segments: string[];
}

export function computeHeatDataLastLaps(
  targetDriver: DriverHeatData | undefined,
  settings: LaneColumnWidgetSettings,
  parent: any,
): HeatDataLapItem[] {
  if (!targetDriver) return [];

  const laps = targetDriver.lapTimes || [];
  const lapsDetails = targetDriver.lapsWithDetails || [];
  const n = laps.length;

  if (n > 0) {
    const decimals =
      settings.timeDecimalPlaces !== undefined
        ? Number(settings.timeDecimalPlaces)
        : 3;
    const bestTime = targetDriver.bestLapTime || 0;

    const result: HeatDataLapItem[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const val = laps[i] || 0;
      if (val <= 0) continue;

      const formattedLapTime = val.toFixed(decimals);
      const isBest = bestTime > 0 && Math.abs(val - bestTime) < 0.0001;

      const segments: string[] = [];
      const detail = lapsDetails[i];
      if (detail?.segments && detail.segments.length > 0) {
        for (const seg of detail.segments) {
          if (seg > 0) {
            segments.push(seg.toFixed(decimals));
          }
        }
      }

      result.push({
        lapNumber: i + 1,
        lapTime: formattedLapTime,
        isBest,
        segments,
      });
    }
    return result;
  }

  if (parent?.getLastLaps) {
    const colDef = parent.columns?.find(
      (c: any) => c.propertyName === "lastLaps",
    );
    const parentLaps =
      parent.getLastLaps(targetDriver, colDef, "center-center") || [];
    return parentLaps.map((l: any, idx: number) => ({
      lapNumber: l.lapNumber ?? idx + 1,
      lapTime: l.lapTime ?? "--",
      isBest: Boolean(l.isBest),
      segments: l.segments ?? [],
    }));
  }

  return [];
}

export function resolvePacingBenchmarkType(
  columnKey: string,
): GhostBenchmarkType {
  switch (columnKey) {
    case "ghostPacingPB":
      return "PERSONAL_BEST";
    case "ghostPacingPersonalAvg":
      return "PERSONAL_AVG";
    case "ghostPacingPersonalMedian":
      return "PERSONAL_MEDIAN";
    case "ghostPacingLeaderAvg":
      return "HEAT_LEADER_AVG";
    case "ghostPacingLeaderMedian":
      return "HEAT_LEADER_MEDIAN";
    case "ghostPacingLeaderBest":
      return "HEAT_LEADER";
    case "ghostPacing":
    default:
      return "LANE_RECORD";
  }
}

export function resolvePacingDecimalPlaces(
  settings: LaneColumnWidgetSettings,
  parent: any,
  columnKey: string,
): number {
  const s = settings as any;
  const parentSettings =
    parent?.laneViewWidgetSettings ||
    parent?.currentRacedayLayout?.widgets?.find?.(
      (w: any) => w.widgetType === "lane-view",
    )?.customSettings;
  const customColDecimals =
    s?.columnDecimals ||
    s?.columnDecimalPlaces ||
    parentSettings?.columnDecimals ||
    parentSettings?.columnDecimalPlaces;
  if (customColDecimals) {
    if (
      customColDecimals[columnKey] !== undefined &&
      customColDecimals[columnKey] !== null &&
      customColDecimals[columnKey] !== ""
    ) {
      return Math.min(3, Math.max(0, Number(customColDecimals[columnKey])));
    }
    for (const k of Object.keys(customColDecimals)) {
      if (
        k.startsWith("ghostPacing") &&
        customColDecimals[k] !== undefined &&
        customColDecimals[k] !== null &&
        customColDecimals[k] !== ""
      ) {
        return Math.min(3, Math.max(0, Number(customColDecimals[k])));
      }
    }
  }
  if (settings.timeDecimalPlaces !== undefined) {
    return Math.min(3, Math.max(0, Number(settings.timeDecimalPlaces)));
  }
  return 3;
}

export function applyColumnInsetsAndPaddings(
  cardEl: HTMLElement,
  availWidth: number,
  availHeight: number,
  _hasLeftInsets: boolean,
  _hasRightInsets: boolean,
  _hasInset: (anchor: string) => boolean,
  _effectiveInsetFont: number,
): { availWidth: number; availHeight: number } {
  cardEl.style.setProperty("--lane-col-pad-left", "0px");
  cardEl.style.setProperty("--lane-col-pad-right", "0px");
  cardEl.style.setProperty("--lane-col-pad-top", "0px");
  cardEl.style.setProperty("--lane-col-pad-bottom", "0px");

  return { availWidth, availHeight };
}

export function isLaneColumnImageProperty(key: string): boolean {
  return (
    key === "driver.avatarUrl" ||
    key === "flag" ||
    key === "qrCode" ||
    key === "driverViewQrCode" ||
    key.startsWith("imageset_")
  );
}

export function resolveLaneColumnImageUrl(
  key: string,
  hd: DriverHeatData | undefined,
  parent: any,
  anchor?: string,
): string {
  if (!parent || !hd) return "";

  if (key === "driver.avatarUrl") {
    const avatarUrl =
      hd.driver?.avatarUrl ||
      (hd.driver as any)?.avatar_url ||
      hd.participant?.driver?.avatarUrl ||
      (hd.participant?.driver as any)?.avatar_url;
    return avatarUrl ? parent.getFullUrl(avatarUrl) : "";
  }
  if (key === "flag") {
    if (parent.formatColumnValue) {
      const colDef = parent.columns?.find((c: any) => c.propertyName === key);
      return parent.formatColumnValue(hd, colDef, key, anchor);
    }
    return parent.getCurrentFlagUrl ? parent.getCurrentFlagUrl() : "";
  }
  if (key === "qrCode") {
    return parent.getLaneQrCodeUrl ? parent.getLaneQrCodeUrl(hd.laneIndex) : "";
  }
  if (key === "driverViewQrCode") {
    return parent.getDriverViewQrCodeUrl
      ? parent.getDriverViewQrCodeUrl(hd.laneIndex)
      : "";
  }
  if (key.startsWith("imageset_")) {
    const assetId = key.replace("imageset_", "");
    const asset = parent.findAssetById
      ? parent.findAssetById(assetId)
      : undefined;
    return parent.getSelectedImageFromSet
      ? parent.getSelectedImageFromSet(asset, null, hd)
      : "";
  }
  return "";
}

function calculateBaseDimensions(
  cardEl: HTMLElement,
  settings: LaneColumnWidgetSettings,
  isHorizontal: boolean,
): { availWidth: number; availHeight: number } {
  let availWidth = Math.max(10, cardEl.clientWidth - 24 - 8);
  let availHeight = Math.max(10, cardEl.clientHeight);

  if (settings.showHeader !== false) {
    if (isHorizontal) {
      const headerEl = cardEl.querySelector(
        ".lane-col-header",
      ) as HTMLElement | null;
      const headerW = headerEl ? headerEl.offsetWidth + 8 : 60;
      availWidth = Math.max(10, availWidth - headerW);
      availHeight = Math.max(10, availHeight - 12);
    } else {
      const headerEl = cardEl.querySelector(
        ".lane-col-header",
      ) as HTMLElement | null;
      const headerH = headerEl
        ? headerEl.offsetHeight
        : (settings.headerFontSize || 14) * 1.2;
      availHeight = Math.max(10, availHeight - headerH - 8);
    }
  } else {
    availHeight = Math.max(10, availHeight - 16);
  }
  return { availWidth, availHeight };
}

function safeguardTextOverflow(
  cardEl: HTMLElement,
  initialTargetSize: number,
  minSize: number,
): void {
  const textEl = cardEl.querySelector(".lane-col-text") as HTMLElement | null;
  const valueEl = cardEl.querySelector(".lane-col-value") as HTMLElement | null;
  if (!textEl || !valueEl || valueEl.clientWidth <= 0) return;

  let targetSize = initialTargetSize;
  let attempts = 0;
  while (
    textEl.scrollWidth > valueEl.clientWidth + 0.5 &&
    targetSize > minSize &&
    attempts < 10
  ) {
    targetSize--;
    cardEl.style.setProperty("--lane-col-value-font-size", `${targetSize}px`);
    attempts++;
  }
}

export function fitColumnTextValue(
  cardEl: HTMLElement,
  text: string,
  settings: LaneColumnWidgetSettings,
  scaleMode: string | undefined,
  layoutOrientation: "vertical" | "horizontal",
  hasLeftInsets: boolean,
  hasRightInsets: boolean,
  hasInset: (anchor: string) => boolean,
  effectiveInsetFontSize: number,
): void {
  if (!text) return;

  let baseFontSize = settings.valueFontSize || 36;
  if (scaleMode === "auto" && !settings.valueFontSize) {
    const cardH = cardEl.clientHeight || 0;
    if (cardH > 0) {
      baseFontSize = Math.max(12, Math.min(48, Math.round(cardH * 0.45)));
    }
  }

  if (cardEl.clientWidth <= 0 || cardEl.clientHeight <= 0) {
    cardEl.style.setProperty("--lane-col-value-font-size", `${baseFontSize}px`);
    cardEl.style.setProperty("--lane-col-pad-left", "0px");
    cardEl.style.setProperty("--lane-col-pad-right", "0px");
    cardEl.style.setProperty("--lane-col-pad-top", "0px");
    cardEl.style.setProperty("--lane-col-pad-bottom", "0px");
    return;
  }

  const isHorizontal = layoutOrientation === "horizontal";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const computedFamily =
    settings.valueFontFamily ||
    (typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(cardEl).fontFamily
      : "") ||
    "sans-serif";
  ctx.font = `700 ${baseFontSize}px ${computedFamily}`;
  const textWidth = ctx.measureText(text).width || 1;

  const baseDims = calculateBaseDimensions(cardEl, settings, isHorizontal);
  const dims = applyColumnInsetsAndPaddings(
    cardEl,
    baseDims.availWidth,
    baseDims.availHeight,
    hasLeftInsets,
    hasRightInsets,
    hasInset,
    effectiveInsetFontSize,
  );

  let scale = 1;
  if (dims.availWidth > 0 && textWidth > dims.availWidth) {
    scale = Math.min(scale, dims.availWidth / textWidth);
  }
  if (dims.availHeight > 0 && baseFontSize > dims.availHeight) {
    scale = Math.min(scale, dims.availHeight / baseFontSize);
  }

  const minSize = 10;
  const targetSize = Math.max(minSize, Math.floor(baseFontSize * scale));
  cardEl.style.setProperty("--lane-col-value-font-size", `${targetSize}px`);
  safeguardTextOverflow(cardEl, targetSize, minSize);
}

export function fitColumnLastLaps(
  lapsEl: HTMLElement,
  layoutOrientation: "vertical" | "horizontal",
): number {
  const isHorizontal = layoutOrientation === "horizontal";
  if (isHorizontal) {
    const containerW = lapsEl.clientWidth;
    const firstItem = lapsEl.querySelector(
      ".last-lap-item",
    ) as HTMLElement | null;
    const itemW = firstItem ? firstItem.offsetWidth + 8 : 80;
    if (containerW > 0 && itemW > 0) {
      return Math.max(1, Math.floor(containerW / itemW));
    }
  } else {
    const containerH = lapsEl.clientHeight;
    const firstItem = lapsEl.querySelector(
      ".last-lap-item",
    ) as HTMLElement | null;
    const itemH = firstItem ? firstItem.offsetHeight + 4 : 26;
    if (containerH > 0 && itemH > 0) {
      return Math.max(1, Math.floor(containerH / itemH));
    }
  }
  return 1;
}
