import { ChangeDetectorRef } from "@angular/core";
import { StackedColumnIssue } from "@app/components/raceday/utils/lane-grid-repair.helper";
import { LaneGridSession } from "@app/components/raceday/utils/lane-grid-replication.helper";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { exportMigrationDiagnostics as exportDiagnosticsHelper } from "@app/components/ui-editor/ui-editor-io.helper";
import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, LayoutScaleMode } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";

import {
  clearLastEditedWidgetForLayout,
  isGridElement,
  LayoutLastEditedWidgetState,
  setLastEditedWidgetForLayout,
} from "./layout-editor.helper";
import {
  canUpgradeLegacyHeatView,
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
  handleUpgradeLegacyHeatView,
  hasStackedColumns,
  isCountdownPreviewActive,
  isCustomWidget,
  isMigratedLayout,
  isWidgetHeightAutoCalculated,
  isWidgetWidthAutoCalculated,
  nudgeSelectedWidget,
  onAnchorSelected,
  onImportLayout,
  onLayoutChanged,
  onReplicateLanes,
  onWidgetDropdownSelect,
  onWidgetHeightChange,
  onWidgetInspectorChange,
  onWidgetScaleModeChange,
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
  isWidgetConfigVisible: boolean = true;
  abstract selectedWidgetId: string | null;
  abstract currentSelectedWidget: any | null;
  abstract selectedAnchor: string | null;
  selectionToken: number = 0;
  selectedWidgetTab: string | null = null;
  navigationService?: NavigationService | null;
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

  getLayoutBaseWidth(ui?: CustomUI): number {
    const target = ui || this.editingLayout;
    return target ? getLayoutBaseWidth(target) : 1920;
  }

  getLayoutBaseHeight(ui?: CustomUI): number {
    const target = ui || this.editingLayout;
    return target ? getLayoutBaseHeight(target) : 1080;
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
    const widget = this.currentSelectedWidget;
    if (isGridElement(widget)) {
      if (!this.selectedWidgetTab) {
        this.selectedWidgetTab = "widget";
      }
    } else {
      this.selectedWidgetTab = null;
    }
    this.saveLastEditedWidgetState();
    this.cdr.markForCheck();
  }

  onWidgetSelected(widget: any): void {
    const id = typeof widget === "string" ? widget : widget?.id || null;
    this.selectedWidgetId = id;
    this.selectionToken++;
    if (this.editingLayout) {
      onWidgetSelected(id, this);
    }
    const selectedWidget = this.currentSelectedWidget;
    if (isGridElement(selectedWidget)) {
      if (!this.selectedWidgetTab) {
        this.selectedWidgetTab = "widget";
      }
    } else {
      this.selectedWidgetTab = null;
    }
    this.saveLastEditedWidgetState();
    this.cdr.markForCheck();
  }

  onWidgetTabChange(tab: string): void {
    this.selectedWidgetTab = tab;
    this.saveLastEditedWidgetState();
    this.cdr.markForCheck();
  }

  saveLastEditedWidgetState(): void {
    const layoutId = this.editingLayout?.entity_id;
    if (!layoutId || !this.selectedWidgetId) return;
    const widget = this.currentSelectedWidget;
    const isGrid = isGridElement(widget);
    const state: LayoutLastEditedWidgetState = {
      widgetId: this.selectedWidgetId,
      ...(isGrid && this.selectedWidgetTab
        ? { tab: this.selectedWidgetTab }
        : {}),
    };
    setLastEditedWidgetForLayout(layoutId, state, this.navigationService);
  }

  removeSelectedWidget(): void {
    if (this.editingLayout) {
      removeSelectedWidget(this.editingLayout, this);
      if (this.selectedWidgetId) {
        const widget = this.currentSelectedWidget;
        if (isGridElement(widget)) {
          if (!this.selectedWidgetTab) {
            this.selectedWidgetTab = "widget";
          }
        } else {
          this.selectedWidgetTab = null;
        }
        this.saveLastEditedWidgetState();
      } else {
        this.selectedWidgetTab = null;
        clearLastEditedWidgetForLayout(
          this.editingLayout.entity_id,
          this.navigationService,
        );
      }
    }
  }

  onWidgetXChange(x: any): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetXChange(x, this.currentSelectedWidget, this.editingLayout, this);
      this.saveLastEditedWidgetState();
    }
  }

  onWidgetYChange(y: any): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetYChange(y, this.currentSelectedWidget, this.editingLayout, this);
      this.saveLastEditedWidgetState();
    }
  }

  onWidgetWidthChange(w: any): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetWidthChange(
        w,
        this.currentSelectedWidget,
        this.editingLayout,
        this,
      );
      this.saveLastEditedWidgetState();
    }
  }

  onWidgetHeightChange(h: any): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetHeightChange(
        h,
        this.currentSelectedWidget,
        this.editingLayout,
        this,
      );
      this.saveLastEditedWidgetState();
    }
  }

  onWidgetScaleModeChange(mode: any): void {
    if (this.editingLayout && this.currentSelectedWidget) {
      onWidgetScaleModeChange(
        mode,
        this.currentSelectedWidget,
        this.editingLayout,
        this,
      );
      this.saveLastEditedWidgetState();
    }
  }

  onWidgetInspectorChange(widget: any, ui?: CustomUI): void {
    const targetUi = ui || this.editingLayout;
    if (targetUi) {
      onWidgetInspectorChange(widget, targetUi, this);
      this.saveLastEditedWidgetState();
    }
  }

  nudgeSelectedWidget(dx: number, dy: number): void {
    if (!this.isEditMode || !this.editingLayout) return;
    nudgeSelectedWidget(dx, dy, this.editingLayout, this);
    this.saveLastEditedWidgetState();
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
    this.selectionToken++;
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
      if (this.selectedWidgetId) {
        const widget = this.currentSelectedWidget;
        if (isGridElement(widget)) {
          if (!this.selectedWidgetTab) {
            this.selectedWidgetTab = "widget";
          }
        } else {
          this.selectedWidgetTab = null;
        }
        this.saveLastEditedWidgetState();
      } else {
        this.selectedWidgetTab = null;
        clearLastEditedWidgetForLayout(
          this.editingLayout.entity_id,
          this.navigationService,
        );
      }
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

  canUpgradeLegacyHeatView(): boolean {
    return this.editingLayout
      ? canUpgradeLegacyHeatView(this.editingLayout)
      : false;
  }

  restorePreMigrationBackup(): void {
    handleRestorePreMigrationBackup(this);
  }

  upgradeLegacyHeatView(): void {
    handleUpgradeLegacyHeatView(this);
  }

  exportMigrationDiagnostics(): void {
    if (this.editingLayout) {
      const currentLayout = parseLayoutConfig(this.editingLayout);
      exportDiagnosticsHelper(this.editingLayout, currentLayout);
    }
  }
}
