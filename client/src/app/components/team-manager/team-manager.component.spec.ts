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

import { TeamManagerComponent } from "./team-manager.component";
import { TeamManagerHarness } from "./testing/team-manager.harness";

describe("TeamManagerComponent", () => {
  let component: TeamManagerComponent;
  let fixture: ComponentFixture<TeamManagerComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let mockHelpService: jasmine.SpyObj<HelpService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;
  let mockActivatedRoute: any;
  let loader: HarnessLoader;
  let harness: TeamManagerHarness;

  const mockDrivers = [
    new Driver("d1", "Alice", "Rocket", "assets/images/default_avatar.svg"),
    new Driver("d2", "Bob", "Drifter", "assets/images/default_avatar.svg"),
  ];

  const mockTeams = [
    new Team("t1", "Team Alpha", "assets/images/default_avatar.svg", ["d1"]),
    new Team("t2", "Team Beta", "assets/images/default_avatar.svg", ["d2"]),
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getTeams",
      "getDrivers",
      "deleteTeam",
      "createTeam",
    ]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockConnectionMonitor = jasmine.createSpyObj("ConnectionMonitorService", [
      "startMonitoring",
      "stopMonitoring",
    ]);
    mockHelpService = jasmine.createSpyObj("HelpService", [
      "startGuide",
      "nextStep",
      "previousStep",
      "endGuide",
    ]);
    Object.defineProperty(mockHelpService, "isVisible$", {
      get: () => of(false),
    });
    Object.defineProperty(mockHelpService, "currentStep$", {
      get: () => of(null),
    });
    Object.defineProperty(mockHelpService, "hasNext$", {
      get: () => of(false),
    });
    Object.defineProperty(mockHelpService, "hasPrevious$", {
      get: () => of(false),
    });

    mockSettingsService = jasmine.createSpyObj("SettingsService", [
      "getSettings",
      "saveSettings",
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

    mockDataService.getTeams.and.returnValue(of(mockTeams));
    mockDataService.getDrivers.and.returnValue(of(mockDrivers));
    mockTranslationService.translate.and.callFake((key) => key);
    mockSettingsService.getSettings.and.returnValue({
      teamManagerHelpShown: true,
    } as any);

    await TestBed.configureTestingModule({
      declarations: [TeamManagerComponent],
      imports: [SharedModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: HelpService, useValue: mockHelpService },
        { provide: SettingsService, useValue: mockSettingsService },
        ChangeDetectorRef,
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(TeamManagerComponent);
    component = fixture.componentInstance;
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
      expect(mockDataService.getTeams).toHaveBeenCalled();
      expect(mockDataService.getDrivers).toHaveBeenCalled();
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
          { provide: DataService, useValue: mockDataService },
          { provide: TranslationService, useValue: mockTranslationService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          {
            provide: ConnectionMonitorService,
            useValue: mockConnectionMonitor,
          },
          { provide: HelpService, useValue: mockHelpService },
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
    it("should create a team with unique name and navigate to editor", async () => {
      const createdTeam = { entity_id: "t-new", name: "New Team" };
      mockDataService.createTeam.and.returnValue(of(createdTeam));

      await harness.clickNewTeam();

      expect(mockDataService.createTeam).toHaveBeenCalledWith(
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
      mockDataService.createTeam.and.returnValue(of(createdTeam));

      await harness.clickNewTeam();

      expect(mockDataService.createTeam).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: "TMM_DEFAULT_TEAM_NAME_1",
        }),
      );
    });
  });

  describe("Guided Help", () => {
    it("should trigger help auto-open on first visit", fakeAsync(() => {
      fixture.destroy();
      TestBed.resetTestingModule();

      mockSettingsService.getSettings.and.returnValue({
        teamManagerHelpShown: false,
      } as any);

      TestBed.configureTestingModule({
        declarations: [TeamManagerComponent],
        imports: [SharedModule],
        providers: [
          { provide: DataService, useValue: mockDataService },
          { provide: TranslationService, useValue: mockTranslationService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          {
            provide: ConnectionMonitorService,
            useValue: mockConnectionMonitor,
          },
          { provide: HelpService, useValue: mockHelpService },
          { provide: SettingsService, useValue: mockSettingsService },
          ChangeDetectorRef,
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TeamManagerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      tick(1000);

      expect(mockHelpService.startGuide).toHaveBeenCalled();
      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith(
        jasmine.objectContaining({
          teamManagerHelpShown: true,
        }),
      );
    }));
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
      mockDataService.deleteTeam.and.returnValue(of({}));
      await harness.selectTeam(0);
      await harness.clickDelete();
      component.onConfirmDelete();
      expect(component.showDeleteConfirmation).toBeFalse();
      expect(mockDataService.deleteTeam).toHaveBeenCalledWith("t1");
    });
  });
});
