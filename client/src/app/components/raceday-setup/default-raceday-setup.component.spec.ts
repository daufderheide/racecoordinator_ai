import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultRacedaySetupComponent } from './default-raceday-setup.component';
import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';
import { TranslationService } from 'src/app/services/translation.service';
import { SettingsService } from 'src/app/services/settings.service';
import { Router } from '@angular/router';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { FileSystemService } from 'src/app/services/file-system.service';
import { of } from 'rxjs';

import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { com } from 'src/app/proto/message';

describe('DefaultRacedaySetupComponent', () => {
  let component: DefaultRacedaySetupComponent;
  let fixture: ComponentFixture<DefaultRacedaySetupComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockRaceService: jasmine.SpyObj<RaceService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;

  beforeEach(() => {
    mockDataService = jasmine.createSpyObj('DataService', ['getDrivers', 'getRaces', 'initializeRace']);
    mockRaceService = jasmine.createSpyObj('RaceService', ['startRace']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['getTranslationsLoaded', 'translate']);
    mockSettingsService = jasmine.createSpyObj('SettingsService', ['getSettings', 'saveSettings']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockFileSystemService = jasmine.createSpyObj('FileSystemService', ['selectCustomFolder', 'clearCustomFolder']);

    mockDataService.getDrivers.and.returnValue(of([
      { entity_id: 'd1', name: 'Driver 1', nickname: 'D1' },
      { entity_id: 'd2', name: 'Driver 2', nickname: 'D2' }
    ]));
    mockDataService.getRaces.and.returnValue(of([
      { entity_id: 'r1', name: 'Grand Prix' },
      { entity_id: 'r2', name: 'Time Trial' }
    ]));
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
    mockTranslationService.translate.and.callFake((key) => key);
    mockSettingsService.getSettings.and.returnValue({ recentRaceIds: [], selectedDriverIds: [], serverIp: 'localhost', serverPort: 7070 });

    TestBed.configureTestingModule({
      imports: [FormsModule, DragDropModule],
      declarations: [DefaultRacedaySetupComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: Router, useValue: mockRouter },
        { provide: FileSystemService, useValue: mockFileSystemService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultRacedaySetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle driver selection', () => {
    const driverToSelect = component.filteredUnselectedDrivers.find((d: any) => d.entity_id === 'd2')!;
    component.toggleDriverSelection(driverToSelect, false);

    expect(component.selectedDrivers.length).toBe(1);
    expect(component.selectedDrivers[0].entity_id).toBe('d2');

    const driverToUnselect = component.selectedDrivers[0];
    component.toggleDriverSelection(driverToUnselect, true);

    expect(component.selectedDrivers.length).toBe(0);
    expect(component.filteredUnselectedDrivers.length).toBe(2);
  });

  it('should search drivers', () => {
    expect(component.filteredUnselectedDrivers.length).toBe(2);
    component.driverSearchQuery = 'Driver 1';
    expect(component.filteredUnselectedDrivers.length).toBe(1);
    expect(component.filteredUnselectedDrivers[0].name).toBe('Driver 1');
  });

  it('should search races', () => {
    expect(component.filteredRaces.length).toBe(2);
    component.raceSearchQuery = 'Time Trial';
    expect(component.filteredRaces.length).toBe(1);
    expect(component.filteredRaces[0].name).toBe('Time Trial');
  });

  it('should select a race', () => {
    const raceToSelect = component.races.find((r: any) => r.entity_id === 'r2')!;
    component.selectRace(raceToSelect);

    expect(component.selectedRace?.entity_id).toBe('r2');
    expect(component.isDropdownOpen).toBeFalse();
  });

  it('should start race', () => {
    component.selectedRace = component.races[0];
    component.selectedDrivers = [component.unselectedDrivers[0]];
    const response = com.antigravity.InitializeRaceResponse.fromObject({ success: true });
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(false);

    expect(mockDataService.initializeRace).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/raceday']);
  });

  it('should start demo race', () => {
    component.selectedRace = component.races[0];
    component.selectedDrivers = [component.unselectedDrivers[0]];
    const response = com.antigravity.InitializeRaceResponse.fromObject({ success: true });
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(true);

    expect(mockDataService.initializeRace).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Array), true);
  });

  it('should add all drivers', () => {
    expect(component.filteredUnselectedDrivers.length).toBe(2);
    expect(component.selectedDrivers.length).toBe(0);

    component.addAllDrivers();

    expect(component.filteredUnselectedDrivers.length).toBe(0);
    expect(component.selectedDrivers.length).toBe(2);
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  });

  it('should remove all drivers', () => {
    // Setup initial state: select all
    component.addAllDrivers();
    expect(component.selectedDrivers.length).toBe(2);

    component.removeAllDrivers();

    expect(component.selectedDrivers.length).toBe(0);
    expect(component.filteredUnselectedDrivers.length).toBe(2);
    // Should be sorted alphabetically
    expect(component.filteredUnselectedDrivers[0].name).toBe('Driver 1');
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  });

  it('should randomize drivers', () => {
    // Setup: add 3 mock drivers to have noticeable shuffle
    component.selectedDrivers = [
      { entity_id: 'd1', name: 'D1' } as any,
      { entity_id: 'd2', name: 'D2' } as any,
      { entity_id: 'd3', name: 'D3' } as any,
    ];
    const initialOrder = component.selectedDrivers.map(d => d.entity_id).join(',');

    // Mock Math.random to ensure a specific shuffle order for deterministic test if needed, 
    // or just check that it calls saveSettings and keeps length.
    // Testing true randomness is flaky, so let's verify integration.
    spyOn(Math, 'random').and.returnValue(0.5); // Simple mock

    component.randomizeDrivers();

    expect(component.selectedDrivers.length).toBe(3);
    // With fixed random, order might change or not depending on impl, 
    // but main goal is to ensure it runs without error and saves.
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  });
});
