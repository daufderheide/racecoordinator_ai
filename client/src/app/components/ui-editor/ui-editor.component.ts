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
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { AudioSelectorComponent } from "@app/components/shared/audio-selector/audio-selector.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { ToolbarComponent } from "@app/components/shared/toolbar/toolbar.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { CustomUI } from "@app/models/custom-ui";
import { AudioConfig } from "@app/models/driver";
import { LayoutConfig, Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { TranslatePipe } from "@app/pipes/translate.pipe";
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
import { deepCopy } from "@app/utils/clone.utils";

import {
  ThemeTemplateModalComponent,
  ThemeTemplateType,
} from "./components/theme-template-modal/theme-template-modal";
import {
  applyLoadedUiEditorData,
  areSettingsEqual,
  areUIEditorStatesEqual,
  AVAILABLE_TRANSITIONS,
  BASE_AVAILABLE_COLUMNS,
  buildAutoSaveContext,
  buildDisplayColumnSlots,
  buildLayoutExport,
  buildUiEditorHelpContext,
  calculatePreviewScaleNumber,
  cloneSettings,
  cloneUIEditorState,
  DEFAULT_SECTIONS_EXPANDED,
  downloadJsonFile,
  executeAutoSaveState,
  executeClearFolder,
  executeClearWidgetFolder,
  executeImportLayout,
  executeResetLayout,
  executeSelectFolder,
  executeSelectWidgetFolder,
  executeTemplateFileSelected,
  extractAssetId,
  fetchUiEditorData,
  findDefaultWidgetId,
  getCustomUiDisplayNameKey,
  getDefaultLayoutResetData,
  getThemeAudioConfigForSlot,
  getThemeAudioUrl,
  getThemeDisplayNameKey,
  getUiEditorHelpSteps,
  handleConfirmDeleteCustomUi,
  handleConfirmDeleteTheme,
  handleCreateCustomUi,
  handleCreateTheme,
  handleCustomUiSelection,
  handleDuplicateCustomUi,
  handleDuplicateTheme,
  handleThemeAudioChange,
  handleThemeSlotChange,
  handleUiEditorDataLoadError,
  handleUiEditorDestroy,
  handleUiEditorHelpStep,
  handleUiEditorKeyboardShortcut,
  handleWidgetColorChange,
  handleWidgetSelection,
  isCustomUiDefault,
  isCustomUiNameInvalid,
  isThemeDefault,
  isThemeNameDuplicate,
  isThemeNameInvalid,
  loadExpanderStateFromStorage,
  MAIN_AUDIO_SLOTS,
  MOCK_RACEDAY_PROPERTIES,
  resolveActiveLayout,
  resolveTargetCustomUi,
  resolveThemeAsset,
  resolveThemeFlag,
  resolveThemeFuelGauge,
  resolveThemeLamp,
  saveExpanderStateToStorage,
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
  showDiscardConfirm = false;
  private pendingDeactivate: ((result: boolean) => void) | null = null;

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
  private pendingNavigationUrl = "";
  private childWindowManagerService: ChildWindowManagerService;

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
  ) {
    this.childWindowManagerService =
      childWindowManagerService ?? inject(ChildWindowManagerService);
    this.customWidgetService =
      customWidgetService ??
      inject(CustomWidgetService, { optional: true }) ??
      undefined;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart)
        this.pendingNavigationUrl = event.url;
    });

    this.undoManager = new UndoManager<UIEditorState>(
      {
        clonner: (s) => this.cloneState(s),
        equalizer: (a, b) => this.areStatesEqual(a, b),
        applier: (s) => {
          syncEditorCoordinates(s.settings, this.editingState?.settings);
          this.editingState = s;
          this.refreshDisplayProperties();
        },
      },
      () => this.editingState,
    );
  }

  ngOnInit() {
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

  onTextColorChange(event: Event) {
    handleWidgetColorChange(this, "textColor", event);
  }

  onBackgroundColorChange(event: Event) {
    handleWidgetColorChange(this, "backgroundColor", event);
  }

  getCurrentFlagUrl() {
    return "";
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
    if (this.isSaving) return;
    const targetUi = ui || this.activeCustomUi;
    const targetWidget = widget || this.currentSelectedWidget;
    const layout = this.getLayout(targetUi);
    if (layout && targetWidget && layout.widgets) {
      const idx = layout.widgets.findIndex(
        (w: any) => w.id === targetWidget.id,
      );
      if (idx !== -1) {
        layout.widgets[idx] = targetWidget;
      }
      updateLayoutOnModel(
        layout,
        targetUi,
        this.editingSettings,
        this.isCurrentLayoutPractice,
        this.parsedLayouts,
      );
    }
    this.captureState();
    this.cdr.markForCheck();
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
    if (this.isCurrentLayoutPractice) {
      this.resetPracticeRacedayLayout();
    } else if (this.activeCustomUiId === "default_ui_layout_rc_ai") {
      this.resetRacedayLayout();
    } else if (this.activeCustomUi) {
      this.resetLayout(this.activeCustomUi);
    }
  }

  exportCurrentLayout() {
    if (this.isCurrentLayoutPractice) {
      this.exportPracticeRacedayLayout();
    } else if (this.activeCustomUiId === "default_ui_layout_rc_ai") {
      this.exportRacedayLayout();
    } else if (this.activeCustomUi) {
      this.exportLayout(this.activeCustomUi);
    }
  }

  onImportCurrentLayout(event: Event) {
    if (this.isCurrentLayoutPractice) {
      this.onImportPracticeRacedayLayout(event);
    } else if (this.activeCustomUiId === "default_ui_layout_rc_ai") {
      this.onImportRacedayLayout(event);
    } else if (this.activeCustomUi) {
      this.onImportLayout(event, this.activeCustomUi);
    }
  }

  onColumnsChanged(_ui?: CustomUI) {
    this.captureState();
  }

  resetLayout(ui: CustomUI) {
    executeResetLayout(ui, this.editingSettings);
    if (this.editingState?.settings)
      this.editingState.settings = deepCopy(this.editingSettings);
    this.undoManager.captureState();
    this.refreshDisplayProperties();
    this.cdr.detectChanges();
  }

  resetRacedayLayout() {
    const u = this.getTargetCustomUi("raceday");
    if (u) this.resetLayout(u);
  }

  resetPracticeRacedayLayout() {
    this.selectedWidgetId = "widget-lane-view";
    const u = this.getTargetCustomUi("practice");
    if (u) this.resetLayout(u);
  }

  exportLayout(ui: CustomUI) {
    const { layoutExport, fileName } = buildLayoutExport(
      ui,
      this.editingSettings,
    );
    this.downloadJson(layoutExport, fileName);
  }

  downloadJson(data: any, filename: string) {
    downloadJsonFile(data, filename);
  }

  exportRacedayLayout() {
    const u = this.getTargetCustomUi("raceday");
    if (u) this.exportLayout(u);
  }

  exportPracticeRacedayLayout() {
    const u = this.getTargetCustomUi("practice");
    if (u) this.exportLayout(u);
  }

  onImportLayout(event: Event, ui: CustomUI) {
    executeImportLayout(event, ui, this.editingSettings, this.logger, () => {
      if (this.editingState?.settings)
        this.editingState.settings = deepCopy(this.editingSettings);
      this.undoManager.captureState();
      this.refreshDisplayProperties();
      this.cdr.detectChanges();
    });
  }

  onImportRacedayLayout(event: Event) {
    const u = this.getTargetCustomUi("raceday");
    if (u) this.onImportLayout(event, u);
  }

  onImportPracticeRacedayLayout(event: Event) {
    const u = this.getTargetCustomUi("practice");
    if (u) this.onImportLayout(event, u);
  }

  cloneSettings(s: Settings) {
    return cloneSettings(s);
  }
  isColumnSelected(key: string) {
    return this.editingSettings.racedayColumns.some(
      (k) => k === key || k.split("_").includes(key),
    );
  }
  cloneState(s: UIEditorState) {
    return cloneUIEditorState(s);
  }
  areStatesEqual(a: UIEditorState, b: UIEditorState) {
    return areUIEditorStatesEqual(a, b);
  }
  areSettingsEqual(a: Settings, b: Settings) {
    return areSettingsEqual(a, b);
  }

  async selectDirectory() {
    const name = await executeSelectFolder(this.fileSystem);
    if (name) {
      this.customDirectoryName = name;
      this.cdr.markForCheck();
    }
  }

  async resetDefault() {
    await executeClearFolder(this.fileSystem);
    this.customDirectoryName = null;
    this.cdr.markForCheck();
  }

  async selectWidgetDirectory() {
    const name = await executeSelectWidgetFolder(this.fileSystem);
    if (name) {
      this.customWidgetDirectoryName = name;
      if (this.customWidgetService) {
        await this.customWidgetService.reloadCustomWidgets();
      }
      this.cdr.markForCheck();
    }
  }

  async resetWidgetDefault() {
    await executeClearWidgetFolder(this.fileSystem);
    this.customWidgetDirectoryName = null;
    if (this.customWidgetService) {
      await this.customWidgetService.reloadCustomWidgets();
    }
    this.cdr.markForCheck();
  }

  async exportStarterWidgets() {
    await this.updateSampleWidgets();
  }

  async updateSampleWidgets() {
    if (this.customWidgetService) {
      try {
        const result = await this.customWidgetService.exportStarterWidgets();
        if (result && result.success) {
          this.openSuccessModal({
            title: "UE_UPDATE_SAMPLE_WIDGETS_SUCCESS_TITLE",
            message: "UE_UPDATE_SAMPLE_WIDGETS_SUCCESS_MSG",
            params: {
              count: result.count,
              directory:
                result.directory || this.customWidgetDirectoryName || "",
            },
          });
        }
        this.cdr.markForCheck();
      } catch (e) {
        this.logger.error("Failed to update sample widgets", e);
      }
    }
  }

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
    return executeAutoSaveState(buildAutoSaveContext(this));
  }

  async confirmDiscard(): Promise<boolean> {
    this.undoManager.commitState();
    if (!this.hasChanges()) return true;
    if (!this.isAnyThemeNameInvalid() && !this.isAnyCustomUiNameInvalid()) {
      try {
        await this.autoSaveState();
        if (!this.hasChanges()) return true;
      } catch (e) {
        this.logger.error("Final auto-save failed before navigation", e);
      }
    }
    this.showDiscardConfirm = true;
    this.cdr.markForCheck();
    return new Promise((resolve) => {
      this.pendingDeactivate = resolve;
    });
  }

  onConfirmDiscard() {
    this.showDiscardConfirm = false;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(true);
      this.pendingDeactivate = null;
    }
  }

  onCancelDiscard() {
    this.showDiscardConfirm = false;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(false);
      this.pendingDeactivate = null;
    }
  }

  onBack() {
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
    this.editingState.settings = cloneSettings(this.editingState.settings);
    if (this.displayCustomUIs?.length) {
      this.editingState.customUIs = deepCopy(this.displayCustomUIs);
    }
    this.undoManager.captureState();
  }

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveExpanderState();
  }

  toggleThemeSection(themeId: string, activate = false) {
    toggleThemeExpander(
      themeId,
      this.displayThemes,
      this.sectionsExpanded,
      activate,
      this.editingSettings.activeThemeId,
      (id) => this.onThemeSelected(id),
    );
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
    this.availableColumns.sort((a, b) => {
      const labelA = this.translationService.translate(a.label) || a.label;
      const labelB = this.translationService.translate(b.label) || b.label;
      return labelA.localeCompare(labelB);
    });
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
    if (this.editingSettings) {
      delete this.editingSettings.customExportTemplateBase64;
      this.captureState();
      this.cdr.markForCheck();
    }
  }

  onPageTransitionChange(transition: string) {
    if (this.editingSettings) {
      this.editingSettings.pageTransition = transition;
      this.captureState();
    }
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
    const layout = this.getLayout(ui || this.activeCustomUi);
    const widgets = layout?.widgets || [];
    if (
      widgets.length > 0 &&
      (!this.selectedWidgetId ||
        !widgets.some((w: any) => w.id === this.selectedWidgetId))
    ) {
      this.selectedWidgetId = findDefaultWidgetId(layout);
    }
  }

  onCustomUiSelected(uiId: string) {
    handleCustomUiSelection(this, uiId);
  }

  getCustomUiDisplayNameKey(ui: CustomUI) {
    return getCustomUiDisplayNameKey(ui);
  }
  isCustomUiDefault(ui: CustomUI) {
    return isCustomUiDefault(ui);
  }
  toggleUiSection(uiId: string) {
    toggleUiExpander(uiId, this.displayCustomUIs, this.sectionsExpanded, (id) =>
      this.onCustomUiSelected(id),
    );
  }

  async createNewCustomUi() {
    await handleCreateCustomUi(this);
  }

  async onDuplicateCustomUi(ui: CustomUI) {
    await handleDuplicateCustomUi(this, ui);
  }

  onDeleteCustomUi(ui: CustomUI) {
    this.uiToDelete = ui;
    this.deleteUiParams = { name: ui.name };
    this.showDeleteUiConfirm = true;
    this.cdr.markForCheck();
  }

  cancelDeleteCustomUi() {
    this.showDeleteUiConfirm = false;
    this.uiToDelete = null;
    this.cdr.markForCheck();
  }

  async confirmDeleteCustomUi() {
    await handleConfirmDeleteCustomUi(this);
  }

  onCustomUiNameChanged(_ui: CustomUI) {
    this.captureState();
    this.cdr.markForCheck();
  }
  isCustomUiNameInvalid(ui: CustomUI) {
    return isCustomUiNameInvalid(ui, this.displayCustomUIs);
  }
  isAnyCustomUiNameInvalid() {
    return this.displayCustomUIs.some((ui) => this.isCustomUiNameInvalid(ui));
  }
  getThemeDisplayNameKey(theme: Theme) {
    return getThemeDisplayNameKey(theme);
  }
  isThemeDefault(theme: Theme) {
    return isThemeDefault(theme);
  }

  private openSuccessModal(
    params?: { title?: string; message?: string; params?: any },
    collapseThemeId: string | null = null,
  ) {
    this.themeToCollapseAfterSuccess = collapseThemeId;
    this.successModalTitle = params?.title || "";
    this.successModalMessage = params?.message || "";
    this.successModalParams = params?.params || {};
    this.showSuccessModal = true;
  }

  async createNewTheme() {
    await handleCreateTheme(this);
  }

  async onConfirmThemeTemplate(_templateType: ThemeTemplateType) {
    this.showThemeTemplateModal = false;
    await this.createNewTheme();
  }

  async onThemeNameChanged(_theme: Theme) {
    this.captureState();
  }

  async onDuplicateTheme(theme: Theme) {
    await handleDuplicateTheme(this, theme);
  }

  onDeleteTheme(theme: Theme) {
    this.themeToDelete = theme;
    this.deleteThemeParams = { name: theme.name };
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  async onConfirmDeleteTheme() {
    await handleConfirmDeleteTheme(this);
  }

  onCancelDeleteTheme() {
    this.showDeleteConfirm = false;
    this.themeToDelete = null;
    this.deleteThemeParams = {};
  }

  onSuccessModalAcknowledge() {
    this.showSuccessModal = false;
    this.successModalTitle = "";
    this.successModalMessage = "";
    this.successModalParams = {};
    this.themeToCollapseAfterSuccess = null;
    this.editingState.themes.forEach((t) => {
      this.sectionsExpanded[`theme_${t.entity_id}`] = false;
    });
    this.saveExpanderState();
  }

  onDetachTheme() {
    this.themeService.detachToSettings(this.assets);
    this.editingState.settings = cloneSettings(
      this.settingsService.getSettings(),
    );
    this.captureState();
    if (!this.isDestroyed) this.cdr.markForCheck();
  }

  getPreviewScale(ui?: CustomUI) {
    return `scale(${this.getPreviewScaleNumber(ui)})`;
  }
  getPreviewScaleNumber(ui?: CustomUI) {
    return calculatePreviewScaleNumber(
      this.getLayout(ui || this.activeCustomUi)?.baseWidth || 1920,
      !!this.currentSelectedWidget,
      window.innerWidth,
    );
  }
  getPreviewContainerWidth(ui?: CustomUI) {
    return (
      (this.getLayout(ui)?.baseWidth || 1920) * this.getPreviewScaleNumber(ui)
    );
  }
  getPreviewContainerHeight(ui?: CustomUI) {
    return (
      (this.getLayout(ui)?.baseHeight || 1080) * this.getPreviewScaleNumber(ui)
    );
  }

  getHelpSteps(): GuideStep[] {
    return getUiEditorHelpSteps(buildUiEditorHelpContext(this));
  }
}
