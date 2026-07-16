import { FuelUsageType, OutOfFuelAction } from "@app/models/fuel_options";

import { DigitalFuelOptionsConverter } from "./digital_fuel_options.converter";

describe("DigitalFuelOptionsConverter", () => {
  it("should convert from proto with default values", () => {
    const result = DigitalFuelOptionsConverter.fromProto(null);
    expect(result.enabled).toBeFalse();
    expect(result.capacity).toBe(100);
    expect(result.usage_type).toBe(FuelUsageType.LINEAR);
  });

  it("should convert from proto with provided values", () => {
    const mockProto = {
      enabled: true,
      capacity: 120,
      usageType: 1, // QUADRATIC
      usageRate: 5.5,
      startLevel: 90,
      refuelRate: 15,
      pitStopDelay: 3.0,
      resetFuelAtHeatStart: true,
      outOfFuelAction: OutOfFuelAction.END_HEAT,
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
    expect(result.out_of_fuel_action).toBe(OutOfFuelAction.END_HEAT);
  });

  it("should handle string usage types", () => {
    const mockProto = {
      usageType: "CUBIC",
    };
    const result = DigitalFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.usage_type).toBe(FuelUsageType.CUBIC);
  });

  it("should fallback POWER_STUTTER to DO_NOT_COUNT_LAPS for digital fuel", () => {
    const mockProto = {
      outOfFuelAction: OutOfFuelAction.POWER_STUTTER,
    };
    const result = DigitalFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.out_of_fuel_action).toBe(OutOfFuelAction.DO_NOT_COUNT_LAPS);
  });
});
