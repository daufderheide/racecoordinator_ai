export enum FuelUsageType {
  LINEAR = 'LINEAR',
  QUADRATIC = 'QUADRATIC',
  CUBIC = 'CUBIC'
}

export class AnalogFuelOptions {
  enabled: boolean;
  reset_fuel_at_heat_start: boolean;
  end_heat_on_out_of_fuel: boolean;
  capacity: number;
  usage_type: FuelUsageType;
  usage_rate: number;
  start_level: number;
  refuel_rate: number;
  pit_stop_delay: number;

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
    this.enabled = enabled;
    this.reset_fuel_at_heat_start = reset_fuel_at_heat_start;
    this.end_heat_on_out_of_fuel = end_heat_on_out_of_fuel;
    this.capacity = capacity;
    this.usage_type = usage_type;
    this.usage_rate = usage_rate;
    this.start_level = start_level;
    this.refuel_rate = refuel_rate;
    this.pit_stop_delay = pit_stop_delay;
  }
}
