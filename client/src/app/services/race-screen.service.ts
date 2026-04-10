import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { DataService } from '../data.service';
import { SettingsService } from './settings.service';
import { RaceScreenConfig, RaceScreenManager, RaceScreenConfigFactory } from '../models/race-screen';

@Injectable({
  providedIn: 'root'
})
export class RaceScreenService {
  private raceScreenManager: RaceScreenManager = {
    screens: [],
    activeScreenId: '',
    activeScreenIds: [],
    enabledScreenIds: [],
    defaultScreenId: ''
  };
  
  private raceScreenManagerSubject = new BehaviorSubject<RaceScreenManager>(this.raceScreenManager);
  raceScreenManager$ = this.raceScreenManagerSubject.asObservable();

  constructor(
    private settingsService: SettingsService,
    private dataService: DataService
  ) {
    this.loadRaceScreens();
  }

  async loadRaceScreens(): Promise<void> {
    try {
      // Load screens from database via HTTP API
      const screens = await firstValueFrom(this.dataService.getRaceScreens());
      console.log('loadRaceScreens: loaded', screens?.length || 0, 'screens from database');
      
      if (screens && screens.length > 0) {
        console.log('Available screens:');
        screens.forEach(screen => {
          console.log(`  - "${screen.name}" (URL: /race-screen/${screen.name.replace(/\s+/g, '-').toLowerCase()})`);
        });
        // Ensure all screens have isEnabled property
        screens.forEach(screen => {
          if (screen.isEnabled === undefined) {
            screen.isEnabled = true;
          }
        });

        this.raceScreenManager.screens = screens;

        // Build enabledScreenIds from screens
        this.raceScreenManager.enabledScreenIds = screens
          .filter(s => s.isEnabled !== false)
          .map(s => s.entity_id);

        // Migration: Add activeScreenIds if it doesn't exist
        if (!this.raceScreenManager.activeScreenIds) {
          this.raceScreenManager.activeScreenIds = this.raceScreenManager.screens.slice(0, 3).map(s => s.entity_id);
        }

        // Fix for copied screens incorrectly marked as default
        this.fixIncorrectDefaultScreens();

        // Set default screen ID
        const defaultScreen = this.raceScreenManager.screens.find(s => s.isDefault);
        this.raceScreenManager.defaultScreenId = defaultScreen?.entity_id || this.raceScreenManager.screens[0]?.entity_id;

        // Auto-enable default screen if it's the only screen
        if (this.raceScreenManager.screens.length === 1) {
          const onlyScreen = this.raceScreenManager.screens[0];
          if (onlyScreen.isDefault && !this.raceScreenManager.enabledScreenIds.includes(onlyScreen.entity_id)) {
            this.raceScreenManager.enabledScreenIds = [onlyScreen.entity_id];
          }
        }

        // Set active screen
        this.raceScreenManager.activeScreenId = this.raceScreenManager.screens[0]?.entity_id || '';

      } else {
        // No screens in database - don't auto-create default screen
        // Let the user create screens manually
        this.raceScreenManager = {
          screens: [],
          activeScreenId: '',
          activeScreenIds: [],
          enabledScreenIds: [],
          defaultScreenId: ''
        };
      }

      this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
    } catch (error) {
      console.error('Error loading race screens from database:', error);
      // Don't create fallback screen - backend handles it
    }
  }

  async createDefaultScreen(): Promise<void> {
    const defaultScreen = RaceScreenConfigFactory.create('Default Race Screen');
    defaultScreen.isDefault = true;
    
    try {
      // Save to database
      const savedScreen = await firstValueFrom(this.dataService.createRaceScreen(defaultScreen));

      this.raceScreenManager = {
        screens: [savedScreen],
        activeScreenId: savedScreen.id,
        activeScreenIds: [savedScreen.id],
        enabledScreenIds: [savedScreen.id],
        defaultScreenId: savedScreen.entity_id
      };
      this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
      
      // Migrate settings to screen
      await this.migrateSettingsToScreen(savedScreen);
    } catch (error) {
      console.error('Error creating default screen:', error);
      // Use local state only if database save fails
      this.raceScreenManager = {
        screens: [defaultScreen],
        activeScreenId: defaultScreen.id,
        activeScreenIds: [defaultScreen.id],
        enabledScreenIds: [defaultScreen.id],
        defaultScreenId: defaultScreen.entity_id
      };
      this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
    }
  }

  // Public API methods
  
  getScreens(): RaceScreenConfig[] {
    return [...this.raceScreenManager.screens];
  }

  getScreenById(id: string): RaceScreenConfig | undefined {
    return this.raceScreenManager.screens.find(screen => screen.entity_id === id);
  }

  getActiveScreen(): RaceScreenConfig | undefined {
    return this.getScreenById(this.raceScreenManager.activeScreenId);
  }

  getDefaultScreen(): RaceScreenConfig | undefined {
    return this.getScreenById(this.raceScreenManager.defaultScreenId);
  }

  async setActiveScreen(screenId: string): Promise<void> {
    this.raceScreenManager.activeScreenId = screenId;
    if (!this.raceScreenManager.activeScreenIds.includes(screenId)) {
      this.raceScreenManager.activeScreenIds.push(screenId);
    }
    this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
  }

  async createScreen(name: string): Promise<RaceScreenConfig> {
    const newScreen = RaceScreenConfigFactory.create(name);
    
    try {
      // Save to database
      const savedScreen = await firstValueFrom(this.dataService.createRaceScreen(newScreen));
      console.log('Screen saved to database:', { entity_id: savedScreen.entity_id, name: savedScreen.name });

      this.raceScreenManager.screens.push(savedScreen);
      this.raceScreenManager.activeScreenId = savedScreen.entity_id;
      this.raceScreenManager.activeScreenIds.push(savedScreen.entity_id);
      this.raceScreenManager.enabledScreenIds.push(savedScreen.entity_id);
      this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
      
      return savedScreen;
    } catch (error) {
      console.error('Error creating screen:', error);
      // Fallback to local state
      this.raceScreenManager.screens.push(newScreen);
      this.raceScreenManager.activeScreenId = newScreen.entity_id;
      this.raceScreenManager.activeScreenIds.push(newScreen.entity_id);
      this.raceScreenManager.enabledScreenIds.push(newScreen.entity_id);
      this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
      return newScreen;
    }
  }

  async updateScreen(screenId: string, updates: Partial<RaceScreenConfig>): Promise<RaceScreenConfig | null> {
    const screenIndex = this.raceScreenManager.screens.findIndex(s => s.entity_id === screenId);
    if (screenIndex === -1) return null;

    const updatedScreen = {
      ...this.raceScreenManager.screens[screenIndex],
      ...updates,
      updatedAt: Date.now()
    };

    try {
      // Save to database
      const savedScreen = await firstValueFrom(this.dataService.updateRaceScreen(screenId, updatedScreen));
      this.raceScreenManager.screens[screenIndex] = savedScreen;
    } catch (error) {
      console.error('Error updating screen:', error);
      // Fallback to local state
      this.raceScreenManager.screens[screenIndex] = updatedScreen;
    }

    this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
    return this.raceScreenManager.screens[screenIndex];
  }

  async deleteScreen(screenId: string): Promise<boolean> {
    const screenIndex = this.raceScreenManager.screens.findIndex(s => s.entity_id === screenId);
    if (screenIndex === -1) return false;

    const screen = this.raceScreenManager.screens[screenIndex];
    if (screen.isDefault) {
      throw new Error('Cannot delete the default screen');
    }

    try {
      await firstValueFrom(this.dataService.deleteRaceScreen(screenId));
    } catch (error) {
      console.error('Error deleting screen from database:', error);
      // Continue with local deletion even if database fails
    }

    this.raceScreenManager.screens.splice(screenIndex, 1);

    // Update active screen if necessary
    if (this.raceScreenManager.activeScreenId === screenId) {
      this.raceScreenManager.activeScreenId = this.raceScreenManager.screens[0]?.entity_id || '';
    }

    // Remove from active and enabled lists
    this.raceScreenManager.activeScreenIds = this.raceScreenManager.activeScreenIds.filter(id => id !== screenId);
    this.raceScreenManager.enabledScreenIds = this.raceScreenManager.enabledScreenIds.filter(id => id !== screenId);

    // Auto-enable default screen if it's the only screen left
    if (this.raceScreenManager.screens.length === 1) {
      const onlyScreen = this.raceScreenManager.screens[0];
      if (onlyScreen.isDefault && !this.raceScreenManager.enabledScreenIds.includes(onlyScreen.entity_id)) {
        this.raceScreenManager.enabledScreenIds = [onlyScreen.entity_id];
      }
    }

    this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
    return true;
  }

  async duplicateScreen(screenId: string): Promise<RaceScreenConfig> {
    const screen = this.getScreenById(screenId);
    if (!screen) {
      throw new Error('Screen not found');
    }

    const duplicatedScreen = RaceScreenConfigFactory.clone(screen);
    
    try {
      // Save to database
      const savedScreen = await firstValueFrom(this.dataService.createRaceScreen(duplicatedScreen));

      this.raceScreenManager.screens.push(savedScreen);
      this.raceScreenManager.activeScreenId = savedScreen.entity_id;
      this.raceScreenManager.activeScreenIds.push(savedScreen.entity_id);
      this.raceScreenManager.enabledScreenIds.push(savedScreen.entity_id);
      this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
      
      return savedScreen;
    } catch (error) {
      console.error('Error duplicating screen:', error);
      // Fallback to local state
      this.raceScreenManager.screens.push(duplicatedScreen);
      this.raceScreenManager.activeScreenId = duplicatedScreen.entity_id;
      this.raceScreenManager.activeScreenIds.push(duplicatedScreen.entity_id);
      this.raceScreenManager.enabledScreenIds.push(duplicatedScreen.entity_id);
      this.raceScreenManagerSubject.next({ ...this.raceScreenManager });
      return duplicatedScreen;
    }
  }

  async renameScreen(screenId: string, newName: string): Promise<RaceScreenConfig | null> {
    return this.updateScreen(screenId, { name: newName });
  }

  async setScreenEnabled(screenId: string, enabled: boolean): Promise<void> {
    const screen = this.getScreenById(screenId);
    if (!screen) return;

    screen.isEnabled = enabled;
    
    if (enabled) {
      if (!this.raceScreenManager.enabledScreenIds.includes(screenId)) {
        this.raceScreenManager.enabledScreenIds.push(screenId);
      }
    } else {
      this.raceScreenManager.enabledScreenIds = this.raceScreenManager.enabledScreenIds.filter(id => id !== screenId);
    }

    await this.updateScreen(screenId, { isEnabled: enabled });
  }

  isScreenEnabled(screenId: string): boolean {
    return this.raceScreenManager.enabledScreenIds.includes(screenId);
  }

  getEnabledScreens(): RaceScreenConfig[] {
    return this.raceScreenManager.screens.filter(s => this.isScreenEnabled(s.entity_id));
  }

  private fixIncorrectDefaultScreens(): void {
    const defaultScreens = this.raceScreenManager.screens.filter(s => s.isDefault);
    
    // If more than one screen is marked as default, fix it
    if (defaultScreens.length > 1) {
      console.log('Found multiple default screens, fixing...');
      // Keep the first one as default, mark others as non-default
      defaultScreens.slice(1).forEach(screen => {
        screen.isDefault = false;
      });
    }
    
    // If no screen is marked as default, mark the first one
    if (defaultScreens.length === 0 && this.raceScreenManager.screens.length > 0) {
      console.log('No default screen found, marking first screen as default');
      this.raceScreenManager.screens[0].isDefault = true;
    }
  }

  private async migrateSettingsToScreen(screen: RaceScreenConfig): Promise<void> {
    const settings = this.settingsService.getSettings();
    
    // Only migrate if screen has no custom columns (i.e., it's a fresh default screen)
    if (screen.columns.length === 0 || 
        (screen.columns.length === 5 && 
         screen.columns[0] === 'driver.nickname' &&
         screen.columns[1] === 'imageset_fuel-gauge-builtin')) {
      
      // Update screen with settings
      await this.updateScreen(screen.entity_id, {
        columns: settings.racedayColumns,
        columnLayouts: settings.columnLayouts,
        columnVisibility: settings.columnVisibility,
        sortByStandings: settings.sortByStandings,
        highlightRowOnLap: settings.highlightRowOnLap
      });
    }
  }
}
