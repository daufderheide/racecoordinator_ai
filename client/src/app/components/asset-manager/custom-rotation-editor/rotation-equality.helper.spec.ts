import { TranslationService } from "@app/services/translation.service";

import { RotationEqualityManager } from "./rotation-equality.helper";
import { LocalRotation } from "./rotation-export.utils";

describe("RotationEqualityManager", () => {
  let manager: RotationEqualityManager;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    manager = new RotationEqualityManager();
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
  });

  it("should check and cache rotation equality", () => {
    const rotation: LocalRotation = {
      numDrivers: 2,
      heats: [
        { driverIndices: [1, 2], group: 0 },
        { driverIndices: [2, 1], group: 0 },
      ],
    };

    const isEqual = manager.isRotationEqual(
      rotation,
      2,
      mockTranslationService,
    );
    expect(isEqual).toBeTrue();
    expect(rotation.isEqual).toBeTrue();

    // Second call should use cache
    const isEqualAgain = manager.isRotationEqual(
      rotation,
      2,
      mockTranslationService,
    );
    expect(isEqualAgain).toBeTrue();
  });

  it("should validate all rotations in array", () => {
    const rot1: LocalRotation = {
      numDrivers: 2,
      heats: [{ driverIndices: [1, 2], group: 0 }],
    };
    const rot2: LocalRotation = {
      numDrivers: 2,
      heats: [
        { driverIndices: [1, 2], group: 0 },
        { driverIndices: [2, 1], group: 0 },
      ],
    };

    manager.validateAllRotationsLaneEquality(
      [rot1, rot2],
      2,
      mockTranslationService,
    );

    expect(rot1.isEqual).toBeDefined();
    expect(rot2.isEqual).toBeTrue();
  });

  it("should return equality reports", () => {
    const rotation: LocalRotation = {
      numDrivers: 2,
      heats: [{ driverIndices: [1, 2], group: 0 }],
    };

    const reports = manager.getEqualityReport(
      rotation,
      2,
      mockTranslationService,
    );
    expect(reports).toBeDefined();
    expect(Array.isArray(reports)).toBeTrue();
  });
});
