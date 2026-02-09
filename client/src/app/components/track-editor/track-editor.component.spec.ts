import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackEditorComponent } from './track-editor.component';
import { DataService } from '../../data.service';
import { TranslationService } from '../../services/translation.service';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { FormsModule } from '@angular/forms';
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';

// Mock DataService
class MockDataService {
  getTracks() {
    return of([
      {
        entity_id: 't1',
        name: 'Track 1',
        lanes: [{ entity_id: 'l1', background_color: '#ff0000', foreground_color: '#ffffff', length: 10 }],
        arduino_config: {
          digitalIds: new Array(60).fill(-1),
          analogIds: new Array(16).fill(-1),
          hardwareType: 0
        }
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

  it('should handle save error', () => {
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
});
