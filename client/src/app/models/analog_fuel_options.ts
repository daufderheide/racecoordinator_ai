import {
  FuelCurvePoint,
  FuelOptions,
  FuelUsageType,
  OutOfFuelAction,
} from "./fuel_options";

export class AnalogFuelOptions extends FuelOptions {
  /** @deprecated Use fastest_time and slowest_time instead. */
  reference_time: number;
  power_stutter_on_time?: number;
  power_stutter_off_time?: number;
  fastest_time: number;
  max_usage: number;
  slowest_time: number;
  min_usage: number;

  constructor(
    enabled: boolean = false,
    reset_fuel_at_heat_start: boolean = false,
    out_of_fuel_action: OutOfFuelAction = OutOfFuelAction.END_HEAT,
    capacity: number = 100,
    usage_type: FuelUsageType = FuelUsageType.LINEAR,
    /** @deprecated Use max_usage and min_usage instead. */
    usage_rate: number = 4.0,
    start_level: number = 100,
    refuel_rate: number = 10,
    pit_stop_delay: number = 2.0,
    /** @deprecated Use fastest_time and slowest_time instead. */
    reference_time: number = 6.0,
    power_stutter_on_time: number = 1.0,
    power_stutter_off_time: number = 1.0,
    custom_curve: FuelCurvePoint[] = [],
    fastest_time: number = 3.0,
    max_usage: number = 5.0,
    slowest_time: number = 9.0,
    min_usage: number = 3.0,
  ) {
    super(
      enabled,
      reset_fuel_at_heat_start,
      out_of_fuel_action,
      capacity,
      usage_type,
      usage_rate,
      start_level,
      refuel_rate,
      pit_stop_delay,
      custom_curve,
    );
    this.reference_time = reference_time;
    this.power_stutter_on_time = power_stutter_on_time;
    this.power_stutter_off_time = power_stutter_off_time;
    this.fastest_time = fastest_time;
    this.max_usage = max_usage;
    this.slowest_time = slowest_time;
    this.min_usage = min_usage;
  }
}
