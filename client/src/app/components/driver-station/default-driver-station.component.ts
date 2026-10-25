import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  effect,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { RacedayFlagComponent } from "@app/components/raceday/components/raceday-flag/raceday-flag.component";
import { RacedayLaneColumnComponent } from "@app/components/raceday/components/raceday-lane-column/raceday-lane-column.component";
import { RacedayProgressGaugeComponent } from "@app/components/raceday/components/raceday-progress-gauge/raceday-progress-gauge.component";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import { DataService } from "@app/data.service";
import { FinishMethod } from "@app/models/heat_scoring";
import { Race } from "@app/models/race";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { Track } from "@app/models/track";
import { RaceFlag, RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { AudioAssociation, AudioService } from "@app/services/audio.service";
import { AuthService } from "@app/services/auth.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { FuelAudioTracker } from "@app/utils/fuel-audio-tracker";
import { ViewerRaceEndedHandler } from "@app/utils/viewer-race-ended-handler";

import { formatDriverStationValue } from "./driver-station-format.helper";
import { DriverStationLapAudioHandler } from "./driver-station-lap-audio-handler";
import { DriverStationThemeAudioHandler } from "./driver-station-theme-audio-handler";
import { DriverStationTimeAudioHandler } from "./driver-station-time-audio-handler";
import {
  DRIVER_STATION_BEST_LAP_TIME_WIDGET,
  DRIVER_STATION_FLAG_WIDGET,
  DRIVER_STATION_FUEL_PROGRESS_WIDGET,
  DRIVER_STATION_GAP_LEADER_WIDGET,
  DRIVER_STATION_HEAT_RANK_WIDGET,
  DRIVER_STATION_LANE_NUMBER_WIDGET,
  DRIVER_STATION_LAP_COUNT_WIDGET,
  DRIVER_STATION_LAST_LAP_TIME_WIDGET,
  DRIVER_STATION_NICKNAME_WIDGET,
  DRIVER_STATION_OVERALL_RANK_WIDGET,
  DRIVER_STATION_PROGRESS_WIDGET,
} from "./driver-station-widget-configs";

@Component({
  standalone: true,
  selector: "app-default-driver-station",
  templateUrl: "./default-driver-station.component.html",
  styleUrls: ["./default-driver-station.component.css"],
  providers: [AudioService],
  imports: [
    AcknowledgementModalComponent,
    BrowserNavigationComponent,
    RacedayProgressGaugeComponent,
    RacedayLaneColumnComponent,
    RacedayFlagComponent,
  ],
})
export class DefaultDriverStationComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  public translationService = inject(TranslationService);
  private decimalPipe = new DecimalPipe("en-US");
  protected viewerRaceEndedHandler!: ViewerRaceEndedHandler;

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
  get raceHasEnded(): boolean {
    return this.viewerRaceEndedHandler?.raceHasEnded ?? false;
  }
  set raceHasEnded(v: boolean) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.raceHasEnded = v;
  }

  onAcknowledgeModal() {
    const raceHasEnded = this.raceHasEnded;
    this.showAckModal = false;
    if (raceHasEnded) {
      const returnUrl =
        this.route.snapshot.queryParamMap.get("returnUrl") || "/raceday-setup";
      this.router.navigateByUrl(returnUrl);
    }
  }

  // ... existing code ...
  private subscriptions: Subscription[] = [];

  inputLaneIndex = input<number>();

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private raceService: RaceService,
    private raceConnectionService: RaceConnectionService,
    private raceFlagService: RaceFlagService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
    private audioService: AudioService = inject(AudioService),
    private themeService: ThemeService = inject(ThemeService),
  ) {
    this.themeAudioHandler = new DriverStationThemeAudioHandler({
      themeService: this.themeService,
      audioService: this.audioService,
      dataService: this.dataService,
      getAssets: () => this.assets,
    });
    this.fuelAudioTracker = new FuelAudioTracker(this.audioService, (urlOrId) =>
      this.themeAudioHandler.resolveAssetPlayableUrl(urlOrId),
    );
    this.lapAudioHandler = new DriverStationLapAudioHandler({
      audioService: this.audioService,
      themeService: this.themeService,
      resolvePlayableUrl: (urlOrId) =>
        this.themeAudioHandler.resolveAssetPlayableUrl(urlOrId),
      playThemedSound: (slotKey, context, association) =>
        this.playThemedSound(slotKey, context, association),
      getRace: () => this.race,
      getHeat: () => this.heat,
      getAssets: () => this.assets,
      getDriverData: () => this.driverData,
      getLaneIndex: () => this.laneIndex,
    });
    this.timeAudioHandler = new DriverStationTimeAudioHandler({
      themeService: this.themeService,
      getRace: () => this.race,
      getAssets: () => this.assets,
      playThemedSound: (slotKey, context, association) =>
        this.playThemedSound(slotKey, context, association),
      playAudioFromSet: (slotKey, timeSeconds, association, triggerMode) =>
        this.playAudioFromSet(slotKey, timeSeconds, association, triggerMode),
    });
    effect(() => {
      const val = this.inputLaneIndex();
      if (val !== undefined) {
        this.laneIndex = val;
        this.loadRaceData();
      }
    });
  }

  protected laneIndex: number = 0;
  protected driverData?: DriverHeatData;
  protected race?: Race;
  protected track?: Track;
  protected heat?: Heat;
  protected time: number = 0;
  protected standingsPosition: number = 0;
  protected overallPosition: number = 0;
  protected raceState: RaceState = RaceState.UNKNOWN_STATE;
  protected hasRacedInCurrentHeat: boolean = false;
  private fuelAudioTracker: FuelAudioTracker;
  private themeAudioHandler: DriverStationThemeAudioHandler;
  private lapAudioHandler: DriverStationLapAudioHandler;
  private timeAudioHandler: DriverStationTimeAudioHandler;
  private lastPlayedCountdownSecond: number = -1;
  private get playedSecondsLeft() {
    return this.timeAudioHandler.playedSecondsLeft;
  }
  private get playedSecondsElapsed() {
    return this.timeAudioHandler.playedSecondsElapsed;
  }
  private get playedLapsLeft() {
    return this.lapAudioHandler.playedLapsLeft;
  }
  private get playedLapsElapsed() {
    return this.lapAudioHandler.playedLapsElapsed;
  }
  private get playedAutoStart() {
    return this.timeAudioHandler.playedAutoStart;
  }
  private get playedAutoStartElapsed() {
    return this.timeAudioHandler.playedAutoStartElapsed;
  }
  private get playedAutoAdvance() {
    return this.timeAudioHandler.playedAutoAdvance;
  }
  private get playedAutoAdvanceElapsed() {
    return this.timeAudioHandler.playedAutoAdvanceElapsed;
  }
  private previousAutoStartRemaining = 0;
  private previousAutoAdvanceRemaining = 0;
  private get leaderLaps() {
    return this.lapAudioHandler.leaderLaps;
  }
  private set leaderLaps(v: number) {
    this.lapAudioHandler.leaderLaps = v;
  }
  private get playedHalfway() {
    return (
      this.lapAudioHandler.playedHalfway || this.timeAudioHandler.playedHalfway
    );
  }
  private set playedHalfway(v: boolean) {
    this.lapAudioHandler.playedHalfway = v;
    this.timeAudioHandler.playedHalfway = v;
  }
  private previousRaceState: RaceState = RaceState.UNKNOWN_STATE;
  private isRestarting: boolean = false;
  private assets: any[] = [];

  ngOnInit() {
    this.initViewerAndAssets();
    this.initRouteAndHeat();
    this.initRaceSubscriptions();
  }

  private initViewerAndAssets(): void {
    this.viewerRaceEndedHandler = new ViewerRaceEndedHandler(
      this.dataService,
      this.authService,
      this.cdr,
      {
        onlyForViewer: true,
        skipRaceStartedAck: true,
        onRaceStarted: () => {
          this.loadRaceData();
        },
      },
    );
    this.viewerRaceEndedHandler.startListening();

    this.updateAudioRelevance();

    if (this.dataService.loadedAssets) {
      this.assets = this.dataService.loadedAssets;
      this.preloadCountdownAudio();
    }
    this.subscriptions.push(
      this.dataService.listAssets().subscribe({
        next: (assets) => {
          this.assets = assets || [];
          this.preloadCountdownAudio();
        },
      }),
    );

    if (this.themeService.activeTheme$) {
      this.subscriptions.push(
        this.themeService.activeTheme$.subscribe(() => {
          this.preloadCountdownAudio();
        }),
      );
    }
  }

  private initRouteAndHeat(): void {
    this.route.params.subscribe((params) => {
      if (this.inputLaneIndex() !== undefined) {
        this.laneIndex = this.inputLaneIndex()!;
      } else if (params["lane"]) {
        this.laneIndex = +params["lane"] - 1;
      }
      this.loadRaceData();
    });

    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.raceService.currentHeat$.subscribe(() => {
        this.loadRaceData();
        this.hasRacedInCurrentHeat = false;
        this.cdr.detectChanges();
      }),
    );
  }

  private initRaceSubscriptions(): void {
    this.subscriptions.push(
      this.raceConnectionService.raceTime$.subscribe((raceTime) => {
        this.handleRaceTime(raceTime);
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.laps$.subscribe((lap) => {
        if (this.heat && lap && lap.objectId) {
          const driverData = this.heat.heatDrivers.find(
            (d) => d.objectId === lap.objectId,
          );
          if (driverData) {
            this.lapAudioHandler.handleLapEvent(lap, driverData);
          }
        }
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        if (state) {
          this.handleRaceStateChange(state);
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.carData$.subscribe((carData) => {
        if (carData && carData.lane === this.laneIndex) {
          const currentFuel =
            carData.fuelLevel != null ? Number(carData.fuelLevel) : null;
          const isRefueling = !!carData.isRefueling;
          const canPlayAudio =
            this.raceState === RaceState.RACING ||
            this.raceState === RaceState.PAUSED;
          this.fuelAudioTracker.updateLaneFuel(
            this.laneIndex,
            currentFuel,
            isRefueling,
            this.heat,
            this.hasRacedInCurrentHeat,
            this.race,
            this.track,
            this.assets,
            canPlayAudio,
          );
        }
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.standingsUpdate$.subscribe((update) => {
        if (this.heat && update && update.updates) {
          update.updates.forEach((u) => {
            const teamId = this.driverData?.participant?.team?.entity_id;
            const isMatch =
              u.objectId === this.driverData?.objectId ||
              (teamId && u.objectId === teamId);
            if (isMatch) {
              this.standingsPosition = u.rank || 0;
            }
          });
          this.cdr.detectChanges();
        }
      }),
    );

    this.subscriptions.push(
      this.raceService.participants$.subscribe((participants) => {
        if (participants && this.driverData) {
          this.calculateOverallPosition();
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.raceFlag$.subscribe(() => {
        this.cdr.detectChanges();
      }),
    );
  }

  private handleRaceTime(raceTime: any): void {
    this.time = raceTime.time || 0;
    const autoStart = raceTime.autoStartRemaining || 0;
    if (
      (this.raceState === RaceState.NOT_STARTED ||
        this.raceState === RaceState.UNKNOWN_STATE ||
        this.raceState === RaceState.STARTING) &&
      autoStart > 0
    ) {
      this.timeAudioHandler.checkAutoStartAnnouncements(
        autoStart,
        this.previousAutoStartRemaining,
      );
    } else if (autoStart <= 0) {
      this.playedAutoStart.clear();
      this.playedAutoStartElapsed.clear();
    }
    this.previousAutoStartRemaining = autoStart;

    const autoAdvance = raceTime.autoAdvanceRemaining || 0;
    if (
      (this.raceState === RaceState.HEAT_OVER ||
        this.raceState === RaceState.UNKNOWN_STATE) &&
      autoAdvance > 0
    ) {
      this.timeAudioHandler.checkAutoAdvanceAnnouncements(
        autoAdvance,
        this.previousAutoAdvanceRemaining,
      );
    } else if (autoAdvance <= 0) {
      this.playedAutoAdvance.clear();
      this.playedAutoAdvanceElapsed.clear();
    }
    this.previousAutoAdvanceRemaining = autoAdvance;

    if (this.raceState === RaceState.STARTING) {
      this.handleStartingCountdown();
    } else if (this.raceState === RaceState.RACING) {
      this.timeAudioHandler.checkRaceTimeAnnouncements(this.time);
    }
    this.cdr.detectChanges();
  }

  private handleStartingCountdown(): void {
    const currentSecond = Math.ceil(this.time);
    const r = this.race;
    const duration = this.isRestarting
      ? (r?.restart_time ?? r?.start_time)
      : r?.start_time;
    const totalLamps =
      duration != null
        ? Math.ceil(duration)
        : this.time > 0
          ? Math.ceil(this.time)
          : 0;
    if (
      currentSecond <= totalLamps &&
      currentSecond <= 5 &&
      currentSecond >= 1 &&
      currentSecond !== this.lastPlayedCountdownSecond
    ) {
      const played = this.playAudioFromSet(
        THEME_SLOT_KEYS.AUDIO_COUNTDOWN,
        currentSecond,
        { widgetType: "countdown" },
      );
      if (played) {
        this.lastPlayedCountdownSecond = currentSecond;
      }
    }
  }

  private handleRaceStateChange(state: RaceState): void {
    const previousState = this.previousRaceState;
    this.previousRaceState = state;
    this.raceState = state;

    if (
      state === RaceState.NOT_STARTED ||
      state === RaceState.HEAT_OVER ||
      state === RaceState.RACE_OVER
    ) {
      if (state === RaceState.NOT_STARTED) {
        this.hasRacedInCurrentHeat = false;
      }
      this.timeAudioHandler.reset();
      this.lapAudioHandler.reset();
      this.previousAutoStartRemaining = 0;
      this.previousAutoAdvanceRemaining = 0;
      this.fuelAudioTracker.reset(
        this.heat,
        this.hasRacedInCurrentHeat,
        this.race,
        this.track,
      );
      this.audioService.reset();
    }

    if (state === RaceState.PAUSED && previousState === RaceState.RACING) {
      this.playThemedSound(THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG, undefined, {
        widgetType: "flag",
      });
    }

    if (previousState !== RaceState.UNKNOWN_STATE) {
      if (state === RaceState.HEAT_OVER) {
        this.playThemedSound(THEME_SLOT_KEYS.AUDIO_HEAT_OVER, undefined, {
          widgetType: "flag",
        });
      } else if (state === RaceState.RACE_OVER) {
        this.playThemedSound(THEME_SLOT_KEYS.AUDIO_RACE_OVER, undefined, {
          widgetType: "flag",
        });
      }
    }

    if (state === RaceState.STARTING) {
      this.isRestarting = previousState === RaceState.PAUSED;
      this.audioService.stopVoice();
      this.lastPlayedCountdownSecond = -1;
    }

    if (state === RaceState.RACING) {
      this.isRestarting = false;
      this.hasRacedInCurrentHeat = true;
      if (previousState !== RaceState.UNKNOWN_STATE) {
        this.playAudioFromSet(THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 0, {
          widgetType: "countdown",
        });
      }
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.viewerRaceEndedHandler) {
      this.viewerRaceEndedHandler.stopListening();
    }
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  @HostListener("window:pagehide")
  onPageHide() {
    this.raceConnectionService.disconnect();
  }

  get isEmptyDriver(): boolean {
    return RacedayFormatUtils.isEmptyDriver(this.driverData);
  }

  private loadRaceData() {
    this.race = this.raceService.getRace();
    if (this.race) {
      this.preloadCountdownAudio();
      this.track = this.race.track;
      this.heat = this.raceService.getCurrentHeat();
      if (this.heat) {
        this.driverData =
          this.heat.heatDrivers.find((d) => d.laneIndex === this.laneIndex) ||
          this.heat.heatDrivers[this.laneIndex];

        if (this.isEmptyDriver) {
          this.standingsPosition = 0;
          this.overallPosition = 0;
          return;
        }

        // Update standings position from heat standings if available
        if (this.driverData && this.heat.standings) {
          const teamEntityId = this.driverData.participant?.team?.entity_id;
          const index = this.heat.standings.findIndex(
            (id) =>
              id === this.driverData?.objectId ||
              (teamEntityId && id === teamEntityId),
          );
          if (index >= 0) {
            this.standingsPosition = index + 1;
          }
        }

        // Calculate overall position immediately if participants available
        this.calculateOverallPosition();
        this.updateAudioRelevance();
      }
    }
  }

  private calculateOverallPosition(): void {
    if (this.isEmptyDriver) {
      this.overallPosition = 0;
      this.cdr.detectChanges();
      return;
    }
    const participants = this.raceService.getParticipants();
    if (participants && this.driverData) {
      const teamEntityId = this.driverData.participant?.team?.entity_id;
      const driverEntityId =
        this.driverData.actualDriver?.entity_id ||
        this.driverData.participant?.driver?.entity_id;

      const index = participants.findIndex((p: any) => {
        if (teamEntityId && p.team?.entity_id === teamEntityId) {
          return true;
        }
        return (
          driverEntityId &&
          p.driver?.entity_id &&
          p.driver?.entity_id === driverEntityId
        );
      });

      if (index >= 0) {
        this.overallPosition = index + 1;
      } else {
        this.overallPosition = 0;
      }
      this.cdr.detectChanges();
    }
  }

  get isFuelRace(): boolean {
    return (
      this.race?.fuel_options?.enabled ||
      this.race?.digital_fuel_options?.enabled ||
      false
    );
  }

  get finishMethod(): FinishMethod {
    return this.race?.heat_scoring?.finishMethod || FinishMethod.Lap;
  }

  get finishValue(): number {
    return this.race?.heat_scoring?.finishValue || 0;
  }

  get progressPercentage(): number {
    if (!this.finishValue || this.isEmptyDriver) return 0;

    if (this.finishMethod === FinishMethod.Timed) {
      // Show elapsed time - starts empty and fills up
      return Math.min(100, (this.time / this.finishValue) * 100);
    } else {
      // Lap based - starts empty and fills up as laps complete
      const laps = this.driverData?.lapCount || 0;
      return Math.min(100, (laps / this.finishValue) * 100);
    }
  }

  get fuelPercentage(): number {
    if (this.isEmptyDriver) return 0;
    const fuel = this.driverData?.participant?.fuelLevel;
    if (fuel !== null && fuel !== undefined) return fuel;
    if (
      this.driverData?.initialFuelLevel != null &&
      this.driverData.initialFuelLevel > 0
    ) {
      return this.driverData.initialFuelLevel;
    }
    return 0;
  }

  get lane(): import("src/app/models/lane").Lane | undefined {
    return this.track?.lanes?.[this.laneIndex];
  }

  get foregroundColor(): string {
    return this.lane?.foreground_color || "#000000";
  }

  get raceStateColor(): string {
    const flag = this.driverData?.flag || RaceFlag.UNKNOWN_FLAG;

    if (flag === RaceFlag.UNKNOWN_FLAG || flag === 0) {
      return this.raceFlagService.getFlagColor();
    }

    return this.raceFlagService.getFlagTypeForFlag(flag);
  }

  get backgroundColor(): string {
    return this.lane?.background_color || "#ffffff";
  }

  get hasLapData(): boolean {
    if (!this.driverData || this.isEmptyDriver) return false;
    const hd = this.driverData;
    const hasReactionTime = hd.reactionTime > 0;
    const hasRealLap = hd.lapTimes && hd.lapTimes.length > 0;
    const hasAdjustment =
      (hd.userLaps !== undefined && hd.userLaps !== 0) ||
      (hd.autoCalculatedLaps !== undefined && hd.autoCalculatedLaps !== 0) ||
      (hd.penaltyLaps !== undefined && hd.penaltyLaps !== 0) ||
      (hd.adjustedLapCount !== undefined && hd.adjustedLapCount !== 0);
    return hasReactionTime || hasRealLap || hasAdjustment;
  }

  get activeLaneIndex(): number {
    return this.laneIndex;
  }

  get heatDrivers(): DriverHeatData[] {
    return this.heat?.heatDrivers || (this.driverData ? [this.driverData] : []);
  }

  get driverRankings(): Map<string, number> {
    const map = new Map<string, number>();
    if (this.driverData?.objectId && this.standingsPosition) {
      map.set(this.driverData.objectId, this.standingsPosition);
    }
    return map;
  }

  getDriverRanking(id: string): number | undefined {
    if (
      this.standingsPosition &&
      (id === this.driverData?.objectId ||
        id === (this.driverData?.participant as any)?.id ||
        id === (this.driverData?.participant as any)?.entity_id)
    ) {
      return this.standingsPosition;
    }
    return undefined;
  }

  getDriverOverallRanking(_hd: any): number | undefined {
    return this.overallPosition || undefined;
  }

  formatValue(
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column?: any,
    anchor?: string,
    widgetSettings?: any,
  ): string {
    return formatDriverStationValue(
      {
        isEmptyDriver: this.isEmptyDriver,
        standingsPosition: this.standingsPosition,
        overallPosition: this.overallPosition,
        laneIndex: this.laneIndex,
        hasLapData: this.hasLapData,
        driverData: this.driverData,
        translationService: this.translationService,
        decimalPipe: this.decimalPipe,
        race: this.race,
        track: this.track,
        raceFlagService: this.raceFlagService,
        raceState: this.raceState,
        getDriverRanking: (id: string) => this.getDriverRanking(id),
        getDriverOverallRanking: (d: any) => this.getDriverOverallRanking(d),
      },
      propertyName,
      value,
      hd,
      column,
      anchor,
      widgetSettings,
    );
  }

  readonly progressWidget: AbsoluteWidgetNode = DRIVER_STATION_PROGRESS_WIDGET;
  readonly nicknameWidget: AbsoluteWidgetNode = DRIVER_STATION_NICKNAME_WIDGET;
  readonly laneNumberWidget: AbsoluteWidgetNode =
    DRIVER_STATION_LANE_NUMBER_WIDGET;
  readonly heatRankWidget: AbsoluteWidgetNode = DRIVER_STATION_HEAT_RANK_WIDGET;
  readonly overallRankWidget: AbsoluteWidgetNode =
    DRIVER_STATION_OVERALL_RANK_WIDGET;
  readonly lapCountWidget: AbsoluteWidgetNode = DRIVER_STATION_LAP_COUNT_WIDGET;
  readonly lastLapTimeWidget: AbsoluteWidgetNode =
    DRIVER_STATION_LAST_LAP_TIME_WIDGET;
  readonly gapLeaderWidget: AbsoluteWidgetNode =
    DRIVER_STATION_GAP_LEADER_WIDGET;
  readonly bestLapTimeWidget: AbsoluteWidgetNode =
    DRIVER_STATION_BEST_LAP_TIME_WIDGET;
  readonly flagWidget: AbsoluteWidgetNode = DRIVER_STATION_FLAG_WIDGET;
  readonly fuelProgressWidget: AbsoluteWidgetNode =
    DRIVER_STATION_FUEL_PROGRESS_WIDGET;

  private updateAudioRelevance(): void {
    const allowedLanes = new Set<number>();
    if (this.laneIndex != null && this.laneIndex >= 0) {
      allowedLanes.add(this.laneIndex);
    }
    const allowedDriverIds = new Set<string>();
    const driver =
      this.driverData?.actualDriver ||
      this.driverData?.participant?.driver ||
      (this.driverData?.driver as any)?.driver ||
      this.driverData?.driver;
    const driverId =
      (driver as any)?.entity_id ||
      (driver as any)?.id ||
      (driver as any)?.objectId;
    if (driverId) {
      allowedDriverIds.add(driverId);
    }

    this.audioService.setRelevanceFilter({
      driverAudioMode: "scoped",
      allowedLanes,
      allowedDriverIds,
      allowCountdown: true,
      allowTimer: true,
      allowRaceState: true,
    });
  }

  private playThemedSound(
    slotKey: string,
    context?: any,
    association?: AudioAssociation,
  ): void {
    this.themeAudioHandler.playThemedSound(slotKey, context, association);
  }

  private playAudioFromSet(
    slotKey: string,
    timeSeconds: number,
    association?: AudioAssociation,
    triggerMode: string = "remaining",
  ): boolean {
    return this.themeAudioHandler.playAudioFromSet(
      slotKey,
      timeSeconds,
      association,
      triggerMode,
    );
  }

  private preloadCountdownAudio(): void {
    this.themeAudioHandler.preloadCountdownAudio();
  }
}
