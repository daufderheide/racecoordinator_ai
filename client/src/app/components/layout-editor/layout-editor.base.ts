import { ChangeDetectorRef } from "@angular/core";
import { StackedColumnIssue } from "@app/components/raceday/utils/lane-grid-repair.helper";
import { LaneGridSession } from "@app/components/raceday/utils/lane-grid-replication.helper";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { exportMigrationDiagnostics as exportDiagnosticsHelper } from "@app/components/ui-editor/ui-editor-io.helper";
import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, LayoutScaleMode } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";

import {
  clearLayout,
  exportLayout,
  getCanvasViewportMaxHeight,
  getFitZoom,
  getInspectorHeight,
  getLayoutAspectRatio,
  getLayoutAspectRatioOptions,
  getLayoutBaseHeight,
  getLayoutBaseWidth,
  getLayoutScaleMode,
  getLayoutWidgets,
  getLayoutZoom,
  getMinLayoutZoom,
  getPreviewContainerHeight,
  getPreviewContainerWidth,
  getPreviewScale,
  getPreviewScaleNumber,
  getStackedColumnsBannerDesc,
  getWidgetDisplayName,
  getWidgetTypeLabelKey,
  handleGridBringToFront,
  handleGridDelete,
  handleGridDetach,
  handleGridReMirror,
  handleGridTemplateEdit,
  handleOpenReviewStackedColumnsModal,
  handleRestorePreMigrationBackup,
  hasStackedColumns,
  isCountdownPreviewActive,
  isCustomWidget,
  isMigratedLayout,
  isWidgetHeightAutoCalculated,
  isWidgetWidthAutoCalculated,
  onAnchorSelected,
  onImportLayout,
  onLayoutChanged,
  onReplicateLanes,
  onWidgetDropdownSelect,
  onWidgetHeightChange,
  onWidgetInspectorChange,
  onWidgetSelected,
  onWidgetWidthChange,
  onWidgetXChange,
  onWidgetYChange,
  parseLayoutConfig,
  quickFixStackedColumns,
  removeSelectedWidget,
  resetLayout,
  resetLayoutZoom,
  saveLayoutZoomToStorage,
  setLayoutAspectRatio,
  setLayoutScaleMode,
  setZoomInput,
  stepZoom,
  toggleCountdownPreview,
  updateGridSessionBounds,
} from "./layout-editor-actions.helper";

export abstract class LayoutEditorBase {
  abstract editingLayout: CustomUI | null;
  abstract editingSettings: any;
  abstract isEditMode: boolean;
  abstract selectedWidgetId: string | null;
  abstract currentSelectedWidget: any | null;
  abstract selectedAnchor: string | null;
  abstract activeGridSession: LaneGridSession | null;
  abstract layoutZoom: Map<string, number>;
  abstract countdownPreviewState: { [id: string]: boolean };
  abstract availableColumns: any[];
  abstract logger: LoggerService;
  abstract cdr: ChangeDetectorRef;
  abstract translationService: TranslationService;

  showResetConfirm = false;
  showClearConfirm = false;
  showReplicateModal = false;
  showReviewStackedColumnsModal = false;
  stackedColumnsToReview: any = null;
  detectedStackedIssues: StackedColumnIssue[] = [];

  replicateBindingMode: "lane" | "position" | "overallPosition" | "seed" =
    "lane";
  replicateSourceIndex = 0;
  replicateDefaultCount = 4;

  abstract captureState(): void;
  abstract syncRacedayPreview(layout: LayoutConfig): void;

  // --- Zoom Actions ---
  getLayoutZoom(): number {
    return this.editingLayout
      ? getLayoutZoom(this.editingLayout, this.layoutZoom)
      : 100;
  }

  getMinLayoutZoom(): number {
    return this.editingLayout ? getMinLayoutZoom(this.editingLayout, this) : 10;
  }

  getFitZoom(): number {
    return this.editingLayout ? getFitZoom(this.editingLayout, this) : 100;
  }

  stepZoom(delta: number): void {
    if (this.editingLayout) {
      stepZoom(delta, this.editingLayout, this.layoutZoom, this);
      saveLayoutZoomToStorage(this.layoutZoom, this.logger);
    }
  }

  onZoomInput(event: Event): void {
    if (this.editingLayout) {
      setZoomInput(event, this.editingLayout, this.layoutZoom, this);
      saveLayoutZoomToStorage(this.layoutZoom, this.logger);
    }
  }

  resetLayoutZoom(): void {
    if (this.editingLayout) {
      resetLayoutZoom(this.editingLayout, this.layoutZoom, this);
      saveLayoutZoomToStorage(this.layoutZoom, this.logger);
    }
  }

  // --- Aspect Ratio & Scale Mode ---
  getLayoutAspectRatio(): string {
    return this.editingLayout
      ? getLayoutAspectRatio(this.editingLayout)
      : "16:9";
  }

  setLayoutAspectRatio(ratio: string): void {
    if (this.editingLayout) {
      setLayoutAspectRatio(ratio, this.editingLayout, this);
    }
  }

  getLayoutAspectRatioOptions(): any[] {
    return this.editingLayout
      ? getLayoutAspectRatioOptions(this.editingLayout)
      : [];
  }

  getLayoutScaleMode(): LayoutScaleMode {
    return this.editingLayout
      ? getLayoutScaleMode(this.editingLayout)
      : "letterbox";
  }

  setLayoutScaleMode(mode: any): void {
    if (this.editingLayout && this.isEditMode) {
      setLayoutScaleMode(mode, this.editingLayout, this);
    }
  }

  getLayoutBaseWidth(): number {
    return this.editingLayout ? getLayoutBaseWidth(this.editingLayout) : 1920;
  }

  getLayoutBaseHeight(): number {
    return this.editingLayout ? getLayoutBaseHeight(this.editingLayout) : 1080;
  }

  getPreviewContainerWidth(): number {
    return this.editingLayout
      ? getPreviewContainerWidth(this.editingLayout, this.layoutZoom, this)
      : 1000;
  }

  getPreviewContainerHeight(): number {
    return this.editingLayout
      ? getPreviewContainerHeight(this.editingLayout, this.layoutZoom, this)
      : 562;
  }

  getPreviewScale(): string {
    return this.editingLayout
      ? getPreviewScale(this.editingLayout, this.layoutZoom, this)
      : "scale(1)";
  }

  getPreviewScaleNumber(): number {
    return this.editingLayout
      ? getPreviewScaleNumber(this.editingLayout, this.layoutZoom, this)
      : 1;
  }

  getCanvasViewportMaxHeight(): number {
    return getCanvasViewportMaxHeight();
  }

  getInspectorHeight(): number {
    return this.editingLayout
      ? getInspectorHeight(this.editingLayout, this.layoutZoom, this)
      : 500;
  }

  // --- Countdown Preview ---
  isCountdownPreviewActive(): boolean {
    return this.editingLayout
      ? isCountdownPreviewActive(this.editingLayout, this.countdownPreviewState)
      : false;
  }

  toggleCountdownPreview(): void {
    if (this.editingLayout) {
      toggleCountdownPreview(
        this.editingLayout,
        this.countdownPreviewState,
        this,
      );
    }
  }

  // --- Widgets & Inspector ---
  getLayoutWidgets(): any[] {
    return this.editingLayout ? getLayoutWidgets(this.editingLayout) : [];
  }

  getSelectedWidgetId(): string {
    return this.selectedWidgetId || "";
  }

  onWidgetDropdownSelect(widgetId: string): void {
    this.selectedWidgetId = widgetId || null;
    if (this.editingLayout) {
      onWidgetDropdownSelect(widgetId, this.editingLayout, this);
    }
    this.cdr.markForCheck();
  }

  onWidgetSelected(widget: any): void {
    const id = typeof widget === "string" ? widget : widget?.id || null;
    this.selectedWidgetId = id;
    if (this.editingLayout) {
      onWidgetSelected(id, this);
    }
    this.cdr.markForCheck();
  }

  removeSelectedWidget(): void {
    if (this.editingLayout) {
      removeSelectedWidget(this.editingLayout, this);
    }
  }

  onWidgetXChange(x: number): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetXChange(x, this.currentSelectedWidget, this.editingLayout, this);
    }
  }

  onWidgetYChange(y: number): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetYChange(y, this.currentSelectedWidget, this.editingLayout, this);
    }
  }

  onWidgetWidthChange(w: number): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetWidthChange(
        w,
        this.currentSelectedWidget,
        this.editingLayout,
        this,
      );
    }
  }

  onWidgetHeightChange(h: number): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetHeightChange(
        h,
        this.currentSelectedWidget,
        this.editingLayout,
        this,
      );
    }
  }

  onWidgetInspectorChange(widget: any): void {
    if (this.editingLayout) {
      onWidgetInspectorChange(widget, this.editingLayout, this);
    }
  }

  isWidgetWidthAutoCalculated(widget: any): boolean {
    return isWidgetWidthAutoCalculated(widget);
  }

  isWidgetHeightAutoCalculated(widget: any): boolean {
    return isWidgetHeightAutoCalculated(widget);
  }

  isCustomWidget(type: string): boolean {
    return isCustomWidget(type);
  }

  getWidgetDisplayName(widget: any): string {
    return getWidgetDisplayName(
      widget,
      this.translationService,
      this.availableColumns,
    );
  }

  getWidgetTypeLabelKey(type: string): string {
    return getWidgetTypeLabelKey(type);
  }

  // --- Grids & Columns ---
  onAnchorSelected(
    event: { widgetId: string; anchor: string | null } | string,
  ): void {
    onAnchorSelected(event, this);
  }

  onSelectedAnchorChange(anchor: string | null): void {
    this.selectedAnchor = anchor;
    this.cdr.markForCheck();
  }

  onLayoutChanged(layout: LayoutConfig): void {
    if (this.editingLayout) {
      onLayoutChanged(layout, this.editingLayout, this);
    }
  }

  onColumnsChanged(): void {
    this.captureState();
  }

  finishGridSession(): void {
    this.activeGridSession = null;
    this.cdr.markForCheck();
  }

  onDeleteGrid(event: any): void {
    if (this.editingLayout) {
      handleGridDelete(this, event, this.editingLayout);
    }
  }

  onGridBoundsChange(event: any): void {
    updateGridSessionBounds(this, event);
  }

  onEditGridTemplate(event: any): void {
    handleGridTemplateEdit(this, event);
  }

  onDetachGrid(event: any): void {
    if (this.editingLayout) {
      handleGridDetach(this, event, this.editingLayout);
    }
  }

  onReMirrorGrid(event: any): void {
    if (this.editingLayout) {
      handleGridReMirror(this, event, this.editingLayout);
    }
  }

  onBringGridToFront(event: any): void {
    if (this.editingLayout) {
      handleGridBringToFront(this, event, this.editingLayout);
    }
  }

  // --- Replicate Lanes ---
  openReplicateLaneModal(options?: {
    bindingMode?: "lane" | "position" | "overallPosition" | "seed";
    sourceIndex?: number;
    defaultCount?: number;
  }): void {
    if (options) {
      if (options.bindingMode) this.replicateBindingMode = options.bindingMode;
      if (typeof options.sourceIndex === "number") {
        this.replicateSourceIndex = options.sourceIndex;
      }
      if (typeof options.defaultCount === "number") {
        this.replicateDefaultCount = options.defaultCount;
      }
    }
    this.showReplicateModal = true;
  }

  onReplicateLanes(
    options:
      | Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">
      | LaneReplicationOptions,
  ): void {
    if (this.editingLayout) {
      onReplicateLanes(options, this.editingLayout, this);
    }
  }

  // --- Reset & Clear ---
  onResetLayout(): void {
    if (!this.editingLayout || !this.isEditMode) return;
    this.showResetConfirm = true;
  }

  onConfirmResetLayout(): void {
    if (!this.editingLayout) return;
    this.showResetConfirm = false;
    resetLayout(this.editingLayout, this.editingSettings, this);
  }

  onCancelResetLayout(): void {
    this.showResetConfirm = false;
  }

  onClearLayout(): void {
    if (!this.editingLayout || !this.isEditMode) return;
    this.showClearConfirm = true;
  }

  onConfirmClearLayout(): void {
    if (!this.editingLayout) return;
    this.showClearConfirm = false;
    clearLayout(this.editingLayout, this.editingSettings, this);
  }

  onCancelClearLayout(): void {
    this.showClearConfirm = false;
  }

  // --- Import & Export ---
  onImportLayout(event: Event): Promise<void> | void {
    if (this.editingLayout && this.isEditMode) {
      return onImportLayout(
        event,
        this.editingLayout,
        this.editingSettings,
        this,
      );
    }
  }

  exportLayout(): void {
    if (this.editingLayout) {
      exportLayout(this.editingLayout);
    }
  }

  // --- Stacked Columns & Migration ---
  hasStackedColumns(): boolean {
    return this.editingLayout
      ? hasStackedColumns(this.editingLayout, this.availableColumns)
      : false;
  }

  getStackedColumnsBannerDesc(): string {
    return this.editingLayout
      ? getStackedColumnsBannerDesc(
          this.editingLayout,
          this.translationService,
          this.availableColumns,
        )
      : "";
  }

  openReviewStackedColumnsModal(): void {
    handleOpenReviewStackedColumnsModal(this);
  }

  quickFixStackedColumns(): void {
    if (this.editingLayout) {
      quickFixStackedColumns(this.editingLayout, this);
    }
  }

  isMigratedLayout(): boolean {
    return this.editingLayout ? isMigratedLayout(this.editingLayout) : false;
  }

  restorePreMigrationBackup(): void {
    handleRestorePreMigrationBackup(this);
  }

  exportMigrationDiagnostics(): void {
    if (this.editingLayout) {
      const currentLayout = parseLayoutConfig(this.editingLayout);
      exportDiagnosticsHelper(this.editingLayout, currentLayout);
    }
  }
}
