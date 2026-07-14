import { ChangeDetectorRef, Compiler, Injector } from "@angular/core";
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from "@angular/core/testing";
import { Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { Settings } from "@app/models/settings";
import { RaceFlag } from "@app/proto/antigravity";
import { AuthService } from "@app/services/auth.service";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { DynamicComponentService } from "@app/services/dynamic-component.service";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { UpdateService } from "@app/services/update.service";

import { RacedaySetupComponent } from "./raceday-setup.component";

describe("RacedaySetupComponent", () => {
  let component: RacedaySetupComponent;
  let fixture: ComponentFixture<RacedaySetupComponent>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;
  let mockContainer: jasmine.SpyObj<any>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockDynamicComponentService: jasmine.SpyObj<DynamicComponentService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let mockAnalyticsService: jasmine.SpyObj<AnalyticsService>;
  let mockLoggerService: jasmine.SpyObj<LoggerService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNavigationService: jasmine.SpyObj<NavigationService>;
  let mockUpdateService: jasmine.SpyObj<UpdateService>;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;

  beforeEach(() => {
    sessionStorage.clear();
    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockNavigationService = jasmine.createSpyObj("NavigationService", [
      "getPreviousUrl",
      "getDirection",
    ]);
    mockNavigationService.getPreviousUrl.and.returnValue(null);
    mockFileSystemService = jasmine.createSpyObj("FileSystemService", [
      "selectCustomFolder",
      "hasCustomFiles",
      "getCustomFile",
    ]);
    mockContainer = jasmine.createSpyObj("ViewContainerRef", [
      "clear",
      "createComponent",
    ]);
    mockContainer.createComponent.and.returnValue({
      instance: {
        requestServerConfig: { subscribe: () => {} },
        requestAbout: { subscribe: () => {} },
      },
    });
    mockDataService = jasmine.createSpyObj("DataService", [
      "getDrivers",
      "setServerAddress",
      "getServerVersion",
      "getServerIp",
      "getRaceFlag",
      "getSystemState",
    ]);
    mockDataService.getSystemState.and.returnValue(of({} as any));
    mockSettingsService = jasmine.createSpyObj("SettingsService", [
      "getSettings",
      "saveSettings",
    ]);
    mockDynamicComponentService = jasmine.createSpyObj(
      "DynamicComponentService",
      ["createDynamicComponent"],
    );
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "getTranslationsLoaded",
      "translate",
    ]);
    mockAnalyticsService = jasmine.createSpyObj("AnalyticsService", [
      "trackEvent",
      "initTracking",
      "updateOptOutStatus",
      "trackClick",
    ]);
    mockLoggerService = jasmine.createSpyObj("LoggerService", [
      "debug",
      "info",
      "warn",
      "error",
      "log",
    ]);

    mockAuthService = jasmine.createSpyObj("AuthService", [
      "loginAsDirector",
      "changeDirectorPassword",
      "getDirectorPassword",
      "logout",
      "fetchRoleFromServer",
    ]);
    Object.defineProperty(mockAuthService, "currentRole", {
      get: () => Role.ADMIN,
      configurable: true,
    });
    mockAuthService.loginAsDirector.and.returnValue(of(true));
    mockAuthService.fetchRoleFromServer.and.returnValue(of(Role.VIEWER));
    Object.defineProperty(mockAuthService, "currentRole$", {
      get: () => of(Role.ADMIN),
      configurable: true,
    });
    Object.defineProperty(mockAuthService, "roleInitialized$", {
      get: () => of(true),
    });
    mockAuthService.loginAsDirector.and.returnValue(of(true));
    mockAuthService.changeDirectorPassword.and.returnValue(of(true));
    mockAuthService.getDirectorPassword.and.returnValue(of(""));
    mockAuthService.fetchRoleFromServer.and.returnValue(of(Role.ADMIN));

    mockUpdateService = jasmine.createSpyObj("UpdateService", [
      "checkForUpdates",
      "installUpdate",
      "skipUpdate",
    ]);
    mockUpdateService.checkForUpdates.and.returnValue(
      of({
        updateAvailable: false,
        latestVersion: "",
        downloadUrl: "",
        releaseNotes: "",
        releaseUrl: "",
        isWindows: false,
      }),
    );

    connectionStateSubject = new BehaviorSubject<ConnectionState>(
      ConnectionState.CONNECTED,
    );
    mockConnectionMonitor = jasmine.createSpyObj("ConnectionMonitorService", [
      "startMonitoring",
      "stopMonitoring",
      "waitForConnection",
      "checkConnection",
    ]);
    Object.defineProperty(mockConnectionMonitor, "connectionState$", {
      get: () => connectionStateSubject.asObservable(),
    });
    Object.defineProperty(mockConnectionMonitor, "currentState", {
      get: () => connectionStateSubject.value,
      configurable: true,
    });

    mockConnectionMonitor.waitForConnection.and.returnValue(Promise.resolve());
    mockConnectionMonitor.checkConnection.and.returnValue(of(true));

    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getServerVersion.and.returnValue(of("0.0.0"));
    mockDataService.getServerIp.and.returnValue(of("192.168.1.100"));
    mockDataService.getRaceFlag.and.returnValue(of(RaceFlag.RED));
    mockSettingsService.getSettings.and.returnValue(new Settings());
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
    mockTranslationService.translate.and.callFake((key: string) => key);
    mockTranslationService.getBrowserLanguage = jasmine
      .createSpy()
      .and.returnValue("en");
    mockTranslationService.getSupportedLanguages = jasmine
      .createSpy()
      .and.returnValue([]);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: FileSystemService, useValue: mockFileSystemService },
        {
          provide: Compiler,
          useValue: {
            compileModuleAsync: () =>
              Promise.resolve({
                create: () => ({
                  componentFactoryResolver: {
                    resolveComponentFactory: () => {},
                  },
                }),
              }),
          },
        },
        { provide: Injector, useValue: {} },
        { provide: ChangeDetectorRef, useValue: { detectChanges: () => {} } },
        { provide: DataService, useValue: mockDataService },
        { provide: SettingsService, useValue: mockSettingsService },
        {
          provide: DynamicComponentService,
          useValue: mockDynamicComponentService,
        },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: UpdateService, useValue: mockUpdateService },
      ],
      imports: [RacedaySetupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedaySetupComponent);
    component = fixture.componentInstance;
    component.clientVersion = "TEST-CLIENT-VERSION";
    component.container = mockContainer;
  });

  afterEach(() => {
    fixture.destroy();
    try {
      discardPeriodicTasks();
    } catch (e) {
      // Not in fakeAsync zone
    }
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Splash Screen Logic", () => {
    it("should initialize with splash screen showing", () => {
      expect(component.showSplash).toBeTrue();
      expect(component.minTimeElapsed).toBeFalse();
      expect(component.connectionVerified).toBeFalse();
    });

    it("should bypass splash screen if returning from a non-race screen", fakeAsync(() => {
      mockNavigationService.getPreviousUrl.and.returnValue("/driver-manager");
      component.ngOnInit();
      tick(100);
      expect(component.showSplash).toBeFalse();
      expect(component.minTimeElapsed).toBeTrue();
      expect(component.connectionVerified).toBeTrue();
    }));

    it("should NOT bypass splash screen if returning from a race screen", fakeAsync(() => {
      mockNavigationService.getPreviousUrl.and.returnValue("/raceday");
      component.ngOnInit();
      tick(100);
      expect(component.showSplash).toBeTrue();
      expect(component.minTimeElapsed).toBeFalse();
      tick(5000);
      expect(component.showSplash).toBeFalse();
    }));

    it("should fetch and update server IP address on init", fakeAsync(() => {
      component.ngOnInit();
      tick(100);
      expect(component.serverIp).toBe("192.168.1.100");
    }));

    it("should wait for minimum time and connection service before hiding splash", fakeAsync(() => {
      component.ngOnInit();
      tick(100);
      expect(component.connectionVerified).toBeTrue();
      expect(component.minTimeElapsed).toBeFalse();
      tick(5000);
      expect(component.minTimeElapsed).toBeTrue();
      expect(component.showSplash).toBeFalse();
      expect(mockConnectionMonitor.startMonitoring).toHaveBeenCalled();
    }));

    it("should set splashTimeoutElapsed to true after 5 seconds and check connection status", fakeAsync(() => {
      mockConnectionMonitor.waitForConnection.and.returnValue(
        new Promise(() => {}),
      ); // Never resolves
      component.ngOnInit();
      tick(100);
      expect(component.splashTimeoutElapsed).toBeFalse();
      tick(5000);
      expect(component.splashTimeoutElapsed).toBeTrue();
      expect(component.isServerConnected).toBeFalse();
    }));

    it("should set splashTimeoutElapsed to true after 5 seconds and indicate viewer wait if connected but no race is running", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.VIEWER,
      );
      const systemStateSubject = new BehaviorSubject<any>({
        resourceLockState: "IDLE",
      });
      mockDataService.getSystemState.and.returnValue(
        systemStateSubject.asObservable(),
      );

      component.ngOnInit();
      tick(100);
      expect(component.connectionVerified).toBeTrue();
      expect(component.isServerConnected).toBeTrue();
      tick(5000);
      expect(component.splashTimeoutElapsed).toBeTrue();
      expect(component.showSplash).toBeTrue();
    }));

    it("should render server-down warning message when splash screen times out and server is disconnected", fakeAsync(() => {
      mockConnectionMonitor.waitForConnection.and.returnValue(
        new Promise(() => {}),
      ); // Never resolves
      Object.defineProperty(mockConnectionMonitor, "currentState", {
        get: () => ConnectionState.DISCONNECTED,
        configurable: true,
      });
      fixture.detectChanges();
      tick(5000);
      fixture.detectChanges();

      const msgEl = fixture.nativeElement.querySelector(
        ".splash-status-message.server-down",
      );
      expect(msgEl).toBeTruthy();
      expect(msgEl.textContent.trim()).toBe("RDS_SPLASH_WAIT_SERVER");
    }));

    it("should render viewer-wait warning message when splash screen times out and role is viewer with no race running", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.VIEWER,
      );
      const systemStateSubject = new BehaviorSubject<any>({
        resourceLockState: "IDLE",
      });
      mockDataService.getSystemState.and.returnValue(
        systemStateSubject.asObservable(),
      );

      fixture.detectChanges();
      tick(5000);
      fixture.detectChanges();

      const msgEl = fixture.nativeElement.querySelector(
        ".splash-status-message.viewer-wait",
      );
      expect(msgEl).toBeTruthy();
      expect(msgEl.textContent.trim()).toBe("RDS_SPLASH_WAIT_RACE");
    }));
  });

  describe("Connection Monitoring", () => {
    it("should react to connection loss from service", fakeAsync(() => {
      component.ngOnInit();
      tick(6000);
      expect(component.isConnectionLost).toBeFalse();
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();
      expect(component.isConnectionLost).toBeTrue();
    }));

    it("should react to connection restoration from service", fakeAsync(() => {
      component.ngOnInit();
      tick(6000);
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();
      expect(component.isConnectionLost).toBeTrue();
      connectionStateSubject.next(ConnectionState.CONNECTED);
      tick();
      expect(component.isConnectionLost).toBeFalse();
    }));

    it("should reset to splash if connection lost for too long", fakeAsync(() => {
      component.ngOnInit();
      tick(6000);
      mockConnectionMonitor.waitForConnection.and.returnValue(
        new Promise(() => {}),
      );
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      tick();
      tick(6000);
      expect(component.showSplash).toBeTrue();
      expect(component.connectionVerified).toBeFalse();
      expect(mockConnectionMonitor.waitForConnection).toHaveBeenCalledTimes(2);
    }));
  });

  describe("Server Configuration UI", () => {
    it("should manually check connection on save config", fakeAsync(() => {
      component.saveServerConfig();
      expect(mockConnectionMonitor.checkConnection).toHaveBeenCalled();
      expect(mockConnectionMonitor.waitForConnection).toHaveBeenCalled();
    }));

    it("should attempt to login as director if password is provided", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.VIEWER,
      );
      component.directorPassword = "my-secret-password";
      component.saveServerConfig();
      flushMicrotasks();
      expect(mockAuthService.loginAsDirector).toHaveBeenCalledWith(
        "my-secret-password",
      );
    }));

    it("should not attempt to login as director if password is empty", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.VIEWER,
      );
      component.directorPassword = "";
      component.saveServerConfig();
      flushMicrotasks();
      expect(mockAuthService.loginAsDirector).not.toHaveBeenCalled();
    }));

    it("should populate directorPassword with getDirectorPassword if currentRole is ADMIN on openServerConfig", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.ADMIN,
      );
      mockAuthService.getDirectorPassword.and.returnValue(of("admin-secret"));

      component.openServerConfig();
      tick();

      expect(mockAuthService.getDirectorPassword).toHaveBeenCalled();
      expect(component.directorPassword).toBe("admin-secret");
      expect(component.showPassword).toBeFalse();
    }));

    it("should keep directorPassword empty on openServerConfig if role is not ADMIN", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.VIEWER,
      );

      component.openServerConfig();
      tick();

      expect(mockAuthService.getDirectorPassword).not.toHaveBeenCalled();
      expect(component.directorPassword).toBe("");
    }));

    it("should call changeDirectorPassword on saveServerConfig if role is ADMIN", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.ADMIN,
      );
      component.directorPassword = "new-admin-password";
      component.saveServerConfig();
      flushMicrotasks();

      expect(mockAuthService.changeDirectorPassword).toHaveBeenCalledWith(
        "new-admin-password",
      );
    }));
  });

  describe("Dynamic Component Interaction", () => {
    it("should listen to requestServerConfig from default component", fakeAsync(() => {
      mockContainer.createComponent.and.returnValue({
        instance: {
          requestServerConfig: {
            subscribe: (callback: any) => {
              callback();
              return { unsubscribe: () => {} };
            },
          },
          requestAbout: { subscribe: () => {} },
        },
      });
      mockFileSystemService.hasCustomFiles.and.returnValue(
        Promise.resolve(false),
      );
      component.ngOnInit();
      tick(6000);
      expect(component.showServerConfig).toBeTrue();
    }));

    it("should listen to requestAbout from default component", fakeAsync(() => {
      mockContainer.createComponent.and.returnValue({
        instance: {
          requestServerConfig: { subscribe: () => {} },
          requestAbout: {
            subscribe: (callback: any) => {
              callback();
              return { unsubscribe: () => {} };
            },
          },
        },
      });
      mockFileSystemService.hasCustomFiles.and.returnValue(
        Promise.resolve(false),
      );
      component.ngOnInit();
      tick(6000);
      expect(component.showAboutDialog).toBeTrue();
    }));
  });

  it("should load default component if no custom files", fakeAsync(() => {
    mockFileSystemService.hasCustomFiles.and.returnValue(
      Promise.resolve(false),
    );
    mockContainer.createComponent.and.returnValue({
      instance: {
        requestServerConfig: { subscribe: () => {} },
        requestAbout: { subscribe: () => {} },
      },
    });
    component.ngOnInit();
    tick(6000);
    expect(mockContainer.createComponent).toHaveBeenCalled();
  }));

  describe("Custom UI Folder Logic", () => {
    it("should try to load from 'raceday-setup' subfolder first", fakeAsync(() => {
      mockFileSystemService.hasCustomFiles.and.callFake(
        (file?: string, subfolder?: string) => {
          if (subfolder === "raceday-setup") return Promise.resolve(true);
          return Promise.resolve(false);
        },
      );
      mockFileSystemService.getCustomFile.and.returnValue(
        Promise.resolve("<html></html>"),
      );

      component.ngOnInit();
      tick(6000);

      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "raceday-setup.component.html",
        "raceday-setup",
      );
      expect(mockFileSystemService.getCustomFile).toHaveBeenCalledWith(
        "raceday-setup.component.html",
        "raceday-setup",
      );
    }));

    it("should fall back to root custom folder if subfolder missing", fakeAsync(() => {
      mockFileSystemService.hasCustomFiles.and.callFake(
        (file?: string, subfolder?: string) => {
          if (subfolder === "raceday-setup") return Promise.resolve(false);
          if (!subfolder) return Promise.resolve(true);
          return Promise.resolve(false);
        },
      );
      mockFileSystemService.getCustomFile.and.returnValue(
        Promise.resolve("<html></html>"),
      );

      component.ngOnInit();
      tick(6000);

      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "raceday-setup.component.html",
        "raceday-setup",
      );
      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "raceday-setup.component.html",
      );
      expect(mockFileSystemService.getCustomFile).toHaveBeenCalledWith(
        "raceday-setup.component.html",
        undefined,
      );
    }));

    it("should fall back to default component if both custom locations missing", fakeAsync(() => {
      mockFileSystemService.hasCustomFiles.and.returnValue(
        Promise.resolve(false),
      );

      component.ngOnInit();
      tick(6000);

      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "raceday-setup.component.html",
        "raceday-setup",
      );
      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "raceday-setup.component.html",
      );
      // Verify loadDefaultComponent by checking that we don't call getCustomFile
      expect(mockFileSystemService.getCustomFile).not.toHaveBeenCalled();
    }));

    it("should fetch default stylesheet if custom CSS is not found", fakeAsync(() => {
      mockFileSystemService.hasCustomFiles.and.callFake(
        (file?: string, subfolder?: string) => {
          if (subfolder === "raceday-setup") return Promise.resolve(true);
          return Promise.resolve(false);
        },
      );
      mockFileSystemService.getCustomFile.and.callFake(
        (filename: string, _subfolder?: string) => {
          if (filename === "raceday-setup.component.html") {
            return Promise.resolve("<html></html>");
          }
          if (filename === "raceday-setup.component.css") {
            return Promise.reject(new Error("File not found"));
          }
          return Promise.resolve("");
        },
      );

      const mockFetchResponse = {
        ok: true,
        text: () => Promise.resolve(".default-style {}"),
      };
      spyOn(window, "fetch").and.returnValue(
        Promise.resolve(mockFetchResponse as any),
      );
      mockDynamicComponentService.createDynamicComponent.and.returnValue(
        Promise.resolve(class {}),
      );

      component.ngOnInit();
      tick(6000);

      expect(window.fetch).toHaveBeenCalledWith(
        "/assets/default-styles/raceday-setup/default-raceday-setup.component.css",
      );
      expect(
        mockDynamicComponentService.createDynamicComponent,
      ).toHaveBeenCalledWith(
        jasmine.any(Function),
        "<html></html>",
        ".default-style {}",
        jasmine.any(String),
      );
    }));
  });

  describe("Viewer Auto-Transition", () => {
    let systemStateSubject: BehaviorSubject<any>;

    beforeEach(() => {
      systemStateSubject = new BehaviorSubject<any>(null);
      mockDataService.getSystemState.and.returnValue(
        systemStateSubject.asObservable(),
      );
    });

    it("should stay on splash screen when connected as viewer and resourceLockState is not RACE_RUNNING", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.VIEWER,
      );

      component.ngOnInit();
      tick(6000); // Let splash screen timer run

      // Initially null system state
      expect(component.showSplash).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      // Transition to IDLE state
      systemStateSubject.next({ resourceLockState: "IDLE" });
      tick();
      expect(component.showSplash).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));

    it("should automatically navigate to /raceday as viewer when resourceLockState becomes RACE_RUNNING", fakeAsync(() => {
      spyOnProperty(mockAuthService, "currentRole", "get").and.returnValue(
        Role.VIEWER,
      );

      component.ngOnInit();
      tick(6000); // Let splash screen timer run

      systemStateSubject.next({ resourceLockState: "RACE_RUNNING" });
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
    }));
  });

  describe("Update Banner", () => {
    it("should format updateVersionHtml correctly when update is available", () => {
      component.updateResult = {
        updateAvailable: true,
        latestVersion: "v1.2.3",
        releaseNotes: "",
        downloadUrl: "http://example.com/dl",
        releaseUrl: "http://example.com/release",
        isWindows: true,
      };

      const html: any = component.updateVersionHtml;
      const htmlStr = html.changingThisBreaksApplicationSecurity || html;
      expect(htmlStr).toContain('href="http://example.com/release"');
      expect(htmlStr).toContain("v1.2.3");
      expect(htmlStr).toContain('target="_blank"');
    });

    it("should return empty string for updateVersionHtml when update is not available", () => {
      component.updateResult = null;
      expect(component.updateVersionHtml).toBe("");
    });

    it("should call updateService.installUpdate when installUpdate is called", () => {
      component.updateResult = {
        updateAvailable: true,
        latestVersion: "v1.2.3",
        releaseNotes: "",
        downloadUrl: "http://example.com/dl",
        releaseUrl: "http://example.com/release",
        isWindows: true,
      };

      mockUpdateService.installUpdate.and.returnValue(of(true));
      component.installUpdate();

      expect(mockUpdateService.installUpdate).toHaveBeenCalledWith(
        "http://example.com/dl",
      );
      expect(component.isUpdating).toBeTrue();
    });

    it("should call updateService.skipUpdate and clear result when skipVersion is called", () => {
      component.updateResult = {
        updateAvailable: true,
        latestVersion: "v1.2.3",
        releaseNotes: "",
        downloadUrl: "http://example.com/dl",
        releaseUrl: "http://example.com/release",
        isWindows: true,
      };

      mockUpdateService.skipUpdate.and.returnValue(of(true));
      component.skipVersion();

      expect(mockUpdateService.skipUpdate).toHaveBeenCalledWith("v1.2.3");
      expect(component.updateResult).toBeNull();
    });
  });
});
