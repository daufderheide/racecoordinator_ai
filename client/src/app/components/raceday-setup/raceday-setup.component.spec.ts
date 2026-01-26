import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RacedaySetupComponent } from './raceday-setup.component';
import { DataService } from '../../data.service';
import { SettingsService } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { DataServiceMock } from '../../testing/data-service.mock';
import { SettingsServiceMock } from '../../testing/settings-service.mock';
import { TranslationServiceMock } from '../../testing/translation-service.mock';
import { of } from 'rxjs';
import { Settings } from '../../models/settings';

describe('RacedaySetupComponent', () => {
  let component: RacedaySetupComponent;
  let fixture: ComponentFixture<RacedaySetupComponent>;
  let dataService: DataServiceMock;
  let settingsService: SettingsServiceMock;
  let translationService: TranslationServiceMock;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    await TestBed.configureTestingModule({
      declarations: [RacedaySetupComponent, TranslatePipe],
      imports: [FormsModule, DragDropModule, CommonModule],
      providers: [
        { provide: DataService, useClass: DataServiceMock },
        { provide: SettingsService, useClass: SettingsServiceMock },
        { provide: TranslationService, useClass: TranslationServiceMock },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RacedaySetupComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService) as unknown as DataServiceMock;
    settingsService = TestBed.inject(SettingsService) as unknown as SettingsServiceMock;
    translationService = TestBed.inject(TranslationService) as unknown as TranslationServiceMock;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load drivers and races on init', () => {
    expect(dataService.getDrivers).toHaveBeenCalled();
    expect(dataService.getRaces).toHaveBeenCalled();
    expect(component.unselectedDrivers.length + component.selectedDrivers.length).toBe(2);
    expect(component.races.length).toBe(2);
  });

  it('should apply saved settings on init', () => {
    expect(settingsService.getSettings).toHaveBeenCalled();
    expect(component.selectedDrivers.length).toBe(1);
    expect(component.selectedDrivers[0].entity_id).toBe('d1');
    expect(component.selectedRace?.entity_id).toBe('r1');
  });

  it('should filter available drivers based on search query', () => {
    component.driverSearchQuery = 'Bob';
    expect(component.filteredUnselectedDrivers.length).toBe(1);
    expect(component.filteredUnselectedDrivers[0].name).toBe('Bob');

    component.driverSearchQuery = 'NonExistent';
    expect(component.filteredUnselectedDrivers.length).toBe(0);
  });

  it('should move driver to selected list when toggled from unselected', () => {
    const driverToSelect = component.filteredUnselectedDrivers.find((d: any) => d.entity_id === 'd2')!;
    component.toggleDriverSelection(driverToSelect, false);

    expect(component.selectedDrivers.length).toBe(2);
    expect(component.selectedDrivers[1].entity_id).toBe('d2');
    expect(settingsService.saveSettings).toHaveBeenCalled();
  });

  it('should move driver to unselected list when toggled from selected', () => {
    const driverToUnselect = component.selectedDrivers[0];
    component.toggleDriverSelection(driverToUnselect, true);

    expect(component.selectedDrivers.length).toBe(0);
    expect(component.filteredUnselectedDrivers.length).toBe(2);
    expect(settingsService.saveSettings).toHaveBeenCalled();
  });

  it('should filter races based on search query', () => {
    component.raceSearchQuery = 'Time Trial';
    expect(component.filteredRaces.length).toBe(1);
    expect(component.filteredRaces[0].name).toBe('Time Trial');
  });

  it('should update selected race and save settings', () => {
    const raceToSelect = component.races.find((r: any) => r.entity_id === 'r2')!;
    component.selectRace(raceToSelect);

    expect(component.selectedRace?.entity_id).toBe('r2');
    expect(settingsService.saveSettings).toHaveBeenCalled();
    expect(component.isDropdownOpen).toBeFalse();
  });

  it('should initialize race and navigate on startRace', () => {
    component.startRace(false);

    expect(dataService.initializeRace).toHaveBeenCalledWith('r1', ['d1'], false);
    expect(router.navigate).toHaveBeenCalledWith(['/raceday']);
  });

  it('should handle demo mode on startRace', () => {
    component.startRace(true);

    expect(dataService.initializeRace).toHaveBeenCalledWith('r1', ['d1'], true);
    expect(router.navigate).toHaveBeenCalledWith(['/raceday']);
  });
});
