import { TranslationService } from "@app/services/translation.service";

import { LocalRotation } from "./rotation-export.utils";
import {
  filterRotationHeats,
  getActiveRotation,
  getRotationAvailableGroups,
  getRotationAvailableSteps,
  getRotationDriverGroupBadge,
  getRotationDriverStepBadge,
  getRotationGroupOptions,
  hasRotationGroupFilter,
  hasRotationStepFilter,
} from "./rotation-filter.helper";

describe("rotation-filter.helper", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (key === "RD_FILTER_STEP_N") return `Step ${params?.n}`;
        if (key === "RD_FILTER_GROUP_N") return `Group ${params?.n}`;
        return key;
      },
    );
  });

  describe("hasRotationGroupFilter", () => {
    it("should return false when all heats are in group 0 or undefined", () => {
      const rot: LocalRotation = {
        heats: [{ group: 0 }, {}],
      };
      expect(hasRotationGroupFilter(rot)).toBeFalse();
    });

    it("should return true when any heat is in group 1 or higher", () => {
      const rot: LocalRotation = {
        heats: [{ group: 0 }, { group: 1 }],
      };
      expect(hasRotationGroupFilter(rot)).toBeTrue();
    });
  });

  describe("hasRotationStepFilter", () => {
    it("should return false when rotation has no step ups", () => {
      const rot: LocalRotation = {
        heats: [{ driverIndices: [1, 2], isStepUpBoundary: false }],
      };
      expect(hasRotationStepFilter(rot)).toBeFalse();
    });

    it("should return true when rotation has step up boundary", () => {
      const rot: LocalRotation = {
        heats: [{ driverIndices: [1, 2], isStepUpBoundary: true }],
      };
      expect(hasRotationStepFilter(rot)).toBeTrue();
    });

    it("should return true when rotation has negative driver index", () => {
      const rot: LocalRotation = {
        heats: [{ driverIndices: [-1, 2] }],
      };
      expect(hasRotationStepFilter(rot)).toBeTrue();
    });
  });

  describe("getRotationAvailableGroups and getRotationAvailableSteps", () => {
    it("should return groups and steps accurately", () => {
      const rot: LocalRotation = {
        heats: [
          { group: 0, step: 1 },
          { group: 1, step: 2 },
        ],
      };
      const groups = getRotationAvailableGroups(rot, mockTranslationService);
      expect(groups.length).toBe(2);
      expect(groups[0]).toEqual({ index: 0, name: "Group 1", count: 1 });
      expect(groups[1]).toEqual({ index: 1, name: "Group 2", count: 1 });

      const steps = getRotationAvailableSteps(rot, mockTranslationService);
      expect(steps.length).toBe(2);
      expect(steps[0]).toEqual({ step: 1, name: "Step 1", count: 1 });
      expect(steps[1]).toEqual({ step: 2, name: "Step 2", count: 1 });
    });
  });

  describe("getRotationGroupOptions", () => {
    it("should provide at least 4 options", () => {
      const rot: LocalRotation = { heats: [{ group: 0 }] };
      const options = getRotationGroupOptions(rot, mockTranslationService);
      expect(options.length).toBe(4);
      expect(options[0].name).toBe("Group 1");
    });
  });

  describe("filterRotationHeats", () => {
    it("should filter heats based on selectedGroup and selectedStep", () => {
      const heat1 = { group: 0, step: 1 };
      const heat2 = { group: 1, step: 1 };
      const heat3 = { group: 1, step: 2 };
      const rot: LocalRotation = {
        heats: [heat1, heat2, heat3],
        selectedGroup: 1,
        selectedStep: null,
      };

      expect(filterRotationHeats(rot)).toEqual([heat2, heat3]);

      rot.selectedStep = 2;
      expect(filterRotationHeats(rot)).toEqual([heat3]);
    });
  });

  describe("getRotationDriverGroupBadge and getRotationDriverStepBadge", () => {
    const rot: LocalRotation = {
      isExpanded: true,
      heats: [
        { driverIndices: [1, 2], group: 0, step: 1 },
        { driverIndices: [3, -1], group: 1, step: 2, isStepUpBoundary: true },
      ],
    };

    it("should return correct group and step badges for assigned drivers", () => {
      expect(getRotationDriverGroupBadge([rot], 1)).toBe("G1");
      expect(getRotationDriverStepBadge([rot], 1)).toBe("S1");

      expect(getRotationDriverGroupBadge([rot], 3)).toBe("G2");
      expect(getRotationDriverStepBadge([rot], 3)).toBe("S2");
    });

    it("should return null for unassigned or invalid drivers", () => {
      expect(getRotationDriverGroupBadge([rot], 99)).toBeNull();
      expect(getRotationDriverStepBadge([rot], 99)).toBeNull();
      expect(getRotationDriverGroupBadge([rot], null)).toBeNull();
      expect(getRotationDriverStepBadge([rot], -1)).toBeNull();
    });

    it("should return null when group or step-up filters are not active", () => {
      const basicRot: LocalRotation = {
        isExpanded: true,
        heats: [{ driverIndices: [1, 2], group: 0, step: 1 }],
      };
      expect(getRotationDriverGroupBadge([basicRot], 1)).toBeNull();
      expect(getRotationDriverStepBadge([basicRot], 1)).toBeNull();
    });

    it("should resolve active rotation from isExpanded or fallback to first", () => {
      const rot1: LocalRotation = {
        isExpanded: false,
        heats: [{ driverIndices: [1], group: 0 }],
      };
      const rot2: LocalRotation = {
        isExpanded: true,
        heats: [{ driverIndices: [2], group: 1 }],
      };
      expect(getActiveRotation([rot1, rot2])).toBe(rot2);
      expect(getActiveRotation([rot1])).toBe(rot1);
    });
  });
});
