import { FuelCurvePoint, FuelUsageType } from "@app/models/fuel_options";

import {
  calculateAnalogPitHover,
  calculateAnalogUsageHover,
  calculateDigitalPitHover,
  calculateDigitalUsageHover,
  computeAnalogPitPlots,
  computeAnalogUsagePlots,
  computeDigitalPitPlots,
  computeDigitalUsagePlots,
  FUEL_CURVE_COLORS,
  FUEL_CURVE_LABELS,
  getAnalogFuelUsage,
  getCandidateUsageTypes,
  getDigitalFuelUsage,
  interpolateFuelCurveClient,
  isCustomCurveType,
  STANDARD_USAGE_TYPES,
} from "./fuel-graph.helper";

describe("FuelGraphHelper", () => {
  describe("interpolateFuelCurveClient", () => {
    it("should return 1.0 when points are undefined or empty", () => {
      expect(interpolateFuelCurveClient(undefined, 0.5)).toBe(1.0);
      expect(interpolateFuelCurveClient([], 0.5)).toBe(1.0);
    });

    it("should return the single point value", () => {
      expect(interpolateFuelCurveClient([{ x: 0.5, y: 2.5 }], 0.1)).toBe(2.5);
    });

    it("should clamp values below min x and above max x", () => {
      const points: FuelCurvePoint[] = [
        { x: 0.0, y: 4.0 },
        { x: 1.0, y: 1.0 },
      ];
      expect(interpolateFuelCurveClient(points, -0.5)).toBe(4.0);
      expect(interpolateFuelCurveClient(points, 1.5)).toBe(1.0);
    });

    it("should linearly interpolate intermediate values", () => {
      const points: FuelCurvePoint[] = [
        { x: 0.0, y: 4.0 },
        { x: 1.0, y: 1.0 },
      ];
      expect(interpolateFuelCurveClient(points, 0.5)).toBe(2.5);
      expect(interpolateFuelCurveClient(points, 0.25)).toBe(3.25);
    });
  });

  describe("getAnalogFuelUsage", () => {
    it("should calculate Linear fuel usage correctly", () => {
      const ref = 6.0;
      const rate = 4.0;
      // At ref time, linear usage should equal usageRate
      expect(
        getAnalogFuelUsage(FuelUsageType.LINEAR, rate, ref, ref),
      ).toBeCloseTo(4.0);
      // Slower lap (2 * ref = 12s) should consume half (2.0)
      expect(
        getAnalogFuelUsage(FuelUsageType.LINEAR, rate, 12.0, ref),
      ).toBeCloseTo(2.0);
    });

    it("should calculate Quadratic fuel usage correctly", () => {
      const ref = 6.0;
      const rate = 4.0;
      expect(
        getAnalogFuelUsage(FuelUsageType.QUADRATIC, rate, ref, ref),
      ).toBeCloseTo(4.0);
      // Half time (3s) -> (ref/time)^2 = 4 -> 4 * rate = 16.0
      expect(
        getAnalogFuelUsage(FuelUsageType.QUADRATIC, rate, 3.0, ref),
      ).toBeCloseTo(16.0);
    });

    it("should calculate Cubic fuel usage correctly", () => {
      const ref = 6.0;
      const rate = 4.0;
      expect(
        getAnalogFuelUsage(FuelUsageType.CUBIC, rate, ref, ref),
      ).toBeCloseTo(4.0);
      // Half time (3s) -> (ref/time)^3 = 8 -> 8 * rate = 32.0
      expect(
        getAnalogFuelUsage(FuelUsageType.CUBIC, rate, 3.0, ref),
      ).toBeCloseTo(32.0);
    });

    it("should calculate Custom curve fuel usage correctly", () => {
      const ref = 6.0;
      const rate = 4.0;
      const curve: FuelCurvePoint[] = [
        { x: 0.0, y: 2.0 },
        { x: 1.0, y: 0.5 },
      ];
      // At min time (3.0s -> xNorm = 0), mult = 2.0 -> 8.0
      expect(
        getAnalogFuelUsage(FuelUsageType.CUSTOM_CURVE, rate, 3.0, ref, curve),
      ).toBeCloseTo(8.0);
      // At max time (9.0s -> xNorm = 1), mult = 0.5 -> 2.0
      expect(
        getAnalogFuelUsage(FuelUsageType.CUSTOM_CURVE, rate, 9.0, ref, curve),
      ).toBeCloseTo(2.0);
    });
  });

  describe("getDigitalFuelUsage", () => {
    it("should calculate Digital fuel usage across models", () => {
      const rate = 5.0;
      // At 100% throttle, Linear, Quadratic, and Cubic all equal usageRate
      expect(getDigitalFuelUsage(FuelUsageType.LINEAR, rate, 100)).toBeCloseTo(
        5.0,
      );
      expect(
        getDigitalFuelUsage(FuelUsageType.QUADRATIC, rate, 100),
      ).toBeCloseTo(5.0);
      expect(getDigitalFuelUsage(FuelUsageType.CUBIC, rate, 100)).toBeCloseTo(
        5.0,
      );

      // At 50% throttle:
      // Linear: 5 * 0.5 = 2.5
      expect(getDigitalFuelUsage(FuelUsageType.LINEAR, rate, 50)).toBeCloseTo(
        2.5,
      );
      // Quadratic: 5 * 0.5 * (1 + 0.5) = 3.75
      expect(
        getDigitalFuelUsage(FuelUsageType.QUADRATIC, rate, 50),
      ).toBeCloseTo(3.75);
    });

    it("should calculate Digital fuel with custom curve", () => {
      const rate = 5.0;
      const curve: FuelCurvePoint[] = [
        { x: 0.0, y: 0.0 },
        { x: 1.0, y: 1.0 },
      ];
      expect(
        getDigitalFuelUsage(FuelUsageType.CUSTOM_CURVE, rate, 50, curve),
      ).toBeCloseTo(2.5);
    });
  });

  describe("getCandidateUsageTypes & isCustomCurveType", () => {
    it("should recognize custom curve types", () => {
      expect(isCustomCurveType(FuelUsageType.CUSTOM_CURVE)).toBeTrue();
      expect(isCustomCurveType("CUSTOM")).toBeTrue();
      expect(isCustomCurveType(FuelUsageType.LINEAR)).toBeFalse();
    });

    it("should return only standard types when preset is active", () => {
      const candidates = getCandidateUsageTypes(FuelUsageType.LINEAR);
      expect(candidates).toEqual(STANDARD_USAGE_TYPES);
      expect(candidates).not.toContain(FuelUsageType.CUSTOM_CURVE);
    });

    it("should include custom curve type when custom is active", () => {
      const candidates = getCandidateUsageTypes(FuelUsageType.CUSTOM_CURVE);
      expect(candidates).toContain(FuelUsageType.CUSTOM_CURVE);
      expect(candidates.length).toBe(4);
    });
  });

  describe("computeAnalogUsagePlots", () => {
    it("should show all 3 standard plots when Linear is selected", () => {
      const result = computeAnalogUsagePlots(
        FuelUsageType.LINEAR,
        4.0,
        6.0,
        3.0,
        9.0,
        undefined,
        1.0,
        new Set<string>(),
      );

      expect(result.plots.length).toBe(3);
      const linearPlot = result.plots.find(
        (p) => p.type === FuelUsageType.LINEAR,
      )!;
      const quadPlot = result.plots.find(
        (p) => p.type === FuelUsageType.QUADRATIC,
      )!;
      const cubicPlot = result.plots.find(
        (p) => p.type === FuelUsageType.CUBIC,
      )!;

      expect(linearPlot.isSelected).toBeTrue();
      expect(linearPlot.isVisible).toBeTrue();
      expect(linearPlot.color).toBe(FUEL_CURVE_COLORS[FuelUsageType.LINEAR]);
      expect(linearPlot.path).toContain("M ");

      expect(quadPlot.isSelected).toBeFalse();
      expect(quadPlot.isVisible).toBeTrue();

      expect(cubicPlot.isSelected).toBeFalse();
      expect(cubicPlot.isVisible).toBeTrue();

      expect(result.labels.length).toBe(5);
    });

    it("should show 4 plots with Custom highlighted when custom is active", () => {
      const result = computeAnalogUsagePlots(
        FuelUsageType.CUSTOM_CURVE,
        4.0,
        6.0,
        3.0,
        9.0,
        undefined,
        1.5,
        new Set<string>(),
      );

      expect(result.plots.length).toBe(4);
      const customPlot = result.plots.find(
        (p) => p.type === FuelUsageType.CUSTOM_CURVE,
      )!;
      const linearPlot = result.plots.find(
        (p) => p.type === FuelUsageType.LINEAR,
      )!;

      expect(customPlot.isSelected).toBeTrue();
      expect(customPlot.isVisible).toBeTrue();
      expect(linearPlot.isSelected).toBeFalse();
    });

    it("should hide plot and adapt maxFuelValue when curve is hidden", () => {
      const hidden = new Set<string>([FuelUsageType.CUBIC]);
      const result = computeAnalogUsagePlots(
        FuelUsageType.LINEAR,
        4.0,
        6.0,
        3.0,
        9.0,
        undefined,
        1.0,
        hidden,
      );

      const cubicPlot = result.plots.find(
        (p) => p.type === FuelUsageType.CUBIC,
      )!;
      expect(cubicPlot.isVisible).toBeFalse();
      expect(cubicPlot.path).toBe("");

      // With Cubic hidden, max should be Quadratic at minTime (16.0) instead of Cubic (32.0)
      expect(result.maxFuelValue).toBeCloseTo(16.0);
    });
  });

  describe("computeAnalogPitPlots", () => {
    it("should compute pit time plots for all candidates", () => {
      const result = computeAnalogPitPlots(
        FuelUsageType.QUADRATIC,
        4.0,
        100,
        6.0,
        3.0,
        9.0,
        undefined,
        new Set<string>(),
      );

      expect(result.plots.length).toBe(3);
      const quadPlot = result.plots.find(
        (p) => p.type === FuelUsageType.QUADRATIC,
      )!;
      expect(quadPlot.isSelected).toBeTrue();
      expect(result.labels.length).toBe(5);
      expect(result.maxPitTime).toBeGreaterThan(0);
    });
  });

  describe("computeDigitalUsagePlots & computeDigitalPitPlots", () => {
    it("should compute digital usage plots with all 3 standard models", () => {
      const result = computeDigitalUsagePlots(
        FuelUsageType.CUBIC,
        6.0,
        undefined,
        1.0,
        new Set<string>(),
      );

      expect(result.plots.length).toBe(3);
      const cubicPlot = result.plots.find(
        (p) => p.type === FuelUsageType.CUBIC,
      )!;
      expect(cubicPlot.isSelected).toBeTrue();
      expect(result.maxFuelValue).toBe(6.0);
    });

    it("should compute digital pit plots", () => {
      const result = computeDigitalPitPlots(
        FuelUsageType.LINEAR,
        6.0,
        100,
        undefined,
        new Set<string>(),
      );

      expect(result.plots.length).toBe(3);
      expect(result.safeMaxTime).toBeGreaterThan(0);
      expect(result.labels.length).toBe(5);
    });
  });

  describe("calculateAnalogUsageHover", () => {
    it("should return multi-curve hover data and exclude hidden curves", () => {
      const hidden = new Set<string>([FuelUsageType.CUBIC]);
      const hover = calculateAnalogUsageHover(
        200, // middle (50%) -> time = 6.0s (ref time)
        50,
        400,
        3.0,
        9.0,
        FuelUsageType.LINEAR,
        4.0,
        6.0,
        undefined,
        16.0,
        hidden,
      );

      expect(hover.type).toBe("usage");
      expect(hover.xValue).toBe("6.00s");
      expect(hover.yValue).toBe("4.0");

      // Cubic should be excluded because it's in hidden
      expect(hover.curvePoints.length).toBe(2);
      expect(
        hover.curvePoints.some((cp) => cp.type === FuelUsageType.CUBIC),
      ).toBeFalse();

      const linearCp = hover.curvePoints.find(
        (cp) => cp.type === FuelUsageType.LINEAR,
      )!;
      expect(linearCp.isSelected).toBeTrue();
      expect(linearCp.value).toBe("4.0");
      expect(linearCp.labelKey).toBe(FUEL_CURVE_LABELS[FuelUsageType.LINEAR]);
    });
  });

  describe("calculateAnalogPitHover", () => {
    it("should return pit hover with comparative points", () => {
      const hover = calculateAnalogPitHover(
        200,
        75,
        150,
        3.0,
        9.0,
        FuelUsageType.QUADRATIC,
        4.0,
        100,
        6.0,
        undefined,
        500,
        new Set<string>(),
      );

      expect(hover.type).toBe("pit");
      expect(hover.curvePoints.length).toBe(3);
      const quadCp = hover.curvePoints.find(
        (cp) => cp.type === FuelUsageType.QUADRATIC,
      )!;
      expect(quadCp.isSelected).toBeTrue();
    });
  });

  describe("calculateDigitalUsageHover & calculateDigitalPitHover", () => {
    it("should return digital usage hover info", () => {
      const hover = calculateDigitalUsageHover(
        200,
        50,
        400,
        FuelUsageType.LINEAR,
        5.0,
        undefined,
        5.0,
        new Set<string>(),
      );

      expect(hover.type).toBe("digital_usage");
      expect(hover.xValue).toBe("50%");
      expect(hover.curvePoints.length).toBe(3);
    });

    it("should return digital pit hover info", () => {
      const hover = calculateDigitalPitHover(
        150,
        75,
        150,
        FuelUsageType.LINEAR,
        5.0,
        100,
        undefined,
        300,
        new Set<string>(),
      );

      expect(hover.type).toBe("digital_pit");
      expect(hover.xLabel).toBe("RE_HOVER_TIME_TO_PIT");
      expect(hover.curvePoints.length).toBe(3);
    });
  });
});
