import { Injectable } from '@angular/core';
import { Settings } from '../models/settings';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private readonly STORAGE_KEY = 'racecoordinator_settings';

    constructor() { }

    getSettings(): Settings {
        const storedSettings = localStorage.getItem(this.STORAGE_KEY);
        if (storedSettings) {
            try {
                const parsed = JSON.parse(storedSettings);
                // Ensure we return a proper Settings instance or object matching the interface
                return new Settings(
                    parsed.recentRaceIds || [],
                    parsed.selectedDriverIds || [],
                    parsed.serverIp || 'localhost',
                    parsed.serverPort || 7070,
                    parsed.language || '',
                    parsed.racedaySetupWalkthroughSeen || false,
                    parsed.flagGreen,
                    parsed.flagYellow,
                    parsed.flagRed,
                    parsed.flagWhite,
                    parsed.flagBlack,
                    parsed.flagCheckered
                );
            } catch (e) {
                console.error('Error parsing settings from localStorage', e);
                return new Settings();
            }
        }
        return new Settings();
    }

    saveSettings(settings: Settings): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving settings to localStorage', e);
        }
    }
}
