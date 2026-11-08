import { DragDropModule } from "@angular/cdk/drag-drop";
import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeStyle, Title } from "@angular/platform-browser";
import {
  ActivatedRoute,
  NavigationStart,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable, Subject, Subscription } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { LoginDialogComponent } from "@app/components/login-dialog/login-dialog.component";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import { DisallowLapRecordsDialogComponent } from "@app/components/shared/disallow-lap-records-dialog/disallow-lap-records-dialog.component";
import { InputDialogComponent } from "@app/components/shared/input-dialog/input-dialog.component";
import { PdfExportDialogComponent } from "@app/components/shared/pdf-export-dialog/pdf-export-dialog.component";
import { RaceHistoryDialogComponent } from "@app/components/shared/race-history-dialog/race-history-dialog.component";
import { DataService } from "@app/data.service";
import { CanComponentDeactivate } from "@app/guards/raceday.guard";
import { CustomUI } from "@app/models/custom-ui";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Role } from "@app/models/role";
import { LayoutConfig, Settings } from "@app/models/settings";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IInterfaceAlertEvent, RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { AudioService } from "@app/services/audio.service";
import { AuthService } from "@app/services/auth.service";
import { ChildWindowManagerService } from "@app/services/child-window-manager.service";
import { CustomUiService } from "@app/services/custom-ui.service";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { DateTimeFormatService } from "@app/services/date-time-format.service";
import { HelpService } from "@app/services/help.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import {
  RacePredictionRecord,
  RacePredictionService,
} from "@app/services/race-prediction.service";
import { RaceTimeService } from "@app/services/race-time.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { FuelAudioTracker } from "@app/utils/fuel-audio-tracker";
import { ViewerRaceEndedHandler } from "@app/utils/viewer-race-ended-handler";

import { DefaultRacedayActionsBase } from "./bases/default-raceday-actions.base";
import { ColumnDefinition } from "./column_definition";
import { AddLapSectionsDialogComponent } from "./components/add-lap-sections-dialog/add-lap-sections-dialog.component";
import { RacedayAbsoluteWidgetComponent } from "./components/raceday-absolute-widget/raceday-absolute-widget.component";
import { RacedayHeatDriversComponent } from "./components/raceday-heat-drivers/raceday-heat-drivers.component";
import { RacedayModalsComponent } from "./components/raceday-modals/raceday-modals.component";
import { RacedayGridDescriptor } from "./helpers/raceday-grid-descriptor.helper";
import { RacedayInitSetupHelper } from "./helpers/raceday-init-setup.helper";
import { RacedayRecordsStatsHelper } from "./helpers/raceday-records-stats.helper";
import { LaneGridAnimationHelper } from "./utils/lane-grid-animation.helper";
import {
  LaneGridBounds,
  LaneGridReplicationHelper,
  LaneGridSession,
} from "./utils/lane-grid-replication.helper";

export type { RacedayGridDescriptor } from "./helpers/raceday-grid-descriptor.helper";
export type { LapDisplayInfo } from "./helpers/raceday-column-layout.helper";

/**
 * The raceday component is the main component for the raceday screen.
 */
@Component({
  standalone: true,
  selector: "app-default-raceday",
  templateUrl: "./default-raceday.component.html",
  styleUrls: ["./default-raceday.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [AudioService],
  imports: [
    RacedayModalsComponent,
    FormsModule,
    LoginDialogComponent,
    RacedayAbsoluteWidgetComponent,
    RacedayHeatDriversComponent,
    DragDropModule,
    TranslatePipe,
    AddLapSectionsDialogComponent,
    PdfExportDialogComponent,
    InputDialogComponent,
    NgTemplateOutlet,
    DisallowLapRecordsDialogComponent,
    RaceHistoryDialogComponent,
    BrowserNavigationComponent,
  ],
})
export class DefaultRacedayComponent
  extends DefaultRacedayActionsBase
  implements OnInit, OnDestroy, OnChanges, CanComponentDeactivate
{
  showPdfExportDialog = false;
  defaultIncludeBackground = true;
  showSaveRaceDialog = false;
  saveRaceName = "";
  showDisallowLapRecordsDialog = false;
  showRaceHistoryDialog = false;

  get disallowLapRecordsHeats(): Heat[] {
    return RacedayRecordsStatsHelper.getDisallowLapRecordsHeats(this);
  }

  onRecordsUpdated(event: {
    heatNumber: number;
    lane: number;
    lapIndex: number;
    countTowardsRecords: boolean;
  }): void {
    RacedayRecordsStatsHelper.onRecordsUpdated(this, event);
  }

  get currentRaceDate(): Date | number | string {
    return RacedayRecordsStatsHelper.getCurrentRaceDate(this);
  }

  private isDestroyed = false;
  private subscriptions: Subscription[] = [];
  protected heat?: Heat;
  public track?: Track;
  public race!: Race;
  protected columns: ColumnDefinition[];
  protected errorMessage?: string;
  protected startResumeShortcut: string = "Ctrl+S";
  protected pauseShortcut: string = "Ctrl+P";
  protected nextHeatShortcut: string = "Ctrl+N";
  protected restartHeatShortcut: string = "Ctrl+R";
  protected skipHeatShortcut: string = "Alt+F5";
  protected deferHeatShortcut: string = "Alt+F6";
  protected time: number = 0;
  protected timeFormat: string = "1.0-0";
  protected autoStartRemaining: number = 0;
  protected autoAdvanceRemaining: number = 0;
  protected readonly LAP_ADJUSTMENT_AMOUNT = 0.25;
  protected sortedHeatDrivers: DriverHeatData[] = [];
  protected driverVisualPositions = new Map<number, number>();
  protected allDrivers: any[] = [];
  public participants: RaceParticipant[] = [];
  private raceTimeService = inject(RaceTimeService, { optional: true });

  // Countdown Overlay state
  showCountdownOverlay: boolean = false;
  countdownLamps: any[] = [];
  countdownText: string = "";
  protected showModifyHeatsModal: boolean = false;
  protected showAddLapSectionsDialog: boolean = false;
  protected isMenuModeForAddLap: boolean = false;
  protected selectedHeatDriver: DriverHeatData | null = null;
  public heats: Heat[] = [];
  countdownColor: string = "";
  countdownTotalLamps: number = 0;
  private lastPlayedCountdownSecond: number = -1;
  private lastCountdownSoundTime: number = -1;
  protected isRestarting: boolean = false;
  isPrinting = false;

  @HostListener("window:beforeprint")
  onBeforePrint() {
    this.isPrinting = true;
    this.cdr.detectChanges();
  }

  @HostListener("window:afterprint")
  onAfterPrint() {
    this.isPrinting = false;
    this.cdr.detectChanges();
  }

  // Static record values for now as requested
  // Record values
  protected raceRecordLapNickname: string = "";
  protected raceRecordLapTime: number = 0;
  protected raceRecordScoreNickname: string = "";
  protected raceRecordScore: number = 0;
  protected currentRaceBestNickname: string = "";
  protected currentRaceBestTime: number = 0;
  protected heatBestNickname: string = "";
  protected heatBestTime: number = 0;

  // Stable-order list. DOM order never changes; visual position is from rank.
  protected leaderboardEntries: any[] = [];
  protected groupLeaderboardEntries: any[] = [];
  protected groupParticipants: RaceParticipant[] = [];
  protected currentGroup: number = 0;
  protected qrCodeUrl?: string;
  protected serverUrlBase: string = window?.location?.origin || "";
  protected laneQrCodeCache = new Map<number, string>();
  protected generatingLaneQrCodes = new Set<number>();
  protected driverViewQrCodeCache = new Map<string, string>();
  private latestPredictionRecord: RacePredictionRecord | null = null;

  private previousTime: number = 0;
  private playedSecondsLeft = new Set<number>();
  private playedSecondsElapsed = new Set<number>();
  private playedLapsLeft = new Set<number>();
  private playedLapsElapsed = new Set<number>();
  private playedAutoStart = new Set<number>();
  private playedAutoStartElapsed = new Set<number>();
  private playedAutoAdvance = new Set<number>();
  private playedAutoAdvanceElapsed = new Set<number>();
  private previousAutoStartRemaining = 0;
  private previousAutoAdvanceRemaining = 0;
  private leaderLaps = 0;
  private playedHalfway = false;

  // Exit Confirmation Modal State
  showExitConfirmation = false;
  exitModalTitle = "RD_CONFIRM_EXIT_TITLE";
  exitModalMessage = "RD_CONFIRM_EXIT_MESSAGE";
  exitConfirmText = "RD_CONFIRM_EXIT_BTN_LEAVE";
  exitCancelText = "RD_CONFIRM_EXIT_BTN_STAY";

  // Skip Heat Confirmation Modal State
  showSkipHeatConfirmation = false;
  skipHeatModalTitle = "RD_CONFIRM_SKIP_HEAT_TITLE";
  skipHeatModalMessage = "RD_CONFIRM_SKIP_HEAT_MESSAGE";
  skipHeatConfirmText = "GEN_YES";
  skipHeatCancelText = "GEN_NO";

  recordData: any = null;

  // Skip Race Confirmation Modal State
  showSkipRaceConfirmation = false;
  skipRaceModalTitle = "RD_CONFIRM_SKIP_RACE_TITLE";
  skipRaceModalMessage = "RD_CONFIRM_SKIP_RACE_MESSAGE";
  skipRaceConfirmText = "GEN_YES";
  skipRaceCancelText = "GEN_NO";

  // Restart Heat Confirmation Modal State
  showRestartHeatConfirmation = false;
  restartHeatModalTitle = "RD_CONFIRM_RESTART_HEAT_TITLE";
  restartHeatModalMessage = "RD_CONFIRM_RESTART_HEAT_MESSAGE";
  restartHeatConfirmText = "GEN_YES";
  restartHeatCancelText = "GEN_NO";

  // Defer Heat Confirmation Modal State
  showDeferHeatConfirmation = false;
  deferHeatModalTitle = "RD_CONFIRM_DEFER_HEAT_TITLE";
  deferHeatModalMessage = "RD_CONFIRM_DEFER_HEAT_MESSAGE";
  deferHeatConfirmText = "GEN_YES";
  deferHeatCancelText = "GEN_NO";

  // Acknowledgement Modal State (kept for interface errors)
  activeMenu: string | null = null;
  ackModalMessageParams: Record<string, any> = {};
  viewerRaceEndedHandler!: ViewerRaceEndedHandler;

  // Hardware Health Alert State
  currentHardwareAlert: IInterfaceAlertEvent | null = null;
  showHardwareAlertBanner = false;
  showHardwareAlertModal = false;

  get showAckModal(): boolean {
    return this.viewerRaceEndedHandler?.showAckModal ?? false;
  }
  set showAckModal(v: boolean) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.showAckModal = v;
  }
  get ackModalTitle(): string {
    return this.viewerRaceEndedHandler?.ackModalTitle ?? "";
  }
  set ackModalTitle(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalTitle = v;
  }
  get ackModalMessage(): string {
    return this.viewerRaceEndedHandler?.ackModalMessage ?? "";
  }
  set ackModalMessage(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalMessage = v;
  }
  get ackModalButtonText(): string {
    return (
      this.viewerRaceEndedHandler?.ackModalButtonText ?? "ACK_MODAL_BTN_OK"
    );
  }
  set ackModalButtonText(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalButtonText = v;
  }
  private _raceHasEnded = false;
  get raceHasEnded(): boolean {
    return this.viewerRaceEndedHandler?.raceHasEnded ?? this._raceHasEnded;
  }
  set raceHasEnded(v: boolean) {
    this._raceHasEnded = v;
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.raceHasEnded = v;
  }
  forceExit = false;

  public Role = Role;
  showLoginModal = false;
  private pendingNavigationUrl = "";

  private audioService: AudioService;
  private childWindowManagerService: ChildWindowManagerService;
  private dateTimeFormatService: DateTimeFormatService;
  private titleService?: Title;
  private sanitizer?: DomSanitizer =
    inject(DomSanitizer, { optional: true }) ?? undefined;

  constructor(
    private el: ElementRef,
    private translationService: TranslationService,
    private dataService: DataService,
    private raceService: RaceService,
    private settingsService: SettingsService,
    private raceFlagService: RaceFlagService,
    private router: Router,
    private raceConnectionService: RaceConnectionService,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
    private customUiService: CustomUiService,
    private logger: LoggerService,
    private route: ActivatedRoute,
    private printService: PrintService,
    public authService: AuthService,
    private helpService: HelpService,
    private predictionService?: RacePredictionService,
    childWindowManagerService?: ChildWindowManagerService,
    private customWidgetService?: CustomWidgetService,
    private navigationService?: NavigationService,
    dateTimeFormatService?: DateTimeFormatService,
    audioService?: AudioService,
    titleService?: Title,
  ) {
    super();
    let injectedTitle: Title | null = null;
    try {
      injectedTitle = inject(Title, { optional: true });
    } catch {
      // Ignore if outside injection context
    }
    this.titleService = titleService ?? injectedTitle ?? undefined;
    this.audioService = audioService ?? inject(AudioService);
    this.fuelAudioTracker = new FuelAudioTracker(this.audioService, (urlOrId) =>
      this.resolveAssetPlayableUrl(urlOrId),
    );
    this.childWindowManagerService =
      childWindowManagerService ?? inject(ChildWindowManagerService);
    this.dateTimeFormatService =
      dateTimeFormatService ?? inject(DateTimeFormatService);
    this.customWidgetService =
      customWidgetService ??
      inject(CustomWidgetService, { optional: true }) ??
      undefined;
    this.navigationService =
      navigationService ??
      inject(NavigationService, { optional: true }) ??
      undefined;
    // Initial default columns, will be overwritten in ngOnInit
    this.columns = [];
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.pendingNavigationUrl = event.url;
      }
    });
    effect(() => {
      this.activeCustomUi();
      this.hasLoadedToolboxStates = false;
      this.loadToolboxExpandedStatesFromLayout();
    });
    effect(() => {
      const customizing = this.layoutCustomizing();
      if (customizing && this.isUIEditorMode()) {
        this.ensureToolboxVisible();
      }
    });
    effect(() => {
      const inputLane = this.inputLaneIndex();
      if (inputLane !== undefined) {
        this.updateRacedayLayout();
        this.updateAudioRelevance();
        this.cdr.markForCheck();
      }
    });
    effect(() => {
      const inputDriver = this.inputDriverId();
      if (inputDriver !== undefined) {
        this.checkDriverStatus();
        this.updateRacedayLayout();
        this.updateAudioRelevance();
        this.cdr.markForCheck();
      }
    });
  }

  public driverRankings = new Map<string, number>();
  protected isInterfaceConnected: boolean = false;
  protected draggingLane: number | null = null;
  protected isDragging: boolean = false;
  protected raceState: RaceState = RaceState.UNKNOWN_STATE;
  protected assets: any[] = [];
  protected hasRacedInCurrentHeat: boolean = false;
  protected highlightedDrivers: Set<string> = new Set();
  private lapHighlightTimers: Map<string, any> = new Map();
  private cachedNonGridWidgets: any[] = [];
  private cachedNonGridWidgetsRef: any[] | null = null;
  private cachedNonGridWidgetsLength = -1;
  private cachedGrids: RacedayGridDescriptor[] = [];
  private cachedGridsWidgetsRef: any[] | null = null;
  private cachedGridsWidgetsLength = -1;
  private cachedGridsDataCounts: string = "";
  private cachedGridsParticipantsCount = -1;
  private cachedGridsHeatDriversCount = -1;
  private cachedGridIds: string[] = [];
  private cachedGridIdsWidgetsRef: any[] | null = null;
  private cachedOverallGridIds?: Set<string>;
  private cachedOverallGridWidgetsRef: any = null;
  private cachedSeedGridIds?: Set<string>;
  private cachedSeedGridWidgetsRef: any = null;
  private cachedDefaultLaneWidgetSettings: any = null;
  private cachedDefaultLaneWidgetsRef: any = null;
  private carLocations = new Map<number, number>();
  private fuelAudioTracker: FuelAudioTracker;
  private get laneFuelAudioStates(): Map<number, any> {
    return this.fuelAudioTracker.getStates();
  }

  private dropdownIconCache = new Map<string, SafeStyle | string>();
  private deactivateSubject = new Subject<boolean>();
  private livePredictionSubject = new Subject<void>();

  // Layout customization state
  isUIEditorMode = input<boolean>(false);
  isPracticeLayoutEditor = input<boolean>(false);
  layoutCustomizing = input<boolean | undefined>(undefined);
  inputLaneIndex = input<number | undefined>(undefined);
  inputDriverId = input<string | undefined>(undefined);
  routeLaneIndex?: number;
  routeDriverId?: string;
  isRacingInCurrentHeat = false;
  driverViewLaneIndex?: number;

  get activeDriverId(): string | undefined {
    return this.inputDriverId() !== undefined
      ? this.inputDriverId()
      : this.routeDriverId;
  }

  get isDriverView(): boolean {
    return this.activeDriverId !== undefined;
  }

  private _currentHeat?: Heat;
  get currentHeat(): Heat | undefined {
    return this._currentHeat || this.raceService.getCurrentHeat() || this.heat;
  }
  set currentHeat(value: Heat | undefined) {
    this._currentHeat = value;
  }

  uiScale = input<number>(1);
  editingSettings = input<Settings | undefined>(undefined);
  activeCustomUi = input<CustomUI | null>(null);
  selectedWidgetId = input<string | null>(null);
  selectedAnchor = input<string | null>(null);
  isCountdownPreviewActive = input<boolean>(false);
  gridSession = input<LaneGridSession | null>(null);
  widgetSelected = output<string | null>();
  anchorSelected = output<{ widgetId: string; anchor: string | null }>();
  finishGrid = output<void>();
  deleteGrid = output<string>();
  gridBoundsChange = output<LaneGridBounds>();

  selectAnchor(widgetId: string, anchor: string | null): void {
    if (this.selectedWidgetId() !== widgetId) {
      this.widgetSelected.emit(widgetId);
    }
    this.anchorSelected.emit({ widgetId, anchor });
  }

  get visualScale(): number {
    return this.isUIEditorMode() ? this.uiScale() : this.scale;
  }

  get toolboxScale(): number {
    return 1;
  }
  @ViewChild("toolboxTemplate", { static: true })
  toolboxTemplate?: TemplateRef<any>;
  layoutChanged = output<LayoutConfig>();
  columnsChanged = output<void>();
  requestAbout = output<void>();
  private _isLayoutCustomizing = false;
  get isLayoutCustomizing(): boolean {
    if (this.layoutCustomizing() !== undefined) {
      return this.layoutCustomizing()!;
    }
    return this._isLayoutCustomizing;
  }
  set isLayoutCustomizing(val: boolean) {
    this._isLayoutCustomizing = val;
  }

  @HostBinding("style.overflow")
  get overflowStyle() {
    return this.isUIEditorMode() ? "visible" : "hidden";
  }

  @HostBinding("class.driver-station-host")
  get isDriverStationHost(): boolean {
    return this.isDriverStation && !this.isUIEditorMode();
  }

  @HostBinding("class.driver-view-host")
  get isDriverViewHost(): boolean {
    return this.isDriverView && !this.isUIEditorMode();
  }

  isLayoutEditorMinimized = false;
  layoutEditorPosition = { x: 0, y: 0 };
  layout!: LayoutConfig;

  public syncLayoutFromEditor(newLayout: LayoutConfig): void {
    if (newLayout) {
      this.invalidateGridCache();
      this.layout = JSON.parse(JSON.stringify(newLayout));
      if (this.layout.widgets) {
        this.layout.widgets =
          LaneGridReplicationHelper.cleanOrphanedGridWidgets(
            this.layout.widgets,
          );
      }
      this.loadColumns();
      this.cdr.markForCheck();
    }
  }

  draggedWidgetType: string | null = null;
  toolboxSearchTerm = "";
  toolboxGroupExpandedStates = new Map<string, boolean>();
  toolboxSubgroupExpandedStates = new Map<string, boolean>();
  private hasLoadedToolboxStates = false;

  get activeLaneIndex(): number | undefined {
    if (this.inputLaneIndex() !== undefined) {
      return this.inputLaneIndex();
    }
    if (this.routeLaneIndex !== undefined) {
      return this.routeLaneIndex;
    }
    if (this.isDriverView && this.isRacingInCurrentHeat) {
      return this.driverViewLaneIndex;
    }
    return undefined;
  }

  get isDriverStation(): boolean {
    return this.activeLaneIndex !== undefined || this.isDriverStationLayout;
  }

  get isFuelRace(): boolean {
    const race = this.race || this.raceService?.getRace();
    const track = this.track || race?.track;
    return this.fuelAudioTracker?.isFuelRace(race, track) ?? false;
  }

  get isPracticeLayout(): boolean {
    const isDemo = this.race?.entity_id?.startsWith("demo_") || false;
    return (
      this.isPracticeLayoutEditor() || (this.race?.practice ?? false) || isDemo
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    const settingsChange = changes["editingSettings"];
    const uiChange = changes["activeCustomUi"];
    const hasMeaningfulChange =
      (settingsChange && !settingsChange.firstChange) ||
      (uiChange && !uiChange.firstChange);

    if (hasMeaningfulChange && this.isUIEditorMode()) {
      const settings = this.editingSettings();
      if (settings) {
        this.isLayoutEditorMinimized = settings.layoutEditorMinimized ?? false;
        const targetX = settings.layoutEditorPositionX ?? 0;
        const targetY = settings.layoutEditorPositionY ?? 0;
        const clamped = this.clampLayoutEditorPosition({
          x: targetX,
          y: targetY,
        });
        if (
          this.layoutEditorPosition.x !== clamped.x ||
          this.layoutEditorPosition.y !== clamped.y
        ) {
          this.layoutEditorPosition = clamped;
        }
      }
      if (this.currentRacedayLayout?.widgets) {
        this.invalidateGridCache();
        this.layout = JSON.parse(JSON.stringify(this.currentRacedayLayout));
      } else {
        this.invalidateGridCache();
        this.layout = this.getDefaultLayout();
      }
      this.updateScale();
      this.loadColumns();
      if (this.heat) {
        this.sortHeatDrivers();
      }
      this.cdr.markForCheck();
    }
  }

  ngOnInit() {
    if (
      !this.route?.snapshot?.queryParams?.["themeId"] &&
      this.themeService?.getTransientThemeId?.()
    ) {
      this.themeService.clearTransientActiveTheme();
    }
    this.setupInitialState();
    this.subscribeToAssets();
    this.detectShortcutKey();
    this.updateScale();
    this.updateTabTitle();

    if (
      this.customWidgetService &&
      this.customWidgetService.getCustomWidgets().length === 0
    ) {
      this.customWidgetService.reloadCustomWidgets().catch(() => {});
    }

    if (this.customWidgetService?.customWidgets$) {
      this.subscriptions.push(
        this.customWidgetService.customWidgets$.subscribe(() => {
          if (!this.isDestroyed) {
            this.cdr.markForCheck();
          }
        }),
      );
    }

    this.initVisualViewport();
    this.initHelpStepSubscription();

    if (this.isUIEditorMode()) {
      if (this.layoutCustomizing() === undefined) {
        this.isLayoutCustomizing = true;
      }
      this.setupMockDataForEditor();
      return;
    }

    this.subscribeToRaceData();
    this.subscribeToRaceTime();
    this.subscribeToLapEvents();
    this.subscribeToLiveUpdates();
    this.subscribeToUIEvents();

    this.subscriptions.push(
      this.livePredictionSubject.pipe(debounceTime(500)).subscribe(() => {
        if (!this.isDestroyed) {
          this.loadPredictionsForCurrentRace();
          this.cdr.markForCheck();
        }
      }),
    );

    this.initThemeAndTranslationSubscriptions();
  }

  private initVisualViewport(): void {
    RacedayInitSetupHelper.initVisualViewport(this);
  }

  private initHelpStepSubscription(): void {
    RacedayInitSetupHelper.initHelpStepSubscription(this);
  }

  private initThemeAndTranslationSubscriptions(): void {
    RacedayInitSetupHelper.initThemeAndTranslationSubscriptions(this);
  }

  private setupInitialState() {
    RacedayInitSetupHelper.setupInitialState(this);
  }

  private subscribeToAssets() {
    RacedayInitSetupHelper.subscribeToAssets(this);
  }

  private setupMockDataForEditor() {
    RacedayInitSetupHelper.setupMockDataForEditor(this);
  }

  ngOnDestroy() {
    LaneGridAnimationHelper.reset();
    this.lapHighlightTimers.forEach((timer) => clearTimeout(timer));
    this.lapHighlightTimers.clear();
    this.highlightedDrivers.clear();
    this.audioService.reset();
    if (this.themeService?.getTransientThemeId?.()) {
      this.themeService.clearTransientActiveTheme();
    }
    if (
      typeof window !== "undefined" &&
      window.visualViewport &&
      typeof window.visualViewport.removeEventListener === "function" &&
      this.visualViewportHandler
    ) {
      window.visualViewport.removeEventListener(
        "resize",
        this.visualViewportHandler,
      );
      window.visualViewport.removeEventListener(
        "scroll",
        this.visualViewportHandler,
      );
    }

    if (this.isUIEditorMode()) {
      this.isDestroyed = true;
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions = [];
      return;
    }

    if (this.viewerRaceEndedHandler) {
      this.viewerRaceEndedHandler.stopListening();
    }
    this.isDestroyed = true;
    const currentNav = this.router.getCurrentNavigation();
    let destUrl = this.pendingNavigationUrl || this.router.url || "";
    if (currentNav && currentNav.extractedUrl) {
      destUrl = currentNav.extractedUrl.toString();
    }
    const isNavigatingToSetup = destUrl.includes("raceday-setup");
    if (
      isNavigatingToSetup &&
      !this.raceHasEnded &&
      this.raceState !== RaceState.RACE_OVER
    ) {
      sessionStorage.setItem("skipIntro", "true");
    }
    this.raceConnectionService.disconnect(isNavigatingToSetup);

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    if (!this.childWindowManagerService.isRacePreservingRoute(destUrl)) {
      this.childWindowManagerService.closeAllWindows();
    }
  }

  private showInterfaceError(titleKey: string, messageKey: string) {
    if (this.raceHasEnded || this.raceState === RaceState.RACE_OVER) {
      return;
    }
    this.ackModalTitle = titleKey;
    this.ackModalMessage = messageKey;
    this.showAckModal = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  openHardwareAlertDetails(alert?: IInterfaceAlertEvent | null): void {
    if (alert) {
      this.currentHardwareAlert = alert;
    }
    this.showHardwareAlertModal = true;
    this.cdr.markForCheck();
  }

  closeHardwareAlertDetails(): void {
    this.showHardwareAlertModal = false;
    this.cdr.markForCheck();
  }

  openHardwareAlertHelp(): void {
    this.helpLinkService.openHelp(
      "troubleshooting",
      "microcontroller-brownout-resets",
    );
  }

  dismissHardwareAlert(): void {
    this.showHardwareAlertBanner = false;
    this.cdr.markForCheck();
  }

  formatAlertTimestamp(timestampMs?: number | any): string {
    if (!timestampMs) return "";
    const ms =
      typeof timestampMs === "number" ? timestampMs : Number(timestampMs);
    if (isNaN(ms) || ms === 0) return "";
    const d = new Date(ms);
    return d.toLocaleTimeString();
  }

  canDeactivate(
    nextState?: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.forceExit) {
      return true;
    }
    if (nextState) {
      if (
        this.childWindowManagerService?.isRacePreservingRoute(nextState.url) ||
        nextState.url.includes("/modify-heats") ||
        nextState.url.includes("/team-editor") ||
        nextState.url.includes("/team-manager") ||
        nextState.url.includes("/driver-editor") ||
        nextState.url.includes("/driver-manager") ||
        nextState.url.includes("/ui-editor") ||
        nextState.url.includes("/layout-editor") ||
        nextState.url.includes("/layout-manager") ||
        nextState.url.includes("/theme-editor") ||
        nextState.url.includes("/theme-manager") ||
        nextState.url.includes("/driver-station") ||
        nextState.url.includes("/driver-view")
      ) {
        return true;
      }
    }
    this.showSkipHeatConfirmation = false;
    this.showRestartHeatConfirmation = false;
    this.showDeferHeatConfirmation = false;

    if (this.raceHasEnded || this.raceState === RaceState.RACE_OVER) {
      this.exitModalTitle = "RD_RACE_ENDED_TITLE";
      this.exitModalMessage = "RD_CONFIRM_EXIT_RACE_ENDED_MESSAGE";
    } else {
      this.exitModalTitle = "RD_CONFIRM_EXIT_TITLE";
      this.exitModalMessage = "RD_CONFIRM_EXIT_MESSAGE";
    }

    this.exitConfirmText = "RD_CONFIRM_EXIT_BTN_LEAVE";
    this.exitCancelText = "RD_CONFIRM_EXIT_BTN_STAY";
    this.showExitConfirmation = true;
    this.cdr.markForCheck();
    return this.deactivateSubject.asObservable();
  }

  protected totalHeats: number = 0;
  isStartingRace = false;
  isMenuOpen = false;
  isFileMenuOpen = false;
  isManageMenuOpen = false;
  isWindowsMenuOpen = false;
  isOptionsMenuOpen = false;
  scale: number = 1;
  dashboardWidth: number = 1920;
  dashboardHeight: number = 1080;
  displayContentWidth: number = 1920;
  displayContentHeight: number = 1080;
  scaleTransform: string = "none";
  contentLeft: number = 0;
  contentTop: number = 0;
  @ViewChild("dashboardWrapper") dashboardWrapperRef?: ElementRef<HTMLElement>;
  private visualViewportHandler?: () => void;
  isDriversStationOpen = false;
  private helpLinkService = inject(HelpLinkService);
  private lastThemeOpenTime = 0;
  private lastThemeOpenId = "";

  @HostListener("window:beforeunload", ["$event"])
  onBeforeUnload($event: any) {
    if (this.authService.currentRole !== Role.VIEWER && !this.raceHasEnded) {
      $event.preventDefault();
      $event.returnValue = true;
    }
  }

  @HostListener("window:pagehide", ["$event"])
  onPageHide(_event: any) {
    if (this.isUIEditorMode()) {
      return;
    }
    this.raceConnectionService.disconnect();
    this.childWindowManagerService.closeAllWindows();
  }

  @HostListener("window:keyup", ["$event"])
  override handleKeyUpEvent(event: KeyboardEvent) {
    super.handleKeyUpEvent(event);
  }

  @HostListener("window:keydown", ["$event"])
  override handleKeyboardEvent(event: KeyboardEvent) {
    super.handleKeyboardEvent(event);
  }

  @HostListener("window:resize")
  override onResize() {
    super.onResize();
  }

  @HostListener("document:click", ["$event"])
  override onDocumentClick(event: MouseEvent) {
    super.onDocumentClick(event);
  }
}
