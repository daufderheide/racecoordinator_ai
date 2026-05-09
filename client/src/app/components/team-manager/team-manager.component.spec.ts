import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ChangeDetectorRef } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync as _fakeAsync,
  TestBed,
  tick as _tick,
} from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "@app/data.service";
import {} from "@app/models/driver";
import { Team } from "@app/models/team";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { AnalyticsService } from "@app/services/analytics.service";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {} from "@app/testing/data/drivers_data";
import {
  MOCK_TEAM_INSTANCES,
  MOCK_TEAMS as _MOCK_TEAMS,
} from "@app/testing/data/teams_data";
import {
  mockAnalyticsService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

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
        ChangeDetectorRef,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    resetMocks();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(TeamManagerComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      TeamManagerHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Initialization", () => {
    it("should load teams and drivers on init", async () => {
      expect(dataService.getTeams).toHaveBeenCalled();
      expect(dataService.getDrivers).toHaveBeenCalled();
      expect(await harness.getTeamCount()).toBe(2);
    });

    it("should select first team by default if no query param", async () => {
      expect(await harness.getSelectedTeamName()).toBe("Team Alpha");
    });

    it("should select team from query param", async () => {
      fixture.destroy();
      TestBed.resetTestingModule();
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t2");

      TestBed.configureTestingModule({
        imports: [TeamManagerComponent, AvatarUrlPipe],
        providers: [
          {
            provide: DataService,
            useValue: createTeamManagerDataServiceMock(),
          },
          { provide: TranslationService, useValue: mockTranslationService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          {
            provide: ConnectionMonitorService,
            useValue: mockConnectionMonitor,
          },
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
          ChangeDetectorRef,
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TeamManagerComponent);
      component = fixture.componentInstance;
      harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        TeamManagerHarness,
      );
      fixture.detectChanges();

      expect(await harness.getSelectedTeamName()).toBe("Team Beta");
    });
  });

  describe("Create New Team", () => {
    it("should select a team and navigate to editor", async () => {
      component.selectTeam(MOCK_TEAM_INSTANCES[0]);
      expect(component.selectedTeam).toBe(MOCK_TEAM_INSTANCES[0]);
    });

    it("should create a team with unique name and navigate to editor", async () => {
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
        queryParams: { id: "t-new" },
      });
    });

    it("should generate a unique name if conflict exists", async () => {
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
      await harness.selectTeam(1);
      await harness.clickEdit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(["/team-editor"], {
        queryParams: { id: "t2" },
      });
    });
  });

  describe("Deletion", () => {
    it("should show confirmation modal", async () => {
      await harness.selectTeam(0);
      await harness.clickDelete();
      expect(component.showDeleteConfirmation).toBeTrue();
    });

    it("should delete team if confirmed", async () => {
      dataService.deleteTeam.and.returnValue(of({}));
      await harness.selectTeam(0);
      await harness.clickDelete();
      component.onConfirmDelete();
      expect(component.showDeleteConfirmation).toBeFalse();
      expect(dataService.deleteTeam).toHaveBeenCalledWith("t1");
    });
  });

  describe("Natural Sorting", () => {
    it("should sort teams naturally by name", () => {
      component.teams = [
        new Team("t10", "Team 10", "", []),
        new Team("t2", "Team 2", "", []),
        new Team("t1", "Team 1", "", []),
        new Team("t20", "Team 20", "", []),
      ];

      const filteredTeams = component.filteredTeams;

      expect(filteredTeams.map((t) => t.name)).toEqual([
        "Team 1",
        "Team 2",
        "Team 10",
        "Team 20",
      ]);
    });

    it("should maintain natural sort order when filtering", () => {
      component.teams = [
        new Team("t10", "Team 10", "", []),
        new Team("t2", "Team 2", "", []),
        new Team("test", "Test Team", "", []),
        new Team("t1", "Team 1", "", []),
        new Team("t20", "Team 20", "", []),
      ];

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

    it("should handle empty names in natural sort", () => {
      component.teams = [
        new Team("null", "", "", []),
        new Team("t10", "Team 10", "", []),
        new Team("empty", "", "", []),
        new Team("t2", "Team 2", "", []),
      ];

      const filteredTeams = component.filteredTeams;

      expect(filteredTeams.map((t) => t.name)).toEqual([
        "",
        "",
        "Team 2",
        "Team 10",
      ]);
    });

    it("should sort team names with multiple numeric parts naturally", () => {
      component.teams = [
        new Team("t1", "Team A1", "", []),
        new Team("t2", "Team A10", "", []),
        new Team("t3", "Team A2", "", []),
        new Team("t4", "Team B1", "", []),
      ];

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
