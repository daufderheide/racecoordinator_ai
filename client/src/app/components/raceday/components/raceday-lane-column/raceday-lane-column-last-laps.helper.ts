import { LaneColumnWidgetSettings } from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";

export interface HeatDataLapItem {
  lapNumber: number;
  lapTime: string;
  isBest: boolean;
  segments: string[];
}

export function tryGetParentLastLaps(
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

export function extractLapSegments(
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

function applyBestLapStyles(
  styles: Record<string, string | number | null>,
  settings: Partial<LaneColumnWidgetSettings>,
  mode: string,
  defaultBorderColor: string,
  colWidth: number,
  colStyle: string,
): void {
  if (settings.lastLapsBestLapTextColor) {
    styles["color"] = settings.lastLapsBestLapTextColor;
  }
  if (settings.lastLapsBestLapBackgroundColor) {
    styles["background-color"] = settings.lastLapsBestLapBackgroundColor;
    const bestRadius =
      settings.lastLapsBestLapBorderRadius != null &&
      !isNaN(Number(settings.lastLapsBestLapBorderRadius))
        ? Number(settings.lastLapsBestLapBorderRadius)
        : mode === "box"
          ? 4
          : 0;
    if (bestRadius > 0) {
      styles["border-radius"] = `${bestRadius}px`;
    }
    styles["padding"] = "2px 6px";
  }
  if (settings.lastLapsBestLapShowBorder) {
    const bWidth =
      settings.lastLapsBestLapBorderWidth != null &&
      !isNaN(Number(settings.lastLapsBestLapBorderWidth))
        ? Number(settings.lastLapsBestLapBorderWidth)
        : settings.lastLapsBorderWidth != null &&
            !isNaN(Number(settings.lastLapsBorderWidth))
          ? Number(settings.lastLapsBorderWidth)
          : colWidth;
    const bStyle =
      settings.lastLapsBestLapBorderStyle ||
      settings.lastLapsBorderStyle ||
      colStyle;
    const bColor =
      settings.lastLapsBestLapBorderColor ||
      settings.lastLapsBestLapTextColor ||
      settings.lastLapsBorderColor ||
      defaultBorderColor;
    styles["border"] = `${bWidth}px ${bStyle} ${bColor}`;
    const bestRadius =
      settings.lastLapsBestLapBorderRadius != null &&
      !isNaN(Number(settings.lastLapsBestLapBorderRadius))
        ? Number(settings.lastLapsBestLapBorderRadius)
        : mode === "box"
          ? 4
          : 0;
    if (bestRadius > 0) {
      styles["border-radius"] = `${bestRadius}px`;
    }
    styles["padding"] = "2px 6px";
  }
}

function applyLapBorderStyles(
  styles: Record<string, string | number | null>,
  settings: Partial<LaneColumnWidgetSettings>,
  isBest: boolean,
  isLast: boolean,
  isVerticalLapsFlow: boolean,
  defaultBorderColor: string,
  colWidth: number,
  colStyle: string,
  colRadius: number,
  mode: string,
): void {
  if (!settings.lastLapsShowBorder) return;

  const width =
    settings.lastLapsBorderWidth != null &&
    !isNaN(Number(settings.lastLapsBorderWidth))
      ? Number(settings.lastLapsBorderWidth)
      : colWidth;
  const style = settings.lastLapsBorderStyle || colStyle;
  const color = settings.lastLapsBorderColor || defaultBorderColor;
  const radius =
    settings.lastLapsBorderRadius != null &&
    !isNaN(Number(settings.lastLapsBorderRadius))
      ? Number(settings.lastLapsBorderRadius)
      : colRadius;
  const margin =
    settings.lastLapsBorderMargin != null &&
    !isNaN(Number(settings.lastLapsBorderMargin))
      ? Number(settings.lastLapsBorderMargin)
      : 0;

  if (mode === "box") {
    if (!isBest || !settings.lastLapsBestLapShowBorder) {
      styles["border"] = `${width}px ${style} ${color}`;
      styles["border-radius"] = `${radius}px`;
      styles["padding"] = "2px 6px";
    }
    styles["margin"] = `${margin}px`;
    if (isVerticalLapsFlow) {
      styles["width"] = margin !== 0 ? `calc(100% - ${margin * 2}px)` : "100%";
      styles["align-self"] = "center";
    } else {
      styles["height"] = margin !== 0 ? `calc(100% - ${margin * 2}px)` : "100%";
      styles["align-self"] = "center";
    }
  } else {
    if (!isLast && (!isBest || !settings.lastLapsBestLapShowBorder)) {
      if (isVerticalLapsFlow) {
        styles["border-bottom"] = `${width}px ${style} ${color}`;
      } else {
        styles["border-right"] = `${width}px ${style} ${color}`;
      }
    }
    if (isVerticalLapsFlow) {
      styles["margin-left"] = `${margin}px`;
      styles["margin-right"] = `${margin}px`;
      styles["width"] = margin !== 0 ? `calc(100% - ${margin * 2}px)` : "100%";
      styles["align-self"] = "center";
    } else {
      styles["margin-top"] = `${margin}px`;
      styles["margin-bottom"] = `${margin}px`;
      styles["height"] = margin !== 0 ? `calc(100% - ${margin * 2}px)` : "100%";
      styles["align-self"] = "center";
    }
  }
}

export function computeLastLapItemStyle(
  lap: HeatDataLapItem,
  isLast: boolean,
  settings: Partial<LaneColumnWidgetSettings>,
  isVerticalLapsFlow: boolean,
  effectiveValueTextColor: string,
  columnBorderColor?: string,
): Record<string, string | number | null> {
  const styles: Record<string, string | number | null> = {};
  const isBest = Boolean(
    lap.isBest && settings.lastLapsBestLapHighlight !== false,
  );

  const colWidth =
    settings.borderWidth != null && !isNaN(Number(settings.borderWidth))
      ? Number(settings.borderWidth)
      : 1;
  const colStyle = settings.borderStyle || "solid";
  const colRadius =
    settings.borderRadius != null && !isNaN(Number(settings.borderRadius))
      ? Number(settings.borderRadius)
      : 8;

  const defaultBorderColor =
    settings.borderColor ||
    columnBorderColor ||
    effectiveValueTextColor ||
    "#ffffff";

  if (settings.valueAlignment === "start") {
    styles["justify-content"] = "flex-start";
    styles["padding-left"] = "6px";
  } else if (settings.valueAlignment === "end") {
    styles["justify-content"] = "flex-end";
    styles["padding-right"] = "6px";
  } else {
    styles["justify-content"] = "center";
  }

  const mode = settings.lastLapsBorderMode || "separator";

  if (isBest) {
    applyBestLapStyles(
      styles,
      settings,
      mode,
      defaultBorderColor,
      colWidth,
      colStyle,
    );
  }

  applyLapBorderStyles(
    styles,
    settings,
    isBest,
    isLast,
    isVerticalLapsFlow,
    defaultBorderColor,
    colWidth,
    colStyle,
    colRadius,
    mode,
  );

  return styles;
}

export function computeLastLapTimeStyle(
  lap: HeatDataLapItem,
  settings: Partial<LaneColumnWidgetSettings>,
): Record<string, string | number | null> {
  const styles: Record<string, string | number | null> = {};
  const isBest = Boolean(
    lap.isBest && settings.lastLapsBestLapHighlight !== false,
  );

  if (isBest) {
    if (settings.lastLapsBestLapTextColor) {
      styles["color"] = settings.lastLapsBestLapTextColor;
    }
    const weight = settings.lastLapsBestLapFontWeight || "bold";
    styles["font-weight"] =
      weight === "normal" ? "normal" : weight === "bolder" ? "900" : "700";

    styles["text-decoration"] = settings.lastLapsBestLapUnderline
      ? "underline"
      : "none";

    if (settings.lastLapsBestLapItalic) {
      styles["font-style"] = "italic";
    }
  }

  return styles;
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
