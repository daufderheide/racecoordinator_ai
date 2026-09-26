import { LaneDetectionGate } from "@app/models/camera_config";
import { RegionOfInterest } from "@app/services/camera-vision.service";

import {
  computeActiveLaneSubRoi,
  computeAutoSnapGate,
  computeAutoSplitGates,
  computeDefaultGates,
  computeGateDrag,
  computeInitialFinishLineZone,
  computeZoneDraw,
  computeZoneLaneDividers,
  computeZoneLanePreviews,
  computeZoneMove,
  computeZoneResize,
  extractPointerCoords,
  parseGatesParam,
  resolveDefaultServerUrl,
} from "./camera-interface.utils";

describe("CameraInterfaceUtils", () => {
  const sampleZone: RegionOfInterest = {
    xPct: 0.1,
    yPct: 0.2,
    widthPct: 0.8,
    heightPct: 0.6,
  };

  describe("computeZoneLaneDividers", () => {
    it("should return empty array when lanes <= 1", () => {
      expect(computeZoneLaneDividers(sampleZone, 1, false)).toEqual([]);
      expect(computeZoneLaneDividers(sampleZone, 0, true)).toEqual([]);
    });

    it("should compute row dividers correctly", () => {
      const divs = computeZoneLaneDividers(sampleZone, 2, true);
      expect(divs.length).toBe(1);
      expect(divs[0].x1).toBe(0.1);
      expect(divs[0].x2).toBe(0.9);
      expect(divs[0].y1).toBeCloseTo(0.2 + 0.3, 4);
    });

    it("should compute column dividers correctly", () => {
      const divs = computeZoneLaneDividers(sampleZone, 4, false);
      expect(divs.length).toBe(3);
      expect(divs[0].x1).toBeCloseTo(0.1 + 0.2, 4);
      expect(divs[0].y1).toBe(0.2);
      expect(divs[0].y2).toBe(0.8);
    });
  });

  describe("computeZoneLanePreviews", () => {
    it("should compute row previews correctly", () => {
      const previews = computeZoneLanePreviews(sampleZone, 2, true);
      expect(previews.length).toBe(2);
      expect(previews[0].laneIndex).toBe(0);
      expect(previews[0].centerX).toBeCloseTo(0.5, 4);
      expect(previews[0].centerY).toBeCloseTo(0.35, 4);
      expect(previews[1].centerY).toBeCloseTo(0.65, 4);
    });

    it("should compute column previews correctly", () => {
      const previews = computeZoneLanePreviews(sampleZone, 2, false);
      expect(previews.length).toBe(2);
      expect(previews[0].centerX).toBeCloseTo(0.3, 4);
      expect(previews[0].centerY).toBeCloseTo(0.5, 4);
      expect(previews[1].centerX).toBeCloseTo(0.7, 4);
    });
  });

  describe("computeDefaultGates", () => {
    it("should generate gates for specified lane count with sensitivity", () => {
      const gates = computeDefaultGates(4, 0.6);
      expect(gates.length).toBe(4);
      expect(gates[0].laneIndex).toBe(0);
      expect(gates[0].sensitivity).toBe(0.6);
      expect(gates[0].yPct).toBe(0.38);
      expect(gates[3].laneIndex).toBe(3);
      expect(gates[3].xPct).toBeCloseTo(0.1 + 3 * 0.2, 4);
    });
  });

  describe("computeAutoSplitGates", () => {
    it("should generate gates split by rows", () => {
      const gates = computeAutoSplitGates(sampleZone, 2, true, 0.5);
      expect(gates.length).toBe(2);
      expect(gates[0].xPct).toBe(sampleZone.xPct);
      expect(gates[0].widthPct).toBe(sampleZone.widthPct);
      expect(gates[0].sensitivity).toBe(0.5);
    });

    it("should generate gates split by columns", () => {
      const gates = computeAutoSplitGates(sampleZone, 2, false, 0.7);
      expect(gates.length).toBe(2);
      expect(gates[0].yPct).toBe(sampleZone.yPct);
      expect(gates[0].heightPct).toBe(sampleZone.heightPct);
      expect(gates[0].sensitivity).toBe(0.7);
    });
  });

  describe("computeAutoSnapGate", () => {
    it("should compute gate for row split", () => {
      const gate = computeAutoSnapGate(sampleZone, true, 1, 0.4);
      expect(gate.laneIndex).toBe(1);
      expect(gate.xPct).toBe(sampleZone.xPct);
      expect(gate.yPct).toBe(sampleZone.yPct + 0.01);
      expect(gate.sensitivity).toBe(0.4);
    });

    it("should compute gate for column split", () => {
      const gate = computeAutoSnapGate(sampleZone, false, 2, 0.8);
      expect(gate.laneIndex).toBe(2);
      expect(gate.xPct).toBe(sampleZone.xPct + 0.01);
      expect(gate.yPct).toBe(sampleZone.yPct);
      expect(gate.sensitivity).toBe(0.8);
    });
  });

  describe("computeZoneDraw", () => {
    it("should calculate bounds based on pointer movement within rect", () => {
      const rect = { left: 100, top: 50, width: 200, height: 100 } as DOMRect;
      const zone = computeZoneDraw(120, 60, 180, 90, rect);
      expect(zone.xPct).toBeCloseTo(0.1, 2);
      expect(zone.yPct).toBeCloseTo(0.1, 2);
      expect(zone.widthPct).toBeCloseTo(0.3, 2);
      expect(zone.heightPct).toBeCloseTo(0.3, 2);
    });
  });

  describe("computeZoneResize", () => {
    it("should resize SE corner", () => {
      const resized = computeZoneResize("se", 0.1, 0.1, 0.4, 0.4, 0.1, 0.05);
      expect(resized.xPct).toBe(0.1);
      expect(resized.yPct).toBe(0.1);
      expect(resized.widthPct).toBeCloseTo(0.5, 4);
      expect(resized.heightPct).toBeCloseTo(0.45, 4);
    });

    it("should resize NW corner", () => {
      const resized = computeZoneResize("nw", 0.2, 0.2, 0.4, 0.4, 0.05, 0.05);
      expect(resized.xPct).toBeCloseTo(0.25, 4);
      expect(resized.yPct).toBeCloseTo(0.25, 4);
      expect(resized.widthPct).toBeCloseTo(0.35, 4);
      expect(resized.heightPct).toBeCloseTo(0.35, 4);
    });

    it("should resize SW corner", () => {
      const resized = computeZoneResize("sw", 0.2, 0.2, 0.4, 0.4, 0.05, 0.05);
      expect(resized.xPct).toBeCloseTo(0.25, 4);
      expect(resized.yPct).toBe(0.2);
      expect(resized.widthPct).toBeCloseTo(0.35, 4);
      expect(resized.heightPct).toBeCloseTo(0.45, 4);
    });

    it("should resize NE corner", () => {
      const resized = computeZoneResize("ne", 0.2, 0.2, 0.4, 0.4, 0.05, 0.05);
      expect(resized.xPct).toBe(0.2);
      expect(resized.yPct).toBeCloseTo(0.25, 4);
      expect(resized.widthPct).toBeCloseTo(0.45, 4);
      expect(resized.heightPct).toBeCloseTo(0.35, 4);
    });
  });

  describe("computeInitialFinishLineZone", () => {
    it("should return default zone when gates are empty", () => {
      const zone = computeInitialFinishLineZone([]);
      expect(zone).toEqual({
        xPct: 0.1,
        yPct: 0.35,
        widthPct: 0.8,
        heightPct: 0.3,
      });
    });

    it("should compute enclosing bounding box for existing gates", () => {
      const gates: LaneDetectionGate[] = [
        {
          laneIndex: 0,
          gateType: 0,
          xPct: 0.2,
          yPct: 0.3,
          widthPct: 0.2,
          heightPct: 0.4,
          sensitivity: 0.5,
        },
        {
          laneIndex: 1,
          gateType: 0,
          xPct: 0.5,
          yPct: 0.25,
          widthPct: 0.2,
          heightPct: 0.4,
          sensitivity: 0.5,
        },
      ];
      const zone = computeInitialFinishLineZone(gates);
      expect(zone.xPct).toBe(0.2);
      expect(zone.yPct).toBe(0.25);
      expect(zone.widthPct).toBeCloseTo(0.5, 4);
      expect(zone.heightPct).toBeCloseTo(0.45, 4);
    });
  });

  describe("computeActiveLaneSubRoi", () => {
    it("should compute sub-ROI for row split", () => {
      const roi = computeActiveLaneSubRoi(sampleZone, 3, 1, true);
      expect(roi.xPct).toBe(sampleZone.xPct);
      expect(roi.widthPct).toBe(sampleZone.widthPct);
      expect(roi.yPct).toBeCloseTo(sampleZone.yPct + 0.2, 4);
      expect(roi.heightPct).toBeCloseTo(0.2, 4);
    });

    it("should compute sub-ROI for column split", () => {
      const roi = computeActiveLaneSubRoi(sampleZone, 4, 2, false);
      expect(roi.yPct).toBe(sampleZone.yPct);
      expect(roi.heightPct).toBe(sampleZone.heightPct);
      expect(roi.xPct).toBeCloseTo(sampleZone.xPct + 0.4, 4);
      expect(roi.widthPct).toBeCloseTo(0.2, 4);
    });
  });

  describe("computeGateDrag", () => {
    it("should handle move drag", () => {
      const drag = computeGateDrag("move", 0.2, 0.3, 0.1, 0.2, 0.05, -0.05);
      expect(drag.xPct).toBeCloseTo(0.25, 4);
      expect(drag.yPct).toBeCloseTo(0.25, 4);
      expect(drag.widthPct).toBe(0.1);
      expect(drag.heightPct).toBe(0.2);
    });

    it("should handle resize drag", () => {
      const drag = computeGateDrag("resize", 0.2, 0.3, 0.1, 0.2, 0.05, 0.05);
      expect(drag.xPct).toBe(0.2);
      expect(drag.yPct).toBe(0.3);
      expect(drag.widthPct).toBeCloseTo(0.15, 4);
      expect(drag.heightPct).toBeCloseTo(0.25, 4);
    });
  });

  describe("computeZoneMove", () => {
    it("should shift x and y by delta percentages within boundaries", () => {
      const moved = computeZoneMove(0.2, 0.3, 0.4, 0.3, 0.1, -0.05);
      expect(moved.xPct).toBeCloseTo(0.3, 4);
      expect(moved.yPct).toBeCloseTo(0.25, 4);
    });

    it("should clamp within [0, 1 - width/height]", () => {
      const clamped = computeZoneMove(0.2, 0.3, 0.4, 0.3, -0.5, 0.8);
      expect(clamped.xPct).toBe(0);
      expect(clamped.yPct).toBeCloseTo(0.7, 4);
    });
  });

  describe("extractPointerCoords", () => {
    it("should extract clientX and clientY from MouseEvent", () => {
      const mouseEv = { clientX: 120, clientY: 240 } as unknown as MouseEvent;
      const coords = extractPointerCoords(mouseEv);
      expect(coords.clientX).toBe(120);
      expect(coords.clientY).toBe(240);
    });

    it("should extract clientX and clientY from TouchEvent touches", () => {
      const touchEv = {
        touches: [{ clientX: 300, clientY: 450 }],
      } as unknown as TouchEvent;
      const coords = extractPointerCoords(touchEv);
      expect(coords.clientX).toBe(300);
      expect(coords.clientY).toBe(450);
    });

    it("should fallback to changedTouches if touches is empty", () => {
      const touchEv = {
        touches: [],
        changedTouches: [{ clientX: 310, clientY: 460 }],
      } as unknown as TouchEvent;
      const coords = extractPointerCoords(touchEv);
      expect(coords.clientX).toBe(310);
      expect(coords.clientY).toBe(460);
    });
  });

  describe("parseGatesParam", () => {
    it("should return null for empty or invalid string", () => {
      expect(parseGatesParam(undefined, 2)).toBeNull();
      expect(parseGatesParam("", 2)).toBeNull();
      expect(parseGatesParam("not-json", 2)).toBeNull();
    });

    it("should return null if parsed array length does not match expectedLanes", () => {
      const gates = [
        { laneIndex: 0, xPct: 0.1, yPct: 0.2, widthPct: 0.3, heightPct: 0.4 },
      ];
      expect(parseGatesParam(JSON.stringify(gates), 2)).toBeNull();
    });

    it("should parse and validate correctly formatted gates", () => {
      const gates = [
        {
          laneIndex: 0,
          xPct: 0.1,
          yPct: 0.2,
          widthPct: 0.3,
          heightPct: 0.4,
          sensitivity: 0.7,
          type: "lap",
        },
        {
          laneIndex: 1,
          xPct: 0.5,
          yPct: 0.2,
          widthPct: 0.3,
          heightPct: 0.4,
          sensitivity: 0.7,
          type: "lap",
        },
      ];
      const parsed = parseGatesParam(JSON.stringify(gates), 2);
      expect(parsed).not.toBeNull();
      expect(parsed!.length).toBe(2);
      expect(parsed![0].laneIndex).toBe(0);
      expect(parsed![1].laneIndex).toBe(1);
    });
  });

  describe("resolveDefaultServerUrl", () => {
    it("should build ws:// url for http location", () => {
      const loc = {
        protocol: "http:",
        hostname: "192.168.1.188",
        port: "4200",
      } as Location;
      const url = resolveDefaultServerUrl(loc);
      expect(url).toBe("ws://192.168.1.188:7070/api/interface-data");
    });

    it("should build wss:// url for https location with tunnel", () => {
      const loc = {
        protocol: "https:",
        hostname: "secure-tunnel.loca.lt",
        port: "",
      } as Location;
      const url = resolveDefaultServerUrl(loc);
      expect(url).toBe("wss://secure-tunnel.loca.lt/api/interface-data");
    });
  });
});
