import { FuelUsageType } from "@app/models/fuel_options";

import {
  FuelGraphHost,
  RaceEditorFuelGraphHelper,
} from "./race-editor-fuel-graph.helper";

describe("RaceEditorFuelGraphHelper", () => {
  let mockHost: FuelGraphHost;

  beforeEach(() => {
    mockHost = {
      editingRace: {
        fuel_options: {
          enabled: true,
          fastest_time: 4.0,
          slowest_time: 8.0,
          reference_time: 6.0,
          usage_rate: 5.0,
          usage_type: FuelUsageType.LINEAR,
          capacity: 100,
          custom_curve: [
            { x: 0, y: 1 },
            { x: 0.5, y: 0.5 },
            { x: 1, y: 0 },
          ],
        },
        digital_fuel_options: {
          enabled: true,
          usage_rate: 2.0,
          usage_type: FuelUsageType.LINEAR,
          capacity: 80,
          custom_curve: [
            { x: 0, y: 0 },
            { x: 0.5, y: 0.5 },
            { x: 1, y: 1 },
          ],
        },
      },
      hiddenPlots: {
        analog_usage: new Set<string>(),
        analog_pit: new Set<string>(),
        digital_usage: new Set<string>(),
        digital_pit: new Set<string>(),
      },
      hoveredPoint: null,
      draggingNode: null,
      usageGraphCache: null,
      pitGraphCache: null,
      digitalUsageGraphCache: null,
      digitalPitGraphCache: null,
      previousAnalogPreset: FuelUsageType.LINEAR,
      previousDigitalPreset: FuelUsageType.LINEAR,
      captureState: jasmine.createSpy("captureState"),
    };
  });

  describe("Plot visibility and hiding", () => {
    it("should toggle plot visibility and clear cache", () => {
      mockHost.usageGraphCache = { path: "test" } as any;
      expect(
        RaceEditorFuelGraphHelper.isPlotHidden(
          mockHost,
          "analog_usage",
          FuelUsageType.LINEAR,
        ),
      ).toBeFalse();

      RaceEditorFuelGraphHelper.togglePlotVisibility(
        mockHost,
        "analog_usage",
        FuelUsageType.LINEAR,
      );
      expect(
        RaceEditorFuelGraphHelper.isPlotHidden(
          mockHost,
          "analog_usage",
          FuelUsageType.LINEAR,
        ),
      ).toBeTrue();
      expect(mockHost.usageGraphCache).toBeNull();

      RaceEditorFuelGraphHelper.togglePlotVisibility(
        mockHost,
        "analog_usage",
        FuelUsageType.LINEAR,
      );
      expect(
        RaceEditorFuelGraphHelper.isPlotHidden(
          mockHost,
          "analog_usage",
          FuelUsageType.LINEAR,
        ),
      ).toBeFalse();
    });

    it("should clear respective caches on toggling other graph types", () => {
      mockHost.pitGraphCache = {} as any;
      RaceEditorFuelGraphHelper.togglePlotVisibility(
        mockHost,
        "analog_pit",
        FuelUsageType.LINEAR,
      );
      expect(mockHost.pitGraphCache).toBeNull();

      mockHost.digitalUsageGraphCache = {} as any;
      RaceEditorFuelGraphHelper.togglePlotVisibility(
        mockHost,
        "digital_usage",
        FuelUsageType.LINEAR,
      );
      expect(mockHost.digitalUsageGraphCache).toBeNull();

      mockHost.digitalPitGraphCache = {} as any;
      RaceEditorFuelGraphHelper.togglePlotVisibility(
        mockHost,
        "digital_pit",
        FuelUsageType.LINEAR,
      );
      expect(mockHost.digitalPitGraphCache).toBeNull();
    });
  });

  describe("Time and usage calculations", () => {
    it("should compute fuel usage fastest, slowest, max and min usage", () => {
      expect(
        RaceEditorFuelGraphHelper.getFuelUsageFastestTime(mockHost.editingRace),
      ).toBe(4.0);
      expect(
        RaceEditorFuelGraphHelper.getFuelUsageSlowestTime(mockHost.editingRace),
      ).toBe(8.0);
      expect(
        RaceEditorFuelGraphHelper.getFuelUsageReferenceTime(
          mockHost.editingRace,
        ),
      ).toBe(6.0);
      expect(
        RaceEditorFuelGraphHelper.getFuelUsageMaxUsage(mockHost.editingRace),
      ).toBe(6.25);
      expect(
        RaceEditorFuelGraphHelper.getFuelUsageMinUsage(mockHost.editingRace),
      ).toBe(3.75);
      expect(
        RaceEditorFuelGraphHelper.getFuelUsageTimeRange(mockHost.editingRace),
      ).toBe("4s - 8s");

      const xLabels = RaceEditorFuelGraphHelper.getFuelUsageXLabels(
        mockHost.editingRace,
      );
      expect(xLabels.length).toBe(5);
      expect(xLabels[0]).toBe("4s");
      expect(xLabels[4]).toBe("8s");

      const pitYLabels = RaceEditorFuelGraphHelper.getPitGraphYLabels(
        mockHost.editingRace,
      );
      expect(pitYLabels.length).toBe(5);
    });

    it("should fallback gracefully when race has no times configured", () => {
      const emptyRace = { fuel_options: {} };
      expect(RaceEditorFuelGraphHelper.getFuelUsageFastestTime(emptyRace)).toBe(
        3.0,
      );
      expect(RaceEditorFuelGraphHelper.getFuelUsageSlowestTime(emptyRace)).toBe(
        9.0,
      );
      expect(
        RaceEditorFuelGraphHelper.getFuelUsageReferenceTime(emptyRace),
      ).toBe(6.0);
    });

    it("should calculate quadratic and cubic usage rates correctly", () => {
      const quadRace = {
        fuel_options: { usage_rate: 10, usage_type: "QUADRATIC" },
      };
      expect(RaceEditorFuelGraphHelper.getFuelUsageMaxUsage(quadRace)).toBe(40);
      expect(RaceEditorFuelGraphHelper.getFuelUsageMinUsage(quadRace)).toBe(
        4.44,
      );

      const cubicRace = {
        fuel_options: { usage_rate: 10, usage_type: "CUBIC" },
      };
      expect(RaceEditorFuelGraphHelper.getFuelUsageMaxUsage(cubicRace)).toBe(
        80,
      );
      expect(RaceEditorFuelGraphHelper.getFuelUsageMinUsage(cubicRace)).toBe(
        2.96,
      );
    });
  });

  describe("Graph paths and plots", () => {
    it("should generate analog usage and pit plots, caching results", () => {
      const plots = RaceEditorFuelGraphHelper.getFuelUsagePlots(mockHost);
      expect(plots.length).toBeGreaterThan(0);
      expect(mockHost.usageGraphCache).toBeDefined();

      const path = RaceEditorFuelGraphHelper.getFuelUsagePath(mockHost);
      expect(path).toBeDefined();

      const yLabels = RaceEditorFuelGraphHelper.getFuelUsageYLabels(mockHost);
      expect(yLabels.length).toBeGreaterThan(0);

      const pitPlots = RaceEditorFuelGraphHelper.getPitGraphPlots(mockHost);
      expect(pitPlots.length).toBeGreaterThan(0);
      expect(mockHost.pitGraphCache).toBeDefined();

      const pitPath = RaceEditorFuelGraphHelper.getPitGraphPath(mockHost);
      expect(pitPath).toBeDefined();

      const pitXLabels = RaceEditorFuelGraphHelper.getPitGraphXLabels(mockHost);
      expect(pitXLabels.length).toBeGreaterThan(0);
    });

    it("should generate digital usage and pit plots, caching results", () => {
      const dPlots = RaceEditorFuelGraphHelper.getDigitalUsagePlots(mockHost);
      expect(dPlots.length).toBeGreaterThan(0);
      expect(mockHost.digitalUsageGraphCache).toBeDefined();

      const dPath = RaceEditorFuelGraphHelper.getDigitalUsagePath(mockHost);
      expect(dPath).toBeDefined();

      const dYLabels =
        RaceEditorFuelGraphHelper.getDigitalUsageYLabels(mockHost);
      expect(dYLabels.length).toBeGreaterThan(0);

      const dPitPlots = RaceEditorFuelGraphHelper.getDigitalPitPlots(mockHost);
      expect(dPitPlots.length).toBeGreaterThan(0);
      expect(mockHost.digitalPitGraphCache).toBeDefined();

      const dPitPath = RaceEditorFuelGraphHelper.getDigitalPitPath(mockHost);
      expect(dPitPath).toBeDefined();

      const dPitXLabels =
        RaceEditorFuelGraphHelper.getDigitalPitXLabels(mockHost);
      expect(dPitXLabels.length).toBeGreaterThan(0);
    });

    it("should return empty labels when fuel is disabled", () => {
      mockHost.editingRace.fuel_options.enabled = false;
      mockHost.usageGraphCache = null;
      mockHost.pitGraphCache = null;
      expect(RaceEditorFuelGraphHelper.getFuelUsageYLabels(mockHost)).toEqual([
        "0.00",
        "0.00",
        "0.00",
        "0.00",
        "0.00",
      ]);
      expect(RaceEditorFuelGraphHelper.getPitGraphXLabels(mockHost)).toEqual([
        "0",
        "0",
        "0",
        "0",
        "0",
      ]);
    });
  });

  describe("Custom curve manipulation and drag", () => {
    it("should correctly identify custom curve mode", () => {
      expect(
        RaceEditorFuelGraphHelper.isCustomCurve(mockHost.editingRace, "analog"),
      ).toBeFalse();

      mockHost.editingRace.fuel_options.usage_type = FuelUsageType.CUSTOM_CURVE;
      expect(
        RaceEditorFuelGraphHelper.isCustomCurve(mockHost.editingRace, "analog"),
      ).toBeTrue();

      mockHost.editingRace.digital_fuel_options.usage_type =
        FuelUsageType.CUSTOM_CURVE;
      expect(
        RaceEditorFuelGraphHelper.isCustomCurve(
          mockHost.editingRace,
          "digital",
        ),
      ).toBeTrue();
    });

    it("should initialize custom curve on usage type change to custom", () => {
      RaceEditorFuelGraphHelper.onUsageTypeChange(
        mockHost,
        "analog",
        FuelUsageType.CUSTOM_CURVE,
      );
      expect(
        mockHost.editingRace.fuel_options.custom_curve.length,
      ).toBeGreaterThanOrEqual(3);

      RaceEditorFuelGraphHelper.onUsageTypeChange(
        mockHost,
        "digital",
        FuelUsageType.CUSTOM_CURVE,
      );
      expect(
        mockHost.editingRace.digital_fuel_options.custom_curve.length,
      ).toBeGreaterThanOrEqual(3);
    });

    it("should reset custom curve to presets", () => {
      RaceEditorFuelGraphHelper.resetCustomCurveToPreset(
        mockHost,
        "analog",
        "QUADRATIC",
      );
      expect(mockHost.captureState).toHaveBeenCalled();
      expect(mockHost.editingRace.fuel_options.custom_curve.length).toBe(5);

      RaceEditorFuelGraphHelper.resetCustomCurveToPreset(
        mockHost,
        "digital",
        "CUBIC",
      );
      expect(
        mockHost.editingRace.digital_fuel_options.custom_curve.length,
      ).toBe(5);
    });

    it("should compute control nodes for analog and digital", () => {
      const aNodes = RaceEditorFuelGraphHelper.getAnalogControlNodes(mockHost);
      expect(aNodes.length).toBe(3);
      expect(aNodes[0].svgX).toBe(0);

      const dNodes = RaceEditorFuelGraphHelper.getDigitalControlNodes(
        mockHost.editingRace,
      );
      expect(dNodes.length).toBe(3);
      expect(dNodes[2].svgX).toBe(400);
    });

    it("should start and end node dragging", () => {
      const mockEvent = jasmine.createSpyObj("MouseEvent", [
        "preventDefault",
        "stopPropagation",
      ]);
      RaceEditorFuelGraphHelper.startDragNode(mockHost, mockEvent, "analog", 1);
      expect(mockHost.draggingNode).toEqual({ mode: "analog", index: 1 });

      RaceEditorFuelGraphHelper.onWindowMouseUp(mockHost);
      expect(mockHost.draggingNode).toBeNull();
      expect(mockHost.captureState).toHaveBeenCalled();
    });

    it("should delete interior control nodes", () => {
      const mockEvent = jasmine.createSpyObj("MouseEvent", [
        "preventDefault",
        "stopPropagation",
      ]);
      // First add a point so length > 2
      mockHost.editingRace.fuel_options.custom_curve = [
        { x: 0, y: 1 },
        { x: 0.3, y: 0.7 },
        { x: 0.6, y: 0.4 },
        { x: 1, y: 0 },
      ];
      RaceEditorFuelGraphHelper.deleteControlNode(
        mockHost,
        mockEvent,
        "analog",
        1,
      );
      expect(mockHost.editingRace.fuel_options.custom_curve.length).toBe(3);
      expect(mockHost.captureState).toHaveBeenCalled();

      // Deleting endpoint should do nothing
      RaceEditorFuelGraphHelper.deleteControlNode(
        mockHost,
        mockEvent,
        "analog",
        0,
      );
      expect(mockHost.editingRace.fuel_options.custom_curve.length).toBe(3);
    });

    it("should handle mouse leave", () => {
      mockHost.hoveredPoint = {} as any;
      RaceEditorFuelGraphHelper.onGraphMouseLeave(mockHost);
      expect(mockHost.hoveredPoint).toBeNull();
    });
  });
});
