import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { AnchorPoint } from "@app/components/raceday/column_definition";
import { Settings } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  private readonly STORAGE_KEY = "racecoordinator_settings";
  private settingsSubject = new BehaviorSubject<Settings>(this.getSettings());
  public settings$: Observable<Settings> = this.settingsSubject.asObservable();

  constructor(private logger: LoggerService) {}

  getSettings(): Settings {
    const storedSettings = localStorage.getItem(this.STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        // Ensure we return a proper Settings instance or object matching the interface
        const settings = Object.assign(new Settings(), parsed);

        // Backfill: Add driver state (flag) to lapCount column if not already set
        if (
          !settings.driverStateBackfilled &&
          settings.columnLayouts &&
          settings.columnLayouts["lapCount"]
        ) {
          const lapLayout = settings.columnLayouts["lapCount"];
          // Only add if bottom-left is empty (missing or null/undefined)
          if (!lapLayout[AnchorPoint.BottomLeft]) {
            lapLayout[AnchorPoint.BottomLeft] = "flag";
          }
          settings.driverStateBackfilled = true;
        }

        return settings;
      } catch (e) {
        this.logger.error("Error parsing settings from localStorage", e);
        return new Settings();
      }
    }
    return new Settings();
  }

  saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      this.settingsSubject.next(settings);
    } catch (e) {
      this.logger.error("Error saving settings to localStorage", e);
    }
  }

  resetToDefaults(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.settingsSubject.next(new Settings());
  }
}
