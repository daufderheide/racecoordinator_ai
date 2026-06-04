import { Injectable, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { DataService } from "@app/data.service";
import { RaceFlag } from "@app/proto/antigravity";

import { RaceConnectionService } from "./race-connection.service";
import { SettingsService } from "./settings.service";
import { ThemeService } from "./theme.service";

export type FlagType =
  | "red"
  | "green"
  | "yellow"
  | "white"
  | "checkered"
  | "green_yellow"
  | "black";

@Injectable({
  providedIn: "root",
})
export class RaceFlagService implements OnDestroy {
  private currentFlag: RaceFlag = RaceFlag.UNKNOWN_FLAG;
  private assets: any[] = [];
  private subscriptions: Subscription = new Subscription();
  private assetsSubscription?: Subscription;

  constructor(
    private raceConnectionService: RaceConnectionService,
    private themeService: ThemeService,
    private settingsService: SettingsService,
    private dataService: DataService,
  ) {
    this.subscriptions.add(
      this.raceConnectionService.raceFlag$.subscribe((flag) => {
        this.currentFlag = flag;
      }),
    );

    this.subscriptions.add(
      this.dataService.socketConnected$.subscribe((connected) => {
        if (connected) {
          if (this.assetsSubscription) {
            this.assetsSubscription.unsubscribe();
          }
          this.assetsSubscription = this.dataService.listAssets().subscribe({
            next: (assets: any[]) => {
              this.assets = assets || [];
            },
            error: (err) => {
              console.error(
                "RaceFlagService: Failed to fetch assets on reconnect",
                err,
              );
            },
          });
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Get the current flag type based on the server-provided flag.
   */
  getFlagType(): FlagType {
    return this.getFlagTypeForFlag(this.currentFlag);
  }

  /**
   * Get the flag type for a specific flag.
   */
  getFlagTypeForFlag(flag: RaceFlag): FlagType {
    const RF = RaceFlag;
    switch (flag) {
      case RF.GREEN:
        return "green";
      case RF.YELLOW:
        return "yellow";
      case RF.RED:
        return "red";
      case RF.WHITE:
        return "white";
      case RF.CHECKERED:
        return "checkered";
      case RF.GREEN_YELLOW:
        return "green_yellow";
      case RF.BLACK:
        return "black";
      default:
        return "red";
    }
  }

  /**
   * Get the URL for a flag image based on the flag type.
   * Priority: Theme > Settings > Default Asset
   */
  getFlagUrl(flag: RaceFlag | FlagType): string {
    const flagType =
      typeof flag === "string" ? flag : this.getFlagTypeForFlag(flag);

    // 1. Theme slot resolution (highest priority)
    const themeSlotMap: Record<string, string> = {
      green: "flag.green",
      red: "flag.red",
      yellow: "flag.yellow",
      white: "flag.white",
      checkered: "flag.checkered",
      green_yellow: "flag.yellowgreen",
      black: "flag.black",
    };

    const slotKey = themeSlotMap[flagType];
    if (slotKey) {
      const assetId = this.themeService.resolveAssetId(slotKey);
      if (assetId) {
        const asset = this.assets.find(
          (a) =>
            a.model?.entityId === assetId ||
            a.entity_id === assetId ||
            a._id === assetId,
        );
        if (asset) return this.getFullUrl(asset.url);
      }
    }

    // 2. Individual Settings override
    const settings = this.settingsService.getSettings();
    let url: string | undefined;
    if (flagType === "green") url = settings.flagGreen;
    if (flagType === "yellow") url = settings.flagYellow;
    if (flagType === "red") url = settings.flagRed;
    if (flagType === "white") url = settings.flagWhite;
    if (flagType === "checkered") url = settings.flagCheckered;
    if (flagType === "green_yellow") url = settings.flagYellowGreen;

    if (url) return url;

    // 3. Fallback to default assets
    // Note: We use relative paths that are expected to exist in the theme or server
    const nameMap: Record<string, string> = {
      green: "green",
      yellow: "yellow",
      red: "red",
      white: "white",
      checkered: "checkered",
      green_yellow: "yellow_green", // Map for asset filename consistency
      black: "black",
    };
    const name = nameMap[flagType] || "red"; // Default to red for unknown types
    const ext = name === "black" ? "svg" : "png";
    return `/assets/images/flags/${name}.${ext}`; // Adjusted path to more common convention
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
   * Get the flag color for driver station indicator (simplified version)
   */
  getFlagColor(): "red" | "green" | "yellow" | "white" | "checkered" | "black" {
    const flagType = this.getFlagType();

    // Map to simplified color set
    if (flagType === "green_yellow") return "green";
    return flagType as
      | "red"
      | "green"
      | "yellow"
      | "white"
      | "checkered"
      | "black";
  }

  /**
   * Get the translation key for the current flag name.
   */
  getFlagNameKey(): string {
    const flagType = this.getFlagType();
    return `RACE_FLAG_${flagType.toUpperCase()}`;
  }
}
