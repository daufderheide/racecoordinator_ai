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
import { DataService } from "src/app/data.service";
import { Lane } from "src/app/models/lane";
import {
  ArduinoConfig,
  MAX_ANALOG_PINS,
  MAX_DIGITAL_PINS,
} from "src/app/models/track";
import { TranslatePipe } from "src/app/pipes/translate.pipe";
import { com } from "src/app/proto/message";
import { TranslationService } from "src/app/services/translation.service";
import { TranslationServiceMock } from "src/app/testing/translation-service.mock";

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
  initializeInterface(config: any, lanes: number) {
    return of({ success: true });
  }
  updateInterfaceConfig(config: any, interfaceIndex: number) {
    return of({ success: true });
  }
  closeInterface() {
    return of({ success: true });
  }
  setInterfacePinState(
    pin: number,
    isDigital: boolean,
    state: boolean,
    interfaceIndex: number,
  ) {
    return of({ success: true });
  }
  setInterfaceRgbLedState(
    stringIndex: number,
    leds: any[],
    interfaceIndex: number,
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
      digitalIds: new Array(MAX_DIGITAL_PINS).fill(
        com.antigravity.PinBehavior.BEHAVIOR_UNUSED,
      ),
      analogIds:
        analogIds ??
        new Array(MAX_ANALOG_PINS).fill(
          com.antigravity.PinBehavior.BEHAVIOR_UNUSED,
        ),
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
      declarations: [ArduinoEditorComponent, TranslatePipe],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TranslationService, useValue: translationService },
        { provide: DataService, useValue: mockDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArduinoEditorComponent);
    component = fixture.componentInstance;

    component.config = makeConfig();
    component.lanes = [
      new Lane("l1", "#fff", "#000", 10),
      new Lane("l2", "#fff", "#000", 10),
    ];

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
    expect(component.config!.name).toBe("Test Arduino");
    expect(component.lanes.length).toBe(2);
  });

  it("should fetch serial ports on init", () => {
    expect(component.availablePorts).toEqual(["COM1", "COM2"]);
  });

  it("should periodically poll for serial ports", fakeAsync(() => {
    // Re-create component to capture ngOnInit with spy
    fixture = TestBed.createComponent(ArduinoEditorComponent);
    component = fixture.componentInstance;
    component.config = makeConfig();
    component.lanes = [new Lane("l1", "#fff", "#000", 10)];

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
    const voltageAction = component.analogPinActions.find(
      (a) => a.value === "voltage_0",
    );
    expect(voltageAction).toBeTruthy();
    expect(voltageAction!.label).toBe("AE_PIN_VOLTAGE_LANE");

    const digitalVoltageAction = component.digitalPinActions.find(
      (a) => a.value === "voltage_0",
    );
    expect(digitalVoltageAction).toBeUndefined();
  });

  it("should regenerate actions when lanes change", () => {
    component.lanes = [
      new Lane("l1", "#fff", "#000", 10),
      new Lane("l2", "#fff", "#000", 10),
      new Lane("l3", "#fff", "#000", 10),
    ];

    const voltage0 = component.analogPinActions.find(
      (a) => a.value === "voltage_0",
    );
    const voltage1 = component.analogPinActions.find(
      (a) => a.value === "voltage_1",
    );
    const voltage2 = component.analogPinActions.find(
      (a) => a.value === "voltage_2",
    );

    expect(voltage0).toBeTruthy();
    expect(voltage1).toBeTruthy();
    expect(voltage2).toBeTruthy();
  });

  it("should find lanes with voltage pins", () => {
    component.config!.analogIds[1] = VOLTAGE_BASE; // Lane 0
    component.config!.analogIds[2] = VOLTAGE_BASE + 1; // Lane 1
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
    component.config = makeConfig(analogIds);
    fixture.detectChanges();

    mockDataService.interfaceEvents$.next({
      analogData: { pin: 0, value: 512, interfaceIndex: 0 },
    });

    expect(component.liveVoltages[0]).toBe(512);
  });

  it("should return correct live voltage for a lane via getLiveVoltageForLane", () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[2] = VOLTAGE_BASE + 1; // Analog pin 2 => Lane 1
    component.config = makeConfig(analogIds);
    fixture.detectChanges();

    component.liveVoltages[2] = 800;

    expect(component.getLiveVoltageForLane(1)).toBe(800);
    expect(component.getLiveVoltageForLane(0)).toBe(0); // Lane 0 has no pin assigned
  });

  it("should return 0 for live voltage when no pin assigned to lane", () => {
    component.config = makeConfig();
    expect(component.getLiveVoltageForLane(0)).toBe(0);
  });

  it("should correctly map live voltage to the right lane when multiple pins assigned", () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Analog pin 0 => Lane 0
    analogIds[3] = VOLTAGE_BASE + 1; // Analog pin 3 => Lane 1
    component.config = makeConfig(analogIds);
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
    component.config = makeConfig(analogIds);
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
    component.config = makeConfig(analogIds);
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
    component.config = makeConfig(analogIds);
    component.lanes = [
      new Lane("l1", "#fff", "#000", 10),
      new Lane("l2", "#fff", "#000", 10),
    ];
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
    component.config = makeConfig(analogIds);
    component.lanes = [
      new Lane("l1", "#fff", "#000", 10),
      new Lane("l2", "#fff", "#000", 10),
      new Lane("l3", "#fff", "#000", 10),
    ];
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
    component.config = makeConfig(analogIds);
    component.lanes = [
      new Lane("l1", "#fff", "#000", 10),
      new Lane("l2", "#fff", "#000", 10),
    ];
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
    component.config = makeConfig(analogIds);
    component.lanes = [
      new Lane("l1", "#fff", "#000", 10),
      new Lane("l2", "#fff", "#000", 10),
    ];
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
    component.config!.hardwareType = 1;
    component.config!.digitalIds[10] = 1000; // D10 (within Uno range)
    component.config!.digitalIds[50] = 1001; // D50 (outside Uno range)
    component.config!.analogIds[2] = VOLTAGE_BASE; // A2 (within Uno range)
    component.config!.analogIds[10] = VOLTAGE_BASE + 1; // A10 (outside Uno range)

    // 2. Switch to Uno (0)
    component.onHardwareTypeChange(0);

    // 3. Verify
    expect(component.config!.hardwareType).toBe(0);
    expect(component.config!.digitalIds[10]).toBe(1000); // Should remain
    expect(component.config!.digitalIds[50]).toBe(0); // Should be BEHAVIOR_UNUSED (0)
    expect(component.config!.analogIds[2]).toBe(7000); // Should remain
    expect(component.config!.analogIds[10]).toBe(0); // Should be BEHAVIOR_UNUSED (0)
  });

  describe("Link State Persistence", () => {
    function setupComponentWithIndex(idx: number) {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      component.config = makeConfig();
      component.lanes = [new Lane("l1", "#fff", "#000", 10)];
      component.index = idx;
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
      component.config = makeConfig();
      component.lanes = [new Lane("l1", "#fff", "#000", 10)];
      fixture.detectChanges();
    });

    it("should add a new LedString when a pin is assigned BEHAVIOR_LED_RGB_STRING", () => {
      const pinIndex = 5;
      const rgbBehavior = (com.antigravity.PinBehavior as any)
        .BEHAVIOR_LED_RGB_STRING;
      const unusedBehavior = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;

      expect(component.config!.ledStrings.length).toBe(0);

      component.setPinBehavior(true, pinIndex, rgbBehavior.toString());

      expect(component.config!.ledStrings.length).toBe(1);
      expect(component.config!.ledStrings[0].pin).toBe(5); // D5
    });

    it("should remove the LedString when a pin is unassigned from BEHAVIOR_LED_RGB_STRING", () => {
      const pinIndex = 5;
      const rgbBehavior = (com.antigravity.PinBehavior as any)
        .BEHAVIOR_LED_RGB_STRING;
      const unusedBehavior = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;

      // 1. Add it
      component.setPinBehavior(true, pinIndex, rgbBehavior.toString());
      expect(component.config!.ledStrings.length).toBe(1);

      // 2. Remove it
      component.setPinBehavior(true, pinIndex, unusedBehavior.toString());
      expect(component.config!.ledStrings.length).toBe(0);
    });

    it("should remove only the specific LedString matching the pin", () => {
      const pinIndex5 = 5;
      const pinIndex6 = 6;
      const rgbBehavior = (com.antigravity.PinBehavior as any)
        .BEHAVIOR_LED_RGB_STRING;
      const unusedBehavior = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;

      component.setPinBehavior(true, pinIndex5, rgbBehavior.toString());
      component.setPinBehavior(true, pinIndex6, rgbBehavior.toString());
      expect(component.config!.ledStrings.length).toBe(2);

      // Remove pin 5
      component.setPinBehavior(true, pinIndex5, unusedBehavior.toString());

      expect(component.config!.ledStrings.length).toBe(1);
      expect(component.config!.ledStrings[0].pin).toBe(6);
    });
  });

  describe("LED String Linking Logic", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArduinoEditorComponent);
      component = fixture.componentInstance;
      component.config = makeConfig();
      component.lanes = [
        new Lane("l1", "#ff0000", "#000", 10),
        new Lane("l2", "#00ff00", "#000", 10),
      ];

      // Add two strings
      const rgbBehavior = (com.antigravity.PinBehavior as any)
        .BEHAVIOR_LED_RGB_STRING;
      const unused = com.antigravity.PinBehavior.BEHAVIOR_UNUSED;
      component.setPinBehavior(true, 5, rgbBehavior.toString());
      component.setPinBehavior(true, 6, rgbBehavior.toString());

      fixture.detectChanges();
    });

    it("should sync brightness across all strings when linked", () => {
      component.isLedStringsLinked = true;

      component.onLedStringBrightnessChange(0, 128);

      expect(component.config!.ledStrings[0].brightness).toBe(128);
      expect(component.config!.ledStrings[1].brightness).toBe(128);
    });

    it("should NOT sync brightness when unlinked", () => {
      component.isLedStringsLinked = false;

      component.onLedStringBrightnessChange(0, 128);

      expect(component.config!.ledStrings[0].brightness).toBe(128);
      expect(component.config!.ledStrings[1].brightness).not.toBe(128);
    });

    it("should sync update rate across all strings when linked", () => {
      component.isLedStringsLinked = true;

      component.onLedStringFlashRateChange(0, 60);

      expect(component.config!.ledStrings[0].flagFlashRate).toBe(60);
      expect(component.config!.ledStrings[1].flagFlashRate).toBe(60);
    });

    it("should sync color overrides across all strings when linked", () => {
      component.isLedStringsLinked = true;

      component.onLedStringLaneColorChange(0, 1, "#0000ff"); // String 0, Lane 1 (index 1)

      expect(component.config!.ledStrings[0].ledLaneColorOverrides[1]).toBe(
        "#0000ff",
      );
      expect(component.config!.ledStrings[1].ledLaneColorOverrides[1]).toBe(
        "#0000ff",
      );
    });

    it("should NOT sync color overrides when unlinked", () => {
      component.isLedStringsLinked = false;

      component.onLedStringLaneColorChange(0, 1, "#0000ff");

      expect(component.config!.ledStrings[0].ledLaneColorOverrides[1]).toBe(
        "#0000ff",
      );
      expect(component.config!.ledStrings[1].ledLaneColorOverrides[1]).not.toBe(
        "#0000ff",
      );
    });
  });
});
