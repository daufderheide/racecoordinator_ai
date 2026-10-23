import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { FinishMethod } from "@app/models/heat_scoring";
import { RaceFlag } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { FormatContext, RacedayFormatUtils } from "./raceday-format.utils";

export class RacedayFlagFormatUtils {
  static formatFlagValue(
    value: any,
    hd: DriverHeatData | undefined,
    _column: ColumnDefinition | undefined,
    ctx: FormatContext,
  ): string {
    if (this.isDriverPenalized(hd, ctx)) {
      return ctx.getFlagUrl("flag.penalty");
    }

    const isWarmupOrCooldown =
      Boolean(ctx.isWarmup?.()) ||
      Boolean(ctx.isCooldown?.()) ||
      ctx.getFlagType?.() === "flag.warmup" ||
      value === RaceFlag.GREEN_YELLOW ||
      hd?.flag === RaceFlag.GREEN_YELLOW;

    const allFinished =
      ctx.areAllDriversFinished !== undefined
        ? ctx.areAllDriversFinished()
        : false;

    if (allFinished) {
      if (isWarmupOrCooldown) return ctx.getFlagUrl("flag.warmup");
      const isRaceOver = ctx.isRaceOver ? ctx.isRaceOver() : false;
      return ctx.getFlagUrl(isRaceOver ? "flag.race_over" : "flag.heat_over");
    }

    const finishFlag = this.checkFinishedFlag(hd, ctx, isWarmupOrCooldown);
    if (finishFlag) return finishFlag;

    const oneLapFlag = this.checkOneLapToGoFlag(value, hd, ctx);
    if (oneLapFlag) return oneLapFlag;

    if (ctx.getFlagType?.() === "flag.heat_finishing") {
      return ctx.getFlagUrl("flag.racing");
    }
    if (
      value === RaceFlag.GREEN_YELLOW ||
      hd?.flag === RaceFlag.GREEN_YELLOW ||
      isWarmupOrCooldown
    ) {
      return ctx.getFlagUrl("flag.warmup");
    }
    if (value === RaceFlag.BLACK || hd?.flag === RaceFlag.BLACK) {
      return ctx.getFlagUrl("flag.penalty");
    }

    const flag =
      value === RaceFlag.UNKNOWN_FLAG || value === 0
        ? ctx.getFlagType()
        : value;
    return ctx.getFlagUrl(flag);
  }

  private static isDriverPenalized(
    hd: DriverHeatData | undefined,
    ctx: FormatContext,
  ): boolean {
    const race = ctx.getRace?.();
    const isFuelEnabled =
      (race?.fuel_options && race.fuel_options.enabled) ||
      (race?.digital_fuel_options && race.digital_fuel_options.enabled) ||
      (race as any)?.fuelOptions?.enabled ||
      (race as any)?.digitalFuelOptions?.enabled;

    const isOutOfFuel =
      Boolean(isFuelEnabled) &&
      ((hd?.participant &&
        hd.participant.fuelLevel !== undefined &&
        hd.participant.fuelLevel <= 0) ||
        (hd?.driver &&
          (hd.driver as any).fuelLevel !== undefined &&
          (hd.driver as any).fuelLevel <= 0));

    return Boolean(
      hd && ((hd as any).remainingFalseStartTimePenalty > 0 || isOutOfFuel),
    );
  }

  private static checkFinishedFlag(
    hd: DriverHeatData | undefined,
    ctx: FormatContext,
    isWarmupOrCooldown: boolean,
  ): string | null {
    const isFinished =
      Boolean(hd?.isFinished) ||
      Boolean(
        hd &&
        ctx.isDriverFinished &&
        ctx.isDriverFinished(
          hd,
          ctx.getRace()?.heat_scoring ?? (ctx.getRace() as any)?.heatScoring,
        ),
      );

    if (isFinished && RacedayFormatUtils.isAllowFinish(ctx.getRace())) {
      if (isWarmupOrCooldown) return ctx.getFlagUrl("flag.warmup");
      return ctx.getFlagUrl("flag.driver_finished");
    }
    return null;
  }

  private static checkOneLapToGoFlag(
    value: any,
    hd: DriverHeatData | undefined,
    ctx: FormatContext,
  ): string | null {
    const race = ctx.getRace?.();
    const scoring: any = race?.heat_scoring ?? (race as any)?.heatScoring;
    const finishMethod = scoring?.finishMethod ?? scoring?.finish_method;
    const finishValue = scoring?.finishValue ?? scoring?.finish_value;
    const isOneLapToGo =
      value === RaceFlag.WHITE ||
      hd?.flag === RaceFlag.WHITE ||
      Boolean(
        (finishMethod === "Lap" ||
          finishMethod === 1 ||
          finishMethod === FinishMethod.Lap) &&
        finishValue !== undefined &&
        finishValue > 0 &&
        (hd?.lapCount ?? 0) -
          (!RacedayFormatUtils.isHeatOrRaceOver(ctx, hd)
            ? (hd?.autoCalculatedLaps ?? 0)
            : 0) ===
          finishValue - 1,
      );

    return isOneLapToGo ? ctx.getFlagUrl("flag.one_lap_to_go") : null;
  }
}
