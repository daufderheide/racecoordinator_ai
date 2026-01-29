import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { RacedaySetupComponent } from './raceday-setup.component';
import { FileSystemService } from 'src/app/services/file-system.service';
import { Compiler, Injector, ChangeDetectorRef } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { DataService } from 'src/app/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { DynamicComponentService } from 'src/app/services/dynamic-component.service';
import { BehaviorSubject, of, throwError } from 'rxjs'; // For mocking Observables

import { TranslationService } from 'src/app/services/translation.service'; // Import TranslationService
import { ConnectionMonitorService, ConnectionState } from 'src/app/services/connection-monitor.service';

describe('RacedaySetupComponent', () => {
  let component: RacedaySetupComponent;
  let fixture: ComponentFixture<RacedaySetupComponent>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;
  let mockContainer: jasmine.SpyObj<any>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockDynamicComponentService: jasmine.SpyObj<DynamicComponentService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;

  beforeEach(() => {
    mockFileSystemService = jasmine.createSpyObj('FileSystemService', ['selectCustomFolder', 'hasCustomFiles', 'getCustomFile']);
    mockContainer = jasmine.createSpyObj('ViewContainerRef', ['clear', 'createComponent']);
    mockContainer.createComponent.and.returnValue({
      instance: { requestServerConfig: { subscribe: () => { } } }
    });
    mockDataService = jasmine.createSpyObj('DataService', ['getDrivers', 'setServerAddress']);
    mockSettingsService = jasmine.createSpyObj('SettingsService', ['getSettings', 'saveSettings']);
    mockDynamicComponentService = jasmine.createSpyObj('DynamicComponentService', ['createDynamicComponent']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['getTranslationsLoaded', 'translate']);

    connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.CONNECTED);
    mockConnectionMonitor = jasmine.createSpyObj('ConnectionMonitorService', ['startMonitoring', 'stopMonitoring', 'waitForConnection', 'checkConnection']);
    Object.defineProperty(mockConnectionMonitor, 'connectionState$', { get: () => connectionStateSubject.asObservable() });

    mockConnectionMonitor.waitForConnection.and.returnValue(Promise.resolve());
    mockConnectionMonitor.checkConnection.and.returnValue(of(true));

    // Default mocks
    mockDataService.getDrivers.and.returnValue(of([]));
    mockSettingsService.getSettings.and.returnValue({ recentRaceIds: [], selectedDriverIds: [], serverIp: 'localhost', serverPort: 7070 });
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
    mockTranslationService.translate.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      declarations: [RacedaySetupComponent],
      providers: [
        { provide: FileSystemService, useValue: mockFileSystemService },
        { provide: Compiler, useValue: { compileModuleAsync: () => Promise.resolve({ create: () => ({ componentFactoryResolver: { resolveComponentFactory: () => { } } }) }) } },
        { provide: Injector, useValue: {} },
        { provide: ChangeDetectorRef, useValue: { detectChanges: () => { } } },
        { provide: DataService, useValue: mockDataService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: DynamicComponentService, useValue: mockDynamicComponentService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor }
      ],
      imports: [SharedModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RacedaySetupComponent);
    component = fixture.componentInstance;
    component.container = mockContainer;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Splash Screen Logic', () => {
    it('should initialize with splash screen showing', () => {
      expect(component.showSplash).toBeTrue();
      expect(component.minTimeElapsed).toBeFalse();
      expect(component.connectionVerified).toBeFalse();
    });

    it('should wait for minimum time and connection service before hiding splash', fakeAsync(() => {
      component.ngOnInit();

      tick(100);
      // connectionMonitor.waitForConnection resolves immediately in mock
      expect(component.connectionVerified).toBeTrue();

      // Still need wait for 5s min time
      expect(component.minTimeElapsed).toBeFalse();

      tick(5000);
      expect(component.minTimeElapsed).toBeTrue();
      expect(component.showSplash).toBeFalse();

      expect(mockConnectionMonitor.startMonitoring).toHaveBeenCalled();
    }));
  });

  describe('Connection Monitoring', () => {
    it('should react to connection loss from service', fakeAsync(() => {
      component.ngOnInit();
      tick(6000); // Wait for init

      expect(component.isConnectionLost).toBeFalse();

      // Simulate loss from service
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();

      expect(component.isConnectionLost).toBeTrue();
    }));

    it('should react to connection restoration from service', fakeAsync(() => {
      component.ngOnInit();
      tick(6000);

      // Lost
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();
      expect(component.isConnectionLost).toBeTrue();

      // Restored
      connectionStateSubject.next(ConnectionState.CONNECTED);
      tick();
      expect(component.isConnectionLost).toBeFalse();
    }));

    it('should reset to splash if connection lost for too long', fakeAsync(() => {
      component.ngOnInit();
      tick(6000);

      // Force the NEXT call to waitForConnection (called by resetToSplash) to NOT resolve immediately
      mockConnectionMonitor.waitForConnection.and.returnValue(new Promise(() => { }));

      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();

      // Wait 5 seconds (plus a bit for buffer)
      tick(6000);

      // Should have reset to splash
      expect(component.showSplash).toBeTrue();
      expect(component.connectionVerified).toBeFalse();
      expect(mockConnectionMonitor.waitForConnection).toHaveBeenCalledTimes(2); // once at init, once at reset
    }));
  });

  describe('Server Configuration UI', () => {
    it('should manually check connection on save config', fakeAsync(() => {
      component.saveServerConfig();
      expect(mockConnectionMonitor.checkConnection).toHaveBeenCalled();
      expect(mockConnectionMonitor.waitForConnection).toHaveBeenCalled();
    }));
  });

  // Keep other tests largely as is if they don't depend on connection internals
  describe('Dynamic Component Interaction', () => {
    it('should listen to requestServerConfig from default component', fakeAsync(() => {
      const mockEventEmitter = {
        subscribe: jasmine.createSpy('subscribe').and.callFake((callback: any) => {
          callback();
          return { unsubscribe: () => { } };
        })
      };

      const mockComponentInstance = {
        requestServerConfig: mockEventEmitter
      };

      mockContainer.createComponent.and.returnValue({
        instance: mockComponentInstance
      });

      mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(false));

      component.ngOnInit();
      tick(6000);

      expect(component.showServerConfig).toBeTrue();
    }));
  });

  it('should load default component if no custom files', fakeAsync(() => {
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(false));

    // Ensure createComponent returns a dummy with the internal structure we expect now
    mockContainer.createComponent.and.returnValue({
      instance: { requestServerConfig: { subscribe: () => { } } }
    });

    component.ngOnInit();

    // Wait for connection and min time
    tick(6000);

    expect(mockContainer.createComponent).toHaveBeenCalled();
  }));
});
