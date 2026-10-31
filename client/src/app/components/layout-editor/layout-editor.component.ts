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
import { catchError, firstValueFrom, of, Subscription } from "rxjs";
import { DefaultRacedayComponent } from "@app/components/raceday/default-raceday.component";
import { LaneGridSession } from "@app/components/raceday/utils/lane-grid-replication.helper";
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
import { LayoutConfig, Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ChildWindowManagerService } from "@app/services/child-window-manager.service";
import { CustomUiService } from "@app/services/custom-ui.service";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import { SelectItem } from "@app/utils/editor-utils";

import { LayoutEditorBase } from "./layout-editor.base";
import {
  areLayoutsEqual,
  buildLayoutSelectItems,
  buildLayoutTemplateOptions,
  cloneLayout,
  createFallbackDefaultLayouts,
  getLastEditedLayoutId,
  getLayoutUnsavedReasons,
  isCustomUiDefault,
  isLayoutNameUnique,
  LAYOUT_AVAILABLE_COLUMNS,
  LayoutTemplateOption,
  resolveInitialLayout,
  setLastEditedLayoutId,
  syncLayoutSettingsWithDefaults,
} from "./layout-editor.helper";
import {
  handleDeleteCurrentLayout,
  handleDuplicateCurrentLayout,
  handleStartNewLayout,
  loadLayoutZoomFromStorage,
  parseLayoutConfig,
} from "./layout-editor-actions.helper";
import { buildLayoutEditorHelpSteps } from "./layout-editor-help.helper";
import { NewLayoutModalComponent } from "./new-layout-modal/new-layout-modal.component";

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
    NewLayoutModalComponent,
  ],
})
export class LayoutEditorComponent
  extends LayoutEditorBase
  implements OnInit, OnDestroy, DirtyComponent
{
  @ViewChild("racedayComp") racedayComp?: DefaultRacedayComponent;
  @ViewChild("layoutFileInput") layoutFileInput?: ElementRef<HTMLInputElement>;

  allLayouts: CustomUI[] = [];
  selectedLayoutId = "";
  editingLayout: CustomUI | null = null;
  originalLayout: CustomUI | null = null;

  isEditMode = false;
  isWidgetLibraryVisible = true;
  isLoading = true;
  isSaving = false;
  isAutoSaving = false;
  showNewLayoutModal = false;
  selectedNewLayoutTemplateId = "default_ui_layout_rc_ai";

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

  maxTrackLanes = 4;

  get totalTrackLanes(): number {
    return this.racedayComp?.track?.lanes?.length || this.maxTrackLanes || 4;
  }

  countdownPreviewState: { [id: string]: boolean } = {};
  layoutZoom = new Map<string, number>();

  editingSettings = new Settings();
  availableColumns: any[] = [];
  defaultUiNames: { [id: string]: string } = {};
  parsedLayouts = new Map<string, LayoutConfig>();

  private subscriptions: Subscription[] = [];
  private queryParamSub?: Subscription;

  public navigationService = inject(NavigationService, { optional: true });
  public raceConnectionService = inject(RaceConnectionService, {
    optional: true,
  });
  public childWindowManagerService = inject(ChildWindowManagerService, {
    optional: true,
  });
  public customUiService = inject(CustomUiService, { optional: true });

  constructor(
    public dataService: DataService,
    public settingsService: SettingsService,
    public translationService: TranslationService,
    public logger: LoggerService,
    public cdr: ChangeDetectorRef,
    public route: ActivatedRoute,
    public router: Router,
  ) {
    super();
  }

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

  get layoutTemplateOptions(): LayoutTemplateOption[] {
    return buildLayoutTemplateOptions(this.allLayouts, this.translationService);
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
    this.subscriptions.forEach((s) => s.unsubscribe());
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
          if (this.editingLayout) {
            const layout = parseLayoutConfig(this.editingLayout);
            this.syncRacedayPreview(layout);
          }
          this.cdr.markForCheck();
        },
      },
      () => (this.editingLayout ? cloneLayout(this.editingLayout) : undefined),
    );

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          event.type === "push" ||
          event.type === "undo" ||
          event.type === "redo"
        ) {
          this.autoSaveLayout();
        }
      }),
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
      onAutoSave: () => this.saveCurrentLayout(true),
      autoSaveOnDiscard: true,
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
      const loadedDefaultUi = this.allLayouts.find(
        (u) => u.entity_id === "default_ui_layout_rc_ai",
      );
      if (
        loadedDefaultUi?.layoutJson &&
        loadedDefaultUi.layoutJson !== "{}" &&
        loadedDefaultUi.layoutJson !== "[]"
      ) {
        this.editingSettings.racedayLayout = parseLayoutConfig(loadedDefaultUi);
        this.settingsService.saveSettings(this.editingSettings);
      }
      const loadedPracticeUi = this.allLayouts.find(
        (u) => u.entity_id === "practice_ui_layout_rc_ai",
      );
      if (
        loadedPracticeUi?.layoutJson &&
        loadedPracticeUi.layoutJson !== "{}" &&
        loadedPracticeUi.layoutJson !== "[]"
      ) {
        this.editingSettings.practiceRacedayLayout =
          parseLayoutConfig(loadedPracticeUi);
        this.settingsService.saveSettings(this.editingSettings);
      }
      this.availableColumns = LAYOUT_AVAILABLE_COLUMNS;

      try {
        const tracks = await firstValueFrom(
          this.dataService.getTracks().pipe(catchError(() => of([]))),
        );
        if (tracks && tracks.length > 0) {
          this.maxTrackLanes =
            tracks.reduce(
              (max: number, t: any) => Math.max(max, t?.lanes?.length || 0),
              0,
            ) || 4;
        }
      } catch (_e) {
        // Ignore track loading errors in layout editor
      }

      this.queryParamSub = this.route.queryParams.subscribe((params) => {
        const targetId = params["id"] || params["layoutId"];
        const lastEditedId = getLastEditedLayoutId(this.navigationService);
        const initial = resolveInitialLayout(
          targetId,
          this.allLayouts,
          lastEditedId,
        );
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
    setLastEditedLayoutId(id, this.navigationService);
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
      (this.undoManager ? this.undoManager.hasChanges() : false)
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

  confirmDiscard(): Promise<boolean> {
    return this.lifecycle.confirmDiscard();
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (this.isDirtyState()) {
      return this.confirmDiscard();
    }
    return true;
  }

  onConfirmDiscard(): void {
    this.lifecycle.onConfirmDiscard();
  }

  onCancelDiscard(): void {
    this.lifecycle.onCancelDiscard();
  }

  autoSaveLayout(): Promise<any> {
    if (!this.editingLayout || !this.isEditMode) return Promise.resolve();
    if (!this.isConfigValid()) return Promise.resolve();
    return this.lifecycle.scheduleAutoSave(() => this.saveCurrentLayout(true));
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
      this.isWidgetLibraryVisible = true;
      if (!this.selectedWidgetId && this.editingLayout) {
        const parsed = parseLayoutConfig(this.editingLayout);
        this.selectedWidgetId =
          findDefaultWidgetId(parsed) || parsed?.widgets?.[0]?.id || null;
      }
      this.racedayComp?.ensureToolboxVisible?.();
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

  toggleWidgetLibrary(): void {
    if (!this.isEditMode) return;
    if (!this.isWidgetLibraryVisible) {
      this.isWidgetLibraryVisible = true;
      this.racedayComp?.ensureToolboxVisible?.();
    } else if (this.racedayComp?.isLayoutEditorMinimized) {
      this.racedayComp?.ensureToolboxVisible?.();
    } else if (
      this.racedayComp?.layoutEditorPosition &&
      (this.racedayComp.layoutEditorPosition.x >= 9000 ||
        this.racedayComp.layoutEditorPosition.y >= 9000)
    ) {
      this.racedayComp?.resetLayoutEditorPosition?.();
    } else {
      this.isWidgetLibraryVisible = !this.isWidgetLibraryVisible;
    }
    this.cdr.markForCheck();
  }

  async saveCurrentLayout(isAutoSave = false): Promise<any> {
    if (!this.editingLayout) return;
    if (this.isSaving) return;
    if (isAutoSave) {
      this.isAutoSaving = true;
    } else {
      this.isSaving = true;
    }
    try {
      const saved = await firstValueFrom(
        this.dataService.updateCustomUI(
          this.editingLayout.entity_id,
          this.editingLayout,
        ),
      );
      if (saved) {
        if (this.editingLayout.entity_id === "default_ui_layout_rc_ai") {
          this.editingSettings.racedayLayout = parseLayoutConfig(
            this.editingLayout,
          );
          this.settingsService.saveSettings(this.editingSettings);
        } else if (
          this.editingLayout.entity_id === "practice_ui_layout_rc_ai"
        ) {
          this.editingSettings.practiceRacedayLayout = parseLayoutConfig(
            this.editingLayout,
          );
          this.settingsService.saveSettings(this.editingSettings);
        }
        this.customUiService?.initialize();
        setLastEditedLayoutId(
          this.editingLayout.entity_id,
          this.navigationService,
        );
        const index = this.allLayouts.findIndex(
          (u) => u.entity_id === this.editingLayout!.entity_id,
        );
        if (index >= 0) {
          this.allLayouts[index] = cloneLayout(this.editingLayout);
        }
        this.originalLayout = cloneLayout(this.editingLayout);
        if (isAutoSave) {
          this.undoManager.resetTracking(this.editingLayout);
        } else {
          this.undoManager.initialize(this.editingLayout);
          this.isEditMode = false;
        }
      }
      return saved;
    } catch (err) {
      this.logger.error("Failed to save layout", err);
      if (!isAutoSave) {
        alert(this.translationService.translate("UE_ERROR_SAVE_FAILED"));
      }
      throw err;
    } finally {
      if (isAutoSave) {
        this.isAutoSaving = false;
      } else {
        this.isSaving = false;
      }
      this.cdr.markForCheck();
    }
  }

  onAddNewLayout(): void {
    if (this.isEditMode && this.isDirtyState()) {
      this.lifecycle.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.openNewLayoutModal();
        }
      });
    } else {
      this.openNewLayoutModal();
    }
  }

  openNewLayoutModal(): void {
    this.selectedNewLayoutTemplateId = "default_ui_layout_rc_ai";
    this.showNewLayoutModal = true;
    this.cdr.markForCheck();
  }

  onConfirmCreateLayout(templateId: string): void {
    this.showNewLayoutModal = false;
    this.startNewLayout(templateId);
  }

  onCancelCreateLayout(): void {
    this.showNewLayoutModal = false;
    this.cdr.markForCheck();
  }

  startNewLayout(templateId?: string): Promise<void> {
    return handleStartNewLayout(this, templateId);
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

  duplicateCurrentLayout(): Promise<void> {
    return handleDuplicateCurrentLayout(this);
  }

  onDeleteLayout(): void {
    if (!this.editingLayout || this.isSaving) return;
    this.showDeleteConfirm = true;
  }

  onConfirmDeleteLayout(): Promise<void> {
    return handleDeleteCurrentLayout(this);
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

  syncRacedayPreview(layout: LayoutConfig): void {
    this.racedayComp?.syncLayoutFromEditor(layout);
  }
}
