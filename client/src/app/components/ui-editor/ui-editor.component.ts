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
  handleDetachGrid,
  handleEditGridTemplate,
  handleFinishGridSession,
  handleStartGridSession,
  handleUpdateGridBounds,
} from "./ui-editor-grid.helper";
import {
  acknowledgeSuccessModal,
  applyLoadedUiEditorData,
  areSettingsEqual,
  areUIEditorStatesEqual,
  AspectRatioOption,
  AVAILABLE_TRANSITIONS,
  BASE_AVAILABLE_COLUMNS,
  buildDisplayColumnSlots,
  buildUiEditorHelpContext,
  cancelDeleteCustomUiModal,
  cancelDeleteThemeModal,
  cloneUIEditorState,
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
  findDefaultWidgetId,
  focusUiEditorElement,
  getCanvasViewportMaxHeightHelper,
  getComponentPreviewContainerHeight,
  getComponentPreviewContainerWidth,
  getComponentPreviewScaleNumber,
  getCustomUiDisplayNameKey,
  getDefaultAspectRatioOptions,
  getDefaultLayoutResetData,
  getLayoutAspectRatio,
  getLayoutAspectRatioOptions,
  getLayoutScaleMode,
  getThemeAudioConfigForSlot,
  getThemeAudioUrl,
  getThemeDisplayNameKey,
  getUiEditorHelpSteps,
  getUnsavedReasonsHelper,
  handleAutoSaveState,
  handleCalloutSpacingChange,
  handleClearCurrentLayout,
  handleClearCustomTemplate,
  handleClearLayout,
  handleConfirmDeleteCustomUi,
  handleConfirmDeleteTheme,
  handleConfirmDiscard,
  handleCreateCustomUi,
  handleCreateTheme,
  handleCustomUiSelection,
  handleDetachTheme,
  handleDownloadTemplate,
  handleDuplicateCustomUi,
  handleDuplicateTheme,
  handleExportCurrentLayout,
  handleExportLayout,
  handleExportPracticeRacedayLayout,
  handleExportRacedayLayout,
  handleImportCurrentLayout,
  handleImportLayout,
  handleImportPracticeRacedayLayout,
  handleImportRacedayLayout,
  handleMasterVolumeChange,
  handlePageTransitionChange,
  handleResetCurrentLayout,
  handleResetLayout,
  handleResetPracticeRacedayLayout,
  handleResetRacedayLayout,
  handleSetLayoutAspectRatio,
  handleSetLayoutScaleMode,
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
  handleUrgentQueueTtlChange,
  handleWidgetColorChange,
  handleWidgetInspectorChange,
  handleWidgetSelection,
  initAvailableVoices,
  isCustomUiDefault,
  isCustomUiNameInvalid,
  isThemeDefault,
  isThemeNameDuplicate,
  isThemeNameInvalid,
  LayoutZoomController,
  loadExpanderStateFromStorage,
  MAIN_AUDIO_SLOTS,
  MOCK_RACEDAY_PROPERTIES,
  openDeleteCustomUiModal,
  openDeleteThemeModal,
  openReplicateLaneModalHelper,
  openSuccessModal,
  resolveActiveLayout,
  resolveTargetCustomUi,
  resolveThemeAsset,
  resolveThemeFlag,
  resolveThemeFuelGauge,
  resolveThemeLamp,
  saveExpanderStateToStorage,
  scrollToThemeElement,
  sortAvailableColumnsList,
  sortCustomUisForDisplay,
  sortThemesForDisplay,
  syncEditorCoordinates,
  toggleThemeExpander,
  toggleUiExpander,
  UIEditorState,
  updateLayoutOnModel,
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
  private helpSubscription: Subscription | null = null;
  isLoading = true;
  isSaving = false;
  private getSaveDelay = () => 0;
  saveTimeout: any;
  autoSaveTimeout: any;
  isAutoSaving = false;
  scale = 1;
  assets: any[] = [];
  private params = toSignal(this.route.queryParams);

  backTargetUrl = computed(() => {
    const p = this.params();
    const from = p?.["from"] || this.route.snapshot.queryParamMap.get("from");
    const ret =
      p?.["returnUrl"] || this.route.snapshot.queryParamMap.get("returnUrl");
    return from === "modify-heats"
      ? ret || "/default-raceday"
      : ret || "/raceday-setup";
  });

  backQueryParams = computed(() => {
    const from =
      this.params()?.["from"] || this.route.snapshot.queryParamMap.get("from");
    return from === "modify-heats" ? { modifyHeats: "true" } : {};
  });

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
        },
      },
      () => this.editingState,
    );

    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
    });
  }

  ngOnInit() {
    this.loadAvailableVoices();
    this.sortAvailableColumns();
    this.updateScale();
    this.loadExpanderState();
    this.loadData();
    this.raceConnectionService.connect();

    this.undoManager?.stateCommitted$.subscribe(() => this.autoSaveState());
    this.dataSubscription = this.translationService
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
    if (!this.editingState) return;
    this.parsedLayouts.clear();
    this.displayThemes = sortThemesForDisplay(this.editingState.themes);
    this.displayCustomUIs = sortCustomUisForDisplay(
      this.editingState.customUIs || this.customUiService?.getCustomUIs() || [],
    );
    this.displayColumnSlots = buildDisplayColumnSlots(
      this.editingSettings?.racedayColumns,
      this.availableColumns,
    );
    this.ensureWidgetSelected();
    this.cdr.markForCheck();
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

  onWidgetSelected(id: string | null, ui?: CustomUI) {
    handleWidgetSelection(this, id, ui);
  }

  countdownPreviewActiveByUi: Record<string, boolean> = {};

  isCountdownPreviewActive(ui?: CustomUI): boolean {
    const id = ui?.entity_id || this.activeCustomUiId;
    return id ? !!this.countdownPreviewActiveByUi[id] : false;
  }

  toggleCountdownPreview(ui?: CustomUI) {
    const id = ui?.entity_id || this.activeCustomUiId;
    if (id) {
      this.countdownPreviewActiveByUi[id] = !this.isCountdownPreviewActive(ui);
      this.cdr.markForCheck();
    }
  }

  getLayoutWidgets(ui?: CustomUI): AbsoluteWidgetNode[] {
    const layout = this.getLayout(ui);
    return layout?.widgets || [];
  }

  getWidgetDisplayName(widget: AbsoluteWidgetNode): string {
    const key = this.getWidgetTypeLabelKey(widget.widgetType);
    const translated = this.translationService.translate(key);
    return translated || widget.widgetType;
  }

  onWidgetDropdownSelect(widgetId: string, ui?: CustomUI) {
    if (widgetId) {
      this.onWidgetSelected(widgetId, ui);
    } else {
      this.onWidgetSelected(null, ui);
    }
  }

  onTextColorChange(event: Event) {
    handleWidgetColorChange(this, "textColor", event);
  }

  onBackgroundColorChange(event: Event) {
    handleWidgetColorChange(this, "backgroundColor", event);
  }

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
    if (this.isSaving) return;
    updateLayoutOnModel(
      newLayout,
      ui,
      this.editingSettings,
      this.isCurrentLayoutPractice,
      this.parsedLayouts,
    );
    const widgets = newLayout?.widgets || [];
    if (
      widgets.length > 0 &&
      (!this.selectedWidgetId ||
        !widgets.some((w: any) => w.id === this.selectedWidgetId))
    ) {
      this.selectedWidgetId = findDefaultWidgetId(newLayout);
    }
    this.captureState();
    this.cdr.markForCheck();
  }

  onWidgetInspectorChange(widget?: any, ui?: CustomUI) {
    handleWidgetInspectorChange(this, widget, ui);
  }

  onReplicateLanes(options: any, ui?: CustomUI) {
    this.startGridSession(options, ui);
  }

  startGridSession(options: any, ui?: CustomUI): void {
    handleStartGridSession(this, options, ui);
  }

  finishGridSession(ui?: CustomUI): void {
    handleFinishGridSession(this, ui);
  }

  onGridBoundsChange(bounds: LaneGridBounds, ui?: CustomUI): void {
    handleUpdateGridBounds(this, bounds, ui);
  }

  onEditGridTemplate(gridId: string, ui?: CustomUI): void {
    handleEditGridTemplate(this, gridId, ui);
  }

  onDetachGrid(gridId: string, ui?: CustomUI): void {
    handleDetachGrid(this, gridId, ui);
  }

  openReplicateLaneModal(ui?: CustomUI): void {
    openReplicateLaneModalHelper(this, ui);
  }

  onConfirmReplicateLanes(options: any): void {
    confirmReplicateLanesHelper(this, options);
  }

  onRacedayLayoutChanged(newLayout: any) {
    this.onLayoutChanged(
      newLayout,
      this.displayCustomUIs.find(
        (u) => u.entity_id === "default_ui_layout_rc_ai",
      ),
    );
  }

  onPracticeRacedayLayoutChanged(newLayout: any) {
    this.onLayoutChanged(
      newLayout,
      this.displayCustomUIs.find(
        (u) => u.entity_id === "practice_ui_layout_rc_ai",
      ),
    );
  }

  getScaledDefaultLayout(isPractice = false) {
    return getDefaultLayoutResetData(isPractice).defaultLayout;
  }

  getTargetCustomUi(kind?: "practice" | "raceday" | "current") {
    return resolveTargetCustomUi(
      kind,
      this.activeCustomUiId,
      this.displayCustomUIs,
      this.isCurrentLayoutPractice,
    );
  }

  resetCurrentLayout() {
    handleResetCurrentLayout(this);
  }

  exportCurrentLayout() {
    handleExportCurrentLayout(this);
  }

  onImportCurrentLayout(event: Event) {
    handleImportCurrentLayout(this, event);
  }

  onColumnsChanged(_ui?: CustomUI) {
    this.captureState();
  }

  resetLayout = (ui: CustomUI) => handleResetLayout(this, ui);
  clearLayout = (ui: CustomUI) => handleClearLayout(this, ui);
  clearCurrentLayout = () => handleClearCurrentLayout(this);
  resetRacedayLayout = () => handleResetRacedayLayout(this);
  resetPracticeRacedayLayout = () => handleResetPracticeRacedayLayout(this);
  exportLayout = (ui: CustomUI) => handleExportLayout(this, ui);
  downloadJson = (data: any, filename: string) =>
    downloadJsonFile(data, filename);
  exportRacedayLayout = () => handleExportRacedayLayout(this);
  exportPracticeRacedayLayout = () => handleExportPracticeRacedayLayout(this);
  onImportLayout = (event: Event, ui: CustomUI) =>
    handleImportLayout(this, event, ui);
  onImportRacedayLayout = (event: Event) =>
    handleImportRacedayLayout(this, event);
  onImportPracticeRacedayLayout = (event: Event) =>
    handleImportPracticeRacedayLayout(this, event);

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

  async confirmDiscard(): Promise<boolean> {
    return handleConfirmDiscard(this);
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

  scrollToTheme(themeId: string) {
    scrollToThemeElement(themeId, this.cdr);
  }

  saveExpanderState() {
    saveExpanderStateToStorage(this.sectionsExpanded, this.logger);
  }
  loadExpanderState() {
    this.sectionsExpanded = loadExpanderStateFromStorage(this.sectionsExpanded);
  }
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

  getFlagUrl(slot: string, theme?: Theme) {
    return resolveThemeFlag(this, slot, theme);
  }
  getLampUrl(slot: string, theme?: Theme) {
    return resolveThemeLamp(this, slot, theme);
  }
  getFuelGaugeUrl(theme?: Theme) {
    return resolveThemeFuelGauge(this, theme);
  }
  getAudioUrl(slot: string, theme: Theme) {
    return getThemeAudioUrl(slot, theme, this.dataService, this.assets);
  }
  getAssetForSlot(slot: string, theme?: Theme) {
    return resolveThemeAsset(this, slot, theme);
  }

  onTemplateFileSelected(event: Event) {
    executeTemplateFileSelected(event, this.editingSettings, () => {
      this.captureState();
      this.cdr.markForCheck();
    });
  }

  clearCustomTemplate() {
    handleClearCustomTemplate(this);
  }

  openTemplateVariablesModal() {
    this.showTemplateVariablesModal = true;
  }

  downloadTemplate() {
    handleDownloadTemplate(this);
  }

  testExport() {
    handleTestExport(this);
  }

  onPageTransitionChange(transition: string) {
    handlePageTransitionChange(this, transition);
  }

  onMasterVolumeChange(volume: number | string) {
    handleMasterVolumeChange(this, volume);
  }

  onUrgentQueueTtlChange(ttl: number) {
    handleUrgentQueueTtlChange(this, ttl);
  }

  onCalloutSpacingChange(spacing: number) {
    handleCalloutSpacingChange(this, spacing);
  }

  loadAvailableVoices(): void {
    initAvailableVoices(this);
  }

  onTtsVoiceChange(voice: string) {
    handleTtsVoiceChange(this, voice);
  }

  onTtsRateChange(rate: number | string) {
    handleTtsRateChange(this, rate);
  }

  onTtsPitchChange(pitch: number | string) {
    handleTtsPitchChange(this, pitch);
  }

  onTtsVolumeChange(volume: number | string) {
    handleTtsVolumeChange(this, volume);
  }

  testTtsVoice(): void {
    executeTestTtsVoice(this);
  }

  async onThemeSlotChanged(theme: Theme, slot: string, asset: any) {
    handleThemeSlotChange(this, theme, slot, asset);
  }

  getAudioConfigForSlot(slot: string, theme: Theme): AudioConfig {
    return getThemeAudioConfigForSlot(slot, theme);
  }

  onAudioConfigChanged(
    theme: Theme,
    slot: string,
    field: "type" | "url" | "text",
    value: any,
  ) {
    handleThemeAudioChange(this, theme, slot, field, value);
  }

  onAudioAssetSelected(theme: Theme, slot: string, asset: any) {
    this.onAudioConfigChanged(theme, slot, "url", extractAssetId(asset));
  }

  ensureWidgetSelected(ui?: CustomUI) {
    ensureWidgetSelectedHelper(this, ui);
  }

  onCustomUiSelected(uiId: string) {
    handleCustomUiSelection(this, uiId);
  }

  getCustomUiDisplayNameKey(ui: CustomUI) {
    return getCustomUiDisplayNameKey(ui, this.translationService);
  }
  isCustomUiDefault(ui: CustomUI) {
    return isCustomUiDefault(ui);
  }
  toggleUiSection(uiId: string) {
    toggleUiExpander(uiId, this.displayCustomUIs, this.sectionsExpanded, (id) =>
      this.onCustomUiSelected(id),
    );
  }

  createNewCustomUi = () => handleCreateCustomUi(this);
  onDuplicateCustomUi = (ui: CustomUI) => handleDuplicateCustomUi(this, ui);
  onDeleteCustomUi = (ui: CustomUI) => openDeleteCustomUiModal(this, ui);
  cancelDeleteCustomUi = () => cancelDeleteCustomUiModal(this);
  confirmDeleteCustomUi = () => handleConfirmDeleteCustomUi(this);
  onCustomUiNameChanged(_ui: CustomUI) {
    this.captureState();
    this.refreshDisplayProperties();
    this.cdr.markForCheck();
  }
  isCustomUiNameInvalid(ui: CustomUI) {
    return isCustomUiNameInvalid(ui, this.displayCustomUIs);
  }
  isAnyCustomUiNameInvalid() {
    return this.displayCustomUIs.some((ui) => this.isCustomUiNameInvalid(ui));
  }
  getThemeDisplayNameKey(theme: Theme) {
    return getThemeDisplayNameKey(theme, this.translationService);
  }
  isThemeDefault(theme: Theme) {
    return isThemeDefault(theme);
  }

  focusUiNameInput(entityId: string): void {
    focusUiEditorElement(`custom-ui-name-input-${entityId}`);
  }

  focusThemeNameInput(entityId: string): void {
    focusUiEditorElement(`theme-name-input-${entityId}`);
  }

  private openSuccessModal(
    params?: { title?: string; message?: string; params?: any },
    collapseThemeId: string | null = null,
    focusThemeId: string | null = null,
  ) {
    openSuccessModal(this, params, collapseThemeId, focusThemeId);
  }

  createNewTheme = () => handleCreateTheme(this);
  async onConfirmThemeTemplate(_templateType: ThemeTemplateType) {
    this.showThemeTemplateModal = false;
    await this.createNewTheme();
  }
  onThemeNameChanged(_theme: Theme) {
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
