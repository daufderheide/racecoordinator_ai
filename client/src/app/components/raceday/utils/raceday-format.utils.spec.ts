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
});
