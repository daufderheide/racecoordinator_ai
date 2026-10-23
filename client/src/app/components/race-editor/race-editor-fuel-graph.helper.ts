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
  FuelGraphHoverPoint,
  FuelGraphPlot,
  getAnalogFuelUsage,
  getDigitalFuelUsage,
  interpolateFuelCurveClient,
  isCustomCurveType,
} from "./fuel-graph.helper";

export interface FuelGraphCacheEntry {
  path: string;
  plots: FuelGraphPlot[];
  labels: string[];
  maxVal: number;
  argsKey: string;
}

export interface FuelGraphHost {
  editingRace: any;
  hiddenPlots: {
    analog_usage: Set<string>;
    analog_pit: Set<string>;
    digital_usage: Set<string>;
    digital_pit: Set<string>;
  };
  hoveredPoint: FuelGraphHoverPoint | null;
  draggingNode: {
    mode: "analog" | "digital";
    index: number;
  } | null;
  usageGraphCache: FuelGraphCacheEntry | null;
  pitGraphCache: FuelGraphCacheEntry | null;
  digitalUsageGraphCache: FuelGraphCacheEntry | null;
  digitalPitGraphCache: FuelGraphCacheEntry | null;
  previousAnalogPreset: FuelUsageType | string;
  previousDigitalPreset: FuelUsageType | string;
  captureState: () => void;
}

export class RaceEditorFuelGraphHelper {
  static readonly EMPTY_LABELS: string[] = [];

  static togglePlotVisibility(
    host: FuelGraphHost,
    graphId: "analog_usage" | "analog_pit" | "digital_usage" | "digital_pit",
    type: FuelUsageType | string,
  ): void {
    const set = host.hiddenPlots[graphId];
    if (set.has(type)) {
      set.delete(type);
    } else {
      set.add(type);
    }
    if (graphId === "analog_usage") {
      host.usageGraphCache = null;
    } else if (graphId === "analog_pit") {
      host.pitGraphCache = null;
    } else if (graphId === "digital_usage") {
      host.digitalUsageGraphCache = null;
    } else {
      host.digitalPitGraphCache = null;
    }
  }

  static isPlotHidden(
    host: FuelGraphHost,
    graphId: "analog_usage" | "analog_pit" | "digital_usage" | "digital_pit",
    type: FuelUsageType | string,
  ): boolean {
    return host.hiddenPlots[graphId].has(type);
  }

  static getFuelUsageFastestTime(editingRace: any): number {
    const val = Number(editingRace?.fuel_options?.fastest_time);
    if (!isNaN(val) && val > 0) return val;
    const ref = Number(editingRace?.fuel_options?.reference_time);
    return !isNaN(ref) && ref > 0
      ? Math.max(0.1, Number((ref * 0.5).toFixed(2)))
      : 3.0;
  }

  static getFuelUsageMaxUsage(editingRace: any): number {
    const val = Number(editingRace?.fuel_options?.max_usage);
    if (!isNaN(val) && val >= 0) return val;
    const rate = Number(editingRace?.fuel_options?.usage_rate) || 4.0;
    const type = editingRace?.fuel_options?.usage_type;
    if (type === "QUADRATIC") return Number((rate * 4.0).toFixed(2));
    if (type === "CUBIC") return Number((rate * 8.0).toFixed(2));
    return Number((rate * 1.25).toFixed(2));
  }

  static getFuelUsageSlowestTime(editingRace: any): number {
    const val = Number(editingRace?.fuel_options?.slowest_time);
    if (!isNaN(val) && val > 0) return val;
    const ref = Number(editingRace?.fuel_options?.reference_time);
    return !isNaN(ref) && ref > 0
      ? Math.max(0.2, Number((ref * 1.5).toFixed(2)))
      : 9.0;
  }

  static getFuelUsageMinUsage(editingRace: any): number {
    const val = Number(editingRace?.fuel_options?.min_usage);
    if (!isNaN(val) && val >= 0) return val;
    const rate = Number(editingRace?.fuel_options?.usage_rate) || 4.0;
    const type = editingRace?.fuel_options?.usage_type;
    if (type === "QUADRATIC") return Number((rate * (4.0 / 9.0)).toFixed(2));
    if (type === "CUBIC") return Number((rate * (8.0 / 27.0)).toFixed(2));
    return Number((rate * 0.75).toFixed(2));
  }

  static getFuelUsageReferenceTime(editingRace: any): number {
    const ref = Number(editingRace?.fuel_options?.reference_time);
    if (!isNaN(ref) && ref > 0) return ref;
    return Number(
      (
        (this.getFuelUsageFastestTime(editingRace) +
          this.getFuelUsageSlowestTime(editingRace)) /
        2
      ).toFixed(2),
    );
  }

  static getFuelUsageMinTime(editingRace: any): number {
    return this.getFuelUsageFastestTime(editingRace);
  }

  static getFuelUsageMaxTime(editingRace: any): number {
    return Math.max(
      this.getFuelUsageMinTime(editingRace) + 0.1,
      this.getFuelUsageSlowestTime(editingRace),
    );
  }

  static getFuelUsageTimeRange(editingRace: any): string {
    return `${this.getFuelUsageMinTime(editingRace)}s - ${this.getFuelUsageMaxTime(editingRace)}s`;
  }

  static getFuelUsageXLabels(editingRace: any): string[] {
    const min = this.getFuelUsageMinTime(editingRace);
    const max = this.getFuelUsageMaxTime(editingRace);
    const step = (max - min) / 4;
    const labels: string[] = [];
    for (let i = 0; i <= 4; i++) {
      const val = min + i * step;
      labels.push(`${Number(val.toFixed(2))}s`);
    }
    return labels;
  }

  static getPitGraphYLabels(editingRace: any): string[] {
    const min = this.getFuelUsageMinTime(editingRace);
    const max = this.getFuelUsageMaxTime(editingRace);
    const step = (max - min) / 4;
    const labels: string[] = [];
    for (let i = 4; i >= 0; i--) {
      const val = min + i * step;
      labels.push(`${Number(val.toFixed(2))}s`);
    }
    return labels;
  }

  static updateUsageGraphCache(host: FuelGraphHost): void {
    if (!host.editingRace?.fuel_options) return;

    const options = host.editingRace.fuel_options;
    const fastestTime = this.getFuelUsageFastestTime(host.editingRace);
    const maxUsage = this.getFuelUsageMaxUsage(host.editingRace);
    const slowestTime = this.getFuelUsageSlowestTime(host.editingRace);
    const minUsage = this.getFuelUsageMinUsage(host.editingRace);
    const curveKey = JSON.stringify(options.custom_curve || []);
    const hiddenKey = Array.from(host.hiddenPlots.analog_usage)
      .sort()
      .join(",");
    const key = `${options.usage_type}_${fastestTime}_${maxUsage}_${slowestTime}_${minUsage}_${curveKey}_${hiddenKey}`;

    if (host.usageGraphCache && host.usageGraphCache.argsKey === key) return;

    const customMaxMult = this.getAnalogCurveMaxMultiplier(host.editingRace);

    const result = computeAnalogUsagePlots(
      options.usage_type,
      fastestTime,
      maxUsage,
      slowestTime,
      minUsage,
      options.custom_curve,
      customMaxMult,
      host.hiddenPlots.analog_usage,
    );

    const selectedPlot =
      result.plots.find((p) => p.isSelected) || result.plots[0];

    host.usageGraphCache = {
      path: selectedPlot?.path || "",
      plots: result.plots,
      labels: result.labels,
      maxVal: result.maxFuelValue,
      argsKey: key,
    };
  }

  static getFuelUsagePlots(host: FuelGraphHost): FuelGraphPlot[] {
    this.updateUsageGraphCache(host);
    return host.usageGraphCache?.plots || [];
  }

  static getFuelUsagePath(host: FuelGraphHost): string {
    this.updateUsageGraphCache(host);
    return host.usageGraphCache?.path || "";
  }

  static getFuelUsageYLabels(host: FuelGraphHost): string[] {
    if (!host.editingRace?.fuel_options?.enabled) {
      return ["0.00", "0.00", "0.00", "0.00", "0.00"];
    }
    this.updateUsageGraphCache(host);
    if (host.usageGraphCache) return host.usageGraphCache.labels;
    return this.EMPTY_LABELS;
  }

  static updatePitGraphCache(host: FuelGraphHost): void {
    if (!host.editingRace?.fuel_options) return;

    const options = host.editingRace.fuel_options;
    const fastestTime = this.getFuelUsageFastestTime(host.editingRace);
    const maxUsage = this.getFuelUsageMaxUsage(host.editingRace);
    const slowestTime = this.getFuelUsageSlowestTime(host.editingRace);
    const minUsage = this.getFuelUsageMinUsage(host.editingRace);
    const capacity = Number(options.capacity) || 100;
    const curveKey = JSON.stringify(options.custom_curve || []);
    const hiddenKey = Array.from(host.hiddenPlots.analog_pit).sort().join(",");
    const key = `${options.usage_type}_${fastestTime}_${maxUsage}_${slowestTime}_${minUsage}_${capacity}_${curveKey}_${hiddenKey}`;

    if (host.pitGraphCache && host.pitGraphCache.argsKey === key) return;

    const result = computeAnalogPitPlots(
      options.usage_type,
      fastestTime,
      maxUsage,
      slowestTime,
      minUsage,
      capacity,
      options.custom_curve,
      host.hiddenPlots.analog_pit,
    );

    const selectedPlot =
      result.plots.find((p) => p.isSelected) || result.plots[0];

    host.pitGraphCache = {
      path: selectedPlot?.path || "",
      plots: result.plots,
      labels: result.labels,
      maxVal: result.maxPitTime,
      argsKey: key,
    };
  }

  static getPitGraphPlots(host: FuelGraphHost): FuelGraphPlot[] {
    this.updatePitGraphCache(host);
    return host.pitGraphCache?.plots || [];
  }

  static getPitGraphPath(host: FuelGraphHost): string {
    this.updatePitGraphCache(host);
    return host.pitGraphCache?.path || "";
  }

  static getPitGraphXLabels(host: FuelGraphHost): string[] {
    if (!host.editingRace?.fuel_options?.enabled) {
      return ["0", "0", "0", "0", "0"];
    }
    this.updatePitGraphCache(host);
    if (host.pitGraphCache) return host.pitGraphCache.labels;
    return this.EMPTY_LABELS;
  }

  static updateDigitalUsageGraphCache(host: FuelGraphHost): void {
    if (!host.editingRace?.digital_fuel_options) return;
    const options = host.editingRace.digital_fuel_options;
    const curveKey = JSON.stringify(options.custom_curve || []);
    const hiddenKey = Array.from(host.hiddenPlots.digital_usage)
      .sort()
      .join(",");
    const key = `${options.usage_type}_${options.usage_rate}_${curveKey}_${hiddenKey}`;

    if (
      host.digitalUsageGraphCache &&
      host.digitalUsageGraphCache.argsKey === key
    )
      return;

    const customMaxMult = this.getDigitalCurveMaxMultiplier(host.editingRace);
    const usageRate = Number(options.usage_rate) || 0;

    const result = computeDigitalUsagePlots(
      options.usage_type,
      usageRate,
      options.custom_curve,
      customMaxMult,
      host.hiddenPlots.digital_usage,
    );

    const selectedPlot =
      result.plots.find((p) => p.isSelected) || result.plots[0];

    host.digitalUsageGraphCache = {
      path: selectedPlot?.path || "",
      plots: result.plots,
      labels: result.labels,
      maxVal: result.maxFuelValue,
      argsKey: key,
    };
  }

  static getDigitalUsagePlots(host: FuelGraphHost): FuelGraphPlot[] {
    this.updateDigitalUsageGraphCache(host);
    return host.digitalUsageGraphCache?.plots || [];
  }

  static getDigitalUsagePath(host: FuelGraphHost): string {
    this.updateDigitalUsageGraphCache(host);
    return host.digitalUsageGraphCache?.path || "";
  }

  static getDigitalUsageYLabels(host: FuelGraphHost): string[] {
    this.updateDigitalUsageGraphCache(host);
    return host.digitalUsageGraphCache?.labels || this.EMPTY_LABELS;
  }

  static updateDigitalPitGraphCache(host: FuelGraphHost): void {
    if (!host.editingRace?.digital_fuel_options) return;
    const options = host.editingRace.digital_fuel_options;
    const curveKey = JSON.stringify(options.custom_curve || []);
    const hiddenKey = Array.from(host.hiddenPlots.digital_pit).sort().join(",");
    const key = `${options.usage_type}_${options.usage_rate}_${options.capacity}_${curveKey}_${hiddenKey}`;

    if (host.digitalPitGraphCache && host.digitalPitGraphCache.argsKey === key)
      return;

    const capacity = Number(options.capacity) || 100;
    const usageRate = Number(options.usage_rate) || 0;

    const result = computeDigitalPitPlots(
      options.usage_type,
      usageRate,
      capacity,
      options.custom_curve,
      host.hiddenPlots.digital_pit,
    );

    const selectedPlot =
      result.plots.find((p) => p.isSelected) || result.plots[0];

    host.digitalPitGraphCache = {
      path: selectedPlot?.path || "",
      plots: result.plots,
      labels: result.labels,
      maxVal: result.safeMaxTime,
      argsKey: key,
    };
  }

  static getDigitalPitPlots(host: FuelGraphHost): FuelGraphPlot[] {
    this.updateDigitalPitGraphCache(host);
    return host.digitalPitGraphCache?.plots || [];
  }

  static getDigitalPitPath(host: FuelGraphHost): string {
    this.updateDigitalPitGraphCache(host);
    return host.digitalPitGraphCache?.path || "";
  }

  static getDigitalPitXLabels(host: FuelGraphHost): string[] {
    this.updateDigitalPitGraphCache(host);
    return host.digitalPitGraphCache?.labels || this.EMPTY_LABELS;
  }

  static onGraphMouseMove(
    host: FuelGraphHost,
    event: MouseEvent,
    type: "usage" | "pit",
  ): void {
    if (!host.editingRace?.fuel_options) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const width = rect.width || 400;
    const height = rect.height || 150;

    const options = host.editingRace.fuel_options;
    const fastestTime = this.getFuelUsageFastestTime(host.editingRace);
    const maxUsage = this.getFuelUsageMaxUsage(host.editingRace);
    const slowestTime = this.getFuelUsageSlowestTime(host.editingRace);
    const minUsage = this.getFuelUsageMinUsage(host.editingRace);

    if (type === "usage") {
      this.updateUsageGraphCache(host);
      const maxVal = host.usageGraphCache?.maxVal || 1;
      host.hoveredPoint = calculateAnalogUsageHover(
        mouseX,
        mouseY,
        width,
        fastestTime,
        maxUsage,
        slowestTime,
        minUsage,
        options.usage_type,
        options.custom_curve,
        maxVal,
        host.hiddenPlots.analog_usage,
      );
    } else {
      const capacity = Number(options.capacity) || 100;
      this.updatePitGraphCache(host);
      const maxVal = host.pitGraphCache?.maxVal || 1;
      host.hoveredPoint = calculateAnalogPitHover(
        mouseX,
        mouseY,
        height,
        fastestTime,
        maxUsage,
        slowestTime,
        minUsage,
        options.usage_type,
        capacity,
        options.custom_curve,
        maxVal,
        host.hiddenPlots.analog_pit,
      );
    }
  }

  static onDigitalGraphMouseMove(
    host: FuelGraphHost,
    event: MouseEvent,
    type: "usage" | "pit",
  ): void {
    if (!host.editingRace?.digital_fuel_options) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const width = rect.width || 400;
    const height = rect.height || 150;

    const options = host.editingRace.digital_fuel_options;
    const usageRate = Number(options.usage_rate) || 0;

    if (type === "usage") {
      this.updateDigitalUsageGraphCache(host);
      const maxVal = host.digitalUsageGraphCache?.maxVal || 1;
      host.hoveredPoint = calculateDigitalUsageHover(
        mouseX,
        mouseY,
        width,
        options.usage_type,
        usageRate,
        options.custom_curve,
        maxVal,
        host.hiddenPlots.digital_usage,
      );
    } else {
      const capacity = Number(options.capacity) || 100;
      this.updateDigitalPitGraphCache(host);
      const maxVal = host.digitalPitGraphCache?.maxVal || 1;
      host.hoveredPoint = calculateDigitalPitHover(
        mouseX,
        mouseY,
        height,
        options.usage_type,
        usageRate,
        capacity,
        options.custom_curve,
        maxVal,
        host.hiddenPlots.digital_pit,
      );
    }
  }

  static onGraphMouseLeave(host: FuelGraphHost): void {
    host.hoveredPoint = null;
  }

  static isCustomCurve(editingRace: any, mode: "analog" | "digital"): boolean {
    if (mode === "analog") {
      const type = editingRace?.fuel_options?.usage_type;
      return isCustomCurveType(type);
    } else {
      const type = editingRace?.digital_fuel_options?.usage_type;
      return isCustomCurveType(type);
    }
  }

  static onUsageTypeChange(
    host: FuelGraphHost,
    mode: "analog" | "digital",
    newType: any,
  ): void {
    if (mode === "analog") {
      host.hiddenPlots.analog_usage.delete(newType);
      host.hiddenPlots.analog_pit.delete(newType);
      if (isCustomCurveType(newType)) {
        if (
          !host.editingRace.fuel_options.custom_curve ||
          host.editingRace.fuel_options.custom_curve.length === 0
        ) {
          this.initAnalogCustomCurve(
            host.editingRace,
            host.previousAnalogPreset,
          );
        }
      } else {
        host.previousAnalogPreset = newType;
      }
      host.usageGraphCache = null;
      host.pitGraphCache = null;
    } else {
      host.hiddenPlots.digital_usage.delete(newType);
      host.hiddenPlots.digital_pit.delete(newType);
      if (isCustomCurveType(newType)) {
        if (
          !host.editingRace.digital_fuel_options.custom_curve ||
          host.editingRace.digital_fuel_options.custom_curve.length === 0
        ) {
          this.initDigitalCustomCurve(
            host.editingRace,
            host.previousDigitalPreset,
          );
        }
      } else {
        host.previousDigitalPreset = newType;
      }
      host.digitalUsageGraphCache = null;
      host.digitalPitGraphCache = null;
    }
  }

  static initAnalogCustomCurve(
    editingRace: any,
    fromPreset: FuelUsageType | string = FuelUsageType.LINEAR,
  ): void {
    if (!editingRace?.fuel_options) return;
    const fastestTime = this.getFuelUsageFastestTime(editingRace);
    const slowestTime = this.getFuelUsageSlowestTime(editingRace);
    const maxUsage = this.getFuelUsageMaxUsage(editingRace);
    const minUsage = this.getFuelUsageMinUsage(editingRace);
    const preset =
      fromPreset === FuelUsageType.CUSTOM_CURVE ||
      fromPreset === "CUSTOM_CURVE" ||
      fromPreset === "CUSTOM"
        ? FuelUsageType.LINEAR
        : fromPreset;
    const points: FuelCurvePoint[] = [];
    const fractions = [0.0, 0.25, 0.5, 0.75, 1.0];
    const range = maxUsage - minUsage;
    for (const frac of fractions) {
      const time = fastestTime + frac * (slowestTime - fastestTime);
      const fuel = getAnalogFuelUsage(
        preset,
        fastestTime,
        maxUsage,
        slowestTime,
        minUsage,
        time,
      );
      const normY = range > 1e-6 ? (fuel - minUsage) / range : 1.0 - frac;
      points.push({ x: Number(frac.toFixed(2)), y: Number(normY.toFixed(3)) });
    }
    editingRace.fuel_options.custom_curve = points;
  }

  static initDigitalCustomCurve(
    editingRace: any,
    fromPreset: FuelUsageType | string = FuelUsageType.LINEAR,
  ): void {
    if (!editingRace?.digital_fuel_options) return;
    const preset =
      fromPreset === FuelUsageType.CUSTOM_CURVE ||
      fromPreset === "CUSTOM_CURVE" ||
      fromPreset === "CUSTOM"
        ? FuelUsageType.LINEAR
        : fromPreset;
    const points: FuelCurvePoint[] = [];
    const fractions = [0.0, 0.25, 0.5, 0.75, 1.0];
    for (const frac of fractions) {
      const throttle = frac * 100;
      const fuel = getDigitalFuelUsage(preset, 1.0, throttle);
      points.push({ x: Number(frac.toFixed(2)), y: Number(fuel.toFixed(3)) });
    }
    editingRace.digital_fuel_options.custom_curve = points;
  }

  static resetCustomCurveToPreset(
    host: FuelGraphHost,
    mode: "analog" | "digital",
    preset: "LINEAR" | "QUADRATIC" | "CUBIC",
  ): void {
    if (mode === "analog") {
      this.initAnalogCustomCurve(host.editingRace, preset);
      host.usageGraphCache = null;
      host.pitGraphCache = null;
    } else {
      this.initDigitalCustomCurve(host.editingRace, preset);
      host.digitalUsageGraphCache = null;
      host.digitalPitGraphCache = null;
    }
    host.captureState();
  }

  static getAnalogCurveMaxMultiplier(editingRace: any): number {
    const points = editingRace?.fuel_options?.custom_curve;
    let maxP = 1.0;
    if (points && points.length > 0) {
      for (const p of points) {
        if (p.y > maxP) maxP = p.y;
      }
    }
    return Math.max(1.0, maxP);
  }

  static getDigitalCurveMaxMultiplier(editingRace: any): number {
    const points = editingRace?.digital_fuel_options?.custom_curve;
    let maxP = 1.0;
    if (points && points.length > 0) {
      for (const p of points) {
        if (p.y > maxP) maxP = p.y;
      }
    }
    return Math.max(1.0, maxP);
  }

  static getAnalogControlNodes(host: FuelGraphHost): Array<{
    svgX: number;
    svgY: number;
    x: number;
    y: number;
  }> {
    const points: FuelCurvePoint[] =
      host.editingRace?.fuel_options?.custom_curve || [];
    const maxUsage = this.getFuelUsageMaxUsage(host.editingRace);
    const minUsage = this.getFuelUsageMinUsage(host.editingRace);
    this.updateUsageGraphCache(host);
    const maxFuelValue = host.usageGraphCache?.maxVal || Math.max(1, maxUsage);

    return points.map((p: FuelCurvePoint) => {
      const fuel = minUsage + p.y * (maxUsage - minUsage);
      const yRatio =
        maxFuelValue > 0 ? Math.max(0, Math.min(1.5, fuel / maxFuelValue)) : 0;
      return {
        svgX: Number((p.x * 400).toFixed(1)),
        svgY: Number((150 - yRatio * 150).toFixed(1)),
        x: p.x,
        y: p.y,
      };
    });
  }

  static getDigitalControlNodes(editingRace: any): Array<{
    svgX: number;
    svgY: number;
    x: number;
    y: number;
  }> {
    const points: FuelCurvePoint[] =
      editingRace?.digital_fuel_options?.custom_curve || [];
    return points.map((p: FuelCurvePoint) => ({
      svgX: Number((p.x * 400).toFixed(1)),
      svgY: Number((150 - p.y * 150).toFixed(1)),
      x: p.x,
      y: p.y,
    }));
  }

  static startDragNode(
    host: FuelGraphHost,
    event: MouseEvent | TouchEvent,
    mode: "analog" | "digital",
    index: number,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    host.draggingNode = { mode, index };
  }

  static onWindowMouseMove(
    host: FuelGraphHost,
    event: MouseEvent | TouchEvent,
  ): void {
    if (!host.draggingNode || !host.editingRace) return;

    const mode = host.draggingNode.mode;
    const index = host.draggingNode.index;
    const svgId =
      mode === "analog" ? "analog-fuel-usage-svg" : "digital-fuel-usage-svg";
    const svg = document.getElementById(
      svgId,
    ) as unknown as SVGSVGElement | null;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;

    const normX = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / (rect.width || 1)),
    );

    if (mode === "analog") {
      this.dragAnalogNode(host, index, normX, clientY, rect);
    } else {
      this.dragDigitalNode(host, index, normX, clientY, rect);
    }
  }

  private static dragAnalogNode(
    host: FuelGraphHost,
    index: number,
    normX: number,
    clientY: number,
    rect: DOMRect,
  ): void {
    const points = host.editingRace.fuel_options?.custom_curve;
    if (!points || index < 0 || index >= points.length) return;

    const maxUsage = this.getFuelUsageMaxUsage(host.editingRace);
    const minUsage = this.getFuelUsageMinUsage(host.editingRace);
    this.updateUsageGraphCache(host);
    const maxFuelValue = host.usageGraphCache?.maxVal || Math.max(1, maxUsage);

    const mouseRatioY = 1 - (clientY - rect.top) / (rect.height || 1);
    const targetFuel = mouseRatioY * maxFuelValue;
    const range = maxUsage - minUsage;
    const rawY = range > 1e-6 ? (targetFuel - minUsage) / range : mouseRatioY;

    let newX = normX;
    if (index === 0) {
      newX = 0.0;
    } else if (index === points.length - 1) {
      newX = 1.0;
    } else {
      newX = Math.max(
        points[index - 1].x + 0.02,
        Math.min(points[index + 1].x - 0.02, normX),
      );
    }

    const maxMult = this.getAnalogCurveMaxMultiplier(host.editingRace);
    const upperY = index === 0 ? maxMult : points[index - 1].y;
    const lowerY = index === points.length - 1 ? 0.0 : points[index + 1].y;
    const newY = Math.max(lowerY, Math.min(upperY, rawY));

    points[index].x = Number(newX.toFixed(3));
    points[index].y = Number(newY.toFixed(3));

    host.usageGraphCache = null;
    host.pitGraphCache = null;
  }

  private static dragDigitalNode(
    host: FuelGraphHost,
    index: number,
    normX: number,
    clientY: number,
    rect: DOMRect,
  ): void {
    const points = host.editingRace.digital_fuel_options?.custom_curve;
    if (!points || index < 0 || index >= points.length) return;

    const rawY = 1 - (clientY - rect.top) / (rect.height || 1);

    let newX = normX;
    if (index === 0) {
      newX = 0.0;
    } else if (index === points.length - 1) {
      newX = 1.0;
    } else {
      newX = Math.max(
        points[index - 1].x + 0.02,
        Math.min(points[index + 1].x - 0.02, normX),
      );
    }

    const lowerY = index === 0 ? 0.0 : points[index - 1].y;
    const upperY = index === points.length - 1 ? 1.0 : points[index + 1].y;
    const newY = Math.max(lowerY, Math.min(upperY, rawY));

    points[index].x = Number(newX.toFixed(3));
    points[index].y = Number(newY.toFixed(3));

    host.digitalUsageGraphCache = null;
    host.digitalPitGraphCache = null;
  }

  static onWindowMouseUp(host: FuelGraphHost): void {
    if (host.draggingNode) {
      host.draggingNode = null;
      host.captureState();
    }
  }

  static onCurveSvgClick(
    host: FuelGraphHost,
    event: MouseEvent,
    mode: "analog" | "digital",
  ): void {
    if (host.draggingNode) return;
    const target = event.target as HTMLElement;
    if (target && target.classList?.contains("curve-handle")) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const clickNormX = (event.clientX - rect.left) / (rect.width || 1);

    if (mode === "analog") {
      this.handleAnalogCurveClick(host, clickNormX);
    } else {
      this.handleDigitalCurveClick(host, clickNormX);
    }
  }

  private static handleAnalogCurveClick(
    host: FuelGraphHost,
    clickNormX: number,
  ): void {
    if (!this.isCustomCurve(host.editingRace, "analog")) return;
    const points = host.editingRace?.fuel_options?.custom_curve;
    if (!points || points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      if (
        clickNormX >= points[i].x + 0.03 &&
        clickNormX <= points[i + 1].x - 0.03
      ) {
        const interpY = interpolateFuelCurveClient(points, clickNormX);
        points.splice(i + 1, 0, {
          x: Number(clickNormX.toFixed(3)),
          y: Number(interpY.toFixed(3)),
        });
        host.usageGraphCache = null;
        host.pitGraphCache = null;
        host.captureState();
        break;
      }
    }
  }

  private static handleDigitalCurveClick(
    host: FuelGraphHost,
    clickNormX: number,
  ): void {
    if (!this.isCustomCurve(host.editingRace, "digital")) return;
    const points = host.editingRace?.digital_fuel_options?.custom_curve;
    if (!points || points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      if (
        clickNormX >= points[i].x + 0.03 &&
        clickNormX <= points[i + 1].x - 0.03
      ) {
        const interpY = interpolateFuelCurveClient(points, clickNormX);
        points.splice(i + 1, 0, {
          x: Number(clickNormX.toFixed(3)),
          y: Number(interpY.toFixed(3)),
        });
        host.digitalUsageGraphCache = null;
        host.digitalPitGraphCache = null;
        host.captureState();
        break;
      }
    }
  }

  static deleteControlNode(
    host: FuelGraphHost,
    event: MouseEvent,
    mode: "analog" | "digital",
    index: number,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    if (mode === "analog") {
      const points = host.editingRace?.fuel_options?.custom_curve;
      if (
        !points ||
        points.length <= 2 ||
        index <= 0 ||
        index >= points.length - 1
      )
        return;
      points.splice(index, 1);
      host.usageGraphCache = null;
      host.pitGraphCache = null;
      host.captureState();
    } else {
      const points = host.editingRace?.digital_fuel_options?.custom_curve;
      if (
        !points ||
        points.length <= 2 ||
        index <= 0 ||
        index >= points.length - 1
      )
        return;
      points.splice(index, 1);
      host.digitalUsageGraphCache = null;
      host.digitalPitGraphCache = null;
      host.captureState();
    }
  }
}
