import { DragDropModule } from "@angular/cdk/drag-drop";
import { Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
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
import { AnalyticsService } from "src/app/analytics.service";
import { DataService } from "src/app/data.service";
import { Lane } from "src/app/models/lane";
import { Settings } from "src/app/models/settings";
import { Track } from "src/app/models/track";
import { TranslatePipe } from "src/app/pipes/translate.pipe";
import { HelpService } from "src/app/services/help.service";
import { SettingsService } from "src/app/services/settings.service";
import { TranslationService } from "src/app/services/translation.service";
import {
  MOCK_TRACK_INSTANCES,
  MOCK_TRACKS as _MOCK_TRACKS,
} from "src/app/testing/data/tracks_data";
import {
  mockAnalyticsService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "src/app/testing/unit-test-mocks";

import { createTrackManagerDataServiceMock } from "../track-manager/testing/track-manager_helper";

@Component({
  selector: "app-back-button",
  template: "",
  imports: [FormsModule, DragDropModule],
})
class MockBackButtonComponent {
  @Input() targetUrl?: string;
  @Input() route?: string;
  @Input() confirm?: boolean;
  @Input() queryParams?: any;
  @Input() confirmTitle?: string;
  @Input() confirmMessage?: string;
}

@Component({
  selector: "app-undo-redo-controls",
  template: "",
  imports: [FormsModule, DragDropModule],
})
class MockUndoRedoControlsComponent {
  @Input() manager: any;
}

import { EventEmitter, Output } from "@angular/core";

@Component({
  selector: "app-editor-title",
  template: "",
  imports: [FormsModule, DragDropModule],
})
class MockEditorTitleComponent {
  @Input() titleKey: string = "";
  @Input() backRoute: string = "";
  @Input() backConfirm: boolean = false;
  @Input() backQueryParams: any = {};
  @Input() backConfirmTitle: string = "";
  @Input() backConfirmMessage: string = "";
  @Input() undoManager: any;
  @Input() showUndo: boolean = true;
  @Input() showRedo: boolean = true;
  @Input() showHelp: boolean = true;
  @Input() showCopy: boolean = false;
  @Input() showAdd: boolean = false;
  @Input() showDelete: boolean = false;
  @Input() isSaving: boolean = false;
  @Input() helpSteps: any[] = [];
  @Input() helpTitle: string = "";
  @Input() helpRecordName?: string;
  @Output() help = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}

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
        MockBackButtonComponent,
        MockUndoRedoControlsComponent,
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
    component.allTracks = JSON.parse(JSON.stringify(MOCK_TRACK_INSTANCES)).map(
      (t: any) => {
        Object.setPrototypeOf(t, Track.prototype);
        return t;
      },
    );
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

  it("should save as new track", () => {
    component.saveAsNew();

    expect(dataService.createTrack).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/track-editor"], {
      queryParams: { id: "t-new-id" },
    });
  });

  it("should navigate back to manager with selectedId", () => {
    component.onBack();
    expect(router.navigate).toHaveBeenCalledWith(["/track-manager"], {
      queryParams: { selectedId: "t1" },
    });
  });

  it("should stay on page and keep original ID when save as new fails", () => {
    spyOn(console, "error");
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
  });

  it("should handle save error", () => {
    spyOn(console, "error");
    spyOn(window, "alert");
    dataService.updateTrack.and.returnValue(
      throwError(() => ({ status: 500 })),
    );

    component.updateTrack();

    expect(window.alert).toHaveBeenCalledWith("TE_ERROR_SAVE_FAILED");
    expect(component.isSaving).toBeFalse();
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
      spyOn(console, "error");
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

    it("should trigger help when startHelp is called manually", () => {
      component.startHelp();
      expect(helpService.startGuide).toHaveBeenCalled();
    });

    it("should expand lanes section if collapsed during help", fakeAsync(() => {
      component.sectionsExpanded.lanes = false;
      component.lanes = [new Lane("l1", "white", "black", 100)];

      component.startHelp();
      tick();
      fixture.detectChanges();

      expect(component.sectionsExpanded.lanes).toBeTrue();
    }));
  });
});
