import { Component, OnInit, ChangeDetectorRef, HostListener, Output, EventEmitter } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Driver } from 'src/app/models/driver';
import { Race } from 'src/app/models/race';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { RaceService } from 'src/app/services/race.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { SettingsService } from 'src/app/services/settings.service';
import { Settings } from 'src/app/models/settings';
import { FileSystemService } from 'src/app/services/file-system.service';

@Component({
  selector: 'app-default-raceday-setup',
  templateUrl: './default-raceday-setup.component.html',
  styleUrl: './default-raceday-setup.component.css',
  standalone: false
})
export class DefaultRacedaySetupComponent implements OnInit {
  @Output() requestServerConfig = new EventEmitter<void>();

  // Driver State
  selectedDrivers: Driver[] = [];
  unselectedDrivers: Driver[] = [];

  driverImageErrors = new Set<string>();

  // Search State
  driverSearchQuery: string = '';
  raceSearchQuery: string = '';

  // Race State
  races: Race[] = [];
  selectedRace?: Race;
  quickStartRaces: Race[] = [];

  // UI State
  scale: number = 1;
  translationsLoaded: boolean = false;
  isDropdownOpen: boolean = false;
  isOptionsDropdownOpen: boolean = false;
  isFileDropdownOpen: boolean = false;
  isRefreshingList: boolean = false;
  menuItems = [
    { label: 'RDS_MENU_FILE', action: (event: MouseEvent) => this.toggleFileDropdown(event) },
    { label: 'RDS_MENU_TRACK', action: () => console.log('Track menu') },
    { label: 'RDS_MENU_DRIVER', action: () => this.openDriverManager() },
    { label: 'RDS_MENU_RACE', action: () => console.log('Race menu') },
    { label: 'RDS_MENU_SEASON', action: () => console.log('Season menu') },
    { label: 'RDS_MENU_OPTIONS', action: (event: MouseEvent) => this.toggleOptionsDropdown(event) },
    { label: 'RDS_MENU_HELP', action: () => console.log('Help menu') }
  ];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private raceService: RaceService,
    private router: Router,
    private translationService: TranslationService,
    private settingsService: SettingsService,
    private fileSystem: FileSystemService
  ) { }

  ngOnInit() {
    this.updateScale();

    forkJoin({
      drivers: this.dataService.getDrivers(),
      races: this.dataService.getRaces()
    }).subscribe({
      next: (result) => {
        const drivers = result.drivers.map(d => new Driver(
          d.entity_id,
          d.name,
          d.nickname || '',
          d.avatarUrl,
          d.lapSoundUrl,
          d.bestLapSoundUrl,
          d.lapSoundType,
          d.bestLapSoundType,
          d.lapSoundText,
          d.bestLapSoundText
        ));
        const races = result.races;

        // --- Race Setup ---
        this.races = races.sort((a, b) => a.name.localeCompare(b.name));

        const localSettings = this.settingsService.getSettings();
        this.updateQuickStartRaces(localSettings.recentRaceIds);

        if (localSettings && localSettings.recentRaceIds?.length > 0) {
          const defaultRaceId = localSettings.recentRaceIds[0];
          this.selectedRace = this.races.find(r => r.entity_id === defaultRaceId);
        }

        if (!this.selectedRace && this.races.length > 0) {
          this.selectedRace = this.races[0];
        }

        // --- Driver Setup ---
        // Initialize lists
        let initialSelectedIds = new Set<string>();
        if (localSettings && localSettings.selectedDriverIds) {
          initialSelectedIds = new Set(localSettings.selectedDriverIds);
        }

        const driverMap = new Map(drivers.map(d => [d.entity_id, d]));

        // Populate Selected (in saved order)
        if (localSettings && localSettings.selectedDriverIds) {
          for (const id of localSettings.selectedDriverIds) {
            const d = driverMap.get(id);
            if (d) {
              this.selectedDrivers.push(d);
              driverMap.delete(id);
            }
          }
        }

        // Populate Unselected (Alphabetical)
        this.unselectedDrivers = Array.from(driverMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading initial data', err)
    });

    this.translationService.getTranslationsLoaded().subscribe(loaded => {
      this.translationsLoaded = loaded;
      this.cdr.detectChanges();
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScale();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.closeDropdown();
    }
    if (!target.closest('.options-menu-container')) {
      this.closeOptionsDropdown();
    }
    if (!target.closest('.file-menu-container')) {
      this.closeFileDropdown();
    }
  }



  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;

    this.scale = Math.min(scaleX, scaleY);
  }

  getDriverAvatarUrl(driver: Driver): string {
    if (!driver.avatarUrl) return '';
    if (driver.avatarUrl.startsWith('/')) {
      return `${this.dataService.serverUrl}${driver.avatarUrl}`;
    }
    return driver.avatarUrl;
  }

  onDriverImageError(driver: Driver) {
    this.driverImageErrors.add(driver.entity_id);
  }

  // --- Driver Logic ---

  toggleDriverSelection(driver: Driver, isSelected: boolean) {
    this.updateListWithRefresh(() => {
      if (isSelected) {
        // Was selected, now unselecting
        this.selectedDrivers = this.selectedDrivers.filter(d => d.entity_id !== driver.entity_id);
        this.unselectedDrivers = [...this.unselectedDrivers, driver].sort((a, b) => a.name.localeCompare(b.name));
      } else {
        // Was unselected, now selecting
        this.unselectedDrivers = this.unselectedDrivers.filter(d => d.entity_id !== driver.entity_id);
        this.selectedDrivers = [...this.selectedDrivers, driver];
      }
    });
  }

  addAllDrivers() {
    this.updateListWithRefresh(() => {
      this.selectedDrivers = [...this.selectedDrivers, ...this.unselectedDrivers];
      this.unselectedDrivers = [];
    });
  }

  removeAllDrivers() {
    this.updateListWithRefresh(() => {
      this.unselectedDrivers = [...this.unselectedDrivers, ...this.selectedDrivers].sort((a, b) => a.name.localeCompare(b.name));
      this.selectedDrivers = [];
    });
  }

  randomizeDrivers() {
    this.updateListWithRefresh(() => {
      // Immutable shuffle
      const shuffled = [...this.selectedDrivers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      this.selectedDrivers = shuffled;
    });
  }

  private updateListWithRefresh(action: () => void) {
    this.clearSelectionAndBlur();

    // TODO(aufderheide): Look into proper fix for this hack
    // Trigger a complete DOM reset for the list to wipe any browser selection state
    this.isRefreshingList = true;
    this.cdr.detectChanges();

    // Perform the data update
    action();

    this.saveSettings();

    // Restore the list in the next tick
    setTimeout(() => {
      this.isRefreshingList = false;
      this.clearSelectionAsync();
      this.cdr.detectChanges();
    }, 0);
  }

  private clearSelectionAndBlur() {
    // Blur whatever button might have focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Clear selection immediately
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  private clearSelectionAsync() {
    setTimeout(() => {
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    }, 0);
  }

  trackByDriver(index: number, driver: Driver): string {
    return driver.entity_id;
  }

  preventSelection(event: Event) {
    event.preventDefault();
  }

  onDragStarted(event: any) {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  drop(event: CdkDragDrop<Driver[]>) {
    // Only reorder within the selected list and if dropped strictly inside the container
    if (event.container.id === 'selected-list' && event.isPointerOverContainer) {
      moveItemInArray(this.selectedDrivers, event.previousIndex, event.currentIndex);
      this.saveSettings();
    }
  }

  // --- Race Logic ---

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  selectRace(race: Race) {
    this.selectedRace = race;
    this.saveSettings();
    this.closeDropdown();
  }

  private saveSettings() {
    const localSettings = this.settingsService.getSettings();
    let recentRaceIds = localSettings.recentRaceIds || [];

    if (this.selectedRace) {
      // Prepend the new race ID, remove it if it was already in the list
      recentRaceIds = [this.selectedRace.entity_id, ...recentRaceIds.filter(id => id !== this.selectedRace?.entity_id)];
      // Keep only the last two
      recentRaceIds = recentRaceIds.slice(0, 2);
    }

    // Always persist
    const settings = new Settings(recentRaceIds, this.selectedDrivers.map(d => d.entity_id));
    this.settingsService.saveSettings(settings);
    this.updateQuickStartRaces(recentRaceIds);
  }

  startRace(isDemo: boolean = false) {
    if (this.selectedRace && this.selectedDrivers.length > 0) {
      console.log(`Starting race: ${this.selectedRace.name} with ${this.selectedDrivers.length} drivers`);

      // Ensure settings are up to date before redirecting
      this.saveSettings();

      const settings = this.settingsService.getSettings(); // Get back what we just saved (or what was there)

      this.dataService.initializeRace(this.selectedRace.entity_id, settings.selectedDriverIds, isDemo).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/raceday']);
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  updateQuickStartRaces(recentRaceIds: string[] = []) {
    this.quickStartRaces = [];

    // 1. Try to populate from recent list
    if (recentRaceIds && recentRaceIds.length > 0) {
      for (const id of recentRaceIds) {
        const race = this.races.find(r => r.entity_id === id);
        if (race) {
          this.quickStartRaces.push(race);
        }
      }
    }

    // 2. If we don't have enough, try to find "Grand Prix" or "Time Trial" as defaults if they aren't already in the list
    if (this.quickStartRaces.length < 2) {
      const defaults = [
        this.races.find(r => r.name.toLowerCase().includes('grand prix')),
        this.races.find(r => r.name.toLowerCase().includes('time trial'))
      ].filter(r => r !== undefined && !this.quickStartRaces.some(qsr => qsr.entity_id === r.entity_id)) as Race[];

      for (const d of defaults) {
        if (this.quickStartRaces.length < 2) {
          this.quickStartRaces.push(d);
        }
      }
    }

    // 3. Last fallback: just pick first available races
    if (this.quickStartRaces.length < 2) {
      const remaining = this.races.filter(r => !this.quickStartRaces.some(qsr => qsr.entity_id === r.entity_id));
      for (const r of remaining) {
        if (this.quickStartRaces.length < 2) {
          this.quickStartRaces.push(r);
        }
      }
    }
  }

  getStartRaceTooltip(): string {
    if (this.selectedDrivers.length > 0) return '';
    const translated = this.translationService.translate('RDS_START_RACE_TOOLTIP');
    console.log('DEBUG: getStartRaceTooltip returning:', translated);
    return translated;
  }

  getRaceCardBackgroundClass(index: number): string {
    const backgrounds = ['card-bg-gp', 'card-bg-tt']; // Add more if available
    return backgrounds[index % backgrounds.length];
  }

  get filteredUnselectedDrivers(): Driver[] {
    if (!this.driverSearchQuery) return this.unselectedDrivers;
    const q = this.driverSearchQuery.toLowerCase();
    return this.unselectedDrivers.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.nickname.toLowerCase().includes(q)
    );
  }

  get filteredRaces(): Race[] {
    if (!this.raceSearchQuery) return this.races;
    const q = this.raceSearchQuery.toLowerCase();
    return this.races.filter(r => r.name.toLowerCase().includes(q));
    return this.races.filter(r => r.name.toLowerCase().includes(q));
  }

  // --- Options Menu Logic ---

  toggleOptionsDropdown(event: Event) {
    event.stopPropagation();
    this.isOptionsDropdownOpen = !this.isOptionsDropdownOpen;
  }

  closeOptionsDropdown() {
    this.isOptionsDropdownOpen = false;
  }

  async configureCustomUI() {
    this.closeOptionsDropdown();
    const success = await this.fileSystem.selectCustomFolder();
    if (success) {
      sessionStorage.setItem('skipIntro', 'true');
      window.location.reload();
    }
  }

  async revertCustomUI() {
    this.closeOptionsDropdown();
    await this.fileSystem.clearCustomFolder();
    sessionStorage.setItem('skipIntro', 'true');
    window.location.reload();
  }

  openServerSettings() {
    this.closeOptionsDropdown();
    this.requestServerConfig.emit();
  }

  // --- File Menu Logic ---

  toggleFileDropdown(event: Event) {
    event.stopPropagation();
    this.isFileDropdownOpen = !this.isFileDropdownOpen;
  }

  closeFileDropdown() {
    this.isFileDropdownOpen = false;
  }

  openAssetManager() {
    this.closeFileDropdown();
    this.router.navigate(['/asset-manager']);
  }

  openDriverManager() {
    this.router.navigate(['/driver-manager']);
  }
}
