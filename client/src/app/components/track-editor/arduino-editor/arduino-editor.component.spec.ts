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
import { of } from 'rxjs';

class MockDataService {
  getSerialPorts() {
    return of(['COM1', 'COM2']);
  }
  getInterfaceEvents() {
    return of({});
  }
  initializeInterface(config: any, lanes: number) {
    return of({ success: true });
  }
  updateInterfaceConfig(config: any) {
    return of({ success: true });
  }
}

describe('ArduinoEditorComponent', () => {
  let component: ArduinoEditorComponent;
  let fixture: ComponentFixture<ArduinoEditorComponent>;
  let translationService: TranslationServiceMock;

  beforeEach(async () => {
    translationService = new TranslationServiceMock();

    await TestBed.configureTestingModule({
      declarations: [ArduinoEditorComponent, TranslatePipe],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TranslationService, useValue: translationService },
        { provide: DataService, useClass: MockDataService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ArduinoEditorComponent);
    component = fixture.componentInstance;

    // Provide default inputs
    component.config = {
      name: 'Test Arduino',
      commPort: 'COM1',
      baudRate: 9600,
      debounceUs: 1000,
      hardwareType: 0,
      digitalIds: new Array(MAX_DIGITAL_PINS).fill(-1),
      analogIds: new Array(MAX_ANALOG_PINS).fill(-1),
      globalInvertLanes: 0,
      normallyClosedRelays: false,
      globalInvertLights: 0,
      useLapsForPits: 0,
      useLapsForPitEnd: 0,
      usePitsAsLaps: 0,
      useLapsForSegments: 0,
      ledStrings: null, ledLaneColorOverrides: null
    };
    component.lanes = [
      new Lane('l1', '#fff', '#000', 10),
      new Lane('l2', '#fff', '#000', 10)
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with config', () => {
    expect(component.config!.name).toBe('Test Arduino');
    expect(component.lanes.length).toBe(2);
  });

  it('should fetch serial ports on init', () => {
    // It happens in ngOnInit
    expect(component.availablePorts).toEqual(['COM1', 'COM2']);
  });

  it('should update config when inputs change', () => {
    spyOn(component.configChange, 'emit');
    component.updateArduinoConfig();
    expect(component.configChange.emit).toHaveBeenCalled();
  });
});
