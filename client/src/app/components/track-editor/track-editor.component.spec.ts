import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TrackEditorComponent } from './track-editor.component';
import { DataService } from '../../data.service';
import { TranslationService } from '../../services/translation.service';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { HelpService } from '../../services/help.service';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { Settings } from '../../models/settings';
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
      },
      {
        entity_id: 't2',
        name: 'Existing Track',
        lanes: [],
        arduino_configs: []
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
  getTrackFactorySettings() {
    return of({
      lanes: [
        { background_color: '#ef4444', foreground_color: 'black', length: 100 },
        { background_color: '#ffffff', foreground_color: 'black', length: 100 }
      ],
      arduino_configs: []
    });
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

// Mock HelpService
class MockHelpService {
  startGuide = jasmine.createSpy('startGuide');
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
  private queryParamMapSubject = new BehaviorSubject(convertToParamMap({ id: 't1' }));
  private queryParamsSubject = new BehaviorSubject({ help: 'false' });

  snapshot = {
    get queryParamMap() { return this._parent.queryParamMapSubject.value; },
    get queryParams() { return this._parent.queryParamsSubject.value; },
    _parent: this
  };

  queryParamMap = this.queryParamMapSubject.asObservable();
  queryParams = this.queryParamsSubject.asObservable();

  // Helper to trigger changes in tests
  setQueryParams(params: any) {
    const map = convertToParamMap(params);
    this.queryParamMapSubject.next(map);
    this.queryParamsSubject.next(params);
    // Also update snapshot manually if needed, but getters handle it via _parent
  }
}

// Mock SettingsService
class MockSettingsService {
  settings = new Settings();
  getSettings() { return this.settings; }
  saveSettings(settings: Settings) { this.settings = settings; }
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
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: HelpService, useClass: MockHelpService },
        { provide: SettingsService, useClass: MockSettingsService }
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

  it('should load factory settings for a new track', fakeAsync(() => {
    // Setup for 'new' ID
    const route = TestBed.inject(ActivatedRoute) as any as MockActivatedRoute;
    route.setQueryParams({ id: 'new' });
    spyOn(dataService, 'getTrackFactorySettings').and.callThrough();

    // Re-run ngOnInit logic
    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(dataService.getTrackFactorySettings).toHaveBeenCalled();
    expect(component.trackName).toBe('TM_DEFAULT_TRACK_NAME');
    expect(component.lanes.length).toBe(2);
    expect(component.editingTrack?.entity_id).toBe('new');
  }));

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

  describe('Auto-save and Duplicate', () => {
    it('should auto-save on valid name change after debounce', fakeAsync(() => {
      spyOn(dataService, 'updateTrack').and.callThrough();
      component.trackName = 'Valid New Name';
      component.onInputChange(); // Triggers debounce in UndoManager

      tick(600); // Wait for debounce (500ms) + small buffer
      fixture.detectChanges();

      expect(dataService.updateTrack).toHaveBeenCalled();
      expect(component.isDirty).toBeFalse();
    }));

    it('should NOT auto-save if the name is a duplicate', fakeAsync(() => {
      spyOn(dataService, 'updateTrack').and.callThrough();
      // 'Existing Track' already exists in MockDataService (t2)
      component.trackName = 'Existing Track';
      component.onInputChange();

      tick(600);
      fixture.detectChanges();

      expect(dataService.updateTrack).not.toHaveBeenCalled();
      expect(component.isNameInvalid).toBeTrue();
    }));

    it('should remain dirty after an auto-save fails due to duplicate name (server error 409)', fakeAsync(() => {
      spyOn(dataService, 'updateTrack').and.returnValue(throwError(() => ({ status: 409 })));
      component.trackName = 'Conflict Name';
      component.onInputChange();

      tick(600);
      fixture.detectChanges();

      expect(dataService.updateTrack).toHaveBeenCalled();
      expect(component.isDirty).toBeTrue();
    }));

    it('should preserve undo/redo history and rebase it after Duplicate', () => {
      // 1. Make some changes to build history
      component.trackName = 'Initial Name';
      component.onInputChange();
      // Manually call commitState to simulate a commit immediately for testing
      component.undoManager.commitState(); 
      
      const firstStackCount = component.undoManager.undoStackCount;
      expect(firstStackCount).toBeGreaterThan(0);

      // 2. Perform Duplicate
      spyOn(dataService, 'createTrack').and.returnValue(of({
        entity_id: 'new-id-123',
        name: 'Initial Name_1',
        lanes: component.lanes,
        arduino_configs: component.arduinoConfigs
      }));
      
      component.saveAsNew();

      // 3. Verify history preserved and rebased
      expect(component.undoManager.undoStackCount).toBe(firstStackCount);
      const lastUndoItem = component.undoManager.undoStackItems[component.undoManager.undoStackCount - 1] as any;
      expect(lastUndoItem.entity_id).toBe('new-id-123');
      expect(lastUndoItem.name).toBe('Initial Name_1');
    });

    it('should highlight the name field in red when invalid', () => {
      component.isLoading = false; // Ensure validation is active
      component.trackName = ''; // Invalid: empty
      expect(component.isNameInvalid).toBeTrue();
      
      component.trackName = 'Existing Track'; // Invalid: duplicate (from MockDataService)
      expect(component.isNameInvalid).toBeTrue();

      component.trackName = 'Unique Name';
      expect(component.isNameInvalid).toBeFalse();
    });
  });

  describe('Guided Help', () => {
    let helpService: HelpService;
    let settingsService: SettingsService;
    let mockSettingsService: MockSettingsService;
 
    beforeEach(() => {
      helpService = TestBed.inject(HelpService);
      settingsService = TestBed.inject(SettingsService);
      mockSettingsService = settingsService as any as MockSettingsService;
      mockSettingsService.settings = new Settings();
    });

    it('should trigger help automatically on first visit', fakeAsync(() => {
      spyOn(component, 'startHelp').and.callThrough();
       
      component.ngOnInit();
      tick(1100);
       
      expect(component.startHelp).toHaveBeenCalled();
      expect(helpService.startGuide).toHaveBeenCalled();
      expect(mockSettingsService.settings.trackEditorHelpShown).toBeTrue();
    }));

    it('should trigger help if help=true query param is present even if already shown', fakeAsync(() => {
      mockSettingsService.settings.trackEditorHelpShown = true;
      const activatedRoute = TestBed.inject(ActivatedRoute) as any as MockActivatedRoute;
      activatedRoute.setQueryParams({ help: 'true' });
      spyOn(component, 'startHelp').and.callThrough();
       
      component.ngOnInit();
      tick(1100);
       
      expect(component.startHelp).toHaveBeenCalled();
    }));

    it('should NOT trigger help automatically if already shown and no query param', fakeAsync(() => {
      mockSettingsService.settings.trackEditorHelpShown = true;
      spyOn(component, 'startHelp').and.callThrough();
       
      component.ngOnInit();
      tick(1100);
       
      expect(component.startHelp).not.toHaveBeenCalled();
      expect(helpService.startGuide).not.toHaveBeenCalled();
    }));

    it('should trigger help when startHelp is called manually', () => {
      component.startHelp();
      expect(helpService.startGuide).toHaveBeenCalled();
    });

    it('should expand lanes section if collapsed during help', () => {
      component.sectionsExpanded.lanes = false;
      component.lanes = [new Lane('l1', 'white', 'black', 100)];
      
      component.startHelp();
      
      expect(component.sectionsExpanded.lanes).toBeTrue();
    });
  });
});
