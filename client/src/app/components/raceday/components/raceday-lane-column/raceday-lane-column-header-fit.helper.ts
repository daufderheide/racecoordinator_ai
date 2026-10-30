import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";

import {
  getSharedCanvasContext,
  resolveEffectiveHeaderFontSize,
} from "./raceday-lane-column.utils";
import { computeBestWrapTextFontSize } from "./raceday-lane-column-text-wrap.helper";

interface HeaderBoundsAndFont {
  baseFontSize: number;
  family: string;
  availWidth: number;
  availHeight: number;
  textWidth: number;
}

function resolveHeaderBoundsAndFont(
  cardEl: HTMLElement,
  headerEl: HTMLElement,
  settings: LaneColumnWidgetSettings,
  widget: AbsoluteWidgetNode | null,
  headerLabel: string,
  explicitWidth?: number,
  explicitHeight?: number,
): HeaderBoundsAndFont | null {
  const cardW =
    explicitWidth && explicitWidth > 0 ? explicitWidth : cardEl.clientWidth;
  const cardH =
    explicitHeight && explicitHeight > 0 ? explicitHeight : cardEl.clientHeight;

  const baseFontSize =
    widget?.scaleMode === "auto"
      ? resolveEffectiveHeaderFontSize(settings, widget, cardEl, explicitHeight)
      : Number(
          settings.headerFontSize || (widget?.fontSize ? widget.fontSize : 24),
        );
  const isHeaderWidget = Boolean(
    settings.isHeaderWidget ||
    (widget?.customSettings as any)?.["isHeaderWidget"] ||
    cardEl.classList.contains("header-widget-card"),
  );
  const padX = isHeaderWidget ? 12 : 20;
  const availWidth = Math.max(10, cardW - padX);
  const padY = isHeaderWidget ? 4 : 8;
  const availHeight = Math.max(10, cardH - padY);

  const ctx = getSharedCanvasContext();
  if (!ctx) return null;

  const rawFamily =
    settings.headerFontFamily ||
    (!explicitWidth && typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(headerEl).fontFamily
      : "") ||
    "sans-serif";
  const family =
    rawFamily
      .replace(/-apple-system|BlinkMacSystemFont/gi, "")
      .replace(/,\s*,/g, ",")
      .replace(/^[\s,]+|[\s,]+$/g, "")
      .trim() || "sans-serif";
  ctx.font = `700 ${baseFontSize}px ${family}`;
  const textWidth = ctx.measureText(headerLabel || "").width || 1;

  return {
    baseFontSize,
    family,
    availWidth,
    availHeight,
    textWidth,
  };
}

export function fitLaneColumnHeaderText(
  cardEl: HTMLElement,
  settings: LaneColumnWidgetSettings,
  widget: AbsoluteWidgetNode | null,
  headerLabel: string,
  explicitWidth?: number,
  explicitHeight?: number,
): void {
  const headerEl = cardEl.querySelector(
    ".lane-col-header",
  ) as HTMLElement | null;
  if (!headerEl) return;

  const fontInfo = resolveHeaderBoundsAndFont(
    cardEl,
    headerEl,
    settings,
    widget,
    headerLabel,
    explicitWidth,
    explicitHeight,
  );
  if (!fontInfo) return;

  const { baseFontSize, family, availWidth, availHeight, textWidth } = fontInfo;

  if (widget?.scaleMode !== undefined && widget?.scaleMode !== "auto") {
    headerEl.style.fontSize = `${baseFontSize}px`;
    cardEl.style.setProperty(
      "--lane-col-header-font-size",
      `${baseFontSize}px`,
    );
    return;
  }

  let singleLineScale = 1.0;
  if (textWidth > availWidth) {
    singleLineScale = Math.min(singleLineScale, availWidth / textWidth);
  }
  if (baseFontSize > availHeight) {
    singleLineScale = Math.min(singleLineScale, availHeight / baseFontSize);
  }
  const singleLineSize = Math.max(
    7,
    Math.floor(baseFontSize * singleLineScale),
  );

  const ctx = getSharedCanvasContext();
  let bestWrapSize = 0;
  const cleanLabel = (headerLabel || "").trim();
  const words = cleanLabel.split(/\s+/).filter(Boolean);
  if (ctx && words.length > 1 && availHeight >= 20) {
    bestWrapSize = computeBestWrapTextFontSize(
      ctx,
      words,
      baseFontSize,
      singleLineSize,
      availWidth,
      availHeight,
      family,
    );
  }

  let fittedSize = singleLineSize;
  if (bestWrapSize > singleLineSize) {
    fittedSize = bestWrapSize;
    headerEl.style.whiteSpace = "normal";
    headerEl.style.wordBreak = "break-word";
    headerEl.style.overflowWrap = "break-word";
    headerEl.style.lineHeight = "1.15";
  } else {
    headerEl.style.whiteSpace = "nowrap";
  }

  headerEl.style.fontSize = `${fittedSize}px`;
  cardEl.style.setProperty("--lane-col-header-font-size", `${fittedSize}px`);

  if (headerEl.scrollWidth > headerEl.clientWidth && fittedSize > 7) {
    const ratio = headerEl.clientWidth / headerEl.scrollWidth;
    const safeSize = Math.max(7, Math.floor(fittedSize * ratio));
    if (safeSize < fittedSize) {
      headerEl.style.fontSize = `${safeSize}px`;
      cardEl.style.setProperty("--lane-col-header-font-size", `${safeSize}px`);
    }
  }
}
