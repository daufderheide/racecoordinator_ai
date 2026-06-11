/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { DragDropModule } from "@angular/cdk/drag-drop";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  SimpleChanges,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterStateSnapshot } from "@angular/router";
import * as QRCode from "qrcode";
import { Observable, Subject, Subscription } from "rxjs";
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
import {
  ColumnVisibility,
  LayoutConfig,
  Settings,
  WidgetType,
} from "@app/models/settings";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LapType, RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { AuthService } from "@app/services/auth.service";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { createTTSContext, playSound } from "@app/utils/audio";

import { ColumnDefinition } from "./column_definition";
import { AnchorPoint } from "./column_definition";
import { RacedayAbsoluteWidgetComponent } from "./components/raceday-absolute-widget/raceday-absolute-widget.component";
import { RacedayModalsComponent } from "./components/raceday-modals/raceday-modals.component";
import {
  FormatContext,
  RacedayFormatUtils,
} from "./utils/raceday-format.utils";
import { RacedayLayoutUtils } from "./utils/raceday-layout.utils";
import { createMockEditorData } from "./utils/raceday-mock.utils";

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
  ],
})
export class DefaultRacedayComponent
  implements OnInit, OnDestroy, OnChanges, CanComponentDeactivate
{
  private isDestroyed = false;
  private subscriptions: Subscription[] = [];
  protected heat?: Heat;
  protected track!: Track;
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
  protected participants: RaceParticipant[] = [];

  // Countdown Overlay state
  showCountdownOverlay: boolean = false;
  countdownLamps: any[] = [];
  countdownText: string = "";
  protected showModifyHeatsModal: boolean = false;
  protected heats: Heat[] = [];
  countdownColor: string = "";
  countdownTotalLamps: number = 0;
  private lastPlayedCountdownSecond: number = -1;
  protected isRestarting: boolean = false;

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

  get groupEnabled(): boolean {
    return this.race?.group_options?.enabled || false;
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

  protected get formattedTime(): string {
    const s = this.raceState;
    if (
      (s === RaceState.NOT_STARTED || s === RaceState.UNKNOWN_STATE) &&
      this.autoStartRemaining <= 0 &&
      this.autoAdvanceRemaining <= 0
    ) {
      return "--";
    }

    const time = this.time || 0;
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

    // High precision countdown logic (only for seconds < 10 and we have a decimal format)
    if (hours === 0 && minutes === 0 && this.timeFormat.includes(".")) {
      const parts = this.timeFormat.split(".");
      const fractionDigits = parts[1].split("-")[1]; // e.g., '1.2-2' -> 2
      const formatted = time.toFixed(Number(fractionDigits));
      return formatted;
    }

    return base;
  }

  protected get gridTemplateColumns(): string {
    if (!this.columns || this.columns.length === 0) return "1fr";
    return this.columns.map((c) => `minmax(0, ${c.width}fr)`).join(" ");
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
    if (this.autoAdvanceRemaining > 0 && this.race) {
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
  showAckModal = false;
  ackModalTitle = "";
  ackModalMessage = "";
  ackModalButtonText = "ACK_MODAL_BTN_OK";
  raceHasEnded = false;
  forceExit = false;

  public Role = Role;
  showLoginModal = false;

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
    private logger: LoggerService,
    private route: ActivatedRoute,
    private printService: PrintService,
    public authService: AuthService,
  ) {
    // Initial default columns, will be overwritten in ngOnInit
    this.columns = [];
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

  // Layout customization state
  isUIEditorMode = input<boolean>(false);
  uiScale = input<number>(1);
  editingSettings = input<Settings | undefined>(undefined);

  get visualScale(): number {
    return this.isUIEditorMode() ? this.uiScale() : this.scale;
  }

  get toolboxScale(): number {
    return this.isUIEditorMode() ? this.uiScale() : 1;
  }
  layoutChanged = output<LayoutConfig>();
  isLayoutCustomizing = false;
  layout!: LayoutConfig;
  draggedWidgetType: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes["editingSettings"] &&
      !changes["editingSettings"].firstChange &&
      this.isUIEditorMode()
    ) {
      const settings = this.editingSettings();
      if (settings?.racedayLayout?.widgets) {
        this.layout = JSON.parse(JSON.stringify(settings.racedayLayout));
      } else {
        this.layout = JSON.parse(JSON.stringify(Settings.DEFAULT_LAYOUT));
      }
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
  }

  private setupInitialState() {
    const settings =
      this.editingSettings() || this.settingsService.getSettings();
    if (settings.racedayLayout && settings.racedayLayout.widgets) {
      this.layout = JSON.parse(JSON.stringify(settings.racedayLayout));
    } else {
      this.layout = JSON.parse(JSON.stringify(Settings.DEFAULT_LAYOUT));
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

    this.subscriptions.push(
      this.dataService.getSystemState().subscribe((state) => {
        if (state) {
          if (state.resourceLockState === "IDLE") {
            this.raceHasEnded = true;
            this.showExitConfirmation = false;
            this.showSkipHeatConfirmation = false;
            this.showRestartHeatConfirmation = false;
            this.showDeferHeatConfirmation = false;
            this.ackModalTitle = "RD_RACE_ENDED_TITLE";
            this.ackModalMessage = "RD_RACE_ENDED_MESSAGE";
            this.ackModalButtonText = "RD_RACE_ENDED_BTN_OK";
            this.showAckModal = true;
            this.cdr.markForCheck();
          } else if (state.resourceLockState === "RACE_RUNNING") {
            if (this.raceHasEnded) {
              this.raceHasEnded = false;
              this.ackModalTitle = "RD_RACE_STARTED_TITLE";
              this.ackModalMessage = "RD_RACE_STARTED_MESSAGE";
              this.ackModalButtonText = "RD_RACE_STARTED_BTN_OK";
              this.showAckModal = true;
              this.dataService.updateRaceSubscription(true);
              this.cdr.markForCheck();
            }
          }
        }
      }),
    );

    this.subscriptions.push(
      this.dataService.getServerIp().subscribe({
        next: (ip) => {
          if (ip) {
            const port = window.location.port;
            const url = `${window.location.protocol}//${ip}${port ? ":" + port : ""}`;
            QRCode.toDataURL(url, { margin: 1, width: 80 })
              .then((dataUrl) => {
                this.qrCodeUrl = dataUrl;
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
        this.autoAdvanceRemaining = raceTime.autoAdvanceRemaining || 0;

        let time = raceTime.time || 0;
        if (this.autoStartRemaining > 0) {
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
          if (time < 10) {
            this.timeFormat = "1.2-2";
          } else {
            this.timeFormat = "1.0-0";
          }
        } else {
          if (time === 0) this.timeFormat = "1.0-0";
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
      this.cdr.markForCheck();
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
    }

    if (lap.type === LapType.MIN_LAP_TIME) {
      this.playThemedSound(THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME, ttsContext);
    }

    if (
      isBestLap &&
      driver.bestLapAudio.type !== "none" &&
      (driver.bestLapAudio.url ||
        (driver.bestLapAudio.type === "tts" && driver.bestLapAudio.text))
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
      driver.lapAudio.type !== "none" &&
      (driver.lapAudio.url ||
        (driver.lapAudio.type === "tts" && driver.lapAudio.text))
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
    if (settings.highlightRowOnLap) {
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
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.interfaceAlert$.subscribe((alert) => {
        if (alert.titleKey === "ACK_MODAL_TITLE_CONNECTED") {
          if (this.showAckModal) {
            this.showInterfaceError(alert.titleKey, alert.messageKey);
          }
        } else {
          this.showInterfaceError(alert.titleKey, alert.messageKey);
        }
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

  private handleRecordDataUpdate(records: any) {
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

  private leaderBoardWindow: Window | null = null;
  private heatResultsWindow: Window | null = null;
  private raceResultsWindow: Window | null = null;
  private driverStationTabs: Window[] = [];

  private setupMockDataForEditor() {
    const mockData = createMockEditorData();
    this.raceState = mockData.raceState;
    this.time = mockData.time;
    this.race = mockData.race;
    this.track = mockData.track;
    this.participants = mockData.participants;
    this.heat = mockData.heat;
    this.qrCodeUrl =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='white'/><rect x='10' y='10' width='20' height='20' fill='black'/><rect x='50' y='10' width='20' height='20' fill='black'/><rect x='10' y='50' width='20' height='20' fill='black'/><rect x='40' y='40' width='10' height='10' fill='black'/><rect x='30' y='30' width='20' height='20' fill='black'/></svg>";

    this.sortHeatDrivers();
    this.updateLeaderboardEntries();
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.raceConnectionService.disconnect();

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    if (this.leaderBoardWindow) {
      this.leaderBoardWindow.close();
      this.leaderBoardWindow = null;
    }
    if (this.heatResultsWindow) {
      this.heatResultsWindow.close();
      this.heatResultsWindow = null;
    }
    if (this.raceResultsWindow) {
      this.raceResultsWindow.close();
      this.raceResultsWindow = null;
    }
    this.driverStationTabs.forEach((tab) => {
      if (tab && !tab.closed) {
        tab.close();
      }
    });
    this.driverStationTabs = [];
  }

  private showInterfaceError(titleKey: string, messageKey: string) {
    this.ackModalTitle = titleKey;
    this.ackModalMessage = messageKey;
    this.showAckModal = true;
    this.cdr.markForCheck();
  }

  onAcknowledgeModal() {
    this.showAckModal = false;
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
        nextState.url.includes("/driver-station")
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
      // TODO(aufderheide): Server should 100% control the presentation order.  I'm worried this may cause issues when we do disqualifications and such.
      // Sort a separate copy to determine visual positions
      const ranked = [...this.heat.heatDrivers].sort((a, b) => {
        let rankA = this.driverRankings.get(a.objectId) ?? 999;
        let rankB = this.driverRankings.get(b.objectId) ?? 999;
        if (rankA === 0) rankA = 999;
        if (rankB === 0) rankB = 999;
        return rankA - rankB;
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
      this.race = race;
      this.track = race.track;
      this.loadColumns();
      this.initializeHeat();

      // If we're already in a starting state, re-sync the countdown lamps now that we have duration
      if (
        this.raceState === RaceState.STARTING ||
        this.raceState === RaceState.PAUSED
      ) {
        const duration =
          this.isRestarting || this.raceState === RaceState.PAUSED
            ? race.restart_time
            : race.start_time;
        this.countdownTotalLamps = Math.ceil(duration || 5.0);
        this.updateCountdownLamps(this.autoStartRemaining || duration || 5.0);
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

  getTableBodyHeight(): number {
    return RacedayLayoutUtils.getTableBodyHeight(
      this.layout,
      this.isLayoutCustomizing,
    );
  }

  getRowHeight(): number {
    return RacedayLayoutUtils.getRowHeight(
      this.layout,
      this.track?.lanes?.length || 1,
      this.isLayoutCustomizing,
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

  getPropertyValue(heatDriver: DriverHeatData, propertyPath: string): any {
    return RacedayFormatUtils.getPropertyValue(heatDriver, propertyPath);
  }

  formatColumnValue(
    heatDriver: DriverHeatData,
    column: ColumnDefinition,
    propertyName?: string,
  ): string {
    const ctx: FormatContext = {
      translate: (key) => this.translationService.translate(key),
      getRace: () => this.raceService.getRace(),
      getTrack: () => this.track,
      getDriverRanking: (objectId) => this.driverRankings.get(objectId),
      getFlagType: () => this.raceFlagService.getFlagType(),
      getFlagUrl: (flag) => this.getFlagUrl(flag),
      getFullUrl: (url) => this.getFullUrl(url),
      getImageSetUrl: (hd, prop) => this.getImageUrl(prop, hd),
    };
    return RacedayFormatUtils.formatColumnValue(
      heatDriver,
      column,
      propertyName,
      ctx,
    );
  }

  // Menu logic
  isMenuOpen = false;
  isFileMenuOpen = false;
  isWindowsMenuOpen = false;
  isOptionsMenuOpen = false;
  scale: number = 1;
  dashboardWidth: number = 1920;

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
      this.isLanesMenuOpen = false;
      this.isDriversStationOpen = false;
      this.isWindowsMenuOpen = false;
      this.isOptionsMenuOpen = false;
    }
  }

  private updateScale() {
    if (this.isUIEditorMode()) {
      this.scale = 1;
      if (this.dashboardWidth !== 1920) {
        this.dashboardWidth = 1920;
        this.loadColumns();
      }
      return;
    }

    const targetHeight = 1080;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const newScale = windowHeight / targetHeight;

    if (Math.abs(this.scale - newScale) > 0.001) {
      this.scale = newScale;
    }

    const calculatedWidth = this.scale > 0 ? windowWidth / this.scale : 1920;
    if (Math.abs(this.dashboardWidth - calculatedWidth) > 0.1) {
      this.dashboardWidth = calculatedWidth;
      this.loadColumns();
    }
  }

  toggleMenu() {
    this.logger.debug(
      "Toggling Race Director menu. Current state:",
      this.isMenuOpen,
    );
    this.isMenuOpen = !this.isMenuOpen;
    this.isFileMenuOpen = false; // Close other menus
    this.isLanesMenuOpen = false;
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
    this.isLanesMenuOpen = false;
    this.isDriversStationOpen = false;
    this.isWindowsMenuOpen = false;
    this.isOptionsMenuOpen = false;
  }

  isLanesMenuOpen = false;
  isDriversStationOpen = false;

  toggleLanesMenu() {
    this.logger.debug(
      "Toggling Lanes menu. Current state:",
      this.isLanesMenuOpen,
    );
    this.isLanesMenuOpen = !this.isLanesMenuOpen;
    this.isFileMenuOpen = false;
    this.isMenuOpen = false;
    this.isDriversStationOpen = false; // Reset sub-menu on main toggle
    this.isWindowsMenuOpen = false;
    this.isOptionsMenuOpen = false;
  }

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
    this.isLanesMenuOpen = false;
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
    this.isLanesMenuOpen = false;
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
      this.isLanesMenuOpen ||
      this.isWindowsMenuOpen ||
      this.isOptionsMenuOpen
    );
  }

  onMenuItemHover(menuName: string) {
    if (this.isAnyMenuDropdownOpen()) {
      if (menuName === "file" && this.isFileMenuOpen) return;
      if (menuName === "race" && this.isMenuOpen) return;
      if (menuName === "lanes" && this.isLanesMenuOpen) return;
      if (menuName === "windows" && this.isWindowsMenuOpen) return;
      if (menuName === "options" && this.isOptionsMenuOpen) return;

      this.isFileMenuOpen = false;
      this.isMenuOpen = false;
      this.isLanesMenuOpen = false;
      this.isDriversStationOpen = false;
      this.isWindowsMenuOpen = false;
      this.isOptionsMenuOpen = false;

      if (menuName === "file") {
        this.isFileMenuOpen = true;
      } else if (menuName === "race") {
        this.isMenuOpen = true;
      } else if (menuName === "lanes") {
        this.isLanesMenuOpen = true;
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

  private executeMenuAction(action: string) {
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
        (success) => {
          if (success) {
            this.logger.debug("Race start command sent successfully");
          } else {
            this.logger.error("Failed to send race start command");
          }
        },
        (error) => {
          this.logger.error("Error starting race:", error);
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
      this.heatResultsWindow = window.open(url, "_blank");
    } else if (action === "RACE_RESULTS") {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/race-results"]),
      );
      this.raceResultsWindow = window.open(url, "_blank");
    }
  }

  @HostListener("window:unload", ["$event"])
  onUnload(_event: any) {
    if (this.leaderBoardWindow) {
      this.leaderBoardWindow.close();
      this.leaderBoardWindow = null;
    }
    if (this.heatResultsWindow) {
      this.heatResultsWindow.close();
      this.heatResultsWindow = null;
    }
    if (this.raceResultsWindow) {
      this.raceResultsWindow.close();
      this.raceResultsWindow = null;
    }
    this.driverStationTabs.forEach((tab) => {
      if (tab && !tab.closed) {
        tab.close();
      }
    });
    this.driverStationTabs = [];
  }

  onFileMenuSelect(action: string) {
    this.logger.debug("File menu action:", action);
    // Assuming 'activeMenu' is a property that controls which menu is open.
    // If not defined, it might need to be added to the class properties.
    // For now, we'll assume it exists or is intended to be added.
    // The original `this.isFileMenuOpen = false;` is removed as per the instruction's snippet.
    this.activeMenu = null;
    this.isFileMenuOpen = false;
    if (action === "EXIT") {
      this.router.navigate(["/raceday-setup"]);
    } else if (action === "EXPORT_CSV") {
      this.exportToCsv();
    } else if (action === "EXPORT_PDF") {
      this.printService.print("RaceDay"); // Screen View only as requested
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

    this.dataService.saveRace().subscribe({
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

  async exportToCsv() {
    try {
      const suggestedName = `race_export_${this.race?.name || "data"}.csv`;
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          {
            description: "CSV Files",
            accept: { "text/csv": [".csv"] },
          },
        ],
      });

      this.dataService.exportRaceToCsv().subscribe({
        next: async (csvData: string) => {
          const writable = await handle.createWritable();
          await writable.write(csvData);
          await writable.close();
          this.logger.debug("CSV Exported successfully");
        },
        error: (err: any) => {
          this.logger.error("Failed to export CSV", err);
        },
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        this.logger.debug("User cancelled save");
        return;
      }
      this.logger.error("Save error", err);
    }
  }

  onLaneMenuSelect(laneIndex: number) {
    this.logger.debug("Lane selected for Driver Station:", laneIndex);
    this.isLanesMenuOpen = false; // Close menu
    this.isDriversStationOpen = false;

    this.router.navigate(["/driver-station", laneIndex + 1]);
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

      if (s === RS.HEAT_OVER) {
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
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Space bar
    if (event.code === "Space") {
      // Don't trigger if typing in an input field
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      event.preventDefault(); // Prevent page scroll
      return;
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
  }

  public get isSaveDisabled(): boolean {
    return (
      this.authService.currentRole === Role.VIEWER ||
      this.raceState === RaceState.RACING
    );
  }

  // Menu State Helpers
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
    return this.raceState !== RaceState.HEAT_OVER;
  }

  isDriverFinished(
    hd: DriverHeatData,
    scoring: HeatScoring | null | undefined,
  ): boolean {
    if (!scoring || !hd) return false;

    if (scoring.finishMethod === FinishMethod.Lap) {
      return hd.lapCount >= scoring.finishValue;
    } else if (scoring.finishMethod === FinishMethod.Timed) {
      // In a timed race, a driver is finished if their total time is at or beyond the finish value.
      return hd.totalTime >= scoring.finishValue;
    }
    return false;
  }

  public getFlagUrl(flag: any): string {
    return this.raceFlagService.getFlagUrl(flag);
  }

  getCurrentFlagUrl(): string {
    return this.raceFlagService.getFlagUrl(this.raceFlagService.getFlagType());
  }

  getFullUrl(url: string | undefined): string {
    if (!url) return "";
    if (
      url.startsWith("http") ||
      url.startsWith("data:") ||
      url.startsWith("assets/")
    )
      return url;

    const serverUrl = this.dataService.serverUrl;
    if (!serverUrl || serverUrl.includes("undefined")) return url;

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
    return true;
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
    let selectedColumns = settings.racedayColumns;
    if (!selectedColumns || selectedColumns.length === 0) {
      selectedColumns = Settings.DEFAULT_COLUMNS;
    }

    // Filter columns based on race settings
    const race = this.raceService.getRace();
    const isFuelRace =
      (race?.fuel_options?.enabled || race?.digital_fuel_options?.enabled) ??
      false;
    const visibilityMap = settings.columnVisibility || {};

    selectedColumns = selectedColumns.filter((key) => {
      const visibility = visibilityMap[key] || ColumnVisibility.Always;
      if (visibility === ColumnVisibility.Always) return true;
      if (visibility === ColumnVisibility.FuelRaceOnly) return isFuelRace;
      if (visibility === ColumnVisibility.NonFuelRaceOnly) return !isFuelRace;
      return true;
    });

    const { resizingColumnKey, remainingWidth, fixedWidths } =
      this.resolveColumnLayout(selectedColumns, settings);

    this.columns = selectedColumns.map((key) => {
      const layout = (settings.columnLayouts || {})[key] || {
        [AnchorPoint.CenterCenter]: key,
      };
      const primaryProp =
        layout[AnchorPoint.CenterCenter] || Object.values(layout)[0] || key;
      const baseKey = primaryProp.split("_")[0];

      const labelKey = this.getLabelKeyForColumn(key, layout);
      const isResizing = key === resizingColumnKey;
      const width = isResizing ? remainingWidth : fixedWidths[baseKey] || 275;
      const anchor = settings.columnAnchors[key] || AnchorPoint.CenterCenter;

      const renderer = (v: any, hd: DriverHeatData, col: ColumnDefinition) => {
        return this.formatValue(primaryProp, v, hd, col);
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
          false,
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
    settings: any,
  ): {
    resizingColumnKey: string | null;
    remainingWidth: number;
    fixedWidths: { [key: string]: number };
  } {
    const nameKeys = ["driver.name", "driver.nickname"];
    const fixedWidths: { [key: string]: number } = {
      lapCount: 216,
      reactionTime: 330,
      lastLapTime: 330,
      medianLapTime: 330,
      averageLapTime: 330,
      bestLapTime: 330,
      totalTime: 330,
      gapLeader: 330,
      gapPosition: 330,
      "driver.name": 480,
      "driver.nickname": 480,
      "driver.avatarUrl": 120,
      "participant.team.name": 330,
      "participant.fuelLevel": 216,
      fuelCapacity: 216,
      fuelPercentage: 216,
      seed: 216,
      rankHeat: 216,
      rankOverall: 216,
      mph: 330,
      kph: 330,
      fph: 330,
      segmentTime: 330,
      flag: 120,
      imageset: 216,
    };

    let resizingColumnKey: string | null = null;
    for (const key of selectedColumns) {
      const layout = (settings.columnLayouts || {})[key] || {
        [AnchorPoint.CenterCenter]: key,
      };
      const containsName = Object.values(layout).some((v) =>
        nameKeys.includes((v as string).split("_")[0]),
      );
      if (containsName) {
        resizingColumnKey = key;
        break;
      }
    }
    if (!resizingColumnKey && selectedColumns.length > 0) {
      resizingColumnKey = selectedColumns[0];
    }

    let totalFixed = 0;
    selectedColumns.forEach((key) => {
      if (key === resizingColumnKey) return;
      const layout = (settings.columnLayouts || {})[key] || {
        [AnchorPoint.CenterCenter]: key,
      };
      const primaryProp =
        layout[AnchorPoint.CenterCenter] || Object.values(layout)[0] || key;
      const baseKey = (primaryProp as string).split("_")[0];
      totalFixed += fixedWidths[baseKey] || 275;
    });

    const numColumns = selectedColumns.length;
    const totalGapsWidth = numColumns > 1 ? (numColumns - 1) * 2 : 0;
    const remainingWidth = Math.max(300, 1920 - totalFixed - totalGapsWidth);

    return { resizingColumnKey, remainingWidth, fixedWidths };
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
      (this.track?.hasDigitalFuel()
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
  ): string {
    const ctx: FormatContext = {
      translate: (key) => this.translationService.translate(key),
      getRace: () => this.raceService.getRace(),
      getTrack: () => this.track,
      getDriverRanking: (objectId) => this.driverRankings.get(objectId),
      getFlagType: () => this.raceFlagService.getFlagType(),
      getFlagUrl: (flag) => this.getFlagUrl(flag),
      getFullUrl: (url) => this.getFullUrl(url),
      getImageSetUrl: (hd, prop) => this.getImageUrl(prop, hd),
    };
    return RacedayFormatUtils.formatValue(propertyName, value, hd, column, ctx);
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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="${color}" d="M7 10l5 5 5-5z"/></svg>`;
    const url = `url("data:image/svg+xml;charset=US-ASCII,${encodeURIComponent(svg)}")`;
    this.dropdownIconCache.set(color, url);
    return url;
  }

  isNameProperty(property: string): boolean {
    const baseKey = property.split("_")[0];
    return baseKey === "driver.name" || baseKey === "driver.nickname";
  }

  isTeam(hd: DriverHeatData | any): boolean {
    return !!(hd?.participant?.team || hd?.driver?.team);
  }

  getTeammates(hd: DriverHeatData | any): any[] {
    const team = hd.participant?.team || hd.driver?.team;
    if (team) {
      return this.allDrivers.filter((d) =>
        team.driverIds.includes(d.entity_id || d.id),
      );
    }
    return [];
  }

  onTeammateChange(hd: DriverHeatData, event: any) {
    const driverId = event.target.value;
    const lane = hd.laneIndex;
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
  }

  trackByLeaderboardEntry(index: number, entry: any) {
    return entry.entityId || entry.name;
  }

  isDriverSwapDisabled(hd: any): boolean {
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
        ? r?.restart_time || 5.0
        : r?.start_time || 5.0;

      this.countdownTotalLamps = Math.ceil(duration);
      this.updateCountdownLamps(duration);
    }

    // If RACING state came, set all lamps to green
    if (state === RaceState.RACING) {
      this.isRestarting = false;
      this.setAllLampsGo();
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

    // Show the number of lamps corresponding to the seconds elapsed (e.g., 1st sec = 1 lamp).
    // This synchronizes with the updated hardware LED logic (1, 2, 3, GO).
    const onCount = Math.max(
      1,
      this.countdownTotalLamps - Math.ceil(currentTime) + 1,
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

    this.countdownText = `${Math.ceil(currentTime)}`;
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
    if (col.propertyName === "lapCount") {
      const amount = event.shiftKey
        ? -this.LAP_ADJUSTMENT_AMOUNT
        : this.LAP_ADJUSTMENT_AMOUNT;
      this.updateUserLaps(hd, amount);
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
    this.countdownLamps = Array.from({ length: this.countdownTotalLamps }).map(
      () => ({
        url: url,
        state: "go",
      }),
    );
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

  saveLayout() {
    console.log("saveLayout called");
    const settings = this.settingsService.getSettings();
    settings.racedayLayout = this.layout;
    this.settingsService.saveSettings(settings);
    this.isLayoutCustomizing = false;
    this.cdr.detectChanges();
  }

  cancelLayoutCustomize() {
    const settings = this.settingsService.getSettings();
    if (settings.racedayLayout && settings.racedayLayout.widgets) {
      this.layout = JSON.parse(JSON.stringify(settings.racedayLayout));
    } else {
      this.layout = JSON.parse(JSON.stringify(Settings.DEFAULT_LAYOUT));
    }
    this.isLayoutCustomizing = false;
    this.cdr.detectChanges();
  }

  resetLayoutToDefaults() {
    this.layout = JSON.parse(JSON.stringify(Settings.DEFAULT_LAYOUT));
    const settings = this.settingsService.getSettings();
    settings.racedayLayout = this.layout;
    this.settingsService.saveSettings(settings);
    this.isLayoutCustomizing = false;
    this.cdr.detectChanges();
  }

  getUnusedWidgets(): WidgetType[] {
    const allTypes: WidgetType[] = [
      "menu-bar",
      "race-name",
      "heat-info",
      "track-name",
      "branding",
      "qr",
      "flag",
      "timer",
      "records",
      "leaderboard",
      "group-leaderboard",
      "lane-view",
      "on-deck",
      "next-heat",
    ];
    const used = new Set(this.layout?.widgets?.map((w) => w.widgetType) || []);
    return allTypes.filter((t) => !used.has(t));
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

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const scale = this.visualScale || 1;
    let x = (event.clientX - rect.left) / scale;
    let y = (event.clientY - rect.top) / scale;

    const isLeaderboardOrDeck =
      this.draggedWidgetType === "leaderboard" ||
      this.draggedWidgetType === "group-leaderboard" ||
      this.draggedWidgetType === "on-deck" ||
      this.draggedWidgetType === "next-heat";
    const newWidget: any = {
      id: "widget-" + Date.now(),
      widgetType: this.draggedWidgetType as any,
      x: Math.round(x),
      y: Math.round(y),
      width: isLeaderboardOrDeck ? 384 : 400,
      height:
        this.draggedWidgetType === "leaderboard" ||
        this.draggedWidgetType === "group-leaderboard"
          ? 239
          : 300,
      zIndex: this.getNextZIndex(),
    };

    if (!this.layout.widgets) this.layout.widgets = [];
    this.layout.widgets.push(newWidget);

    this.draggedWidgetType = null;
    this.cdr.detectChanges();
    this.layoutChanged.emit(this.layout);
  }

  getNextZIndex(): number {
    if (!this.layout?.widgets?.length) return 100;
    return Math.max(...this.layout.widgets.map((w: any) => w.zIndex || 0)) + 1;
  }

  bringToFront(id: string) {
    if (!this.layout?.widgets) return;
    const w = this.layout.widgets.find((w: any) => w.id === id);
    if (w) {
      w.zIndex = this.getNextZIndex();
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

  moveWidgetForward(id: string) {
    if (!this.layout?.widgets) return;
    this.normalizeZIndices();
    const sorted = [...this.layout.widgets].sort(
      (a, b) => (a.zIndex || 100) - (b.zIndex || 100),
    );
    const idx = sorted.findIndex((w: any) => w.id === id);
    if (idx !== -1 && idx < sorted.length - 1) {
      const current = sorted[idx];
      const next = sorted[idx + 1];
      const temp = current.zIndex;
      current.zIndex = next.zIndex;
      next.zIndex = temp;
      this.layoutChanged.emit(this.layout);
      this.cdr.detectChanges();
    }
  }

  moveWidgetBackward(id: string) {
    if (!this.layout?.widgets) return;
    this.normalizeZIndices();
    const sorted = [...this.layout.widgets].sort(
      (a, b) => (a.zIndex || 100) - (b.zIndex || 100),
    );
    const idx = sorted.findIndex((w: any) => w.id === id);
    if (idx > 0) {
      const current = sorted[idx];
      const prev = sorted[idx - 1];
      const temp = current.zIndex;
      current.zIndex = prev.zIndex;
      prev.zIndex = temp;
      this.layoutChanged.emit(this.layout);
      this.cdr.detectChanges();
    }
  }

  removeWidget(id: string) {
    if (!this.layout?.widgets) return;
    this.layout.widgets = this.layout.widgets.filter((w: any) => w.id !== id);
    this.layoutChanged.emit(this.layout);
  }

  snapToEdges(
    x: number,
    y: number,
    w: number,
    h: number,
    ignoreId: string,
    handle: string,
  ): { x: number; y: number; w: number; h: number } {
    return RacedayLayoutUtils.snapToEdges(
      this.layout?.widgets || [],
      x,
      y,
      w,
      h,
      ignoreId,
      handle,
    );
  }
}
