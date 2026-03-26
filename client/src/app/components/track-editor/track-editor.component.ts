import { Component, OnInit, ChangeDetectorRef, HostListener, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { DataService } from '../../data.service';
import { Track, ArduinoConfig, MAX_DIGITAL_PINS, MAX_ANALOG_PINS } from '../../models/track';
import { Lane } from '../../models/lane';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { HelpService, GuideStep } from '../../services/help.service';
import { SettingsService } from '../../services/settings.service';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';
import { BehaviorSubject, Observable, interval, Subscription, of } from 'rxjs';
import { com } from '../../proto/message';
import { Location } from '@angular/common';
import { ArduinoEditorComponent } from './arduino-editor/arduino-editor.component';

@Component({
  selector: 'app-track-editor',
  templateUrl: './track-editor.component.html',
  styleUrls: ['./track-editor.component.css'],
  standalone: false
})
export class TrackEditorComponent implements OnInit, OnDestroy {
  private isDestroyed = false;
  private subscriptions: Subscription[] = [];
  trackName: string = '';
  lanes: Lane[] = [];
  editingTrack?: Track;
  arduinoConfigs: ArduinoConfig[] = [];

  scale: number = 1;
  isLoading: boolean = true;
  isSaving: boolean = false;

  undoManager!: UndoManager<Track>;
  allTracks: Track[] = [];

  @ViewChildren(ArduinoEditorComponent) arduinoEditors!: QueryList<ArduinoEditorComponent>;

  sectionsExpanded = {
    general: true,
    interfaces: true,
    lanes: true
  };

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
  }

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private helpService: HelpService,
    private settingsService: SettingsService
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

            // Restore Arduino Configs
            if (this.editingTrack.arduino_configs && this.editingTrack.arduino_configs.length > 0) {
              this.arduinoConfigs = JSON.parse(JSON.stringify(this.editingTrack.arduino_configs));
            } else {
              this.arduinoConfigs = [];
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

    // Subscribe to query params to reload data when ID changes (e.g. after Save as New)
    this.subscriptions.push(this.route.queryParamMap.subscribe(() => {
      this.loadData();
    }));

    this.subscriptions.push(this.undoManager.stateCommitted$.subscribe(() => {
      this.autoSaveTrack();
    }));

    this.dataService.connectToInterfaceDataSocket();

    // Trigger help automatically on first visit or if requested via query param
    this.route.queryParams.subscribe(params => {
      const forceHelp = params['help'] === 'true';
      const settings = this.settingsService.getSettings();
      if (forceHelp || !settings.trackEditorHelpShown) {
        setTimeout(() => {
          this.startHelp();
          if (!forceHelp) {
            settings.trackEditorHelpShown = true;
            this.settingsService.saveSettings(settings);
          }
        }, 800); // Slightly more delay to ensure layout stability
      }
    });
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.undoManager.destroy();
    this.dataService.disconnectFromInterfaceDataSocket();
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    if (this.colorDebounceTimer) {
      clearTimeout(this.colorDebounceTimer);
    }
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
    this.subscriptions.push(this.dataService.getTracks().subscribe({
      next: (tracks) => {
        this.allTracks = tracks;

        if (idParam === 'new') {
          // Fetch factory settings from server
          this.subscriptions.push(this.dataService.getTrackFactorySettings().subscribe({
            next: (factoryTrack) => {
              this.editingTrack = new Track(
                'new',
                this.translationService.translate('TM_DEFAULT_TRACK_NAME'),
                factoryTrack.lanes.map((l: any) => new Lane(this.generateId(), l.foreground_color, l.background_color, l.length)),
                false,
                factoryTrack.arduino_configs
              );
              this.initializeEditingState();
            },
            error: (err) => {
              console.error('Failed to load factory settings', err);
              // Fallback default
              this.editingTrack = new Track('new', '', [
                new Lane(this.generateId(), '#ef4444', 'black', 100),
                new Lane(this.generateId(), '#ffffff', 'black', 100)
              ], false);
              this.initializeEditingState();
            }
          }));
          return; // Wait for factory settings
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

        this.initializeEditingState();
      },
      error: (err) => {
        console.error('Failed to load tracks', err);
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      }
    }));
  }

  private initializeEditingState() {
    if (this.editingTrack) {
      // Restore Arduino Config
      if (this.editingTrack.arduino_configs && this.editingTrack.arduino_configs.length > 0) {
        this.arduinoConfigs = JSON.parse(JSON.stringify(this.editingTrack.arduino_configs));
        // Ensure arrays exist
        for (let config of this.arduinoConfigs) {
          if (!config.digitalIds) config.digitalIds = new Array(MAX_DIGITAL_PINS).fill(-1);
          if (!config.analogIds) config.analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
        }
      } else {
        this.arduinoConfigs = [];
        // Sync it back to the model object so undoManager sees it in initial snapshot
        (this.editingTrack as any).arduino_configs = this.arduinoConfigs;
      }

      this.trackName = this.editingTrack.name;
      this.lanes = [...this.editingTrack.lanes];

      // Now initialize tracking with a fully populated model
      this.undoManager.initialize(this.editingTrack);
    }

    this.isLoading = false;
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  // Helper for generating local IDs for new lanes if needed
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private cloneTrack(track: Track): Track {
    const lanesCopy = track.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length));
    const arduinoCopy = track.arduino_configs ? JSON.parse(JSON.stringify(track.arduino_configs)) : [];
    return new Track(track.entity_id, track.name, lanesCopy, track.has_digital_fuel, arduinoCopy);
  }

  get isDirty(): boolean {
    if (!this.editingTrack) return false;
    return this.undoManager.hasChanges();
  }

  private createSnapshot(): Track {
    if (!this.editingTrack) {
      return new Track('new', '', [], false);
    }
    const configs = this.arduinoConfigs ? JSON.parse(JSON.stringify(this.arduinoConfigs)) : [];
    return new Track(
      this.editingTrack.entity_id,
      this.trackName,
      this.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length)),
      this.editingTrack.has_digital_fuel,
      configs
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

    // Check Arduino Configs equality
    const acs1 = t1.arduino_configs || [];
    const acs2 = t2.arduino_configs || [];
    if (acs1.length !== acs2.length) {
      console.log('Dirty Check Mismatch: Config count differ', acs1.length, acs2.length);
      return false;
    }

    for (let c = 0; c < acs1.length; c++) {
      const ac1 = acs1[c];
      const ac2 = acs2[c];

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
        } else if (key === 'voltageConfigs') {
          const vc1 = (v1 || {}) as { [lane: number]: number };
          const vc2 = (v2 || {}) as { [lane: number]: number };
          const entries1 = Object.entries(vc1);
          const entries2 = Object.entries(vc2);
          if (entries1.length !== entries2.length) {
            console.log(`Dirty Check Mismatch: Config voltageConfigs length differ`, entries1.length, entries2.length);
            return false;
          }
          for (const [lane, val] of entries1) {
            if (vc2[lane as any] !== val) {
              console.log(`Dirty Check Mismatch: Config voltageConfigs lane ${lane} differ`, val, vc2[lane as any]);
              return false;
            }
          }
        } else if (v1 !== v2) {
          console.log(`Dirty Check Mismatch: Config ${key} differ`, v1, v2);
          return false;
        }
      }
    }

    return true;
  }

  // Undo/Redo Proxies
  undo() {
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.undo();
  }
  redo() {
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.redo();
  }
  hasChanges() { return this.undoManager.hasChanges(); }

  startHelp() {
    const steps: GuideStep[] = [
      {
        title: this.translationService.translate('TE_HELP_WELCOME_TITLE'),
        content: this.translationService.translate('TE_HELP_WELCOME_CONTENT'),
        position: 'center'
      },
      {
        title: this.translationService.translate('TE_HELP_GENERAL_TITLE'),
        content: this.translationService.translate('TE_HELP_GENERAL_CONTENT'),
        position: 'center'
      },
      {
        selector: '#track-name-input',
        title: this.translationService.translate('TE_HELP_NAME_TITLE'),
        content: this.translationService.translate('TE_HELP_NAME_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#lane-editor-section',
        title: this.translationService.translate('TE_HELP_LANES_TITLE'),
        content: this.translationService.translate('TE_HELP_LANES_CONTENT'),
        position: 'right'
      },
      {
        selector: '#lane-bg-0',
        title: this.translationService.translate('TE_HELP_LANE_BG_TITLE'),
        content: this.translationService.translate('TE_HELP_LANE_BG_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#lane-fg-0',
        title: this.translationService.translate('TE_HELP_LANE_FG_TITLE'),
        content: this.translationService.translate('TE_HELP_LANE_FG_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#lane-length-0',
        title: this.translationService.translate('TE_HELP_LANE_LENGTH_TITLE'),
        content: this.translationService.translate('TE_HELP_LANE_LENGTH_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#lane-delete-0',
        title: this.translationService.translate('TE_HELP_DELETE_LANE_TITLE'),
        content: this.translationService.translate('TE_HELP_DELETE_LANE_CONTENT'),
        position: 'right'
      },
      {
        selector: '#copy-item-btn',
        title: this.translationService.translate('TE_HELP_DUPLICATE_TITLE'),
        content: this.translationService.translate('TE_HELP_DUPLICATE_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#help-track-btn',
        title: this.translationService.translate('TM_HELP_HELP_TITLE'),
        content: this.translationService.translate('TM_HELP_HELP_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#add-interface-btn',
        title: this.translationService.translate('TE_HELP_ADD_INTERFACE_TITLE'),
        content: this.translationService.translate('TE_HELP_ADD_INTERFACE_CONTENT'),
        position: 'left'
      }
    ];

    // Ensure lanes section is expanded if we are going to highlight items inside it
    if (!this.sectionsExpanded.lanes && this.lanes.length > 0) {
      this.sectionsExpanded.lanes = true;
      this.cdr.detectChanges();
    }

    // Add Arduino help steps if there are any configured
    if (this.arduinoConfigs.length > 0 && this.arduinoEditors.length > 0) {
      // Ensure interfaces section is expanded
      if (!this.sectionsExpanded.interfaces) {
        this.sectionsExpanded.interfaces = true;
        this.cdr.detectChanges();
      }

      // Collect steps from the first Arduino editor
      const firstArduino = this.arduinoEditors.first;
      if (firstArduino) {
        steps.push(...firstArduino.getHelpSteps());
      }
    }

    this.helpService.startGuide(steps);
  }

  onInputFocus() { this.undoManager.onInputFocus(); }
  onInputChange() {
    this.undoManager.onInputChange();
  }
  onInputBlur() { this.undoManager.onInputBlur(); }
  captureState() { this.undoManager.captureState(); }

  // Lane Management
  addLane() {
    this.lanes.push(new Lane(this.generateId(), '#ffffff', 'black', 100)); // Default white lane
    this.sectionsExpanded.lanes = true;
    this.captureState();
  }

  removeLane(index: number) {
    this.lanes.splice(index, 1);
    this.updateArduinoConfigsOnLaneDeletion(index);
    this.captureState();
  }

  private updateArduinoConfigsOnLaneDeletion(deletedLaneIndex: number) {
    this.arduinoConfigs.forEach(config => {
      // Helper to update pin IDs
      const updatePinIds = (ids: number[]) => {
        if (!ids) return;
        for (let i = 0; i < ids.length; i++) {
          const val = ids[i];
          if (val === com.antigravity.PinBehavior.BEHAVIOR_UNUSED ||
            val === com.antigravity.PinBehavior.BEHAVIOR_RESERVED ||
            val === com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON ||
            val === com.antigravity.PinBehavior.BEHAVIOR_RELAY) {
            continue;
          }

          let base = -1;
          if (val >= com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE) {
            base = com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE;
          } else if (val >= com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE) {
            base = com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE;
          } else if (val >= com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE) {
            base = com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE;
          } else if (val >= com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE + 1000) {
            base = com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE;
          } else if (val >= com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000) {
            base = com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE;
          }

          if (base !== -1) {
            const lane = val - base;
            if (lane === deletedLaneIndex) {
              ids[i] = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;
            } else if (lane > deletedLaneIndex) {
              ids[i] = val - 1;
            }
          }
        }
      };

      updatePinIds(config.digitalIds);
      updatePinIds(config.analogIds);

      // Shift voltageConfigs
      if (config.voltageConfigs) {
        const newVoltageConfigs: { [lane: number]: number } = {};
        Object.entries(config.voltageConfigs).forEach(([laneStr, value]) => {
          const lane = parseInt(laneStr, 10);
          if (lane < deletedLaneIndex) {
            newVoltageConfigs[lane] = value;
          } else if (lane > deletedLaneIndex) {
            newVoltageConfigs[lane - 1] = value;
          }
          // if lane === deletedLaneIndex, it's just omitted
        });
        config.voltageConfigs = newVoltageConfigs;
      }

      // Shift ledLaneColorOverrides
      if (config.ledLaneColorOverrides && config.ledLaneColorOverrides.length > deletedLaneIndex) {
        config.ledLaneColorOverrides.splice(deletedLaneIndex, 1);
      }
    });

    this.arduinoConfigs = [...this.arduinoConfigs]; // Trigger change detection
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

  addArduinoConfig() {
    this.arduinoConfigs.push({
      name: `Arduino ${this.arduinoConfigs.length + 1}`,
      commPort: '',
      baudRate: 9600,
      debounceUs: 200,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: true,
      globalInvertLights: 0,
      useLapsForPits: 0,
      useLapsForPitEnd: 0,
      usePitsAsLaps: false,
      useLapsForSegments: true,
      hardwareType: 0, // 0 = Uno, 1 = Mega
      digitalIds: new Array(MAX_DIGITAL_PINS).fill(com.antigravity.PinBehavior.BEHAVIOR_UNUSED),
      analogIds: new Array(MAX_ANALOG_PINS).fill(com.antigravity.PinBehavior.BEHAVIOR_UNUSED),
      ledStrings: null,
      ledLaneColorOverrides: null,
      lapPinPitBehavior: 3
    });
    this.arduinoConfigs = [...this.arduinoConfigs]; // Ensure reference change for Angular change detection
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  trackByArduinoConfig(index: number, config: any): number {
    return index;
  }

  removeArduinoConfig(index: number) {
    this.arduinoConfigs.splice(index, 1);
    this.arduinoConfigs = [...this.arduinoConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  saveAsNew() {
    this.trackName = this.generateUniqueName(this.trackName);
    this.updateTrack(true);
  }

  private generateUniqueName(baseName: string): string {
    let name = baseName;
    let counter = 1;

    // We always want to append at least _1 if we are saving as new to avoid collision with self
    // and to follow the requirement "generate based on the old name with an _# at the end"
    const pattern = /(_\d+)$/;
    const base = baseName.replace(pattern, '');

    // Try appending _1, _2, etc.
    while (true) {
      const candidate = `${base}_${counter}`;
      if (!this.allTracks.some(t => t.name.toLowerCase() === candidate.toLowerCase())) {
        return candidate;
      }
      counter++;
    }
  }

  private autoSaveTrack() {
    if (!this.editingTrack) return;
    if (!this.trackName.trim() || !this.isNameUnique(true)) return;
    if (this.isSaving) return;
    this.updateTrack(false, true);
  }

  updateTrack(isSaveAsNew: boolean = false, isAutoSave: boolean = false) {
    if (!this.editingTrack) return;

    // Validate
    if (!this.trackName.trim()) {
      if (!isAutoSave) alert(this.translationService.translate('TE_ERROR_NAME_REQUIRED'));
      return;
    }

    this.isSaving = true;

    // Construct payload
    const finalTrack = this.createSnapshot();

    const wasNew = isSaveAsNew || finalTrack.entity_id === 'new';

    // Inject @id for Jackson identity resolution
    const payload: any = {
      ...finalTrack,
      "@id": 1,
      lanes: finalTrack.lanes.map((l, i) => ({
        ...l,
        "@id": i + 2
      }))
    };

    const obs = wasNew
      ? this.dataService.createTrack({ ...payload, entity_id: 'new' })
      : this.dataService.updateTrack(payload.entity_id, payload);

    this.subscriptions.push(obs.subscribe({
      next: (result) => {
        this.isSaving = false;
        // Update local state with result (especially ID)
        this.editingTrack = new Track(result.entity_id, result.name, result.lanes, result.has_digital_fuel ?? false, result.arduino_configs);

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
        this.lanes = this.editingTrack.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length));

        if (this.editingTrack.arduino_configs && this.editingTrack.arduino_configs.length > 0) {
          this.arduinoConfigs = JSON.parse(JSON.stringify(this.editingTrack.arduino_configs));
        } else {
          this.arduinoConfigs = [];
        }

        if (wasNew) {
          // Re-base the entire undo history onto the new track identity (ID and Name)
          // so that undoing doesn't take us back to the old ID or Name.
          this.undoManager.updateHistory(t => {
            (t as any).entity_id = result.entity_id;
            (t as any).name = result.name;
            return t;
          });
        }

        this.undoManager.resetTracking(this.editingTrack);

        // Force sync with UI and children (especially back-button confirm input)
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }

        if (wasNew) {
          if (isAutoSave) {
            const url = this.router.serializeUrl(this.router.createUrlTree(['/track-editor'], { queryParams: { id: result.entity_id } }));
            this.location.replaceState(url);
          } else {
            this.router.navigate(['/track-editor'], { queryParams: { id: result.entity_id } });
          }
        }
      },
      error: (err) => {
        console.error('Failed to save track', err);
        if (!this.isDestroyed) {
          if (err.status === 409) {
            if (!isAutoSave) alert(this.translationService.translate('TE_ERROR_NAME_EXISTS'));
          } else {
            if (!isAutoSave) alert(this.translationService.translate('TE_ERROR_SAVE_FAILED'));
          }
        }
        this.isSaving = false;
      }
    }));
  }

  get isNameInvalid(): boolean {
    if (this.isLoading) return false;
    return !this.trackName.trim() || !this.isNameUnique(true);
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
