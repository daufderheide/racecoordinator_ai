import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ArduinoConfig, MAX_DIGITAL_PINS, MAX_ANALOG_PINS } from '../../../models/track';
import { Lane } from '../../../models/lane';
import { DataService } from '../../../data.service';
import { TranslationService } from '../../../services/translation.service';
import { com } from '../../../proto/message';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface PinAction {
  label: string;
  value: string;
}

@Component({
  selector: 'app-arduino-editor',
  templateUrl: './arduino-editor.component.html',
  styleUrls: ['./arduino-editor.component.css'],
  standalone: false
})
export class ArduinoEditorComponent implements OnInit, OnDestroy {
  @Input() config?: ArduinoConfig;
  @Input() index: number = 0;
  @Input() count: number = 1;

  private _lanes: Lane[] = [];
  @Input() set lanes(value: Lane[]) {
    this._lanes = value;
    this.updatePinActions();
  }
  get lanes(): Lane[] {
    return this._lanes;
  }
  @Output() configChange = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  availablePorts: string[] = [];
  interfaceStatus: number = 1; // 0=Connected, 1=Disconnected, 2=NoData
  pinActivity: { [key: string]: boolean } = {};
  sectionsExpanded = {
    arduino: true,
    main: true,
    digital: true,
    analog: true,
    voltage: true
  };
  liveVoltages: { [key: number]: number | undefined } = {};
  maxVoltagesSeen: { [key: number]: number | undefined } = {};
  isVoltageLinked: boolean = false;

  private interfaceEventsSubscription?: Subscription;
  private pinActivityTimers: { [key: string]: any } = {};

  resetMaxSeenAll() {
    this.maxVoltagesSeen = {};
    this.cdr.detectChanges();
  }

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService
  ) { }

  ngOnInit() {
    this.fetchPorts();
    this.updatePinActions();

    // Subscribe to Interface Events for status and pin activity
    this.interfaceEventsSubscription = this.dataService.getInterfaceEvents().subscribe({
      next: (event) => {
        if (event.lap) {
          this.triggerPinActivity(event.lap.interfaceId ?? -1);
        } else if (event.segment) {
          this.triggerPinActivity(event.segment.interfaceId ?? -1);
        } else if (event.callbutton) {
          // TODO(aufderheide): Because we only have the lane here, we don't
          // actually know which pin triggered the callbutton.  For now, we'll
          // just find any behavior that matches the lane.

          const lane = event.callbutton.lane;
          // Trigger activity for master call button or specific lane call button
          const isMega = this.config?.hardwareType === 1;
          const digitalCount = isMega ? 54 : 14;
          const analogCount = isMega ? 16 : 6;

          let pinFound = false;

          const checkPin = (isDigital: boolean, pinCount: number) => {
            for (let i = 0; i < pinCount; i++) {
              if (isDigital && i < 2) continue; // Skip D0, D1
              const behavior = this.getPinBehavior(isDigital, i);
              if (behavior === com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON ||
                behavior === com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + (lane ?? 0)) {
                // Determine interface ID logic: 
                // in triggerPinActivity, interfaceId is passed and it reconstructs 'D' + id or 'A' + (id - 1000)
                // So if digital, pass i. If analog, pass i + 1000.
                this.triggerPinActivity(isDigital ? i : i + 1000);
                pinFound = true;
              }
            }
          };

          checkPin(true, digitalCount);
          checkPin(false, analogCount);

        } else if (event.status) {
          this.interfaceStatus = event.status.status as number;
          this.cdr.detectChanges();
        } else if (event.analogData) {
          const pin = event.analogData.pin ?? -1;
          const value = event.analogData.value ?? 0;
          this.liveVoltages[pin] = value;

          const lane = this.getLaneForAnalogPin(pin);
          if (lane !== -1) {
            const currentMax = this.maxVoltagesSeen[lane] ?? 0;
            if (value > currentMax) {
              this.maxVoltagesSeen[lane] = value;
            }
          }
          this.cdr.detectChanges();
        }
      }
    });

    // Handle debounce changes
    this.debounceUpdateSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      if (this.config) {
        this.config.debounceUs = value;
        this.updateArduinoConfig();
      }
    });

    // Translate pin actions when language changes
    this.translationService.getCurrentLanguage().subscribe(() => {
      this.updatePinActions();
    });

    this.updateArduinoConfig();
  }

  ngOnDestroy() {
    this.interfaceEventsSubscription?.unsubscribe();
    this.dataService.closeInterface().subscribe({
      next: () => console.log('Interface closed successfully'),
      error: (err) => console.error('Error closing interface', err)
    });
  }

  fetchPorts() {
    this.dataService.getSerialPorts().subscribe({
      next: (ports) => {
        this.availablePorts = ports;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch ports', err)
    });
  }

  updateArduinoConfig() {
    this.configChange.emit();

    if (this.config) {
      this.dataService.initializeInterface(this.config, this.lanes.length).subscribe({
        next: (response) => {
          if (!response.success) {
            console.warn(`Failed to initialize interface: ${response.message}`);
          } else {
            console.log('Interface initialized successfully');
          }
        },
        error: (err) => {
          console.error('Error calling initializeInterface', err);
        }
      });
    }
  }

  get availablePins(): number[] {
    if (!this.config) return [];
    const isMega = this.config.hardwareType === 1;
    const digitalCount = isMega ? 54 : 14;
    const pins = [];
    for (let i = 2; i < digitalCount; i++) pins.push(i);
    return pins;
  }

  get availableAnalogPins(): number[] {
    if (!this.config) return [];
    const isMega = this.config.hardwareType === 1;
    const analogCount = isMega ? 16 : 6;
    const pins = [];
    for (let i = 0; i < analogCount; i++) pins.push(i);
    return pins;
  }

  getPinBehavior(isDigital: boolean, pinIndex: number): number {
    if (!this.config) return -1;
    return isDigital ? this.config.digitalIds[pinIndex] : this.config.analogIds[pinIndex];
  }

  setPinBehavior(isDigital: boolean, pinIndex: number, behavior: string) {
    if (!this.config) return;
    const val = parseInt(behavior, 10);
    let changed = false;

    if (isDigital) {
      if (this.config.digitalIds[pinIndex] !== val) {
        this.config.digitalIds[pinIndex] = val;
        changed = true;
      }
    } else {
      if (this.config.analogIds[pinIndex] !== val) {
        this.config.analogIds[pinIndex] = val;
        changed = true;
      }
    }

    if (changed) {
      this.configChange.emit();
      this.dataService.updateInterfaceConfig(this.config).subscribe({
        next: (response) => {
          if (!response.success) {
            console.warn(`Failed to update interface config: ${response.message}`);
          }
        },
        error: (err) => console.error('Error updating interface config', err)
      });
    }
  }

  // Debounce Logic
  private debounceUpdateSubject = new Subject<number>();

  onDebounceChange(value: number) {
    this.debounceUpdateSubject.next(value);
  }

  // Pin Activity Logic
  private triggerPinActivity(interfaceId: number) {
    let key = '';
    if (interfaceId < 1000) {
      key = `D${interfaceId}`;
    } else {
      key = `A${interfaceId - 1000}`;
    }

    this.pinActivity[key] = true;
    this.cdr.detectChanges();

    if (this.pinActivityTimers[key]) {
      clearTimeout(this.pinActivityTimers[key]);
    }

    this.pinActivityTimers[key] = setTimeout(() => {
      this.pinActivity[key] = false;
      this.cdr.detectChanges();
    }, 500);
  }

  isPinActive(isDigital: boolean, pin: number): boolean {
    const key = isDigital ? `D${pin}` : `A${pin}`;
    const behavior = this.getPinBehavior(isDigital, pin);

    // If it's a relay or call button (outputs/latched-like), we might want to show state differently
    // For now, if we have a local override state, use it.
    // However, the user request says: "When grey and clicked it should set the pin state high, and when green and clicked it should set the pin state low."
    // This implies we need to track state.

    // For now, let's use a local map for output pin states since we don't get readback from Arduino yet for outputs
    if (this.pinState[key] !== undefined) {
      return this.pinState[key];
    }

    return !!this.pinActivity[key];
  }

  // Track local state for output pins (Relays)
  pinState: { [key: string]: boolean } = {};

  togglePinState(isDigital: boolean, pin: number) {
    const behavior = this.getPinBehavior(isDigital, pin);
    // Check if it is a Write pin (Relay)
    // BEHAVIOR_RELAY = 3; BEHAVIOR_RELAY_BASE = 4000;
    const isRelay = behavior === com.antigravity.PinBehavior.BEHAVIOR_RELAY ||
      (behavior >= com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE && behavior < com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE + 1000);

    if (isRelay) {
      const key = isDigital ? `D${pin}` : `A${pin}`;
      const currentState = !!this.pinState[key];
      const newState = !currentState;

      this.pinState[key] = newState;
      this.dataService.setInterfacePinState(pin, isDigital, newState).subscribe({
        next: (response) => {
          if (!response.success) {
            console.warn('Failed to set pin state', response.message);
            // Revert state on failure
            this.pinState[key] = currentState;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error setting pin state', err);
          // Revert state on failure
          this.pinState[key] = currentState;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Pin Action Logic
  digitalPinActions: PinAction[] = [];
  analogPinActions: PinAction[] = [];

  getPinAction(isDigital: boolean, pinIndex: number): string {
    const val = this.getPinBehavior(isDigital, pinIndex);
    if (val === com.antigravity.PinBehavior.BEHAVIOR_UNUSED || val === -1) return '';
    if (val === com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON) return 'master_call';
    if (val === com.antigravity.PinBehavior.BEHAVIOR_RELAY) return 'master_relay';

    if (val >= com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE)
      return `lap_${val - com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE}`;

    if (val >= com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE)
      return `segment_${val - com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE}`;

    if (val >= com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE)
      return `call_${val - com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE}`;

    if (val >= com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE + 1000)
      return `relay_${val - com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE}`;

    if (val === com.antigravity.PinBehavior.BEHAVIOR_RESERVED) return 'reserved';

    if (val >= com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE && val < com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000)
      return `voltage_${val - com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE}`;

    return '';
  }

  setPinAction(isDigital: boolean, pinIndex: number, action: string) {
    let val = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;
    if (action === 'master_call') {
      val = com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON;
    } else if (action === 'master_relay') {
      val = com.antigravity.PinBehavior.BEHAVIOR_RELAY;
    } else if (action.startsWith('lap_')) {
      const laneIndex = parseInt(action.split('_')[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE + laneIndex;
    } else if (action.startsWith('segment_')) {
      const laneIndex = parseInt(action.split('_')[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE + laneIndex;
    } else if (action.startsWith('call_')) {
      const laneIndex = parseInt(action.split('_')[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + laneIndex;
    } else if (action.startsWith('relay_')) {
      const laneIndex = parseInt(action.split('_')[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE + laneIndex;
    } else if (action === 'reserved') {
      val = com.antigravity.PinBehavior.BEHAVIOR_RESERVED;
    } else if (action.startsWith('voltage_')) {
      const laneIndex = parseInt(action.split('_')[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + laneIndex;
    }

    this.setPinBehavior(isDigital, pinIndex, val.toString());
  }

  private updatePinActions() {
    const actions: PinAction[] = [];

    // 1. Unused
    actions.push({
      label: this.translationService.translate('AE_PIN_UNUSED'),
      value: ''
    });

    // 2. Reserved
    actions.push({
      label: this.translationService.translate('AE_PIN_RESERVED'),
      value: 'reserved'
    });

    // 3. Others (to be sorted alphabetically)
    const otherActions: PinAction[] = [];

    // Master Call
    otherActions.push({
      label: this.translationService.translate('AE_PIN_MASTER_CALL'),
      value: 'master_call'
    });

    // Per-lane actions
    this.lanes.forEach((_, i) => {
      // Call Button
      otherActions.push({
        label: this.translationService.translate('AE_PIN_CALL_BUTTON_LANE', { lane: i + 1 }),
        value: `call_${i}`
      });
      // Lap
      otherActions.push({
        label: this.translationService.translate('AE_PIN_LAP_LANE', { lane: i + 1 }),
        value: `lap_${i}`
      });
      // Segment
      otherActions.push({
        label: this.translationService.translate('AE_PIN_SEGMENT_LANE', { lane: i + 1 }),
        value: `segment_${i}`
      });
      // Relay
      otherActions.push({
        label: this.translationService.translate('AE_PIN_RELAY_LANE', { lane: i + 1 }),
        value: `relay_${i}`
      });
    });

    // Sort other actions alphabetically by label
    otherActions.sort((a, b) => a.label.localeCompare(b.label));

    // Relay (Master)
    otherActions.push({
      label: this.translationService.translate('AE_PIN_RELAY'),
      value: 'master_relay'
    });

    // Re-sort after adding relays
    otherActions.sort((a, b) => a.label.localeCompare(b.label));

    // Combine for digital
    this.digitalPinActions = [...actions, ...otherActions];

    // Add Voltage Level for analog only
    const analogOnlyActions: PinAction[] = [];
    this.lanes.forEach((_, i) => {
      analogOnlyActions.push({
        label: this.translationService.translate('AE_PIN_VOLTAGE_LANE', { lane: i + 1 }),
        value: `voltage_${i}`
      });
    });
    analogOnlyActions.sort((a, b) => a.label.localeCompare(b.label));

    // Combine for analog
    this.analogPinActions = [...actions, ...otherActions, ...analogOnlyActions];
    // Re-sort analog if needed, but usually we want voltage at the end or intermixed? 
    // Let's re-sort the whole thing to keep it clean.
    this.analogPinActions.sort((a, b) => {
      if (a.value === '' || a.value === 'reserved') return -1;
      if (b.value === '' || b.value === 'reserved') return 1;
      return a.label.localeCompare(b.label);
    });

    // Also re-sort digital for consistency
    this.digitalPinActions.sort((a, b) => {
      if (a.value === '' || a.value === 'reserved') return -1;
      if (b.value === '' || b.value === 'reserved') return 1;
      return a.label.localeCompare(b.label);
    });
  }

  getVoltageLanes(): number[] {
    if (!this.config) return [];
    const lanes = new Set<number>();

    // Check analog pins only for voltage level
    const isMega = this.config.hardwareType === 1;
    const analogCount = isMega ? 16 : 6;
    const analogIds = this.config.analogIds || [];
    for (let i = 0; i < analogCount; i++) {
      const behavior = analogIds[i];
      if (behavior !== undefined &&
        behavior >= com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
        behavior < com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000) {
        lanes.add(behavior - com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE);
      }
    }
    return Array.from(lanes).sort((a, b) => a - b);
  }

  getLiveVoltageForLane(lane: number): number {
    if (!this.config) return 0;
    const isMega = this.config.hardwareType === 1;
    const analogCount = isMega ? 16 : 6;
    const analogIds = this.config.analogIds || [];

    const targetBehavior = com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + lane;
    for (let i = 0; i < analogCount; i++) {
      if (analogIds[i] === targetBehavior) {
        return this.liveVoltages[i] ?? 0;
      }
    }
    return 0;
  }

  getVoltageMax(lane: number): number {
    if (!this.config || !this.config.voltageConfigs) return 1023;
    const val = this.config.voltageConfigs[lane];
    return val !== undefined ? val : 1023;
  }

  getLaneForAnalogPin(pin: number): number {
    if (!this.config) return -1;
    const isMega = this.config.hardwareType === 1;
    const analogCount = isMega ? 16 : 6;
    const analogIds = this.config.analogIds || [];
    if (pin >= 0 && pin < analogCount) {
      const behavior = analogIds[pin];
      if (behavior !== undefined &&
        behavior >= com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
        behavior < com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000) {
        return behavior - com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE;
      }
    }
    return -1;
  }

  setVoltageMax(lane: number, value: string | number) {
    if (!this.config) return;

    let val: number;
    if (typeof value === 'string') {
      val = parseInt(value, 10);
    } else {
      val = value;
    }

    if (isNaN(val)) return;

    if (this.isVoltageLinked) {
      for (const l of this.getVoltageLanes()) {
        this.setVoltageMaxInternal(l, val);
      }
    } else {
      this.setVoltageMaxInternal(lane, val);
    }
    this.updateArduinoConfig();
  }

  private setVoltageMaxInternal(lane: number, value: number) {
    if (!this.config) return;
    if (!this.config.voltageConfigs) this.config.voltageConfigs = {};
    this.config.voltageConfigs[lane] = value;
  }

  setMaxToSeen(lane: number) {
    if (this.isVoltageLinked) {
      let globalMax = 0;
      for (const l of this.getVoltageLanes()) {
        globalMax = Math.max(globalMax, this.maxVoltagesSeen[l] ?? 0);
      }
      for (const l of this.getVoltageLanes()) {
        this.setVoltageMaxInternal(l, globalMax);
      }
    } else {
      const maxSeen = this.maxVoltagesSeen[lane] ?? 0;
      this.setVoltageMaxInternal(lane, maxSeen);
    }
    this.updateArduinoConfig();
  }

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
  }

  removeInterface(event: Event) {
    event.stopPropagation();
    this.remove.emit();
  }
}
