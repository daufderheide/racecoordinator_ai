import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom, Subscription } from "rxjs";
import { DefaultRacedayComponent } from "@app/components/raceday/default-raceday.component";
import {
  LaneGridRepairHelper,
  StackedColumnIssue,
} from "@app/components/raceday/utils/lane-grid-repair.helper";
import { LaneGridSession } from "@app/components/raceday/utils/lane-grid-replication.helper";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { ReplicateLaneDialogComponent } from "@app/components/ui-editor/components/replicate-lane-dialog/replicate-lane-dialog.component";
import { ReviewStackedColumnsModalComponent } from "@app/components/ui-editor/components/review-stacked-columns-modal/review-stacked-columns-modal.component";
import { findDefaultWidgetId } from "@app/components/ui-editor/ui-editor-widget.helper";
import { WidgetInspectorFieldsComponent } from "@app/components/ui-editor/widget-inspector-fields/widget-inspector-fields.component";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, LayoutScaleMode, Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ChildWindowManagerService } from "@app/services/child-window-manager.service";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import {
  getNextSelectionAfterDelete,
  SelectItem,
} from "@app/utils/editor-utils";

import {
  areLayoutsEqual,
  buildDuplicateLayoutTemplate,
  buildLayoutSelectItems,
  buildNewLayoutTemplate,
  cloneLayout,
  createFallbackDefaultLayouts,
  getLayoutUnsavedReasons,
  isCustomUiDefault,
  isLayoutNameUnique,
  LAYOUT_AVAILABLE_COLUMNS,
  syncLayoutSettingsWithDefaults,
} from "./layout-editor.helper";
import {
  clearLayout,
  exportLayout,
  exportMigrationDiagnostics as exportDiagnosticsHelper,
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
  hasStackedColumns,
  isCountdownPreviewActive,
  isCustomWidget,
  isMigratedLayout,
  isWidgetHeightAutoCalculated,
  isWidgetWidthAutoCalculated,
  loadLayoutZoomFromStorage,
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
  restorePreMigrationLayout,
  saveLayoutZoomToStorage,
  setLayoutAspectRatio,
  setLayoutScaleMode,
  setZoomInput,
  stepZoom,
  toggleCountdownPreview,
  updateGridSessionBounds,
} from "./layout-editor-actions.helper";
import { buildLayoutEditorHelpSteps } from "./layout-editor-help.helper";

@Component({
  standalone: true,
  selector: "app-layout-editor",
  templateUrl: "./layout-editor.component.html",
  styleUrls: ["./layout-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDefaultDirective,
    EditorTitleComponent,
    DefaultRacedayComponent,
    ConfirmationModalComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    WidgetInspectorFieldsComponent,
    ReplicateLaneDialogComponent,
    ReviewStackedColumnsModalComponent,
  ],
})
export class LayoutEditorComponent
  implements OnInit, OnDestroy, DirtyComponent
{
  @ViewChild("racedayComp") racedayComp?: DefaultRacedayComponent;
  @ViewChild("layoutFileInput") layoutFileInput?: ElementRef<HTMLInputElement>;

  allLayouts: CustomUI[] = [];
  selectedLayoutId = "";
  editingLayout: CustomUI | null = null;
  originalLayout: CustomUI | null = null;

  isEditMode = false;
  isLoading = true;
  isSaving = false;

  undoManager!: UndoManager<CustomUI>;
  lifecycle!: EditorLifecycleHelper;

  selectedWidgetId: string | null = null;

  get currentSelectedWidget(): any | null {
    const layout = this.getLayout(this.editingLayout);
    return this.selectedWidgetId && layout?.widgets
      ? layout.widgets.find((w: any) => w.id === this.selectedWidgetId) || null
      : null;
  }
  set currentSelectedWidget(val: any) {
    this.selectedWidgetId = val?.id || (typeof val === "string" ? val : null);
  }

  get selectedWidget(): any | null {
    return this.currentSelectedWidget;
  }
  set selectedWidget(val: any) {
    this.currentSelectedWidget = val;
  }

  activeGridSession: LaneGridSession | null = null;
  selectedAnchor: string | null = null;

  showDeleteConfirm = false;
  showResetConfirm = false;
  showClearConfirm = false;
  showReplicateModal = false;
  showReviewStackedColumnsModal = false;
  stackedColumnsToReview: any = null;

  replicateBindingMode: "lane" | "position" | "overallPosition" | "seed" =
    "lane";
  replicateSourceIndex = 0;
  replicateDefaultCount = 4;
  detectedStackedIssues: StackedColumnIssue[] = [];

  countdownPreviewState: { [id: string]: boolean } = {};
  layoutZoom = new Map<string, number>();

  editingSettings = new Settings();
  availableColumns: any[] = [];
  defaultUiNames: { [id: string]: string } = {};
  parsedLayouts = new Map<string, LayoutConfig>();

  private queryParamSub?: Subscription;

  public navigationService = inject(NavigationService, { optional: true });
  public raceConnectionService = inject(RaceConnectionService, {
    optional: true,
  });
  public childWindowManagerService = inject(ChildWindowManagerService, {
    optional: true,
  });

  constructor(
    public dataService: DataService,
    public settingsService: SettingsService,
    public translationService: TranslationService,
    public logger: LoggerService,
    public cdr: ChangeDetectorRef,
    public route: ActivatedRoute,
    public router: Router,
  ) {}

  get showDiscardConfirm(): boolean {
    return this.lifecycle?.showDiscardConfirm || false;
  }
  set showDiscardConfirm(val: boolean) {
    if (this.lifecycle) {
      this.lifecycle.showDiscardConfirm = val;
    }
  }

  get isNavigationApproved(): boolean {
    return this.lifecycle?.isNavigationApproved || false;
  }

  get discardMessage(): string {
    return this.lifecycle?.discardMessage || "";
  }

  get layoutSelectItems(): SelectItem[] {
    return buildLayoutSelectItems(this.allLayouts, this.translationService);
  }

  get isDefaultLayout(): boolean {
    return this.editingLayout ? isCustomUiDefault(this.editingLayout) : false;
  }

  get isCurrentLayoutPractice(): boolean {
    return this.editingLayout?.entity_id === "practice_ui_layout_rc_ai";
  }

  get isCurrentLayoutDriverStation(): boolean {
    return this.editingLayout?.entity_id === "driver_station_ui_layout_rc_ai";
  }

  get activeCustomUi(): CustomUI | null {
    return this.editingLayout;
  }

  getLayout(ui?: CustomUI | null): LayoutConfig | null {
    const target = ui || this.editingLayout;
    if (!target) return null;
    return parseLayoutConfig(target);
  }

  isCustomUiPractice(ui?: CustomUI | null): boolean {
    const target = ui || this.editingLayout;
    return target?.entity_id === "practice_ui_layout_rc_ai";
  }

  ngOnInit(): void {
    this.raceConnectionService?.connect();
    this.initUndoManager();
    this.initLifecycle();
    this.layoutZoom = loadLayoutZoomFromStorage(this.logger, 10);
    this.loadData();
  }

  ngOnDestroy(): void {
    this.queryParamSub?.unsubscribe();
    this.raceConnectionService?.disconnect();

    const destUrl =
      this.router?.getCurrentNavigation?.()?.extractedUrl?.toString() ||
      this.router?.url ||
      "";
    if (
      this.childWindowManagerService &&
      !this.childWindowManagerService.isRacePreservingRoute(destUrl)
    ) {
      this.childWindowManagerService.closeAllWindows();
    }
  }

  @HostListener("window:pagehide")
  onPageHide(): void {
    this.raceConnectionService?.disconnect();
    this.childWindowManagerService?.closeAllWindows();
  }

  @HostListener("window:beforeunload", ["$event"])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirtyState()) {
      event.preventDefault();
      event.returnValue = "";
    }
  }

  @HostListener("window:resize")
  onResize(): void {
    this.cdr.markForCheck();
  }

  private initUndoManager(): void {
    this.undoManager = new UndoManager<CustomUI>(
      {
        clonner: (item: CustomUI) => cloneLayout(item),
        equalizer: (a: CustomUI, b: CustomUI) => areLayoutsEqual(a, b),
        applier: (item: CustomUI) => {
          this.editingLayout = cloneLayout(item);
          this.cdr.markForCheck();
        },
      },
      () => (this.editingLayout ? cloneLayout(this.editingLayout) : undefined),
    );
  }

  private initLifecycle(): void {
    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () =>
        getLayoutUnsavedReasons(
          this.editingLayout,
          this.originalLayout,
          this.allLayouts,
          this.translationService,
        ),
      onRevert: () => {
        if (this.originalLayout) {
          this.editingLayout = cloneLayout(this.originalLayout);
          this.undoManager.initialize(this.editingLayout);
        }
        this.isEditMode = false;
        this.currentSelectedWidget = null;
        this.activeGridSession = null;
        this.selectedAnchor = null;
        this.cdr.markForCheck();
      },
      undoManager: this.undoManager,
      hasChanges: () => this.isDirtyState(),
      isSaveValid: () => this.isConfigValid(),
      isSaving: () => this.isSaving,
      logger: this.logger,
    });
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const uis = await firstValueFrom(this.dataService.getCustomUIs());
      this.editingSettings =
        this.settingsService.getSettings() || new Settings();
      this.allLayouts =
        uis && uis.length > 0
          ? uis
          : createFallbackDefaultLayouts(
              this.editingSettings.racedayLayout,
              this.editingSettings.practiceRacedayLayout,
            );
      syncLayoutSettingsWithDefaults(
        this.allLayouts,
        this.editingSettings.racedayLayout,
        this.editingSettings.practiceRacedayLayout,
      );
      this.availableColumns = LAYOUT_AVAILABLE_COLUMNS;

      this.queryParamSub = this.route.queryParams.subscribe((params) => {
        const targetId = params["id"] || params["layoutId"];
        const found = targetId
          ? this.allLayouts.find((u) => u.entity_id === targetId)
          : null;
        const initial = found || this.allLayouts[0];
        if (initial && initial.entity_id !== this.selectedLayoutId) {
          this.selectLayoutById(initial.entity_id, false);
        }
        if (params["edit"] === "true") {
          this.isEditMode = true;
        }
      });
    } catch (err) {
      this.logger.error("Failed to load layouts in layout editor", err);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  selectLayoutById(id: string, updateUrl = true): void {
    const layout = this.allLayouts.find((u) => u.entity_id === id);
    if (!layout) return;
    this.selectedLayoutId = id;
    this.editingLayout = cloneLayout(layout);
    this.originalLayout = cloneLayout(layout);
    this.defaultUiNames[id] = layout.name;
    const parsed = parseLayoutConfig(this.editingLayout);
    this.selectedWidgetId =
      findDefaultWidgetId(parsed) || parsed?.widgets?.[0]?.id || null;
    this.activeGridSession = null;
    this.selectedAnchor = null;
    this.undoManager.initialize(this.editingLayout);
    if (this.racedayComp) {
      this.racedayComp.syncLayoutFromEditor(parsed);
    }

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    }
    this.cdr.markForCheck();
  }

  onSelectLayoutById(id: string): void {
    if (id === this.selectedLayoutId) return;
    if (this.isDirtyState()) {
      this.lifecycle.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.isEditMode = false;
          this.selectLayoutById(id);
        }
      });
    } else {
      this.isEditMode = false;
      this.selectLayoutById(id);
    }
  }

  onBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl");
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else if (this.navigationService?.canGoBack()) {
      this.navigationService.goBack();
    } else {
      this.router.navigate(["/raceday-setup"]);
    }
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  getUnsavedReasons(): string[] {
    return getLayoutUnsavedReasons(
      this.editingLayout,
      this.originalLayout,
      this.allLayouts,
      this.translationService,
    );
  }

  isDirtyState(): boolean {
    if (!this.isEditMode || !this.editingLayout || !this.originalLayout) {
      return false;
    }
    return (
      !areLayoutsEqual(this.editingLayout, this.originalLayout) ||
      this.undoManager.canUndo()
    );
  }

  isConfigValid(): boolean {
    if (!this.editingLayout?.name || !this.editingLayout.name.trim()) {
      return false;
    }
    return isLayoutNameUnique(
      this.editingLayout.name,
      this.originalLayout?.entity_id,
      this.allLayouts,
    );
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (this.isDirtyState()) {
      return this.lifecycle.confirmDiscard();
    }
    return true;
  }

  onConfirmDiscard(): void {
    this.lifecycle.onConfirmDiscard();
  }

  onCancelDiscard(): void {
    this.lifecycle.onCancelDiscard();
  }

  captureState(): void {
    if (this.isEditMode) {
      this.undoManager.captureState();
      this.cdr.markForCheck();
    }
  }

  onToggleEditMode(): void {
    if (!this.isEditMode) {
      this.isEditMode = true;
      if (!this.selectedWidgetId && this.editingLayout) {
        const parsed = parseLayoutConfig(this.editingLayout);
        this.selectedWidgetId =
          findDefaultWidgetId(parsed) || parsed?.widgets?.[0]?.id || null;
      }
      this.cdr.markForCheck();
      return;
    }

    if (this.isSaving) return;

    if (this.isDirtyState()) {
      if (!this.isConfigValid()) {
        alert(this.translationService.translate("LE_ERROR_NAME_INVALID"));
        return;
      }
      this.saveCurrentLayout();
    } else {
      this.isEditMode = false;
      this.cdr.markForCheck();
    }
  }

  async saveCurrentLayout(): Promise<void> {
    if (!this.editingLayout) return;
    this.isSaving = true;
    try {
      const saved = await firstValueFrom(
        this.dataService.updateCustomUI(
          this.editingLayout.entity_id,
          this.editingLayout,
        ),
      );
      if (saved) {
        const index = this.allLayouts.findIndex(
          (u) => u.entity_id === this.editingLayout!.entity_id,
        );
        if (index >= 0) {
          this.allLayouts[index] = cloneLayout(this.editingLayout);
        }
        this.originalLayout = cloneLayout(this.editingLayout);
        this.undoManager.initialize(this.editingLayout);
        this.isEditMode = false;
      }
    } catch (err) {
      this.logger.error("Failed to save layout", err);
      alert(this.translationService.translate("UE_ERROR_SAVE_FAILED"));
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  onAddNewLayout(): void {
    if (this.isEditMode && this.isDirtyState()) {
      this.lifecycle.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.startNewLayout();
        }
      });
    } else {
      this.startNewLayout();
    }
  }

  async startNewLayout(): Promise<void> {
    this.isSaving = true;
    try {
      const template = buildNewLayoutTemplate(
        this.translationService.translate("UE_DEFAULT_CUSTOM_UI_NAME") ||
          "New UI Layout",
        this.allLayouts,
      );
      const created = await firstValueFrom(
        this.dataService.createCustomUI(template),
      );
      if (created) {
        this.allLayouts.push(created);
        this.selectLayoutById(created.entity_id);
        this.isEditMode = true;
      }
    } catch (err) {
      this.logger.error("Failed to create layout", err);
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  onCopyLayout(): void {
    if (!this.editingLayout || this.isSaving) return;
    if (this.isEditMode && this.isDirtyState()) {
      this.lifecycle.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.duplicateCurrentLayout();
        }
      });
    } else {
      this.duplicateCurrentLayout();
    }
  }

  async duplicateCurrentLayout(): Promise<void> {
    if (!this.editingLayout) return;
    this.isSaving = true;
    try {
      const template = buildDuplicateLayoutTemplate(
        this.editingLayout,
        this.allLayouts,
      );
      const created = await firstValueFrom(
        this.dataService.createCustomUI(template),
      );
      if (created) {
        this.allLayouts.push(created);
        this.selectLayoutById(created.entity_id);
        this.isEditMode = true;
      }
    } catch (err) {
      this.logger.error("Failed to duplicate layout", err);
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  onDeleteLayout(): void {
    if (!this.editingLayout || this.isSaving) return;
    this.showDeleteConfirm = true;
  }

  async onConfirmDeleteLayout(): Promise<void> {
    if (!this.editingLayout) return;
    const idToDelete = this.editingLayout.entity_id;
    this.showDeleteConfirm = false;
    this.isSaving = true;
    try {
      await firstValueFrom(this.dataService.deleteCustomUI(idToDelete));
      const next = getNextSelectionAfterDelete(this.allLayouts, idToDelete);
      this.allLayouts = this.allLayouts.filter(
        (u) => u.entity_id !== idToDelete,
      );
      this.isEditMode = false;
      if (next) {
        this.selectLayoutById(next.entity_id);
      }
    } catch (err) {
      this.logger.error("Failed to delete layout", err);
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  onCancelDeleteLayout(): void {
    this.showDeleteConfirm = false;
  }

  getHelpSteps(): GuideStep[] {
    return buildLayoutEditorHelpSteps(this.translationService, () => {
      if (!this.currentSelectedWidget) {
        const widgets = this.getLayoutWidgets();
        if (widgets.length > 0) {
          this.onWidgetDropdownSelect(widgets[0].id);
        }
      }
    });
  }

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

  syncRacedayPreview(layout: LayoutConfig): void {
    this.racedayComp?.syncLayoutFromEditor(layout);
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
  onImportLayout(event: Event): void {
    if (this.editingLayout && this.isEditMode) {
      onImportLayout(event, this.editingLayout, this.editingSettings, this);
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
    if (this.editingLayout) {
      const layout = parseLayoutConfig(this.editingLayout);
      const res = LaneGridRepairHelper.detectStackedColumns(
        layout,
        this.availableColumns,
      );
      this.detectedStackedIssues = res.issues || [];
    }
    this.showReviewStackedColumnsModal = true;
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
    if (this.editingLayout) {
      const res = restorePreMigrationLayout(
        this.editingLayout,
        this.allLayouts,
      );
      if (res.restored) {
        this.captureState();
        this.cdr.markForCheck();
      }
    }
  }

  exportMigrationDiagnostics(): void {
    if (this.editingLayout) {
      const currentLayout = parseLayoutConfig(this.editingLayout);
      exportDiagnosticsHelper(this.editingLayout, currentLayout);
    }
  }
}
