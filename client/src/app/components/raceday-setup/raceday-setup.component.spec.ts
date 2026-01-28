
import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { RacedaySetupComponent } from './raceday-setup.component';
import { FileSystemService } from 'src/app/services/file-system.service';
import { Compiler, Injector, ChangeDetectorRef } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { DataService } from 'src/app/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { DynamicComponentService } from 'src/app/services/dynamic-component.service';
import { of, throwError } from 'rxjs'; // For mocking Observables

import { TranslationService } from 'src/app/services/translation.service'; // Import TranslationService

describe('RacedaySetupComponent', () => {
  let component: RacedaySetupComponent;
  let fixture: ComponentFixture<RacedaySetupComponent>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;
  let mockContainer: jasmine.SpyObj<any>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockDynamicComponentService: jasmine.SpyObj<DynamicComponentService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>; // Spy for TranslationService

  beforeEach(() => {
    mockFileSystemService = jasmine.createSpyObj('FileSystemService', ['selectCustomFolder', 'hasCustomFiles', 'getCustomFile']);
    mockContainer = jasmine.createSpyObj('ViewContainerRef', ['clear', 'createComponent']);
    mockContainer.createComponent.and.returnValue({
      instance: { requestServerConfig: { subscribe: () => { } } }
    });
    mockDataService = jasmine.createSpyObj('DataService', ['getDrivers', 'setServerAddress']);
    mockSettingsService = jasmine.createSpyObj('SettingsService', ['getSettings', 'saveSettings']);
    mockDynamicComponentService = jasmine.createSpyObj('DynamicComponentService', ['createDynamicComponent']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['getTranslationsLoaded', 'translate']); // Add translate method

    // Default mocks
    mockDataService.getDrivers.and.returnValue(of([]));
    mockSettingsService.getSettings.and.returnValue({ recentRaceIds: [], selectedDriverIds: [], serverIp: 'localhost', serverPort: 7070 });
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true)); // Emit loaded immediately
    mockTranslationService.translate.and.callFake((key: string) => key); // Return key as translation

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
        { provide: TranslationService, useValue: mockTranslationService } // Provide mock
      ],
      imports: [SharedModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RacedaySetupComponent);
    component = fixture.componentInstance;

    // Mock the ViewContainerRef
    component.container = mockContainer;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Splash Screen Logic', () => {
    // ... existing tests ...

    it('should initialize with splash screen showing', () => {
      expect(component.showSplash).toBeTrue();
      expect(component.minTimeElapsed).toBeFalse();
      expect(component.connectionVerified).toBeFalse();
    });

    it('should wait for minimum time before hiding splash', fakeAsync(() => {
      mockDataService.getDrivers.and.returnValue(of([]));

      // ngOnInit handles the orchestration
      component.ngOnInit();

      // We rely on component.waitForConnection logic which is async.
      // tick() will advance time for timers.
      tick(100);
      expect(component.connectionVerified).toBeTrue();

      // Still need to wait for 5s min time
      expect(component.minTimeElapsed).toBeFalse();
      expect(component.showSplash).toBeTrue();

      tick(5000);
      expect(component.minTimeElapsed).toBeTrue();

      // Need to resolve the promises in ngOnInit
      tick();
      expect(component.showSplash).toBeFalse();
    }));

    it('should wait for connection before hiding splash', fakeAsync(() => {
      let shouldFail = true;
      mockDataService.getDrivers.and.callFake(() => {
        if (shouldFail) {
          return throwError(() => new Error('Connection failed'));
        }
        return of([]);
      });

      component.ngOnInit();

      // Advance past min time
      tick(5000);

      expect(component.minTimeElapsed).toBeTrue();
      // Should still show splash because connection is forcing failure (retries every 1s)
      expect(component.connectionVerified).toBeFalse();
      expect(component.showSplash).toBeTrue();

      // Check current quote matches pattern
      expect(component.currentQuoteKey).toMatch(/RDS_QUOTE_\d+/);

      // Now allow connection to succeed
      shouldFail = false;

      // Advance 2s to catch next retry
      tick(2000);

      expect(component.connectionVerified).toBeTrue();

      tick(); // Flush promises
      expect(component.showSplash).toBeFalse();
    }));

    it('should rotate quotes every 15 seconds', fakeAsync(() => {
      mockDataService.getDrivers.and.returnValue(throwError(() => new Error('Conn failed')));
      component.ngOnInit();
      tick(500); // Allow initial quote fade-in (setTimeout in rotateQuote)

      const initialQuote = component.currentQuoteKey;
      expect(initialQuote).toMatch(/RDS_QUOTE_\d+/);

      tick(15000); // Updated to 15s
      expect(component.currentQuoteKey).not.toEqual(initialQuote);
      expect(component.currentQuoteKey).toMatch(/RDS_QUOTE_\d+/);

      component.stopQuoteRotation();
      discardPeriodicTasks();
    }));

    it('should rotate quote on click and reset timer', fakeAsync(() => {
      mockDataService.getDrivers.and.returnValue(throwError(() => new Error('Conn failed')));
      component.ngOnInit();
      tick(500); // Allow initial quote fade-in

      const initialQuote = component.currentQuoteKey;

      // Fast forward 5s, no change
      tick(5000);
      expect(component.currentQuoteKey).toBe(initialQuote);

      // User clicks
      component.onQuoteClick();
      tick(500); // Allow quote transition
      const newQuote = component.currentQuoteKey;
      expect(newQuote).not.toBe(initialQuote);

      // Fast forward 10s (total 15s from start, 10s from click) - should wait
      tick(10000);
      expect(component.currentQuoteKey).toBe(newQuote);

      // Fast forward 5s more (total 15s from click) - should rotate
      tick(5000);
      expect(component.currentQuoteKey).not.toBe(newQuote);

      component.stopQuoteRotation();
      discardPeriodicTasks();
    }));
  });

  describe('Server Configuration UI', () => {
    it('should toggle server configuration visibility', () => {
      expect(component.showServerConfig).toBeFalse();
      component.toggleServerConfig();
      expect(component.showServerConfig).toBeTrue();
      component.toggleServerConfig();
      expect(component.showServerConfig).toBeFalse();
    });

    it('should initialize server settings from SettingsService', fakeAsync(() => {
      // Use fakeAsync instead of async/await because ngOnInit is complex
      mockSettingsService.getSettings.and.returnValue({ serverIp: '192.168.1.100', serverPort: 8888, recentRaceIds: [], selectedDriverIds: [] });
      mockDataService.getDrivers.and.returnValue(throwError(() => new Error('Stop loop'))); // return error to not infinite loop if waitForConnection is called

      // We just want to check top of ngOnInit logic
      component.ngOnInit();

      expect(component.tempServerIp).toBe('192.168.1.100');
      expect(component.tempServerPort).toBe(8888);
      expect(mockDataService.setServerAddress).toHaveBeenCalledWith('192.168.1.100', 8888);

      // Clean up timers
      discardPeriodicTasks();
    }));

    it('should save server settings and retry connection', fakeAsync(() => {
      component.tempServerIp = '10.0.0.50';
      component.tempServerPort = 9090;
      mockSettingsService.getSettings.and.returnValue({ recentRaceIds: [], selectedDriverIds: [], serverIp: 'localhost', serverPort: 7070 });

      spyOn(component, 'waitForConnection');

      component.saveServerConfig();

      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith(jasmine.objectContaining({
        serverIp: '10.0.0.50',
        serverPort: 9090
      }));
      expect(mockDataService.setServerAddress).toHaveBeenCalledWith('10.0.0.50', 9090);
      expect(component.showServerConfig).toBeFalse();
      expect(component.connectionVerified).toBeFalse();
      expect(component.waitForConnection).toHaveBeenCalled();
    }));
  });

  describe('Connection Monitoring', () => {
    beforeEach(() => {
      // Ensure initial state is clean
      component.isConnectionLost = false;
      component.stopConnectionMonitoring();
    });

    it('should start connection monitoring after successful connection', fakeAsync(() => {
      // Setup successful connection
      mockDataService.getDrivers.and.returnValue(of([]));
      spyOn(component, 'startConnectionMonitoring').and.callThrough();

      component.ngOnInit();
      tick(6000); // Wait for min time + init

      expect(component.connectionVerified).toBeTrue();
      expect(component.showSplash).toBeFalse();
      expect(component.startConnectionMonitoring).toHaveBeenCalled();

      // Check if interval is correctly calling checkConnection
      spyOn(component, 'checkConnection');
      tick(5000);
      expect(component.checkConnection).toHaveBeenCalled();

      component.stopConnectionMonitoring();
    }));

    it('should handle connection loss', fakeAsync(() => {
      // Manually trigger handleConnectionLoss
      spyOn(component, 'retryConnection');
      component.handleConnectionLoss();

      expect(component.isConnectionLost).toBeTrue();
      expect(component.retryConnection).toHaveBeenCalled();
    }));

    it('should retry connection and recover if successful', fakeAsync(() => {
      component.isConnectionLost = true;
      component['retryStartTime'] = Date.now(); // Access private prop if needed or just let logic handle it

      // Mock success on getDrivers
      mockDataService.getDrivers.and.returnValue(of([]));
      spyOn(component, 'startConnectionMonitoring'); // Spy to verify it restarts

      component.retryConnection();
      tick(); // Process Observable

      expect(component.isConnectionLost).toBeFalse();
      expect(component.startConnectionMonitoring).toHaveBeenCalled();
    }));

    it('should fallback to splash screen if retry times out', fakeAsync(() => {
      component.isConnectionLost = true;
      // Mock a time in the past for start time to force timeout
      // We can't easily mock Date.now() without swaying the test runner's clock, 
      // implies we might update the test to set retryStartTime manually.
      component['retryStartTime'] = Date.now() - 6000;

      // spyOn to return a pending Promise to simulate the 'waiting' state
      spyOn(component, 'waitForConnection').and.returnValue(new Promise(() => { }));

      component.retryConnection();
      // retryConnection calls waitForConnection().then(...), so we need to tick to resolve that microtask
      tick();

      expect(component.isConnectionLost).toBeFalse();
      expect(component.showSplash).toBeTrue();
      expect(component.connectionVerified).toBeFalse();
      expect(component.waitForConnection).toHaveBeenCalled();
    }));
  });

  describe('Dynamic Component Interaction', () => {
    it('should listen to requestServerConfig from default component', fakeAsync(() => {
      const mockEventEmitter = {
        subscribe: jasmine.createSpy('subscribe').and.callFake((callback: any) => {
          // Immediately trigger callback to simulate event
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

      // Setup component to reach the loading phase
      mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(false));
      mockDataService.getDrivers.and.returnValue(of([]));

      component.ngOnInit();
      tick(6000);

      expect(component.showServerConfig).toBeTrue();
    }));
  });

  it('should load default component if no custom files', fakeAsync(() => {
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(false));
    mockDataService.getDrivers.and.returnValue(of([]));

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
