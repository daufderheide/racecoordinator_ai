import { DragDropModule } from "@angular/cdk/drag-drop";
import { Component, input, NO_ERRORS_SCHEMA, output } from "@angular/core";
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, convertToParamMap, Router } from "@angular/router";
import { BehaviorSubject, of, throwError } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import { Lane } from "@app/models/lane";
import { Settings } from "@app/models/settings";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  MOCK_TRACK_INSTANCES,
  MOCK_TRACKS as _MOCK_TRACKS,
} from "@app/testing/data/tracks_data";
import {
  mockAnalyticsService,
  mockLoggerService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { createTrackManagerDataServiceMock } from "../track-manager/testing/track-manager_helper";

@Component({
  selector: "app-editor-title",
  standalone: true,
  template: "",
  imports: [FormsModule, DragDropModule],
})
class MockEditorTitleComponent {
  titleKey = input<string>("");
  backRoute = input<string>("");
  backConfirm = input<boolean>(false);
  backQueryParams = input<any>({});
  backConfirmTitle = input<string>("");
  backConfirmMessage = input<string>("");
  undoManager = input<any>();
  showUndo = input<boolean>(true);
  showRedo = input<boolean>(true);
  showHelp = input<boolean>(true);
  showCopy = input<boolean>(false);
  showAdd = input<boolean>(false);
  showDelete = input<boolean>(false);
  isSaving = input<boolean>(false);
  helpSteps = input<any[]>([]);
  helpTitle = input<string>("");
  helpRecordName = input<string | undefined>();
  help = output<void>();
  back = output<void>();
  copy = output<void>();
  add = output<void>();
  delete = output<void>();
}

import { deepCopy } from "@app/utils/clone.utils";

import { NavigationService } from "../../services/navigation.service";
import { TrackEditorComponent } from "./track-editor.component";

describe("TrackEditorComponent", () => {
  let component: TrackEditorComponent;
  let fixture: ComponentFixture<TrackEditorComponent>;
  let dataService: any;
  let router: any;
  let _activatedRoute: any;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    const mockActivatedRoute = {
      queryParamMapSubject: new BehaviorSubject(
        convertToParamMap({ id: "t1" }),
      ),
      queryParamsSubject: new BehaviorSubject({ help: "false" }),

      snapshot: {
        get queryParamMap() {
          return (this as any)._parent.queryParamMapSubject.value;
        },
        get queryParams() {
          return (this as any)._parent.queryParamsSubject.value;
        },
        _parent: null as any,
      },

      queryParamMap: null as any,
      queryParams: null as any,

      setQueryParams(params: any) {
        const map = convertToParamMap(params);
        (this as any).queryParamMapSubject.next(map);
        (this as any).queryParamsSubject.next(params);
      },
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
    (mockActivatedRoute.snapshot as any)._parent = mockActivatedRoute;
    mockActivatedRoute.queryParamMap =
      mockActivatedRoute.queryParamMapSubject.asObservable();
    mockActivatedRoute.queryParams =
      mockActivatedRoute.queryParamsSubject.asObservable();

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        DragDropModule,
        TrackEditorComponent,
        TranslatePipe,
        MockEditorTitleComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DataService, useValue: createTrackManagerDataServiceMock() },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: HelpService,
          useFactory: () => {
            const isVisible$ = new BehaviorSubject<boolean>(false);
            return {
              isVisible$,
              currentStep$: of(null),
              hasNext$: of(false),
              hasPrevious$: of(false),
              startGuide: jasmine
                .createSpy("startGuide")
                .and.callFake(() => isVisible$.next(true)),
            };
          },
        },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackEditorComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    router = TestBed.inject(Router);
    _activatedRoute = TestBed.inject(ActivatedRoute);

    component.editingTrack = JSON.parse(
      JSON.stringify(MOCK_TRACK_INSTANCES[0]),
    );
    Object.setPrototypeOf(component.editingTrack, Track.prototype);
    component.allTracks = deepCopy(MOCK_TRACK_INSTANCES).map((t: any) => {
      Object.setPrototypeOf(t, Track.prototype);
      return t;
    });
    fixture.detectChanges();
    // After detectChanges (ngOnInit -> loadData), the component has a fresh model from the mock.
    // We MUST use the model the component is actually using for the UndoManager baseline.
    component.undoManager.initialize(component.editingTrack!);
  });

  afterEach(() => {
    resetMocks();
    fixture.destroy();
    try {
      discardPeriodicTasks();
    } catch (e) {
      // Not in fakeAsync zone
    }
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load track data for editing", () => {
    expect(component.trackName).toBe("Classic Circuit");
    expect(component.lanes.length).toBe(2);
    expect(component.editingTrack?.entity_id).toBe("t1");
  });

  it("should preserve trackmate_configs when cloning track for editing", () => {
    const track = MOCK_TRACK_INSTANCES[0]; // Assuming this has trackmate_configs or we can mock it
    const cloned = (component as any).cloneTrack({
      ...track,
      trackmate_configs: [{ commPort: "COM1", lapPinPitBehavior: 1 }],
    });
    expect(cloned.trackmate_configs).toEqual([
      { commPort: "COM1", lapPinPitBehavior: 1 },
    ]);
  });

  it("should load factory settings for a new track", fakeAsync(() => {
    // Setup for 'new' ID
    const route = TestBed.inject(ActivatedRoute) as any;
    route.setQueryParams({ id: "new" });

    // Re-run ngOnInit logic
    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(dataService.getTrackFactorySettings).toHaveBeenCalled();
    expect(component.trackName).toBe("TM_DEFAULT_TRACK_NAME");
    expect(component.lanes.length).toBe(4);
    expect(component.editingTrack?.entity_id).toBe("new");
  }));

  it("should handle lane management", () => {
    component.addLane();
    expect(component.lanes.length).toBe(3);

    component.removeLane(0);
    expect(component.lanes.length).toBe(2);
  });

  it("should update lane properties", () => {
    component.updateLaneBackgroundColor(0, "#00ff00");
    expect(component.lanes[0].background_color).toBe("#00ff00");

    component.updateLaneLength(0, 15);
    expect(component.lanes[0].length).toBe(15);
  });

  it("should update existing track", () => {
    component.trackName = "Updated Track";

    component.updateTrack();

    expect(dataService.updateTrack).toHaveBeenCalledWith(
      "t1",
      jasmine.any(Object),
    );
    expect(component.isSaving).toBeFalse();
  });

  it("should retain trackmate_configs after a successful track update", fakeAsync(() => {
    const mockTrackmateConfig = [
      { name: "TM1", commPort: "COM2", lapPinPitBehavior: 2 },
    ];
    dataService.updateTrack.and.returnValue(
      of({
        entity_id: "t1",
        name: "Updated Track",
        lanes: component.lanes,
        arduino_configs: component.arduinoConfigs,
        has_per_lane_relays: true,
        has_main_relay: false,
        trackmate_configs: mockTrackmateConfig,
      }),
    );

    component.trackmateConfigs = mockTrackmateConfig as any;
    component.trackName = "Updated Track";

    component.updateTrack();

    flush();
    fixture.detectChanges();

    expect(component.trackmateConfigs).toEqual(mockTrackmateConfig as any);
    expect(component.editingTrack?.trackmate_configs).toEqual(
      mockTrackmateConfig as any,
    );
    expect(component.editingTrack?.has_per_lane_relays).toBeTrue();
  }));

  it("should preserve bart_configs when cloning track for editing", () => {
    const track = MOCK_TRACK_INSTANCES[0];
    const mockBartConfig = [
      {
        name: "BART 1",
        deviceName: "BART_0001",
        numLanes: 4,
        minLapMs: 1000,
        lapPinPitBehavior: 0,
        lapPinBehaviors: [0, 1],
      },
    ];
    const cloned = (component as any).cloneTrack({
      ...track,
      bart_configs: mockBartConfig,
    });
    expect(cloned.bart_configs).toEqual(mockBartConfig as any);
  });

  it("should call initializeInterfaces when onBartConfigChange is called", () => {
    dataService.initializeInterface.calls.reset();
    component.onBartConfigChange();
    expect(dataService.initializeInterface).toHaveBeenCalled();
  });

  it("should retain bart_configs after a successful track update", fakeAsync(() => {
    const mockBartConfig = [
      {
        name: "BART 1",
        deviceName: "BART_0001",
        numLanes: 4,
        minLapMs: 1000,
        lapPinPitBehavior: 0,
        lapPinBehaviors: [0, 1],
      },
    ];
    dataService.updateTrack.and.returnValue(
      of({
        entity_id: "t1",
        name: "Updated Track",
        lanes: component.lanes,
        arduino_configs: component.arduinoConfigs,
        has_per_lane_relays: true,
        has_main_relay: false,
        bart_configs: mockBartConfig,
      }),
    );

    component.bartConfigs = mockBartConfig as any;
    component.trackName = "Updated Track";

    component.updateTrack();

    flush();
    fixture.detectChanges();

    expect(component.bartConfigs).toEqual(mockBartConfig as any);
    expect(component.editingTrack?.bart_configs).toEqual(mockBartConfig as any);
  }));

  it("should save as new track", () => {
    component.saveAsNew();

    expect(dataService.createTrack).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/track-editor"], {
      queryParams: { id: "t-new-id", from: null, returnUrl: null },
      replaceUrl: true,
    });
  });

  it("should navigate back to manager with selectedId", () => {
    component.onBack();
    expect(router.navigate).toHaveBeenCalledWith(["/track-manager"], {
      queryParams: {
        selectedId: "t1",
        from: null,
        returnUrl: null,
      },
    });
  });

  it("should set lastEditedId in NavigationService when loading track id", () => {
    const navService = TestBed.inject(NavigationService);
    spyOn(navService, "setLastEditedId");

    const route = TestBed.inject(ActivatedRoute) as any;
    route.setQueryParams({ id: "t2" });

    expect(navService.setLastEditedId).toHaveBeenCalledWith("track", "t2");
  });

  it("should propagate 'from' and 'returnUrl' when navigating back", () => {
    const route = TestBed.inject(ActivatedRoute) as any;
    spyOn(route.snapshot.queryParamMap, "get").and.callFake((key: string) => {
      if (key === "from") return "modify-heats";
      if (key === "returnUrl") return "/default-raceday";
      if (key === "id") return "t1";
      return null;
    });

    component.onBack();
    expect(router.navigate).toHaveBeenCalledWith(["/track-manager"], {
      queryParams: {
        selectedId: "t1",
        from: "modify-heats",
        returnUrl: "/default-raceday",
      },
    });
  });

  it("should stay on page and keep original ID when save as new fails", () => {
    dataService.createTrack.and.returnValue(
      throwError(() => ({ status: 409, error: "Conflict" })),
    );
    spyOn(window, "alert");

    const originalTrackId = component.editingTrack?.entity_id;
    component.saveAsNew();

    expect(dataService.createTrack).toHaveBeenCalled();
    expect(component.editingTrack?.entity_id).toBe(originalTrackId);
    expect(component.isSaving).toBeFalse();
    expect(window.alert).toHaveBeenCalled();
    expect(mockLoggerService.error).toHaveBeenCalled();
  });

  it("should handle save error", () => {
    spyOn(window, "alert");
    dataService.updateTrack.and.returnValue(
      throwError(() => ({ status: 500 })),
    );

    component.updateTrack();

    expect(window.alert).toHaveBeenCalledWith("TE_ERROR_SAVE_FAILED");
    expect(component.isSaving).toBeFalse();
    expect(mockLoggerService.error).toHaveBeenCalled();
  });

  it("should check for unsaved changes (dirty state)", fakeAsync(() => {
    // Advance beyond any initialization and debounce timers
    tick(1000);
    fixture.detectChanges();

    // Ensure the state is clean after full initialization
    expect(component.isDirtyState()).toBeFalse();
    component.trackName = "Changed";
    component.onInputChange();
    expect(component.isDirtyState()).toBeTrue();
  }));

  it("should shift Arduino pin assignments when a lane is deleted", () => {
    // 1. Setup track with 4 lanes
    component.lanes = [
      new Lane("l1", "#ff0000", "black", 100),
      new Lane("l2", "#00ff00", "black", 100),
      new Lane("l3", "#0000ff", "black", 100),
      new Lane("l4", "#ffffff", "black", 100),
    ];

    // 2. Add Arduino config with lane-specific behaviors
    component.addArduinoConfig();
    const config = component.arduinoConfigs[0];
    // Lane 1 (index 0) behaviors
    config.digitalIds[2] = 1000; // Lap Lane 1
    // Lane 2 (index 1) behaviors
    config.digitalIds[3] = 1001; // Lap Lane 2
    config.digitalIds[4] = 3001; // Call Lane 2
    // Lane 3 (index 2) behaviors
    config.digitalIds[5] = 1002; // Lap Lane 3
    config.digitalIds[6] = 4002; // Relay Lane 3
    // Lane 4 (index 3) behaviors
    config.digitalIds[7] = 1003; // Lap Lane 4

    // Analog behaviors
    config.analogIds[0] = 7001; // Voltage Lane 2
    config.analogIds[1] = 7002; // Voltage Lane 3

    // voltageConfigs
    config.voltageConfigs = {
      1: 500, // Lane 2
      2: 600, // Lane 3
    };

    // 3. Remove Lane 2 (index 1)
    component.removeLane(1);

    // 4. Verify results
    expect(component.lanes.length).toBe(3);
    expect(component.lanes[1].entity_id).toBe("l3"); // Lane 3 is now index 1

    const updatedConfig = component.arduinoConfigs[0];
    expect(updatedConfig.digitalIds[2]).toBe(1000); // Lane 1 unchanged
    expect(updatedConfig.digitalIds[3]).toBe(0); // Lane 2 (deleted) becomes UNUSED
    expect(updatedConfig.digitalIds[4]).toBe(0); // Lane 2 (deleted) becomes UNUSED

    expect(updatedConfig.digitalIds[5]).toBe(1001); // Lane 3 (index 2) shifted to index 1
    expect(updatedConfig.digitalIds[6]).toBe(4001); // Lane 3 (index 2) shifted to index 1

    expect(updatedConfig.digitalIds[7]).toBe(1002); // Lane 4 (index 3) shifted to index 2

    expect(updatedConfig.analogIds[0]).toBe(0); // Lane 2 (deleted) becomes UNUSED
    expect(updatedConfig.analogIds[1]).toBe(7001); // Lane 3 (index 2) shifted to index 1

    expect(updatedConfig.voltageConfigs?.[1]).toBe(600); // Old Lane 3 (2) value shifted to index 1
    expect(updatedConfig.voltageConfigs?.[0]).toBeUndefined(); // Old Lane 2 (1) removed
    expect(updatedConfig.voltageConfigs?.[2]).toBeUndefined(); // Shifted
  });

  it("should reorder lanes and update Arduino configs on drop", () => {
    // 1. Setup track with 2 lanes
    component.lanes = [
      new Lane("l1", "white", "black", 100),
      new Lane("l2", "white", "black", 100),
    ];

    // 2. Add Arduino config with lane-specific behaviors
    component.addArduinoConfig();
    const config = component.arduinoConfigs[0];
    config.digitalIds[2] = 1000; // Lap Lane 1 (index 0)
    config.digitalIds[3] = 1001; // Lap Lane 2 (index 1)

    // 3. Simulate drop: move Lane 1 (index 0) to index 1
    const event = {
      previousIndex: 0,
      currentIndex: 1,
      container: { data: component.lanes },
      item: { data: component.lanes[0] },
    } as any;

    spyOn(component, "captureState").and.callThrough();
    component.onLaneDropped(event);

    // 4. Verify results
    expect(component.lanes.length).toBe(2);
    expect(component.lanes[0].entity_id).toBe("l2");
    expect(component.lanes[1].entity_id).toBe("l1");

    // Pin assignments SHOULD follow the lanes
    const updatedConfig = component.arduinoConfigs[0];
    // Lane 1 was at index 0 (1000), moved to index 1.
    // Pin 2 was 1000, should now be 1001 (Lane 1 index 1).
    expect(updatedConfig.digitalIds[2]).toBe(1001);
    // Lane 2 was at index 1 (1001), moved to index 0.
    // Pin 3 was 1001, should now be 1000 (Lane 2 index 0).
    expect(updatedConfig.digitalIds[3]).toBe(1000);

    expect(component.captureState).toHaveBeenCalled();
  });

  it("should reorder lanes and update Phidget configs on drop", () => {
    component.lanes = [
      new Lane("l1", "white", "black", 100),
      new Lane("l2", "white", "black", 100),
    ];

    component.addPhidgetConfig();
    const config = component.phidgetConfigs[0];
    config.digitalInIds = [1000, 1001]; // Lap Lane 1 (index 0), Lap Lane 2 (index 1)

    const event = {
      previousIndex: 0,
      currentIndex: 1,
      container: { data: component.lanes },
      item: { data: component.lanes[0] },
    } as any;

    component.onLaneDropped(event);

    const updatedConfig = component.phidgetConfigs[0];
    expect(updatedConfig.digitalInIds[0]).toBe(1001);
    expect(updatedConfig.digitalInIds[1]).toBe(1000);
  });

  it("should update Phidget configs on lane deletion", () => {
    component.lanes = [
      new Lane("l1", "white", "black", 100),
      new Lane("l2", "white", "black", 100),
      new Lane("l3", "white", "black", 100),
    ];

    component.addPhidgetConfig();
    const config = component.phidgetConfigs[0];
    config.digitalInIds = [1000, 1001, 1002]; // Lap Lane 1, Lane 2, Lane 3
    config.voltageConfigs = { 1: 500, 2: 600 };

    component.removeLane(1); // Delete Lane 2 (index 1)

    const updatedConfig = component.phidgetConfigs[0];
    expect(updatedConfig.digitalInIds[0]).toBe(1000);
    expect(updatedConfig.digitalInIds[1]).toBe(0); // Deleted lane becomes UNUSED
    expect(updatedConfig.digitalInIds[2]).toBe(1001); // Lane 3 shifted to index 1
    expect(updatedConfig.voltageConfigs?.[1]).toBe(600); // Shifted
  });

  it("should re-initialize interfaces when onTrackmateConfigChange is called", () => {
    component.addTrackmateConfig();
    (dataService.initializeInterface as jasmine.Spy).calls.reset();

    component.onTrackmateConfigChange();

    expect(dataService.initializeInterface).toHaveBeenCalledWith(
      component.arduinoConfigs,
      component.trackmateConfigs,
      component.phidgetConfigs,
      component.lanes.length,
      component.bartConfigs,
    );
  });

  describe("Auto-save and Duplicate", () => {
    it("should auto-save on valid name change after debounce", fakeAsync(() => {
      component.trackName = "Valid New Name";
      component.onInputChange(); // Triggers debounce in UndoManager

      tick(600); // Wait for debounce (500ms) + small buffer
      flush(); // Ensure any internal observables/promises resolve
      fixture.detectChanges();

      expect(dataService.updateTrack).toHaveBeenCalled();
      expect(component.isDirtyState()).toBeFalse();
    }));

    it("should NOT auto-save if the name is a duplicate", fakeAsync(() => {
      // 'Speedway' already exists in MOCK_TRACK_INSTANCES (t2)
      component.trackName = "Speedway";
      component.onInputChange();

      tick(600);
      fixture.detectChanges();

      expect(dataService.updateTrack).not.toHaveBeenCalled();
      expect(component.isNameInvalid).toBeTrue();
    }));

    it("should remain dirty after an auto-save fails due to duplicate name (server error 409)", fakeAsync(() => {
      dataService.updateTrack.and.returnValue(
        throwError(() => ({ status: 409 })),
      );
      component.trackName = "Conflict Name";
      component.onInputChange();

      tick(600);
      flush();
      fixture.detectChanges();

      expect(dataService.updateTrack).toHaveBeenCalled();
      expect(component.isDirtyState()).toBeTrue();
      expect(mockLoggerService.error).toHaveBeenCalled();
    }));

    it("should preserve undo/redo history and rebase it after Duplicate", () => {
      // 1. Make some changes to build history
      component.trackName = "Initial Name";
      component.onInputChange();
      // Manually call commitState to simulate a commit immediately for testing
      component.undoManager.commitState();

      const firstStackCount = component.undoManager.undoStackCount;
      expect(firstStackCount).toBeGreaterThan(0);

      // 2. Perform Duplicate
      dataService.createTrack.and.returnValue(
        of({
          entity_id: "new-id-123",
          name: "Initial Name_1",
          lanes: component.lanes,
          arduino_configs: component.arduinoConfigs,
        }),
      );

      component.saveAsNew();

      // 3. Verify history preserved and rebased
      expect(component.undoManager.undoStackCount).toBe(firstStackCount);
      const lastUndoItem = component.undoManager.undoStackItems[
        component.undoManager.undoStackCount - 1
      ] as any;
      expect(lastUndoItem.entity_id).toBe("new-id-123");
      expect(lastUndoItem.name).toBe("Initial Name_1");
    });

    it("should highlight the name field in red when invalid", () => {
      component.isLoading = false; // Ensure validation is active
      component.trackName = ""; // Invalid: empty
      expect(component.isNameInvalid).toBeTrue();

      component.trackName = "Speedway"; // Invalid: duplicate
      expect(component.isNameInvalid).toBeTrue();

      component.trackName = "Unique Name";
      expect(component.isNameInvalid).toBeFalse();
    });

    it("should auto-save on lane length change after debounce", fakeAsync(() => {
      component.updateLaneLength(0, 150);

      tick(600); // Wait for debounce (500ms) + small buffer
      flush();
      fixture.detectChanges();

      expect(dataService.updateTrack).toHaveBeenCalled();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.lanes[0].length).toBe(150);
    }));

    it("should not be dirty when loaded without user edits", () => {
      expect(component.isDirtyState()).toBeFalse();
      expect(component.hasChanges()).toBeFalse();
    });

    it("should navigate back immediately when going back with no unsaved changes", () => {
      expect(component.isDirtyState()).toBeFalse();
      component.onBackClicked();

      expect(dataService.updateTrack).not.toHaveBeenCalled();
      expect(component.showDiscardConfirm).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(
        ["/track-manager"],
        jasmine.any(Object),
      );
    });
  });

  describe("Guided Help", () => {
    let helpService: HelpService;
    let settingsService: SettingsService;
    let mockSettingsServiceLocal: any;

    beforeEach(() => {
      helpService = TestBed.inject(HelpService);
      settingsService = TestBed.inject(SettingsService);
      mockSettingsServiceLocal = settingsService as any;
      mockSettingsServiceLocal.settings = new Settings();
    });

    it("should trigger help when startHelp is called manually including undo/redo toolbar steps", () => {
      component.startHelp();
      expect(helpService.startGuide).toHaveBeenCalled();
      const calledSteps = (
        helpService.startGuide as jasmine.Spy
      ).calls.mostRecent().args[0];
      const targetIds = calledSteps.map((s: any) => s.targetId).filter(Boolean);
      expect(targetIds).toContain("undo-btn");
      expect(targetIds).toContain("redo-btn");
    });

    it("should expand lanes, interfaces, and sub-editors sections if collapsed during help", () => {
      component.sectionsExpanded.lanes = false;
      component.sectionsExpanded.interfaces = false;
      component.lanes = [new Lane("l1", "white", "black", 100)];

      const mockArduino = jasmine.createSpyObj("ArduinoEditorComponent", [
        "ensureSectionsExpanded",
        "getHelpSteps",
      ]);
      mockArduino.getHelpSteps.and.returnValue([]);
      const mockBart = jasmine.createSpyObj("BartEditorComponent", [
        "ensureSectionsExpanded",
        "getHelpSteps",
      ]);
      mockBart.getHelpSteps.and.returnValue([]);
      const mockPhidget = jasmine.createSpyObj("PhidgetEditorComponent", [
        "ensureSectionsExpanded",
        "getHelpSteps",
      ]);
      mockPhidget.getHelpSteps.and.returnValue([]);
      const mockTrackmate = jasmine.createSpyObj("TrakmateEditorComponent", [
        "ensureSectionsExpanded",
        "getHelpSteps",
      ]);
      mockTrackmate.getHelpSteps.and.returnValue([]);

      component.arduinoConfigs = [
        {
          name: "A1",
          digitalIds: [],
          analogIds: [],
          ledStrings: [],
        } as any,
      ];
      component.bartConfigs = [
        {
          deviceName: "B1",
          lapPinBehaviors: [],
        } as any,
      ];
      component.phidgetConfigs = [
        {
          name: "P1",
          digitalInIds: [],
          digitalOutIds: [],
          analogIds: [],
        } as any,
      ];
      component.trackmateConfigs = [
        {
          name: "T1",
          lapPinBehaviors: [],
        } as any,
      ];

      component.arduinoEditors = { length: 1, first: mockArduino } as any;
      component.bartEditors = { length: 1, first: mockBart } as any;
      component.phidgetEditors = { length: 1, first: mockPhidget } as any;
      component.trakmateEditors = { length: 1, first: mockTrackmate } as any;

      component.startHelp();

      expect(component.sectionsExpanded.lanes).toBeTrue();
      expect(component.sectionsExpanded.interfaces).toBeTrue();
      expect(mockArduino.ensureSectionsExpanded).toHaveBeenCalled();
      expect(mockBart.ensureSectionsExpanded).toHaveBeenCalled();
      expect(mockPhidget.ensureSectionsExpanded).toHaveBeenCalled();
      expect(mockTrackmate.ensureSectionsExpanded).toHaveBeenCalled();
    });

    it("should only include guided help for the first instance of each configured interface type", () => {
      const mockArduino1 = jasmine.createSpyObj("ArduinoEditorComponent", [
        "getHelpSteps",
        "ensureSectionsExpanded",
      ]);
      mockArduino1.getHelpSteps.and.returnValue([
        { selector: "#arduino-editor-0", title: "A1 Help", content: "A1" },
      ]);
      const mockArduino2 = jasmine.createSpyObj("ArduinoEditorComponent", [
        "getHelpSteps",
        "ensureSectionsExpanded",
      ]);
      mockArduino2.getHelpSteps.and.returnValue([
        { selector: "#arduino-editor-1", title: "A2 Help", content: "A2" },
      ]);

      const mockBart1 = jasmine.createSpyObj("BartEditorComponent", [
        "getHelpSteps",
        "ensureSectionsExpanded",
      ]);
      mockBart1.getHelpSteps.and.returnValue([
        { selector: "#bart-editor-0", title: "B1 Help", content: "B1" },
      ]);

      const mockPhidget1 = jasmine.createSpyObj("PhidgetEditorComponent", [
        "getHelpSteps",
        "ensureSectionsExpanded",
      ]);
      mockPhidget1.getHelpSteps.and.returnValue([
        { selector: "#phidget-editor-0", title: "P1 Help", content: "P1" },
      ]);

      const mockTrackmate1 = jasmine.createSpyObj("TrakmateEditorComponent", [
        "getHelpSteps",
        "ensureSectionsExpanded",
      ]);
      mockTrackmate1.getHelpSteps.and.returnValue([
        { selector: "#trakmate-editor-0", title: "T1 Help", content: "T1" },
      ]);

      component.arduinoConfigs = [
        { name: "A1", digitalIds: [], analogIds: [], ledStrings: [] } as any,
        { name: "A2", digitalIds: [], analogIds: [], ledStrings: [] } as any,
      ];
      component.bartConfigs = [
        { deviceName: "B1", lapPinBehaviors: [] } as any,
        { deviceName: "B2", lapPinBehaviors: [] } as any,
      ];
      component.phidgetConfigs = [
        {
          name: "P1",
          digitalInIds: [],
          digitalOutIds: [],
          analogIds: [],
        } as any,
      ];
      component.trackmateConfigs = [
        { name: "T1", lapPinBehaviors: [] } as any,
        { name: "T2", lapPinBehaviors: [] } as any,
      ];

      component.arduinoEditors = { length: 2, first: mockArduino1 } as any;
      component.bartEditors = { length: 2, first: mockBart1 } as any;
      component.phidgetEditors = { length: 1, first: mockPhidget1 } as any;
      component.trakmateEditors = { length: 2, first: mockTrackmate1 } as any;

      const helpSteps = component.getHelpSteps();
      const titles = helpSteps.map((s) => s.title);
      expect(titles).toContain("A1 Help");
      expect(titles).not.toContain("A2 Help");
      expect(titles).toContain("B1 Help");
      expect(titles).toContain("P1 Help");
      expect(titles).toContain("T1 Help");
    });
  });

  describe("Interface List Ordering & Badges", () => {
    it("should render interfaces in alphabetical order with correct badges", fakeAsync(() => {
      component.sectionsExpanded.interfaces = true;
      fixture.detectChanges();
      tick();

      const interfaceHeaders = fixture.nativeElement.querySelectorAll(
        ".config-section .section-content .editor-section .section-header",
      );
      expect(interfaceHeaders.length).toBe(4);

      const names = Array.from(interfaceHeaders).map((header: any) =>
        header.querySelector("span")?.textContent?.trim(),
      );
      expect(names).toEqual(["Arduino", "BART (BLE)", "Phidget", "Trackmate"]);

      // Check badges
      const bartBadge = interfaceHeaders[1].querySelector(".interface-badge");
      expect(bartBadge).toBeTruthy();
      expect(bartBadge.textContent.trim()).toBe("ALPHA");
      expect(bartBadge.classList.contains("alpha-badge")).toBeTrue();

      const phidgetBadge =
        interfaceHeaders[2].querySelector(".interface-badge");
      expect(phidgetBadge).toBeTruthy();
      expect(phidgetBadge.textContent.trim()).toBe("ALPHA");
      expect(phidgetBadge.classList.contains("alpha-badge")).toBeTrue();

      const trakmateBadge =
        interfaceHeaders[3].querySelector(".interface-badge");
      expect(trakmateBadge).toBeNull();
    }));
  });

  describe("Lifecycle & Cleanup", () => {
    it("should call closeInterface on ngOnDestroy", () => {
      dataService.closeInterface.calls.reset();
      component.ngOnDestroy();
      expect(dataService.closeInterface).toHaveBeenCalled();
      expect((component as any).subscriptions.length).toBe(0);
    });
  });

  describe("Undo/Redo, Lane Reordering, Config Equality, and Discard Flow", () => {
    it("should undo and redo track state changes via undoManager", () => {
      const track1 = new Track({
        entity_id: "t1",
        name: "Original Track",
        lanes: [],
      });
      const track2 = new Track({
        entity_id: "t1",
        name: "Renamed Track",
        lanes: [],
      });
      component.editingTrack = track1;
      component.trackName = "Original Track";
      component.undoManager.initialize(track1);

      component.editingTrack = track2;
      component.trackName = "Renamed Track";
      (component.undoManager as any).commitChange();
      expect(component.undoManager.canUndo()).toBeTrue();

      component.undo();
      expect(component.trackName).toBe("Original Track");
      expect(component.undoManager.canRedo()).toBeTrue();

      component.redo();
      expect(component.trackName).toBe("Renamed Track");
    });

    it("should handle lane drop reordering and update Arduino pin configurations", () => {
      component.lanes = [
        new Lane("0", "#FF0000", "#FFFFFF", 50),
        new Lane("1", "#00FF00", "#FFFFFF", 50),
        new Lane("2", "#0000FF", "#FFFFFF", 50),
      ];
      component.arduinoConfigs = [
        {
          name: "Test Arduino",
          commPort: "/dev/ttyUSB0",
          baudRate: 115200,
          debounceUs: 100,
          hardwareType: 0,
          normallyClosedLaneSensors: false,
          normallyClosedRelays: false,
          globalInvertLights: 0,
          usePitsAsLaps: false,
          useLapsForSegments: false,
          lapPinPitBehavior: 0,
          digitalIds: [1000, 1001, 1002], // lap pins for lanes 0, 1, 2
          analogIds: [],
          ledStrings: [],
          voltageConfigs: { 0: 12, 1: 14, 2: 16 },
        },
      ];

      const dropEvent = {
        previousIndex: 0,
        currentIndex: 2,
      } as any;

      component.onLaneDropped(dropEvent);
      expect(component.lanes.length).toBe(3);
      expect(component.arduinoConfigs[0].digitalIds[0]).toBe(1002);
      expect(component.arduinoConfigs[0].voltageConfigs?.[2]).toBe(12);
    });

    it("should evaluate config equality for Arduino, Trackmate, and Phidget", () => {
      const ac1 = { name: "A1", digitalIds: [1, 2] } as any;
      const ac2 = { name: "A1", digitalIds: [1, 2] } as any;
      const ac3 = { name: "A2", digitalIds: [1, 2] } as any;
      expect(
        (component as any).areArduinoConfigsEqual([ac1], [ac2]),
      ).toBeTrue();
      expect(
        (component as any).areArduinoConfigsEqual([ac1], [ac3]),
      ).toBeFalse();

      const tc1 = { name: "T1", digitalIds: [1] } as any;
      const tc2 = { name: "T1", digitalIds: [1] } as any;
      expect(
        (component as any).areTrackmateConfigsEqual([tc1], [tc2]),
      ).toBeTrue();

      const pc1 = { name: "P1", serialNumber: 123 } as any;
      const pc2 = { name: "P1", serialNumber: 123 } as any;
      expect(
        (component as any).arePhidgetConfigsEqual([pc1], [pc2]),
      ).toBeTrue();
    });

    it("should handle discard confirmation modal resolution", fakeAsync(() => {
      let resolvedValue: boolean | undefined;
      component.confirmDiscard().then((val) => (resolvedValue = val));
      expect(component.showDiscardConfirm).toBeTrue();

      component.onConfirmDiscard();
      tick();
      expect(component.showDiscardConfirm).toBeFalse();
      expect(resolvedValue).toBeTrue();

      component.confirmDiscard().then((val) => (resolvedValue = val));
      component.onCancelDiscard();
      tick();
      expect(resolvedValue).toBeFalse();
    }));

    it("should generate help guide steps and expand required sections", () => {
      component.sectionsExpanded.lanes = false;
      component.sectionsExpanded.interfaces = false;
      component.updateHelpSteps();
      expect(component.helpSteps.length).toBeGreaterThan(5);

      (component as any).ensureSectionsExpandedForHelp();
      expect(component.sectionsExpanded.interfaces).toBeTrue();
    });

    it("should handle updateTrack with navigation back and config synchronization", fakeAsync(() => {
      const mockSavedTrack = {
        entity_id: "new_t1",
        name: "Saved Track",
        lanes: [
          { background_color: "#ff0000", line_color: "#000000", length: 50 },
        ],
        arduino_configs: [
          { name: "A1", digitalIds: [1], analogIds: [], ledStrings: [] },
        ],
        trackmate_configs: [{ name: "TM1", digitalIds: [2] }],
        phidget_configs: [{ name: "PH1", serialNumber: 999 }],
        bart_configs: [{ name: "B1", comPort: "COM1" }],
      };
      dataService.createTrack.and.returnValue(of(mockSavedTrack as any));
      dataService.getTracks.and.returnValue(of([mockSavedTrack as any]));
      spyOn(component, "onBack");

      component.navigateBackOnSave = true;
      component.editingTrack = {
        entity_id: "new",
        name: "New Track",
        lanes: [
          { background_color: "#ff0000", line_color: "#000000", length: 50 },
        ],
      } as any;

      component.updateTrack();
      tick();

      expect(component.onBack).toHaveBeenCalled();
      expect(component.arduinoConfigs.length).toBe(1);
      expect(component.trackmateConfigs.length).toBe(1);
      expect(component.phidgetConfigs.length).toBe(1);
      expect(component.bartConfigs.length).toBe(1);
    }));

    it("should toggle sections correctly", () => {
      component.sectionsExpanded["lanes"] = true;
      component.toggleSection("lanes");
      expect(component.sectionsExpanded["lanes"]).toBeFalse();
    });

    it("should add and remove hardware configurations and lanes", () => {
      component.lanes = [];
      component.arduinoConfigs = [];
      component.trackmateConfigs = [];
      component.bartConfigs = [];
      component.phidgetConfigs = [];

      component.addLane();
      expect(component.lanes.length).toBe(1);

      component.addArduinoConfig();
      expect(component.arduinoConfigs.length).toBe(1);
      component.removeArduinoConfig(0);
      expect(component.arduinoConfigs.length).toBe(0);

      component.addTrackmateConfig();
      expect(component.trackmateConfigs.length).toBe(1);
      component.removeTrackmateConfig(0);
      expect(component.trackmateConfigs.length).toBe(0);

      component.addBartConfig();
      expect(component.bartConfigs.length).toBe(1);
      component.removeBartConfig(0);
      expect(component.bartConfigs.length).toBe(0);

      component.addPhidgetConfig();
      expect(component.phidgetConfigs.length).toBe(1);
      component.removePhidgetConfig(0);
      expect(component.phidgetConfigs.length).toBe(0);
    });
  });
});
