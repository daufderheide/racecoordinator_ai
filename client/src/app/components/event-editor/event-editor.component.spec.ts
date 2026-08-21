import { Component, input, NO_ERRORS_SCHEMA, output } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { Event } from "@app/models/event";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockLoggerService,
  mockSettingsService,
  mockTranslationService,
} from "@app/testing/unit-test-mocks";

import { EventEditorComponent } from "./event-editor.component";

@Component({
  standalone: true,
  selector: "app-confirmation-modal",
  template: `
    @if (visible()) {
      <button id="btn-confirm-test-evt" (click)="confirm.emit()">
        Confirm
      </button>
      <button id="btn-cancel-test-evt" (click)="cancel.emit()">Cancel</button>
    }
  `,
})
class MockConfirmationModalComponent {
  visible = input(false);
  title = input("");
  message = input("");
  confirmText = input("");
  cancelText = input("");
  confirm = output<void>();
  cancel = output<void>();
}

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
    const mockNavigationService = jasmine.createSpyObj("NavigationService", [
      "setLastEditedId",
      "getLastEditedId",
      "clearLastEditedId",
    ]);

    await TestBed.configureTestingModule({
      imports: [EventEditorComponent, FormsModule, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: NavigationService, useValue: mockNavigationService },
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
    })
      .overrideComponent(EventEditorComponent, {
        set: {
          imports: [MockConfirmationModalComponent, TranslatePipe, FormsModule],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

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

  it("should append _1 if 'New Event' already exists", () => {
    component.existingEvents = [
      { entity_id: "e1", name: "New Event", races: [] },
    ];
    const unique = component.generateUniqueName("New Event");
    expect(unique).toBe("New Event_1");
  });

  it("should append _2 if 'New Event' and 'New Event_1' already exist", () => {
    component.existingEvents = [
      { entity_id: "e1", name: "New Event", races: [] },
      { entity_id: "e2", name: "New Event_1", races: [] },
    ];
    const unique = component.generateUniqueName("New Event");
    expect(unique).toBe("New Event_2");
  });

  it("should force suffix and stay on editor page when duplicating event on saveAsNew", () => {
    fixture.detectChanges();
    component.editingEvent = {
      entity_id: "evt_1",
      name: "Existing Event",
      description: "Description",
      races: [{ raceId: "r1", maxDrivers: 0 }],
    };
    component.saveAsNew();
    expect(mockDataService.createEvent).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: "Existing Event_1",
        description: "Description",
      }),
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      queryParams: { id: "evt_new" },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
    expect(component.editingEvent.name).toBe("Existing Event_1");
  });

  it("should add race and close modal on onRaceSelect", () => {
    fixture.detectChanges();
    component.openAddRaceModal();
    expect(component.showAddRaceModal).toBeTrue();

    component.onRaceSelect("r2");
    expect(component.showAddRaceModal).toBeFalse();
    expect(
      component.editingEvent.races.some((r) => r.raceId === "r2"),
    ).toBeTrue();
  });

  it("should handle confirmDiscard modal confirm event via template binding", async () => {
    fixture.detectChanges();
    const promise = component.confirmDiscard();
    fixture.detectChanges();

    expect(component.showDiscardConfirm).toBeTrue();

    const confirmBtn = fixture.debugElement.query(
      By.css("#btn-confirm-test-evt"),
    );
    expect(confirmBtn).toBeTruthy();
    confirmBtn.nativeElement.click();
    fixture.detectChanges();

    const result = await promise;
    expect(result).toBeTrue();
    expect(component.showDiscardConfirm).toBeFalse();
    expect(component.isNavigationApproved).toBeTrue();
  });

  it("should handle confirmDiscard modal cancel event via template binding", async () => {
    fixture.detectChanges();
    const promise = component.confirmDiscard();
    fixture.detectChanges();

    expect(component.showDiscardConfirm).toBeTrue();

    const cancelBtn = fixture.debugElement.query(
      By.css("#btn-cancel-test-evt"),
    );
    expect(cancelBtn).toBeTruthy();
    cancelBtn.nativeElement.click();
    fixture.detectChanges();

    const result = await promise;
    expect(result).toBeFalse();
    expect(component.showDiscardConfirm).toBeFalse();
    expect(component.isNavigationApproved).toBeFalse();
  });

  describe("Guided Help", () => {
    it("should return complete guided help steps in expected order", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(6);

      // Welcome Step
      expect(steps[0].title).toBe("EE_HELP_WELCOME_TITLE");
      expect(steps[0].content).toBe("EE_HELP_WELCOME_CONTENT");
      expect(steps[0].position).toBe("center");
      expect(steps[0].selector).toBeUndefined();

      // Form inputs
      expect(steps[1].selector).toBe("#event-name");
      expect(steps[1].title).toBe("EE_HELP_NAME_TITLE");
      expect(steps[1].position).toBe("right");

      expect(steps[2].selector).toBe("#event-description");
      expect(steps[2].title).toBe("EE_HELP_DESCRIPTION_TITLE");
      expect(steps[2].position).toBe("right");

      expect(steps[3].selector).toBe("#event-auto-advance");
      expect(steps[3].title).toBe("EE_HELP_AUTO_ADVANCE_TITLE");
      expect(steps[3].position).toBe("right");

      // Right panel actions & sequence
      expect(steps[4].selector).toBe("#btn-add-race");
      expect(steps[4].title).toBe("EE_HELP_ADD_RACE_TITLE");
      expect(steps[4].position).toBe("bottom");

      expect(steps[5].selector).toBe("#event-race-list");
      expect(steps[5].title).toBe("EE_HELP_RACE_LIST_TITLE");
      expect(steps[5].position).toBe("left");
    });
  });
});
