import { FuelOptions, FuelUsageType, OutOfFuelAction } from "./fuel_options";

export class AnalogFuelOptions extends FuelOptions {
  power_stutter_on_time?: number;
  power_stutter_off_time?: number;

  constructor(
    enabled: boolean = false,
    reset_fuel_at_heat_start: boolean = false,
    out_of_fuel_action: OutOfFuelAction = OutOfFuelAction.END_HEAT,
    capacity: number = 100,
    usage_type: FuelUsageType = FuelUsageType.LINEAR,
    usage_rate: number = 4.0,
    start_level: number = 100,
    refuel_rate: number = 10,
    pit_stop_delay: number = 2.0,
    power_stutter_on_time: number = 1.0,
    power_stutter_off_time: number = 1.0,
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
    );
    this.power_stutter_on_time = power_stutter_on_time;
    this.power_stutter_off_time = power_stutter_off_time;
  }
}
