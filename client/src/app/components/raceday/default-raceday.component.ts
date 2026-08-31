/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { DragDropModule } from "@angular/cdk/drag-drop";
import {
  ChangeDetectorRef,
  Component,
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
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ActivatedRoute,
  NavigationStart,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import * as QRCode from "qrcode";
import { firstValueFrom, Observable, Subject, Subscription } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { LoginDialogComponent } from "@app/components/login-dialog/login-dialog.component";
import { DriverConverter } from "@app/converters/driver.converter";
import { HeatConverter } from "@app/converters/heat.converter";
import { LaneConverter } from "@app/converters/lane.converter";
import { RaceConverter } from "@app/converters/race.converter";
import { RaceParticipantConverter } from "@app/converters/race_participant.converter";
import { TeamConverter } from "@app/converters/team.converter";
import { TrackConverter } from "@app/converters/track.converter";
import { DataService } from "@app/data.service";
import { CanComponentDeactivate } from "@app/guards/raceday.guard";
import { Driver } from "@app/models/driver";
import { FinishMethod, HeatScoring } from "@app/models/heat_scoring";
import {
  getOverallScoreFormat,
  OverallRanking,
} from "@app/models/overall_scoring";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Role } from "@app/models/role";
import { LayoutConfig, Settings, WidgetType } from "@app/models/settings";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IRecordEntry, LapType, RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { AuthService } from "@app/services/auth.service";
import { ChildWindowManagerService } from "@app/services/child-window-manager.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import {
  DriverProjection,
  RacePredictionRecord,
  RacePredictionService,
} from "@app/services/race-prediction.service";

export interface LapDisplayInfo {
  lapTime: string;
  segments: string[];
}
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import { InputDialogComponent } from "@app/components/shared/input-dialog/input-dialog.component";
import {
  PdfExportDialogComponent,
  PdfExportOptions,
} from "@app/components/shared/pdf-export-dialog/pdf-export-dialog.component";
import { WIDGET_REGISTRY } from "@app/components/ui-editor/widget-registry";
import { CustomUI } from "@app/models/custom-ui";
import { CustomUiService } from "@app/services/custom-ui.service";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { HelpService } from "@app/services/help.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { createTTSContext, playSound } from "@app/utils/audio";
import { ViewerRaceEndedHandler } from "@app/utils/viewer-race-ended-handler";

import { ColumnDefinition } from "./column_definition";
import { AnchorPoint } from "./column_definition";
import { AddLapSectionsDialogComponent } from "./components/add-lap-sections-dialog/add-lap-sections-dialog.component";
import { RacedayAbsoluteWidgetComponent } from "./components/raceday-absolute-widget/raceday-absolute-widget.component";
import { RacedayModalsComponent } from "./components/raceday-modals/raceday-modals.component";
import {
  FormatContext,
  RacedayFormatUtils,
} from "./utils/raceday-format.utils";
import { RacedayLayoutUtils } from "./utils/raceday-layout.utils";
import {
  createMockEditorData,
  createMockLaneRecordEntries,
} from "./utils/raceday-mock.utils";

/**
 * The raceday component is the main component for the raceday screen.
 */
@Component({
  standalone: true,
  selector: "app-default-raceday",
  templateUrl: "./default-raceday.component.html",
  styleUrls: ["./default-raceday.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    RacedayModalsComponent,
    FormsModule,
    LoginDialogComponent,
    RacedayAbsoluteWidgetComponent,
    DragDropModule,
    TranslatePipe,
    AddLapSectionsDialogComponent,
    PdfExportDialogComponent,
    BrowserNavigationComponent,
    InputDialogComponent,
  ],
})
export class DefaultRacedayComponent
  implements OnInit, OnDestroy, OnChanges, CanComponentDeactivate
{
  showPdfExportDialog = false;
  defaultIncludeBackground = true;
  showSaveRaceDialog = false;
  saveRaceName = "";

  private isDestroyed = false;
  private subscriptions: Subscription[] = [];
  protected heat?: Heat;
  protected track?: Track;
  protected race!: Race;
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

  // Countdown Overlay state
  showCountdownOverlay: boolean = false;
  countdownLamps: any[] = [];
  countdownText: string = "";
  protected showModifyHeatsModal: boolean = false;
  protected showAddLapSectionsDialog: boolean = false;
  protected isMenuModeForAddLap: boolean = false;
  protected selectedHeatDriver: DriverHeatData | null = null;
  protected heats: Heat[] = [];
  countdownColor: string = "";
  countdownTotalLamps: number = 0;
  private lastPlayedCountdownSecond: number = -1;
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
  protected driverViewQrCodeCache = new Map<string, string>();

  get groupEnabled(): boolean {
    return this.race?.group_options?.enabled || false;
  }

  get isEvent(): boolean {
    return !!(this.race as any)?.is_event;
  }

  get eventName(): string {
    return (this.race as any)?.event_name || "";
  }

  get currentEventRaceIndex(): number {
    return ((this.race as any)?.current_event_race_index || 0) + 1;
  }

  get totalEventRaces(): number {
    return (this.race as any)?.total_event_races || 0;
  }

  get autoAdvanceRemainingSeconds(): number {
    return (this.race as any)?.auto_advance_remaining_seconds || 0;
  }

  /**
   * Update leaderboard entries while maintaining stable DOM order.
   * Existing entries are updated in-place; new ones are appended.
   */
  private updateLeaderboardEntries(): void {
    const rankingMethod = this.race?.overall_scoring?.rankingMethod;
    const isTime =
      rankingMethod && rankingMethod !== OverallRanking.OR_LAP_COUNT;

    const incoming = (this.participants || [])
      .filter((p) => p && p.driver && !Driver.isEmpty(p.driver))
      .map((p) => ({
        name: p.team?.name || p.driver?.nickname || p.driver?.name || "Unknown",
        score: p.rankValue || 0,
        rank: p.rank || 0,
        entityId: p.driver?.entity_id || p.driver?.name || "",
        isTime: isTime,
      }));

    const existingIds = new Set(this.leaderboardEntries.map((e) => e.entityId));

    // Update existing entries in-place (preserving array/DOM order)
    for (let i = 0; i < this.leaderboardEntries.length; i++) {
      const id = this.leaderboardEntries[i].entityId;
      const updated = incoming.find((e) => e.entityId === id);
      if (updated) {
        this.leaderboardEntries[i] = updated;
      }
    }

    // Append new entries
    for (const entry of incoming) {
      if (!existingIds.has(entry.entityId)) {
        this.leaderboardEntries.push(entry);
        existingIds.add(entry.entityId);
      }
    }

    // Remove entries no longer present
    const incomingIds = new Set(incoming.map((e) => e.entityId));
    this.leaderboardEntries = this.leaderboardEntries.filter((e) =>
      incomingIds.has(e.entityId),
    );
  }

  private updateGroupLeaderboardEntries(): void {
    const rankingMethod = this.race?.overall_scoring?.rankingMethod;
    const isTime =
      rankingMethod && rankingMethod !== OverallRanking.OR_LAP_COUNT;

    const incoming = (this.groupParticipants || [])
      .filter((p) => p && p.driver && !Driver.isEmpty(p.driver))
      .map((p) => ({
        name: p.team?.name || p.driver?.nickname || p.driver?.name || "Unknown",
        score: p.rankValue || 0,
        rank: p.rank || 0,
        entityId: p.driver?.entity_id || p.driver?.name || "",
        isTime: isTime,
      }));

    const existingIds = new Set(
      this.groupLeaderboardEntries.map((e) => e.entityId),
    );

    // Update existing entries in-place (preserving array/DOM order)
    for (let i = 0; i < this.groupLeaderboardEntries.length; i++) {
      const id = this.groupLeaderboardEntries[i].entityId;
      const updated = incoming.find((e) => e.entityId === id);
      if (updated) {
        this.groupLeaderboardEntries[i] = updated;
      }
    }

    // Append new entries
    for (const entry of incoming) {
      if (!existingIds.has(entry.entityId)) {
        this.groupLeaderboardEntries.push(entry);
        existingIds.add(entry.entityId);
      }
    }

    // Remove entries no longer present
    const incomingIds = new Set(incoming.map((e) => e.entityId));
    this.groupLeaderboardEntries = this.groupLeaderboardEntries.filter((e) =>
      incomingIds.has(e.entityId),
    );
  }

  protected getLeaderboardPosition(entry: any): number {
    // Sort all entries to determine their relative visual position (dense ranking)
    const sorted = [...this.leaderboardEntries].sort((a, b) => {
      // Sort by rank (1 is best, 0 is unset)
      if (a.rank !== b.rank) {
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
      }
      // If ranks are equal, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
    const pos = sorted.findIndex((e) => e.entityId === entry.entityId);
    return pos >= 0 ? pos : 0;
  }

  protected getLeaderboardScoreFormat(entry: any): string {
    if (!entry) return "1.0-0";
    if (entry.isTime !== undefined) {
      return entry.isTime ? "1.3-3" : "1.2-2";
    }
    const rankingMethod = this.race?.overall_scoring?.rankingMethod;
    return getOverallScoreFormat(rankingMethod);
  }

  protected get autoStatusLabel(): string {
    if (this.autoStartRemaining > 0) {
      return "RD_AUTO_STARTING";
    }
    if (this.autoAdvanceRemaining > 0) {
      return "RD_AUTO_ADVANCING";
    }
    return "";
  }

  protected get isAutoSegments(): boolean {
    return (
      (this.race?.heat_scoring?.allowFinish as string) === "NoneAutoSegments"
    );
  }

  protected get formattedTime(): string {
    const s = this.raceState;

    const showDurationOnly =
      this.race?.heat_scoring?.finishMethod === FinishMethod.Timed &&
      ((s === RaceState.NOT_STARTED &&
        this.autoStartRemaining <= 0 &&
        this.autoAdvanceRemaining <= 0) ||
        (s === RaceState.STARTING &&
          this.showCountdownOverlay &&
          !this.isRestarting));

    if (showDurationOnly) {
      const duration = this.race?.heat_scoring?.finishValue || 0;

      const hoursD = Math.floor(duration / 3600);
      const minutesD = Math.floor((duration % 3600) / 60);
      const secondsD = Math.floor(duration % 60);

      if (hoursD > 0) {
        return `${hoursD}:${minutesD.toString().padStart(2, "0")}:${secondsD
          .toString()
          .padStart(2, "0")}`;
      }
      if (minutesD > 0) {
        return `${minutesD}:${secondsD.toString().padStart(2, "0")}`;
      }
      return `${secondsD}`;
    }

    if (
      (s === RaceState.NOT_STARTED || s === RaceState.UNKNOWN_STATE) &&
      this.autoStartRemaining <= 0 &&
      this.autoAdvanceRemaining <= 0
    ) {
      return "--";
    }

    const time = this.time || 0;

    if (s === RaceState.HEAT_OVER && time <= 0) {
      return "0";
    }
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    let base = "";
    if (hours > 0) {
      base = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else if (minutes > 0) {
      base = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    } else {
      base = `${seconds}`;
    }

    // High precision countdown logic (only when we have a decimal format > 0)
    const parts = this.timeFormat.split(".");
    const fractionDigits =
      parts.length > 1 ? Number(parts[1].split("-")[1]) : 0;

    if (hours === 0 && minutes === 0 && fractionDigits > 0) {
      const formatted = time.toFixed(fractionDigits);
      return formatted;
    }

    return base;
  }

  protected get gridTemplateColumns(): string {
    if (!this.columns || this.columns.length === 0) return "1fr";
    return this.columns.map((c) => `minmax(0, ${c.width}fr)`).join(" ");
  }

  protected get gridTemplateRowsVertical(): string {
    if (!this.columns || this.columns.length === 0) return "1fr";

    const lapTimeCol = this.columns.find((c) => this.isLapTimeColumn(c));
    const nicknameCol = this.columns.find(
      (c) =>
        c.propertyName.startsWith("driver.nickname") ||
        c.propertyName.startsWith("driver.name"),
    );

    const lapTimeWidth = lapTimeCol ? lapTimeCol.width : 150;
    const nicknameWidth = nicknameCol ? nicknameCol.width : 300;

    // In horizontal mode, nickname is typically wider than lap time.
    // To ensure lap/lapTime rows are larger in vertical mode, we assign the larger width to largeHeight.
    const largeHeight = Math.max(lapTimeWidth, nicknameWidth);
    const smallHeight = Math.min(lapTimeWidth, nicknameWidth);

    return this.columns
      .map((c) => {
        if (c.propertyName === "lastLaps") {
          return `minmax(0, ${largeHeight * 5}fr)`;
        }
        if (c.propertyName === "lapCount" || this.isLapTimeColumn(c)) {
          return `minmax(0, ${largeHeight}fr)`;
        }
        return `minmax(0, ${smallHeight}fr)`;
      })
      .join(" ");
  }

  protected getLayoutEntries(
    column: ColumnDefinition,
  ): { anchor: string; property: string }[] {
    return RacedayLayoutUtils.getLayoutEntries(column);
  }

  protected getAnchorClass(anchor: string): string {
    return RacedayLayoutUtils.getAnchorClass(anchor);
  }

  isLapTimeColumn(col: ColumnDefinition): boolean {
    return RacedayLayoutUtils.isLapTimeColumn(col);
  }

  protected isImageProperty(prop: string): boolean {
    return RacedayLayoutUtils.isImageProperty(prop);
  }

  protected isAvatarProperty(prop: string): boolean {
    return RacedayLayoutUtils.isAvatarProperty(prop);
  }

  public isPacingProperty(prop: string): boolean {
    return RacedayLayoutUtils.isPacingProperty(prop);
  }

  public shouldShowLaneColor(col: ColumnDefinition): boolean {
    return RacedayLayoutUtils.shouldShowLaneColor(col);
  }

  protected get isWarmup(): boolean {
    if (this.autoStartRemaining > 0 && this.race) {
      const warmupTime = this.race.auto_start_warmup_time || 0;
      const totalTime = this.race.auto_start_time || 0;
      if (warmupTime > 0 && totalTime > 0) {
        // Warmup is at the BEGINNING of auto-start
        // elapsed = totalTime - autoStartRemaining
        return totalTime - this.autoStartRemaining < warmupTime;
      }
    }
    if (
      this.autoAdvanceRemaining > 0 &&
      this.race &&
      this.raceState !== RaceState.RACE_OVER
    ) {
      const warmupTime = this.race.auto_advance_warmup_time || 0;
      const totalTime = this.race.auto_advance_time || 0;
      if (warmupTime > 0 && totalTime > 0) {
        // Warmup is at the END of auto-advance
        return this.autoAdvanceRemaining <= warmupTime;
      }
    }
    return false;
  }

  private previousTime: number = 0;
  private playedSecondsLeft = new Set<number>();
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

  private childWindowManagerService: ChildWindowManagerService;

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
  ) {
    this.childWindowManagerService =
      childWindowManagerService ?? inject(ChildWindowManagerService);
    this.customWidgetService =
      customWidgetService ??
      inject(CustomWidgetService, { optional: true }) ??
      undefined;
    // Initial default columns, will be overwritten in ngOnInit
    this.columns = [];
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.pendingNavigationUrl = event.url;
      }
    });
  }

  protected driverRankings = new Map<string, number>();
  protected isInterfaceConnected: boolean = false;
  protected draggingLane: number | null = null;
  protected isDragging: boolean = false;
  protected raceState: RaceState = RaceState.UNKNOWN_STATE;
  protected assets: any[] = [];
  protected hasRacedInCurrentHeat: boolean = false;
  protected highlightedDrivers: Set<string> = new Set();
  private carLocations = new Map<number, number>();

  private dropdownIconCache = new Map<string, string>();
  private deactivateSubject = new Subject<boolean>();
  private livePredictionSubject = new Subject<void>();

  // Layout customization state
  isUIEditorMode = input<boolean>(false);
  isPracticeLayoutEditor = input<boolean>(false);
  uiScale = input<number>(1);
  editingSettings = input<Settings | undefined>(undefined);
  activeCustomUi = input<CustomUI | null>(null);
  selectedWidgetId = input<string | null>(null);
  widgetSelected = output<string | null>();

  get visualScale(): number {
    return this.isUIEditorMode() ? this.uiScale() : this.scale;
  }

  get toolboxScale(): number {
    return this.isUIEditorMode() ? this.scale : 1;
  }
  layoutChanged = output<LayoutConfig>();
  columnsChanged = output<void>();
  requestAbout = output<void>();
  isLayoutCustomizing = false;

  @HostBinding("style.overflow")
  get overflowStyle() {
    return this.isUIEditorMode() ? "visible" : "hidden";
  }

  isLayoutEditorMinimized = false;
  layoutEditorPosition = { x: 0, y: 0 };
  layout!: LayoutConfig;
  draggedWidgetType: string | null = null;

  get isPracticeLayout(): boolean {
    const isDemo = this.race?.entity_id?.startsWith("demo_") || false;
    return (
      this.isPracticeLayoutEditor() || (this.race?.practice ?? false) || isDemo
    );
  }

  get seasonName(): string {
    return (
      (this.race as any)?.season_name ||
      (this.race as any)?.seasonName ||
      (this.isUIEditorMode() ? "Mock Editor Season" : "")
    );
  }

  get seasonStandings(): any[] {
    const standings =
      (this.race as any)?.season_standings ||
      (this.race as any)?.seasonStandings;
    if (standings && standings.length > 0) return standings;
    return this.isUIEditorMode()
      ? [
          {
            driver_id: "d1",
            driver_name: "Mario",
            net_points: 150,
            gross_points: 175,
            races_run: 5,
            current_race_points: 25,
          },
          {
            driver_id: "d2",
            driver_name: "Luigi",
            net_points: 135,
            gross_points: 150,
            races_run: 5,
            current_race_points: 20,
          },
          {
            driver_id: "d3",
            driver_name: "Bowser",
            net_points: 120,
            gross_points: 140,
            races_run: 5,
            current_race_points: 18,
          },
          {
            driver_id: "d4",
            driver_name: "Peach",
            net_points: 110,
            gross_points: 125,
            races_run: 5,
            current_race_points: 15,
          },
          {
            driver_id: "d5",
            driver_name: "Yoshi",
            net_points: 95,
            gross_points: 105,
            races_run: 4,
            current_race_points: 12,
          },
          {
            driver_id: "d6",
            driver_name: "Donkey Kong",
            net_points: 80,
            gross_points: 90,
            races_run: 4,
            current_race_points: 10,
          },
        ]
      : [];
  }

  private parsedThemeLayouts = new Map<string, any>();

  private getParsedCustomUiProperty(
    customUI: any,
    propName: string,
    fallbackVal: any,
  ): any {
    if (!customUI) return fallbackVal;
    const jsonStr = customUI[propName] as string;
    if (!jsonStr) return fallbackVal;

    if (!this.parsedThemeLayouts.has(jsonStr)) {
      try {
        this.parsedThemeLayouts.set(jsonStr, JSON.parse(jsonStr));
      } catch (e) {
        this.parsedThemeLayouts.set(jsonStr, fallbackVal);
      }
    }
    return this.parsedThemeLayouts.get(jsonStr);
  }

  get currentRacedayLayout(): LayoutConfig | undefined {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      if (ui.layoutJson && ui.layoutJson !== "[]") {
        return this.getParsedCustomUiProperty(ui, "layoutJson", undefined);
      }
      return this.isPracticeLayout
        ? this.editingSettings()?.practiceRacedayLayout ||
            JSON.parse(JSON.stringify(Settings.DEFAULT_PRACTICE_LAYOUT))
        : this.editingSettings()?.racedayLayout ||
            JSON.parse(JSON.stringify(Settings.DEFAULT_LAYOUT));
    }
    if (this.editingSettings()) {
      return this.isPracticeLayout
        ? this.editingSettings()!.practiceRacedayLayout
        : this.editingSettings()!.racedayLayout;
    }
    const settings = this.settingsService.getSettings();
    const activeTheme = this.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? this.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return this.isPracticeLayout
      ? this.getParsedCustomUiProperty(
          customUI,
          "layoutJson",
          settings.practiceRacedayLayout,
        )
      : this.getParsedCustomUiProperty(
          customUI,
          "layoutJson",
          settings.racedayLayout,
        );
  }
  set currentRacedayLayout(layout: LayoutConfig | undefined) {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      ui.layoutJson = layout ? JSON.stringify(layout) : "";
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.racedayLayout = layout;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.practiceRacedayLayout = layout;
      }
      return;
    }
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    if (this.isPracticeLayout) settings.practiceRacedayLayout = layout;
    else settings.racedayLayout = layout;
  }

  get currentRacedayColumns(): string[] {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      if (ui.columnsJson) {
        return this.getParsedCustomUiProperty(ui, "columnsJson", []);
      }
      return this.isPracticeLayout
        ? this.editingSettings()?.practiceRacedayColumns || []
        : this.editingSettings()?.racedayColumns || [];
    }
    if (this.editingSettings()) {
      return this.isPracticeLayout
        ? this.editingSettings()!.practiceRacedayColumns || []
        : this.editingSettings()!.racedayColumns || [];
    }
    const settings = this.settingsService.getSettings();
    const activeTheme = this.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? this.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return this.isPracticeLayout
      ? this.getParsedCustomUiProperty(
          customUI,
          "columnsJson",
          settings.practiceRacedayColumns || [],
        )
      : this.getParsedCustomUiProperty(
          customUI,
          "columnsJson",
          settings.racedayColumns || [],
        );
  }
  set currentRacedayColumns(cols: string[]) {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      ui.columnsJson = JSON.stringify(cols);
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.racedayColumns = cols;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.practiceRacedayColumns = cols;
      }
      return;
    }
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    if (this.isPracticeLayout) settings.practiceRacedayColumns = cols;
    else settings.racedayColumns = cols;
  }

  get currentColumnAnchors(): { [key: string]: AnchorPoint } {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      if (ui.columnAnchorsJson) {
        return this.getParsedCustomUiProperty(ui, "columnAnchorsJson", {});
      }
      return this.isPracticeLayout
        ? this.editingSettings()?.practiceColumnAnchors || {}
        : this.editingSettings()?.columnAnchors || {};
    }
    if (this.editingSettings()) {
      return this.isPracticeLayout
        ? this.editingSettings()!.practiceColumnAnchors || {}
        : this.editingSettings()!.columnAnchors || {};
    }
    const settings = this.settingsService.getSettings();
    const activeTheme = this.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? this.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return this.isPracticeLayout
      ? this.getParsedCustomUiProperty(
          customUI,
          "columnAnchorsJson",
          settings.practiceColumnAnchors || {},
        )
      : this.getParsedCustomUiProperty(
          customUI,
          "columnAnchorsJson",
          settings.columnAnchors || {},
        );
  }
  set currentColumnAnchors(anchors: { [key: string]: AnchorPoint }) {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      ui.columnAnchorsJson = JSON.stringify(anchors);
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.columnAnchors = anchors;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.practiceColumnAnchors = anchors;
      }
      return;
    }
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    if (this.isPracticeLayout) settings.practiceColumnAnchors = anchors;
    else settings.columnAnchors = anchors;
  }

  get currentColumnLayouts(): {
    [columnKey: string]: { [A in AnchorPoint]?: string };
  } {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      if (ui.columnLayoutsJson) {
        return this.getParsedCustomUiProperty(ui, "columnLayoutsJson", {});
      }
      return this.isPracticeLayout
        ? this.editingSettings()?.practiceColumnLayouts || {}
        : this.editingSettings()?.columnLayouts || {};
    }
    if (this.editingSettings()) {
      return this.isPracticeLayout
        ? this.editingSettings()!.practiceColumnLayouts || {}
        : this.editingSettings()!.columnLayouts || {};
    }
    const settings = this.settingsService.getSettings();
    const activeTheme = this.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? this.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return this.isPracticeLayout
      ? this.getParsedCustomUiProperty(
          customUI,
          "columnLayoutsJson",
          settings.practiceColumnLayouts || {},
        )
      : this.getParsedCustomUiProperty(
          customUI,
          "columnLayoutsJson",
          settings.columnLayouts || {},
        );
  }
  set currentColumnLayouts(layouts: {
    [columnKey: string]: { [A in AnchorPoint]?: string };
  }) {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      ui.columnLayoutsJson = JSON.stringify(layouts);
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.columnLayouts = layouts;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.practiceColumnLayouts = layouts;
      }
      return;
    }
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    if (this.isPracticeLayout) settings.practiceColumnLayouts = layouts;
    else settings.columnLayouts = layouts;
  }

  get currentColumnWidths(): { [columnKey: string]: number } {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      if (ui.columnWidthsJson) {
        return this.getParsedCustomUiProperty(ui, "columnWidthsJson", {});
      }
      return this.isPracticeLayout
        ? this.editingSettings()?.practiceColumnWidths || {}
        : this.editingSettings()?.columnWidths || {};
    }
    if (this.editingSettings()) {
      return this.isPracticeLayout
        ? this.editingSettings()!.practiceColumnWidths || {}
        : this.editingSettings()!.columnWidths || {};
    }
    const settings = this.settingsService.getSettings();
    const activeTheme = this.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? this.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return this.isPracticeLayout
      ? this.getParsedCustomUiProperty(
          customUI,
          "columnWidthsJson",
          settings.practiceColumnWidths || {},
        )
      : this.getParsedCustomUiProperty(
          customUI,
          "columnWidthsJson",
          settings.columnWidths || {},
        );
  }
  set currentColumnWidths(widths: { [columnKey: string]: number }) {
    if (this.isUIEditorMode() && this.activeCustomUi()) {
      const ui = this.activeCustomUi()!;
      ui.columnWidthsJson = JSON.stringify(widths);
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.columnWidths = widths;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        this.editingSettings()
      ) {
        this.editingSettings()!.practiceColumnWidths = widths;
      }
      return;
    }
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    if (this.isPracticeLayout) settings.practiceColumnWidths = widths;
    else settings.columnWidths = widths;
  }

  toggleLayoutEditorMinimize(event: Event) {
    event.stopPropagation();
    this.isLayoutEditorMinimized = !this.isLayoutEditorMinimized;

    // Update the local instance/draft settings
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    settings.layoutEditorMinimized = this.isLayoutEditorMinimized;

    // Persist to global settings
    const globalSettings = this.settingsService.getSettings();
    globalSettings.layoutEditorMinimized = this.isLayoutEditorMinimized;
    this.settingsService.saveSettings(globalSettings);
  }

  onLayoutEditorDragEnded(event: any) {
    const pos = event.source.getFreeDragPosition();
    this.layoutEditorPosition = pos;

    // Update the local instance/draft settings
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    settings.layoutEditorPositionX = pos.x;
    settings.layoutEditorPositionY = pos.y;

    // Persist to global settings
    const globalSettings = this.settingsService.getSettings();
    globalSettings.layoutEditorPositionX = pos.x;
    globalSettings.layoutEditorPositionY = pos.y;
    this.settingsService.saveSettings(globalSettings);
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
        if (
          this.layoutEditorPosition.x !== targetX ||
          this.layoutEditorPosition.y !== targetY
        ) {
          this.layoutEditorPosition = { x: targetX, y: targetY };
        }
      }
      if (this.currentRacedayLayout?.widgets) {
        this.layout = JSON.parse(JSON.stringify(this.currentRacedayLayout));
      } else {
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
    this.setupInitialState();
    this.subscribeToAssets();
    this.detectShortcutKey();
    this.updateScale();

    this.subscriptions.push(
      this.helpService.currentStep$.subscribe((step) => {
        if (step && step.selector === "#help-widget-toolbox") {
          if (this.isLayoutEditorMinimized) {
            this.isLayoutEditorMinimized = false;

            const settings =
              this.editingSettings() || this.settingsService.getSettings();
            settings.layoutEditorMinimized = false;

            const globalSettings = this.settingsService.getSettings();
            globalSettings.layoutEditorMinimized = false;
            this.settingsService.saveSettings(globalSettings);

            this.cdr.markForCheck();
          }
        }
      }),
    );

    if (this.isUIEditorMode()) {
      this.isLayoutCustomizing = true;
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

    this.subscriptions.push(
      this.themeService.activeTheme$.subscribe(() => {
        this.updateRacedayLayout();
      }),
    );

    this.subscriptions.push(
      this.customUiService.customUIs$.subscribe(() => {
        this.updateRacedayLayout();
      }),
    );
  }

  private setupInitialState() {
    this.viewerRaceEndedHandler = new ViewerRaceEndedHandler(
      this.dataService,
      this.authService,
      this.cdr,
      {
        onlyForViewer: false,
        onRaceEnded: () => {
          this.showExitConfirmation = false;
          this.showSkipHeatConfirmation = false;
          this.showRestartHeatConfirmation = false;
          this.showDeferHeatConfirmation = false;
        },
      },
    );

    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    this.isLayoutEditorMinimized = settings.layoutEditorMinimized ?? false;
    this.layoutEditorPosition = {
      x: settings.layoutEditorPositionX ?? 0,
      y: settings.layoutEditorPositionY ?? 0,
    };
    if (this.currentRacedayLayout && this.currentRacedayLayout.widgets) {
      this.layout = JSON.parse(JSON.stringify(this.currentRacedayLayout));
    } else {
      this.layout = this.getDefaultLayout();
    }

    this.loadColumns();

    // Clear caches to ensure fresh data for new race
    RaceConverter.clearCache();
    DriverConverter.clearCache();
    HeatConverter.clearCache();
    TrackConverter.clearCache();
    LaneConverter.clearCache();
    RaceParticipantConverter.clearCache();
    TeamConverter.clearCache();
  }

  private subscribeToAssets() {
    this.subscriptions.push(
      this.dataService.socketConnected$.subscribe((connected) => {
        if (connected) {
          this.dataService.listAssets().subscribe({
            next: (assets) => {
              this.assets = assets || [];
              this.loadColumns();
              if (!this.isDestroyed) {
                this.cdr.markForCheck();
              }
            },
            error: (err) => {
              this.logger.error(
                "DefaultRacedayComponent: Failed to fetch assets",
                err,
              );
            },
          });

          this.dataService.getDrivers().subscribe({
            next: (drivers) => {
              this.allDrivers = drivers || [];
              if (!this.isDestroyed) {
                this.cdr.markForCheck();
              }
            },
            error: (err) => {
              this.logger.error(
                "DefaultRacedayComponent: Failed to fetch drivers",
                err,
              );
            },
          });
        }
      }),
    );
  }

  private subscribeToRaceData() {
    this.subscriptions.push(
      this.raceService.participants$.subscribe((participants) => {
        this.participants = participants || [];
        this.updateLeaderboardEntries();
        if (this.heat && this.heat.heatDrivers) {
          this.heat.heatDrivers.forEach((hd) => {
            const d = hd.actualDriver || hd.driver;
            const driverId = d?.entity_id || d?.name;
            const match = this.participants.find(
              (p) =>
                p.driver?.entity_id === driverId || p.driver?.name === driverId,
            );
            if (match && match.rank) {
              (hd as any).overallRank = match.rank;
            }
          });
        }
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }),
    );

    this.subscriptions.push(
      this.raceService.groupParticipants$.subscribe((participants) => {
        this.groupParticipants = participants || [];
        this.updateGroupLeaderboardEntries();

        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }),
    );

    this.subscriptions.push(
      this.raceService.currentGroup$.subscribe((group) => {
        this.currentGroup = group || 0;
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }),
    );

    this.subscriptions.push(
      this.raceService.heats$.subscribe((heats) => {
        this.heats = heats || [];
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }),
    );

    this.viewerRaceEndedHandler.startListening();

    this.subscriptions.push(
      this.dataService.getServerIp().subscribe({
        next: (ip) => {
          if (ip) {
            const port = window.location.port;
            const url = `${window.location.protocol}//${ip}${port ? ":" + port : ""}`;
            if (this.serverUrlBase !== url) {
              this.serverUrlBase = url;
              this.laneQrCodeCache.clear();
              this.driverViewQrCodeCache.clear();
            }
            QRCode.toDataURL(url, { margin: 1 })
              .then((dataUrl) => {
                this.qrCodeUrl = dataUrl;
                this.generateAllLaneQrCodes();
                if (!this.isDestroyed) {
                  this.cdr.markForCheck();
                }
              })
              .catch((err) =>
                this.logger.error("QR Code generation failed", err),
              );
          }
        },
        error: (err) => {
          this.logger.warn("Failed to fetch server IP", err);
        },
      }),
    );

    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.raceService.currentHeat$.subscribe(() => {
        this.loadRaceData();
      }),
    );

    this.subscriptions.push(
      this.raceService.selectedRace$.subscribe(() => {
        this.loadRaceData();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        this.handleRaceStateChange(state);
      }),
    );
  }

  private subscribeToRaceTime() {
    this.subscriptions.push(
      this.raceConnectionService.raceTime$.subscribe((raceTime) => {
        this.autoStartRemaining = raceTime.autoStartRemaining || 0;
        this.autoAdvanceRemaining =
          raceTime.autoAdvanceRemaining ||
          (this.race as any)?.auto_advance_remaining_seconds ||
          0;

        const actualRaceTime = raceTime.time || 0;
        let time = actualRaceTime;
        if (
          this.raceState !== RaceState.STARTING &&
          this.autoStartRemaining > 0 &&
          !this.isRestarting
        ) {
          time = this.autoStartRemaining;
        } else if (this.autoAdvanceRemaining > 0) {
          time = this.autoAdvanceRemaining;
        }

        // Update countdown overlay if active
        if (this.showCountdownOverlay) {
          this.updateCountdownLamps(this.autoStartRemaining);
        }

        if (time > this.previousTime) {
          this.timeFormat = "1.0-0";
        } else if (time < this.previousTime) {
          if (this.raceState === RaceState.STARTING) {
            this.timeFormat = "1.0-0";
          } else {
            const timerWidget = this.layout?.widgets?.find(
              (w) => w.widgetType === "timer",
            );
            const threshold =
              timerWidget?.customSettings?.["timeSubsecondThreshold"] ?? 10;
            const decimals =
              timerWidget?.customSettings?.["timeSubsecondDecimals"] ?? 2;

            if (time < threshold && decimals > 0) {
              this.timeFormat = `1.${decimals}-${decimals}`;
            } else {
              this.timeFormat = "1.0-0";
            }
          }
        } else {
          if (time === 0) this.timeFormat = "1.0-0";
        }

        if (
          time === 0 &&
          this.previousTime > 0 &&
          this.showCountdownOverlay &&
          this.autoStartRemaining <= 0 &&
          this.autoAdvanceRemaining <= 0
        ) {
          time = this.previousTime;
        }

        if (this.raceState === RaceState.RACING) {
          this.checkAudioCallouts(time, this.previousTime);
        }

        this.time = time;
        this.previousTime = time;

        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }),
    );
  }

  private subscribeToLapEvents() {
    this.subscriptions.push(
      this.raceConnectionService.laps$.subscribe((lap) => {
        if (this.heat && this.heat.heatDrivers && lap && lap.objectId) {
          const driverData = this.heat.heatDrivers.find(
            (d) => d.objectId === lap.objectId,
          );
          if (driverData) {
            this.handleLapEvent(lap, driverData);
          }
        }
      }),
    );
  }

  private handleLapEvent(lap: any, driverData: DriverHeatData) {
    if (!this.isDestroyed) {
      this.livePredictionSubject.next();
    }

    const driver = driverData.driver;
    const isBestLap = lap.lapTime === lap.bestLapTime;
    const ttsContext = createTTSContext(driver as any, driverData as any);

    this.handleLapAudio(lap, driver, isBestLap, ttsContext);
    this.checkHalfwayPoint(lap, ttsContext);
    this.handleLapHighlight(lap);
  }

  private handleLapAudio(
    lap: any,
    driver: any,
    isBestLap: boolean,
    ttsContext: any,
  ) {
    if (lap.type === LapType.FALSE_START) {
      if (
        driver.penaltyAudio?.type &&
        driver.penaltyAudio.type !== "none" &&
        (driver.penaltyAudio.url ||
          (driver.penaltyAudio.type === "tts" && driver.penaltyAudio.text))
      ) {
        playSound(
          driver.penaltyAudio.type,
          driver.penaltyAudio.url,
          driver.penaltyAudio.text,
          this.dataService.serverUrl,
          ttsContext,
          this.logger,
        );
      } else {
        this.playThemedSound(THEME_SLOT_KEYS.AUDIO_PENALTY, ttsContext);
      }
      return;
    }

    if (lap.type === LapType.MIN_LAP_TIME) {
      if ((lap.lapTime ?? 0) > 0.25) {
        this.playThemedSound(THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME, ttsContext);
      }
      return;
    }

    if (
      isBestLap &&
      driver.bestLapAudio?.type !== "none" &&
      (driver.bestLapAudio?.url ||
        (driver.bestLapAudio?.type === "tts" && driver.bestLapAudio?.text))
    ) {
      playSound(
        driver.bestLapAudio.type,
        driver.bestLapAudio.url,
        driver.bestLapAudio.text,
        this.dataService.serverUrl,
        ttsContext,
        this.logger,
      );
    } else if (lap.isDrift) {
      this.playThemedSound(THEME_SLOT_KEYS.AUDIO_DRIFT_LAP, ttsContext);
    } else if (
      driver.lapAudio?.type !== "none" &&
      (driver.lapAudio?.url ||
        (driver.lapAudio?.type === "tts" && driver.lapAudio?.text))
    ) {
      playSound(
        driver.lapAudio.type,
        driver.lapAudio.url,
        driver.lapAudio.text,
        this.dataService.serverUrl,
        ttsContext,
        this.logger,
      );
    }
  }

  private checkHalfwayPoint(lap: any, ttsContext: any) {
    const scoring = this.race?.heat_scoring;
    if (
      scoring &&
      scoring.finishMethod === FinishMethod.Lap &&
      !this.playedHalfway
    ) {
      const halfwayLaps = scoring.finishValue / 2;
      if (lap.lapNumber != null && lap.lapNumber >= halfwayLaps) {
        this.playThemedSound(
          THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
          ttsContext,
        );
        this.playedHalfway = true;
      }
    }
  }

  private handleLapHighlight(lap: any) {
    const settings = this.settingsService.getSettings();
    const shouldHighlight = this.isPracticeLayout
      ? settings.highlightPracticeRowOnLap
      : settings.highlightRowOnLap;
    if (shouldHighlight) {
      this.highlightedDrivers.add(lap.objectId!);
      if (!this.isDestroyed) {
        this.cdr.markForCheck();
      }
      const timer = setTimeout(() => {
        this.highlightedDrivers.delete(lap.objectId!);
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }, 400);
      this.subscriptions.push(new Subscription(() => clearTimeout(timer)));
    }
  }

  private subscribeToLiveUpdates() {
    this.subscriptions.push(
      this.raceConnectionService.carData$.subscribe((carData) => {
        if (!this.isDestroyed && carData && carData.lane != null) {
          if (carData.location != null) {
            this.carLocations.set(carData.lane, carData.location);
          }
          this.cdr.markForCheck();
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.segments$.subscribe((_segment) => {
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.reactionTimes$.subscribe((_rt) => {
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.standingsUpdate$.subscribe((update) => {
        if (update && update.updates) {
          update.updates.forEach((u) => {
            if (u.objectId) {
              this.driverRankings.set(u.objectId, u.rank || 0);
            }
          });
        }
        this.sortHeatDrivers();
      }),
    );
  }

  private subscribeToUIEvents() {
    this.subscriptions.push(
      this.route.queryParams.subscribe((params: any) => {
        if (params["themeId"]) {
          const themeId = params["themeId"];
          Promise.all([
            this.themeService.setTransientActiveTheme(themeId),
            this.customUiService.initialize(),
          ]).then(() => {
            this.updateRacedayLayout();
          });
        }
        if (params["modifyHeats"] === "true") {
          const returnUrl = this.router.url.split("?")[0];
          this.router.navigate(["/modify-heats"], {
            queryParams: { returnUrl },
            replaceUrl: true,
          });
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.interfaceEvents$.subscribe((_event) => {
        this.isInterfaceConnected =
          this.raceConnectionService.isInterfaceConnected;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.interfaceAlert$.subscribe((alert) => {
        this.showInterfaceError(alert.titleKey, alert.messageKey);
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.recordData$.subscribe((records) => {
        if (records) {
          this.handleRecordDataUpdate(records);
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.raceFlag$.subscribe((_flag) => {
        if (!this.isDestroyed) {
          this.cdr.markForCheck();
        }
      }),
    );
  }

  private updateRacedayLayout() {
    if (this.isUIEditorMode()) {
      return;
    }
    if (this.currentRacedayLayout && this.currentRacedayLayout.widgets) {
      this.layout = JSON.parse(JSON.stringify(this.currentRacedayLayout));
    } else {
      this.layout = this.getDefaultLayout();
    }
    this.updateScale();
    this.loadColumns();
    this.cdr.markForCheck();
  }

  private handleRecordDataUpdate(records: any) {
    this.recordData = records;
    const overall = records.overall;
    const current = records.current;

    if (overall?.fastestLap) {
      const hasLap = overall.fastestLap.value && overall.fastestLap.value > 0;
      this.raceRecordLapNickname = hasLap
        ? overall.fastestLap.holderNickname ||
          overall.fastestLap.holderName ||
          "---"
        : "---";
      this.raceRecordLapTime = overall.fastestLap.value || 0;
    } else {
      this.raceRecordLapNickname = "---";
      this.raceRecordLapTime = 0;
    }

    if (overall?.highestScore) {
      this.raceRecordScoreNickname =
        overall.highestScore.holderTeamName ||
        overall.highestScore.holderNickname ||
        overall.highestScore.holderName ||
        "---";
      this.raceRecordScore = overall.highestScore.value || 0;
    } else {
      this.raceRecordScoreNickname = "---";
      this.raceRecordScore = 0;
    }

    if (current?.fastestLap) {
      const hasLap = current.fastestLap.value && current.fastestLap.value > 0;
      this.currentRaceBestNickname = hasLap
        ? current.fastestLap.holderNickname ||
          current.fastestLap.holderName ||
          "---"
        : "---";
      this.currentRaceBestTime = current.fastestLap.value || 0;
    } else {
      this.currentRaceBestNickname = "---";
      this.currentRaceBestTime = 0;
    }

    if (current?.heatFastestLap) {
      const hasLap =
        current.heatFastestLap.value && current.heatFastestLap.value > 0;
      this.heatBestNickname = hasLap
        ? current.heatFastestLap.holderNickname ||
          current.heatFastestLap.holderName ||
          "---"
        : "---";
      this.heatBestTime = current.heatFastestLap.value || 0;
    } else {
      this.heatBestNickname = "---";
      this.heatBestTime = 0;
    }

    if (!this.isDestroyed) {
      this.cdr.markForCheck();
    }
  }

  getLaneRecord(hd?: DriverHeatData): number {
    const laneIndex = hd?.laneIndex ?? 0;
    const laneFastestLap = this.recordData?.overall?.laneFastestLap;
    if (Array.isArray(laneFastestLap) && laneFastestLap[laneIndex]?.value > 0) {
      return laneFastestLap[laneIndex].value;
    }
    return this.raceRecordLapTime || this.currentRaceBestTime || 0;
  }

  getLaneRecordEntry(hd?: DriverHeatData | number): IRecordEntry | undefined {
    const laneIndex = typeof hd === "number" ? hd : (hd?.laneIndex ?? 0);
    const laneFastestLap = this.recordData?.overall?.laneFastestLap;
    if (Array.isArray(laneFastestLap) && laneFastestLap[laneIndex]) {
      return laneFastestLap[laneIndex];
    }
    if (this.isUIEditorMode()) {
      const mockEntries = createMockLaneRecordEntries();
      return mockEntries[laneIndex];
    }
    return undefined;
  }

  getLaneRecordTime(hd?: DriverHeatData, anchor?: string): string {
    const entry = this.getLaneRecordEntry(hd);
    const isInset = anchor ? !anchor.startsWith("center-") : false;
    const laneViewWidget = this.currentRacedayLayout?.widgets?.find(
      (w: any) => w.widgetType === "lane-view",
    );
    const timeDecimals = isInset
      ? laneViewWidget?.customSettings?.["insetTimeDecimalPlaces"] !== undefined
        ? Number(laneViewWidget.customSettings["insetTimeDecimalPlaces"])
        : 3
      : laneViewWidget?.customSettings?.["timeDecimalPlaces"] !== undefined
        ? Number(laneViewWidget.customSettings["timeDecimalPlaces"])
        : 3;
    const timePlaceholder =
      timeDecimals > 0 ? "--." + "-".repeat(timeDecimals) : "--";
    if (!entry || !entry.value || entry.value <= 0) return timePlaceholder;
    return entry.value.toFixed(timeDecimals);
  }

  getLaneRecordHolder(hd?: DriverHeatData): string {
    const entry = this.getLaneRecordEntry(hd);
    if (!entry || !entry.value || entry.value <= 0) return "---";
    return entry.holderNickname || entry.holderName || "---";
  }

  getLaneRecordDate(hd?: DriverHeatData): string {
    const entry = this.getLaneRecordEntry(hd);
    if (!entry?.date || !entry?.value || entry.value <= 0) return "---";
    let ms = 0;
    if (typeof entry.date === "number") {
      ms = entry.date;
    } else if ((entry.date as any).toNumber) {
      ms = (entry.date as any).toNumber();
    } else if (typeof entry.date === "string") {
      ms = parseInt(entry.date, 10);
    } else {
      ms = Number(entry.date);
    }
    if (ms <= 0 || isNaN(ms)) return "---";
    const d = new Date(ms);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  getPersonalBest(hd?: DriverHeatData): number {
    if (!hd) return 0;
    return hd.bestLapTime > 0 ? hd.bestLapTime : 0;
  }

  getLeaderHeatDriver(): DriverHeatData | undefined {
    const drivers = (this.heat?.heatDrivers || []).filter(
      (d) => !this.isEmptyDriver(d),
    );
    if (drivers.length === 0) return undefined;

    // 1. Check driverRankings map (populated from standingsUpdate$ / heat.standings)
    for (const d of drivers) {
      if (this.driverRankings.get(d.objectId) === 1) {
        return d;
      }
    }

    // 2. Check heat.standings array
    if (this.heat?.standings && this.heat.standings.length > 0) {
      const leaderId = this.heat.standings[0];
      const leader = drivers.find((d) => d.objectId === leaderId);
      if (leader) return leader;
    }

    // 3. Check for 0 gap to leader with completed laps
    const zeroGap = drivers.find(
      (d) =>
        (d as any).gapLeader === 0 &&
        (d as any).lapsDownLeader === 0 &&
        (d.lapTimes?.length > 0 || d.bestLapTime > 0),
    );
    if (zeroGap) return zeroGap;

    // 4. Sort by lapCount descending, then totalTime / lastLapTime ascending
    const sorted = [...drivers].sort((a, b) => {
      const lapsA = a.lapCount ?? 0;
      const lapsB = b.lapCount ?? 0;
      if (lapsA !== lapsB) return lapsB - lapsA;
      const timeA = a.totalTime ?? a.lastLapTime ?? 0;
      const timeB = b.totalTime ?? b.lastLapTime ?? 0;
      return timeA - timeB;
    });

    return sorted[0] || drivers[0];
  }

  get heatLeaderAvgTime(): number {
    const leader = this.getLeaderHeatDriver();
    return leader && leader.averageLapTime > 0 ? leader.averageLapTime : 0;
  }

  get heatLeaderMedianTime(): number {
    const leader = this.getLeaderHeatDriver();
    return leader && leader.medianLapTime > 0 ? leader.medianLapTime : 0;
  }

  get heatLeaderBestTime(): number {
    const leader = this.getLeaderHeatDriver();
    if (leader && leader.bestLapTime > 0) return leader.bestLapTime;
    return this.heatBestTime || 0;
  }

  get leaderBoardWindow(): Window | null {
    return this.childWindowManagerService.getLeaderBoardWindow();
  }
  set leaderBoardWindow(val: Window | null) {
    this.childWindowManagerService.setLeaderBoardWindow(val);
  }

  get heatResultsWindow(): Window | null {
    return this.childWindowManagerService.getHeatResultsWindow();
  }
  set heatResultsWindow(val: Window | null) {
    this.childWindowManagerService.setHeatResultsWindow(val);
  }

  get raceResultsWindow(): Window | null {
    return this.childWindowManagerService.getRaceResultsWindow();
  }
  set raceResultsWindow(val: Window | null) {
    this.childWindowManagerService.setRaceResultsWindow(val);
  }

  get seasonResultsWindow(): Window | null {
    return this.childWindowManagerService.getSeasonResultsWindow();
  }
  set seasonResultsWindow(val: Window | null) {
    this.childWindowManagerService.setSeasonResultsWindow(val);
  }

  get predictionResultsWindow(): Window | null {
    return this.childWindowManagerService.getPredictionResultsWindow();
  }
  set predictionResultsWindow(val: Window | null) {
    this.childWindowManagerService.setPredictionResultsWindow(val);
  }

  get driverStationTabs(): Window[] {
    return this.childWindowManagerService.getDriverStationTabs();
  }
  set driverStationTabs(val: Window[]) {
    if (val.length === 0) {
      this.childWindowManagerService.clearDriverStationTabs();
    }
  }

  private setupMockDataForEditor() {
    const mockData = createMockEditorData();
    this.raceState = mockData.raceState;
    this.time = mockData.time;
    this.race = mockData.race;
    this.track = mockData.track;
    this.participants = mockData.participants;
    this.heat = mockData.heat;
    this.heats = mockData.heats;
    this.groupParticipants = mockData.groupParticipants;
    this.currentGroup = 1;
    this.qrCodeUrl =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='white'/><rect x='10' y='10' width='20' height='20' fill='black'/><rect x='50' y='10' width='20' height='20' fill='black'/><rect x='10' y='50' width='20' height='20' fill='black'/><rect x='40' y='40' width='10' height='10' fill='black'/><rect x='30' y='30' width='20' height='20' fill='black'/></svg>";

    // Populate mock lane QR codes for UI Editor
    this.laneQrCodeCache.clear();
    for (let i = 0; i < (this.track?.lanes?.length || 8); i++) {
      this.laneQrCodeCache.set(i, this.qrCodeUrl);
    }

    // Populate mock data for the 4 race records
    this.raceRecordLapNickname = "Mario";
    this.raceRecordLapTime = 1.842;
    this.raceRecordScoreNickname = "Luigi";
    this.raceRecordScore = 24.5;
    this.currentRaceBestNickname = "Bowser";
    this.currentRaceBestTime = 1.955;
    this.heatBestNickname = "Peach";
    this.heatBestTime = 2.012;
    this.recordData = mockData.recordData;

    this.sortHeatDrivers();
    this.updateLeaderboardEntries();
    this.updateGroupLeaderboardEntries();
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
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
    this.raceConnectionService.disconnect(isNavigatingToSetup);

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    if (!this.childWindowManagerService.isRacePreservingRoute(destUrl)) {
      this.childWindowManagerService.closeAllWindows();
    }
  }

  private showInterfaceError(titleKey: string, messageKey: string) {
    this.ackModalTitle = titleKey;
    this.ackModalMessage = messageKey;
    this.showAckModal = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onAcknowledgeModal() {
    this.showAckModal = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    if (this.raceHasEnded) {
      this.forceExit = true;
      this.router.navigate(["/raceday-setup"]);
    }
  }

  onExitConfirm() {
    this.showExitConfirmation = false;
    this.deactivateSubject.next(true);
  }

  onExitCancel() {
    this.showExitConfirmation = false;
    this.deactivateSubject.next(false);
  }

  onSkipHeatConfirm() {
    this.showSkipHeatConfirmation = false;
    this.dataService.skipHeat().subscribe(
      (success) => {
        if (success) {
          this.logger.debug("Skip heat command sent successfully");
        } else {
          this.logger.error("Failed to send skip heat command");
        }
      },
      (error) => {
        this.logger.error("Error skipping heat:", error);
      },
    );
    this.cdr.markForCheck();
  }

  onSkipHeatCancel() {
    this.showSkipHeatConfirmation = false;
    this.cdr.markForCheck();
  }

  onSkipRaceConfirm() {
    this.showSkipRaceConfirmation = false;
    this.dataService.skipRace().subscribe(
      (success) => {
        if (success) {
          this.logger.debug("Skip race command sent successfully");
        } else {
          this.logger.error("Failed to send skip race command");
        }
      },
      (error) => {
        this.logger.error("Error skipping race:", error);
      },
    );
    this.cdr.markForCheck();
  }

  onSkipRaceCancel() {
    this.showSkipRaceConfirmation = false;
    this.cdr.markForCheck();
  }

  onRestartHeatConfirm() {
    this.showRestartHeatConfirmation = false;
    this.dataService.restartHeat().subscribe(
      (success) => {
        if (success) {
          this.logger.debug("Restart heat command sent successfully");
        } else {
          this.logger.error("Failed to send restart heat command");
        }
      },
      (error) => {
        this.logger.error("Error restarting heat:", error);
      },
    );
    this.cdr.markForCheck();
  }

  onRestartHeatCancel() {
    this.showRestartHeatConfirmation = false;
    this.cdr.markForCheck();
  }

  onDeferHeatConfirm() {
    this.showDeferHeatConfirmation = false;
    this.dataService.deferHeat().subscribe(
      (success) => {
        if (success) {
          this.logger.debug("Defer heat command sent successfully");
        } else {
          this.logger.error("Failed to send defer heat command");
        }
      },
      (error) => {
        this.logger.error("Error deferring heat:", error);
      },
    );
    this.cdr.markForCheck();
  }

  onDeferHeatCancel() {
    this.showDeferHeatConfirmation = false;
    this.cdr.markForCheck();
  }

  canDeactivate(
    nextState?: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.forceExit) {
      return true;
    }
    if (this.raceHasEnded) {
      this.showExitConfirmation = false;
      this.showSkipHeatConfirmation = false;
      this.showRestartHeatConfirmation = false;
      this.showDeferHeatConfirmation = false;
      this.ackModalTitle = "RD_RACE_ENDED_TITLE";
      this.ackModalMessage = "RD_RACE_ENDED_MESSAGE";
      this.ackModalButtonText = "RD_RACE_ENDED_BTN_OK";
      this.showAckModal = true;
      this.cdr.markForCheck();
      return false;
    }
    if (nextState) {
      if (
        nextState.url.includes("/modify-heats") ||
        nextState.url.includes("/team-manager") ||
        nextState.url.includes("/driver-manager") ||
        nextState.url.includes("/ui-editor") ||
        nextState.url.includes("/driver-station") ||
        nextState.url.includes("/driver-view")
      ) {
        return true;
      }
    }

    this.exitModalTitle = "RD_CONFIRM_EXIT_TITLE";
    this.exitModalMessage = "RD_CONFIRM_EXIT_MESSAGE";
    this.exitConfirmText = "RD_CONFIRM_EXIT_BTN_LEAVE";
    this.exitCancelText = "RD_CONFIRM_EXIT_BTN_STAY";
    this.showExitConfirmation = true;
    this.cdr.markForCheck();
    return this.deactivateSubject.asObservable();
  }

  private sortHeatDrivers() {
    if (!this.heat) return;

    // IMPORTANT: Always keep the array in laneIndex order for DOM stability.
    // If we reorder the array, Angular physically moves DOM nodes, which
    // breaks CSS transitions (elements "pop" instead of sliding).
    // Instead, we compute visual positions in a separate map.
    this.sortedHeatDrivers = [...this.heat.heatDrivers].sort(
      (a, b) => a.laneIndex - b.laneIndex,
    );

    const settings = this.settingsService.getSettings();
    if (settings.sortByStandings && !this.isDragging) {
      // Sort a separate copy to determine visual positions using the server-provided standings list
      const ranked = [...this.heat.heatDrivers].sort((a, b) => {
        let idxA = this.heat?.standings?.indexOf(a.objectId) ?? -1;
        let idxB = this.heat?.standings?.indexOf(b.objectId) ?? -1;
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        return idxA - idxB;
      });
      this.driverVisualPositions.clear();
      ranked.forEach((hd, i) =>
        this.driverVisualPositions.set(hd.laneIndex, i),
      );
    } else {
      // Visual position matches lane order
      this.driverVisualPositions.clear();
      this.sortedHeatDrivers.forEach((hd, i) =>
        this.driverVisualPositions.set(hd.laneIndex, i),
      );
    }

    this.loadPredictionsForCurrentRace();
    this.cdr.markForCheck();
  }

  protected getDriverVisualPosition(hd: DriverHeatData): number {
    return this.driverVisualPositions.get(hd.laneIndex) ?? 0;
  }

  protected get isSingleHeatSolo(): boolean {
    // TODO(aufderheide): We should not be looking at a string here.
    // This needs to be changed to an enum.
    return this.race?.heat_rotation_type === "SingleHeatSolo";
  }

  protected get isSingleHeat(): boolean {
    return this.race?.heat_rotation_type === "SingleHeat";
  }

  protected get canSwapLanes(): boolean {
    if (this.isSingleHeatSolo) return true;
    if (this.isSingleHeat) {
      return this.raceState === RaceState.NOT_STARTED;
    }
    return false;
  }

  protected onDrop(event: CdkDragDrop<DriverHeatData[]>) {
    this.draggingLane = null;
    this.isDragging = false;
    if (
      !this.canSwapLanes ||
      event.previousIndex === event.currentIndex ||
      !this.sortedHeatDrivers
    ) {
      return;
    }

    const fromHd = event.item.data as DriverHeatData;
    const toHd = this.sortedHeatDrivers.find(
      (hd) => this.getDriverVisualPosition(hd) === event.currentIndex,
    );

    if (!fromHd || !toHd) return;

    this.dataService
      .changeLane(fromHd.laneIndex, toHd.laneIndex)
      .subscribe((success) => {
        if (!success) {
          this.logger.error("Failed to change lane");
        }
      });
  }

  protected onDragStarted(laneIndex: number) {
    this.isDragging = true;
    this.draggingLane = laneIndex;
    this.cdr.markForCheck();
  }

  protected onDragOver(laneIndex: number) {
    if (this.canSwapLanes && this.isDragging) {
      this.draggingLane = laneIndex;
    }
  }

  protected onDragEnded() {
    this.draggingLane = null;
    this.isDragging = false;
  }

  protected isLaneOccupied(hd: DriverHeatData): boolean {
    return !!hd && !!hd.driver && !Driver.isEmpty(hd.driver);
  }

  private detectShortcutKey() {
    const isMac =
      navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
      navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
    if (isMac) {
      this.startResumeShortcut = "Cmd+S";
      this.pauseShortcut = "Cmd+P";
      this.nextHeatShortcut = "Cmd+N";
      this.restartHeatShortcut = "Cmd+R";
      this.skipHeatShortcut = "Cmd+F5";
      this.deferHeatShortcut = "Cmd+F6";
    }
  }

  private loadRaceData() {
    this.logger.debug("RacedayComponent: Loading race data...");

    const race = this.raceService.getRace();
    if (race) {
      this.logger.debug("RacedayComponent: using selected race:", race);
      this.logger.debug(
        "RacedayComponent: Race tracks/lanes:",
        race.track,
        race.track?.lanes,
      );
      const isNewRace =
        !this.race ||
        this.race.entity_id !== race.entity_id ||
        (this.race as any)?.current_event_race_index !==
          (race as any)?.current_event_race_index;

      this.race = race;
      this.track = race.track;

      if (isNewRace) {
        // Reset timer state ONLY when advancing to a new race
        this.autoStartRemaining =
          (race as any)?.auto_start_remaining_seconds ||
          (race as any)?.auto_start_remaining ||
          race.auto_start_time ||
          0;
        this.autoAdvanceRemaining =
          (race as any)?.auto_advance_remaining_seconds ||
          (race as any)?.auto_advance_remaining ||
          0;
        this.time =
          this.autoStartRemaining > 0
            ? this.autoStartRemaining
            : this.autoAdvanceRemaining;
        this.previousTime = this.time;
        this.timeFormat = "1.0-0";
        this.playedSecondsLeft.clear();
        this.playedHalfway = false;
      } else {
        const remaining = (race as any)?.auto_advance_remaining_seconds;
        if (remaining !== undefined && remaining !== null) {
          this.autoAdvanceRemaining = remaining;
          if (remaining > 0) {
            this.time = remaining;
          }
        }
      }

      if (
        race.entity_id &&
        !this.route.snapshot?.queryParams?.["themeId"] &&
        !this.themeService?.getTransientThemeId?.() &&
        typeof this.themeService?.activateForRace === "function"
      ) {
        this.themeService.activateForRace(race.entity_id);
      }
      this.generateAllLaneQrCodes();

      if (this.currentRacedayLayout && this.currentRacedayLayout.widgets) {
        this.layout = JSON.parse(JSON.stringify(this.currentRacedayLayout));
      } else {
        this.layout = this.getDefaultLayout();
      }

      this.updateScale();
      this.loadColumns();
      this.initializeHeat();

      // If we're already in a starting state, re-sync the countdown lamps now that we have duration
      if (
        this.raceState === RaceState.STARTING ||
        this.raceState === RaceState.PAUSED
      ) {
        const duration =
          this.isRestarting || this.raceState === RaceState.PAUSED
            ? (race.restart_time ?? 5.0)
            : (race.start_time ?? 5.0);
        this.countdownTotalLamps = Math.ceil(duration);
        this.updateCountdownLamps(this.autoStartRemaining ?? duration);
      }
    } else {
      this.logger.debug("RacedayComponent: Waiting for race data...");
      // Do not throw error, wait for Race
    }
    if (!this.isDestroyed) {
      this.cdr.markForCheck();
    }
  }

  protected totalHeats: number = 0;

  // ... existing properties ...

  private initializeHeat() {
    if (!this.track) return;

    const heats = this.raceService.getHeats();
    if (heats && heats.length > 0) {
      this.totalHeats = heats.length;
      const prevHeatNumber = this.heat?.heatNumber;
      this.heat = this.raceService.getCurrentHeat();

      if (this.heat && this.heat.heatNumber !== prevHeatNumber) {
        this.hasRacedInCurrentHeat = false;
      }

      if (this.heat && this.heat.group !== undefined) {
        this.currentGroup = this.heat.group;
      }

      // Initialize rankings
      this.driverRankings.clear();
      if (this.heat) {
        if (this.heat.standings && this.heat.standings.length > 0) {
          this.heat.standings.forEach((sid, index) =>
            this.driverRankings.set(sid, index + 1),
          );
        } else {
          // Default to initial order if no standings yet
          this.heat.heatDrivers.forEach((hd, index) =>
            this.driverRankings.set(hd.objectId, index + 1),
          );
        }
      }

      this.sortHeatDrivers();
      this.cdr.markForCheck();
    } else {
      // No heats available
    }
  }

  // Get translated column label
  getColumnLabel(column: ColumnDefinition): string {
    if (column.propertyName === "driver.avatarUrl") {
      return "";
    }
    const translation = this.translationService.translate(column.labelKey);
    if (column.propertyName.startsWith("segmentTime")) {
      const segmentColumns = this.columns.filter((c) =>
        c.propertyName.startsWith("segmentTime"),
      );
      if (segmentColumns.length > 1) {
        const parts = column.propertyName.split("_");
        const index = parts.length > 1 ? parseInt(parts[1], 10) + 1 : 1;
        return `${translation} ${index}`;
      }
    }
    return translation;
  }

  getColumnX(columnIndex: number): number {
    return RacedayLayoutUtils.getColumnX(this.columns, columnIndex);
  }

  getColumnCenterX(columnIndex: number): number {
    return RacedayLayoutUtils.getColumnCenterX(this.columns, columnIndex);
  }

  getWidgets(): any[] {
    if (!this.layout) {
      if (this.currentRacedayLayout?.widgets) {
        this.layout = JSON.parse(JSON.stringify(this.currentRacedayLayout));
      } else {
        this.layout = this.getDefaultLayout();
      }
    }
    return this.layout?.widgets || [];
  }

  getTableBodyHeight(): number {
    return RacedayLayoutUtils.getTableBodyHeight(this.layout);
  }

  getRowHeight(): number {
    return RacedayLayoutUtils.getRowHeight(
      this.layout,
      this.track?.lanes?.length || 1,
    );
  }

  getImageMetrics(colIndex: number) {
    return RacedayLayoutUtils.getImageMetrics(
      this.columns,
      colIndex,
      this.getRowHeight(),
    );
  }

  getColumnTextX(columnIndex: number, anchor?: any): number {
    return RacedayLayoutUtils.getColumnTextX(this.columns, columnIndex, anchor);
  }

  getColumnTextY(
    columnIndex: number,
    _hasTeam: boolean = false,
    anchor?: any,
  ): number {
    return RacedayLayoutUtils.getColumnTextY(this.getRowHeight(), anchor);
  }

  getColumnTextAnchor(columnIndex: number, anchor?: any): string {
    return RacedayLayoutUtils.getColumnTextAnchor(
      this.columns,
      columnIndex,
      anchor,
    );
  }

  getColumnMaxWidth(columnIndex: number): number {
    return RacedayLayoutUtils.getColumnMaxWidth(this.columns, columnIndex);
  }

  getAnchorFontSize(anchor: string): number {
    return RacedayLayoutUtils.getAnchorFontSize(anchor);
  }
  getDriverOverallRanking(hd: DriverHeatData): number | undefined {
    return (
      (hd as any).overallRank ??
      hd.participant?.rank ??
      (hd.driver as any)?.rank
    );
  }

  getDriverGroupRanking(hd: DriverHeatData): number | undefined {
    let entityId: string | undefined;

    if (hd.participant?.team) {
      entityId = hd.participant.team.entity_id || hd.participant.team.name;
    } else {
      const d = hd.actualDriver || hd.driver;
      entityId = d?.entity_id || d?.name;
    }

    const entry = this.groupLeaderboardEntries?.find(
      (e) => e.entityId === entityId,
    );
    if (entry && entry.rank > 0) return entry.rank;

    const match = this.groupParticipants?.find((p) => {
      if (hd.participant?.team) {
        return p.team?.entity_id === entityId || p.team?.name === entityId;
      }
      return p.driver?.entity_id === entityId || p.driver?.name === entityId;
    });
    return match?.rank && match.rank > 0 ? match.rank : undefined;
  }

  protected loadPredictionsForCurrentRace() {
    if (this.isUIEditorMode() || !this.predictionService) return;
    const raceId = this.race?.entity_id || "current";
    const isDemo = this.race?.practice || false;
    this.predictionService
      .getRacePredictions(raceId, isDemo)
      .subscribe((record) => {
        if (record) {
          this.applyPredictionsToDrivers(record);
          this.cdr.markForCheck();
        }
      });
  }

  protected applyPredictionsToDrivers(record: RacePredictionRecord) {
    if (!record) return;
    const allDrivers = [
      ...(this.sortedHeatDrivers || []),
      ...(this.heat?.heatDrivers || []),
    ];

    let actualLapsRun = 0;
    if (this.participants && this.participants.length > 0) {
      for (const p of this.participants) {
        if (p.totalLaps) {
          actualLapsRun += p.totalLaps;
        }
      }
    } else {
      for (const hd of allDrivers) {
        if (hd && (hd as any).totalLaps !== undefined) {
          actualLapsRun += (hd as any).totalLaps;
        } else if (hd && hd.lapTimes) {
          actualLapsRun += hd.lapTimes.length;
        }
      }
    }

    const snapshot =
      actualLapsRun > 0 &&
      record.realtime_snapshots &&
      record.realtime_snapshots.length > 0
        ? record.realtime_snapshots[record.realtime_snapshots.length - 1]
        : record.pre_race;

    if (!snapshot || !snapshot.projected_standings) {
      // Hide predictions until at least one lap is run
      for (const hd of allDrivers) {
        if (!hd) continue;
        (hd as any).winProbability = undefined;
        (hd as any).projectedRank = undefined;
        (hd as any).projectedLaps = undefined;
        if (hd.driver) {
          (hd.driver as any).winProbability = undefined;
          (hd.driver as any).projectedRank = undefined;
          (hd.driver as any).projectedLaps = undefined;
        }
        if (hd.participant) {
          (hd.participant as any).winProbability = undefined;
          (hd.participant as any).projectedRank = undefined;
          (hd.participant as any).projectedLaps = undefined;
        }
      }
      return;
    }

    const projectionsMap = new Map<string, DriverProjection>();
    for (const proj of snapshot.projected_standings) {
      if (proj.driver_id) {
        projectionsMap.set(proj.driver_id, proj);
      }
      if (proj.driver_name) {
        projectionsMap.set(proj.driver_name, proj);
      }
    }

    for (const hd of allDrivers) {
      if (!hd) continue;
      const d = hd.actualDriver || (hd.driver as any)?.driver || hd.driver;
      const team = hd.participant?.team || (hd.driver as any)?.team;
      const teamId = team?.entity_id;
      const syntheticTeamId = teamId ? `t_${teamId}` : undefined;
      const teamName = team?.name;

      const driverId =
        d?.entity_id ||
        hd.participant?.driver?.entity_id ||
        (hd.participant as any)?.driver_id ||
        hd.participant?.objectId ||
        hd.objectId;
      const driverName = d?.name || hd.participant?.driver?.name || d?.nickname;

      const keysToTry = [
        syntheticTeamId,
        teamId,
        teamName,
        driverId,
        driverName,
      ].filter(Boolean) as string[];

      let proj: DriverProjection | undefined;
      for (const k of keysToTry) {
        if (projectionsMap.has(k)) {
          proj = projectionsMap.get(k);
          break;
        }
      }

      if (proj) {
        (hd as any).winProbability = proj.win_probability;
        (hd as any).projectedRank = proj.projected_rank;
        (hd as any).projectedLaps = proj.projected_laps;
        if (hd.driver) {
          (hd.driver as any).winProbability = proj.win_probability;
          (hd.driver as any).projectedRank = proj.projected_rank;
          (hd.driver as any).projectedLaps = proj.projected_laps;
        }
        if (hd.participant) {
          (hd.participant as any).winProbability = proj.win_probability;
          (hd.participant as any).projectedRank = proj.projected_rank;
          (hd.participant as any).projectedLaps = proj.projected_laps;
        }
      }
    }
    this.cdr.markForCheck();
  }

  getPropertyValue(heatDriver: DriverHeatData, propertyPath: string): any {
    return RacedayFormatUtils.getPropertyValue(heatDriver, propertyPath);
  }

  generateAllLaneQrCodes(): void {
    if (!this.serverUrlBase || !this.track?.lanes) return;

    this.track.lanes.forEach((lane, index) => {
      QRCode.toDataURL(`${this.serverUrlBase}/driver-station/${index + 1}`, {
        margin: 1,
      })
        .then((dataUrl) => {
          this.laneQrCodeCache.set(index, dataUrl);
          if (!this.isDestroyed) {
            this.cdr.markForCheck();
          }
        })
        .catch((err) =>
          this.logger.error("Lane QR Code generation failed", err),
        );
    });
  }

  getLaneQrCodeUrl(laneIndex: number): string {
    return this.laneQrCodeCache.get(laneIndex) || "";
  }

  getDriverViewQrCodeUrl(hd: DriverHeatData): string {
    const entityId =
      hd.actualDriver?.entity_id ||
      hd.driver?.entity_id ||
      hd.actualDriver?.name ||
      hd.driver?.name ||
      hd.participant?.team?.entity_id ||
      hd.participant?.team?.name ||
      hd.participant?.objectId ||
      hd.objectId;
    if (!entityId) return "";

    let dataUrl = this.driverViewQrCodeCache.get(entityId);
    if (!dataUrl) {
      this.driverViewQrCodeCache.set(entityId, "generating");
      QRCode.toDataURL(
        `${this.serverUrlBase}/driver-view/${encodeURIComponent(entityId)}`,
        {
          margin: 1,
        },
      )
        .then((url) => {
          this.driverViewQrCodeCache.set(entityId, url);
          if (!this.isDestroyed) {
            this.cdr.markForCheck();
          }
        })
        .catch((err) => {
          this.logger.error("Driver View QR Code generation failed", err);
          this.driverViewQrCodeCache.delete(entityId);
        });
    }
    return dataUrl === "generating" ? "" : dataUrl || "";
  }

  formatColumnValue(
    heatDriver: DriverHeatData,
    column: ColumnDefinition,
    propertyName?: string,
    anchor?: string,
  ): string {
    const laneViewWidget = this.currentRacedayLayout?.widgets?.find(
      (w) => w.widgetType === "lane-view",
    );
    const ctx: FormatContext = {
      translate: (key) => this.translationService.translate(key),
      getRace: () => this.raceService.getRace(),
      getTrack: () => this.track,
      getDriverRanking: (objectId) => this.driverRankings.get(objectId),
      getFlagType: () => this.raceFlagService.getFlagType(),
      getFlagUrl: (flag) => this.getFlagUrl(flag),
      getFullUrl: (url) => this.getFullUrl(url),
      getImageSetUrl: (hd, prop) => this.getImageUrl(prop, hd),
      laneViewWidgetSettings: laneViewWidget?.customSettings,
      getDriverOverallRanking: (hd) => this.getDriverOverallRanking(hd),
      getDriverGroupRanking: (hd) => this.getDriverGroupRanking(hd),
      getLaneQrCodeUrl: (laneIndex) => this.getLaneQrCodeUrl(laneIndex),
      getDriverViewQrCodeUrl: (hd) => this.getDriverViewQrCodeUrl(hd),
      isDriverFinished: (hd, scoring) => this.isDriverFinished(hd, scoring),
      getLaneRecordEntry: (laneIndex) => this.getLaneRecordEntry(laneIndex),
    };
    return RacedayFormatUtils.formatColumnValue(
      heatDriver,
      column,
      propertyName,
      ctx,
      anchor,
    );
  }

  getLastLaps(
    heatDriver: DriverHeatData,
    column: ColumnDefinition,
    anchor?: string,
  ): LapDisplayInfo[] {
    const laps = heatDriver.lapTimes || [];
    const lapsDetails = heatDriver.lapsWithDetails || [];
    const n = laps.length;
    const result: LapDisplayInfo[] = [];
    const laneViewWidget = this.currentRacedayLayout?.widgets?.find(
      (w) => w.widgetType === "lane-view",
    );
    const ctx: FormatContext = {
      translate: (key) => this.translationService.translate(key),
      getRace: () => this.raceService.getRace(),
      getTrack: () => this.track,
      getDriverRanking: (objectId) => this.driverRankings.get(objectId),
      getFlagType: () => this.raceFlagService.getFlagType(),
      getFlagUrl: (flag) => this.getFlagUrl(flag),
      getFullUrl: (url) => this.getFullUrl(url),
      getImageSetUrl: (hd, prop) => this.getImageUrl(prop, hd),
      laneViewWidgetSettings: laneViewWidget?.customSettings,
      getDriverOverallRanking: (hd) => this.getDriverOverallRanking(hd),
      getDriverGroupRanking: (hd) => this.getDriverGroupRanking(hd),
      isDriverFinished: (hd, scoring) => this.isDriverFinished(hd, scoring),
    };

    const isInset = anchor ? anchor !== "center-center" : false;
    const timeDecimals = isInset
      ? ctx.laneViewWidgetSettings?.insetTimeDecimalPlaces !== undefined
        ? Number(ctx.laneViewWidgetSettings.insetTimeDecimalPlaces)
        : 3
      : ctx.laneViewWidgetSettings?.timeDecimalPlaces !== undefined
        ? Number(ctx.laneViewWidgetSettings.timeDecimalPlaces)
        : 3;

    for (let i = 1; i <= 5; i++) {
      const index = n - 1 - i;
      const val = index >= 0 && laps[index] > 0 ? laps[index] : 0;

      const formattedLapTime = RacedayFormatUtils.formatValue(
        "lastLapTime",
        val,
        heatDriver,
        column,
        ctx,
        anchor,
      );

      const segments: string[] = [];
      if (index >= 0 && lapsDetails[index] && lapsDetails[index].segments) {
        // max 4 segments
        const rawSegments = lapsDetails[index].segments || [];
        const numToDisplay = Math.min(rawSegments.length, 4);
        for (let s = 0; s < numToDisplay; s++) {
          const segVal = rawSegments[s];
          if (segVal > 0) {
            segments.push(segVal.toFixed(timeDecimals));
          } else {
            segments.push("--." + "-".repeat(timeDecimals));
          }
        }
      }

      result.push({ lapTime: formattedLapTime, segments });
    }
    return result;
  }

  // Menu logic
  isMenuOpen = false;
  isFileMenuOpen = false;
  isWindowsMenuOpen = false;
  isOptionsMenuOpen = false;
  scale: number = 1;
  dashboardWidth: number = 1920;
  dashboardHeight: number = 1080;

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isInsideMenu =
      target &&
      typeof target.closest === "function" &&
      (target.closest(".menu-wrapper") || target.closest(".teammate-select"));
    if (!isInsideMenu) {
      this.isMenuOpen = false;
      this.isFileMenuOpen = false;
      this.isDriversStationOpen = false;
      this.isWindowsMenuOpen = false;
      this.isOptionsMenuOpen = false;
    }
  }

  private updateScale() {
    const layout = this.layout;
    const targetWidth = layout?.baseWidth || 1920;
    const targetHeight = layout?.baseHeight || 1080;

    this.scale = 1;

    if (
      this.dashboardWidth !== targetWidth ||
      this.dashboardHeight !== targetHeight
    ) {
      this.dashboardWidth = targetWidth;
      this.dashboardHeight = targetHeight;
      this.loadColumns();
    }

    this.layoutEditorPosition = this.clampLayoutEditorPosition(
      this.layoutEditorPosition,
    );
  }

  private clampLayoutEditorPosition(pos: { x: number; y: number }): {
    x: number;
    y: number;
  } {
    if (this.isUIEditorMode()) {
      // In UI editor mode, we rely on cdkDragBoundary to handle boundaries.
      // updateScale() resets the position on resolution changes.
      return pos;
    }

    let { x, y } = pos;
    const scale = 1; // Always 1 in normal mode
    const toolboxWidth = 260; // Base width from CSS
    const toolboxHeight = 400; // Approximate max height

    // Calculate max X/Y in the local coordinate space of the scaled wrapper
    const maxX = Math.max(
      0,
      (this.dashboardWidth - toolboxWidth * scale) / scale,
    );
    const maxY = Math.max(
      0,
      (this.dashboardHeight - toolboxHeight * scale) / scale,
    );

    if (x > maxX) x = maxX;
    if (x < 0) x = 0;
    if (y > maxY) y = maxY;
    if (y < 0) y = 0;

    return { x, y };
  }

  toggleMenu() {
    this.logger.debug(
      "Toggling Race Director menu. Current state:",
      this.isMenuOpen,
    );
    this.isMenuOpen = !this.isMenuOpen;
    this.isFileMenuOpen = false; // Close other menus
    this.isDriversStationOpen = false;
    this.isWindowsMenuOpen = false;
    this.isOptionsMenuOpen = false;
  }

  toggleFileMenu() {
    this.logger.debug(
      "Toggling File menu. Current state:",
      this.isFileMenuOpen,
    );
    this.isFileMenuOpen = !this.isFileMenuOpen;
    this.isMenuOpen = false; // Close other menus
    this.isDriversStationOpen = false;
    this.isWindowsMenuOpen = false;
    this.isOptionsMenuOpen = false;
  }

  isDriversStationOpen = false;

  toggleDriversStationMenu() {
    this.logger.debug(
      "Toggling Drivers Station menu. Current state:",
      this.isDriversStationOpen,
    );
    this.isDriversStationOpen = !this.isDriversStationOpen;
  }

  toggleWindowsMenu() {
    this.logger.debug(
      "Toggling Windows menu. Current state:",
      this.isWindowsMenuOpen,
    );
    this.isWindowsMenuOpen = !this.isWindowsMenuOpen;
    this.isFileMenuOpen = false;
    this.isMenuOpen = false;
    this.isDriversStationOpen = false;
    this.isOptionsMenuOpen = false;
  }

  toggleOptionsMenu() {
    this.logger.debug(
      "Toggling Options menu. Current state:",
      this.isOptionsMenuOpen,
    );
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
    this.isFileMenuOpen = false;
    this.isMenuOpen = false;
    this.isDriversStationOpen = false;
    this.isWindowsMenuOpen = false;
  }

  onLanguageSelected() {
    this.isFileMenuOpen = false;
    this.isOptionsMenuOpen = false;
    this.cdr.markForCheck();
  }

  onOptionsSelect(action: string) {
    this.logger.debug("Options menu action:", action);
    this.isOptionsMenuOpen = false;
    if (action === "CUSTOMIZE_UI") {
      const returnUrl = this.router.url.split("?")[0];
      this.router.navigate(["/ui-editor"], {
        queryParams: { returnUrl },
      });
    } else if (action === "CUSTOMIZE_LAYOUT") {
      this.toggleLayoutCustomize();
    }
  }

  isAnyMenuDropdownOpen(): boolean {
    return (
      this.isFileMenuOpen ||
      this.isMenuOpen ||
      this.isWindowsMenuOpen ||
      this.isOptionsMenuOpen
    );
  }

  onMenuItemHover(menuName: string) {
    if (this.isAnyMenuDropdownOpen()) {
      if (menuName === "file" && this.isFileMenuOpen) return;
      if (menuName === "race" && this.isMenuOpen) return;
      if (menuName === "windows" && this.isWindowsMenuOpen) return;
      if (menuName === "options" && this.isOptionsMenuOpen) return;

      this.isFileMenuOpen = false;
      this.isMenuOpen = false;
      this.isDriversStationOpen = false;
      this.isWindowsMenuOpen = false;
      this.isOptionsMenuOpen = false;

      if (menuName === "file") {
        this.isFileMenuOpen = true;
      } else if (menuName === "race") {
        this.isMenuOpen = true;
      } else if (menuName === "windows") {
        this.isWindowsMenuOpen = true;
      } else if (menuName === "options") {
        this.isOptionsMenuOpen = true;
      }
      this.cdr.markForCheck();
    }
  }

  onMenuSelect(action: string) {
    // Enforce disabled states
    if (action === "START_RESUME" && this.isStartResumeDisabled) return;
    if (action === "PAUSE" && this.isPauseDisabled) return;
    if (action === "NEXT_HEAT" && this.isNextHeatDisabled) return;
    if (action === "RESTART_HEAT" && this.isRestartHeatDisabled) return;
    if (action === "SKIP_HEAT" && this.isSkipHeatDisabled) return;
    if (action === "DEFER_HEAT" && this.isDeferHeatDisabled) return;
    if (action === "SKIP_RACE" && this.isSkipRaceDisabled) return;
    if (action === "MODIFY" && this.isModifyDisabled) return;
    if (action === "ADD_LAP" && this.isAddLapDisabled) return;

    this.isMenuOpen = false;
    this.logger.debug("Menu Action Selected:", action);
    this.executeMenuAction(action);
    this.isMenuOpen = false;
  }

  private helpLinkService = inject(HelpLinkService);

  openAbout() {
    this.requestAbout.emit();
  }

  openHelpCenter() {
    this.helpLinkService.openHelp("raceday-operation");
  }

  private executeMenuAction(action: string) {
    if (action === "HELP_CENTER") {
      this.openHelpCenter();
      return;
    }
    if (action === "ABOUT") {
      this.openAbout();
      return;
    }
    if (action === "LOGIN") {
      this.showLoginModal = true;
      return;
    }
    if (action === "LOGOUT") {
      this.authService.logout();
      return;
    }
    if (action === "START_RESUME") {
      this.dataService.startRace().subscribe(
        (response) => {
          if (response && response.success) {
            this.logger.debug("Race start command sent successfully");
          } else {
            this.logger.error(
              "Failed to send race start command:",
              response?.message,
            );
            const msg = response?.message || "";
            if (msg.toLowerCase().includes("interface")) {
              this.showInterfaceError(
                "ACK_MODAL_TITLE_DISCONNECTED",
                "ACK_MODAL_MSG_DISCONNECTED",
              );
            } else {
              this.showInterfaceError(
                "ACK_MODAL_TITLE_START_FAILED",
                msg || "ACK_MODAL_MSG_RACE_INACTIVE",
              );
            }
          }
        },
        (error) => {
          this.logger.error("Error starting race:", error);
          if (error?.status === 401 || error?.status === 403) {
            this.showInterfaceError(
              "ACK_MODAL_TITLE_PERMISSION_DENIED",
              "ACK_MODAL_MSG_PERMISSION_DENIED",
            );
          } else if (error?.status === 404) {
            this.raceHasEnded = true;
            this.showInterfaceError(
              "ACK_MODAL_TITLE_RACE_INACTIVE",
              "ACK_MODAL_MSG_RACE_INACTIVE",
            );
          } else {
            this.showInterfaceError(
              "ACK_MODAL_TITLE_START_FAILED",
              error?.error || error?.message || "ACK_MODAL_MSG_DISCONNECTED",
            );
          }
        },
      );
    } else if (action === "PAUSE" || action === "ABORT_TIMERS") {
      this.executePauseOrAbort(action);
    } else if (action === "NEXT_HEAT") {
      this.dataService.nextHeat().subscribe(
        (success) => {
          if (success) {
            this.logger.debug("Next heat command sent successfully");
          } else {
            this.logger.error("Failed to send next heat command");
          }
        },
        (error) => {
          this.logger.error("Error moving to next heat:", error);
        },
      );
    } else if (action === "RESTART_HEAT") {
      this.showRestartHeatConfirmation = true;
      this.cdr.markForCheck();
    } else if (action === "SKIP_HEAT") {
      this.showSkipHeatConfirmation = true;
      this.cdr.markForCheck();
    } else if (action === "SKIP_RACE") {
      this.showSkipRaceConfirmation = true;
      this.cdr.markForCheck();
    } else if (action === "DEFER_HEAT") {
      this.showDeferHeatConfirmation = true;
      this.cdr.markForCheck();
    } else if (action === "MODIFY") {
      const returnUrl = this.router.url.split("?")[0];
      this.router.navigate(["/modify-heats"], { queryParams: { returnUrl } });
    } else if (action === "ADD_LAP") {
      this.selectedHeatDriver = null;
      this.isMenuModeForAddLap = true;
      this.showAddLapSectionsDialog = true;
      this.cdr.markForCheck();
    }
  }

  private executePauseOrAbort(action: string) {
    const effectiveAction =
      action === "PAUSE" &&
      (this.autoStartRemaining > 0 || this.autoAdvanceRemaining > 0)
        ? "ABORT_TIMERS"
        : action;

    const obs =
      effectiveAction === "ABORT_TIMERS"
        ? this.dataService.abortTimers()
        : this.dataService.pauseRace();

    obs.subscribe(
      (success) => {
        if (success) {
          this.logger.debug(`${effectiveAction} command sent successfully`);
          if (effectiveAction === "ABORT_TIMERS") {
            this.autoStartRemaining = 0;
            this.autoAdvanceRemaining = 0;
          }
        } else {
          this.logger.error(`Failed to send ${effectiveAction} command`);
        }
      },
      (error) => {
        this.logger.error(`Error processing ${effectiveAction}:`, error);
      },
    );
  }

  onWindowsMenuSelect(action: string) {
    this.logger.debug("Windows menu action:", action);
    this.isWindowsMenuOpen = false;
    if (action === "HEAT_RESULTS") {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/heat-results"]),
      );
      this.childWindowManagerService.openWindow(action, url);
    } else if (action === "RACE_RESULTS") {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/race-results"]),
      );
      this.childWindowManagerService.openWindow(action, url);
    } else if (action === "SEASON_RESULTS") {
      const seasonId =
        (this.race as any)?.season_id || (this.race as any)?.seasonId || "";
      const queryParams = seasonId ? { id: seasonId } : {};
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/season-results"], { queryParams }),
      );
      this.childWindowManagerService.openWindow(action, url);
    } else if (action === "PREDICTION_RESULTS") {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/prediction-results"]),
      );
      this.childWindowManagerService.openWindow(action, url);
    } else if (action === "DISPLAY_CLIENT") {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/display-client"]),
      );
      window.open(url, "_blank");
    } else if (action.startsWith("THEME:")) {
      const themeId = action.substring("THEME:".length);
      this.onThemeMenuSelect(themeId);
    }
  }

  onThemeMenuSelect(themeId: string) {
    this.logger.debug("Opening theme window for themeId:", themeId);
    const url = this.router.serializeUrl(
      this.router.createUrlTree(["/default-raceday"], {
        queryParams: { themeId },
      }),
    );
    this.childWindowManagerService.openThemeWindow(url);
  }

  @HostListener("window:beforeunload", ["$event"])
  onBeforeUnload($event: any) {
    if (this.authService.currentRole !== Role.VIEWER && !this.raceHasEnded) {
      $event.preventDefault();
      $event.returnValue = true;
    }
  }

  @HostListener("window:pagehide", ["$event"])
  onPageHide(_event: any) {
    this.raceConnectionService.disconnect();
    this.childWindowManagerService.closeAllWindows();
  }

  // Layout Editing - Column and Anchor Handlers

  onColumnDrop(event: CdkDragDrop<string[]>) {
    if (!this.isUIEditorMode()) return;
    const settings = this.editingSettings();
    if (!settings || !this.currentRacedayColumns) return;

    const cols = [...this.currentRacedayColumns];
    moveItemInArray(cols, event.previousIndex, event.currentIndex);
    this.currentRacedayColumns = cols;
    this.loadColumns();
    this.cdr.markForCheck();
    this.columnsChanged.emit();
  }

  onColumnDragOver(event: DragEvent) {
    if (!this.isUIEditorMode() || this.draggedWidgetType) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    (event.currentTarget as HTMLElement).classList.add("drag-over");
  }

  onColumnDragLeave(event: DragEvent) {
    if (!this.isUIEditorMode() || this.draggedWidgetType) return;
    (event.currentTarget as HTMLElement).classList.remove("drag-over");
  }

  onColumnHeaderDrop(event: DragEvent, dropColData: ColumnDefinition) {
    if (!this.isUIEditorMode() || this.draggedWidgetType) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove("drag-over");

    if (event.dataTransfer) {
      try {
        const dataStr = event.dataTransfer.getData("application/json");
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data.type === "new-column" && data.key) {
            const settings = this.editingSettings();
            if (!settings) return;
            let changed = false;

            const cols = [...this.currentRacedayColumns];
            const idx = cols.indexOf(dropColData.propertyName);
            if (!cols.includes(data.key)) {
              if (idx >= 0) {
                cols.splice(idx, 0, data.key);
              } else {
                cols.push(data.key);
              }
              changed = true;
            }

            if (changed) {
              this.currentRacedayColumns = cols;
              this.loadColumns();
              this.cdr.markForCheck();
              this.columnsChanged.emit();
            }
          }
        }
      } catch (e) {}
    }
  }

  onColumnHeaderRowDrop(event: DragEvent) {
    if (!this.isUIEditorMode() || this.draggedWidgetType) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove("drag-over");

    if (event.dataTransfer) {
      try {
        const dataStr = event.dataTransfer.getData("application/json");
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data.type === "new-column" && data.key) {
            const settings = this.editingSettings();
            if (!settings) return;
            let changed = false;

            const cols = [...this.currentRacedayColumns];
            if (!cols.includes(data.key)) {
              cols.push(data.key);
              changed = true;
            }

            if (changed) {
              this.currentRacedayColumns = cols;
              this.loadColumns();
              this.cdr.markForCheck();
              this.columnsChanged.emit();
            }
          }
        }
      } catch (e) {}
    }
  }

  deleteColumn(colData: ColumnDefinition) {
    if (!this.isUIEditorMode()) return;
    const settings = this.editingSettings();
    if (!settings) return;

    this.currentRacedayColumns = this.currentRacedayColumns.filter(
      (c) => c !== colData.propertyName,
    );
    if (this.currentColumnWidths) {
      delete this.currentColumnWidths[colData.propertyName];
    }
    this.loadColumns();
    this.cdr.markForCheck();
    this.columnsChanged.emit();
  }

  onAnchorDragOver(event: DragEvent) {
    if (!this.isUIEditorMode() || this.draggedWidgetType) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }

  onAnchorDragEnter(event: DragEvent) {
    if (!this.isUIEditorMode() || this.draggedWidgetType) return;
    event.preventDefault();
    (event.target as HTMLElement).classList.add("drag-over");
  }

  onAnchorDragLeave(event: DragEvent) {
    if (!this.isUIEditorMode() || this.draggedWidgetType) return;
    (event.target as HTMLElement).classList.remove("drag-over");
  }

  onAnchorDrop(event: DragEvent, colData: ColumnDefinition, anchor: string) {
    if (!this.isUIEditorMode() || this.draggedWidgetType) return;
    event.preventDefault();
    (event.target as HTMLElement).classList.remove("drag-over");

    if (event.dataTransfer) {
      try {
        const dataStr = event.dataTransfer.getData("application/json");
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data.type === "new-column" && data.key) {
            const settings = this.editingSettings();
            if (!settings) return;
            const layouts = { ...(this.currentColumnLayouts || {}) };
            if (!layouts[colData.propertyName]) {
              layouts[colData.propertyName] = {
                "center-center": colData.propertyName,
              };
            } else {
              layouts[colData.propertyName] = {
                ...layouts[colData.propertyName],
              };
            }
            layouts[colData.propertyName][anchor as AnchorPoint] = data.key;
            this.currentColumnLayouts = layouts;
            this.loadColumns();
            this.cdr.markForCheck();
            this.columnsChanged.emit();
          }
        }
      } catch (e) {}
    }
  }

  deleteAnchor(colData: ColumnDefinition, anchor: string, event: Event) {
    if (!this.isUIEditorMode()) return;
    event.stopPropagation();
    const settings = this.editingSettings();
    if (!settings) return;
    const layouts = { ...(this.currentColumnLayouts || {}) };
    if (layouts[colData.propertyName]) {
      layouts[colData.propertyName] = { ...layouts[colData.propertyName] };
      delete layouts[colData.propertyName][anchor as AnchorPoint];
      this.currentColumnLayouts = layouts;
    }
    this.loadColumns();
    this.cdr.markForCheck();
    this.columnsChanged.emit();
  }

  hasAnchorValue(colData: ColumnDefinition, anchor: string): boolean {
    const settings = this.editingSettings();
    if (
      !settings ||
      !this.currentColumnLayouts ||
      !this.currentColumnLayouts[colData.propertyName]
    ) {
      return anchor === "center-center";
    }
    return !!this.currentColumnLayouts[colData.propertyName][
      anchor as AnchorPoint
    ];
  }

  onFileMenuSelect(action: string) {
    this.logger.debug("File menu action:", action);
    // Assuming 'activeMenu' is a property that controls which menu is open.
    // If not defined, it might need to be added to the class properties.
    // For now, we'll assume it exists or is intended to be added.
    // The original `this.isFileMenuOpen = false;` is removed as per the instruction's snippet.
    this.activeMenu = null;
    this.isFileMenuOpen = false;
    if (action === "EXPORT_CSV") {
      this.exportToCsv();
    } else if (action === "EXPORT_XLS") {
      this.exportToXls();
    } else if (action === "EXPORT_PDF") {
      this.exportToPdf();
    } else if (action === "CUSTOMIZE_UI") {
      const returnUrl = this.router.url.split("?")[0];
      this.router.navigate(["/ui-editor"], {
        queryParams: { returnUrl },
      });
    } else if (action === "SAVE") {
      this.saveRace();
    }
  }

  saveRace() {
    if (this.isSaveDisabled) return;
    this.saveRaceName = this.race?.name || "";
    this.showSaveRaceDialog = true;
    this.cdr.markForCheck();
  }

  onSaveRaceConfirm(name: string) {
    this.showSaveRaceDialog = false;
    const trimmed = typeof name === "string" ? name.trim() : "";
    this.dataService.saveRace(trimmed || undefined).subscribe({
      next: (response) => {
        this.ackModalTitle =
          this.translationService.translate("RD_SAVE_SUCCESS");
        this.ackModalMessage = response;
        this.showAckModal = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.ackModalTitle = this.translationService.translate("RD_SAVE_ERROR");
        this.ackModalMessage = err.error || err.message;
        this.showAckModal = true;
        this.cdr.markForCheck();
      },
    });
  }

  onSaveRaceCancel() {
    this.showSaveRaceDialog = false;
    this.cdr.markForCheck();
  }

  resetLane(lane: number, event: Event) {
    event.stopPropagation();
    this.dataService.resetLaneHeatData(lane).subscribe({
      next: () => {
        this.logger.debug(`Reset lane ${lane}`);
      },
      error: (err) => {
        this.logger.error(`Error resetting lane ${lane}:`, err);
        this.ackModalTitle = "RD_ERR_RESET_LANE_TITLE";
        this.ackModalMessage = err.error || "RD_ERR_RESET_LANE_MESSAGE";
        this.showAckModal = true;
      },
    });
  }

  resetAllLanes(event: Event) {
    event.stopPropagation();
    this.dataService.resetLaneHeatData("all").subscribe({
      next: () => {
        this.logger.debug(`Reset all lanes`);
      },
      error: (err) => {
        this.logger.error(`Error resetting all lanes:`, err);
        this.ackModalTitle = "RD_ERR_RESET_ALL_TITLE";
        this.ackModalMessage = err.error || "RD_ERR_RESET_ALL_MESSAGE";
        this.showAckModal = true;
      },
    });
  }

  getExportTimestamp(): Date {
    if (this.viewerRaceEndedHandler?.raceHasEnded) {
      const stats = (this.race as any)?.statistics;
      if (stats?.endTime) {
        return new Date(stats.endTime);
      }
    }
    return new Date();
  }

  exportToPdf() {
    this.defaultIncludeBackground =
      this.settingsService.getSettings()?.exportPdfBackgrounds ?? true;
    this.showPdfExportDialog = true;
    this.cdr.detectChanges();
  }

  onPdfExportConfirm(options: PdfExportOptions): void {
    this.showPdfExportDialog = false;
    this.cdr.detectChanges();
    if (options.saveAsDefault) {
      const settings = this.settingsService.getSettings();
      settings.exportPdfBackgrounds = options.includeBackground;
      this.settingsService.saveSettings(settings);
    }
    const timestamp = this.getExportTimestamp();
    const raceName = this.race?.name || "Race";
    this.printService.print(
      `${raceName}-RaceDay`,
      false,
      timestamp,
      options.includeBackground,
    );
  }

  onPdfExportCancel(): void {
    this.showPdfExportDialog = false;
    this.cdr.detectChanges();
  }

  async exportToCsv() {
    try {
      const csvData = await firstValueFrom(this.dataService.exportRaceToCsv());
      if (!csvData || csvData.trim().length === 0) {
        this.logger.error("Failed to export CSV: received empty data");
        return;
      }

      const timestamp = this.getExportTimestamp();
      const timeStr = this.printService.formatExportTimestamp(timestamp);
      const raceName = this.race?.name || "Race";
      const suggestedName = `${raceName}-RaceDay${timeStr}.csv`;

      if (typeof (window as any).showSaveFilePicker === "function") {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: suggestedName,
            types: [
              {
                description: "CSV Files",
                accept: { "text/csv": [".csv"] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(csvData);
          await writable.close();
          this.logger.debug("CSV Exported successfully");
          return;
        } catch (pickerErr: any) {
          if (pickerErr.name === "AbortError") {
            this.logger.debug("User cancelled save");
            return;
          }
          this.logger.warn(
            "File picker failed, falling back to blob download",
            pickerErr,
          );
        }
      }

      // Fallback blob download
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.logger.debug("CSV Exported via fallback download");
    } catch (err: any) {
      this.logger.error("Failed to export CSV", err);
    }
  }

  async exportToXls() {
    try {
      const template =
        this.settingsService.getSettings()?.customExportTemplateBase64;
      const xlsData: Blob = await firstValueFrom(
        this.dataService.exportRaceToXls(template),
      );

      if (!xlsData || xlsData.size === 0) {
        this.logger.error("Failed to export XLS: received empty blob");
        return;
      }

      const timestamp = this.getExportTimestamp();
      const timeStr = this.printService.formatExportTimestamp(timestamp);
      const raceName = this.race?.name || "Race";
      const suggestedName = `${raceName}-RaceDay${timeStr}.xlsx`;

      if (typeof (window as any).showSaveFilePicker === "function") {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: suggestedName,
            types: [
              {
                description: "Excel Files",
                accept: {
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(xlsData);
          await writable.close();
          this.logger.debug("XLS Exported successfully");
          return;
        } catch (pickerErr: any) {
          if (pickerErr.name === "AbortError") {
            this.logger.debug("User cancelled save");
            return;
          }
          this.logger.warn(
            "File picker failed, falling back to blob download",
            pickerErr,
          );
        }
      }

      // Fallback blob download
      const url = window.URL.createObjectURL(xlsData);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.logger.debug("XLS Exported via fallback download");
    } catch (err: any) {
      if (err?.error instanceof Blob) {
        try {
          const text = await err.error.text();
          this.logger.error("Failed to export XLS:", text, err);
        } catch (_) {
          this.logger.error("Failed to export XLS", err);
        }
      } else {
        this.logger.error("Failed to export XLS", err);
      }
    }
  }

  onLaneMenuSelect(laneIndex: number) {
    this.logger.debug("Lane selected for Driver Station:", laneIndex);
    this.isWindowsMenuOpen = false; // Close menu
    this.isDriversStationOpen = false;

    const returnUrl = this.router.url.split("?")[0];
    this.router.navigate(["/driver-station", laneIndex + 1], {
      queryParams: { returnUrl },
    });
  }

  onDriverViewMenuSelect(driverId: string) {
    this.logger.debug("Driver selected for Driver View:", driverId);
    this.isWindowsMenuOpen = false; // Close menu

    const returnUrl = this.router.url.split("?")[0];
    this.router.navigate(["/driver-view", driverId], {
      state: { bypassDeactivate: true },
      queryParams: { returnUrl },
    });
  }

  @HostListener("window:keyup", ["$event"])
  handleKeyUpEvent(event: KeyboardEvent) {
    if (event.code === "Space") {
      // Don't trigger if typing in an input field
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      const s = this.raceState;
      const RS = RaceState;

      // If an auto-timer is active, space bar should pause/cancel it
      if (this.autoStartRemaining > 0 || this.autoAdvanceRemaining > 0) {
        if (!this.isPauseDisabled) {
          this.onMenuSelect("ABORT_TIMERS");
          return;
        }
      }

      if (s === RS.HEAT_OVER || s === RS.RACE_OVER) {
        if (!this.isNextHeatDisabled) {
          this.onMenuSelect("NEXT_HEAT");
        }
      } else if (
        s === RS.NOT_STARTED ||
        s === RS.PAUSED ||
        s === RS.UNKNOWN_STATE
      ) {
        if (!this.isStartResumeDisabled) {
          this.onMenuSelect("START_RESUME");
        }
      } else {
        if (!this.isPauseDisabled) {
          this.onMenuSelect("PAUSE");
        }
      }
    }
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.checkWidgetShortcuts(event)) {
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const inInputField =
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA");

    // Space bar
    if (event.code === "Space") {
      // Don't trigger if typing in an input field
      if (inInputField) {
        return;
      }

      event.preventDefault(); // Prevent page scroll
      return;
    }

    // Track Power Shortcuts (Alt + [0-9] for ON, Alt + Shift + [0-9] for OFF)
    if (
      !inInputField &&
      !isCtrlOrCmd &&
      event.altKey &&
      event.code.startsWith("Digit")
    ) {
      const digit = parseInt(event.code.replace("Digit", ""), 10);
      const isOn = !event.shiftKey;

      // Viewers cannot change track power
      if (this.authService.currentRole !== Role.VIEWER) {
        if (digit === 0) {
          event.preventDefault();
          this.onTrackPowerMainSelect(isOn);
          return;
        } else if (
          this.track &&
          this.track.lanes &&
          digit <= this.track.lanes.length
        ) {
          event.preventDefault();
          this.onTrackPowerLaneSelect({ lane: digit, on: isOn });
          return;
        }
      }
    }

    // Ctrl+S or Cmd+S for Start/Resume
    if (isCtrlOrCmd && event.key === "s") {
      event.preventDefault(); // Prevent browser save dialog
      this.onMenuSelect("START_RESUME");
    }

    // Ctrl+P or Cmd+P for Pause
    if (isCtrlOrCmd && event.key === "p") {
      event.preventDefault(); // Prevent print dialog
      this.onMenuSelect("PAUSE");
    }

    // Ctrl+N or Cmd+N for Next Heat
    if (isCtrlOrCmd && event.key === "n") {
      event.preventDefault(); // Prevent new window
      this.onMenuSelect("NEXT_HEAT");
    }

    // Ctrl+R or Cmd+R for Restart Heat
    if (isCtrlOrCmd && event.key === "r") {
      event.preventDefault(); // Prevent refresh
      this.onMenuSelect("RESTART_HEAT");
    }

    // Cmd+F5 or Alt+F5 for Skip Heat
    const isSkipHeatKey =
      (isCtrlOrCmd && event.key === "F5") ||
      (event.altKey && event.key === "F5");
    if (isSkipHeatKey) {
      event.preventDefault();
      this.onMenuSelect("SKIP_HEAT");
    }

    // Cmd+F6 or Alt+F6 for Defer Heat
    const isDeferHeatKey =
      (isCtrlOrCmd && event.key === "F6") ||
      (event.altKey && event.key === "F6");
    if (isDeferHeatKey) {
      event.preventDefault();
      this.onMenuSelect("DEFER_HEAT");
    }

    // Ctrl+Alt+F1-F4 for Reset Lanes 1-4 (practice mode only)
    if (isCtrlOrCmd && event.altKey && event.key.startsWith("F")) {
      const fKey = parseInt(event.key.replace("F", ""), 10);
      if (fKey >= 1 && fKey <= 4 && this.race?.practice) {
        event.preventDefault();
        this.resetLane(fKey - 1, event);
        return;
      }
    }

    // Ctrl+Alt+F12 for Reset All Lanes (practice mode only)
    if (
      isCtrlOrCmd &&
      event.altKey &&
      event.key === "F12" &&
      this.race?.practice
    ) {
      event.preventDefault();
      this.resetAllLanes(event);
      return;
    }
  }

  private checkWidgetShortcuts(event: KeyboardEvent): boolean {
    const inInputField =
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA");
    if (inInputField) return false;

    const widgets = this.layout?.widgets || [];
    for (const widget of widgets) {
      if (
        widget.widgetType.startsWith("action-") &&
        widget.customSettings?.["shortcut"]
      ) {
        if (this.matchShortcut(event, widget.customSettings["shortcut"])) {
          this.executeWidgetAction(widget.widgetType);
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }
    }
    return false;
  }

  private matchShortcut(event: KeyboardEvent, shortcutStr: string): boolean {
    if (!shortcutStr) return false;
    const parts = shortcutStr
      .toLowerCase()
      .split("+")
      .map((p) => p.trim());
    const needsCtrl =
      parts.includes("ctrl") ||
      parts.includes("control") ||
      parts.includes("cmd");
    const needsAlt = parts.includes("alt");
    const needsShift = parts.includes("shift");

    const key = parts[parts.length - 1]; // The actual key is usually the last part
    const eventKey = event.key.toLowerCase();
    const eventCode = event.code.toLowerCase();

    // Check modifiers
    if (needsCtrl !== (event.ctrlKey || event.metaKey)) return false;
    if (needsAlt !== event.altKey) return false;
    if (needsShift !== event.shiftKey) return false;

    // Check key
    return (
      key === eventKey ||
      key === eventCode ||
      key === eventCode.replace("key", "")
    );
  }

  private executeWidgetAction(widgetType: string) {
    switch (widgetType) {
      case "action-start-resume":
        if (!this.isStartResumeDisabled) this.onMenuSelect("START_RESUME");
        break;
      case "action-pause":
        if (!this.isPauseDisabled) this.onMenuSelect("PAUSE");
        break;
      case "action-next-heat":
        if (!this.isNextHeatDisabled) this.onMenuSelect("NEXT_HEAT");
        break;
      case "action-restart-heat":
        if (!this.isRestartHeatDisabled) this.onMenuSelect("RESTART_HEAT");
        break;
      case "action-defer-heat":
        if (!this.isDeferHeatDisabled) this.onMenuSelect("DEFER_HEAT");
        break;
      case "action-skip-heat":
        if (!this.isSkipHeatDisabled) this.onMenuSelect("SKIP_HEAT");
        break;
      case "action-skip-race":
        if (!this.isSkipRaceDisabled) this.onMenuSelect("SKIP_RACE");
        break;
      case "action-add-lap":
        if (!this.isAddLapDisabled) this.onMenuSelect("ADD_LAP");
        break;
      case "action-modify-heats":
        if (!this.isModifyDisabled) this.onMenuSelect("MODIFY");
        break;
      case "action-export-pdf":
        this.onFileMenuSelect("EXPORT_PDF");
        break;
      case "action-export-csv":
        this.onFileMenuSelect("EXPORT_CSV");
        break;
      case "action-export-xls":
        this.onFileMenuSelect("EXPORT_XLS");
        break;
      case "action-open-heat-results":
        this.onWindowsMenuSelect("HEAT_RESULTS");
        break;
      case "action-open-race-results":
        this.onWindowsMenuSelect("RACE_RESULTS");
        break;
      case "action-open-season-results":
        this.onWindowsMenuSelect("SEASON_RESULTS");
        break;
      case "action-open-prediction-results":
        this.onWindowsMenuSelect("PREDICTION_RESULTS");
        break;
      case "action-master-power-on":
        if (!this.isMainPowerDisabled) this.onTrackPowerMainSelect(true);
        break;
      case "action-master-power-off":
        if (!this.isMainPowerDisabled) this.onTrackPowerMainSelect(false);
        break;
    }
  }

  public get isSaveDisabled(): boolean {
    return (
      this.authService.currentRole === Role.VIEWER ||
      this.raceState === RaceState.RACING
    );
  }

  // Menu State Helpers

  public onTrackPowerMainSelect(on: boolean) {
    this.dataService.setMainPower(on).subscribe({
      error: (err) => this.logger.error("Error setting main power", err),
    });
  }

  public onTrackPowerLaneSelect(event: { lane: number; on: boolean }) {
    this.dataService.setLanePower(event.lane, event.on).subscribe({
      error: (err) => this.logger.error("Error setting lane power", err),
    });
  }

  public get isMainPowerDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = this.dataService.getSystemStateValue();
    const hasRelay = s ? !!s.hasMainRelay || !!s.hasPerLaneRelays : false;
    return !hasRelay;
  }

  public get isStartResumeDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    // Disabled if disconnected OR (Starting, Racing, HeatOver, RaceOver)
    // Note: User said "Starting: Start/Resume ... disabled", "Racing: Same as Starting", "Heat Over: Everything ... disabled"
    // Also technically disabled in PAUSED? No, Resume is allowed in Paused.
    // NOT_STARTED: Enabled.
    const s = this.raceState;
    return (
      (!this.isInterfaceConnected &&
        s !== RaceState.NOT_STARTED &&
        s !== RaceState.UNKNOWN_STATE) ||
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.HEAT_OVER ||
      s === RaceState.RACE_OVER
    );
  }

  public get isPauseDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    // Disabled if disconnected OR (NotStarted, Paused, HeatOver, RaceOver)
    // Enabled in STARTING? User didn't say disabled. Usually can pause countdown.
    // Enabled in RACING.
    const s = this.raceState; // Shortcut
    const RS = RaceState;

    const isAutoTimerActive =
      this.autoStartRemaining > 0 || this.autoAdvanceRemaining > 0;

    // Allow pause if an auto-timer is active, regardless of connection status
    if (isAutoTimerActive) {
      return false;
    }

    return (
      !this.isInterfaceConnected ||
      s === RS.NOT_STARTED ||
      s === RS.PAUSED ||
      s === RS.HEAT_OVER ||
      s === RS.RACE_OVER
    );
  }

  public get isNextHeatDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const isEventWithNextRace =
      !!(this.race as any)?.is_event &&
      ((this.race as any)?.current_event_race_index ?? 0) + 1 <
        ((this.race as any)?.total_event_races ?? 0);

    return (
      this.raceState !== RaceState.HEAT_OVER &&
      !(this.raceState === RaceState.RACE_OVER && isEventWithNextRace)
    );
  }

  isDriverFinished(
    hd: DriverHeatData,
    _scoring?: HeatScoring | null | undefined,
  ): boolean {
    if (!hd) return false;
    return !!hd.isFinished;
  }

  public getFlagUrl(flag: any): string {
    return this.raceFlagService.getFlagUrl(flag);
  }

  getCurrentFlagUrl(): string {
    return this.raceFlagService.getFlagUrl(this.raceFlagService.getFlagType());
  }

  getFullUrl(url: string | undefined): string {
    if (!url) return "";

    // Explicitly allow full URLs and data URIs
    if (url.startsWith("http") || url.startsWith("data:")) {
      return url;
    }

    const serverUrl = this.dataService.serverUrl;
    if (!serverUrl || serverUrl.includes("undefined")) return url;

    // In local development, the Java backend (port 7070) serves dynamic assets under /assets/
    // (e.g. uploaded images, generated assets like fuel gauges).
    // Static frontend assets might reside in assets/, but the DB assets are usually prefixed with /assets/
    // We want to prepend the backend serverUrl so the Angular Dev Server doesn't 404 them.
    const base = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
    const path = url.startsWith("/") ? url : "/" + url;

    return base + path;
  }

  public get isRestartHeatDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    // Disabled in Starting, Racing.
    // "Heat Over: Everything... disabled".
    const s = this.raceState;
    return (
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.NOT_STARTED ||
      s === RaceState.HEAT_OVER ||
      s === RaceState.RACE_OVER
    );
  }

  public get isDeferHeatDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = this.raceState;
    if (s !== RaceState.NOT_STARTED && s !== RaceState.UNKNOWN_STATE) {
      return true;
    }
    return this.totalHeats <= 1;
  }

  public get isSkipHeatDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = this.raceState;
    return (
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.HEAT_OVER ||
      s === RaceState.RACE_OVER
    );
  }

  public get isSkipRaceDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = this.raceState;
    return (
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.RACE_OVER
    );
  }

  public get isAddLapDisabled(): boolean {
    return this.authService.currentRole === Role.VIEWER;
  }

  public get isModifyDisabled(): boolean {
    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }
    return this.raceState === RaceState.RACE_OVER;
  }

  private loadColumns() {
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    let selectedColumns = this.currentRacedayColumns;
    if (!selectedColumns || selectedColumns.length === 0) {
      selectedColumns = Settings.DEFAULT_COLUMNS;
    }

    const { calculatedWidths, zeroWidthColumnKeys } = this.resolveColumnLayout(
      selectedColumns,
      settings,
    );

    this.columns = selectedColumns.map((key) => {
      const layout = (this.currentColumnLayouts || {})[key] || {
        [AnchorPoint.CenterCenter]: key,
      };
      const primaryProp =
        layout[AnchorPoint.CenterCenter] || Object.values(layout)[0] || key;

      const labelKey = this.getLabelKeyForColumn(key, layout);
      const isResizing = zeroWidthColumnKeys.has(key);
      const width = calculatedWidths[key] ?? 275;
      const anchor = this.currentColumnAnchors[key] || AnchorPoint.CenterCenter;

      const renderer = (
        v: any,
        hd: DriverHeatData,
        col: ColumnDefinition,
        anchor?: string,
      ) => {
        return this.formatValue(primaryProp, v, hd, col, anchor);
      };

      if (key.startsWith("imageset_")) {
        const assetId = key.replace("imageset_", "");
        const asset = this.findAssetById(assetId);
        const imageRenderer = (
          v: any,
          hd: DriverHeatData,
          _col: ColumnDefinition,
        ) => {
          return this.getSelectedImageFromSet(asset, v, hd);
        };
        return new ColumnDefinition(
          "",
          key,
          width,
          isResizing,
          "middle",
          0,
          anchor,
          imageRenderer as any,
          layout,
        );
      }

      const finalLayout = this.reindexColumnLayout(layout);
      if (isResizing) {
        return new ColumnDefinition(
          labelKey,
          key,
          width,
          true,
          "start",
          30,
          anchor,
          renderer as any,
          finalLayout,
        );
      }
      return new ColumnDefinition(
        labelKey,
        key,
        width,
        false,
        "middle",
        0,
        anchor,
        renderer as any,
        finalLayout,
      );
    });
  }

  private resolveColumnLayout(
    selectedColumns: string[],
    _settings: any,
  ): {
    calculatedWidths: { [key: string]: number };
    zeroWidthColumnKeys: Set<string>;
  } {
    const configuredWidths: { [key: string]: number } = {};
    const zeroWidthColumnKeys = new Set<string>();
    let totalFixed = 0;

    const laneViewWidget = this.currentRacedayLayout?.widgets?.find(
      (w: any) => w.widgetType === "lane-view",
    );
    const isVertical = laneViewWidget?.customSettings?.["isVertical"] ?? false;
    const widgetWidths = laneViewWidget?.customSettings?.["columnWidths"] || {};
    const currentWidths = this.currentColumnWidths || {};

    selectedColumns.forEach((key) => {
      const layout = (this.currentColumnLayouts || {})[key] || {
        [AnchorPoint.CenterCenter]: key,
      };
      let width: number | undefined = undefined;
      if (widgetWidths[key] !== undefined && widgetWidths[key] !== null) {
        width = Number(widgetWidths[key]);
      } else if (
        currentWidths[key] !== undefined &&
        currentWidths[key] !== null
      ) {
        width = Number(currentWidths[key]);
      } else {
        width = RacedayLayoutUtils.getDefaultColumnWidth(key, layout, {
          isPractice: this.isPracticeLayout,
          isVertical,
        });
      }

      configuredWidths[key] = width;
      if (width === 0) {
        zeroWidthColumnKeys.add(key);
      } else {
        totalFixed += width;
      }
    });

    const totalGapsWidth = Math.max(0, selectedColumns.length - 1) * 20;
    const totalRemaining = Math.max(
      0,
      this.dashboardWidth - totalFixed - totalGapsWidth,
    );

    const calculatedWidths: { [key: string]: number } = {};
    const zeroCount = zeroWidthColumnKeys.size;
    const sharedWidth =
      zeroCount > 0 ? Math.max(50, Math.floor(totalRemaining / zeroCount)) : 0;

    selectedColumns.forEach((key) => {
      if (zeroWidthColumnKeys.has(key)) {
        calculatedWidths[key] = sharedWidth;
      } else {
        calculatedWidths[key] = configuredWidths[key];
      }
    });

    return { calculatedWidths, zeroWidthColumnKeys };
  }

  private reindexColumnLayout(layout: { [A in AnchorPoint]?: string }): {
    [A in AnchorPoint]?: string;
  } {
    return RacedayLayoutUtils.reindexColumnLayout(layout);
  }

  // Helper method to get the selected image URL from an image set based on value or fuel percentage
  private getSelectedImageFromSet(
    asset: any,
    value: any,
    hd: DriverHeatData,
  ): string {
    if (
      !asset ||
      asset.type !== "image_set" ||
      !asset.images ||
      asset.images.length === 0
    ) {
      return "";
    }

    // If value is a string that explicitly points to an image in the set by name
    if (typeof value === "string") {
      const match = asset.images.find(
        (img: any) => img.name === value || img.url?.includes(value),
      );
      if (match) return this.getFullUrl(match.url || "");
    }

    // Calculate fuel percentage if value is not provided or is a number
    const level = hd.participant?.fuelLevel ?? (hd.driver as any)?.fuelLevel;
    const race = this.raceService.getRace();
    const capacity =
      (typeof this.track?.hasDigitalFuel === "function" &&
      this.track?.hasDigitalFuel()
        ? race?.digital_fuel_options?.capacity
        : race?.fuel_options?.capacity) || 100;

    let fuelPercentage = 0;
    if (typeof value === "number") {
      fuelPercentage = value;
    } else if (level !== undefined && capacity !== undefined && capacity > 0) {
      fuelPercentage = (level / capacity) * 100;
    } else {
      return "";
    }

    // Special case: 0 percent should only be used if it is exactly 0
    if (fuelPercentage === 0) {
      const zeroImage = asset.images.find((img: any) => img.percentage === 0);
      if (zeroImage) return this.getFullUrl(zeroImage.url || "");
    }

    // Filter out 0 from candidates for non-zero percentages
    const candidates = asset.images.filter(
      (img: any) => (img.percentage || 0) !== 0,
    );

    if (candidates.length === 0) {
      // TODO(aufderheide): At very least log this, I suspect selecting the 0th
      // image is about the worst thing we could do.

      // Fallback to any image if no non-zero ones exist
      return this.getFullUrl(asset?.images?.[0]?.url || "");
    }

    // Find the image with percentage closest to current fuelPercentage
    let bestMatch = candidates[0];
    let minDiff = Math.abs((bestMatch.percentage || 0) - fuelPercentage);

    for (const img of candidates) {
      const diff = Math.abs((img.percentage || 0) - fuelPercentage);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = img;
      }
    }
    return this.getFullUrl(bestMatch.url || "");
  }

  private findAssetById(assetId: string): any {
    // If we're looking for the builtin fuel gauge, try to resolve it via theme or settings first
    if (assetId === "fuel-gauge-builtin") {
      const themeAssetId =
        this.themeService.resolveAssetId("gauge.fuel") ||
        this.themeService.resolveAssetId("fuel_gauge");

      const settings = this.settingsService.getSettings();
      const resolvedId = themeAssetId || settings.fuelGaugeImageSet;

      if (resolvedId && resolvedId !== "default_fuel-gauge-builtin") {
        const resolvedAsset = (this.assets || []).find(
          (a) =>
            a.model?.entityId === resolvedId ||
            a.entity_id === resolvedId ||
            a._id === resolvedId,
        );
        if (resolvedAsset) return resolvedAsset;
      }
    }

    let asset = (this.assets || []).find(
      (a) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId,
    );

    // Robustness: fallback for builtin fuel gauge if ID doesn't match
    if (!asset && assetId === "fuel-gauge-builtin") {
      asset = (this.assets || []).find(
        (a) => a.type === "image_set" && a.name === "Fuel Gauge",
      );
    }

    return asset;
  }

  private getImageUrl(propertyName: string, hd: DriverHeatData): string {
    const baseKey = propertyName.split("_")[0];
    if (baseKey === "fuel-gauge-builtin") {
      const asset = this.findAssetById("fuel-gauge-builtin");
      const value = RacedayFormatUtils.getPropertyValue(hd, propertyName);
      return this.getSelectedImageFromSet(asset, value, hd);
    }
    if (baseKey.startsWith("imageset")) {
      const assetId = propertyName.replace("imageset_", "");
      const asset = this.findAssetById(assetId);
      const value = RacedayFormatUtils.getPropertyValue(hd, propertyName);
      return this.getSelectedImageFromSet(asset, value, hd);
    }
    return "";
  }

  isEmptyDriver(hd: DriverHeatData | any): boolean {
    return RacedayFormatUtils.isEmptyDriver(hd);
  }

  formatValue(
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column?: ColumnDefinition,
    anchor?: string,
  ): string {
    const laneViewWidget = this.currentRacedayLayout?.widgets?.find(
      (w: any) => w.widgetType === "lane-view",
    );
    const ctx: FormatContext = {
      translate: (key) => this.translationService.translate(key),
      getRace: () => this.raceService.getRace(),
      getTrack: () => this.track,
      getDriverRanking: (objectId) => this.driverRankings.get(objectId),
      getFlagType: () => this.raceFlagService.getFlagType(),
      getFlagUrl: (flag) => this.getFlagUrl(flag),
      getFullUrl: (url) => this.getFullUrl(url),
      getImageSetUrl: (hd, prop) => this.getImageUrl(prop, hd),
      laneViewWidgetSettings: laneViewWidget?.customSettings,
      getDriverOverallRanking: (hd) => this.getDriverOverallRanking(hd),
      getDriverGroupRanking: (hd) => this.getDriverGroupRanking(hd),
      getLaneQrCodeUrl: (laneIndex) => this.getLaneQrCodeUrl(laneIndex),
      getDriverViewQrCodeUrl: (hd) => this.getDriverViewQrCodeUrl(hd),
      isDriverFinished: (hd, scoring) => this.isDriverFinished(hd, scoring),
      getLaneRecordEntry: (laneIndex) => this.getLaneRecordEntry(laneIndex),
    };
    return RacedayFormatUtils.formatValue(
      propertyName,
      value,
      hd,
      column,
      ctx,
      anchor,
    );
  }

  private getLabelKeyForColumn(
    key: string,
    layout?: { [A in AnchorPoint]?: string },
  ): string {
    return RacedayLayoutUtils.getLabelKeyForColumn(key, layout);
  }

  protected trackByIndex(index: number, _item: any): number {
    return index;
  }

  protected trackByDriverId(index: number, hd: DriverHeatData): any {
    return `${hd.objectId}-${hd.laneIndex}`;
  }

  protected trackByColumn(index: number, col: any): string {
    return col.propertyName || col.id || col.label || index.toString();
  }

  protected trackByLayout(index: number, entry: any): string {
    return `${entry.anchor}-${entry.property}`;
  }

  getDropdownArrowBg(hd: DriverHeatData): string {
    const color =
      this.track?.lanes?.[hd.laneIndex]?.foreground_color || "#ffffff";
    return this.getDropdownIcon(color);
  }

  getLaneColor(
    hd: DriverHeatData,
    property: "background_color" | "foreground_color",
  ): string {
    return this.track?.lanes?.[hd.laneIndex]?.[property] || "";
  }

  getDropdownIcon(color: string): string {
    if (this.dropdownIconCache.has(color)) {
      return this.dropdownIconCache.get(color)!;
    }
    // Use an inline SVG with the correct fill color
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path fill="${color}" d="M4 8l8 8 8-8z"/></svg>`;
    const url = `url("data:image/svg+xml;charset=US-ASCII,${encodeURIComponent(svg)}")`;
    this.dropdownIconCache.set(color, url);
    return url;
  }

  isNameProperty(property: string): boolean {
    const baseKey = property.split("_")[0];
    return baseKey === "driver.name" || baseKey === "driver.nickname";
  }

  isTeamDriverSwapActive(hd: DriverHeatData, col: ColumnDefinition): boolean {
    if (this.isUIEditorMode() || this.isLayoutCustomizing) {
      return false;
    }
    if (!this.isNameProperty(col.propertyName || "")) {
      return false;
    }
    if (!this.isTeam(hd) || this.isDriverSwapDisabled(hd)) {
      return false;
    }
    if (this.authService.currentRole === Role.VIEWER) {
      return false;
    }
    return true;
  }

  isLapCountColumnClickable(
    hd: DriverHeatData,
    col: ColumnDefinition,
  ): boolean {
    if (this.isUIEditorMode() || this.isLayoutCustomizing) {
      return false;
    }
    if (col.propertyName !== "lapCount") {
      return false;
    }
    if (this.heat && this.heat.started === false) {
      return false;
    }
    return true;
  }

  isTeam(hd: DriverHeatData | any): boolean {
    return (
      !!(hd?.participant?.team || hd?.driver?.team) || !!this.race?.practice
    );
  }

  getTeammates(hd: DriverHeatData | any): any[] {
    if (this.race?.practice) {
      const emptyDriver = {
        name: this.translationService.translate("RD_EMPTY_LANE"),
        nickname: "",
        entity_id: "EMPTY_LANE",
        id: "EMPTY_LANE",
      };

      const raceDrivers: any[] = [];
      this.participants.forEach((p) => {
        if (p.driver && p.driver.entity_id !== "EMPTY_LANE") {
          const d = this.allDrivers.find(
            (d) =>
              (d.entity_id || d.id) ===
              (p.driver?.entity_id || (p as any).driverId),
          );
          if (
            d &&
            !raceDrivers.find(
              (rd) => (rd.entity_id || rd.id) === (d.entity_id || d.id),
            )
          ) {
            raceDrivers.push(d);
          }
        }
        if (p.team && p.team.driverIds) {
          p.team.driverIds.forEach((id: string) => {
            const d = this.allDrivers.find((d) => (d.entity_id || d.id) === id);
            if (
              d &&
              !raceDrivers.find(
                (rd) => (rd.entity_id || rd.id) === (d.entity_id || d.id),
              )
            ) {
              raceDrivers.push(d);
            }
          });
        }
      });

      return [emptyDriver, ...raceDrivers];
    }
    const team = hd.participant?.team || hd.driver?.team;
    if (team && team.driverIds) {
      return team.driverIds
        .map((id: string) =>
          this.allDrivers.find((d) => (d.entity_id || d.id) === id),
        )
        .filter((d: any) => !!d);
    }
    return [];
  }

  onTeammateChange(hd: DriverHeatData, event: any) {
    const driverId = event.target.value;
    const lane = hd.laneIndex;

    const doChange = () => {
      this.dataService.changeActualDriver(lane, driverId).subscribe({
        next: () => {
          this.logger.debug(`Teammate changed for lane ${lane} to ${driverId}`);
        },
        error: (err) => {
          this.logger.error(`Error changing teammate for lane ${lane}:`, err);
          this.ackModalTitle = "RD_ERR_DRIVER_CHANGE_TITLE";
          this.ackModalMessage = err.error || "RD_ERR_DRIVER_CHANGE_MESSAGE";
          this.showAckModal = true;
          // Rollback select value
          if (event.target) {
            event.target.value =
              hd.actualDriver?.entity_id || hd.driver?.entity_id;
          }
        },
      });
    };

    doChange();
  }

  onNextHeatTeammateChange(hd: DriverHeatData, event: any, heatNumber: number) {
    const driverId = event.target.value;
    const lane = hd.laneIndex;
    this.dataService
      .changeActualDriverForHeat(heatNumber, lane, driverId)
      .subscribe({
        next: () => {
          this.logger.debug(
            `Teammate changed for heat ${heatNumber} lane ${lane} to ${driverId}`,
          );
        },
        error: (err) => {
          this.logger.error(
            `Error changing teammate for heat ${heatNumber} lane ${lane}:`,
            err,
          );
          this.ackModalTitle = "RD_ERR_DRIVER_CHANGE_TITLE";
          this.ackModalMessage = err.error || "RD_ERR_DRIVER_CHANGE_MESSAGE";
          this.showAckModal = true;
          // Rollback select value
          if (event.target) {
            event.target.value =
              hd.actualDriver?.entity_id || hd.driver?.entity_id;
          }
        },
      });
  }

  trackByLeaderboardEntry(index: number, entry: any) {
    return entry.entityId || entry.name;
  }

  isDriverSwapDisabled(hd: any): boolean {
    if (this.isLayoutCustomizing || this.isUIEditorMode()) {
      return true;
    }
    const race = this.raceService.getRace();
    if (!race?.team_options?.require_pit_stop_change_driver) {
      return false;
    }
    if (
      this.raceState !== RaceState.RACING &&
      this.raceState !== RaceState.STARTING
    ) {
      return false;
    }
    const location = this.carLocations.get(hd.laneIndex);
    if (location === undefined) return false;
    const inPit = location === 1 || location >= 2000;
    return !inPit;
  }

  getDriverStats(hd: any, driverId: string): string {
    if (!hd || !driverId) return "";
    let heatLaps = 0;
    let heatTime = 0;
    let overallLaps = 0;
    let overallTime = 0;

    const hLabel = this.translationService.translate("RD_STATS_HEAT_ABBR");
    const lLabel = this.translationService.translate("RD_STATS_LAP_ABBR");
    const tLabel = this.translationService.translate("RD_STATS_TOTAL_ABBR");

    if (hd.lapsWithDetails) {
      hd.lapsWithDetails.forEach((l: any) => {
        if (l.driverId === driverId) {
          heatLaps++;
          heatTime += l.time;
        }
      });
    }

    const heats = this.raceService.getHeats();
    if (heats) {
      heats.forEach((h: any) => {
        if (h.heatDrivers) {
          h.heatDrivers.forEach((d_hd: any) => {
            if (d_hd.lapsWithDetails) {
              d_hd.lapsWithDetails.forEach((l: any) => {
                if (l.driverId === driverId) {
                  overallLaps++;
                  overallTime += l.time;
                }
              });
            }
          });
        }
      });
    }

    const formatTime = (t: number) => {
      if (t >= 60) {
        const m = Math.floor(t / 60);
        const s = (t % 60).toFixed(1).padStart(4, "0");
        return `${m}:${s}`;
      }
      return `${t.toFixed(1)}s`;
    };

    return `(${hLabel}: ${heatLaps} ${lLabel} / ${formatTime(heatTime)}, ${tLabel}: ${overallLaps} ${lLabel} / ${formatTime(overallTime)})`;
  }

  private handleRaceStateChange(state: RaceState) {
    if (state === this.raceState) {
      return;
    }

    const previousState = this.raceState;
    this.logger.debug(
      "RacedayComponent: State changed from",
      previousState,
      "to:",
      state,
    );
    this.raceState = state;

    // Reset overlay if we enter a state that shouldn't show it
    if (
      state === RaceState.NOT_STARTED ||
      state === RaceState.UNKNOWN_STATE ||
      state === RaceState.HEAT_OVER ||
      state === RaceState.RACE_OVER ||
      state === RaceState.PAUSED
    ) {
      this.showCountdownOverlay = false;
      if (
        state === RaceState.NOT_STARTED ||
        state === RaceState.HEAT_OVER ||
        state === RaceState.RACE_OVER
      ) {
        this.playedSecondsLeft.clear();
        this.playedHalfway = false;
      }
    }

    // Play yellow flag audio when transitioning from RACING to PAUSED
    if (state === RaceState.PAUSED && previousState === RaceState.RACING) {
      this.playThemedSound(THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG);
    }

    if (previousState !== RaceState.UNKNOWN_STATE) {
      if (state === RaceState.HEAT_OVER) {
        this.playThemedSound(THEME_SLOT_KEYS.AUDIO_HEAT_OVER);
      } else if (state === RaceState.RACE_OVER) {
        this.playThemedSound(THEME_SLOT_KEYS.AUDIO_RACE_OVER);
      }
    }

    // Show overlay for STARTING or RESTARTING
    if (state === RaceState.STARTING) {
      this.showCountdownOverlay = true;
      this.lastPlayedCountdownSecond = -1;

      // Determine if this is a restart from a paused state
      if (previousState === RaceState.PAUSED) {
        this.isRestarting = true;
      } else if (previousState !== RaceState.STARTING) {
        this.isRestarting = false;
      }

      // Determine duration based on entry path
      const r = this.raceService.getRace() || this.race;
      const duration = this.isRestarting
        ? (r?.restart_time ?? 5.0)
        : (r?.start_time ?? 5.0);

      this.countdownTotalLamps = Math.ceil(duration);
      this.updateCountdownLamps(duration);
    }

    // If RACING state came, set all lamps to green
    if (state === RaceState.RACING) {
      this.setAllLampsGo();

      if (
        previousState === RaceState.STARTING &&
        this.showCountdownOverlay &&
        !this.isRestarting
      ) {
        const scoring = this.race?.heat_scoring;
        if (scoring?.finishMethod === FinishMethod.Timed) {
          this.time = scoring.finishValue;
        }
      }

      this.isRestarting = false;

      if (previousState !== RaceState.UNKNOWN_STATE) {
        this.playAudioFromSet(THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 0);
      }
      // Hide overlay after 1 second of green lamps
      setTimeout(() => {
        if (this.raceState === RaceState.RACING) {
          this.showCountdownOverlay = false;
        }
      }, 1000);
    }

    if (!this.isDestroyed) {
      this.cdr.markForCheck();
    }
  }

  private updateCountdownLamps(currentTime: number) {
    if (!this.showCountdownOverlay) return;

    // If we've reached RACING state, but the overlay hasn't hidden yet,
    // ensure we stay in the "GO!" state with all green lamps.
    if (this.raceState === RaceState.RACING) {
      this.setAllLampsGo();
      return;
    }

    const displayTime =
      this.raceState === RaceState.STARTING && currentTime <= 0
        ? 1
        : currentTime;

    // Show the number of lamps corresponding to the seconds elapsed (e.g., 1st sec = 1 lamp).
    // This synchronizes with the updated hardware LED logic (1, 2, 3, GO).
    const onCount = Math.max(
      1,
      this.countdownTotalLamps - Math.ceil(displayTime) + 1,
    );

    this.countdownLamps = [];
    for (let i = 0; i < this.countdownTotalLamps; i++) {
      const lampState = i < onCount ? "on" : "dim";
      const slotKey = lampState === "on" ? "lamp.red.on" : "lamp.red.dim";
      const url =
        this.resolveAssetUrlBySlot(slotKey) ||
        this.getAssetUrl(
          lampState === "on" ? "Start Lamp Red" : "Start Lamp Dim",
        );
      this.countdownLamps.push({
        url: url,
        state: lampState,
      });
    }

    this.countdownText = `${Math.ceil(displayTime)}`;
    this.countdownColor = "lime";

    const currentSecond = Math.ceil(currentTime);
    if (
      currentSecond <= this.countdownTotalLamps &&
      currentSecond <= 5 &&
      currentSecond >= 1 &&
      currentSecond !== this.lastPlayedCountdownSecond
    ) {
      this.lastPlayedCountdownSecond = currentSecond;
      this.playAudioFromSet(THEME_SLOT_KEYS.AUDIO_COUNTDOWN, currentSecond);
    }
  }

  private playAudioFromSet(slotKey: string, timeSeconds: number) {
    const config = this.themeService.resolveAudioConfig(slotKey);
    if (!config || config.type !== "audio_set") return;

    const assetId = config.url;
    if (!assetId) return;

    const asset = (this.assets || []).find(
      (a) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId,
    );
    if (!asset || asset.type !== "audio_set") return;

    const entry = asset.audioEntries?.find(
      (e: any) => Math.abs(e.timeSeconds - timeSeconds) < 0.1,
    );
    if (entry) {
      const entryType = entry.type || "preset";
      if (entryType !== "none") {
        playSound(
          entryType as any,
          entry.url ? this.getFullUrl(entry.url) : undefined,
          entry.text || undefined,
          this.dataService.serverUrl,
          undefined,
          this.logger,
        );
      }
    }
  }

  onCellClick(hd: DriverHeatData, col: ColumnDefinition, event: MouseEvent) {
    if (this.isLayoutCustomizing || this.isUIEditorMode()) {
      return;
    }
    if (col.propertyName === "lapCount") {
      if (event.shiftKey) {
        event.preventDefault();
        this.updateUserLaps(hd, this.LAP_ADJUSTMENT_AMOUNT);
      } else if (event.altKey) {
        event.preventDefault();
        this.updateUserLaps(hd, -this.LAP_ADJUSTMENT_AMOUNT);
      } else {
        this.selectedHeatDriver = hd;
        this.isMenuModeForAddLap = false;
        this.showAddLapSectionsDialog = true;
        this.cdr.markForCheck();
      }
    }
  }

  protected onAddLapSectionsConfirm(event: any) {
    this.showAddLapSectionsDialog = false;
    if (typeof event === "number") {
      if (this.selectedHeatDriver) {
        const hd = this.selectedHeatDriver;
        this.dataService.updateUserLaps(hd.laneIndex, event).subscribe(
          (response) => {
            if (response && response.adjustedLapCount !== undefined) {
              hd.adjustedLapCount = response.adjustedLapCount;
              hd.userLaps = event;
              this.cdr.markForCheck();
            }
          },
          (error) => {
            this.logger.error("Error updating user laps from dialog:", error);
          },
        );
      }
    } else if (event && event.isBatch) {
      const updates = event.updates;
      this.dataService.updateBatchUserLaps(updates).subscribe(
        () => {
          for (const u of updates) {
            const targetHeat = this.heats.find(
              (h) => h.heatNumber === u.heatNumber,
            );
            if (targetHeat && targetHeat.heatDrivers) {
              const hd = targetHeat.heatDrivers[u.laneIndex];
              if (hd) {
                hd.userLaps = u.userLaps;
                this.cdr.markForCheck();
              }
            }
          }
        },
        (error) => {
          this.logger.error(
            "Error updating batch user laps from dialog:",
            error,
          );
        },
      );
    } else {
      const { heatNumber, laneIndex, userLaps } = event;
      this.dataService
        .updateHeatUserLaps(heatNumber, laneIndex, userLaps)
        .subscribe(
          (response) => {
            const targetHeat = this.heats.find(
              (h) => h.heatNumber === heatNumber,
            );
            if (targetHeat && targetHeat.heatDrivers) {
              const hd = targetHeat.heatDrivers[laneIndex];
              if (hd && response && response.adjustedLapCount !== undefined) {
                hd.adjustedLapCount = response.adjustedLapCount;
                hd.userLaps = userLaps;
                this.cdr.markForCheck();
              }
            }
          },
          (error) => {
            this.logger.error(
              "Error updating heat user laps from dialog:",
              error,
            );
          },
        );
    }
  }

  private updateUserLaps(hd: DriverHeatData, amount: number) {
    const newUserLaps = (hd.userLaps || 0) + amount;
    this.dataService.updateUserLaps(hd.laneIndex, newUserLaps).subscribe(
      (response) => {
        // The server will broadcast the update, but we can also update locally for immediate feedback
        if (response && response.adjustedLapCount !== undefined) {
          hd.adjustedLapCount = response.adjustedLapCount;
          this.cdr.markForCheck();
        }
      },
      (error) => {
        this.logger.error("Error updating user laps:", error);
      },
    );
  }

  private checkAudioCallouts(currentTime: number, previousTime: number) {
    const scoring = this.race?.heat_scoring;
    if (!scoring || scoring.finishMethod !== FinishMethod.Timed) return;

    const totalDuration = scoring.finishValue;
    const thresholds = [300, 240, 180, 120, 60, 30, 25, 20, 15, 10, 5];

    // Halfway logic
    const halfwayThreshold = totalDuration / 2;
    if (
      previousTime > halfwayThreshold &&
      currentTime <= halfwayThreshold &&
      !this.playedHalfway
    ) {
      this.playThemedSound(THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY);
      this.playedHalfway = true;
    }

    // Standard thresholds
    for (const threshold of thresholds) {
      if (
        previousTime > threshold &&
        currentTime <= threshold &&
        !this.playedSecondsLeft.has(threshold)
      ) {
        // Rule: Don't play if it's the start time of the heat
        if (Math.abs(threshold - totalDuration) < 0.1) continue;

        this.playAudioFromSet(THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT, threshold);
        this.playedSecondsLeft.add(threshold);
      }
    }
  }

  private playThemedSound(slotKey: string, context?: any) {
    const config = this.themeService.resolveAudioConfig(slotKey);
    if (config && config.type !== "none") {
      // Resolve URL if it's a preset
      let playableUrl = config.url;
      if (config.type === "preset" && playableUrl) {
        const asset = (this.assets || []).find(
          (a) =>
            a.model?.entityId === playableUrl ||
            a.entity_id === playableUrl ||
            a._id === playableUrl,
        );
        if (asset) {
          playableUrl = this.getFullUrl(asset.url);
        }
      }

      playSound(
        config.type as any,
        playableUrl,
        config.text,
        this.dataService.serverUrl,
        context,
        this.logger,
      );
    } else if (slotKey === THEME_SLOT_KEYS.AUDIO_PENALTY) {
      // Global fallback for penalty sound if not in theme
      playSound(
        "preset",
        "/assets/default_penalty_penalty.wav",
        "",
        this.dataService.serverUrl,
        undefined,
        this.logger,
      );
    }
  }

  private setAllLampsGo() {
    const url =
      this.resolveAssetUrlBySlot("lamp.green") ||
      this.getAssetUrl("Start Lamp Green");
    const count = this.countdownTotalLamps > 0 ? this.countdownTotalLamps : 5;
    this.countdownLamps = Array.from({ length: count }).map(() => ({
      url: url,
      state: "go",
    }));
    this.countdownText = "GO!";
    this.countdownColor = "lime";
  }

  private getAssetUrl(name: string): string {
    const asset = (this.assets || []).find((a: any) => a.name === name);
    return asset ? this.getFullUrl(asset.url) : "";
  }

  /**
   * Resolve an asset URL from a theme slot key.
   * Looks up the theme's asset entity ID for the slot, then finds the
   * matching asset in the loaded assets list to get its URL.
   * Returns empty string if no theme is active or the slot/asset is not found.
   */
  private resolveAssetUrlBySlot(slotKey: string): string {
    const assetId = this.themeService.resolveAssetId(slotKey);
    if (!assetId) return "";

    // Find the asset in the loaded assets list by entity ID
    const asset = (this.assets || []).find(
      (a: any) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId,
    );
    return asset ? this.getFullUrl(asset.url) : "";
  }

  protected onModifyHeatsClose(saved: boolean) {
    this.showModifyHeatsModal = false;
    if (saved) {
      this.logger.info("Heats modified and saved.");
    }
    this.router.navigate([], {
      queryParams: { modifyHeats: null },
      queryParamsHandling: "merge",
    });
  }

  // Layout customization methods
  toggleLayoutCustomize() {
    this.isLayoutCustomizing = !this.isLayoutCustomizing;
    this.cdr.detectChanges();
  }

  getWidgetTypeLabelKey(widgetType: string): string {
    if (widgetType?.startsWith("custom:")) {
      const def = this.customWidgetService?.getWidgetDefinition(widgetType);
      return def?.manifest?.name || widgetType.substring("custom:".length);
    }
    return "UE_WIDGET_TYPE_" + widgetType.toUpperCase().replace(/-/g, "_");
  }

  saveLayout() {
    console.log("saveLayout called");
    this.normalizeZIndices();
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    if (this.isPracticeLayout) {
      settings.practiceRacedayLayout = this.layout;
    } else {
      settings.racedayLayout = this.layout;
    }
    this.settingsService.saveSettings(settings);
    this.isLayoutCustomizing = false;
    this.cdr.detectChanges();
  }

  cancelLayoutCustomize() {
    if (this.currentRacedayLayout && this.currentRacedayLayout.widgets) {
      this.layout = JSON.parse(JSON.stringify(this.currentRacedayLayout));
    } else {
      this.layout = this.getDefaultLayout();
    }
    this.updateScale();
    this.isLayoutCustomizing = false;
    this.cdr.detectChanges();
  }

  resetLayoutToDefaults() {
    this.layout = this.getDefaultLayout();
    const settings = this.settingsService.getSettings();
    this.currentRacedayLayout = this.layout;
    this.settingsService.saveSettings(settings);
    this.updateScale();
    this.isLayoutCustomizing = false;
    this.cdr.detectChanges();
  }

  getUnusedWidgets(): WidgetType[] {
    const allTypes: WidgetType[] = [
      "menu-bar",
      "race-name",
      "event-name",
      "season-name",
      "heat-info",
      "track-name",
      "branding",
      "qr",
      "flag",
      "timer",
      "records",
      "leaderboard",
      "group-leaderboard",
      "season-leaderboard",
      "season-race-leaderboard",
      "lane-view",
      "on-deck",
      "next-heat",
      "image",
      "action-start-resume",
      "action-pause",
      "action-next-heat",
      "action-restart-heat",
      "action-defer-heat",
      "action-skip-heat",
      "action-skip-race",
      "action-add-lap",
      "action-modify-heats",
      "action-export-pdf",
      "action-export-csv",
      "action-export-xls",
      "action-open-heat-results",
      "action-open-race-results",
      "action-open-season-results",
      "action-open-prediction-results",
      "action-master-power-on",
      "action-master-power-off",
    ];

    const customWidgets = this.customWidgetService?.getCustomWidgets() || [];
    for (const cw of customWidgets) {
      allTypes.push(`custom:${cw.manifest.id}`);
    }

    const used = new Set(this.layout?.widgets?.map((w) => w.widgetType) || []);
    return allTypes
      .filter((t) => !used.has(t))
      .sort((a, b) => a.localeCompare(b));
  }

  onToolboxDragStart(event: DragEvent, type: string) {
    this.draggedWidgetType = type;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", type);
    }
  }

  onCanvasDragOver(event: DragEvent) {
    if (!this.isLayoutCustomizing || !this.draggedWidgetType) return;
    event.preventDefault(); // Necessary to allow drop
  }

  onCanvasDrop(event: DragEvent) {
    if (!this.isLayoutCustomizing || !this.draggedWidgetType) return;
    event.preventDefault();

    const scalableContent = this.el.nativeElement.querySelector(
      ".scalable-content",
    ) as HTMLElement;
    if (!scalableContent) return;

    const rect = scalableContent.getBoundingClientRect();
    const isLeaderboardOrDeck =
      this.draggedWidgetType === "leaderboard" ||
      this.draggedWidgetType === "group-leaderboard" ||
      this.draggedWidgetType === "season-leaderboard" ||
      this.draggedWidgetType === "season-race-leaderboard" ||
      this.draggedWidgetType === "on-deck" ||
      this.draggedWidgetType === "next-heat" ||
      this.draggedWidgetType === "image";

    const isHeaderWidget =
      this.draggedWidgetType === "event-name" ||
      this.draggedWidgetType === "race-name" ||
      this.draggedWidgetType === "season-name" ||
      this.draggedWidgetType === "track-name" ||
      this.draggedWidgetType === "heat-info";

    const isActionButton = this.draggedWidgetType?.startsWith("action-");

    let width = 400;
    let height = 200;

    if (this.draggedWidgetType?.startsWith("custom:")) {
      const def = this.customWidgetService?.getWidgetDefinition(
        this.draggedWidgetType,
      );
      width = def?.manifest?.defaultWidth || 400;
      height = def?.manifest?.defaultHeight || 250;
    } else if (isHeaderWidget) {
      width = 200;
      height = 18;
    } else if (isLeaderboardOrDeck) {
      width = 384;
      height =
        this.draggedWidgetType === "leaderboard" ||
        this.draggedWidgetType === "group-leaderboard" ||
        this.draggedWidgetType === "season-leaderboard" ||
        this.draggedWidgetType === "season-race-leaderboard"
          ? 239
          : this.draggedWidgetType === "image"
            ? 300
            : 200;
    } else if (isActionButton) {
      width = 170;
      height = 80;
    }

    const scaleX = rect.width / scalableContent.offsetWidth || 1;
    const scaleY = rect.height / scalableContent.offsetHeight || 1;

    let x = (event.clientX - rect.left) / scaleX - width / 2;
    let y = (event.clientY - rect.top) / scaleY;

    const newWidget: any = {
      id: "widget-" + Date.now(),
      widgetType: this.draggedWidgetType as any,
      x: Math.round(x),
      y: Math.round(y),
      width: width,
      height: height,
      zIndex: this.getNextZIndex(),
      scaleMode: "auto",
    };

    if (this.draggedWidgetType === "image") {
      newWidget.customSettings = { imageUrl: "" };
    } else {
      const registryEntry = WIDGET_REGISTRY[this.draggedWidgetType as string];
      if (registryEntry?.defaultSettings) {
        newWidget.customSettings = registryEntry.defaultSettings();
      }
    }

    if (!this.layout) {
      this.layout = this.getDefaultLayout();
    }
    if (!this.layout.widgets) this.layout.widgets = [];
    this.layout.widgets.push(newWidget);

    this.draggedWidgetType = null;
    this.layoutChanged.emit(this.layout);
    this.widgetSelected.emit(newWidget.id);
    this.cdr.markForCheck();
  }

  getNextZIndex(): number {
    if (!this.layout?.widgets?.length) return 100;
    return Math.max(...this.layout.widgets.map((w: any) => w.zIndex || 0)) + 1;
  }

  bringToFront(id: string) {
    if (!this.layout?.widgets) return;

    const otherWidgets = this.layout.widgets.filter((w: any) => w.id !== id);
    const maxOtherZ =
      otherWidgets.length > 0
        ? Math.max(...otherWidgets.map((w: any) => w.zIndex || 0))
        : 0;

    const w = this.layout.widgets.find((w: any) => w.id === id);
    if (w) {
      if (w.zIndex == null || w.zIndex <= maxOtherZ) {
        w.zIndex = maxOtherZ + 1;
        this.layoutChanged.emit(this.layout);
      }
      this.widgetSelected.emit(id);
    }
  }

  normalizeZIndices() {
    if (!this.layout?.widgets) return;
    const sorted = [...this.layout.widgets].sort(
      (a, b) => (a.zIndex || 100) - (b.zIndex || 100),
    );
    sorted.forEach((w: any, index: number) => {
      w.zIndex = 100 + index;
    });
  }

  removeWidget(id: string) {
    if (!this.layout?.widgets) return;
    this.layout.widgets = this.layout.widgets.filter((w: any) => w.id !== id);
    this.layoutChanged.emit(this.layout);
    if (this.selectedWidgetId() === id) {
      const laneView = this.layout.widgets.find(
        (w: any) => w.widgetType === "lane-view",
      );
      const nextWidget = laneView || this.layout.widgets[0];
      this.widgetSelected.emit(nextWidget ? nextWidget.id : null);
    }
  }

  snapToEdges(
    x: number,
    y: number,
    w: number,
    h: number,
    ignoreId: string,
    handle: string,
    layoutWidth: number = 1920,
    layoutHeight: number = 1080,
  ): { x: number; y: number; w: number; h: number } {
    return RacedayLayoutUtils.snapToEdges(
      this.layout?.widgets || [],
      x,
      y,
      w,
      h,
      ignoreId,
      handle,
      layoutWidth,
      layoutHeight,
    );
  }

  onCanvasPointerDown(_event: PointerEvent) {
    // Preserve widget selection so widget inspector remains open
  }

  private getDefaultLayout(): LayoutConfig {
    const layout = JSON.parse(
      JSON.stringify(
        this.isPracticeLayout
          ? Settings.DEFAULT_PRACTICE_LAYOUT
          : Settings.DEFAULT_LAYOUT,
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
      layout.widgets.forEach((w) => {
        w.x = Math.round(w.x * scaleX);
        w.y = Math.round(w.y * scaleY);
        w.width = Math.round(w.width * scaleX);
        w.height = Math.round(w.height * scaleY);
      });
    }

    return layout;
  }
}
