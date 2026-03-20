import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Component, Input, Output, EventEmitter, Pipe, PipeTransform, Directive } from '@angular/core';

@Pipe({
  name: 'translate',
  standalone: false
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Directive({
  selector: '[appSvgTextScaler]',
  standalone: false
})
class MockSvgTextScalerDirective {
  @Input() maxWidth: number = 0;
  @Input() scaleToFit: boolean = false;
}
import { DefaultRacedayComponent } from './default-raceday.component';
import { ColumnDefinition, AnchorPoint } from './column_definition';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { RaceService } from 'src/app/services/race.service';
import { Router } from '@angular/router';
import { SettingsService } from 'src/app/services/settings.service';
import { Settings, ColumnVisibility } from 'src/app/models/settings';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { com } from 'src/app/proto/message';

@Component({
  selector: 'app-acknowledgement-modal',
  template: '',
  standalone: false
})
class MockAcknowledgementModalComponent {
  @Input() visible: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() buttonText: string = '';
  @Output() acknowledge = new EventEmitter<void>();
}

@Component({
  selector: 'app-confirmation-modal',
  template: '',
  standalone: false
})
class MockConfirmationModalComponent {
  @Input() visible: boolean = false;
  @Input() titleKey: string = '';
  @Input() messageKey: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

describe('DefaultRacedayComponent', () => {
  let component: DefaultRacedayComponent;
  let fixture: ComponentFixture<DefaultRacedayComponent>;
  let mockDataService: any;
  let mockRaceService: any;
  let mockSettings: Settings;
  let interfaceEventsSubject: Subject<com.antigravity.IInterfaceEvent>;

  beforeEach(async () => {
    interfaceEventsSubject = new Subject<com.antigravity.IInterfaceEvent>();

    mockDataService = jasmine.createSpyObj('DataService', [
      'updateRaceSubscription', 'getRaceUpdate', 'getRaceTime', 'getLaps',
      'getReactionTimes', 'getStandingsUpdate', 'getOverallStandingsUpdate',
      'getInterfaceEvents', 'getRaceState', 'getDrivers',
      'connectToInterfaceDataSocket', 'disconnectFromInterfaceDataSocket',
      'listAssets', 'getCarData', 'getSegments'
    ]);
    mockDataService.getRaceUpdate.and.returnValue(of({}));
    mockDataService.listAssets.and.returnValue(of([]));
    mockDataService.getRaceTime.and.returnValue(of(0));
    mockDataService.getLaps.and.returnValue(of(null));
    mockDataService.getReactionTimes.and.returnValue(of(null));
    mockDataService.getStandingsUpdate.and.returnValue(of({}));
    mockDataService.getOverallStandingsUpdate.and.returnValue(of({}));
    mockDataService.getInterfaceEvents.and.returnValue(interfaceEventsSubject.asObservable());
    mockDataService.getRaceState.and.returnValue(of(com.antigravity.RaceState.NOT_STARTED));
    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getCarData.and.returnValue(of({}));
    mockDataService.getSegments.and.returnValue(of(null));
    mockDataService.serverUrl = 'http://localhost';

    const mockTranslationService = {
      get: (key: string) => of(key),
      translate: (key: string) => key
    };

    mockRaceService = jasmine.createSpyObj('RaceService', [
      'setRace', 'setParticipants', 'setHeats', 'setCurrentHeat', 'getRace', 'getHeats'
    ]);
    mockRaceService.getRace.and.returnValue({ name: 'Some Race Name', track: { name: 'Bright Plume Raceway', lanes: [] }, fuel_options: { enabled: false } });
    mockRaceService.getHeats.and.returnValue([]);

    mockSettings = Object.assign(new Settings(), {
      sortByStandings: true,
      racedayColumns: ['driver.nickname', 'lapCount', 'fuelPercentage'],
      columnVisibility: {
        'fuelPercentage': ColumnVisibility.FuelRaceOnly
      }
    });

    const mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      declarations: [DefaultRacedayComponent, MockAcknowledgementModalComponent, MockConfirmationModalComponent, MockTranslatePipe, MockSvgTextScalerDirective],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RaceService, useValue: mockRaceService },
        {
          provide: SettingsService, useValue: {
            getSettings: () => mockSettings,
            saveSettings: jasmine.createSpy('saveSettings')
          }
        },
        { provide: Router, useValue: mockRouter },
        ChangeDetectorRef
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultRacedayComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges(); // Removed to allow manual control in fakeAsync
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should update isInterfaceConnected when interface connects', () => {
    fixture.detectChanges();
    // Initial state
    expect((component as any).isInterfaceConnected).toBeFalse();

    // Emit connected event
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.CONNECTED }
    });

    expect((component as any).isInterfaceConnected).toBeTrue();
  });

  it('should update isInterfaceConnected when interface disconnects', () => {
    fixture.detectChanges();
    // Set to connected first
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.CONNECTED }
    });
    expect((component as any).isInterfaceConnected).toBeTrue();

    // Emit disconnected event
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    expect((component as any).isInterfaceConnected).toBeFalse();
  });

  it('should wait 5s before showing modal on NO_DATA during startup', fakeAsync(() => {
    fixture.detectChanges();
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.NO_DATA }
    });

    // Should not show immediately
    expect(component.showAckModal).toBeFalse();

    // Advance 5s
    tick(5000);

    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_NO_DATA');

    flush();
  }));

  it('should show NO_DATA immediately if already initially connected', () => {
    fixture.detectChanges();
    // Simulate initial connection success
    (component as any).hasInitiallyConnected = true;

    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.NO_DATA }
    });

    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_NO_DATA');
  });

  it('should wait 5s before showing modal on DISCONNECTED', fakeAsync(() => {
    fixture.detectChanges();
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    // Should not show immediately
    expect(component.showAckModal).toBeFalse();

    // Advance time by 2.5s
    tick(2500);
    expect(component.showAckModal).toBeFalse();

    // Emit same status to reset watchdog (but not disconnect timer)
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    // Advance remaining 2.5s (total 5s for disconnect timer)
    tick(2500);
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_DISCONNECTED');

    // Clear pending timers
    flush();
  }));

  it('should not show DISCONNECTED modal if CONNECTED before timeout', fakeAsync(() => {
    fixture.detectChanges();
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    tick(4000);
    expect(component.showAckModal).toBeFalse();

    // Reconnect
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.CONNECTED }
    });

    tick(2000); // Pass the original 5s mark
    expect(component.showAckModal).toBeFalse();
    expect(component.ackModalTitle).not.toBe('ACK_MODAL_TITLE_DISCONNECTED');

    // Clear pending timers
    flush();
  }));

  it('should show CONNECTED modal if recovered after error shown', () => {
    fixture.detectChanges();
    // Force error state
    component.showAckModal = true;
    component.ackModalTitle = 'ACK_MODAL_TITLE_DISCONNECTED';

    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.CONNECTED }
    });

    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_CONNECTED');
  });

  it('should trigger DISCONNECTED on NO_STATUS watchdog if not initially connected', fakeAsync(() => {
    fixture.detectChanges(); // Starts the watchdog in the fakeAsync zone
    // Advance time by 5s
    tick(5000);

    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_DISCONNECTED');

    // Clear pending timers
    flush();
  }));

  it('should trigger NO_STATUS on watchdog if successfully connected first', fakeAsync(() => {
    fixture.detectChanges();
    // Simulate initial connection success
    (component as any).hasInitiallyConnected = true;
    (component as any).resetWatchdog(); // Reset to clear the first watchdog timer

    tick(5000);

    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_NO_STATUS');

    flush();
  }));

  it('should ignore duplicate status updates', fakeAsync(() => {
    fixture.detectChanges();
    // First DISCONNECTED event
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    // Advance partially
    tick(2000);

    // Second DISCONNECTED event (should be ignored, timer continues from first)
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    tick(3100); // 2000 + 3100 = 5100 from start
    expect(component.showAckModal).toBeTrue();

    // If it WASN'T ignored, it might have reset the timer? 
    // Actually our implementation of scheduleDisconnectedError checks if timer exists.
    // But the `lastInterfaceStatus` check returns EARLY, effectively doing nothing.
    // So this test verifies that the logic doesn't crash or behave unexpectedly.
    // A better test for `lastInterfaceStatus` might be checking `showInterfaceError` calls count logic,
    // but verifying behavior is standard.

    flush();
  }));

  describe('isNextHeatDisabled', () => {
    it('should be disabled when state is STARTING', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.STARTING;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it('should be disabled when state is RACING', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.RACING;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it('should be enabled when state is HEAT_OVER', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.HEAT_OVER;
      expect(component.isNextHeatDisabled).toBeFalse();
    });

    it('should be disabled when state is RACE_OVER', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.RACE_OVER;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it('should be enabled when state is NOT_STARTED', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.NOT_STARTED;
      expect(component.isNextHeatDisabled).toBeFalse();
    });
  });

  describe('handleKeyUpEvent (Spacebar)', () => {
    let mockEvent: KeyboardEvent;

    beforeEach(() => {
      mockEvent = new KeyboardEvent('keyup', { code: 'Space' });
      spyOn(component, 'onMenuSelect');
      // Set connected by default to avoid disabled states
      component['isInterfaceConnected'] = true;
    });

    it('should not trigger anything when typing in an INPUT element', () => {
      const inputEl = document.createElement('input');
      document.body.appendChild(inputEl);
      inputEl.focus();

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).not.toHaveBeenCalled();
      document.body.removeChild(inputEl);
    });

    it('should trigger NEXT_HEAT when state is HEAT_OVER', () => {
      component['raceState'] = com.antigravity.RaceState.HEAT_OVER;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith('NEXT_HEAT');
    });

    it('should trigger START_RESUME when state is NOT_STARTED', () => {
      component['raceState'] = com.antigravity.RaceState.NOT_STARTED;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith('START_RESUME');
    });

    it('should trigger START_RESUME when state is PAUSED', () => {
      component['raceState'] = com.antigravity.RaceState.PAUSED;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith('START_RESUME');
    });

    it('should trigger PAUSE when state is STARTING', () => {
      component['raceState'] = com.antigravity.RaceState.STARTING;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith('PAUSE');
    });

    it('should trigger PAUSE when state is RACING', () => {
      component['raceState'] = com.antigravity.RaceState.RACING;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith('PAUSE');
    });
  });

  describe('formatValue', () => {
    let mockHd: any;

    beforeEach(() => {
      mockHd = {
        participant: {
          fuelLevel: 55.5
        },
        driver: {
          name: 'Test Driver'
        }
      };

      const mockRace = {
        fuel_options: {
          capacity: 100
        }
      };
      (component as any).raceService.getRace = jasmine.createSpy().and.returnValue(mockRace);
    });

    it('should format participant.fuelLevel directly', () => {
      const result = component.formatValue('participant.fuelLevel', mockHd.participant.fuelLevel, mockHd);
      expect(result).toBe('55.5');
    });

    it('should format participant.fuelLevel as --.- if undefined', () => {
      const result = component.formatValue('participant.fuelLevel', undefined, mockHd);
      expect(result).toBe('--.-');
    });

    it('should format fuelCapacity from the race settings', () => {
      const result = component.formatValue('fuelCapacity', null, mockHd);
      expect(result).toBe('100.0');
    });

    it('should format fuelPercentage correctly based on fuelLevel and capacity', () => {
      // 55.5 / 100 = 56% (Math.round(55.5) == 56)
      const result = component.formatValue('fuelPercentage', null, mockHd);
      expect(result).toBe('56%');
    });

    it('should format fuelPercentage as --% if capacity or level is undefined', () => {
      mockHd.participant.fuelLevel = undefined;
      const result = component.formatValue('fuelPercentage', null, mockHd);
      expect(result).toBe('--%');
    });

    it('should format driver.avatarUrl using getFullUrl', () => {
      const avatarUrl = '/assets/avatars/driver1.png';
      const result = component.formatValue('driver.avatarUrl', avatarUrl, mockHd);
      expect(result).toBe('http://localhost/assets/avatars/driver1.png');
    });

    it('should format seed in (#) format', () => {
      mockHd.participant.seed = 5;
      const result = component.formatValue('seed', 5, mockHd);
      expect(result).toBe('(5)');
    });

    it('should format rankHeat in (#) format', () => {
      component['driverRankings'].set('driverId123', 2);
      mockHd.objectId = 'driverId123';
      const result = component.formatValue('rankHeat', null, mockHd);
      expect(result).toBe('(2)');
    });

    it('should format rankOverall in (#) format', () => {
      mockHd.participant.rank = 10;
      const result = component.formatValue('rankOverall', 10, mockHd);
      expect(result).toBe('(10)');
    });

    it('should format segmentTime based on hd.currentLapSegments when useIndex is true', () => {
      mockHd.currentLapSegments = [1.111, 2.222, 3.333];

      // segmentTime_1 corresponds to index 1
      const result1 = component.formatValue('segmentTime_1', 2.222, mockHd as any);
      expect(result1).toBe('2.222');

      // segmentTime with useIndex calculated for multiple segments maps to index 0
      // In this case, we need to pass the column to formatValue to trigger the multi-segment logic
      const mockColumn = {
        propertyName: 'lastLapTime',
        layout: {
          [AnchorPoint.TopLeft]: 'segmentTime',
          [AnchorPoint.TopRight]: 'segmentTime_1'
        }
      } as any;
      const resultBase = component.formatValue('segmentTime', undefined, mockHd as any, mockColumn);
      expect(resultBase).toBe('1.111');
    });

    it('should format segmentTime as --.--- if segment is undefined', () => {
      mockHd.currentLapSegments = [1.111];
      const result = component.formatValue('segmentTime_1', undefined, mockHd as any);
      expect(result).toBe('--.---');
    });

    it('should format base segmentTime as lastSegmentTime if not in a multi-segment column', () => {
      mockHd.lastSegmentTime = 4.567;
      mockHd.currentLapSegments = [4.567];

      // No column provided, or column with only one segment
      const result = component.formatValue('segmentTime', 4.567, mockHd as any);
      expect(result).toBe('4.567');
    });
  });

  describe('loadColumns and re-indexing', () => {
    it('should re-index column layout at runtime via loadColumns', () => {
      // Setup settings with "broken" indexing (e.g. segmentTime_2 and segmentTime_3 but no 0 or 1)
      mockSettings.racedayColumns = ['testCol'];
      mockSettings.columnLayouts = {
        'testCol': {
          [AnchorPoint.TopLeft]: 'segmentTime_2',
          [AnchorPoint.TopRight]: 'segmentTime_3'
        }
      };

      const mockRace = { fuel_options: { enabled: false }, track: { lanes: [] } };
      mockRaceService.getRace.and.returnValue(mockRace);

      (component as any).loadColumns();

      const testCol = component['columns'].find(c => c.propertyName === 'testCol');
      expect(testCol).toBeDefined();
      // Should be re-indexed to segmentTime and segmentTime_1
      expect(testCol?.layout?.[AnchorPoint.TopLeft]).toBe('segmentTime');
      expect(testCol?.layout?.[AnchorPoint.TopRight]).toBe('segmentTime_1');
    });
  });

  describe('loadColumns with visibility', () => {
    it('should filter out FuelRaceOnly columns when fuel is disabled', () => {
      const mockRace = { fuel_options: { enabled: false } };
      mockRaceService.getRace.and.returnValue(mockRace);

      (component as any).loadColumns();

      expect(component['columns'].some(c => c.propertyName === 'fuelPercentage')).toBeFalse();
    });

    it('should include FuelRaceOnly columns when fuel is enabled', () => {
      const mockRace = { fuel_options: { enabled: true } };
      mockRaceService.getRace.and.returnValue(mockRace);

      (component as any).loadColumns();

      expect(component['columns'].some(c => c.propertyName === 'fuelPercentage')).toBeTrue();
    });

    it('should filter out NonFuelRaceOnly columns when fuel is enabled', () => {
      mockSettings.columnVisibility['lapCount'] = ColumnVisibility.NonFuelRaceOnly;

      const mockRace = { fuel_options: { enabled: true } };
      mockRaceService.getRace.and.returnValue(mockRace);

      (component as any).loadColumns();

      expect(component['columns'].some(c => c.propertyName === 'lapCount')).toBeFalse();
    });

    it('should return correct label key for driver.avatarUrl', () => {
      const result = (component as any).getLabelKeyForColumn('driver.avatarUrl');
      expect(result).toBe('RD_COL_AVATAR');
    });
  });

  it('should call loadColumns when loadRaceData is called', () => {
    const spy = spyOn(component as any, 'loadColumns');
    const mockRace = { track: { lanes: [] } };
    mockRaceService.getRace.and.returnValue(mockRace);

    (component as any).loadRaceData();

    expect(spy).toHaveBeenCalled();
  });

  it('should render the dynamic track name in the header', () => {
    const trackName = 'Test Raceway';
    const mockRace = {
      name: 'Any Race',
      track: {
        name: trackName,
        lanes: []
      }
    };
    mockRaceService.getRace.and.returnValue(mockRace);
    component['race'] = mockRace as any;
    component['track'] = mockRace['track'] as any;
    component['heat'] = {} as any; // Header is inside *ngIf="heat"

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const trackText = Array.from(compiled.querySelectorAll('text')).find(el => el.textContent === trackName);
    expect(trackText).toBeTruthy();
    expect(trackText?.textContent).toBe(trackName);
  });

  it('should render the dynamic race name in the header', () => {
    const raceName = 'Test Championship';
    const mockRace = {
      name: raceName,
      track: {
        name: 'Any Track',
        lanes: []
      }
    };
    mockRaceService.getRace.and.returnValue(mockRace);
    component['race'] = mockRace as any;
    component['track'] = mockRace['track'] as any;
    component['heat'] = {} as any;

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const raceText = Array.from(compiled.querySelectorAll('text')).find(el => el.textContent === raceName);
    expect(raceText).toBeTruthy();
    expect(raceText?.textContent).toBe(raceName);
  });

  describe('Digital Fuel Support', () => {
    it('should include fuel columns for digital fuel races', () => {
      const mockTrack = { hasDigitalFuel: () => true, hasAnalogFuel: () => false, lanes: [] };
      const mockRace = {
        digital_fuel_options: { enabled: true },
        fuel_options: { enabled: false },
        track: mockTrack
      };
      mockRaceService.getRace.and.returnValue(mockRace);
      component['track'] = mockTrack as any;

      (component as any).loadColumns();

      expect(component['columns'].some(c => c.propertyName === 'fuelPercentage')).toBeTrue();
    });

    it('should use digital fuel capacity for formatting', () => {
      const mockTrack = { hasDigitalFuel: () => true, hasAnalogFuel: () => false, lanes: [] };
      const mockRace = {
        digital_fuel_options: { enabled: true, capacity: 50 },
        fuel_options: { enabled: false, capacity: 100 },
        track: mockTrack
      };
      mockRaceService.getRace.and.returnValue(mockRace);
      component['track'] = mockTrack as any;

      const mockHd = { participant: { fuelLevel: 25 } };
      const result = component.formatValue('fuelCapacity', null, mockHd as any);
      expect(result).toBe('50.0');
    });

    it('should calculate fuel percentage using digital fuel options', () => {
      const mockTrack = { hasDigitalFuel: () => true, hasAnalogFuel: () => false, lanes: [] };
      const mockRace = {
        digital_fuel_options: { enabled: true, capacity: 50 },
        fuel_options: { enabled: false, capacity: 100 },
        track: mockTrack
      };
      mockRaceService.getRace.and.returnValue(mockRace);
      component['track'] = mockTrack as any;

      const mockHd = { participant: { fuelLevel: 25 } };
      // 25 / 50 = 50%
      const result = component.formatValue('fuelPercentage', null, mockHd as any);
      expect(result).toBe('50%');
    });
  });

  describe('Velocity Columns', () => {
    beforeEach(() => {
      const mockTrack = {
        lanes: [
          { length: 60 } // 60 feet
        ]
      };
      component['track'] = mockTrack as any;
    });

    it('should calculate FPH correctly', () => {
      const mockHd = { laneIndex: 0, lastLapTime: 10.0 };
      // FPH = (60 / 10) * 3600 = 6 * 3600 = 21600
      const result = component.formatValue('fph', null, mockHd as any);
      expect(result).toBe('21600');
    });

    it('should calculate MPH correctly', () => {
      const mockHd = { laneIndex: 0, lastLapTime: 10.0 };
      // MPH = 21600 / 5280 = 4.0909...
      const result = component.formatValue('mph', null, mockHd as any);
      expect(result).toBe('4.09');
    });

    it('should calculate KPH correctly', () => {
      const mockHd = { laneIndex: 0, lastLapTime: 10.0 };
      // KPH = 4.0909... * 1.609344 = 6.5836...
      const result = component.formatValue('kph', null, mockHd as any);
      expect(result).toBe('6.58');
    });

    it('should return default placeholder if lastLapTime is 0 or missing', () => {
      const mockHd = { laneIndex: 0, lastLapTime: 0 };
      expect(component.formatValue('fph', null, mockHd as any)).toBe('--.--');
      expect(component.formatValue('mph', null, { ...mockHd, lastLapTime: undefined } as any)).toBe('--.--');
    });

    it('should return correct label keys for velocity columns', () => {
      expect((component as any).getLabelKeyForColumn('mph')).toBe('RD_COL_MPH');
      expect((component as any).getLabelKeyForColumn('kph')).toBe('RD_COL_KPH');
      expect((component as any).getLabelKeyForColumn('fph')).toBe('RD_COL_FPH');
    });

    it('should have correct default fixed widths for velocity columns', () => {
      // Include a name column so it becomes the resizing column, leaving others as fixed
      mockSettings.racedayColumns = ['driver.name', 'mph', 'kph', 'fph'];
      (component as any).loadColumns();

      const mphLoaded = component['columns'].find(c => c.propertyName === 'mph');
      const kphLoaded = component['columns'].find(c => c.propertyName === 'kph');
      const fphLoaded = component['columns'].find(c => c.propertyName === 'fph');

      expect(mphLoaded?.width).toBe(275);
      expect(kphLoaded?.width).toBe(275);
      expect(fphLoaded?.width).toBe(275);
    });
  });

  describe('Lap Highlighting', () => {
    let lapsSubject: Subject<com.antigravity.ILap>;

    beforeEach(() => {
      lapsSubject = new Subject<com.antigravity.ILap>();
      mockDataService.getLaps.and.returnValue(lapsSubject.asObservable());

      const mockHd = { objectId: 'driver1', laneIndex: 0, driver: { lapAudio: {}, bestLapAudio: {} }, addLapTime: () => { } };
      const mockHeat = { heatDrivers: [mockHd], heatNumber: 1 };
      component['heat'] = mockHeat as any;
      component['track'] = { name: 'Test Track', lanes: [{ background_color: 'red' }] } as any;
      component['race'] = { name: 'Test Race' } as any;

      fixture.detectChanges();
    });

    it('should highlight driver when lap is received and enabled', fakeAsync(() => {
      mockSettings.highlightRowOnLap = true;

      lapsSubject.next({ objectId: 'driver1', lapTime: 1.234, bestLapTime: 1.000 });
      fixture.detectChanges();

      expect(component['highlightedDrivers'].has('driver1')).toBeTrue();

      tick(400);
      expect(component['highlightedDrivers'].has('driver1')).toBeFalse();
    }));

    it('should not highlight driver when lap is received but disabled', fakeAsync(() => {
      mockSettings.highlightRowOnLap = false;

      lapsSubject.next({ objectId: 'driver1', lapTime: 1.234, bestLapTime: 1.000 });
      fixture.detectChanges();

      expect(component['highlightedDrivers'].has('driver1')).toBeFalse();
    }));
  });
});
