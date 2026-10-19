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

export function getInsetDefaultAlignment(
  anchor: string,
): "left" | "center" | "right" {
  if (anchor.endsWith("-left") || anchor.startsWith("left")) return "left";
  if (anchor.endsWith("-right") || anchor.startsWith("right")) return "right";
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
  const resolvedAlignment = anchorCfg.valueAlignment || defaultAlignment;

  const customSettings: Record<string, any> = {
    valueAlignment: resolvedAlignment,
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
  const decimals =
    settings.timeDecimalPlaces !== undefined
      ? Number(settings.timeDecimalPlaces)
      : 3;
  const emptyLapPlaceholder =
    decimals > 0 ? "--." + "-".repeat(decimals) : "--";

  if (!targetDriver) {
    if (parent?.getLastLaps) {
      const colDef = parent.columns?.find(
        (c: any) => c.propertyName === "lastLaps",
      );
      const parentLaps = parent.getLastLaps(
        targetDriver,
        colDef,
        "center-center",
      );
      if (
        parentLaps &&
        parentLaps.length > 0 &&
        parentLaps[0]?.lapNumber !== undefined
      ) {
        return parentLaps.map((l: any, idx: number) => ({
          lapNumber: l.lapNumber ?? idx + 1,
          lapTime: l.lapTime ?? emptyLapPlaceholder,
          isBest: Boolean(l.isBest),
          segments: l.segments ?? [],
        }));
      }
    }
    return Array.from({ length: 5 }, () => ({
      lapNumber: 0,
      lapTime: emptyLapPlaceholder,
      isBest: false,
      segments: [],
    }));
  }

  const laps = targetDriver.lapTimes || [];
  const lapsDetails = targetDriver.lapsWithDetails || [];
  const n = laps.length;

  if (n === 0 && parent?.getLastLaps) {
    const colDef = parent.columns?.find(
      (c: any) => c.propertyName === "lastLaps",
    );
    const parentLaps = parent.getLastLaps(
      targetDriver,
      colDef,
      "center-center",
    );
    if (
      parentLaps &&
      parentLaps.length > 0 &&
      parentLaps[0]?.lapNumber !== undefined
    ) {
      return parentLaps.map((l: any, idx: number) => ({
        lapNumber: l.lapNumber ?? idx + 1,
        lapTime: l.lapTime ?? emptyLapPlaceholder,
        isBest: Boolean(l.isBest),
        segments: l.segments ?? [],
      }));
    }
  }
  const bestTime = targetDriver.bestLapTime || 0;

  const result: HeatDataLapItem[] = [];
  for (let i = 1; i <= 5; i++) {
    const index = n - 1 - i;
    if (index >= 0 && laps[index] && laps[index] > 0) {
      const val = laps[index];
      const formattedLapTime = val.toFixed(decimals);
      const isBest = bestTime > 0 && Math.abs(val - bestTime) < 0.0001;

      const segments: string[] = [];
      const detail = lapsDetails[index];
      if (detail?.segments && detail.segments.length > 0) {
        const numToDisplay = Math.min(detail.segments.length, 4);
        for (let s = 0; s < numToDisplay; s++) {
          const seg = detail.segments[s];
          if (seg > 0) {
            segments.push(seg.toFixed(decimals));
          } else {
            segments.push(emptyLapPlaceholder);
          }
        }
      }

      result.push({
        lapNumber: index + 1,
        lapTime: formattedLapTime,
        isBest,
        segments,
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
  cardEl: HTMLElement,
  isVerticalFlow: boolean,
  baseFontSize: number = 54,
  lapCount: number = 5,
  explicitWidth?: number,
  explicitHeight?: number,
): { maxLaps: number; fontSize: number } {
  const containerW =
    explicitWidth && explicitWidth > 0 ? explicitWidth : cardEl.clientWidth;
  const containerH =
    explicitHeight && explicitHeight > 0 ? explicitHeight : cardEl.clientHeight;
  const totalLaps = Math.min(5, Math.max(1, lapCount || 5));

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

export function resolveHeatDriverByPosition(
  drivers: DriverHeatData[],
  parent: any,
  targetIndex: number,
): DriverHeatData | undefined {
  const targetRank = targetIndex + 1;
  if (parent.driverRankings && parent.driverRankings.size > 0) {
    for (const d of drivers) {
      if (parent.driverRankings.get(d.objectId) === targetRank) {
        return d;
      }
    }
  }
  if (parent.heat?.standings && parent.heat.standings.length > 0) {
    const targetId = parent.heat.standings[targetIndex];
    if (targetId) {
      const found = drivers.find((d) => d.objectId === targetId);
      if (found) return found;
    }
  }
  const sortedByRank = [...drivers].sort((a, b) => {
    const rankA = parent.driverRankings?.get(a.objectId) ?? 999;
    const rankB = parent.driverRankings?.get(b.objectId) ?? 999;
    if (rankA !== rankB) return rankA - rankB;

    const lapsA = (a as any).lapCount ?? a.lapTimes?.length ?? 0;
    const lapsB = (b as any).lapCount ?? b.lapTimes?.length ?? 0;
    if (lapsA !== lapsB) return (lapsB as number) - (lapsA as number);

    const timeA = (a as any).totalTime ?? 0;
    const timeB = (b as any).totalTime ?? 0;
    return (timeA as number) - (timeB as number);
  });
  return sortedByRank[targetIndex];
}

export function getDriverOverallRank(d: DriverHeatData, parent: any): number {
  if (!d) return 999;
  if (typeof parent?.getDriverOverallRanking === "function") {
    const r = parent.getDriverOverallRanking(d);
    if (r != null && r > 0) return r;
  }
  const match = (parent?.participants || []).find(
    (p: any) =>
      p.objectId === d.objectId ||
      p.participant?.objectId === d.objectId ||
      p.driver?.entity_id === (d.driver?.entity_id || d.objectId) ||
      p.driver?.name === d.driver?.name,
  );
  if (match?.rank && match.rank > 0) return match.rank;
  return (d as any).overallRank ?? d.participant?.rank ?? 999;
}

export function getParticipantHeatRank(
  p: any,
  drivers: DriverHeatData[],
  parent: any,
): number {
  const d = drivers.find(
    (driver) =>
      driver.objectId === p.objectId ||
      driver.participant?.objectId === p.objectId ||
      driver.driver?.entity_id === (p.driver?.entity_id || p.objectId),
  );
  if (!d) return 999;
  if (parent?.driverRankings?.has(d.objectId)) {
    return parent.driverRankings.get(d.objectId)!;
  }
  if (parent?.heat?.standings) {
    const idx = parent.heat.standings.indexOf(d.objectId);
    if (idx >= 0) return idx + 1;
  }
  return 999;
}

export function getParticipantHeatLane(
  p: any,
  drivers: DriverHeatData[],
): number {
  const d = drivers.find(
    (driver) =>
      driver.objectId === p.objectId ||
      driver.participant?.objectId === p.objectId ||
      driver.driver?.entity_id === (p.driver?.entity_id || p.objectId),
  );
  if (!d) return 999;
  return d.laneIndex ?? 999;
}

export function resolveStandaloneDriver(
  drivers: DriverHeatData[],
  parent: any,
  bindingMode: string,
  targetIndex: number,
  getOrCreateSyntheticDriver: (p: any) => DriverHeatData,
): DriverHeatData | undefined {
  if (bindingMode === "overallPosition") {
    const targetRank = targetIndex + 1;
    const participants: any[] = parent.participants || [];
    const match =
      participants.find((p: any) => p.rank === targetRank) ||
      participants[targetIndex];
    if (!match) return undefined;
    const activeHeatDriver = drivers.find(
      (d) =>
        d.objectId === match.objectId ||
        d.participant?.objectId === match.objectId,
    );
    return activeHeatDriver || getOrCreateSyntheticDriver(match);
  }

  if (bindingMode === "seed") {
    const targetSeed = targetIndex + 1;
    const participants: any[] = parent.participants || [];
    const match =
      participants.find((p: any) => p.seed === targetSeed) ||
      participants[targetIndex];
    if (!match) return undefined;
    const activeHeatDriver = drivers.find(
      (d) =>
        d.objectId === match.objectId ||
        d.participant?.objectId === match.objectId,
    );
    return activeHeatDriver || getOrCreateSyntheticDriver(match);
  }

  if (bindingMode === "position") {
    return resolveHeatDriverByPosition(drivers, parent, targetIndex);
  }

  return (
    drivers.find((d) => d.laneIndex === targetIndex) || drivers[targetIndex]
  );
}

export function resolveHeatGridDriver(
  drivers: DriverHeatData[],
  parent: any,
  bindingMode: string,
  targetIndex: number,
): DriverHeatData | undefined {
  if (bindingMode === "lane") {
    return (
      drivers.find((d) => d.laneIndex === targetIndex) || drivers[targetIndex]
    );
  }

  if (bindingMode === "position") {
    return resolveHeatDriverByPosition(drivers, parent, targetIndex);
  }

  if (bindingMode === "overallPosition") {
    const sorted = [...drivers].sort((a, b) => {
      const rankA = getDriverOverallRank(a, parent);
      const rankB = getDriverOverallRank(b, parent);
      if (rankA !== rankB) return rankA - rankB;
      return (a.laneIndex ?? 0) - (b.laneIndex ?? 0);
    });
    return sorted[targetIndex];
  }

  if (bindingMode === "seed") {
    const sorted = [...drivers].sort((a, b) => {
      const seedA =
        a.participant?.seed ??
        (a.driver as any)?.seed ??
        (a as any).seed ??
        999;
      const seedB =
        b.participant?.seed ??
        (b.driver as any)?.seed ??
        (b as any).seed ??
        999;
      if (seedA !== seedB) return seedA - seedB;
      return (a.laneIndex ?? 0) - (b.laneIndex ?? 0);
    });
    return sorted[targetIndex];
  }

  return drivers[targetIndex];
}

export function resolveOverallGridDriver(
  drivers: DriverHeatData[],
  parent: any,
  bindingMode: string,
  targetIndex: number,
  getOrCreateSyntheticDriver: (p: any) => DriverHeatData,
): DriverHeatData | undefined {
  const participants: any[] = parent.participants || [];
  let match: any;

  if (bindingMode === "overallPosition") {
    const targetRank = targetIndex + 1;
    match =
      participants.find((p: any) => p.rank === targetRank) ||
      participants[targetIndex];
  } else if (bindingMode === "seed") {
    const targetSeed = targetIndex + 1;
    const sorted = [...participants].sort(
      (a, b) => (a.seed ?? 999) - (b.seed ?? 999),
    );
    match =
      participants.find((p: any) => p.seed === targetSeed) ||
      sorted[targetIndex];
  } else if (bindingMode === "position") {
    const sorted = [...participants].sort((a, b) => {
      const rankA = getParticipantHeatRank(a, drivers, parent);
      const rankB = getParticipantHeatRank(b, drivers, parent);
      if (rankA !== rankB) return rankA - rankB;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
    match = sorted[targetIndex];
  } else {
    const sorted = [...participants].sort((a, b) => {
      const laneA = getParticipantHeatLane(a, drivers);
      const laneB = getParticipantHeatLane(b, drivers);
      if (laneA !== laneB) return laneA - laneB;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
    match = sorted[targetIndex];
  }

  if (!match) return undefined;
  const activeHeatDriver = drivers.find(
    (d) =>
      d.objectId === match.objectId ||
      d.participant?.objectId === match.objectId,
  );
  return activeHeatDriver || getOrCreateSyntheticDriver(match);
}

export function resolveTargetDriver(
  settings: LaneColumnWidgetSettings,
  columnKey: string,
  parent: any,
  getOrCreateSyntheticDriver: (p: any) => DriverHeatData,
): DriverHeatData | undefined {
  if (!parent) return undefined;

  const drivers: DriverHeatData[] =
    parent.sortedHeatDrivers ||
    parent.heatDrivers ||
    parent.heat?.heatDrivers ||
    [];

  const isGrid = Boolean(settings.gridId);
  const isOverallGrid =
    isGrid &&
    (settings.gridType === "overall" ||
      (!settings.gridType && RacedayLayoutUtils.isOverallColumnKey(columnKey)));

  const bindingMode = settings.bindingMode || "lane";
  const targetIndex = settings.targetIndex ?? 0;

  if (!isGrid) {
    return resolveStandaloneDriver(
      drivers,
      parent,
      bindingMode,
      targetIndex,
      getOrCreateSyntheticDriver,
    );
  }

  if (isOverallGrid) {
    return resolveOverallGridDriver(
      drivers,
      parent,
      bindingMode,
      targetIndex,
      getOrCreateSyntheticDriver,
    );
  }

  return resolveHeatGridDriver(drivers, parent, bindingMode, targetIndex);
}

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
        }
      }
    } catch (_) {}

    if (!droppedKey) {
      const text = event.dataTransfer.getData("text/plain");
      if (text) {
        if (text.startsWith("lane-col:")) {
          droppedKey = text.substring("lane-col:".length);
        } else {
          droppedKey = text;
        }
      }
    }
  }

  if (!droppedKey && parent?.draggedWidgetType) {
    if (parent.draggedWidgetType.startsWith("lane-col:")) {
      droppedKey = parent.draggedWidgetType.substring("lane-col:".length);
    } else {
      droppedKey = parent.draggedWidgetType;
    }
  }

  return droppedKey;
}
