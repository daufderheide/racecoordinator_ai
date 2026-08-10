import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { DatePipe } from "@angular/common";
import { Component, input, NO_ERRORS_SCHEMA, output } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockLoggerService,
  mockTranslationService,
} from "@app/testing/unit-test-mocks";

import { SeasonEditorComponent } from "./season-editor.component";
import { SeasonEditorHarness } from "./testing/season-editor.harness";

@Component({
  standalone: true,
  selector: "app-editor-title",
  template: "",
})
class MockEditorTitleComponent {}

@Component({
  standalone: true,
  selector: "app-confirmation-modal",
  template: `
    @if (visible()) {
      <button id="btn-confirm-test" (click)="confirm.emit()">Confirm</button>
      <button id="btn-cancel-test" (click)="cancel.emit()">Cancel</button>
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

describe("SeasonEditorComponent", () => {
  let component: SeasonEditorComponent;
  let fixture: ComponentFixture<SeasonEditorComponent>;

  beforeEach(async () => {
    const mockDataService = {
      getSeasons: () => of([]),
      getRaceHistory: () => of([]),
      getAllFinishedRaceHistory: () => of([]),
      createSeason: (s: any) => of({ ...s, entity_id: "s1" }),
      updateSeason: (id: string, s: any) => of({ ...s, entity_id: id }),
    };

    const mockNavigationService = {
      getLastEditedId: (_type: string) => null,
      setLastEditedId: (_type: string, _id: string) => {},
      clearLastEditedId: (_type: string) => {},
    };

    await TestBed.configureTestingModule({
      imports: [SeasonEditorComponent, FormsModule, TranslatePipe, DatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: NavigationService, useValue: mockNavigationService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy("navigate") },
        },
      ],
    })
      .overrideComponent(SeasonEditorComponent, {
        set: {
          imports: [
            MockEditorTitleComponent,
            MockConfirmationModalComponent,
            TranslatePipe,
            FormsModule,
            DatePipe,
          ],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SeasonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should auto-save season on state commit if valid and reset hasChanges() to false", () => {
    const dataService = TestBed.inject(DataService);
    const router = TestBed.inject(Router);
    spyOn(dataService, "createSeason").and.callThrough();

    component.editingSeason.name = "New Auto-Saved Season";
    component.editingSeason.drops = 2;
    component.captureState();

    expect(dataService.createSeason).toHaveBeenCalled();
    expect(component.hasChanges()).toBeFalse();
    expect(component.isDirty).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.anything(),
      queryParams: { id: "s1" },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  });

  it("should navigate with replaceUrl: true when auto-saving a new season to prevent duplicate browser history entries", () => {
    const dataService = TestBed.inject(DataService);
    const router = TestBed.inject(Router);
    (router.navigate as jasmine.Spy).calls.reset();
    spyOn(dataService, "createSeason").and.returnValue(
      of({
        entity_id: "new_s_999",
        name: "New Season Saved",
        drops: 0,
        races: [],
      }),
    );

    component.editingSeason = {
      name: "New Season Saved",
      drops: 0,
      races: [],
    };
    component.autoSaveSeason();

    expect(dataService.createSeason).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.anything(),
      queryParams: { id: "new_s_999" },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  });

  it("should not trigger URL navigation when auto-saving an existing season", () => {
    const dataService = TestBed.inject(DataService);
    const router = TestBed.inject(Router);
    (router.navigate as jasmine.Spy).calls.reset();
    spyOn(dataService, "updateSeason").and.returnValue(
      of({
        entity_id: "existing_s_123",
        name: "Updated Season",
        drops: 1,
        races: [],
      }),
    );

    component.editingSeason = {
      entity_id: "existing_s_123",
      name: "Updated Season",
      drops: 1,
      races: [],
    };
    component.autoSaveSeason();

    expect(dataService.updateSeason).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should handle confirmDiscard modal confirm event via template binding", async () => {
    const promise = component.confirmDiscard();
    fixture.detectChanges();

    expect(component.showDiscardConfirm).toBeTrue();

    const confirmBtn = fixture.debugElement.query(By.css("#btn-confirm-test"));
    expect(confirmBtn).toBeTruthy();
    confirmBtn.nativeElement.click();
    fixture.detectChanges();

    const result = await promise;
    expect(result).toBeTrue();
    expect(component.showDiscardConfirm).toBeFalse();
    expect(component.isNavigationApproved).toBeTrue();
  });

  it("should handle confirmDiscard modal cancel event via template binding", async () => {
    const promise = component.confirmDiscard();
    fixture.detectChanges();

    expect(component.showDiscardConfirm).toBeTrue();

    const cancelBtn = fixture.debugElement.query(By.css("#btn-cancel-test"));
    expect(cancelBtn).toBeTruthy();
    cancelBtn.nativeElement.click();
    fixture.detectChanges();

    const result = await promise;
    expect(result).toBeFalse();
    expect(component.showDiscardConfirm).toBeFalse();
    expect(component.isNavigationApproved).toBeFalse();
  });

  it("should generate unique default name for new season", () => {
    expect(component.editingSeason.name).toBe("New Season");
  });

  it("should recalculate standings when races are added or removed", () => {
    const mockRace = {
      race_id: "r1",
      race_name: "Grand Prix 1",
      timestamp: Date.now(),
      driver_results: [
        {
          driver_id: "d1",
          driver_name: "Speedy",
          overall_rank: 1,
          overall_points: 10,
          heat_points: 5,
          total_points: 15,
        },
        {
          driver_id: "d2",
          driver_name: "Racer",
          overall_rank: 2,
          overall_points: 8,
          heat_points: 3,
          total_points: 11,
        },
      ],
    };

    component.editingSeason.races = [mockRace];
    component.calculateStandings();

    expect(component.standings.length).toBe(2);
    expect(component.standings[0].driver_name).toBe("Speedy");
    expect(component.standings[0].net_points).toBe(15);

    // Remove race and recalculate
    component.removeRaceFromSeason(0);
    expect(component.editingSeason.races.length).toBe(0);
    expect(component.standings.length).toBe(0);
  });

  it("should open add race modal, sort available finished races most recent to oldest, and add selected race", () => {
    component.existingSeasons = [
      {
        name: "Past Season",
        drops: 0,
        races: [
          {
            race_id: "r101",
            race_name: "Older Race",
            timestamp: 1000,
            driver_results: [],
          },
          {
            race_id: "r102",
            race_name: "Newer Race",
            timestamp: 5000,
            driver_results: [],
          },
        ],
      },
    ];

    component.openAddRaceModal();
    expect(component.showAddRaceModal).toBeTrue();
    expect(component.availableFinishedRaces.length).toBe(2);
    expect(component.availableFinishedRaces[0].race_name).toBe("Newer Race");
    expect(component.availableFinishedRaces[1].race_name).toBe("Older Race");

    // Select and add race
    component.selectedRaceToAddId = "r102_5000";
    component.addRaceToSeason();

    expect(component.editingSeason.races?.length).toBe(1);
    expect(component.editingSeason.races?.[0].race_name).toBe("Newer Race");
    expect(component.showAddRaceModal).toBeFalse();
  });

  it("should toggle race expander state", () => {
    expect(component.isRaceExpanded("r1")).toBeFalse();
    component.toggleRaceExpanded("r1");
    expect(component.isRaceExpanded("r1")).toBeTrue();
    component.toggleRaceExpanded("r1");
    expect(component.isRaceExpanded("r1")).toBeFalse();
  });

  it("should tag demo races with is_demo: true when loading race history", () => {
    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "getAllFinishedRaceHistory").and.returnValue(
      of([
        {
          original_entity_id: "demo_1",
          timestamp: 9000,
          demo: true,
          model: { name: "Demo Grand Prix" },
          drivers: [],
        },
      ]),
    );

    component.openAddRaceModal();

    expect(component.availableFinishedRaces.length).toBe(1);
    expect(component.availableFinishedRaces[0].is_demo).toBeTrue();
    expect(component.availableFinishedRaces[0].race_name).toBe(
      "Demo Grand Prix",
    );
  });

  it("should filter out races that are part of an event from the available races dialog", () => {
    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "getAllFinishedRaceHistory").and.returnValue(
      of([
        {
          original_entity_id: "race_in_event_1",
          timestamp: 10000,
          is_event_race: true,
          event_id: "evt_summer",
          model: { name: "Heat 1 of Summer Event" },
          drivers: [],
        },
        {
          original_entity_id: "standalone_race_1",
          timestamp: 20000,
          is_event_race: false,
          model: { name: "Standalone Grand Prix" },
          drivers: [],
        },
      ]),
    );

    component.openAddRaceModal();

    expect(component.availableFinishedRaces.length).toBe(1);
    expect(component.availableFinishedRaces[0].race_id).toBe(
      "standalone_race_1",
    );
  });

  it("should include finished events (both demo and non-demo) in the available races dialog if not added yet", () => {
    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "getAllFinishedRaceHistory").and.returnValue(
      of([
        {
          original_entity_id: "event_prod_1",
          timestamp: 30000,
          is_event_summary: true,
          is_demo: false,
          model: { name: "2026 Official Championship Event" },
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Dave",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 0,
              total_points: 25,
            },
          ],
        },
        {
          original_entity_id: "event_demo_1",
          timestamp: 40000,
          is_event_summary: true,
          is_demo: true,
          model: { name: "2026 Demo Cup Event" },
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Dave",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 0,
              total_points: 25,
            },
          ],
        },
      ]),
    );

    component.openAddRaceModal();

    expect(component.availableFinishedRaces.length).toBe(2);
    expect(
      component.availableFinishedRaces.some(
        (r) =>
          r.race_name === "2026 Official Championship Event" &&
          !r.is_demo &&
          r.is_event,
      ),
    ).toBeTrue();
    expect(
      component.availableFinishedRaces.some(
        (r) => r.race_name === "2026 Demo Cup Event" && r.is_demo && r.is_event,
      ),
    ).toBeTrue();
  });

  it("should exclude finished events if they have already been added to the season", () => {
    component.editingSeason.races = [
      {
        race_id: "event_prod_1",
        race_name: "2026 Official Championship Event",
        timestamp: 30000,
        driver_results: [],
      },
    ];

    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "getAllFinishedRaceHistory").and.returnValue(
      of([
        {
          original_entity_id: "event_prod_1",
          timestamp: 30000,
          is_event_summary: true,
          model: { name: "2026 Official Championship Event" },
          driver_results: [],
        },
      ]),
    );

    component.openAddRaceModal();

    expect(component.availableFinishedRaces.length).toBe(0);
  });

  it("should render modal-race-list with title attribute on race item names when add finished race modal is open", () => {
    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "getAllFinishedRaceHistory").and.returnValue(
      of([
        {
          original_entity_id: "r_test_1",
          timestamp: 10000,
          model: { name: "Test Grand Prix With Long Title" },
          drivers: [],
        },
      ]),
    );

    component.openAddRaceModal();
    fixture.detectChanges();

    const listEl = fixture.nativeElement.querySelector(".modal-race-list");
    expect(listEl).toBeTruthy();

    const nameEl = fixture.nativeElement.querySelector(".race-item-name");
    expect(nameEl).toBeTruthy();
    expect(nameEl.getAttribute("title")).toBe(
      "Test Grand Prix With Long Title",
    );
    expect(nameEl.textContent.trim()).toBe("Test Grand Prix With Long Title");
  });

  it("should have password manager ignore attributes on season name input field", () => {
    const inputEl = fixture.nativeElement.querySelector("#season-name");
    expect(inputEl).toBeTruthy();
    expect(inputEl.getAttribute("data-dashlane-ignore")).toBe("true");
    expect(inputEl.getAttribute("data-1p-ignore")).toBe("true");
    expect(inputEl.getAttribute("data-lpignore")).toBe("true");
    expect(inputEl.getAttribute("data-bwignore")).toBe("true");
    expect(inputEl.getAttribute("data-form-type")).toBe("other");
    expect(inputEl.getAttribute("autocomplete")).toBe("off");
  });

  it("should duplicate season including races run within the season when saveAsNew is called", () => {
    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "createSeason").and.callFake((s: any) =>
      of({ ...s, entity_id: "duplicated_season_id" }),
    );

    component.editingSeason = {
      entity_id: "orig_1",
      name: "Championship 2026",
      drops: 1,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 10000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Speedy",
              overall_rank: 1,
              overall_points: 10,
              heat_points: 5,
              total_points: 15,
            },
          ],
        },
      ],
    };

    component.saveAsNew();

    expect(dataService.createSeason).toHaveBeenCalled();
    const createdPayload = (
      dataService.createSeason as jasmine.Spy
    ).calls.mostRecent().args[0];
    expect(createdPayload.entity_id).toBeUndefined();
    expect(createdPayload.name).toBe("Championship 2026_1");
    expect(createdPayload.drops).toBe(1);
    expect(createdPayload.races.length).toBe(1);
    expect(createdPayload.races[0].race_name).toBe("Race 1");
    expect(createdPayload.races[0].driver_results.length).toBe(1);
    expect(component.editingSeason.entity_id).toBe("duplicated_season_id");
    expect(component.standings.length).toBe(1);
  });

  it("should set last edited season ID in NavigationService when canceling", () => {
    const navService = TestBed.inject(NavigationService);
    spyOn(navService, "setLastEditedId");

    component.editingSeason = {
      entity_id: "season_123",
      name: "Winter 2026",
      drops: 0,
    };
    component.onCancel();

    expect(navService.setLastEditedId).toHaveBeenCalledWith(
      "season",
      "season_123",
    );
  });

  it("should set last edited season ID in NavigationService when saving", () => {
    const navService = TestBed.inject(NavigationService);
    spyOn(navService, "setLastEditedId");

    component.editingSeason = {
      entity_id: "season_456",
      name: "Spring 2026",
      drops: 1,
    };
    component.onSave();

    expect(navService.setLastEditedId).toHaveBeenCalledWith(
      "season",
      "season_456",
    );
  });

  it("should interact via SeasonEditorHarness", async () => {
    component.isLoading = false;
    component.editingSeason = {
      entity_id: "s100",
      name: "Autumn Series",
      drops: 2,
    };
    fixture.detectChanges();

    const harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      SeasonEditorHarness,
    );

    const name = await harness.getName();
    expect(name).toBe("Autumn Series");

    const drops = await harness.getDrops();
    expect(drops).toBe(2);

    await harness.setName("Spring Series");
    expect(component.editingSeason.name).toBe("Spring Series");
  });

  it("should extract statistics.startMillis for SeasonRaceRecord timestamp in buildRaceRecordFromHistory", () => {
    const historyItem = {
      original_entity_id: "race_999",
      model: { name: "Sprint Cup" },
      statistics: {
        startMillis: 1710000000000,
        startTime: "2024-03-09T10:00:00Z",
      },
      id: { timestamp: 1710000120 }, // 2 minutes later
    };

    const record = component["buildRaceRecordFromHistory"](historyItem);
    expect(record.timestamp).toBe(1710000000000);
  });

  it("should fall back to parsing statistics.startTime ISO string if startMillis is absent", () => {
    const isoString = "2024-05-15T14:30:00.000Z";
    const expectedMillis = new Date(isoString).getTime();
    const historyItem = {
      original_entity_id: "race_888",
      model: { name: "Indy Cup" },
      statistics: {
        startTime: isoString,
      },
      id: { timestamp: 1710000120 },
    };

    const record = component["buildRaceRecordFromHistory"](historyItem);
    expect(record.timestamp).toBe(expectedMillis);
  });

  it("should calculate position points for drivers from season_scoring when driver_results is absent in history item", () => {
    const historyItem = {
      original_entity_id: "race_777",
      model: {
        name: "Formula 1 Cup",
        season_scoring: {
          position_points: [25, 18, 15],
          heat_position_points: [3, 1],
        },
      },
      drivers: [
        { driver: { entity_id: "d1", name: "Driver 1" }, rank: 1 },
        { driver: { entity_id: "d2", name: "Driver 2" }, rank: 2 },
      ],
    };

    const record = component["buildRaceRecordFromHistory"](historyItem);
    expect(record.driver_results.length).toBe(2);
    expect(record.driver_results[0].overall_points).toBe(25);
    expect(record.driver_results[0].total_points).toBe(25);
    expect(record.driver_results[1].overall_points).toBe(18);
    expect(record.driver_results[1].total_points).toBe(18);
  });

  it("should preserve pre-calculated driver_results when present on history item", () => {
    const historyItem = {
      original_entity_id: "race_666",
      model: { name: "Pro Cup" },
      driver_results: [
        {
          driver_id: "d10",
          driver_name: "Pro 10",
          overall_rank: 1,
          overall_points: 30,
          heat_points: 5,
          total_points: 35,
        },
      ],
    };

    const record = component["buildRaceRecordFromHistory"](historyItem);
    expect(record.driver_results.length).toBe(1);
    expect(record.driver_results[0].driver_id).toBe("d10");
    expect(record.driver_results[0].overall_points).toBe(30);
    expect(record.driver_results[0].heat_points).toBe(5);
    expect(record.driver_results[0].total_points).toBe(35);
  });
});
