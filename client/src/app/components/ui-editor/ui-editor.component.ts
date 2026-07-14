/* eslint-disable max-lines */
import { CommonModule, NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  computed,
  HostListener,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, of, Subscription } from "rxjs";
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
import { AudioConfig } from "@app/models/driver";
import { LayoutConfig, Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTTSContext } from "@app/utils/audio";
import { deepCopy } from "@app/utils/clone.utils";

export interface UIEditorState {
  settings: Settings;
  themes: Theme[];
}

import { WidgetInspectorFieldsComponent } from "./widget-inspector-fields/widget-inspector-fields.component";
import { WIDGET_REGISTRY } from "./widget-registry";

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
    NgTemplateOutlet,
    ConfirmationModalComponent,
    TranslatePipe,
    AcknowledgementModalComponent,
    DefaultRacedayComponent,
    WidgetInspectorFieldsComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class UIEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  isLoading = true;
  isSaving = false;
  isAutoSaving = false;
  scale = 1;
  assets: any[] = [];
  private params = toSignal(this.route.queryParams);

  backTargetUrl = computed(() => {
    const p = this.params();
    const from = p?.["from"] || this.route.snapshot.queryParamMap.get("from");
    const returnUrl =
      p?.["returnUrl"] || this.route.snapshot.queryParamMap.get("returnUrl");
    if (from === "modify-heats") {
      return returnUrl || "/default-raceday";
    }
    return returnUrl || "/raceday-setup";
  });

  backQueryParams = computed(() => {
    const p = this.params();
    const from = p?.["from"] || this.route.snapshot.queryParamMap.get("from");
    return from === "modify-heats" ? { modifyHeats: "true" } : {};
  });

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

  get hasLaneViewWidget(): boolean {
    return !!this.editingSettings?.racedayLayout?.widgets?.some(
      (w) => w.widgetType === "lane-view",
    );
  }

  get hasPracticeLaneViewWidget(): boolean {
    return !!this.editingSettings?.practiceRacedayLayout?.widgets?.some(
      (w) => w.widgetType === "lane-view",
    );
  }

  // Success modal properties
  showSuccessModal = false;
  successModalTitle = "";
  successModalMessage = "";
  successModalParams: any = {};
  private themeToCollapseAfterSuccess: string | null = null;

  showDeleteConfirm = false;
  themeToDelete: Theme | null = null;
  deleteThemeParams: any = {};

  showDiscardConfirm = false;
  private pendingDeactivate: ((result: boolean) => void) | null = null;

  // TODO(aufderheide): I think this list is duplicated below.  If they're the same they should share the code.
  layoutResolutionOptions: { label: string; width: number; height: number }[] =
    [];
  availableColumns = [
    { key: "driver.name", label: "RD_COL_NAME" },
    { key: "driver.nickname", label: "RD_COL_NICKNAME" },
    { key: "driver.avatarUrl", label: "RD_COL_AVATAR" },
    { key: "lapCount", label: "RD_COL_LAP" },
    { key: "reactionTime", label: "RD_COL_REACTION_TIME" },
    { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
    { key: "lastLaps", label: "RD_COL_LAST_LAPS" },
    { key: "medianLapTime", label: "RD_COL_MEDIAN_LAP" },
    { key: "averageLapTime", label: "RD_COL_AVG_LAP" },
    { key: "bestLapTime", label: "RD_COL_BEST_LAP" },
    { key: "totalTime", label: "RD_COL_TOTAL_TIME" },
    { key: "gapLeader", label: "RD_COL_GAP_LEADER" },
    { key: "gapPosition", label: "RD_COL_GAP_POSITION" },
    { key: "seed", label: "RD_COL_SEED" },
    { key: "rankHeat", label: "RD_COL_RANK_HEAT" },
    { key: "rankOverall", label: "RD_COL_RANK_OVERALL" },
    { key: "rankGroup", label: "RD_COL_RANK_GROUP" },
    { key: "participant.team.name", label: "RD_COL_TEAM" },
    { key: "participant.fuelLevel", label: "RD_COL_FUEL_LEVEL" },
    { key: "fuelCapacity", label: "RD_COL_FUEL_CAPACITY" },
    { key: "fuelPercentage", label: "RD_COL_FUEL_PERCENTAGE" },
    { key: "imageset_fuel-gauge-builtin", label: "RD_COL_FUEL_GAUGE" },
    { key: "mph", label: "RD_COL_MPH" },
    { key: "kph", label: "RD_COL_KPH" },
    { key: "fph", label: "RD_COL_FPH" },
    { key: "segmentTime", label: "RD_COL_SEGMENT_TIME" },
    { key: "flag", label: "RD_COL_DRIVER_STATE" },
    { key: "qrCode", label: "RD_COL_LANE_QR" },
    { key: "driverViewQrCode", label: "RD_COL_DRIVER_VIEW_QR" },
    { key: "laneNumber", label: "RD_COL_LANE" },
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
    racedayLayout: true,
    practiceRacedayLayout: false,
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
      key: "audio.heat_over",
      label: "UE_LABEL_HEAT_OVER_AUDIO",
      mode: "single",
    },
    {
      key: "audio.race_over",
      label: "UE_LABEL_RACE_OVER_AUDIO",
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

  // Mock properties required by RacedayLayoutNodeComponent for preview
  track: any = undefined;
  race: any = undefined;
  heat: any = undefined;
  totalHeats = 0;
  qrCodeUrl = "";
  formattedTime = "0:00.00";
  autoStatusLabel = "";
  isWarmup = false;
  showCountdownOverlay = false;
  raceRecordLapNickname = "RecordHolder";
  raceRecordLapTime = "5.000";
  raceRecordScoreNickname = "ScoreHolder";
  raceRecordScore = "10";
  currentRaceBestNickname = "RaceBest";
  currentRaceBestTime = "5.100";
  heatBestNickname = "HeatBest";
  heatBestTime = "5.200";
  leaderboardEntries: any[] = [];

  selectedWidgetId: string | null = null;
  selectedPracticeWidgetId: string | null = null;

  get selectedWidget(): any | null {
    if (
      !this.selectedWidgetId ||
      !this.editingSettings?.racedayLayout?.widgets
    ) {
      return null;
    }
    return (
      this.editingSettings.racedayLayout.widgets.find(
        (w: any) => w.id === this.selectedWidgetId,
      ) || null
    );
  }

  get selectedPracticeWidget(): any | null {
    if (
      !this.selectedPracticeWidgetId ||
      !this.editingSettings?.practiceRacedayLayout?.widgets
    ) {
      return null;
    }
    return (
      this.editingSettings.practiceRacedayLayout.widgets.find(
        (w: any) => w.id === this.selectedPracticeWidgetId,
      ) || null
    );
  }

  onWidgetSelected(id: string | null, isPractice: boolean = false) {
    if (isPractice) {
      this.selectedPracticeWidgetId = id;
    } else {
      this.selectedWidgetId = id;
    }
    if (id) {
      const widget = isPractice
        ? this.selectedPracticeWidget
        : this.selectedWidget;
      if (widget) {
        let mutated = false;
        if (widget.fontFamily === undefined || widget.fontFamily === null) {
          widget.fontFamily = "";
          mutated = true;
        }
        if (widget.scaleMode === undefined || widget.scaleMode === null) {
          widget.scaleMode = "auto";
          mutated = true;
        }

        if (
          widget.widgetType === "branding" ||
          widget.widgetType === "qr" ||
          widget.widgetType === "flag"
        ) {
          if (widget.scaleMode !== "auto") {
            widget.scaleMode = "auto";
            mutated = true;
          }
        }
        if (widget.textColor === undefined || widget.textColor === null) {
          widget.textColor = "";
          mutated = true;
        }
        if (
          widget.backgroundColor === undefined ||
          widget.backgroundColor === null
        ) {
          widget.backgroundColor = "";
          mutated = true;
        }
        if (widget.fontSize === undefined) {
          widget.fontSize = 24;
          mutated = true;
        }
        if (widget.textScaleFactor === undefined) {
          widget.textScaleFactor = 1.0;
          mutated = true;
        }
        const registryEntry = WIDGET_REGISTRY[widget.widgetType];
        if (registryEntry?.defaultSettings) {
          if (!widget.customSettings) {
            widget.customSettings = registryEntry.defaultSettings();
            mutated = true;
          } else {
            const defaults = registryEntry.defaultSettings();
            for (const key of Object.keys(defaults)) {
              if (widget.customSettings[key] === undefined) {
                widget.customSettings[key] = defaults[key];
                mutated = true;
              }
            }
          }
        }
        if (mutated) {
          this.editingState.settings = this.cloneSettings(
            this.editingState.settings,
          );
        }
      }
    }
    this.cdr.markForCheck();
  }

  onTextColorChange(event: Event, isPractice: boolean = false) {
    const value = (event.target as HTMLInputElement).value;
    const widget = isPractice
      ? this.selectedPracticeWidget
      : this.selectedWidget;
    if (widget) {
      widget.textColor = value;
      this.captureState();
      this.cdr.markForCheck();
    }
  }

  onBackgroundColorChange(event: Event, isPractice: boolean = false) {
    const value = (event.target as HTMLInputElement).value;
    const widget = isPractice
      ? this.selectedPracticeWidget
      : this.selectedWidget;
    if (widget) {
      widget.backgroundColor = value;
      this.captureState();
      this.cdr.markForCheck();
    }
  }

  getCurrentFlagUrl() {
    return "";
  }

  onRacedayLayoutChanged(newLayout: any) {
    if (this.isSaving) return;
    this.editingSettings.racedayLayout = newLayout;
    this.undoManager.captureState();
  }

  onPracticeRacedayLayoutChanged(newLayout: any) {
    if (this.isSaving) return;
    this.editingSettings.practiceRacedayLayout = newLayout;
    this.undoManager.captureState();
  }

  onColumnsChanged() {
    if (this.isSaving) return;
    // editingSettings.racedayColumns and columnLayouts are mutated directly by default-raceday
    // we just need to capture the state
    this.undoManager.captureState();
  }

  resetRacedayLayout() {
    // Deselect any widget first to prevent the inspector from rendering
    // with undefined customSettings during the layout replacement.
    this.selectedWidgetId = null;
    if (
      this.layoutResolutionOptions &&
      this.layoutResolutionOptions.length > 0
    ) {
      this.layoutResolutionOptions[0].width = window.innerWidth;
      this.layoutResolutionOptions[0].height = window.innerHeight;
    }
    this.editingSettings.racedayLayout = this.getScaledDefaultLayout(false);
    this.editingSettings.racedayColumns = [...Settings.DEFAULT_COLUMNS];
    this.editingSettings.columnLayouts = JSON.parse(
      JSON.stringify(new Settings().columnLayouts),
    );
    this.editingSettings.columnVisibility = JSON.parse(
      JSON.stringify(new Settings().columnVisibility),
    );
    // Provide new object reference for child components to detect change
    this.editingState.settings = deepCopy(this.editingSettings);
    this.undoManager.captureState();
    this.refreshDisplayProperties();
    this.cdr.detectChanges();
  }

  resetPracticeRacedayLayout() {
    this.selectedPracticeWidgetId = null;
    if (
      this.layoutResolutionOptions &&
      this.layoutResolutionOptions.length > 0
    ) {
      this.layoutResolutionOptions[0].width = window.innerWidth;
      this.layoutResolutionOptions[0].height = window.innerHeight;
    }
    this.editingSettings.practiceRacedayLayout =
      this.getScaledDefaultLayout(true);
    this.editingSettings.practiceRacedayColumns = [
      ...Settings.DEFAULT_PRACTICE_COLUMNS,
    ];
    this.editingSettings.practiceColumnLayouts = JSON.parse(
      JSON.stringify(new Settings().practiceColumnLayouts),
    );
    this.editingSettings.practiceColumnVisibility = JSON.parse(
      JSON.stringify(new Settings().practiceColumnVisibility),
    );
    this.editingState.settings = deepCopy(this.editingSettings);
    this.undoManager.captureState();
    this.refreshDisplayProperties();
    this.cdr.detectChanges();
  }

  exportRacedayLayout() {
    const layoutExport = {
      layout: this.editingSettings.racedayLayout,
      columns: this.editingSettings.racedayColumns,
      columnLayouts: this.editingSettings.columnLayouts,
      columnVisibility: this.editingSettings.columnVisibility,
      columnAnchors: this.editingSettings.columnAnchors,
    };
    this.downloadJson(layoutExport, "raceday-layout.json");
  }

  onImportRacedayLayout(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layoutData = JSON.parse(e.target?.result as string);
        const layout =
          layoutData.layout ||
          layoutData.racedayLayout ||
          layoutData.practiceRacedayLayout;

        if (layout) {
          this.editingSettings.racedayLayout = layout;
          this.editingSettings.racedayColumns =
            layoutData.columns ||
            layoutData.racedayColumns ||
            layoutData.practiceRacedayColumns ||
            Settings.DEFAULT_COLUMNS;
          this.editingSettings.columnLayouts =
            layoutData.columnLayouts || layoutData.practiceColumnLayouts || {};
          this.editingSettings.columnVisibility =
            layoutData.columnVisibility ||
            layoutData.practiceColumnVisibility ||
            {};

          const anchors =
            layoutData.columnAnchors || layoutData.practiceColumnAnchors;
          if (anchors) {
            this.editingSettings.columnAnchors = anchors;
          }
          this.editingState.settings = deepCopy(this.editingSettings);
          this.undoManager.captureState();
          this.refreshDisplayProperties();
          this.cdr.detectChanges();
        }
      } catch (err) {
        this.logger.error("Failed to parse layout file", err);
      }
    };
    reader.readAsText(file);
    input.value = "";
  }

  exportPracticeRacedayLayout() {
    const layoutExport = {
      layout: this.editingSettings.practiceRacedayLayout,
      columns: this.editingSettings.practiceRacedayColumns,
      columnLayouts: this.editingSettings.practiceColumnLayouts,
      columnVisibility: this.editingSettings.practiceColumnVisibility,
      columnAnchors: this.editingSettings.practiceColumnAnchors,
    };
    this.downloadJson(layoutExport, "practice-raceday-layout.json");
  }

  onImportPracticeRacedayLayout(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layoutData = JSON.parse(e.target?.result as string);
        const layout =
          layoutData.layout ||
          layoutData.practiceRacedayLayout ||
          layoutData.racedayLayout;

        if (layout) {
          this.editingSettings.practiceRacedayLayout = layout;
          this.editingSettings.practiceRacedayColumns =
            layoutData.columns ||
            layoutData.practiceRacedayColumns ||
            layoutData.racedayColumns ||
            Settings.DEFAULT_PRACTICE_COLUMNS;
          this.editingSettings.practiceColumnLayouts =
            layoutData.columnLayouts || layoutData.practiceColumnLayouts || {};
          this.editingSettings.practiceColumnVisibility =
            layoutData.columnVisibility ||
            layoutData.practiceColumnVisibility ||
            {};

          const anchors =
            layoutData.columnAnchors || layoutData.practiceColumnAnchors;
          if (anchors) {
            this.editingSettings.practiceColumnAnchors = anchors;
          }
          this.editingState.settings = deepCopy(this.editingSettings);
          this.undoManager.captureState();
          this.refreshDisplayProperties();
          this.cdr.detectChanges();
        }
      } catch (err) {
        this.logger.error("Failed to parse layout file", err);
      }
    };
    reader.readAsText(file);
    input.value = "";
  }

  private downloadJson(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  constructor(
    private settingsService: SettingsService,
    private fileSystem: FileSystemService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public themeService: ThemeService,
    private translationService: TranslationService,
    private logger: LoggerService,
    private route: ActivatedRoute,
    private raceConnectionService: RaceConnectionService,
  ) {
    this.layoutResolutionOptions = [
      {
        label: "UI_EDITOR_RESOLUTION_CURRENT_DISPLAY",
        width: window.innerWidth,
        height: window.innerHeight,
      },
      { label: "UI_EDITOR_RESOLUTION_DESKTOP_TV", width: 1920, height: 1080 },
      { label: "UI_EDITOR_RESOLUTION_MAC_PC", width: 1920, height: 1200 },
      { label: "UI_EDITOR_RESOLUTION_OLDER_PC", width: 1600, height: 1200 },
      { label: "UI_EDITOR_RESOLUTION_1280_1024", width: 1280, height: 1024 },
      { label: "UI_EDITOR_RESOLUTION_ULTRAWIDE", width: 2560, height: 1080 },
      {
        label: "UI_EDITOR_RESOLUTION_MODERN_PHONES",
        width: 2532,
        height: 1170,
      },
      { label: "UI_EDITOR_RESOLUTION_IPAD_TABLET", width: 1024, height: 768 },
    ];
    this.undoManager = new UndoManager<UIEditorState>(
      {
        clonner: (s: UIEditorState) => this.cloneState(s),
        equalizer: (a: UIEditorState, b: UIEditorState) =>
          this.areStatesEqual(a, b),
        applier: (s: UIEditorState) => {
          this.editingState = s;
          this.refreshDisplayProperties();
        },
      },
      () => this.editingState,
    );
  }

  /* eslint-disable max-lines-per-function */
  ngOnInit() {
    this.sortAvailableColumns();
    this.updateScale();
    this.loadExpanderState();
    this.loadData();
    this.dataService.setConnectionIntent("preview");
    this.raceConnectionService.connect();

    // Auto-save on changes (like Driver Editor)
    if (this.undoManager) {
      this.undoManager.stateCommitted$.subscribe(() => {
        this.autoSaveState();
      });
    }

    this.dataSubscription = this.translationService
      .getTranslationsLoaded()
      .subscribe((loaded) => {
        if (loaded) {
          this.sortAvailableColumns();
          if (!this.isDestroyed) {
            this.cdr.markForCheck();
          }
        }
      });
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.raceConnectionService.disconnect();
    this.dataService.setConnectionIntent("");
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.undoManager.destroy();
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
    const currentDisplayOption = this.layoutResolutionOptions.find(
      (o) => o.label === "UI_EDITOR_RESOLUTION_CURRENT_DISPLAY",
    );
    if (currentDisplayOption) {
      currentDisplayOption.width = window.innerWidth;
      currentDisplayOption.height = window.innerHeight;
    }
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
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

  /* eslint-disable max-lines-per-function */
  loadData() {
    this.isLoading = true;
    this.dataSubscription = forkJoin({
      assets: this.dataService.listAssets(),
      dirHandle: this.fileSystem.getCustomDirectoryHandle(),
      themes: this.dataService.getThemes(),
      tracks: this.dataService.getTracks(),
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
        this.soundAssets = this.assets.filter(
          (a) => a.type === "sound" || a.type === "audio_set",
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

        // Reset availableColumns to base set + dynamic image sets
        this.availableColumns = [
          { key: "driver.name", label: "RD_COL_NAME" },
          { key: "driver.nickname", label: "RD_COL_NICKNAME" },
          { key: "driver.avatarUrl", label: "RD_COL_AVATAR" },
          { key: "lapCount", label: "RD_COL_LAP" },
          { key: "reactionTime", label: "RD_COL_REACTION_TIME" },
          { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
          { key: "lastLaps", label: "RD_COL_LAST_LAPS" },
          { key: "medianLapTime", label: "RD_COL_MEDIAN_LAP" },
          { key: "averageLapTime", label: "RD_COL_AVG_LAP" },
          { key: "bestLapTime", label: "RD_COL_BEST_LAP" },
          { key: "totalTime", label: "RD_COL_TOTAL_TIME" },
          { key: "gapLeader", label: "RD_COL_GAP_LEADER" },
          { key: "gapPosition", label: "RD_COL_GAP_POSITION" },
          { key: "seed", label: "RD_COL_SEED" },
          { key: "rankHeat", label: "RD_COL_RANK_HEAT" },
          { key: "rankOverall", label: "RD_COL_RANK_OVERALL" },
          { key: "rankGroup", label: "RD_COL_RANK_GROUP" },
          { key: "participant.team.name", label: "RD_COL_TEAM" },
          { key: "participant.fuelLevel", label: "RD_COL_FUEL_LEVEL" },
          { key: "fuelCapacity", label: "RD_COL_FUEL_CAPACITY" },
          { key: "fuelPercentage", label: "RD_COL_FUEL_PERCENTAGE" },
          { key: "imageset_fuel-gauge-builtin", label: "RD_COL_FUEL_GAUGE" },
          { key: "mph", label: "RD_COL_MPH" },
          { key: "kph", label: "RD_COL_KPH" },
          { key: "fph", label: "RD_COL_FPH" },
          { key: "segmentTime", label: "RD_COL_SEGMENT_TIME" },
          { key: "flag", label: "RD_COL_DRIVER_STATE" },
          { key: "qrCode", label: "RD_COL_LANE_QR" },
          { key: "driverViewQrCode", label: "RD_COL_DRIVER_VIEW_QR" },
          { key: "laneNumber", label: "RD_COL_LANE" },
          ...imageSetColumns,
        ];
        this.sortAvailableColumns();

        this.customDirectoryName = result.dirHandle?.name || null;
        const themes = result.themes || [];
        const tracks = result.tracks || [];
        if (tracks.length > 0) {
          this.track = tracks[0];
        }

        const settings = this.settingsService.getSettings();
        const editingSettings = this.cloneSettings(settings);

        // Populate default layout if none exists (e.g. fresh install)
        // so that hasLaneViewWidget evaluates correctly and shows the column toolbox
        if (!editingSettings.racedayLayout) {
          editingSettings.racedayLayout = JSON.parse(
            JSON.stringify(Settings.DEFAULT_LAYOUT),
          );
        }

        if (!editingSettings.practiceRacedayLayout) {
          editingSettings.practiceRacedayLayout = JSON.parse(
            JSON.stringify(Settings.DEFAULT_PRACTICE_LAYOUT),
          );
        }

        if (!editingSettings.activeThemeId && themes.length > 0) {
          const defaultTheme = themes.find((t) => t.is_default);
          if (defaultTheme) {
            editingSettings.activeThemeId = defaultTheme.entity_id;
            this.themeService.setActiveTheme(defaultTheme.entity_id);
          }
        }

        this.editingState = {
          settings: editingSettings,
          themes: deepCopy(themes),
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

  private cloneSettings(s: Settings): Settings {
    const clone = Object.assign(new Settings(), s);
    clone.recentRaceIds = [...(s.recentRaceIds || [])];
    clone.selectedDriverIds = [...(s.selectedDriverIds || [])];
    clone.racedayColumns = [...(s.racedayColumns || [])];
    clone.columnAnchors = { ...(s.columnAnchors || {}) };
    clone.practiceRacedayColumns = [...(s.practiceRacedayColumns || [])];
    clone.practiceColumnAnchors = { ...(s.practiceColumnAnchors || {}) };

    // Safely clone layouts and visibility
    const layouts = s.columnLayouts || {};
    clone.columnLayouts = deepCopy(layouts);

    const visibility = s.columnVisibility || {};
    clone.columnVisibility = deepCopy(visibility);

    const practiceLayouts = s.practiceColumnLayouts || {};
    clone.practiceColumnLayouts = deepCopy(practiceLayouts);

    const practiceVisibility = s.practiceColumnVisibility || {};
    clone.practiceColumnVisibility = deepCopy(practiceVisibility);

    clone.highlightRowOnLap = s.highlightRowOnLap ?? true;
    clone.highlightPracticeRowOnLap = s.highlightPracticeRowOnLap ?? true;
    clone.pageTransition = s.pageTransition || "slide";

    // Theme fields
    clone.activeThemeId = s.activeThemeId;
    clone.raceThemeOverrides = { ...(s.raceThemeOverrides || {}) };
    clone.lampRedOn = s.lampRedOn;
    clone.lampRedDim = s.lampRedDim;
    clone.lampGreen = s.lampGreen;
    clone.fuelGaugeImageSet = s.fuelGaugeImageSet;
    clone.demoConfig = s.demoConfig ? { ...s.demoConfig } : undefined;
    clone.racedayLayout = s.racedayLayout
      ? deepCopy(s.racedayLayout)
      : undefined;
    clone.practiceRacedayLayout = s.practiceRacedayLayout
      ? deepCopy(s.practiceRacedayLayout)
      : undefined;

    return clone;
  }

  isColumnSelected(columnKey: string): boolean {
    return this.editingSettings.racedayColumns.includes(columnKey);
  }

  private cloneState(s: UIEditorState): UIEditorState {
    return {
      settings: this.cloneSettings(s.settings),
      themes: deepCopy(s.themes),
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
      a.highlightPracticeRowOnLap === b.highlightPracticeRowOnLap &&
      a.pageTransition === b.pageTransition &&
      a.activeThemeId === b.activeThemeId &&
      a.lampRedOn === b.lampRedOn &&
      a.lampRedDim === b.lampRedDim &&
      a.lampGreen === b.lampGreen &&
      a.fuelGaugeImageSet === b.fuelGaugeImageSet &&
      a.layoutEditorMinimized === b.layoutEditorMinimized &&
      a.layoutEditorPositionX === b.layoutEditorPositionX &&
      a.layoutEditorPositionY === b.layoutEditorPositionY &&
      a.columnEditorMinimized === b.columnEditorMinimized &&
      a.columnEditorPositionX === b.columnEditorPositionX &&
      a.columnEditorPositionY === b.columnEditorPositionY &&
      JSON.stringify(a.demoConfig) === JSON.stringify(b.demoConfig) &&
      JSON.stringify(a.racedayColumns) === JSON.stringify(b.racedayColumns) &&
      JSON.stringify(a.columnAnchors) === JSON.stringify(b.columnAnchors) &&
      JSON.stringify(a.columnLayouts) === JSON.stringify(b.columnLayouts) &&
      JSON.stringify(a.columnVisibility) ===
        JSON.stringify(b.columnVisibility) &&
      JSON.stringify(a.racedayLayout) === JSON.stringify(b.racedayLayout) &&
      JSON.stringify(a.practiceRacedayColumns) ===
        JSON.stringify(b.practiceRacedayColumns) &&
      JSON.stringify(a.practiceColumnAnchors) ===
        JSON.stringify(b.practiceColumnAnchors) &&
      JSON.stringify(a.practiceColumnLayouts) ===
        JSON.stringify(b.practiceColumnLayouts) &&
      JSON.stringify(a.practiceColumnVisibility) ===
        JSON.stringify(b.practiceColumnVisibility) &&
      JSON.stringify(a.practiceRacedayLayout) ===
        JSON.stringify(b.practiceRacedayLayout)
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
      if (
        this.isLoading ||
        this.isSaving ||
        !this.hasChanges() ||
        this.isAnyThemeNameInvalid()
      ) {
        resolve();
        return;
      }

      this.isAutoSaving = true;
      this.isSaving = true;

      // 1. Save Settings
      this.settingsService.saveSettings(this.editingSettings);

      // 2. Save changed Themes
      const savePromises = [];
      const initialState = this.undoManager.getInitialState();

      for (const theme of this.displayThemes) {
        if (!theme.is_default) {
          let hasChanged = true;
          if (initialState && initialState.themes) {
            const initialTheme = initialState.themes.find(
              (t) => t.entity_id === theme.entity_id,
            );
            if (
              initialTheme &&
              JSON.stringify(initialTheme) === JSON.stringify(theme)
            ) {
              hasChanged = false;
            }
          }
          if (hasChanged) {
            savePromises.push(
              this.dataService.updateTheme(theme.entity_id, theme),
            );
          }
        }
      }

      const obs = savePromises.length > 0 ? forkJoin(savePromises) : of([null]);

      obs.subscribe({
        next: () => {
          this.undoManager.resetTracking(this.editingState);
          const activeTheme = this.themeService.getActiveTheme();
          if (
            activeTheme &&
            this.displayThemes.find(
              (t) => t.entity_id === activeTheme.entity_id,
            )
          ) {
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
        },
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
    this.editingState.settings = this.cloneSettings(this.editingState.settings);
    this.undoManager.captureState();
  }

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveExpanderState();
  }

  toggleThemeSection(themeId: string, activate = false) {
    const wasExpanded = !!this.sectionsExpanded[themeId];

    // Collapse all theme sections
    this.displayThemes.forEach(
      (t) => (this.sectionsExpanded[t.entity_id] = false),
    );

    if (!wasExpanded) {
      // Expand
      this.sectionsExpanded[themeId] = true;
      // Only activate if not already active to prevent recursion
      if (activate && this.editingSettings.activeThemeId !== themeId) {
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

  getWidgetTypeLabelKey(widgetType: string): string {
    return "UE_WIDGET_TYPE_" + widgetType.toUpperCase().replace(/-/g, "_");
  }

  // --- Theme management ---

  get activeTheme(): Theme | null {
    return this.themeService.getActiveTheme();
  }

  get isThemeActive(): boolean {
    return this.themeService.isThemeActive();
  }

  soundAssets: any[] = [];
  previewTTSContext: any = mockTTSContext();

  private sortAvailableColumns() {
    this.availableColumns.sort((a, b) => {
      const labelA = this.translationService.translate(a.label) || a.label;
      const labelB = this.translationService.translate(b.label) || b.label;
      return labelA.localeCompare(labelB);
    });
  }

  /**
   * Provides mock context data for previewing Text-to-Speech in the editor.
   * This is only used for the UI Editor's preview functionality.
   */

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
    let fallbackConfig: AudioConfig = { type: "preset" };
    if (legacyAssetId) {
      fallbackConfig = { type: "preset", url: legacyAssetId };
    }

    theme.audio_slots[slot] = fallbackConfig;
    return fallbackConfig;
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

      // Show success message using RCAI modal
      this.successModalTitle = "GEN_SUCCESS";
      this.successModalMessage = "UE_SUCCESS_CREATE";
      this.successModalParams = { name: created.name };
      this.showSuccessModal = true;
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

      // Preserve current active theme - do not activate the new theme
      const currentActiveThemeId = this.editingSettings.activeThemeId;

      // Always keep new theme collapsed
      this.sectionsExpanded[created.entity_id] = false;

      // Collapse original theme after success modal
      this.themeToCollapseAfterSuccess = theme.entity_id;

      this.saveExpanderState();

      // Ensure the new theme is not activated
      this.editingSettings.activeThemeId = currentActiveThemeId;

      this.captureState();

      // Show success message using RCAI modal
      this.successModalTitle = "GEN_SUCCESS";
      this.successModalMessage = "UE_SUCCESS_DUPLICATE";
      this.successModalParams = { name: created.name };
      this.showSuccessModal = true;
    } catch (e) {
      this.logger.error("Failed to duplicate theme", e);
      alert(this.translationService.translate("UE_ERROR_DUPLICATE_FAILED"));
    }
  }

  onDeleteTheme(theme: Theme) {
    if (!theme.is_default) {
      this.themeToDelete = theme;
      this.deleteThemeParams = { name: theme.name };
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
        const s = deepCopy(state);
        s.themes = (s.themes || []).filter(
          (t: any) => t.entity_id !== themeIdToDelete,
        );
        if (s.settings.activeThemeId === themeIdToDelete) {
          const def = (s.themes || []).find((t: any) => t.is_default);
          s.settings.activeThemeId = def ? def.entity_id : undefined;
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
    this.deleteThemeParams = {};
  }

  onSuccessModalAcknowledge() {
    this.showSuccessModal = false;
    this.successModalTitle = "";
    this.successModalMessage = "";
    this.successModalParams = {};

    // Collapse all themes after successful duplication
    this.editingState.themes.forEach((t) => {
      this.sectionsExpanded[t.entity_id] = false;
    });
    this.saveExpanderState();
    this.themeToCollapseAfterSuccess = null;
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

  getLayoutResolution(isPractice: boolean): string {
    const layout = isPractice
      ? this.editingSettings?.practiceRacedayLayout
      : this.editingSettings?.racedayLayout;
    if (layout && layout.baseWidth && layout.baseHeight) {
      return `${layout.baseWidth}x${layout.baseHeight}`;
    }
    return "1920x1080";
  }

  // Cached custom options
  private customRacedayLayoutOption: any = null;
  private customPracticeLayoutOption: any = null;

  private cachedPracticeLayoutOptions: any[] | null = null;
  private cachedRacedayLayoutOptions: any[] | null = null;

  getLayoutResolutionOptions(isPractice: boolean) {
    const layout = isPractice
      ? this.editingSettings?.practiceRacedayLayout
      : this.editingSettings?.racedayLayout;

    if (layout && layout.baseWidth && layout.baseHeight) {
      const found = this.layoutResolutionOptions.find(
        (o) => o.width === layout.baseWidth && o.height === layout.baseHeight,
      );
      if (!found) {
        if (isPractice) {
          if (
            !this.customPracticeLayoutOption ||
            this.customPracticeLayoutOption.width !== layout.baseWidth ||
            this.customPracticeLayoutOption.height !== layout.baseHeight
          ) {
            this.customPracticeLayoutOption = {
              label: `${layout.baseWidth}x${layout.baseHeight}`,
              width: layout.baseWidth,
              height: layout.baseHeight,
            };
            this.cachedPracticeLayoutOptions = [
              ...this.layoutResolutionOptions,
              this.customPracticeLayoutOption,
            ];
          }
          if (!this.cachedPracticeLayoutOptions) {
            this.cachedPracticeLayoutOptions = [
              ...this.layoutResolutionOptions,
              this.customPracticeLayoutOption,
            ];
          }
          return this.cachedPracticeLayoutOptions;
        } else {
          if (
            !this.customRacedayLayoutOption ||
            this.customRacedayLayoutOption.width !== layout.baseWidth ||
            this.customRacedayLayoutOption.height !== layout.baseHeight
          ) {
            this.customRacedayLayoutOption = {
              label: `${layout.baseWidth}x${layout.baseHeight}`,
              width: layout.baseWidth,
              height: layout.baseHeight,
            };
            this.cachedRacedayLayoutOptions = [
              ...this.layoutResolutionOptions,
              this.customRacedayLayoutOption,
            ];
          }
          if (!this.cachedRacedayLayoutOptions) {
            this.cachedRacedayLayoutOptions = [
              ...this.layoutResolutionOptions,
              this.customRacedayLayoutOption,
            ];
          }
          return this.cachedRacedayLayoutOptions;
        }
      }
    }
    return this.layoutResolutionOptions;
  }

  setLayoutResolution(isPractice: boolean, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const layout = isPractice
      ? this.editingSettings?.practiceRacedayLayout
      : this.editingSettings?.racedayLayout;
    if (!layout) return;
    const [widthStr, heightStr] = value.split("x");
    const newWidth = parseInt(widthStr, 10);
    const newHeight = parseInt(heightStr, 10);
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

    this.captureState();
  }

  onCustomResolutionChange(
    isPractice: boolean,
    dimension: "width" | "height",
    event: Event,
  ) {
    const input = event.target as HTMLInputElement;
    const newValue = parseInt(input.value, 10);
    if (isNaN(newValue) || newValue <= 0) return;

    const layout = isPractice
      ? this.editingSettings?.practiceRacedayLayout
      : this.editingSettings?.racedayLayout;

    if (!layout) return;

    const oldWidth = layout.baseWidth || 1920;
    const oldHeight = layout.baseHeight || 1080;

    const newWidth = dimension === "width" ? newValue : oldWidth;
    const newHeight = dimension === "height" ? newValue : oldHeight;

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

    this.captureState();
  }

  getPreviewScale(isPractice: boolean): string {
    return `scale(${this.getPreviewScaleNumber(isPractice)})`;
  }

  getPreviewScaleNumber(isPractice: boolean): number {
    const layout = isPractice
      ? this.editingSettings?.practiceRacedayLayout
      : this.editingSettings?.racedayLayout;
    const baseWidth = layout?.baseWidth || 1920;
    const baseHeight = layout?.baseHeight || 1080;

    // Use the container dimensions that `.raceday-preview-container` is constrained to
    const containerWidth = 1080;
    const containerHeight = 608;
    return Math.min(containerWidth / baseWidth, containerHeight / baseHeight);
  }

  getPreviewContainerWidth(isPractice: boolean): number {
    const layout = isPractice
      ? this.editingSettings?.practiceRacedayLayout
      : this.editingSettings?.racedayLayout;
    const baseWidth = layout?.baseWidth || 1920;
    return baseWidth * this.getPreviewScaleNumber(isPractice);
  }

  getPreviewContainerHeight(isPractice: boolean): number {
    const layout = isPractice
      ? this.editingSettings?.practiceRacedayLayout
      : this.editingSettings?.racedayLayout;
    const baseHeight = layout?.baseHeight || 1080;
    return baseHeight * this.getPreviewScaleNumber(isPractice);
  }

  private getScaledDefaultLayout(isPractice: boolean): LayoutConfig {
    const layout = JSON.parse(
      JSON.stringify(
        isPractice ? Settings.DEFAULT_PRACTICE_LAYOUT : Settings.DEFAULT_LAYOUT,
      ),
    ) as LayoutConfig;

    const targetW = window.innerWidth;
    const targetH = window.innerHeight;
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
}
