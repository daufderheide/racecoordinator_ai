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
          if (!this.editingRace.fuel_options) {
            this.editingRace.fuel_options = {
              enabled: false,
              reset_fuel_at_heat_start: false,
              end_heat_on_out_of_fuel: false,
              capacity: 100,
              usage_type: 'LINEAR',
              usage_rate: 4.0,
              start_level: 100,
              refuel_rate: 10,
              pit_stop_delay: 2.0,
              reference_time: 6.0
            };
          }
          this.originalRace = this.deepCopy(this.editingRace);
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
      fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        capacity: 100,
        usage_type: 'LINEAR',
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        reference_time: 6.0
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
      fuel_options: {
        enabled: this.editingRace.fuel_options.enabled,
        reset_fuel_at_heat_start: this.editingRace.fuel_options.reset_fuel_at_heat_start,
        end_heat_on_out_of_fuel: this.editingRace.fuel_options.end_heat_on_out_of_fuel,
        capacity: this.editingRace.fuel_options.capacity,
        usage_type: this.editingRace.fuel_options.usage_type,
        usage_rate: this.editingRace.fuel_options.usage_rate,
        start_level: this.editingRace.fuel_options.start_level,
        refuel_rate: this.editingRace.fuel_options.refuel_rate,
        pit_stop_delay: this.editingRace.fuel_options.pit_stop_delay,
        reference_time: this.editingRace.fuel_options.reference_time
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
      fuel_options: {
        enabled: this.editingRace.fuel_options.enabled,
        reset_fuel_at_heat_start: this.editingRace.fuel_options.reset_fuel_at_heat_start,
        end_heat_on_out_of_fuel: this.editingRace.fuel_options.end_heat_on_out_of_fuel,
        capacity: this.editingRace.fuel_options.capacity,
        usage_type: this.editingRace.fuel_options.usage_type,
        usage_rate: this.editingRace.fuel_options.usage_rate,
        start_level: this.editingRace.fuel_options.start_level,
        refuel_rate: this.editingRace.fuel_options.refuel_rate,
        pit_stop_delay: this.editingRace.fuel_options.pit_stop_delay
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

  // Fuel Graph Hover State
  hoveredPoint: {
    svgX: number,
    svgY: number,
    screenX: number,
    screenY: number,
    time: number,
    value: number,
    type: 'usage' | 'pit'
  } | null = null;

  // Cache for graph performance
  private usageGraphCache: {
    path: string;
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private pitGraphCache: {
    path: string;
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private getMaxFuelUsage(): number {
    if (!this.editingRace?.fuel_options) return 1;
    const usageRate = this.editingRace.fuel_options.usage_rate || 0;
    const usageType = this.editingRace.fuel_options.usage_type;
    const minTime = 2;
    const referenceTime = Number(this.editingRace.fuel_options.reference_time) || 6;

    let maxFuel = getAnalogFuelUsage(usageType, usageRate, minTime, referenceTime);

    if (isNaN(maxFuel) || !isFinite(maxFuel)) maxFuel = 0;
    return maxFuel <= 0 ? 1 : maxFuel;
  }

  private updateUsageGraphCache() {
    if (!this.editingRace?.fuel_options) return;

    const options = this.editingRace.fuel_options;
    const key = `${options.usage_type}_${options.usage_rate}_${options.reference_time}`;

    if (this.usageGraphCache && this.usageGraphCache.argsKey === key) return;

    const maxFuelValue = this.getMaxFuelUsage();
    const width = 400;
    const height = 150;
    const minTime = 2;
    const maxTime = 15;
    const usageRate = options.usage_rate || 0;
    const usageType = options.usage_type;
    const referenceTime = Number(options.reference_time) || 6;

    const points: string[] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const time = minTime + (i / steps) * (maxTime - minTime);
      const fuel = getAnalogFuelUsage(usageType, usageRate, time, referenceTime);
      const x = (i / steps) * width;
      const yRatio = maxFuelValue > 0 ? Math.max(0, Math.min(1.5, fuel / maxFuelValue)) : 0;
      const y = height - (yRatio * height);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const labels = [];
    for (let i = 4; i >= 0; i--) {
      labels.push(((maxFuelValue * i) / 4).toFixed(2));
    }

    this.usageGraphCache = {
      path: `M ${points.join(' L ')}`,
      labels: labels,
      maxVal: maxFuelValue,
      argsKey: key
    };
  }

  private getMaxPitTime(): number {
    if (!this.editingRace?.fuel_options) return 3600;
    const usageRate = Number(this.editingRace.fuel_options.usage_rate) || 0;
    const capacity = Number(this.editingRace.fuel_options.capacity) || 100;
    const usageType = this.editingRace.fuel_options.usage_type;
    const referenceTime = Number(this.editingRace.fuel_options.reference_time) || 6;
    const maxTime = 15;

    if (usageRate <= 0) return 3600;

    const minFuel = getAnalogFuelUsage(usageType, usageRate, maxTime, referenceTime);
    if (minFuel <= 0) return 3600;

    const pitTimeSeconds = (capacity / minFuel) * maxTime;
    const safePitTime = isNaN(pitTimeSeconds) || !isFinite(pitTimeSeconds) ? 3600 : Math.min(3600, pitTimeSeconds);
    return Math.max(1, safePitTime);
  }

  private updatePitGraphCache() {
    if (!this.editingRace?.fuel_options) return;

    const options = this.editingRace.fuel_options;
    const key = `${options.usage_type}_${options.usage_rate}_${options.reference_time}_${options.capacity}`;

    if (this.pitGraphCache && this.pitGraphCache.argsKey === key) return;

    const maxPitTime = this.getMaxPitTime();
    const width = 400;
    const height = 150;
    const minLapTime = 2;
    const maxLapTime = 15;
    const capacity = Number(options.capacity) || 100;
    const usageRate = Number(options.usage_rate) || 0;
    const usageType = options.usage_type;
    const referenceTime = Number(options.reference_time) || 6;

    const points: string[] = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const lapTime = minLapTime + (i / steps) * (maxLapTime - minLapTime);
      const fuelPerLap = getAnalogFuelUsage(usageType, usageRate, lapTime, referenceTime);

      let pitTimeSeconds = 0;
      if (fuelPerLap > 0) {
        pitTimeSeconds = (capacity / fuelPerLap) * lapTime;
      } else {
        pitTimeSeconds = maxPitTime;
      }

      const y = height - (i / steps) * height; // 2s at bottom, 15s at top
      const xPercent = maxPitTime > 0 ? Math.max(0, Math.min(1, pitTimeSeconds / maxPitTime)) : 1;
      const x = xPercent * width;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const labels = [];
    for (let i = 0; i <= 4; i++) {
      labels.push(Math.round((maxPitTime * i) / 4).toString());
    }

    this.pitGraphCache = {
      path: `M ${points.join(' L ')}`,
      labels: labels,
      maxVal: maxPitTime,
      argsKey: key
    };
  }

  getFuelUsagePath(): string {
    this.updateUsageGraphCache();
    return this.usageGraphCache?.path || '';
  }

  getFuelUsageYLabels(): string[] {
    this.updateUsageGraphCache();
    if (this.usageGraphCache) return this.usageGraphCache.labels;

    if (!this.editingRace?.fuel_options?.enabled) {
      return ['0.00', '0.00', '0.00', '0.00', '0.00'];
    }
    return [];
  }

  getPitGraphPath(): string {
    this.updatePitGraphCache();
    return this.pitGraphCache?.path || '';
  }

  getPitGraphXLabels(): string[] {
    this.updatePitGraphCache();
    if (this.pitGraphCache) return this.pitGraphCache.labels;

    if (!this.editingRace?.fuel_options?.enabled) {
      return ['0', '0', '0', '0', '0'];
    }
    return [];
  }

  onGraphMouseMove(event: MouseEvent, type: 'usage' | 'pit') {
    if (!this.editingRace?.fuel_options) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const minTime = 2;
    const maxTime = 15;

    if (type === 'usage') {
      const xPercent = Math.max(0, Math.min(1, mouseX / width));
      const time = minTime + xPercent * (maxTime - minTime);
      const usageRate = this.editingRace.fuel_options.usage_rate || 0;
      const usageType = this.editingRace.fuel_options.usage_type;
      const referenceTime = Number(this.editingRace.fuel_options.reference_time) || 6;
      const fuel = getAnalogFuelUsage(usageType, usageRate, time, referenceTime);

      this.updateUsageGraphCache();
      const maxVal = this.usageGraphCache?.maxVal || 1;
      const yPercent = Math.max(0, Math.min(1.5, fuel / maxVal));

      this.hoveredPoint = {
        svgX: Number((xPercent * 400).toFixed(2)),
        svgY: Number((150 - (yPercent * 150)).toFixed(2)),
        screenX: mouseX,
        screenY: mouseY,
        time: time,
        value: fuel,
        type: 'usage'
      };
    } else {
      // Pit Graph: Y is Lap Time (bottom 2, top 15)
      const yPercent = 1 - Math.max(0, Math.min(1, mouseY / height));
      const lapTime = minTime + yPercent * (maxTime - minTime);

      const usageRate = this.editingRace.fuel_options.usage_rate || 0;
      const usageType = this.editingRace.fuel_options.usage_type;
      const referenceTime = Number(this.editingRace.fuel_options.reference_time) || 6;
      const capacity = this.editingRace.fuel_options.capacity || 100;

      const fuelPerLap = getAnalogFuelUsage(usageType, usageRate, lapTime, referenceTime);
      let pitTime = 0;
      if (fuelPerLap > 0) pitTime = (capacity / fuelPerLap) * lapTime;

      this.updatePitGraphCache();
      const maxVal = this.pitGraphCache?.maxVal || 1;
      const xPercent = Math.max(0, Math.min(1.5, pitTime / maxVal));

      this.hoveredPoint = {
        svgX: Number((xPercent * 400).toFixed(2)),
        svgY: Number(((1 - yPercent) * 150).toFixed(2)),
        screenX: mouseX,
        screenY: mouseY,
        time: lapTime,
        value: pitTime,
        type: 'pit'
      };
    }
  }

  onGraphMouseLeave() {
    this.hoveredPoint = null;
  }
}

function getAnalogFuelUsage(usageType: string, usageRate: number, time: number, referenceTime: number): number {
  if (usageType === 'LINEAR') {
    const safeRefTime = Math.max(0.1, referenceTime);
    const x1 = safeRefTime * 2;
    const y1 = usageRate / 2;
    const x2 = safeRefTime;
    const y2 = usageRate;

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;

    const val = m * time + b;
    return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
  }

  const safeTime = Math.max(0.1, time);
  const safeRefTime = Math.max(0.1, referenceTime);
  let val = 0;
  if (usageType === 'QUADRATIC') {
    val = usageRate * (safeRefTime * safeRefTime) / (safeTime * safeTime);
  } else if (usageType === 'CUBIC') {
    val = usageRate * (safeRefTime * safeRefTime * safeRefTime) / (safeTime * safeTime * safeTime);
  }

  return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
}

