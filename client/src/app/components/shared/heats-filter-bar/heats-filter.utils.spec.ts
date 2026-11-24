import { TranslationService } from "@app/services/translation.service";

import {
  filterHeatsByGroupAndStep,
  getAvailableGroupsForRotation,
  getAvailableSteps,
  getRotationGroupOptions,
  HeatLike,
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
});
