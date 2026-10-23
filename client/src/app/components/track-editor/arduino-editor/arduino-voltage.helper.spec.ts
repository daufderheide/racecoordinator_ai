import { ArduinoConfig } from "@app/models/track";
import { PinBehavior } from "@app/proto/antigravity";

import {
  applyMaxToSeen,
  applyVoltageMax,
  getLiveVoltageForLane,
  getVoltageMax,
  setVoltageMaxInternal,
} from "./arduino-voltage.helper";

describe("arduino-voltage.helper", () => {
  let config: ArduinoConfig;

  beforeEach(() => {
    config = {
      name: "Arduino 1",
      commPort: "COM1",
      baudRate: 115200,
      debounceUs: 1000,
      normallyClosedRelays: false,
      activeLowAnalogLeds: false,
      usePitsAsLaps: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 0,
      hardwareType: 0,
      analogIds: [
        PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 0,
        PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1,
      ],
      digitalIds: [],
      ledStrings: [],
      voltageConfigs: { 0: 800, 1: 900 },
      normallyClosedLaneSensors: false,
    };
  });

  describe("getLiveVoltageForLane", () => {
    it("returns 0 when config is undefined", () => {
      expect(getLiveVoltageForLane(undefined, {}, 0)).toBe(0);
    });

    it("returns live voltage for matching lane pin on Uno (6 pins)", () => {
      const liveVoltages = { 0: 750, 1: 820 };
      expect(getLiveVoltageForLane(config, liveVoltages, 0)).toBe(750);
      expect(getLiveVoltageForLane(config, liveVoltages, 1)).toBe(820);
      expect(getLiveVoltageForLane(config, liveVoltages, 2)).toBe(0);
    });

    it("checks up to 16 pins on Mega", () => {
      config.hardwareType = 1;
      config.analogIds = new Array(16).fill(PinBehavior.BEHAVIOR_UNUSED);
      config.analogIds[10] = PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 2;
      const liveVoltages = { 10: 950 };
      expect(getLiveVoltageForLane(config, liveVoltages, 2)).toBe(950);
    });
  });

  describe("getVoltageMax", () => {
    it("returns 1023 when config or voltageConfigs is undefined", () => {
      expect(getVoltageMax(undefined, 0)).toBe(1023);
      expect(getVoltageMax({ ...config, voltageConfigs: undefined }, 0)).toBe(
        1023,
      );
    });

    it("returns configured value or 1023 fallback", () => {
      expect(getVoltageMax(config, 0)).toBe(800);
      expect(getVoltageMax(config, 2)).toBe(1023);
    });
  });

  describe("setVoltageMaxInternal", () => {
    it("does nothing when config is undefined", () => {
      setVoltageMaxInternal(undefined, 0, 500);
    });

    it("initializes voltageConfigs if undefined and sets value", () => {
      const cfg: ArduinoConfig = { ...config, voltageConfigs: undefined };
      setVoltageMaxInternal(cfg, 0, 650);
      expect(cfg.voltageConfigs![0]).toBe(650);
    });
  });

  describe("applyVoltageMax", () => {
    it("ignores NaN input", () => {
      applyVoltageMax(config, 0, "invalid", false, [0, 1]);
      expect(config.voltageConfigs![0]).toBe(800);
    });

    it("applies to single lane when not linked", () => {
      applyVoltageMax(config, 0, "700", false, [0, 1]);
      expect(config.voltageConfigs![0]).toBe(700);
      expect(config.voltageConfigs![1]).toBe(900);
    });

    it("applies to all voltage lanes when linked", () => {
      applyVoltageMax(config, 0, 750, true, [0, 1]);
      expect(config.voltageConfigs![0]).toBe(750);
      expect(config.voltageConfigs![1]).toBe(750);
    });

    it("handles undefined config safely", () => {
      expect(() => applyVoltageMax(undefined, 0, 700, false, [])).not.toThrow();
    });
  });

  describe("applyMaxToSeen", () => {
    it("applies single max seen when not linked", () => {
      const maxSeen = { 0: 920, 1: 940 };
      applyMaxToSeen(config, 0, maxSeen, false, [0, 1]);
      expect(config.voltageConfigs![0]).toBe(920);
      expect(config.voltageConfigs![1]).toBe(900);
    });

    it("applies highest global seen across lanes when linked", () => {
      const maxSeen = { 0: 920, 1: 980 };
      applyMaxToSeen(config, 0, maxSeen, true, [0, 1]);
      expect(config.voltageConfigs![0]).toBe(980);
      expect(config.voltageConfigs![1]).toBe(980);
    });

    it("handles undefined config safely", () => {
      expect(() => applyMaxToSeen(undefined, 0, {}, false, [])).not.toThrow();
    });
  });
});
