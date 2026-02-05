import { Component, OnInit, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { DataService } from '../../data.service';
import { Track, ArduinoConfig } from '../../models/track';
import { Lane } from '../../models/lane';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';
import { com } from '../../proto/message';

@Component({
  selector: 'app-track-editor',
  templateUrl: './track-editor.component.html',
  styleUrls: ['./track-editor.component.css'],
  standalone: false
})
export class TrackEditorComponent implements OnInit, OnDestroy {
  trackName: string = '';
  lanes: Lane[] = [];
  editingTrack?: Track;
  arduinoConfig?: ArduinoConfig;
  availablePorts: string[] = [];

  scale: number = 1;
  isLoading: boolean = true;
  isSaving: boolean = false;

  undoManager!: UndoManager<Track>;
  allTracks: Track[] = [];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.undoManager = new UndoManager<Track>(
      {
        clonner: (t) => this.cloneTrack(t),
        equalizer: (a, b) => this.areTracksEqual(a, b),
        applier: (t) => {
          this.editingTrack = t;
          if (this.editingTrack) {
            this.trackName = this.editingTrack.name;
            this.lanes = [...this.editingTrack.lanes];

            // Restore Arduino Config
            if (this.editingTrack.arduino_config) {
              this.arduinoConfig = JSON.parse(JSON.stringify(this.editingTrack.arduino_config));
            } else {
              this.initDefaultArduinoConfig();
            }
            this.cdr.detectChanges();
          }
        }
      },
      () => this.createSnapshot()
    );
  }

  ngOnInit() {
    this.updateScale();
    this.fetchPorts();

    // Subscribe to query params to reload data when ID changes (e.g. after Save as New)
    this.route.queryParamMap.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    this.undoManager.destroy();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScale();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'y') {
      event.preventDefault();
      this.redo();
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

  loadData() {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (!idParam) {
      this.router.navigate(['/track-manager']);
      return;
    }

    this.isLoading = true;
    this.dataService.getTracks().subscribe({
      next: (tracks) => {
        this.allTracks = tracks;

        if (idParam === 'new') {
          // Default new track
          this.editingTrack = new Track('new', '', [
            new Lane(this.generateId(), '#ef4444', 'black', 100),
            new Lane(this.generateId(), '#ffffff', 'black', 100)
          ]);
        } else {
          const found = tracks.find(t => t.entity_id === idParam);
          if (found) {
            // Deep copy for editing
            this.editingTrack = this.cloneTrack(found);
          } else {
            console.error('Track not found');
            this.router.navigate(['/track-manager']);
            return;
          }
        }

        if (this.editingTrack) {
          // Always ensure Arduino config exists (User requested "assume it's on")
          // We need to set it on the model BEFORE initializing undoManager so baseline is clean
          if (this.editingTrack.arduino_config) {
            this.arduinoConfig = JSON.parse(JSON.stringify(this.editingTrack.arduino_config));
          } else {
            this.initDefaultArduinoConfig();
            // Sync it back to the model object so undoManager sees it in initial snapshot
            (this.editingTrack as any).arduino_config = this.arduinoConfig;
          }

          this.trackName = this.editingTrack.name;
          this.lanes = [...this.editingTrack.lanes];

          // Now initialize tracking with a fully populated model
          this.undoManager.initialize(this.editingTrack);
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load tracks', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchPorts() {
    this.dataService.getSerialPorts().subscribe({
      next: (ports) => {
        this.availablePorts = ports;
      },
      error: (err) => console.error('Failed to fetch ports', err)
    });
  }

  // Helper for generating local IDs for new lanes if needed
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private cloneTrack(track: Track): Track {
    const lanesCopy = track.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length));
    const arduinoCopy = track.arduino_config ? JSON.parse(JSON.stringify(track.arduino_config)) : undefined;
    return new Track(track.entity_id, track.name, lanesCopy, arduinoCopy);
  }

  get isDirty(): boolean {
    if (!this.editingTrack) return false;
    return this.undoManager.hasChanges();
  }

  private createSnapshot(): Track {
    if (!this.editingTrack) {
      return new Track('new', '', []);
    }
    const config = this.arduinoConfig ? JSON.parse(JSON.stringify(this.arduinoConfig)) : undefined;
    return new Track(
      this.editingTrack.entity_id,
      this.trackName,
      this.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length)),
      config
    );
  }

  private areTracksEqual(t1: Track, t2: Track): boolean {
    if (t1.name !== t2.name) {
      console.log('Dirty Check Mismatch: Name differ', t1.name, t2.name);
      return false;
    }
    if (t1.lanes.length !== t2.lanes.length) {
      console.log('Dirty Check Mismatch: Lane count differ', t1.lanes.length, t2.lanes.length);
      return false;
    }
    for (let i = 0; i < t1.lanes.length; i++) {
      const l1 = t1.lanes[i];
      const l2 = t2.lanes[i];
      if (l1.entity_id !== l2.entity_id || l1.background_color !== l2.background_color ||
        l1.foreground_color !== l2.foreground_color || l1.length !== l2.length) {
        console.log(`Dirty Check Mismatch: Lane ${i} differ`, l1, l2);
        return false;
      }
    }

    // Check Arduino Config equality
    const ac1 = t1.arduino_config;
    const ac2 = t2.arduino_config;
    if (!ac1 && !ac2) return true;
    if (!ac1 || !ac2) {
      console.log('Dirty Check Mismatch: One config is missing', ac1, ac2);
      return false;
    }

    // Robust comparison of ArduinoConfig fields
    const keys = Object.keys(ac1) as (keyof ArduinoConfig)[];
    for (const key of keys) {
      const v1 = ac1[key];
      const v2 = (ac2 as any)[key];

      if (Array.isArray(v1)) {
        if (!Array.isArray(v2) || v1.length !== v2.length) {
          console.log(`Dirty Check Mismatch: Config ${key} length differ`, v1?.length, v2?.length);
          return false;
        }
        for (let i = 0; i < v1.length; i++) {
          if (v1[i] !== v2[i]) {
            console.log(`Dirty Check Mismatch: Config ${key}[${i}] differ`, v1[i], v2[i]);
            return false;
          }
        }
      } else if (v1 !== v2) {
        console.log(`Dirty Check Mismatch: Config ${key} differ`, v1, v2);
        return false;
      }
    }

    return true;
  }

  // Undo/Redo Proxies
  undo() {
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.undo();
    // View needs to update from the restored state
    // The applier updates editingTrack, but we need to sync local bound vars
    // (This logic is actually in the applier I defined in constructor)
  }
  redo() {
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.redo();
  }
  hasChanges() { return this.undoManager.hasChanges(); }

  onInputFocus() { this.undoManager.onInputFocus(); }
  onInputChange() {
    // Update the underlying model temporarily so captureState works?
    // Actually captureState calls createSnapshot which reads this.trackName/this.lanes
    // So we just need to ensure those are up to date (Angular binding does this).
    this.undoManager.onInputChange();
  }
  onInputBlur() { this.undoManager.onInputBlur(); }
  captureState() { this.undoManager.captureState(); }

  // Lane Management
  addLane() {
    this.lanes.push(new Lane(this.generateId(), '#ffffff', 'black', 100)); // Default white lane
    this.captureState();
  }

  removeLane(index: number) {
    this.lanes.splice(index, 1);
    this.captureState();
  }

  private colorDebounceTimer: any = null;

  updateLaneBackgroundColor(index: number, color: string) {
    // Update live
    const l = this.lanes[index];
    this.lanes[index] = new Lane(l.entity_id, l.foreground_color, color, l.length);

    if (!this.colorDebounceTimer) {
      this.captureState();
    }
    clearTimeout(this.colorDebounceTimer);

    this.colorDebounceTimer = setTimeout(() => {
      this.colorDebounceTimer = null;
    }, 400);
  }

  updateLaneForegroundColor(index: number, color: string) {
    // Update live
    const l = this.lanes[index];
    this.lanes[index] = new Lane(l.entity_id, color, l.background_color, l.length);

    if (!this.colorDebounceTimer) {
      this.captureState();
    }
    clearTimeout(this.colorDebounceTimer);

    this.colorDebounceTimer = setTimeout(() => {
      this.colorDebounceTimer = null;
    }, 400);
  }

  updateLaneLength(index: number, length: any) {
    const val = parseInt(length, 10);
    const l = this.lanes[index];
    this.lanes[index] = new Lane(l.entity_id, l.foreground_color, l.background_color, val);
    this.captureState();
  }

  // --- Arduino Configuration ---

  initDefaultArduinoConfig() {
    this.arduinoConfig = {
      name: 'Arduino',
      commPort: '',
      baudRate: 9600,
      debounceUs: 1000,
      globalInvertLanes: 0,
      globalInvertRelays: 0,
      globalInvertLights: 0,
      useLapsForPits: 0,
      useLapsForPitEnd: 0,
      usePitsAsLaps: 0,
      useLapsForSegments: 0,
      hardwareType: 0, // 0 = Uno, 1 = Mega
      digitalIds: new Array(60).fill(-1),
      analogIds: new Array(16).fill(-1),
      ledStrings: null,
      ledLaneColorOverrides: null
    };
  }

  // enableArduino removed as it's always on

  get availablePins(): number[] {
    if (!this.arduinoConfig) return [];
    // 0 = Uno, 1 = Mega
    // Uno: D2-D13 (12 pins), A0-A5 (6 pins)
    // Mega: D2-D53 (52 pins), A0-A15 (16 pins)

    const isMega = this.arduinoConfig.hardwareType === 1;
    const digitalCount = isMega ? 54 : 14;
    // Excluding 0 and 1 usually (RX/TX)? Let's assume all for now or 2+
    const pins = [];
    for (let i = 2; i < digitalCount; i++) pins.push(i);
    return pins;
  }

  get availableAnalogPins(): number[] {
    if (!this.arduinoConfig) return [];
    const isMega = this.arduinoConfig.hardwareType === 1;
    const analogCount = isMega ? 16 : 6;
    const pins = [];
    for (let i = 0; i < analogCount; i++) pins.push(i);
    return pins;
  }

  updateArduinoConfig() {
    // Trigger update/capture state if modifying properties directly
    // Or call this on change
    this.captureState();
  }

  // Helpers for pin assignment
  getPinBehavior(isDigital: boolean, pinIndex: number): number {
    if (!this.arduinoConfig) return -1;
    return isDigital ? this.arduinoConfig.digitalIds[pinIndex] : this.arduinoConfig.analogIds[pinIndex];
  }

  setPinBehavior(isDigital: boolean, pinIndex: number, behavior: string) {
    if (!this.arduinoConfig) return;
    const val = parseInt(behavior, 10);
    if (isDigital) {
      this.arduinoConfig.digitalIds[pinIndex] = val;
    } else {
      this.arduinoConfig.analogIds[pinIndex] = val;
    }
    this.captureState();
  }

  // Constants matching ArduinoProtocol.java
  // Replaced by com.antigravity.proto.PinBehavior

  getPinAction(isDigital: boolean, pinIndex: number): string {
    const val = this.getPinBehavior(isDigital, pinIndex);
    if (val === -1) return '';
    if (val === com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON) return 'master_call';

    if (val >= com.antigravity.proto.PinBehavior.BEHAVIOR_LAP_BASE && val < com.antigravity.proto.PinBehavior.BEHAVIOR_SEGMENT_BASE)
      return `lap_${val - com.antigravity.proto.PinBehavior.BEHAVIOR_LAP_BASE}`;

    if (val >= com.antigravity.proto.PinBehavior.BEHAVIOR_SEGMENT_BASE && val < com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE)
      return `segment_${val - com.antigravity.proto.PinBehavior.BEHAVIOR_SEGMENT_BASE}`;

    if (val >= com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE && val < com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + 1000)
      return `call_${val - com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE}`;

    return '';
  }

  setPinAction(isDigital: boolean, pinIndex: number, action: string) {
    let val = -1;
    if (action === 'master_call') {
      val = com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON;
    } else if (action.startsWith('lap_')) {
      const laneIndex = parseInt(action.split('_')[1], 10);
      val = com.antigravity.proto.PinBehavior.BEHAVIOR_LAP_BASE + laneIndex;
    } else if (action.startsWith('segment_')) {
      const laneIndex = parseInt(action.split('_')[1], 10);
      val = com.antigravity.proto.PinBehavior.BEHAVIOR_SEGMENT_BASE + laneIndex;
    } else if (action.startsWith('call_')) {
      const laneIndex = parseInt(action.split('_')[1], 10);
      val = com.antigravity.proto.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + laneIndex;
    }

    this.setPinBehavior(isDigital, pinIndex, val.toString());
  }

  saveAsNew() {
    this.updateTrack(true);
  }

  updateTrack(isSaveAsNew: boolean = false) {
    if (!this.editingTrack) return;

    // Validate
    if (!this.trackName.trim()) {
      alert(this.translationService.translate('TE_ERROR_NAME_REQUIRED'));
      return;
    }

    this.isSaving = true;

    // Construct payload
    const finalTrack = this.createSnapshot();

    if (isSaveAsNew || finalTrack.entity_id === 'new') {
      // ID will be generated by server/handler logic but we send 'new' or null ID implicitly
      // Client model constructor enforces ID, but for sending we can just rely on the object structure
      // If we really need to change ID to 'new' for the call:
      // We can't change readonly property easily, but createSnapshot uses editingTrack.entity_id
    }

    // We need to send a plain object usually, but DataService takes 'any'
    // If saving as new, we treat it as create
    const wasNew = isSaveAsNew || finalTrack.entity_id === 'new';

    const obs = wasNew
      ? this.dataService.createTrack({ ...finalTrack, entity_id: 'new' })
      : this.dataService.updateTrack(finalTrack.entity_id, finalTrack);

    obs.subscribe({
      next: (result) => {
        this.isSaving = false;
        // Update local state with result (especially ID)
        this.editingTrack = new Track(result.entity_id, result.name, result.lanes, result.arduino_config);

        // Update allTracks cache to ensure name uniqueness checks stay in sync
        const idx = this.allTracks.findIndex(t => t.entity_id === result.entity_id);
        if (idx >= 0) {
          this.allTracks[idx] = this.editingTrack;
        } else {
          this.allTracks.push(this.editingTrack);
        }

        // Sync local UI state with server result to ensure clean state matches
        this.trackName = this.editingTrack.name;
        // Ensure lanes are proper objects/arrays as expected
        // Ensure lanes are proper objects/arrays as expected
        this.lanes = this.editingTrack.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length));

        if (this.editingTrack.arduino_config) {
          this.arduinoConfig = JSON.parse(JSON.stringify(this.editingTrack.arduino_config));
        } else {
          this.arduinoConfig = undefined;
        }

        this.undoManager.resetTracking(this.editingTrack);

        // Force sync with UI and children (especially back-button confirm input)
        this.cdr.detectChanges();

        if (wasNew) {
          this.router.navigate(['/track-editor'], { queryParams: { id: result.entity_id } });
        }
      },
      error: (err) => {
        console.error('Failed to save track', err);
        if (err.status === 409) {
          alert(this.translationService.translate('TE_ERROR_NAME_EXISTS'));
        } else {
          alert(this.translationService.translate('TE_ERROR_SAVE_FAILED'));
        }
        this.isSaving = false;
      }
    });
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.trackName) return false;
    const name = this.trackName.trim().toLowerCase();
    return !this.allTracks.some(t => {
      if (excludeSelf && this.editingTrack && t.entity_id === this.editingTrack.entity_id) {
        return false;
      }
      return t.name.toLowerCase() === name;
    });
  }

  onBack() {
    this.router.navigate(['/track-manager']);
  }

  trackByLane(index: number, lane: Lane): string {
    return lane.entity_id;
  }
}
