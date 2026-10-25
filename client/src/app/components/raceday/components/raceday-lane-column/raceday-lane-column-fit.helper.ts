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
  setMaxVisibleLaps: (count: number | undefined) => void;
  onFitTextValue: (cardEl: HTMLElement) => void;
}

export class LaneColumnFitHelper {
  private lastInsetsRef: any = null;
  private lastInsetsKey = "";
  private lastFittedText = "";
  private lastFittedWidth = 0;
  private lastFittedHeight = 0;
  private lastFittedInsets = "";
  private lastFittedValueFontSize?: number;
  private lastFittedValueFontFamily?: string;
  private lastFittedScaleMode?: string;

  public fitContent(
    cardEl: HTMLElement | undefined,
    force: boolean,
    ctx: LaneColumnFitContext,
  ): void {
    if (!cardEl) return;

    if (ctx.isHeaderWidget) {
      const explicitW = ctx.cachedWidth || cardEl.clientWidth;
      const explicitH = ctx.cachedHeight || cardEl.clientHeight;
      fitLaneColumnHeaderText(
        cardEl,
        ctx.settings,
        ctx.widget,
        ctx.headerLabel,
        explicitW,
        explicitH,
      );
      return;
    }

    if (ctx.isLastLaps) {
      applyLaneColumnLastLapsFit(
        cardEl,
        ctx.settings,
        ctx.widget,
        ctx.lastLapsLength,
        ctx.isVerticalLapsFlow,
        ctx.setMaxVisibleLaps,
      );
    } else if (!ctx.isImageProperty && !ctx.isPacingProperty) {
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
      const valFamily = ctx.settings.valueFontFamily || "";
      const scaleMode = ctx.widget?.scaleMode || "";
      if (
        !force &&
        w > 0 &&
        h > 0 &&
        text === this.lastFittedText &&
        w === this.lastFittedWidth &&
        h === this.lastFittedHeight &&
        insetsKey === this.lastFittedInsets &&
        valSize === this.lastFittedValueFontSize &&
        valFamily === this.lastFittedValueFontFamily &&
        scaleMode === this.lastFittedScaleMode
      ) {
        return;
      }
      this.lastFittedText = text;
      this.lastFittedWidth = w;
      this.lastFittedHeight = h;
      this.lastFittedInsets = insetsKey;
      this.lastFittedValueFontSize = valSize;
      this.lastFittedValueFontFamily = valFamily;
      this.lastFittedScaleMode = scaleMode;

      ctx.onFitTextValue(cardEl);
    }
  }
}
