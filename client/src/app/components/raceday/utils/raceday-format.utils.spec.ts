import { AllowFinish } from "@app/models/heat_scoring";
import { RaceFlag, RaceState } from "@app/proto/antigravity";

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

  describe("formatValue - trackCalls", () => {
    it("should format trackCalls properly for valid driver", () => {
      const mockHd = {
        trackCalls: 3,
        actualDriver: { name: "Driver 1" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "trackCalls",
        3,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("3");
    });

    it("should read trackCalls from DriverHeatData if value is null", () => {
      const mockHd = {
        trackCalls: 2,
        actualDriver: { name: "Driver 1" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "trackCalls",
        null,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("2");
    });

    it("should return 0 for a valid driver with 0 track calls", () => {
      const mockHd = {
        trackCalls: 0,
        actualDriver: { name: "Driver 1" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "trackCalls",
        0,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("0");
    });

    it("should return -- for empty driver with EMPTY_LANE id", () => {
      const mockHd = {
        trackCalls: 0,
        actualDriver: { entity_id: "EMPTY_LANE", name: "Empty" },
      } as any;
      const result = RacedayFormatUtils.formatValue(
        "trackCalls",
        0,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("--");
    });

    it("should return -- for empty lane without driver or with isEmpty flag", () => {
      const mockHd1 = {
        trackCalls: 0,
      } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "trackCalls",
          0,
          mockHd1,
          undefined,
          ctx,
        ),
      ).toBe("--");

      const mockHd2 = {
        trackCalls: 0,
        isEmpty: true,
      } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "trackCalls",
          0,
          mockHd2,
          undefined,
          ctx,
        ),
      ).toBe("--");

      const mockHd3 = {
        trackCalls: 0,
        participant: { driver: { name: "Empty", entity_id: "EMPTY_LANE" } },
      } as any;
      expect(
        RacedayFormatUtils.formatValue(
          "trackCalls",
          0,
          mockHd3,
          undefined,
          ctx,
        ),
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

    it("should respect columnDecimals override for ghost pacing columns", () => {
      const mockHd = {
        actualDriver: { name: "Driver A" },
        ghostLapTime: 5.234,
        lastLapTime: 5.0,
      } as any;
      const ctxWithOverride = {
        ...ctx,
        laneViewWidgetSettings: {
          columnDecimals: { ghostPacing: 1 },
        },
      };

      const result = RacedayFormatUtils.formatValue(
        "ghostPacing",
        undefined,
        mockHd,
        undefined,
        ctxWithOverride,
      );
      expect(result).toBe("+0.2s");
    });

    it("should normalize negative zero when rounding delta to zero", () => {
      const mockHd = {
        actualDriver: { name: "Driver A" },
        ghostLapTime: 5.0,
        lastLapTime: 5.001,
      } as any;
      const ctxWithZeroDecimals = {
        ...ctx,
        laneViewWidgetSettings: {
          columnDecimals: { ghostPacing: 1 },
        },
      };

      const result = RacedayFormatUtils.formatValue(
        "ghostPacing",
        undefined,
        mockHd,
        undefined,
        ctxWithZeroDecimals,
      );
      expect(result).toBe("0.0s");
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

    it("should return driver_finished flag when hd.isFinished is true and allow finish is enabled and not all finished", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => false;
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

    it("should return driver_finished flag when ctx.isDriverFinished returns true and allow finish enabled", () => {
      ctx.isDriverFinished = () => true;
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => false;
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

    it("should not return driver_finished flag when allow finish is None", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "None" } }) as any;
      ctx.areAllDriversFinished = () => false;
      const mockHd = { isFinished: true } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe(`url-for-${RaceFlag.GREEN}`);
    });

    it("should return heat_over flag when all drivers finished and not race over", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => true;
      ctx.isRaceOver = () => false;
      const mockHd = { isFinished: true } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.heat_over");
    });

    it("should return race_over flag when all drivers finished and race over", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => true;
      ctx.isRaceOver = () => true;
      const mockHd = { isFinished: true } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.race_over");
    });

    it("should return warmup flag when all drivers finished and cooldown is active", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => true;
      ctx.isRaceOver = () => false;
      ctx.isCooldown = () => true;
      const mockHd = { isFinished: true } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.warmup");
    });

    it("should return warmup flag when all drivers finished and warmup flag is active via getFlagType", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => true;
      ctx.isRaceOver = () => false;
      ctx.getFlagType = () => "flag.warmup";
      const mockHd = { isFinished: true } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.warmup");
    });

    it("should return warmup flag when all drivers finished and hd.flag is GREEN_YELLOW", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => true;
      ctx.isRaceOver = () => false;
      const mockHd = { isFinished: true, flag: RaceFlag.GREEN_YELLOW } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.warmup");
    });

    it("should return warmup flag when driver is finished in allow-finish during cooldown", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => false;
      ctx.isCooldown = () => true;
      const mockHd = { isFinished: true } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.warmup");
    });

    it("should return driver_finished even if hd.flag is RaceFlag.BLACK when finished in allow finish", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => false;
      const mockHd = { isFinished: true, flag: RaceFlag.BLACK } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.BLACK,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.driver_finished");
    });

    it("should return racing flag for unfinished driver during allow finish heat_finishing period", () => {
      ctx.getRace = () => ({ heat_scoring: { allow_finish: "Allow" } }) as any;
      ctx.areAllDriversFinished = () => false;
      ctx.getFlagType = () => "flag.heat_finishing";
      const mockHd = { isFinished: false, flag: RaceFlag.GREEN } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.UNKNOWN_FLAG,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.racing");
    });

    it("should return one_lap_to_go for unfinished driver on their last lap during allow finish", () => {
      ctx.getRace = () =>
        ({
          heat_scoring: {
            allow_finish: "Allow",
            finish_method: "Lap",
            finish_value: 10,
          },
        }) as any;
      ctx.areAllDriversFinished = () => false;
      ctx.getFlagType = () => "flag.heat_finishing";
      const mockHd = { isFinished: false, lapCount: 9 } as any;
      const result = RacedayFormatUtils.formatValue(
        "flag",
        RaceFlag.UNKNOWN_FLAG,
        mockHd,
        undefined,
        ctx,
      );
      expect(result).toBe("url-for-flag.one_lap_to_go");
    });

    it("should correctly evaluate isAllowFinish", () => {
      expect(RacedayFormatUtils.isAllowFinish(undefined)).toBeFalse();
      expect(RacedayFormatUtils.isAllowFinish({} as any)).toBeFalse();
      expect(
        RacedayFormatUtils.isAllowFinish({
          heat_scoring: { allow_finish: "None" },
        } as any),
      ).toBeFalse();
      expect(
        RacedayFormatUtils.isAllowFinish({
          heat_scoring: { allow_finish: "Allow" },
        } as any),
      ).toBeTrue();
      expect(
        RacedayFormatUtils.isAllowFinish({
          heat_scoring: { allowFinish: AllowFinish.AF_SINGLE_LAP },
        } as any),
      ).toBeTrue();
      expect(
        RacedayFormatUtils.isAllowFinish({
          heat_scoring: {
            allowFinish: AllowFinish.AF_SINGLE_LAP_AUTO_SEGMENTS,
          },
        } as any),
      ).toBeTrue();
      expect(
        RacedayFormatUtils.isAllowFinish({
          heat_scoring: { allow_finish: "SingleLapAutoSegments" },
        } as any),
      ).toBeTrue();
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

  describe("formatValue & getPropertyValue - Overall Columns", () => {
    let participantHd: any;

    beforeEach(() => {
      participantHd = {
        objectId: "p-1",
        laneIndex: 0,
        actualDriver: { name: "Driver One" },
        participant: {
          objectId: "p-1",
          rank: 2,
          seed: 1,
          totalLaps: 50.25,
          physicalLapCount: 50,
          totalTime: 320.456,
          bestLapTime: 5.123,
          averageLapTime: 6.409,
          medianLapTime: 6.35,
          consistencyScore: 92.5,
          standardDeviation: 0.145,
          gapLeader: 1.234,
          gapPosition: 0.567,
          gapLeaderF1: 1.234,
          gapPositionF1: 0.567,
          lapsDownLeader: 0,
          lapsDownPosition: 1,
          lapsLed: 15,
          trackCalls: 2,
          totalPoints: 100,
          averageTop5: 5.5,
          averageTop10: 5.8,
          averageTop15: 6.0,
          top2Consecutive: 10.4,
          top3Consecutive: 15.8,
        },
      };
    });

    it("should resolve overall properties via getPropertyValue", () => {
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "overallLapCount"),
      ).toBe(50.25);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "totalLaps"),
      ).toBe(50.25);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "raceTotalLaps"),
      ).toBe(50.25);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "overallTotalLaps"),
      ).toBe(50.25);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "heatTotalLaps"),
      ).toBe(participantHd.lapCount);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallPhysicalLapCount",
        ),
      ).toBe(50);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "overallTotalTime"),
      ).toBe(320.456);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallBestLapTime",
        ),
      ).toBe(5.123);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallAverageLapTime",
        ),
      ).toBe(6.409);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallMedianLapTime",
        ),
      ).toBe(6.35);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallConsistencyScore",
        ),
      ).toBe(92.5);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallStandardDeviation",
        ),
      ).toBe(0.145);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallAverageTop5",
        ),
      ).toBe(5.5);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallAverageTop10",
        ),
      ).toBe(5.8);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallAverageTop15",
        ),
      ).toBe(6.0);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallTop2Consecutive",
        ),
      ).toBe(10.4);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallTop3Consecutive",
        ),
      ).toBe(15.8);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "overallGapLeader"),
      ).toBe(1.234);
      expect(
        RacedayFormatUtils.getPropertyValue(
          participantHd,
          "overallGapPosition",
        ),
      ).toBe(0.567);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "overallLapsLed"),
      ).toBe(15);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "overallTrackCalls"),
      ).toBe(2);
      expect(
        RacedayFormatUtils.getPropertyValue(participantHd, "overallPoints"),
      ).toBe(100);
    });

    it("should format overall values correctly", () => {
      expect(
        RacedayFormatUtils.formatValue(
          "overallLapCount",
          50.25,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("50.25");
      expect(
        RacedayFormatUtils.formatValue(
          "overallPhysicalLapCount",
          50,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("50");
      expect(
        RacedayFormatUtils.formatValue(
          "overallTotalTime",
          320.456,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("320.456");
      expect(
        RacedayFormatUtils.formatValue(
          "overallBestLapTime",
          5.123,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("5.123");
      expect(
        RacedayFormatUtils.formatValue(
          "overallAverageLapTime",
          6.409,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("6.409");
      expect(
        RacedayFormatUtils.formatValue(
          "overallMedianLapTime",
          6.35,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("6.350");
      expect(
        RacedayFormatUtils.formatValue(
          "overallConsistencyScore",
          92.5,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("92.5%");
      expect(
        RacedayFormatUtils.formatValue(
          "overallStandardDeviation",
          0.145,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("0.145");
      expect(
        RacedayFormatUtils.formatValue(
          "overallAverageTop5",
          5.5,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("5.500");
      expect(
        RacedayFormatUtils.formatValue(
          "overallAverageTop10",
          5.8,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("5.800");
      expect(
        RacedayFormatUtils.formatValue(
          "overallAverageTop15",
          6.0,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("6.000");
      expect(
        RacedayFormatUtils.formatValue(
          "overallTop2Consecutive",
          10.4,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("10.400");
      expect(
        RacedayFormatUtils.formatValue(
          "overallTop3Consecutive",
          15.8,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("15.800");
      expect(
        RacedayFormatUtils.formatValue(
          "overallGapLeader",
          1.234,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("+1.234");
      expect(
        RacedayFormatUtils.formatValue(
          "overallGapPosition",
          0.567,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("+0.567");
      expect(
        RacedayFormatUtils.formatValue(
          "overallGapLeaderF1",
          1.234,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("+1.234");
      expect(
        RacedayFormatUtils.formatValue(
          "overallGapPositionF1",
          0,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("+1 Lap");
      expect(
        RacedayFormatUtils.formatValue(
          "overallLapsLed",
          15,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("15");
      expect(
        RacedayFormatUtils.formatValue(
          "overallTrackCalls",
          2,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("2");
      expect(
        RacedayFormatUtils.formatValue(
          "overallPoints",
          100,
          participantHd,
          undefined,
          ctx,
        ),
      ).toBe("100");
    });

    it("should format empty driver for overall columns", () => {
      const emptyHd: any = { isEmptyLane: true };
      expect(
        RacedayFormatUtils.formatValue(
          "overallLapCount",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.--");
      expect(
        RacedayFormatUtils.formatValue(
          "overallPhysicalLapCount",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--");
      expect(
        RacedayFormatUtils.formatValue(
          "overallTotalTime",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "overallBestLapTime",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "overallConsistencyScore",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.-%");
      expect(
        RacedayFormatUtils.formatValue(
          "overallStandardDeviation",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "overallGapLeader",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--.---");
      expect(
        RacedayFormatUtils.formatValue(
          "overallLapsLed",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--");
      expect(
        RacedayFormatUtils.formatValue(
          "overallTrackCalls",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--");
      expect(
        RacedayFormatUtils.formatValue(
          "overallPoints",
          0,
          emptyHd,
          undefined,
          ctx,
        ),
      ).toBe("--");
    });
  });

  describe("formatValue - Column Specific Decimals", () => {
    it("should allow two different time columns to have different decimal places", () => {
      ctx.laneViewWidgetSettings = {
        timeDecimalPlaces: 3,
        lapDecimalPlaces: 2,
        columnDecimals: {
          lastLapTime: 1,
          bestLapTime: 4,
        },
      } as any;

      const lastLapCol = { propertyName: "lastLapTime" } as any;
      const bestLapCol = { propertyName: "bestLapTime" } as any;

      const lastLapFormatted = RacedayFormatUtils.formatValue(
        "lastLapTime",
        5.1234,
        hd,
        lastLapCol,
        ctx,
      );
      const bestLapFormatted = RacedayFormatUtils.formatValue(
        "bestLapTime",
        5.1234,
        hd,
        bestLapCol,
        ctx,
      );

      expect(lastLapFormatted).toBe("5.1");
      expect(bestLapFormatted).toBe("5.1234");
    });

    it("should allow column-specific lap decimal places", () => {
      ctx.laneViewWidgetSettings = {
        timeDecimalPlaces: 3,
        lapDecimalPlaces: 2,
        columnDecimals: {
          lapCount: 1,
        },
      } as any;

      hd.reactionTime = 1;
      const lapCol = { propertyName: "lapCount" } as any;
      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        10.456,
        hd,
        lapCol,
        ctx,
      );
      expect(result).toBe("10.5");
    });

    it("should fall back to widget timeDecimalPlaces and lapDecimalPlaces when columnDecimals is not set", () => {
      ctx.laneViewWidgetSettings = {
        timeDecimalPlaces: 3,
        lapDecimalPlaces: 2,
      } as any;

      hd.reactionTime = 1;
      const lastLapCol = { propertyName: "lastLapTime" } as any;
      const lapCol = { propertyName: "lapCount" } as any;

      const lastLapFormatted = RacedayFormatUtils.formatValue(
        "lastLapTime",
        5.1234,
        hd,
        lastLapCol,
        ctx,
      );
      const lapFormatted = RacedayFormatUtils.formatValue(
        "lapCount",
        10.456,
        hd,
        lapCol,
        ctx,
      );

      expect(lastLapFormatted).toBe("5.123");
      expect(lapFormatted).toBe("10.46");
    });

    it("should use inset decimal places when column is an inset anchor even if columnDecimals exists", () => {
      ctx.laneViewWidgetSettings = {
        timeDecimalPlaces: 3,
        lapDecimalPlaces: 2,
        insetTimeDecimalPlaces: 1,
        columnDecimals: {
          lastLapTime: 4,
        },
      } as any;

      const result = RacedayFormatUtils.formatValue(
        "lastLapTime",
        5.1234,
        hd,
        undefined,
        ctx,
        "top-right",
      );
      expect(result).toBe("5.1");
    });
  });

  describe("formatValue - onlyShowDecimalsWhenNotRacing", () => {
    it("should show decimals by default when onlyShowDecimalsWhenNotRacing is false or undefined", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
      } as any;
      ctx.raceState = RaceState.RACING;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        10,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("10.00");
    });

    it("should keep old setting value when onlyShowDecimalsIfSegments was used", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsIfSegments: true,
      } as any;
      ctx.raceState = RaceState.RACING;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        10,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("10");
    });

    it("should omit decimals for lapCount during RACING state when enabled", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.getRaceState = () => RaceState.RACING;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        10,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("10");
    });

    it("should display placeholder as -- without decimal points during RACING state when enabled", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.RACING;

      hd.reactionTime = 0;
      (hd as any).lapTimes = [];

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        null,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("--");
    });

    it("should show decimals for lapCount in PAUSED state when enabled", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.PAUSED;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        10.5,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("10.50");
    });

    it("should show decimals for lapCount in HEAT_OVER state when enabled", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.HEAT_OVER;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        10.25,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("10.25");
    });

    it("should show decimals for lapCount in RACE_OVER state when enabled", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.RACE_OVER;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        10.75,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("10.75");
    });

    it("should show decimals for lapCount in NOT_STARTED state when enabled", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.NOT_STARTED;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        11,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("11.00");
    });

    it("should omit decimals for lapCount in STARTING state when enabled", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.STARTING;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "lapCount",
        10,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("10");
    });

    it("should omit decimals for overallLapCount during RACING state when column setting is true", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        columnOnlyShowDecimalsWhenNotRacing: {
          overallLapCount: true,
        },
      } as any;
      ctx.raceState = RaceState.RACING;

      (hd as any).participant = {
        totalTime: 50.0,
      };

      const result = RacedayFormatUtils.formatValue(
        "overallLapCount",
        25.5,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("26"); // rounded to whole number without decimals
    });

    it("should show decimals for overallLapCount when not racing (e.g. PAUSED)", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        columnOnlyShowDecimalsWhenNotRacing: {
          overallLapCount: true,
        },
      } as any;
      ctx.raceState = RaceState.PAUSED;

      (hd as any).participant = {
        totalTime: 50.0,
      };

      const result = RacedayFormatUtils.formatValue(
        "overallLapCount",
        25.5,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("25.50");
    });

    it("should omit decimals for totalLaps during RACING state when column setting is true", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        columnOnlyShowDecimalsWhenNotRacing: {
          totalLaps: true,
        },
      } as any;
      ctx.raceState = RaceState.RACING;

      (hd as any).participant = {
        totalTime: 50.0,
      };

      const result = RacedayFormatUtils.formatValue(
        "totalLaps",
        30,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("30");
    });

    it("should show decimals for totalLaps in PAUSED state when column setting is true", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.PAUSED;

      (hd as any).participant = {
        totalTime: 50.0,
      };

      const result = RacedayFormatUtils.formatValue(
        "totalLaps",
        30.75,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("30.75");
    });

    it("should omit decimals for heatTotalLaps during RACING state when enabled", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.RACING;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "heatTotalLaps",
        15,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("15");
    });

    it("should show decimals for heatTotalLaps when not racing", () => {
      ctx.laneViewWidgetSettings = {
        lapDecimalPlaces: 2,
        onlyShowDecimalsWhenNotRacing: true,
      } as any;
      ctx.raceState = RaceState.PAUSED;

      hd.reactionTime = 1;

      const result = RacedayFormatUtils.formatValue(
        "heatTotalLaps",
        15.25,
        hd,
        undefined,
        ctx,
      );
      expect(result).toBe("15.25");
    });
  });

  describe("Timer formatting for totalTime and overallTotalTime", () => {
    it("should resolve timer format options from lane-column settings", () => {
      const settings = {
        timeDisplayFormat: "mm_ss",
        timeSubsecondMode: "always",
        timeSubsecondThreshold: 5,
        timeSubsecondDecimals: 3,
      };
      const opts = RacedayFormatUtils.resolveTimerFormatOptions(
        "totalTime",
        settings,
      );
      expect(opts).toEqual({
        format: "mm_ss",
        subsecondMode: "always",
        subsecondThreshold: 5,
        subsecondDecimals: 3,
      });
    });

    it("should resolve timer format options from lane-view per-column maps", () => {
      const settings = {
        columnTimeDisplayFormat: { overallTotalTime: "hh_mm_ss" },
        columnTimeSubsecondMode: { overallTotalTime: "never" },
        columnTimeSubsecondThreshold: { overallTotalTime: 15 },
        columnTimeSubsecondDecimals: { overallTotalTime: 1 },
      };
      const opts = RacedayFormatUtils.resolveTimerFormatOptions(
        "overallTotalTime",
        settings,
      );
      expect(opts).toEqual({
        format: "hh_mm_ss",
        subsecondMode: "never",
        subsecondThreshold: 15,
        subsecondDecimals: 1,
      });
    });

    it("should return undefined for non-total-time columns or empty settings", () => {
      expect(
        RacedayFormatUtils.resolveTimerFormatOptions("lastLapTime", {
          timeDisplayFormat: "dynamic",
        }),
      ).toBeUndefined();
      expect(
        RacedayFormatUtils.resolveTimerFormatOptions("totalTime", undefined),
      ).toBeUndefined();
      expect(
        RacedayFormatUtils.resolveTimerFormatOptions("totalTime", {}),
      ).toBeUndefined();
    });

    it("should format totalTime using timer options when configured on lane-column", () => {
      ctx.laneViewWidgetSettings = {
        timeDisplayFormat: "dynamic",
        timeSubsecondMode: "threshold",
        timeSubsecondThreshold: 10,
        timeSubsecondDecimals: 2,
      };
      expect(
        RacedayFormatUtils.formatValue("totalTime", 3665, hd, undefined, ctx),
      ).toBe("1:01:05");
      expect(
        RacedayFormatUtils.formatValue("totalTime", 83, hd, undefined, ctx),
      ).toBe("1:23");
      expect(
        RacedayFormatUtils.formatValue("totalTime", 45, hd, undefined, ctx),
      ).toBe("45");
      expect(
        RacedayFormatUtils.formatValue("totalTime", 8.45, hd, undefined, ctx),
      ).toBe("8.45");
    });

    it("should format totalTime with mm_ss and hh_mm_ss formats", () => {
      ctx.laneViewWidgetSettings = {
        timeDisplayFormat: "mm_ss",
        timeSubsecondMode: "never",
      };
      expect(
        RacedayFormatUtils.formatValue("totalTime", 83, hd, undefined, ctx),
      ).toBe("01:23");
      expect(
        RacedayFormatUtils.formatValue("totalTime", 45, hd, undefined, ctx),
      ).toBe("00:45");

      ctx.laneViewWidgetSettings = {
        timeDisplayFormat: "hh_mm_ss",
        timeSubsecondMode: "never",
      };
      expect(
        RacedayFormatUtils.formatValue("totalTime", 83, hd, undefined, ctx),
      ).toBe("00:01:23");
    });

    it("should format overallTotalTime using lane-view per-column timer settings", () => {
      ctx.laneViewWidgetSettings = {
        columnTimeDisplayFormat: { overallTotalTime: "seconds" },
        columnTimeSubsecondMode: { overallTotalTime: "always" },
        columnTimeSubsecondDecimals: { overallTotalTime: 2 },
      };
      expect(
        RacedayFormatUtils.formatValue(
          "overallTotalTime",
          83.42,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("83.42");
    });

    it("should maintain backward compatibility when no timer options are set", () => {
      ctx.laneViewWidgetSettings = undefined;
      expect(
        RacedayFormatUtils.formatValue(
          "totalTime",
          42.1234,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("42.123");
      expect(
        RacedayFormatUtils.formatValue(
          "overallTotalTime",
          320.456,
          hd,
          undefined,
          ctx,
        ),
      ).toBe("320.456");
    });
  });
});
