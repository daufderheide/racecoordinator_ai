import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { DecimalPipe } from "@angular/common";
import { Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockLoggerService,
  mockSettingsService,
  mockTranslationService,
} from "@app/testing/unit-test-mocks";

import { SeasonManagerComponent } from "./season-manager.component";
import { SeasonManagerHarness } from "./testing/season-manager.harness";

@Component({
  standalone: true,
  selector: "app-manager-header",
  template: "",
})
class MockManagerHeaderComponent {}

describe("SeasonManagerComponent", () => {
  let component: SeasonManagerComponent;
  let fixture: ComponentFixture<SeasonManagerComponent>;

  beforeEach(async () => {
    const mockDataService = {
      getSeasons: () => of([]),
      getAllFinishedRaceHistory: () => of([]),
      deleteSeason: () => of({}),
    };

    const mockConnectionMonitorService = {
      connectionState$: of("CONNECTED"),
    };

    const mockNavigationService = {
      getLastEditedId: (_type: string) => null,
      setLastEditedId: (_type: string, _id: string) => {},
      clearLastEditedId: (_type: string) => {},
    };

    await TestBed.configureTestingModule({
      imports: [
        SeasonManagerComponent,
        FormsModule,
        TranslatePipe,
        DecimalPipe,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: NavigationService, useValue: mockNavigationService },
        {
          provide: ConnectionMonitorService,
          useValue: mockConnectionMonitorService,
        },
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
      .overrideComponent(SeasonManagerComponent, {
        set: {
          imports: [
            MockManagerHeaderComponent,
            TranslatePipe,
            DecimalPipe,
            FormsModule,
          ],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SeasonManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render stationary standings header and scrollable standings body container when season has standings", () => {
    component.selectedSeason = {
      entity_id: "s1",
      name: "2026 Season",
      drops: 0,
    } as any;
    component.standings = [
      {
        driver_id: "d1",
        driver_name: "Speedy",
        net_points: 10,
        gross_points: 10,
        races_run: 1,
      },
    ];
    fixture.detectChanges();

    const headerContainer = fixture.nativeElement.querySelector(
      ".standings-header-container",
    );
    const bodyContainer = fixture.nativeElement.querySelector(
      ".standings-body-container",
    );

    expect(headerContainer).toBeTruthy();
    expect(bodyContainer).toBeTruthy();
  });

  it("should select last edited season from NavigationService and clear it when loading data", () => {
    const navService = TestBed.inject(NavigationService);
    spyOn(navService, "getLastEditedId").and.returnValue("s2");
    spyOn(navService, "clearLastEditedId");

    const seasons = [
      { entity_id: "s1", name: "Season 1", drops: 0 },
      { entity_id: "s2", name: "Season 2", drops: 0 },
    ];

    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "getSeasons").and.returnValue(of(seasons));

    component.loadData();

    expect(navService.getLastEditedId).toHaveBeenCalledWith("season");
    expect(navService.clearLastEditedId).toHaveBeenCalledWith("season");
    expect(component.selectedSeason?.entity_id).toBe("s2");
  });

  it("should select the first alphabetically sorted season by default when backend returns unsorted seasons", () => {
    const seasons = [
      { entity_id: "s99", name: "Zack League", drops: 0 },
      { entity_id: "s1", name: "Alpha Championship", drops: 0 },
    ];
    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "getSeasons").and.returnValue(of(seasons));

    component.selectedSeason = undefined;
    component.loadData();

    expect((component.selectedSeason as any)?.name).toBe("Alpha Championship");
    expect(component.seasons[0].name).toBe("Alpha Championship");
  });

  it("should interact via SeasonManagerHarness", async () => {
    component.isLoading = false;
    component.seasons = [
      { entity_id: "s1", name: "Summer League", drops: 0 },
      { entity_id: "s2", name: "Winter League", drops: 1 },
    ];
    component.selectedSeason = component.seasons[0];
    fixture.detectChanges();

    const harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      SeasonManagerHarness,
    );

    const count = await harness.getSeasonCount();
    expect(count).toBe(2);

    const selectedName = await harness.getSelectedSeasonName();
    expect(selectedName).toBe("Summer League");
  });

  describe("Filtering, Standings and CRUD Actions", () => {
    it("should filter seasons by search query", () => {
      component.seasons = [
        { entity_id: "s1", name: "Alpha Championship", drops: 0 },
        { entity_id: "s2", name: "Beta Cup", drops: 0 },
      ];
      component.searchQuery = "beta";
      expect(component.filteredSeasons.length).toBe(1);
      expect(component.filteredSeasons[0].name).toBe("Beta Cup");
    });

    it("should correctly detect hasDemoRaces", () => {
      expect(component.hasDemoRaces).toBeFalse();

      component.selectedSeason = {
        entity_id: "s1",
        name: "Test",
        races: [{ race_id: "r1", is_demo: true } as any],
      } as any;
      expect(component.hasDemoRaces).toBeTrue();
    });

    it("should calculate standings with drop logic", () => {
      const season: any = {
        entity_id: "s1",
        name: "Drop Season",
        drops: 1,
        races: [
          {
            race_id: "r1",
            race_name: "Race 1",
            timestamp: 1000,
            driver_results: [
              {
                driver_id: "d1",
                driver_name: "Speedy",
                overall_rank: 1,
                overall_points: 25,
                heat_points: 5,
                total_points: 30,
              },
            ],
          },
          {
            race_id: "r2",
            race_name: "Race 2",
            timestamp: 2000,
            driver_results: [
              {
                driver_id: "d1",
                driver_name: "Speedy",
                overall_rank: 2,
                overall_points: 10,
                heat_points: 2,
                total_points: 12,
              },
            ],
          },
        ],
      };

      component.calculateStandings(season);
      expect(component.standings.length).toBe(1);
      const standing = component.standings[0];
      expect(standing.gross_points).toBe(42);
      expect(standing.net_points).toBe(30); // 12 was dropped
      expect(standing.races_run).toBe(2);
      expect(
        standing.race_scores?.find((s) => s.race_id === "r2")?.is_dropped,
      ).toBeTrue();
    });

    it("should handle navigation onNew, onEdit, onDelete, onBack", () => {
      const router = TestBed.inject(Router);
      component.selectedSeason = { entity_id: "s1", name: "Season 1" } as any;

      component.onNew();
      expect(router.navigate).toHaveBeenCalledWith(["/season-editor"]);

      component.onEdit();
      expect(router.navigate).toHaveBeenCalledWith(["/season-editor"], {
        queryParams: { id: "s1" },
      });

      component.onDelete();
      expect(component.showDeleteConfirmation).toBeTrue();

      component.cancelDelete();
      expect(component.showDeleteConfirmation).toBeFalse();

      component.onBack();
      expect(router.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });

    it("should confirmDelete and trigger season deletion", () => {
      const dataService = TestBed.inject(DataService);
      spyOn(dataService, "deleteSeason").and.returnValue(of({}));
      spyOn(component, "loadData");

      component.selectedSeason = { entity_id: "s1", name: "Season 1" } as any;
      component.confirmDelete();

      expect(dataService.deleteSeason).toHaveBeenCalledWith("s1");
      expect(component.showDeleteConfirmation).toBeFalse();
      expect(component.loadData).toHaveBeenCalled();
    });

    it("should format decimal points in standings table to at most 2 decimal places and keep whole numbers without trailing zeros", () => {
      component.selectedSeason = {
        entity_id: "s1",
        name: "Formula 1 Season",
        drops: 0,
      } as any;
      component.standings = [
        {
          driver_id: "d1",
          driver_name: "Max",
          net_points: 33.333333333333336,
          gross_points: 50.126,
          races_run: 3,
        },
        {
          driver_id: "d2",
          driver_name: "Lewis",
          net_points: 25,
          gross_points: 25.5,
          races_run: 2,
        },
      ];
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll(
        ".standings-body-container tbody tr",
      );
      expect(rows.length).toBe(2);

      // First driver: 33.333333333333336 -> 33.33, 50.126 -> 50.13
      const firstRowCols = rows[0].querySelectorAll("td");
      expect(firstRowCols[2].textContent.trim()).toBe("33.33");
      expect(firstRowCols[3].textContent.trim()).toBe("50.13");

      // Second driver: 25 -> 25, 25.5 -> 25.5
      const secondRowCols = rows[1].querySelectorAll("td");
      expect(secondRowCols[2].textContent.trim()).toBe("25");
      expect(secondRowCols[3].textContent.trim()).toBe("25.5");
    });

    it("should render season metadata elements in .season-meta under the header", () => {
      component.selectedSeason = {
        entity_id: "s1",
        name: "Pro Championship",
        drops: 2,
        races: [{ race_id: "r1", is_demo: true } as any],
      } as any;
      fixture.detectChanges();

      const detailHeader =
        fixture.nativeElement.querySelector(".detail-header");
      const title = detailHeader.querySelector("h2");
      const meta = detailHeader.querySelector(".season-meta");
      const pills = meta.querySelectorAll(".meta-pill");
      const demoBadge = meta.querySelector(".badge-demo");

      expect(title.textContent.trim()).toBe("Pro Championship");
      expect(pills.length).toBe(2);
      expect(pills[0].textContent).toContain("2"); // Drops count
      expect(pills[1].textContent).toContain("1"); // Races run count
      expect(demoBadge).toBeTruthy();
    });
  });

  describe("Guided Help", () => {
    it("should return complete guided help steps when there are no demo races", () => {
      component.selectedSeason = {
        entity_id: "s1",
        name: "Pro Season",
        drops: 1,
        races: [{ race_id: "r1", is_demo: false } as any],
      } as any;
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(8);

      // Welcome Step
      expect(steps[0].title).toBe("SM_HELP_WELCOME_TITLE");
      expect(steps[0].content).toBe("SM_HELP_WELCOME_CONTENT");
      expect(steps[0].position).toBe("center");
      expect(steps[0].selector).toBeUndefined();

      // LHS Steps
      expect(steps[1].selector).toBe("#season-list-container");
      expect(steps[1].title).toBe("SM_HELP_LIST_TITLE");
      expect(steps[1].position).toBe("right");

      expect(steps[2].selector).toBe("#season-search-bar");
      expect(steps[2].title).toBe("SM_HELP_SEARCH_TITLE");
      expect(steps[2].position).toBe("right");

      // RHS Steps
      expect(steps[3].selector).toBe("#season-detail-name");
      expect(steps[3].title).toBe("SM_HELP_NAME_TITLE");
      expect(steps[3].position).toBe("bottom");

      expect(steps[4].selector).toBe("#season-detail-drops");
      expect(steps[4].title).toBe("SM_HELP_DROPS_TITLE");
      expect(steps[4].position).toBe("bottom");

      expect(steps[5].selector).toBe("#season-detail-races");
      expect(steps[5].title).toBe("SM_HELP_RACES_RUN_TITLE");
      expect(steps[5].position).toBe("bottom");

      expect(steps[6].selector).toBe("#season-detail-meta");
      expect(steps[6].title).toBe("SM_HELP_DEMO_BADGE_TITLE");
      expect(steps[6].content).toBe("SM_HELP_DEMO_BADGE_ABSENT_CONTENT");
      expect(steps[6].position).toBe("bottom");

      expect(steps[7].selector).toBe("#season-detail-standings");
      expect(steps[7].title).toBe("SM_HELP_STANDINGS_TITLE");
      expect(steps[7].position).toBe("left");
    });

    it("should point to demo badge and use present content when season has demo races", () => {
      component.selectedSeason = {
        entity_id: "s1",
        name: "Pro Season",
        drops: 1,
        races: [{ race_id: "r1", is_demo: true } as any],
      } as any;
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(8);

      expect(steps[6].selector).toBe("#season-detail-demo-badge");
      expect(steps[6].title).toBe("SM_HELP_DEMO_BADGE_TITLE");
      expect(steps[6].content).toBe("SM_HELP_DEMO_BADGE_PRESENT_CONTENT");
      expect(steps[6].position).toBe("bottom");
    });
  });
});
