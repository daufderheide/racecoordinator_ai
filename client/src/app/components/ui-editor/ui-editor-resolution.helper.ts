import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

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
): void {
  if (ui) {
    ui.layoutJson = JSON.stringify(layout);
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
): number {
  const inspectorWidth = hasSelectedWidget ? 370 : 0;
  const containerWidth = windowInnerWidth - 60 - inspectorWidth;
  const safeWidth = Math.max(containerWidth, 800);
  return safeWidth / (baseWidth || 1920);
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
