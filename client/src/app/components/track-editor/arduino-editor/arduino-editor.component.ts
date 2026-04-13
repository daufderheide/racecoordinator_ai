import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject, Subscription, timer } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { DataService } from "src/app/data.service";
import { Lane } from "src/app/models/lane";
import {
  ArduinoConfig,
  LedString,
  MAX_ANALOG_PINS,
  MAX_DIGITAL_PINS,
} from "src/app/models/track";
import { com } from "src/app/proto/message";
import { TranslationService } from "src/app/services/translation.service";

interface PinAction {
  label: string;
  value: string;
}

@Component({
  selector: "app-arduino-editor",
  templateUrl: "./arduino-editor.component.html",
  styleUrls: ["./arduino-editor.component.css"],
  standalone: false,
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
  @Output() requestLedStringDialog = new EventEmitter<void>();

  availablePorts: string[] = [];
  interfaceStatus: number = 1; // 0=Connected, 1=Disconnected, 2=NoData
  pinActivity: { [key: string]: boolean } = {};
  sectionsExpanded = {
    arduino: true,
    main: true,
    digital: true,
    analog: true,
    voltage: true,
    leds: true,
  };
  ledBehaviors: PinAction[] = [];
  liveVoltages: { [key: number]: number | undefined } = {};
  maxVoltagesSeen: { [key: number]: number | undefined } = {};
  isVoltageLinked: boolean = false;
  isLedStringsLinked: boolean = true;
  ledStringExpanded: boolean[] = [];
  activeRgbLedStates: { [key: string]: boolean } = {};
  ledTypes: PinAction[] = [];

  private interfaceEventsSubscription?: Subscription;
  private portPollingSubscription?: Subscription;
  private pinActivityTimers: { [key: string]: any } = {};
  private colorDebounceTimer: any = null;

  resetMaxSeenAll() {
    this.maxVoltagesSeen = {};
    this.cdr.detectChanges();
  }

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
  ) {}

  ngOnInit() {
    this.fetchPorts();
    this.portPollingSubscription = timer(5000, 5000).subscribe(() => {
      this.fetchPorts();
    });

    // Load expanded state from localStorage
    const savedSections = localStorage.getItem(
      `rc.arduino-editor.sections.${this.index}`,
    );
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        this.sectionsExpanded = { ...this.sectionsExpanded, ...parsed };
      } catch (e) {
        console.error("Failed to parse saved sections", e);
      }
    }

    // Load link states
    const savedVoltageLink = localStorage.getItem(
      `rc.arduino-editor.voltage-linked.${this.index}`,
    );
    if (savedVoltageLink !== null) {
      this.isVoltageLinked = savedVoltageLink === "true";
    }

    const savedLedLink = localStorage.getItem(
      `rc.arduino-editor.led-strings-linked.${this.index}`,
    );
    if (savedLedLink !== null) {
      this.isLedStringsLinked = savedLedLink === "true";
    }

    if (this.config && this.config.ledStrings) {
      this.config.ledStrings.forEach((ls) => {
        if (ls.ledType === undefined) ls.ledType = 0;
      });

      // Default to open (true)
      this.ledStringExpanded = new Array(this.config.ledStrings.length).fill(
        true,
      );
      const savedLeds = localStorage.getItem(
        `rc.arduino-editor.led-strings.${this.index}`,
      );
      if (savedLeds) {
        try {
          const parsed = JSON.parse(savedLeds);
          if (Array.isArray(parsed)) {
            parsed.forEach((val, i) => {
              if (i < this.ledStringExpanded.length) {
                this.ledStringExpanded[i] = val;
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse saved led strings", e);
        }
      }
    }

    this.updatePinActions();
    this.updateLedBehaviors();
    this.updateLedTypes();

    // Subscribe to Interface Events for status and pin activity
    this.interfaceEventsSubscription = this.dataService
      .getInterfaceEvents()
      .subscribe({
        next: (event) => {
          if (event.lap) {
            if (event.lap.interfaceIndex === this.index) {
              this.triggerPinActivity(event.lap.interfaceId ?? -1);
            }
          } else if (event.segment) {
            if (event.segment.interfaceIndex === this.index) {
              this.triggerPinActivity(event.segment.interfaceId ?? -1);
            }
          } else if (event.callbutton) {
            if (event.callbutton.interfaceIndex === this.index) {
              const lane = event.callbutton.lane;
              // Trigger activity for master call button or specific lane call button
              const isMega = this.config?.hardwareType === 1;
              const digitalCount = isMega ? 54 : 14;
              const analogCount = isMega ? 16 : 6;

              const checkPin = (isDigital: boolean, pinCount: number) => {
                for (let i = 0; i < pinCount; i++) {
                  if (isDigital && i < 2) continue; // Skip D0, D1
                  const behavior = this.getPinBehavior(isDigital, i);
                  if (
                    behavior ===
                      com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON ||
                    behavior ===
                      com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE +
                        (lane ?? 0)
                  ) {
                    this.triggerPinActivity(isDigital ? i : i + 1000);
                  }
                }
              };

              checkPin(true, digitalCount);
              checkPin(false, analogCount);
            }
          } else if (event.status) {
            if (event.status.interfaceIndex === this.index) {
              this.interfaceStatus = event.status.status as number;
              this.cdr.detectChanges();
            }
          } else if (event.analogData) {
            if (event.analogData.interfaceIndex === this.index) {
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
        },
      });

    // Handle debounce changes
    this.debounceUpdateSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        if (this.config) {
          this.config.debounceUs = value;
          this.updateArduinoConfig();
        }
      });

    // Translate pin actions when language changes
    this.translationService.getCurrentLanguage().subscribe(() => {
      this.updatePinActions();
      this.updateLedBehaviors();
      this.updateLedTypes();
    });

    this.updateArduinoConfig();
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
    this.dataService.closeInterface().subscribe({
      next: () => console.log("Interface closed successfully"),
      error: (err) => console.error("Error closing interface", err),
    });
  }

  fetchPorts() {
    this.dataService.getSerialPorts().subscribe({
      next: (ports) => {
        this.availablePorts = ports;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Failed to fetch ports", err),
    });
  }

  onHardwareTypeChange(newType: number) {
    if (!this.config) return;

    this.config.hardwareType = newType;
    this.updateLedTypes();

    if (newType === 0) {
      // Uno
      // Reset digital pins D14-D59 (Uno only has 14 digital pins, 0-13)
      for (let i = 14; i < MAX_DIGITAL_PINS; i++) {
        this.config.digitalIds[i] = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;
      }
      // Reset analog pins A6-A15 (Uno only has 6 analog pins, 0-5)
      for (let i = 6; i < MAX_ANALOG_PINS; i++) {
        this.config.analogIds[i] = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;
      }
    }

    this.updateArduinoConfig();
  }

  updateArduinoConfig() {
    this.configChange.emit();

    if (this.config) {
      this.dataService
        .updateInterfaceConfig(this.config, this.index)
        .subscribe({
          next: (response) => {
            if (!response.success) {
              console.warn(
                `Failed to update interface config: ${response.message}`,
              );
            } else {
              console.log("Interface config updated successfully");
            }
          },
          error: (err) => {
            console.error("Error calling updateInterfaceConfig", err);
          },
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
    return isDigital
      ? this.config.digitalIds[pinIndex]
      : this.config.analogIds[pinIndex];
  }

  setPinBehavior(isDigital: boolean, pinIndex: number, behavior: string) {
    if (!this.config) return;
    const val = parseInt(behavior, 10);
    let changed = false;

    if (isDigital) {
      const oldVal = this.config.digitalIds[pinIndex];
      if (oldVal !== val) {
        this.config.digitalIds[pinIndex] = val;
        this.handlePinBehaviorChange(pinIndex, true, oldVal, val);
        changed = true;
      }
    } else {
      const oldVal = this.config.analogIds[pinIndex];
      if (oldVal !== val) {
        this.config.analogIds[pinIndex] = val;
        this.handlePinBehaviorChange(pinIndex, false, oldVal, val);
        changed = true;
      }
    }

    if (changed) {
      this.configChange.emit();
      this.dataService
        .updateInterfaceConfig(this.config, this.index)
        .subscribe({
          next: (response) => {
            if (!response.success) {
              console.warn(
                `Failed to update interface config: ${response.message}`,
              );
            }
          },
          error: (err) => console.error("Error updating interface config", err),
        });
    }
  }

  // Debounce Logic
  private debounceUpdateSubject = new Subject<number>();

  isRgbLedActive(stringIndex: number, ledIndex: number): boolean {
    return !!this.activeRgbLedStates[`${stringIndex}-${ledIndex}`];
  }

  toggleRgbLed(stringIndex: number, ledIndex: number) {
    const key = `${stringIndex}-${ledIndex}`;
    const isActive = !this.activeRgbLedStates[key];
    this.activeRgbLedStates[key] = isActive;

    const r = isActive ? 255 : 0;
    const g = 0;
    const b = 0;

    this.dataService
      .setInterfaceRgbLedState(
        stringIndex,
        [{ index: ledIndex, r, g, b }],
        this.index,
      )
      .subscribe({
        next: (resp) => {
          if (!resp.success) {
            console.error("Failed to set RGB LED state:", resp.message);
          }
        },
        error: (err) => console.error("Error setting RGB LED state:", err),
      });
  }

  onDebounceChange(value: number) {
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
    const isRelay =
      behavior === com.antigravity.PinBehavior.BEHAVIOR_RELAY ||
      (behavior >= com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE &&
        behavior < com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE + 1000);

    if (isRelay) {
      const key = isDigital ? `D${pin}` : `A${pin}`;
      const currentState = !!this.pinState[key];
      const newState = !currentState;

      this.pinState[key] = newState;
      this.dataService
        .setInterfacePinState(pin, isDigital, newState, this.index)
        .subscribe({
          next: (response) => {
            if (!response.success) {
              console.warn("Failed to set pin state", response.message);
              // Revert state on failure
              this.pinState[key] = currentState;
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            console.error("Error setting pin state", err);
            // Revert state on failure
            this.pinState[key] = currentState;
            this.cdr.detectChanges();
          },
        });
    }
  }

  // Pin Action Logic
  digitalPinActions: PinAction[] = [];
  analogPinActions: PinAction[] = [];

  getPinAction(isDigital: boolean, pinIndex: number): string {
    const val = this.getPinBehavior(isDigital, pinIndex);
    if (val === com.antigravity.PinBehavior.BEHAVIOR_UNUSED || val === -1)
      return "";
    if (val === com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON)
      return "master_call";
    if (val === com.antigravity.PinBehavior.BEHAVIOR_RELAY)
      return "master_relay";

    if (
      val >= com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE &&
      val < com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE
    )
      return `lap_${val - com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE}`;

    if (
      val >= com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE &&
      val < com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE
    )
      return `segment_${val - com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE}`;

    if (
      val >= com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE &&
      val < com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE
    )
      return `call_${val - com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE}`;

    if (
      val >= com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE &&
      val < com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE + 1000
    )
      return `relay_${val - com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE}`;

    if (
      val >= com.antigravity.PinBehavior.BEHAVIOR_PIT_IN_BASE &&
      val < com.antigravity.PinBehavior.BEHAVIOR_PIT_OUT_BASE
    )
      return `pitin_${val - com.antigravity.PinBehavior.BEHAVIOR_PIT_IN_BASE}`;

    if (
      val >= com.antigravity.PinBehavior.BEHAVIOR_PIT_OUT_BASE &&
      val < com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE
    )
      return `pitout_${val - com.antigravity.PinBehavior.BEHAVIOR_PIT_OUT_BASE}`;

    if (
      val >= com.antigravity.PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE &&
      val < com.antigravity.PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + 1000
    )
      return `pitinout_${val - com.antigravity.PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE}`;

    if (val === com.antigravity.PinBehavior.BEHAVIOR_RESERVED)
      return "reserved";

    if (
      val >= com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
      val < com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
    )
      return `voltage_${val - com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE}`;

    if (val === (com.antigravity.PinBehavior as any).BEHAVIOR_LED_RGB_STRING)
      return "led_string";

    return "";
  }

  setPinAction(isDigital: boolean, pinIndex: number, action: string) {
    let val = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;
    if (action === "master_call") {
      val = com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON;
    } else if (action === "master_relay") {
      val = com.antigravity.PinBehavior.BEHAVIOR_RELAY;
    } else if (action.startsWith("lap_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE + laneIndex;
    } else if (action.startsWith("segment_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE + laneIndex;
    } else if (action.startsWith("call_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + laneIndex;
    } else if (action.startsWith("relay_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE + laneIndex;
    } else if (action === "reserved") {
      val = com.antigravity.PinBehavior.BEHAVIOR_RESERVED;
    } else if (action.startsWith("voltage_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + laneIndex;
    } else if (action.startsWith("pitin_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_PIT_IN_BASE + laneIndex;
    } else if (action.startsWith("pitout_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = com.antigravity.PinBehavior.BEHAVIOR_PIT_OUT_BASE + laneIndex;
    } else if (action === "led_string") {
      val = (com.antigravity.PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
    }

    this.setPinBehavior(isDigital, pinIndex, val.toString());
  }

  private handlePinBehaviorChange(
    pinIndex: number,
    isDigital: boolean,
    oldVal: number,
    newVal: number,
  ) {
    if (!this.config) return;

    const actualPin = isDigital ? pinIndex : pinIndex + 1000;
    const LED_BEHAVIOR = (com.antigravity.PinBehavior as any)
      .BEHAVIOR_LED_RGB_STRING;

    // If changing FROM LedRGBString, remove the string
    if (oldVal === LED_BEHAVIOR) {
      this.removeLedStringByPin(actualPin);
    }

    // If changing TO LedRGBString, add a new string
    if (newVal === LED_BEHAVIOR) {
      this.addLedString(25, actualPin);
    }
  }

  private updateLedBehaviors() {
    const behaviors: PinAction[] = [];

    // Add Unused first
    behaviors.push({
      label: this.translationService.translate("AE_PIN_UNUSED"),
      value: com.antigravity.RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED.toString(),
    });

    const otherBehaviors: PinAction[] = [];
    // Map all RgbLedBehavior except UNUSED
    Object.keys(com.antigravity.RgbLedBehavior).forEach((key) => {
      const val = (com.antigravity.RgbLedBehavior as any)[key];
      if (
        typeof val === "number" &&
        val !== com.antigravity.RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED
      ) {
        if (key === "RGB_LED_BEHAVIOR_RACE_STATE_BASE") {
          for (let i = 1; i <= 5; i++) {
            otherBehaviors.push({
              label: this.translationService.translate(
                "AE_LED_BEHAVIOR_RACE_STATE",
                { index: i },
              ),
              value: (val + i - 1).toString(),
            });
          }
        } else if (key === "RGB_LED_BEHAVIOR_COUNTDOWN_BASE") {
          for (let i = 1; i <= 5; i++) {
            otherBehaviors.push({
              label: this.translationService.translate(
                "AE_LED_BEHAVIOR_COUNTDOWN",
                { index: i },
              ),
              value: (val + i - 1).toString(),
            });
          }
        } else if (key.endsWith("_BASE")) {
          const translationKey = this.getLedBaseTranslationKey(key);
          this.lanes.forEach((_, i) => {
            otherBehaviors.push({
              label: this.translationService.translate(translationKey, {
                lane: i + 1,
              }),
              value: (val + i).toString(),
            });
          });
        } else {
          otherBehaviors.push({
            label: this.translationService.translate(key),
            value: val.toString(),
          });
        }
      }
    });

    // Sort alphabetically
    otherBehaviors.sort((a, b) => a.label.localeCompare(b.label));

    this.ledBehaviors = [...behaviors, ...otherBehaviors];
  }

  private updateLedTypes() {
    const allTypes = [
      {
        label: this.translationService.translate("AE_LED_TYPE_NEOPIXEL"),
        value: "0",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_WS2811"),
        value: "1",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_WS2812"),
        value: "2",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_WS2812B"),
        value: "3",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_TM1803"),
        value: "4",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_TM1804"),
        value: "5",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_TM1809"),
        value: "6",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_APA104"),
        value: "7",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_UCS1903"),
        value: "8",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_UCS1903B"),
        value: "9",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_GW6205"),
        value: "10",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_GW6205_400"),
        value: "11",
      },
      {
        label: this.translationService.translate("AE_LED_TYPE_OTHER"),
        value: "12",
      },
    ];

    if (this.config?.hardwareType === 0) {
      // Uno/Nano - Only keep NEOPIXEL and OTHER to save Flash/RAM in the sketch
      this.ledTypes = allTypes.filter((t) => ["0", "12"].includes(t.value));
    } else {
      this.ledTypes = allTypes;
    }
  }

  private getLedBaseTranslationKey(behaviorKey: string): string {
    switch (behaviorKey) {
      case "RGB_LED_BEHAVIOR_HEAT_LEADER_BASE":
        return "AE_LED_BEHAVIOR_HEAT_LEADER_LANE";
      case "RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE":
        return "AE_LED_BEHAVIOR_FUEL_LEVEL_LANE";
      case "RGB_LED_BEHAVIOR_REFUELING_BASE":
        return "AE_LED_BEHAVIOR_REFUELING_LANE";
      case "RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE":
        return "AE_LED_BEHAVIOR_LAP_INDICATOR_LANE";
      case "RGB_LED_BEHAVIOR_LAP_SENSOR_BASE":
        return "AE_LED_BEHAVIOR_LAP_SENSOR_LANE";
      default:
        return behaviorKey;
    }
  }

  onCreateLedString() {
    this.requestLedStringDialog.emit();
  }

  addLedString(numLeds: number, pin: number = 0) {
    if (!this.config) return;
    if (!this.config.ledStrings) this.config.ledStrings = [];

    // Ensure we don't already have a string for this pin
    if (pin !== 0) {
      const existing = this.config.ledStrings.find((s) => s.pin === pin);
      if (existing) return;
    }

    const n = Number(numLeds);
    const newString: LedString = {
      pin: pin,
      leds: new Array(n).fill(
        com.antigravity.RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED,
      ),
      numUsedLeds: 0,
      addressableLeds: 0,
      brightness: 255,
      ledType: 0,
      flagFlashRate: 5,
      ledLaneColorOverrides: this.lanes.map(
        (l) => l.background_color || "#ffffff",
      ),
    };

    this.config.ledStrings.push(newString);
    this.ledStringExpanded.push(true);
    this.saveState();
    this.updateArduinoConfig();
  }

  getPinLabel(pin: number): string {
    if (
      pin === 0 &&
      (!this.config?.ledStrings ||
        !this.config.ledStrings.some((s) => s.pin === 0))
    ) {
      return "";
    }
    const isDigital = pin < 1000;
    const index = isDigital ? pin : pin - 1000;
    return (isDigital ? "D" : "A") + index;
  }

  removeLedStringByPin(pin: number) {
    if (!this.config || !this.config.ledStrings) return;
    const index = this.config.ledStrings.findIndex((s) => s.pin === pin);
    if (index !== -1) {
      this.config.ledStrings.splice(index, 1);
      this.ledStringExpanded.splice(index, 1);
      this.saveState();
      this.updateArduinoConfig();
    }
  }

  removeLedString(index: number, event: Event) {
    event.stopPropagation();
    if (!this.config || !this.config.ledStrings) return;

    // Reset pin behavior if this string was linked to a pin
    const pin = this.config.ledStrings[index].pin;
    if (pin !== 0) {
      const isDigital = pin < 1000;
      const pinIndex = isDigital ? pin : pin - 1000;
      const unused = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;
      if (isDigital) {
        this.config.digitalIds[pinIndex] = unused;
      } else {
        this.config.analogIds[pinIndex] = unused;
      }
    }

    this.config.ledStrings.splice(index, 1);
    this.ledStringExpanded.splice(index, 1);
    this.saveState();
    this.updateArduinoConfig();
  }

  updateLedBehavior(stringIndex: number, ledIndex: number, behavior: any) {
    if (!this.config || !this.config.ledStrings) return;
    const ls = this.config.ledStrings[stringIndex];
    ls.leds[ledIndex] = parseInt(behavior, 10);

    // Update derived fields
    ls.numUsedLeds = 0;
    ls.addressableLeds = 0;
    ls.leds.forEach((b, i) => {
      if (b !== com.antigravity.RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED) {
        ls.numUsedLeds++;
        ls.addressableLeds = i + 1;
      }
    });

    this.updateArduinoConfig();
  }

  updateLedString() {
    this.updateArduinoConfig();
  }

  toggleVoltageLink() {
    this.isVoltageLinked = !this.isVoltageLinked;
    localStorage.setItem(
      `rc.arduino-editor.voltage-linked.${this.index}`,
      this.isVoltageLinked.toString(),
    );
  }

  toggleLedStringsLink() {
    this.isLedStringsLinked = !this.isLedStringsLinked;
    localStorage.setItem(
      `rc.arduino-editor.led-strings-linked.${this.index}`,
      this.isLedStringsLinked.toString(),
    );
  }

  onLedStringBrightnessChange(stringIdx: number, val: any) {
    if (!this.config?.ledStrings) return;
    const brightness = parseInt(val, 10);
    this.config.ledStrings[stringIdx].brightness = brightness;

    if (this.isLedStringsLinked) {
      this.config.ledStrings.forEach((ls, i) => {
        if (i !== stringIdx) ls.brightness = brightness;
      });
    }
    this.updateArduinoConfig();
  }

  onLedStringLedTypeChange(stringIdx: number, val: any) {
    if (!this.config?.ledStrings) return;
    const ledType = parseInt(val, 10);
    this.config.ledStrings[stringIdx].ledType = ledType;

    if (this.isLedStringsLinked) {
      this.config.ledStrings.forEach((ls, i) => {
        if (i !== stringIdx) ls.ledType = ledType;
      });
    }
    this.updateArduinoConfig();
  }

  onLedStringFlashRateChange(stringIdx: number, val: any) {
    if (!this.config?.ledStrings) return;
    const rate = parseFloat(val);
    this.config.ledStrings[stringIdx].flagFlashRate = rate;

    if (this.isLedStringsLinked) {
      this.config.ledStrings.forEach((ls, i) => {
        if (i !== stringIdx) ls.flagFlashRate = rate;
      });
    }
    this.updateLedString();
  }

  onLedStringLaneColorChange(
    stringIdx: number,
    laneIdx: number,
    color: string,
  ) {
    if (!this.config?.ledStrings) return;
    const sourceString = this.config.ledStrings[stringIdx];

    // Ensure array is large enough for source string
    while (sourceString.ledLaneColorOverrides.length <= laneIdx) {
      sourceString.ledLaneColorOverrides.push("#ffffff");
    }
    sourceString.ledLaneColorOverrides[laneIdx] = color;

    if (this.isLedStringsLinked) {
      this.config.ledStrings.forEach((ls, i) => {
        if (i !== stringIdx) {
          if (!ls.ledLaneColorOverrides) ls.ledLaneColorOverrides = [];
          while (ls.ledLaneColorOverrides.length <= laneIdx) {
            ls.ledLaneColorOverrides.push("#ffffff");
          }
          ls.ledLaneColorOverrides[laneIdx] = color;
        }
      });
    }

    // Use debounce for color changes to prevent re-renders from closing the color picker
    // We don't call updateLedString() immediately here to avoid UI interruptions during dragging
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = setTimeout(() => {
      this.colorDebounceTimer = null;
      this.updateLedString();
    }, 400);
  }

  private updatePinActions() {
    const actions: PinAction[] = [];

    // 1. Unused
    actions.push({
      label: this.translationService.translate("AE_PIN_UNUSED"),
      value: "",
    });

    // 2. Reserved
    actions.push({
      label: this.translationService.translate("AE_PIN_RESERVED"),
      value: "reserved",
    });

    // 3. Others (to be sorted alphabetically)
    const otherActions: PinAction[] = [];

    // Master Call
    otherActions.push({
      label: this.translationService.translate("AE_PIN_MASTER_CALL"),
      value: "master_call",
    });

    // Per-lane actions
    this.lanes.forEach((_, i) => {
      // Call Button
      otherActions.push({
        label: this.translationService.translate("AE_PIN_CALL_BUTTON_LANE", {
          lane: i + 1,
        }),
        value: `call_${i}`,
      });
      // Lap
      otherActions.push({
        label: this.translationService.translate("AE_PIN_LAP_LANE", {
          lane: i + 1,
        }),
        value: `lap_${i}`,
      });
      // Segment
      otherActions.push({
        label: this.translationService.translate("AE_PIN_SEGMENT_LANE", {
          lane: i + 1,
        }),
        value: `segment_${i}`,
      });
      // Relay
      otherActions.push({
        label: this.translationService.translate("AE_PIN_RELAY_LANE", {
          lane: i + 1,
        }),
        value: `relay_${i}`,
      });
      // Pit In
      otherActions.push({
        label: this.translationService.translate("AE_PIN_PIT_IN_LANE", {
          lane: i + 1,
        }),
        value: `pitin_${i}`,
      });
      // Pit Out
      otherActions.push({
        label: this.translationService.translate("AE_PIN_PIT_OUT_LANE", {
          lane: i + 1,
        }),
        value: `pitout_${i}`,
      });
      // Pit In/Out
      otherActions.push({
        label: this.translationService.translate("AE_PIN_PIT_IN_OUT_LANE", {
          lane: i + 1,
        }),
        value: `pitinout_${i}`,
      });
    });

    otherActions.push({
      label: this.translationService.translate("AE_PIN_LED_RGB_STRING"),
      value: "led_string",
    });

    // Sort other actions alphabetically by label
    otherActions.sort((a, b) => a.label.localeCompare(b.label));

    // Relay (Master)
    otherActions.push({
      label: this.translationService.translate("AE_PIN_RELAY"),
      value: "master_relay",
    });

    // Re-sort after adding relays
    otherActions.sort((a, b) => a.label.localeCompare(b.label));

    // Combine for digital
    this.digitalPinActions = [...actions, ...otherActions];

    // Add Voltage Level for analog only
    const analogOnlyActions: PinAction[] = [];
    this.lanes.forEach((_, i) => {
      analogOnlyActions.push({
        label: this.translationService.translate("AE_PIN_VOLTAGE_LANE", {
          lane: i + 1,
        }),
        value: `voltage_${i}`,
      });
    });
    analogOnlyActions.sort((a, b) => a.label.localeCompare(b.label));

    // Combine for analog
    this.analogPinActions = [...actions, ...otherActions, ...analogOnlyActions];
    // Re-sort analog if needed, but usually we want voltage at the end or intermixed?
    // Let's re-sort the whole thing to keep it clean.
    this.analogPinActions.sort((a, b) => {
      if (a.value === "" || a.value === "reserved") return -1;
      if (b.value === "" || b.value === "reserved") return 1;
      return a.label.localeCompare(b.label);
    });

    // Also re-sort digital for consistency
    this.digitalPinActions.sort((a, b) => {
      if (a.value === "" || a.value === "reserved") return -1;
      if (b.value === "" || b.value === "reserved") return 1;
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
      if (
        behavior !== undefined &&
        behavior >= com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
        behavior <
          com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
      ) {
        lanes.add(
          behavior - com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE,
        );
      }
    }
    return Array.from(lanes).sort((a, b) => a - b);
  }

  getLiveVoltageForLane(lane: number): number {
    if (!this.config) return 0;
    const isMega = this.config.hardwareType === 1;
    const analogCount = isMega ? 16 : 6;
    const analogIds = this.config.analogIds || [];

    const targetBehavior =
      com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + lane;
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
      if (
        behavior !== undefined &&
        behavior >= com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
        behavior <
          com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
      ) {
        return (
          behavior - com.antigravity.PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE
        );
      }
    }
    return -1;
  }

  setVoltageMax(lane: number, value: string | number) {
    if (!this.config) return;

    let val: number;
    if (typeof value === "string") {
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
    this.saveState();
  }

  toggleLedString(index: number) {
    this.ledStringExpanded[index] = !this.ledStringExpanded[index];
    this.saveState();
  }

  private saveState() {
    localStorage.setItem(
      `rc.arduino-editor.sections.${this.index}`,
      JSON.stringify(this.sectionsExpanded),
    );
    localStorage.setItem(
      `rc.arduino-editor.led-strings.${this.index}`,
      JSON.stringify(this.ledStringExpanded),
    );
  }

  getHelpSteps(): any[] {
    const steps: any[] = [
      {
        selector: `#arduino-editor-${this.index}`,
        title: "TE_HELP_ARDUINO_TITLE",
        content: "TE_HELP_ARDUINO_CONTENT",
        position: "right",
      },
      {
        selector: `#arduino-com-port-${this.index}`,
        title: "TE_HELP_ARDUINO_COM_PORT_TITLE",
        content: "TE_HELP_ARDUINO_COM_PORT_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-status-badge-${this.index}`,
        title: "TE_HELP_ARDUINO_STATUS_TITLE",
        content: "TE_HELP_ARDUINO_STATUS_CONTENT",
        position: "right",
      },
      {
        selector: `#arduino-board-type-${this.index}`,
        title: "TE_HELP_ARDUINO_BOARD_TYPE_TITLE",
        content: "TE_HELP_ARDUINO_BOARD_TYPE_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-debounce-${this.index}`,
        title: "TE_HELP_ARDUINO_DEBOUNCE_TITLE",
        content: "TE_HELP_ARDUINO_DEBOUNCE_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-pit-behavior-${this.index}`,
        title: "TE_HELP_ARDUINO_PIT_BEHAVIOR_TITLE",
        content: "TE_HELP_ARDUINO_PIT_BEHAVIOR_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-nc-sensors-${this.index}`,
        title: "TE_HELP_ARDUINO_NC_SENSORS_TITLE",
        content: "TE_HELP_ARDUINO_NC_SENSORS_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-nc-relays-${this.index}`,
        title: "TE_HELP_ARDUINO_NC_RELAYS_TITLE",
        content: "TE_HELP_ARDUINO_NC_RELAYS_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-digital-selector-4`,
        title: "TE_HELP_ARDUINO_PIN_SELECTOR_TITLE",
        content: "TE_HELP_ARDUINO_PIN_SELECTOR_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-digital-status-4`,
        title: "TE_HELP_ARDUINO_PIN_STATUS_TITLE",
        content: "TE_HELP_ARDUINO_PIN_STATUS_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-analog-selector-2`,
        title: "TE_HELP_ARDUINO_ANALOG_SELECTOR_TITLE",
        content: "TE_HELP_ARDUINO_ANALOG_SELECTOR_CONTENT",
        position: "bottom",
      },
      {
        selector: `#arduino-analog-status-2`,
        title: "TE_HELP_ARDUINO_ANALOG_STATUS_TITLE",
        content: "TE_HELP_ARDUINO_ANALOG_STATUS_CONTENT",
        position: "bottom",
      },
    ];

    const voltageLanes = this.getVoltageLanes();
    if (voltageLanes.length > 0) {
      // For lane-specific steps, we target the first lane (index 0) in the list
      steps.push({
        selector: `#arduino-voltage-section-${this.index}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_CONTENT",
        position: "top",
      });
      const firstLane = voltageLanes[0];
      steps.push({
        selector: `#arduino-voltage-max-${this.index}-${firstLane}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_MAX_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_MAX_CONTENT",
        position: "bottom",
      });
      steps.push({
        selector: `#arduino-voltage-link-${this.index}-${firstLane}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_LINK_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_LINK_CONTENT",
        position: "bottom",
      });
      steps.push({
        selector: `#arduino-voltage-live-${this.index}-${firstLane}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_LIVE_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_LIVE_CONTENT",
        position: "bottom",
      });
      steps.push({
        selector: `#arduino-voltage-set-max-${this.index}-${firstLane}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_SET_MAX_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_SET_MAX_CONTENT",
        position: "bottom",
      });
      steps.push({
        selector: `#arduino-voltage-reset-${this.index}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_RESET_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_RESET_CONTENT",
        position: "bottom",
      });
    }

    return steps;
  }

  removeInterface(event: Event) {
    event.stopPropagation();
    this.remove.emit();
  }

  trackByLedString(index: number, ls: LedString): string | number {
    return ls.pin !== 0 ? ls.pin : index;
  }

  trackByLed(index: number): number {
    return index;
  }

  trackByLane(index: number, lane: Lane): string {
    return lane ? lane.entity_id : index.toString();
  }
}
