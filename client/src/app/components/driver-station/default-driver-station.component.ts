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
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import { DataService } from "@app/data.service";
import { AudioConfig } from "@app/models/driver";
import { FinishMethod } from "@app/models/heat_scoring";
import { Race } from "@app/models/race";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceFlag, RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import {
  AudioAssociation,
  AudioPriority,
  AudioService,
} from "@app/services/audio.service";
import { AuthService } from "@app/services/auth.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { ThemeService } from "@app/services/theme.service";
import { FuelAudioTracker } from "@app/utils/fuel-audio-tracker";
import { ViewerRaceEndedHandler } from "@app/utils/viewer-race-ended-handler";

import { DriverStationLapAudioHandler } from "./driver-station-lap-audio-handler";

@Component({
  standalone: true,
  selector: "app-default-driver-station",
  templateUrl: "./default-driver-station.component.html",
  styleUrls: ["./default-driver-station.component.css"],
  providers: [AudioService],
  imports: [
    DecimalPipe,
    TranslatePipe,
    AcknowledgementModalComponent,
    BrowserNavigationComponent,
  ],
})
export class DefaultDriverStationComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
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
    this.fuelAudioTracker = new FuelAudioTracker(this.audioService, (urlOrId) =>
      this.resolveAssetPlayableUrl(urlOrId),
    );
    this.lapAudioHandler = new DriverStationLapAudioHandler({
      audioService: this.audioService,
      themeService: this.themeService,
      resolvePlayableUrl: (urlOrId) => this.resolveAssetPlayableUrl(urlOrId),
      playThemedSound: (slotKey, context, association) =>
        this.playThemedSound(slotKey, context, association),
      getRace: () => this.race,
      getHeat: () => this.heat,
      getAssets: () => this.assets,
      getDriverData: () => this.driverData,
      getLaneIndex: () => this.laneIndex,
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
  private lapAudioHandler: DriverStationLapAudioHandler;
  private lastPlayedCountdownSecond: number = -1;
  private playedSecondsLeft = new Set<number>();
  private playedSecondsElapsed = new Set<number>();
  private get playedLapsLeft() {
    return this.lapAudioHandler.playedLapsLeft;
  }
  private get playedLapsElapsed() {
    return this.lapAudioHandler.playedLapsElapsed;
  }
  private playedAutoStart = new Set<number>();
  private playedAutoStartElapsed = new Set<number>();
  private playedAutoAdvance = new Set<number>();
  private playedAutoAdvanceElapsed = new Set<number>();
  private previousAutoStartRemaining = 0;
  private previousAutoAdvanceRemaining = 0;
  private get leaderLaps() {
    return this.lapAudioHandler.leaderLaps;
  }
  private set leaderLaps(v: number) {
    this.lapAudioHandler.leaderLaps = v;
  }
  private get playedHalfway() {
    return this.lapAudioHandler.playedHalfway;
  }
  private set playedHalfway(v: boolean) {
    this.lapAudioHandler.playedHalfway = v;
  }
  private previousRaceState: RaceState = RaceState.UNKNOWN_STATE;
  private assets: any[] = [];

  /* eslint-disable max-lines-per-function */
  ngOnInit() {
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
    }
    this.subscriptions.push(
      this.dataService.listAssets().subscribe({
        next: (assets) => {
          this.assets = assets || [];
        },
      }),
    );

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

    this.subscriptions.push(
      this.raceConnectionService.raceTime$.subscribe((raceTime) => {
        this.time = raceTime.time || 0;
        const autoStart = raceTime.autoStartRemaining || 0;
        if (
          (this.raceState === RaceState.NOT_STARTED ||
            this.raceState === RaceState.UNKNOWN_STATE ||
            this.raceState === RaceState.STARTING) &&
          autoStart > 0
        ) {
          this.checkAutoStartAnnouncements(
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
          this.checkAutoAdvanceAnnouncements(
            autoAdvance,
            this.previousAutoAdvanceRemaining,
          );
        } else if (autoAdvance <= 0) {
          this.playedAutoAdvance.clear();
          this.playedAutoAdvanceElapsed.clear();
        }
        this.previousAutoAdvanceRemaining = autoAdvance;

        if (this.raceState === RaceState.STARTING) {
          const currentSecond = Math.ceil(this.time);
          const r = this.race;
          const duration = r?.start_time ?? 5.0;
          const totalLamps = Math.ceil(duration);
          if (
            currentSecond <= totalLamps &&
            currentSecond <= 5 &&
            currentSecond >= 1 &&
            currentSecond !== this.lastPlayedCountdownSecond
          ) {
            this.lastPlayedCountdownSecond = currentSecond;
            this.playAudioFromSet(
              THEME_SLOT_KEYS.AUDIO_COUNTDOWN,
              currentSecond,
              { widgetType: "countdown" },
            );
          }
        } else if (this.raceState === RaceState.RACING) {
          this.checkRaceTimeAnnouncements(this.time);
        }
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.laps$.subscribe((lap) => {
        if (this.heat && lap && lap.objectId) {
          const driverData = this.heat.heatDrivers.find(
            (d) => d.objectId === lap.objectId,
          );
          if (driverData) {
            this.handleLapEvent(lap, driverData);
          }
        }
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        if (state) {
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
            this.playedSecondsLeft.clear();
            this.playedSecondsElapsed.clear();
            this.playedLapsLeft.clear();
            this.playedLapsElapsed.clear();
            this.playedAutoStart.clear();
            this.playedAutoStartElapsed.clear();
            this.playedAutoAdvance.clear();
            this.playedAutoAdvanceElapsed.clear();
            this.previousAutoStartRemaining = 0;
            this.previousAutoAdvanceRemaining = 0;
            this.leaderLaps = 0;
            this.playedHalfway = false;
            this.fuelAudioTracker.reset(
              this.heat,
              this.hasRacedInCurrentHeat,
              this.race,
              this.track,
            );
            this.audioService.reset();
          }

          if (
            state === RaceState.PAUSED &&
            previousState === RaceState.RACING
          ) {
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
            this.audioService.stopVoice();
            this.lastPlayedCountdownSecond = -1;
          }

          if (state === RaceState.RACING) {
            this.hasRacedInCurrentHeat = true;
            if (previousState !== RaceState.UNKNOWN_STATE) {
              this.playAudioFromSet(THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 0, {
                widgetType: "countdown",
              });
            }
          }
          this.cdr.detectChanges();
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
  ) {
    const config = this.themeService.resolveAudioConfig(slotKey);
    if (!config || config.type === "none") return;

    if (config.type === "tts") {
      if (!config.text?.trim()) return;
    } else {
      if (!config.url?.trim()) return;
    }

    let playableUrl: string | undefined = config.url;
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

    let priority: AudioPriority = "normal";
    if (
      slotKey === THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG ||
      slotKey === THEME_SLOT_KEYS.AUDIO_HEAT_OVER ||
      slotKey === THEME_SLOT_KEYS.AUDIO_RACE_OVER ||
      slotKey === THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME ||
      slotKey === THEME_SLOT_KEYS.AUDIO_DRIFT_LAP
    ) {
      priority = "urgent";
    }

    let defaultAssoc = association;
    if (!defaultAssoc) {
      if (
        slotKey === THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG ||
        slotKey === THEME_SLOT_KEYS.AUDIO_HEAT_OVER ||
        slotKey === THEME_SLOT_KEYS.AUDIO_RACE_OVER
      ) {
        defaultAssoc = { widgetType: "flag" };
      } else if (
        slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT ||
        slotKey === THEME_SLOT_KEYS.AUDIO_LAPS_LEFT ||
        slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY ||
        slotKey === THEME_SLOT_KEYS.AUDIO_AUTO_START ||
        slotKey === THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE
      ) {
        defaultAssoc = { widgetType: "timer" };
      }
    }

    this.audioService.playCallout(
      config,
      priority,
      context,
      playableUrl,
      defaultAssoc,
    );
  }

  private getAudioFromSetEntry(
    slotKey: string,
    timeSeconds: number,
    triggerMode: string = "remaining",
  ): { config: AudioConfig; playableUrl?: string } | null {
    const config = this.themeService.resolveAudioConfig(slotKey);
    if (!config || config.type !== "audio_set") return null;

    const assetId = config.url;
    if (!assetId) return null;

    const asset = (this.assets || []).find(
      (a) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId,
    );
    if (!asset || asset.type !== "audio_set") return null;

    const entry = asset.audioEntries?.find((e: any) => {
      const val = e.timeSeconds != null ? e.timeSeconds : e.percentage;
      const mode = e.triggerMode || e.trigger_mode || "remaining";
      return (
        val != null &&
        Math.abs(Number(val) - timeSeconds) < 0.1 &&
        mode === triggerMode
      );
    });
    if (!entry) return null;

    const entryType = entry.type || "preset";
    if (entryType === "none") return null;

    const playableUrl = entry.url ? this.getFullUrl(entry.url) : undefined;
    return {
      config: {
        type: entryType,
        url: playableUrl,
        text: entry.text || undefined,
      },
      playableUrl,
    };
  }

  private playAudioFromSet(
    slotKey: string,
    timeSeconds: number,
    association?: AudioAssociation,
    triggerMode: string = "remaining",
  ) {
    const defaultAssoc =
      association ??
      (slotKey === THEME_SLOT_KEYS.AUDIO_COUNTDOWN
        ? { widgetType: "countdown" }
        : { widgetType: "timer" });

    const entryItem = this.getAudioFromSetEntry(
      slotKey,
      timeSeconds,
      triggerMode,
    );
    if (entryItem) {
      if (slotKey === THEME_SLOT_KEYS.AUDIO_COUNTDOWN) {
        if (entryItem.config.type === "tts") {
          this.audioService.playCallout(
            { type: "tts", text: entryItem.config.text },
            "normal",
            undefined,
            undefined,
            defaultAssoc,
          );
        } else {
          this.audioService.playSfx(entryItem.playableUrl, defaultAssoc);
        }
      } else {
        this.audioService.playCallout(
          entryItem.config,
          "normal",
          undefined,
          entryItem.playableUrl,
          defaultAssoc,
        );
      }
    }
  }

  private getSecondsLeftThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = this.themeService.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
    );
    if (config?.url) {
      const asset = (this.assets || []).find(
        (a) =>
          a.model?.entityId === config.url ||
          a.entity_id === config.url ||
          a._id === config.url,
      );
      if (asset?.audioEntries && asset.audioEntries.length > 0) {
        const filtered = asset.audioEntries.filter((e: any) => {
          const mode = e.triggerMode || e.trigger_mode || "remaining";
          return mode === triggerMode;
        });
        if (filtered.length > 0) {
          return filtered
            .map((e: any) =>
              Math.round(e.timeSeconds != null ? e.timeSeconds : e.percentage),
            )
            .filter((t: number) => !isNaN(t) && t >= 0)
            .filter(
              (t: number, index: number, self: number[]) =>
                self.indexOf(t) === index,
            )
            .sort((a: number, b: number) =>
              triggerMode === "elapsed" ? a - b : b - a,
            );
        }
      }
    }
    return triggerMode === "remaining"
      ? [300, 240, 180, 120, 60, 30, 25, 20, 15, 10, 5]
      : [];
  }

  private checkRaceTimeAnnouncements(currentTime: number) {
    const scoring = this.race?.heat_scoring;
    if (!scoring || scoring.finishMethod !== FinishMethod.Timed) return;

    const totalDuration = scoring.finishValue;
    if (totalDuration <= 0) return;

    const halfwayThreshold = totalDuration / 2;
    if (currentTime <= halfwayThreshold && !this.playedHalfway) {
      this.playThemedSound(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
        undefined,
        { widgetType: "timer" },
      );
      this.playedHalfway = true;
    }

    // Remaining thresholds
    const remainingThresholds = this.getSecondsLeftThresholds("remaining");
    for (const threshold of remainingThresholds) {
      if (currentTime <= threshold && !this.playedSecondsLeft.has(threshold)) {
        if (Math.abs(threshold - totalDuration) < 0.1) continue;

        this.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
          threshold,
          { widgetType: "timer" },
          "remaining",
        );
        this.playedSecondsLeft.add(threshold);
      }
    }

    // Elapsed thresholds
    const elapsed = totalDuration - currentTime;
    const elapsedThresholds = this.getSecondsLeftThresholds("elapsed");
    for (const threshold of elapsedThresholds) {
      if (elapsed >= threshold && !this.playedSecondsElapsed.has(threshold)) {
        if (threshold <= 0 || Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        this.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
          threshold,
          { widgetType: "timer" },
          "elapsed",
        );
        this.playedSecondsElapsed.add(threshold);
      }
    }
  }

  private checkLapsLeftCallouts(lap: any, driverData: DriverHeatData) {
    this.lapAudioHandler.checkLapsLeftCallouts(lap, driverData);
  }

  private getAutoStartThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = this.themeService.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_AUTO_START,
    );
    if (config?.url) {
      const asset = (this.assets || []).find(
        (a) =>
          a.model?.entityId === config.url ||
          a.entity_id === config.url ||
          a._id === config.url,
      );
      if (asset?.audioEntries && asset.audioEntries.length > 0) {
        const filtered = asset.audioEntries.filter((e: any) => {
          const mode = e.triggerMode || e.trigger_mode || "remaining";
          return mode === triggerMode;
        });
        if (filtered.length > 0) {
          return filtered
            .map((e: any) => Math.round(e.timeSeconds))
            .filter((t: number) => t > 0)
            .sort((a: number, b: number) =>
              triggerMode === "elapsed" ? a - b : b - a,
            );
        }
      }
    }
    return triggerMode === "remaining" ? [600, 300, 180, 60, 30, 10] : [];
  }

  private checkAutoStartAnnouncements(
    currentTime: number,
    previousTime: number,
  ) {
    if (previousTime <= 0) return;
    const totalDuration = this.race?.auto_start_time ?? 0;
    const previousElapsed = totalDuration - previousTime;
    const currentElapsed = totalDuration - currentTime;

    // Remaining thresholds
    const remainingThresholds = this.getAutoStartThresholds("remaining");
    for (const threshold of remainingThresholds) {
      if (
        previousTime > threshold &&
        currentTime <= threshold &&
        !this.playedAutoStart.has(threshold)
      ) {
        if (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        this.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_AUTO_START,
          threshold,
          { widgetType: "timer" },
          "remaining",
        );
        this.playedAutoStart.add(threshold);
      }
    }

    // Elapsed thresholds
    const elapsedThresholds = this.getAutoStartThresholds("elapsed");
    for (const threshold of elapsedThresholds) {
      if (
        previousElapsed < threshold &&
        currentElapsed >= threshold &&
        !this.playedAutoStartElapsed.has(threshold)
      ) {
        if (
          threshold <= 0 ||
          (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1)
        ) {
          continue;
        }

        this.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_AUTO_START,
          threshold,
          { widgetType: "timer" },
          "elapsed",
        );
        this.playedAutoStartElapsed.add(threshold);
      }
    }
  }

  private getAutoAdvanceThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = this.themeService.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
    );
    if (config?.url) {
      const asset = (this.assets || []).find(
        (a) =>
          a.model?.entityId === config.url ||
          a.entity_id === config.url ||
          a._id === config.url,
      );
      if (asset?.audioEntries && asset.audioEntries.length > 0) {
        const filtered = asset.audioEntries.filter((e: any) => {
          const mode = e.triggerMode || e.trigger_mode || "remaining";
          return mode === triggerMode;
        });
        if (filtered.length > 0) {
          return filtered
            .map((e: any) => Math.round(e.timeSeconds))
            .filter((t: number) => t > 0)
            .sort((a: number, b: number) =>
              triggerMode === "elapsed" ? a - b : b - a,
            );
        }
      }
    }
    return triggerMode === "remaining" ? [600, 300, 180, 60, 30, 10] : [];
  }

  private checkAutoAdvanceAnnouncements(
    currentTime: number,
    previousTime: number,
  ) {
    if (previousTime <= 0) return;
    const totalDuration =
      (this.race as any)?.auto_advance_time ??
      (this.race as any)?.auto_advance_remaining_seconds ??
      0;
    const previousElapsed = totalDuration - previousTime;
    const currentElapsed = totalDuration - currentTime;

    // Remaining thresholds
    const remainingThresholds = this.getAutoAdvanceThresholds("remaining");
    for (const threshold of remainingThresholds) {
      if (
        previousTime > threshold &&
        currentTime <= threshold &&
        !this.playedAutoAdvance.has(threshold)
      ) {
        if (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        this.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
          threshold,
          { widgetType: "timer" },
          "remaining",
        );
        this.playedAutoAdvance.add(threshold);
      }
    }

    // Elapsed thresholds
    const elapsedThresholds = this.getAutoAdvanceThresholds("elapsed");
    for (const threshold of elapsedThresholds) {
      if (
        previousElapsed < threshold &&
        currentElapsed >= threshold &&
        !this.playedAutoAdvanceElapsed.has(threshold)
      ) {
        if (
          threshold <= 0 ||
          (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1)
        ) {
          continue;
        }

        this.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
          threshold,
          { widgetType: "timer" },
          "elapsed",
        );
        this.playedAutoAdvanceElapsed.add(threshold);
      }
    }
  }

  private handleLapEvent(lap: any, driverData: DriverHeatData): void {
    this.lapAudioHandler.handleLapEvent(lap, driverData);
  }

  private checkHalfwayPoint(lap: any, driverData?: DriverHeatData) {
    this.lapAudioHandler.checkHalfwayPoint(lap, driverData);
  }

  private resolveAssetPlayableUrl(
    urlOrId: string | undefined,
  ): string | undefined {
    if (!urlOrId) return undefined;
    const asset = (this.assets || []).find(
      (a: any) =>
        a.model?.entityId === urlOrId ||
        a.entity_id === urlOrId ||
        a._id === urlOrId ||
        a.name === urlOrId,
    );
    if (asset?.url) {
      return this.getFullUrl(asset.url);
    }
    return this.getFullUrl(urlOrId);
  }

  private getFullUrl(url: string | undefined): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${this.dataService.serverUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }
}
