import { TranslationService } from "@app/services/translation.service";

import {
  areCustomRotationStatesEqual,
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
    expect(sig).toBe("4:4:1,2,3,4|2,3,4,1");
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
