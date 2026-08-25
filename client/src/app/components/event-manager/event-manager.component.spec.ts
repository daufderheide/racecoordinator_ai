import { NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { Event } from "@app/models/event";
import { Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
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
  let mockAuthService: any;

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
    mockAuthService = {
      currentRole: Role.ADMIN,
      currentRole$: of(Role.ADMIN),
    };

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
        { provide: AuthService, useValue: mockAuthService },
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

  it("should select the first alphabetically sorted event by default when backend returns unsorted events", () => {
    mockDataService.getEvents.and.returnValue(
      of([
        { entity_id: "evt_99", name: "Zack Cup Event", raceIds: [] },
        { entity_id: "evt_1", name: "Alpha Championship", raceIds: [] },
      ] as any),
    );
    component.selectedEvent = undefined;
    component.loadData();
    expect((component.selectedEvent as any)?.name).toBe("Alpha Championship");
    expect(component.events[0].name).toBe("Alpha Championship");
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

  describe("Guided Help", () => {
    it("should return complete guided help steps in expected order", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(7);

      // Welcome Step
      expect(steps[0].title).toBe("EM_HELP_WELCOME_TITLE");
      expect(steps[0].content).toBe("EM_HELP_WELCOME_CONTENT");
      expect(steps[0].position).toBe("center");
      expect(steps[0].selector).toBeUndefined();

      // LHS Steps
      expect(steps[1].selector).toBe("#event-list-container");
      expect(steps[1].title).toBe("EM_HELP_LIST_TITLE");
      expect(steps[1].position).toBe("right");

      expect(steps[2].selector).toBe("#event-search-bar");
      expect(steps[2].title).toBe("EM_HELP_SEARCH_TITLE");
      expect(steps[2].position).toBe("right");

      // RHS Steps
      expect(steps[3].selector).toBe("#event-detail-name");
      expect(steps[3].title).toBe("EM_HELP_NAME_TITLE");
      expect(steps[3].position).toBe("bottom");

      expect(steps[4].selector).toBe("#event-detail-description");
      expect(steps[4].title).toBe("EM_HELP_DESCRIPTION_TITLE");
      expect(steps[4].position).toBe("bottom");

      expect(steps[5].selector).toBe("#event-detail-auto-advance");
      expect(steps[5].title).toBe("EM_HELP_AUTO_ADVANCE_TITLE");
      expect(steps[5].position).toBe("bottom");

      expect(steps[6].selector).toBe("#event-detail-races");
      expect(steps[6].title).toBe("EM_HELP_RACES_TITLE");
      expect(steps[6].position).toBe("left");
    });
  });
});
