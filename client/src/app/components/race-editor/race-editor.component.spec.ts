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
import { ActivatedRoute, convertToParamMap, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import { FuelUsageType } from "@app/models/fuel_options";
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
import { deepCopy } from "@app/utils/clone.utils";

import { NavigationService } from "../../services/navigation.service";
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

  let roleSubject: BehaviorSubject<Role>;
  let mockAuthService: any;

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    roleSubject = new BehaviorSubject<Role>(Role.ADMIN);
    mockAuthService = {
      currentRole: Role.ADMIN,
      currentRole$: roleSubject.asObservable(),
    };

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
      queryParamMap: of(convertToParamMap({ id: "r1" })),
    };

    const mockConnectionMonitor = jasmine.createSpyObj(
      "ConnectionMonitorService",
      ["startMonitoring", "stopMonitoring"],
      { connectionState$: of() },
    );

    const mockRaceConnectionService = jasmine.createSpyObj(
      "RaceConnectionService",
      ["connect", "disconnect"],
    );

    TestBed.configureTestingModule({
      imports: [FormsModule, RaceEditorComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: createRaceManagerDataServiceMock() },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
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
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
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
    component.editingRace = deepCopy(MOCK_RACE_INSTANCES[0]);
    Object.setPrototypeOf(component.editingRace, Race.prototype);
    if (component.editingRace) {
      component.editingRace.track_entity_id =
        component.editingRace.track_entity_id ||
        component.editingRace.track?.entity_id;
      component.editingRace.heat_rotation_type =
        component.editingRace.heat_rotation_type || "RoundRobin";
      component.editingRace.custom_rotation_sequence =
        component.editingRace.custom_rotation_sequence || [];
      component.editingRace.custom_rotations =
        component.editingRace.custom_rotations || [];
    }
    component.originalRace = deepCopy(component.editingRace);
    component.undoManager.initialize(component.editingRace!);

    component.races = deepCopy(MOCK_RACE_INSTANCES).map((r: any) => {
      Object.setPrototypeOf(r, Race.prototype);
      return r;
    });
    component.tracks = deepCopy(MOCK_TRACK_INSTANCES).map((t: any) => {
      Object.setPrototypeOf(t, Track.prototype);
      return t;
    });
  });

  afterEach(() => {
    resetMocks();
    TestBed.resetTestingModule();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render page container without hardcoded transform scaling", () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector(".page-container");
    expect(container).toBeTruthy();
    expect(container.style.transform).toBeFalsy();
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

  it("should initialize start_behind_sensor to true for new race", fakeAsync(() => {
    activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
      if (key === "id") return "new";
      return null;
    });
    dataService.getTracks.and.returnValue(of(MOCK_TRACKS));
    dataService.getRaces.and.returnValue(of([]));

    component.ngOnInit();
    tick();

    expect(component.editingRace.start_behind_sensor).toBeTrue();
  }));

  it("should initialize start_at_current to false for new race", fakeAsync(() => {
    activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
      if (key === "id") return "new";
      return null;
    });
    dataService.getTracks.and.returnValue(of(MOCK_TRACKS));
    dataService.getRaces.and.returnValue(of([]));

    component.ngOnInit();
    tick();

    expect(component.editingRace.start_at_current).toBeFalse();
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
      jasmine.any(Object),
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
      jasmine.any(Object),
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
      jasmine.any(Object),
    );
  }));

  it("should not load heats for new race", () => {
    component.editingRace = deepCopy(MOCK_RACE_INSTANCES[0]);
    Object.setPrototypeOf(component.editingRace, Race.prototype);
    component.editingRace.entity_id = "new";
    dataService.previewHeats.calls.reset();
    component.loadHeats();

    expect(dataService.previewHeats).not.toHaveBeenCalled();
    expect(component.generatedHeats.length).toBe(0);
  });

  it("should detect duplicate names", () => {
    component.races = [...MOCK_RACE_INSTANCES];
    component.editingRace = deepCopy(MOCK_RACE_INSTANCES[0]);
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
        out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
        out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
      theme_id: "default_classic_rc_ai",
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
        out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
        out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
    component.originalRace = deepCopy(MOCK_RACE_INSTANCES[0]);
    Object.setPrototypeOf(component.originalRace, Race.prototype);
    component.editingRace = deepCopy(component.originalRace);
    Object.setPrototypeOf(component.editingRace, Race.prototype);
    Object.assign(component.editingRace, baseRace);
    component.undoManager.initialize(component.editingRace!);
    component.races = [
      { ...MOCK_RACE_INSTANCES[0], entity_id: "1", name: "Original" } as any,
    ];

    expect(component.canSaveAsNew()).toBeTrue(); // Name unchanged

    component.editingRace.theme_id = "";
    expect(component.canSaveAsNew()).toBeFalse(); // Theme missing
    component.editingRace.theme_id = "default_classic_rc_ai";

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
      theme_id: "default_classic_rc_ai",
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
        out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
        out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
      group_options: { enabled: false },
    };
    spyOn(component, "isDirtyState").and.returnValue(false);
    expect(component.canUpdate()).toBeFalse();

    (component.isDirtyState as jasmine.Spy).and.returnValue(true);
    expect(component.canUpdate()).toBeTrue();

    component.editingRace.theme_id = "";
    expect(component.canUpdate()).toBeFalse();
    component.editingRace.theme_id = "default_classic_rc_ai";

    spyOn(component, "isNameDuplicate").and.returnValue(true);
    expect(component.canUpdate()).toBeFalse();
  });

  describe("Analog Fuel Options", () => {
    it("should initialize with default fuel options if not present", fakeAsync(() => {
      const raceWithoutFuel: any = deepCopy(MOCK_RACES[0]);
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
      const raceWithoutFuel: any = deepCopy(MOCK_RACES[0]);
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
        new Track({
          entity_id: "t1",
          name: "Analog Track",
          num_track_sections: 100,
          lanes: [],
          has_digital_fuel: false,
        }),
        new Track({
          entity_id: "speedway",
          name: "Digital Track",
          num_track_sections: 100,
          lanes: [],
          has_digital_fuel: true,
        }),
      ];

      component.editingRace.track_entity_id = "t1";
      expect(component.hasDigitalFuel).toBeFalse();

      component.editingRace.track_entity_id = "speedway";
      expect(component.hasDigitalFuel).toBeTrue();
    });

    it("should enforce fuel rules: disable digital fuel if track is analog", () => {
      component.tracks = [
        new Track({
          entity_id: "track1",
          name: "Analog Track",
          num_track_sections: 100,
          lanes: [],
          has_digital_fuel: false,
        }),
      ];
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
      expect(component.hoveredPoint?.xValue).toBe("50%"); // 50% throttle at middle
    });
  });

  describe("Group Options", () => {
    it("should initialize with default group options if not present", fakeAsync(() => {
      const raceWithoutGroups: any = deepCopy(MOCK_RACES[0]);
      delete raceWithoutGroups.group_options;

      dataService.getRaces.and.returnValue(of([raceWithoutGroups]));

      component.ngOnInit();
      tick();

      expect(component.editingRace.group_options).toBeDefined();
      expect(component.editingRace.group_options?.enabled).toBeFalse();
    }));

    it("should detect changes when group settings modify", () => {
      component.editingRace.group_options!.enabled = true;
      expect(component.isDirtyState()).toBeTrue();

      component.editingRace.group_options!.enabled = false;
      expect(component.isDirtyState()).toBeFalse();

      component.editingRace.group_options!.max_groups = 5;
      expect(component.isDirtyState()).toBeTrue();

      component.editingRace.group_options!.max_groups = 1;
      component.editingRace.group_options!.min_advancing = 2;
      expect(component.isDirtyState()).toBeTrue();
    });

    it("should update group names list when setGroupNameInput is called", () => {
      component.editingRace.group_options!.max_groups = 2;
      expect(component.groupIndices).toEqual([0, 1]);

      component.setGroupNameInput(0, "A Class");
      component.setGroupNameInput(1, "B Class");

      expect(component.getGroupNameInput(0)).toBe("A Class");
      expect(component.getGroupNameInput(1)).toBe("B Class");
      expect(component.editingRace.group_options!.names).toEqual([
        "A Class",
        "B Class",
      ]);
    });

    it("should include min_advancing in previewHeats payload", fakeAsync(() => {
      component.editingRace.group_options = {
        enabled: true,
        max_groups: 3,
        min_advancing: 2,
      } as any;
      dataService.previewHeats.calls.reset();

      component.loadHeats();
      tick();

      expect(dataService.previewHeats).toHaveBeenCalled();
      const payload = dataService.previewHeats.calls.mostRecent().args[9];
      expect(payload).toBeDefined();
      expect(payload.enabled).toBeTrue();
      expect(payload.max_groups).toBe(3);
      expect(payload.min_advancing).toBe(2);
    }));

    it("should include min_advancing in updateRace payload", fakeAsync(() => {
      component.editingRace.group_options = {
        enabled: true,
        max_groups: 4,
        min_advancing: 3,
      } as any;
      spyOn(component, "isDirtyState").and.returnValue(true);
      dataService.updateRace.and.returnValue(of({}));
      dataService.getRaces.and.returnValue(of([]));

      component.updateRace();
      tick();

      expect(dataService.updateRace).toHaveBeenCalled();
      const payload = dataService.updateRace.calls.mostRecent().args[1];
      expect(payload.group_options).toBeDefined();
      expect(payload.group_options.enabled).toBeTrue();
      expect(payload.group_options.max_groups).toBe(4);
      expect(payload.group_options.min_advancing).toBe(3);
    }));

    it("should disable specific group options when heat rotation is Custom", fakeAsync(() => {
      // First trigger ngOnInit and let async loadRace finish loading data
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // Now apply custom mutations on the loaded object
      component.editingRace.heat_rotation_type = "Custom";
      if (!component.editingRace.group_options) {
        component.editingRace.group_options = {} as any;
      }
      component.editingRace.group_options.enabled = true;
      component.editingRace.group_options.max_groups = 3;
      component.editingRace.group_options.balance = true;
      component.editingRace.group_options.allow_empty_lanes = true;
      component.editingRace.group_options.force_multiple_of_max = true;
      component.editingRace.group_options.rotate_group_heats = true;
      component.editingRace.group_options.min_advancing = 2;

      // Propagate the changes to the DOM template
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.debugElement.nativeElement;
      const groupGrid = compiled.querySelector(".group-options-grid");
      expect(groupGrid).toBeTruthy();

      const inputs = groupGrid.querySelectorAll("input");
      const maxGroupsInput = Array.from(inputs).find(
        (inp: any) =>
          inp.getAttribute("type") === "number" &&
          inp.getAttribute("min") === "1",
      ) as HTMLInputElement;
      const minAdvancingInput = Array.from(inputs).find(
        (inp: any) =>
          inp.getAttribute("type") === "number" &&
          inp.getAttribute("min") === "0",
      ) as HTMLInputElement;

      expect(maxGroupsInput).toBeTruthy();
      expect(minAdvancingInput).toBeTruthy();

      expect(maxGroupsInput.disabled).toBeTrue();
      expect(minAdvancingInput.disabled).toBeFalse();

      const checkboxInputs = Array.from(inputs).filter(
        (inp: any) => inp.getAttribute("type") === "checkbox",
      ) as HTMLInputElement[];
      expect(checkboxInputs.length).toBe(4);
      checkboxInputs.forEach((checkbox) => {
        expect(checkbox.disabled).toBeTrue();
      });
    }));
  });

  it("should call updateRace API", fakeAsync(() => {
    component.editingRace = deepCopy(MOCK_RACES[0]);
    spyOn(component, "isDirtyState").and.returnValue(true);
    dataService.updateRace.and.returnValue(of({}));
    dataService.getRaces.and.returnValue(of([]));

    component.updateRace();
    tick(); // Handles setTimeout in loadRaces()

    expect(dataService.updateRace).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  }));

  it("should propagate 'from' and 'returnUrl' when navigating back", fakeAsync(() => {
    activatedRoute.snapshot.queryParamMap.get.and.callFake((key: string) => {
      if (key === "from") return "modify-heats";
      if (key === "returnUrl") return "/default-raceday";
      if (key === "id") return "r1";
      return null;
    });

    component.ngOnInit();
    tick();

    component.onBackClicked();
    tick();

    expect(mockRouter.navigate).toHaveBeenCalledWith(["/race-manager"], {
      queryParams: {
        id: "r1",
        driverCount: 12,
        from: "modify-heats",
        returnUrl: "/default-raceday",
      },
    });
  }));

  it("should set lastEditedId in NavigationService when loading race id", fakeAsync(() => {
    const navService = TestBed.inject(NavigationService);
    spyOn(navService, "setLastEditedId");

    activatedRoute.queryParamMap = of(convertToParamMap({ id: "r2" }));
    component.ngOnInit();
    tick();

    expect(navService.setLastEditedId).toHaveBeenCalledWith("race", "r2");
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
      group_options: { enabled: false },
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
        out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
        out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
      group_options: { enabled: false },
    };
    component.originalRace = deepCopy(component.editingRace);
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
          out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
      queryParams: { id: "2", driverCount: 10, from: null, returnUrl: null },
    });
  }));

  it("should create a duplicate with unique name when Duplicate is clicked and strip ids", fakeAsync(async () => {
    const _harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RaceEditorHarness,
    );
    component.editingRace.name = "Grand Prix";
    component.editingRace.entity_id = "1"; // Ensure button is not disabled
    component.editingRace.id = "some_id";
    component.editingRace._id = "some_id";
    component.races = [{ entity_id: "1", name: "Grand Prix" }];

    dataService.createRace.and.returnValue(
      of({
        ...component.editingRace,
        entity_id: "2",
        name: "Grand Prix_1",
        id: "new_id",
        _id: "new_id",
      }),
    );

    const originalEditingRace = component.editingRace;

    component.saveAsNew();

    // Check that the original editing race name is not mutated
    expect(originalEditingRace.name).toBe("Grand Prix");
    // Check that the component is now editing the newly created race
    expect(component.editingRace.name).toBe("Grand Prix_1");

    fixture.detectChanges();
    tick();

    expect(dataService.createRace).toHaveBeenCalled();
    const calledArg = dataService.createRace.calls.mostRecent().args[0];
    expect(calledArg.name).toBe("Grand Prix_1");
    expect(calledArg.entity_id).toBeUndefined();
    expect(calledArg.id).toBeUndefined();
    expect(calledArg._id).toBeUndefined();
  }));

  it("should trigger autoSaveRace when name is modified through harness", fakeAsync(async () => {
    const harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RaceEditorHarness,
    );

    // Setup a race
    component.editingRace.name = "Initial Name";
    component.editingRace.entity_id = "1"; // Ensure component.editingRace.auto_advance_warmup_time = 1;
    component.originalRace = deepCopy(component.editingRace);
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
          out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
        group_options: { enabled: false },
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
          out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
        group_options: { enabled: false },
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
          out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
        group_options: { enabled: false },
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
          out_of_fuel_action: "DO_NOT_COUNT_LAPS",
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
        group_options: { enabled: false },
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
        jasmine.any(Object),
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
        group_options: { enabled: false },
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

    it("should default to the first available custom rotation asset with matching lane count when rotation type is changed to Custom", () => {
      component.tracks = [{ entity_id: "t1", lanes: [{}, {}, {}, {}] } as any];
      component.customRotationAssets = [
        { model: { entityId: "asset-2lanes" }, numLanes: 2 },
        { model: { entityId: "asset-4lanes-1" }, numLanes: 4 },
        { model: { entityId: "asset-4lanes-2" }, numLanes: 4 },
      ] as any;
      component.editingRace.track_entity_id = "t1";
      component.editingRace.heat_rotation_type = "Custom";
      component.editingRace.custom_rotation_asset_id = undefined;

      component.syncSelectedCustomRotationAsset();

      expect(component.editingRace.custom_rotation_asset_id).toBe(
        "asset-4lanes-1",
      );
      expect(component.selectedCustomRotationAssetId).toBe("asset-4lanes-1");
    });

    it("should preserve the saved custom rotation asset ID when race is loaded", () => {
      component.tracks = [{ entity_id: "t1", lanes: [{}, {}, {}, {}] } as any];
      component.customRotationAssets = [
        { model: { entityId: "asset-4lanes-1" }, numLanes: 4 },
        { model: { entityId: "asset-4lanes-2" }, numLanes: 4 },
      ] as any;
      component.editingRace.track_entity_id = "t1";
      component.editingRace.heat_rotation_type = "Custom";
      component.editingRace.custom_rotation_asset_id = "asset-4lanes-2";

      component.syncSelectedCustomRotationAsset();

      expect(component.editingRace.custom_rotation_asset_id).toBe(
        "asset-4lanes-2",
      );
      expect(component.selectedCustomRotationAssetId).toBe("asset-4lanes-2");
    });

    it("should fall back to the first available custom rotation asset if saved ID has lane count mismatch", () => {
      component.tracks = [{ entity_id: "t1", lanes: [{}, {}, {}, {}] } as any];
      component.customRotationAssets = [
        { model: { entityId: "asset-2lanes" }, numLanes: 2 },
        { model: { entityId: "asset-4lanes-1" }, numLanes: 4 },
        { model: { entityId: "asset-4lanes-2" }, numLanes: 4 },
      ] as any;
      component.editingRace.track_entity_id = "t1";
      component.editingRace.heat_rotation_type = "Custom";
      component.editingRace.custom_rotation_asset_id = "asset-2lanes"; // saved but wrong lane count now

      component.syncSelectedCustomRotationAsset();

      expect(component.editingRace.custom_rotation_asset_id).toBe(
        "asset-4lanes-1",
      );
      expect(component.selectedCustomRotationAssetId).toBe("asset-4lanes-1");
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
        jasmine.any(Object),
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
        jasmine.any(Object),
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

    it("should include start_behind_sensor in the payload", () => {
      component.editingRace.start_behind_sensor = false;

      const payload = (component as any).buildRacePayload(
        component.editingRace,
      );
      expect(payload.start_behind_sensor).toBe(false);
    });

    it("should include start_at_current in the payload", () => {
      component.editingRace.start_at_current = true;

      const payload = (component as any).buildRacePayload(
        component.editingRace,
      );
      expect(payload.start_at_current).toBe(true);
    });

    it("should call captureState when adding a season position point", () => {
      spyOn(component, "captureState");
      component.editingRace.season_scoring = {
        position_points: [10],
        heat_position_points: [5],
      };
      component.addSeasonPositionPoint();
      expect(component.editingRace.season_scoring.position_points).toEqual([
        10, 0,
      ]);
      expect(component.captureState).toHaveBeenCalled();
    });

    it("should scroll points list to bottom when adding a season position point", fakeAsync(() => {
      const mockElement = {
        scrollTop: 0,
        scrollHeight: 500,
      } as any;
      component.seasonPositionPointsList = {
        nativeElement: mockElement,
      } as any;
      component.editingRace.season_scoring = {
        position_points: [10],
        heat_position_points: [5],
      };
      component.addSeasonPositionPoint();
      tick(10);
      expect(mockElement.scrollTop).toBe(500);
    }));

    it("should call captureState when removing a season position point", () => {
      spyOn(component, "captureState");
      component.editingRace.season_scoring = {
        position_points: [10, 5, 2],
        heat_position_points: [5],
      };
      component.removeSeasonPositionPoint(1);
      expect(component.editingRace.season_scoring.position_points).toEqual([
        10, 2,
      ]);
      expect(component.captureState).toHaveBeenCalled();
    });

    it("should allow editing heat position points and capture state", () => {
      spyOn(component, "captureState");
      component.editingRace.season_scoring = {
        position_points: [10],
        heat_position_points: [5, 3],
      };
      component.editingRace.season_scoring.heat_position_points[0] = 7;
      component.captureState();
      expect(component.editingRace.season_scoring.heat_position_points).toEqual(
        [7, 3],
      );
      expect(component.captureState).toHaveBeenCalled();
    });

    it("should preserve all bonus fields in season_scoring when editing", () => {
      component.editingRace.season_scoring = {
        position_points: [25, 18],
        heat_position_points: [3, 2],
        heat_carry_over_pct: 50,
        heat_bonus_fastest_lap: 5,
        heat_bonus_led_lap: 2,
        heat_bonus_most_laps_led: 4,
        heat_one_bonus_per_driver: true,
        overall_carry_over_pct: 25,
        overall_bonus_fastest_lap: 10,
        overall_bonus_fastest_lap_per_lane: 3,
        overall_bonus_led_lap: 1,
        overall_bonus_most_laps_led: 6,
        overall_one_bonus_per_driver: true,
      };

      const payload = (component as any).buildRacePayload(
        component.editingRace,
      );
      expect(payload.season_scoring.heat_carry_over_pct).toBe(50);
      expect(payload.season_scoring.heat_bonus_fastest_lap).toBe(5);
      expect(payload.season_scoring.heat_bonus_led_lap).toBe(2);
      expect(payload.season_scoring.heat_bonus_most_laps_led).toBe(4);
      expect(payload.season_scoring.heat_one_bonus_per_driver).toBe(true);
      expect(payload.season_scoring.overall_carry_over_pct).toBe(25);
      expect(payload.season_scoring.overall_bonus_fastest_lap).toBe(10);
      expect(payload.season_scoring.overall_bonus_fastest_lap_per_lane).toBe(3);
      expect(payload.season_scoring.overall_bonus_led_lap).toBe(1);
      expect(payload.season_scoring.overall_bonus_most_laps_led).toBe(6);
      expect(payload.season_scoring.overall_one_bonus_per_driver).toBe(true);
    });

    it("should sync heat position points to track lane count when creating a new race", () => {
      component.tracks = [
        {
          entity_id: "track6",
          name: "6-Lane Track",
          lanes: [{}, {}, {}, {}, {}, {}],
        } as any,
      ];
      component.createNewRace();
      expect(component.editingRace.min_lap_time).toBe(1.5);
      expect(
        component.editingRace.season_scoring.heat_position_points.length,
      ).toBe(6);
      expect(component.editingRace.season_scoring.heat_position_points).toEqual(
        [3, 2, 1, 0, 0, 0],
      );
    });

    it("should expand heat position points with 0s when switching from a 4-lane to a 6-lane track", () => {
      component.tracks = [
        {
          entity_id: "track4",
          name: "4-Lane Track",
          lanes: [{}, {}, {}, {}],
        } as any,
        {
          entity_id: "track6",
          name: "6-Lane Track",
          lanes: [{}, {}, {}, {}, {}, {}],
        } as any,
      ];
      component.editingRace.track_entity_id = "track4";
      component.editingRace.season_scoring = {
        position_points: [25, 18, 15, 12],
        heat_position_points: [10, 8, 6, 4],
      };
      component.captureState();
      expect(component.editingRace.season_scoring.heat_position_points).toEqual(
        [10, 8, 6, 4],
      );

      // Switch to 6-lane track
      component.editingRace.track_entity_id = "track6";
      component.captureState();
      expect(component.editingRace.season_scoring.heat_position_points).toEqual(
        [10, 8, 6, 4, 0, 0],
      );
    });

    it("should truncate extra heat position points when switching from a 6-lane track to a 4-lane track", () => {
      component.tracks = [
        {
          entity_id: "track4",
          name: "4-Lane Track",
          lanes: [{}, {}, {}, {}],
        } as any,
        {
          entity_id: "track6",
          name: "6-Lane Track",
          lanes: [{}, {}, {}, {}, {}, {}],
        } as any,
      ];
      component.editingRace.track_entity_id = "track6";
      component.editingRace.season_scoring = {
        position_points: [25, 18, 15, 12, 10, 8],
        heat_position_points: [10, 8, 6, 4, 2, 1],
      };
      component.captureState();
      expect(component.editingRace.season_scoring.heat_position_points).toEqual(
        [10, 8, 6, 4, 2, 1],
      );

      // Switch back to 4-lane track
      component.editingRace.track_entity_id = "track4";
      component.captureState();
      expect(component.editingRace.season_scoring.heat_position_points).toEqual(
        [10, 8, 6, 4],
      );
    });

    it("should sync heat position points when track lane count has changed on loaded race", () => {
      // Track now has 6 lanes but race was previously saved with 4 heat points
      component.tracks = [
        {
          entity_id: "track-modified",
          name: "Modified Track",
          lanes: [{}, {}, {}, {}, {}, {}],
        } as any,
      ];
      component.editingRace.track_entity_id = "track-modified";
      component.editingRace.season_scoring = {
        position_points: [25, 18, 15, 12],
        heat_position_points: [5, 4, 3, 2],
      };

      component.syncHeatPositionPoints();
      expect(component.editingRace.season_scoring.heat_position_points).toEqual(
        [5, 4, 3, 2, 0, 0],
      );
    });

    it("should handle null editingRace or missing track safely in syncHeatPositionPoints", () => {
      component.editingRace = null as any;
      expect(() => component.syncHeatPositionPoints()).not.toThrow();

      component.editingRace = {
        track_entity_id: "non-existent-track",
        season_scoring: null,
      } as any;
      component.tracks = [];
      expect(() => component.syncHeatPositionPoints()).not.toThrow();
      expect(component.editingRace.season_scoring).toBeDefined();
    });
  });

  describe("Guided Help", () => {
    it("should return complete guided help steps in expected order", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(80);
      expect(steps[0].title).toBe("RE_HELP_WELCOME_TITLE");
      expect(steps[1].selector).toBe("#race-name-input");
      expect(steps[2].selector).toBe("#heat-rotation-select");
      expect(steps[3].selector).toBe("#heat-list-section");
      expect(steps[4].selector).toBe("#driver-count-section");
      expect(steps[5].selector).toBe("#track-select");
      expect(steps[6].selector).toBe("#theme-select");
      expect(steps[7].selector).toBe("#min-lap-time-input");
      expect(steps[8].selector).toBe("#drift-time-input");
      expect(steps[9].selector).toBe("#practice-input");
      expect(steps[10].selector).toBe("#adjust-drift-laps-input");
      expect(steps[11].selector).toBe("#auto-advance-time-input");
      expect(steps[12].selector).toBe("#auto-advance-warmup-time-input");
      expect(steps[13].selector).toBe("#auto-start-time-input");
      expect(steps[14].selector).toBe("#auto-start-warmup-time-input");
      expect(steps[15].selector).toBe("#heat-times-through-input");
      expect(steps[16].selector).toBe("#reverse-heats-input");
      expect(steps[17].selector).toBe("#heat-ranking-select");
      expect(steps[18].selector).toBe("#heat-tiebreaker-select");
      expect(steps[19].selector).toBe("#finish-method-select");
      expect(steps[20].selector).toBe("#finish-value-input");
      expect(steps[21].selector).toBe("#allow-finish-select");
      expect(steps[22].selector).toBe("#overall-ranking-select");
      expect(steps[23].selector).toBe("#overall-tiebreaker-select");
      expect(steps[24].selector).toBe("#dropped-heats-input");
      expect(steps[25].selector).toBe("#groups-enabled-input");
      expect(steps[26].selector).toBe("#groups-max-input");
      expect(steps[27].selector).toBe("#groups-balance-input");
      expect(steps[28].selector).toBe("#groups-allow-empty-input");
      expect(steps[29].selector).toBe("#groups-force-multiple-input");
      expect(steps[30].selector).toBe("#groups-rotate-heats-input");
      expect(steps[31].selector).toBe("#groups-min-advancing-input");
      expect(steps[32].selector).toBe("#groups-names-section");
      expect(steps[33].selector).toBe("#start-time-input");
      expect(steps[34].selector).toBe("#restart-time-input");
      expect(steps[35].selector).toBe("#start-randomizer-input");
      expect(steps[36].selector).toBe("#restart-randomizer-input");
      expect(steps[37].selector).toBe("#start-behind-sensor-input");
      expect(steps[38].selector).toBe("#start-at-current-input");
      expect(steps[39].selector).toBe("#hot-start-input");
      expect(steps[40].selector).toBe("#restart-on-false-start-input");
      expect(steps[41].selector).toBe("#false-start-lap-penalty-input");
      expect(steps[42].selector).toBe("#false-start-time-penalty-input");
      expect(steps[43].selector).toBe("#team-pit-stop-change-driver-input");
      expect(steps[44].selector).toBe("#team-heat-lap-limit-input");
      expect(steps[45].selector).toBe("#team-heat-time-limit-input");
      expect(steps[46].selector).toBe("#team-overall-lap-limit-input");
      expect(steps[47].selector).toBe("#team-overall-time-limit-input");
      expect(steps[48].selector).toBe("#fuel-enabled-input");
      expect(steps[49].selector).toBe("#fuel-usage-type-select");
      expect(steps[50].selector).toBe("#fuel-usage-rate-input");
      expect(steps[51].selector).toBe("#fuel-reference-time-input");
      expect(steps[52].selector).toBe("#fuel-capacity-input");
      expect(steps[53].selector).toBe("#fuel-start-level-input");
      expect(steps[54].selector).toBe("#fuel-refuel-rate-input");
      expect(steps[55].selector).toBe("#fuel-pit-delay-input");
      expect(steps[56].selector).toBe("#fuel-reset-at-start-input");
      expect(steps[57].selector).toBe("#fuel-out-of-fuel-action-select");
      expect(steps[58].selector).toBe("#digital-fuel-enabled-input");
      expect(steps[59].selector).toBe("#digital-fuel-usage-type-select");
      expect(steps[60].selector).toBe("#digital-fuel-usage-rate-input");
      expect(steps[61].selector).toBe("#digital-fuel-capacity-input");
      expect(steps[62].selector).toBe("#digital-fuel-start-level-input");
      expect(steps[63].selector).toBe("#digital-fuel-refuel-rate-input");
      expect(steps[64].selector).toBe("#digital-fuel-pit-delay-input");
      expect(steps[65].selector).toBe("#digital-fuel-reset-at-start-input");
      expect(steps[66].selector).toBe(
        "#digital-fuel-out-of-fuel-action-select",
      );
      expect(steps[67].selector).toBe("#season-position-points-section");
      expect(steps[68].selector).toBe("#season-heat-position-points-section");
      expect(steps[69].selector).toBe("#season-overall-carry-over-input");
      expect(steps[70].selector).toBe("#season-overall-fastest-lap-input");
      expect(steps[71].selector).toBe("#season-overall-fastest-lap-lane-input");
      expect(steps[72].selector).toBe("#season-overall-most-laps-led-input");
      expect(steps[73].selector).toBe("#season-overall-led-lap-input");
      expect(steps[74].selector).toBe("#season-overall-one-bonus-input");
      expect(steps[75].selector).toBe("#season-heat-carry-over-input");
      expect(steps[76].selector).toBe("#season-heat-fastest-lap-input");
      expect(steps[77].selector).toBe("#season-heat-most-laps-led-input");
      expect(steps[78].selector).toBe("#season-heat-led-lap-input");
      expect(steps[79].selector).toBe("#season-heat-one-bonus-input");
    });

    it("should expand corresponding sections when executing onEnter hooks", () => {
      component.sectionsExpanded.general = false;
      component.sectionsExpanded.start_method = false;
      component.sectionsExpanded.scoring = false;
      component.sectionsExpanded.season_points = false;
      component.sectionsExpanded.heats = false;
      component.sectionsExpanded.groups = false;
      component.sectionsExpanded.fuel_analog = false;
      component.sectionsExpanded.fuel_digital = false;
      component.sectionsExpanded.team = false;

      const steps = component.getHelpSteps();
      steps[1].onEnter!();
      expect(component.sectionsExpanded.general).toBeTrue();

      steps[6].onEnter!();
      expect(component.sectionsExpanded.general).toBeTrue();

      steps[11].onEnter!();
      expect(component.sectionsExpanded.heats).toBeTrue();

      steps[17].onEnter!();
      expect(component.sectionsExpanded.scoring).toBeTrue();

      steps[25].onEnter!();
      expect(component.sectionsExpanded.groups).toBeTrue();

      steps[33].onEnter!();
      expect(component.sectionsExpanded.start_method).toBeTrue();

      steps[43].onEnter!();
      expect(component.sectionsExpanded.team).toBeTrue();

      steps[48].onEnter!();
      expect(component.sectionsExpanded.fuel_analog).toBeTrue();

      steps[58].onEnter!();
      expect(component.sectionsExpanded.fuel_digital).toBeTrue();

      steps[67].onEnter!();
      expect(component.sectionsExpanded.season_points).toBeTrue();

      steps[69].onEnter!();
      expect(component.sectionsExpanded.season_points).toBeTrue();
    });

    it("should trigger help service when startHelp is called", () => {
      const helpService = TestBed.inject(HelpService);
      component.startHelp();
      expect(helpService.startGuide).toHaveBeenCalled();
      const calledSteps = (
        helpService.startGuide as jasmine.Spy
      ).calls.mostRecent().args[0];
      expect(calledSteps.length).toBe(80);
      expect(calledSteps[0].title).toBe("RE_HELP_WELCOME_TITLE");
      expect(calledSteps[6].selector).toBe("#theme-select");
      expect(calledSteps[11].selector).toBe("#auto-advance-time-input");
      expect(calledSteps[17].selector).toBe("#heat-ranking-select");
      expect(calledSteps[25].selector).toBe("#groups-enabled-input");
      expect(calledSteps[33].selector).toBe("#start-time-input");
      expect(calledSteps[43].selector).toBe(
        "#team-pit-stop-change-driver-input",
      );
      expect(calledSteps[48].selector).toBe("#fuel-enabled-input");
      expect(calledSteps[58].selector).toBe("#digital-fuel-enabled-input");
      expect(calledSteps[67].selector).toBe("#season-position-points-section");
      expect(calledSteps[69].selector).toBe("#season-overall-carry-over-input");
    });
  });

  describe("Reset Race Records", () => {
    beforeEach(() => {
      component.editingRace = {
        name: "Grand Prix",
        entity_id: "gp_1",
      };
      fixture.detectChanges();
    });

    it("should open confirmation modal when user is admin and reset is triggered", () => {
      roleSubject.next(Role.ADMIN);
      fixture.detectChanges();

      component.onResetRecords();
      expect(component.showResetConfirmation).toBeTrue();
    });

    it("should stop propagation if event passed to onResetRecords", () => {
      const mockEvent = jasmine.createSpyObj("Event", ["stopPropagation"]);
      component.onResetRecords(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it("should NOT open confirmation modal when user is not admin", () => {
      roleSubject.next(Role.VIEWER);
      fixture.detectChanges();

      component.onResetRecords();
      expect(component.showResetConfirmation).toBeFalse();
    });

    it("should NOT open confirmation modal if editingRace has no entity_id", () => {
      component.editingRace = { name: "New Race" };
      component.onResetRecords();
      expect(component.showResetConfirmation).toBeFalse();
    });

    it("should return correct tooltip based on admin status", () => {
      roleSubject.next(Role.ADMIN);
      fixture.detectChanges();
      expect(component.getResetTooltip()).toBe("RM_BTN_RESET_RECORDS");

      roleSubject.next(Role.VIEWER);
      fixture.detectChanges();
      expect(component.getResetTooltip()).toBe("RM_RESET_ADMIN_ONLY_TOOLTIP");
    });

    it("should call resetRaceRecords and show success modal on confirmation", fakeAsync(() => {
      roleSubject.next(Role.ADMIN);
      fixture.detectChanges();

      component.onResetRecords();
      expect(component.showResetConfirmation).toBeTrue();

      component.onConfirmReset();
      expect(component.showResetConfirmation).toBeFalse();
      expect(component.showResetSuccess).toBeTrue();
      expect(component.resetRaceName).toBe("Grand Prix");
      expect(dataService.resetRaceRecords).toHaveBeenCalledWith("gp_1");
    }));

    it("should cancel reset when onCancelReset is called", () => {
      component.showResetConfirmation = true;
      component.onCancelReset();
      expect(component.showResetConfirmation).toBeFalse();
      expect(dataService.resetRaceRecords).not.toHaveBeenCalled();
    });

    it("should close success modal when onCloseResetSuccess is called", () => {
      component.showResetSuccess = true;
      component.onCloseResetSuccess();
      expect(component.showResetSuccess).toBeFalse();
    });
  });

  describe("Section Toggling, Config Validation, and Discard Flow", () => {
    it("should toggle sections and save to localStorage", () => {
      spyOn(localStorage, "setItem");
      expect(component.sectionsExpanded.general).toBeTrue();

      component.toggleSection("general");
      expect(component.sectionsExpanded.general).toBeFalse();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "race_editor_expanders",
        jasmine.any(String),
      );
    });

    it("should validate config state accurately", () => {
      component.isLoading = false;
      component.editingRace = {
        name: "Test Race",
        track_entity_id: "t1",
        heat_rotation_type: "RoundRobin" as any,
      } as any;
      expect(component.isConfigValid()).toBeTrue();

      component.editingRace.name = "";
      expect(component.isConfigValid()).toBeFalse();
    });

    it("should handle discard confirmation modal resolution", fakeAsync(() => {
      let resolvedValue: boolean | undefined;
      component.confirmDiscard().then((val) => (resolvedValue = val));
      expect(component.showDiscardConfirm).toBeTrue();

      component.onConfirmDiscard();
      tick();
      expect(component.showDiscardConfirm).toBeFalse();
      expect(resolvedValue).toBeTrue();

      // Test cancel discard
      component.confirmDiscard().then((val) => (resolvedValue = val));
      component.onCancelDiscard();
      tick();
      expect(resolvedValue).toBeFalse();
    }));
  });

  describe("Fuel Usage Graphs, Pit Graphs, and Interactive Hover Tooltips", () => {
    beforeEach(() => {
      component.editingRace = {
        name: "Graph Test Race",
        fuel_options: {
          enabled: true,
          usage_type: FuelUsageType.LINEAR,
          usage_rate: 5,
          reference_time: 6,
          capacity: 100,
        },
        digital_fuel_options: {
          enabled: true,
          usage_type: 1 as any,
          usage_rate: 10,
          capacity: 100,
        },
      } as any;
    });

    it("should compute and cache analog fuel usage and pit graph paths", () => {
      const usagePath = component.getFuelUsagePath();
      expect(usagePath).toContain("M ");
      expect(usagePath).toContain(" L ");

      const yLabels = component.getFuelUsageYLabels();
      expect(yLabels.length).toBe(5);

      const pitPath = component.getPitGraphPath();
      expect(pitPath).toContain("M ");

      const xLabels = component.getPitGraphXLabels();
      expect(xLabels.length).toBe(5);
    });

    it("should compute and cache digital fuel usage and pit graph paths", () => {
      const dUsagePath = component.getDigitalUsagePath();
      expect(dUsagePath).toContain("M ");

      const dYLabels = component.getDigitalUsageYLabels();
      expect(dYLabels.length).toBe(5);

      const dPitPath = component.getDigitalPitPath();
      expect(dPitPath).toContain("M ");

      const dXLabels = component.getDigitalPitXLabels();
      expect(dXLabels.length).toBe(5);
    });

    it("should handle mouse move and leave events for analog graphs", () => {
      const mockSvg = {
        getBoundingClientRect: () => ({
          left: 10,
          top: 20,
          width: 400,
          height: 150,
        }),
      };
      const mockEvent = {
        currentTarget: mockSvg,
        clientX: 210,
        clientY: 95,
      } as any;

      component.onGraphMouseMove(mockEvent, "usage");
      expect(component.hoveredPoint).toBeTruthy();
      expect(component.hoveredPoint?.type).toBe("usage");
      expect(component.hoveredPoint?.xLabel).toBe("RE_HOVER_LAP_TIME");

      component.onGraphMouseMove(mockEvent, "pit");
      expect(component.hoveredPoint).toBeTruthy();
      expect(component.hoveredPoint?.type).toBe("pit");
      expect(component.hoveredPoint?.xLabel).toBe("RE_HOVER_TIME_TO_PIT");

      component.onGraphMouseLeave();
      expect(component.hoveredPoint).toBeNull();
    });

    it("should handle mouse move events for digital graphs", () => {
      const mockSvg = {
        getBoundingClientRect: () => ({
          left: 10,
          top: 20,
          width: 400,
          height: 150,
        }),
      };
      const mockEvent = {
        currentTarget: mockSvg,
        clientX: 210,
        clientY: 95,
      } as any;

      component.onDigitalGraphMouseMove(mockEvent, "usage");
      expect(component.hoveredPoint).toBeTruthy();
      expect(component.hoveredPoint?.type).toBe("digital_usage");

      component.onDigitalGraphMouseMove(mockEvent, "pit");
      expect(component.hoveredPoint).toBeTruthy();
      expect(component.hoveredPoint?.type).toBe("digital_pit");
    });

    it("should return interactive guide steps for help walkthrough", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBeGreaterThan(5);
      expect(steps[0].title).toBe("RE_HELP_WELCOME_TITLE");

      for (const step of steps) {
        if (step.onEnter) {
          step.onEnter();
        }
      }
    });

    it("should compute fuel usage paths with Quadratic and Cubic models", () => {
      component.editingRace.fuel_options!.usage_type = FuelUsageType.QUADRATIC;
      expect(component.getFuelUsagePath()).toContain("M ");

      component.editingRace.fuel_options!.usage_type = FuelUsageType.CUBIC;
      expect(component.getFuelUsagePath()).toContain("M ");

      component.editingRace.digital_fuel_options!.usage_type =
        FuelUsageType.QUADRATIC;
      expect(component.getDigitalUsagePath()).toContain("M ");

      component.editingRace.digital_fuel_options!.usage_type =
        FuelUsageType.CUBIC;
      expect(component.getDigitalUsagePath()).toContain("M ");
    });

    it("should validate CustomRoundRobin and Custom rotation configs", () => {
      component.tracks = [
        {
          entity_id: "trk1",
          lanes: [{}, {}, {}, {}],
          has_per_lane_relays: true,
        } as any,
      ];
      component.editingRace.track_entity_id = "trk1";

      expect(component.currentTrackHasPerLaneRelays).toBeTrue();

      component.editingRace.heat_rotation_type = "CustomRoundRobin";
      component.editingRace.custom_rotation_sequence = [];
      expect(component.isRotationInvalid).toBeTrue();

      component.editingRace.custom_rotation_sequence = [1, 2, 5]; // lane 5 > 4 lanes
      expect(component.isRotationInvalid).toBeTrue();

      component.editingRace.custom_rotation_sequence = [1, 2, 2]; // duplicate lane
      expect(component.isRotationInvalid).toBeTrue();

      component.editingRace.custom_rotation_sequence = [1, 2, 3, 4];
      expect(component.isRotationInvalid).toBeFalse();

      component.editingRace.heat_rotation_type = "Custom";
      component.editingRace.custom_rotations = [];
      component.editingRace.custom_rotation_asset_id = undefined;
      expect(component.isRotationInvalid).toBeTrue();

      component.editingRace.custom_rotation_asset_id = "asset-rot-1";
      expect(component.isRotationInvalid).toBeFalse();
    });
  });

  describe("Editor Tabs and Section Navigation", () => {
    it("should return the 9 configuration tabs with IDs and labels", () => {
      const tabs = component.raceTabs;
      expect(tabs.length).toBe(9);
      expect(tabs.map((t) => t.id)).toEqual([
        "general-section",
        "heats-section",
        "scoring-section",
        "group-section",
        "start-method-section",
        "team-options-section",
        "analog-fuel-section",
        "digital-fuel-outer-section",
        "season-points-section",
      ]);
      tabs.forEach((tab) => {
        expect(tab.label).toBeDefined();
        expect(tab.label.length).toBeGreaterThan(0);
      });
    });

    it("should expand section and scroll container on scrollToAndExpandSection", fakeAsync(() => {
      spyOn(localStorage, "setItem");
      component.sectionsExpanded.general = false;
      component.sectionsExpanded.groups = false;

      const dummyContainer = document.createElement("div");
      dummyContainer.className = "sections-wrapper";
      spyOn(dummyContainer, "getBoundingClientRect").and.returnValue({
        top: 100,
      } as any);
      dummyContainer.scrollTop = 50;
      spyOn(dummyContainer, "scrollTo");

      const dummyElement = document.createElement("div");
      dummyElement.id = "group-section";
      spyOn(dummyElement, "getBoundingClientRect").and.returnValue({
        top: 250,
      } as any);

      spyOn(document, "getElementById").and.callFake((id: string) => {
        if (id === "group-section") return dummyElement;
        return null;
      });
      spyOn(document, "querySelector").and.callFake((selector: string) => {
        if (selector === ".sections-wrapper") return dummyContainer;
        return null;
      });

      component.scrollToAndExpandSection("group-section");
      expect(component.sectionsExpanded.groups).toBeTrue();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "race_editor_expanders",
        jasmine.any(String),
      );

      tick();

      expect(dummyContainer.scrollTo as jasmine.Spy).toHaveBeenCalledWith({
        top: 250 - 100 + 0 - 24,
        behavior: "smooth",
      });
    }));

    it("should fallback to scrollIntoView when container is not found", fakeAsync(() => {
      const dummyElement = document.createElement("div");
      dummyElement.id = "scoring-section";
      spyOn(dummyElement, "scrollIntoView");

      spyOn(document, "getElementById").and.returnValue(dummyElement);
      spyOn(document, "querySelector").and.returnValue(null);

      component.sectionsExpanded.scoring = false;
      component.scrollToAndExpandSection("scoring-section");
      expect(component.sectionsExpanded.scoring).toBeTrue();

      tick();

      expect(dummyElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    }));

    it("should safely handle unknown tabId in scrollToAndExpandSection", fakeAsync(() => {
      spyOn(localStorage, "setItem");
      component.scrollToAndExpandSection("unknown-tab-id");
      tick();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    }));

    it("should return correct translation keys for default and custom themes in getThemeDisplayNameKey", () => {
      expect(
        component.getThemeDisplayNameKey({
          entity_id: "default_classic_rc_ai",
          is_default: true,
          name: "Default",
        } as any),
      ).toBe("UE_LABEL_DEFAULT_THEME");

      expect(
        component.getThemeDisplayNameKey({
          entity_id: "practice_theme_rc_ai",
          is_default: true,
          name: "Practice",
        } as any),
      ).toBe("UE_LABEL_PRACTICE_THEME");

      expect(
        component.getThemeDisplayNameKey({
          entity_id: "default_fuel_theme_rc_ai",
          is_default: true,
          name: "Fuel",
        } as any),
      ).toBe("UE_LABEL_FUEL_THEME");

      expect(
        component.getThemeDisplayNameKey({
          entity_id: "custom_theme_1",
          is_default: false,
          name: "My Custom Theme",
        } as any),
      ).toBe("My Custom Theme");
    });

    it("should include theme_id in buildRacePayload and send it when updating race", fakeAsync(() => {
      dataService.updateRace.and.returnValue(of({}));
      component.editingRace.entity_id = "r1";
      component.editingRace.name = "Themed Grand Prix";
      component.editingRace.theme_id = "practice_theme_rc_ai";
      (component as any).originalRace = {
        ...component.editingRace,
        theme_id: "default_classic_rc_ai",
      };

      component.updateRace();
      tick();

      expect(dataService.updateRace).toHaveBeenCalled();
      const payload = dataService.updateRace.calls.mostRecent().args[1];
      expect(payload.theme_id).toBe("practice_theme_rc_ai");
    }));
  });
});
