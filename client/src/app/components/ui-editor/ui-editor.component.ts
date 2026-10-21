import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  computed,
  HostListener,
  inject,
  NgZone,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, NavigationStart, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { DefaultRacedayComponent } from "@app/components/raceday/default-raceday.component";
import {
  LaneGridBounds,
  LaneGridSession,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { AudioSelectorComponent } from "@app/components/shared/audio-selector/audio-selector.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { ToolbarComponent } from "@app/components/shared/toolbar/toolbar.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { CustomUI } from "@app/models/custom-ui";
import { AudioConfig } from "@app/models/driver";
import {
  AbsoluteWidgetNode,
  LayoutConfig,
  LayoutScaleMode,
  Settings,
} from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AudioService } from "@app/services/audio.service";
import { ChildWindowManagerService } from "@app/services/child-window-manager.service";
import { CustomUiService } from "@app/services/custom-ui.service";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { FileSystemService } from "@app/services/file-system.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTTSContext } from "@app/utils/audio";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";

import { EnterPathModalComponent } from "./components/enter-path-modal/enter-path-modal";
import { ReplicateLaneDialogComponent } from "./components/replicate-lane-dialog/replicate-lane-dialog.component";
import { TemplateVariablesModalComponent } from "./components/template-variables-modal/template-variables-modal.component";
import {
  ThemeTemplateModalComponent,
  ThemeTemplateType,
} from "./components/theme-template-modal/theme-template-modal";
import {
  acknowledgeSuccessModal,
  applyLoadedUiEditorData,
  areSettingsEqual,
  areUIEditorStatesEqual,
  AspectRatioOption,
  AVAILABLE_TRANSITIONS,
  BASE_AVAILABLE_COLUMNS,
  buildUiEditorHelpContext,
  cancelDeleteCustomUiModal,
  cancelDeleteThemeModal,
  cloneUIEditorState,
  computeWidgetDisplayName,
  confirmReplicateLanesHelper,
  DEFAULT_SECTIONS_EXPANDED,
  DirectoryController,
  downloadJsonFile,
  ensureWidgetSelectedHelper,
  executeCaptureState,
  executeTemplateFileSelected,
  executeTestTtsVoice,
  extractAssetId,
  fetchUiEditorData,
  focusUiEditorElement,
  getCanvasViewportMaxHeightHelper,
  getComponentPreviewContainerHeight,
  getComponentPreviewContainerWidth,
  getComponentPreviewScaleNumber,
  getCustomUiDisplayNameKey,
  getDefaultAspectRatioOptions,
  getLayoutAspectRatio,
  getLayoutAspectRatioOptions,
  getLayoutScaleMode,
  getThemeAudioConfigForSlot,
  getThemeAudioUrl,
  getThemeDisplayNameKey,
  getUiEditorHelpSteps,
  getUnsavedReasonsHelper,
  handleAnchorSelection,
  handleAutoSaveState,
  handleBringGridToFront,
  handleCalloutSpacingChange,
  handleClearCustomTemplate,
  handleConfirmDeleteCustomUi,
  handleConfirmDeleteTheme,
  handleCreateCustomUi,
  handleCreateTheme,
  handleCustomUiSelection,
  handleDeleteGrid,
  handleDetachGrid,
  handleDetachTheme,
  handleDownloadTemplate,
  handleDuplicateCustomUi,
  handleDuplicateTheme,
  handleEditGridTemplate,
  handleFinishGridSession,
  handleLayoutChanged,
  handleMasterVolumeChange,
  handleNudgeSelectedWidget,
  handlePageTransitionChange,
  handleReMirrorGrid,
  handleRemoveSelectedWidget,
  handleSetLayoutAspectRatio,
  handleSetLayoutScaleMode,
  handleStartGridSession,
  handleSyncActiveGridSessionFromLayout,
  handleTestExport,
  handleThemeAudioChange,
  handleThemeSlotChange,
  handleTtsPitchChange,
  handleTtsRateChange,
  handleTtsVoiceChange,
  handleTtsVolumeChange,
  handleUiEditorDataLoadError,
  handleUiEditorDestroy,
  handleUiEditorHelpStep,
  handleUiEditorKeyboardShortcut,
  handleUpdateGridBounds,
  handleUrgentQueueTtlChange,
  handleWidgetColorChange,
  handleWidgetHeightChange,
  handleWidgetInspectorChange,
  handleWidgetSelection,
  handleWidgetWidthChange,
  handleWidgetXChange,
  handleWidgetYChange,
  initAvailableVoices,
  isCountdownPreviewActiveHelper,
  isCustomUiDefault,
  isCustomUiNameInvalid,
  isThemeDefault,
  isThemeNameDuplicate,
  isThemeNameInvalid,
  isWidgetHeightAutoCalculated,
  isWidgetWidthAutoCalculated,
  LayoutActionsController,
  LayoutZoomController,
  loadExpanderStateFromStorage,
  MAIN_AUDIO_SLOTS,
  MigrationController,
  MOCK_RACEDAY_PROPERTIES,
  openDeleteCustomUiModal,
  openDeleteThemeModal,
  openReplicateLaneModalHelper,
  openSuccessModal,
  refreshUiEditorDisplayProperties,
  resolveActiveLayout,
  resolveBackNavigation,
  resolveThemeAsset,
  resolveThemeFlag,
  resolveThemeFuelGauge,
  resolveThemeLamp,
  restoreOpenLayoutOnEntry,
  saveExpanderStateToStorage,
  scrollToThemeElement,
  scrollToUiElement,
  sortAvailableColumnsList,
  syncEditorCoordinates,
  toggleCountdownPreviewHelper,
  toggleThemeExpander,
  toggleUiExpander,
  UIEditorState,
} from "./ui-editor-helpers";
import { WidgetInspectorFieldsComponent } from "./widget-inspector-fields/widget-inspector-fields.component";

export { BASE_AVAILABLE_COLUMNS, UIEditorState } from "./ui-editor-constants";

@Component({
  standalone: true,
  selector: "app-ui-editor",
  templateUrl: "./ui-editor.component.html",
  styleUrl: "./ui-editor.component.css",
  imports: [
    CommonModule,
    EditorTitleComponent,
    FormsModule,
    ImageSelectorComponent,
    AudioSelectorComponent,
    ToolbarComponent,
    ConfirmationModalComponent,
    TranslatePipe,
    AcknowledgementModalComponent,
    DefaultRacedayComponent,
    WidgetInspectorFieldsComponent,
    ThemeTemplateModalComponent,
    TemplateVariablesModalComponent,
    EnterPathModalComponent,
    ReplicateLaneDialogComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    AutoSelectDefaultDirective,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class UIEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  private translationSubscription: Subscription | null = null;
  private helpSubscription: Subscription | null = null;
  isLoading = true;
  isSaving = false;
  private getSaveDelay = () => 0;
  saveTimeout: any;
  autoSaveTimeout: any;
  isAutoSaving = false;
  get activeAutoSavePromise(): Promise<any> | null {
    return this.lifecycle?.activeSavePromise ?? null;
  }
  set activeAutoSavePromise(p: Promise<any> | null) {
    if (this.lifecycle) {
      this.lifecycle.activeSavePromise = p;
    }
  }
  scale = 1;
  assets: any[] = [];
  private params = toSignal(this.route.queryParams);

  backTargetUrl = computed(
    () => resolveBackNavigation(this.params, this.route).targetUrl,
  );

  backQueryParams = computed(
    () => resolveBackNavigation(this.params, this.route).queryParams,
  );

  state!: UIEditorState;
  editingState!: UIEditorState;
  displayThemes: Theme[] = [];
  displayCustomUIs: CustomUI[] = [];
  activeCustomUiId = "default_ui_layout_rc_ai";

  get activeCustomUi(): CustomUI | undefined {
    return (
      this.displayCustomUIs.find(
        (u) => u.entity_id === this.activeCustomUiId,
      ) || this.displayCustomUIs[0]
    );
  }

  showThemeTemplateModal = false;
  showTemplateVariablesModal = false;
  showReplicateLaneModal = false;
  activeGridSession: LaneGridSession | null = null;
  maxTrackLanes = 0;
  replicateBindingMode: "lane" | "position" = "lane";
  replicateSourceIndex = 0;
  replicateDefaultCount = 4;
  replicateTargetUi?: CustomUI;
  displayColumnSlots: any[] = [];
  get isCurrentLayoutPractice() {
    return this.activeCustomUiId === "practice_ui_layout_rc_ai";
  }
  get currentSelectedWidget(): any | null {
    const layout = this.getLayout(this.activeCustomUi);
    return this.selectedWidgetId && layout?.widgets
      ? layout.widgets.find((w: any) => w.id === this.selectedWidgetId) || null
      : null;
  }
  get activeLayoutTitleKey() {
    return this.isCurrentLayoutPractice
      ? "UE_LABEL_RACEDAY_LAYOUT_PRACTICE"
      : "UE_LABEL_RACEDAY_LAYOUT";
  }
  get editingSettings() {
    return this.editingState?.settings;
  }
  customDirectoryName: string | null = null;
  customDirectoryPath: string | null = null;
  customWidgetDirectoryPath: string | null = null;
  showEnterPathModal = false;
  enterPathType: "ui" | "widgets" | null = null;
  manualPathInput = "";
  enterPathError: string | null = null;
  isNavigationApproved = false;
  get hasLaneViewWidget() {
    return !!this.getLayout(this.activeCustomUi)?.widgets?.some(
      (w) => w.widgetType === "lane-view",
    );
  }

  migrationController = new MigrationController(this);

  get dismissedMigrationUis(): Set<string> {
    return this.migrationController.dismissedMigrationUis;
  }
  set dismissedMigrationUis(val: Set<string>) {
    this.migrationController.dismissedMigrationUis = val;
  }
  saveDismissedMigrationUis(): void {
    this.migrationController.saveDismissedMigrationUis();
  }
  isPreMigrationBackup(ui: CustomUI): boolean {
    return this.migrationController.isPreMigrationBackup(ui);
  }
  hasAvailablePreMigrationBackup(ui: CustomUI): boolean {
    return this.migrationController.hasAvailablePreMigrationBackup(ui);
  }

  get customUIs(): CustomUI[] {
    return this.displayCustomUIs?.length > 0
      ? this.displayCustomUIs
      : this.editingState?.customUIs || [];
  }

  isMigratedLayout(ui: CustomUI): boolean {
    return this.migrationController.isMigratedLayout(ui);
  }
  canUpgradeLegacyHeatView(ui: CustomUI): boolean {
    return this.migrationController.canUpgradeLegacyHeatView(ui);
  }
  canReopenMigrationBanner(ui: CustomUI): boolean {
    return this.migrationController.canReopenMigrationBanner(ui);
  }
  dismissMigrationBanner(ui: CustomUI): void {
    this.migrationController.dismissMigrationBanner(ui);
  }
  reopenMigrationBanner(ui: CustomUI): void {
    this.migrationController.reopenMigrationBanner(ui);
  }

  showSuccessModal = false;
  successModalTitle = "";
  successModalMessage = "";
  successModalParams: any = {};
  themeToCollapseAfterSuccess: string | null = null;
  showDeleteConfirm = false;
  themeToDelete: Theme | null = null;
  deleteThemeParams: any = {};
  showDeleteUiConfirm = false;
  uiToDelete: CustomUI | null = null;
  deleteUiParams: any = {};
  defaultThemeNames: { [id: string]: string } = {};
  defaultUiNames: { [id: string]: string } = {};
  lifecycle!: EditorLifecycleHelper;

  get showDiscardConfirm(): boolean {
    return this.lifecycle.showDiscardConfirm;
  }
  set showDiscardConfirm(val: boolean) {
    this.lifecycle.showDiscardConfirm = val;
  }

  get pendingDeactivate(): ((result: boolean) => void) | null {
    return this.lifecycle.pendingDeactivate;
  }
  set pendingDeactivate(val: ((result: boolean) => void) | null) {
    this.lifecycle.pendingDeactivate = val;
  }

  layoutAspectRatioOptions: AspectRatioOption[] =
    getDefaultAspectRatioOptions();
  availableColumns: { key: string; label: string }[] = [
    ...BASE_AVAILABLE_COLUMNS,
  ];
  availableTransitions = AVAILABLE_TRANSITIONS;
  undoManager!: UndoManager<UIEditorState>;
  sectionsExpanded: { [key: string]: boolean } = {
    ...DEFAULT_SECTIONS_EXPANDED,
  };
  mainAudioSlots = MAIN_AUDIO_SLOTS;

  track: any = MOCK_RACEDAY_PROPERTIES.track;
  selectedWidgetId: string | null = null;
  soundAssets: any[] = [];
  previewTTSContext: any = mockTTSContext();
  customWidgetDirectoryName: string | null = null;
  availableVoices: SpeechSynthesisVoice[] = [];
  private pendingNavigationUrl = "";
  private childWindowManagerService: ChildWindowManagerService;
  private audioService?: AudioService;

  constructor(
    private settingsService: SettingsService,
    private fileSystem: FileSystemService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public themeService: ThemeService,
    public customUiService: CustomUiService,
    private translationService: TranslationService,
    private logger: LoggerService,
    private route: ActivatedRoute,
    private raceConnectionService: RaceConnectionService,
    private helpService: HelpService,
    private ngZone: NgZone,
    childWindowManagerService?: ChildWindowManagerService,
    public customWidgetService?: CustomWidgetService,
    audioService?: AudioService,
  ) {
    this.childWindowManagerService =
      childWindowManagerService ?? inject(ChildWindowManagerService);
    this.customWidgetService =
      customWidgetService ??
      inject(CustomWidgetService, { optional: true }) ??
      undefined;
    this.audioService =
      audioService ?? inject(AudioService, { optional: true }) ?? undefined;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart)
        this.pendingNavigationUrl = event.url;
    });

    this.undoManager = new UndoManager<UIEditorState>(
      {
        clonner: (s) => cloneUIEditorState(s),
        equalizer: (a, b) => areUIEditorStatesEqual(a, b),
        applier: (s) => {
          syncEditorCoordinates(s.settings, this.editingState?.settings);
          this.editingState = s;
          this.refreshDisplayProperties();
          handleSyncActiveGridSessionFromLayout(this);
          const currentLayout = this.getLayout(this.activeCustomUi);
          if (currentLayout) {
            this.syncRacedayPreview(currentLayout, this.activeCustomUi);
          }
        },
      },
      () => this.editingState,
    );

    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
      undoManager: this.undoManager,
      hasChanges: () => this.hasChanges(),
      isSaveValid: () =>
        !this.isAnyThemeNameInvalid() && !this.isAnyCustomUiNameInvalid(),
      isSaving: () => this.isSaving,
      onAutoSave: () => this.autoSaveState(),
      autoSaveOnDiscard: true,
      logger: this.logger,
    });
  }

  ngOnInit() {
    this.loadAvailableVoices();
    this.sortAvailableColumns();
    this.updateScale();
    this.loadExpanderState();
    this.loadData();
    if (
      this.customWidgetService &&
      this.customWidgetService.getCustomWidgets().length === 0
    ) {
      this.customWidgetService.reloadCustomWidgets().catch(() => {});
    }
    this.raceConnectionService.connect();

    this.undoManager?.stateCommitted$.subscribe(() =>
      this.autoSaveState().catch(() => {}),
    );
    this.translationSubscription = this.translationService
      .getTranslationsLoaded()
      .subscribe((loaded) => {
        if (loaded) {
          this.sortAvailableColumns();
          if (!this.isDestroyed) this.cdr.markForCheck();
        }
      });

    this.helpSubscription = this.helpService.currentStep$.subscribe((step) => {
      if (handleUiEditorHelpStep(step, this.sectionsExpanded)) {
        this.saveExpanderState();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = null;
    }
    handleUiEditorDestroy(this);
  }

  @HostListener("window:pagehide", ["$event"])
  onPageHide(_event: any) {
    this.raceConnectionService.disconnect();
    this.childWindowManagerService.closeAllWindows();
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
    const opt = this.layoutAspectRatioOptions.find(
      (o) => o.ratio === "current",
    );
    if (opt) {
      opt.width = window.innerWidth;
      opt.height = window.innerHeight;
    }
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    handleUiEditorKeyboardShortcut(
      event,
      () => this.undo(),
      () => this.redo(),
      () => this.removeSelectedWidget(),
      (dx, dy) => this.nudgeSelectedWidget(dx, dy),
    );
  }

  private updateScale() {
    this.scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
  }

  loadData() {
    this.isLoading = true;
    this.dataSubscription = fetchUiEditorData(
      this.dataService,
      this.fileSystem,
    ).subscribe({
      next: (res: any) => applyLoadedUiEditorData(this, res),
      error: (err: any) => handleUiEditorDataLoadError(this, err),
    });
  }

  parsedLayouts = new Map<string, LayoutConfig>();

  refreshDisplayProperties() {
    refreshUiEditorDisplayProperties(this);
  }

  restoreOpenLayoutStateAndScroll(): void {
    restoreOpenLayoutOnEntry(this);
  }

  trackByThemeId(_index: number, theme: Theme) {
    return theme.entity_id;
  }
  getSelectedWidgetId(ui: CustomUI) {
    return this.activeCustomUiId === ui.entity_id
      ? this.selectedWidgetId
      : null;
  }
  get selectedWidget(): any | null {
    const layout = this.getLayout(this.activeCustomUi);
    return this.selectedWidgetId && layout?.widgets
      ? layout.widgets.find((w: any) => w.id === this.selectedWidgetId) || null
      : null;
  }

  selectedAnchor: string | null = null;

  onWidgetSelected(id: string | null, ui?: CustomUI) {
    handleWidgetSelection(this, id, ui);
  }

  onAnchorSelected(
    event: { widgetId: string; anchor: string | null },
    ui?: CustomUI,
  ) {
    handleAnchorSelection(this, event, ui);
  }

  onSelectedAnchorChange(anchor: string | null) {
    this.selectedAnchor = anchor;
    this.cdr.markForCheck();
  }

  countdownPreviewActiveByUi: Record<string, boolean> = {};

  isCountdownPreviewActive = (ui?: CustomUI): boolean =>
    isCountdownPreviewActiveHelper(this, ui);

  toggleCountdownPreview = (ui?: CustomUI): void => {
    toggleCountdownPreviewHelper(this, ui);
  };

  getLayoutWidgets(ui?: CustomUI): AbsoluteWidgetNode[] {
    const layout = this.getLayout(ui);
    return layout?.widgets || [];
  }

  getWidgetDisplayName(widget: AbsoluteWidgetNode): string {
    return computeWidgetDisplayName(
      widget,
      this.translationService,
      this.availableColumns,
      (w) => this.getWidgetTypeLabelKey(w),
      this.selectedAnchor,
    );
  }

  onWidgetDropdownSelect = (widgetId: string, ui?: CustomUI) =>
    this.onWidgetSelected(widgetId || null, ui);
  onTextColorChange = (event: Event) =>
    handleWidgetColorChange(this, "textColor", event);
  onBackgroundColorChange = (event: Event) =>
    handleWidgetColorChange(this, "backgroundColor", event);

  isCustomUiPractice(ui?: CustomUI) {
    if (!ui) return this.isCurrentLayoutPractice;
    return (
      ui.entity_id === "practice_ui_layout_rc_ai" ||
      (ui.name || "").toLowerCase().includes("practice")
    );
  }

  getLayout(ui?: CustomUI): LayoutConfig | undefined {
    return resolveActiveLayout(
      ui || this.activeCustomUi,
      this.editingSettings,
      this.parsedLayouts,
    );
  }

  getLayoutBaseWidth(ui?: CustomUI) {
    return this.getLayout(ui)?.baseWidth || 1920;
  }
  getLayoutBaseHeight(ui?: CustomUI) {
    return this.getLayout(ui)?.baseHeight || 1080;
  }

  onLayoutChanged(newLayout: any, ui?: CustomUI) {
    handleLayoutChanged(this, newLayout, ui);
  }

  @ViewChildren(DefaultRacedayComponent)
  racedayComponents!: QueryList<DefaultRacedayComponent>;

  onWidgetInspectorChange(widget?: any, ui?: CustomUI) {
    handleWidgetInspectorChange(this, widget, ui);
  }

  syncRacedayPreview(layout: any, targetUi?: CustomUI): void {
    if (!layout || !this.racedayComponents) return;
    const uiId = (targetUi || this.activeCustomUi)?.entity_id;
    const targetComp =
      this.racedayComponents.find(
        (rc) => rc.activeCustomUi()?.entity_id === uiId,
      ) || this.racedayComponents.first;
    if (targetComp) {
      targetComp.syncLayoutFromEditor(layout);
    }
  }

  onReplicateLanes = (opts: any, ui?: CustomUI) =>
    this.startGridSession(opts, ui);
  startGridSession = (opts: any, ui?: CustomUI) =>
    handleStartGridSession(this, opts, ui);
  finishGridSession = (ui?: CustomUI) => handleFinishGridSession(this, ui);
  onGridBoundsChange = (b: LaneGridBounds, ui?: CustomUI) =>
    handleUpdateGridBounds(this, b, ui);
  onEditGridTemplate = (id: string, ui?: CustomUI) =>
    handleEditGridTemplate(this, id, ui);
  onDetachGrid = (id: string, ui?: CustomUI) => handleDetachGrid(this, id, ui);
  onDeleteGrid = (id: string, ui?: CustomUI) => handleDeleteGrid(this, id, ui);
  onReMirrorGrid = (id: string, ui?: CustomUI) =>
    handleReMirrorGrid(this, id, ui);
  onBringGridToFront = (id: string, ui?: CustomUI) =>
    handleBringGridToFront(this, id, ui);

  openReplicateLaneModal = (ui?: CustomUI): void => {
    openReplicateLaneModalHelper(this, ui);
  };

  onConfirmReplicateLanes = (options: any): void => {
    confirmReplicateLanesHelper(this, options);
  };

  removeSelectedWidget = (ui?: CustomUI) =>
    handleRemoveSelectedWidget(this, ui);
  nudgeSelectedWidget = (dx: number, dy: number, ui?: CustomUI) =>
    handleNudgeSelectedWidget(this, dx, dy, ui);
  onWidgetXChange = (value: any, widget: any, ui?: CustomUI) =>
    handleWidgetXChange(this, value, widget, ui);
  onWidgetYChange = (value: any, widget: any, ui?: CustomUI) =>
    handleWidgetYChange(this, value, widget, ui);
  onWidgetWidthChange = (value: any, widget: any, ui?: CustomUI) =>
    handleWidgetWidthChange(this, value, widget, ui);
  onWidgetHeightChange = (value: any, widget: any, ui?: CustomUI) =>
    handleWidgetHeightChange(this, value, widget, ui);

  isWidgetHeightAutoCalculated = (widget: any) =>
    isWidgetHeightAutoCalculated(widget, this.activeGridSession);

  isWidgetWidthAutoCalculated = (widget: any) =>
    isWidgetWidthAutoCalculated(widget, this.activeGridSession);

  layoutActionsController = new LayoutActionsController(this);

  onRacedayLayoutChanged = (newLayout: any) =>
    this.layoutActionsController.onRacedayLayoutChanged(newLayout);
  onPracticeRacedayLayoutChanged = (newLayout: any) =>
    this.layoutActionsController.onPracticeRacedayLayoutChanged(newLayout);
  getScaledDefaultLayout = (isPractice = false) =>
    this.layoutActionsController.getScaledDefaultLayout(isPractice);
  getTargetCustomUi = (kind?: "practice" | "raceday" | "current") =>
    this.layoutActionsController.getTargetCustomUi(kind);

  resetCurrentLayout = () => this.layoutActionsController.resetCurrentLayout();
  exportCurrentLayout = () =>
    this.layoutActionsController.exportCurrentLayout();
  onImportCurrentLayout = (event: Event) =>
    this.layoutActionsController.onImportCurrentLayout(event);

  onColumnsChanged(_ui?: CustomUI) {
    this.captureState();
  }

  resetLayout = (ui: CustomUI) => this.layoutActionsController.resetLayout(ui);
  clearLayout = (ui: CustomUI) => this.layoutActionsController.clearLayout(ui);
  clearCurrentLayout = () => this.layoutActionsController.clearCurrentLayout();
  resetRacedayLayout = () => this.layoutActionsController.resetRacedayLayout();
  resetPracticeRacedayLayout = () =>
    this.layoutActionsController.resetPracticeRacedayLayout();
  exportLayout = (ui: CustomUI) =>
    this.layoutActionsController.exportLayout(ui);
  downloadJson = (data: any, filename: string) =>
    downloadJsonFile(data, filename);
  exportRacedayLayout = () =>
    this.layoutActionsController.exportRacedayLayout();
  exportPracticeRacedayLayout = () =>
    this.layoutActionsController.exportPracticeRacedayLayout();
  onImportLayout = (event: Event, ui: CustomUI) =>
    this.layoutActionsController.onImportLayout(event, ui);
  onImportRacedayLayout = (event: Event) =>
    this.layoutActionsController.onImportRacedayLayout(event);
  onImportPracticeRacedayLayout = (event: Event) =>
    this.layoutActionsController.onImportPracticeRacedayLayout(event);

  showRestoreBackupConfirm = false;
  pendingRestoreBackupUi: CustomUI | null = null;
  showUpgradeHeatViewConfirm = false;
  pendingUpgradeHeatViewUi: CustomUI | null = null;

  restorePreMigrationBackup = (ui: CustomUI) =>
    this.migrationController.restorePreMigrationBackup(ui);
  confirmRestorePreMigrationBackup = () =>
    this.migrationController.confirmRestorePreMigrationBackup();
  cancelRestorePreMigrationBackup = () =>
    this.migrationController.cancelRestorePreMigrationBackup();
  upgradeLegacyHeatView = (ui: CustomUI) =>
    this.migrationController.upgradeLegacyHeatView(ui);
  confirmUpgradeLegacyHeatView = () =>
    this.migrationController.confirmUpgradeLegacyHeatView();
  cancelUpgradeLegacyHeatView = () =>
    this.migrationController.cancelUpgradeLegacyHeatView();
  exportMigrationDiagnostics = (ui: CustomUI) =>
    this.migrationController.exportMigrationDiagnostics(ui);

  areSettingsEqual(a: Settings, b: Settings) {
    return areSettingsEqual(a, b);
  }

  directoryController = new DirectoryController(this);

  selectDirectory = () => this.directoryController.selectDirectory();
  resetDefault = () => this.directoryController.resetDefault();
  selectWidgetDirectory = () =>
    this.directoryController.selectWidgetDirectory();
  resetWidgetDefault = () => this.directoryController.resetWidgetDefault();
  exportStarterWidgets = () => this.directoryController.exportStarterWidgets();
  updateSampleWidgets = () => this.directoryController.updateSampleWidgets();
  promptEnterPath = (type: "ui" | "widgets") =>
    this.directoryController.promptEnterPath(type);
  cancelEnterPathModal = () => this.directoryController.cancelEnterPathModal();
  confirmEnterPath = (path?: string) =>
    this.directoryController.confirmEnterPath(path);

  save() {
    this.isSaving = true;
    this.settingsService.saveSettings(this.editingSettings);
    this.saveTimeout = setTimeout(() => {
      this.isSaving = false;
      this.undoManager.resetTracking(this.editingState);
      if (!this.isDestroyed) this.cdr.markForCheck();
    }, this.getSaveDelay());
  }

  private autoSaveState(): Promise<void> {
    return handleAutoSaveState(this);
  }

  getUnsavedReasons(): string[] {
    return getUnsavedReasonsHelper(this);
  }

  get discardMessage(): string {
    return this.lifecycle.discardMessage;
  }

  confirmDiscard(): Promise<boolean> {
    return this.lifecycle.confirmDiscard();
  }

  onConfirmDiscard() {
    this.lifecycle.onConfirmDiscard();
  }

  onCancelDiscard() {
    this.lifecycle.onCancelDiscard();
  }

  async onBack() {
    if (this.hasChanges()) {
      await this.autoSaveState();
    }
    this.isNavigationApproved = true;
    this.router.navigate([this.backTargetUrl()], {
      queryParams: this.backQueryParams(),
    });
  }

  hasChanges() {
    return this.undoManager.hasChanges();
  }
  undo() {
    this.undoManager.undo();
  }
  redo() {
    this.undoManager.redo();
  }
  captureState() {
    executeCaptureState(this);
  }

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveExpanderState();
  }

  toggleThemeSection(themeId: string, activate = false) {
    const isExpanding = !this.sectionsExpanded[`theme_${themeId}`];
    toggleThemeExpander(
      themeId,
      this.displayThemes,
      this.sectionsExpanded,
      activate,
      this.editingSettings.activeThemeId,
      (id) => this.onThemeSelected(id),
    );
    if (isExpanding) {
      this.scrollToTheme(themeId);
    }
  }

  scrollToTheme = (themeId: string) => scrollToThemeElement(themeId, this.cdr);

  saveExpanderState = () =>
    saveExpanderStateToStorage(this.sectionsExpanded, this.logger);
  loadExpanderState = () => {
    this.sectionsExpanded = loadExpanderStateFromStorage(this.sectionsExpanded);
  };
  isThemeNameInvalid(theme: Theme) {
    return isThemeNameInvalid(theme, this.displayThemes);
  }
  isThemeNameDuplicate(theme: Theme) {
    return isThemeNameDuplicate(theme, this.displayThemes);
  }
  isAnyThemeNameInvalid() {
    return this.displayThemes.some((t) => this.isThemeNameInvalid(t));
  }
  getWidgetTypeLabelKey(w: string) {
    if (w?.startsWith("custom:")) {
      const def = this.customWidgetService?.getWidgetDefinition(w);
      return def?.manifest?.name || w.substring("custom:".length);
    }
    return "UE_WIDGET_TYPE_" + w.toUpperCase().replace(/-/g, "_");
  }
  isCustomWidget(w: string | undefined): boolean {
    return w?.startsWith("custom:") ?? false;
  }
  get activeTheme() {
    return this.themeService.getActiveTheme();
  }
  get isThemeActive() {
    return this.themeService.isThemeActive();
  }

  private sortAvailableColumns() {
    sortAvailableColumnsList(this.availableColumns, this.translationService);
  }

  async loadThemes() {
    await this.themeService.refresh();
  }
  async onThemeSelected(themeId: string) {
    this.editingSettings.activeThemeId = themeId;
    this.themeService.setActiveTheme(themeId);
    this.captureState();
    if (!this.isDestroyed) this.cdr.markForCheck();
  }

  getFlagUrl = (slot: string, theme?: Theme) =>
    resolveThemeFlag(this, slot, theme);
  getLampUrl = (slot: string, theme?: Theme) =>
    resolveThemeLamp(this, slot, theme);
  getFuelGaugeUrl = (theme?: Theme) => resolveThemeFuelGauge(this, theme);
  getAudioUrl = (slot: string, theme: Theme) =>
    getThemeAudioUrl(slot, theme, this.dataService, this.assets);
  getAssetForSlot = (slot: string, theme?: Theme) =>
    resolveThemeAsset(this, slot, theme);

  onTemplateFileSelected = (event: Event) => {
    executeTemplateFileSelected(event, this.editingSettings, () => {
      this.captureState();
      this.cdr.markForCheck();
    });
  };

  clearCustomTemplate = () => handleClearCustomTemplate(this);
  openTemplateVariablesModal = () => {
    this.showTemplateVariablesModal = true;
  };
  downloadTemplate = () => handleDownloadTemplate(this);
  testExport = () => handleTestExport(this);
  onPageTransitionChange = (t: string) => handlePageTransitionChange(this, t);
  onMasterVolumeChange = (v: number | string) =>
    handleMasterVolumeChange(this, v);
  onUrgentQueueTtlChange = (t: number) => handleUrgentQueueTtlChange(this, t);
  onCalloutSpacingChange = (s: number) => handleCalloutSpacingChange(this, s);
  loadAvailableVoices = () => initAvailableVoices(this);
  onTtsVoiceChange = (v: string) => handleTtsVoiceChange(this, v);
  onTtsRateChange = (r: number | string) => handleTtsRateChange(this, r);
  onTtsPitchChange = (p: number | string) => handleTtsPitchChange(this, p);
  onTtsVolumeChange = (v: number | string) => handleTtsVolumeChange(this, v);
  testTtsVoice = () => executeTestTtsVoice(this);

  onThemeSlotChanged = (theme: Theme, slot: string, asset: any) =>
    handleThemeSlotChange(this, theme, slot, asset);

  getAudioConfigForSlot = (slot: string, theme: Theme): AudioConfig =>
    getThemeAudioConfigForSlot(slot, theme);

  onAudioConfigChanged = (
    theme: Theme,
    slot: string,
    field: "type" | "url" | "text",
    value: any,
  ) => handleThemeAudioChange(this, theme, slot, field, value);

  onAudioAssetSelected = (theme: Theme, slot: string, asset: any) => {
    this.onAudioConfigChanged(theme, slot, "url", extractAssetId(asset));
  };

  ensureWidgetSelected(ui?: CustomUI) {
    ensureWidgetSelectedHelper(this, ui);
  }

  onCustomUiSelected(uiId: string) {
    handleCustomUiSelection(this, uiId);
  }

  getCustomUiDisplayNameKey = (ui: CustomUI) =>
    getCustomUiDisplayNameKey(ui, this.translationService);
  isCustomUiDefault = (ui: CustomUI) => isCustomUiDefault(ui);
  toggleUiSection(uiId: string) {
    const isExpanding = !this.sectionsExpanded[`ui_${uiId}`];
    toggleUiExpander(uiId, this.displayCustomUIs, this.sectionsExpanded, (id) =>
      this.onCustomUiSelected(id),
    );
    if (isExpanding) {
      this.scrollToUi(uiId);
    }
  }

  scrollToUi = (uiId: string, delay = 50) => {
    scrollToUiElement(uiId, this.cdr, delay);
  };

  createNewCustomUi = () => handleCreateCustomUi(this);
  onDuplicateCustomUi = (ui: CustomUI) => handleDuplicateCustomUi(this, ui);
  onDeleteCustomUi = (ui: CustomUI) => openDeleteCustomUiModal(this, ui);
  cancelDeleteCustomUi = () => cancelDeleteCustomUiModal(this);
  confirmDeleteCustomUi = () => handleConfirmDeleteCustomUi(this);
  onCustomUiNameChanged = (_ui: CustomUI) => this.onEntityNameChanged();
  isCustomUiNameInvalid = (ui: CustomUI) =>
    isCustomUiNameInvalid(ui, this.displayCustomUIs);
  isAnyCustomUiNameInvalid = () =>
    this.displayCustomUIs.some((ui) => this.isCustomUiNameInvalid(ui));
  getThemeDisplayNameKey = (theme: Theme) =>
    getThemeDisplayNameKey(theme, this.translationService);
  isThemeDefault = (theme: Theme) => isThemeDefault(theme);

  focusUiNameInput = (entityId: string): void => {
    focusUiEditorElement(`custom-ui-name-input-${entityId}`);
  };

  focusThemeNameInput = (entityId: string): void => {
    focusUiEditorElement(`theme-name-input-${entityId}`);
  };

  openSuccessModal = (
    params?: { title?: string; message?: string; params?: any },
    collapseThemeId: string | null = null,
    focusThemeId: string | null = null,
  ) => openSuccessModal(this, params, collapseThemeId, focusThemeId);

  createNewTheme = () => handleCreateTheme(this);
  async onConfirmThemeTemplate(_templateType: ThemeTemplateType) {
    this.showThemeTemplateModal = false;
    await this.createNewTheme();
  }
  onThemeNameChanged = (_theme: Theme) => this.onEntityNameChanged();

  private onEntityNameChanged() {
    this.captureState();
    this.refreshDisplayProperties();
    this.cdr.markForCheck();
  }
  onDuplicateTheme = (theme: Theme) => handleDuplicateTheme(this, theme);
  onDeleteTheme = (theme: Theme) => openDeleteThemeModal(this, theme);
  onConfirmDeleteTheme = () => handleConfirmDeleteTheme(this);
  onCancelDeleteTheme = () => cancelDeleteThemeModal(this);
  onSuccessModalAcknowledge = () => acknowledgeSuccessModal(this);
  onDetachTheme = () => handleDetachTheme(this);

  getLayoutAspectRatio = (ui?: CustomUI) =>
    getLayoutAspectRatio(this.getLayout(ui));
  getLayoutAspectRatioOptions = (ui?: CustomUI) =>
    getLayoutAspectRatioOptions(
      this.layoutAspectRatioOptions,
      this.getLayout(ui),
    );
  setLayoutAspectRatio = (ratio: string, ui?: CustomUI) =>
    handleSetLayoutAspectRatio(this, ratio, ui);
  getLayoutScaleMode = (ui?: CustomUI) =>
    getLayoutScaleMode(this.getLayout(ui));
  setLayoutScaleMode = (mode: LayoutScaleMode, ui?: CustomUI) =>
    handleSetLayoutScaleMode(this, mode, ui);

  zoomController = new LayoutZoomController(this);

  get layoutZoomMap(): Map<string, number> {
    return this.zoomController.layoutZoomMap;
  }
  getLayoutZoom(ui?: CustomUI): number {
    return this.zoomController.getZoom(ui);
  }
  setLayoutZoom(zoom: number, ui?: CustomUI): void {
    this.zoomController.setZoom(zoom, ui);
  }
  stepZoom(delta: number, ui?: CustomUI): void {
    this.zoomController.step(delta, ui);
  }
  resetLayoutZoom(ui?: CustomUI): void {
    this.zoomController.reset(ui);
  }
  onZoomInput(event: Event, ui?: CustomUI): void {
    this.zoomController.onInput(event, ui);
  }
  getCanvasViewportMaxHeight(_ui?: CustomUI): number {
    return getCanvasViewportMaxHeightHelper();
  }
  getInspectorHeight(ui?: CustomUI): number {
    return this.zoomController.getInspectorHeight(ui);
  }
  getPreviewScale(ui?: CustomUI): string {
    return this.zoomController.getPreviewScale(ui);
  }
  getPreviewScaleNumber(ui?: CustomUI): number {
    return getComponentPreviewScaleNumber(this, ui);
  }
  getPreviewContainerWidth(ui?: CustomUI): number {
    return getComponentPreviewContainerWidth(this, ui);
  }
  getPreviewContainerHeight(ui?: CustomUI): number {
    return getComponentPreviewContainerHeight(this, ui);
  }

  getHelpSteps(): GuideStep[] {
    return getUiEditorHelpSteps(buildUiEditorHelpContext(this));
  }
}
