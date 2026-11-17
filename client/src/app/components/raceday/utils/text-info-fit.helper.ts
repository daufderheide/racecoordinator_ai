import { AbsoluteWidgetNode } from "@app/models/settings";

export interface TextInfoFitOptions {
  labelEls?: HTMLElement[] | NodeListOf<HTMLElement>;
  valueEls?: HTMLElement[] | NodeListOf<HTMLElement>;
  labelRatio?: number;
}

export class TextInfoFitHelper {
  public static readonly DEFAULT_LABEL_RATIO = 55 / 80;

  /**
   * Fits or applies font size styling for text-info widgets (heat-info, race-name,
   * track-name, event-name, season-name).
   *
   * If custom labelFontSize or valueFontSize are configured, sets CSS variables
   * --header-label-font-size and --header-value-font-size directly, computing
   * the counterpart proportionally if only one is configured.
   *
   * Otherwise, if scaleMode is auto, calculates optimal sizes using Canvas measurement
   * to fit available panel dimensions.
   */
  public static fitText(
    panelEl: HTMLElement | null | undefined,
    widgetData: AbsoluteWidgetNode | null | undefined,
    options?: TextInfoFitOptions,
  ): void {
    if (!panelEl) return;

    const customLabelFontSize = Number(
      widgetData?.customSettings?.["labelFontSize"],
    );
    const customValueFontSize = Number(
      widgetData?.customSettings?.["valueFontSize"],
    );
    const labelRatio = options?.labelRatio ?? this.DEFAULT_LABEL_RATIO;

    if (
      (customLabelFontSize && customLabelFontSize > 0) ||
      (customValueFontSize && customValueFontSize > 0)
    ) {
      const targetLabelSize =
        customLabelFontSize && customLabelFontSize > 0
          ? customLabelFontSize
          : customValueFontSize && customValueFontSize > 0
            ? Math.floor(customValueFontSize * labelRatio)
            : 13;
      const targetValueSize =
        customValueFontSize && customValueFontSize > 0
          ? customValueFontSize
          : customLabelFontSize && customLabelFontSize > 0
            ? Math.floor(customLabelFontSize / labelRatio)
            : 18;

      panelEl.style.setProperty(
        "--header-label-font-size",
        `${targetLabelSize}px`,
      );
      panelEl.style.setProperty(
        "--header-value-font-size",
        `${targetValueSize}px`,
      );
      return;
    }

    const isAuto = !widgetData || widgetData.scaleMode === "auto";
    if (!isAuto) {
      panelEl.style.removeProperty("--header-value-font-size");
      panelEl.style.removeProperty("--header-label-font-size");
      return;
    }

    const labelEls =
      options?.labelEls ?? panelEl.querySelectorAll<HTMLElement>(".label-text");
    const valueEls =
      options?.valueEls ?? panelEl.querySelectorAll<HTMLElement>(".value-text");

    if (labelEls.length === 0 && valueEls.length === 0) return;

    const labelStyle =
      labelEls.length > 0 ? window.getComputedStyle(labelEls[0]) : null;
    const valueStyle =
      valueEls.length > 0 ? window.getComputedStyle(valueEls[0]) : null;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let totalTextWidth = 100;

    if (context) {
      let labelWidth = 0;
      if (labelStyle) {
        context.font = `${labelStyle.fontWeight || "600"} ${100 * labelRatio}px ${labelStyle.fontFamily || "sans-serif"}`;
        labelEls.forEach((el) => {
          const str = el.textContent?.trim() || "";
          labelWidth += context.measureText(str.toUpperCase()).width || 0;
        });
      }

      let valueWidth = 0;
      if (valueStyle) {
        context.font = `${valueStyle.fontWeight || "700"} 100px ${valueStyle.fontFamily || "sans-serif"}`;
        valueEls.forEach((el) => {
          const str = el.textContent?.trim() || "";
          valueWidth += context.measureText(str).width || 0;
        });
      }

      const marginWidth = (8 / 18) * 100;
      const marginCount = labelEls.length + valueEls.length - 1;
      totalTextWidth =
        labelWidth + valueWidth + Math.max(0, marginCount) * marginWidth;
    }

    const textHeight = 100;
    const containerWidth = panelEl.clientWidth * 0.9;
    const containerHeight = panelEl.clientHeight * 0.8;

    const scaleX = containerWidth / totalTextWidth;
    const scaleY = containerHeight / textHeight;
    const scale = Math.min(scaleX, scaleY);

    const baseScaleFactor = widgetData?.textScaleFactor ?? 1;
    const targetValueSize = Math.floor(100 * scale * baseScaleFactor);
    const targetLabelSize = Math.floor(targetValueSize * labelRatio);

    panelEl.style.setProperty(
      "--header-value-font-size",
      `${targetValueSize}px`,
    );
    panelEl.style.setProperty(
      "--header-label-font-size",
      `${targetLabelSize}px`,
    );
  }
}
