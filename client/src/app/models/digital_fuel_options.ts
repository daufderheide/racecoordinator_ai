import { FuelOptions, FuelUsageType } from "./fuel_options";

export class DigitalFuelOptions extends FuelOptions {
  constructor(
    enabled: boolean = false,
    reset_fuel_at_heat_start: boolean = false,
    end_heat_on_out_of_fuel: boolean = false,
    capacity: number = 100,
    usage_type: FuelUsageType = FuelUsageType.LINEAR,
    usage_rate: number = 4.0,
    start_level: number = 100,
    refuel_rate: number = 10,
    pit_stop_delay: number = 2.0
  ) {
    super(enabled, reset_fuel_at_heat_start, end_heat_on_out_of_fuel, capacity, usage_type, usage_rate, start_level, refuel_rate, pit_stop_delay);
  }
}
