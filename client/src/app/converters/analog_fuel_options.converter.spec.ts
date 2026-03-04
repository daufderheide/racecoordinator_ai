import { AnalogFuelOptionsConverter } from "./analog_fuel_options.converter";
import { FuelUsageType } from "../models/analog_fuel_options";

describe('AnalogFuelOptionsConverter', () => {
  it('should convert from proto with default values', () => {
    const result = AnalogFuelOptionsConverter.fromProto(null);
    expect(result.enabled).toBeFalse();
    expect(result.capacity).toBe(100);
  });

  it('should convert from proto with provided values', () => {
    const mockProto = {
      enabled: true,
      capacity: 80,
      usageType: 1 // QUADRATIC
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.enabled).toBeTrue();
    expect(result.capacity).toBe(80);
    expect(result.usage_type).toBe(FuelUsageType.QUADRATIC);
  });

  it('should handle string usage types', () => {
    const mockProto = {
      usageType: 'CUBIC'
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.usage_type).toBe(FuelUsageType.CUBIC);
  });
});
