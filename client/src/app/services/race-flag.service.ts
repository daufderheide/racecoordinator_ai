import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { DataService } from "@app/data.service";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { RaceFlag, RaceState } from "@app/proto/antigravity";

import { RaceService } from "./race.service";
import { RaceConnectionService } from "./race-connection.service";
import { SettingsService } from "./settings.service";
import { ThemeService } from "./theme.service";

export type BehavioralFlagKey =
  | "flag.racing"
  | "flag.heat_paused"
  | "flag.heat_over"
  | "flag.race_over"
  | "flag.not_started"
  | "flag.starting"
  | "flag.restarting"
  | "flag.one_lap_to_go"
  | "flag.heat_finishing"
  | "flag.warmup"
  | "flag.driver_finished"
  | "flag.penalty";

export type FlagColor =
  | "red"
  | "green"
  | "yellow"
  | "white"
  | "checkered"
  | "black";

@Injectable({
  providedIn: "root",
})
export class RaceFlagService implements OnDestroy {
  private currentFlag: RaceFlag = RaceFlag.UNKNOWN_FLAG;
  private currentState: RaceState = RaceState.UNKNOWN_STATE;
  private hasRacedInCurrentHeat: boolean = false;
  private assets: any[] = [];
  private subscriptions: Subscription = new Subscription();
  private assetsSubscription?: Subscription;

  private currentFlagUrlSubject = new BehaviorSubject<string>("");
  public currentFlagUrl$: Observable<string> =
    this.currentFlagUrlSubject.asObservable();

  constructor(
    private raceConnectionService: RaceConnectionService,
    private raceService: RaceService,
    private themeService: ThemeService,
    private settingsService: SettingsService,
    private dataService: DataService,
  ) {
    if (this.raceConnectionService?.raceFlag$) {
      this.subscriptions.add(
        this.raceConnectionService.raceFlag$.subscribe((flag) => {
          this.currentFlag = flag;
          this.notifySubscribers();
        }),
      );
    }

    if (this.raceConnectionService?.raceState$) {
      this.subscriptions.add(
        this.raceConnectionService.raceState$.subscribe((state) => {
          this.currentState = state;
          this.notifySubscribers();
        }),
      );
    }

    if (this.raceService?.currentHeat$) {
      this.subscriptions.add(
        this.raceService.currentHeat$.subscribe((heat) => {
          if (heat) {
            this.hasRacedInCurrentHeat =
              !!heat.started ||
              (heat.heatDrivers?.some((hd) => hd.lapCount > 0) ?? false);
          } else {
            this.hasRacedInCurrentHeat = false;
          }
          this.notifySubscribers();
        }),
      );
    }

    if (this.dataService?.socketConnected$) {
      this.subscriptions.add(
        this.dataService.socketConnected$.subscribe((connected) => {
          if (connected) {
            if (this.assetsSubscription) {
              this.assetsSubscription.unsubscribe();
            }
            if (this.dataService.listAssets) {
              this.assetsSubscription = this.dataService
                .listAssets()
                .subscribe({
                  next: (assets: any[]) => {
                    this.assets = assets || [];
                    this.notifySubscribers();
                  },
                  error: (err) => {
                    console.error(
                      "RaceFlagService: Failed to fetch assets on reconnect",
                      err,
                    );
                  },
                });
            }
          }
        }),
      );
    }
  }

  private notifySubscribers(): void {
    this.currentFlagUrlSubject.next(this.getCurrentFlagUrl());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Determine the behavioral flag slot key based on race state and flag.
   */
  getBehavioralFlagKey(flag?: RaceFlag): BehavioralFlagKey {
    const f =
      flag !== undefined && flag !== RaceFlag.UNKNOWN_FLAG
        ? flag
        : this.currentFlag;

    if (f === RaceFlag.BLACK) return THEME_SLOT_KEYS.FLAG_PENALTY;
    if (f === RaceFlag.GREEN_YELLOW) return THEME_SLOT_KEYS.FLAG_WARMUP;
    if (f === RaceFlag.WHITE) return THEME_SLOT_KEYS.FLAG_ONE_LAP_TO_GO;

    if (this.currentState === RaceState.PAUSED) {
      return THEME_SLOT_KEYS.FLAG_HEAT_PAUSED;
    }

    if (this.currentState === RaceState.STARTING) {
      if (f === RaceFlag.YELLOW || this.hasRacedInCurrentHeat) {
        return THEME_SLOT_KEYS.FLAG_RESTARTING;
      }
      return THEME_SLOT_KEYS.FLAG_STARTING;
    }

    if (this.currentState === RaceState.NOT_STARTED) {
      return THEME_SLOT_KEYS.FLAG_NOT_STARTED;
    }

    if (this.currentState === RaceState.HEAT_OVER) {
      return THEME_SLOT_KEYS.FLAG_HEAT_OVER;
    }

    if (this.currentState === RaceState.RACE_OVER) {
      return THEME_SLOT_KEYS.FLAG_RACE_OVER;
    }

    if (this.currentState === RaceState.RACING) {
      if (f === RaceFlag.CHECKERED) {
        return THEME_SLOT_KEYS.FLAG_HEAT_FINISHING;
      }
      return THEME_SLOT_KEYS.FLAG_RACING;
    }

    // Default based on flag if state is unknown
    switch (f) {
      case RaceFlag.GREEN:
        return THEME_SLOT_KEYS.FLAG_RACING;
      case RaceFlag.YELLOW:
        return THEME_SLOT_KEYS.FLAG_HEAT_PAUSED;
      case RaceFlag.RED:
        return THEME_SLOT_KEYS.FLAG_NOT_STARTED;
      case RaceFlag.CHECKERED:
        return THEME_SLOT_KEYS.FLAG_HEAT_FINISHING;
      default:
        return THEME_SLOT_KEYS.FLAG_NOT_STARTED;
    }
  }

  /**
   * Get the current behavioral flag slot key.
   */
  getFlagType(): BehavioralFlagKey {
    return this.getBehavioralFlagKey();
  }

  /**
   * Get the URL for the current behavioral flag image.
   */
  getCurrentFlagUrl(): string {
    return this.getFlagUrl(this.getFlagType());
  }

  /**
   * Get the flag color for driver station indicator (simplified CSS class version).
   */
  getFlagTypeForFlag(flag: RaceFlag): FlagColor {
    return this.getFlagColor(flag);
  }

  /**
   * Get the URL for a flag image based on behavioral slot key, flag enum, or current state.
   * Priority: Theme > Settings > Default Asset
   */
  getFlagUrl(flagOrSlot?: RaceFlag | string): string {
    let slotKey: string;
    if (typeof flagOrSlot === "string" && flagOrSlot.startsWith("flag.")) {
      slotKey = flagOrSlot;
    } else if (typeof flagOrSlot === "number") {
      slotKey = this.getBehavioralFlagKey(flagOrSlot);
    } else {
      slotKey = this.getBehavioralFlagKey();
    }

    // 1. Theme slot resolution (highest priority)
    let assetId = this.themeService.resolveAssetId(slotKey);

    // 2. Individual Settings override
    if (!assetId) {
      const settings = this.settingsService?.getSettings();
      let url: string | undefined;
      if (settings) {
        if (slotKey === THEME_SLOT_KEYS.FLAG_RACING) url = settings.flagRacing;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_HEAT_PAUSED)
          url = settings.flagHeatPaused;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_HEAT_OVER)
          url = settings.flagHeatOver;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_RACE_OVER)
          url = settings.flagRaceOver;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_NOT_STARTED)
          url = settings.flagNotStarted;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_STARTING)
          url = settings.flagStarting;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_RESTARTING)
          url = settings.flagRestarting;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_ONE_LAP_TO_GO)
          url = settings.flagOneLapToGo;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_HEAT_FINISHING)
          url = settings.flagHeatFinishing;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_WARMUP)
          url = settings.flagWarmup;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_DRIVER_FINISHED)
          url = settings.flagDriverFinished;
        else if (slotKey === THEME_SLOT_KEYS.FLAG_PENALTY)
          url = settings.flagPenalty;
      }

      if (url) return this.getFullUrl(url);
    } else {
      const asset = this.assets.find(
        (a) =>
          a.model?.entityId === assetId ||
          a.entity_id === assetId ||
          a._id === assetId,
      );
      if (asset) return this.getFullUrl(asset.url);
      if (this.dataService?.getAssetUrl) {
        return this.getFullUrl(this.dataService.getAssetUrl(assetId));
      }
    }

    return "";
  }

  private getFullUrl(url: string | undefined): string {
    if (!url) return "";
    if (
      url.startsWith("http") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    const serverUrl = this.dataService.serverUrl;
    if (!serverUrl || serverUrl.includes("undefined")) return url;

    const base = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  /**
   * Get the flag color for driver station indicator (simplified CSS class version)
   */
  getFlagColor(flag?: RaceFlag): FlagColor {
    const f =
      flag !== undefined && flag !== RaceFlag.UNKNOWN_FLAG
        ? flag
        : this.currentFlag;
    switch (f) {
      case RaceFlag.GREEN:
      case RaceFlag.GREEN_YELLOW:
        return "green";
      case RaceFlag.YELLOW:
        return "yellow";
      case RaceFlag.WHITE:
        return "white";
      case RaceFlag.CHECKERED:
        return "checkered";
      case RaceFlag.BLACK:
        return "black";
      case RaceFlag.RED:
      default:
        return "red";
    }
  }

  /**
   * Get the translation key for the current flag name.
   */
  getFlagNameKey(): string {
    const key = this.getBehavioralFlagKey();
    return `UE_LABEL_${key.replace("flag.", "FLAG_").toUpperCase()}`;
  }
}
