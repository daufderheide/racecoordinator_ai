export enum FuelUsageType {
  LINEAR = "LINEAR",
  QUADRATIC = "QUADRATIC",
  CUBIC = "CUBIC",
}

export enum OutOfFuelAction {
  DO_NOT_COUNT_LAPS = "DO_NOT_COUNT_LAPS",
  END_HEAT = "END_HEAT",
  POWER_STUTTER = "POWER_STUTTER",
}

export abstract class FuelOptions {
  enabled: boolean;
  reset_fuel_at_heat_start: boolean;
  out_of_fuel_action: OutOfFuelAction;
  capacity: number;
  usage_type: FuelUsageType;
  usage_rate: number;
  start_level: number;
  refuel_rate: number;
  pit_stop_delay: number;

  constructor(
    enabled: boolean = false,
    reset_fuel_at_heat_start: boolean = false,
    out_of_fuel_action: OutOfFuelAction = OutOfFuelAction.DO_NOT_COUNT_LAPS,
    capacity: number = 100,
    usage_type: FuelUsageType = FuelUsageType.LINEAR,
    usage_rate: number = 4.0,
    start_level: number = 100,
    refuel_rate: number = 10,
    pit_stop_delay: number = 2.0,
  ) {
    this.enabled = enabled;
    this.reset_fuel_at_heat_start = reset_fuel_at_heat_start;
    this.out_of_fuel_action = out_of_fuel_action;
    this.capacity = capacity;
    this.usage_type = usage_type;
    this.usage_rate = usage_rate;
    this.start_level = start_level;
    this.refuel_rate = refuel_rate;
    this.pit_stop_delay = pit_stop_delay;
  }
}
