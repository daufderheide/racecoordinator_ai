import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
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

@Component({
  selector: 'app-raceday-setup',
  templateUrl: './raceday-setup.component.html',
  styleUrl: './raceday-setup.component.css',
  standalone: false
})
export class RacedaySetupComponent implements OnInit {
  // Driver State
  selectedDrivers: Driver[] = [];
  unselectedDrivers: Driver[] = [];

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
  menuItems = [
    { label: 'File', action: () => console.log('File menu') },
    { label: 'Track', action: () => console.log('Track menu') },
    { label: 'Driver', action: () => console.log('Driver menu') },
    { label: 'Race', action: () => console.log('Race menu') },
    { label: 'Season', action: () => console.log('Season menu') },
    { label: 'Options', action: () => console.log('Options menu') },
    { label: 'Help', action: () => console.log('Help menu') }
  ];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private raceService: RaceService,
    private router: Router,
    private translationService: TranslationService,
    private settingsService: SettingsService
  ) { }

  ngOnInit() {
    this.updateScale();

    forkJoin({
      drivers: this.dataService.getDrivers(),
      races: this.dataService.getRaces()
    }).subscribe({
      next: (result) => {
        const drivers = result.drivers.map(d => new Driver(d.entity_id, d.name, d.nickname || ''));
        const races = result.races;

        // --- Race Setup ---
        this.races = races.sort((a, b) => a.name.localeCompare(b.name));

        // Setup Quick Start (For now, just pick the first two or specific ones)
        // Ideally checking for "Grand Prix" or "Time Trial"
        const gp = this.races.find(r => r.name.toLowerCase().includes('grand prix')) || this.races[0];
        const tt = this.races.find(r => r.name.toLowerCase().includes('time trial')) || this.races[1];

        if (gp) this.quickStartRaces.push(gp);
        if (tt && tt !== gp) this.quickStartRaces.push(tt);
        if (this.quickStartRaces.length < 2 && this.races.length >= 2) {
          // Fill if duplicates or missing
          this.quickStartRaces = this.races.slice(0, 2);
        }

        const localSettings = this.settingsService.getSettings();
        if (localSettings && localSettings.selectedRaceId) {
          this.selectedRace = this.races.find(r => r.entity_id === localSettings.selectedRaceId);
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

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;

    this.scale = Math.min(scaleX, scaleY);
  }

  // --- Driver Logic ---

  toggleDriverSelection(driver: Driver, isSelected: boolean) {
    if (isSelected) {
      // Was selected, now unselecting
      // Remove from selected
      this.selectedDrivers = this.selectedDrivers.filter(d => d.entity_id !== driver.entity_id);
      // Add to unselected and sort
      this.unselectedDrivers.push(driver);
      this.unselectedDrivers.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Was unselected, now selecting
      // Remove from unselected
      this.unselectedDrivers = this.unselectedDrivers.filter(d => d.entity_id !== driver.entity_id);
      // Add to end of selected
      this.selectedDrivers.push(driver);
      // No sort needed for selected (user order)
    }
    this.cdr.detectChanges();
  }

  drop(event: CdkDragDrop<Driver[]>) {
    // Only reorder within the selected list
    if (event.container.id === 'selected-list') {
      moveItemInArray(this.selectedDrivers, event.previousIndex, event.currentIndex);
    }
  }

  // --- Race Logic ---

  selectRace(race: Race) {
    this.selectedRace = race;
  }

  startRace(isDemo: boolean = false) {
    if (this.selectedRace && this.selectedDrivers.length > 0) {
      console.log(`Starting race: ${this.selectedRace.name} with ${this.selectedDrivers.length} drivers`);

      const settings = new Settings(this.selectedRace.entity_id, this.selectedDrivers.map(d => d.entity_id));
      this.settingsService.saveSettings(settings);

      this.dataService.initializeRace(this.selectedRace.entity_id, settings.selectedDriverIds, isDemo).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigateByUrl('/raceday');
          }
        },
        error: (err) => console.error(err)
      });
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
  }
}
