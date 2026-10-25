import { AnchorPoint } from "@app/components/raceday/column_definition";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { FormatContext } from "./raceday-format.utils";
import { RacedayTelemetryFormatUtils } from "./raceday-telemetry-format.utils";

describe("RacedayTelemetryFormatUtils", () => {
  let ctx: FormatContext;

  beforeEach(() => {
    ctx = {
      translate: (k: string) => k,
      getRace: () => undefined,
      getTrack: () => undefined,
      getDriverRanking: () => undefined,
      getFlagType: () => "flag.green",
      getFlagUrl: (flag: any) => `url-for-${flag}`,
      getFullUrl: (url: string | undefined) => url || "",
      getImageSetUrl: () => "",
    };
  });

  describe("formatFuelLevels", () => {
    it("formats participant.fuelLevel correctly", () => {
      const hd = {} as DriverHeatData;
      expect(
        RacedayTelemetryFormatUtils.formatFuelLevels(
          "participant.fuelLevel",
          12.345,
          hd,
          ctx,
        ),
      ).toBe("12.3");
      expect(
        RacedayTelemetryFormatUtils.formatFuelLevels(
          "participant.fuelLevel",
          undefined,
          hd,
          ctx,
        ),
      ).toBe("--.-");
    });

    it("formats fuelCapacity with analog and digital fuel correctly", () => {
      ctx.getRace = () =>
        ({
          fuel_options: { capacity: 50 },
          digital_fuel_options: { capacity: 75 },
        }) as any;
      ctx.getTrack = () =>
        ({
          hasDigitalFuel: () => false,
        }) as any;

      const hd = {} as DriverHeatData;
      expect(
        RacedayTelemetryFormatUtils.formatFuelLevels(
          "fuelCapacity",
          undefined,
          hd,
          ctx,
        ),
      ).toBe("50.0");

      ctx.getTrack = () =>
        ({
          hasDigitalFuel: () => true,
        }) as any;
      expect(
        RacedayTelemetryFormatUtils.formatFuelLevels(
          "fuelCapacity",
          undefined,
          hd,
          ctx,
        ),
      ).toBe("75.0");
    });

    it("formats fuelPercentage correctly", () => {
      ctx.getRace = () =>
        ({
          fuel_options: { capacity: 100 },
        }) as any;
      ctx.getTrack = () =>
        ({
          hasDigitalFuel: () => false,
        }) as any;

      const hd = {
        participant: { fuelLevel: 45 },
      } as any as DriverHeatData;

      expect(
        RacedayTelemetryFormatUtils.formatFuelLevels(
          "fuelPercentage",
          undefined,
          hd,
          ctx,
        ),
      ).toBe("45%");

      const emptyHd = { participant: {} } as any as DriverHeatData;
      expect(
        RacedayTelemetryFormatUtils.formatFuelLevels(
          "fuelPercentage",
          undefined,
          emptyHd,
          ctx,
        ),
      ).toBe("--%");
    });
  });

  describe("formatSegmentTime", () => {
    it("formats indexed segment time when column has multiple segments", () => {
      const hd = {
        currentLapSegments: [1.234, 2.345, 3.456],
        lastSegmentTime: 1.111,
      } as any as DriverHeatData;

      const column = {
        layout: {
          [AnchorPoint.TopLeft]: "segmentTime_0",
          [AnchorPoint.TopRight]: "segmentTime_1",
        },
      } as any;

      expect(
        RacedayTelemetryFormatUtils.formatSegmentTime(
          "segmentTime_1",
          hd,
          column,
          2,
          "--.--",
        ),
      ).toBe("2.35");
    });

    it("falls back to lastSegmentTime when no column or index 0 with single segment", () => {
      const hd = {
        currentLapSegments: [],
        lastSegmentTime: 2.456,
      } as any as DriverHeatData;

      expect(
        RacedayTelemetryFormatUtils.formatSegmentTime(
          "segmentTime",
          hd,
          undefined,
          3,
          "--.---",
        ),
      ).toBe("2.456");
      expect(
        RacedayTelemetryFormatUtils.formatSegmentTime(
          "segmentTime",
          { lastSegmentTime: 0 } as any,
          undefined,
          3,
          "--.---",
        ),
      ).toBe("--.---");
    });
  });

  describe("formatSpeed", () => {
    it("formats mph, kph, and fph from scaled track length and lap time", () => {
      ctx.getTrack = () =>
        ({
          track_scale: 1.0,
          lanes: [{ length: 52.8 }],
        }) as any;

      const hd = {
        laneIndex: 0,
        lastLapTime: 3.6,
      } as any as DriverHeatData;

      // scaledLength = 52.8, fph = (52.8 / 3.6) * 3600 = 52800
      // mph = 52800 / 5280 = 10.00
      // kph = 10.00 * 1.609344 = 16.09
      expect(RacedayTelemetryFormatUtils.formatSpeed("fph", hd, ctx)).toBe(
        "52800",
      );
      expect(RacedayTelemetryFormatUtils.formatSpeed("mph", hd, ctx)).toBe(
        "10.00",
      );
      expect(RacedayTelemetryFormatUtils.formatSpeed("kph", hd, ctx)).toBe(
        "16.09",
      );
    });

    it("returns placeholder when lap time is invalid or lane length missing", () => {
      const hd = {
        laneIndex: 0,
        lastLapTime: 0,
      } as any as DriverHeatData;

      expect(RacedayTelemetryFormatUtils.formatSpeed("mph", hd, ctx)).toBe(
        "--.--",
      );
    });
  });
});
