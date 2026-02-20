import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultRacedaySetupComponent } from './default-raceday-setup.component';
import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';
import { TranslationService } from 'src/app/services/translation.service';
import { SettingsService } from 'src/app/services/settings.service';
import { Router } from '@angular/router';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { FileSystemService } from 'src/app/services/file-system.service';
import { HelpService } from 'src/app/services/help.service';
import { HelpOverlayComponent } from '../shared/help-overlay/help-overlay.component';
import { of, BehaviorSubject } from 'rxjs';

import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { com } from 'src/app/proto/message';
import { Settings } from 'src/app/models/settings';

describe('DefaultRacedaySetupComponent', () => {
  let component: DefaultRacedaySetupComponent;
  let fixture: ComponentFixture<DefaultRacedaySetupComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockRaceService: jasmine.SpyObj<RaceService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;
  let mockHelpService: any;

  beforeEach(() => {
    mockDataService = jasmine.createSpyObj('DataService', ['getDrivers', 'getTeams', 'getRaces', 'initializeRace']);
    mockRaceService = jasmine.createSpyObj('RaceService', ['startRace']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['getTranslationsLoaded', 'translate', 'setLanguage', 'getSupportedLanguages', 'getBrowserLanguage']);
    mockSettingsService = jasmine.createSpyObj('SettingsService', ['getSettings', 'saveSettings']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockFileSystemService = jasmine.createSpyObj('FileSystemService', ['selectCustomFolder', 'clearCustomFolder']);

    // Mock HelpService using spyObj and observables
    mockHelpService = jasmine.createSpyObj('HelpService', ['startGuide', 'nextStep', 'previousStep', 'endGuide']);
    mockHelpService.isVisible$ = new BehaviorSubject(false);
    mockHelpService.currentStep$ = new BehaviorSubject(null);
    mockHelpService.hasNext$ = new BehaviorSubject(false);
    mockHelpService.hasPrevious$ = new BehaviorSubject(false);

    mockDataService.getDrivers.and.returnValue(of([
      { entity_id: 'd1', name: 'Driver 1', nickname: 'D1' },
      { entity_id: 'd2', name: 'Driver 2', nickname: 'D2' }
    ]));
    mockDataService.getTeams.and.returnValue(of([
      { entity_id: 't1', name: 'Team 1', driverIds: ['d1'] }
    ]));
    mockDataService.getRaces.and.returnValue(of([
      { entity_id: 'r1', name: 'Grand Prix' },
      { entity_id: 'r2', name: 'Time Trial' }
    ]));
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
    mockTranslationService.translate.and.callFake((key) => key);
    mockTranslationService.getBrowserLanguage.and.returnValue('en');
    mockTranslationService.getSupportedLanguages.and.returnValue([
      { code: 'en', nameKey: 'RDS_LANG_EN' },
      { code: 'es', nameKey: 'RDS_LANG_ES' }
    ]);
    mockSettingsService.getSettings.and.returnValue(Object.assign(new Settings(), {
      recentRaceIds: [],
      selectedDriverIds: [],
      serverIp: 'localhost',
      serverPort: 7070,
      language: '',
      racedaySetupWalkthroughSeen: false,
      sortByStandings: true
    }));

    TestBed.configureTestingModule({
      imports: [FormsModule, DragDropModule],
      declarations: [DefaultRacedaySetupComponent, TranslatePipe, HelpOverlayComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: Router, useValue: mockRouter },
        { provide: FileSystemService, useValue: mockFileSystemService },
        { provide: HelpService, useValue: mockHelpService }
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
    const driverToSelect = component.filteredUnselectedParticipants.find((d: any) => d.entity_id === 'd2')!;
    component.toggleParticipantSelection(driverToSelect, false);

    expect(component.selectedParticipants.length).toBe(1);
    expect(component.selectedParticipants[0].entity_id).toBe('d2');

    const driverToUnselect = component.selectedParticipants[0];
    component.toggleParticipantSelection(driverToUnselect, true);

    expect(component.selectedParticipants.length).toBe(0);
    expect(component.filteredUnselectedParticipants.length).toBe(3);
  });

  it('should toggle team selection', () => {
    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getTeams.and.returnValue(of([
      { entity_id: 't1', name: 'Team 1', driverIds: ['d1'] } as any
    ]));
    expect(component.filteredUnselectedParticipants.length).toBe(3);
    const teamToSelect = component.filteredUnselectedParticipants.find((d: any) => d.entity_id === 't1')!;
    component.toggleParticipantSelection(teamToSelect, false);

    expect(component.selectedParticipants.length).toBe(1);
    expect(component.selectedParticipants[0].entity_id).toBe('t1');

    component.toggleParticipantSelection(component.selectedParticipants[0], true);
    expect(component.selectedParticipants.length).toBe(0);
  });

  it('should search drivers', () => {
    expect(component.filteredUnselectedParticipants.length).toBe(3);
    component.driverSearchQuery = 'Driver 1';
    expect(component.filteredUnselectedParticipants.length).toBe(1);
    expect(component.filteredUnselectedParticipants[0].name).toBe('Driver 1');
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
    component.selectedParticipants = [component.unselectedParticipants[0]];
    const response = com.antigravity.InitializeRaceResponse.fromObject({ success: true });
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(false);

    expect(mockDataService.initializeRace).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/raceday']);
  });

  it('should start demo race', () => {
    component.selectedRace = component.races[0];
    component.selectedParticipants = [component.unselectedParticipants[0]];
    const response = com.antigravity.InitializeRaceResponse.fromObject({ success: true });
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(true);

    expect(mockDataService.initializeRace).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Array), true);
  });

  it('should add all drivers', () => {
    expect(component.filteredUnselectedParticipants.length).toBe(3);
    expect(component.selectedParticipants.length).toBe(0);

    component.addAllParticipants();

    expect(component.filteredUnselectedParticipants.length).toBe(0);
    expect(component.selectedParticipants.length).toBe(3);
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  });

  it('should remove all drivers', () => {
    // Setup initial state: select all
    component.addAllParticipants();
    expect(component.selectedParticipants.length).toBe(3);

    component.removeAllParticipants();

    expect(component.selectedParticipants.length).toBe(0);
    expect(component.filteredUnselectedParticipants.length).toBe(3);
    // Should be sorted alphabetically
    expect(component.filteredUnselectedParticipants[0].name).toBe('Driver 1');
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  });

  it('should randomize drivers', () => {
    // Setup: add 3 mock drivers to have noticeable shuffle
    component.selectedParticipants = [
      { entity_id: 'd1', name: 'D1' } as any,
      { entity_id: 'd2', name: 'D2' } as any,
      { entity_id: 'd3', name: 'D3' } as any,
    ];
    const initialOrder = component.selectedParticipants.map(p => p.entity_id).join(',');

    // Mock Math.random to ensure a specific shuffle order for deterministic test if needed, 
    // or just check that it calls saveSettings and keeps length.
    // Testing true randomness is flaky, so let's verify integration.
    spyOn(Math, 'random').and.returnValue(0.5); // Simple mock

    component.randomizeParticipants();

    expect(component.selectedParticipants.length).toBe(3);
    // With fixed random, order might change or not depending on impl, 
    // but main goal is to ensure it runs without error and saves.
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  });

  it('should toggle options dropdown', () => {
    component.toggleOptionsDropdown(new MouseEvent('click'));
    expect(component.isOptionsDropdownOpen).toBeTrue();

    component.toggleOptionsDropdown(new MouseEvent('click'));
    expect(component.isOptionsDropdownOpen).toBeFalse();
  });

  it('should toggle localization dropdown', () => {
    component.toggleLocalizationDropdown(new MouseEvent('click'));
    expect(component.isLocalizationDropdownOpen).toBeTrue();

    component.toggleLocalizationDropdown(new MouseEvent('click'));
    expect(component.isLocalizationDropdownOpen).toBeFalse();
  });

  it('should select language and save setting', () => {
    component.selectLanguage('es');
    expect(mockTranslationService.setLanguage).toHaveBeenCalledWith('es');
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
    expect(component.currentLanguage).toBe('es');
    expect(component.isOptionsDropdownOpen).toBeFalse();
  });

  it('should get language display name', () => {
    mockTranslationService.translate.and.callFake((key) => {
      if (key === 'RDS_LANG_DEFAULT') return 'Default';
      if (key === 'RDS_LANG_EN') return 'English (en)';
      return key;
    });

    expect(component.getLanguageDisplayName('')).toBe('Default (EN)');
    expect(component.getLanguageDisplayName('en')).toBe('English (en)');
  });

  it('should start help guide with translated strings', () => {
    component.startHelp();
    expect(mockTranslationService.translate).toHaveBeenCalledWith('RDS_HELP_WELCOME_TITLE');
    expect(mockHelpService.startGuide).toHaveBeenCalled();
    const guideSteps = mockHelpService.startGuide.calls.mostRecent().args[0];
    expect(guideSteps[0].title).toBe('RDS_HELP_WELCOME_TITLE');
  });
});
