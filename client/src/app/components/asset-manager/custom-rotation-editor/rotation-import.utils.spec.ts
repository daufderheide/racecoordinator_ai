import {
  isRc1Rotation,
  parseAndValidateImportFile,
  parseImportHeats,
} from "./rotation-import.utils";

describe("rotation-import.utils", () => {
  describe("isRc1Rotation", () => {
    it("should return true when version is undefined or null", () => {
      expect(isRc1Rotation(undefined)).toBeTrue();
      expect(isRc1Rotation(null)).toBeTrue();
    });

    it("should return true when version string is empty or invalid", () => {
      expect(isRc1Rotation("")).toBeTrue();
      expect(isRc1Rotation("   ")).toBeTrue();
      expect(isRc1Rotation("invalid")).toBeTrue();
    });

    it("should return true when version is < 1", () => {
      expect(isRc1Rotation(0)).toBeTrue();
      expect(isRc1Rotation(0.9)).toBeTrue();
      expect(isRc1Rotation(-1)).toBeTrue();
      expect(isRc1Rotation("0")).toBeTrue();
      expect(isRc1Rotation("0.0")).toBeTrue();
      expect(isRc1Rotation("0.9")).toBeTrue();
      expect(isRc1Rotation("0.99")).toBeTrue();
    });

    it("should return false when version is >= 1", () => {
      expect(isRc1Rotation(1)).toBeFalse();
      expect(isRc1Rotation(1.0)).toBeFalse();
      expect(isRc1Rotation(2)).toBeFalse();
      expect(isRc1Rotation("1")).toBeFalse();
      expect(isRc1Rotation("1.0")).toBeFalse();
      expect(isRc1Rotation("1.2.0")).toBeFalse();
      expect(isRc1Rotation("2.0")).toBeFalse();
    });
  });

  describe("parseImportHeats", () => {
    it("should parse import heats preserving negative indices and step-up boundaries when isRc1 is false", () => {
      const rawHeats = [
        {
          Drivers: [1, 2, 3, 4],
          Group: 1,
          IsStepUpBoundary: true,
          Step: 1,
        },
        {
          drivers: [-1, -2, 3, 4],
          group: 1,
          is_step_up_boundary: false,
          step: 2,
        },
      ];

      const parsed = parseImportHeats(rawHeats, false);
      expect(parsed.length).toBe(2);

      expect(parsed[0].driverIndices).toEqual([1, 2, 3, 4]);
      expect(parsed[0].group).toBe(0); // 0-based internal
      expect(parsed[0].isStepUpBoundary).toBeTrue();
      expect(parsed[0].step).toBe(1);

      expect(parsed[1].driverIndices).toEqual([-1, -2, 3, 4]);
      expect(parsed[1].group).toBe(0);
      expect(parsed[1].isStepUpBoundary).toBeFalse();
      expect(parsed[1].step).toBe(2);
    });

    it("should handle RC1 0-based drivers and groups correctly", () => {
      const rawHeats = [
        {
          Drivers: [0, 1, 2, 3],
          Group: 0,
        },
      ];

      const parsed = parseImportHeats(rawHeats, true);
      expect(parsed[0].driverIndices).toEqual([1, 2, 3, 4]);
      expect(parsed[0].group).toBe(0);
      expect(parsed[0].isStepUpBoundary).toBeFalse();
      expect(parsed[0].step).toBe(1);
    });

    it("should treat -1 driver as empty lane (0) and convert 0-based drivers when isRc1 is true", () => {
      const rawHeats = [
        {
          Drivers: [-1, 0, 1, 2],
          Group: 0,
        },
      ];

      const parsed = parseImportHeats(rawHeats, true);
      expect(parsed[0].driverIndices).toEqual([0, 1, 2, 3]);
      expect(parsed[0].group).toBe(0);
      expect(parsed[0].isStepUpBoundary).toBeFalse();
      expect(parsed[0].step).toBe(1);
    });

    it("should treat all negative driver indices as empty lanes (0) and disable step-up features for RC1", () => {
      const rawHeats = [
        {
          Drivers: [-1, -2, -3, 0],
          Group: 2,
          IsStepUpBoundary: true,
          Step: 3,
        },
      ];

      const parsed = parseImportHeats(rawHeats, true);
      expect(parsed[0].driverIndices).toEqual([0, 0, 0, 1]);
      expect(parsed[0].group).toBe(2);
      expect(parsed[0].isStepUpBoundary).toBeFalse();
      expect(parsed[0].step).toBe(1);
    });
  });

  describe("parseAndValidateImportFile", () => {
    it("should import single rotation JSON with step-up drivers when version >= 1", async () => {
      const json = {
        Version: "1.0",
        NumDrivers: 4,
        NumLanes: 4,
        Heats: [
          { Drivers: [1, 2, 3, 4], IsStepUpBoundary: true, Step: 1, Group: 1 },
          {
            Drivers: [-1, 2, 3, 4],
            IsStepUpBoundary: false,
            Step: 2,
            Group: 1,
          },
        ],
      };

      const file = new File([JSON.stringify(json)], "test.json", {
        type: "application/json",
      });

      const result = await parseAndValidateImportFile(file, 4, [2]);

      expect(result.success).toBeTrue();
      expect(result.newRotations?.length).toBe(1);
      const rot = result.newRotations![0];
      expect(rot.numDrivers).toBe(4);
      expect(rot.heats?.length).toBe(2);
      expect(rot.heats?.[1].driverIndices?.[0]).toBe(-1);
      expect(rot.heats?.[0].isStepUpBoundary).toBeTrue();
    });

    it("should treat -1 as empty lane when importing RC1 file with undefined version", async () => {
      const json = {
        NumDrivers: 4,
        NumLanes: 4,
        Heats: [
          { Drivers: [0, 1, 2, -1], Group: 0 },
          { Drivers: [-1, -1, 0, 1], Group: 0 },
        ],
      };

      const file = new File([JSON.stringify(json)], "rc1_empty.json", {
        type: "application/json",
      });

      const result = await parseAndValidateImportFile(file, 4, []);

      expect(result.success).toBeTrue();
      expect(result.newRotations?.length).toBe(1);
      const rot = result.newRotations![0];
      expect(rot.heats?.[0].driverIndices).toEqual([1, 2, 3, 0]);
      expect(rot.heats?.[1].driverIndices).toEqual([0, 0, 1, 2]);
      expect(rot.heats?.[0].isStepUpBoundary).toBeFalse();
      expect(rot.heats?.[0].step).toBe(1);
    });

    it("should treat all negative driver indices as empty lanes when version is < 1", async () => {
      const json = {
        Version: 0.9,
        NumDrivers: 4,
        NumLanes: 4,
        Heats: [{ Drivers: [-2, -1, 0, 1], Group: 0 }],
      };

      const file = new File([JSON.stringify(json)], "rc1_v09.json", {
        type: "application/json",
      });

      const result = await parseAndValidateImportFile(file, 4, []);

      expect(result.success).toBeTrue();
      expect(result.newRotations?.length).toBe(1);
      const rot = result.newRotations![0];
      expect(rot.heats?.[0].driverIndices).toEqual([0, 0, 1, 2]);
    });

    it("should treat all negative driver indices as empty lanes when version string is '0'", async () => {
      const json = {
        version: "0",
        NumDrivers: 4,
        NumLanes: 4,
        Heats: [{ Drivers: [-3, 0, 1, 2], Group: 1 }],
      };

      const file = new File([JSON.stringify(json)], "rc1_v0.json", {
        type: "application/json",
      });

      const result = await parseAndValidateImportFile(file, 4, []);

      expect(result.success).toBeTrue();
      expect(result.newRotations?.length).toBe(1);
      const rot = result.newRotations![0];
      expect(rot.heats?.[0].driverIndices).toEqual([0, 1, 2, 3]);
    });

    it("should import whole asset with undefined version and map negative drivers to empty lane", async () => {
      const json = {
        AssetName: "Legacy RC1 Asset",
        NumLanes: 4,
        Rotations: [
          {
            NumDrivers: 4,
            Heats: [{ Drivers: [-1, 0, 1, 2], Group: 0 }],
          },
          {
            NumDrivers: 5,
            Heats: [{ Drivers: [0, -1, 1, 2], Group: 0 }],
          },
        ],
      };

      const file = new File([JSON.stringify(json)], "rc1_asset.json", {
        type: "application/json",
      });

      const result = await parseAndValidateImportFile(file, 4, []);

      expect(result.success).toBeTrue();
      expect(result.newRotations?.length).toBe(2);
      expect(result.newRotations![0].heats?.[0].driverIndices).toEqual([
        0, 1, 2, 3,
      ]);
      expect(result.newRotations![1].heats?.[0].driverIndices).toEqual([
        1, 0, 2, 3,
      ]);
    });
  });
});
