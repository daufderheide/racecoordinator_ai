import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
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
      imports: [SeasonManagerComponent, FormsModule, TranslatePipe],
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
          imports: [MockManagerHeaderComponent, TranslatePipe, FormsModule],
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
});
