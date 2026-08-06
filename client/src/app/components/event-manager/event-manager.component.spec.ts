import { NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { Event } from "@app/models/event";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockLoggerService,
  mockSettingsService,
  mockTranslationService,
} from "@app/testing/unit-test-mocks";

import { EventManagerComponent } from "./event-manager.component";

describe("EventManagerComponent", () => {
  let component: EventManagerComponent;
  let fixture: import("@angular/core/testing").ComponentFixture<EventManagerComponent>;
  let mockDataService: any;
  let mockRouter: any;
  let mockNavigationService: any;

  const mockEvents: Event[] = [
    {
      entity_id: "evt_1",
      name: "Championship Event",
      description: "Annual Championship",
      auto_advance_time: 10,
      races: [
        { raceId: "r1", maxDrivers: 0 },
        { raceId: "r2", maxDrivers: 4 },
      ],
    },
    {
      entity_id: "evt_2",
      name: "Qualifier Event",
      description: "Quick Qualifier",
      auto_advance_time: 5,
      races: [{ raceId: "r1", maxDrivers: 6 }],
    },
  ];

  const mockRaces = [
    {
      entity_id: "r1",
      name: "Qualifying Heat",
      heat_scoring: { finish_method: "Lap", finish_value: 10 },
    },
    {
      entity_id: "r2",
      name: "Final Sprint",
      heat_scoring: { finish_method: "Timed", finish_value: 120 },
    },
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getEvents",
      "getRaces",
      "deleteEvent",
    ]);
    mockDataService.getEvents.and.returnValue(of(mockEvents));
    mockDataService.getRaces.and.returnValue(of(mockRaces));
    mockDataService.deleteEvent.and.returnValue(of(true));

    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);

    const mockConnectionMonitor = jasmine.createSpyObj(
      "ConnectionMonitorService",
      ["startMonitoring"],
      {
        connectionState$: of(),
      },
    );

    mockNavigationService = jasmine.createSpyObj("NavigationService", [
      "getLastEditedId",
      "setLastEditedId",
      "clearLastEditedId",
    ]);
    mockNavigationService.getLastEditedId.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [EventManagerComponent, FormsModule, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: RaceConnectionService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: {
              queryParamMap: jasmine.createSpyObj("queryParamMap", ["get"]),
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EventManagerComponent);
    component = fixture.componentInstance;
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.queryParamMap.get as jasmine.Spy).and.returnValue(null);
  });

  it("should create component and load events on init", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockDataService.getEvents).toHaveBeenCalled();
    expect(mockDataService.getRaces).toHaveBeenCalled();
    expect(component.events.length).toBe(2);
    expect(component.selectedEvent?.entity_id).toBe("evt_1");
  });

  it("should filter events by search query", () => {
    fixture.detectChanges();
    component.searchQuery = "Championship";
    expect(component.filteredEvents.length).toBe(1);
    expect(component.filteredEvents[0].name).toBe("Championship Event");
  });

  it("should select an event", () => {
    fixture.detectChanges();
    component.selectEvent(mockEvents[1]);
    expect(component.selectedEvent?.entity_id).toBe("evt_2");
  });

  it("should navigate to event editor on createNewEvent", () => {
    component.createNewEvent();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/event-editor"], {
      queryParams: { id: "new" },
    });
  });

  it("should navigate to event editor on updateEvent", () => {
    fixture.detectChanges();
    component.updateEvent();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/event-editor"], {
      queryParams: { id: "evt_1" },
    });
  });

  it("should prompt confirmation modal on deleteEvent", () => {
    fixture.detectChanges();
    component.deleteEvent();
    expect(component.showDeleteConfirmation).toBeTrue();
  });

  it("should delete event on onConfirmDelete", () => {
    fixture.detectChanges();
    component.deleteEvent();
    component.onConfirmDelete();
    expect(mockDataService.deleteEvent).toHaveBeenCalledWith("evt_1");
    expect(component.showDeleteConfirmation).toBeFalse();
  });

  it("should select event specified in route queryParams on init", () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.queryParamMap.get as jasmine.Spy).and.callFake(
      (key: string) => (key === "selectedId" ? "evt_2" : null),
    );
    fixture.detectChanges();
    expect(component.selectedEvent?.entity_id).toBe("evt_2");
  });

  it("should correctly return finish method and finish value for a race", () => {
    fixture.detectChanges();
    expect(component.getRaceFinishMethod("r1")).toBe("Lap");
    expect(component.getRaceFinishValue("r1")).toBe("10");
    expect(component.getRaceFinishMethod("r2")).toBe("Timed");
    expect(component.getRaceFinishValue("r2")).toBe("120");
    expect(component.getRaceFinishMethod("invalid")).toBe("");
    expect(component.getRaceFinishValue("invalid")).toBe("");
  });
});
