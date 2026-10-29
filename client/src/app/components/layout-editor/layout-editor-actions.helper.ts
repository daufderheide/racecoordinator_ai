import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { LaneGridRepairHelper } from "@app/components/raceday/utils/lane-grid-repair.helper";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { LaneViewMigrationHelper } from "@app/components/raceday/utils/lane-view-migration.helper";
import {
  handleBringGridToFront,
  handleDeleteGrid,
  handleDetachGrid,
  handleEditGridTemplate,
  handleReMirrorGrid,
  handleUpdateGridBounds,
} from "@app/components/ui-editor/ui-editor-grid.helper";
import {
  buildLayoutExport,
  downloadJsonFile,
  exportMigrationDiagnostics,
  preMigrationLayoutCache,
  restorePreMigrationLayout,
  upgradePreservedHeatViewLayout,
} from "@app/components/ui-editor/ui-editor-io.helper";
import {
  applyClearLayout,
  applyImportLayout,
  applyResetLayout,
} from "@app/components/ui-editor/ui-editor-layout-actions.helper";
import {
  applyLayoutAspectRatioChange,
  applyLayoutScaleModeChange,
  AspectRatioOption,
  getDefaultAspectRatioOptions,
  getLayoutAspectRatio as getResolutionLayoutAspectRatio,
  getLayoutAspectRatioOptions as getResolutionLayoutAspectRatioOptions,
  getLayoutScaleMode as getResolutionLayoutScaleMode,
  getLayoutZoomHelper,
  loadLayoutZoomFromStorage,
  saveLayoutZoomToStorage,
  setLayoutZoomHelper,
} from "@app/components/ui-editor/ui-editor-resolution.helper";
import {
  computeWidgetDisplayName,
  handleRemoveSelectedWidget,
  handleReplicateLanes,
  handleWidgetInspectorChange as helperHandleWidgetInspectorChange,
  handleWidgetSelection,
  handleWidgetXChange,
  handleWidgetYChange,
  isWidgetHeightAutoCalculated as helperIsWidgetHeightAutoCalculated,
  isWidgetWidthAutoCalculated as helperIsWidgetWidthAutoCalculated,
} from "@app/components/ui-editor/ui-editor-widget.helper";
import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, LayoutScaleMode, Settings } from "@app/models/settings";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";

export function parseLayoutConfig(
  ui: CustomUI | null | undefined,
): LayoutConfig {
  if (!ui || !ui.layoutJson) {
    return deepCopy(Settings.DEFAULT_LAYOUT);
  }
  try {
    return JSON.parse(ui.layoutJson);
  } catch {
    return deepCopy(Settings.DEFAULT_LAYOUT);
  }
}

export function saveLayoutConfig(ui: CustomUI, layout: LayoutConfig): void {
  ui.layoutJson = JSON.stringify(layout);
}

export function readJsonFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function getLayoutZoom(
  ui: CustomUI,
  zoomMap: Map<string, number>,
): number {
  return getLayoutZoomHelper(zoomMap, ui.entity_id);
}

export function getFitZoom(ui?: CustomUI, comp?: any): number {
  if (!ui) return 100;
  const baseW = getLayoutBaseWidth(ui);
  const baseH = getLayoutBaseHeight(ui);
  const availW = getAvailableWidth(comp);
  const availH = getAvailableHeight();
  const scaleX = availW / baseW;
  const scaleY = availH / baseH;
  const fitZoom = (scaleY / scaleX) * 100;
  return Math.max(10, Math.min(100, Math.round(fitZoom)));
}

export function getMinLayoutZoom(ui?: CustomUI, comp?: any): number {
  if (!ui) return 10;
  const fitZoom = getFitZoom(ui, comp);
  const minStep = Math.floor((fitZoom - 2) / 5) * 5;
  return Math.max(10, Math.min(25, minStep));
}

export function setZoomInput(
  event: Event,
  ui: CustomUI,
  zoomMap: Map<string, number>,
  comp: any,
): void {
  const target = event.target as HTMLInputElement;
  const val = parseInt(target.value, 10);
  const minZoom = getMinLayoutZoom(ui, comp);
  if (!isNaN(val)) {
    const clamped = Math.min(500, Math.max(minZoom, val));
    setLayoutZoomHelper(zoomMap, ui.entity_id, clamped, comp.logger, minZoom);
    comp.cdr?.markForCheck();
  }
}

export function stepZoom(
  delta: number,
  ui: CustomUI,
  zoomMap: Map<string, number>,
  comp: any,
): void {
  const current = getLayoutZoom(ui, zoomMap);
  const minZoom = getMinLayoutZoom(ui, comp);
  const next = Math.min(500, Math.max(minZoom, current + delta));
  setLayoutZoomHelper(zoomMap, ui.entity_id, next, comp.logger, minZoom);
  comp.cdr?.markForCheck();
}

export function resetLayoutZoom(
  ui: CustomUI,
  zoomMap: Map<string, number>,
  comp: any,
): void {
  const current = getLayoutZoom(ui, zoomMap);
  const fit = getFitZoom(ui, comp);
  const minZoom = getMinLayoutZoom(ui, comp);
  const target = current === 100 ? fit : 100;
  setLayoutZoomHelper(zoomMap, ui.entity_id, target, comp.logger, minZoom);
  comp.cdr?.markForCheck();
}

export function getLayoutAspectRatio(ui: CustomUI): string {
  const layout = parseLayoutConfig(ui);
  return getResolutionLayoutAspectRatio(layout);
}

export function setLayoutAspectRatio(
  ratio: string,
  ui: CustomUI,
  comp: any,
): void {
  const layout = parseLayoutConfig(ui);
  applyLayoutAspectRatioChange(
    ratio,
    getLayoutAspectRatioOptions(ui),
    layout,
    ui,
    comp.editingSettings,
  );
  saveLayoutConfig(ui, layout);
  comp.captureState?.();
  comp.cdr?.markForCheck();
}

export function getLayoutAspectRatioOptions(ui: CustomUI): AspectRatioOption[] {
  const layout = parseLayoutConfig(ui);
  return getResolutionLayoutAspectRatioOptions(
    getDefaultAspectRatioOptions(),
    layout,
  );
}

export function getLayoutScaleMode(ui: CustomUI): LayoutScaleMode {
  const layout = parseLayoutConfig(ui);
  return getResolutionLayoutScaleMode(layout);
}

export function setLayoutScaleMode(
  mode: LayoutScaleMode,
  ui: CustomUI,
  comp: any,
): void {
  const layout = parseLayoutConfig(ui);
  applyLayoutScaleModeChange(mode, layout, ui, comp.editingSettings);
  saveLayoutConfig(ui, layout);
  comp.captureState?.();
  comp.cdr?.markForCheck();
}

export function getLayoutBaseWidth(ui: CustomUI): number {
  return parseLayoutConfig(ui)?.baseWidth || 1920;
}

export function getLayoutBaseHeight(ui: CustomUI): number {
  return parseLayoutConfig(ui)?.baseHeight || 1080;
}

export function getAvailableWidth(comp?: any): number {
  const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
  const hasInspector = !!(comp?.currentSelectedWidget && comp?.isEditMode);
  const inspectorWidth = hasInspector ? 370 : 0;
  return Math.max(winW - 48 - inspectorWidth - 28, 400);
}

export function getAvailableHeight(): number {
  const viewportMaxH = getCanvasViewportMaxHeight();
  return Math.max(viewportMaxH - 24, 300);
}

export function getPreviewContainerWidth(
  ui: CustomUI,
  zoomMap: Map<string, number>,
  comp?: any,
): number {
  const baseW = getLayoutBaseWidth(ui);
  const scale = getPreviewScaleNumber(ui, zoomMap, comp);
  return baseW * scale;
}

export function getPreviewContainerHeight(
  ui: CustomUI,
  zoomMap: Map<string, number>,
  comp?: any,
): number {
  const baseH = getLayoutBaseHeight(ui);
  const scale = getPreviewScaleNumber(ui, zoomMap, comp);
  return baseH * scale;
}

export function getPreviewScale(
  ui: CustomUI,
  zoomMap: Map<string, number>,
  comp?: any,
): string {
  const num = getPreviewScaleNumber(ui, zoomMap, comp);
  return `scale(${num})`;
}

export function getPreviewScaleNumber(
  ui: CustomUI,
  zoomMap: Map<string, number>,
  comp?: any,
): number {
  const baseW = getLayoutBaseWidth(ui);
  const availableWidth = getAvailableWidth(comp);
  const baseScale = availableWidth / baseW;
  const zoom = getLayoutZoom(ui, zoomMap);
  return baseScale * (zoom / 100);
}

export function getCanvasViewportMaxHeight(): number {
  const windowH = typeof window !== "undefined" ? window.innerHeight : 900;
  return Math.max(windowH - 140, 500);
}

export function getInspectorHeight(
  _ui?: CustomUI,
  _zoomMap?: Map<string, number>,
  _comp?: any,
): number {
  return getCanvasViewportMaxHeight();
}

export function isCountdownPreviewActive(
  ui: CustomUI,
  map: { [id: string]: boolean },
): boolean {
  return !!map[ui.entity_id];
}

export function toggleCountdownPreview(
  ui: CustomUI,
  map: { [id: string]: boolean },
  comp: any,
): void {
  map[ui.entity_id] = !map[ui.entity_id];
  comp.cdr?.markForCheck();
}

export function getLayoutWidgets(ui: CustomUI): any[] {
  const layout = parseLayoutConfig(ui);
  return layout.widgets || [];
}

export function getSelectedWidgetId(
  ui: CustomUI,
  currentSelectedWidget: any,
): string {
  if (currentSelectedWidget?.id) return currentSelectedWidget.id;
  const widgets = getLayoutWidgets(ui);
  return widgets.length > 0 ? widgets[0].id : "";
}

export function onWidgetDropdownSelect(
  widgetId: string,
  ui: CustomUI,
  comp: any,
): void {
  comp.selectedWidgetId = widgetId || null;
  comp.cdr?.markForCheck();
}

export function onWidgetSelected(widget: any, comp: any): void {
  handleWidgetSelection(comp, widget);
}

export function removeSelectedWidget(ui: CustomUI, comp: any): void {
  handleRemoveSelectedWidget(comp, ui);
  const layout = parseLayoutConfig(ui);
  comp.syncRacedayPreview?.(layout);
}

export function onWidgetXChange(
  newX: number,
  widget: any,
  ui: CustomUI,
  comp: any,
): void {
  handleWidgetXChange(comp, newX, widget, ui);
}

export function onWidgetYChange(
  newY: number,
  widget: any,
  ui: CustomUI,
  comp: any,
): void {
  handleWidgetYChange(comp, newY, widget, ui);
}

export function onWidgetWidthChange(
  newW: number,
  widget: any,
  ui: CustomUI,
  comp: any,
): void {
  const layout = parseLayoutConfig(ui);
  const target = (layout.widgets || []).find((w: any) => w.id === widget.id);
  if (target) {
    const val = Math.max(50, Number(newW) || 50);
    target.width = val;
    if (widget) widget.width = val;
    saveLayoutConfig(ui, layout);
    comp.syncRacedayPreview?.(layout);
    comp.captureState?.();
    comp.cdr?.markForCheck();
  }
}

export function onWidgetHeightChange(
  newH: number,
  widget: any,
  ui: CustomUI,
  comp: any,
): void {
  const layout = parseLayoutConfig(ui);
  const target = (layout.widgets || []).find((w: any) => w.id === widget.id);
  if (target) {
    const val = Math.max(20, Number(newH) || 20);
    target.height = val;
    if (widget) widget.height = val;
    saveLayoutConfig(ui, layout);
    comp.syncRacedayPreview?.(layout);
    comp.captureState?.();
    comp.cdr?.markForCheck();
  }
}

export function onWidgetInspectorChange(
  widget: any,
  ui: CustomUI,
  comp: any,
): void {
  helperHandleWidgetInspectorChange(comp, widget, ui);
}

export function onReplicateLanes(
  options:
    | Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">
    | LaneReplicationOptions,
  ui: CustomUI,
  comp: any,
): void {
  handleReplicateLanes(comp, options, ui);
}

export function isWidgetWidthAutoCalculated(widget: any): boolean {
  return helperIsWidgetWidthAutoCalculated(widget);
}

export function isWidgetHeightAutoCalculated(widget: any): boolean {
  return helperIsWidgetHeightAutoCalculated(widget);
}

export function isCustomWidget(widgetType: string | undefined): boolean {
  return widgetType?.startsWith("custom:") ?? false;
}

export function getWidgetDisplayName(
  widget: any,
  translationService: any,
  availableColumns?: { key: string; label: string }[],
): string {
  return computeWidgetDisplayName(widget, translationService, availableColumns);
}

export function getWidgetTypeLabelKey(widgetType: string): string {
  if (!widgetType) return "";
  return "UE_WIDGET_TYPE_" + widgetType.toUpperCase().replace(/-/g, "_");
}

export function onAnchorSelected(
  event: { widgetId: string; anchor: string | null } | string,
  comp: any,
): void {
  if (typeof event === "string") {
    comp.selectedAnchor = event;
  } else if (event) {
    if (comp.selectedWidgetId !== event.widgetId) {
      comp.onWidgetSelected?.(event.widgetId);
    }
    comp.selectedAnchor = event.anchor;
  }
  comp.cdr?.markForCheck();
}

export function onLayoutChanged(
  updatedLayout: LayoutConfig,
  ui: CustomUI,
  comp: any,
): void {
  saveLayoutConfig(ui, updatedLayout);
  comp.captureState?.();
  comp.cdr?.markForCheck();
}

export function resetLayout(
  ui: CustomUI,
  editingSettings: Settings,
  comp: any,
): void {
  const data = applyResetLayout(ui, editingSettings);
  if (data?.defaultLayout) {
    saveLayoutConfig(ui, data.defaultLayout);
    comp.syncRacedayPreview?.(data.defaultLayout);
  }
  comp.selectedWidgetId = null;
  comp.activeGridSession = null;
  LaneGridAnimationHelper.reset();
  comp.selectedAnchor = null;
  comp.currentSelectedWidget = null;
  comp.captureState?.();
  comp.cdr?.markForCheck();
}

export function clearLayout(
  ui: CustomUI,
  editingSettings: Settings,
  comp: any,
): void {
  const layout = applyClearLayout(ui, editingSettings);
  saveLayoutConfig(ui, layout);
  comp.selectedWidgetId = null;
  comp.activeGridSession = null;
  comp.selectedAnchor = null;
  comp.currentSelectedWidget = null;
  comp.syncRacedayPreview?.(layout);
  comp.captureState?.();
  comp.cdr?.markForCheck();
}

export async function onImportLayout(
  event: Event,
  ui: CustomUI,
  editingSettings: Settings,
  comp: any,
): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  try {
    const rawJson = await readJsonFile(file);
    const success = applyImportLayout(rawJson, ui, editingSettings);
    if (success) {
      comp.selectedWidgetId = null;
      comp.currentSelectedWidget = null;
      const parsed = parseLayoutConfig(ui);
      comp.syncRacedayPreview?.(parsed);
      comp.captureState?.();
      comp.cdr?.markForCheck();
    }
  } catch (err) {
    comp.logger?.error("Failed to import layout", err);
  } finally {
    input.value = "";
  }
}

export function exportLayout(ui: CustomUI): void {
  const exportData = buildLayoutExport(ui);
  const fileName = `${(ui.name || "layout").replace(/[^a-z0-9_-]/gi, "_")}_layout.json`;
  downloadJsonFile(exportData, fileName);
}

export function hasStackedColumns(
  ui: CustomUI,
  availableColumns: any[],
): boolean {
  if (!ui) return false;
  const layout = parseLayoutConfig(ui);
  return LaneGridRepairHelper.detectStackedColumns(layout, availableColumns)
    .hasIssues;
}

export function getStackedColumnsBannerDesc(
  ui: CustomUI,
  translationService: TranslationService,
  availableColumns: any[],
): string {
  const layout = parseLayoutConfig(ui);
  const result = LaneGridRepairHelper.detectStackedColumns(
    layout,
    availableColumns,
  );
  if (result.totalDuplicatesCount === 1) {
    return (
      translationService?.translate("UE_STACKED_COLUMNS_BANNER_DESC_ONE") ||
      "This layout contains 1 duplicate or overlapping column."
    );
  }
  return (
    translationService?.translate("UE_STACKED_COLUMNS_BANNER_DESC") ||
    "This layout contains duplicate or overlapping columns."
  );
}

export function quickFixStackedColumns(ui: CustomUI, comp: any): void {
  const layout = parseLayoutConfig(ui);
  const repaired = LaneGridRepairHelper.repairStackedColumns(
    layout,
    comp.availableColumns,
  );
  saveLayoutConfig(ui, repaired.layout);
  comp.captureState?.();
  comp.cdr?.markForCheck();
}

export function isMigratedLayout(ui: CustomUI): boolean {
  if (!ui?.entity_id) return false;
  return preMigrationLayoutCache.has(ui.entity_id);
}

export function canUpgradeLegacyHeatView(ui: CustomUI): boolean {
  if (!ui?.entity_id) return false;
  const layout = parseLayoutConfig(ui);
  return LaneViewMigrationHelper.canUpgradeLegacyHeatView(layout, ui?.name);
}

export {
  exportMigrationDiagnostics,
  handleBringGridToFront,
  handleBringGridToFront as handleGridBringToFront,
  handleDeleteGrid,
  handleDeleteGrid as handleGridDelete,
  handleDetachGrid,
  handleDetachGrid as handleGridDetach,
  handleEditGridTemplate,
  handleEditGridTemplate as handleGridTemplateEdit,
  handleReMirrorGrid,
  handleReMirrorGrid as handleGridReMirror,
  handleUpdateGridBounds,
  handleUpdateGridBounds as updateGridSessionBounds,
  loadLayoutZoomFromStorage,
  restorePreMigrationLayout,
  saveLayoutZoomToStorage,
  upgradePreservedHeatViewLayout,
};
