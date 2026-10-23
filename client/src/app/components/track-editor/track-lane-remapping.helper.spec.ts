import { ArduinoConfig, PhidgetConfig } from "@app/models/track";
import { PinBehavior, RgbLedBehavior } from "@app/proto/antigravity";

import { TrackLaneRemappingHelper } from "./track-lane-remapping.helper";

describe("TrackLaneRemappingHelper", () => {
  describe("getPinBehaviorBase", () => {
    it("should return -1 for non-lane-indexed behaviors", () => {
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_UNUSED,
        ),
      ).toBe(-1);
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_RESERVED,
        ),
      ).toBe(-1);
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_CALL_BUTTON,
        ),
      ).toBe(-1);
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(PinBehavior.BEHAVIOR_RELAY),
      ).toBe(-1);
      expect(TrackLaneRemappingHelper.getPinBehaviorBase(99999)).toBe(-1);
    });

    it("should identify base for lap behaviors", () => {
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_LAP_BASE + 2,
        ),
      ).toBe(PinBehavior.BEHAVIOR_LAP_BASE);
    });

    it("should identify base for segment behaviors", () => {
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_SEGMENT_BASE + 1,
        ),
      ).toBe(PinBehavior.BEHAVIOR_SEGMENT_BASE);
    });

    it("should identify base for call button base", () => {
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + 3,
        ),
      ).toBe(PinBehavior.BEHAVIOR_CALL_BUTTON_BASE);
    });

    it("should identify base for relay base", () => {
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_RELAY_BASE + 2,
        ),
      ).toBe(PinBehavior.BEHAVIOR_RELAY_BASE);
    });

    it("should identify base for voltage level base", () => {
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1,
        ),
      ).toBe(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE);
    });

    it("should identify base for pit in / pit out / pit in out bases", () => {
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_PIT_IN_BASE + 1,
        ),
      ).toBe(PinBehavior.BEHAVIOR_PIT_IN_BASE);
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_PIT_OUT_BASE + 2,
        ),
      ).toBe(PinBehavior.BEHAVIOR_PIT_OUT_BASE);
      expect(
        TrackLaneRemappingHelper.getPinBehaviorBase(
          PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + 0,
        ),
      ).toBe(PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE);
    });

    it("should identify base for analog led heat leader base", () => {
      const base = (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE;
      if (base !== undefined) {
        expect(TrackLaneRemappingHelper.getPinBehaviorBase(base + 1)).toBe(
          base,
        );
      }
    });
  });

  describe("remapLaneIndex", () => {
    it("should remap lane moving from lower to higher index", () => {
      // Lane 0 moved to 2: 0 -> 2, 1 -> 0, 2 -> 1, 3 -> 3
      expect(TrackLaneRemappingHelper.remapLaneIndex(0, 0, 2)).toBe(2);
      expect(TrackLaneRemappingHelper.remapLaneIndex(1, 0, 2)).toBe(0);
      expect(TrackLaneRemappingHelper.remapLaneIndex(2, 0, 2)).toBe(1);
      expect(TrackLaneRemappingHelper.remapLaneIndex(3, 0, 2)).toBe(3);
    });

    it("should remap lane moving from higher to lower index", () => {
      // Lane 2 moved to 0: 2 -> 0, 0 -> 1, 1 -> 2, 3 -> 3
      expect(TrackLaneRemappingHelper.remapLaneIndex(2, 2, 0)).toBe(0);
      expect(TrackLaneRemappingHelper.remapLaneIndex(0, 2, 0)).toBe(1);
      expect(TrackLaneRemappingHelper.remapLaneIndex(1, 2, 0)).toBe(2);
      expect(TrackLaneRemappingHelper.remapLaneIndex(3, 2, 0)).toBe(3);
    });

    it("should leave unaffected lanes untouched when prevIndex === currIndex", () => {
      expect(TrackLaneRemappingHelper.remapLaneIndex(1, 1, 1)).toBe(1);
    });
  });

  describe("remapPinIdsForOrderChange and remapVoltageConfigsForOrderChange", () => {
    it("should remap pin IDs when lane order changes", () => {
      const ids = [
        PinBehavior.BEHAVIOR_LAP_BASE + 0,
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
        PinBehavior.BEHAVIOR_UNUSED,
      ];
      TrackLaneRemappingHelper.remapPinIdsForOrderChange(ids, 0, 1);
      expect(ids[0]).toBe(PinBehavior.BEHAVIOR_LAP_BASE + 1);
      expect(ids[1]).toBe(PinBehavior.BEHAVIOR_LAP_BASE + 0);
      expect(ids[2]).toBe(PinBehavior.BEHAVIOR_UNUSED);
    });

    it("should handle undefined ids gracefully", () => {
      expect(() =>
        TrackLaneRemappingHelper.remapPinIdsForOrderChange(undefined, 0, 1),
      ).not.toThrow();
    });

    it("should remap voltage configs on order change", () => {
      const vConfigs = { 0: 10, 1: 20 };
      const remapped =
        TrackLaneRemappingHelper.remapVoltageConfigsForOrderChange(
          vConfigs,
          0,
          1,
        );
      expect(remapped).toEqual({ 1: 10, 0: 20 });
    });

    it("should handle undefined voltage configs", () => {
      expect(
        TrackLaneRemappingHelper.remapVoltageConfigsForOrderChange(
          undefined,
          0,
          1,
        ),
      ).toBeUndefined();
    });
  });

  describe("remapLedStringsForOrderChange", () => {
    it("should reorder ledLaneColorOverrides and shift led behaviors", () => {
      const ledStrings = [
        {
          ledLaneColorOverrides: ["red", "blue", "green"],
          leds: [
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 0,
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 1,
            RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED,
          ],
        },
      ];
      TrackLaneRemappingHelper.remapLedStringsForOrderChange(ledStrings, 0, 1);
      expect(ledStrings[0].ledLaneColorOverrides).toEqual([
        "blue",
        "red",
        "green",
      ]);
      expect(ledStrings[0].leds[0]).toBe(
        RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 1,
      );
      expect(ledStrings[0].leds[1]).toBe(
        RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 0,
      );
      expect(ledStrings[0].leds[2]).toBe(
        RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED,
      );
    });

    it("should handle undefined ledStrings gracefully", () => {
      expect(() =>
        TrackLaneRemappingHelper.remapLedStringsForOrderChange(undefined, 0, 1),
      ).not.toThrow();
    });
  });

  describe("updateInterfaceConfigsOnLaneOrderChange", () => {
    it("should update both arduino and phidget configs on lane order change", () => {
      const arduinoConfigs: ArduinoConfig[] = [
        {
          digitalIds: [PinBehavior.BEHAVIOR_LAP_BASE + 0],
          analogIds: [PinBehavior.BEHAVIOR_LAP_BASE + 1],
          voltageConfigs: { 0: 5, 1: 12 },
          ledStrings: [],
        } as any,
      ];
      const phidgetConfigs: PhidgetConfig[] = [
        {
          digitalInIds: [PinBehavior.BEHAVIOR_LAP_BASE + 0],
          digitalOutIds: [PinBehavior.BEHAVIOR_LAP_BASE + 1],
          analogIds: [],
          voltageConfigs: { 0: 8 },
        } as any,
      ];

      TrackLaneRemappingHelper.updateInterfaceConfigsOnLaneOrderChange(
        arduinoConfigs,
        phidgetConfigs,
        0,
        1,
      );

      expect(arduinoConfigs[0].digitalIds[0]).toBe(
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
      );
      expect(arduinoConfigs[0].analogIds[0]).toBe(
        PinBehavior.BEHAVIOR_LAP_BASE + 0,
      );
      expect(arduinoConfigs[0].voltageConfigs).toEqual({ 1: 5, 0: 12 });
      expect(phidgetConfigs[0].digitalInIds[0]).toBe(
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
      );
      expect(phidgetConfigs[0].voltageConfigs).toEqual({ 1: 8 });
    });
  });

  describe("deletion remapping", () => {
    it("should remap pin IDs on lane deletion", () => {
      const ids = [
        PinBehavior.BEHAVIOR_LAP_BASE + 0,
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
        PinBehavior.BEHAVIOR_LAP_BASE + 2,
      ];
      TrackLaneRemappingHelper.remapPinIdsForDeletion(ids, 1);
      expect(ids[0]).toBe(PinBehavior.BEHAVIOR_LAP_BASE + 0);
      expect(ids[1]).toBe(PinBehavior.BEHAVIOR_UNUSED);
      expect(ids[2]).toBe(PinBehavior.BEHAVIOR_LAP_BASE + 1);
    });

    it("should handle undefined ids on deletion", () => {
      expect(() =>
        TrackLaneRemappingHelper.remapPinIdsForDeletion(undefined, 0),
      ).not.toThrow();
    });

    it("should remap voltage configs on lane deletion", () => {
      const vConfigs = { 0: 5, 1: 10, 2: 15 };
      const remapped = TrackLaneRemappingHelper.remapVoltageConfigsForDeletion(
        vConfigs,
        1,
      );
      expect(remapped).toEqual({ 0: 5, 1: 15 });
    });

    it("should handle undefined voltage configs on deletion", () => {
      expect(
        TrackLaneRemappingHelper.remapVoltageConfigsForDeletion(undefined, 0),
      ).toBeUndefined();
    });

    it("should remap led strings on deletion", () => {
      const ledStrings = [
        {
          ledLaneColorOverrides: ["red", "blue", "green"],
          leds: [
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 0,
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 1,
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 2,
          ],
        },
      ];
      TrackLaneRemappingHelper.remapLedStringsForDeletion(ledStrings, 1);
      expect(ledStrings[0].ledLaneColorOverrides).toEqual(["red", "green"]);
      expect(ledStrings[0].leds[0]).toBe(
        RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 0,
      );
      expect(ledStrings[0].leds[1]).toBe(
        RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED,
      );
      expect(ledStrings[0].leds[2]).toBe(
        RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 1,
      );
    });

    it("should handle undefined ledStrings on deletion", () => {
      expect(() =>
        TrackLaneRemappingHelper.remapLedStringsForDeletion(undefined, 0),
      ).not.toThrow();
    });

    it("should update both arduino and phidget configs on lane deletion", () => {
      const arduinoConfigs: ArduinoConfig[] = [
        {
          digitalIds: [PinBehavior.BEHAVIOR_LAP_BASE + 1],
          analogIds: [PinBehavior.BEHAVIOR_LAP_BASE + 2],
          voltageConfigs: { 0: 10, 1: 20 },
          ledStrings: [],
        } as any,
      ];
      const phidgetConfigs: PhidgetConfig[] = [
        {
          digitalInIds: [PinBehavior.BEHAVIOR_LAP_BASE + 1],
          digitalOutIds: [],
          analogIds: [],
          voltageConfigs: { 1: 20 },
        } as any,
      ];

      TrackLaneRemappingHelper.updateInterfaceConfigsOnLaneDeletion(
        arduinoConfigs,
        phidgetConfigs,
        1,
      );

      expect(arduinoConfigs[0].digitalIds[0]).toBe(PinBehavior.BEHAVIOR_UNUSED);
      expect(arduinoConfigs[0].analogIds[0]).toBe(
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
      );
      expect(arduinoConfigs[0].voltageConfigs).toEqual({ 0: 10 });
      expect(phidgetConfigs[0].digitalInIds[0]).toBe(
        PinBehavior.BEHAVIOR_UNUSED,
      );
      expect(phidgetConfigs[0].voltageConfigs).toEqual({});
    });
  });
});
