import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { DataService } from "@app/data.service";
import { AudioConfig } from "@app/models/driver";
import {} from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";

/**
 * ThemeService manages the active theme and resolves asset IDs for theme slots.
 *
 * Resolution priority:
 *   1. Race-specific theme override (Settings.raceThemeOverrides[raceId])
 *   2. Global active theme (Settings.activeThemeId)
 *   3. Individual Settings override (e.g., Settings.flagRacing)
 *   4. Built-in default asset (name-based lookup)
 *   5. Hardcoded fallback
 *
 * Steps 3–5 are handled by the consuming component, not this service.
 */
@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private activeTheme: Theme | null = null;
  private themes: Theme[] = [];
  private initialized = false;

  constructor(
    private dataService: DataService,
    private settingsService: SettingsService,
    private logger: LoggerService,
  ) {
    if (this.dataService?.socketConnected$) {
      this.dataService.socketConnected$.subscribe((connected) => {
        if (connected) {
          this.logger.info(
            "ThemeService: Socket connected, initializing themes...",
          );
          this.initialize().catch((err) => {
            this.logger.error(
              "ThemeService: Error in auto-initialization",
              err,
            );
          });
        }
      });
    }
  }

  /**
   * Fetch all themes from the server and set the active theme.
   * Should be called once during app initialization or when the database changes.
   */
  async initialize(): Promise<void> {
    try {
      this.themes = await firstValueFrom(this.dataService.getThemes());
    } catch (e: any) {
      if (e.status !== 0) {
        this.logger.error("ThemeService: Failed to fetch themes", e);
      } else {
        this.logger.debug(
          "ThemeService: Server offline, unable to fetch themes.",
        );
      }
      this.themes = [];
    }

    const settings = this.settingsService.getSettings();

    // Try to activate the configured theme
    if (settings.activeThemeId) {
      this.activeTheme =
        this.themes.find((t) => t.entity_id === settings.activeThemeId) || null;
    }

    // Deleted theme or first-time user → fall back to default
    if (!this.activeTheme) {
      this.activeTheme = this.themes.find((t) => t.is_default) || null;
      if (this.activeTheme) {
        settings.activeThemeId = this.activeTheme.entity_id;
        this.settingsService.saveSettings(settings);
      }
    }

    this.initialized = true;
  }

  /** Returns whether the service has been initialized. */
  isInitialized(): boolean {
    return this.initialized;
  }

  /** Returns all available themes. */
  getThemes(): Theme[] {
    return this.themes;
  }

  /** Returns the currently active theme, or null if none. */
  getActiveTheme(): Theme | null {
    return this.activeTheme;
  }

  /** Returns whether a theme is currently active. */
  isThemeActive(): boolean {
    return this.activeTheme !== null;
  }

  /**
   * Set the global active theme. Pass null to clear (no theme).
   */
  setActiveTheme(themeId: string | null): void {
    const settings = this.settingsService.getSettings();

    if (themeId) {
      this.activeTheme =
        this.themes.find((t) => t.entity_id === themeId) || null;
    } else {
      this.activeTheme = null;
    }

    settings.activeThemeId = this.activeTheme?.entity_id;
    this.settingsService.saveSettings(settings);
  }

  /**
   * Resolve an asset entity ID for a given theme slot key.
   * Returns null if no theme is active or the slot is empty.
   */
  resolveAssetId(slotKey: string): string | null {
    if (!this.activeTheme) return null;
    return this.activeTheme.slots[slotKey] || null;
  }

  /**
   * Resolve an AudioConfig for a given theme audio slot key.
   * Returns null if no theme is active or the slot is empty.
   */
  resolveAudioConfig(slotKey: string): AudioConfig | null {
    if (!this.activeTheme) return null;
    let config = this.activeTheme.audio_slots?.[slotKey] || null;
    if (!config && this.activeTheme.slots?.[slotKey]) {
      const assetId = this.activeTheme.slots[slotKey];
      const isSet =
        slotKey === "audio.countdown" || slotKey === "audio.seconds_left";
      config = { type: isSet ? "audio_set" : "preset", url: assetId };
    }
    if (!config) {
      if (slotKey === "audio.countdown") {
        config = { type: "audio_set", url: "default_countdown" };
      } else if (slotKey === "audio.seconds_left") {
        config = { type: "audio_set", url: "default_seconds_left" };
      }
    }
    return config;
  }

  // --- Per-Race Theme Support ---

  /**
   * Called when a race is selected (e.g., on Raceday Setup).
   * Checks for a race-specific theme override and activates it.
   */
  activateForRace(raceId: string): void {
    if (!this.initialized) {
      this.initialize()
        .then(() => this.activateForRace(raceId))
        .catch(() => {});
      return;
    }
    const settings = this.settingsService.getSettings();
    const overrideThemeId = settings.raceThemeOverrides?.[raceId];

    if (overrideThemeId) {
      const overrideTheme = this.themes.find(
        (t) => t.entity_id === overrideThemeId,
      );
      if (overrideTheme) {
        this.activeTheme = overrideTheme;
        return;
      }
      // Override points to a deleted theme — clean up
      delete settings.raceThemeOverrides[raceId];
      this.settingsService.saveSettings(settings);
    }

    // No race override → use the global active theme
    this.activeTheme =
      this.themes.find((t) => t.entity_id === settings.activeThemeId) ||
      this.themes.find((t) => t.is_default) ||
      null;
  }

  /**
   * Set a per-race theme override. Pass null to clear.
   */
  setRaceThemeOverride(raceId: string, themeId: string | null): void {
    const settings = this.settingsService.getSettings();

    if (!settings.raceThemeOverrides) {
      settings.raceThemeOverrides = {};
    }

    if (themeId) {
      settings.raceThemeOverrides[raceId] = themeId;
    } else {
      delete settings.raceThemeOverrides[raceId];
    }

    this.settingsService.saveSettings(settings);
    this.activateForRace(raceId);
  }

  /**
   * Get the per-race theme override for a given race, if any.
   */
  getRaceThemeOverride(raceId: string): string | null {
    const settings = this.settingsService.getSettings();
    return settings.raceThemeOverrides?.[raceId] || null;
  }

  /**
   * Populate individual Settings overrides from the active theme's slots,
   * then clear the active theme. Used when user clicks "Detach Theme."
   */
  detachToSettings(assets: any[]): void {
    if (!this.activeTheme) return;

    const settings = this.settingsService.getSettings();

    const resolveUrl = (slotKey: string): string | undefined => {
      const assetId = this.activeTheme!.slots[slotKey];
      if (!assetId) return undefined;
      const asset = assets.find(
        (a: any) => a.model?.entityId === assetId || a.entity_id === assetId,
      );
      return asset?.url || undefined;
    };

    settings.flagRacing = resolveUrl("flag.racing");
    settings.flagHeatPaused = resolveUrl("flag.heat_paused");
    settings.flagHeatOver = resolveUrl("flag.heat_over");
    settings.flagRaceOver = resolveUrl("flag.race_over");
    settings.flagNotStarted = resolveUrl("flag.not_started");
    settings.flagStarting = resolveUrl("flag.starting");
    settings.flagRestarting = resolveUrl("flag.restarting");
    settings.flagOneLapToGo = resolveUrl("flag.one_lap_to_go");
    settings.flagHeatFinishing = resolveUrl("flag.heat_finishing");
    settings.flagWarmup = resolveUrl("flag.warmup");
    settings.flagDriverFinished = resolveUrl("flag.driver_finished");
    settings.flagPenalty = resolveUrl("flag.penalty");
    settings.lampRedOn = resolveUrl("lamp.red.on");
    settings.lampRedDim = resolveUrl("lamp.red.dim");
    settings.lampGreen = resolveUrl("lamp.green");
    settings.fuelGaugeImageSet =
      this.activeTheme.slots["gauge.fuel"] ||
      this.activeTheme.slots["fuel_gauge"];
    settings.activeThemeId = undefined;

    this.activeTheme = null;
    this.settingsService.saveSettings(settings);
  }

  /**
   * Refresh the theme list from the server. Call after creating/updating/deleting themes.
   */
  async refresh(): Promise<void> {
    try {
      this.themes = await firstValueFrom(this.dataService.getThemes());
    } catch (e: any) {
      if (e.status !== 0) {
        this.logger.error("ThemeService: Failed to refresh themes", e);
      } else {
        this.logger.debug(
          "ThemeService: Server offline, unable to refresh themes.",
        );
      }
    }

    // Re-validate active theme
    if (this.activeTheme) {
      this.activeTheme =
        this.themes.find((t) => t.entity_id === this.activeTheme!.entity_id) ||
        null;
    }

    // If active theme was deleted, fall back to default
    if (!this.activeTheme) {
      const settings = this.settingsService.getSettings();
      this.activeTheme = this.themes.find((t) => t.is_default) || null;
      if (this.activeTheme) {
        settings.activeThemeId = this.activeTheme.entity_id;
        this.settingsService.saveSettings(settings);
      }
    }
  }

  /**
   * Duplicate an existing theme.
   */
  async duplicateTheme(themeId: string, name?: string): Promise<Theme> {
    const result = await firstValueFrom(
      this.dataService.duplicateTheme(themeId, name),
    );
    await this.refresh();
    return result;
  }

  /**
   * Delete a theme.
   */
  async deleteTheme(themeId: string): Promise<void> {
    await firstValueFrom(this.dataService.deleteTheme(themeId));
    await this.refresh();
  }
}
