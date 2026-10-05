import { TranslationService } from "@app/services/translation.service";

import { checkLaneEquality } from "./lane-equality";

describe("checkLaneEquality", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => {
      if (key === "AM_LABEL_HEAT_SINGULAR") return "singular_heat";
      if (key === "AM_LABEL_HEAT_PLURAL") return "plural_heats";
      return key;
    });
  });

  it("should return AM_REPORT_NO_DRIVERS if there are no drivers", () => {
    const result = checkLaneEquality(4, [], [["d1", null, null, null]]);
    expect(result.allEqual).toBeFalse();
    expect(result.reports).toEqual([{ key: "AM_REPORT_NO_DRIVERS" }]);
  });

  it("should return AM_REPORT_NO_DRIVERS if there are no heats", () => {
    const result = checkLaneEquality(4, ["d1"], []);
    expect(result.allEqual).toBeFalse();
    expect(result.reports).toEqual([{ key: "AM_REPORT_NO_DRIVERS" }]);
  });

  it("should return AM_REPORT_ALL_EQUAL when all drivers have equal lane assignments", () => {
    const driverIds = ["d1", "d2"];
    const heats = [
      ["d1", "d2"],
      ["d2", "d1"],
    ];
    const result = checkLaneEquality(2, driverIds, heats);
    expect(result.allEqual).toBeTrue();
    expect(result.reports).toEqual([{ key: "AM_REPORT_ALL_EQUAL" }]);
  });

  it("should report empty heats", () => {
    const driverIds = ["d1", "d2"];
    const heats = [
      ["d1", "d2"],
      [null, null],
    ];
    const result = checkLaneEquality(2, driverIds, heats);
    expect(result.allEqual).toBeFalse();
    expect(result.reports).toContain(
      jasmine.objectContaining({
        key: "AM_REPORT_EMPTY_HEAT",
        params: { heat: 2 },
      }),
    );
  });

  it("should report invalid drivers in heats", () => {
    const driverIds = ["d1"];
    const heats = [
      ["d1", "d2"], // d2 is not in driverIds list
    ];
    const result = checkLaneEquality(2, driverIds, heats);
    expect(result.allEqual).toBeFalse();
    expect(result.reports).toContain(
      jasmine.objectContaining({
        key: "AM_REPORT_INVALID_DRIVER",
        params: { heat: 1, driver: "d2" },
      }),
    );
  });

  it("should report lane differences when assignments are unequal", () => {
    const driverIds = ["d1", "d2"];
    const heats = [
      ["d1", "d2"],
      ["d1", "d2"], // d1 is on lane 1 twice, d2 is on lane 2 twice
    ];
    const result = checkLaneEquality(
      2,
      driverIds,
      heats,
      undefined,
      mockTranslationService,
    );
    expect(result.allEqual).toBeFalse();
    const laneDiffReport = result.reports.find(
      (r) => r.key === "AM_REPORT_LANE_DIFF",
    );
    expect(laneDiffReport).toBeDefined();
    expect(laneDiffReport?.params).toEqual(
      jasmine.objectContaining({
        lane: 1,
        d1: "d1",
        count1: 2,
        heat1: "plural_heats",
        d2: "d2",
        count2: 0,
        heat2: "plural_heats",
      }),
    );
  });

  it("should return AM_REPORT_NO_DRIVERS if total assignments is 0", () => {
    const driverIds = ["d1", "d2"];
    const heats = [
      [null, null],
      [null, null],
    ];
    const result = checkLaneEquality(2, driverIds, heats);
    expect(result.allEqual).toBeFalse();
    expect(result.reports).toContain(
      jasmine.objectContaining({
        key: "AM_REPORT_NO_DRIVERS",
      }),
    );
  });

  it("should summarize single driver deviation against majority count in a 20-driver race", () => {
    // 20 drivers: 19 drivers race 1 heat on lane 1, while driver 1 races 0 heats
    const driverIds: string[] = [];
    const driverNames = new Map<string, string>();
    for (let i = 1; i <= 20; i++) {
      const id = `driver-${i}`;
      driverIds.push(id);
      driverNames.set(id, `Driver ${i}`);
    }

    // Heats where drivers 2..20 are on lane 1 once, but Driver 1 is not on lane 1
    const heats: (string | null)[][] = [];
    for (let i = 2; i <= 20; i++) {
      heats.push([`driver-${i}`, null]);
    }

    const result = checkLaneEquality(
      2,
      driverIds,
      heats,
      driverNames,
      mockTranslationService,
    );

    expect(result.allEqual).toBeFalse();
    // Lane 1 should have exactly ONE summarized report for Driver 1 instead of 19 pairwise comparisons
    const lane1Reports = result.reports.filter((r) => r.params?.lane === 1);
    expect(lane1Reports.length).toBe(1);
    expect(lane1Reports[0].key).toBe("AM_REPORT_LANE_DIFF_SINGLE");
    expect(lane1Reports[0].params).toEqual(
      jasmine.objectContaining({
        lane: 1,
        driver: "Driver 1",
        count: 0,
        heatLabel: "plural_heats",
        expectedCount: 1,
        expectedHeatLabel: "singular_heat",
      }),
    );
  });

  it("should cleanly summarize swapped drivers in multi-driver races without pairwise combinatorial explosion", () => {
    // 20 drivers: Swap Driver 1 (Lane 1) and Driver 2 (Lane 2) in Heat 1
    // Lane 1: Driver 1 has 0 heats, Driver 2 has 2 heats, Drivers 3..20 have 1 heat
    // Lane 2: Driver 2 has 0 heats, Driver 1 has 2 heats, Drivers 3..20 have 1 heat
    const driverIds: string[] = [];
    const driverNames = new Map<string, string>();
    for (let i = 1; i <= 20; i++) {
      const id = `driver-${i}`;
      driverIds.push(id);
      driverNames.set(id, `Driver ${i}`);
    }

    const heats: (string | null)[][] = [
      // Heat 1: swapped (Driver 2 in Lane 1, Driver 1 in Lane 2)
      ["driver-2", "driver-1"],
      // Heats 2..10: Drivers 3..20 on Lane 1 and Lane 2
      ...Array.from({ length: 9 }, (_, idx) => [
        `driver-${3 + idx * 2}`,
        `driver-${4 + idx * 2}`,
      ]),
      // Heats 11..20: Inverted lanes so each driver races in other lane
      ...Array.from({ length: 10 }, (_, idx) => [
        `driver-${2 + idx * 2}`,
        `driver-${1 + idx * 2}`,
      ]),
    ];

    const result = checkLaneEquality(
      2,
      driverIds,
      heats,
      driverNames,
      mockTranslationService,
    );

    expect(result.allEqual).toBeFalse();
    // Lane 1 has 2 deviations (Driver 1 has 0, Driver 2 has 2; baseline is 1 heat)
    const lane1Reports = result.reports.filter((r) => r.params?.lane === 1);
    expect(lane1Reports.length).toBe(2);
    expect(lane1Reports[0]).toEqual(
      jasmine.objectContaining({
        key: "AM_REPORT_LANE_DIFF_SINGLE",
        params: jasmine.objectContaining({
          lane: 1,
          driver: "Driver 1",
          count: 0,
          expectedCount: 1,
        }),
      }),
    );
    expect(lane1Reports[1]).toEqual(
      jasmine.objectContaining({
        key: "AM_REPORT_LANE_DIFF_SINGLE",
        params: jasmine.objectContaining({
          lane: 1,
          driver: "Driver 2",
          count: 2,
          expectedCount: 1,
        }),
      }),
    );

    // Lane 2 has 2 deviations (Driver 2 has 0, Driver 1 has 2; baseline is 1 heat)
    const lane2Reports = result.reports.filter((r) => r.params?.lane === 2);
    expect(lane2Reports.length).toBe(2);
    expect(lane2Reports[0]).toEqual(
      jasmine.objectContaining({
        key: "AM_REPORT_LANE_DIFF_SINGLE",
        params: jasmine.objectContaining({
          lane: 2,
          driver: "Driver 2",
          count: 0,
          expectedCount: 1,
        }),
      }),
    );
    expect(lane2Reports[1]).toEqual(
      jasmine.objectContaining({
        key: "AM_REPORT_LANE_DIFF_SINGLE",
        params: jasmine.objectContaining({
          lane: 2,
          driver: "Driver 1",
          count: 2,
          expectedCount: 1,
        }),
      }),
    );
  });

  it("should summarize multiple drivers sharing the same deviation with AM_REPORT_LANE_DIFF_MULTIPLE", () => {
    // 5 drivers: Driver 1 and Driver 2 have 0 heats on Lane 1, while Drivers 3, 4, 5 have 1 heat
    const driverIds = ["d1", "d2", "d3", "d4", "d5"];
    const driverNames = new Map([
      ["d1", "Alice"],
      ["d2", "Bob"],
      ["d3", "Charlie"],
      ["d4", "Dave"],
      ["d5", "Eve"],
    ]);

    const heats = [
      ["d3", null],
      ["d4", null],
      ["d5", null],
    ];

    const result = checkLaneEquality(
      1,
      driverIds,
      heats,
      driverNames,
      mockTranslationService,
    );

    expect(result.allEqual).toBeFalse();
    expect(result.reports.length).toBe(1);
    expect(result.reports[0].key).toBe("AM_REPORT_LANE_DIFF_MULTIPLE");
    expect(result.reports[0].params).toEqual(
      jasmine.objectContaining({
        lane: 1,
        drivers: "Alice, Bob",
        count: 0,
        expectedCount: 1,
      }),
    );
  });
});
