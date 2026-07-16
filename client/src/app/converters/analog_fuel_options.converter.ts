import { AnalogFuelOptions } from "@app/models/analog_fuel_options";
import { FuelUsageType, OutOfFuelAction } from "@app/models/fuel_options";
import { IAnalogFuelOptions } from "@app/proto/antigravity";

export class AnalogFuelOptionsConverter {
  static fromProto(proto?: IAnalogFuelOptions | null): AnalogFuelOptions {
    if (!proto) {
      return new AnalogFuelOptions();
    }

    const p = proto as any;

    let usageType = FuelUsageType.LINEAR;
    if (typeof p.usageType === "number") {
      const types = [
        FuelUsageType.LINEAR,
        FuelUsageType.QUADRATIC,
        FuelUsageType.CUBIC,
      ];
      usageType = types[p.usageType] || FuelUsageType.LINEAR;
    } else if (typeof p.usageType === "string") {
      usageType = p.usageType as FuelUsageType;
    }

    let outOfFuelAction = OutOfFuelAction.DO_NOT_COUNT_LAPS;
    const rawAction = p.outOfFuelAction ?? p.out_of_fuel_action;
    if (typeof rawAction === "number") {
      const actions = [
        OutOfFuelAction.DO_NOT_COUNT_LAPS,
        OutOfFuelAction.END_HEAT,
        OutOfFuelAction.POWER_STUTTER,
      ];
      outOfFuelAction = actions[rawAction] || OutOfFuelAction.DO_NOT_COUNT_LAPS;
    } else if (typeof rawAction === "string") {
      outOfFuelAction = rawAction as OutOfFuelAction;
    } else if (rawAction == null) {
      // Fallback for legacy data
      outOfFuelAction =
        (p.endHeatOnOutOfFuel ?? p.end_heat_on_out_of_fuel)
          ? OutOfFuelAction.END_HEAT
          : OutOfFuelAction.DO_NOT_COUNT_LAPS;
    }

    return new AnalogFuelOptions(
      p.enabled ?? p.enabled ?? false,
      p.resetFuelAtHeatStart ?? p.reset_fuel_at_heat_start ?? false,
      outOfFuelAction,
      p.capacity ?? p.capacity ?? 100,
      usageType,
      p.usageRate ?? p.usage_rate ?? 4.0,
      p.startLevel ?? p.start_level ?? 100,
      p.refuelRate ?? p.refuel_rate ?? 10,
      p.pitStopDelay ?? p.pit_stop_delay ?? 2.0,
      p.powerStutterOnTime ?? p.power_stutter_on_time ?? 1.0,
      p.powerStutterOffTime ?? p.power_stutter_off_time ?? 1.0,
    );
  }
}
