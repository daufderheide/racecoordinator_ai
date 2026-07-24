import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { DataService } from "@app/data.service";
import { PhidgetConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  InterfaceStatus,
  IPhidgetDeviceInfo,
  PinBehavior,
} from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";

export interface PinAction {
  label: string;
  value: string;
}

export interface PinGroup {
  key: string;
  label: string;
  actions: PinAction[];
}

export interface PhidgetEditorSections {
  phidget: boolean;
  main: boolean;
  pins: boolean;
  digitalIn: boolean;
  digitalOut: boolean;
  analogIn: boolean;
}

@Component({
  selector: "app-phidget-editor",
  templateUrl: "./phidget-editor.component.html",
  styleUrls: ["./phidget-editor.component.css"],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class PhidgetEditorComponent implements OnInit, OnDestroy {
  config = model.required<PhidgetConfig>();
  allPhidgetConfigs = input<PhidgetConfig[]>([]);
  interfaceIndex = input.required<number>();
  lanes = input.required<number>();

  change = output<void>();
  remove = output<void>();
  driverError = output<void>();

  devices: IPhidgetDeviceInfo[] = [];
  status: string = "DISCONNECTED";

  sectionsExpanded: PhidgetEditorSections = {
    phidget: true,
    main: true,
    pins: true,
    digitalIn: true,
    digitalOut: true,
    analogIn: true,
  };

  selectedDeviceKeyStr: string = "";
  openPinDropdown: string | null = null;
  dropdownOpenUp: { [key: string]: boolean } = {};
  groupsCollapsed: { [key: string]: boolean } = {};
  pinActivity: { [key: string]: boolean } = {};
  pinState: { [key: string]: boolean } = {};

  private subscriptions = new Subscription();
  private pinActivityTimers: { [key: string]: any } = {};

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    if (!this.config()) {
      throw new Error("PhidgetConfig is required");
    }

    this.updateSelectedDeviceKey();

    const savedSections = localStorage.getItem(
      `rc.phidget-editor.sections.${this.interfaceIndex()}`,
    );
    if (savedSections) {
      try {
        this.sectionsExpanded = {
          ...this.sectionsExpanded,
          ...JSON.parse(savedSections),
        };
      } catch (e) {}
    }

    this.subscriptions.add(
      this.dataService.getPhidgetDevices().subscribe({
        next: (devices) => {
          this.devices = devices;
          this.updateSelectedDeviceKey();
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err.status === 500) {
            let msg = "";
            if (err.error instanceof ArrayBuffer) {
              msg = new TextDecoder("utf-8").decode(err.error);
            } else if (typeof err.error === "string") {
              msg = err.error;
            }
            if (msg.includes("MISSING_PHIDGET_DRIVER")) {
              this.driverError.emit();
            }
          }
        },
      }),
    );

    this.subscriptions.add(
      this.dataService.getInterfaceEvents().subscribe({
        next: (event) => {
          if (
            event.status &&
            (event.status.interfaceIndex ?? 0) === this.interfaceIndex()
          ) {
            const statusCode = event.status.status as number;
            if (statusCode === InterfaceStatus.CONNECTED) {
              this.status = "CONNECTED";
            } else if (statusCode === InterfaceStatus.NO_DATA) {
              this.status = "NO_DATA";
            } else {
              this.status = "DISCONNECTED";
            }
            this.cdr.detectChanges();
          }

          if (
            event.digitalPin &&
            (event.digitalPin.interfaceIndex ?? 0) === this.interfaceIndex()
          ) {
            const pin = event.digitalPin.pin ?? 0;
            const isDigital = event.digitalPin.isDigital ?? true;
            const key = `${isDigital ? "in" : "analog"}-${pin}`;
            this.pinActivity[key] = true;
            if (this.pinActivityTimers[key]) {
              clearTimeout(this.pinActivityTimers[key]);
            }
            this.pinActivityTimers[key] = setTimeout(() => {
              this.pinActivity[key] = false;
              this.cdr.detectChanges();
            }, 500);
            this.cdr.detectChanges();
          }
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    Object.values(this.pinActivityTimers).forEach((timer) =>
      clearTimeout(timer),
    );
  }

  onConfigChange() {
    this.updateSelectedDeviceKey();
    this.change.emit();
  }

  updateSelectedDeviceKey() {
    const c = this.config();
    if (!c || c.serialNumber <= 0) {
      this.selectedDeviceKeyStr = "";
    } else {
      this.selectedDeviceKeyStr = this.getDeviceKey(c);
    }
  }

  getDeviceKey(device: any): string {
    const serial = device.serialNumber || 0;
    const isHubPort = !!device.isHubPort;
    const hubPort = device.hubPort || 0;
    return `${serial}_${isHubPort}_${hubPort}`;
  }

  isDeviceSelectedByOther(device: IPhidgetDeviceInfo): boolean {
    if (!device || !device.serialNumber || device.serialNumber <= 0) {
      return false;
    }
    const devKey = this.getDeviceKey(device);
    const currentConf = this.config();
    const allConfigs = this.allPhidgetConfigs();

    return allConfigs.some((c) => {
      if (!c || c === currentConf || !c.serialNumber || c.serialNumber <= 0) {
        return false;
      }
      return this.getDeviceKey(c) === devKey;
    });
  }

  onDeviceSelectChange(key: string) {
    const selected = this.devices.find((d) => this.getDeviceKey(d) === key);
    const c = this.config();
    if (selected && c) {
      c.serialNumber = selected.serialNumber ?? 0;
      c.isHubPort = !!selected.isHubPort;
      c.hubPort = selected.hubPort ?? 0;
      c.name = selected.name || "Phidget Device";
    }
    this.onConfigChange();
  }

  onRemove() {
    this.remove.emit();
  }

  toggleSection(section: keyof PhidgetEditorSections) {
    if (section in this.sectionsExpanded) {
      this.sectionsExpanded[section] = !this.sectionsExpanded[section];
      localStorage.setItem(
        `rc.phidget-editor.sections.${this.interfaceIndex()}`,
        JSON.stringify(this.sectionsExpanded),
      );
    }
  }

  getCapabilities(): {
    digitalInputs: number;
    digitalOutputs: number;
    analogInputs: number;
  } {
    const c = this.config();
    const key = this.selectedDeviceKeyStr;
    const selected = this.devices.find((d) => this.getDeviceKey(d) === key);

    let inCount = selected?.digitalInputCount ?? 0;
    let outCount = selected?.digitalOutputCount ?? 0;
    let analogCount = selected?.analogInputCount ?? 0;

    if (inCount === 0 && outCount === 0 && analogCount === 0) {
      const name = selected?.name || c?.name || "";
      const match = name.match(/(\d+)\/(\d+)\/(\d+)/);
      if (match) {
        inCount = parseInt(match[1], 10);
        outCount = parseInt(match[2], 10);
        analogCount = parseInt(match[3], 10);
      } else if (
        name.includes("0/0/4") ||
        name.toLowerCase().includes("1014")
      ) {
        inCount = 0;
        outCount = 4;
        analogCount = 0;
      } else if (
        name.includes("8/8/8") ||
        name.toLowerCase().includes("1018")
      ) {
        inCount = 8;
        outCount = 8;
        analogCount = 8;
      } else {
        inCount = this.getHighestAssignedIndex(c?.digitalInIds) + 1;
        outCount = this.getHighestAssignedIndex(c?.digitalOutIds) + 1;
        analogCount = this.getHighestAssignedIndex(c?.analogIds) + 1;
        if (inCount === 0 && outCount === 0 && analogCount === 0) {
          inCount = 8;
          outCount = 8;
          analogCount = 8;
        }
      }
    }
    return {
      digitalInputs: inCount,
      digitalOutputs: outCount,
      analogInputs: analogCount,
    };
  }

  private getHighestAssignedIndex(ids?: number[]): number {
    if (!ids) return -1;
    let max = -1;
    for (let i = 0; i < ids.length; i++) {
      if (ids[i] !== PinBehavior.BEHAVIOR_UNUSED && ids[i] !== -1) {
        max = i;
      }
    }
    return max;
  }

  supportsAnalogLeds(): boolean {
    const caps = this.getCapabilities();
    const key = this.selectedDeviceKeyStr;
    const selected = this.devices.find((d) => this.getDeviceKey(d) === key);
    const c = this.config();
    const name = (selected?.name || c?.name || "").toLowerCase();

    if (
      name.includes("0/0/4") ||
      name.includes("1014") ||
      name.includes("relay")
    ) {
      return false;
    }
    if (
      caps.digitalInputs === 0 &&
      caps.analogInputs === 0 &&
      caps.digitalOutputs > 0
    ) {
      return false;
    }
    return true;
  }

  getBoardImagePath(): string {
    const key = this.selectedDeviceKeyStr;
    const selected = this.devices.find((d) => this.getDeviceKey(d) === key);
    const c = this.config();
    const name = (selected?.name || c?.name || "").toLowerCase();

    if (!key || !c || c.serialNumber <= 0) {
      return "assets/images/phidget_composite_boards.png";
    }

    if (name.includes("0/0/4") || name.includes("1014")) {
      return "assets/images/phidget_0_0_4_board.png";
    }

    if (name.includes("8/8/8") || name.includes("1018")) {
      return "assets/images/phidget_8_8_8_board.png";
    }

    return "assets/images/phidget_composite_boards.png";
  }

  get availableDigitalInputPins(): number[] {
    const count = this.getCapabilities().digitalInputs;
    return Array.from({ length: count }, (_, i) => i);
  }

  get availableDigitalOutputPins(): number[] {
    const count = this.getCapabilities().digitalOutputs;
    return Array.from({ length: count }, (_, i) => i);
  }

  get availableAnalogInputPins(): number[] {
    const count = this.getCapabilities().analogInputs;
    return Array.from({ length: count }, (_, i) => i);
  }

  getFilteredActions(
    type: "in" | "out" | "analog",
    _channel: number,
  ): PinGroup[] {
    const numLanes = this.lanes();
    const groups: PinGroup[] = [
      {
        key: "none",
        label: "",
        actions: [
          {
            label: this.translationService.translate("AE_PIN_UNUSED"),
            value: "",
          },
        ],
      },
    ];

    if (type === "in") {
      groups.push(...this.buildDigitalInputGroups(numLanes));
    } else if (type === "out") {
      groups.push(...this.buildDigitalOutputGroups(numLanes));
    } else if (type === "analog") {
      groups.push(...this.buildAnalogInputGroups(numLanes));
    }

    return groups;
  }

  private buildDigitalInputGroups(numLanes: number): PinGroup[] {
    const groups: PinGroup[] = [];

    // Callbuttons
    const callActions: PinAction[] = [
      {
        label: this.translationService.translate("AE_PIN_MASTER_CALL"),
        value: "master_call",
      },
    ];
    for (let i = 0; i < numLanes; i++) {
      callActions.push({
        label: this.translationService.translate("AE_PIN_CALL_BUTTON_LANE", {
          lane: i + 1,
        }),
        value: `call_${i}`,
      });
    }
    groups.push({
      key: "AE_BEHAVIOR_GROUP_CALLBUTTON",
      label: this.translationService.translate("AE_BEHAVIOR_GROUP_CALLBUTTON"),
      actions: callActions,
    });

    // Pits
    const pitActions: PinAction[] = [];
    for (let i = 0; i < numLanes; i++) {
      pitActions.push(
        {
          label: this.translationService.translate("AE_PIN_PIT_IN_LANE", {
            lane: i + 1,
          }),
          value: `pitin_${i}`,
        },
        {
          label: this.translationService.translate("AE_PIN_PIT_OUT_LANE", {
            lane: i + 1,
          }),
          value: `pitout_${i}`,
        },
        {
          label: this.translationService.translate("AE_PIN_PIT_IN_OUT_LANE", {
            lane: i + 1,
          }),
          value: `pitinout_${i}`,
        },
      );
    }
    groups.push({
      key: "AE_BEHAVIOR_GROUP_PIT",
      label: this.translationService.translate("AE_BEHAVIOR_GROUP_PIT"),
      actions: pitActions,
    });

    // Laps
    const lapActions: PinAction[] = [];
    for (let i = 0; i < numLanes; i++) {
      lapActions.push({
        label: this.translationService.translate("AE_PIN_LAP_LANE", {
          lane: i + 1,
        }),
        value: `lap_${i}`,
      });
    }
    groups.push({
      key: "AE_BEHAVIOR_GROUP_LAP",
      label: this.translationService.translate("AE_BEHAVIOR_GROUP_LAP"),
      actions: lapActions,
    });

    // Segments
    const segmentActions: PinAction[] = [];
    for (let i = 0; i < numLanes; i++) {
      segmentActions.push({
        label: this.translationService.translate("AE_PIN_SEGMENT_LANE", {
          lane: i + 1,
        }),
        value: `segment_${i}`,
      });
    }
    groups.push({
      key: "AE_BEHAVIOR_GROUP_SEGMENT",
      label: this.translationService.translate("AE_BEHAVIOR_GROUP_SEGMENT"),
      actions: segmentActions,
    });

    return groups;
  }

  private buildDigitalOutputGroups(numLanes: number): PinGroup[] {
    const groups: PinGroup[] = [];

    // Relays
    const relayActions: PinAction[] = [
      {
        label: this.translationService.translate("AE_PIN_RELAY"),
        value: "master_relay",
      },
    ];
    for (let i = 0; i < numLanes; i++) {
      relayActions.push({
        label: this.translationService.translate("AE_PIN_RELAY_LANE", {
          lane: i + 1,
        }),
        value: `relay_${i}`,
      });
    }
    groups.push({
      key: "AE_BEHAVIOR_GROUP_RELAY",
      label: this.translationService.translate("AE_BEHAVIOR_GROUP_RELAY"),
      actions: relayActions,
    });

    // Analog LEDs (only if supported by board)
    if (this.supportsAnalogLeds()) {
      const analogLedActions: PinAction[] = [
        {
          label: this.translationService.translate(
            "AE_PIN_ANALOG_LED_GREEN_FLAG",
          ),
          value: "analogled_green",
        },
        {
          label: this.translationService.translate(
            "AE_PIN_ANALOG_LED_YELLOW_FLAG",
          ),
          value: "analogled_yellow",
        },
      ];
      for (let i = 1; i <= 5; i++) {
        analogLedActions.push({
          label: this.translationService.translate(
            "AE_PIN_ANALOG_LED_COUNTDOWN",
            { num: i },
          ),
          value: `analogled_countdown_${i}`,
        });
      }
      groups.push({
        key: "AE_BEHAVIOR_GROUP_ANALOG_LED",
        label: this.translationService.translate(
          "AE_BEHAVIOR_GROUP_ANALOG_LED",
        ),
        actions: analogLedActions,
      });
    }

    return groups;
  }

  private buildAnalogInputGroups(numLanes: number): PinGroup[] {
    const groups: PinGroup[] = [];

    // Voltages
    const voltageActions: PinAction[] = [];
    for (let i = 0; i < numLanes; i++) {
      voltageActions.push({
        label: this.translationService.translate("AE_PIN_VOLTAGE_LANE", {
          lane: i + 1,
        }),
        value: `voltage_${i}`,
      });
    }
    groups.push({
      key: "AE_BEHAVIOR_GROUP_VOLTAGE",
      label: this.translationService.translate("AE_BEHAVIOR_GROUP_VOLTAGE"),
      actions: voltageActions,
    });

    return groups;
  }

  getPinBehaviorVal(type: "in" | "out" | "analog", channel: number): number {
    const c = this.config();
    if (!c) return PinBehavior.BEHAVIOR_UNUSED;
    if (type === "in") {
      return c.digitalInIds && c.digitalInIds[channel] != null
        ? c.digitalInIds[channel]
        : PinBehavior.BEHAVIOR_UNUSED;
    } else if (type === "out") {
      return c.digitalOutIds && c.digitalOutIds[channel] != null
        ? c.digitalOutIds[channel]
        : PinBehavior.BEHAVIOR_UNUSED;
    } else {
      return c.analogIds && c.analogIds[channel] != null
        ? c.analogIds[channel]
        : PinBehavior.BEHAVIOR_UNUSED;
    }
  }

  getPinAction(type: "in" | "out" | "analog", channel: number): string {
    const val = this.getPinBehaviorVal(type, channel);
    if (val === PinBehavior.BEHAVIOR_UNUSED || val === -1) return "";
    if (val === PinBehavior.BEHAVIOR_CALL_BUTTON) return "master_call";
    if (val === PinBehavior.BEHAVIOR_RELAY) return "master_relay";

    if (
      val >= PinBehavior.BEHAVIOR_LAP_BASE &&
      val < PinBehavior.BEHAVIOR_SEGMENT_BASE
    )
      return `lap_${val - PinBehavior.BEHAVIOR_LAP_BASE}`;

    if (
      val >= PinBehavior.BEHAVIOR_SEGMENT_BASE &&
      val < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE
    )
      return `segment_${val - PinBehavior.BEHAVIOR_SEGMENT_BASE}`;

    if (
      val >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE &&
      val < PinBehavior.BEHAVIOR_RELAY_BASE
    )
      return `call_${val - PinBehavior.BEHAVIOR_CALL_BUTTON_BASE}`;

    if (
      val >= PinBehavior.BEHAVIOR_RELAY_BASE &&
      val < PinBehavior.BEHAVIOR_RELAY_BASE + 1000
    )
      return `relay_${val - PinBehavior.BEHAVIOR_RELAY_BASE}`;

    if (
      val >= PinBehavior.BEHAVIOR_PIT_IN_BASE &&
      val < PinBehavior.BEHAVIOR_PIT_OUT_BASE
    )
      return `pitin_${val - PinBehavior.BEHAVIOR_PIT_IN_BASE}`;

    if (
      val >= PinBehavior.BEHAVIOR_PIT_OUT_BASE &&
      val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE
    )
      return `pitout_${val - PinBehavior.BEHAVIOR_PIT_OUT_BASE}`;

    if (
      val >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE &&
      val < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + 1000
    )
      return `pitinout_${val - PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE}`;

    if (
      val >= PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
      val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
    )
      return `voltage_${val - PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE}`;

    if (val === (PinBehavior as any).BEHAVIOR_ANALOG_LED_GREEN_FLAG)
      return "analogled_green";
    if (val === (PinBehavior as any).BEHAVIOR_ANALOG_LED_YELLOW_FLAG)
      return "analogled_yellow";
    for (let i = 1; i <= 5; i++) {
      if (val === (PinBehavior as any)[`BEHAVIOR_ANALOG_LED_COUNTDOWN_${i}`]) {
        return `analogled_countdown_${i}`;
      }
    }

    return "";
  }

  getCurrentActionLabel(
    type: "in" | "out" | "analog",
    channel: number,
  ): string {
    const actionVal = this.getPinAction(type, channel);
    if (!actionVal) {
      return this.translationService.translate("AE_PIN_UNUSED");
    }
    const groups = this.getFilteredActions(type, channel);
    for (const g of groups) {
      for (const a of g.actions) {
        if (a.value === actionVal) {
          return a.label;
        }
      }
    }
    return this.translationService.translate("AE_PIN_UNUSED");
  }

  selectPinAction(
    type: "in" | "out" | "analog",
    channel: number,
    action: string,
  ) {
    let val = PinBehavior.BEHAVIOR_UNUSED;
    if (action === "master_call") {
      val = PinBehavior.BEHAVIOR_CALL_BUTTON;
    } else if (action === "master_relay") {
      val = PinBehavior.BEHAVIOR_RELAY;
    } else if (action.startsWith("lap_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = PinBehavior.BEHAVIOR_LAP_BASE + laneIndex;
    } else if (action.startsWith("segment_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = PinBehavior.BEHAVIOR_SEGMENT_BASE + laneIndex;
    } else if (action.startsWith("call_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + laneIndex;
    } else if (action.startsWith("relay_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = PinBehavior.BEHAVIOR_RELAY_BASE + laneIndex;
    } else if (action.startsWith("voltage_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + laneIndex;
    } else if (action.startsWith("pitin_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = PinBehavior.BEHAVIOR_PIT_IN_BASE + laneIndex;
    } else if (action.startsWith("pitout_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = PinBehavior.BEHAVIOR_PIT_OUT_BASE + laneIndex;
    } else if (action.startsWith("pitinout_")) {
      const laneIndex = parseInt(action.split("_")[1], 10);
      val = PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + laneIndex;
    } else if (action === "analogled_green") {
      val = (PinBehavior as any).BEHAVIOR_ANALOG_LED_GREEN_FLAG;
    } else if (action === "analogled_yellow") {
      val = (PinBehavior as any).BEHAVIOR_ANALOG_LED_YELLOW_FLAG;
    } else if (action.startsWith("analogled_countdown_")) {
      const index = parseInt(action.split("_")[2], 10);
      val = (PinBehavior as any)[`BEHAVIOR_ANALOG_LED_COUNTDOWN_${index}`];
    }

    const c = this.config();
    if (c) {
      let targetArray: number[];
      if (type === "in") {
        c.digitalInIds = c.digitalInIds || [];
        targetArray = c.digitalInIds;
      } else if (type === "out") {
        c.digitalOutIds = c.digitalOutIds || [];
        targetArray = c.digitalOutIds;
      } else {
        c.analogIds = c.analogIds || [];
        targetArray = c.analogIds;
      }

      while (targetArray.length <= channel) {
        targetArray.push(PinBehavior.BEHAVIOR_UNUSED);
      }
      targetArray[channel] = val;
    }

    this.openPinDropdown = null;
    this.onConfigChange();
  }

  @HostListener("document:click")
  onDocumentClick() {
    this.openPinDropdown = null;
  }

  togglePinDropdown(dropdownId: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.openPinDropdown === dropdownId) {
      this.openPinDropdown = null;
    } else {
      this.openPinDropdown = dropdownId;
      const target = event.currentTarget as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        this.dropdownOpenUp[dropdownId] = spaceBelow < 250;
      }
    }
  }

  isPinDropdownOpen(dropdownId: string): boolean {
    return this.openPinDropdown === dropdownId;
  }

  toggleGroupCollapse(groupKey: string, event: MouseEvent) {
    event.stopPropagation();
    this.groupsCollapsed[groupKey] = !this.groupsCollapsed[groupKey];
  }

  isGroupCollapsed(groupKey: string): boolean {
    return !!this.groupsCollapsed[groupKey];
  }

  isPinActive(type: "in" | "out" | "analog", pin: number): boolean {
    const key = `${type}-${pin}`;
    if (this.pinState[key] !== undefined) {
      return this.pinState[key];
    }
    return !!this.pinActivity[key];
  }

  togglePinState(type: "in" | "out" | "analog", pin: number) {
    if (type !== "out") return;
    const behavior = this.getPinBehaviorVal(type, pin);
    const isOutput =
      behavior === PinBehavior.BEHAVIOR_RELAY ||
      (behavior >= PinBehavior.BEHAVIOR_RELAY_BASE &&
        behavior < PinBehavior.BEHAVIOR_RELAY_BASE + 1000) ||
      behavior === PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG ||
      behavior === PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG ||
      (behavior >= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1 &&
        behavior <= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_5);

    if (isOutput) {
      const key = `${type}-${pin}`;
      const currentState = !!this.pinState[key];
      const newState = !currentState;

      this.pinState[key] = newState;
      this.dataService
        .setInterfacePinState(pin, true, newState, this.interfaceIndex())
        .subscribe({
          next: (response) => {
            if (!response.success) {
              this.logger.warn("Failed to set pin state", response.message);
              this.pinState[key] = currentState;
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            this.logger.error("Error setting pin state", err);
            this.pinState[key] = currentState;
            this.cdr.detectChanges();
          },
        });
    }
  }
}
