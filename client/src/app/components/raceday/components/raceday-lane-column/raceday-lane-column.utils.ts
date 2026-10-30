import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";

import {
  applyValueWrapStyles,
  computeBestWrapTextFontSize,
  computeSingleLineTextScale,
  isNameOrTeamProperty,
  isNumericalOrTimeText,
} from "./raceday-lane-column-text-wrap.helper";

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

export * from "./raceday-lane-column-last-laps.helper";

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

export function resolveEffectiveHeaderFontSize(
  settings: LaneColumnWidgetSettings,
  widget: AbsoluteWidgetNode | null,
  cardEl?: HTMLElement | null,
  cachedHeight?: number,
): number {
  const custom = settings.headerFontSize;
  if (widget?.scaleMode === "auto" || (!widget && settings)) {
    const isGrid = Boolean(
      settings.gridId || widget?.customSettings?.["gridId"],
    );
    const isHeaderWidget = Boolean(
      settings.isHeaderWidget ||
      (widget?.customSettings as any)?.["isHeaderWidget"] ||
      cardEl?.classList?.contains("header-widget-card"),
    );
    const cardH =
      cachedHeight && cachedHeight > 0
        ? cachedHeight
        : cardEl?.clientHeight ||
          (widget?.height && widget.height > 0 ? widget.height : 0);
    if (cardH > 0) {
      if (isHeaderWidget) {
        return Math.max(12, Math.min(24, Math.round(cardH * 0.55)));
      }
      if (isGrid) {
        return Math.max(10, Math.min(24, Math.round(cardH * 0.18)));
      }
      return Math.max(12, Math.min(38, Math.round(cardH * 0.18)));
    }
  }
  return custom && custom > 0 ? custom : 14;
}

function calculateBaseDimensions(
  cardEl: HTMLElement,
  settings: LaneColumnWidgetSettings,
  isHorizontal: boolean,
  explicitWidth?: number,
  explicitHeight?: number,
  scaleMode?: string,
  hasTeamName?: boolean,
): { availWidth: number; availHeight: number } {
  const cardW =
    explicitWidth && explicitWidth > 0 ? explicitWidth : cardEl.clientWidth;
  const cardH =
    explicitHeight && explicitHeight > 0 ? explicitHeight : cardEl.clientHeight;

  const borderWidth =
    settings.showBorder !== false
      ? settings.borderWidth != null
        ? settings.borderWidth
        : 1
      : 0;
  let availWidth = Math.max(10, cardW - borderWidth * 2 - 10);
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
      const effHeaderFont =
        scaleMode === "auto"
          ? resolveEffectiveHeaderFontSize(
              settings,
              null,
              cardEl,
              explicitHeight,
            )
          : settings.headerFontSize || 14;
      const headerH = effHeaderFont * 1.2 + 8;
      availHeight = Math.max(10, cardH - headerH - 4);
    }
  } else {
    availHeight = Math.max(10, cardH - 4);
  }

  if (hasTeamName) {
    availHeight = Math.max(10, Math.round(availHeight * 0.65));
  }

  return { availWidth, availHeight };
}

export function safeguardTextOverflow(
  cardEl: HTMLElement,
  initialTargetSize: number,
  minSize: number,
): void {
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

export function resolveCardFontFamily(
  cardEl: HTMLElement,
  settings: LaneColumnWidgetSettings,
): string {
  if (settings.valueFontFamily) {
    return settings.valueFontFamily;
  }
  if (cardEl.style?.fontFamily) {
    return cardEl.style.fontFamily;
  }
  if (
    cardEl?.isConnected &&
    typeof window !== "undefined" &&
    window.getComputedStyle
  ) {
    try {
      const computed = window.getComputedStyle(cardEl).fontFamily;
      if (computed) {
        const sanitized = computed
          .replace(/-apple-system|BlinkMacSystemFont/gi, "")
          .replace(/,\s*,/g, ",")
          .replace(/^[\s,]+|[\s,]+$/g, "")
          .trim();
        if (sanitized) {
          return sanitized;
        }
      }
    } catch {
      // Fallback if element is disconnected or inaccessible
    }
  }
  return "Inter, sans-serif";
}

function resolveColumnBaseFontSize(
  settings: LaneColumnWidgetSettings,
  availHeight: number,
  scaleMode: string | undefined,
  isHorizontal: boolean,
  textScaleFactor: number,
): number {
  const isGrid = Boolean(settings.gridId || (settings as any)["gridId"]);
  const defaultBaseSize = isGrid
    ? DEFAULT_GRID_LANE_COLUMN_VALUE_FONT_SIZE
    : DEFAULT_LANE_COLUMN_VALUE_FONT_SIZE;

  if (scaleMode !== "auto") {
    return settings.valueFontSize || defaultBaseSize;
  }

  const factor = textScaleFactor && textScaleFactor > 0 ? textScaleFactor : 1;
  if (isGrid) {
    return Math.max(
      12,
      Math.min(
        DEFAULT_GRID_LANE_COLUMN_VALUE_FONT_SIZE,
        Math.round(availHeight * 0.85 * factor),
      ),
    );
  }

  const maxVal = settings.showHeader === false ? 120 : 84;
  const heightRatio =
    settings.showHeader === false ? 0.75 : isHorizontal ? 0.65 : 0.42;
  return Math.max(
    16,
    Math.min(maxVal, Math.round(availHeight * heightRatio * factor)),
  );
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
  textScaleFactor: number = 1,
  hasTeamName: boolean = false,
  columnKey?: string,
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
    scaleMode,
    hasTeamName,
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

  const baseFontSize = resolveColumnBaseFontSize(
    settings,
    dims.availHeight,
    scaleMode,
    isHorizontal,
    textScaleFactor,
  );

  const isCustomScaling = scaleMode !== undefined && scaleMode !== "auto";

  if (isCustomScaling) {
    cardEl.style.setProperty("--lane-col-value-font-size", `${baseFontSize}px`);
    return;
  }

  const ctx = getSharedCanvasContext();
  if (!ctx) return;

  const computedFamily = resolveCardFontFamily(cardEl, settings);
  const minSize = 10;
  const singleLineSize = computeSingleLineTextScale(
    ctx,
    text,
    baseFontSize,
    dims.availWidth,
    dims.availHeight,
    computedFamily,
    minSize,
  );

  const colKey = columnKey || settings.columnKey;
  const isNameOrTeam = colKey
    ? isNameOrTeamProperty(colKey)
    : !isNumericalOrTimeText(text);
  const allowWrap = scaleMode === "auto" && isNameOrTeam;

  let bestWrapSize = 0;
  const cleanText = text.trim();
  const words = cleanText.split(/\s+/).filter(Boolean);
  if (allowWrap && words.length > 1 && dims.availHeight >= 20) {
    bestWrapSize = computeBestWrapTextFontSize(
      ctx,
      words,
      baseFontSize,
      singleLineSize,
      dims.availWidth,
      dims.availHeight,
      computedFamily,
    );
  }

  const isWrapped = allowWrap && bestWrapSize > singleLineSize;
  const targetSize = isWrapped ? bestWrapSize : singleLineSize;
  applyValueWrapStyles(cardEl, isWrapped, allowWrap);

  cardEl.style.setProperty("--lane-col-value-font-size", `${targetSize}px`);
  safeguardTextOverflow(cardEl, targetSize, minSize);
}

export {
  applyValueWrapStyles,
  computeBestWrapTextFontSize,
  computeSingleLineTextScale,
  isNameOrTeamProperty,
  isNumericalOrTimeText,
};

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
