import { TranslationService } from "@app/services/translation.service";

import {
  filterHeatsByGroupAndStep,
  getAvailableGroupsForRotation,
  getAvailableSteps,
  getHeatDividerInfo,
  getRotationGroupOptions,
  HeatLike,
  loadShowDividersPreference,
  loadShowGroupDividersPreference,
  loadShowStepDividersPreference,
  saveShowDividersPreference,
  saveShowGroupDividersPreference,
  saveShowStepDividersPreference,
  SHOW_DIVIDERS_STORAGE_KEY,
  SHOW_GROUP_DIVIDERS_STORAGE_KEY,
  SHOW_STEP_DIVIDERS_STORAGE_KEY,
} from "./heats-filter.utils";

describe("heats-filter.utils", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (key === "RD_FILTER_STEP_N") {
          return `Step ${params?.n}`;
        }
        if (key === "RD_STEP_LADDER_STEP") {
          return `Step ${params?.step}`;
        }
        if (key === "RD_FILTER_GROUP_N") {
          return `Group ${params?.n}`;
        }
        return key;
      },
    );
  });

  describe("getAvailableSteps", () => {
    it("should return empty array when heats are null or empty", () => {
      expect(getAvailableSteps([], mockTranslationService)).toEqual([]);
      expect(
        getAvailableSteps(
          null as unknown as HeatLike[],
          mockTranslationService,
        ),
      ).toEqual([]);
    });

    it("should return sorted distinct steps with counts", () => {
      const heats: HeatLike[] = [
        { step: 1 },
        { step: 2 },
        { step: 1 },
        { step: 3 },
      ];
      const result = getAvailableSteps(heats, mockTranslationService);
      expect(result).toEqual([
        { step: 1, name: "Step 1", count: 2 },
        { step: 2, name: "Step 2", count: 1 },
        { step: 3, name: "Step 3", count: 1 },
      ]);
    });

    it("should default missing step to 1", () => {
      const heats: HeatLike[] = [{}, { step: 2 }];
      const result = getAvailableSteps(heats, mockTranslationService);
      expect(result).toEqual([
        { step: 1, name: "Step 1", count: 1 },
        { step: 2, name: "Step 2", count: 1 },
      ]);
    });
  });

  describe("filterHeatsByGroupAndStep", () => {
    const heats: HeatLike[] = [
      { group: 0, step: 1 },
      { group: 0, step: 2 },
      { group: 1, step: 1 },
      { group: 1, step: 2 },
    ];

    it("should return all heats when both filters are null", () => {
      expect(filterHeatsByGroupAndStep(heats, null, null)).toEqual(heats);
    });

    it("should return empty array if heats are empty", () => {
      expect(filterHeatsByGroupAndStep([], 0, 1)).toEqual([]);
    });

    it("should filter by group only", () => {
      const filtered = filterHeatsByGroupAndStep(heats, 1, null);
      expect(filtered.length).toBe(2);
      expect(filtered.every((h) => h.group === 1)).toBeTrue();
    });

    it("should filter by step only", () => {
      const filtered = filterHeatsByGroupAndStep(heats, null, 2);
      expect(filtered.length).toBe(2);
      expect(filtered.every((h) => h.step === 2)).toBeTrue();
    });

    it("should filter by both group and step", () => {
      const filtered = filterHeatsByGroupAndStep(heats, 1, 2);
      expect(filtered.length).toBe(1);
      expect(filtered[0]).toEqual({ group: 1, step: 2 });
    });
  });

  describe("getAvailableGroupsForRotation", () => {
    it("should return empty array when heats are empty", () => {
      expect(getAvailableGroupsForRotation([], mockTranslationService)).toEqual(
        [],
      );
    });

    it("should calculate available groups up to max group index", () => {
      const heats: HeatLike[] = [
        { group: 0 },
        { group: 0 },
        { group: 2 }, // groups 0, 1, 2
      ];
      const groups = getAvailableGroupsForRotation(
        heats,
        mockTranslationService,
      );
      expect(groups).toEqual([
        { index: 0, name: "Group 1", count: 2 },
        { index: 1, name: "Group 2", count: 0 },
        { index: 2, name: "Group 3", count: 1 },
      ]);
    });
  });

  describe("getRotationGroupOptions", () => {
    it("should provide at least 4 group options when maxGroup is 0", () => {
      const heats: HeatLike[] = [{ group: 0 }];
      const options = getRotationGroupOptions(heats, mockTranslationService);
      expect(options.length).toBe(4);
      expect(options[0]).toEqual({ index: 0, name: "Group 1" });
      expect(options[3]).toEqual({ index: 3, name: "Group 4" });
    });

    it("should provide options extending past maxGroup when maxGroup is larger", () => {
      const heats: HeatLike[] = [{ group: 4 }];
      const options = getRotationGroupOptions(heats, mockTranslationService);
      expect(options.length).toBe(6); // maxGroup + 2 = 4 + 2 = 6
      expect(options[5]).toEqual({ index: 5, name: "Group 6" });
    });
  });

  describe("getHeatDividerInfo", () => {
    it("should return null for index <= 0 or index >= heats.length", () => {
      const heats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 1, step: 1 },
      ];
      expect(
        getHeatDividerInfo(heats, 0, true, true, mockTranslationService),
      ).toBeNull();
      expect(
        getHeatDividerInfo(heats, -1, true, true, mockTranslationService),
      ).toBeNull();
      expect(
        getHeatDividerInfo(heats, 2, true, true, mockTranslationService),
      ).toBeNull();
    });

    it("should return null when heats array is empty", () => {
      expect(
        getHeatDividerInfo([], 0, true, true, mockTranslationService),
      ).toBeNull();
    });

    it("should return null when neither step nor group changed", () => {
      const heats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 0, step: 1 },
      ];
      expect(
        getHeatDividerInfo(heats, 1, true, true, mockTranslationService),
      ).toBeNull();
    });

    it("should return null when group differs but hasGroups is false", () => {
      const heats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 1, step: 1 },
      ];
      expect(
        getHeatDividerInfo(heats, 1, false, false, mockTranslationService),
      ).toBeNull();
    });

    it("should return null when step differs but hasStepUps is false", () => {
      const heats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 0, step: 2 },
      ];
      expect(
        getHeatDividerInfo(heats, 1, false, false, mockTranslationService),
      ).toBeNull();
    });

    it("should return group divider info when group changes", () => {
      const heats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 1, step: 1 },
      ];
      const result = getHeatDividerInfo(
        heats,
        1,
        true,
        true,
        mockTranslationService,
      );
      expect(result).not.toBeNull();
      expect(result?.groupChanged).toBeTrue();
      expect(result?.stepChanged).toBeFalse();
      expect(result?.groupIndex).toBe(1);
      expect(result?.groupLabel).toBe("Group 2");
    });

    it("should use custom group name when getGroupName is provided", () => {
      const heats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 1, step: 1 },
      ];
      const result = getHeatDividerInfo(
        heats,
        1,
        true,
        true,
        mockTranslationService,
        (idx) => (idx === 1 ? "Custom Finalists" : ""),
      );
      expect(result?.groupLabel).toBe("Custom Finalists");
    });

    it("should return step divider info when step changes", () => {
      const heats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 0, step: 2 },
      ];
      const result = getHeatDividerInfo(
        heats,
        1,
        true,
        true,
        mockTranslationService,
      );
      expect(result).not.toBeNull();
      expect(result?.stepChanged).toBeTrue();
      expect(result?.groupChanged).toBeFalse();
      expect(result?.stepNumber).toBe(2);
      expect(result?.stepLabel).toBe("Step 2");
    });

    it("should return both step and group divider info when both change", () => {
      const heats: HeatLike[] = [
        { group: 1, step: 1 },
        { group: 0, step: 2 },
      ];
      const result = getHeatDividerInfo(
        heats,
        1,
        true,
        true,
        mockTranslationService,
      );
      expect(result).not.toBeNull();
      expect(result?.stepChanged).toBeTrue();
      expect(result?.groupChanged).toBeTrue();
      expect(result?.stepNumber).toBe(2);
      expect(result?.groupIndex).toBe(0);
      expect(result?.stepLabel).toBe("Step 2");
      expect(result?.groupLabel).toBe("Group 1");
    });

    it("should respect showStepDividers=false and showGroupDividers=true independently", () => {
      const heats: HeatLike[] = [
        { group: 1, step: 1 },
        { group: 0, step: 2 },
      ];
      // When showStepDividers is false, stepChanged is false and only groupChanged is true
      const result = getHeatDividerInfo(
        heats,
        1,
        true,
        true,
        mockTranslationService,
        undefined,
        false,
        true,
      );
      expect(result).not.toBeNull();
      expect(result?.stepChanged).toBeFalse();
      expect(result?.groupChanged).toBeTrue();
      expect(result?.groupLabel).toBe("Group 1");
      expect(result?.stepLabel).toBeUndefined();

      // Step change only with step dividers disabled should return null
      const stepOnlyHeats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 0, step: 2 },
      ];
      expect(
        getHeatDividerInfo(
          stepOnlyHeats,
          1,
          true,
          true,
          mockTranslationService,
          undefined,
          false,
          true,
        ),
      ).toBeNull();
    });

    it("should respect showStepDividers=true and showGroupDividers=false independently", () => {
      const heats: HeatLike[] = [
        { group: 1, step: 1 },
        { group: 0, step: 2 },
      ];
      // When showGroupDividers is false, groupChanged is false and only stepChanged is true
      const result = getHeatDividerInfo(
        heats,
        1,
        true,
        true,
        mockTranslationService,
        undefined,
        true,
        false,
      );
      expect(result).not.toBeNull();
      expect(result?.stepChanged).toBeTrue();
      expect(result?.groupChanged).toBeFalse();
      expect(result?.stepLabel).toBe("Step 2");
      expect(result?.groupLabel).toBeUndefined();

      // Group change only with group dividers disabled should return null
      const groupOnlyHeats: HeatLike[] = [
        { group: 0, step: 1 },
        { group: 1, step: 1 },
      ];
      expect(
        getHeatDividerInfo(
          groupOnlyHeats,
          1,
          true,
          true,
          mockTranslationService,
          undefined,
          true,
          false,
        ),
      ).toBeNull();
    });

    it("should return null when both showStepDividers and showGroupDividers are false", () => {
      const heats: HeatLike[] = [
        { group: 1, step: 1 },
        { group: 0, step: 2 },
      ];
      expect(
        getHeatDividerInfo(
          heats,
          1,
          true,
          true,
          mockTranslationService,
          undefined,
          false,
          false,
        ),
      ).toBeNull();
    });
  });

  describe("showDividersPreference", () => {
    afterEach(() => {
      localStorage.removeItem(SHOW_DIVIDERS_STORAGE_KEY);
      localStorage.removeItem(SHOW_GROUP_DIVIDERS_STORAGE_KEY);
      localStorage.removeItem(SHOW_STEP_DIVIDERS_STORAGE_KEY);
    });

    it("should default group dividers to true when no preference in localStorage", () => {
      expect(loadShowGroupDividersPreference()).toBeTrue();
    });

    it("should default step dividers to true when no preference in localStorage", () => {
      expect(loadShowStepDividersPreference()).toBeTrue();
    });

    it("should fallback to legacy key if specific keys absent", () => {
      localStorage.setItem(SHOW_DIVIDERS_STORAGE_KEY, "false");
      expect(loadShowGroupDividersPreference()).toBeFalse();
      expect(loadShowStepDividersPreference()).toBeFalse();
    });

    it("should save and load group divider preference independently", () => {
      saveShowGroupDividersPreference(false);
      expect(loadShowGroupDividersPreference()).toBeFalse();
      expect(loadShowStepDividersPreference()).toBeTrue();

      saveShowGroupDividersPreference(true);
      expect(loadShowGroupDividersPreference()).toBeTrue();
    });

    it("should save and load step divider preference independently", () => {
      saveShowStepDividersPreference(false);
      expect(loadShowStepDividersPreference()).toBeFalse();
      expect(loadShowGroupDividersPreference()).toBeTrue();

      saveShowStepDividersPreference(true);
      expect(loadShowStepDividersPreference()).toBeTrue();
    });

    it("should support legacy saveShowDividersPreference and loadShowDividersPreference", () => {
      saveShowDividersPreference(false);
      expect(loadShowDividersPreference()).toBeFalse();
      saveShowDividersPreference(true);
      expect(loadShowDividersPreference()).toBeTrue();
    });
  });
});
