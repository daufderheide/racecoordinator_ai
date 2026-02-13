import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RaceManagerComponent } from './race-manager.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService } from 'src/app/services/connection-monitor.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

describe('RaceManagerComponent', () => {
  let component: RaceManagerComponent;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;

  beforeEach(() => {
    mockDataService = jasmine.createSpyObj('DataService', ['getRaces', 'deleteRace', 'generateHeats', 'previewHeats']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockConnectionMonitor = jasmine.createSpyObj('ConnectionMonitorService', ['startMonitoring'], { connectionState$: of() });
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [RaceManagerComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    const fixture = TestBed.createComponent(RaceManagerComponent);
    component = fixture.componentInstance;
    mockDataService.getRaces.and.returnValue(of([]));
    mockDataService.generateHeats.and.returnValue(of({ heats: [] }));
    mockDataService.previewHeats.and.returnValue(of({ heats: [] }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load races on init', () => {
    const mockRaces = [
      { entity_id: '1', name: 'Race 1', track: { name: 'Track 1' } },
      { entity_id: '2', name: 'Race 2', track: { name: 'Track 2' } }
    ];
    mockDataService.getRaces.and.returnValue(of(mockRaces));

    component.ngOnInit();

    expect(mockDataService.getRaces).toHaveBeenCalled();
    expect(component.races.length).toBe(2);
  });

  it('should filter races based on search query', () => {
    component.races = [
      { entity_id: '1', name: 'Grand Prix', track: { name: 'Monaco' } },
      { entity_id: '2', name: 'Time Trial', track: { name: 'Spa' } },
      { entity_id: '3', name: 'Endurance', track: { name: 'Le Mans' } }
    ];

    component.searchQuery = 'Monaco';
    expect(component.filteredRaces.length).toBe(1);
    expect(component.filteredRaces[0].name).toBe('Grand Prix');

    component.searchQuery = 'Trial';
    expect(component.filteredRaces.length).toBe(1);
    expect(component.filteredRaces[0].name).toBe('Time Trial');

    component.searchQuery = '';
    expect(component.filteredRaces.length).toBe(3);
  });

  it('should select a race and load heats if driverCount > 0', () => {
    const mockRace = { entity_id: '1', name: 'Race 1' };
    component.driverCount = 4;
    mockDataService.generateHeats = jasmine.createSpy('generateHeats').and.returnValue(of({ heats: [] }));

    component.selectRace(mockRace);

    expect(component.selectedRace).toEqual(mockRace);
    expect(component.editingRace).toEqual(mockRace);
    expect(mockDataService.generateHeats).toHaveBeenCalledWith('1', 4);
  });

  it('should navigate to race editor when updateRace is called', () => {
    component.selectedRace = { entity_id: '1' };
    component.driverCount = 4;

    component.updateRace();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/race-editor'], {
      queryParams: { id: '1', driverCount: 4 }
    });
  });

  it('should show delete confirmation and delete race', () => {
    component.editingRace = { entity_id: '1' };
    mockDataService.deleteRace.and.returnValue(of({}));
    mockDataService.getRaces.and.returnValue(of([]));

    component.deleteRace();
    expect(component.showDeleteConfirmation).toBeTrue();

    component.onConfirmDelete();
    expect(mockDataService.deleteRace).toHaveBeenCalledWith('1');
    expect(component.showDeleteConfirmation).toBeFalse();
    expect(mockDataService.getRaces).toHaveBeenCalledTimes(2); // Initial and after delete
  });

  it('should cancel delete', () => {
    component.showDeleteConfirmation = true;
    component.onCancelDelete();
    expect(component.showDeleteConfirmation).toBeFalse();
  });
});
