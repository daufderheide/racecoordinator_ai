import { NO_ERRORS_SCHEMA } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
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

  it("should initialize with default rotation if none provided", () => {
    fixture.detectChanges();
    expect(component.internalRotations.length).toBe(1);
    expect(component.internalRotations[0].heats?.length).toBe(1);
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
    component.addRotation();
    expect(component.internalRotations.length).toBe(2);

    component.removeRotation(0);
    expect(component.internalRotations.length).toBe(1);
  });

  it("should add and remove heats", () => {
    fixture.detectChanges();
    const rotation = component.internalRotations[0];
    component.addHeat(rotation);
    expect(rotation.heats?.length).toBe(2);

    component.removeHeat(rotation, 0);
    expect(rotation.heats?.length).toBe(1);
  });

  it("should call saveCustomRotation and emit saved output on save", fakeAsync(() => {
    fixture.detectChanges();
    component.internalAssetName = "Test Rotation";

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
  });

  describe("Import Rotation", () => {
    const validJson = JSON.stringify({
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

    it("should convert 0-indexed drivers and groups to 1-indexed / 0-indexed internal for RC1 import", async () => {
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

      await component.onImportFiles(event, true);

      expect(component.internalRotations[0].heats?.[0].driverIndices).toEqual([
        4, 1, 2, 3,
      ]);
      expect(component.internalRotations[0].heats?.[0].group).toBe(1);
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

      await component.onImportFiles(event, true);

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
        NumDrivers: 4,
        NumLanes: 4,
        Heats: [{ Drivers: [4, 1, 2, 3], Group: 2 }], // 1-based drivers and groups
      });

      const file = createMockFile(standardJson, "standard.json");
      const event = createImportEvent([file]);

      // Remove default rotation to avoid duplicate error
      component.internalRotations = [];

      await component.onImportFiles(event, false);

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
    let mockAnchor: any;
    let createObjectURLSpy: jasmine.Spy;
    let revokeObjectURLSpy: jasmine.Spy;

    beforeEach(() => {
      mockAnchor = {
        click: jasmine.createSpy("click"),
        remove: jasmine.createSpy("remove"),
        setAttribute: jasmine.createSpy("setAttribute"),
        href: "",
        download: "",
        style: {},
      };

      const originalCreateElement = document.createElement.bind(document);
      spyOn(document, "createElement").and.callFake((tagName: string) => {
        if (tagName === "a") {
          return mockAnchor as any;
        }
        return originalCreateElement(tagName);
      });

      spyOn(document.body, "appendChild").and.stub();
      spyOn(document.body, "removeChild").and.stub();
      createObjectURLSpy = spyOn(URL, "createObjectURL").and.returnValue(
        "mock-url",
      );
      revokeObjectURLSpy = spyOn(URL, "revokeObjectURL").and.stub();
    });

    it("should trigger download for combined asset JSON file when exportRotations is called", fakeAsync(() => {
      fixture.detectChanges();
      component.internalAssetName = "TestRotation";
      component.internalNumLanes = 4;
      component.internalRotations = [
        { numDrivers: 4, heats: [{ driverIndices: [1, 2, 3, 4] }] },
        { numDrivers: 5, heats: [{ driverIndices: [1, 2, 3, 4] }] },
      ];

      component.exportRotations();

      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockAnchor.download).toBe("TestRotation_L4_Asset.json");
      expect(mockAnchor.href).toBe("mock-url");
      expect(mockAnchor.click).toHaveBeenCalled();

      tick(5000); // For setTimeout cleanup
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    }));

    it("should trigger download for individual rotation JSON file when exportSingleRotation is called", fakeAsync(() => {
      fixture.detectChanges();
      component.internalAssetName = "TestRotation";
      component.internalNumLanes = 4;
      const rot = { numDrivers: 4, heats: [{ driverIndices: [1, 2, 3, 4] }] };

      component.exportSingleRotation(rot);

      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockAnchor.download).toBe("TestRotation_L4_D4.json");
      expect(mockAnchor.href).toBe("mock-url");
      expect(mockAnchor.click).toHaveBeenCalled();

      tick(5000); // For setTimeout cleanup
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    }));

    it("should format combined exported JSON with correct property names and 1-based group indices", fakeAsync(() => {
      fixture.detectChanges();
      component.internalAssetName = "FormatTest";
      component.internalNumLanes = 2;
      component.internalRotations = [
        { numDrivers: 2, heats: [{ driverIndices: [1, 2], group: 1 }] },
      ];

      const stringifySpy = spyOn(JSON, "stringify").and.callThrough();

      component.exportRotations();

      const blobCall = createObjectURLSpy.calls.mostRecent().args[0] as Blob;
      expect(blobCall.type).toBe("application/json");

      expect(stringifySpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
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

      tick(5000);
    }));
  });

  describe("Heat Groups", () => {
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
      component.onTrackChange();
      expect(captureSpy).toHaveBeenCalled();
      expect(mockDataService.saveCustomRotation).toHaveBeenCalled();

      // Drivers Count Change
      captureSpy.calls.reset();
      mockDataService.saveCustomRotation.calls.reset();
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

    it("should revert state if auto-save fails", fakeAsync(() => {
      fixture.detectChanges();
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
    it("should recalculate scale factor on resize host listener", () => {
      fixture.detectChanges();

      // Spy on updateScale to verify it's called
      const scaleSpy = spyOn(component as any, "updateScale").and.callThrough();

      component.onResize();
      expect(scaleSpy).toHaveBeenCalled();
      expect(component.scale).toBeGreaterThan(0);
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
});
