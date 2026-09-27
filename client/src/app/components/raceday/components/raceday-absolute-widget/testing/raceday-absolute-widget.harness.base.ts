export abstract class RacedayAbsoluteWidgetHarnessBase {
  static readonly hostSelector = "app-raceday-absolute-widget";

  static readonly selectors = {
    widgetWrapper: ".widget-wrapper",
    dragHeader: ".widget-header-drag",
    label: ".widget-label",
    removeBtn: ".widget-remove-btn",
    resizeHandleN: ".resize-handle.n",
    resizeHandleE: ".resize-handle.e",
    resizeHandleS: ".resize-handle.s",
    resizeHandleW: ".resize-handle.w",
    resizeHandleNe: ".resize-handle.ne",
    resizeHandleNw: ".resize-handle.nw",
    resizeHandleSe: ".resize-handle.se",
    resizeHandleSw: ".resize-handle.sw",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getWidgetTypeLabel(): Promise<string>;
  abstract clickRemove(): Promise<void>;
  abstract isCustomizing(): Promise<boolean>;
}
