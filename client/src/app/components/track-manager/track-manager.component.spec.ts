import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackManagerComponent } from './track-manager.component';
import { DataService } from '../../data.service';
import { TranslationService } from '../../services/translation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SettingsService } from '../../services/settings.service';
import { Settings } from '../../models/settings';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { Track } from '../../models/track';

// Mock DataService
class MockDataService {
  getTracks() {
    return of([
      new Track('t1', 'Track 1', [{ objectId: 'l1', length: 10 } as any], false, []),
      new Track('t2', 'Track 2', [{ objectId: 'l2', length: 12 } as any], false, [])
    ]);
  }
  deleteTrack(id: string) {
    return of(true);
  }
  createTrack(track: any) {
    return of({ ...track, entity_id: 't-new-id' });
  }
  getTrackFactorySettings() {
    return of({
      lanes: [
        { background_color: '#ef4444', foreground_color: 'black', length: 0 },
        { background_color: '#ffffff', foreground_color: 'black', length: 0 }
      ],
      arduino_configs: [{}]
    });
  }
  connectToInterfaceDataSocket() { }
  disconnectFromInterfaceDataSocket() { }
  getInterfaceEvents() {
    return of({});
  }
  getRaceState() {
    return of(0); // com.antigravity.RaceState.NOT_STARTED
  }
  closeInterface() {
    return of({ success: true });
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
    queryParamMap: {
      get: (key: string) => null
    }
  };
  queryParamMap = of(this.snapshot.queryParamMap);
  queryParams = of({});
}

// Mock SettingsService
class MockSettingsService {
  getSettings() { return new Settings(); }
  saveSettings(settings: Settings) { }
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

describe('TrackManagerComponent', () => {
  let component: TrackManagerComponent;
  let fixture: ComponentFixture<TrackManagerComponent>;
  let dataService: DataService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrackManagerComponent, TranslatePipe, MockBackButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DataService, useClass: MockDataService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: Router, useClass: MockRouter },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: SettingsService, useClass: MockSettingsService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrackManagerComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tracks on init', () => {
    expect(component.tracks.length).toBe(2);
    expect(component.selectedTrack?.name).toBe('Track 1');
  });

  it('should select a track', () => {
    component.selectTrack(component.tracks[1]);
    expect(component.selectedTrack?.name).toBe('Track 2');
  });

  it('should navigate to editor for editing', () => {
    component.editTrack();
    expect(router.navigate).toHaveBeenCalledWith(['/track-editor'], { queryParams: { id: 't1' } });
  });

  it('should create a new track with unique name and navigate', () => {
    spyOn(dataService, 'getTrackFactorySettings').and.callThrough();
    spyOn(dataService, 'createTrack').and.callThrough();
    spyOn(component.translationService, 'translate').and.returnValue('New Track');

    component.createNewTrack();

    expect(dataService.getTrackFactorySettings).toHaveBeenCalled();
    expect(dataService.createTrack).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'New Track',
      entity_id: 'new'
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/track-editor'], { queryParams: { id: 't-new-id' } });
  });

  it('should generate a unique name if default name exists', () => {
    spyOn(dataService, 'createTrack').and.callThrough();
    spyOn(component.translationService, 'translate').and.returnValue('Track 1'); // Exists in MockDataService

    component.createNewTrack();

    expect(dataService.createTrack).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'Track 1_1'
    }));
  });

  it('should show delete confirmation modal on deleteTrack', () => {
    component.deleteTrack();
    expect(component.showDeleteConfirm).toBeTrue();
  });

  it('should delete track when onConfirmDelete is called', () => {
    spyOn(dataService, 'deleteTrack').and.callThrough();
    spyOn(component, 'loadTracks').and.callThrough();

    component.onConfirmDelete();

    expect(component.showDeleteConfirm).toBeFalse();
    expect(dataService.deleteTrack).toHaveBeenCalledWith('t1');
    expect(component.loadTracks).toHaveBeenCalled();
  });

  it('should hide delete confirmation modal when onCancelDelete is called', () => {
    spyOn(dataService, 'deleteTrack').and.callThrough();

    component.showDeleteConfirm = true;
    component.onCancelDelete();

    expect(component.showDeleteConfirm).toBeFalse();
    expect(dataService.deleteTrack).not.toHaveBeenCalled();
  });

  it('should handle extremely long track names without logic errors', () => {
    const longName = 'A'.repeat(500);
    const mockTrack = new Track('t-long', longName, [], false, []);
    
    component.tracks = [mockTrack];
    component.selectTrack(mockTrack);
    
    expect(component.selectedTrack?.name).toBe(longName);
    // Logic should remain sound even if CSS truncates it visually
  });
});
