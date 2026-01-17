import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { DataService } from '../../data.service';
import { Driver } from '../../models/driver';
import { Track } from '../../models/track';
import { Race } from '../../models/race';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { RaceService } from '../../services/race.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { SettingsService } from '../../services/settings.service';
import { Settings } from '../../models/settings';

@Component({
  selector: 'app-raceday-setup',
  templateUrl: './raceday-setup.component.html',
  styleUrl: './raceday-setup.component.css',
  standalone: false
})
export class RacedaySetupComponent implements OnInit {
  availableDrivers: Driver[] = [];
  racingDrivers: Driver[] = [];
  tracks: Track[] = [];
  selectedTrack?: Track;

  races: Race[] = [];
  selectedRace?: Race;

  raceType: string = 'single';
  raceSelection: string = 'Round Robin';
  seasonSelection: string = 'None';
  demoMode: boolean = false;

  scale: number = 1;
  translationsLoaded: boolean = false;

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
    this.loadTracks();

    forkJoin({
      drivers: this.dataService.getDrivers(),
      races: this.dataService.getRaces()
    }).subscribe({
      next: (result) => {
        const drivers = result.drivers.map(d => new Driver(d.entity_id, d.name, d.nickname || ''));
        const races = result.races;
        // Races setup
        const localSettings = this.settingsService.getSettings();


        this.races = races.sort((a: any, b: any) => a.name.localeCompare(b.name));
        if (localSettings && localSettings.selectedRaceId) {
          this.selectedRace = this.races.find(r => r.entity_id === localSettings.selectedRaceId);
        }
        if (!this.selectedRace && this.races.length > 0) {
          this.selectedRace = this.races[0];
          console.log('RacedaySetupComponent: Selected default race:', this.selectedRace);
        }

        // Drivers setup
        if (localSettings && localSettings.selectedDriverIds) {
          this.racingDrivers = [];
          this.availableDrivers = [];
          const driverMap = new Map(drivers.map(d => [d.entity_id, d]));

          // Add selected drivers in order
          for (const id of localSettings.selectedDriverIds) {
            const d = driverMap.get(id);
            if (d) {
              this.racingDrivers.push(d);
              driverMap.delete(id);
            }
          }
          // Remaining go to available
          this.availableDrivers = Array.from(driverMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        } else {
          this.availableDrivers = drivers.sort((a, b) => a.name.localeCompare(b.name));
          this.racingDrivers = [];
        }
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

    // Use specific logic to match "meet" behavior (contain)
    this.scale = Math.min(scaleX, scaleY);
  }



  loadTracks() {
    this.dataService.getTracks().subscribe({
      next: (data) => {
        this.tracks = data;
        if (this.tracks.length > 0) {
          this.selectedTrack = this.tracks[0];
          console.log('RacedaySetupComponent: Selected default track:', this.selectedTrack);
        }
      },
      error: (err) => console.error('Error loading tracks', err)
    });
  }

  addAll() {
    this.racingDrivers = [...this.racingDrivers, ...this.availableDrivers];
    this.availableDrivers = [];
  }

  removeAll() {
    this.availableDrivers = [...this.availableDrivers, ...this.racingDrivers].sort((a, b) => a.name.localeCompare(b.name));
    this.racingDrivers = [];
  }

  randomize() {
    // Only shuffle the drivers already in the racing list
    this.racingDrivers = [...this.racingDrivers].sort(() => Math.random() - 0.5);
  }

  toggleDriver(driver: Driver, from: 'available' | 'racing') {
    if (from === 'available') {
      // Guard: Don't add if already in racing list
      if (this.racingDrivers.find(d => d.name === driver.name)) return;

      this.availableDrivers = this.availableDrivers.filter(d => d.name !== driver.name);
      this.racingDrivers = [...this.racingDrivers, driver];
    } else {
      // Guard: Don't add if already in available list
      if (this.availableDrivers.find(d => d.name === driver.name)) return;

      this.racingDrivers = this.racingDrivers.filter(d => d.name !== driver.name);
      this.availableDrivers = [...this.availableDrivers, driver]
        .sort((a, b) => a.name.localeCompare(b.name));
      this.cdr.detectChanges();
    }
  }

  drop(event: CdkDragDrop<Driver[]>) {
    // If moving within the same container
    if (event.previousContainer === event.container) {
      // Only allow reordering in the racing list
      if (event.container.id === 'racing-list') {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      }
      // If it's the available list, do nothing (retain alphabetical)
    } else {
      // Moving between containers
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      // Always sort available drivers if they were moved back
      if (event.container.id === 'available-list') {
        this.availableDrivers.sort((a, b) => a.name.localeCompare(b.name));
      }
      this.cdr.detectChanges();
    }
  }

  startRace() {
    console.log('RacedaySetupComponent: Starting race with:', this.racingDrivers);
    if (this.selectedRace && this.selectedTrack) {
      // Save settings
      const settings = new Settings(this.selectedRace.entity_id, this.racingDrivers.map(d => d.entity_id));
      this.settingsService.saveSettings(settings);

      // Send start race message to server
      const driverIds = this.racingDrivers.map(d => d.entity_id);
      this.dataService.initializeRace(this.selectedRace.entity_id, driverIds).subscribe({
        next: (success) => console.log('RacedaySetupComponent: Race initialized on server:', success),
        error: (err) => console.error('RacedaySetupComponent: Error initializing race on server:', err)
      });

      this.raceService.setRacingDrivers(this.racingDrivers);
      this.raceService.setTrack(this.selectedTrack);
      this.raceService.setRace(this.selectedRace);
      this.router.navigateByUrl('/raceday').then(
        success => {
          if (success) {
            console.log('RacedaySetupComponent: Navigation to /raceday successful');
          } else {
            console.error('RacedaySetupComponent: Navigation to /raceday failed');
          }
        },
        error => {
          console.error('RacedaySetupComponent: Navigation error:', error);
        }
      );
    } else {
      console.error('No race or track selected!');
      // Ideally show a message to the user
    }
  }

  getStartRaceTooltip(): string {
    if (this.racingDrivers.length > 0) return '';
    const translated = this.translationService.translate('RDS_START_RACE_TOOLTIP');
    console.log('DEBUG: getStartRaceTooltip returning:', translated);
    return translated;
  }


}
