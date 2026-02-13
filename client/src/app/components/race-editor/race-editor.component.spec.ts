import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RaceEditorComponent } from './race-editor.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

describe('RaceEditorComponent', () => {
  let component: RaceEditorComponent;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockDataService = jasmine.createSpyObj('DataService', ['getRaces', 'getTracks', 'createRace', 'updateRace', 'generateHeats', 'previewHeats']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.callFake((key: string) => {
            if (key === 'driverCount') return '10';
            if (key === 'id') return '1';
            return null;
          })
        }
      }
    };

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [RaceEditorComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    const fixture = TestBed.createComponent(RaceEditorComponent);
    component = fixture.componentInstance;

    // Initialize with safe defaults for template binding
    component.editingRace = {
      entity_id: 'new',
      name: '',
      track_entity_id: '',
      heat_rotation_type: 'RoundRobin',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    };
    component.originalRace = JSON.parse(JSON.stringify(component.editingRace));

    // Default return values for spies
    mockDataService.getRaces.and.returnValue(of([]));
    mockDataService.getTracks.and.returnValue(of([]));
    mockDataService.previewHeats.and.returnValue(of({ heats: [] }));
    mockDataService.generateHeats.and.returnValue(of({ heats: [] }));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load race on init when ID is provided', fakeAsync(() => {
    const mockRaces = [
      {
        entity_id: '1',
        name: 'Race 1',
        track_entity_id: 'track1',
        heat_rotation_type: 'RoundRobin',
        heat_scoring: {
          finish_method: 'Lap',
          finish_value: 10,
          heat_ranking: 'LAP_COUNT',
          heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: 'LAP_COUNT',
          tiebreaker: 'FASTEST_LAP_TIME'
        }
      }
    ];
    mockDataService.getRaces.and.returnValue(of(mockRaces));
    mockDataService.getTracks.and.returnValue(of([]));
    mockDataService.previewHeats.and.returnValue(of({ heats: [] }));
    mockDataService.generateHeats.and.returnValue(of({ heats: [] }));

    component.ngOnInit();
    tick(); // Handle setTimeout in loadRace, loadTracks, createNewRace

    expect(mockDataService.getRaces).toHaveBeenCalled();
    expect(component.editingRace).toBeDefined();
  }));

  it('should load heats when race is loaded', fakeAsync(() => {
    const mockRaces = [
      {
        entity_id: '1',
        name: 'Race 1',
        track_entity_id: 'track1',
        heat_rotation_type: 'RoundRobin',
        heat_scoring: {
          finish_method: 'Lap',
          finish_value: 10,
          heat_ranking: 'LAP_COUNT',
          heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: 'LAP_COUNT',
          tiebreaker: 'FASTEST_LAP_TIME'
        }
      }
    ];
    const mockHeats = {
      heats: [
        { heatNumber: 1, lanes: [{ laneNumber: 1, driverNumber: 1 }] }
      ]
    };
    mockDataService.getRaces.and.returnValue(of(mockRaces));
    mockDataService.getTracks.and.returnValue(of([]));
    mockDataService.previewHeats.and.returnValue(of(mockHeats));

    component.driverCount = 10;
    component.ngOnInit();
    tick();

    expect(mockDataService.previewHeats).toHaveBeenCalledWith('track1', 'RoundRobin', 10);
    expect(component.generatedHeats.length).toBeGreaterThan(0);
  }));

  it(' should regenerate heats when driver count changes', fakeAsync(() => {
    const mockRaces = [
      {
        entity_id: '1',
        name: 'Race 1',
        track_entity_id: 'track1',
        heat_rotation_type: 'RoundRobin',
        heat_scoring: {
          finish_method: 'Lap',
          finish_value: 10,
          heat_ranking: 'LAP_COUNT',
          heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: 'LAP_COUNT',
          tiebreaker: 'FASTEST_LAP_TIME'
        }
      }
    ];
    mockDataService.getRaces.and.returnValue(of(mockRaces));
    mockDataService.getTracks.and.returnValue(of([]));
    mockDataService.generateHeats.and.returnValue(of({ heats: [] }));

    component.ngOnInit();
    tick();
    const callsAfterInit = mockDataService.previewHeats.calls.count();

    component.loadHeats();
    tick();

    expect(mockDataService.previewHeats.calls.count()).toBe(callsAfterInit + 1);
  }));

  it('should not load heats for new race', () => {
    component.editingRace = {
      entity_id: 'new',
      name: '',
      track_entity_id: '',
      heat_rotation_type: 'RoundRobin',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    };
    component.loadHeats();

    expect(mockDataService.previewHeats).not.toHaveBeenCalled();
    expect(component.generatedHeats.length).toBe(0);
  });

  it('should detect duplicate names', () => {
    component.races = [
      { entity_id: '1', name: 'Existing Race' },
      { entity_id: '2', name: 'Another Race' }
    ];
    component.editingRace = {
      entity_id: 'new',
      name: 'Existing Race',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    };

    expect(component.isNameDuplicate()).toBeTrue();

    component.editingRace.name = 'Unique Race';
    expect(component.isNameDuplicate()).toBeFalse();
  });

  it('should validate canSaveAsNew', () => {
    component.originalRace = {
      entity_id: '1',
      name: 'Original',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    };
    component.editingRace = {
      entity_id: '1',
      name: 'Original',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    };
    component.races = [{ entity_id: '1', name: 'Original' }];

    expect(component.canSaveAsNew()).toBeFalse(); // Name unchanged

    component.editingRace.name = 'Changed';
    expect(component.canSaveAsNew()).toBeTrue(); // Name changed and unique

    component.races.push({ entity_id: '2', name: 'Duplicate' });
    component.editingRace.name = 'Duplicate';
    expect(component.canSaveAsNew()).toBeFalse(); // Name changed but duplicate
  });

  it('should validate canUpdate', () => {
    component.editingRace = {
      entity_id: '1',
      name: 'Race 1',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    };
    spyOn(component, 'hasChanges').and.returnValue(false);
    expect(component.canUpdate()).toBeFalse();

    (component.hasChanges as jasmine.Spy).and.returnValue(true);
    expect(component.canUpdate()).toBeTrue();

    spyOn(component, 'isNameDuplicate').and.returnValue(true);
    expect(component.canUpdate()).toBeFalse();
  });

  it('should call updateRace API', fakeAsync(() => {
    component.editingRace = {
      entity_id: '1',
      name: 'Updated Name',
      track_entity_id: 'track1',
      heat_rotation_type: 'RoundRobin',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    };
    spyOn(component, 'hasChanges').and.returnValue(true);
    mockDataService.updateRace.and.returnValue(of({}));
    mockDataService.getRaces.and.returnValue(of([]));

    component.updateRace();
    tick(); // Handles setTimeout in loadRaces()

    expect(mockDataService.updateRace).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  }));

  it('should call createRace API when saving new', fakeAsync(() => {
    component.editingRace = {
      entity_id: 'new',
      name: 'New Race',
      track_entity_id: 'track1',
      heat_rotation_type: 'RoundRobin',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    };
    mockDataService.createRace.and.returnValue(of({
      entity_id: '2',
      name: 'New Race',
      track_entity_id: 'track1',
      heat_rotation_type: 'RoundRobin',
      heat_scoring: {
        finish_method: 'Lap',
        finish_value: 10,
        heat_ranking: 'LAP_COUNT',
        heat_ranking_tiebreaker: 'FASTEST_LAP_TIME'
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: 'LAP_COUNT',
        tiebreaker: 'FASTEST_LAP_TIME'
      }
    }));
    mockDataService.getRaces.and.returnValue(of([]));
    spyOn(component, 'hasChanges').and.returnValue(true);

    component.updateRace();
    tick(); // Handles setTimeout in loadRaces()

    expect(mockDataService.createRace).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/race-manager'], { queryParams: { id: '2', driverCount: 10 } });
  }));
});
