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

  it("should map reference_time from proto and provide default", () => {
    const defaultResult = AnalogFuelOptionsConverter.fromProto(null);
    expect(defaultResult.reference_time).toBe(6.0);

    const customProto = { referenceTime: 15.0 };
    const customResult = AnalogFuelOptionsConverter.fromProto(
      customProto as any,
    );
    expect(customResult.reference_time).toBe(15.0);

    const snakeCaseProto = { reference_time: 12.5 };
    const snakeCaseResult = AnalogFuelOptionsConverter.fromProto(
      snakeCaseProto as any,
    );
    expect(snakeCaseResult.reference_time).toBe(12.5);
  });

  it("should map CUSTOM_CURVE usage type and custom_curve points", () => {
    const mockProto = {
      usageType: 3, // CUSTOM_CURVE
      customCurve: [
        { x: 0, y: 4 },
        { x: 0.5, y: 1 },
        { x: 1, y: 0 },
      ],
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.usage_type).toBe(FuelUsageType.CUSTOM_CURVE);
    expect(result.custom_curve.length).toBe(3);
    expect(result.custom_curve[0]).toEqual({ x: 0, y: 4 });
    expect(result.custom_curve[1]).toEqual({ x: 0.5, y: 1 });
    expect(result.custom_curve[2]).toEqual({ x: 1, y: 0 });
  });

  it("should handle snake_case custom_curve and string CUSTOM", () => {
    const mockProto = {
      usageType: "CUSTOM",
      custom_curve: [{ x: 0.2, y: 3.0 }],
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.usage_type).toBe(FuelUsageType.CUSTOM_CURVE);
    expect(result.custom_curve).toEqual([{ x: 0.2, y: 3.0 }]);
  });

  it("should map 4 analog parameters when present in proto", () => {
    const mockProto = {
      fastestTime: 2.5,
      maxUsage: 7.0,
      slowestTime: 8.0,
      minUsage: 1.5,
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.fastest_time).toBe(2.5);
    expect(result.max_usage).toBe(7.0);
    expect(result.slowest_time).toBe(8.0);
    expect(result.min_usage).toBe(1.5);
  });

  it("should map snake_case 4 analog parameters when present", () => {
    const mockProto = {
      fastest_time: 3.2,
      max_usage: 6.5,
      slowest_time: 9.5,
      min_usage: 2.2,
    };
    const result = AnalogFuelOptionsConverter.fromProto(mockProto as any);
    expect(result.fastest_time).toBe(3.2);
    expect(result.max_usage).toBe(6.5);
    expect(result.slowest_time).toBe(9.5);
    expect(result.min_usage).toBe(2.2);
  });

  it("should calculate fallback 4 parameters from legacy referenceTime and usageRate", () => {
    const mockLinear = {
      referenceTime: 6.0,
      usageRate: 4.0,
      usageType: 0, // LINEAR
    };
    const resLinear = AnalogFuelOptionsConverter.fromProto(mockLinear as any);
    expect(resLinear.fastest_time).toBe(3.0);
    expect(resLinear.max_usage).toBe(5.0);
    expect(resLinear.slowest_time).toBe(9.0);
    expect(resLinear.min_usage).toBe(3.0);

    const mockQuad = {
      referenceTime: 6.0,
      usageRate: 4.0,
      usageType: 1, // QUADRATIC
    };
    const resQuad = AnalogFuelOptionsConverter.fromProto(mockQuad as any);
    expect(resQuad.fastest_time).toBe(3.0);
    expect(resQuad.max_usage).toBe(16.0);
    expect(resQuad.slowest_time).toBe(9.0);
    expect(resQuad.min_usage).toBeCloseTo(4.0 * (4.0 / 9.0), 3);

    const mockCubic = {
      referenceTime: 6.0,
      usageRate: 4.0,
      usageType: 2, // CUBIC
    };
    const resCubic = AnalogFuelOptionsConverter.fromProto(mockCubic as any);
    expect(resCubic.fastest_time).toBe(3.0);
    expect(resCubic.max_usage).toBe(32.0);
    expect(resCubic.slowest_time).toBe(9.0);
    expect(resCubic.min_usage).toBeCloseTo(4.0 * (8.0 / 27.0), 3);
  });
});
