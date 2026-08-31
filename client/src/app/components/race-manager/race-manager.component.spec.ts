import { NO_ERRORS_SCHEMA } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import { Race } from "@app/models/race";
import { Role } from "@app/models/role";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  MOCK_RACE_INSTANCES,
  MOCK_RACES as _MOCK_RACES,
} from "@app/testing/data/races_data";
import {
  MOCK_TRACK_INSTANCES,
  MOCK_TRACKS,
} from "@app/testing/data/tracks_data";
import {
  mockAnalyticsService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";
import { deepCopy } from "@app/utils/clone.utils";

import { NavigationService } from "../../services/navigation.service";
import { RaceManagerComponent } from "./race-manager.component";
import { createRaceManagerDataServiceMock } from "./testing/race-manager_helper";

describe("RaceManagerComponent", () => {
  let component: RaceManagerComponent;
  let fixture: import("@angular/core/testing").ComponentFixture<RaceManagerComponent>;
  let dataService: any;
  let _router: any;
  let _activatedRoute: any;
  let roleSubject: BehaviorSubject<Role>;
  let mockAuthService: any;

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    roleSubject = new BehaviorSubject<Role>(Role.ADMIN);
    mockAuthService = {
      currentRole: Role.ADMIN,
      currentRole$: roleSubject.asObservable(),
    };

    const mockConnectionMonitor = jasmine.createSpyObj(
      "ConnectionMonitorService",
      ["startMonitoring", "stopMonitoring"],
      { connectionState$: of() },
    );

    const mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
      queryParams: of({ help: "false" }),
    };

    const mockRaceConnectionService = jasmine.createSpyObj(
      "RaceConnectionService",
      ["connect", "disconnect"],
    );

    TestBed.configureTestingModule({
      imports: [FormsModule, RaceManagerComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: createRaceManagerDataServiceMock() },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: AuthService, useValue: mockAuthService },
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
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(RaceManagerComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    _router = TestBed.inject(Router);
    _activatedRoute = TestBed.inject(ActivatedRoute);

    // Standardize races as class instances for all tests
    component.races = deepCopy(MOCK_RACE_INSTANCES).map((r: any) => {
      Object.setPrototypeOf(r, Race.prototype);
      return r;
    });
    component.tracks = deepCopy(MOCK_TRACK_INSTANCES).map((t: any) => {
      Object.setPrototypeOf(t, Track.prototype);
      return t;
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    resetMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load races on init", () => {
    component.ngOnInit();

    expect(dataService.getRaces).toHaveBeenCalled();
    expect(component.races.length).toBe(3);
    expect(component.races[0].name).toBe("Digital Sprint");
    expect(component.races[1].name).toBe("Endurance Challenge");
    expect(component.races[2].name).toBe("Grand Prix");
  });

  it("should select race from NavigationService lastEditedId on loadData", fakeAsync(() => {
    const navService = TestBed.inject(NavigationService);
    spyOn(navService, "getLastEditedId").and.returnValue("r3");
    spyOn(navService, "clearLastEditedId");

    component.loadData();
    tick();
    fixture.detectChanges();

    expect(navService.getLastEditedId).toHaveBeenCalledWith("race");
    expect(navService.clearLastEditedId).toHaveBeenCalledWith("race");
    expect(component.selectedRace?.entity_id).toBe("r3");
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.any(Object),
      queryParams: { id: "r3" },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }));

  it("should filter races based on search query", () => {
    component.races = [
      { entity_id: "1", name: "Grand Prix", track: { name: "Monaco" } },
      { entity_id: "2", name: "Time Trial", track: { name: "Spa" } },
      { entity_id: "3", name: "Endurance", track: { name: "Le Mans" } },
    ];

    component.searchQuery = "Monaco";
    expect(component.filteredRaces.length).toBe(1);
    expect(component.filteredRaces[0].name).toBe("Grand Prix");

    component.searchQuery = "Trial";
    expect(component.filteredRaces.length).toBe(1);
    expect(component.filteredRaces[0].name).toBe("Time Trial");

    component.searchQuery = "";
    expect(component.filteredRaces.length).toBe(3);
  });

  it("should select the first alphabetically sorted race by default when backend returns unsorted races", () => {
    dataService.getRaces.and.returnValue(
      of([
        { entity_id: "r99", name: "Zack Cup" },
        { entity_id: "r1", name: "Alpha Cup" },
      ] as any),
    );
    component.selectedRace = undefined;
    component.loadData();
    expect(component.selectedRace?.name).toBe("Alpha Cup");
    expect(component.races[0].name).toBe("Alpha Cup");
  });

  it("should select a race and load heats if driverCount > 0", () => {
    const mockRace = component.races.find((r) => r.entity_id === "r2")!;
    component.driverCount = 4;
    dataService.generateHeats.and.returnValue(of({ heats: [] }));

    component.selectRace(mockRace);

    expect(component.selectedRace).toEqual(mockRace);
    expect(component.editingRace).toEqual(mockRace);
    expect(dataService.generateHeats).toHaveBeenCalledWith("r2", 4);
  });

  it("should navigate to race editor when updateRace is called", () => {
    component.selectedRace = { entity_id: "1" };
    component.driverCount = 4;

    component.updateRace();

    expect(mockRouter.navigate).toHaveBeenCalledWith(["/race-editor"], {
      queryParams: {
        id: "1",
        driverCount: 4,
        from: null,
        returnUrl: null,
      },
    });
  });

  it("should propagate 'from' and 'returnUrl' when navigating to editor", () => {
    _activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
      if (key === "from") return "modify-heats";
      if (key === "returnUrl") return "/default-raceday";
      return null;
    });

    component.selectedRace = { entity_id: "1" };
    component.driverCount = 4;
    component.updateRace();

    expect(mockRouter.navigate).toHaveBeenCalledWith(["/race-editor"], {
      queryParams: {
        id: "1",
        driverCount: 4,
        from: "modify-heats",
        returnUrl: "/default-raceday",
      },
    });
  });

  it("should show delete confirmation and delete race", () => {
    component.editingRace = { entity_id: "r1" };
    dataService.deleteRace.and.returnValue(of({}));

    component.deleteRace();
    expect(component.showDeleteConfirmation).toBeTrue();

    component.onConfirmDelete();
    expect(dataService.deleteRace).toHaveBeenCalledWith("r1");
    expect(component.showDeleteConfirmation).toBeFalse();
    expect(dataService.getRaces).toHaveBeenCalled();
  });

  it("should cancel delete", () => {
    component.showDeleteConfirmation = true;
    component.onCancelDelete();
    expect(component.showDeleteConfirmation).toBeFalse();
  });

  it("should load tracks on loadData", () => {
    component.loadData();

    expect(dataService.getTracks).toHaveBeenCalled();
    expect(component.tracks).toEqual(MOCK_TRACKS);
  });

  describe("createNewRace", () => {
    it("should create race and navigate to race-editor", () => {
      component.tracks = [];
      const createdRace = { entity_id: "r-new" };
      dataService.createRace.and.returnValue(of(createdRace));

      component.createNewRace();

      expect(dataService.createRace).toHaveBeenCalledWith(
        jasmine.objectContaining({
          min_lap_time: 1.5,
        }),
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/race-editor"], {
        queryParams: {
          id: "r-new",
          driverCount: component.driverCount,
          from: null,
          returnUrl: null,
        },
      });
    });

    it("should propagate 'from' and 'returnUrl' during creation", () => {
      _activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
        if (key === "from") return "modify-heats";
        if (key === "returnUrl") return "/default-raceday";
        return null;
      });

      const createdRace = { entity_id: "r-new" };
      dataService.createRace.and.returnValue(of(createdRace));

      component.createNewRace();

      expect(mockRouter.navigate).toHaveBeenCalledWith(["/race-editor"], {
        queryParams: {
          id: "r-new",
          driverCount: component.driverCount,
          from: "modify-heats",
          returnUrl: "/default-raceday",
        },
      });
    });

    it("should auto-assign track if exactly one track exists", () => {
      component.tracks = [{ entity_id: "t1", name: "Track 1" }];
      const createdRace = { entity_id: "r-new" };
      dataService.createRace.and.returnValue(of(createdRace));

      component.createNewRace();

      expect(dataService.createRace).toHaveBeenCalledWith(
        jasmine.objectContaining({
          track_entity_id: "t1",
        }),
      );
    });

    it("should auto-assign track if multiple tracks exist", () => {
      component.tracks = [
        { entity_id: "t1", name: "Track 1" },
        { entity_id: "t2", name: "Track 2" },
      ];
      const createdRace = { entity_id: "r-new" };
      dataService.createRace.and.returnValue(of(createdRace));

      component.createNewRace();

      const callArg = dataService.createRace.calls.mostRecent().args[0];
      expect(callArg.track_entity_id).toEqual("t1");
    });
  });

  describe("Natural Sorting", () => {
    it("should sort races naturally by name", () => {
      component.races = [
        { name: "Race 10", entity_id: "r10" },
        { name: "Race 2", entity_id: "r2" },
        { name: "Race 1", entity_id: "r1" },
        { name: "Race 20", entity_id: "r20" },
      ];

      const filteredRaces = component.filteredRaces;

      expect(filteredRaces.map((r) => r.name)).toEqual([
        "Race 1",
        "Race 2",
        "Race 10",
        "Race 20",
      ]);
    });

    it("should maintain natural sort order when filtering", () => {
      component.races = [
        { name: "Race 10", entity_id: "r10" },
        { name: "Race 2", entity_id: "r2" },
        { name: "Test Race", entity_id: "test" },
        { name: "Race 1", entity_id: "r1" },
        { name: "Race 20", entity_id: "r20" },
      ];

      component.searchQuery = "race"; // This should match all items containing "race"

      const filteredRaces = component.filteredRaces;

      expect(filteredRaces.map((r) => r.name)).toEqual([
        "Race 1",
        "Race 2",
        "Race 10",
        "Race 20",
        "Test Race",
      ]);
    });

    it("should handle empty/null names in natural sort", () => {
      component.races = [
        { name: null, entity_id: "null" },
        { name: "Race 10", entity_id: "r10" },
        { name: "", entity_id: "empty" },
        { name: "Race 2", entity_id: "r2" },
      ];

      const filteredRaces = component.filteredRaces;

      // Empty strings come first, then named items in natural order
      expect(filteredRaces.map((r) => r.name || "")).toEqual([
        "",
        "",
        "Race 2",
        "Race 10",
      ]);
    });
  });

  describe("Race Creation, Deletion, Heats and Formatting", () => {
    it("should create new race with unique name and navigate to editor", () => {
      dataService.createRace.and.returnValue(
        of({ entity_id: "new_r1", name: "RM_DEFAULT_RACE_NAME_1" }),
      );
      component.races = [
        { name: "RM_DEFAULT_RACE_NAME", entity_id: "r1" } as any,
      ];
      component.tracks = [{ entity_id: "t1", name: "Main Track" } as any];

      component.createNewRace();

      expect(dataService.createRace).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: "RM_DEFAULT_RACE_NAME_1",
          track_entity_id: "t1",
        }),
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ["/race-editor"],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({ id: "new_r1" }),
        }),
      );
    });

    it("should handle race deletion modal confirmation and cancellation", () => {
      component.editingRace = { entity_id: "r1", name: "Race 1" } as any;

      component.deleteRace();
      expect(component.showDeleteConfirmation).toBeTrue();

      component.onCancelDelete();
      expect(component.showDeleteConfirmation).toBeFalse();

      dataService.deleteRace.and.returnValue(of({ success: true }));
      spyOn(component, "loadData");

      component.onConfirmDelete();
      expect(dataService.deleteRace).toHaveBeenCalledWith("r1");
      expect(component.loadData).toHaveBeenCalled();
    });

    it("should load generated heats when loadHeats is called", () => {
      component.driverCount = 4;
      dataService.generateHeats.and.returnValue(
        of({ heats: [{ heat_number: 1 }] }),
      );

      component.loadHeats("r1");
      expect(dataService.generateHeats).toHaveBeenCalledWith("r1", 4);
      expect(component.generatedHeats.length).toBe(1);
    });

    it("should format ranking displays for practice and standard races", () => {
      const practiceRace = {
        name: "Open Practice",
        practice: true,
        heat_rotation_type: "Practice",
      };
      expect(component.isPracticeRace(practiceRace)).toBeTrue();
      expect(component.getHeatRankingDisplay(practiceRace)).toBe(
        "GEN_UNRANKED",
      );
      expect(component.getOverallRankingDisplay(practiceRace)).toBe(
        "GEN_UNRANKED",
      );

      const standardRace = {
        name: "Standard GP",
        heat_scoring: { heat_ranking: "LAP_COUNT", finish_value: 0 },
        overall_scoring: { ranking_method: "POINTS" },
      };
      expect(component.isPracticeRace(standardRace)).toBeFalse();
      expect(component.getHeatRankingDisplay(standardRace)).toBe("Lap Count");
      expect(component.getOverallRankingDisplay(standardRace)).toBe("Points");
      expect(component.getFinishValueDisplay(standardRace)).toBe(
        "GEN_INFINITE",
      );
    });

    it("should return guide steps for help service", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(3);
    });

    describe("detailTabs and scrollToSection", () => {
      it("should return empty array if no race is selected", () => {
        component.selectedRace = undefined;
        expect(component.detailTabs).toEqual([]);
      });

      it("should return tabs for Summary and Heats when a race is selected", () => {
        component.selectedRace = { name: "Test Race" };
        const tabs = component.detailTabs;
        expect(tabs.length).toBe(2);
        expect(tabs[0].id).toBe("summary-general");
        expect(tabs[1].id).toBe("summary-heats");
      });

      it("should expand summary section on scrollToSection with summary-general", fakeAsync(() => {
        component.isSummaryExpanded = false;
        component.scrollToSection("summary-general");
        expect(component.isSummaryExpanded).toBeTrue();
        tick(50);
      }));

      it("should expand heat list section on scrollToSection with summary-heats", fakeAsync(() => {
        component.isHeatListExpanded = false;
        component.scrollToSection("summary-heats");
        expect(component.isHeatListExpanded).toBeTrue();
        tick(50);
      }));
    });

    describe("theme display", () => {
      it("should return correct translation keys and names from getThemeDisplayNameKey", () => {
        expect(
          component.getThemeDisplayNameKey({
            entity_id: "default_classic_rc_ai",
          }),
        ).toBe("UE_LABEL_DEFAULT_THEME");
        expect(
          component.getThemeDisplayNameKey({
            entity_id: "practice_theme_rc_ai",
          }),
        ).toBe("UE_LABEL_PRACTICE_THEME");
        expect(
          component.getThemeDisplayNameKey({
            entity_id: "default_fuel_theme_rc_ai",
          }),
        ).toBe("UE_LABEL_FUEL_THEME");
        expect(
          component.getThemeDisplayNameKey({
            entity_id: "custom_1",
            name: "Custom Theme",
          }),
        ).toBe("Custom Theme");
        expect(component.getThemeDisplayNameKey(null)).toBe("");
      });

      it("should return correct display string from getThemeDisplay", () => {
        component.themes = [
          { entity_id: "default_classic_rc_ai", name: "Default" },
          { entity_id: "practice_theme_rc_ai", name: "Practice" },
          { entity_id: "default_fuel_theme_rc_ai", name: "Fuel" },
          { entity_id: "custom_1", name: "Custom Theme" },
        ];

        expect(
          component.getThemeDisplay({ theme_id: "default_classic_rc_ai" }),
        ).toBe("UE_LABEL_DEFAULT_THEME");
        expect(
          component.getThemeDisplay({ theme_id: "practice_theme_rc_ai" }),
        ).toBe("UE_LABEL_PRACTICE_THEME");
        expect(
          component.getThemeDisplay({ theme_id: "default_fuel_theme_rc_ai" }),
        ).toBe("UE_LABEL_FUEL_THEME");
        expect(component.getThemeDisplay({ theme_id: "custom_1" })).toBe(
          "Custom Theme",
        );
        expect(component.getThemeDisplay({})).toBe("UE_LABEL_DEFAULT_THEME");
      });
    });
  });
});
