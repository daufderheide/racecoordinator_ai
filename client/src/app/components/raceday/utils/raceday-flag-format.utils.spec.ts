import { RaceFlag } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { RacedayFlagFormatUtils } from "./raceday-flag-format.utils";
import { FormatContext } from "./raceday-format.utils";

describe("RacedayFlagFormatUtils", () => {
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

  it("should return penalty flag when driver is penalized with remaining penalty", () => {
    const hd = {
      remainingFalseStartTimePenalty: 5,
    } as any as DriverHeatData;

    const result = RacedayFlagFormatUtils.formatFlagValue(
      RaceFlag.GREEN,
      hd,
      undefined,
      ctx,
    );
    expect(result).toBe("url-for-flag.penalty");
  });

  it("should return penalty flag when fuel is enabled and driver is out of fuel", () => {
    ctx.getRace = () =>
      ({
        fuel_options: { enabled: true },
      }) as any;

    const hd = {
      driver: { fuelLevel: 0 },
    } as any as DriverHeatData;

    const result = RacedayFlagFormatUtils.formatFlagValue(
      RaceFlag.GREEN,
      hd,
      undefined,
      ctx,
    );
    expect(result).toBe("url-for-flag.penalty");
  });

  it("should return warmup flag when in warmup or cooldown mode", () => {
    ctx.isWarmup = () => true;

    const result = RacedayFlagFormatUtils.formatFlagValue(
      RaceFlag.GREEN,
      undefined,
      undefined,
      ctx,
    );
    expect(result).toBe("url-for-flag.warmup");
  });

  it("should return heat_over flag when all drivers are finished and race is not over", () => {
    ctx.areAllDriversFinished = () => true;
    ctx.isRaceOver = () => false;

    const result = RacedayFlagFormatUtils.formatFlagValue(
      RaceFlag.GREEN,
      undefined,
      undefined,
      ctx,
    );
    expect(result).toBe("url-for-flag.heat_over");
  });

  it("should return race_over flag when all drivers are finished and race is over", () => {
    ctx.areAllDriversFinished = () => true;
    ctx.isRaceOver = () => true;

    const result = RacedayFlagFormatUtils.formatFlagValue(
      RaceFlag.GREEN,
      undefined,
      undefined,
      ctx,
    );
    expect(result).toBe("url-for-flag.race_over");
  });

  it("should return one_lap_to_go flag when flag is WHITE", () => {
    const result = RacedayFlagFormatUtils.formatFlagValue(
      RaceFlag.WHITE,
      undefined,
      undefined,
      ctx,
    );
    expect(result).toBe("url-for-flag.one_lap_to_go");
  });

  it("should return default flag url for standard flag values", () => {
    const result = RacedayFlagFormatUtils.formatFlagValue(
      RaceFlag.GREEN,
      undefined,
      undefined,
      ctx,
    );
    expect(result).toBe(`url-for-${RaceFlag.GREEN}`);
  });
});
