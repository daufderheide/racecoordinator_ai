import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DriverManagerComponent } from './driver-manager.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { Driver } from 'src/app/models/driver';
import { SharedModule } from 'src/app/shared/shared.module';
import { BackButtonComponent } from 'src/app/components/shared/back-button/back-button.component';

import { AvatarUrlPipe } from 'src/app/pipes/avatar-url.pipe';

describe('DriverManagerComponent', () => {
  let component: DriverManagerComponent;
  let fixture: ComponentFixture<DriverManagerComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;
  let mockActivatedRoute: any;

  const mockDrivers = [
    new Driver('d1', 'Alice', 'Rocket', 'url1'),
    new Driver('d2', 'Bob', 'Drifter', 'url2')
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['getDrivers', 'deleteDriver']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockConnectionMonitor = jasmine.createSpyObj('ConnectionMonitorService', ['startMonitoring', 'stopMonitoring']);
    connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.CONNECTED);
    Object.defineProperty(mockConnectionMonitor, 'connectionState$', { get: () => connectionStateSubject.asObservable() });

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    mockDataService.getDrivers.and.returnValue(of(mockDrivers));
    mockTranslationService.translate.and.callFake((key) => key);

    await TestBed.configureTestingModule({
      declarations: [DriverManagerComponent, AvatarUrlPipe],
      imports: [SharedModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        ChangeDetectorRef
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load drivers on init', () => {
      expect(mockDataService.getDrivers).toHaveBeenCalled();
      expect(component.drivers.length).toBe(2);
      expect(component.filteredDrivers.length).toBe(2);
    });

    it('should select first driver by default if no query param', () => {
      expect(component.selectedDriver).toEqual(component.drivers[0]);
      expect(component.editingDriver).toBeDefined();
      expect(component.editingDriver?.name).toBe('Alice');
    });

    it('should select driver from query param', () => {
      // Need to recreate component to inject different route
      TestBed.resetTestingModule();
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('d2');

      TestBed.configureTestingModule({
        declarations: [DriverManagerComponent, AvatarUrlPipe],
        imports: [SharedModule],
        providers: [
          { provide: DataService, useValue: mockDataService },
          { provide: TranslationService, useValue: mockTranslationService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
          ChangeDetectorRef
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(DriverManagerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.selectedDriver?.entity_id).toBe('d2');
    });
  });

  describe('Driver Selection', () => {
    it('should update selected and editing driver on select', () => {
      component.selectDriver(mockDrivers[1]);
      expect(component.selectedDriver?.entity_id).toBe('d2');
      expect(component.editingDriver).toBeDefined();
      expect(component.editingDriver?.entity_id).toBe('d2');
      // Ensure deep copy
      expect(component.editingDriver).not.toBe(component.selectedDriver);
    });
  });

  describe('Filtering', () => {
    it('should filter drivers by name', () => {
      component.searchQuery = 'ali'; // Should match Alice
      expect(component.filteredDrivers.length).toBe(1);
      expect(component.filteredDrivers[0].name).toBe('Alice');
    });

    it('should filter drivers by nickname', () => {
      component.searchQuery = 'drift'; // Should match Bob (Drifter)
      expect(component.filteredDrivers.length).toBe(1);
      expect(component.filteredDrivers[0].name).toBe('Bob');
    });

    it('should show all drivers if query is empty', () => {
      component.searchQuery = '';
      expect(component.filteredDrivers.length).toBe(2);
    });
  });

  describe('Navigation', () => {
    it('should navigate to editor on edit', () => {
      component.selectDriver(mockDrivers[0]);
      component.updateDriver();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/driver-editor'], {
        queryParams: { id: 'd1' }
      });
    });
  });

  describe('Deletion', () => {
    it('should delete driver if confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockDataService.deleteDriver.and.returnValue(of({}));

      component.selectDriver(mockDrivers[0]);
      component.deleteDriver();

      expect(window.confirm).toHaveBeenCalled();
      expect(mockDataService.deleteDriver).toHaveBeenCalledWith('d1');
      expect(mockDataService.getDrivers).toHaveBeenCalledTimes(2); // Once on init, once after delete re-load
    });

    it('should not delete driver if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.selectDriver(mockDrivers[0]);
      component.deleteDriver();

      expect(window.confirm).toHaveBeenCalled();
      expect(mockDataService.deleteDriver).not.toHaveBeenCalled();
    });
  });

  describe('Connection Monitoring', () => {
    it('should update isConnectionLost based on service', () => {
      expect(component.isConnectionLost).toBeFalse();
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      expect(component.isConnectionLost).toBeTrue();
      connectionStateSubject.next(ConnectionState.CONNECTED);
      expect(component.isConnectionLost).toBeFalse();
    });
  });
});
