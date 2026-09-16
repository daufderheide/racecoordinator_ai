import { FuelCurvePoint, FuelUsageType } from "@app/models/fuel_options";

export interface FuelGraphPlot {
  type: FuelUsageType;
  path: string;
  color: string;
  isSelected: boolean;
  isVisible: boolean;
  labelKey: string;
}

export interface FuelHoverCurvePoint {
  type: FuelUsageType;
  labelKey: string;
  color: string;
  isSelected: boolean;
  value: string;
  svgX: number;
  svgY: number;
}

export interface FuelGraphHoverPoint {
  svgX: number;
  svgY: number;
  screenX: number;
  screenY: number;
  type: "usage" | "pit" | "digital_usage" | "digital_pit";
  xLabel: string;
  xValue: string;
  yLabel: string;
  yValue: string;
  curvePoints: FuelHoverCurvePoint[];
}

export const FUEL_CURVE_COLORS: Record<FuelUsageType, string> = {
  [FuelUsageType.LINEAR]: "#38bdf8", // Sky Blue
  [FuelUsageType.QUADRATIC]: "#a78bfa", // Purple
  [FuelUsageType.CUBIC]: "#f43f5e", // Rose
  [FuelUsageType.CUSTOM_CURVE]: "#fbbf24", // Warm Amber
};

export const FUEL_CURVE_LABELS: Record<FuelUsageType, string> = {
  [FuelUsageType.LINEAR]: "RE_FUEL_USAGE_LINEAR",
  [FuelUsageType.QUADRATIC]: "RE_FUEL_USAGE_QUADRATIC",
  [FuelUsageType.CUBIC]: "RE_FUEL_USAGE_CUBIC",
  [FuelUsageType.CUSTOM_CURVE]: "RE_FUEL_USAGE_CUSTOM",
};

export const STANDARD_USAGE_TYPES: FuelUsageType[] = [
  FuelUsageType.LINEAR,
  FuelUsageType.QUADRATIC,
  FuelUsageType.CUBIC,
];

export function isCustomCurveType(
  type: FuelUsageType | string | undefined,
): boolean {
  return (
    type === FuelUsageType.CUSTOM_CURVE ||
    type === "CUSTOM_CURVE" ||
    type === "CUSTOM"
  );
}

export function interpolateFuelCurveClient(
  points: FuelCurvePoint[] | undefined,
  x: number,
): number {
  if (!points || points.length === 0) {
    return 1.0;
  }
  if (points.length === 1) {
    return points[0].y;
  }

  if (x <= points[0].x) {
    return points[0].y;
  }
  if (x >= points[points.length - 1].x) {
    return points[points.length - 1].y;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (x >= p1.x && x <= p2.x) {
      const dx = p2.x - p1.x;
      if (dx <= 0.00001) {
        return p1.y;
      }
      const t = (x - p1.x) / dx;
      return p1.y + t * (p2.y - p1.y);
    }
  }
  return points[points.length - 1].y;
}

export function getAnalogFuelUsage(
  usageType: FuelUsageType | string,
  usageRate: number,
  time: number,
  referenceTime: number,
  customCurve?: FuelCurvePoint[],
): number {
  if (isCustomCurveType(usageType)) {
    const refCustom = Math.max(0.1, referenceTime);
    const minTime = Math.max(0.2, refCustom * 0.5);
    const maxTime = Math.max(minTime + 0.1, refCustom * 1.5);
    let xNorm = (time - minTime) / (maxTime - minTime);
    xNorm = Math.max(0.0, Math.min(1.0, xNorm));
    const mult = interpolateFuelCurveClient(customCurve, xNorm);
    const val = usageRate * mult;
    return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
  }

  if (usageType === FuelUsageType.LINEAR) {
    const safeRefTime = Math.max(0.1, referenceTime);
    const x1 = safeRefTime * 2;
    const y1 = usageRate / 2;
    const x2 = safeRefTime;
    const y2 = usageRate;

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;

    const val = m * time + b;
    return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
  }

  const safeTime = Math.max(0.1, time);
  const safeRefTime = Math.max(0.1, referenceTime);
  let val = 0;
  if (usageType === FuelUsageType.QUADRATIC) {
    val = (usageRate * (safeRefTime * safeRefTime)) / (safeTime * safeTime);
  } else if (usageType === FuelUsageType.CUBIC) {
    val =
      (usageRate * (safeRefTime * safeRefTime * safeRefTime)) /
      (safeTime * safeTime * safeTime);
  }

  return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
}

export function getDigitalFuelUsage(
  usageType: FuelUsageType | string,
  usageRate: number,
  throttle: number,
  customCurve?: FuelCurvePoint[],
): number {
  const tRatio = throttle / 100;
  let val = usageRate * tRatio;
  if (usageType === FuelUsageType.QUADRATIC) {
    val *= 1 + (1 - tRatio);
  } else if (usageType === FuelUsageType.CUBIC) {
    val *= 1 + (1 - tRatio) * (1 + (1 - tRatio));
  } else if (isCustomCurveType(usageType)) {
    val = usageRate * interpolateFuelCurveClient(customCurve, tRatio);
  }
  return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, Math.min(val, 100));
}

export function getCandidateUsageTypes(
  activeType: FuelUsageType | string | undefined,
): FuelUsageType[] {
  if (isCustomCurveType(activeType)) {
    return [...STANDARD_USAGE_TYPES, FuelUsageType.CUSTOM_CURVE];
  }
  return [...STANDARD_USAGE_TYPES];
}

export function computeAnalogUsagePlots(
  activeType: FuelUsageType | string | undefined,
  usageRate: number,
  referenceTime: number,
  minTime: number,
  maxTime: number,
  customCurve: FuelCurvePoint[] | undefined,
  customMaxMultiplier: number,
  hiddenTypes: Set<string>,
  width: number = 400,
  height: number = 150,
): { plots: FuelGraphPlot[]; maxFuelValue: number; labels: string[] } {
  const candidateTypes = getCandidateUsageTypes(activeType);
  const isCustomActive = isCustomCurveType(activeType);

  const visibleTypes = candidateTypes.filter((t) => !hiddenTypes.has(t));

  const curveMaxes: number[] = [];
  for (const t of visibleTypes) {
    if (t === FuelUsageType.CUSTOM_CURVE) {
      curveMaxes.push(customMaxMultiplier * usageRate);
    } else {
      curveMaxes.push(getAnalogFuelUsage(t, usageRate, minTime, referenceTime));
    }
  }

  const maxFuelValue =
    curveMaxes.length > 0 ? Math.max(1, ...curveMaxes) : Math.max(1, usageRate);

  const steps = 50;
  const plots: FuelGraphPlot[] = [];

  for (const type of candidateTypes) {
    const isVisible = !hiddenTypes.has(type);
    const isSelected = isCustomActive
      ? type === FuelUsageType.CUSTOM_CURVE
      : type === activeType;

    let path = "";
    if (isVisible) {
      const points: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const time = minTime + (i / steps) * (maxTime - minTime);
        const fuel = getAnalogFuelUsage(
          type,
          usageRate,
          time,
          referenceTime,
          customCurve,
        );
        const x = (i / steps) * width;
        const yRatio =
          maxFuelValue > 0
            ? Math.max(0, Math.min(1.5, fuel / maxFuelValue))
            : 0;
        const y = height - yRatio * height;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      path = `M ${points.join(" L ")}`;
    }

    plots.push({
      type,
      path,
      color: FUEL_CURVE_COLORS[type],
      isSelected,
      isVisible,
      labelKey: FUEL_CURVE_LABELS[type],
    });
  }

  const labels: string[] = [];
  for (let i = 4; i >= 0; i--) {
    labels.push(((maxFuelValue * i) / 4).toFixed(2));
  }

  return { plots, maxFuelValue, labels };
}

export function computeAnalogPitPlots(
  activeType: FuelUsageType | string | undefined,
  usageRate: number,
  capacity: number,
  referenceTime: number,
  minLapTime: number,
  maxLapTime: number,
  customCurve: FuelCurvePoint[] | undefined,
  hiddenTypes: Set<string>,
  width: number = 400,
  height: number = 150,
): { plots: FuelGraphPlot[]; maxPitTime: number; labels: string[] } {
  const candidateTypes = getCandidateUsageTypes(activeType);
  const isCustomActive = isCustomCurveType(activeType);

  const visibleTypes = candidateTypes.filter((t) => !hiddenTypes.has(t));

  const pitTimes: number[] = [];
  for (const t of visibleTypes) {
    const minFuel = getAnalogFuelUsage(
      t,
      usageRate,
      maxLapTime,
      referenceTime,
      customCurve,
    );
    if (minFuel > 0 && usageRate > 0) {
      const pTime = (capacity / minFuel) * maxLapTime;
      if (!isNaN(pTime) && isFinite(pTime)) {
        pitTimes.push(Math.min(3600, pTime));
      }
    }
  }

  const maxPitTime = pitTimes.length > 0 ? Math.max(1, ...pitTimes) : 3600;

  const steps = 50;
  const plots: FuelGraphPlot[] = [];

  for (const type of candidateTypes) {
    const isVisible = !hiddenTypes.has(type);
    const isSelected = isCustomActive
      ? type === FuelUsageType.CUSTOM_CURVE
      : type === activeType;

    let path = "";
    if (isVisible) {
      const points: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const lapTime = minLapTime + (i / steps) * (maxLapTime - minLapTime);
        const fuelPerLap = getAnalogFuelUsage(
          type,
          usageRate,
          lapTime,
          referenceTime,
          customCurve,
        );

        let pitTimeSeconds = 0;
        if (fuelPerLap > 0) {
          pitTimeSeconds = (capacity / fuelPerLap) * lapTime;
        } else {
          pitTimeSeconds = maxPitTime;
        }

        const y = height - (i / steps) * height;
        const xPercent =
          maxPitTime > 0
            ? Math.max(0, Math.min(1, pitTimeSeconds / maxPitTime))
            : 1;
        const x = xPercent * width;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      path = `M ${points.join(" L ")}`;
    }

    plots.push({
      type,
      path,
      color: FUEL_CURVE_COLORS[type],
      isSelected,
      isVisible,
      labelKey: FUEL_CURVE_LABELS[type],
    });
  }

  const labels: string[] = [];
  for (let i = 0; i <= 4; i++) {
    labels.push(Math.round((maxPitTime * i) / 4).toString());
  }

  return { plots, maxPitTime, labels };
}

export function computeDigitalUsagePlots(
  activeType: FuelUsageType | string | undefined,
  usageRate: number,
  customCurve: FuelCurvePoint[] | undefined,
  customMaxMultiplier: number,
  hiddenTypes: Set<string>,
  width: number = 400,
  height: number = 150,
): { plots: FuelGraphPlot[]; maxFuelValue: number; labels: string[] } {
  const candidateTypes = getCandidateUsageTypes(activeType);
  const isCustomActive = isCustomCurveType(activeType);

  const visibleTypes = candidateTypes.filter((t) => !hiddenTypes.has(t));
  let maxFuelValue = usageRate <= 0 ? 1 : usageRate;
  if (visibleTypes.includes(FuelUsageType.CUSTOM_CURVE)) {
    maxFuelValue = Math.max(maxFuelValue, usageRate * customMaxMultiplier);
  }
  if (maxFuelValue <= 0) maxFuelValue = 1;

  const steps = 50;
  const plots: FuelGraphPlot[] = [];

  for (const type of candidateTypes) {
    const isVisible = !hiddenTypes.has(type);
    const isSelected = isCustomActive
      ? type === FuelUsageType.CUSTOM_CURVE
      : type === activeType;

    let path = "";
    if (isVisible) {
      const points: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const throttle = (i / steps) * 100;
        const fuel = getDigitalFuelUsage(
          type,
          usageRate,
          throttle,
          customCurve,
        );
        const x = (i / steps) * width;
        const yRatio =
          maxFuelValue > 0
            ? Math.max(0, Math.min(1.5, fuel / Math.max(0.001, maxFuelValue)))
            : 0;
        const y = height - yRatio * height;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      path = `M ${points.join(" L ")}`;
    }

    plots.push({
      type,
      path,
      color: FUEL_CURVE_COLORS[type],
      isSelected,
      isVisible,
      labelKey: FUEL_CURVE_LABELS[type],
    });
  }

  const labels: string[] = [];
  for (let i = 4; i >= 0; i--) {
    labels.push(((maxFuelValue * i) / 4).toFixed(2));
  }

  return { plots, maxFuelValue, labels };
}

export function computeDigitalPitPlots(
  activeType: FuelUsageType | string | undefined,
  usageRate: number,
  capacity: number,
  customCurve: FuelCurvePoint[] | undefined,
  hiddenTypes: Set<string>,
  width: number = 400,
  height: number = 150,
): { plots: FuelGraphPlot[]; safeMaxTime: number; labels: string[] } {
  const candidateTypes = getCandidateUsageTypes(activeType);
  const isCustomActive = isCustomCurveType(activeType);

  const visibleTypes = candidateTypes.filter((t) => !hiddenTypes.has(t));

  const maxTimes: number[] = [];
  for (const t of visibleTypes) {
    const fuel10 = getDigitalFuelUsage(t, usageRate, 10, customCurve);
    if (fuel10 > 0) {
      const mTime = capacity / fuel10;
      if (!isNaN(mTime) && isFinite(mTime)) {
        maxTimes.push(Math.min(3600, mTime));
      }
    }
  }

  const safeMaxTime = maxTimes.length > 0 ? Math.max(1, ...maxTimes) : 3600;

  const steps = 50;
  const plots: FuelGraphPlot[] = [];

  for (const type of candidateTypes) {
    const isVisible = !hiddenTypes.has(type);
    const isSelected = isCustomActive
      ? type === FuelUsageType.CUSTOM_CURVE
      : type === activeType;

    let path = "";
    if (isVisible) {
      const points: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const throttle = (i / steps) * 100;
        const fuelPerSec = getDigitalFuelUsage(
          type,
          usageRate,
          throttle,
          customCurve,
        );
        const timeToEmpty =
          fuelPerSec > 0 ? capacity / fuelPerSec : safeMaxTime;

        const y = height - (i / steps) * height;
        const divisor = Math.max(0.001, safeMaxTime);
        const xPercent =
          divisor > 0 ? Math.max(0, Math.min(1.5, timeToEmpty / divisor)) : 1;
        const x = xPercent * width;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      path = `M ${points.join(" L ")}`;
    }

    plots.push({
      type,
      path,
      color: FUEL_CURVE_COLORS[type],
      isSelected,
      isVisible,
      labelKey: FUEL_CURVE_LABELS[type],
    });
  }

  const labels: string[] = [];
  for (let i = 0; i <= 4; i++) {
    labels.push(Math.round((safeMaxTime * i) / 4).toString());
  }

  return { plots, safeMaxTime, labels };
}

export function calculateAnalogUsageHover(
  mouseX: number,
  mouseY: number,
  width: number,
  minTime: number,
  maxTime: number,
  activeType: FuelUsageType | string | undefined,
  usageRate: number,
  referenceTime: number,
  customCurve: FuelCurvePoint[] | undefined,
  maxFuelValue: number,
  hiddenTypes: Set<string>,
  height: number = 150,
): FuelGraphHoverPoint {
  const xPercent = Math.max(0, Math.min(1, mouseX / width));
  const time = minTime + xPercent * (maxTime - minTime);
  const candidateTypes = getCandidateUsageTypes(activeType);
  const isCustomActive = isCustomCurveType(activeType);

  const curvePoints: FuelHoverCurvePoint[] = [];

  let selectedY = 0;
  let selectedFuelStr = "0.0";

  for (const type of candidateTypes) {
    if (hiddenTypes.has(type)) continue;

    const isSelected = isCustomActive
      ? type === FuelUsageType.CUSTOM_CURVE
      : type === activeType;

    const fuel = getAnalogFuelUsage(
      type,
      usageRate,
      time,
      referenceTime,
      customCurve,
    );
    const yRatio =
      maxFuelValue > 0 ? Math.max(0, Math.min(1.5, fuel / maxFuelValue)) : 0;
    const svgY = Number((height - yRatio * height).toFixed(2));
    const fuelStr = fuel.toFixed(1);

    if (isSelected || curvePoints.length === 0) {
      selectedY = svgY;
      selectedFuelStr = fuelStr;
    }

    curvePoints.push({
      type,
      labelKey: FUEL_CURVE_LABELS[type],
      color: FUEL_CURVE_COLORS[type],
      isSelected,
      value: fuelStr,
      svgX: Number((xPercent * 400).toFixed(2)),
      svgY,
    });
  }

  return {
    svgX: Number((xPercent * 400).toFixed(2)),
    svgY: selectedY,
    screenX: mouseX,
    screenY: mouseY,
    type: "usage",
    xLabel: "RE_HOVER_LAP_TIME",
    xValue: time.toFixed(2) + "s",
    yLabel: "RE_HOVER_FUEL_USED",
    yValue: selectedFuelStr,
    curvePoints,
  };
}

export function calculateAnalogPitHover(
  mouseX: number,
  mouseY: number,
  height: number,
  minTime: number,
  maxTime: number,
  activeType: FuelUsageType | string | undefined,
  usageRate: number,
  capacity: number,
  referenceTime: number,
  customCurve: FuelCurvePoint[] | undefined,
  maxPitTime: number,
  hiddenTypes: Set<string>,
  width: number = 400,
): FuelGraphHoverPoint {
  const yPercent = 1 - Math.max(0, Math.min(1, mouseY / height));
  const lapTime = minTime + yPercent * (maxTime - minTime);
  const candidateTypes = getCandidateUsageTypes(activeType);
  const isCustomActive = isCustomCurveType(activeType);

  const curvePoints: FuelHoverCurvePoint[] = [];

  let selectedX = 0;
  let selectedPitStr = "0.00s";

  for (const type of candidateTypes) {
    if (hiddenTypes.has(type)) continue;

    const isSelected = isCustomActive
      ? type === FuelUsageType.CUSTOM_CURVE
      : type === activeType;

    const fuelPerLap = getAnalogFuelUsage(
      type,
      usageRate,
      lapTime,
      referenceTime,
      customCurve,
    );
    let pitTime = 0;
    if (fuelPerLap > 0) pitTime = (capacity / fuelPerLap) * lapTime;

    const xPercent =
      maxPitTime > 0 ? Math.max(0, Math.min(1.5, pitTime / maxPitTime)) : 1;
    const svgX = Number((xPercent * width).toFixed(2));
    const pitStr = pitTime.toFixed(2) + "s";

    if (isSelected || curvePoints.length === 0) {
      selectedX = svgX;
      selectedPitStr = pitStr;
    }

    curvePoints.push({
      type,
      labelKey: FUEL_CURVE_LABELS[type],
      color: FUEL_CURVE_COLORS[type],
      isSelected,
      value: pitStr,
      svgX,
      svgY: Number(((1 - yPercent) * 150).toFixed(2)),
    });
  }

  return {
    svgX: selectedX,
    svgY: Number(((1 - yPercent) * 150).toFixed(2)),
    screenX: mouseX,
    screenY: mouseY,
    type: "pit",
    xLabel: "RE_HOVER_TIME_TO_PIT",
    xValue: selectedPitStr,
    yLabel: "RE_HOVER_LAP_TIME",
    yValue: lapTime.toFixed(2) + "s",
    curvePoints,
  };
}

export function calculateDigitalUsageHover(
  mouseX: number,
  mouseY: number,
  width: number,
  activeType: FuelUsageType | string | undefined,
  usageRate: number,
  customCurve: FuelCurvePoint[] | undefined,
  maxFuelValue: number,
  hiddenTypes: Set<string>,
  height: number = 150,
): FuelGraphHoverPoint {
  const xPercent = Math.max(0, Math.min(1, mouseX / width));
  const throttle = xPercent * 100;
  const candidateTypes = getCandidateUsageTypes(activeType);
  const isCustomActive = isCustomCurveType(activeType);

  const curvePoints: FuelHoverCurvePoint[] = [];

  let selectedY = 0;
  let selectedFuelStr = "0.0";

  for (const type of candidateTypes) {
    if (hiddenTypes.has(type)) continue;

    const isSelected = isCustomActive
      ? type === FuelUsageType.CUSTOM_CURVE
      : type === activeType;

    const fuel = getDigitalFuelUsage(type, usageRate, throttle, customCurve);
    const yRatio =
      maxFuelValue > 0
        ? Math.max(0, Math.min(1.5, fuel / Math.max(0.001, maxFuelValue)))
        : 0;
    const svgY = Number((height - yRatio * height).toFixed(2));
    const fuelStr = fuel.toFixed(1);

    if (isSelected || curvePoints.length === 0) {
      selectedY = svgY;
      selectedFuelStr = fuelStr;
    }

    curvePoints.push({
      type,
      labelKey: FUEL_CURVE_LABELS[type],
      color: FUEL_CURVE_COLORS[type],
      isSelected,
      value: fuelStr,
      svgX: Number((xPercent * 400).toFixed(2)),
      svgY,
    });
  }

  return {
    svgX: Number((xPercent * 400).toFixed(2)),
    svgY: selectedY,
    screenX: mouseX,
    screenY: mouseY,
    type: "digital_usage",
    xLabel: "RE_HOVER_THROTTLE",
    xValue: Math.round(throttle) + "%",
    yLabel: "RE_HOVER_FUEL_PER_SEC",
    yValue: selectedFuelStr,
    curvePoints,
  };
}

export function calculateDigitalPitHover(
  mouseX: number,
  mouseY: number,
  height: number,
  activeType: FuelUsageType | string | undefined,
  usageRate: number,
  capacity: number,
  customCurve: FuelCurvePoint[] | undefined,
  safeMaxTime: number,
  hiddenTypes: Set<string>,
  width: number = 400,
): FuelGraphHoverPoint {
  const yPercent = 1 - Math.max(0, Math.min(1, mouseY / height));
  const throttle = yPercent * 100;
  const candidateTypes = getCandidateUsageTypes(activeType);
  const isCustomActive = isCustomCurveType(activeType);

  const curvePoints: FuelHoverCurvePoint[] = [];

  let selectedX = 0;
  let selectedTimeStr = "0s";

  for (const type of candidateTypes) {
    if (hiddenTypes.has(type)) continue;

    const isSelected = isCustomActive
      ? type === FuelUsageType.CUSTOM_CURVE
      : type === activeType;

    const fuelPerSec = getDigitalFuelUsage(
      type,
      usageRate,
      throttle,
      customCurve,
    );
    const timeToEmpty = fuelPerSec > 0 ? capacity / fuelPerSec : safeMaxTime;

    const xPercent =
      safeMaxTime > 0
        ? Math.max(0, Math.min(1.5, timeToEmpty / Math.max(0.001, safeMaxTime)))
        : 1;
    const svgX = Number(((xPercent || 0) * width).toFixed(2));
    const timeStr = Math.round(timeToEmpty) + "s";

    if (isSelected || curvePoints.length === 0) {
      selectedX = svgX;
      selectedTimeStr = timeStr;
    }

    curvePoints.push({
      type,
      labelKey: FUEL_CURVE_LABELS[type],
      color: FUEL_CURVE_COLORS[type],
      isSelected,
      value: timeStr,
      svgX,
      svgY: Number(((1 - (yPercent || 0)) * 150).toFixed(2)),
    });
  }

  return {
    svgX: selectedX,
    svgY: Number(((1 - (yPercent || 0)) * 150).toFixed(2)),
    screenX: mouseX,
    screenY: mouseY,
    type: "digital_pit",
    xLabel: "RE_HOVER_TIME_TO_PIT",
    xValue: selectedTimeStr,
    yLabel: "RE_HOVER_THROTTLE",
    yValue: Math.round(throttle || 0) + "%",
    curvePoints,
  };
}
