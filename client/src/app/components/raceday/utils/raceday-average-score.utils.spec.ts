import { FinishMethod, HeatRanking } from "@app/models/heat_scoring";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  getDriverEntityId,
  isFinishMethodTimed,
  isSameDriver,
  isScoringFastestLap,
  isScoringTotalTime,
  RacedayAverageScoreUtils,
} from "./raceday-average-score.utils";
import { FormatContext } from "./raceday-format.utils";

describe("RacedayAverageScoreUtils", () => {
  let ctx: FormatContext;
  let driver1Hd: DriverHeatData;
  let driver2Hd: DriverHeatData;

  beforeEach(() => {
    driver1Hd = {
      driver: { entity_id: "driver-1", name: "Alice" },
      actualDriver: { entity_id: "driver-1", name: "Alice" },
      lapCount: 10,
      bestLapTime: 5.2,
      totalTime: 52.0,
    } as any;

    driver2Hd = {
      driver: { entity_id: "driver-2", name: "Bob" },
      actualDriver: { entity_id: "driver-2", name: "Bob" },
      lapCount: 8,
      bestLapTime: 5.5,
      totalTime: 55.0,
    } as any;

    ctx = {
      translate: (key: string) => key,
      getRace: () =>
        ({
          heat_scoring: {
            heatRanking: HeatRanking.HR_LAP_COUNT,
            finishMethod: FinishMethod.Lap,
            finishValue: 10,
          },
        }) as any,
      laneViewWidgetSettings: {
        timeDecimalPlaces: 3,
        lapDecimalPlaces: 2,
      },
      isRaceOver: () => false,
      getHeats: () => [],
      getCurrentHeat: () => undefined,
      getSortedHeatDrivers: () => [],
      getHeatTime: () => 0,
    } as any;
  });

  describe("helper functions", () => {
    it("should resolve driver entity ID from various structures", () => {
      expect(getDriverEntityId(driver1Hd)).toBe("driver-1");
      expect(getDriverEntityId({ driver: { driverId: "d-123" } })).toBe(
        "d-123",
      );
      expect(getDriverEntityId({ participant: { entity_id: "p-456" } })).toBe(
        "p-456",
      );
      expect(getDriverEntityId({ id: "id-789" })).toBe("id-789");
      expect(getDriverEntityId(undefined)).toBeUndefined();
    });

    it("should determine if two drivers are the same cleanly", () => {
      expect(
        isSameDriver(driver1Hd, { driver: { entity_id: "driver-1" } }),
      ).toBeTrue();
      expect(isSameDriver(driver1Hd, driver2Hd)).toBeFalse();
      expect(isSameDriver(undefined, driver1Hd)).toBeFalse();

      // Team matching across heats with different teammates
      const teamGirlsHeat1 = {
        participant: {
          objectId: "part-girls-1",
          team: { entity_id: "t-girls", name: "The Girls" },
          driver: { entity_id: "d-virtual-girls", name: "The Girls" },
        },
        actualDriver: { entity_id: "d-abby", name: "Abby" },
      };
      const teamGirlsHeat2 = {
        participant: {
          objectId: "part-girls-1",
          team: { entity_id: "t-girls", name: "The Girls" },
          driver: { entity_id: "d-virtual-girls", name: "The Girls" },
        },
        actualDriver: { entity_id: "d-andrea", name: "The Pants" },
      };
      const teamBoysHeat1 = {
        participant: {
          objectId: "part-boys-1",
          team: { entity_id: "t-boys", name: "The Boys" },
          driver: { entity_id: "d-virtual-boys", name: "The Boys" },
        },
        actualDriver: { entity_id: "d-dave", name: "Bad Cheese" },
      };

      // Both belong to "The Girls" even though different actual drivers raced
      expect(isSameDriver(teamGirlsHeat1, teamGirlsHeat2)).toBeTrue();
      // Different teams do not match
      expect(isSameDriver(teamGirlsHeat1, teamBoysHeat1)).toBeFalse();
      // Team does not match individual driver
      expect(isSameDriver(teamGirlsHeat1, driver1Hd)).toBeFalse();

      // Matching by participant object ID
      expect(
        isSameDriver(
          { participant: { objectId: "p-abc" } },
          { participant: { objectId: "p-abc" } },
        ),
      ).toBeTrue();

      // Matching by intersection of IDs (actualDriver to driver)
      expect(
        isSameDriver(
          { actualDriver: { entity_id: "drv-special" } },
          { driver: { entity_id: "drv-special" } },
        ),
      ).toBeTrue();
    });

    it("should identify finish method and scoring methods", () => {
      expect(
        isFinishMethodTimed({ finishMethod: FinishMethod.Timed }),
      ).toBeTrue();
      expect(
        isFinishMethodTimed({ finishMethod: FinishMethod.Lap }),
      ).toBeFalse();
      expect(isFinishMethodTimed({ finish_method: 1 })).toBeTrue();

      expect(
        isScoringFastestLap({ heatRanking: HeatRanking.HR_FASTEST_LAP }),
      ).toBeTrue();
      expect(isScoringFastestLap({ heatRanking: 2 })).toBeTrue();
      expect(
        isScoringFastestLap({ heatRanking: HeatRanking.HR_LAP_COUNT }),
      ).toBeFalse();

      expect(
        isScoringTotalTime({ heatRanking: HeatRanking.HR_TOTAL_TIME }),
      ).toBeTrue();
      expect(isScoringTotalTime({ heatRanking: 3 })).toBeTrue();
      expect(
        isScoringTotalTime({ heatRanking: HeatRanking.HR_LAP_COUNT }),
      ).toBeFalse();
    });
  });

  describe("calculateAverageScore - Lap Count Scoring", () => {
    it("should return null for empty driver or overall data source", () => {
      expect(
        RacedayAverageScoreUtils.calculateAverageScore(null as any),
      ).toBeNull();
      expect(
        RacedayAverageScoreUtils.calculateAverageScore({
          isEmpty: true,
        } as any),
      ).toBeNull();
      expect(
        RacedayAverageScoreUtils.calculateAverageScore(driver1Hd, {
          gridType: "overall",
        }),
      ).toBeNull();
      expect(
        RacedayAverageScoreUtils.calculateAverageScore(driver1Hd, {
          bindingMode: "overallPosition",
        }),
      ).toBeNull();
    });

    it("should return null when driver has 0 completed heats", () => {
      const heats = [
        { heatNumber: 1, isCompleted: false, heatDrivers: [driver1Hd] },
      ];
      ctx.getHeats = () => heats;
      ctx.getCurrentHeat = () => heats[0];

      expect(
        RacedayAverageScoreUtils.calculateAverageScore(
          driver1Hd,
          {},
          undefined,
          ctx,
        ),
      ).toBeNull();
    });

    it("should calculate average laps across completed heats", () => {
      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [
            { driver: { entity_id: "driver-1" }, lapCount: 10 },
            { driver: { entity_id: "driver-2" }, lapCount: 8 },
          ],
        },
        {
          heatNumber: 2,
          isCompleted: true,
          heatDrivers: [
            { driver: { entity_id: "driver-1" }, lapCount: 12 },
            { driver: { entity_id: "driver-2" }, lapCount: 6 },
          ],
        },
        {
          heatNumber: 3,
          isCompleted: false,
          heatDrivers: [{ driver: { entity_id: "driver-1" }, lapCount: 5 }],
        },
      ];
      ctx.getHeats = () => heats;
      ctx.getCurrentHeat = () => heats[2];

      // Completed heats for driver-1: 10 + 12 = 22 laps over 2 heats -> 11.0
      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        {},
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(11.0, 4);

      // Completed heats for driver-2: 8 + 6 = 14 laps over 2 heats -> 7.0
      const score2 = RacedayAverageScoreUtils.calculateAverageScore(
        driver2Hd,
        {},
        undefined,
        ctx,
      );
      expect(score2).toBeCloseTo(7.0, 4);
    });

    it("should ignore completed heats where driver did not participate", () => {
      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [{ driver: { entity_id: "driver-1" }, lapCount: 10 }],
        },
        {
          heatNumber: 2,
          isCompleted: true,
          heatDrivers: [{ driver: { entity_id: "driver-2" }, lapCount: 8 }],
        },
      ];
      ctx.getHeats = () => heats;

      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        {},
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(10.0, 4);
    });
  });

  describe("calculateAverageScore - Fastest Lap & Total Time Scoring", () => {
    it("should calculate average fastest lap across completed heats", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: {
            heatRanking: HeatRanking.HR_FASTEST_LAP,
          },
        }) as any;

      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [
            { driver: { entity_id: "driver-1" }, bestLapTime: 5.0 },
          ],
        },
        {
          heatNumber: 2,
          isCompleted: true,
          heatDrivers: [
            { driver: { entity_id: "driver-1" }, bestLapTime: 4.8 },
          ],
        },
      ];
      ctx.getHeats = () => heats;

      // (5.0 + 4.8) / 2 = 4.9
      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        {},
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(4.9, 4);
    });

    it("should ignore heats with non-positive best lap time in fastest lap scoring", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: {
            heatRanking: HeatRanking.HR_FASTEST_LAP,
          },
        }) as any;

      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [
            { driver: { entity_id: "driver-1" }, bestLapTime: 5.0 },
          ],
        },
        {
          heatNumber: 2,
          isCompleted: true,
          heatDrivers: [{ driver: { entity_id: "driver-1" }, bestLapTime: 0 }],
        },
      ];
      ctx.getHeats = () => heats;

      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        {},
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(5.0, 4);
    });

    it("should calculate average total time across completed heats", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: {
            heatRanking: HeatRanking.HR_TOTAL_TIME,
          },
        }) as any;

      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [{ driver: { entity_id: "driver-1" }, totalTime: 60.0 }],
        },
        {
          heatNumber: 2,
          isCompleted: true,
          heatDrivers: [{ driver: { entity_id: "driver-1" }, totalTime: 50.0 }],
        },
      ];
      ctx.getHeats = () => heats;

      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        {},
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(55.0, 4);
    });
  });

  describe("calculateAverageScore - Partial Heats Configuration", () => {
    it("should weight the partial heat based on lead driver progress", () => {
      const activeHeat = {
        heatNumber: 2,
        isCompleted: false,
        heatDrivers: [
          { driver: { entity_id: "driver-1" }, lapCount: 4 },
          { driver: { entity_id: "driver-2" }, lapCount: 3 },
        ],
      };

      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [{ driver: { entity_id: "driver-1" }, lapCount: 10 }],
        },
        activeHeat,
      ];

      ctx.getHeats = () => heats;
      ctx.getCurrentHeat = () => activeHeat;
      ctx.getSortedHeatDrivers = () => activeHeat.heatDrivers as any;

      // 10 lap race, lead driver is on lap 4 -> progress = 4 / 10 = 0.4
      // Without partial heats: completed heats = 1 -> score = 10.0
      const scoreWithout = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: false },
        undefined,
        ctx,
      );
      expect(scoreWithout).toBeCloseTo(10.0, 4);

      // With partial heats:
      // Numerator: 10 + 4 = 14
      // Denominator: 1.0 + 0.4 = 1.4
      // Average: 14 / 1.4 = 10.0
      const scoreWith = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: true },
        undefined,
        ctx,
      );
      expect(scoreWith).toBeCloseTo(10.0, 4);
    });

    it("should support partial heats when driver had 0 completed heats", () => {
      const activeHeat = {
        heatNumber: 1,
        isCompleted: false,
        heatDrivers: [{ driver: { entity_id: "driver-1" }, lapCount: 2 }],
      };

      ctx.getHeats = () => [activeHeat];
      ctx.getCurrentHeat = () => activeHeat;
      ctx.getSortedHeatDrivers = () => activeHeat.heatDrivers as any;

      // 10 lap race, driver on lap 2 -> progress = 0.2
      // Numerator: 2, Denominator: 0.2 -> Average = 10.0
      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: true },
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(10.0, 4);
    });

    it("should ignore partial heat if finishValue is 0 or unconfigured", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: {
            heatRanking: HeatRanking.HR_LAP_COUNT,
            finishMethod: FinishMethod.Lap,
            finishValue: 0,
          },
        }) as any;

      const activeHeat = {
        heatNumber: 1,
        isCompleted: false,
        heatDrivers: [{ driver: { entity_id: "driver-1" }, lapCount: 4 }],
      };
      ctx.getHeats = () => [activeHeat];
      ctx.getCurrentHeat = () => activeHeat;

      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: true },
        undefined,
        ctx,
      );
      expect(score).toBeNull();
    });

    it("should not count partial heat for resting driver not in current heat", () => {
      const activeHeat = {
        heatNumber: 2,
        isCompleted: false,
        heatDrivers: [{ driver: { entity_id: "driver-2" }, lapCount: 4 }],
      };

      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [{ driver: { entity_id: "driver-1" }, lapCount: 10 }],
        },
        activeHeat,
      ];

      ctx.getHeats = () => heats;
      ctx.getCurrentHeat = () => activeHeat;
      ctx.getSortedHeatDrivers = () => activeHeat.heatDrivers as any;

      // driver-1 is resting in heat 2, so partial heat doesn't count for driver-1
      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: true },
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(10.0, 4);
    });

    it("should weight partial heat in timed races based on elapsed time", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: {
            heatRanking: HeatRanking.HR_TOTAL_TIME,
            finishMethod: FinishMethod.Timed,
            finishValue: 60,
          },
        }) as any;

      ctx.getHeatTime = () => 30; // 30s elapsed out of 60s -> progress = 0.5

      const activeHeat = {
        heatNumber: 2,
        isCompleted: false,
        heatDrivers: [{ driver: { entity_id: "driver-1" }, totalTime: 30.0 }],
      };

      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [{ driver: { entity_id: "driver-1" }, totalTime: 60.0 }],
        },
        activeHeat,
      ];

      ctx.getHeats = () => heats;
      ctx.getCurrentHeat = () => activeHeat;

      // Numerator: 60 + 30 = 90
      // Denominator: 1.0 + 0.5 = 1.5
      // Average: 90 / 1.5 = 60.0
      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: true },
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(60.0, 4);
    });

    it("should weight partial heat in fastest lap scoring", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: {
            heatRanking: HeatRanking.HR_FASTEST_LAP,
            finishMethod: FinishMethod.Lap,
            finishValue: 10,
          },
        }) as any;

      const activeHeat = {
        heatNumber: 2,
        isCompleted: false,
        heatDrivers: [
          { driver: { entity_id: "driver-1" }, bestLapTime: 4.8, lapCount: 4 },
        ],
      };

      const heats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [
            { driver: { entity_id: "driver-1" }, bestLapTime: 5.0 },
          ],
        },
        activeHeat,
      ];

      ctx.getHeats = () => heats;
      ctx.getCurrentHeat = () => activeHeat;
      ctx.getSortedHeatDrivers = () => activeHeat.heatDrivers as any;

      // progress = 0.4
      // Numerator: 5.0 * 1.0 + 4.8 * 0.4 = 5.0 + 1.92 = 6.92
      // Denominator: 1.0 + 0.4 = 1.4
      // Average: 6.92 / 1.4 = 4.942857...
      const score = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: true },
        undefined,
        ctx,
      );
      expect(score).toBeCloseTo(4.9428, 3);
    });

    it("should read showPartialHeats from insetConfig if anchor is provided", () => {
      const activeHeat = {
        heatNumber: 1,
        isCompleted: false,
        heatDrivers: [{ driver: { entity_id: "driver-1" }, lapCount: 2 }],
      };
      ctx.getHeats = () => [activeHeat];
      ctx.getCurrentHeat = () => activeHeat;
      ctx.getSortedHeatDrivers = () => activeHeat.heatDrivers as any;

      const settings = {
        showPartialHeats: false,
        insetsConfig: {
          "top-left": { showPartialHeats: true },
        },
      };

      const scoreInset = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        settings,
        "top-left",
        ctx,
      );
      expect(scoreInset).toBeCloseTo(10.0, 4);

      const scoreMain = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        settings,
        "center-center",
        ctx,
      );
      expect(scoreMain).toBeNull();
    });
  });

  describe("formatAverageScore", () => {
    it("should return placeholder for null or undefined value", () => {
      expect(
        RacedayAverageScoreUtils.formatAverageScore(
          null,
          driver1Hd,
          undefined,
          ctx,
          3,
          2,
          "--.---",
          "--.--",
          "averageScore",
          false,
        ),
      ).toBe("--.--");

      ctx.getRace = () =>
        ({
          heat_scoring: { heatRanking: HeatRanking.HR_FASTEST_LAP },
        }) as any;

      expect(
        RacedayAverageScoreUtils.formatAverageScore(
          undefined,
          driver1Hd,
          undefined,
          ctx,
          3,
          2,
          "--.---",
          "--.--",
          "averageScore",
          false,
        ),
      ).toBe("--.---");
    });

    it("should format lap count scoring with lapDecimals", () => {
      const result = RacedayAverageScoreUtils.formatAverageScore(
        10.456,
        driver1Hd,
        undefined,
        ctx,
        3,
        2,
        "--.---",
        "--.--",
        "averageScore",
        false,
      );
      expect(result).toBe("10.46");
    });

    it("should format fastest lap scoring with timeDecimals", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: { heatRanking: HeatRanking.HR_FASTEST_LAP },
        }) as any;

      const result = RacedayAverageScoreUtils.formatAverageScore(
        5.1234,
        driver1Hd,
        undefined,
        ctx,
        3,
        2,
        "--.---",
        "--.--",
        "averageScore",
        false,
      );
      expect(result).toBe("5.123");
    });

    it("should format total time scoring with timeDecimals", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: { heatRanking: HeatRanking.HR_TOTAL_TIME },
        }) as any;

      const result = RacedayAverageScoreUtils.formatAverageScore(
        55.6789,
        driver1Hd,
        undefined,
        ctx,
        2,
        2,
        "--.--",
        "--.--",
        "averageScore",
        false,
      );
      expect(result).toBe("55.68");
    });

    it("should count heat as completed when raceState is HEAT_OVER even if curHeatNum === heat.heatNumber", () => {
      const heat1 = {
        heatNumber: 1,
        heatDrivers: [
          {
            driver: { entity_id: "driver-1" },
            lapCount: 15,
            bestLapTime: 4.8,
            totalTime: 48.0,
          },
        ],
      };
      ctx.getCurrentHeat = () => ({ heatNumber: 1 }) as any;
      ctx.getHeats = () => [heat1 as any];
      ctx.raceState = 5; // HEAT_OVER

      const avg = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: false },
        undefined,
        ctx,
      );
      expect(avg).toBe(15);
    });

    it("should count heat as completed when driver isFinished is true", () => {
      const heat1 = {
        heatNumber: 1,
        heatDrivers: [
          {
            driver: { entity_id: "driver-1" },
            lapCount: 20,
            bestLapTime: 4.5,
            totalTime: 45.0,
            isFinished: true,
          },
        ],
      };
      ctx.getCurrentHeat = () => ({ heatNumber: 1 }) as any;
      ctx.getHeats = () => [heat1 as any];

      const avg = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: false },
        undefined,
        ctx,
      );
      expect(avg).toBe(20);
    });

    it("should dynamically inject currentHeat into heats if heats is missing currentHeat", () => {
      const heat1 = {
        heatNumber: 1,
        heatDrivers: [
          {
            driver: { entity_id: "driver-1" },
            lapCount: 12,
            isFinished: true,
          },
        ],
      };
      ctx.getCurrentHeat = () => heat1 as any;
      ctx.getHeats = () => []; // heats is empty

      const avg = RacedayAverageScoreUtils.calculateAverageScore(
        driver1Hd,
        { showPartialHeats: false },
        undefined,
        ctx,
      );
      expect(avg).toBe(12);
    });

    it("should correctly calculate average score for team entries in subsequent heats with rotated teammates", () => {
      // Heat 1 was completed: teammate Abby ran for "The Girls" and completed 5 laps
      const heat1 = {
        heatNumber: 1,
        isCompleted: true,
        heatDrivers: [
          {
            objectId: "hd-heat1-lane2",
            participant: {
              objectId: "part-girls",
              team: { entity_id: "t-girls", name: "The Girls" },
              driver: { entity_id: "virtual-girls", name: "The Girls" },
            },
            actualDriver: {
              entity_id: "d-abby",
              name: "Abby",
              nickname: "Abby",
            },
            lapCount: 5,
            isFinished: true,
          },
          {
            objectId: "hd-heat1-lane3",
            participant: {
              objectId: "part-boys",
              team: { entity_id: "t-boys", name: "The Boys" },
              driver: { entity_id: "virtual-boys", name: "The Boys" },
            },
            actualDriver: { entity_id: "d-austin", name: "Austin" },
            lapCount: 4,
            isFinished: true,
          },
        ],
      };

      // Heat 2 is currently active: teammate Andrea ("The Pants") is in lane 2 for "The Girls"
      const heat2ThePantsHd = {
        objectId: "hd-heat2-lane2",
        participant: {
          objectId: "part-girls",
          team: { entity_id: "t-girls", name: "The Girls" },
          driver: { entity_id: "virtual-girls", name: "The Girls" },
        },
        actualDriver: {
          entity_id: "d-andrea",
          name: "Andrea",
          nickname: "The Pants",
        },
        lapCount: 0,
        isFinished: false,
      } as any;

      const heat2 = {
        heatNumber: 2,
        isCompleted: false,
        heatDrivers: [heat2ThePantsHd],
      };

      ctx.getCurrentHeat = () => heat2 as any;
      ctx.getHeats = () => [heat1, heat2] as any[];

      // Even before Heat 2 has completed or made progress, "The Pants" should show 5.0 (from Heat 1)
      const avg = RacedayAverageScoreUtils.calculateAverageScore(
        heat2ThePantsHd,
        { showPartialHeats: false },
        undefined,
        ctx,
      );
      expect(avg).toBe(5);

      // Now suppose partial heats is enabled and Heat 2 is underway (finishValue 10, leader on lap 4)
      heat2ThePantsHd.lapCount = 4;
      const avgPartial = RacedayAverageScoreUtils.calculateAverageScore(
        heat2ThePantsHd,
        { showPartialHeats: true },
        undefined,
        ctx,
      );
      // denominator: 1.0 (heat 1) + 0.4 (heat 2) = 1.4
      // score: 5.0 (heat 1) + 4.0 (heat 2) = 9.0
      // avg: 9.0 / 1.4 = 6.4285714
      expect(avgPartial).toBeCloseTo(9 / 1.4, 4);
    });
  });
});
