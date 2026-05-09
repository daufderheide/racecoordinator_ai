import { NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AnalyticsService } from "@app/services/analytics.service";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
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

import { RaceManagerComponent } from "./race-manager.component";
import { createRaceManagerDataServiceMock } from "./testing/race-manager_helper";

describe("RaceManagerComponent", () => {
  let component: RaceManagerComponent;
  let dataService: any;
  let _router: any;
  let _activatedRoute: any;

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);

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

    TestBed.configureTestingModule({
      imports: [FormsModule, RaceManagerComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: createRaceManagerDataServiceMock() },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
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
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    const fixture = TestBed.createComponent(RaceManagerComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    _router = TestBed.inject(Router);
    _activatedRoute = TestBed.inject(ActivatedRoute);

    // Standardize races as class instances for all tests
    component.races = JSON.parse(JSON.stringify(MOCK_RACE_INSTANCES)).map(
      (r: any) => {
        Object.setPrototypeOf(r, Race.prototype);
        return r;
      },
    );
    component.tracks = JSON.parse(JSON.stringify(MOCK_TRACK_INSTANCES)).map(
      (t: any) => {
        Object.setPrototypeOf(t, Track.prototype);
        return t;
      },
    );
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
      queryParams: { id: "1", driverCount: 4 },
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

      expect(dataService.createRace).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/race-editor"], {
        queryParams: { id: "r-new", driverCount: component.driverCount },
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

    it("should not auto-assign track if multiple tracks exist", () => {
      component.tracks = [
        { entity_id: "t1", name: "Track 1" },
        { entity_id: "t2", name: "Track 2" },
      ];
      const createdRace = { entity_id: "r-new" };
      dataService.createRace.and.returnValue(of(createdRace));

      component.createNewRace();

      const callArg = dataService.createRace.calls.mostRecent().args[0];
      expect(callArg.track_entity_id).toBeUndefined();
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
});
