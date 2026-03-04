import { AnalogFuelOptions, FuelUsageType } from "../models/analog_fuel_options";
import { com } from "../proto/message";

export class AnalogFuelOptionsConverter {
  static fromProto(proto?: com.antigravity.IAnalogFuelOptions | null): AnalogFuelOptions {
    if (!proto) {
      return new AnalogFuelOptions();
    }

    const p = proto as any;

    let usageType = FuelUsageType.LINEAR;
    if (typeof p.usageType === 'number') {
      const types = [FuelUsageType.LINEAR, FuelUsageType.QUADRATIC, FuelUsageType.CUBIC];
      usageType = types[p.usageType] || FuelUsageType.LINEAR;
    } else if (typeof p.usageType === 'string') {
      usageType = p.usageType as FuelUsageType;
    }

    return new AnalogFuelOptions(
      proto.enabled ?? false,
      proto.resetFuelAtHeatStart ?? false,
      proto.endHeatOnOutOfFuel ?? false,
      proto.capacity ?? 100,
      usageType,
      proto.usageRate ?? 4.0,
      proto.startLevel ?? 100,
      proto.refuelRate ?? 10,
      proto.pitStopDelay ?? 2.0
    );
  }
}
