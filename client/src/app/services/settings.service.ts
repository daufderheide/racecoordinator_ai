import { Injectable } from "@angular/core";
import { Settings } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  private readonly STORAGE_KEY = "racecoordinator_settings";

  constructor(private logger: LoggerService) {}

  getSettings(): Settings {
    const storedSettings = localStorage.getItem(this.STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        // Ensure we return a proper Settings instance or object matching the interface
        return Object.assign(new Settings(), parsed);
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
    } catch (e) {
      this.logger.error("Error saving settings to localStorage", e);
    }
  }

  resetToDefaults(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
