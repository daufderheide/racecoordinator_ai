import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackEditorComponent } from './track-editor.component';
import { DataService } from '../../data.service';
import { TranslationService } from '../../services/translation.service';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { FormsModule } from '@angular/forms';
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { Lane } from '../../models/lane';
import { com } from '../../proto/message';

// TODO(aufderheide): Move MockDataService to a shared test file and 
// allow users of it to customize it beyond the simple defaults.
// Mock DataService
class MockDataService {
  getTracks() {
    return of([
      {
        entity_id: 't1',
        name: 'Track 1',
        lanes: [{ entity_id: 'l1', background_color: '#ff0000', foreground_color: '#ffffff', length: 10 }],
        arduino_configs: [{
          digitalIds: new Array(60).fill(-1),
          analogIds: new Array(16).fill(-1),
          hardwareType: 0
        }]
      }
    ]);
  }
  getSerialPorts() {
    return of(['COM1', 'COM2']);
  }
  updateTrack(id: string, track: any) {
    return of(track);
  }
  createTrack(track: any) {
    return of({ ...track, entity_id: 't-new-id' });
  }
  connectToInterfaceDataSocket() { }
  disconnectFromInterfaceDataSocket() { }
  getInterfaceEvents() {
    return of({});
  }
  initializeInterface(config: any) {
    return of({ success: true });
  }
  updateInterfaceConfig(config: any) {
    return of({ success: true });
  }
  closeInterface() {
    return of({ success: true });
  }
  getRaceState() {
    return of(0);
  }
}

// Mock TranslationService
class MockTranslationService {
  translate(key: string) {
    return key;
  }
}

// Mock Router
class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

// Mock ActivatedRoute
class MockActivatedRoute {
  snapshot = {
    queryParamMap: convertToParamMap({ id: 't1' })
  };
  queryParamMap = of(this.snapshot.queryParamMap);
}

@Component({
  selector: 'app-back-button',
  template: '',
  standalone: false
})
class MockBackButtonComponent {
  @Input() targetUrl?: string;
  @Input() route?: string;
  @Input() confirm?: boolean;
  @Input() queryParams?: any;
  @Input() confirmTitle?: string;
  @Input() confirmMessage?: string;
}

@Component({
  selector: 'app-undo-redo-controls',
  template: '',
  standalone: false
})
class MockUndoRedoControlsComponent {
  @Input() manager: any;
}

describe('TrackEditorComponent', () => {
  let component: TrackEditorComponent;
  let fixture: ComponentFixture<TrackEditorComponent>;
  let dataService: DataService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrackEditorComponent, TranslatePipe, MockBackButtonComponent, MockUndoRedoControlsComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DataService, useClass: MockDataService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: Router, useClass: MockRouter },
        { provide: ActivatedRoute, useClass: MockActivatedRoute }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrackEditorComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load track data for editing', () => {
    expect(component.trackName).toBe('Track 1');
    expect(component.lanes.length).toBe(1);
    expect(component.editingTrack?.entity_id).toBe('t1');
  });

  it('should handle lane management', () => {
    component.addLane();
    expect(component.lanes.length).toBe(2);

    component.removeLane(0);
    expect(component.lanes.length).toBe(1);
  });

  it('should update lane properties', () => {
    component.updateLaneBackgroundColor(0, '#00ff00');
    expect(component.lanes[0].background_color).toBe('#00ff00');

    component.updateLaneLength(0, 15);
    expect(component.lanes[0].length).toBe(15);
  });

  it('should update existing track', () => {
    spyOn(dataService, 'updateTrack').and.callThrough();
    component.trackName = 'Updated Track';

    component.updateTrack();

    expect(dataService.updateTrack).toHaveBeenCalledWith('t1', jasmine.any(Object));
    expect(component.isSaving).toBeFalse();
  });

  it('should save as new track', () => {
    spyOn(dataService, 'createTrack').and.callThrough();
    component.saveAsNew();

    expect(dataService.createTrack).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/track-editor'], { queryParams: { id: 't-new-id' } });
  });

  it('should stay on page and keep original ID when save as new fails', () => {
    spyOn(console, 'error');
    spyOn(dataService, 'createTrack').and.returnValue(throwError(() => ({ status: 409, error: 'Conflict' })));
    spyOn(window, 'alert');

    const originalTrackId = component.editingTrack?.entity_id;
    component.saveAsNew();

    expect(dataService.createTrack).toHaveBeenCalled();
    expect(component.editingTrack?.entity_id).toBe(originalTrackId);
    expect(component.isSaving).toBeFalse();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should handle save error', () => {
    spyOn(console, 'error');
    spyOn(window, 'alert');
    spyOn(dataService, 'updateTrack').and.returnValue(throwError(() => ({ status: 500 })));

    component.updateTrack();

    expect(window.alert).toHaveBeenCalledWith('TE_ERROR_SAVE_FAILED');
    expect(component.isSaving).toBeFalse();
  });

  it('should check for unsaved changes (dirty state)', () => {
    expect(component.isDirty).toBeFalse();
    component.trackName = 'Changed';
    component.onInputChange();
    expect(component.isDirty).toBeTrue();
  });

  it('should shift Arduino pin assignments when a lane is deleted', () => {
    // 1. Setup track with 4 lanes
    component.lanes = [
      new Lane('l1', '#ff0000', 'black', 100),
      new Lane('l2', '#00ff00', 'black', 100),
      new Lane('l3', '#0000ff', 'black', 100),
      new Lane('l4', '#ffffff', 'black', 100)
    ];

    // 2. Add Arduino config with lane-specific behaviors
    component.addArduinoConfig();
    const config = component.arduinoConfigs[0];
    // Lane 1 (index 0) behaviors
    config.digitalIds[2] = 1000; // Lap Lane 1
    // Lane 2 (index 1) behaviors
    config.digitalIds[3] = 1001; // Lap Lane 2
    config.digitalIds[4] = 3001; // Call Lane 2
    // Lane 3 (index 2) behaviors
    config.digitalIds[5] = 1002; // Lap Lane 3
    config.digitalIds[6] = 4002; // Relay Lane 3
    // Lane 4 (index 3) behaviors
    config.digitalIds[7] = 1003; // Lap Lane 4

    // Analog behaviors
    config.analogIds[0] = 7001; // Voltage Lane 2
    config.analogIds[1] = 7002; // Voltage Lane 3

    // voltageConfigs
    config.voltageConfigs = {
      1: 500, // Lane 2
      2: 600  // Lane 3
    };

    // 3. Remove Lane 2 (index 1)
    component.removeLane(1);

    // 4. Verify results
    expect(component.lanes.length).toBe(3);
    expect(component.lanes[1].entity_id).toBe('l3'); // Lane 3 is now index 1

    const updatedConfig = component.arduinoConfigs[0];
    expect(updatedConfig.digitalIds[2]).toBe(1000); // Lane 1 unchanged
    expect(updatedConfig.digitalIds[3]).toBe(0);    // Lane 2 (deleted) becomes UNUSED
    expect(updatedConfig.digitalIds[4]).toBe(0);    // Lane 2 (deleted) becomes UNUSED

    expect(updatedConfig.digitalIds[5]).toBe(1001); // Lane 3 (index 2) shifted to index 1
    expect(updatedConfig.digitalIds[6]).toBe(4001); // Lane 3 (index 2) shifted to index 1

    expect(updatedConfig.digitalIds[7]).toBe(1002); // Lane 4 (index 3) shifted to index 2

    expect(updatedConfig.analogIds[0]).toBe(0);    // Lane 2 (deleted) becomes UNUSED
    expect(updatedConfig.analogIds[1]).toBe(7001); // Lane 3 (index 2) shifted to index 1

    expect(updatedConfig.voltageConfigs?.[1]).toBe(600); // Old Lane 3 (2) value shifted to index 1
    expect(updatedConfig.voltageConfigs?.[0]).toBeUndefined(); // Old Lane 2 (1) removed
    expect(updatedConfig.voltageConfigs?.[2]).toBeUndefined(); // Shifted
  });
});
