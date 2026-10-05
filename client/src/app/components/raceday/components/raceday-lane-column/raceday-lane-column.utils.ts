import { LaneColumnWidgetSettings } from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";

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
  hasLeftInsets: boolean,
  hasRightInsets: boolean,
  hasInset: (anchor: string) => boolean,
  effectiveInsetFont: number,
): { availWidth: number; availHeight: number } {
  let leftPad = 0;
  if (hasLeftInsets && !hasInset("center-left")) {
    const tlEl = cardEl.querySelector(".inset-cell.tl") as HTMLElement | null;
    const blEl = cardEl.querySelector(".inset-cell.bl") as HTMLElement | null;
    const lW =
      Math.max(tlEl?.offsetWidth || 0, blEl?.offsetWidth || 0) ||
      Math.round(effectiveInsetFont * 2.5);
    leftPad = lW + 6;
    availWidth = Math.max(10, availWidth - leftPad);
  }

  let rightPad = 0;
  if (hasRightInsets && !hasInset("center-right")) {
    const trEl = cardEl.querySelector(".inset-cell.tr") as HTMLElement | null;
    const brEl = cardEl.querySelector(".inset-cell.br") as HTMLElement | null;
    const rW =
      Math.max(trEl?.offsetWidth || 0, brEl?.offsetWidth || 0) ||
      Math.round(effectiveInsetFont * 2.5);
    rightPad = rW + 6;
    availWidth = Math.max(10, availWidth - rightPad);
  }

  let topPad = 0;
  if (hasInset("top-center")) {
    const tcEl = cardEl.querySelector(".inset-cell.tc") as HTMLElement | null;
    const tcH = tcEl?.offsetHeight || Math.round(effectiveInsetFont * 1.2);
    topPad = tcH + 2;
    availHeight = Math.max(10, availHeight - topPad);
  }

  let bottomPad = 0;
  if (hasInset("bottom-center")) {
    const bcEl = cardEl.querySelector(".inset-cell.bc") as HTMLElement | null;
    const bcH = bcEl?.offsetHeight || Math.round(effectiveInsetFont * 1.2);
    bottomPad = bcH + 2;
    availHeight = Math.max(10, availHeight - bottomPad);
  }

  cardEl.style.setProperty("--lane-col-pad-left", `${leftPad}px`);
  cardEl.style.setProperty("--lane-col-pad-right", `${rightPad}px`);
  cardEl.style.setProperty("--lane-col-pad-top", `${topPad}px`);
  cardEl.style.setProperty("--lane-col-pad-bottom", `${bottomPad}px`);

  if (hasInset("center-left")) {
    const clEl = cardEl.querySelector(".inset-cell.cl") as HTMLElement | null;
    const clW = clEl ? clEl.offsetWidth : 30;
    availWidth = Math.max(10, availWidth - clW - 6);
  }

  if (hasInset("center-right")) {
    const crEl = cardEl.querySelector(".inset-cell.cr") as HTMLElement | null;
    const crW = crEl ? crEl.offsetWidth : 30;
    availWidth = Math.max(10, availWidth - crW - 6);
  }

  return { availWidth, availHeight };
}
