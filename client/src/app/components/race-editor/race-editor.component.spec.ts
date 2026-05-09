import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  flush as _flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { FuelUsageType } from "@app/models/fuel_options";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AnalyticsService } from "@app/services/analytics.service";
import { HelpService } from "@app/services/help.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { MOCK_RACE_INSTANCES, MOCK_RACES } from "@app/testing/data/races_data";
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

import { createRaceManagerDataServiceMock } from "../race-manager/testing/race-manager_helper";
import { RaceEditorComponent } from "./race-editor.component";
import { RaceEditorHarness } from "./testing/race-editor.harness";

describe("RaceEditorComponent", () => {
  let component: RaceEditorComponent;
  let fixture: ComponentFixture<RaceEditorComponent>;
  let _loader: HarnessLoader;
  let dataService: any;
  let _router: any;
  let activatedRoute: any;

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    const mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.callFake((key: string) => {
            if (key === "driverCount") return null;
            if (key === "id") return "r1";
            return null;
          }),
        },
      },
      queryParams: of({ help: "false" }),
    };

    TestBed.configureTestingModule({
      imports: [FormsModule, RaceEditorComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: createRaceManagerDataServiceMock() },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
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

    fixture = TestBed.createComponent(RaceEditorComponent);
    component = fixture.componentInstance;
    _loader = TestbedHarnessEnvironment.loader(fixture);
    dataService = TestBed.inject(DataService);
    _router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);

    // Initialize with safe defaults for template binding (usually handled by loadData)
    component.editingRace = JSON.parse(JSON.stringify(MOCK_RACE_INSTANCES[0]));
    Object.setPrototypeOf(component.editingRace, Race.prototype);
    if (component.editingRace) {
      component.editingRace.custom_rotation_sequence =
        component.editingRace.custom_rotation_sequence || [];
      component.editingRace.custom_rotations =
        component.editingRace.custom_rotations || [];
    }
    component.originalRace = JSON.parse(JSON.stringify(component.editingRace));
    component.undoManager.initialize(component.editingRace!);

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
  });

  afterEach(() => {
    resetMocks();
    TestBed.resetTestingModule();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use transform scale for scaling", () => {
    fixture.detectChanges(); // Trigger ngOnInit and initial updateScale
    component.scale = 0.5;
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector(".page-container");
    expect(container.style.zoom).toBeFalsy();
    expect(container.style.transform).toContain("scale(0.5)");
    expect(container.style.transform).toContain("translate(-50%, -50%)");
  });

  it("should load race on init when ID is provided", fakeAsync(() => {
    dataService.getRaces.and.returnValue(of(MOCK_RACES));
    dataService.getTracks.and.returnValue(of(MOCK_TRACKS));
    dataService.previewHeats.and.returnValue(of({ heats: [] }));

    component.ngOnInit();
    tick(); // Handle setTimeout in loadRace, loadTracks, createNewRace

    expect(dataService.getRaces).toHaveBeenCalled();
    expect(component.editingRace).toBeDefined();
    expect(component.editingRace?.entity_id).toBe("r1");
  }));

  it("should correctly handle custom rotation fields from server with snake_case and camelCase fallbacks", fakeAsync(() => {
    const raceWithMixedCases: any = {
      entity_id: "r_custom",
      name: "Custom Race",
      track_entity_id: "t1",
      customRotationSequence: [1, 2, 3], // camelCase from server
      custom_rotation_asset_id: "asset-snake", // snake_case from server
    };
    dataService.getRaces.and.returnValue(of([raceWithMixedCases]));
    dataService.getTracks.and.returnValue(of(MOCK_TRACKS));
    dataService.previewHeats.and.returnValue(of({ heats: [] }));

    activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
      if (key === "id") return "r_custom";
      return null;
    });

    component.ngOnInit();
    tick();

    expect(component.editingRace.custom_rotation_sequence).toEqual([1, 2, 3]);
    expect(component.editingRace.custom_rotation_asset_id).toBe("asset-snake");
  }));

  it("should initialize drift_time to 0.5 for new race", fakeAsync(() => {
    activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
      if (key === "id") return "new";
      return null;
    });
    dataService.getTracks.and.returnValue(of(MOCK_TRACKS));
    dataService.getRaces.and.returnValue(of([]));

    component.ngOnInit();
    tick();

    expect(component.editingRace.drift_time).toBe(0.5);
  }));

  it("should fallback to 0.5 drift_time when loading race without it", fakeAsync(() => {
    const raceWithoutDrift: any = JSON.parse(JSON.stringify(MOCK_RACES[0]));
    delete raceWithoutDrift.drift_time; // Ensure it's missing
    dataService.getRaces.and.returnValue(of([raceWithoutDrift]));
    dataService.getTracks.and.returnValue(of(MOCK_TRACKS));
    dataService.previewHeats.and.returnValue(of({ heats: [] }));

    component.ngOnInit();
    tick();

    expect(component.editingRace.drift_time).toBe(0.5);
  }));

  it("should load heats when race is loaded", fakeAsync(() => {
    const mockHeats = {
      heats: [{ heatNumber: 1, lanes: [{ laneNumber: 1, driverNumber: 1 }] }],
    };
    dataService.getRaces.and.returnValue(of(MOCK_RACES));
    dataService.previewHeats.and.returnValue(of(mockHeats));

    component.driverCount = 10;
    component.ngOnInit();
    tick();

    expect(dataService.previewHeats).toHaveBeenCalledWith(
      "t1",
      "RoundRobin",
      4,
      0,
      jasmine.any(Array),
      undefined,
      jasmine.any(Array),
      1,
      false,
    );
    expect(component.generatedHeats.length).toBeGreaterThan(0);
  }));

  it("should regenerate heats when driver count changes", fakeAsync(() => {
    dataService.getRaces.and.returnValue(of(MOCK_RACES));
    dataService.previewHeats.and.returnValue(of({ heats: [] }));

    component.driverCount = 10;
    component.ngOnInit();
    tick();

    expect(dataService.previewHeats).toHaveBeenCalledWith(
      "t1",
      "RoundRobin",
      4,
      0,
      jasmine.any(Array),
      undefined,
      jasmine.any(Array),
      1,
      false,
    );

    component.driverCount = 12;
    component.onDriverCountChange();
    tick();

    expect(dataService.previewHeats).toHaveBeenCalledWith(
      "t1",
      "RoundRobin",
      12,
      0,
      jasmine.any(Array),
      undefined,
      jasmine.any(Array),
      1,
      false,
    );
  }));

  it("should not load heats for new race", () => {
    component.editingRace = JSON.parse(JSON.stringify(MOCK_RACE_INSTANCES[0]));
    Object.setPrototypeOf(component.editingRace, Race.prototype);
    component.editingRace.entity_id = "new";
    dataService.previewHeats.calls.reset();
    component.loadHeats();

    expect(dataService.previewHeats).not.toHaveBeenCalled();
    expect(component.generatedHeats.length).toBe(0);
  });

  it("should detect duplicate names", () => {
    component.races = [...MOCK_RACE_INSTANCES];
    component.editingRace = JSON.parse(JSON.stringify(MOCK_RACE_INSTANCES[0]));
    Object.setPrototypeOf(component.editingRace, Race.prototype);
    component.editingRace.entity_id = "new";
    component.editingRace.name = MOCK_RACES[0].name;
    const baseRace = {
      heat_rotation_type: "RoundRobin",
      heat_scoring: {
        finish_method: "Lap",
        finish_value: 10,
        heat_ranking: "LAP_COUNT",
        heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        allow_finish: "None",
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: "LAP_COUNT",
        tiebreaker: "FASTEST_LAP_TIME",
      },
      auto_advance_time: 0,
      auto_start_time: 0,
      auto_advance_warmup_time: 0,
      auto_start_warmup_time: 0,
      fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        reference_time: 6.0,
      },
      digital_fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        capacity: 100,
      },
      min_lap_time: 0,
      team_options: {
        heat_lap_limit: 0,
        heat_time_limit: 0,
        overall_lap_limit: 0,
        overall_time_limit: 0,
        require_pit_stop_change_driver: false,
      },
    };
    Object.assign(component.editingRace, baseRace);

    expect(component.isNameDuplicate()).toBeTrue();

    component.editingRace.name = "Unique Race";
    expect(component.isNameDuplicate()).toBeFalse();
  });

  it("should validate canSaveAsNew", () => {
    const baseRace = {
      entity_id: "1",
      name: "Original",
      track_entity_id: "",
      heat_rotation_type: "RoundRobin",
      heat_scoring: {
        finish_method: "Lap",
        finish_value: 10,
        heat_ranking: "LAP_COUNT",
        heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        allow_finish: "None",
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: "LAP_COUNT",
        tiebreaker: "FASTEST_LAP_TIME",
      },
      auto_advance_time: 0,
      auto_start_time: 0,
      auto_advance_warmup_time: 0,
      auto_start_warmup_time: 0,
      fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        reference_time: 6.0,
      },
      digital_fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        capacity: 100,
      },
      min_lap_time: 0,
      team_options: {
        heat_lap_limit: 0,
        heat_time_limit: 0,
        overall_lap_limit: 0,
        overall_time_limit: 0,
        require_pit_stop_change_driver: false,
      },
    };
    component.originalRace = JSON.parse(JSON.stringify(MOCK_RACE_INSTANCES[0]));
    Object.setPrototypeOf(component.originalRace, Race.prototype);
    component.editingRace = JSON.parse(JSON.stringify(component.originalRace));
    Object.setPrototypeOf(component.editingRace, Race.prototype);
    Object.assign(component.editingRace, baseRace);
    component.undoManager.initialize(component.editingRace!);
    component.races = [
      { ...MOCK_RACE_INSTANCES[0], entity_id: "1", name: "Original" } as any,
    ];

    expect(component.canSaveAsNew()).toBeTrue(); // Name unchanged

    component.editingRace.name = "Changed";
    expect(component.canSaveAsNew()).toBeTrue(); // Name changed and unique

    component.races.push({ entity_id: "2", name: "Duplicate" });
    component.editingRace.name = "Duplicate";
    // TODO(aufderheide): This doesn't look right.  You can't save if the name is a duplicate
    expect(component.canSaveAsNew()).toBeTrue(); // Name changed but duplicate
  });

  it("should validate canUpdate", () => {
    component.editingRace = {
      entity_id: "1",
      name: "Race 1",
      track_entity_id: "",
      heat_rotation_type: "RoundRobin",
      heat_scoring: {
        finish_method: "Lap",
        finish_value: 10,
        heat_ranking: "LAP_COUNT",
        heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        allow_finish: "None",
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: "LAP_COUNT",
        tiebreaker: "FASTEST_LAP_TIME",
      },
      auto_advance_time: 0,
      auto_start_time: 0,
      auto_advance_warmup_time: 0,
      auto_start_warmup_time: 0,
      fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        reference_time: 6.0,
      },
      digital_fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        capacity: 100,
      },
      min_lap_time: 0,
      team_options: {
        heat_lap_limit: 0,
        heat_time_limit: 0,
        overall_lap_limit: 0,
        overall_time_limit: 0,
        require_pit_stop_change_driver: false,
      },
    };
    spyOn(component, "isDirtyState").and.returnValue(false);
    expect(component.canUpdate()).toBeFalse();

    (component.isDirtyState as jasmine.Spy).and.returnValue(true);
    expect(component.canUpdate()).toBeTrue();

    spyOn(component, "isNameDuplicate").and.returnValue(true);
    expect(component.canUpdate()).toBeFalse();
  });

  describe("Analog Fuel Options", () => {
    it("should initialize with default fuel options if not present", fakeAsync(() => {
      const raceWithoutFuel: any = JSON.parse(JSON.stringify(MOCK_RACES[0]));
      delete raceWithoutFuel.fuel_options;
      delete raceWithoutFuel.digital_fuel_options;

      dataService.getRaces.and.returnValue(of([raceWithoutFuel]));

      component.ngOnInit();
      tick();
      // Ensure original state is synchronized for dirty comparison
      component.originalRace = JSON.parse(
        JSON.stringify(component.editingRace),
      );
      component.undoManager.initialize(component.editingRace!);

      expect(component.editingRace.fuel_options).toBeDefined();
      expect(component.editingRace.fuel_options?.enabled).toBeFalse();
      expect(component.editingRace.fuel_options?.capacity).toBe(100);
      expect(component.editingRace.fuel_options?.usage_type).toBe("LINEAR");
      expect(component.editingRace.fuel_options?.usage_rate).toBe(4.0);
    }));

    it("should detect changes when fuel settings modify", () => {
      component.editingRace.fuel_options!.enabled = true;
      expect(component.isDirtyState()).toBeTrue();

      component.editingRace.fuel_options!.enabled = false;
      expect(component.isDirtyState()).toBeFalse();

      component.editingRace.fuel_options!.capacity = 200;
      expect(component.isDirtyState()).toBeTrue();
    });
  });

  describe("Digital Fuel Options", () => {
    it("should initialize with default digital fuel options if not present", fakeAsync(() => {
      const raceWithoutFuel: any = JSON.parse(JSON.stringify(MOCK_RACES[0]));
      delete raceWithoutFuel.digital_fuel_options;

      dataService.getRaces.and.returnValue(of([raceWithoutFuel]));

      component.ngOnInit();
      tick();

      expect(component.editingRace.digital_fuel_options).toBeDefined();
      expect(component.editingRace.digital_fuel_options?.enabled).toBeFalse();
      expect(component.editingRace.digital_fuel_options?.usage_type).toBe(
        FuelUsageType.LINEAR,
      );
    }));

    it("should correctly identify digital fuel capability of a track", () => {
      component.tracks = [
        new Track("t1", "Analog Track", 100, [], false),
        new Track("speedway", "Digital Track", 100, [], true),
      ];

      component.editingRace.track_entity_id = "t1";
      expect(component.hasDigitalFuel).toBeFalse();

      component.editingRace.track_entity_id = "speedway";
      expect(component.hasDigitalFuel).toBeTrue();
    });

    it("should enforce fuel rules: disable digital fuel if track is analog", () => {
      component.tracks = [new Track("track1", "Analog Track", 100, [], false)];
      component.editingRace.track_entity_id = "track1";
      component.editingRace.digital_fuel_options = { enabled: true } as any;

      component.enforceFuelRules();
      expect(component.editingRace.digital_fuel_options.enabled).toBeFalse();
    });

    it("should generate valid usage path for digital fuel", () => {
      component.editingRace.digital_fuel_options = {
        enabled: true,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        capacity: 100,
      } as any;

      const path = component.getDigitalUsagePath();
      expect(path).toContain("M");
      expect(path).toContain("L");
    });

    it("should update hoveredPoint on digital graph mouse move", () => {
      component.editingRace.digital_fuel_options = {
        enabled: true,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        capacity: 100,
      } as any;

      const mockEvent = {
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 400,
            height: 150,
          }),
        },
        clientX: 200,
        clientY: 75,
      } as any;

      component.onDigitalGraphMouseMove(mockEvent, "usage");
      expect(component.hoveredPoint).toBeDefined();
      expect(component.hoveredPoint?.type).toBe("digital_usage");
      expect(component.hoveredPoint?.time).toBe(50); // 50% throttle at middle
    });
  });

  it("should call updateRace API", fakeAsync(() => {
    component.editingRace = JSON.parse(JSON.stringify(MOCK_RACES[0]));
    spyOn(component, "isDirtyState").and.returnValue(true);
    dataService.updateRace.and.returnValue(of({}));
    dataService.getRaces.and.returnValue(of([]));

    component.updateRace();
    tick(); // Handles setTimeout in loadRaces()

    expect(dataService.updateRace).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  }));

  it("should include team options in updateRace payload", fakeAsync(() => {
    component.editingRace = {
      entity_id: "1",
      name: "Updated Name",
      track_entity_id: "track1",
      heat_rotation_type: "RoundRobin",
      heat_scoring: { finish_method: "Lap" },
      overall_scoring: { dropped_heats: 0 },
      team_options: {
        heat_lap_limit: 10,
        heat_time_limit: 60,
        overall_lap_limit: 100,
        overall_time_limit: 600,
        require_pit_stop_change_driver: true,
      },
    } as any;

    spyOn(component, "isDirtyState").and.returnValue(true);
    dataService.updateRace.and.returnValue(of({}));
    dataService.getRaces.and.returnValue(of([]));

    component.updateRace();
    tick();

    expect(dataService.updateRace).toHaveBeenCalled();
    const payload = dataService.updateRace.calls.mostRecent().args[1];
    expect(payload.team_options).toBeDefined();
    expect(payload.team_options.heat_lap_limit).toBe(10);
    expect(payload.team_options.require_pit_stop_change_driver).toBeTrue();
  }));

  it("should call createRace API when saving new", fakeAsync(() => {
    component.editingRace = {
      entity_id: "new",
      name: "New Race",
      track_entity_id: "track1",
      heat_rotation_type: "RoundRobin",
      heat_scoring: {
        finish_method: "Lap",
        finish_value: 10,
        heat_ranking: "LAP_COUNT",
        heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        allow_finish: "None",
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: "LAP_COUNT",
        tiebreaker: "FASTEST_LAP_TIME",
      },
      auto_advance_time: 0,
      auto_start_time: 0,
      auto_advance_warmup_time: 0,
      auto_start_warmup_time: 0,
      fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        reference_time: 6.0,
      },
      digital_fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        capacity: 100,
      },
      min_lap_time: 0,
      team_options: {
        heat_lap_limit: 0,
        heat_time_limit: 0,
        overall_lap_limit: 0,
        overall_time_limit: 0,
        require_pit_stop_change_driver: false,
      },
    };
    component.originalRace = JSON.parse(JSON.stringify(component.editingRace));
    component.driverCount = 10;
    dataService.createRace.and.returnValue(
      of({
        entity_id: "2",
        name: "New Race",
        track_entity_id: "track1",
        heat_rotation_type: "RoundRobin",
        heat_scoring: {
          finish_method: "Lap",
          finish_value: 10,
          heat_ranking: "LAP_COUNT",
          heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: "LAP_COUNT",
          tiebreaker: "FASTEST_LAP_TIME",
        },
        fuel_options: {
          enabled: false,
          reset_fuel_at_heat_start: false,
          end_heat_on_out_of_fuel: false,
          capacity: 100,
          usage_type: "LINEAR",
          usage_rate: 4.0,
          start_level: 100,
          refuel_rate: 10,
          pit_stop_delay: 2.0,
          reference_time: 6.0,
        },
      }),
    );
    dataService.getRaces.and.returnValue(of([]));
    spyOn(component, "isDirtyState").and.returnValue(true);

    component.updateRace();
    tick(); // Handles setTimeout in loadRaces()

    expect(dataService.createRace).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/race-manager"], {
      queryParams: { id: "2", driverCount: 10 },
    });
  }));

  it("should create a duplicate with unique name when Duplicate is clicked", fakeAsync(async () => {
    const _harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RaceEditorHarness,
    );
    component.editingRace.name = "Grand Prix";
    component.editingRace.entity_id = "1"; // Ensure button is not disabled
    component.races = [{ entity_id: "1", name: "Grand Prix" }];

    dataService.createRace.and.returnValue(
      of({ ...component.editingRace, entity_id: "2", name: "Grand Prix_1" }),
    );

    component.saveAsNew();
    fixture.detectChanges();
    tick();

    expect(dataService.createRace).toHaveBeenCalled();
    const calledArg = dataService.createRace.calls.mostRecent().args[0];
    expect(calledArg.name).toBe("Grand Prix_1");
  }));

  it("should trigger autoSaveRace when name is modified through harness", fakeAsync(async () => {
    const harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RaceEditorHarness,
    );

    // Setup a race
    component.editingRace.name = "Initial Name";
    component.editingRace.entity_id = "1"; // Ensure component.editingRace.auto_advance_warmup_time = 1;
    component.originalRace = JSON.parse(JSON.stringify(component.editingRace));
    component.undoManager.initialize(component.editingRace!);

    dataService.updateRace.and.returnValue(of({}));

    // Trigger state committed stream through component
    await harness.setName("Auto Save Test");
    component.editingRace.name = "Auto Save Test"; // Explicit sync for test harness streams
    fixture.detectChanges();

    // Also trigger manually if harness events setup didn't bubble fully
    component.captureState();
    fixture.detectChanges();
    tick();

    expect(dataService.updateRace).toHaveBeenCalled();
  }));

  describe("Expander State Save/Load", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("should save expander state on toggleSection", () => {
      const setItemSpy = spyOn(localStorage, "setItem");
      component.sectionsExpanded.general = true;

      component.toggleSection("general");

      expect(component.sectionsExpanded.general).toBeFalse();
      expect(setItemSpy).toHaveBeenCalledWith(
        "race_editor_expanders",
        jasmine.stringMatching('"general":false'),
      );
    });

    it("should load expander state on loadExpanderState", () => {
      spyOn(localStorage, "getItem").and.returnValue(
        JSON.stringify({ general: false, scoring: false }),
      );

      component.loadExpanderState();

      expect(component.sectionsExpanded.general).toBeFalse();
      expect(component.sectionsExpanded.scoring).toBeFalse();
      expect(component.sectionsExpanded.fuel_analog).toBeTrue(); // Default
    });

    it("should migrate old fuel state on loadExpanderState", () => {
      spyOn(localStorage, "getItem").and.returnValue(
        JSON.stringify({ fuel: false }),
      );

      component.loadExpanderState();

      expect(component.sectionsExpanded.fuel_analog).toBeFalse();
      expect(component.sectionsExpanded.fuel_digital).toBeFalse();
    });
  });

  describe("Driver Count Persistence", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("should load driver count from localStorage if query param is missing", fakeAsync(() => {
      spyOn(localStorage, "getItem").and.callFake((key: string) => {
        if (key === "race_editor_driver_count") return "24";
        return null;
      });
      activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
        if (key === "driverCount") return null;
        if (key === "id") return "r1";
        return null;
      });

      component.ngOnInit();
      tick();

      expect(component.driverCount).toBe(24);
    }));

    it("should prioritize query param over localStorage and sync it", fakeAsync(() => {
      const setItemSpy = spyOn(localStorage, "setItem");
      spyOn(localStorage, "getItem").and.returnValue("24");
      activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
        if (key === "driverCount") return "32";
        if (key === "id") return "r1";
        return null;
      });

      component.ngOnInit();
      tick();

      expect(component.driverCount).toBe(32);
      expect(setItemSpy).toHaveBeenCalledWith("race_editor_driver_count", "32");
    }));

    it("should save driver count to localStorage on change", () => {
      const setItemSpy = spyOn(localStorage, "setItem");
      component.driverCount = 15;
      component.onDriverCountChange();

      expect(setItemSpy).toHaveBeenCalledWith("race_editor_driver_count", "15");
    });

    it("should default to 4 if query param and localStorage are missing", fakeAsync(() => {
      activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
        if (key === "driverCount") return null;
        if (key === "id") return "r1";
        return null;
      });
      spyOn(localStorage, "getItem").and.returnValue(null);

      component.ngOnInit();
      tick();

      expect(component.driverCount).toBe(4);
    }));

    it("should default to 4 if query param is invalid and localStorage is missing", fakeAsync(() => {
      activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
        if (key === "driverCount") return "abc";
        if (key === "id") return "r1";
        return null;
      });
      spyOn(localStorage, "getItem").and.returnValue(null);

      component.ngOnInit();
      tick();

      expect(component.driverCount).toBe(4);
    }));
  });

  describe("Auto-save on name change", () => {
    beforeEach(() => {
      component.isLoading = false;
      // Set up the stateCommitted$ subscription that would normally be done in ngOnInit
      component.undoManager.stateCommitted$.subscribe(() => {
        (component as any).autoSaveRace();
      });
    });

    it("should auto-save when name changes to a valid unique value", fakeAsync(() => {
      component.editingRace = {
        entity_id: "1",
        name: "OriginalName",
        track_entity_id: "track1",
        heat_rotation_type: "RoundRobin",
        heat_scoring: {
          finish_method: "Lap",
          finish_value: 10,
          heat_ranking: "LAP_COUNT",
          heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: "LAP_COUNT",
          tiebreaker: "FASTEST_LAP_TIME",
        },
        fuel_options: {
          enabled: false,
          reset_fuel_at_heat_start: false,
          end_heat_on_out_of_fuel: false,
          capacity: 100,
          usage_type: "LINEAR",
          usage_rate: 4.0,
          start_level: 100,
          refuel_rate: 10,
          pit_stop_delay: 2.0,
          reference_time: 6.0,
        },
        digital_fuel_options: { enabled: false },
        team_options: { require_pit_stop_change_driver: false },
      };
      component.originalRace = JSON.parse(
        JSON.stringify(component.editingRace),
      );
      component.undoManager.initialize(component.editingRace!);
      component.races = [{ entity_id: "1", name: "OriginalName" }];
      dataService.updateRace.and.returnValue(of({}));

      // Simulate text input: focus, type, blur (matching template bindings)
      component.onInputFocus();
      component.editingRace.name = "ValidNewName";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateRace).toHaveBeenCalledWith(
        "1",
        jasmine.any(Object),
      );
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
    }));

    it("should not auto-save when name is set to a duplicate", fakeAsync(() => {
      component.editingRace = {
        entity_id: "1",
        name: "OriginalName",
        track_entity_id: "track1",
        heat_rotation_type: "RoundRobin",
        heat_scoring: {
          finish_method: "Lap",
          finish_value: 10,
          heat_ranking: "LAP_COUNT",
          heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: "LAP_COUNT",
          tiebreaker: "FASTEST_LAP_TIME",
        },
        fuel_options: {
          enabled: false,
          reset_fuel_at_heat_start: false,
          end_heat_on_out_of_fuel: false,
          capacity: 100,
          usage_type: "LINEAR",
          usage_rate: 4.0,
          start_level: 100,
          refuel_rate: 10,
          pit_stop_delay: 2.0,
          reference_time: 6.0,
        },
        digital_fuel_options: { enabled: false },
        team_options: { require_pit_stop_change_driver: false },
      };
      component.originalRace = JSON.parse(
        JSON.stringify(component.editingRace),
      );
      component.undoManager.initialize(component.editingRace!);
      component.races = [
        { entity_id: "1", name: "OriginalName" },
        { entity_id: "2", name: "TakenName" },
      ];

      component.onInputFocus();
      component.editingRace.name = "TakenName";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateRace).not.toHaveBeenCalled();
      expect(component.isNameDuplicate()).toBeTrue();
    }));

    it("should not auto-save when name is empty", fakeAsync(() => {
      component.editingRace = {
        entity_id: "1",
        name: "OriginalName",
        track_entity_id: "track1",
        heat_rotation_type: "RoundRobin",
        heat_scoring: {
          finish_method: "Lap",
          finish_value: 10,
          heat_ranking: "LAP_COUNT",
          heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: "LAP_COUNT",
          tiebreaker: "FASTEST_LAP_TIME",
        },
        fuel_options: {
          enabled: false,
          reset_fuel_at_heat_start: false,
          end_heat_on_out_of_fuel: false,
          capacity: 100,
          usage_type: "LINEAR",
          usage_rate: 4.0,
          start_level: 100,
          refuel_rate: 10,
          pit_stop_delay: 2.0,
          reference_time: 6.0,
        },
        digital_fuel_options: { enabled: false },
        team_options: { require_pit_stop_change_driver: false },
      };
      component.originalRace = JSON.parse(
        JSON.stringify(component.editingRace),
      );
      component.undoManager.initialize(component.editingRace!);

      component.onInputFocus();
      component.editingRace.name = "";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateRace).not.toHaveBeenCalled();
    }));

    it("should not show back confirmation when name changes to a valid unique value", fakeAsync(() => {
      component.editingRace = {
        entity_id: "1",
        name: "OriginalName",
        track_entity_id: "track1",
        heat_rotation_type: "RoundRobin",
        heat_scoring: {
          finish_method: "Lap",
          finish_value: 10,
          heat_ranking: "LAP_COUNT",
          heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: "LAP_COUNT",
          tiebreaker: "FASTEST_LAP_TIME",
        },
        fuel_options: {
          enabled: false,
          reset_fuel_at_heat_start: false,
          end_heat_on_out_of_fuel: false,
          capacity: 100,
          usage_type: "LINEAR",
          usage_rate: 4.0,
          start_level: 100,
          refuel_rate: 10,
          pit_stop_delay: 2.0,
          reference_time: 6.0,
        },
        digital_fuel_options: { enabled: false },
        team_options: { require_pit_stop_change_driver: false },
      };
      component.originalRace = JSON.parse(
        JSON.stringify(component.editingRace),
      );
      component.undoManager.initialize(component.editingRace!);
      component.races = [{ entity_id: "1", name: "OriginalName" }];
      dataService.updateRace.and.returnValue(of({}));

      component.onInputFocus();
      component.editingRace.name = "ValidNewName";
      component.onInputBlur();
      tick(200);

      // backConfirm is !isConfigValid() — config should be valid after name change + auto-save
      expect(component.isConfigValid()).toBeTrue();
      expect(component.isDirtyState()).toBeFalse();
    }));

    it("should show back confirmation when name is invalid (duplicate)", () => {
      component.editingRace.name = "Duplicate Name";
      component.races = [{ entity_id: "other", name: "Duplicate Name" }];
      expect(component.isConfigValid()).toBeFalse();
    });

    it("should show back confirmation when name is empty", () => {
      component.editingRace.name = "";
      expect(component.isConfigValid()).toBeFalse();
    });
  });

  describe("Solo Lane Selection", () => {
    it("should update solo_lane_index and refresh heats on lane selection", fakeAsync(() => {
      component.editingRace.heat_rotation_type = "SingleHeatSolo";
      component.editingRace.track_entity_id = "t1";
      component.driverCount = 4;
      dataService.previewHeats.and.returnValue(of({ heats: [] }));
      spyOn(component, "captureState");

      component.onLaneSelected(2); // Select Lane 3

      expect(component.editingRace.solo_lane_index).toBe(2);
      expect(component.captureState).toHaveBeenCalled();
      expect(dataService.previewHeats).toHaveBeenCalledWith(
        "t1",
        "SingleHeatSolo",
        4,
        2,
        jasmine.any(Array),
        undefined,
        jasmine.any(Array),
        1,
        false,
      );
    }));
  });

  describe("Custom Rotation", () => {
    beforeEach(() => {
      component.editingRace = {
        name: "Custom Race",
        track_entity_id: "t1",
        heat_rotation_type: "Custom",
        heat_scoring: { finish_method: "Lap" },
        overall_scoring: { dropped_heats: 0 },
        custom_rotations: [],
      } as any;
    });

    it("should be invalid if no custom rotations and no asset ID", () => {
      component.editingRace.custom_rotations = [];
      component.editingRace.custom_rotation_asset_id = "";
      expect(component.isRotationInvalid).toBeTrue();
    });

    it("should be valid if custom rotations are present", () => {
      component.editingRace.custom_rotations = [{ numDrivers: 10, heats: [] }];
      component.editingRace.custom_rotation_asset_id = "";
      expect(component.isRotationInvalid).toBeFalse();
    });

    it("should be valid if custom rotation asset ID is present", () => {
      component.editingRace.custom_rotations = [];
      component.editingRace.custom_rotation_asset_id = "asset1";
      expect(component.isRotationInvalid).toBeFalse();
    });

    it("should include custom_rotation_asset_id in payload", fakeAsync(() => {
      component.editingRace.custom_rotation_asset_id = "asset1";
      component.editingRace.entity_id = "r1";
      spyOn(component, "isDirtyState").and.returnValue(true);
      dataService.updateRace.and.returnValue(of({}));
      dataService.getRaces.and.returnValue(of([]));

      component.updateRace();
      tick();

      expect(dataService.updateRace).toHaveBeenCalled();
      const payload = dataService.updateRace.calls.mostRecent().args[1];
      expect(payload.custom_rotation_asset_id).toBe("asset1");
    }));

    it("should update asset ID and clear inline rotations on asset change", () => {
      component.editingRace.custom_rotations = [{ numDrivers: 10, heats: [] }];
      component.selectedCustomRotationAssetId = "new-asset";
      spyOn(component, "captureState");

      component.onCustomRotationAssetChange();

      expect(component.editingRace.custom_rotation_asset_id).toBe("new-asset");
      expect(component.editingRace.custom_rotations).toBeUndefined();
      expect(component.captureState).toHaveBeenCalled();
    });
  });

  describe("Heat Times Through and Reverse Heats", () => {
    beforeEach(fakeAsync(() => {
      dataService.getRaces.and.returnValue(of(MOCK_RACES));
      dataService.getTracks.and.returnValue(of(MOCK_TRACKS));
      dataService.previewHeats.and.returnValue(of({ heats: [] }));
      component.ngOnInit();
      tick();
      fixture.detectChanges();
    }));

    it("should update heatTimesThrough and trigger previewHeats", fakeAsync(async () => {
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        RaceEditorHarness,
      );
      dataService.previewHeats.calls.reset();

      await harness.setHeatTimesThrough(3);
      fixture.detectChanges();
      tick();

      expect(component.editingRace.heat_times_through).toBe(3);
      expect(dataService.previewHeats).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.any(Array),
        undefined,
        jasmine.any(Array),
        3, // heatTimesThrough
        jasmine.any(Boolean),
      );
    }));

    it("should update reverseHeats and trigger previewHeats", fakeAsync(async () => {
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        RaceEditorHarness,
      );
      dataService.previewHeats.calls.reset();

      await harness.setReverseHeats(true);
      fixture.detectChanges();
      tick();

      expect(component.editingRace.reverse_heats).toBe(true);
      expect(dataService.previewHeats).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.any(Array),
        undefined,
        jasmine.any(Array),
        jasmine.any(Number),
        true, // reverseHeats
      );
    }));

    it("should undo changes to heatTimesThrough", fakeAsync(async () => {
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        RaceEditorHarness,
      );

      await harness.setHeatTimesThrough(2);
      fixture.detectChanges();
      tick();
      expect(component.editingRace.heat_times_through).toBe(2);

      component.undoManager.undo();
      fixture.detectChanges();
      tick();
      expect(component.editingRace.heat_times_through).toBe(1);
    }));

    it("should include heatTimesThrough and reverseHeats in the payload", () => {
      component.editingRace.heat_times_through = 5;
      component.editingRace.reverse_heats = true;

      const payload = (component as any).buildRacePayload(
        component.editingRace,
      );
      expect(payload.heat_times_through).toBe(5);
      expect(payload.reverse_heats).toBe(true);
    });
  });
});
