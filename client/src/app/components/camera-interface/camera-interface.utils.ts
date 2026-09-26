import { LaneDetectionGate } from "@app/models/camera_config";
import { RegionOfInterest } from "@app/services/camera-vision.service";

export interface DragState {
  type: "move" | "resize" | "zone-move" | "zone-resize" | "zone-draw";
  corner?: "nw" | "ne" | "sw" | "se";
  gateIndex?: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

export function computeZoneLaneDividers(
  zone: RegionOfInterest,
  lanes: number,
  isRows: boolean,
): { x1: number; y1: number; x2: number; y2: number }[] {
  if (lanes <= 1) return [];

  const divs: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (isRows) {
    const step = zone.heightPct / lanes;
    for (let i = 1; i < lanes; i++) {
      const y = zone.yPct + step * i;
      divs.push({
        x1: zone.xPct,
        y1: y,
        x2: zone.xPct + zone.widthPct,
        y2: y,
      });
    }
  } else {
    const step = zone.widthPct / lanes;
    for (let i = 1; i < lanes; i++) {
      const x = zone.xPct + step * i;
      divs.push({
        x1: x,
        y1: zone.yPct,
        x2: x,
        y2: zone.yPct + zone.heightPct,
      });
    }
  }
  return divs;
}

export function computeZoneLanePreviews(
  zone: RegionOfInterest,
  lanes: number,
  isRows: boolean,
): { laneIndex: number; centerX: number; centerY: number }[] {
  const previews: { laneIndex: number; centerX: number; centerY: number }[] =
    [];
  if (isRows) {
    const step = zone.heightPct / lanes;
    for (let i = 0; i < lanes; i++) {
      previews.push({
        laneIndex: i,
        centerX: zone.xPct + zone.widthPct / 2,
        centerY: zone.yPct + step * (i + 0.5),
      });
    }
  } else {
    const step = zone.widthPct / lanes;
    for (let i = 0; i < lanes; i++) {
      previews.push({
        laneIndex: i,
        centerX: zone.xPct + step * (i + 0.5),
        centerY: zone.yPct + zone.heightPct / 2,
      });
    }
  }
  return previews;
}

export function computeDefaultGates(
  laneCount: number,
  sensitivity: number,
): LaneDetectionGate[] {
  const newGates: LaneDetectionGate[] = [];
  const gateWidth = 0.8 / laneCount;
  const gateHeight = 0.25;
  const y = 0.38;

  for (let i = 0; i < laneCount; i++) {
    const x = 0.1 + i * gateWidth;
    newGates.push({
      laneIndex: i,
      gateType: 0,
      xPct: x,
      yPct: y,
      widthPct: gateWidth * 0.9,
      heightPct: gateHeight,
      sensitivity,
    });
  }
  return newGates;
}

export function computeAutoSplitGates(
  zone: RegionOfInterest,
  lanes: number,
  isRows: boolean,
  sensitivity: number,
): LaneDetectionGate[] {
  const newGates: LaneDetectionGate[] = [];
  if (isRows) {
    const laneNominalH = zone.heightPct / lanes;
    const marginY = lanes > 1 ? Math.min(0.015, laneNominalH * 0.08) : 0;
    const gateH = laneNominalH - marginY * 2;

    for (let i = 0; i < lanes; i++) {
      newGates.push({
        laneIndex: i,
        gateType: 0,
        xPct: zone.xPct,
        yPct: zone.yPct + i * laneNominalH + marginY,
        widthPct: zone.widthPct,
        heightPct: gateH,
        sensitivity,
      });
    }
  } else {
    const laneNominalW = zone.widthPct / lanes;
    const marginX = lanes > 1 ? Math.min(0.015, laneNominalW * 0.08) : 0;
    const gateW = laneNominalW - marginX * 2;

    for (let i = 0; i < lanes; i++) {
      newGates.push({
        laneIndex: i,
        gateType: 0,
        xPct: zone.xPct + i * laneNominalW + marginX,
        yPct: zone.yPct,
        widthPct: gateW,
        heightPct: zone.heightPct,
        sensitivity,
      });
    }
  }
  return newGates;
}

export function computeAutoSnapGate(
  subRoi: RegionOfInterest,
  isRows: boolean,
  lane: number,
  sensitivity: number,
): LaneDetectionGate {
  const margin = 0.01;
  const xPct = isRows ? subRoi.xPct : subRoi.xPct + margin;
  const yPct = isRows ? subRoi.yPct + margin : subRoi.yPct;
  const widthPct = isRows
    ? subRoi.widthPct
    : Math.max(0.05, subRoi.widthPct - margin * 2);
  const heightPct = isRows
    ? Math.max(0.05, subRoi.heightPct - margin * 2)
    : subRoi.heightPct;

  return {
    laneIndex: lane,
    gateType: 0,
    xPct,
    yPct,
    widthPct,
    heightPct,
    sensitivity,
  };
}

export function computeZoneDraw(
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
  rect: DOMRect,
): RegionOfInterest {
  const origXPct = Math.max(
    0,
    Math.min(1.0, (startX - rect.left) / rect.width),
  );
  const origYPct = Math.max(
    0,
    Math.min(1.0, (startY - rect.top) / rect.height),
  );
  const curXPct = Math.max(
    0,
    Math.min(1.0, (clientX - rect.left) / rect.width),
  );
  const curYPct = Math.max(
    0,
    Math.min(1.0, (clientY - rect.top) / rect.height),
  );

  const minX = Math.min(origXPct, curXPct);
  const maxX = Math.max(origXPct, curXPct);
  const minY = Math.min(origYPct, curYPct);
  const maxY = Math.max(origYPct, curYPct);

  return {
    xPct: minX,
    yPct: minY,
    widthPct: Math.max(0.02, maxX - minX),
    heightPct: Math.max(0.02, maxY - minY),
  };
}

export function computeZoneResize(
  corner: "nw" | "ne" | "sw" | "se",
  origX: number,
  origY: number,
  origW: number,
  origH: number,
  deltaXPct: number,
  deltaYPct: number,
): RegionOfInterest {
  let xPct = origX;
  let yPct = origY;
  let widthPct = origW;
  let heightPct = origH;

  if (corner === "se") {
    widthPct = Math.max(0.03, Math.min(1.0 - origX, origW + deltaXPct));
    heightPct = Math.max(0.03, Math.min(1.0 - origY, origH + deltaYPct));
  } else if (corner === "sw") {
    xPct = Math.max(0, Math.min(origX + origW - 0.03, origX + deltaXPct));
    widthPct = origX + origW - xPct;
    heightPct = Math.max(0.03, Math.min(1.0 - origY, origH + deltaYPct));
  } else if (corner === "ne") {
    yPct = Math.max(0, Math.min(origY + origH - 0.03, origY + deltaYPct));
    heightPct = origY + origH - yPct;
    widthPct = Math.max(0.03, Math.min(1.0 - origX, origW + deltaXPct));
  } else if (corner === "nw") {
    xPct = Math.max(0, Math.min(origX + origW - 0.03, origX + deltaXPct));
    widthPct = origX + origW - xPct;
    yPct = Math.max(0, Math.min(origY + origH - 0.03, origY + deltaYPct));
    heightPct = origY + origH - yPct;
  }

  return { xPct, yPct, widthPct, heightPct };
}

export function computeZoneMove(
  origX: number,
  origY: number,
  origW: number,
  origH: number,
  deltaXPct: number,
  deltaYPct: number,
): { xPct: number; yPct: number } {
  const xPct = Math.max(0, Math.min(1.0 - origW, origX + deltaXPct));
  const yPct = Math.max(0, Math.min(1.0 - origH, origY + deltaYPct));
  return { xPct, yPct };
}

export function computeInitialFinishLineZone(
  gates: LaneDetectionGate[],
): RegionOfInterest {
  if (gates.length > 0) {
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;
    for (const g of gates) {
      minX = Math.min(minX, g.xPct);
      maxX = Math.max(maxX, g.xPct + g.widthPct);
      minY = Math.min(minY, g.yPct);
      maxY = Math.max(maxY, g.yPct + g.heightPct);
    }
    if (maxX > minX && maxY > minY) {
      return {
        xPct: Math.max(0, minX),
        yPct: Math.max(0, minY),
        widthPct: Math.min(1.0 - Math.max(0, minX), maxX - minX),
        heightPct: Math.min(1.0 - Math.max(0, minY), maxY - minY),
      };
    }
  }
  return {
    xPct: 0.1,
    yPct: 0.35,
    widthPct: 0.8,
    heightPct: 0.3,
  };
}

export function computeActiveLaneSubRoi(
  zone: RegionOfInterest,
  lanes: number,
  lane: number,
  isRows: boolean,
): RegionOfInterest {
  if (isRows) {
    const step = zone.heightPct / lanes;
    return {
      xPct: zone.xPct,
      yPct: zone.yPct + step * lane,
      widthPct: zone.widthPct,
      heightPct: step,
    };
  } else {
    const step = zone.widthPct / lanes;
    return {
      xPct: zone.xPct + step * lane,
      yPct: zone.yPct,
      widthPct: step,
      heightPct: zone.heightPct,
    };
  }
}

export function computeGateDrag(
  type: "move" | "resize",
  origX: number,
  origY: number,
  origW: number,
  origH: number,
  deltaXPct: number,
  deltaYPct: number,
): { xPct: number; yPct: number; widthPct: number; heightPct: number } {
  if (type === "move") {
    const xPct = Math.max(0, Math.min(1.0 - origW, origX + deltaXPct));
    const yPct = Math.max(0, Math.min(1.0 - origH, origY + deltaYPct));
    return { xPct, yPct, widthPct: origW, heightPct: origH };
  } else {
    const widthPct = Math.max(0.05, Math.min(1.0 - origX, origW + deltaXPct));
    const heightPct = Math.max(0.05, Math.min(1.0 - origY, origH + deltaYPct));
    return { xPct: origX, yPct: origY, widthPct, heightPct };
  }
}

export function extractPointerCoords(event: MouseEvent | TouchEvent): {
  clientX: number;
  clientY: number;
} {
  if ("touches" in event && event.touches && event.touches.length > 0) {
    return {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY,
    };
  }
  if (
    "changedTouches" in event &&
    event.changedTouches &&
    event.changedTouches.length > 0
  ) {
    return {
      clientX: event.changedTouches[0].clientX,
      clientY: event.changedTouches[0].clientY,
    };
  }
  return {
    clientX: (event as MouseEvent).clientX,
    clientY: (event as MouseEvent).clientY,
  };
}

export function parseGatesParam(
  param: string | null | undefined,
  expectedLanes: number,
): LaneDetectionGate[] | null {
  if (!param) return null;
  try {
    const parsed = JSON.parse(param);
    if (
      Array.isArray(parsed) &&
      parsed.length === expectedLanes &&
      parsed.every((g) => g.laneIndex >= 0 && g.laneIndex < expectedLanes)
    ) {
      return parsed;
    }
  } catch {
    // Ignore invalid JSON
  }
  return null;
}

export function resolveDefaultServerUrl(loc: {
  protocol: string;
  hostname: string;
  port: string;
}): string {
  const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
  const portPart =
    loc.port === "4200"
      ? ":7070"
      : loc.port
        ? `:${loc.port}`
        : loc.protocol === "https:"
          ? ""
          : ":7070";
  return `${wsProtocol}//${loc.hostname}${portPart}/api/interface-data`;
}
