import { FuelUsageType, OutOfFuelAction } from "@app/models/fuel_options";

import { AnalogFuelOptionsConverter } from "./analog_fuel_options.converter";

describe("AnalogFuelOptionsConverter", () => {
  it("should convert from proto with default values", () => {
    const result = AnalogFuelOptionsConverter.fromProto(null);
    expect(result.enabled).toBeFalse();
    expect(result.capacity).toBe(100);
    expect(result.usage_type).toBe(FuelUsageType.LINEAR);
  });

  it("should convert from proto with provided values", () => {
    const mockProto = {
      enabled: true,
      capacity: 80,
      usageType: 1, // QUADRATIC
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.enabled).toBeTrue();
    expect(result.capacity).toBe(80);
    expect(result.usage_type).toBe(FuelUsageType.QUADRATIC);
  });

  it("should handle string usage types", () => {
    const mockProto = {
      usageType: "CUBIC",
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.usage_type).toBe(FuelUsageType.CUBIC);
  });

  it("should parse outOfFuelAction from numbers", () => {
    const mockProto0 = { outOfFuelAction: 0 };
    const mockProto1 = { outOfFuelAction: 1 };
    const mockProto2 = { outOfFuelAction: 2 };

    expect(
      AnalogFuelOptionsConverter.fromProto(mockProto0 as any)
        .out_of_fuel_action,
    ).toBe(OutOfFuelAction.DO_NOT_COUNT_LAPS);
    expect(
      AnalogFuelOptionsConverter.fromProto(mockProto1 as any)
        .out_of_fuel_action,
    ).toBe(OutOfFuelAction.END_HEAT);
    expect(
      AnalogFuelOptionsConverter.fromProto(mockProto2 as any)
        .out_of_fuel_action,
    ).toBe(OutOfFuelAction.POWER_STUTTER);
  });

  it("should parse outOfFuelAction from strings", () => {
    const mockProto = { outOfFuelAction: "POWER_STUTTER" };
    expect(
      AnalogFuelOptionsConverter.fromProto(mockProto as any).out_of_fuel_action,
    ).toBe(OutOfFuelAction.POWER_STUTTER);
  });

  it("should fallback to endHeatOnOutOfFuel for legacy data", () => {
    const mockProtoTrue = { endHeatOnOutOfFuel: true };
    const mockProtoFalse = { endHeatOnOutOfFuel: false };

    expect(
      AnalogFuelOptionsConverter.fromProto(mockProtoTrue as any)
        .out_of_fuel_action,
    ).toBe(OutOfFuelAction.END_HEAT);
    expect(
      AnalogFuelOptionsConverter.fromProto(mockProtoFalse as any)
        .out_of_fuel_action,
    ).toBe(OutOfFuelAction.DO_NOT_COUNT_LAPS);
  });

  it("should read power stutter configs", () => {
    const mockProto = {
      powerStutterOnTime: 0.5,
      powerStutterOffTime: 1.5,
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.power_stutter_on_time).toBe(0.5);
    expect(result.power_stutter_off_time).toBe(1.5);
  });
});
