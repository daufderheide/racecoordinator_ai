import {
  ChangeDetectorRef,
  Component,
  effect,
  HostListener,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  untracked,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subject, Subscription, timer } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import { Lane } from "@app/models/lane";
import {
  ArduinoConfig,
  LedString,
  MAX_ANALOG_PINS,
  MAX_DIGITAL_PINS,
} from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";

import { buildArduinoHelpSteps } from "./arduino-editor-help.helper";
import {
  checkCallButtonPins,
  processAnalogDataEvent,
  processDigitalPinEvent,
} from "./arduino-event.helper";
import {
  buildColorOrders,
  buildLedBehaviors,
  buildLedTypes,
  getLedActionLabel,
  getLedBaseTranslationKey,
  getRgbLedColorHex,
  getRgbLedColorShadow,
} from "./arduino-led.helper";
import {
  createLedString,
  removeLedStringByIndex,
  removeLedStringByPin,
  updateLedBehaviorState,
  updateLedStringBrightness,
  updateLedStringColorOrder,
  updateLedStringCount,
  updateLedStringFlashRate,
  updateLedStringLaneColor,
  updateLedStringLedType,
} from "./arduino-led-string.helper";
import {
  createPinGroups,
  filterPinActions,
  getLaneForAnalogPin,
  getPinAction,
  getVoltageLanes,
  isOutputPinBehavior,
  parsePinAction,
  PinAction,
  PinGroup,
  syncArduinoLanes,
} from "./arduino-pin.helper";
import {
  loadArduinoGroupsCollapsed,
  loadArduinoLedStringsExpanded,
  loadArduinoLedStringsLinked,
  loadArduinoSections,
  loadArduinoVoltageLinked,
  saveArduinoState,
} from "./arduino-storage.helper";
import {
  applyMaxToSeen,
  applyVoltageMax,
  getLiveVoltageForLane,
  getVoltageMax,
} from "./arduino-voltage.helper";

@Component({
  standalone: true,
  selector: "app-arduino-editor",
  templateUrl: "./arduino-editor.component.html",
  styleUrls: ["./arduino-editor.component.css"],
  imports: [
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class ArduinoEditorComponent implements OnInit, OnDestroy {
  config = model<ArduinoConfig>();
  configChange = output<void>();
  remove = output<void>();
  requestLedStringDialog = output<void>();

  count = input(1);
  lanes = input<Lane[]>([]);
  index = input(0);
  isEditMode = input<boolean>(true);

  availablePorts: string[] = [];
  interfaceStatus: number = 1; // 0=Connected, 1=Disconnected, 2=NoData
  supportsRgbLeds: boolean = true;
  pinActivity: { [key: string]: boolean } = {};
  sectionsExpanded = {
    arduino: true,
    main: true,
    digital: true,
    analog: true,
    voltage: true,
    leds: true,
  };
  ledBehaviors: PinGroup[] = [];
  liveVoltages: { [key: number]: number | undefined } = {};
  maxVoltagesSeen: { [key: number]: number | undefined } = {};
  isVoltageLinked: boolean = false;
  isLedStringsLinked: boolean = true;
  ledStringExpanded: boolean[] = [];
  activeRgbLedStates: { [key: string]: "off" | "red" | "green" | "blue" } = {};
  ledTypes: PinAction[] = [];
  colorOrders: PinAction[] = [];

  // Custom Dropdown State
  openPinDropdown: string | null = null;
  dropdownOpenUp: { [key: string]: boolean } = {};
  groupsCollapsed: { [key: string]: boolean } = {}; // key is PinGroup.key
  private interfaceEventsSubscription?: Subscription;
  private portPollingSubscription?: Subscription;
  private pinActivityTimers: { [key: string]: any } = {};
  private colorDebounceTimer: any = null;

  resetMaxSeenAll() {
    if (!this.isEditMode()) {
      return;
    }
    this.maxVoltagesSeen = {};
    this.cdr.detectChanges();
  }

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private logger: LoggerService,
  ) {
    effect(() => {
      // Re-run refreshLanes when lanes change
      this.lanes();
      untracked(() => {
        const config = this.config();
        if (config) {
          this.refreshLanes();
        }
      });
    });

    effect(() => {
      // Reset status on index change
      this.index();
      this.interfaceStatus = 1;
      this.supportsRgbLeds = true;
    });
  }

  ngOnInit() {
    this.fetchPorts();
    this.portPollingSubscription = timer(5000, 5000).subscribe(() => {
      this.fetchPorts();
    });

    this.loadSavedSettings();

    this.updatePinActions();
    this.updateLedBehaviors();
    this.updateLedTypes();
    this.updateColorOrders();

    this.subscribeToInterfaceEvents();
    this.subscribeToDebounceUpdates();

    this.translationService.getCurrentLanguage().subscribe(() => {
      this.updatePinActions();
      this.updateLedBehaviors();
      this.updateLedTypes();
      this.updateColorOrders();
    });

    this.updateArduinoConfig();
  }

  private loadSavedSettings() {
    this.sectionsExpanded = loadArduinoSections(
      this.index(),
      this.sectionsExpanded,
      this.logger,
    );
    this.groupsCollapsed = loadArduinoGroupsCollapsed(
      this.index(),
      this.logger,
    );
    this.isVoltageLinked = loadArduinoVoltageLinked(this.index());
    this.isLedStringsLinked = loadArduinoLedStringsLinked(this.index());
    this.initLedStringsExpanded();
  }

  private initLedStringsExpanded() {
    const config = this.config();
    if (config && config.ledStrings) {
      config.ledStrings.forEach((ls) => {
        if (ls.ledType === undefined) ls.ledType = 0;
      });
      this.ledStringExpanded = loadArduinoLedStringsExpanded(
        this.index(),
        config.ledStrings.length,
        this.logger,
      );
    }
  }

  private subscribeToInterfaceEvents() {
    this.interfaceEventsSubscription = this.dataService
      .getInterfaceEvents()
      .subscribe({
        next: (event) => {
          this.handleInterfaceEvent(event);
        },
      });
  }

  private handleInterfaceEvent(event: any) {
    if (event.lap) {
      if ((event.lap.interfaceIndex ?? 0) === this.index()) {
        this.triggerPinActivity(event.lap.interfaceId ?? -1);
      }
    } else if (event.segment) {
      if ((event.segment.interfaceIndex ?? 0) === this.index()) {
        this.triggerPinActivity(event.segment.interfaceId ?? -1);
      }
    } else if (event.callbutton) {
      this.handleCallButtonEvent(event.callbutton);
    } else if (event.status) {
      this.handleStatusEvent(event.status);
    } else if (event.analogData) {
      this.handleAnalogDataEvent(event.analogData);
    } else if (event.digitalPin) {
      this.handleDigitalPinEvent(event.digitalPin);
    }
  }

  private handleCallButtonEvent(callbutton: any) {
    if ((callbutton.interfaceIndex ?? 0) !== this.index()) {
      return;
    }
    checkCallButtonPins(
      this.config(),
      callbutton.lane,
      (isDigital, pin) => this.getPinBehavior(isDigital, pin),
      (pinId) => this.triggerPinActivity(pinId),
    );
  }

  private handleStatusEvent(status: any) {
    if ((status.interfaceIndex ?? 0) === this.index()) {
      this.interfaceStatus = status.status as number;
      if (this.interfaceStatus === 0) {
        this.supportsRgbLeds = status.supportsRgbLeds ?? true;
      } else {
        this.supportsRgbLeds = true;
      }
      this.cdr.detectChanges();
    }
  }

  private handleAnalogDataEvent(analogData: any) {
    if ((analogData.interfaceIndex ?? 0) === this.index()) {
      processAnalogDataEvent(
        analogData,
        this.liveVoltages,
        this.maxVoltagesSeen,
        (pin) => this.getLaneForAnalogPin(pin),
      );
      this.cdr.detectChanges();
    }
  }

  private handleDigitalPinEvent(digitalPin: any) {
    if ((digitalPin.interfaceIndex ?? 0) === this.index()) {
      processDigitalPinEvent(
        digitalPin,
        this.config(),
        this.pinActivity,
        this.pinActivityTimers,
      );
      this.cdr.detectChanges();
    }
  }

  private subscribeToDebounceUpdates() {
    this.debounceUpdateSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        const config = this.config();
        if (config) {
          config.debounceUs = value;
          this.updateArduinoConfig();
        }
      });
  }

  ngOnDestroy() {
    this.interfaceEventsSubscription?.unsubscribe();
    this.portPollingSubscription?.unsubscribe();
    Object.values(this.pinActivityTimers).forEach((timer) =>
      clearTimeout(timer),
    );
    if (this.colorDebounceTimer) {
      clearTimeout(this.colorDebounceTimer);
    }
  }

  fetchPorts() {
    this.dataService.getSerialPorts().subscribe({
      next: (ports) => {
        this.availablePorts = ports;
        this.cdr.detectChanges();
      },
      error: (err) => this.logger.error("Failed to fetch ports", err),
    });
  }

  onHardwareTypeChange(newType: number) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config) return;

    config.hardwareType = newType;
    this.updateLedTypes();

    if (newType === 0) {
      // Uno
      // Switch any unsupported LED types to WS2811 ("1")
      if (config.ledStrings) {
        config.ledStrings.forEach((ls) => {
          if (!["1", "12"].includes(ls.ledType.toString())) {
            ls.ledType = 1; // Default to WS2811
          }
        });
      }

      // Reset digital pins D14-D59 (Uno only has 14 digital pins, 0-13)
      for (let i = 14; i < MAX_DIGITAL_PINS; i++) {
        config.digitalIds[i] = PinBehavior.BEHAVIOR_UNUSED;
      }
      // Reset analog pins A6-A15 (Uno only has 6 analog pins, 0-5)
      for (let i = 6; i < MAX_ANALOG_PINS; i++) {
        config.analogIds[i] = PinBehavior.BEHAVIOR_UNUSED;
      }
    }

    this.updateArduinoConfig();
  }

  updateArduinoConfig() {
    if (!this.isEditMode()) {
      return;
    }
    this.configChange.emit();

    const config = this.config();
    if (config) {
      this.dataService.updateInterfaceConfig(config, this.index()).subscribe({
        next: (response) => {
          if (!response.success) {
            this.logger.warn(
              `Failed to update interface config: ${response.message}`,
            );
          } else {
            this.logger.info("Interface config updated successfully");
            // Resend all active LED string states so they match the UI after reload
            if (config.ledStrings) {
              config.ledStrings.forEach((_, idx) => {
                this.sendLedStringState(idx);
              });
            }
          }
        },
        error: (err) => {
          this.logger.error("Error calling updateInterfaceConfig", err);
        },
      });
    }
  }

  get availablePins(): number[] {
    const config = this.config();
    if (!config) return [];
    const isMega = config.hardwareType === 1;
    const digitalCount = isMega ? 54 : 14;
    const pins = [];
    for (let i = 2; i < digitalCount; i++) pins.push(i);
    return pins;
  }

  get availableAnalogPins(): number[] {
    const config = this.config();
    if (!config) return [];
    const isMega = config.hardwareType === 1;
    const analogCount = isMega ? 16 : 6;
    const pins = [];
    for (let i = 0; i < analogCount; i++) pins.push(i);
    return pins;
  }

  getPinBehavior(isDigital: boolean, pinIndex: number): number {
    const config = this.config();
    if (!config) return -1;
    return isDigital ? config.digitalIds[pinIndex] : config.analogIds[pinIndex];
  }

  setPinBehavior(isDigital: boolean, pinIndex: number, behavior: string) {
    const config = this.config();
    if (!config) return;
    const val = parseInt(behavior, 10);
    let changed = false;

    if (isDigital) {
      const oldVal = config.digitalIds[pinIndex];
      if (oldVal !== val) {
        config.digitalIds[pinIndex] = val;
        this.handlePinBehaviorChange(pinIndex, true, oldVal, val);
        changed = true;
      }
    } else {
      const oldVal = config.analogIds[pinIndex];
      if (oldVal !== val) {
        config.analogIds[pinIndex] = val;
        this.handlePinBehaviorChange(pinIndex, false, oldVal, val);
        changed = true;
      }
    }

    if (changed) {
      this.configChange.emit();
      this.dataService.updateInterfaceConfig(config, this.index()).subscribe({
        next: (response) => {
          if (!response.success) {
            this.logger.warn(
              `Failed to update interface config: ${response.message}`,
            );
          }
        },
        error: (err) =>
          this.logger.error("Error updating interface config", err),
      });
    }
  }

  // Debounce Logic
  private debounceUpdateSubject = new Subject<number>();

  isRgbLedActive(stringIndex: number, ledIndex: number): boolean {
    const key = `${stringIndex}-${ledIndex}`;
    const state = this.activeRgbLedStates[key] || "off";
    return state !== "off";
  }

  getRgbLedColor(
    stringIndex: number,
    ledIndex: number,
  ): "off" | "red" | "green" | "blue" {
    const key = `${stringIndex}-${ledIndex}`;
    return this.activeRgbLedStates[key] || "off";
  }

  getRgbLedColorHex(stringIndex: number, ledIndex: number): string | undefined {
    return getRgbLedColorHex(this.getRgbLedColor(stringIndex, ledIndex));
  }

  getRgbLedColorShadow(
    stringIndex: number,
    ledIndex: number,
  ): string | undefined {
    return getRgbLedColorShadow(this.getRgbLedColor(stringIndex, ledIndex));
  }

  sendLedStringState(stringIndex: number) {
    const config = this.config();
    const ls = config?.ledStrings?.[stringIndex];
    if (!ls) return;

    // Build states for all LEDs on this string to keep them synced
    const states = ls.leds.map((_, idx) => {
      const color = this.getRgbLedColor(stringIndex, idx);
      let r = 0;
      let g = 0;
      let b = 0;

      if (color === "red") {
        r = 255;
      } else if (color === "green") {
        g = 255;
      } else if (color === "blue") {
        b = 255;
      }

      return { index: idx, r, g, b };
    });

    this.dataService
      .setInterfaceRgbLedState(ls.pin, states, this.index())
      .subscribe({
        next: (resp) => {
          if (!resp.success) {
            this.logger.error("Failed to set RGB LED state:", resp.message);
          }
        },
        error: (err) => this.logger.error("Error setting RGB LED state:", err),
      });
  }

  toggleRgbLed(stringIndex: number, ledIndex: number) {
    const key = `${stringIndex}-${ledIndex}`;
    const currentState = this.activeRgbLedStates[key] || "off";
    let nextState: "off" | "red" | "green" | "blue";

    switch (currentState) {
      case "off":
        nextState = "red";
        break;
      case "red":
        nextState = "green";
        break;
      case "green":
        nextState = "blue";
        break;
      case "blue":
        nextState = "off";
        break;
      default:
        nextState = "off";
    }

    this.activeRgbLedStates[key] = nextState;
    this.cdr.detectChanges();

    this.sendLedStringState(stringIndex);
  }

  onDebounceChange(value: number) {
    if (!this.isEditMode()) {
      return;
    }
    this.debounceUpdateSubject.next(value);
  }

  // Pin Activity Logic
  private triggerPinActivity(interfaceId: number) {
    let key = "";
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
    const _behavior = this.getPinBehavior(isDigital, pin);

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
    if (!this.isEditMode()) {
      return;
    }
    const behavior = this.getPinBehavior(isDigital, pin);
    if (isOutputPinBehavior(behavior)) {
      const key = isDigital ? `D${pin}` : `A${pin}`;
      const currentState = !!this.pinState[key];
      const newState = !currentState;

      this.pinState[key] = newState;
      this.dataService
        .setInterfacePinState(pin, isDigital, newState, this.index())
        .subscribe({
          next: (response) => {
            if (!response.success) {
              this.logger.warn("Failed to set pin state", response.message);
              // Revert state on failure
              this.pinState[key] = currentState;
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            this.logger.error("Error setting pin state", err);
            // Revert state on failure
            this.pinState[key] = currentState;
            this.cdr.detectChanges();
          },
        });
    }
  }

  // Pin Action Logic
  digitalPinActions: PinGroup[] = [];
  analogPinActions: PinGroup[] = [];

  getPinAction(isDigital: boolean, pinIndex: number): string {
    const val = this.getPinBehavior(isDigital, pinIndex);
    return getPinAction(val);
  }

  setPinAction(isDigital: boolean, pinIndex: number, action: string) {
    const val = parsePinAction(action);
    this.setPinBehavior(isDigital, pinIndex, val.toString());
  }

  private handlePinBehaviorChange(
    pinIndex: number,
    isDigital: boolean,
    oldVal: number,
    newVal: number,
  ) {
    if (!this.config()) return;

    const actualPin = isDigital ? pinIndex : pinIndex + 1000;
    const LED_BEHAVIOR = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;

    // If changing FROM LedRGBString, remove the string
    if (oldVal === LED_BEHAVIOR) {
      this.removeLedStringByPin(actualPin);
    }

    // If changing TO LedRGBString, add a new string
    if (newVal === LED_BEHAVIOR) {
      this.addLedString(25, actualPin);
    }

    // If changing FROM VoltageLevel, remove voltageConfig if no pins are monitoring that lane
    const VOLTAGE_BASE = PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE;
    const laneCount = this.lanes()?.length || 0;
    if (oldVal >= VOLTAGE_BASE && oldVal < VOLTAGE_BASE + laneCount) {
      const lane = oldVal - VOLTAGE_BASE;
      if (
        !this.getVoltageLanes().includes(lane) &&
        this.config()?.voltageConfigs
      ) {
        delete this.config()!.voltageConfigs![lane];
      }
    }
  }

  private updateLedBehaviors() {
    this.ledBehaviors = buildLedBehaviors(
      this.lanes(),
      this.translationService,
    );
  }

  private updateLedTypes() {
    this.ledTypes = buildLedTypes(
      this.translationService,
      this.config()?.hardwareType,
    );
  }

  private updateColorOrders() {
    this.colorOrders = buildColorOrders(this.translationService);
  }

  private getLedBaseTranslationKey(behaviorKey: string): string {
    return getLedBaseTranslationKey(behaviorKey);
  }

  onCreateLedString() {
    if (!this.isEditMode()) {
      return;
    }
    this.requestLedStringDialog.emit();
  }

  addLedString(numLeds: number, pin: number = 0) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config) return;
    if (!config.ledStrings) config.ledStrings = [];

    // Ensure we don't already have a string for this pin
    if (pin !== 0) {
      const existing = config.ledStrings.find((s) => s.pin === pin);
      if (existing) return;
    }

    // Enforce maximum LED strings per board to match Arduino sketch memory limits
    const maxStrings = config.hardwareType === 0 ? 5 : 8;
    if (config.ledStrings.length >= maxStrings) {
      this.logger.warn(
        `Maximum number of LED strings (${maxStrings}) reached for this board.`,
      );
      return;
    }

    config.ledStrings.push(createLedString(numLeds, pin, this.lanes()));
    this.ledStringExpanded.push(true);
    this.saveState();
    this.updateArduinoConfig();
  }

  getPinLabel(pin: number): string {
    const config = this.config();
    if (
      pin === 0 &&
      (!config?.ledStrings || !config.ledStrings.some((s) => s.pin === 0))
    ) {
      return "";
    }
    const isDigital = pin < 1000;
    const index = isDigital ? pin : pin - 1000;
    return (isDigital ? "D" : "A") + index;
  }

  removeLedStringByPin(pin: number) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config || !config.ledStrings) return;
    const index = removeLedStringByPin(config, pin);
    if (index !== -1) {
      this.ledStringExpanded.splice(index, 1);
      this.saveState();
      this.updateArduinoConfig();
    }
  }

  removeLedString(index: number, event: Event) {
    event.stopPropagation();
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config || !config.ledStrings) return;

    removeLedStringByIndex(config, index);
    this.ledStringExpanded.splice(index, 1);
    this.saveState();
    this.updateArduinoConfig();
  }

  updateLedBehavior(stringIndex: number, ledIndex: number, behavior: any) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config || !config.ledStrings) return;
    updateLedBehaviorState(
      config,
      stringIndex,
      ledIndex,
      parseInt(behavior, 10),
      this.isLedStringsLinked,
      this.activeRgbLedStates,
    );
    this.cdr.detectChanges();
    this.updateArduinoConfig();
  }

  updateLedString() {
    this.updateArduinoConfig();
  }

  toggleVoltageLink() {
    if (!this.isEditMode()) {
      return;
    }
    this.isVoltageLinked = !this.isVoltageLinked;
    localStorage.setItem(
      `rc.arduino-editor.voltage-linked.${this.index()}`,
      this.isVoltageLinked.toString(),
    );
  }

  toggleLedStringsLink() {
    if (!this.isEditMode()) {
      return;
    }
    this.isLedStringsLinked = !this.isLedStringsLinked;
    localStorage.setItem(
      `rc.arduino-editor.led-strings-linked.${this.index()}`,
      this.isLedStringsLinked.toString(),
    );
  }

  onLedStringBrightnessChange(stringIdx: number, val: any) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config?.ledStrings) return;
    updateLedStringBrightness(config, stringIdx, val, this.isLedStringsLinked);
    this.updateArduinoConfig();
  }

  onLedStringCountChange(stringIdx: number, val: any) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config?.ledStrings) return;
    updateLedStringCount(config, stringIdx, val, this.isLedStringsLinked);
    this.updateArduinoConfig();
  }

  onLedStringLedTypeChange(stringIdx: number, val: any) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config?.ledStrings) return;
    updateLedStringLedType(config, stringIdx, val, this.isLedStringsLinked);
    this.updateArduinoConfig();
  }

  onLedStringColorOrderChange(stringIdx: number, val: any) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config?.ledStrings) return;
    updateLedStringColorOrder(config, stringIdx, val, this.isLedStringsLinked);
    this.updateArduinoConfig();
  }

  onLedStringFlashRateChange(stringIdx: number, val: any) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config?.ledStrings) return;
    updateLedStringFlashRate(config, stringIdx, val, this.isLedStringsLinked);
    this.updateLedString();
  }

  onLedStringLaneColorChange(
    stringIdx: number,
    laneIdx: number,
    color: string,
  ) {
    if (!this.isEditMode()) {
      return;
    }
    const config = this.config();
    if (!config?.ledStrings) return;
    updateLedStringLaneColor(
      config,
      stringIdx,
      laneIdx,
      color,
      this.isLedStringsLinked,
    );
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = setTimeout(() => {
      this.colorDebounceTimer = null;
      this.updateLedString();
    }, 400);
  }

  private updatePinActions() {
    const lanes = this.lanes();
    this.digitalPinActions = createPinGroups(
      lanes,
      false,
      this.translationService,
    );
    this.analogPinActions = createPinGroups(
      lanes,
      true,
      this.translationService,
    );
  }

  getFilteredActions(isDigital: boolean, pin: number): PinGroup[] {
    const groups = isDigital ? this.digitalPinActions : this.analogPinActions;
    const currentAction = this.getPinAction(isDigital, pin);
    return filterPinActions(
      groups,
      isDigital,
      pin,
      this.config(),
      this.supportsRgbLeds,
      currentAction,
      this.translationService,
    );
  }

  private refreshLanes() {
    const config = this.config();
    const lanes = this.lanes();
    if (!config || !lanes) return;

    this.updatePinActions();
    this.updateLedBehaviors();

    if (syncArduinoLanes(config, lanes)) {
      this.updateArduinoConfig();
    }
  }

  getVoltageLanes(): number[] {
    return getVoltageLanes(this.config());
  }

  getLiveVoltageForLane(lane: number): number {
    return getLiveVoltageForLane(this.config(), this.liveVoltages, lane);
  }

  getVoltageMax(lane: number): number {
    return getVoltageMax(this.config(), lane);
  }

  getLaneForAnalogPin(pin: number): number {
    return getLaneForAnalogPin(this.config(), pin);
  }

  setVoltageMax(lane: number, value: string | number) {
    if (!this.isEditMode()) return;
    applyVoltageMax(
      this.config(),
      lane,
      value,
      this.isVoltageLinked,
      this.getVoltageLanes(),
    );
    this.updateArduinoConfig();
  }

  setMaxToSeen(lane: number) {
    if (!this.isEditMode()) return;
    applyMaxToSeen(
      this.config(),
      lane,
      this.maxVoltagesSeen,
      this.isVoltageLinked,
      this.getVoltageLanes(),
    );
    this.updateArduinoConfig();
  }

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveState();
  }

  toggleLedString(index: number) {
    this.ledStringExpanded[index] = !this.ledStringExpanded[index];
    this.saveState();
  }

  private saveState() {
    saveArduinoState(
      this.index(),
      this.sectionsExpanded,
      this.ledStringExpanded,
      this.groupsCollapsed,
    );
  }

  togglePinDropdown(pinKey: string, event: Event) {
    event.stopPropagation();
    if (!this.isEditMode()) {
      return;
    }
    if (this.openPinDropdown === pinKey) {
      this.openPinDropdown = null;
    } else {
      this.openPinDropdown = pinKey;

      // Smart positioning: check if there's enough space below
      const trigger = event.currentTarget as HTMLElement;
      if (trigger) {
        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 300px below (typical dropdown height), open up
        this.dropdownOpenUp[pinKey] = spaceBelow < 300;
      }
    }
  }

  isPinDropdownOpen(pinKey: string): boolean {
    return this.openPinDropdown === pinKey;
  }

  toggleGroupCollapse(groupKey: string, event: Event) {
    event.stopPropagation();
    this.groupsCollapsed[groupKey] = !this.isGroupCollapsed(groupKey);
    this.saveState();
  }

  isGroupCollapsed(groupKey: string): boolean {
    if (!groupKey) return false; // None group
    const val = this.groupsCollapsed[groupKey];
    return val !== false; // Default to true (collapsed)
  }

  getCurrentActionLabel(isDigital: boolean, pin: number): string {
    const actionValue = this.getPinAction(isDigital, pin);
    const actions = isDigital ? this.digitalPinActions : this.analogPinActions;
    for (const group of actions) {
      const action = group.actions.find((a) => a.value === actionValue);
      if (action) return action.label;
    }
    return this.translationService.translate("AE_PIN_UNUSED");
  }

  selectPinAction(isDigital: boolean, pin: number, actionValue: string) {
    if (!this.isEditMode()) {
      return;
    }
    const groups = this.getFilteredActions(isDigital, pin);
    for (const group of groups) {
      const action = group.actions.find((a) => a.value === actionValue);
      if (action?.disabled) {
        return;
      }
    }
    this.setPinAction(isDigital, pin, actionValue);
    this.openPinDropdown = null;
  }

  getLedActionLabel(value: string | number | undefined): string {
    return getLedActionLabel(value, this.ledBehaviors, this.translationService);
  }

  @HostListener("document:click")
  closeDropdowns() {
    this.openPinDropdown = null;
    this.dropdownOpenUp = {};
  }

  ensureSectionsExpanded(): void {
    const s = this.sectionsExpanded;
    s.arduino = s.main = s.digital = s.analog = s.voltage = s.leds = true;
    if (this.config()?.ledStrings?.length) {
      this.ledStringExpanded[0] = true;
    }
    this.cdr.detectChanges();
  }

  getHelpSteps(): GuideStep[] {
    const expand = (key: keyof typeof this.sectionsExpanded, isLed = false) => {
      this.sectionsExpanded.arduino = true;
      this.sectionsExpanded[key] = true;
      if (isLed && this.config()?.ledStrings?.length) {
        this.ledStringExpanded[0] = true;
      }
      this.cdr.detectChanges();
    };

    return buildArduinoHelpSteps({
      index: this.index(),
      availablePins: this.availablePins,
      availableAnalogPins: this.availableAnalogPins,
      voltageLanes: this.getVoltageLanes(),
      ledStrings: this.config()?.ledStrings,
      expandMain: () => expand("main"),
      expandDigital: () => expand("digital"),
      expandAnalog: () => expand("analog"),
      expandVoltage: () => expand("voltage"),
      expandLeds: () => expand("leds", true),
    });
  }

  removeInterface(event: Event) {
    event.stopPropagation();
    if (!this.isEditMode()) {
      return;
    }
    this.remove.emit();
  }

  trackByLedString(index: number, ls: LedString): string | number {
    return ls.pin !== 0 ? ls.pin : index;
  }

  trackByLed(index: number, _led: any): number {
    return index;
  }

  trackByLane(index: number, lane: Lane): string {
    return lane ? lane.entity_id : index.toString();
  }
}
