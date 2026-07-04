import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ChangeDetectorRef } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync as _fakeAsync,
  TestBed,
  tick as _tick,
} from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of, Subject } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import {} from "@app/models/driver";
import { Team } from "@app/models/team";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {} from "@app/testing/data/drivers_data";
import {
  MOCK_TEAM_INSTANCES,
  MOCK_TEAMS as _MOCK_TEAMS,
} from "@app/testing/data/teams_data";
import {
  mockAnalyticsService,
  mockLoggerService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { NavigationService } from "../../services/navigation.service";
import { TeamManagerComponent } from "./team-manager.component";
import { TeamManagerHarness } from "./testing/team-manager.harness";
import { createTeamManagerDataServiceMock } from "./testing/team-manager_helper";

describe("TeamManagerComponent", () => {
  let component: TeamManagerComponent;
  let fixture: ComponentFixture<TeamManagerComponent>;
  let dataService: any;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;
  let harness: TeamManagerHarness;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let mockRaceConnectionService: jasmine.SpyObj<RaceConnectionService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockConnectionMonitor = jasmine.createSpyObj("ConnectionMonitorService", [
      "startMonitoring",
      "stopMonitoring",
    ]);

    connectionStateSubject = new BehaviorSubject<ConnectionState>(
      ConnectionState.CONNECTED,
    );
    Object.defineProperty(mockConnectionMonitor, "connectionState$", {
      get: () => connectionStateSubject.asObservable(),
    });

    mockRaceConnectionService = jasmine.createSpyObj("RaceConnectionService", [
      "connect",
      "disconnect",
    ]);
    Object.defineProperty(mockRaceConnectionService, "laps$", {
      get: () => new Subject().asObservable(),
    });
    Object.defineProperty(mockRaceConnectionService, "raceFlag$", {
      get: () => new Subject().asObservable(),
    });
    Object.defineProperty(mockRaceConnectionService, "raceState$", {
      get: () => new Subject().asObservable(),
    });
    Object.defineProperty(mockRaceConnectionService, "raceTime$", {
      get: () => new Subject().asObservable(),
    });
    Object.defineProperty(mockRaceConnectionService, "interfaceAlert$", {
      get: () => new Subject().asObservable(),
    });

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
      queryParams: of({}),
    };

    await TestBed.configureTestingModule({
      imports: [TeamManagerComponent],
      providers: [
        { provide: DataService, useValue: createTeamManagerDataServiceMock() },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
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
        {
          provide: RaceService,
          useValue: jasmine.createSpyObj("RaceService", [
            "getRace",
            "getCurrentHeat",
            "setCurrentHeat",
          ]),
        },
        ChangeDetectorRef,
      ],
    }).compileComponents();

    dataService = TestBed.inject(DataService);
  });

  afterEach(
    _fakeAsync(() => {
      if (fixture) {
        fixture.destroy();
      }
      _tick(2000); // Flush RaceConnectionService delayed disconnect
      resetMocks();
    }),
  );

  async function setupFixture() {
    fixture = TestBed.createComponent(TeamManagerComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      TeamManagerHarness,
    );
    fixture.detectChanges();
  }

  it("should create", async () => {
    await setupFixture();
    expect(component).toBeTruthy();
  });

  describe("Initialization", () => {
    it("should load teams and drivers on init", async () => {
      await setupFixture();
      expect(dataService.getTeams).toHaveBeenCalled();
      expect(dataService.getDrivers).toHaveBeenCalled();
      expect(await harness.getTeamCount()).toBe(2);
    });

    it("should select first team by default if no query param", async () => {
      await setupFixture();
      expect(await harness.getSelectedTeamName()).toBe("Team Alpha");
    });

    describe("With Query Params", () => {
      beforeEach(() => {
        mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t2");
      });

      it("should select team from query param", async () => {
        await setupFixture();
        expect(await harness.getSelectedTeamName()).toBe("Team Beta");
      });
    });

    describe("With NavigationService lastEditedId", () => {
      it("should select team from NavigationService on loadTeams", async () => {
        const navService = TestBed.inject(NavigationService);
        spyOn(navService, "getLastEditedId").and.returnValue("t2");
        spyOn(navService, "clearLastEditedId");

        await setupFixture();

        expect(navService.getLastEditedId).toHaveBeenCalledWith("team");
        expect(navService.clearLastEditedId).toHaveBeenCalledWith("team");
        expect(component.selectedTeam?.entity_id).toBe("t2");
        expect(mockRouter.navigate).toHaveBeenCalledWith([], {
          relativeTo: jasmine.any(Object),
          queryParams: { id: "t2" },
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
      });
    });
  });

  describe("Create New Team", () => {
    it("should select a team and navigate to editor", async () => {
      await setupFixture();
      component.selectTeam(MOCK_TEAM_INSTANCES[0]);
      expect(component.selectedTeam).toBe(MOCK_TEAM_INSTANCES[0]);
    });

    it("should create a team with unique name and navigate to editor", async () => {
      await setupFixture();
      const createdTeam = { entity_id: "t-new", name: "New Team" };
      dataService.createTeam.and.returnValue(of(createdTeam));

      await harness.clickNewTeam();

      expect(dataService.createTeam).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: "TMM_DEFAULT_TEAM_NAME",
          driverIds: [],
          avatarUrl: undefined,
        }),
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/team-editor"], {
        queryParams: { id: "t-new", from: null, returnUrl: null },
      });
    });

    it("should generate a unique name if conflict exists", async () => {
      await setupFixture();
      const teamWithDefaultName = new Team(
        "t3",
        "TMM_DEFAULT_TEAM_NAME",
        "",
        [],
      );
      component.teams.push(teamWithDefaultName);

      const createdTeam = {
        entity_id: "t-new-1",
        name: "TMM_DEFAULT_TEAM_NAME_1",
      };
      dataService.createTeam.and.returnValue(of(createdTeam));

      await harness.clickNewTeam();

      expect(dataService.createTeam).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: "TMM_DEFAULT_TEAM_NAME_1",
        }),
      );
    });
  });

  describe("Edit Team", () => {
    it("should navigate to editor on edit click", async () => {
      await setupFixture();
      await harness.selectTeam(1);
      await harness.clickEdit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(["/team-editor"], {
        queryParams: { id: "t2", from: null, returnUrl: null },
      });
    });

    it("should propagate 'from' and 'returnUrl' when navigating to editor", async () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
        (key: string) => {
          if (key === "from") return "modify-heats";
          if (key === "returnUrl") return "/default-raceday";
          return null;
        },
      );

      await setupFixture();

      await harness.selectTeam(0);
      await harness.clickEdit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(["/team-editor"], {
        queryParams: {
          id: "t1",
          from: "modify-heats",
          returnUrl: "/default-raceday",
        },
      });
    });

    it("should compute correct backTargetUrl when from is 'modify-heats'", async () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
        (key: string) => {
          if (key === "from") return "modify-heats";
          if (key === "returnUrl") return "/custom-raceday";
          return null;
        },
      );

      await setupFixture();

      expect(component.backTargetUrl()).toBe("/custom-raceday");
      expect(component.backQueryParams()).toEqual({ modifyHeats: "true" });
    });

    it("should default to /raceday-setup when from is NOT 'modify-heats'", async () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
        (_key: string) => {
          return null;
        },
      );

      await setupFixture();

      expect(component.backTargetUrl()).toBe("/raceday-setup");
      expect(component.backQueryParams()).toEqual({});
    });
  });

  describe("Deletion", () => {
    it("should show confirmation modal", async () => {
      await setupFixture();
      await harness.selectTeam(0);
      await harness.clickDelete();
      expect(component.showDeleteConfirmation).toBeTrue();
    });

    it("should delete team if confirmed", async () => {
      await setupFixture();
      dataService.deleteTeam.and.returnValue(of({}));
      await harness.selectTeam(0);
      await harness.clickDelete();
      component.onConfirmDelete();
      expect(component.showDeleteConfirmation).toBeFalse();
      expect(dataService.deleteTeam).toHaveBeenCalledWith("t1");
    });
  });

  describe("Natural Sorting", () => {
    it("should sort teams naturally by name", async () => {
      dataService.getTeams.and.returnValue(
        of([
          new Team("t10", "Team 10", "", []),
          new Team("t2", "Team 2", "", []),
          new Team("t1", "Team 1", "", []),
          new Team("t20", "Team 20", "", []),
        ]),
      );
      await setupFixture();
      const filteredTeams = component.filteredTeams;

      expect(filteredTeams.map((t) => t.name)).toEqual([
        "Team 1",
        "Team 2",
        "Team 10",
        "Team 20",
      ]);
    });

    it("should maintain natural sort order when filtering", async () => {
      dataService.getTeams.and.returnValue(
        of([
          new Team("t10", "Team 10", "", []),
          new Team("t2", "Team 2", "", []),
          new Team("test", "Test Team", "", []),
          new Team("t1", "Team 1", "", []),
          new Team("t20", "Team 20", "", []),
        ]),
      );
      await setupFixture();

      component.searchQuery = "team"; // This should match all items containing "team"

      const filteredTeams = component.filteredTeams;

      expect(filteredTeams.map((t) => t.name)).toEqual([
        "Team 1",
        "Team 2",
        "Team 10",
        "Team 20",
        "Test Team",
      ]);
    });

    it("should handle empty names in natural sort", async () => {
      dataService.getTeams.and.returnValue(
        of([
          new Team("null", "", "", []),
          new Team("t10", "Team 10", "", []),
          new Team("empty", "", "", []),
          new Team("t2", "Team 2", "", []),
        ]),
      );
      await setupFixture();
      const filteredTeams = component.filteredTeams;

      expect(filteredTeams.map((t) => t.name)).toEqual([
        "",
        "",
        "Team 2",
        "Team 10",
      ]);
    });

    it("should sort team names with multiple numeric parts naturally", async () => {
      dataService.getTeams.and.returnValue(
        of([
          new Team("t1", "Team A1", "", []),
          new Team("t2", "Team A10", "", []),
          new Team("t3", "Team A2", "", []),
          new Team("t4", "Team B1", "", []),
        ]),
      );
      await setupFixture();

      const filteredTeams = component.filteredTeams;

      expect(filteredTeams.map((t) => t.name)).toEqual([
        "Team A1",
        "Team A2",
        "Team A10",
        "Team B1",
      ]);
    });
  });
});
