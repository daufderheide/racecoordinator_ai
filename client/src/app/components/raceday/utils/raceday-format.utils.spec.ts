import { RaceFlag } from "@app/proto/antigravity";

import { DriverHeatData } from "../../../race/driver_heat_data";
import { FormatContext, RacedayFormatUtils } from "./raceday-format.utils";

describe("RacedayFormatUtils", () => {
  let ctx: FormatContext;
  let hd: DriverHeatData;

  beforeEach(() => {
    ctx = {
      translate: (key: string) => {
        if (key === "RD_LAP_DOWN") return "+{{count}} Lap";
        if (key === "RD_LAPS_DOWN") return "+{{count}} Laps";
        return key;
      },
      laneViewWidgetSettings: {
        timeDecimalPlaces: 3,
        insetTimeDecimalPlaces: 3,
        lapDecimalPlaces: 2,
        insetLapDecimalPlaces: 2,
      } as any,
    } as any;

    hd = {
      lapsDownLeader: 0,
      lapsDownPosition: 0,
      actualDriver: { name: "Test" },
    } as DriverHeatData;
  });

  describe("formatValue - F1 Gaps", () => {
    it("should format gapLeaderF1 as time when lapsDownLeader is 0", () => {
      hd.lapsDownLeader = 0;
      const result = RacedayFormatUtils.formatValue(
        "gapLeaderF1",
        1.25,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("+1.250");
    });

    it("should format gapLeaderF1 with RD_LAP_DOWN when lapsDownLeader is 1", () => {
      hd.lapsDownLeader = 1;
      const result = RacedayFormatUtils.formatValue(
        "gapLeaderF1",
        0,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("+1 Lap");
    });

    it("should format gapLeaderF1 with RD_LAPS_DOWN when lapsDownLeader is > 1", () => {
      hd.lapsDownLeader = 2;
      const result = RacedayFormatUtils.formatValue(
        "gapLeaderF1",
        0,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("+2 Laps");
    });

    it("should format gapPositionF1 as time when lapsDownPosition is 0", () => {
      hd.lapsDownPosition = 0;
      const result = RacedayFormatUtils.formatValue(
        "gapPositionF1",
        0.5,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("+0.500");
    });

    it("should format gapPositionF1 with RD_LAP_DOWN when lapsDownPosition is 1", () => {
      hd.lapsDownPosition = 1;
      const result = RacedayFormatUtils.formatValue(
        "gapPositionF1",
        0,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("+1 Lap");
    });

    it("should format gapPositionF1 with RD_LAPS_DOWN when lapsDownPosition is > 1", () => {
      hd.lapsDownPosition = 3;
      const result = RacedayFormatUtils.formatValue(
        "gapPositionF1",
        0,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("+3 Laps");
    });

    it("should format gapLeaderF1 as placeholder when value is 0 and lapsDownLeader is 0", () => {
      hd.lapsDownLeader = 0;
      // When the gap is exactly 0 and lapsDown is 0, it means they are the leader (or tied for leader).
      // Based on the logic, `value === 0` returns `timePlaceholder` ("-").
      // Wait, let's look at the implementation:
      // if (value === 0) return timePlaceholder;
      // timePlaceholder is "-" when there's no format placeholder passed in.
      const result = RacedayFormatUtils.formatValue(
        "gapLeaderF1",
        0,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("--.---");
    });
  });

  describe("formatValue - Predictions", () => {
    it("should return -- without % sign for empty lane", () => {
      const mockHd = { actualDriver: null } as any;
      const result = RacedayFormatUtils.formatValue(
        "winProbability",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("--");
    });

    it("should return --% if prob is less than 0 for valid driver", () => {
      const mockHd = {
        actualDriver: { name: "Driver 1" },
        winProbability: -1,
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "winProbability",
        -1,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("--%");
    });

    it("should return the formatted percentage if prob is valid", () => {
      const mockHd = { winProbability: 0.85 } as any;
      const result = RacedayFormatUtils.formatValue(
        "winProbability",
        0.85,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("85%");
    });

    it("should return projected laps if type is laps", () => {
      const mockHd = { projectedLaps: 12.5 } as any;
      const result = RacedayFormatUtils.formatValue(
        "projectedLaps",
        12.5,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("12.5");
    });

    it("should return -- if projected laps is less than 0", () => {
      const mockHd = { projectedLaps: -1.0 } as any;
      const result = RacedayFormatUtils.formatValue(
        "projectedLaps",
        -1.0,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("--");
    });

    it("should return -- if projected rank is less than 0", () => {
      const mockHd = { projectedRank: -1 } as any;
      const result = RacedayFormatUtils.formatValue(
        "projectedRank",
        -1,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("--");
    });
  });

  describe("formatValue - lapsLed", () => {
    it("should format lapsLed properly for valid driver", () => {
      const mockHd = {
        lapsLed: 8,
        actualDriver: { name: "Driver 1" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "lapsLed",
        8,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("8");
    });

    it("should read lapsLed from DriverHeatData if value is null", () => {
      const mockHd = {
        lapsLed: 5,
        actualDriver: { name: "Driver 1" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "lapsLed",
        null,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("5");
    });

    it("should return 0 for a valid driver with 0 laps led", () => {
      const mockHd = {
        lapsLed: 0,
        actualDriver: { name: "Driver 1" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "lapsLed",
        0,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("0");
    });

    it("should return -- for empty driver with EMPTY_LANE id", () => {
      const mockHd = {
        lapsLed: 0,
        actualDriver: { entity_id: "EMPTY_LANE", name: "Empty" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "lapsLed",
        0,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("--");
    });

    it("should return -- for empty lane without driver or with isEmpty flag", () => {
      const mockHd1 = {
        lapsLed: 0,
      } as any;
      expect(
        RacedayFormatUtils.formatValue("lapsLed", 0, mockHd1, undefined, ctx),
      ).toBe("--");

      const mockHd2 = {
        lapsLed: 0,
        isEmpty: true,
      } as any;
      expect(
        RacedayFormatUtils.formatValue("lapsLed", 0, mockHd2, undefined, ctx),
      ).toBe("--");

      const mockHd3 = {
        lapsLed: 0,
        participant: { driver: { name: "Empty", entity_id: "EMPTY_LANE" } },
      } as any;
      expect(
        RacedayFormatUtils.formatValue("lapsLed", 0, mockHd3, undefined, ctx),
      ).toBe("--");
    });
  });

  describe("formatValue - Ghost Pacing", () => {
    it("should format delta correctly when driver is faster than ghost", () => {
      const mockHd = {
        actualDriver: { name: "Driver A" },
        ghostLapTime: 5.0,
        lastLapTime: 4.8,
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "ghostPacing",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("+0.200s");
    });

    it("should format delta correctly when driver is slower than ghost", () => {
      const mockHd = {
        actualDriver: { name: "Driver A" },
        ghostLapTime: 5.0,
        lastLapTime: 5.3,
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "ghostPacing",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("-0.300s");
    });

    it("should return -- for empty driver or missing ghost lap", () => {
      const mockHd = {
        isEmpty: true,
      } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "ghostPacing",
          undefined,
          mockHd,
          undefined,
          ctx,
        ),
      ).toBe("--");
      expect(
        RacedayFormatUtils.formatValue(
          "ghostPacingPB",
          undefined,
          mockHd,
          undefined,
          ctx,
        ),
      ).toBe("--");
      expect(
        RacedayFormatUtils.formatValue(
          "ghostPacingLeaderAvg",
          undefined,
          mockHd,
          undefined,
          ctx,
        ),
      ).toBe("--");
    });
  });

  describe("formatValue - recordLapTime", () => {
    it("should format recordLapTime with time, nickname, and date", () => {
      ctx.getLaneRecordEntry = (laneIndex: number) => {
        if (laneIndex === 0) {
          return {
            value: 5.1234,
            holderNickname: "Speedy",
            date: new Date(2026, 7, 21).getTime(),
          };
        }
        return undefined;
      };

      const mockHd = {
        laneIndex: 0,
        actualDriver: { name: "Speedy" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "recordLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("5.123 (Speedy, 8/21/26)");
    });

    it("should use ctx.formatDate when provided on ctx", () => {
      ctx.getLaneRecordEntry = () => ({
        value: 5.123,
        holderNickname: "Speedy",
        date: new Date(2026, 7, 21).getTime(),
      });
      ctx.formatDate = (_ms: any) => "21/08/2026";

      const mockHd = {
        laneIndex: 0,
        actualDriver: { name: "Speedy" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "recordLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("5.123 (Speedy, 21/08/2026)");
    });

    it("should fallback to holderName if nickname is not provided", () => {
      ctx.getLaneRecordEntry = () => ({
        value: 4.56,
        holderName: "Alice Smith",
        date: new Date(2025, 0, 15).getTime(),
      });

      const mockHd = {
        laneIndex: 1,
        actualDriver: { name: "Alice" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "recordLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("4.560 (Alice Smith, 1/15/25)");
    });

    it("should handle date as object with toNumber", () => {
      ctx.getLaneRecordEntry = () => ({
        value: 4.56,
        holderNickname: "Racer",
        date: { toNumber: () => new Date(2025, 5, 10).getTime() },
      });

      const mockHd = {
        laneIndex: 0,
        actualDriver: { name: "Racer" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "recordLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("4.560 (Racer, 6/10/25)");
    });

    it("should return placeholder format when no record exists", () => {
      ctx.getLaneRecordEntry = () => undefined;

      const mockHd = {
        laneIndex: 0,
        actualDriver: { name: "Driver 1" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "recordLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("--.--- (---, ---)");
    });

    it("should return -- for empty driver or empty lane", () => {
      const mockHd1 = { laneIndex: 0, isEmpty: true } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "recordLapTime",
          undefined,
          mockHd1,
          undefined,
          ctx,
        ),
      ).toBe("--");

      const mockHd2 = {
        laneIndex: 0,
        actualDriver: { entity_id: "EMPTY_LANE", name: "Empty" },
      } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "recordLapTime",
          undefined,
          mockHd2,
          undefined,
          ctx,
        ),
      ).toBe("--");

      const mockHd3 = { laneIndex: 0 } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "recordLapTime",
          undefined,
          mockHd3,
          undefined,
          ctx,
        ),
      ).toBe("--");
    });
  });

  describe("formatValue - bestRaceLapTime", () => {
    beforeEach(() => {
      ctx.translate = (key: string) => (key === "RD_HEAT" ? "Heat" : key);
    });

    it("should format bestRaceLapTime with time, nickname, and heat", () => {
      ctx.getBestRaceLapEntry = (laneIndex: number) => {
        if (laneIndex === 0) {
          return {
            value: 4.8765,
            holderNickname: "Speedy",
            heatNumber: 3,
          };
        }
        return undefined;
      };

      const mockHd = {
        laneIndex: 0,
        actualDriver: { name: "Speedy" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "bestRaceLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("4.877 (Speedy, Heat 3)");
    });

    it("should fallback to holderName if nickname is not provided", () => {
      ctx.getBestRaceLapEntry = () => ({
        value: 4.56,
        holderName: "Alice Smith",
        heatNumber: 1,
      });

      const mockHd = {
        laneIndex: 1,
        actualDriver: { name: "Alice" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "bestRaceLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("4.560 (Alice Smith, Heat 1)");
    });

    it("should return --- for heat if heatNumber is not provided or <= 0", () => {
      ctx.getBestRaceLapEntry = () => ({
        value: 4.56,
        holderNickname: "Racer",
        heatNumber: 0,
      });

      const mockHd = {
        laneIndex: 0,
        actualDriver: { name: "Racer" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "bestRaceLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("4.560 (Racer, ---)");
    });

    it("should return placeholder format when no record exists", () => {
      ctx.getBestRaceLapEntry = () => undefined;

      const mockHd = {
        laneIndex: 0,
        actualDriver: { name: "Driver 1" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "bestRaceLapTime",
        undefined,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("--.--- (---, ---)");
    });

    it("should return -- for empty driver or empty lane", () => {
      const mockHd1 = { laneIndex: 0, isEmpty: true } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "bestRaceLapTime",
          undefined,
          mockHd1,
          undefined,
          ctx,
        ),
      ).toBe("--");

      const mockHd2 = {
        laneIndex: 0,
        actualDriver: { entity_id: "EMPTY_LANE", name: "Empty" },
      } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "bestRaceLapTime",
          undefined,
          mockHd2,
          undefined,
          ctx,
        ),
      ).toBe("--");

      const mockHd3 = { laneIndex: 0 } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "bestRaceLapTime",
          undefined,
          mockHd3,
          undefined,
          ctx,
        ),
      ).toBe("--");
    });
  });

  describe("formatValue - flag", () => {
    beforeEach(() => {
      ctx.getFlagUrl = (flag: any) => `url-for-${flag}`;
      ctx.getFlagType = () => RaceFlag.GREEN;
    });

    it("should return penalty flag when driver has false start penalty", () => {
      const mockHd = { remainingFalseStartTimePenalty: 2.5 } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.penalty");
    });

    it("should return penalty flag when driver fuel level is 0 or less and fuel is enabled", () => {
      ctx.getRace = () => ({ fuel_options: { enabled: true } }) as any;
      const mockHd = { driver: { fuelLevel: 0 } } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.penalty");
    });

    it("should return penalty flag when participant fuel level is 0 or less and fuel is enabled", () => {
      ctx.getRace = () => ({ fuel_options: { enabled: true } }) as any;
      const mockHd = { participant: { fuelLevel: 0 } } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.penalty");
    });

    it("should not return penalty flag when fuel is disabled even if fuelLevel is 0", () => {
      ctx.getRace = () => ({ fuel_options: { enabled: false } }) as any;
      const mockHd = { participant: { fuelLevel: 0 } } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-2");
    });

    it("should return penalty flag when hd.flag is RaceFlag.BLACK", () => {
      const mockHd = { flag: RaceFlag.BLACK } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.UNKNOWN_FLAG,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.penalty");
    });

    it("should return penalty flag when value is RaceFlag.BLACK", () => {
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.BLACK,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.penalty");
    });

    it("should return one_lap_to_go flag when value is RaceFlag.WHITE", () => {
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.WHITE,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.one_lap_to_go");
    });

    it("should return one_lap_to_go flag when hd.flag is RaceFlag.WHITE", () => {
      const mockHd = { flag: RaceFlag.WHITE } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.UNKNOWN_FLAG,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.one_lap_to_go");
    });

    it("should return warmup flag when value is RaceFlag.GREEN_YELLOW", () => {
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN_YELLOW,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.warmup");
    });

    it("should return warmup flag when hd.flag is RaceFlag.GREEN_YELLOW", () => {
      const mockHd = { flag: RaceFlag.GREEN_YELLOW } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.UNKNOWN_FLAG,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.warmup");
    });

    it("should return driver_finished flag when hd.isFinished is true", () => {
      const mockHd = { isFinished: true } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.driver_finished");
    });

    it("should return driver_finished flag when ctx.isDriverFinished returns true", () => {
      ctx.isDriverFinished = () => true;
      ctx.getRace = () => ({ heat_scoring: {} }) as any;
      const mockHd = { isFinished: false } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.driver_finished");
    });

    it("should return flag URL based on value when flag is valid", () => {
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.YELLOW,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe(`url-for-${RaceFlag.YELLOW}`);
    });

    it("should fallback to ctx.getFlagType() when value is UNKNOWN_FLAG or 0", () => {
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.UNKNOWN_FLAG,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe(`url-for-${RaceFlag.GREEN}`);
    });
  });

  describe("formatValue - Analysis Metrics", () => {
    it("should return placeholders for empty driver", () => {
      const emptyHd = { isEmpty: true } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "standardDeviation",
          undefined,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "consistencyScore",
          undefined,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.-%");
      expect(
        RacedayFormatUtils.formatValue(
          "averageTop5",
          undefined,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "averageTop10",
          undefined,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "averageTop15",
          undefined,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "top2Consecutive",
          undefined,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "top3Consecutive",
          undefined,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
    });

    it("should format standardDeviation correctly for valid driver", () => {
      expect(
        RacedayFormatUtils.formatValue(
          "standardDeviation",
          0.1234,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("0.123");
      expect(
        RacedayFormatUtils.formatValue(
          "standardDeviation",
          0.0,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("0.000");
      expect(
        RacedayFormatUtils.formatValue(
          "standardDeviation",
          null,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "standardDeviation",
          -1,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
    });

    it("should format consistencyScore correctly for valid driver", () => {
      expect(
        RacedayFormatUtils.formatValue(
          "consistencyScore",
          98.54,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("98.5%");
      expect(
        RacedayFormatUtils.formatValue(
          "consistencyScore",
          100.0,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("100.0%");
      expect(
        RacedayFormatUtils.formatValue(
          "consistencyScore",
          null,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("--.-%");
    });

    it("should format average top N metrics correctly for valid driver", () => {
      expect(
        RacedayFormatUtils.formatValue(
          "averageTop5",
          5.4321,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("5.432");
      expect(
        RacedayFormatUtils.formatValue("averageTop5", null, hd, undefined, ctx),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "averageTop10",
          6.1234,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("6.123");
      expect(
        RacedayFormatUtils.formatValue(
          "averageTop15",
          7.9876,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("7.988");
    });

    it("should format top consecutive metrics correctly for valid driver", () => {
      expect(
        RacedayFormatUtils.formatValue(
          "top2Consecutive",
          10.5,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("10.500");
      expect(
        RacedayFormatUtils.formatValue(
          "top2Consecutive",
          null,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "top3Consecutive",
          15.75,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("15.750");
      expect(
        RacedayFormatUtils.formatValue(
          "top3Consecutive",
          null,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
    });
  });
});
