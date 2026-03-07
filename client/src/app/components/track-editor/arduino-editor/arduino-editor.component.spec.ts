import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArduinoEditorComponent } from './arduino-editor.component';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationServiceMock } from '../../../testing/translation-service.mock';
import { ArduinoConfig, MAX_DIGITAL_PINS, MAX_ANALOG_PINS } from '../../../models/track';
import { Lane } from '../../../models/lane';
import { DataService } from '../../../data.service';
import { of, Subject } from 'rxjs';
import { com } from '../../../proto/message';

// BEHAVIOR_VOLTAGE_LEVEL_BASE = 7000
const VOLTAGE_BASE = 7000;

class MockDataService {
  interfaceEvents$ = new Subject<any>();

  getSerialPorts() {
    return of(['COM1', 'COM2']);
  }
  getInterfaceEvents() {
    return this.interfaceEvents$.asObservable();
  }
  initializeInterface(config: any, lanes: number) {
    return of({ success: true });
  }
  updateInterfaceConfig(config: any) {
    return of({ success: true });
  }
  closeInterface() {
    return of({ success: true });
  }
}

describe('ArduinoEditorComponent', () => {
  let component: ArduinoEditorComponent;
  let fixture: ComponentFixture<ArduinoEditorComponent>;
  let translationService: TranslationServiceMock;
  let mockDataService: MockDataService;

  function makeConfig(analogIds?: number[]): ArduinoConfig {
    return {
      name: 'Test Arduino',
      commPort: 'COM1',
      baudRate: 9600,
      debounceUs: 1000,
      hardwareType: 0,
      digitalIds: new Array(MAX_DIGITAL_PINS).fill(-1),
      analogIds: analogIds ?? new Array(MAX_ANALOG_PINS).fill(-1),
      globalInvertLanes: 0,
      normallyClosedRelays: true,
      globalInvertLights: 0,
      useLapsForPits: 0,
      useLapsForPitEnd: 0,
      usePitsAsLaps: 0,
      useLapsForSegments: 0,
      ledStrings: null,
      ledLaneColorOverrides: null,
      voltageConfigs: {}
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
        { provide: DataService, useValue: mockDataService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ArduinoEditorComponent);
    component = fixture.componentInstance;

    component.config = makeConfig();
    component.lanes = [
      new Lane('l1', '#fff', '#000', 10),
      new Lane('l2', '#fff', '#000', 10)
    ];

    fixture.detectChanges();
  });

  // --- Existing Tests ---

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with config', () => {
    expect(component.config!.name).toBe('Test Arduino');
    expect(component.lanes.length).toBe(2);
  });

  it('should fetch serial ports on init', () => {
    expect(component.availablePorts).toEqual(['COM1', 'COM2']);
  });

  it('should update config when inputs change', () => {
    spyOn(component.configChange, 'emit');
    component.updateArduinoConfig();
    expect(component.configChange.emit).toHaveBeenCalled();
  });

  it('should include Voltage Level Lane 1 only in analog actions', () => {
    const voltageAction = component.analogPinActions.find(a => a.value === 'voltage_0');
    expect(voltageAction).toBeTruthy();
    expect(voltageAction!.label).toBe('AE_PIN_VOLTAGE_LANE');

    const digitalVoltageAction = component.digitalPinActions.find(a => a.value === 'voltage_0');
    expect(digitalVoltageAction).toBeUndefined();
  });

  it('should regenerate actions when lanes change', () => {
    component.lanes = [
      new Lane('l1', '#fff', '#000', 10),
      new Lane('l2', '#fff', '#000', 10),
      new Lane('l3', '#fff', '#000', 10)
    ];

    const voltage0 = component.analogPinActions.find(a => a.value === 'voltage_0');
    const voltage1 = component.analogPinActions.find(a => a.value === 'voltage_1');
    const voltage2 = component.analogPinActions.find(a => a.value === 'voltage_2');

    expect(voltage0).toBeTruthy();
    expect(voltage1).toBeTruthy();
    expect(voltage2).toBeTruthy();
  });

  it('should find lanes with voltage pins', () => {
    component.config!.analogIds[1] = VOLTAGE_BASE;     // Lane 0
    component.config!.analogIds[2] = VOLTAGE_BASE + 1; // Lane 1
    const lanes = component.getVoltageLanes();
    expect(lanes).toContain(0);
    expect(lanes).toContain(1);
    expect(lanes.length).toBe(2);
  });

  // --- Voltage Max Value Tests ---

  it('should update voltage max value', () => {
    spyOn(component, 'updateArduinoConfig');
    component.setVoltageMax(0, '512');
    expect(component.getVoltageMax(0)).toBe(512);
    expect(component.updateArduinoConfig).toHaveBeenCalled();
  });

  it('should return 1023 as default max when no config set', () => {
    expect(component.getVoltageMax(0)).toBe(1023);
  });

  // --- Live Voltage Tests ---

  it('should store live voltage when analogData event received', () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Analog pin 0 => Lane 0
    component.config = makeConfig(analogIds);
    fixture.detectChanges();

    mockDataService.interfaceEvents$.next({ analogData: { pin: 0, value: 512 } });

    expect(component.liveVoltages[0]).toBe(512);
  });

  it('should return correct live voltage for a lane via getLiveVoltageForLane', () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[2] = VOLTAGE_BASE + 1; // Analog pin 2 => Lane 1
    component.config = makeConfig(analogIds);
    fixture.detectChanges();

    component.liveVoltages[2] = 800;

    expect(component.getLiveVoltageForLane(1)).toBe(800);
    expect(component.getLiveVoltageForLane(0)).toBe(0); // Lane 0 has no pin assigned
  });

  it('should return 0 for live voltage when no pin assigned to lane', () => {
    component.config = makeConfig();
    expect(component.getLiveVoltageForLane(0)).toBe(0);
  });

  it('should correctly map live voltage to the right lane when multiple pins assigned', () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE;     // Analog pin 0 => Lane 0
    analogIds[3] = VOLTAGE_BASE + 1; // Analog pin 3 => Lane 1
    component.config = makeConfig(analogIds);
    fixture.detectChanges();

    component.liveVoltages[0] = 300;
    component.liveVoltages[3] = 750;

    expect(component.getLiveVoltageForLane(0)).toBe(300);
    expect(component.getLiveVoltageForLane(1)).toBe(750);
  });

  // --- Max Seen Tests ---

  it('should track max voltage seen per lane', () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE; // Analog pin 0 => Lane 0
    component.config = makeConfig(analogIds);
    fixture.detectChanges();

    mockDataService.interfaceEvents$.next({ analogData: { pin: 0, value: 400 } });
    mockDataService.interfaceEvents$.next({ analogData: { pin: 0, value: 700 } });
    mockDataService.interfaceEvents$.next({ analogData: { pin: 0, value: 550 } });

    expect(component.maxVoltagesSeen[0]).toBe(700);
  });

  it('should not update max if new value is lower', () => {
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE;
    component.config = makeConfig(analogIds);
    fixture.detectChanges();

    mockDataService.interfaceEvents$.next({ analogData: { pin: 0, value: 900 } });
    mockDataService.interfaceEvents$.next({ analogData: { pin: 0, value: 200 } });

    expect(component.maxVoltagesSeen[0]).toBe(900);
  });

  it('should apply max seen to only one lane when not linked', () => {
    spyOn(component, 'updateArduinoConfig');
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE;     // Lane 0
    analogIds[1] = VOLTAGE_BASE + 1; // Lane 1
    component.config = makeConfig(analogIds);
    component.lanes = [new Lane('l1', '#fff', '#000', 10), new Lane('l2', '#fff', '#000', 10)];
    component.isVoltageLinked = false;
    fixture.detectChanges();

    component.maxVoltagesSeen[0] = 900;
    component.maxVoltagesSeen[1] = 750;

    component.setMaxToSeen(0);

    expect(component.getVoltageMax(0)).toBe(900);
    expect(component.getVoltageMax(1)).toBe(1023); // Untouched default
  });

  it('should reset max voltages seen for all lanes', () => {
    component.maxVoltagesSeen[0] = 500;
    component.maxVoltagesSeen[1] = 800;

    component.resetMaxSeenAll();

    expect(Object.keys(component.maxVoltagesSeen).length).toBe(0);
  });

  // --- Lane Linking Tests ---

  it('should be unlinked by default', () => {
    expect(component.isVoltageLinked).toBeFalse();
  });

  it('should apply voltage to all lanes when linked', () => {
    spyOn(component, 'updateArduinoConfig');
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE;     // Lane 0
    analogIds[1] = VOLTAGE_BASE + 1; // Lane 1
    analogIds[2] = VOLTAGE_BASE + 2; // Lane 2
    component.config = makeConfig(analogIds);
    component.lanes = [
      new Lane('l1', '#fff', '#000', 10),
      new Lane('l2', '#fff', '#000', 10),
      new Lane('l3', '#fff', '#000', 10)
    ];
    component.isVoltageLinked = true;
    fixture.detectChanges();

    component.setVoltageMax(0, '600');

    expect(component.getVoltageMax(0)).toBe(600);
    expect(component.getVoltageMax(1)).toBe(600);
    expect(component.getVoltageMax(2)).toBe(600);
  });

  it('should only apply voltage to one lane when not linked', () => {
    spyOn(component, 'updateArduinoConfig');
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE;     // Lane 0
    analogIds[1] = VOLTAGE_BASE + 1; // Lane 1
    component.config = makeConfig(analogIds);
    component.lanes = [new Lane('l1', '#fff', '#000', 10), new Lane('l2', '#fff', '#000', 10)];
    component.isVoltageLinked = false;
    fixture.detectChanges();

    component.setVoltageMax(0, '600');

    expect(component.getVoltageMax(0)).toBe(600);
    expect(component.getVoltageMax(1)).toBe(1023); // Default untouched
  });

  it('should apply global max seen across all lanes when linked', () => {
    spyOn(component, 'updateArduinoConfig');
    const analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
    analogIds[0] = VOLTAGE_BASE;     // Lane 0
    analogIds[1] = VOLTAGE_BASE + 1; // Lane 1
    component.config = makeConfig(analogIds);
    component.lanes = [new Lane('l1', '#fff', '#000', 10), new Lane('l2', '#fff', '#000', 10)];
    component.isVoltageLinked = true;
    fixture.detectChanges();

    component.maxVoltagesSeen[0] = 700;
    component.maxVoltagesSeen[1] = 950; // Lane 1 has higher value

    component.setMaxToSeen(0); // Trigger from lane 0; linked = use global max

    // All lanes should get the highest global max (950)
    expect(component.getVoltageMax(0)).toBe(950);
    expect(component.getVoltageMax(1)).toBe(950);
  });

  it('should clear out-of-range pins when switching from Mega to Uno', () => {
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
    expect(component.config!.digitalIds[50]).toBe(0);    // Should be BEHAVIOR_UNUSED (0)
    expect(component.config!.analogIds[2]).toBe(7000);  // Should remain
    expect(component.config!.analogIds[10]).toBe(0);     // Should be BEHAVIOR_UNUSED (0)
  });
});
