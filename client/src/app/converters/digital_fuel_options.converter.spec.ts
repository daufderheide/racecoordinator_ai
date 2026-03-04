import { DigitalFuelOptionsConverter } from "./digital_fuel_options.converter";
import { FuelUsageType } from "../models/fuel_options";

describe('DigitalFuelOptionsConverter', () => {
  it('should convert from proto with default values', () => {
    const result = DigitalFuelOptionsConverter.fromProto(null);
    expect(result.enabled).toBeFalse();
    expect(result.capacity).toBe(100);
    expect(result.usage_type).toBe(FuelUsageType.LINEAR);
  });

  it('should convert from proto with provided values', () => {
    const mockProto = {
      enabled: true,
      capacity: 120,
      usageType: 1, // QUADRATIC
      usageRate: 5.5,
      startLevel: 90,
      refuelRate: 15,
      pitStopDelay: 3.0,
      resetFuelAtHeatStart: true,
      endHeatOnOutOfFuel: true
    };
    const result = DigitalFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.enabled).toBeTrue();
    expect(result.capacity).toBe(120);
    expect(result.usage_type).toBe(FuelUsageType.QUADRATIC);
    expect(result.usage_rate).toBe(5.5);
    expect(result.start_level).toBe(90);
    expect(result.refuel_rate).toBe(15);
    expect(result.pit_stop_delay).toBe(3.0);
    expect(result.reset_fuel_at_heat_start).toBeTrue();
    expect(result.end_heat_on_out_of_fuel).toBeTrue();
  });

  it('should handle string usage types', () => {
    const mockProto = {
      usageType: 'CUBIC'
    };
    const result = DigitalFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.usage_type).toBe(FuelUsageType.CUBIC);
  });
});
