import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { HelpService, GuideStep } from '../../services/help.service';

@Component({
  selector: 'app-race-manager',
  templateUrl: './race-manager.component.html',
  styleUrls: ['./race-manager.component.css'],
  standalone: false
})
export class RaceManagerComponent implements OnInit, OnDestroy {
  races: any[] = [];
  tracks: any[] = [];
  selectedRace?: any;
  editingRace?: any;
  isLoading: boolean = true;
  isSaving: boolean = false;
  scale: number = 1;
  searchQuery: string = '';
  driverCount: number = 10;
  generatedHeats: any[] = [];
  @ViewChildren('raceRow') raceRows!: QueryList<ElementRef>;
  isSummaryExpanded: boolean = true;
  isHeatListExpanded: boolean = true;

  toggleSummary() {
    this.isSummaryExpanded = !this.isSummaryExpanded;
    this.cdr.detectChanges();
  }

  toggleHeatList() {
    this.isHeatListExpanded = !this.isHeatListExpanded;
    this.cdr.detectChanges();
  }

  get filteredRaces(): any[] {
    let filtered = this.races;
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = this.races.filter(r =>
        (r.name && r.name.toLowerCase().includes(query)) ||
        (r.track?.name && r.track.name.toLowerCase().includes(query)) ||
        (r.heat_rotation_type && this.getHeatRotationTypeDisplay(r.heat_rotation_type).toLowerCase().includes(query))
      );
    }
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute,
    private connectionMonitor: ConnectionMonitorService,
    private helpService: HelpService
  ) { }

  ngOnInit() {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();

    // Get driver count from query params
    const driverCountParam = this.route.snapshot.queryParamMap.get('driverCount');
    if (driverCountParam) {
      this.driverCount = parseInt(driverCountParam, 10);
    }

    this.loadData();
  }

  ngOnDestroy() {
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
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

  loadData() {
    this.isLoading = true;
    this.dataService.getRaces().subscribe({
      next: (races) => {
        this.races = races;

        const selectedId = this.route.snapshot.queryParamMap.get('id');
        if (selectedId) {
          const found = this.races.find(r => r.entity_id === selectedId);
          if (found) {
            this.selectRace(found);
          } else if (this.races.length > 0 && !this.selectedRace) {
            this.selectRace(this.races[0]);
          }
        } else if (this.races.length > 0 && !this.selectedRace) {
          this.selectRace(this.races[0]);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load races', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.dataService.getTracks().subscribe({
      next: (tracks) => {
        this.tracks = tracks;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load tracks', err);
      }
    });
  }

  selectRace(race: any) {
    this.selectedRace = race;
    this.editingRace = { ...race };

    // Clear the previous heats first
    this.generatedHeats = [];

    // Load new heats for the selected race
    if (this.driverCount > 0 && race.entity_id) {
      this.loadHeats(race.entity_id);
    }

    // Scroll into view
    setTimeout(() => {
      const row = this.raceRows.find(r => r.nativeElement.getAttribute('data-id') === race.entity_id);
      if (row) {
        row.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }

  loadHeats(raceId: string) {
    if (this.driverCount <= 0) return;

    this.dataService.generateHeats(raceId, this.driverCount).subscribe({
      next: (response) => {
        this.generatedHeats = response.heats || [];
        this.cdr.detectChanges(); // Trigger change detection to update UI
      },
      error: (err) => {
        console.error('Failed to generate heats', err);
        this.generatedHeats = [];
      }
    });
  }

  monitorConnection() {
    this.connectionSubscription = this.connectionMonitor.connectionState$.subscribe(state => {
      this.isConnectionLost = (state === ConnectionState.DISCONNECTED);
    });
  }

  updateRace() {
    if (!this.selectedRace) return;
    this.router.navigate(['/race-editor'], { queryParams: { id: this.selectedRace.entity_id, driverCount: this.driverCount } });
  }

  showDeleteConfirmation = false;

  deleteRace() {
    if (!this.editingRace) return;
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete() {
    if (!this.editingRace) return;
    this.showDeleteConfirmation = false;
    this.isSaving = true;
    this.dataService.deleteRace(this.editingRace.entity_id).subscribe({
      next: () => {
        this.selectedRace = undefined;
        this.editingRace = undefined;
        this.isSaving = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to delete race', err);
        this.isSaving = false;
      }
    });
  }

  onCancelDelete() {
    this.showDeleteConfirmation = false;
  }

  trackByRace(index: number, race: any): string {
    return race.entity_id;
  }

  onSearchChange() {
    // No need to manually trigger change detection
    // Angular will handle this automatically
  }

  getHeatRotationTypeDisplay(type: string | undefined): string {
    if (!type) return '';
    // Convert enum format to display format (e.g., "RoundRobin" -> "Round Robin")
    return type.replace(/([A-Z])/g, ' $1').trim();
  }

  createNewRace() {
    if (this.isSaving) return;
    this.isSaving = true;

    const baseName = "New Race";
    const uniqueName = this.generateUniqueRaceName(baseName);

    const newRace: any = {
      name: uniqueName,
      heat_rotation_type: 'RoundRobin',
      heat_scoring: {
        finish_method: 'Timed',
        finish_value: 15,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME',
        allow_finish: 'None'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'TOTAL_TIME'
      }
    };

    if (this.tracks && this.tracks.length === 1) {
      newRace.track_entity_id = this.tracks[0].entity_id;
    }

    this.dataService.createRace(newRace).subscribe({
      next: (createdRace: any) => {
        this.isSaving = false;
        
        // Navigate to Race Editor
        this.router.navigate(['/race-editor'], { queryParams: { id: createdRace.entity_id, driverCount: this.driverCount } });
      },
      error: (err) => {
        console.error('Failed to create new race', err);
        this.isSaving = false;
      }
    });
  }

  private generateUniqueRaceName(baseName: string): string {
    let name = baseName;
    if (!this.races.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      return name;
    }
    let counter = 1;
    while (true) {
      const candidate = `${baseName}_${counter}`;
      if (!this.races.some(r => r.name.toLowerCase() === candidate.toLowerCase())) {
        return candidate;
      }
      counter++;
    }
  }

  formatEnumDisplay(value: string | undefined): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  startHelp() {
    const steps: GuideStep[] = [
      {
        title: "Welcome to Race Manager",
        content: "Here you can manage your races. Select a race from the list to view its summary setup.",
        position: 'center'
      }
    ];
    this.helpService.startGuide(steps);
  }
}
