import { Component, OnInit, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-race-editor',
  templateUrl: './race-editor.component.html',
  styleUrls: ['./race-editor.component.css'],
  standalone: false
})
export class RaceEditorComponent implements OnInit, OnDestroy {
  editingRace: any;
  originalRace: any;
  isLoading: boolean = true;
  isSaving: boolean = false;
  scale: number = 1;
  undoManager: UndoManager<any>;
  tracks: any[] = [];
  races: any[] = [];
  driverCount: number = 10;
  generatedHeats: any[] = [];

  heatRotationTypes = ['RoundRobin', 'Bracket', 'Swiss'];
  raceScoringTypes = ['Points', 'Time'];

  // Acknowledgement modal properties
  showAckModal: boolean = false;
  ackModalTitle: string = '';
  ackModalMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {
    this.undoManager = new UndoManager<any>(
      {
        clonner: (race) => this.deepCopy(race),
        equalizer: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        applier: (race) => {
          const currentId = this.editingRace?.entity_id;
          this.editingRace = race;
          if (currentId && this.editingRace) {
            this.editingRace.entity_id = currentId;
          }
        }
      },
      () => this.editingRace
    );
  }

  ngOnInit() {
    this.updateScale();

    // Get driver count from query param (from race day setup) or default to 10
    const driverCountParam = this.route.snapshot.queryParamMap.get('driverCount');
    if (driverCountParam) {
      this.driverCount = parseInt(driverCountParam, 10);
    }

    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.loadRace(id);
    } else {
      this.createNewRace();
    }
    this.loadTracks();
    this.loadRaces();
  }

  ngOnDestroy() {
    this.undoManager.destroy();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScale();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      if (event.shiftKey) {
        event.preventDefault();
        this.undoManager.redo();
      } else {
        event.preventDefault();
        this.undoManager.undo();
      }
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
    if (this.scale <= 0 || isNaN(this.scale)) {
      this.scale = 1;
    }
  }

  loadRace(id: string) {
    this.isLoading = true;
    this.dataService.getRaces().subscribe({
      next: (races) => {
        const race = races.find(r => r.entity_id === id);
        if (race) {
          this.editingRace = this.deepCopy(race);
          this.originalRace = this.deepCopy(race);
          this.undoManager.initialize(this.editingRace);
          // Load heats if we have a valid race
          if (this.driverCount > 0) {
            this.loadHeats();
          }
        }
        this.isLoading = false;
        // Safe to call here - triggered by async data load, not user input
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        console.error('Failed to load race', err);
        this.isLoading = false;
      }
    });
  }

  loadTracks() {
    this.dataService.getTracks().subscribe({
      next: (tracks) => {
        this.tracks = tracks;
        // Safe to call here - triggered by async data load, not user input
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        console.error('Failed to load tracks', err);
      }
    });
  }

  createNewRace() {
    this.editingRace = {
      entity_id: 'new',
      name: '',
      track_entity_id: '',
      heat_rotation_type: 'RoundRobin',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME',
        allow_finish: 'None'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      },
      min_lap_time: 0
    };
    this.originalRace = this.deepCopy(this.editingRace);
    this.undoManager.initialize(this.editingRace);
    this.isLoading = false;
    // Safe to call here - triggered during initialization, not user input
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  onInputChange() {
    // Called when any input changes
  }

  captureState() {
    this.undoManager.captureState();
    // Regenerate heats when rotation type changes (even for new races)
    if (this.driverCount > 0) {
      this.loadHeats();
    }
  }

  onRotationTypeChange() {
    console.log('Rotation type changed to:', this.editingRace?.heat_rotation_type);
    this.captureState();
    // Immediately update heats when rotation type changes
    this.loadHeats();
  }

  onDriverCountChange() {
    console.log('Driver count changed to:', this.driverCount);
    // Update heats when driver count changes
    this.loadHeats();
  }

  loadHeats() {
    console.log('loadHeats called - entity_id:', this.editingRace?.entity_id, 'driverCount:', this.driverCount, 'trackId:', this.editingRace?.track_entity_id, 'rotationType:', this.editingRace?.heat_rotation_type);

    // Clear heats if missing required data
    if (!this.editingRace || this.driverCount <= 0 || !this.editingRace.track_entity_id || !this.editingRace.heat_rotation_type) {
      console.log('Clearing heats - missing required data');
      this.generatedHeats = [];
      return;
    }

    // Always use preview endpoint to show heats based on current form values
    // This allows users to see heat changes before saving the race
    console.log('Calling previewHeats with current form values');
    this.dataService.previewHeats(
      this.editingRace.track_entity_id,
      this.editingRace.heat_rotation_type,
      this.driverCount
    ).subscribe({
      next: (response) => {
        console.log('Preview heats response:', response);
        this.generatedHeats = [...(response.heats || [])]; // Force new array reference
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to preview heats', err);
        this.generatedHeats = [];
        this.cdr.detectChanges();
      }
    });
  }

  hasChanges(): boolean {
    const umChanges = this.undoManager.hasChanges();
    const manualChanges = JSON.stringify(this.editingRace) !== JSON.stringify(this.originalRace);
    return umChanges || manualChanges;
  }

  updateRace() {
    if (!this.editingRace || !this.hasChanges()) {
      return;
    }

    this.isSaving = true;
    const payload = {
      name: this.editingRace.name,
      track_entity_id: this.editingRace.track_entity_id,
      heat_rotation_type: this.editingRace.heat_rotation_type,
      heat_scoring: {
        finish_method: this.editingRace.heat_scoring.finish_method,
        finish_value: this.editingRace.heat_scoring.finish_value,
        heat_ranking: this.editingRace.heat_scoring.heat_ranking,
        heat_ranking_tiebreaker: this.editingRace.heat_scoring.heat_ranking_tiebreaker,
        allow_finish: this.editingRace.heat_scoring.allow_finish
      },
      overall_scoring: {
        dropped_heats: this.editingRace.overall_scoring.dropped_heats,
        ranking_method: this.editingRace.overall_scoring.ranking_method,
        tiebreaker: this.editingRace.overall_scoring.tiebreaker
      },
      min_lap_time: this.editingRace.min_lap_time
    };

    if (this.editingRace.entity_id === 'new') {
      this.dataService.createRace(payload).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.loadRaces();  // Reload races to update duplicate detection
          this.cdr.detectChanges(); // Ensure spinner clears
          this.router.navigate(['/race-manager'], { queryParams: { id: created.entity_id, driverCount: this.driverCount } });
        },
        error: (err) => {
          console.error('Failed to create race', err);
          this.showError('Error Creating Race', err.error || err.message || 'Unknown error');
          this.isSaving = false;
          this.loadRaces();  // Reload races after error
          this.cdr.detectChanges(); // Ensure spinner clears
        }
      });
    } else {
      this.dataService.updateRace(this.editingRace.entity_id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          // Sync originalRace with editingRace so hasChanges() returns false
          this.originalRace = this.deepCopy(this.editingRace);
          // Reset tracking point but keep history
          this.undoManager.resetTracking(this.editingRace);
          this.loadRaces();  // Reload races to update duplicate detection
          this.cdr.detectChanges();  // Force change detection to hide spinner
          // Stay on the race editor page after updating
        },
        error: (err) => {
          console.error('Failed to update race', err);
          this.showError('Error Updating Race', err.error || err.message || 'Unknown error');
          this.isSaving = false;
          this.loadRaces();  // Reload races after error
          this.cdr.detectChanges();  // Force change detection to hide spinner
        }
      });
    }
  }

  saveAsNew() {
    if (!this.editingRace || !this.canSaveAsNew()) return;

    this.isSaving = true;
    const payload = {
      name: this.editingRace.name,  // Use the actual name from the editor
      track_entity_id: this.editingRace.track_entity_id,
      heat_rotation_type: this.editingRace.heat_rotation_type,
      heat_scoring: {
        finish_method: this.editingRace.heat_scoring.finish_method,
        finish_value: this.editingRace.heat_scoring.finish_value,
        heat_ranking: this.editingRace.heat_scoring.heat_ranking,
        heat_ranking_tiebreaker: this.editingRace.heat_scoring.heat_ranking_tiebreaker,
        allow_finish: this.editingRace.heat_scoring.allow_finish
      },
      overall_scoring: {
        dropped_heats: this.editingRace.overall_scoring.dropped_heats,
        ranking_method: this.editingRace.overall_scoring.ranking_method,
        tiebreaker: this.editingRace.overall_scoring.tiebreaker
      },
      min_lap_time: this.editingRace.min_lap_time
    };

    this.dataService.createRace(payload).subscribe({
      next: (created) => {
        this.isSaving = false;
        // Update the current race to the newly created one
        this.editingRace = created;
        this.originalRace = this.deepCopy(created);
        // Reset tracking point but keep history
        this.undoManager.resetTracking(this.editingRace);
        // Reload heats for the new race
        this.loadHeats();
        // Reload races to update duplicate detection
        this.loadRaces();
        // Force change detection
        this.cdr.detectChanges();
        // Update URL without navigation
        this.router.navigate([], {
          queryParams: { id: created.entity_id, driverCount: this.driverCount },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      },
      error: (err) => {
        console.error('Failed to save as new race', err);
        this.showError('Error Saving Race', err.error || err.message || 'Unknown error');
        this.isSaving = false;
        // Reload races to update duplicate detection
        this.loadRaces();
      }
    });
  }

  private deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  loadRaces() {
    this.dataService.getRaces().subscribe({
      next: (races) => {
        this.races = races;
      },
      error: (err) => {
        console.error('Failed to load races', err);
        this.races = [];
      }
    });
  }

  isNameDuplicate(): boolean {
    if (!this.editingRace?.name) {
      return false;
    }

    const trimmedName = this.editingRace.name.trim().toLowerCase();
    return this.races.some((race) =>
      race.entity_id !== this.editingRace.entity_id &&
      race.name.trim().toLowerCase() === trimmedName
    );
  }

  canSaveAsNew(): boolean {
    if (!this.editingRace?.name || !this.originalRace) {
      return false;
    }

    // Must have changed the name from the original
    const nameChanged = this.editingRace.name.trim() !== this.originalRace.name.trim();

    // And the new name must not be a duplicate
    return nameChanged && !this.isNameDuplicate();
  }

  canUpdate(): boolean {
    // Must have changes
    if (!this.hasChanges()) {
      return false;
    }

    // And the name must not be a duplicate
    return !this.isNameDuplicate();
  }

  getUpdateTooltip(): string {
    if (!this.hasChanges()) {
      return 'RE_TOOLTIP_NO_CHANGES';
    }
    if (this.isNameDuplicate()) {
      return 'RE_TOOLTIP_NAME_EXISTS';
    }
    return '';
  }

  showError(title: string, message: string) {
    this.ackModalTitle = title;
    this.ackModalMessage = message;
    this.showAckModal = true;
  }

  closeAckModal() {
    this.showAckModal = false;
  }
}
