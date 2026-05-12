import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { forkJoin, of, Subscription } from "rxjs";
import { AnchorPoint } from "@app/components/raceday/column_definition";
import { AudioSelectorComponent } from "@app/components/shared/audio-selector/audio-selector.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { ToolbarComponent } from "@app/components/shared/toolbar/toolbar.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import {
  ReorderDialogData,
  ReorderDialogResult,
} from "@app/components/ui-editor/reorder-dialog/reorder-dialog.component";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { AudioConfig } from "@app/models/driver";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTTSContext } from "@app/utils/audio";

import { ColumnPreviewComponent } from "./column-preview/column-preview.component";
import { ReorderDialogComponent } from "./reorder-dialog/reorder-dialog.component";

export interface UIEditorState {
  settings: Settings;
  themes: Theme[];
}

@Component({
  standalone: true,
  selector: "app-ui-editor",
  templateUrl: "./ui-editor.component.html",
  styleUrl: "./ui-editor.component.css",
  imports: [
    EditorTitleComponent,
    ColumnPreviewComponent,
    FormsModule,
    ImageSelectorComponent,
    AudioSelectorComponent,
    ToolbarComponent,
    NgTemplateOutlet,
    ReorderDialogComponent,
    ConfirmationModalComponent,
    TranslatePipe,
  ],
})
export class UIEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  isLoading = true;
  isSaving = false;
  isAutoSaving = false;
  scale = 1;
  assets: any[] = [];

  // Unified state for undo/redo
  state!: UIEditorState;
  editingState!: UIEditorState;

  displayThemes: Theme[] = [];
  displayColumnSlots: any[] = [];

  get editingSettings(): Settings {
    return this.editingState?.settings;
  }

  customDirectoryName: string | null = null;
  isNavigationApproved = false;

  showReorderModal = false;
  reorderModalData: ReorderDialogData | null = null;

  showDeleteConfirm = false;
  themeToDelete: Theme | null = null;

  showDiscardConfirm = false;
  private pendingDeactivate: ((result: boolean) => void) | null = null;

  // TODO(aufderheide): I think this list is duplicated below.  If they're the same they should share the code.
  availableColumns = [
    { key: "driver.name", label: "RD_COL_NAME" },
    { key: "driver.nickname", label: "RD_COL_NICKNAME" },
    { key: "driver.avatarUrl", label: "RD_COL_AVATAR" },
    { key: "lapCount", label: "RD_COL_LAP" },
    { key: "reactionTime", label: "RD_COL_REACTION_TIME" },
    { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
    { key: "medianLapTime", label: "RD_COL_MEDIAN_LAP" },
    { key: "averageLapTime", label: "RD_COL_AVG_LAP" },
    { key: "bestLapTime", label: "RD_COL_BEST_LAP" },
    { key: "gapLeader", label: "RD_COL_GAP_LEADER" },
    { key: "gapPosition", label: "RD_COL_GAP_POSITION" },
    { key: "seed", label: "RD_COL_SEED" },
    { key: "rankHeat", label: "RD_COL_RANK_HEAT" },
    { key: "rankOverall", label: "RD_COL_RANK_OVERALL" },
    { key: "participant.team.name", label: "RD_COL_TEAM" },
    { key: "participant.fuelLevel", label: "RD_COL_FUEL_LEVEL" },
    { key: "fuelCapacity", label: "RD_COL_FUEL_CAPACITY" },
    { key: "fuelPercentage", label: "RD_COL_FUEL_PERCENTAGE" },
    { key: "mph", label: "RD_COL_MPH" },
    { key: "kph", label: "RD_COL_KPH" },
    { key: "fph", label: "RD_COL_FPH" },
    { key: "segmentTime", label: "RD_COL_SEGMENT_TIME" },
    { key: "flag", label: "RD_COL_DRIVER_STATE" },
  ];
  availableTransitions = [
    { key: "none", label: "UE_TRANSITION_NONE" },
    { key: "random", label: "UE_TRANSITION_RANDOM" },
    { key: "slide", label: "UE_TRANSITION_SLIDE" },
    { key: "zoom", label: "UE_TRANSITION_ZOOM" },
    { key: "blur", label: "UE_TRANSITION_BLUR" },
    { key: "fade", label: "UE_TRANSITION_FADE" },
  ];

  undoManager!: UndoManager<UIEditorState>;

  sectionsExpanded: { [key: string]: boolean } = {
    layout: true,
    themes: true,
    config: true,
    flags: true,
    countdown: false,
    fuelGauge: false,
    audio: false,
  };

  mainAudioSlots: {
    key: string;
    label: string;
    mode: "single" | "set";
  }[] = [
    {
      key: "audio.yellowflag",
      label: "UE_LABEL_YELLOW_FLAG_AUDIO",
      mode: "single",
    },
    { key: "audio.countdown", label: "UE_LABEL_COUNTDOWN_AUDIO", mode: "set" },
    {
      key: "audio.seconds_left",
      label: "UE_LABEL_SECONDS_LEFT_AUDIO",
      mode: "set",
    },
    {
      key: "audio.seconds_left.halfway",
      label: "UE_LABEL_SECONDS_LEFT_HALFWAY",
      mode: "single",
    },
    {
      key: "audio.min_lap_time",
      label: "UE_LABEL_MIN_LAP_TIME_AUDIO",
      mode: "single",
    },
    {
      key: "audio.drift_lap",
      label: "UE_LABEL_DRIFT_LAP_AUDIO",
      mode: "single",
    },
  ];

  constructor(
    private settingsService: SettingsService,
    private fileSystem: FileSystemService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public themeService: ThemeService,
    private translationService: TranslationService,
    private logger: LoggerService,
  ) {
    this.undoManager = new UndoManager<UIEditorState>(
      {
        clonner: (s) => this.cloneState(s),
        equalizer: (a, b) => this.areStatesEqual(a, b),
        applier: (s) => {
          this.editingState = s;
          this.refreshDisplayProperties();
        },
      },
      () => this.editingState,
    );
  }

  ngOnInit() {
    this.updateScale();
    this.loadExpanderState();
    this.loadData();

    // Auto-save on changes (like Driver Editor)
    if (this.undoManager) {
      this.undoManager.stateCommitted$.subscribe(() => {
        this.autoSaveState();
      });
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.undoManager.destroy();
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (this.showReorderModal) return; // Prevent undo during modal
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      if (this.showReorderModal) return;
      this.redo();
    }
  }

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;
    this.scale = Math.min(scaleX, scaleY);
  }

  loadData() {
    this.isLoading = true;
    this.dataSubscription = forkJoin({
      assets: this.dataService.listAssets(),
      dirHandle: this.fileSystem.getCustomDirectoryHandle(),
      themes: this.dataService.getThemes(),
    }).subscribe({
      next: (result) => {
        // Include both images and image_sets
        // Include images, image_sets, and sounds
        this.assets = result.assets.filter(
          (a: any) =>
            a.type === "image" ||
            a.type === "image_set" ||
            a.type === "sound" ||
            a.type === "audio_set",
        );

        // Dynamic columns for image sets
        const imageSetColumns = result.assets
          .filter(
            (a: any) =>
              a.type === "image_set" &&
              a.name !== "Fuel Gauge" &&
              a.model?.entityId !== "fuel-gauge-builtin" &&
              a.model?.entityId !== "default_fuel-gauge-builtin",
          )
          .map((a: any) => ({
            key: `imageset_${a.model?.entityId}`,
            label: a.name || "AM_UNKNOWN_ASSET",
          }));

        // Robustness: ensure imageset_fuel-gauge-builtin is available if a "Fuel Gauge" set exists
        const builtinKey = "imageset_fuel-gauge-builtin";
        if (!imageSetColumns.find((c) => c.key === builtinKey)) {
          const fuelGaugeAsset = result.assets.find(
            (a: any) =>
              a.type === "image_set" &&
              (a.name === "Fuel Gauge" ||
                a.model?.entityId === "fuel-gauge-builtin" ||
                a.model?.entityId === "default_fuel-gauge-builtin"),
          );
          if (fuelGaugeAsset) {
            imageSetColumns.push({
              key: builtinKey,
              label: fuelGaugeAsset.name,
            });
          }
        }

        // Reset availableColumns to base set + dynamic image sets
        this.availableColumns = [
          { key: "driver.name", label: "RD_COL_NAME" },
          { key: "driver.nickname", label: "RD_COL_NICKNAME" },
          { key: "driver.avatarUrl", label: "RD_COL_AVATAR" },
          { key: "lapCount", label: "RD_COL_LAP" },
          { key: "reactionTime", label: "RD_COL_REACTION_TIME" },
          { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
          { key: "medianLapTime", label: "RD_COL_MEDIAN_LAP" },
          { key: "averageLapTime", label: "RD_COL_AVG_LAP" },
          { key: "bestLapTime", label: "RD_COL_BEST_LAP" },
          { key: "gapLeader", label: "RD_COL_GAP_LEADER" },
          { key: "gapPosition", label: "RD_COL_GAP_POSITION" },
          { key: "seed", label: "RD_COL_SEED" },
          { key: "rankHeat", label: "RD_COL_RANK_HEAT" },
          { key: "rankOverall", label: "RD_COL_RANK_OVERALL" },
          { key: "participant.team.name", label: "RD_COL_TEAM" },
          { key: "participant.fuelLevel", label: "RD_COL_FUEL_LEVEL" },
          { key: "fuelCapacity", label: "RD_COL_FUEL_CAPACITY" },
          { key: "fuelPercentage", label: "RD_COL_FUEL_PERCENTAGE" },
          { key: "mph", label: "RD_COL_MPH" },
          { key: "kph", label: "RD_COL_KPH" },
          { key: "fph", label: "RD_COL_FPH" },
          { key: "segmentTime", label: "RD_COL_SEGMENT_TIME" },
          { key: "flag", label: "RD_COL_DRIVER_STATE" },
          ...imageSetColumns,
        ];

        this.customDirectoryName = result.dirHandle?.name || null;
        const themes = result.themes || [];
        const settings = this.settingsService.getSettings();
        const editingSettings = this.cloneSettings(settings);

        if (!editingSettings.activeThemeId && themes.length > 0) {
          const defaultTheme = themes.find((t) => t.is_default);
          if (defaultTheme) {
            editingSettings.activeThemeId = defaultTheme.entity_id;
            this.themeService.setActiveTheme(defaultTheme.entity_id);
          }
        }

        this.editingState = {
          settings: editingSettings,
          themes: JSON.parse(JSON.stringify(themes)),
        };
        this.refreshDisplayProperties();
        this.undoManager.initialize(this.editingState);

        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.logger.error("Failed to load UI editor data", err);
        this.isLoading = false;
        // Provide empty defaults if loading failed to prevent template crashes
        this.isLoading = false;
        // Provide empty defaults if loading failed to prevent template crashes
        if (!this.editingState) {
          const settings = this.settingsService.getSettings();
          const editingSettings = this.cloneSettings(settings);
          this.editingState = {
            settings: editingSettings,
            themes: [],
          };
          this.undoManager.initialize(this.editingState);
        }
        this.refreshDisplayProperties();
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      },
    });
  }

  refreshDisplayProperties() {
    if (!this.editingState) return;

    // Refresh displayThemes
    const list = this.editingState.themes || [];
    const defaultTheme = list.find((t) => t.is_default);
    const others = list.filter((t) => !t.is_default);
    this.displayThemes = defaultTheme ? [defaultTheme, ...others] : others;

    // Refresh displayColumnSlots
    if (this.editingSettings) {
      this.displayColumnSlots = this.editingSettings.racedayColumns.map(
        (key) => {
          const col = this.availableColumns.find((c) => c.key === key);
          return { key, label: col ? col.label : key };
        },
      );
    }
    this.cdr.markForCheck();
  }

  trackByThemeId(index: number, theme: Theme): string {
    return theme.entity_id;
  }

  get resizingColumnKey(): string | null {
    if (!this.editingSettings) return null;
    const columns = this.editingSettings.racedayColumns;
    const layouts = this.editingSettings.columnLayouts || {};
    const nameKeys = ["driver.name", "driver.nickname"];

    for (const key of columns) {
      const layout = layouts[key] || { [AnchorPoint.CenterCenter]: key };
      const containsName = Object.values(layout).some((v) =>
        nameKeys.includes((v as string).split("_")[0]),
      );
      if (containsName) return key;
    }
    return columns.length > 0 ? columns[0] : null;
  }

  openReorderDialog() {
    this.reorderModalData = {
      availableValues: this.availableColumns,
      columnSlots: this.displayColumnSlots,
      columnLayouts: JSON.parse(
        JSON.stringify(this.editingSettings.columnLayouts || {}),
      ),
      columnVisibility: JSON.parse(
        JSON.stringify(this.editingSettings.columnVisibility || {}),
      ),
      screenName: "Default",
    };
    this.showReorderModal = true;
  }

  onReorderSave(result: ReorderDialogResult) {
    this.editingSettings.racedayColumns = result.columns;
    this.editingSettings.columnLayouts = result.columnLayouts;
    this.editingSettings.columnVisibility = result.columnVisibility;
    this.refreshDisplayProperties();
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.markForCheck();
    }
  }

  onReorderCancel() {
    this.showReorderModal = false;
    this.reorderModalData = null;
  }

  private cloneSettings(s: Settings): Settings {
    const clone = Object.assign(new Settings(), s);
    clone.recentRaceIds = [...(s.recentRaceIds || [])];
    clone.selectedDriverIds = [...(s.selectedDriverIds || [])];
    clone.racedayColumns = [...(s.racedayColumns || [])];
    clone.columnAnchors = { ...(s.columnAnchors || {}) };

    // Safely clone layouts and visibility
    const layouts = s.columnLayouts || {};
    clone.columnLayouts = JSON.parse(JSON.stringify(layouts));

    const visibility = s.columnVisibility || {};
    clone.columnVisibility = JSON.parse(JSON.stringify(visibility));

    clone.highlightRowOnLap = s.highlightRowOnLap ?? true;
    clone.pageTransition = s.pageTransition || "slide";

    // Theme fields
    clone.activeThemeId = s.activeThemeId;
    clone.raceThemeOverrides = { ...(s.raceThemeOverrides || {}) };
    clone.lampRedOn = s.lampRedOn;
    clone.lampRedDim = s.lampRedDim;
    clone.lampGreen = s.lampGreen;
    clone.fuelGaugeImageSet = s.fuelGaugeImageSet;

    return clone;
  }

  isColumnSelected(columnKey: string): boolean {
    return this.editingSettings.racedayColumns.includes(columnKey);
  }

  private cloneState(s: UIEditorState): UIEditorState {
    return {
      settings: this.cloneSettings(s.settings),
      themes: JSON.parse(JSON.stringify(s.themes)),
    };
  }

  private areStatesEqual(a: UIEditorState, b: UIEditorState): boolean {
    return (
      this.areSettingsEqual(a.settings, b.settings) &&
      JSON.stringify(a.themes) === JSON.stringify(b.themes)
    );
  }

  private areSettingsEqual(a: Settings, b: Settings): boolean {
    return (
      a.flagGreen === b.flagGreen &&
      a.flagYellow === b.flagYellow &&
      a.flagRed === b.flagRed &&
      a.flagWhite === b.flagWhite &&
      a.flagBlack === b.flagBlack &&
      a.flagYellowGreen === b.flagYellowGreen &&
      a.flagCheckered === b.flagCheckered &&
      a.sortByStandings === b.sortByStandings &&
      a.highlightRowOnLap === b.highlightRowOnLap &&
      a.pageTransition === b.pageTransition &&
      a.activeThemeId === b.activeThemeId &&
      a.lampRedOn === b.lampRedOn &&
      a.lampRedDim === b.lampRedDim &&
      a.lampGreen === b.lampGreen &&
      a.fuelGaugeImageSet === b.fuelGaugeImageSet &&
      JSON.stringify(a.racedayColumns) === JSON.stringify(b.racedayColumns) &&
      JSON.stringify(a.columnAnchors) === JSON.stringify(b.columnAnchors) &&
      JSON.stringify(a.columnLayouts) === JSON.stringify(b.columnLayouts) &&
      JSON.stringify(a.columnVisibility) === JSON.stringify(b.columnVisibility)
    );
  }

  async selectDirectory() {
    const success = await this.fileSystem.selectCustomFolder();
    if (success) {
      const handle = await this.fileSystem.getCustomDirectoryHandle();
      this.customDirectoryName = handle?.name || null;
      this.cdr.markForCheck();
    }
  }

  async resetDefault() {
    await this.fileSystem.clearCustomFolder();
    this.customDirectoryName = null;
    this.cdr.markForCheck();
  }

  save() {
    this.isSaving = true;
    this.settingsService.saveSettings(this.editingSettings);
    setTimeout(() => {
      this.isSaving = false;
      this.undoManager.resetTracking(this.editingState);
      if (!this.isDestroyed) {
        this.cdr.markForCheck();
      }
    }, 500);
  }

  private autoSaveState(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isLoading || this.isSaving || !this.hasChanges() || this.isAnyThemeNameInvalid()) {
        resolve();
        return;
      }

      this.isAutoSaving = true;
      this.isSaving = true;

      // 1. Save Settings
      this.settingsService.saveSettings(this.editingSettings);

      // 2. Save changed Themes
      const savePromises = [];
      for (const theme of this.displayThemes) {
        if (!theme.is_default) {
          savePromises.push(this.dataService.updateTheme(theme.entity_id, theme));
        }
      }

      const obs = savePromises.length > 0 ? forkJoin(savePromises) : of([null]);

      obs.subscribe({
        next: () => {
          this.undoManager.resetTracking(this.editingState);
          const activeTheme = this.themeService.getActiveTheme();
          if (activeTheme && this.displayThemes.find(t => t.entity_id === activeTheme.entity_id)) {
            this.themeService.refresh();
          }

          setTimeout(() => {
            this.isAutoSaving = false;
            this.isSaving = false;
            if (!this.isDestroyed) {
              this.cdr.markForCheck();
            }
            resolve();
          }, 500);
        },
        error: (err) => {
          this.logger.error("Auto-save failed", err);
          this.isAutoSaving = false;
          this.isSaving = false;
          if (!this.isDestroyed) {
            if (err.status !== 409) {
              alert(this.translationService.translate("UE_ERROR_SAVE_FAILED"));
            }
            this.cdr.markForCheck();
          }
          reject(err);
        }
      });
    });
  }

  async confirmDiscard(): Promise<boolean> {
    // Flush any pending debounced changes in the undo manager
    this.undoManager.commitState();

    if (!this.hasChanges()) {
      return true;
    }

    // If changes are saveable, try to auto-save before showing the modal
    if (!this.isAnyThemeNameInvalid()) {
      try {
        await this.autoSaveState();
        if (!this.hasChanges()) {
          return true; // Successfully saved, allow navigation
        }
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
    this.router.navigate(["/raceday-setup"]);
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
    this.undoManager.captureState();
  }

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveExpanderState();
  }

  toggleThemeSection(themeId: string, activate = true) {
    const wasExpanded = !!this.sectionsExpanded[themeId];

    // Collapse all theme sections
    this.displayThemes.forEach(
      (t) => (this.sectionsExpanded[t.entity_id] = false),
    );

    if (!wasExpanded) {
      // Expand
      this.sectionsExpanded[themeId] = true;
      if (activate) {
        this.onThemeSelected(themeId);
      }
    }

    this.saveExpanderState();
  }

  saveExpanderState() {
    try {
      localStorage.setItem(
        "ui_editor_expanders",
        JSON.stringify(this.sectionsExpanded),
      );
    } catch (e) {
      this.logger.error("Error saving expander state", e);
    }
  }

  loadExpanderState() {
    try {
      const saved = localStorage.getItem("ui_editor_expanders");
      if (saved) {
        this.sectionsExpanded = {
          ...this.sectionsExpanded,
          ...JSON.parse(saved),
        };
      }
    } catch (e) {
      this.logger.error("Error loading expander state", e);
    }
  }

  isThemeNameInvalid(theme: Theme): boolean {
    if (!theme.name?.trim()) return true;
    return this.isThemeNameDuplicate(theme);
  }

  isThemeNameDuplicate(theme: Theme): boolean {
    if (!theme.name) return false;
    const name = theme.name.trim().toLowerCase();
    return this.displayThemes.some(
      (t) =>
        t.entity_id !== theme.entity_id &&
        (t.name || "").trim().toLowerCase() === name,
    );
  }

  isAnyThemeNameInvalid(): boolean {
    return this.displayThemes.some(
      (t) => !t.is_default && this.isThemeNameInvalid(t),
    );
  }

  // --- Theme management ---

  get activeTheme(): Theme | null {
    return this.themeService.getActiveTheme();
  }

  get isThemeActive(): boolean {
    return this.themeService.isThemeActive();
  }

  get soundAssets(): any[] {
    return this.assets.filter(
      (a) => a.type === "sound" || a.type === "audio_set",
    );
  }

  /**
   * Provides mock context data for previewing Text-to-Speech in the editor.
   * This is only used for the UI Editor's preview functionality.
   */
  get previewTTSContext(): any {
    return mockTTSContext();
  }

  async loadThemes() {
    await this.themeService.refresh();
    this.editingState.themes = this.themeService.getThemes();
    this.refreshDisplayProperties();
    this.cdr.markForCheck();
  }

  async onThemeSelected(themeId: string) {
    this.editingSettings.activeThemeId = themeId;
    this.themeService.setActiveTheme(themeId);
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.markForCheck();
    }
  }

  getFlagUrl(slot: string, theme?: Theme): string | undefined {
    return this.getUrlForAsset(this.getAssetForSlot(slot, theme));
  }

  getLampUrl(slot: string, theme?: Theme): string | undefined {
    return this.getUrlForAsset(this.getAssetForSlot(slot, theme));
  }

  getFuelGaugeUrl(theme?: Theme): string | undefined {
    return this.getUrlForAsset(this.getAssetForSlot("gauge.fuel", theme));
  }

  getAudioUrl(slot: string, theme: Theme): string | undefined {
    const config = this.getAudioConfigForSlot(slot, theme);
    if (config.type === "preset" && config.url) {
      const asset = this.assets.find(
        (a) =>
          a.model?.entityId === config.url ||
          a.entity_id === config.url ||
          a.url === config.url,
      );
      return this.getUrlForAsset(asset);
    }
    return config.url;
  }

  private getUrlForAsset(asset: any): string | undefined {
    if (!asset) return undefined;
    const assetId = asset.model?.entityId || asset.entity_id;
    if (assetId) {
      return this.dataService.getAssetUrl(assetId);
    }
    return asset.url || undefined;
  }

  getAssetForSlot(slot: string, theme?: Theme): any | undefined {
    let assetId: string | undefined | null;

    if (theme?.slots && theme.slots[slot]) {
      assetId = theme.slots[slot];
    } else {
      assetId =
        (slot === "gauge.fuel"
          ? this.editingSettings.fuelGaugeImageSet
          : undefined) || this.themeService.resolveAssetId(slot);
    }

    if (!assetId) return undefined;
    return (this.assets || []).find(
      (a) => a.model?.entityId === assetId || a.entity_id === assetId,
    );
  }

  onPageTransitionChange(transition: string) {
    if (this.editingSettings) {
      this.editingSettings.pageTransition = transition;
      this.captureState();
    }
  }

  async onThemeSlotChanged(theme: Theme, slot: string, asset: any) {
    if (theme.is_default) return;

    // Robust asset ID extraction
    const assetId =
      asset?.model?.entityId ||
      asset?.entity_id ||
      asset?.entityId ||
      asset?.id ||
      null;

    if (!theme.slots) {
      theme.slots = {};
    }

    const previousAssetId = theme.slots[slot];
    if (assetId === previousAssetId) return;

    if (assetId) {
      theme.slots[slot] = assetId;
      // Register asset if it's new (e.g. from upload)
      if (
        !this.assets.find(
          (a) => (a.model?.entityId || a.entity_id || a.id) === assetId,
        )
      ) {
        this.assets = [...this.assets, asset];
      }
    } else {
      delete theme.slots[slot];
    }

    this.captureState();
    this.cdr.markForCheck();
  }

  getAudioConfigForSlot(slot: string, theme: Theme): AudioConfig {
    if (!theme.audio_slots) theme.audio_slots = {};
    const config = theme.audio_slots[slot];
    if (config) return config;

    // Fallback: If it's in the old slots map, convert it on the fly (though backfill should handle this)
    const legacyAssetId = theme.slots?.[slot];
    if (legacyAssetId) {
      return { type: "preset", url: legacyAssetId };
    }

    return { type: "preset" };
  }

  onAudioConfigChanged(
    theme: Theme,
    slot: string,
    field: "type" | "url" | "text",
    value: any,
  ) {
    if (theme.is_default) return;
    if (!theme.audio_slots) theme.audio_slots = {};

    const current = this.getAudioConfigForSlot(slot, theme);
    const updated = { ...current, [field]: value };

    theme.audio_slots[slot] = updated;

    this.captureState();
    this.cdr.markForCheck();
  }

  onAudioAssetSelected(theme: Theme, slot: string, asset: any) {
    if (theme.is_default) return;

    const assetId =
      asset?.model?.entityId ||
      asset?.entity_id ||
      asset?.entityId ||
      asset?.id ||
      null;

    this.onAudioConfigChanged(theme, slot, "url", assetId);
  }

  async createNewTheme() {
    const defaultTheme = this.displayThemes.find((t) => t.is_default);
    if (!defaultTheme) return;

    try {
      const baseName = defaultTheme.is_default
        ? this.translationService.translate("UE_LABEL_DEFAULT_THEME")
        : defaultTheme.name;
      const copySuffix = this.translationService.translate(
        "UE_LABEL_COPY_SUFFIX",
      );

      const created = await this.themeService.duplicateTheme(
        defaultTheme.entity_id,
        baseName + copySuffix,
      );
      this.editingState.themes = [...this.editingState.themes, created];
      this.refreshDisplayProperties();

      // Expand the new theme without activating it
      this.toggleThemeSection(created.entity_id, false);
      this.captureState();
    } catch (e) {
      this.logger.error("Failed to create theme from default", e);
      alert(this.translationService.translate("UE_ERROR_CREATE_FAILED"));
    }
  }

  async onThemeNameChanged(_theme: Theme) {
    this.captureState();
  }

  async onDuplicateTheme(theme: Theme) {
    const baseName = theme.is_default
      ? this.translationService.translate("UE_LABEL_DEFAULT_THEME")
      : theme.name;
    const copySuffix = this.translationService.translate(
      "UE_LABEL_COPY_SUFFIX",
    );

    try {
      const created = await this.themeService.duplicateTheme(
        theme.entity_id,
        baseName + copySuffix,
      );
      this.editingState.themes = [...this.editingState.themes, created];
      this.refreshDisplayProperties();
      this.captureState();
    } catch (e) {
      this.logger.error("Failed to duplicate theme", e);
      alert(this.translationService.translate("UE_ERROR_DUPLICATE_FAILED"));
    }
  }

  onDeleteTheme(theme: Theme) {
    if (!theme.is_default) {
      this.themeToDelete = theme;
      this.showDeleteConfirm = true;
    }
  }

  onConfirmDeleteTheme() {
    if (!this.themeToDelete) return;

    const themeIdToDelete = this.themeToDelete.entity_id;
    const wasActive = this.editingSettings.activeThemeId === themeIdToDelete;

    this.themeService.deleteTheme(themeIdToDelete).then(() => {
      this.editingState.themes = this.editingState.themes.filter(
        (t) => t.entity_id !== themeIdToDelete,
      );
      this.refreshDisplayProperties();

      if (wasActive) {
        const defaultTheme = this.displayThemes.find((t) => t.is_default);
        if (defaultTheme) {
          this.onThemeSelected(defaultTheme.entity_id);
        }
      }

      // Clean history: remove deleted theme from all snapshots
      this.undoManager.updateHistory((state) => {
        const s = JSON.parse(JSON.stringify(state));
        s.themes = (s.themes || []).filter(
          (t: any) => t.entity_id !== themeIdToDelete,
        );
        if (s.settings.activeThemeId === themeIdToDelete) {
          const def = (s.themes || []).find((t: any) => t.is_default);
          s.settings.activeThemeId = def ? def.entity_id : null;
        }
        return s;
      });

      // Reset tracking to new state (deletion is permanent)
      this.undoManager.resetTracking(this.editingState);
      this.cdr.markForCheck();

      this.showDeleteConfirm = false;
      this.themeToDelete = null;
    });
  }

  onCancelDeleteTheme() {
    this.showDeleteConfirm = false;
    this.themeToDelete = null;
  }

  onDetachTheme() {
    this.themeService.detachToSettings(this.assets);
    this.editingState.settings = this.cloneSettings(
      this.settingsService.getSettings(),
    );
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.markForCheck();
    }
  }
}
