import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";

export const DEFAULT_LANE_COLUMN_VALUE_FONT_SIZE = 36;
export const DEFAULT_GRID_LANE_COLUMN_VALUE_FONT_SIZE = 54;
export const DEFAULT_LANE_COLUMN_HEADER_FONT_SIZE = 14;
export const DEFAULT_GRID_LANE_COLUMN_HEADER_FONT_SIZE = 24;

export function isCustomWidgetKey(key: string | undefined): boolean {
  return Boolean(key && key.startsWith("custom:"));
}

export function getInsetDefaultAlignment(
  anchor: string,
): "left" | "center" | "right" {
  if (anchor.endsWith("-left") || anchor.startsWith("left")) return "left";
  if (anchor.endsWith("-right") || anchor.startsWith("right")) return "right";
  return "center";
}

export function getInsetDefaultVerticalAlignment(
  anchor: string,
): "top" | "center" | "bottom" {
  if (anchor.startsWith("top-") || anchor.startsWith("top")) return "top";
  if (anchor.startsWith("bottom-") || anchor.startsWith("bottom"))
    return "bottom";
  return "center";
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
  targetDriver?: any,
  laneForegroundColor?: string,
  laneBackgroundColor?: string,
): { widget: AbsoluteWidgetNode; parent: any; isCustomizing: boolean } {
  const anchorCfg = widget?.customSettings?.["insetsConfig"]?.[anchor] || {};
  const parentInsetLapDec = widget?.customSettings?.["insetLapDecimalPlaces"];
  const parentInsetTimeDec = widget?.customSettings?.["insetTimeDecimalPlaces"];

  const resolvedDecimalPlaces =
    anchorCfg.decimalPlaces ??
    anchorCfg.lapDecimalPlaces ??
    anchorCfg.lapDecimals ??
    parentInsetLapDec ??
    2;

  const defaultAlignment = getInsetDefaultAlignment(anchor);
  const defaultVertical = getInsetDefaultVerticalAlignment(anchor);
  const rawAlign = anchorCfg.horizontalAlignment || anchorCfg.valueAlignment;
  const resolvedAlignment =
    rawAlign === "start" || rawAlign === "left"
      ? "left"
      : rawAlign === "end" || rawAlign === "right"
        ? "right"
        : rawAlign === "center"
          ? "center"
          : defaultAlignment;
  const resolvedVertical =
    anchorCfg.verticalAlignment === "top" ||
    anchorCfg.verticalAlignment === "center" ||
    anchorCfg.verticalAlignment === "bottom"
      ? anchorCfg.verticalAlignment
      : defaultVertical;

  const customSettings: Record<string, any> = {
    valueAlignment: resolvedAlignment,
    horizontalAlignment: resolvedAlignment,
    verticalAlignment: resolvedVertical,
    ...anchorCfg,
    showHeader: false,
    bindingMode,
    gridLane: targetIndex,
    targetIndex: targetIndex + 1,
    valueFontSize: insetFontSize,
  };
  if (!customSettings["valueAlignment"]) {
    customSettings["valueAlignment"] = resolvedAlignment;
  }
  if (!customSettings["horizontalAlignment"]) {
    customSettings["horizontalAlignment"] = resolvedAlignment;
  }
  if (!customSettings["verticalAlignment"]) {
    customSettings["verticalAlignment"] = resolvedVertical;
  }

  if (targetDriver) {
    customSettings["targetDriver"] = targetDriver;
  }
  if (laneForegroundColor) {
    customSettings["laneForegroundColor"] = laneForegroundColor;
  }
  if (laneBackgroundColor) {
    customSettings["laneBackgroundColor"] = laneBackgroundColor;
  }

  if (customSettings["decimalPlaces"] === undefined) {
    customSettings["decimalPlaces"] = resolvedDecimalPlaces;
  }
  if (customSettings["lapDecimalPlaces"] === undefined) {
    customSettings["lapDecimalPlaces"] = resolvedDecimalPlaces;
  }
  if (
    parentInsetLapDec !== undefined &&
    customSettings["insetLapDecimalPlaces"] === undefined
  ) {
    customSettings["insetLapDecimalPlaces"] = parentInsetLapDec;
  }
  if (
    parentInsetTimeDec !== undefined &&
    customSettings["insetTimeDecimalPlaces"] === undefined
  ) {
    customSettings["insetTimeDecimalPlaces"] = parentInsetTimeDec;
  }

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
  targetDriver?: any,
  laneForegroundColor?: string,
  laneBackgroundColor?: string,
): { widget: AbsoluteWidgetNode; parent: any; isCustomizing: boolean } {
  const customSettings: Record<string, any> = {
    ...(widget?.customSettings || {}),
    showHeader: false,
    bindingMode,
    gridLane: targetIndex,
    targetIndex: targetIndex + 1,
  };

  if (targetDriver) {
    customSettings["targetDriver"] = targetDriver;
  }
  if (laneForegroundColor) {
    customSettings["laneForegroundColor"] = laneForegroundColor;
  }
  if (laneBackgroundColor) {
    customSettings["laneBackgroundColor"] = laneBackgroundColor;
  }

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
  if (key === "heatsRaced" && settings.heatsDisplayMode === "remaining") {
    return translate("RD_COL_HEATS_REMAINING");
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

function tryGetParentLastLaps(
  targetDriver: DriverHeatData | undefined,
  parent: any,
  placeholder: string,
  count: number = 5,
): HeatDataLapItem[] | undefined {
  if (!parent?.getLastLaps) return undefined;
  const colDef = parent.columns?.find(
    (c: any) => c.propertyName === "lastLaps",
  );
  const parentLaps = parent.getLastLaps(
    targetDriver,
    colDef,
    "center-center",
    count,
  );
  if (
    parentLaps &&
    parentLaps.length > 0 &&
    parentLaps[0]?.lapNumber !== undefined
  ) {
    return parentLaps.slice(0, count).map((l: any, idx: number) => ({
      lapNumber: l.lapNumber ?? idx + 1,
      lapTime: l.lapTime ?? placeholder,
      isBest: Boolean(l.isBest),
      segments: l.segments ?? [],
    }));
  }
  return undefined;
}

function extractLapSegments(
  detail: any,
  decimals: number,
  placeholder: string,
): string[] {
  const segments: string[] = [];
  if (detail?.segments && detail.segments.length > 0) {
    const numToDisplay = Math.min(detail.segments.length, 4);
    for (let s = 0; s < numToDisplay; s++) {
      const seg = detail.segments[s];
      segments.push(seg > 0 ? seg.toFixed(decimals) : placeholder);
    }
  }
  return segments;
}

export function computeHeatDataLastLaps(
  targetDriver: DriverHeatData | undefined,
  settings: Partial<LaneColumnWidgetSettings>,
  parent: any,
): HeatDataLapItem[] {
  const decimals =
    settings.timeDecimalPlaces !== undefined
      ? Number(settings.timeDecimalPlaces)
      : 3;
  const count =
    settings.lastLapsCount !== undefined &&
    settings.lastLapsCount !== null &&
    !isNaN(Number(settings.lastLapsCount)) &&
    Number(settings.lastLapsCount) > 0
      ? Math.max(1, Math.round(Number(settings.lastLapsCount)))
      : 5;
  const emptyLapPlaceholder =
    decimals > 0 ? "--." + "-".repeat(decimals) : "--";

  if (!targetDriver) {
    const parentLaps = tryGetParentLastLaps(
      targetDriver,
      parent,
      emptyLapPlaceholder,
      count,
    );
    if (parentLaps) return parentLaps;
    return Array.from({ length: count }, () => ({
      lapNumber: 0,
      lapTime: emptyLapPlaceholder,
      isBest: false,
      segments: [],
    }));
  }

  const laps = targetDriver.lapTimes || [];
  const lapsDetails = targetDriver.lapsWithDetails || [];
  const n = laps.length;

  if (n === 0) {
    const parentLaps = tryGetParentLastLaps(
      targetDriver,
      parent,
      emptyLapPlaceholder,
      count,
    );
    if (parentLaps) return parentLaps;
  }
  const bestTime = targetDriver.bestLapTime || 0;

  const result: HeatDataLapItem[] = [];
  for (let i = 1; i <= count; i++) {
    const index = n - 1 - i;
    if (index >= 0 && laps[index] && laps[index] > 0) {
      const val = laps[index];
      const isBest = bestTime > 0 && Math.abs(val - bestTime) < 0.0001;
      result.push({
        lapNumber: index + 1,
        lapTime: val.toFixed(decimals),
        isBest,
        segments: extractLapSegments(
          lapsDetails[index],
          decimals,
          emptyLapPlaceholder,
        ),
      });
    } else {
      result.push({
        lapNumber: index >= 0 ? index + 1 : 0,
        lapTime: emptyLapPlaceholder,
        isBest: false,
        segments: [],
      });
    }
  }

  return result;
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
  if (!key) return false;
  const normalizedKey = key.startsWith("lane-col:")
    ? key.substring("lane-col:".length)
    : key;
  return (
    normalizedKey === "driver.avatarUrl" ||
    normalizedKey === "flag" ||
    normalizedKey === "qrCode" ||
    normalizedKey === "driverViewQrCode" ||
    normalizedKey.startsWith("imageset_")
  );
}

export function isEditorMode(parent: any): boolean {
  if (!parent) return false;
  if (typeof parent.isUIEditorMode === "function") {
    return Boolean(parent.isUIEditorMode());
  }
  return Boolean(parent.isUIEditorMode || parent.isLayoutCustomizing);
}

export function resolveLaneColumnImageUrl(
  key: string,
  hd: DriverHeatData | undefined,
  parent: any,
  anchor?: string,
  targetIndex?: number,
): string {
  if (!parent) return "";
  const normalizedKey = key?.startsWith("lane-col:")
    ? key.substring("lane-col:".length)
    : key;
  if (!normalizedKey) return "";

  const isEditor = isEditorMode(parent);

  const laneIndex = hd?.laneIndex ?? targetIndex ?? 0;

  if (normalizedKey === "driver.avatarUrl") {
    const rawAvatarUrl =
      hd?.driver?.avatarUrl ||
      (hd?.driver as any)?.avatar_url ||
      hd?.participant?.driver?.avatarUrl ||
      (hd?.participant?.driver as any)?.avatar_url;
    const avatarUrl =
      typeof rawAvatarUrl === "string" ? rawAvatarUrl.trim() : rawAvatarUrl;
    if (avatarUrl) {
      return parent.getFullUrl ? parent.getFullUrl(avatarUrl) : avatarUrl;
    }
    if (isEditor || (hd && !RacedayFormatUtils.isEmptyDriver(hd))) {
      const defaultAvatar = "assets/images/default_avatar.svg";
      return parent.getFullUrl
        ? parent.getFullUrl(defaultAvatar)
        : defaultAvatar;
    }
    return "";
  }
  if (normalizedKey === "flag") {
    if (parent.formatColumnValue && hd) {
      const colDef = parent.columns?.find(
        (c: any) => c.propertyName === normalizedKey,
      );
      return parent.formatColumnValue(hd, colDef, normalizedKey, anchor);
    }
    return parent.getCurrentFlagUrl ? parent.getCurrentFlagUrl() : "";
  }
  if (normalizedKey === "qrCode") {
    if (parent.getLaneQrCodeUrl) {
      const url = parent.getLaneQrCodeUrl(laneIndex);
      if (url) return url;
    }
    if (isEditor) {
      return parent.qrCodeUrl || "";
    }
    return "";
  }
  if (normalizedKey === "driverViewQrCode") {
    if (parent.getDriverViewQrCodeUrl) {
      const url = parent.getDriverViewQrCodeUrl(hd || laneIndex);
      if (url) return url;
    }
    if (isEditor) {
      return parent.qrCodeUrl || "";
    }
    return "";
  }
  if (normalizedKey.startsWith("imageset_")) {
    const assetId = normalizedKey.replace("imageset_", "");
    const asset = parent.findAssetById
      ? parent.findAssetById(assetId)
      : undefined;
    return parent.getSelectedImageFromSet
      ? parent.getSelectedImageFromSet(asset, null, hd)
      : "";
  }
  return "";
}

export function getSvgPreserveAspectRatio(
  anchor?: string,
  horizontal?: string,
  vertical?: string,
): string {
  const h =
    horizontal || (anchor ? getInsetDefaultAlignment(anchor) : undefined);
  const v =
    vertical || (anchor ? getInsetDefaultVerticalAlignment(anchor) : undefined);

  if (h && v) {
    const hPart = h === "left" ? "xMin" : h === "right" ? "xMax" : "xMid";
    const vPart = v === "top" ? "YMin" : v === "bottom" ? "YMax" : "YMid";
    return `${hPart}${vPart} meet`;
  }

  switch (anchor) {
    case "top-left":
      return "xMinYMin meet";
    case "top-center":
      return "xMidYMin meet";
    case "top-right":
      return "xMaxYMin meet";
    case "center-left":
      return "xMinYMid meet";
    case "center-right":
      return "xMaxYMid meet";
    case "bottom-left":
      return "xMinYMax meet";
    case "bottom-center":
      return "xMidYMax meet";
    case "bottom-right":
      return "xMaxYMax meet";
    default:
      return "xMidYMid meet";
  }
}

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

export function getSharedCanvasContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
    sharedCtx = sharedCanvas.getContext("2d");
  }
  return sharedCtx;
}

function calculateBaseDimensions(
  cardEl: HTMLElement,
  settings: LaneColumnWidgetSettings,
  isHorizontal: boolean,
  explicitWidth?: number,
  explicitHeight?: number,
): { availWidth: number; availHeight: number } {
  const cardW =
    explicitWidth && explicitWidth > 0 ? explicitWidth : cardEl.clientWidth;
  const cardH =
    explicitHeight && explicitHeight > 0 ? explicitHeight : cardEl.clientHeight;
  let availWidth = Math.max(10, cardW - 8);
  let availHeight = Math.max(10, cardH);

  if (settings.showHeader !== false) {
    if (isHorizontal) {
      const headerEl = explicitWidth
        ? null
        : (cardEl.querySelector(".lane-col-header") as HTMLElement | null);
      const headerW = headerEl ? headerEl.offsetWidth + 4 : 40;
      availWidth = Math.max(10, availWidth - headerW);
      availHeight = Math.max(10, availHeight - 4);
    } else {
      const headerH = (settings.headerFontSize || 14) * 1.2;
      availHeight = Math.max(10, cardH - headerH - 4);
    }
  } else {
    availHeight = Math.max(10, cardH - 4);
  }
  return { availWidth, availHeight };
}

function safeguardTextOverflow(
  cardEl: HTMLElement,
  initialTargetSize: number,
  minSize: number,
  skipDomCheck = false,
): void {
  if (skipDomCheck) return;
  const textEl = cardEl.querySelector(".lane-col-text") as HTMLElement | null;
  const valueEl = cardEl.querySelector(".lane-col-value") as HTMLElement | null;
  if (!textEl || !valueEl || valueEl.clientWidth <= 0) return;

  const overflow = textEl.scrollWidth - valueEl.clientWidth;
  if (overflow > 0.5 && initialTargetSize > minSize) {
    const ratio = valueEl.clientWidth / textEl.scrollWidth;
    const targetSize = Math.max(minSize, Math.floor(initialTargetSize * ratio));
    if (targetSize < initialTargetSize) {
      cardEl.style.setProperty("--lane-col-value-font-size", `${targetSize}px`);
    }
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
  explicitWidth?: number,
  explicitHeight?: number,
): void {
  if (!text) return;

  const cardW =
    explicitWidth && explicitWidth > 0 ? explicitWidth : cardEl.clientWidth;
  const cardH =
    explicitHeight && explicitHeight > 0 ? explicitHeight : cardEl.clientHeight;

  if (cardW <= 0 || cardH <= 0) {
    const fallbackSize = settings.valueFontSize || 36;
    cardEl.style.setProperty("--lane-col-value-font-size", `${fallbackSize}px`);
    cardEl.style.setProperty("--lane-col-pad-left", "0px");
    cardEl.style.setProperty("--lane-col-pad-right", "0px");
    cardEl.style.setProperty("--lane-col-pad-top", "0px");
    cardEl.style.setProperty("--lane-col-pad-bottom", "0px");
    return;
  }

  const isHorizontal = layoutOrientation === "horizontal";
  const baseDims = calculateBaseDimensions(
    cardEl,
    settings,
    isHorizontal,
    explicitWidth,
    explicitHeight,
  );
  const dims = applyColumnInsetsAndPaddings(
    cardEl,
    baseDims.availWidth,
    baseDims.availHeight,
    hasLeftInsets,
    hasRightInsets,
    hasInset,
    effectiveInsetFontSize,
  );

  const defaultBaseSize = settings.gridId
    ? DEFAULT_GRID_LANE_COLUMN_VALUE_FONT_SIZE
    : DEFAULT_LANE_COLUMN_VALUE_FONT_SIZE;
  let baseFontSize: number;
  if (scaleMode === "auto") {
    baseFontSize = Math.max(
      12,
      Math.min(defaultBaseSize, Math.round(dims.availHeight * 0.85)),
    );
  } else {
    baseFontSize = settings.valueFontSize || defaultBaseSize;
  }

  const isCustomScaling = scaleMode !== undefined && scaleMode !== "auto";

  if (isCustomScaling) {
    cardEl.style.setProperty("--lane-col-value-font-size", `${baseFontSize}px`);
    return;
  }

  const ctx = getSharedCanvasContext();
  if (!ctx) return;

  const computedFamily =
    settings.valueFontFamily ||
    (!explicitWidth && typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(cardEl).fontFamily
      : "") ||
    "sans-serif";
  ctx.font = `700 ${baseFontSize}px ${computedFamily}`;
  const textWidth = ctx.measureText(text).width || 1;

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
  safeguardTextOverflow(cardEl, targetSize, minSize, Boolean(explicitWidth));
}

export function fitColumnLastLaps(
  cardEl: HTMLElement,
  isVerticalFlow: boolean,
  baseFontSize: number = 54,
  lapCount: number = 5,
  explicitWidth?: number,
  explicitHeight?: number,
  maxConfiguredLaps: number = 5,
): { maxLaps: number; fontSize: number } {
  const containerW =
    explicitWidth && explicitWidth > 0 ? explicitWidth : cardEl.clientWidth;
  const containerH =
    explicitHeight && explicitHeight > 0 ? explicitHeight : cardEl.clientHeight;
  const maxLapsLimit = Math.max(1, maxConfiguredLaps || 5);
  const totalLaps = Math.min(
    maxLapsLimit,
    Math.max(1, lapCount || maxLapsLimit),
  );

  if (containerW <= 0 || containerH <= 0) {
    return { maxLaps: totalLaps, fontSize: baseFontSize };
  }

  if (isVerticalFlow) {
    const heightPerLap = (containerH - (totalLaps - 1) * 8) / totalLaps;
    const maxFontSizeByHeight = Math.floor(heightPerLap * 0.75);
    const maxFontSizeByWidth = Math.floor((containerW * 0.9 - 20) / 4.5);
    const targetFontSize = Math.max(
      12,
      Math.min(baseFontSize, maxFontSizeByHeight, maxFontSizeByWidth),
    );
    const lapHeight = targetFontSize * 1.3 + 8;
    const maxLaps = Math.max(
      1,
      Math.min(totalLaps, Math.floor(containerH / lapHeight)),
    );
    return { maxLaps, fontSize: targetFontSize };
  } else {
    const maxFontSizeByHeight = Math.floor(containerH * 0.75);
    const widthPerLap = (containerW - (totalLaps - 1) * 12) / totalLaps;
    const maxFontSizeByWidth = Math.floor((widthPerLap * 0.9 - 20) / 4.5);
    const targetFontSize = Math.max(
      12,
      Math.min(baseFontSize, maxFontSizeByHeight, maxFontSizeByWidth),
    );
    const lapWidth = targetFontSize * 4.5 + 24;
    const maxLaps = Math.max(
      1,
      Math.min(totalLaps, Math.floor(containerW / lapWidth)),
    );
    return { maxLaps, fontSize: targetFontSize };
  }
}

export * from "./raceday-lane-column-driver.helper";

export function extractDroppedColumnKey(
  event: DragEvent,
  parent: any,
): string | undefined {
  let droppedKey: string | undefined;

  if (event.dataTransfer) {
    try {
      const dataStr = event.dataTransfer.getData("application/json");
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.type === "new-column" && data.key) {
          droppedKey = data.key;
        } else if (data.key) {
          droppedKey = data.key;
        } else if (data.type) {
          droppedKey = data.type;
        }
      }
    } catch (_) {}

    if (!droppedKey) {
      const text = event.dataTransfer.getData("text/plain");
      if (text) {
        droppedKey = text;
      }
    }
  }

  if (!droppedKey && parent?.draggedWidgetType) {
    droppedKey = parent.draggedWidgetType;
  }

  if (droppedKey && droppedKey.startsWith("lane-col:")) {
    droppedKey = droppedKey.substring("lane-col:".length);
  }

  return droppedKey;
}

export function resolveInsetHorizontalAlignment(
  settings: LaneColumnWidgetSettings,
  anchor: string,
): "left" | "center" | "right" {
  const cfg = settings.insetsConfig?.[anchor];
  const val = cfg?.horizontalAlignment || cfg?.valueAlignment;
  if (val === "start" || val === "left") return "left";
  if (val === "end" || val === "right") return "right";
  if (val === "center") return "center";
  return getInsetDefaultAlignment(anchor);
}

export function resolveInsetVerticalAlignment(
  settings: LaneColumnWidgetSettings,
  anchor: string,
): "top" | "center" | "bottom" {
  const cfg = settings.insetsConfig?.[anchor];
  const val = cfg?.verticalAlignment;
  if (val === "top" || val === "center" || val === "bottom") return val;
  return getInsetDefaultVerticalAlignment(anchor);
}

export function resolveInsetJustifyContent(
  settings: LaneColumnWidgetSettings,
  anchor: string,
): string {
  const align = resolveInsetHorizontalAlignment(settings, anchor);
  if (align === "left") return "flex-start";
  if (align === "right") return "flex-end";
  return "center";
}

export function resolveInsetAlignItems(
  settings: LaneColumnWidgetSettings,
  anchor: string,
): string {
  const align = resolveInsetVerticalAlignment(settings, anchor);
  if (align === "top") return "flex-start";
  if (align === "bottom") return "flex-end";
  return "center";
}

export function resolveInsetObjectPosition(
  settings: LaneColumnWidgetSettings,
  anchor: string,
): string {
  const h = resolveInsetHorizontalAlignment(settings, anchor);
  const v = resolveInsetVerticalAlignment(settings, anchor);
  return `${h} ${v}`;
}

export function hasSideInsets(
  insets: Record<string, string> | undefined,
  side: "top" | "bottom" | "left" | "right",
  suppressed = false,
): boolean {
  if (suppressed || !insets) return false;
  if (side === "top") {
    return Boolean(
      insets["top-left"] || insets["top-center"] || insets["top-right"],
    );
  }
  if (side === "bottom") {
    return Boolean(
      insets["bottom-left"] ||
      insets["bottom-center"] ||
      insets["bottom-right"],
    );
  }
  if (side === "left") {
    return Boolean(insets["top-left"] || insets["bottom-left"]);
  }
  return Boolean(insets["top-right"] || insets["bottom-right"]);
}

export function checkCustomWidgetReload(
  customWidgetService:
    | { getCustomWidgets: () => any[]; reloadCustomWidgets: () => Promise<any> }
    | null
    | undefined,
  columnKey: string,
  insets?: Record<string, string>,
): void {
  if (
    customWidgetService &&
    customWidgetService.getCustomWidgets().length === 0 &&
    (isCustomWidgetKey(columnKey) ||
      Boolean(
        insets && Object.values(insets).some((k) => isCustomWidgetKey(k)),
      ))
  ) {
    customWidgetService.reloadCustomWidgets().catch(() => {});
  }
}
