import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackManagerComponent } from './track-manager.component';
import { DataService } from '../../data.service';
import { TranslationService } from '../../services/translation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';

// Mock DataService
class MockDataService {
  getTracks() {
    return of([
      { entity_id: 't1', name: 'Track 1', lanes: [{ objectId: 'l1', length: 10 }] },
      { entity_id: 't2', name: 'Track 2', lanes: [{ objectId: 'l2', length: 12 }] }
    ]);
  }
  deleteTrack(id: string) {
    return of(true);
  }
  connectToInterfaceDataSocket() { }
  disconnectFromInterfaceDataSocket() { }
  getInterfaceEvents() {
    return of({});
  }
  getRaceState() {
    return of(0); // com.antigravity.RaceState.NOT_STARTED
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
        { provide: ActivatedRoute, useClass: MockActivatedRoute }
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

  it('should navigate to editor for new track', () => {
    component.createNewTrack();
    expect(router.navigate).toHaveBeenCalledWith(['/track-editor'], { queryParams: { id: 'new' } });
  });

  it('should delete track after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(dataService, 'deleteTrack').and.callThrough();
    spyOn(component, 'loadTracks').and.callThrough();

    component.deleteTrack();

    expect(window.confirm).toHaveBeenCalled();
    expect(dataService.deleteTrack).toHaveBeenCalledWith('t1');
    expect(component.loadTracks).toHaveBeenCalled();
  });

  it('should not delete track if confirmation denied', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(dataService, 'deleteTrack').and.callThrough();

    component.deleteTrack();

    expect(window.confirm).toHaveBeenCalled();
    expect(dataService.deleteTrack).not.toHaveBeenCalled();
  });
});
