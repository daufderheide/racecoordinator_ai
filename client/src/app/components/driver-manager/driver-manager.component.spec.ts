import { ChangeDetectorRef } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { AnalyticsService } from "@app/services/analytics.service";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  MOCK_DRIVER_INSTANCES,
  MOCK_DRIVERS as _MOCK_DRIVERS,
} from "@app/testing/data/drivers_data";
import { MOCK_TEAMS as _MOCK_TEAMS } from "@app/testing/data/teams_data";
import {
  mockAnalyticsService,
  mockLoggerService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { DriverManagerComponent } from "./driver-manager.component";
import { createDriverManagerDataServiceMock } from "./testing/driver-manager_helper";

describe("DriverManagerComponent", () => {
  let component: DriverManagerComponent;
  let fixture: ComponentFixture<DriverManagerComponent>;
  let dataService: any;
  let _connectionMonitor: any;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    connectionStateSubject = new BehaviorSubject<ConnectionState>(
      ConnectionState.CONNECTED,
    );

    mockConnectionMonitor = jasmine.createSpyObj("ConnectionMonitorService", [
      "startMonitoring",
      "stopMonitoring",
    ]);
    Object.defineProperty(mockConnectionMonitor, "connectionState$", {
      get: () => connectionStateSubject.asObservable(),
    });

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
      queryParams: of({ help: "false" }),
    };

    await TestBed.configureTestingModule({
      imports: [DriverManagerComponent, AvatarUrlPipe],
      providers: [
        {
          provide: DataService,
          useValue: createDriverManagerDataServiceMock(),
        },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        {
          provide: HelpService,
          useValue: jasmine.createSpyObj("HelpService", ["startGuide"], {
            isVisible$: of(false),
            currentStep$: of(null),
            hasNext$: of(false),
            hasPrevious$: of(false),
          }),
        },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: LoggerService, useValue: mockLoggerService },
        ChangeDetectorRef,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    resetMocks();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverManagerComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    // Deep copy mock data AND set prototypes to ensure Driver methods work
    component.drivers = JSON.parse(JSON.stringify(MOCK_DRIVER_INSTANCES)).map(
      (d: any) => {
        Object.setPrototypeOf(d, Driver.prototype);
        return d;
      },
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Initialization", () => {
    it("should load drivers on init", () => {
      expect(dataService.getDrivers).toHaveBeenCalled();
      expect(component.drivers.length).toBe(4);
      expect(component.filteredDrivers.length).toBe(4);
    });

    it("should select first driver by default if no query param", () => {
      expect(component.selectedDriver).toEqual(component.drivers[0]);
      expect(component.editingDriver).toBeDefined();
      expect(component.editingDriver?.name).toBe("Alice");
    });

    it("should select driver from query param", fakeAsync(() => {
      // Mock different query param for this test case specifically
      mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
        (key: string) => {
          if (key === "id") return "d2";
          return null;
        },
      );

      // Manually trigger reload as ngOnInit uses queryParamMap subscription
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.selectedDriver?.entity_id).toBe("d2");
      expect(component.editingDriver?.entity_id).toBe("d2");
    }));
  });

  describe("Driver Selection", () => {
    it("should update selected and editing driver on select", () => {
      component.selectDriver(MOCK_DRIVER_INSTANCES[1]);
      expect(component.selectedDriver?.entity_id).toBe("d2");
      expect(component.editingDriver).toBeDefined();
      expect(component.editingDriver?.entity_id).toBe("d2");
      // Ensure deep copy
      expect(component.editingDriver).not.toBe(component.selectedDriver);
    });
  });

  describe("Filtering", () => {
    it("should filter drivers by name", () => {
      component.searchQuery = "ali"; // Should match Alice
      expect(component.filteredDrivers.length).toBe(1);
      expect(component.filteredDrivers[0].name).toBe("Alice");
    });

    it("should filter drivers by nickname", () => {
      component.searchQuery = "drift"; // Should match Bob (Drift King)
      expect(component.filteredDrivers.length).toBe(1);
      expect(component.filteredDrivers[0].name).toBe("Bob");
    });

    it("should show all drivers if query is empty", () => {
      component.searchQuery = "";
      expect(component.filteredDrivers.length).toBe(4);
    });
  });

  describe("Navigation", () => {
    it("should select a driver and navigate to editor", async () => {
      component.selectDriver(MOCK_DRIVER_INSTANCES[0]);
      component.updateDriver();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/driver-editor"], {
        queryParams: { id: "d1" },
      });
    });
  });

  describe("Deletion", () => {
    it("should show confirmation modal on deleteDriver", () => {
      component.selectDriver(MOCK_DRIVER_INSTANCES[0]);
      component.deleteDriver();
      expect(component.showDeleteConfirmation).toBeTrue();
    });

    it("should delete driver if confirmed in modal", () => {
      dataService.deleteDriver.and.returnValue(of({}));

      component.selectDriver(MOCK_DRIVER_INSTANCES[0]);
      component.deleteDriver();
      component.onConfirmDelete();

      expect(component.showDeleteConfirmation).toBeFalse();
      expect(dataService.deleteDriver).toHaveBeenCalledWith("d1");
      expect(dataService.getDrivers).toHaveBeenCalledTimes(2); // Once on init, once after delete re-load
    });

    it("should not delete driver if cancelled in modal", () => {
      component.selectDriver(MOCK_DRIVER_INSTANCES[0]);
      component.deleteDriver();
      component.onCancelDelete();

      expect(component.showDeleteConfirmation).toBeFalse();
      expect(dataService.deleteDriver).not.toHaveBeenCalled();
    });
  });

  describe("Connection Monitoring", () => {
    it("should update isConnectionLost based on service", () => {
      expect(component.isConnectionLost).toBeFalse();
      connectionStateSubject.next(ConnectionState.DISCONNECTED);
      expect(component.isConnectionLost).toBeTrue();
      connectionStateSubject.next(ConnectionState.CONNECTED);
      expect(component.isConnectionLost).toBeFalse();
    });
  });

  describe("Natural Sorting", () => {
    it("should sort drivers naturally by name", () => {
      component.drivers = [
        new Driver(
          "d10",
          "Driver 10",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d2",
          "Driver 2",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d1",
          "Driver 1",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d20",
          "Driver 20",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
      ];

      const filteredDrivers = component.filteredDrivers;

      expect(filteredDrivers.map((d) => d.name)).toEqual([
        "Driver 1",
        "Driver 2",
        "Driver 10",
        "Driver 20",
      ]);
    });

    it("should maintain natural sort order when filtering", () => {
      component.drivers = [
        new Driver(
          "d10",
          "Driver 10",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d2",
          "Driver 2",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "test",
          "Test Driver",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d1",
          "Driver 1",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d20",
          "Driver 20",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
      ];

      component.searchQuery = "driver"; // This should match all items containing "driver"

      const filteredDrivers = component.filteredDrivers;

      expect(filteredDrivers.map((d) => d.name)).toEqual([
        "Driver 1",
        "Driver 2",
        "Driver 10",
        "Driver 20",
        "Test Driver",
      ]);
    });

    it("should handle empty names in natural sort", () => {
      component.drivers = [
        new Driver(
          "null",
          "",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d10",
          "Driver 10",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "empty",
          "",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d2",
          "Driver 2",
          "",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
      ];

      const filteredDrivers = component.filteredDrivers;

      expect(filteredDrivers.map((d) => d.name)).toEqual([
        "",
        "",
        "Driver 2",
        "Driver 10",
      ]);
    });

    it("should sort by name when nickname is also considered", () => {
      component.drivers = [
        new Driver(
          "d10",
          "Driver 10",
          "Nick 10",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d2",
          "Driver 2",
          "Nick 2",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d1",
          "Driver 1",
          "Nick 1",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
        new Driver(
          "d20",
          "Driver 20",
          "Nick 20",
          undefined,
          { type: "preset" },
          { type: "preset" },
        ),
      ];

      const filteredDrivers = component.filteredDrivers;

      expect(filteredDrivers.map((d) => d.name)).toEqual([
        "Driver 1",
        "Driver 2",
        "Driver 10",
        "Driver 20",
      ]);
    });
  });

  describe("TTS Context", () => {
    it("should provide mock ttsContext if no driver is selected", () => {
      component.selectedDriver = undefined;
      const context = component.ttsContext;
      expect(context.driver.name).toBe("Dave");
    });

    it("should provide driver ttsContext if a driver is selected", () => {
      const driver = component.drivers[0]; // Alice
      component.selectDriver(driver);
      const context = component.ttsContext;
      expect(context.driver.name).toBe("Alice");
      expect(context.driver.nickname).toBe("The Rocket");
    });
  });
});
