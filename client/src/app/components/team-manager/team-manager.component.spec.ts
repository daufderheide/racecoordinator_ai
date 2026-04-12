import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ChangeDetectorRef } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { AnalyticsService } from "src/app/analytics.service";
import { SharedModule } from "src/app/components/shared/shared.module";
import { DataService } from "src/app/data.service";
import { Driver } from "src/app/models/driver";
import { Team } from "src/app/models/team";
import { AvatarUrlPipe } from "src/app/pipes/avatar-url.pipe";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "src/app/services/connection-monitor.service";
import { HelpService } from "src/app/services/help.service";
import { SettingsService } from "src/app/services/settings.service";
import { TranslationService } from "src/app/services/translation.service";
import { MOCK_DRIVERS } from "src/app/testing/data/drivers_data";
import {
  MOCK_TEAM_INSTANCES,
  MOCK_TEAMS,
} from "src/app/testing/data/teams_data";
import {
  mockAnalyticsService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "src/app/testing/unit-test-mocks";

import { TeamManagerComponent } from "./team-manager.component";
import { TeamManagerHarness } from "./testing/team-manager.harness";
import { createTeamManagerDataServiceMock } from "./testing/team-manager_helper";

describe("TeamManagerComponent", () => {
  let component: TeamManagerComponent;
  let fixture: ComponentFixture<TeamManagerComponent>;
  let dataService: any;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;
  let loader: HarnessLoader;
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
      declarations: [TeamManagerComponent],
      imports: [SharedModule],
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
        declarations: [TeamManagerComponent, AvatarUrlPipe],
        imports: [SharedModule],
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
});
