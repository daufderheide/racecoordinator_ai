import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, LayoutScaleMode, Settings } from "@app/models/settings";

export interface AspectRatioOption {
  label: string;
  ratio: string;
  width: number;
  height: number;
  group: "landscape" | "portrait" | "other";
  separator?: boolean;
}

export function getDefaultAspectRatioOptions(): AspectRatioOption[] {
  const innerW = typeof window !== "undefined" ? window.innerWidth : 1920;
  const innerH = typeof window !== "undefined" ? window.innerHeight : 1080;

  return [
    // Current Display
    {
      label: "UI_EDITOR_ASPECT_CURRENT_DISPLAY",
      ratio: "current",
      width: innerW,
      height: innerH,
      group: "other",
      separator: true,
    },
    // Landscape
    {
      label: "UI_EDITOR_ASPECT_16_9",
      ratio: "16:9",
      width: 1920,
      height: 1080,
      group: "landscape",
    },
    {
      label: "UI_EDITOR_ASPECT_16_10",
      ratio: "16:10",
      width: 1920,
      height: 1200,
      group: "landscape",
    },
    {
      label: "UI_EDITOR_ASPECT_4_3",
      ratio: "4:3",
      width: 1440,
      height: 1080,
      group: "landscape",
    },
    {
      label: "UI_EDITOR_ASPECT_5_4",
      ratio: "5:4",
      width: 1350,
      height: 1080,
      group: "landscape",
    },
    {
      label: "UI_EDITOR_ASPECT_3_2",
      ratio: "3:2",
      width: 1620,
      height: 1080,
      group: "landscape",
    },
    {
      label: "UI_EDITOR_ASPECT_21_9",
      ratio: "21:9",
      width: 2520,
      height: 1080,
      group: "landscape",
    },
    {
      label: "UI_EDITOR_ASPECT_32_9",
      ratio: "32:9",
      width: 3840,
      height: 1080,
      group: "landscape",
    },
    // Portrait
    {
      label: "UI_EDITOR_ASPECT_9_16",
      ratio: "9:16",
      width: 1080,
      height: 1920,
      group: "portrait",
    },
    {
      label: "UI_EDITOR_ASPECT_9_19_5",
      ratio: "9:19.5",
      width: 1080,
      height: 2340,
      group: "portrait",
    },
    {
      label: "UI_EDITOR_ASPECT_10_16",
      ratio: "10:16",
      width: 1080,
      height: 1728,
      group: "portrait",
    },
    {
      label: "UI_EDITOR_ASPECT_3_4",
      ratio: "3:4",
      width: 1080,
      height: 1440,
      group: "portrait",
    },
  ];
}

export function getLayoutAspectRatio(layout?: LayoutConfig): string {
  if (layout?.aspectRatio) {
    return layout.aspectRatio;
  }
  return "current";
}

export function getLayoutAspectRatioOptions(
  baseOptions: AspectRatioOption[],
  layout?: LayoutConfig,
): AspectRatioOption[] {
  const currentRatio = getLayoutAspectRatio(layout);
  const found = baseOptions.find((o) => o.ratio === currentRatio);
  if (!found && layout?.baseWidth && layout?.baseHeight) {
    const customOpt: AspectRatioOption = {
      label: `${layout.baseWidth}:${layout.baseHeight}`,
      ratio: currentRatio,
      width: layout.baseWidth,
      height: layout.baseHeight,
      group: "other",
    };
    return [...baseOptions, customOpt];
  }
  return baseOptions;
}

export function getLayoutScaleMode(layout?: LayoutConfig): LayoutScaleMode {
  return layout?.scaleMode || "stretch";
}

export function applyLayoutAspectRatioChange(
  ratioValue: string,
  options: AspectRatioOption[],
  layout?: LayoutConfig,
  ui?: CustomUI,
  editingSettings?: Settings,
  parsedLayoutsCache?: Map<string, LayoutConfig>,
): void {
  if (!layout) return;
  let targetOption = options.find((o) => o.ratio === ratioValue);
  if (!targetOption) {
    if (ratioValue === "current") {
      const innerW = typeof window !== "undefined" ? window.innerWidth : 1920;
      const innerH = typeof window !== "undefined" ? window.innerHeight : 1080;
      targetOption = {
        label: "UI_EDITOR_ASPECT_CURRENT_DISPLAY",
        ratio: "current",
        width: innerW,
        height: innerH,
        group: "other",
      };
    } else {
      return;
    }
  }

  layout.aspectRatio = targetOption.ratio;
  scaleLayoutDimensions(layout, targetOption.width, targetOption.height);
  persistLayoutState(layout, ui, editingSettings, parsedLayoutsCache);
}

export function applyLayoutScaleModeChange(
  mode: LayoutScaleMode,
  layout?: LayoutConfig,
  ui?: CustomUI,
  editingSettings?: Settings,
  parsedLayoutsCache?: Map<string, LayoutConfig>,
): void {
  if (!layout) return;
  layout.scaleMode = mode;
  persistLayoutState(layout, ui, editingSettings, parsedLayoutsCache);
}

export function scaleLayoutDimensions(
  layout: LayoutConfig,
  newWidth: number,
  newHeight: number,
): void {
  const oldWidth = layout.baseWidth || 1920;
  const oldHeight = layout.baseHeight || 1080;

  const scaleX = newWidth / oldWidth;
  const scaleY = newHeight / oldHeight;

  layout.baseWidth = newWidth;
  layout.baseHeight = newHeight;

  if (layout.widgets) {
    layout.widgets.forEach((widget) => {
      widget.x = Math.round(widget.x * scaleX);
      widget.y = Math.round(widget.y * scaleY);
      widget.width = Math.round(widget.width * scaleX);
      widget.height = Math.round(widget.height * scaleY);
    });
  }
}

export function persistLayoutState(
  layout: LayoutConfig,
  ui?: CustomUI,
  editingSettings?: Settings,
  parsedLayoutsCache?: Map<string, LayoutConfig>,
): void {
  if (ui) {
    ui.layoutJson = JSON.stringify(layout);
    if (parsedLayoutsCache) {
      parsedLayoutsCache.set(ui.entity_id, layout);
    }
    if (ui.entity_id === "default_ui_layout_rc_ai" && editingSettings) {
      editingSettings.racedayLayout = layout;
    } else if (ui.entity_id === "practice_ui_layout_rc_ai" && editingSettings) {
      editingSettings.practiceRacedayLayout = layout;
    }
  }
}

export function calculatePreviewScaleNumber(
  baseWidth: number,
  hasSelectedWidget: boolean,
  windowInnerWidth: number,
  baseHeight: number = 1080,
  windowInnerHeight: number = 900,
): number {
  const inspectorWidth = hasSelectedWidget ? 390 : 0;
  const containerWidth = windowInnerWidth - 110 - inspectorWidth;
  const safeWidth = Math.max(containerWidth, 400);
  const scaleX = safeWidth / (baseWidth || 1920);

  const safeHeight = Math.max(windowInnerHeight - 270, 350);
  const scaleY = safeHeight / (baseHeight || 1080);
  return Math.min(scaleX, scaleY);
}

export function computeScaledLayout(
  sourceLayout: LayoutConfig,
  targetW: number,
  targetH: number,
): LayoutConfig {
  const layout = JSON.parse(JSON.stringify(sourceLayout)) as LayoutConfig;
  const oldWidth = layout.baseWidth || 1920;
  const oldHeight = layout.baseHeight || 1080;

  const scaleX = targetW / oldWidth;
  const scaleY = targetH / oldHeight;

  layout.baseWidth = targetW;
  layout.baseHeight = targetH;

  if (layout.widgets) {
    layout.widgets.forEach((w: any) => {
      w.x = Math.round(w.x * scaleX);
      w.y = Math.round(w.y * scaleY);
      w.width = Math.round(w.width * scaleX);
      w.height = Math.round(w.height * scaleY);
    });
  }

  return layout;
}

export function handleSetLayoutAspectRatio(
  comp: any,
  ratio: string,
  ui?: CustomUI,
): void {
  const targetUi = ui || comp.activeCustomUi;
  applyLayoutAspectRatioChange(
    ratio,
    comp.getLayoutAspectRatioOptions(targetUi),
    comp.getLayout(targetUi),
    targetUi,
    comp.editingSettings,
    comp.parsedLayouts,
  );
  comp.captureState();
  if (!comp.isDestroyed) comp.cdr.markForCheck();
}

export function handleSetLayoutScaleMode(
  comp: any,
  mode: LayoutScaleMode,
  ui?: CustomUI,
): void {
  const targetUi = ui || comp.activeCustomUi;
  applyLayoutScaleModeChange(
    mode,
    comp.getLayout(targetUi),
    targetUi,
    comp.editingSettings,
    comp.parsedLayouts,
  );
  comp.captureState();
  if (!comp.isDestroyed) comp.cdr.markForCheck();
}

export function getLayoutZoomHelper(
  layoutZoomMap: Map<string, number>,
  targetId: string,
): number {
  return layoutZoomMap.get(targetId) ?? 100;
}

export function setLayoutZoomHelper(
  layoutZoomMap: Map<string, number>,
  targetId: string,
  zoom: number,
): void {
  const clamped = Math.min(Math.max(Math.round(zoom), 75), 500);
  layoutZoomMap.set(targetId, clamped);
}

export function getCanvasViewportMaxHeightHelper(): number {
  const windowH = typeof window !== "undefined" ? window.innerHeight : 900;
  return Math.max(windowH - 220, 500);
}

export function getInspectorHeightHelper(
  containerHeight: number,
  viewportMaxHeight: number,
): number {
  return Math.max(Math.min(containerHeight, viewportMaxHeight), 400);
}

export function getComponentPreviewScaleNumber(
  comp: any,
  ui?: CustomUI,
): number {
  const layout = comp.getLayout(ui || comp.activeCustomUi);
  const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
  const winH = typeof window !== "undefined" ? window.innerHeight : 1080;
  const baseScale = calculatePreviewScaleNumber(
    layout?.baseWidth || 1920,
    !!comp.currentSelectedWidget,
    winW,
    layout?.baseHeight || 1080,
    winH,
  );
  return baseScale * (comp.getLayoutZoom(ui) / 100);
}

export function getComponentPreviewContainerWidth(
  comp: any,
  ui?: CustomUI,
): number {
  return (
    (comp.getLayout(ui)?.baseWidth || 1920) * comp.getPreviewScaleNumber(ui)
  );
}

export function getComponentPreviewContainerHeight(
  comp: any,
  ui?: CustomUI,
): number {
  return (
    (comp.getLayout(ui)?.baseHeight || 1080) * comp.getPreviewScaleNumber(ui)
  );
}
