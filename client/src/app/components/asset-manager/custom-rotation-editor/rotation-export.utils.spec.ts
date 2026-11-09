import { TranslationService } from "@app/services/translation.service";

import {
  areCustomRotationStatesEqual,
  assignCustomRotationStepNumbers,
  buildRotationsAssetExportJson,
  buildSingleRotationExportJson,
  checkRotationLaneEqualityDirect,
  cloneCustomRotationState,
  downloadJsonFile,
  driverHasGroupConflict,
  getDriverGroupConflicts,
  getRotationSignature,
  hasValidationErrors,
  heatHasError,
  heatHasGroupConflict,
  heatHasStepUpInStepOne,
  rotationHasStepUps,
} from "./rotation-export.utils";

describe("rotation-export.utils", () => {
  const mockTranslationService = {
    translate: (key: string) => key,
  } as unknown as TranslationService;

  it("should compute correct rotation signature", () => {
    const rot = {
      numDrivers: 4,
      heats: [{ driverIndices: [1, 2, 3, 4] }, { driverIndices: [2, 3, 4, 1] }],
    };
    const sig = getRotationSignature(rot, 4);
    expect(sig).toBe("4:4:1,2,3,4:0:0:1|2,3,4,1:0:0:1");
  });

  it("should check rotation lane equality direct", () => {
    const rot = {
      numDrivers: 4,
      heats: [
        { driverIndices: [1, 2, 3, 4] },
        { driverIndices: [2, 3, 4, 1] },
        { driverIndices: [3, 4, 1, 2] },
        { driverIndices: [4, 1, 2, 3] },
      ],
    };
    const result = checkRotationLaneEqualityDirect(
      rot,
      4,
      mockTranslationService,
    );
    expect(result.allEqual).toBeTrue();
  });

  it("should clone and compare custom rotation states correctly", () => {
    const state = {
      assetName: "TestAsset",
      selectedTrackId: "track1",
      numLanes: 4,
      rotations: [
        {
          numDrivers: 4,
          heats: [{ group: 0, driverIndices: [1, 2, 3, 4] }],
        },
      ],
    };
    const cloned = cloneCustomRotationState(state);
    expect(areCustomRotationStatesEqual(state, cloned)).toBeTrue();

    const diffName = { ...state, assetName: "Other" };
    expect(areCustomRotationStatesEqual(state, diffName)).toBeFalse();

    const diffTrack = { ...state, selectedTrackId: "track2" };
    expect(areCustomRotationStatesEqual(state, diffTrack)).toBeFalse();

    const diffLanes = { ...state, numLanes: 6 };
    expect(areCustomRotationStatesEqual(state, diffLanes)).toBeFalse();

    const diffRotCount = { ...state, rotations: [] };
    expect(areCustomRotationStatesEqual(state, diffRotCount)).toBeFalse();

    const diffDrivers = {
      ...state,
      rotations: [{ numDrivers: 5, heats: [] }],
    };
    expect(areCustomRotationStatesEqual(state, diffDrivers)).toBeFalse();
  });

  it("should build single rotation export JSON", () => {
    const rot = {
      numDrivers: 4,
      heats: [{ group: 0, driverIndices: [1, 2, 3, 4] }],
    };
    const res = buildSingleRotationExportJson("MyRot", 4, rot);
    expect(res.fileName).toBe("MyRot_L4_D4.json");
    const parsed = JSON.parse(res.jsonContent);
    expect(parsed.NumDrivers).toBe(4);
    expect(parsed.NumLanes).toBe(4);
    expect(parsed.Heats[0].Group).toBe(1);
  });

  it("should build rotations asset export JSON", () => {
    const rots = [
      {
        numDrivers: 4,
        heats: [{ group: 1, driverIndices: [1, 2, 3, 4] }],
      },
    ];
    const res = buildRotationsAssetExportJson("MyRot", 4, rots);
    expect(res.fileName).toBe("MyRot_L4_Asset.json");
    const parsed = JSON.parse(res.jsonContent);
    expect(parsed.IsAsset).toBeTrue();
    expect(parsed.AssetName).toBe("MyRot");
    expect(parsed.Rotations.length).toBe(1);
    expect(parsed.Rotations[0].Heats[0].Group).toBe(2);
  });

  it("should detect driver group conflicts and heat errors", () => {
    const rotWithConflicts = {
      numDrivers: 4,
      heats: [
        { group: 0, driverIndices: [1, 2, 3, 4] },
        { group: 1, driverIndices: [1, 2, 0, 0] }, // Driver 1 and 2 in multiple groups
      ],
    };
    const conflicts = getDriverGroupConflicts(rotWithConflicts);
    expect(conflicts.has(1)).toBeTrue();
    expect(conflicts.has(2)).toBeTrue();
    expect(heatHasGroupConflict(rotWithConflicts, 0)).toBeTrue();
    expect(driverHasGroupConflict(rotWithConflicts, 1)).toBeTrue();
    expect(driverHasGroupConflict(rotWithConflicts, 3)).toBeFalse();

    const rotWithDupDriversInHeat = {
      numDrivers: 4,
      heats: [{ group: 0, driverIndices: [1, 1, 2, 3] }],
    };
    expect(heatHasError(rotWithDupDriversInHeat, 0)).toBeTrue();
    expect(hasValidationErrors([rotWithDupDriversInHeat])).toBeTrue();
  });

  it("should assign correct step numbers for non-group rotation", () => {
    const rot: {
      numDrivers: number;
      heats: {
        group: number;
        driverIndices: number[];
        isStepUpBoundary: boolean;
        step?: number;
      }[];
    } = {
      numDrivers: 4,
      heats: [
        { group: 0, driverIndices: [1, 2, 3, 4], isStepUpBoundary: false },
        { group: 0, driverIndices: [1, 2, 3, 4], isStepUpBoundary: true },
        { group: 0, driverIndices: [-1, 2, 3, 4], isStepUpBoundary: false },
        { group: 0, driverIndices: [-1, 2, 3, 4], isStepUpBoundary: true },
        { group: 0, driverIndices: [-2, 2, 3, 4], isStepUpBoundary: false },
      ],
    };
    assignCustomRotationStepNumbers(rot);
    expect(rot.heats[0].step).toBe(1);
    expect(rot.heats[1].step).toBe(1);
    expect(rot.heats[2].step).toBe(2);
    expect(rot.heats[3].step).toBe(2);
    expect(rot.heats[4].step).toBe(3);
  });

  it("should assign correct step numbers independently per group", () => {
    const rot: {
      numDrivers: number;
      heats: {
        group: number;
        driverIndices: number[];
        isStepUpBoundary: boolean;
        step?: number;
      }[];
    } = {
      numDrivers: 6,
      heats: [
        { group: 0, driverIndices: [1, 2, 3], isStepUpBoundary: true }, // G0, step 1
        { group: 1, driverIndices: [4, 5, 6], isStepUpBoundary: false }, // G1, step 1
        { group: 0, driverIndices: [-1, 2, 3], isStepUpBoundary: false }, // G0, step 2
        { group: 1, driverIndices: [4, 5, 6], isStepUpBoundary: true }, // G1, step 1
        { group: 1, driverIndices: [-1, 5, 6], isStepUpBoundary: false }, // G1, step 2
      ],
    };
    assignCustomRotationStepNumbers(rot);
    expect(rot.heats[0].step).toBe(1);
    expect(rot.heats[1].step).toBe(1);
    expect(rot.heats[2].step).toBe(2);
    expect(rot.heats[3].step).toBe(1);
    expect(rot.heats[4].step).toBe(2);
  });

  it("should detect step-ups and flag step 1 step-ups as errors", () => {
    const normalRot = {
      numDrivers: 4,
      heats: [{ group: 0, driverIndices: [1, 2, 3, 4], step: 1 }],
    };
    expect(rotationHasStepUps(normalRot)).toBeFalse();
    expect(heatHasStepUpInStepOne(normalRot, 0)).toBeFalse();
    expect(heatHasError(normalRot, 0)).toBeFalse();

    const stepUpRot = {
      numDrivers: 4,
      heats: [
        { group: 0, driverIndices: [1, -1, 3, 4], step: 1 },
        { group: 0, driverIndices: [1, -1, 3, 4], step: 2 },
      ],
    };
    expect(rotationHasStepUps(stepUpRot)).toBeTrue();
    expect(heatHasStepUpInStepOne(stepUpRot, 0)).toBeTrue();
    expect(heatHasStepUpInStepOne(stepUpRot, 1)).toBeFalse();
    expect(heatHasError(stepUpRot, 0)).toBeTrue();
    expect(heatHasError(stepUpRot, 1)).toBeFalse();
  });

  it("should check lane equality including step-up drivers", () => {
    const rot = {
      numDrivers: 1,
      heats: [{ driverIndices: [1, -1] }, { driverIndices: [-1, 1] }],
    };
    const result = checkRotationLaneEqualityDirect(
      rot,
      2,
      mockTranslationService,
    );
    expect(result.allEqual).toBeTrue();

    const rotUnequal = {
      numDrivers: 1,
      heats: [{ driverIndices: [1, -1] }, { driverIndices: [1, -1] }],
    };
    const resultUnequal = checkRotationLaneEqualityDirect(
      rotUnequal,
      2,
      mockTranslationService,
    );
    expect(resultUnequal.allEqual).toBeFalse();
    expect(resultUnequal.reports.length).toBeGreaterThan(0);
  });

  it("should export step-up boundaries and step numbers in single rotation and asset JSON", () => {
    const rot = {
      numDrivers: 4,
      heats: [
        {
          group: 0,
          driverIndices: [1, 2, 3, 4],
          isStepUpBoundary: true,
          step: 1,
        },
        {
          group: 0,
          driverIndices: [-1, 2, 3, 4],
          isStepUpBoundary: false,
          step: 2,
        },
      ],
    };
    const singleExport = buildSingleRotationExportJson("StepUpRot", 4, rot);
    const parsedSingle = JSON.parse(singleExport.jsonContent);
    expect(parsedSingle.Heats[0].IsStepUpBoundary).toBeTrue();
    expect(parsedSingle.Heats[0].Step).toBe(1);
    expect(parsedSingle.Heats[1].IsStepUpBoundary).toBeFalse();
    expect(parsedSingle.Heats[1].Step).toBe(2);
    expect(parsedSingle.Heats[1].Drivers[0]).toBe(-1);

    const assetExport = buildRotationsAssetExportJson("StepUpAsset", 4, [rot]);
    const parsedAsset = JSON.parse(assetExport.jsonContent);
    expect(parsedAsset.Rotations[0].Heats[0].IsStepUpBoundary).toBeTrue();
    expect(parsedAsset.Rotations[0].Heats[0].Step).toBe(1);
    expect(parsedAsset.Rotations[0].Heats[1].Drivers[0]).toBe(-1);
  });

  describe("downloadJsonFile", () => {
    let originalShowSaveFilePicker: any;

    beforeEach(() => {
      originalShowSaveFilePicker = (window as any).showSaveFilePicker;
    });

    afterEach(() => {
      (window as any).showSaveFilePicker = originalShowSaveFilePicker;
    });

    it("should call showSaveFilePicker with suggested name and write content", async () => {
      const mockWritable = {
        write: jasmine.createSpy("write").and.returnValue(Promise.resolve()),
        close: jasmine.createSpy("close").and.returnValue(Promise.resolve()),
      };
      const mockHandle = {
        createWritable: jasmine
          .createSpy("createWritable")
          .and.returnValue(Promise.resolve(mockWritable)),
      };
      (window as any).showSaveFilePicker = jasmine
        .createSpy("showSaveFilePicker")
        .and.returnValue(Promise.resolve(mockHandle));

      const result = await downloadJsonFile("rot.json", '{"test":1}');
      expect(result).toBeTrue();
      expect((window as any).showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: "rot.json",
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      expect(mockWritable.write).toHaveBeenCalledWith('{"test":1}');
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it("should fallback to anchor download when showSaveFilePicker is unavailable", async () => {
      delete (window as any).showSaveFilePicker;
      const clickSpy = spyOn(HTMLAnchorElement.prototype, "click");
      const result = await downloadJsonFile("rot.json", '{"test":1}');
      expect(result).toBeTrue();
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
