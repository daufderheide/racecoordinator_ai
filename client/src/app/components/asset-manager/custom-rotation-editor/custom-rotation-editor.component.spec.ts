import { NO_ERRORS_SCHEMA } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { MOCK_TRACK_INSTANCES } from "@app/testing/data/tracks_data";
import {
  mockDataService,
  mockLoggerService,
  mockRouter,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { CustomRotationEditorComponent } from "./custom-rotation-editor.component";

describe("CustomRotationEditorComponent", () => {
  let component: CustomRotationEditorComponent;
  let fixture: ComponentFixture<CustomRotationEditorComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [FormsModule, CustomRotationEditorComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: {
              paramMap: { get: () => null },
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomRotationEditorComponent);
    component = fixture.componentInstance;

    // Set up default behavior for getTracks
    mockDataService.getTracks.and.returnValue(of(MOCK_TRACK_INSTANCES));
    mockDataService.saveCustomRotation = jasmine
      .createSpy("saveCustomRotation")
      .and.returnValue(of({}));
  });

  afterEach(() => {
    resetMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use AM_ROTATION_EDITOR titleKey and bind itemName to internalAssetName", () => {
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css("app-editor-title"));
    expect(titleEl).toBeTruthy();
    expect(titleEl.componentInstance.titleKey()).toBe("AM_ROTATION_EDITOR");
    expect(titleEl.componentInstance.itemName()).toBe("New Custom Rotation 1");
    expect(titleEl.componentInstance.showZoom()).toBeTrue();

    const headerEl = titleEl.nativeElement.querySelector(".header");
    expect(headerEl.classList.contains("has-zoom")).toBeTrue();

    component.internalAssetName = "Sprint Cup";
    fixture.detectChanges();
    expect(titleEl.componentInstance.itemName()).toBe("Sprint Cup");
  });

  it("should initialize with no rotations if none provided", () => {
    fixture.detectChanges();
    expect(component.internalRotations.length).toBe(0);
  });

  it("should display empty state with translation key when no rotations exist", () => {
    fixture.detectChanges();
    expect(component.internalRotations.length).toBe(0);

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyStateText = compiled.querySelector(".empty-state-text");
    expect(emptyStateText).toBeTruthy();
    expect(emptyStateText?.textContent).toContain("AM_HELP_EMPTY_ROTATIONS");
  });

  it("should load tracks and select the first one by default", fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(mockDataService.getTracks).toHaveBeenCalled();
    expect(component.tracks.length).toBe(MOCK_TRACK_INSTANCES.length);
    expect(component.selectedTrackId).toBe(MOCK_TRACK_INSTANCES[0].entity_id);
  }));

  it("should update internalNumLanes when track changes", fakeAsync(() => {
    fixture.detectChanges();
    tick();

    // Add a rotation so it exists
    component.addRotation();

    // Change track to t2 (which has 4 lanes, t1 has 2)
    component.selectedTrackId = "t2";
    component.onTrackChange();

    expect(component.internalNumLanes).toBe(4);
    expect(component.internalRotations[0].heats![0].driverIndices?.length).toBe(
      4,
    );
  }));

  it("should add and remove rotations", () => {
    fixture.detectChanges();
    expect(component.internalRotations.length).toBe(0);

    component.addRotation();
    expect(component.internalRotations.length).toBe(1);

    component.removeRotation(0);
    expect(component.internalRotations.length).toBe(0);
  });

  it("should add and remove heats", () => {
    fixture.detectChanges();
    component.addRotation();
    const rotation = component.internalRotations[0];
    expect(rotation.heats?.length).toBe(1);

    component.addHeat(rotation);
    expect(rotation.heats?.length).toBe(2);

    component.removeHeat(rotation, 0);
    expect(rotation.heats?.length).toBe(1);
  });

  it("should call saveCustomRotation and emit saved output on save", fakeAsync(() => {
    fixture.detectChanges();
    component.internalAssetName = "Test Rotation";
    component.addRotation(); // Ensure at least 1 rotation exists
    mockDataService.saveCustomRotation.calls.reset(); // Reset calls from autoSave inside addRotation

    const savedSpy = spyOn(component.saved, "emit");
    component.save();

    expect(mockDataService.saveCustomRotation).toHaveBeenCalledWith(
      "Test Rotation",
      component.internalNumLanes,
      component.internalRotations,
      undefined,
    );
    tick();
    expect(savedSpy).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  }));

  it("should emit cancelled output on cancel", () => {
    const cancelledSpy = spyOn(component.cancelled, "emit");
    component.cancel();
    expect(cancelledSpy).toHaveBeenCalled();
  });

  describe("Routing and Navigation", () => {
    it("should navigate back to asset-manager on cancel", () => {
      fixture.detectChanges();
      mockRouter.navigate.calls.reset();
      component.cancel();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/asset-manager"], {
        queryParams: {
          from: null,
          returnUrl: null,
        },
      });
    });

    it("should navigate back to asset-manager on successful save", fakeAsync(() => {
      fixture.detectChanges();
      component.internalAssetName = "Test Rotation";
      component.addRotation(); // Ensure at least 1 rotation exists
      mockDataService.saveCustomRotation.calls.reset(); // Reset calls from autoSave inside addRotation
      mockRouter.navigate.calls.reset();
      component.save();
      tick();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/asset-manager"], {
        queryParams: {
          from: null,
          returnUrl: null,
        },
      });
    }));

    it("should load asset data when id query param is provided", fakeAsync(() => {
      const mockAsset = {
        name: "Route Loaded Asset",
        numLanes: 4,
        customRotations: [
          {
            numDrivers: 4,
            heats: [{ driverIndices: [1, 2, 3, 4] }],
          },
        ],
        model: { entityId: "route-id-123" },
      };

      const activatedRoute = TestBed.inject(ActivatedRoute);
      spyOn(activatedRoute.snapshot.queryParamMap, "get").and.callFake(
        (key: string) => {
          if (key === "id") return "route-id-123";
          return null;
        },
      );

      mockDataService.listAssets.and.returnValue(of([mockAsset as any]));

      component.ngOnInit();
      tick();

      expect(component.internalAssetId).toBe("route-id-123");
      expect(component.internalAssetName).toBe("Route Loaded Asset");
      expect(component.internalNumLanes).toBe(4);
      expect(component.internalRotations.length).toBe(1);
      expect(component.internalRotations[0].numDrivers).toBe(4);
    }));
  });

  describe("Validation", () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.addRotation();
    });

    it("should identify heat with duplicate drivers as error", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [
        { driverIndices: [1, 2, 1, 3] }, // Driver 1 is in lane 1 and 3
      ];

      expect(component.heatHasError(rotation, 0)).toBeTrue();
      expect(component.hasValidationErrors()).toBeTrue();
    });

    it("should identify heat with unique drivers as valid", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [{ driverIndices: [1, 2, 3, 4] }];

      expect(component.heatHasError(rotation, 0)).toBeFalse();
      expect(component.hasValidationErrors()).toBeFalse();
    });

    it("should ignore 0 (sit-out) for duplicate checks", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [
        { driverIndices: [0, 0, 1, 2] }, // Multiple sit-outs are fine
      ];

      expect(component.heatHasError(rotation, 0)).toBeFalse();
      expect(component.hasValidationErrors()).toBeFalse();
    });

    it("should prevent save if validation errors exist", fakeAsync(() => {
      fixture.detectChanges();
      component.internalAssetName = "Test Rotation";
      const rotation = component.internalRotations[0];
      rotation.heats = [
        { driverIndices: [1, 1, 2, 3] }, // Error
      ];
      mockDataService.saveCustomRotation.calls.reset(); // Reset calls from autoSave in addRotation

      component.save();
      expect(mockDataService.saveCustomRotation).not.toHaveBeenCalled();
    }));

    it("should identify driver assigned to multiple groups as a group conflict", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [
        { driverIndices: [1, 2, 3, 4], group: 0 },
        { driverIndices: [1, 5, 6, 7], group: 1 }, // Driver 1 is in group 0 and group 1
      ];

      expect(component.getDriverGroupConflicts(rotation).has(1)).toBeTrue();
      expect(component.driverHasGroupConflict(rotation, 1)).toBeTrue();
      expect(component.heatHasGroupConflict(rotation, 0)).toBeTrue();
      expect(component.heatHasGroupConflict(rotation, 1)).toBeTrue();
      expect(component.hasValidationErrors()).toBeTrue();
    });

    it("should identify driver in only one group as valid", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [
        { driverIndices: [1, 2, 3, 4], group: 0 },
        { driverIndices: [1, 2, 3, 4], group: 0 }, // Driver 1 is in group 0 only
      ];

      expect(component.getDriverGroupConflicts(rotation).has(1)).toBeFalse();
      expect(component.driverHasGroupConflict(rotation, 1)).toBeFalse();
      expect(component.heatHasGroupConflict(rotation, 0)).toBeFalse();
      expect(component.hasValidationErrors()).toBeFalse();
    });

    it("should identify error in any rotation if multiple exist", () => {
      fixture.detectChanges();
      component.addRotation(); // Now has 2 rotations

      // Valid rotation 1
      component.internalRotations[0].heats = [{ driverIndices: [1, 2, 3, 4] }];
      // Invalid rotation 2
      component.internalRotations[1].heats = [{ driverIndices: [1, 1, 2, 3] }];

      expect(component.hasValidationErrors()).toBeTrue();
    });
  });

  describe("Lane Equality Diagnostics", () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.addRotation();
    });

    it("should identify a perfectly equal rotation as equal", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.numDrivers = 2;
      component.internalNumLanes = 2;
      rotation.heats = [{ driverIndices: [1, 2] }, { driverIndices: [2, 1] }];

      expect(component.isRotationEqual(rotation)).toBeTrue();

      component.showEqualityReport(rotation, 0);
      expect(component.equalityReport).toEqual([
        { key: "AM_REPORT_ALL_EQUAL" },
      ]);
    });

    it("should identify inequality when a driver is missing a lane", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.numDrivers = 2;
      component.internalNumLanes = 2;
      rotation.heats = [
        { driverIndices: [1, 2] },
        { driverIndices: [1, 2] }, // Driver 1 is in lane 1 twice, Driver 2 is in lane 2 twice
      ];

      expect(component.isRotationEqual(rotation)).toBeFalse();

      component.showEqualityReport(rotation, 0);
      // Pairwise comparisons:
      // Lane 1: D1 has 2, D2 has 0 -> Report
      // Lane 2: D1 has 0, D2 has 2 -> Report
      expect(component.equalityReport?.length).toBeGreaterThan(0);
      const lane1Diff = component.equalityReport?.find(
        (r) => r.params?.lane === 1,
      );
      expect(lane1Diff.key).toBe("AM_REPORT_LANE_DIFF");
      expect(lane1Diff.params.d1).toBe("1");
      expect(lane1Diff.params.count1).toBe(2);
      expect(lane1Diff.params.d2).toBe("2");
      expect(lane1Diff.params.count2).toBe(0);
    });

    it("should handle empty rotations", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [];

      expect(component.isRotationEqual(rotation)).toBeFalse();

      component.showEqualityReport(rotation, 0);
      expect(component.equalityReport).toEqual([
        { key: "AM_REPORT_NO_DRIVERS" },
      ]);
    });

    it("should allow individual sit-out (empty) lanes without reporting invalid driver", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.numDrivers = 2;
      component.internalNumLanes = 3;
      rotation.heats = [
        { driverIndices: [1, 2, 0] }, // Lane 3 is an empty lane (0)
        { driverIndices: [2, 1, 0] }, // Lane 3 is an empty lane (0)
      ];

      component.showEqualityReport(rotation, 0);

      expect(component.isRotationEqual(rotation)).toBeTrue();
      expect(component.equalityReport).toEqual([
        { key: "AM_REPORT_ALL_EQUAL" },
      ]);
    });

    it("should report completely empty heats as AM_REPORT_EMPTY_HEAT", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.numDrivers = 2;
      component.internalNumLanes = 2;
      rotation.heats = [
        { driverIndices: [0, 0] }, // Heat 1 is completely empty
        { driverIndices: [1, 2] },
      ];

      component.showEqualityReport(rotation, 0);
      const emptyReport = component.equalityReport?.find(
        (r) => r.key === "AM_REPORT_EMPTY_HEAT",
      );
      expect(emptyReport).toBeDefined();
      expect(emptyReport.params.heat).toBe(1);
    });

    it("should identify invalid driver indices in report", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.numDrivers = 2;
      component.internalNumLanes = 2;
      rotation.heats = [
        { driverIndices: [1, 3] }, // Driver 3 is invalid (max is 2)
      ];

      component.showEqualityReport(rotation, 0);
      const invalidReport = component.equalityReport?.find(
        (r) => r.key === "AM_REPORT_INVALID_DRIVER",
      );
      expect(invalidReport).toBeDefined();
      expect(invalidReport.params.driver).toBe("3");
      expect(invalidReport.params.heat).toBe(1);
    });

    it("should handle singular/plural heat labels in report params", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.numDrivers = 2;
      component.internalNumLanes = 2;
      rotation.heats = [
        { driverIndices: [1, 2] },
        { driverIndices: [1, 0] }, // Lane 1: D1 has 2, D2 has 0. Lane 2: D1 has 0, D2 has 1.
      ];

      component.showEqualityReport(rotation, 0);

      // Check lane 2 where count is 1
      const lane2Diff = component.equalityReport?.find(
        (r) => r.params?.lane === 2 && r.params?.d2 === "2",
      );
      expect(lane2Diff.params.count2).toBe(1);
      expect(lane2Diff.params.heat2).toBe("AM_LABEL_HEAT_SINGULAR");

      // Check lane 1 where count is 2
      const lane1Diff = component.equalityReport?.find(
        (r) => r.params?.lane === 1,
      );
      expect(lane1Diff.params.count1).toBe(2);
      expect(lane1Diff.params.heat1).toBe("AM_LABEL_HEAT_PLURAL");
    });

    it("should dynamically re-evaluate lane equality when heats are mutated via signature caching", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.numDrivers = 2;
      component.internalNumLanes = 2;
      rotation.heats = [{ driverIndices: [1, 2] }, { driverIndices: [2, 1] }];

      // Initial check (cache it as equal)
      expect(component.isRotationEqual(rotation)).toBeTrue();

      // Mutate the heats directly in-place (causing inequality)
      rotation.heats = [{ driverIndices: [1, 2] }, { driverIndices: [1, 2] }];

      // It should detect the change via signature-based cache miss and return false
      expect(component.isRotationEqual(rotation)).toBeFalse();
    });

    it("should recalculate cache when track lane count changes", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.numDrivers = 2;
      component.internalNumLanes = 2;
      rotation.heats = [{ driverIndices: [1, 2] }, { driverIndices: [2, 1] }];

      // Initial equal check
      expect(component.isRotationEqual(rotation)).toBeTrue();

      // Spy on checkRotationLaneEqualityDirect to see if cache is bypassed
      spyOn(
        component as any,
        "checkRotationLaneEqualityDirect",
      ).and.callThrough();

      // Mutate track lanes
      component.internalNumLanes = 3;

      // Cache signature includes internalNumLanes, so it should re-evaluate and call checkRotationLaneEqualityDirect
      component.isRotationEqual(rotation);
      expect(
        (component as any).checkRotationLaneEqualityDirect,
      ).toHaveBeenCalled();
    });

    it("should call validateAllRotationsLaneEquality on track selection / loading tracks", fakeAsync(() => {
      spyOn(component, "validateAllRotationsLaneEquality").and.callThrough();
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      expect(component.validateAllRotationsLaneEquality).toHaveBeenCalled();
    }));

    it("should call validateAllRotationsLaneEquality on autoSave / undo-redo events", () => {
      fixture.detectChanges();
      spyOn(component, "validateAllRotationsLaneEquality").and.callThrough();
      component.autoSave("push");
      expect(component.validateAllRotationsLaneEquality).toHaveBeenCalled();
    });

    it("should call validateAllRotationsLaneEquality when saving the asset configuration", fakeAsync(() => {
      fixture.detectChanges();
      component.internalAssetName = "Test Rotation Asset";
      spyOn(component, "validateAllRotationsLaneEquality").and.callThrough();
      component.save();
      tick();
      expect(component.validateAllRotationsLaneEquality).toHaveBeenCalled();
    }));
  });

  describe("Import Rotation", () => {
    const validJson = JSON.stringify({
      Version: "1.0",
      NumDrivers: 5,
      NumLanes: 4,
      Heats: [
        { Drivers: [1, 2, 3, 4] },
        { Drivers: [2, 3, 4, 5] },
        { Drivers: [3, 4, 5, 1] },
        { Drivers: [4, 5, 1, 2] },
        { Drivers: [5, 1, 2, 3] },
      ],
    });

    const lenientJson = `{
      Version: "1.0",
      NumDrivers: 6,
      'NumLanes': 4,
      Heats: [
        { 'Drivers': [1, 2, 3, 4] }
      ]
    }`;

    const createMockFile = (content: string, name: string) => {
      const file = new File([content], name, { type: "application/json" });
      return file;
    };

    const createImportEvent = (files: File[]) => {
      return {
        target: {
          files: files,
          value: "",
        },
      } as any as Event;
    };

    it("should successfully import a valid JSON rotation", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      component.internalRotations = [];

      const file = createMockFile(validJson, "rotation5.json");
      const event = createImportEvent([file]);

      await component.onImportFiles(event);

      expect(component.internalRotations.length).toBe(1);
      expect(component.internalRotations[0].numDrivers).toBe(5);
      expect(component.internalRotations[0].heats?.length).toBe(5);
      expect(component.importSummary?.[0].success).toBeTrue();
      expect(component.importSummary?.[0].key).toBe("AM_IMPORT_SUCCESS");
    });

    it("should handle lenient JSON with single quotes and unquoted keys", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      component.internalRotations = [];

      const file = createMockFile(lenientJson, "lenient.json");
      const event = createImportEvent([file]);

      await component.onImportFiles(event);

      expect(component.internalRotations.length).toBe(1);
      expect(component.internalRotations[0].numDrivers).toBe(6);
      expect(component.importSummary?.[0].success).toBeTrue();
    });

    it("should assume RC1 import and convert 0-indexed drivers/groups if there is no version field", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      const rc1Json = JSON.stringify({
        NumDrivers: 4,
        NumLanes: 4,
        Heats: [{ Drivers: [3, 0, 1, 2], Group: 1 }], // 0-based drivers and groups
      });

      const file = createMockFile(rc1Json, "rc1.json");
      const event = createImportEvent([file]);

      // Remove default rotation to avoid duplicate error
      component.internalRotations = [];

      await component.onImportFiles(event);

      expect(component.internalRotations[0].heats?.[0].driverIndices).toEqual([
        4, 1, 2, 3,
      ]);
      expect(component.internalRotations[0].heats?.[0].group).toBe(1);
    });

    it("should assume standard import and NOT convert 0-indexed drivers if there is a version field", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      const standardWithVersionJson = JSON.stringify({
        Version: "1.0",
        NumDrivers: 4,
        NumLanes: 4,
        Heats: [{ Drivers: [3, 0, 1, 2], Group: 1 }],
      });

      const file = createMockFile(
        standardWithVersionJson,
        "standard_versioned.json",
      );
      const event = createImportEvent([file]);

      component.internalRotations = [];

      await component.onImportFiles(event);

      // Drivers should remain 0-indexed values unmodified (3 becomes 3, 0 becomes 0, etc.)
      expect(component.internalRotations[0].heats?.[0].driverIndices).toEqual([
        3, 0, 1, 2,
      ]);
      // Group should be converted 1 -> 0 (standard 1-based to internal 0-based)
      expect(component.internalRotations[0].heats?.[0].group).toBe(0);
    });

    it("should correctly import the user's exact RC1 rotation file with 0-based drivers and groups", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;

      const rc1Json = JSON.stringify({
        NumDrivers: 32,
        NumLanes: 4,
        Heats: [
          { Group: 0, Drivers: [3, 0, 1, 2] },
          { Group: 7, Drivers: [28, 30, 31, 29] },
        ],
      });

      const file = createMockFile(rc1Json, "user_rc1.json");
      const event = createImportEvent([file]);

      // Remove default rotation to avoid duplicate error
      component.internalRotations = [];

      await component.onImportFiles(event);

      expect(component.internalRotations.length).toBe(1);
      const rot = component.internalRotations[0];
      expect(rot.numDrivers).toBe(32);
      expect(rot.heats?.length).toBe(2);

      // First heat: Drivers [3, 0, 1, 2] should map to [4, 1, 2, 3], Group 0 should map to 0
      expect(rot.heats?.[0].driverIndices).toEqual([4, 1, 2, 3]);
      expect(rot.heats?.[0].group).toBe(0);

      // Last heat: Drivers [28, 30, 31, 29] should map to [29, 31, 32, 30], Group 7 should map to 7
      expect(rot.heats?.[1].driverIndices).toEqual([29, 31, 32, 30]);
      expect(rot.heats?.[1].group).toBe(7);
    });

    it("should import 1-based drivers and groups correctly for standard import", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      const standardJson = JSON.stringify({
        Version: "1.0",
        NumDrivers: 4,
        NumLanes: 4,
        Heats: [{ Drivers: [4, 1, 2, 3], Group: 2 }], // 1-based drivers and groups
      });

      const file = createMockFile(standardJson, "standard.json");
      const event = createImportEvent([file]);

      // Remove default rotation to avoid duplicate error
      component.internalRotations = [];

      await component.onImportFiles(event);

      expect(component.internalRotations[0].heats?.[0].driverIndices).toEqual([
        4, 1, 2, 3,
      ]);
      expect(component.internalRotations[0].heats?.[0].group).toBe(1); // 2 - 1 = 1 internal 0-based group
    });

    it("should report error for invalid JSON", async () => {
      fixture.detectChanges();
      const file = createMockFile("invalid{json", "bad.json");
      const event = createImportEvent([file]);

      await component.onImportFiles(event);

      expect(component.importSummary?.[0].success).toBeFalse();
      expect(component.importSummary?.[0].key).toBe(
        "AM_IMPORT_ERR_INVALID_JSON",
      );
    });

    it("should report error for missing required fields", async () => {
      fixture.detectChanges();
      const missingFieldsJson = JSON.stringify({
        Version: "1.0",
        NumDrivers: 4,
        // Missing NumLanes and Heats
      });
      const file = createMockFile(missingFieldsJson, "missing.json");
      const event = createImportEvent([file]);

      await component.onImportFiles(event);

      expect(component.importSummary?.[0].success).toBeFalse();
      expect(component.importSummary?.[0].key).toBe(
        "AM_IMPORT_ERR_MISSING_FIELDS",
      );
    });

    it("should report error if lane count mismatch", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      const wrongLanesJson = JSON.stringify({
        Version: "1.0",
        NumDrivers: 4,
        NumLanes: 6, // Mismatch
        Heats: [],
      });
      const file = createMockFile(wrongLanesJson, "wrong_lanes.json");
      const event = createImportEvent([file]);

      await component.onImportFiles(event);

      expect(component.importSummary?.[0].success).toBeFalse();
      expect(component.importSummary?.[0].key).toBe("AM_IMPORT_ERR_LANES");
      expect(component.importSummary?.[0].params.expected).toBe(4);
      expect(component.importSummary?.[0].params.found).toBe(6);
    });

    it("should report error if driver count already exists", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      component.internalRotations = [{ numDrivers: 4, heats: [] }];
      const duplicateDriversJson = JSON.stringify({
        Version: "1.0",
        NumDrivers: 4, // Duplicate
        NumLanes: 4,
        Heats: [],
      });
      const file = createMockFile(duplicateDriversJson, "dupe.json");
      const event = createImportEvent([file]);

      await component.onImportFiles(event);

      expect(component.importSummary?.[0].success).toBeFalse();
      expect(component.importSummary?.[0].key).toBe("AM_IMPORT_ERR_DUPLICATE");
    });

    it("should process multiple files and show summary for all", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      component.internalRotations = [];

      const file1 = createMockFile(validJson, "file1.json");
      const file2 = createMockFile("invalid", "file2.json");
      const event = createImportEvent([file1, file2]);

      await component.onImportFiles(event);

      expect(component.importSummary?.length).toBe(2);
      expect(component.importSummary?.[0].success).toBeTrue();
      expect(component.importSummary?.[1].success).toBeFalse();
    });

    it("should clear import summary when closeImportSummary is called", () => {
      component.importSummary = [{ success: true, key: "test" }];
      component.closeImportSummary();
      expect(component.importSummary).toBeNull();
    });

    it("should successfully import combined asset JSON file", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      component.internalRotations = [];
      const combinedAssetJson = JSON.stringify({
        Version: "1.0",
        IsAsset: true,
        AssetName: "ImportCombined",
        NumLanes: 4,
        Rotations: [
          { NumDrivers: 4, Heats: [{ Drivers: [1, 2, 3, 4], Group: 2 }] },
          { NumDrivers: 5, Heats: [{ Drivers: [1, 2, 3, 4, 0], Group: 1 }] },
        ],
      });
      const file = createMockFile(combinedAssetJson, "combined.json");
      const event = createImportEvent([file]);

      await component.onImportFiles(event);

      expect(component.importSummary?.[0].success).toBeTrue();
      expect(component.internalRotations.length).toBe(2);
      expect(component.internalRotations[0].numDrivers).toBe(4);
      expect(component.internalRotations[0].heats?.[0].group).toBe(1);
      expect(component.internalRotations[1].numDrivers).toBe(5);
    });

    it("should report error if combined asset JSON has lane count mismatch", async () => {
      fixture.detectChanges();
      component.internalNumLanes = 4;
      const wrongLanesCombinedJson = JSON.stringify({
        Version: "1.0",
        IsAsset: true,
        AssetName: "WrongLanesCombined",
        NumLanes: 6,
        Rotations: [],
      });
      const file = createMockFile(wrongLanesCombinedJson, "wrong_lanes.json");
      const event = createImportEvent([file]);

      await component.onImportFiles(event);

      expect(component.importSummary?.[0].success).toBeFalse();
      expect(component.importSummary?.[0].key).toBe("AM_IMPORT_ERR_LANES");
    });
  });

  describe("Export Rotations", () => {
    let originalShowSaveFilePicker: any;
    let mockWritable: any;
    let mockHandle: any;

    beforeEach(() => {
      originalShowSaveFilePicker = (window as any).showSaveFilePicker;
      mockWritable = {
        write: jasmine.createSpy("write").and.returnValue(Promise.resolve()),
        close: jasmine.createSpy("close").and.returnValue(Promise.resolve()),
      };
      mockHandle = {
        createWritable: jasmine
          .createSpy("createWritable")
          .and.returnValue(Promise.resolve(mockWritable)),
      };
      (window as any).showSaveFilePicker = jasmine
        .createSpy("showSaveFilePicker")
        .and.returnValue(Promise.resolve(mockHandle));
    });

    afterEach(() => {
      (window as any).showSaveFilePicker = originalShowSaveFilePicker;
    });

    it("should trigger download for combined asset JSON file when exportRotations is called", async () => {
      fixture.detectChanges();
      component.internalAssetName = "TestRotation";
      component.internalNumLanes = 4;
      component.internalRotations = [
        { numDrivers: 4, heats: [{ driverIndices: [1, 2, 3, 4] }] },
        { numDrivers: 5, heats: [{ driverIndices: [1, 2, 3, 4] }] },
      ];

      await component.exportRotations();

      expect((window as any).showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: "TestRotation_L4_Asset.json",
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      expect(mockWritable.write).toHaveBeenCalled();
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it("should trigger download for individual rotation JSON file when exportSingleRotation is called", async () => {
      fixture.detectChanges();
      component.internalAssetName = "TestRotation";
      component.internalNumLanes = 4;
      const rot = { numDrivers: 4, heats: [{ driverIndices: [1, 2, 3, 4] }] };

      await component.exportSingleRotation(rot);

      expect((window as any).showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: "TestRotation_L4_D4.json",
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      expect(mockWritable.write).toHaveBeenCalled();
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it("should format combined exported JSON with correct property names, Version, and 1-based group indices", async () => {
      fixture.detectChanges();
      component.internalAssetName = "FormatTest";
      component.internalNumLanes = 2;
      component.internalRotations = [
        { numDrivers: 2, heats: [{ driverIndices: [1, 2], group: 1 }] },
      ];

      const stringifySpy = spyOn(JSON, "stringify").and.callThrough();

      await component.exportRotations();

      expect(mockWritable.write).toHaveBeenCalled();
      const writtenJson = JSON.parse(
        mockWritable.write.calls.mostRecent().args[0],
      );
      expect(writtenJson.Version).toBe("1.0");
      expect(writtenJson.IsAsset).toBeTrue();
      expect(writtenJson.AssetName).toBe("FormatTest");
      expect(writtenJson.NumLanes).toBe(2);
      expect(writtenJson.Rotations[0].NumDrivers).toBe(2);
      expect(writtenJson.Rotations[0].Heats[0].Drivers).toEqual([1, 2]);
      expect(writtenJson.Rotations[0].Heats[0].Group).toBe(2);

      expect(stringifySpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          Version: "1.0",
          IsAsset: true,
          AssetName: "FormatTest",
          NumLanes: 2,
          Rotations: [
            { NumDrivers: 2, Heats: [{ Drivers: [1, 2], Group: 2 }] },
          ],
        }),
        null,
        2,
      );
    });

    it("should format single exported JSON with Version", async () => {
      fixture.detectChanges();
      component.internalAssetName = "FormatTest";
      component.internalNumLanes = 2;
      const rot = {
        numDrivers: 2,
        heats: [{ driverIndices: [1, 2], group: 1 }],
      };

      const stringifySpy = spyOn(JSON, "stringify").and.callThrough();

      await component.exportSingleRotation(rot);

      expect(mockWritable.write).toHaveBeenCalled();
      const writtenJson = JSON.parse(
        mockWritable.write.calls.mostRecent().args[0],
      );
      expect(writtenJson.Version).toBe("1.0");
      expect(writtenJson.NumDrivers).toBe(2);
      expect(writtenJson.NumLanes).toBe(2);
      expect(writtenJson.Heats[0].Drivers).toEqual([1, 2]);
      expect(writtenJson.Heats[0].Group).toBe(2);

      expect(stringifySpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          Version: "1.0",
          NumDrivers: 2,
          NumLanes: 2,
          Heats: [{ Drivers: [1, 2], Group: 2 }],
        }),
        null,
        2,
      );
    });

    it("should fallback to anchor download when showSaveFilePicker is not available", async () => {
      delete (window as any).showSaveFilePicker;
      const clickSpy = spyOn(HTMLAnchorElement.prototype, "click");
      component.internalAssetName = "FallbackTest";
      component.internalNumLanes = 2;
      const rot = { numDrivers: 2, heats: [{ driverIndices: [1, 2] }] };

      await component.exportSingleRotation(rot);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("Heat Groups", () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.addRotation();
    });

    it("should initialize new heats with a default group index of 0", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      component.addHeat(rotation);

      const newHeat = rotation.heats![rotation.heats!.length - 1];
      expect(newHeat.group).toBe(0);
    });

    it("should allow setting and updating a heat's group index", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      const heat = rotation.heats![0];

      heat.group = 1; // Group 2 (0-indexed)
      expect(heat.group).toBe(1);
    });
  });

  describe("Drag and Drop Interactions", () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.addRotation();
    });

    it("should handle drop from driver-pool to a heat lane", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [{ driverIndices: [0, 0, 0, 0], group: 0 }];

      const event = {
        previousContainer: { id: "driver-pool" },
        container: { id: "rot-0-heat-0-lane-1" },
        item: { data: { id: 5 } },
        previousIndex: 0,
        currentIndex: 1,
      } as any;

      component.onDrop(event);

      expect(rotation.heats[0].driverIndices![1]).toBe(5);
    });

    it("should swap drivers when dropped from one lane to another in the same rotation", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [
        { driverIndices: [1, 2, 3, 4], group: 0 },
        { driverIndices: [5, 6, 7, 8], group: 0 },
      ];

      const event = {
        previousContainer: { id: "rot-0-heat-0-lane-1" },
        container: { id: "rot-0-heat-1-lane-2" },
        previousIndex: 1,
        currentIndex: 2,
      } as any;

      component.onDrop(event);

      // Driver 2 from rot-0-heat-0-lane-1 and Driver 7 from rot-0-heat-1-lane-2 should swap
      expect(rotation.heats[0].driverIndices![1]).toBe(7);
      expect(rotation.heats[1].driverIndices![2]).toBe(2);
    });

    it("should clear the driver to 0 when dropped back into driver-pool", () => {
      fixture.detectChanges();
      const rotation = component.internalRotations[0];
      rotation.heats = [{ driverIndices: [1, 2, 3, 4], group: 0 }];

      const event = {
        previousContainer: { id: "rot-0-heat-0-lane-2" },
        container: { id: "driver-pool" },
        previousIndex: 2,
        currentIndex: 0,
      } as any;

      component.onDrop(event);

      expect(rotation.heats[0].driverIndices![2]).toBe(0);
    });
  });

  describe("Auto-save & Undo/Redo & KeyEvents", () => {
    it("should trigger undoManager.captureState and autoSave on change handlers", fakeAsync(() => {
      fixture.detectChanges();
      component.addRotation();
      component.internalAssetName = "Saved Rotation";

      const captureSpy = spyOn(
        component.undoManager,
        "captureState",
      ).and.callThrough();
      mockDataService.saveCustomRotation.calls.reset();

      // Asset Name Change
      component.onAssetNameChange();
      expect(captureSpy).toHaveBeenCalled();
      expect(mockDataService.saveCustomRotation).toHaveBeenCalled();

      // Track Change
      captureSpy.calls.reset();
      mockDataService.saveCustomRotation.calls.reset();
      component.selectedTrackId = "t2";
      component.onTrackChange();
      expect(captureSpy).toHaveBeenCalled();
      expect(mockDataService.saveCustomRotation).toHaveBeenCalled();

      // Drivers Count Change
      captureSpy.calls.reset();
      mockDataService.saveCustomRotation.calls.reset();
      component.internalRotations[0].numDrivers = 99;
      component.onNumDriversChange();
      expect(captureSpy).toHaveBeenCalled();
      expect(mockDataService.saveCustomRotation).toHaveBeenCalled();

      // Heat Group Change
      captureSpy.calls.reset();
      mockDataService.saveCustomRotation.calls.reset();
      const rotation = component.internalRotations[0];
      const heat = rotation.heats![0];
      component.onHeatGroupChange(rotation, heat, 3);
      expect(captureSpy).toHaveBeenCalled();
      expect(mockDataService.saveCustomRotation).toHaveBeenCalled();
    }));

    it("should debounce auto-saving during rapid name changes", fakeAsync(() => {
      fixture.detectChanges();
      component.addRotation();
      mockDataService.saveCustomRotation.calls.reset();

      component.onInputFocus();

      component.internalAssetName = "N";
      component.onInputChange();
      tick(30);

      component.internalAssetName = "Ne";
      component.onInputChange();
      tick(30);

      component.internalAssetName = "New Name";
      component.onInputChange();

      expect(mockDataService.saveCustomRotation).not.toHaveBeenCalled();

      tick(100);

      expect(mockDataService.saveCustomRotation).toHaveBeenCalledTimes(1);
    }));

    it("should revert state if auto-save fails", fakeAsync(() => {
      fixture.detectChanges();
      component.addRotation(); // Ensure at least 1 rotation exists
      component.internalAssetName = "Broken Rotation";

      const { throwError } = require("rxjs");
      mockDataService.saveCustomRotation.and.returnValue(
        throwError(() => new Error("Save error")),
      );
      const undoSpy = spyOn(component.undoManager, "undo").and.callThrough();
      const clearRedoSpy = spyOn(
        component.undoManager,
        "clearRedo",
      ).and.callThrough();

      component.onAssetNameChange();
      tick();

      expect(undoSpy).toHaveBeenCalled();
      expect(clearRedoSpy).toHaveBeenCalled();
    }));

    it("should trigger undo and redo on keyboard shortcuts", () => {
      fixture.detectChanges();

      const undoSpy = spyOn(component.undoManager, "undo");
      const redoSpy = spyOn(component.undoManager, "redo");

      // Ctrl + Z (Undo)
      const ctrlZ = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
      component.handleKeyboardEvent(ctrlZ);
      expect(undoSpy).toHaveBeenCalled();

      // Ctrl + Shift + Z (Redo)
      const ctrlShiftZ = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
      });
      component.handleKeyboardEvent(ctrlShiftZ);
      expect(redoSpy).toHaveBeenCalled();

      // Ctrl + Y (Redo)
      const ctrlY = new KeyboardEvent("keydown", { key: "y", ctrlKey: true });
      component.handleKeyboardEvent(ctrlY);
      expect(redoSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("Layout Scale and Resize", () => {
    it("should update scale on window resize", () => {
      // Simulate window resize
      window.innerWidth = 800;
      window.innerHeight = 450;
      component.onResize();
      expect(component.scale).toBe(0.5); // min(800/1600, 450/900)
    });
  });

  describe("Rotation Expander & Drop Connections", () => {
    it("should toggle rotation expanded state and update drop list connections", () => {
      fixture.detectChanges();
      component.internalNumLanes = 2;
      component.internalRotations = [
        { numDrivers: 2, heats: [{ driverIndices: [0, 0] }], isExpanded: true },
      ];

      component.updateDropListConnections();
      expect(component.heatDropListIds).toContain("rot-0-heat-0-lane-0");

      component.toggleExpander(component.internalRotations[0]);
      expect(component.internalRotations[0].isExpanded).toBeFalse();
      expect(component.heatDropListIds).not.toContain("rot-0-heat-0-lane-0");
    });
  });

  describe("Virtual Drivers", () => {
    it("should default virtual driver count to 10 when no rotations or low driver counts exist", () => {
      fixture.detectChanges();
      expect(component.numVirtualDrivers).toBe(10);
      expect(component.virtualDrivers.length).toBe(10);
    });

    it("should initialize virtual driver count from maximum driver index in heats", () => {
      fixture.componentRef.setInput("rotations", [
        {
          numDrivers: 4,
          heats: [{ driverIndices: [1, 40, 3, 4] }], // max driver ID is 40
        },
      ]);

      fixture.detectChanges();
      expect(component.numVirtualDrivers).toBe(40);
      expect(component.virtualDrivers.length).toBe(40);
    });

    it("should handle onNumVirtualDriversChange validation", () => {
      fixture.detectChanges();

      // Invalid input (null or < 1) should reset to 1
      component.numVirtualDrivers = 0;
      component.onNumVirtualDriversChange();
      expect(component.numVirtualDrivers).toBe(1);

      // Valid change should update the list
      component.numVirtualDrivers = 15;
      component.onNumVirtualDriversChange();
      expect(component.virtualDrivers.length).toBe(15);
      expect(component.virtualDrivers[14].name).toBe("Driver 15");
    });
  });

  describe("Custom Rotation Validation & Save & Auto-Save & Name Generation", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should generate a sequential unique default name correctly", () => {
      component.allAssets = [
        {
          type: "custom_rotation",
          name: "New Custom Rotation 1",
          model: { entityId: "1" },
        },
        {
          type: "custom_rotation",
          name: "New Custom Rotation 2",
          model: { entityId: "2" },
        },
        {
          type: "other_asset",
          name: "New Custom Rotation 3",
          model: { entityId: "3" },
        }, // Different type
      ];
      component.internalAssetId = "new";

      const uniqueName = component.generateUniqueName();
      // Should find "New Custom Rotation 3" since the existing asset with that name is of a different type
      expect(uniqueName).toBe("New Custom Rotation 3");

      component.allAssets.push({
        type: "custom_rotation",
        name: "New Custom Rotation 3",
        model: { entityId: "4" },
      });
      const nextUniqueName = component.generateUniqueName();
      expect(nextUniqueName).toBe("New Custom Rotation 4");
    });

    it("should evaluate isConfigValid correctly based on name, rotations, and validation errors", () => {
      // Empty/whitespace name is invalid
      component.internalAssetName = "   ";
      expect(component.isConfigValid()).toBeFalse();

      // Duplicate name is invalid
      component.internalAssetName = "Dupe";
      component.allAssets = [
        { type: "custom_rotation", name: "Dupe", model: { entityId: "1" } },
      ];
      component.internalAssetId = "2";
      expect(component.isConfigValid()).toBeFalse();

      // Valid name, but zero rotations is invalid
      component.internalAssetName = "Valid Name";
      component.internalRotations = [];
      expect(component.isConfigValid()).toBeFalse();

      // Valid name and 1 valid rotation is valid
      component.addRotation();
      expect(component.isConfigValid()).toBeTrue();

      // Heat lane conflicts make config invalid
      component.internalRotations[0].heats = [{ driverIndices: [1, 1, 2, 3] }];
      expect(component.isConfigValid()).toBeFalse();
    });

    it("should abort save and auto-save if isConfigValid is false", () => {
      mockDataService.saveCustomRotation.calls.reset();

      // Invalid configuration (zero rotations)
      component.internalAssetName = "Test";
      component.internalRotations = [];
      expect(component.isConfigValid()).toBeFalse();

      component.save();
      expect(mockDataService.saveCustomRotation).not.toHaveBeenCalled();

      component.autoSave();
      expect(mockDataService.saveCustomRotation).not.toHaveBeenCalled();
    });

    it("should reset tracking on successful save or autoSave", fakeAsync(() => {
      component.internalAssetName = "Tracked Name";
      component.addRotation();
      mockDataService.saveCustomRotation.calls.reset();

      const resetTrackingSpy = spyOn(
        component.undoManager,
        "resetTracking",
      ).and.callThrough();

      component.save();
      tick();

      expect(resetTrackingSpy).toHaveBeenCalled();
    }));
  });

  describe("Save Serialization Queue", () => {
    let saveSubjects: any[] = [];

    beforeEach(() => {
      fixture.detectChanges();
      component.internalAssetName = "Serialization Test";
      // Clear out default rotations and add one so it's a valid config
      component.internalRotations = [];
      component.addRotation();
      mockDataService.saveCustomRotation.calls.reset();

      // Return a new observable that we can manually trigger/complete on each call
      const { Subject } = require("rxjs");
      saveSubjects = [];
      mockDataService.saveCustomRotation.and.callFake(() => {
        const sub = new Subject();
        saveSubjects.push(sub);
        return sub;
      });
    });

    it("should queue subsequent auto-save calls if one is already in-flight, and execute it upon completion", fakeAsync(() => {
      // Trigger first autoSave
      component.autoSave();
      expect(component.isSaving).toBeTrue();
      expect(mockDataService.saveCustomRotation).toHaveBeenCalledTimes(1);

      // Trigger second autoSave while first is in-flight
      component.autoSave();
      // Should not call saveCustomRotation again yet (still 1 call)
      expect(mockDataService.saveCustomRotation).toHaveBeenCalledTimes(1);

      // Complete the first save
      const mockAsset = { model: { entityId: "asset-123" } };
      saveSubjects[0].next(mockAsset);
      saveSubjects[0].complete();

      tick();

      // Now the second (queued) save should have been triggered (total 2 calls)
      expect(mockDataService.saveCustomRotation).toHaveBeenCalledTimes(2);
      expect(component.internalAssetId).toBe("asset-123");
    }));

    it("should queue save() call and navigate back after in-flight save completes", fakeAsync(() => {
      const savedSpy = spyOn(component.saved, "emit");
      mockRouter.navigate.calls.reset();

      // Trigger first autoSave
      component.autoSave();
      expect(component.isSaving).toBeTrue();
      expect(mockDataService.saveCustomRotation).toHaveBeenCalledTimes(1);

      // Trigger manual save() while first is in-flight
      component.save();
      // Should not call saveCustomRotation again yet (still 1 call)
      expect(mockDataService.saveCustomRotation).toHaveBeenCalledTimes(1);

      // Complete the first save
      const mockAsset = { model: { entityId: "asset-123" } };
      saveSubjects[0].next(mockAsset);
      saveSubjects[0].complete();

      tick();

      // The manual save should have been triggered (total 2 calls)
      expect(mockDataService.saveCustomRotation).toHaveBeenCalledTimes(2);

      // Now complete the manual save
      saveSubjects[1].next(mockAsset);
      saveSubjects[1].complete();

      tick();

      // It should have emitted the saved asset and navigated back
      expect(savedSpy).toHaveBeenCalledWith(mockAsset);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ["/asset-manager"],
        jasmine.any(Object),
      );
    }));

    it("should only trigger a single autoSave call when addRotation is invoked", () => {
      // Verify optimization: addRotation calls addHeat with triggerAutoSave = false
      const autoSaveSpy = spyOn(component, "autoSave").and.callThrough();

      // Let's reset the mock to return of({}) for standard behavior
      mockDataService.saveCustomRotation.and.returnValue(of({}));

      component.addRotation();

      // Should only have called autoSave once
      expect(autoSaveSpy).toHaveBeenCalledTimes(1);
    });
    it("should provide unsaved reasons when changes cannot be saved", () => {
      // Empty name
      component.internalAssetName = "";
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_ROTATION_NAME_EMPTY",
      );

      // Duplicate name
      component.internalAssetName = "Existing Rotation";
      component.allAssets = [
        {
          type: "custom_rotation",
          name: "Existing Rotation",
          model: { entityId: "other-id" },
        } as any,
      ];
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_ROTATION_NAME_DUPLICATE",
      );

      // Empty rotations
      component.internalAssetName = "Unique Name";
      component.internalRotations = [];
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_ROTATION_EMPTY",
      );

      // Rotation validation errors
      component.internalRotations = [
        { heat: 1, driverId: "d1", lane: 1, stage: 1 } as any,
      ];
      spyOn(component, "hasValidationErrors").and.returnValue(true);
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_ROTATION_ERRORS",
      );

      // Saving in progress
      (component.hasValidationErrors as jasmine.Spy).and.returnValue(false);
      (component as any).savingCount = 1;
      expect(component.getUnsavedReasons()).toContain("DISCARD_REASON_SAVING");
      (component as any).savingCount = 0;

      // Exited too quickly (dirty, valid, not saving)
      spyOn(component, "isDirtyState").and.returnValue(true);
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_EXIT_TOO_QUICKLY",
      );

      // discardMessage contains bullet points
      expect(component.discardMessage).toContain("•");
    });
    describe("Zoom Support", () => {
      it("should update zoomLevel and bind it to the heats grid", () => {
        fixture.detectChanges();
        component.addRotation();
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const grid = compiled.querySelector(".heats-grid") as HTMLElement;
        expect(grid).toBeTruthy();
        expect(grid.style.zoom).toBe("1");

        component.zoomLevel = 120;
        fixture.detectChanges();
        expect(grid.style.zoom).toBe("1.2");
      });
    });
  });
});
