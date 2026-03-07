import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RacedaySetupComponent } from './raceday-setup.component';
import { FileSystemService } from 'src/app/services/file-system.service';
import { Compiler, Injector, ChangeDetectorRef } from '@angular/core';
import { SharedModule } from 'src/app/components/shared/shared.module';
import { DataService } from 'src/app/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { DynamicComponentService } from 'src/app/services/dynamic-component.service';
import { BehaviorSubject, of } from 'rxjs';

import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService, ConnectionState } from 'src/app/services/connection-monitor.service';
import { Settings } from 'src/app/models/settings';

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
    sessionStorage.clear();
    mockFileSystemService = jasmine.createSpyObj('FileSystemService', ['selectCustomFolder', 'hasCustomFiles', 'getCustomFile']);
    mockContainer = jasmine.createSpyObj('ViewContainerRef', ['clear', 'createComponent']);
    mockContainer.createComponent.and.returnValue({
      instance: {
        requestServerConfig: { subscribe: () => { } },
        requestAbout: { subscribe: () => { } }
      }
    });
    mockDataService = jasmine.createSpyObj('DataService', ['getDrivers', 'setServerAddress', 'getServerVersion']);
    mockSettingsService = jasmine.createSpyObj('SettingsService', ['getSettings', 'saveSettings']);
    mockDynamicComponentService = jasmine.createSpyObj('DynamicComponentService', ['createDynamicComponent']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['getTranslationsLoaded', 'translate']);

    connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.CONNECTED);
    mockConnectionMonitor = jasmine.createSpyObj('ConnectionMonitorService', ['startMonitoring', 'stopMonitoring', 'waitForConnection', 'checkConnection']);
    Object.defineProperty(mockConnectionMonitor, 'connectionState$', { get: () => connectionStateSubject.asObservable() });

    mockConnectionMonitor.waitForConnection.and.returnValue(Promise.resolve());
    mockConnectionMonitor.checkConnection.and.returnValue(of(true));

    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getServerVersion.and.returnValue(of('0.0.0'));
    mockSettingsService.getSettings.and.returnValue(new Settings());
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
    mockTranslationService.translate.and.callFake((key: string) => key);
    mockTranslationService.getBrowserLanguage = jasmine.createSpy().and.returnValue('en');
    mockTranslationService.getSupportedLanguages = jasmine.createSpy().and.returnValue([]);

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
      expect(component.connectionVerified).toBeTrue();
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
      tick(6000);
      expect(component.isConnectionLost).toBeFalse();
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();
      expect(component.isConnectionLost).toBeTrue();
    }));

    it('should react to connection restoration from service', fakeAsync(() => {
      component.ngOnInit();
      tick(6000);
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();
      expect(component.isConnectionLost).toBeTrue();
      connectionStateSubject.next(ConnectionState.CONNECTED);
      tick();
      expect(component.isConnectionLost).toBeFalse();
    }));

    it('should reset to splash if connection lost for too long', fakeAsync(() => {
      component.ngOnInit();
      tick(6000);
      mockConnectionMonitor.waitForConnection.and.returnValue(new Promise(() => { }));
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();
      tick(6000);
      expect(component.showSplash).toBeTrue();
      expect(component.connectionVerified).toBeFalse();
      expect(mockConnectionMonitor.waitForConnection).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Server Configuration UI', () => {
    it('should manually check connection on save config', fakeAsync(() => {
      component.saveServerConfig();
      expect(mockConnectionMonitor.checkConnection).toHaveBeenCalled();
      expect(mockConnectionMonitor.waitForConnection).toHaveBeenCalled();
    }));
  });

  describe('Dynamic Component Interaction', () => {
    it('should listen to requestServerConfig from default component', fakeAsync(() => {
      mockContainer.createComponent.and.returnValue({
        instance: {
          requestServerConfig: { subscribe: (callback: any) => { callback(); return { unsubscribe: () => { } }; } },
          requestAbout: { subscribe: () => { } }
        }
      });
      mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(false));
      component.ngOnInit();
      tick(6000);
      expect(component.showServerConfig).toBeTrue();
    }));

    it('should listen to requestAbout from default component', fakeAsync(() => {
      mockContainer.createComponent.and.returnValue({
        instance: {
          requestServerConfig: { subscribe: () => { } },
          requestAbout: { subscribe: (callback: any) => { callback(); return { unsubscribe: () => { } }; } }
        }
      });
      mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(false));
      component.ngOnInit();
      tick(6000);
      expect(component.showAboutDialog).toBeTrue();
    }));
  });

  it('should load default component if no custom files', fakeAsync(() => {
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(false));
    mockContainer.createComponent.and.returnValue({
      instance: {
        requestServerConfig: { subscribe: () => { } },
        requestAbout: { subscribe: () => { } }
      }
    });
    component.ngOnInit();
    tick(6000);
    expect(mockContainer.createComponent).toHaveBeenCalled();
  }));
});
