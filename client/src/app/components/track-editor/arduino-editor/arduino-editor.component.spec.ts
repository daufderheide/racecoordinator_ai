import { NO_ERRORS_SCHEMA } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of, Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { Lane } from "@app/models/lane";
import {
  ArduinoConfig,
  MAX_ANALOG_PINS,
  MAX_DIGITAL_PINS,
} from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior, RgbLedBehavior } from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { ArduinoEditorComponent } from "./arduino-editor.component";

// BEHAVIOR_VOLTAGE_LEVEL_BASE = 7000
const VOLTAGE_BASE = 7000;

class MockDataService {
  interfaceEvents$ = new Subject<any>();

  getSerialPorts() {
    return of(["COM1", "COM2"]);
  }
  getInterfaceEvents() {
    return this.interfaceEvents$.asObservable();
  }
  initializeInterface(_config: any, _lanes: number) {
    return of({ success: true });
  }
  updateInterfaceConfig(_config: any, _interfaceIndex: number) {
    return of({ success: true });
  }
  closeInterface() {
    return of({ success: true });
  }
  setInterfacePinState(
    _pin: number,
    _isDigital: boolean,
    _state: boolean,
    _interfaceIndex: number,
  ) {
    return of({ success: true });
  }
  setInterfaceRgbLedState(
    _stringIndex: number,
    _leds: any[],
    _interfaceIndex: number,
  ) {
    return of({ success: true });
  }
}

describe("ArduinoEditorComponent", () => {
  let component: ArduinoEditorComponent;
  let fixture: ComponentFixture<ArduinoEditorComponent>;
  let translationService: TranslationServiceMock;
  let mockDataService: MockDataService;

  function makeConfig(analogIds?: number[]): ArduinoConfig {
    return {
      name: "Test Arduino",
      commPort: "COM1",
      baudRate: 115200,
      debounceUs: 1000,
      hardwareType: 0,
      digitalIds: new Array(MAX_DIGITAL_PINS).fill(PinBehavior.BEHAVIOR_UNUSED),
      analogIds:
        analogIds ??
        new Array(MAX_ANALOG_PINS).fill(PinBehavior.BEHAVIOR_UNUSED),
      normallyClosedLaneSensors: false,
      normallyClosedRelays: true,
      globalInvertLights: 0,
      useLapsForPits: 0,
      useLapsForPitEnd: 0,
      usePitsAsLaps: false,
      useLapsForSegments: true,
      ledStrings: [],
      voltageConfigs: {},
      lapPinPitBehavior: 3,
    };
  }

  beforeEach(async () => {
    translationService = new TranslationServiceMock();
    mockDataService = new MockDataService();

    await TestBed.configureTestingModule({
      imports: [FormsModule, ArduinoEditorComponent, TranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TranslationService, useValue: translationService },
        { provide: DataService, useValue: mockDataService },
        {
          provide: LoggerService,
          useValue: jasmine.createSpyObj("LoggerService", [
            "debug",
            "info",
            "warn",
            "error",
            ,
            "log",
          ]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArduinoEditorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("config", makeConfig());
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
    ]);

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // --- Existing Tests ---

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize with config", () => {
    expect(component.config()!.name).toBe("Test Arduino");
    expect(component.lanes().length).toBe(2);
  });

  it("should fetch serial ports on init", () => {
    expect(component.availablePorts).toEqual(["COM1", "COM2"]);
  });

  it("should periodically poll for serial ports", fakeAsync(() => {
    // Re-create component to capture ngOnInit with spy
    fixture = TestBed.createComponent(ArduinoEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("config", makeConfig());
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
    ]);

    spyOn(component, "fetchPorts").and.callThrough();
    fixture.detectChanges(); // triggers ngOnInit

    expect(component.fetchPorts).toHaveBeenCalledTimes(1);

    tick(5000);
    expect(component.fetchPorts).toHaveBeenCalledTimes(2);

    tick(5000);
    expect(component.fetchPorts).toHaveBeenCalledTimes(3);

    component.ngOnDestroy();
    flush();
  }));

  it("should update config when inputs change", () => {
    spyOn(component.configChange, "emit");
    component.updateArduinoConfig();
    expect(component.configChange.emit).toHaveBeenCalled();
  });

  it("should include Voltage Level Lane 1 only in analog actions", () => {
    const voltageAction = component.analogPinActions
      .flatMap((g) => g.actions)
      .find((a) => a.value === "voltage_0");
    expect(voltageAction).toBeTruthy();
    expect(voltageAction!.label).toBe("AE_PIN_VOLTAGE_LANE");

    const digitalVoltageAction = component.digitalPinActions
      .flatMap((g) => g.actions)
      .find((a) => a.value === "voltage_0");
    expect(digitalVoltageAction).toBeUndefined();
  });

  it("should regenerate actions when lanes change", () => {
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
      new Lane("l3", "#fff", "#0000ff", 10),
    ]);
    fixture.detectChanges();

    const allAnalogActions = component.analogPinActions.flatMap(
      (g) => g.actions,
    );
    const voltage0 = allAnalogActions.find((a) => a.value === "voltage_0");
    const voltage1 = allAnalogActions.find((a) => a.value === "voltage_1");
    const voltage2 = allAnalogActions.find((a) => a.value === "voltage_2");

    expect(voltage0).toBeTruthy();
    expect(voltage1).toBeTruthy();
    expect(voltage2).toBeTruthy();
  });

  it("should update ledBehaviors when lanes change", () => {
    // Initial lanes: 2
    expect(component.lanes().length).toBe(2);

    const heatLeaderLanes = component.ledBehaviors
      .flatMap((g) => g.actions)
      .filter((b) => b.label.includes("AE_LED_BEHAVIOR_HEAT_LEADER_LANE"));
    expect(heatLeaderLanes.length).toBe(2);

    // Change lanes to 4
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
      new Lane("l3", "#fff", "#0000ff", 10),
      new Lane("l4", "#fff", "#ffff00", 10),
    ]);
    fixture.detectChanges();

    const updatedHeatLeaderLanes = component.ledBehaviors
      .flatMap((g) => g.actions)
      .filter((b) => b.label.includes("AE_LED_BEHAVIOR_HEAT_LEADER_LANE"));
    expect(updatedHeatLeaderLanes.length).toBe(4);
  });

  it("should update ledLaneColorOverrides for existing ledStrings when lanes change", () => {
    // Add an LED string
    const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
    component.setPinBehavior(true, 5, rgbBehavior.toString());
    const ls = component.config()!.ledStrings[0];
    expect(ls.ledLaneColorOverrides.length).toBe(2);

    // Change lanes to 4
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
      new Lane("l3", "#fff", "#0000ff", 10),
      new Lane("l4", "#fff", "#ffff00", 10),
    ]);
    fixture.detectChanges();

    expect(ls.ledLaneColorOverrides.length).toBe(4);
    expect(ls.ledLaneColorOverrides[2]).toBe("#0000ff");
    expect(ls.ledLaneColorOverrides[3]).toBe("#ffff00");
  });

  it("should heal empty color overrides when lanes change", () => {
    const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
    component.setPinBehavior(true, 5, rgbBehavior.toString());
    const ls = component.config()!.ledStrings[0];

    // Manually mess up one entry
    ls.ledLaneColorOverrides[1] = "";

    // Trigger refresh by re-assigning lanes
    fixture.componentRef.setInput("lanes", [...component.lanes()]);
    fixture.detectChanges();

    expect(ls.ledLaneColorOverrides[1]).toBe("#00ff00"); // Healed to L2 track color
  });

  it("should remove color overrides when lanes are removed", () => {
    const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
    component.setPinBehavior(true, 5, rgbBehavior.toString());
    const ls = component.config()!.ledStrings[0];
    expect(ls.ledLaneColorOverrides.length).toBe(2);

    // Remove one lane
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
    ]);
    fixture.detectChanges();

    expect(ls.ledLaneColorOverrides.length).toBe(1);
  });

  it("should reset lane-based LED behaviors to unused when exceeding lane count", () => {
    const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
    component.setPinBehavior(true, 5, rgbBehavior.toString());
    const ls = component.config()!.ledStrings[0];

    // Map LED 0 to Lane 6 behavior (5000 + 5)
    ls.leds[0] = RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE + 5;

    // Trigger refresh with only 2 lanes
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
    ]);
    fixture.detectChanges();

    // Behavior 5005 should be reset to UNUSED because lane 5 doesn't exist
    expect(ls.leds[0]).toBe(RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED);
  });

  it("should find lanes with voltage pins", () => {
    component.config()!.analogIds[1] = VOLTAGE_BASE; // Lane 0
    component.config()!.analogIds[2] = VOLTAGE_BASE + 1; // Lane 1
    fixture.detectChanges();
    const lanes = component.getVoltageLanes();
    expect(lanes).toContain(0);
    expect(lanes).toContain(1);
    expect(lanes.length).toBe(2);
  });

  // --- Voltage Max Value Tests ---

  it("should update voltage max value", () => {
    spyOn(component, "updateArduinoConfig");
    component.setVoltageMax(0, "512");
    expect(component.getVoltageMax(0)).toBe(512);
    expect(component.updateArduinoConfig).toHaveBeenCalled();
  });

  it("should return 1023 as default max when no config set", () => {
    expect(component.getVoltageMax(0)).toBe(1023);
  });

  // --- Live Voltage Tests ---

  it("should store live voltage when analogData event received", () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Analog pin 0 => Lane 0
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.detectChanges();

    mockDataService.interfaceEvents$.next({
      analogData: { pin: 0, value: 512, interfaceIndex: 0 },
    });

    expect(component.liveVoltages[0]).toBe(512);
  });

  it("should return correct live voltage for a lane via getLiveVoltageForLane", () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[2] = VOLTAGE_BASE + 1; // Analog pin 2 => Lane 1
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.detectChanges();

    component.liveVoltages[2] = 800;

    expect(component.getLiveVoltageForLane(1)).toBe(800);
    expect(component.getLiveVoltageForLane(0)).toBe(0); // Lane 0 has no pin assigned
  });

  it("should return 0 for live voltage when no pin assigned to lane", () => {
    fixture.componentRef.setInput("config", makeConfig());
    expect(component.getLiveVoltageForLane(0)).toBe(0);
  });

  it("should correctly map live voltage to the right lane when multiple pins assigned", () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Analog pin 0 => Lane 0
    analogIds[3] = VOLTAGE_BASE + 1; // Analog pin 3 => Lane 1
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.detectChanges();

    component.liveVoltages[0] = 300;
    component.liveVoltages[3] = 750;

    expect(component.getLiveVoltageForLane(0)).toBe(300);
    expect(component.getLiveVoltageForLane(1)).toBe(750);
  });

  // --- Max Seen Tests ---

  it("should track max voltage seen per lane", () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Analog pin 0 => Lane 0
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.detectChanges();

    mockDataService.interfaceEvents$.next({
      analogData: { pin: 0, value: 400, interfaceIndex: 0 },
    });
    mockDataService.interfaceEvents$.next({
      analogData: { pin: 0, value: 700, interfaceIndex: 0 },
    });
    mockDataService.interfaceEvents$.next({
      analogData: { pin: 0, value: 550, interfaceIndex: 0 },
    });

    expect(component.maxVoltagesSeen[0]).toBe(700);
  });

  it("should not update max if new value is lower", () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE;
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.detectChanges();

    mockDataService.interfaceEvents$.next({
      analogData: { pin: 0, value: 900, interfaceIndex: 0 },
    });
    mockDataService.interfaceEvents$.next({
      analogData: { pin: 0, value: 200, interfaceIndex: 0 },
    });

    expect(component.maxVoltagesSeen[0]).toBe(900);
  });

  it("should apply max seen to only one lane when not linked", () => {
    spyOn(component, "updateArduinoConfig");
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Lane 0
    analogIds[1] = VOLTAGE_BASE + 1; // Lane 1
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
    ]);
    component.isVoltageLinked = false;
    fixture.detectChanges();

    component.maxVoltagesSeen[0] = 900;
    component.maxVoltagesSeen[1] = 750;

    component.setMaxToSeen(0);

    expect(component.getVoltageMax(0)).toBe(900);
    expect(component.getVoltageMax(1)).toBe(1023); // Untouched default
  });

  it("should reset max voltages seen for all lanes", () => {
    component.maxVoltagesSeen[0] = 500;
    component.maxVoltagesSeen[1] = 800;

    component.resetMaxSeenAll();

    expect(Object.keys(component.maxVoltagesSeen).length).toBe(0);
  });

  // --- Lane Linking Tests ---

  it("should be unlinked by default", () => {
    expect(component.isVoltageLinked).toBeFalse();
  });

  it("should apply voltage to all lanes when linked", () => {
    spyOn(component, "updateArduinoConfig");
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Lane 0
    analogIds[1] = VOLTAGE_BASE + 1; // Lane 1
    analogIds[2] = VOLTAGE_BASE + 2; // Lane 2
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
      new Lane("l3", "#fff", "#0000ff", 10),
    ]);
    component.isVoltageLinked = true;
    fixture.detectChanges();

    component.setVoltageMax(0, "600");

    expect(component.getVoltageMax(0)).toBe(600);
    expect(component.getVoltageMax(1)).toBe(600);
    expect(component.getVoltageMax(2)).toBe(600);
  });

  it("should only apply voltage to one lane when not linked", () => {
    spyOn(component, "updateArduinoConfig");
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Lane 0
    analogIds[1] = VOLTAGE_BASE + 1; // Lane 1
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
    ]);
    component.isVoltageLinked = false;
    fixture.detectChanges();

    component.setVoltageMax(0, "600");

    expect(component.getVoltageMax(0)).toBe(600);
    expect(component.getVoltageMax(1)).toBe(1023); // Default untouched
  });

  it("should apply global max seen across all lanes when linked", () => {
    spyOn(component, "updateArduinoConfig");
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Lane 0
    analogIds[1] = VOLTAGE_BASE + 1; // Lane 1
    fixture.componentRef.setInput("config", makeConfig(analogIds));
    fixture.componentRef.setInput("lanes", [
      new Lane("l1", "#fff", "#ff0000", 10),
      new Lane("l2", "#fff", "#00ff00", 10),
    ]);
    component.isVoltageLinked = true;
    fixture.detectChanges();

    component.maxVoltagesSeen[0] = 700;
    component.maxVoltagesSeen[1] = 950; // Lane 1 has higher value

    component.setMaxToSeen(0); // Trigger from lane 0; linked = use global max

    // All lanes should get the highest global max (950)
    expect(component.getVoltageMax(0)).toBe(950);
    expect(component.getVoltageMax(1)).toBe(950);
  });

  it("should clear out-of-range pins when switching from Mega to Uno", () => {
    // 1. Setup as Mega (1) with high pin assignments
    component.config()!.hardwareType = 1;
    component.config()!.digitalIds[10] = 1000; // D10 (within Uno range)
    component.config()!.digitalIds[50] = 1001; // D50 (outside Uno range)
    component.config()!.analogIds[2] = VOLTAGE_BASE; // A2 (within Uno range)
    component.config()!.analogIds[10] = VOLTAGE_BASE + 1; // A10 (outside Uno range)

    // 2. Switch to Uno (0)
    component.onHardwareTypeChange(0);

    // 3. Verify
    expect(component.config()!.hardwareType).toBe(0);
    expect(component.config()!.digitalIds[10]).toBe(1000); // Should remain
    expect(component.config()!.digitalIds[50]).toBe(0); // Should be BEHAVIOR_UNUSED (0)
    expect(component.config()!.analogIds[2]).toBe(7000); // Should remain
    expect(component.config()!.analogIds[10]).toBe(0); // Should be BEHAVIOR_UNUSED (0)
  });

  describe("Link State Persistence", () => {
    function setupComponentWithIndex(idx: number) {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("config", makeConfig());
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
      ]);
      fixture.componentRef.setInput("index", idx);
    }

    beforeEach(() => {
      localStorage.clear();
    });

    it("should load isVoltageLinked from localStorage on init", () => {
      localStorage.setItem(`rc.arduino-editor.voltage-linked.0`, "true");
      setupComponentWithIndex(0);
      component.isVoltageLinked = false; // Set to different value to verify overwrite

      fixture.detectChanges(); // calls ngOnInit

      expect(component.isVoltageLinked).toBeTrue();
    });

    it("should load isLedStringsLinked from localStorage on init", () => {
      localStorage.setItem(`rc.arduino-editor.led-strings-linked.0`, "false");
      setupComponentWithIndex(0);
      component.isLedStringsLinked = true; // Set to different value to verify overwrite

      fixture.detectChanges(); // calls ngOnInit

      expect(component.isLedStringsLinked).toBeFalse();
    });

    it("should save isVoltageLinked to localStorage when toggled", () => {
      setupComponentWithIndex(0);
      fixture.detectChanges();
      component.isVoltageLinked = false;

      component.toggleVoltageLink();

      expect(component.isVoltageLinked).toBeTrue();
      expect(localStorage.getItem(`rc.arduino-editor.voltage-linked.0`)).toBe(
        "true",
      );
    });

    it("should save isLedStringsLinked to localStorage when toggled", () => {
      setupComponentWithIndex(0);
      fixture.detectChanges();
      component.isLedStringsLinked = true;

      component.toggleLedStringsLink();

      expect(component.isLedStringsLinked).toBeFalse();
      expect(
        localStorage.getItem(`rc.arduino-editor.led-strings-linked.0`),
      ).toBe("false");
    });

    it("should maintain independent link states for multiple components", () => {
      localStorage.setItem(`rc.arduino-editor.voltage-linked.0`, "true");
      localStorage.setItem(`rc.arduino-editor.voltage-linked.1`, "false");

      setupComponentWithIndex(1);
      fixture.detectChanges();

      expect(component.isVoltageLinked).toBeFalse();
    });
  });

  describe("LED String Lifecycle Management", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("config", makeConfig());
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
      ]);
      fixture.detectChanges();
    });

    it("should add a new LedString when a pin is assigned BEHAVIOR_LED_RGB_STRING", () => {
      const pinIndex = 5;
      const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
      const _unusedBehavior = PinBehavior.BEHAVIOR_UNUSED;

      expect(component.config()!.ledStrings.length).toBe(0);

      component.setPinBehavior(true, pinIndex, rgbBehavior.toString());

      expect(component.config()!.ledStrings.length).toBe(1);
      expect(component.config()!.ledStrings[0].pin).toBe(5); // D5
    });

    it("should remove the LedString when a pin is unassigned from BEHAVIOR_LED_RGB_STRING", () => {
      const pinIndex = 5;
      const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
      const unusedBehavior = PinBehavior.BEHAVIOR_UNUSED;

      // 1. Add it
      component.setPinBehavior(true, pinIndex, rgbBehavior.toString());
      expect(component.config()!.ledStrings.length).toBe(1);

      // 2. Remove it
      component.setPinBehavior(true, pinIndex, unusedBehavior.toString());
      expect(component.config()!.ledStrings.length).toBe(0);
    });

    it("should remove only the specific LedString matching the pin", () => {
      const pinIndex5 = 5;
      const pinIndex6 = 6;
      const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
      const unusedBehavior = PinBehavior.BEHAVIOR_UNUSED;

      component.setPinBehavior(true, pinIndex5, rgbBehavior.toString());
      component.setPinBehavior(true, pinIndex6, rgbBehavior.toString());
      expect(component.config()!.ledStrings.length).toBe(2);

      // Remove pin 5
      component.setPinBehavior(true, pinIndex5, unusedBehavior.toString());

      expect(component.config()!.ledStrings.length).toBe(1);
      expect(component.config()!.ledStrings[0].pin).toBe(6);
    });

    it("should reset lane-based LED behaviors to unused when a lane is deleted", () => {
      // Setup 4 lanes
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
        new Lane("l2", "#fff", "#00ff00", 10),
        new Lane("l3", "#fff", "#0000ff", 10),
        new Lane("l4", "#fff", "#ffff00", 10),
      ]);
      fixture.detectChanges();

      // Add an LED string with behavior for Lane 4 (index 3)
      const pinIndex = 5;
      const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
      component.setPinBehavior(true, pinIndex, rgbBehavior.toString());
      const ls = component.config()!.ledStrings[0];

      // Set first LED to Heat Leader Lane 4
      const heatLeaderBase = RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE;
      ls.leds[0] = heatLeaderBase + 3;

      // Set second LED to Fuel Level Lane 4
      const fuelLevelBase = RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE;
      ls.leds[1] = fuelLevelBase + 3;

      // Delete lane 4 (now only 3 lanes)
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
        new Lane("l2", "#fff", "#00ff00", 10),
        new Lane("l3", "#fff", "#0000ff", 10),
      ]);
      fixture.detectChanges();

      // Verify behaviors are reset to UNUSED
      expect(ls.leds[0]).toBe(RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED);
      expect(ls.leds[1]).toBe(RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED);
    });
  });

  describe("LED String Linking Logic", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("config", makeConfig());
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
        new Lane("l2", "#fff", "#00ff00", 10),
      ]);

      // Add two strings
      const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
      const _unused = PinBehavior.BEHAVIOR_UNUSED;
      component.setPinBehavior(true, 5, rgbBehavior.toString());
      component.setPinBehavior(true, 6, rgbBehavior.toString());

      fixture.detectChanges();
    });

    it("should sync brightness across all strings when linked", () => {
      component.isLedStringsLinked = true;

      component.onLedStringBrightnessChange(0, 128);

      expect(component.config()!.ledStrings[0].brightness).toBe(128);
      expect(component.config()!.ledStrings[1].brightness).toBe(128);
    });

    it("should NOT sync brightness when unlinked", () => {
      component.isLedStringsLinked = false;

      component.onLedStringBrightnessChange(0, 128);

      expect(component.config()!.ledStrings[0].brightness).toBe(128);
      expect(component.config()!.ledStrings[1].brightness).not.toBe(128);
    });

    it("should sync update rate across all strings when linked", () => {
      component.isLedStringsLinked = true;

      component.onLedStringFlashRateChange(0, 60);

      expect(component.config()!.ledStrings[0].flagFlashRate).toBe(60);
      expect(component.config()!.ledStrings[1].flagFlashRate).toBe(60);
    });

    it("should sync color overrides across all strings when linked", () => {
      component.isLedStringsLinked = true;

      component.onLedStringLaneColorChange(0, 1, "#0000ff"); // String 0, Lane 1 (index 1)

      expect(component.config()!.ledStrings[0].ledLaneColorOverrides[1]).toBe(
        "#0000ff",
      );
      expect(component.config()!.ledStrings[1].ledLaneColorOverrides[1]).toBe(
        "#0000ff",
      );
    });

    it("should NOT sync color overrides when unlinked", () => {
      component.isLedStringsLinked = false;

      component.onLedStringLaneColorChange(0, 1, "#0000ff");

      expect(component.config()!.ledStrings[0].ledLaneColorOverrides[1]).toBe(
        "#0000ff",
      );
      expect(
        component.config()!.ledStrings[1].ledLaneColorOverrides[1],
      ).not.toBe("#0000ff");
    });

    it("should sync color order across all strings when linked", () => {
      component.isLedStringsLinked = true;

      component.onLedStringColorOrderChange(0, 1); // GRB

      expect(component.config()!.ledStrings[0].colorOrder).toBe(1);
      expect(component.config()!.ledStrings[1].colorOrder).toBe(1);
    });

    it("should NOT sync color order when unlinked", () => {
      component.isLedStringsLinked = false;

      component.onLedStringColorOrderChange(0, 2); // BGR

      expect(component.config()!.ledStrings[0].colorOrder).toBe(2);
      expect(component.config()!.ledStrings[1].colorOrder).not.toBe(2);
    });
  });

  describe("Real-time Pin Status", () => {
    it("should update pinActivity when digitalPin event received (Normally Open)", () => {
      component.config()!.normallyClosedLaneSensors = false;
      fixture.detectChanges();

      // Trip D2 (State 0)
      mockDataService.interfaceEvents$.next({
        digitalPin: { pin: 2, state: 0, isDigital: true, interfaceIndex: 0 },
      });
      expect(component.isPinActive(true, 2)).toBeTrue();

      // Release D2 (State 1)
      mockDataService.interfaceEvents$.next({
        digitalPin: { pin: 2, state: 1, isDigital: true, interfaceIndex: 0 },
      });
      expect(component.isPinActive(true, 2)).toBeFalse();
    });

    it("should update pinActivity when digitalPin event received (Normally Closed)", () => {
      component.config()!.normallyClosedLaneSensors = true;
      fixture.detectChanges();

      // Trip D2 (State 1)
      mockDataService.interfaceEvents$.next({
        digitalPin: { pin: 2, state: 1, isDigital: true, interfaceIndex: 0 },
      });
      expect(component.isPinActive(true, 2)).toBeTrue();

      // Release D2 (State 0)
      mockDataService.interfaceEvents$.next({
        digitalPin: { pin: 2, state: 0, isDigital: true, interfaceIndex: 0 },
      });
      expect(component.isPinActive(true, 2)).toBeFalse();
    });

    it("should update pinActivity for analog pins in digital mode", () => {
      component.config()!.normallyClosedLaneSensors = false;
      fixture.detectChanges();

      // Trip A3 (State 0)
      mockDataService.interfaceEvents$.next({
        digitalPin: { pin: 3, state: 0, isDigital: false, interfaceIndex: 0 },
      });
      expect(component.isPinActive(false, 3)).toBeTrue();

      // Release A3 (State 1)
      mockDataService.interfaceEvents$.next({
        digitalPin: { pin: 3, state: 1, isDigital: false, interfaceIndex: 0 },
      });
      expect(component.isPinActive(false, 3)).toBeFalse();
    });

    it("should clear pulse timer when real-time event is received", fakeAsync(() => {
      const key = "D2";
      // Simulate high-level event start (pulse)
      component["triggerPinActivity"](2); // interfaceId 2 is D2
      expect(component.isPinActive(true, 2)).toBeTrue();
      expect(component["pinActivityTimers"][key]).toBeTruthy();

      // Receive real-time event (release)
      mockDataService.interfaceEvents$.next({
        digitalPin: { pin: 2, state: 1, isDigital: true, interfaceIndex: 0 },
      });

      expect(component.isPinActive(true, 2)).toBeFalse();
      expect(component["pinActivityTimers"][key]).toBeUndefined();

      tick(1000);
      // Ensure timer didn't fire and turn it back on/off unexpectedly
      expect(component.isPinActive(true, 2)).toBeFalse();
    }));
  });

  describe("LED Hardware Constraints", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("config", makeConfig());
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
      ]);
      fixture.detectChanges();
    });

    it("should restrict Uno LED string pins to D2-D3 and A0-A5", () => {
      component.onHardwareTypeChange(0); // Uno
      fixture.detectChanges();

      // Digital 2 is valid
      const digitalActions = component
        .getFilteredActions(true, 2)
        .flatMap((g: any) => g.actions);
      expect(digitalActions.find((a) => a.value === "led_string")).toBeTruthy();

      // Digital 4 is invalid
      const digitalInvalid = component
        .getFilteredActions(true, 4)
        .flatMap((g: any) => g.actions);
      expect(digitalInvalid.find((a) => a.value === "led_string")).toBeFalsy();

      // Analog A5 is valid
      const analogValid = component
        .getFilteredActions(false, 5)
        .flatMap((g: any) => g.actions);
      expect(analogValid.find((a) => a.value === "led_string")).toBeTruthy();

      // Analog A6 is invalid
      const analogInvalid = component
        .getFilteredActions(false, 6)
        .flatMap((g: any) => g.actions);
      expect(analogInvalid.find((a) => a.value === "led_string")).toBeFalsy();
    });

    it("should use correct default values for a new LED string", () => {
      component.addLedString(10, 5); // Pin 5
      const ls = component.config()!.ledStrings[0];
      expect(ls.brightness).toBe(32);
      expect(ls.ledType).toBe(1); // WS2811
      expect(ls.colorOrder).toBe(0); // RGB
      expect(ls.flagFlashRate).toBe(2);
    });

    it("should restrict Mega LED string pins to even D22-D52 and even A0-A14", () => {
      component.onHardwareTypeChange(1); // Mega
      fixture.detectChanges();

      // Digital 22 is valid
      const digitalValid = component
        .getFilteredActions(true, 22)
        .flatMap((g: any) => g.actions);
      expect(digitalValid.find((a) => a.value === "led_string")).toBeTruthy();

      // Digital 23 is invalid
      const digitalInvalid1 = component
        .getFilteredActions(true, 23)
        .flatMap((g: any) => g.actions);
      expect(digitalInvalid1.find((a) => a.value === "led_string")).toBeFalsy();

      // Digital 54 is invalid
      const digitalInvalid2 = component
        .getFilteredActions(true, 54)
        .flatMap((g: any) => g.actions);
      expect(digitalInvalid2.find((a) => a.value === "led_string")).toBeFalsy();

      // Analog A14 is valid
      const analogValid = component
        .getFilteredActions(false, 14)
        .flatMap((g: any) => g.actions);
      expect(analogValid.find((a) => a.value === "led_string")).toBeTruthy();

      // Analog A13 is invalid
      const analogInvalid = component
        .getFilteredActions(false, 13)
        .flatMap((g: any) => g.actions);
      expect(analogInvalid.find((a) => a.value === "led_string")).toBeFalsy();
    });

    it("should limit Uno to 5 LED strings", () => {
      component.onHardwareTypeChange(0); // Uno
      fixture.detectChanges();

      for (let i = 0; i < 5; i++) {
        // use pin 0 to avoid collision
        component.addLedString(10, 0);
      }
      expect(component.config()!.ledStrings.length).toBe(5);

      // Try 6th
      component.addLedString(10, 0);
      expect(component.config()!.ledStrings.length).toBe(5); // Blocked
    });

    it("should limit Mega to 8 LED strings", () => {
      component.onHardwareTypeChange(1); // Mega
      fixture.detectChanges();

      for (let i = 0; i < 8; i++) {
        component.addLedString(10, 0);
      }
      expect(component.config()!.ledStrings.length).toBe(8);

      // Try 9th
      component.addLedString(10, 0);
      expect(component.config()!.ledStrings.length).toBe(8); // Blocked
    });

    it("should restrict LED types for Uno to WS2811, TM1809 and OTHER", () => {
      component.onHardwareTypeChange(0); // Uno
      fixture.detectChanges();

      expect(component.ledTypes.length).toBe(3);
      expect(component.ledTypes.map((t) => t.value)).toEqual(["1", "4", "12"]);
    });

    it("should default unsupported LED types to WS2811 when switching to Uno", () => {
      component.onHardwareTypeChange(1); // Start on Mega
      component.addLedString(10, 0); // String 1
      component.config()!.ledStrings[0].ledType = 3; // WS2812B (Not supported on Uno)

      component.addLedString(10, 0); // String 2
      component.config()!.ledStrings[1].ledType = 12; // OTHER (Supported on Uno)

      component.onHardwareTypeChange(0); // Switch to Uno

      // Unsupported WS2812B should become WS2811 (1)
      expect(component.config()!.ledStrings[0].ledType).toBe(1);
      // Supported OTHER should remain OTHER (12)
      expect(component.config()!.ledStrings[1].ledType).toBe(12);
    });

    it("should support 6 LED types for Mega", () => {
      component.onHardwareTypeChange(1); // Mega
      fixture.detectChanges();

      expect(component.ledTypes.length).toBe(6);
      expect(component.ledTypes.map((t) => t.value)).toEqual([
        "0",
        "1",
        "2",
        "3",
        "4",
        "12",
      ]);
    });
  });

  describe("Collapsible Groups and Dropdowns", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("config", makeConfig());
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
        new Lane("l2", "#fff", "#00ff00", 10),
      ]);
      fixture.detectChanges();
      localStorage.clear();
    });

    it("should generate a grouped action structure", () => {
      const digitalGroups = component.digitalPinActions;
      expect(digitalGroups.length).toBeGreaterThan(1);
      expect(digitalGroups[0].actions.length).toBeGreaterThan(0);
      expect(digitalGroups[0].key).toBe(""); // None group
    });

    it("should toggle pin dropdowns", () => {
      const pinKey = "digital-2";
      const event = new MouseEvent("click");
      spyOn(event, "stopPropagation");

      component.togglePinDropdown(pinKey, event);
      expect(component.isPinDropdownOpen(pinKey)).toBeTrue();
      expect(event.stopPropagation).toHaveBeenCalled();

      component.togglePinDropdown(pinKey, event);
      expect(component.isPinDropdownOpen(pinKey)).toBeFalse();
    });

    it("should close dropdowns on document click", () => {
      component.openPinDropdown = "digital-2";
      document.dispatchEvent(new MouseEvent("click"));
      expect(component.openPinDropdown).toBeNull();
    });

    it("should toggle group collapse and save to localStorage", () => {
      const groupKey = "AE_BEHAVIOR_GROUP_PIT";
      const event = new MouseEvent("click");
      spyOn(event, "stopPropagation");
      spyOn(component as any, "saveState").and.callThrough();

      // Default is collapsed (true)
      expect(component.isGroupCollapsed(groupKey)).toBeTrue();

      component.toggleGroupCollapse(groupKey, event);
      expect(component.isGroupCollapsed(groupKey)).toBeFalse();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect((component as any).saveState).toHaveBeenCalled();
      expect(
        localStorage.getItem(
          `rc.arduino-editor.groups-collapsed.${component.index()}`,
        ),
      ).toContain(`"${groupKey}":false`);
    });

    it("should return the correct label for current action", () => {
      component.setPinAction(true, 4, "master_call");
      expect(component.getCurrentActionLabel(true, 4)).toBe(
        "AE_PIN_MASTER_CALL",
      );

      component.setPinAction(true, 5, "reserved");
      expect(component.getCurrentActionLabel(true, 5)).toBe("AE_PIN_RESERVED");

      component.setPinAction(true, 6, "");
      expect(component.getCurrentActionLabel(true, 6)).toBe("AE_PIN_UNUSED");
    });

    it("should include the generic Heat Leader behavior in ledBehaviors", () => {
      const leaderGroup = component.ledBehaviors.find(
        (g) => g.key === "AE_LED_GROUP_LEADER",
      );
      expect(leaderGroup).toBeTruthy();
      const genericLeader = leaderGroup?.actions.find(
        (a) =>
          a.value === RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER.toString(),
      );
      expect(genericLeader).toBeTruthy();
      expect(genericLeader?.label).toBe("RGB_LED_BEHAVIOR_HEAT_LEADER");
    });

    it("should select a pin action and close the dropdown", () => {
      component.openPinDropdown = "digital-2";
      component.selectPinAction(true, 2, "master_call");

      expect(component.getPinAction(true, 2)).toBe("master_call");
      expect(component.openPinDropdown).toBeNull();
    });

    it("should sort groups and actions alphabetically, keeping None first", () => {
      const groups = component.digitalPinActions;

      // 1. None group must be first
      expect(groups[0].key).toBe("");

      // 2. Others should be sorted alphabetically
      const labels = groups.slice(1).map((g) => g.label);
      const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b));
      expect(labels).toEqual(sortedLabels);

      // 3. Actions within a group should be sorted (except None group)
      const callGroup = groups.find(
        (g) => g.key === "AE_BEHAVIOR_GROUP_CALLBUTTON",
      );
      expect(callGroup).toBeTruthy();
      const actionLabels = callGroup!.actions.map((a) => a.label);
      const sortedActionLabels = [...actionLabels].sort((a, b) =>
        a.localeCompare(b),
      );
      expect(actionLabels).toEqual(sortedActionLabels);
    });

    it("should keep Unused and Reserved in order in the None group", () => {
      const noneGroup = component.digitalPinActions.find((g) => g.key === "");
      expect(noneGroup).toBeTruthy();
      expect(noneGroup!.actions[0].value).toBe(""); // Unused
      expect(noneGroup!.actions[1].value).toBe("reserved"); // Reserved
    });
  });

  describe("LED Type and Color Order Defaults", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("config", makeConfig());
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
      ]);

      // Add a string
      const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
      component.setPinBehavior(true, 5, rgbBehavior.toString());
      fixture.detectChanges();
    });

    it("should default to RGB for WS2811", () => {
      component.onLedStringLedTypeChange(0, 1); // WS2811
      expect(component.config()!.ledStrings[0].colorOrder).toBe(0); // RGB
    });

    it("should default to GRB for WS2812", () => {
      component.onLedStringLedTypeChange(0, 2); // WS2812
      expect(component.config()!.ledStrings[0].colorOrder).toBe(1); // GRB
    });

    it("should default to GRB for WS2812B", () => {
      component.onLedStringLedTypeChange(0, 3); // WS2812B
      expect(component.config()!.ledStrings[0].colorOrder).toBe(1); // GRB
    });

    it("should default to RGB for TM1809", () => {
      component.onLedStringLedTypeChange(0, 4); // TM1809
      expect(component.config()!.ledStrings[0].colorOrder).toBe(0); // RGB
    });

    it("should default to RGB for Neopixel", () => {
      component.onLedStringLedTypeChange(0, 0); // Neopixel
      expect(component.config()!.ledStrings[0].colorOrder).toBe(0); // RGB
    });

    it("should sync color order across linked strings when type changes", () => {
      // Add second string
      const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
      component.setPinBehavior(true, 6, rgbBehavior.toString());
      component.isLedStringsLinked = true;
      fixture.detectChanges();

      component.onLedStringLedTypeChange(0, 2); // Change first string to WS2812

      expect(component.config()!.ledStrings[0].ledType).toBe(2);
      expect(component.config()!.ledStrings[0].colorOrder).toBe(1);
      expect(component.config()!.ledStrings[1].ledType).toBe(2);
      expect(component.config()!.ledStrings[1].colorOrder).toBe(1);
    });
  });

  describe("RGB LED Toggling and State Synchronization", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("config", makeConfig());
      fixture.componentRef.setInput("lanes", [
        new Lane("l1", "#fff", "#ff0000", 10),
      ]);

      // Add an LED string
      const rgbBehavior = (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
      component.setPinBehavior(true, 5, rgbBehavior.toString());
      fixture.detectChanges();
    });

    it("should cycle LED color states correctly (off -> red -> green -> blue -> off)", () => {
      spyOn(mockDataService, "setInterfaceRgbLedState").and.callThrough();

      const stringIndex = 0;
      const ledIndex = 0;

      // 1. Toggle to Red
      component.toggleRgbLed(stringIndex, ledIndex);
      expect(component.getRgbLedColor(stringIndex, ledIndex)).toBe("red");
      expect(component.getRgbLedColorHex(stringIndex, ledIndex)).toBe(
        "#ef4444",
      );
      expect(component.getRgbLedColorShadow(stringIndex, ledIndex)).toContain(
        "rgba(239, 68, 68",
      );
      expect(component.isRgbLedActive(stringIndex, ledIndex)).toBeTrue();
      expect(mockDataService.setInterfaceRgbLedState).toHaveBeenCalledWith(
        5,
        jasmine.arrayContaining([{ index: 0, r: 255, g: 0, b: 0 }]),
        0,
      );

      // 2. Toggle to Green
      component.toggleRgbLed(stringIndex, ledIndex);
      expect(component.getRgbLedColor(stringIndex, ledIndex)).toBe("green");
      expect(component.getRgbLedColorHex(stringIndex, ledIndex)).toBe(
        "#22c55e",
      );
      expect(component.getRgbLedColorShadow(stringIndex, ledIndex)).toContain(
        "rgba(34, 197, 94",
      );
      expect(component.isRgbLedActive(stringIndex, ledIndex)).toBeTrue();
      expect(mockDataService.setInterfaceRgbLedState).toHaveBeenCalledWith(
        5,
        jasmine.arrayContaining([{ index: 0, r: 0, g: 255, b: 0 }]),
        0,
      );

      // 3. Toggle to Blue
      component.toggleRgbLed(stringIndex, ledIndex);
      expect(component.getRgbLedColor(stringIndex, ledIndex)).toBe("blue");
      expect(component.getRgbLedColorHex(stringIndex, ledIndex)).toBe(
        "#3b82f6",
      );
      expect(component.getRgbLedColorShadow(stringIndex, ledIndex)).toContain(
        "rgba(59, 130, 246",
      );
      expect(component.isRgbLedActive(stringIndex, ledIndex)).toBeTrue();
      expect(mockDataService.setInterfaceRgbLedState).toHaveBeenCalledWith(
        5,
        jasmine.arrayContaining([{ index: 0, r: 0, g: 0, b: 255 }]),
        0,
      );

      // 4. Toggle back to Off
      component.toggleRgbLed(stringIndex, ledIndex);
      expect(component.getRgbLedColor(stringIndex, ledIndex)).toBe("off");
      expect(
        component.getRgbLedColorHex(stringIndex, ledIndex),
      ).toBeUndefined();
      expect(
        component.getRgbLedColorShadow(stringIndex, ledIndex),
      ).toBeUndefined();
      expect(component.isRgbLedActive(stringIndex, ledIndex)).toBeFalse();
      expect(mockDataService.setInterfaceRgbLedState).toHaveBeenCalledWith(
        5,
        jasmine.arrayContaining([{ index: 0, r: 0, g: 0, b: 0 }]),
        0,
      );
    });

    it("should clear active states when behavior is set to unused", () => {
      spyOn(component, "sendLedStringState");

      const stringIndex = 0;
      const ledIndex = 0;

      // Make it active (red) first
      component.toggleRgbLed(stringIndex, ledIndex);
      expect(component.getRgbLedColor(stringIndex, ledIndex)).toBe("red");

      // Change behavior to unused (0)
      component.updateLedBehavior(stringIndex, ledIndex, 0);

      // Verify active state cleared
      expect(component.getRgbLedColor(stringIndex, ledIndex)).toBe("off");
      expect(component.sendLedStringState).toHaveBeenCalledWith(stringIndex);
    });

    it("should automatically resend LED states after successful config updates", () => {
      spyOn(component, "sendLedStringState");
      spyOn(mockDataService, "updateInterfaceConfig").and.callThrough();

      component.updateArduinoConfig();

      expect(mockDataService.updateInterfaceConfig).toHaveBeenCalled();
      expect(component.sendLedStringState).toHaveBeenCalledWith(0);
    });
  });
});
