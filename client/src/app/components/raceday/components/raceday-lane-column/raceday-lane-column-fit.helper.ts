import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";

import {
  applyLaneColumnLastLapsFit,
  fitLaneColumnHeaderText,
} from "./raceday-lane-column-interaction.helper";

export interface LaneColumnFitContext {
  isHeaderWidget: boolean;
  isLastLaps: boolean;
  isImageProperty: boolean;
  isPacingProperty: boolean;
  formattedValue: string;
  cachedWidth: number;
  cachedHeight: number;
  settings: LaneColumnWidgetSettings;
  widget: AbsoluteWidgetNode | null;
  headerLabel: string;
  lastLapsLength: number;
  isVerticalLapsFlow: boolean;
  hasTeamName?: boolean;
  setMaxVisibleLaps: (count: number | undefined) => void;
  onFitTextValue: (cardEl: HTMLElement) => void;
  onFitPacingValue?: (cardEl: HTMLElement) => void;
}

export class LaneColumnFitHelper {
  private lastInsetsRef: any = null;
  private lastInsetsKey = "";
  private lastFittedText = "";
  private lastFittedWidth = 0;
  private lastFittedHeight = 0;
  private lastFittedInsets = "";
  private lastFittedValueFontSize?: number;
  private lastFittedMinFontSize?: number;
  private lastFittedMaxFontSize?: number;
  private lastFittedValueFontFamily?: string;
  private lastFittedScaleMode?: string;
  private lastFittedHasTeamName?: boolean;
  private lastFittedHeaderFontSize?: number;
  private lastFittedHeaderFontFamily?: string;
  private lastFittedHeaderLabel = "";
  private lastFittedHeaderWidth = 0;
  private lastFittedHeaderHeight = 0;

  public fitContent(
    cardEl: HTMLElement | undefined,
    force: boolean,
    ctx: LaneColumnFitContext,
  ): void {
    if (!cardEl) return;

    const explicitW = ctx.cachedWidth || cardEl.clientWidth;
    const explicitH = ctx.cachedHeight || cardEl.clientHeight;

    const isHeaderOnly = this.fitHeader(
      cardEl,
      force,
      ctx,
      explicitW,
      explicitH,
    );
    if (isHeaderOnly) return;

    if (ctx.isLastLaps) {
      applyLaneColumnLastLapsFit(
        cardEl,
        ctx.settings,
        ctx.widget,
        ctx.lastLapsLength,
        ctx.isVerticalLapsFlow,
        ctx.setMaxVisibleLaps,
      );
    } else if (ctx.isPacingProperty) {
      ctx.onFitPacingValue?.(cardEl);
    } else if (!ctx.isImageProperty) {
      this.fitDataValue(cardEl, force, ctx);
    }
  }

  private fitHeader(
    cardEl: HTMLElement,
    force: boolean,
    ctx: LaneColumnFitContext,
    explicitW: number,
    explicitH: number,
  ): boolean {
    const isHeaderOnly = Boolean(ctx.isHeaderWidget);
    if (!isHeaderOnly && ctx.settings.showHeader === false) {
      return false;
    }

    const headerFont = ctx.settings.headerFontSize;
    const headerFamily = ctx.settings.headerFontFamily || "";
    const headerLabel = ctx.headerLabel || "";
    const unchanged =
      !force &&
      explicitW > 0 &&
      explicitH > 0 &&
      explicitW === this.lastFittedHeaderWidth &&
      explicitH === this.lastFittedHeaderHeight &&
      headerFont === this.lastFittedHeaderFontSize &&
      headerFamily === this.lastFittedHeaderFontFamily &&
      headerLabel === this.lastFittedHeaderLabel;

    if (unchanged) {
      return isHeaderOnly;
    }

    this.lastFittedHeaderWidth = explicitW;
    this.lastFittedHeaderHeight = explicitH;
    this.lastFittedHeaderFontSize = headerFont;
    this.lastFittedHeaderFontFamily = headerFamily;
    this.lastFittedHeaderLabel = headerLabel;

    fitLaneColumnHeaderText(
      cardEl,
      ctx.settings,
      ctx.widget,
      ctx.headerLabel,
      explicitW,
      explicitH,
    );
    return isHeaderOnly;
  }

  private fitDataValue(
    cardEl: HTMLElement,
    force: boolean,
    ctx: LaneColumnFitContext,
  ): void {
    const text = ctx.formattedValue?.trim() || "";
    const w = ctx.cachedWidth || cardEl.clientWidth;
    const h = ctx.cachedHeight || cardEl.clientHeight;
    let insetsKey = this.lastInsetsKey;
    if (ctx.settings.insets !== this.lastInsetsRef) {
      this.lastInsetsRef = ctx.settings.insets;
      insetsKey = JSON.stringify(ctx.settings.insets || {});
      this.lastInsetsKey = insetsKey;
    }
    const valSize = ctx.settings.valueFontSize ?? 0;
    const minValSize = ctx.settings.minFontSize;
    const maxValSize = ctx.settings.maxFontSize;
    const valFamily = ctx.settings.valueFontFamily || "";
    const scaleMode = ctx.widget?.scaleMode || "";
    const hasTeamName = Boolean(ctx.hasTeamName);
    if (
      !force &&
      w > 0 &&
      h > 0 &&
      text === this.lastFittedText &&
      w === this.lastFittedWidth &&
      h === this.lastFittedHeight &&
      insetsKey === this.lastFittedInsets &&
      valSize === this.lastFittedValueFontSize &&
      minValSize === this.lastFittedMinFontSize &&
      maxValSize === this.lastFittedMaxFontSize &&
      valFamily === this.lastFittedValueFontFamily &&
      scaleMode === this.lastFittedScaleMode &&
      hasTeamName === this.lastFittedHasTeamName
    ) {
      return;
    }
    this.lastFittedText = text;
    this.lastFittedWidth = w;
    this.lastFittedHeight = h;
    this.lastFittedInsets = insetsKey;
    this.lastFittedValueFontSize = valSize;
    this.lastFittedMinFontSize = minValSize;
    this.lastFittedMaxFontSize = maxValSize;
    this.lastFittedValueFontFamily = valFamily;
    this.lastFittedScaleMode = scaleMode;
    this.lastFittedHasTeamName = hasTeamName;

    ctx.onFitTextValue(cardEl);
  }
}
