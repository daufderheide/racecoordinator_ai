import { AnalogFuelOptions } from "@app/models/analog_fuel_options";
import {
  FuelCurvePoint,
  FuelUsageType,
  OutOfFuelAction,
} from "@app/models/fuel_options";
import { IAnalogFuelOptions } from "@app/proto/antigravity";

export class AnalogFuelOptionsConverter {
  static fromProto(proto?: IAnalogFuelOptions | null): AnalogFuelOptions {
    if (!proto) {
      return new AnalogFuelOptions();
    }

    const p = proto as any;
    const usageType = this.parseUsageType(p);
    const outOfFuelAction = this.parseOutOfFuelAction(p);
    const customCurve = this.parseCustomCurve(p);
    const refTime = Number(p.referenceTime ?? p.reference_time) || 6.0;
    const usageRate = Number(p.usageRate ?? p.usage_rate) || 4.0;
    const { fastestTime, maxUsage, slowestTime, minUsage } =
      this.resolveUsageParameters(
        p,
        usageType,
        usageRate,
        refTime,
        customCurve,
      );

    return new AnalogFuelOptions(
      p.enabled ?? false,
      p.resetFuelAtHeatStart ?? p.reset_fuel_at_heat_start ?? false,
      outOfFuelAction,
      p.capacity ?? 100,
      usageType,
      usageRate,
      p.startLevel ?? p.start_level ?? 100,
      p.refuelRate ?? p.refuel_rate ?? 10,
      p.pitStopDelay ?? p.pit_stop_delay ?? 2.0,
      refTime,
      p.powerStutterOnTime ?? p.power_stutter_on_time ?? 1.0,
      p.powerStutterOffTime ?? p.power_stutter_off_time ?? 1.0,
      customCurve,
      fastestTime,
      maxUsage,
      slowestTime,
      minUsage,
    );
  }

  private static parseUsageType(p: any): FuelUsageType {
    if (typeof p.usageType === "number") {
      const types = [
        FuelUsageType.LINEAR,
        FuelUsageType.QUADRATIC,
        FuelUsageType.CUBIC,
        FuelUsageType.CUSTOM_CURVE,
      ];
      return types[p.usageType] || FuelUsageType.LINEAR;
    }
    if (typeof p.usageType === "string") {
      return p.usageType === "CUSTOM"
        ? FuelUsageType.CUSTOM_CURVE
        : (p.usageType as FuelUsageType);
    }
    return FuelUsageType.LINEAR;
  }

  private static parseOutOfFuelAction(p: any): OutOfFuelAction {
    const rawAction = p.outOfFuelAction ?? p.out_of_fuel_action;
    if (typeof rawAction === "number") {
      const actions = [
        OutOfFuelAction.DO_NOT_COUNT_LAPS,
        OutOfFuelAction.END_HEAT,
        OutOfFuelAction.POWER_STUTTER,
      ];
      return actions[rawAction] || OutOfFuelAction.DO_NOT_COUNT_LAPS;
    }
    if (typeof rawAction === "string") {
      return rawAction as OutOfFuelAction;
    }
    return (p.endHeatOnOutOfFuel ?? p.end_heat_on_out_of_fuel)
      ? OutOfFuelAction.END_HEAT
      : OutOfFuelAction.DO_NOT_COUNT_LAPS;
  }

  private static parseCustomCurve(p: any): FuelCurvePoint[] {
    const rawCurve = p.customCurve ?? p.custom_curve ?? [];
    if (!Array.isArray(rawCurve)) {
      return [];
    }
    return rawCurve.map((pt: any) => ({
      x: Number(pt.x) || 0,
      y: Number(pt.y) || 0,
    }));
  }

  private static resolveUsageParameters(
    p: any,
    usageType: FuelUsageType,
    usageRate: number,
    refTime: number,
    customCurve: FuelCurvePoint[],
  ): {
    fastestTime: number;
    maxUsage: number;
    slowestTime: number;
    minUsage: number;
  } {
    const rawFastest = p.fastestTime ?? p.fastest_time;
    const rawMaxUsage = p.maxUsage ?? p.max_usage;
    const rawSlowest = p.slowestTime ?? p.slowest_time;
    const rawMinUsage = p.minUsage ?? p.min_usage;

    if (
      rawFastest != null &&
      Number(rawFastest) > 0 &&
      rawMaxUsage != null &&
      rawSlowest != null &&
      Number(rawSlowest) > 0 &&
      rawMinUsage != null
    ) {
      return {
        fastestTime: Number(rawFastest),
        maxUsage: Number(rawMaxUsage),
        slowestTime: Number(rawSlowest),
        minUsage: Number(rawMinUsage),
      };
    }

    const fastestTime = Math.max(0.1, Number((refTime * 0.5).toFixed(2)));
    const slowestTime = Math.max(
      fastestTime + 0.1,
      Number((refTime * 1.5).toFixed(2)),
    );

    let maxUsage = 1.25 * usageRate;
    let minUsage = 0.75 * usageRate;

    switch (usageType) {
      case FuelUsageType.QUADRATIC:
        maxUsage = 4.0 * usageRate;
        minUsage = (4.0 / 9.0) * usageRate;
        break;
      case FuelUsageType.CUBIC:
        maxUsage = 8.0 * usageRate;
        minUsage = (8.0 / 27.0) * usageRate;
        break;
      case FuelUsageType.CUSTOM_CURVE:
        maxUsage = usageRate * (customCurve[0]?.y ?? 1.0);
        minUsage = usageRate * (customCurve[customCurve.length - 1]?.y ?? 0.0);
        break;
      case FuelUsageType.LINEAR:
      default:
        break;
    }

    return { fastestTime, maxUsage, slowestTime, minUsage };
  }
}
