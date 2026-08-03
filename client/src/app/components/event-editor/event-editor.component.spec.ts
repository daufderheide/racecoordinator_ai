import { NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { Event } from "@app/models/event";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockLoggerService,
  mockSettingsService,
  mockTranslationService,
} from "@app/testing/unit-test-mocks";

import { EventEditorComponent } from "./event-editor.component";

describe("EventEditorComponent", () => {
  let component: EventEditorComponent;
  let fixture: import("@angular/core/testing").ComponentFixture<EventEditorComponent>;
  let mockDataService: any;
  let mockRouter: any;

  const mockEvents: Event[] = [
    {
      entity_id: "evt_1",
      name: "Existing Event",
      description: "Description",
      auto_advance_time: 10,
      races: [{ raceId: "r1", maxDrivers: 0 }],
    },
  ];

  const mockRaces = [
    { entity_id: "r1", name: "Qualifying Heat" },
    { entity_id: "r2", name: "Final Sprint" },
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getEvents",
      "getRaces",
      "createEvent",
      "updateEvent",
    ]);
    mockDataService.getEvents.and.returnValue(of(mockEvents));
    mockDataService.getRaces.and.returnValue(of(mockRaces));
    mockDataService.createEvent.and.callFake((e: Event) =>
      of({ ...e, entity_id: "evt_new" }),
    );
    mockDataService.updateEvent.and.callFake((id: string, e: Event) => of(e));

    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);

    await TestBed.configureTestingModule({
      imports: [EventEditorComponent, FormsModule, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: TranslationService, useValue: mockTranslationService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === "id" ? "evt_1" : null),
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EventEditorComponent);
    component = fixture.componentInstance;
  });

  it("should create component and load target event for editing", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.editingEvent.name).toBe("Existing Event");
  });

  it("should validate duplicate names", () => {
    fixture.detectChanges();
    component.editingEvent.entity_id = undefined;
    component.editingEvent.name = "Existing Event";
    expect(component.isDuplicateName()).toBeTrue();
  });

  it("should support adding, reordering via drag-and-drop, and removing races in event sequence", () => {
    fixture.detectChanges();
    expect(component.editingEvent.races.length).toBe(1);

    component.selectedRaceToAddId = "r2";
    component.confirmAddRace();
    expect(component.editingEvent.races.length).toBe(2);
    expect(component.editingEvent.races[1].raceId).toBe("r2");

    component.dropRace({ previousIndex: 1, currentIndex: 0 } as any);
    expect(component.editingEvent.races[0].raceId).toBe("r2");

    component.removeRace(0);
    expect(component.editingEvent.races.length).toBe(1);
  });

  it("should toggle unlimited max drivers for race item", () => {
    fixture.detectChanges();
    const item = component.editingEvent.races[0];
    expect(item.maxDrivers).toBe(0);

    component.toggleUnlimited(item);
    expect(item.maxDrivers).toBe(4);

    component.toggleUnlimited(item);
    expect(item.maxDrivers).toBe(0);
  });

  it("should auto-save event when changes occur", () => {
    fixture.detectChanges();
    component.editingEvent.description = "Updated Description";
    component.onInputChange();
    expect(mockDataService.updateEvent).toHaveBeenCalled();
  });
});
