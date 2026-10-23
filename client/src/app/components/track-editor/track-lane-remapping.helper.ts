import { moveItemInArray } from "@angular/cdk/drag-drop";
import { ArduinoConfig, PhidgetConfig } from "@app/models/track";
import { PinBehavior, RgbLedBehavior } from "@app/proto/antigravity";

export class TrackLaneRemappingHelper {
  static getPinBehaviorBase(val: number): number {
    if (
      val === PinBehavior.BEHAVIOR_UNUSED ||
      val === PinBehavior.BEHAVIOR_RESERVED ||
      val === PinBehavior.BEHAVIOR_CALL_BUTTON ||
      val === PinBehavior.BEHAVIOR_RELAY
    ) {
      return -1;
    }

    if (
      val >= PinBehavior.BEHAVIOR_LAP_BASE &&
      val < PinBehavior.BEHAVIOR_SEGMENT_BASE
    ) {
      return PinBehavior.BEHAVIOR_LAP_BASE;
    } else if (
      val >= PinBehavior.BEHAVIOR_SEGMENT_BASE &&
      val < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE
    ) {
      return PinBehavior.BEHAVIOR_SEGMENT_BASE;
    } else if (
      val >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE &&
      val < PinBehavior.BEHAVIOR_RELAY_BASE
    ) {
      return PinBehavior.BEHAVIOR_CALL_BUTTON_BASE;
    } else if (
      val >= PinBehavior.BEHAVIOR_RELAY_BASE &&
      val < PinBehavior.BEHAVIOR_RELAY_BASE + 1000
    ) {
      return PinBehavior.BEHAVIOR_RELAY_BASE;
    } else if (
      val >= PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
      val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
    ) {
      return PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE;
    } else if (
      val >= PinBehavior.BEHAVIOR_PIT_IN_BASE &&
      val < PinBehavior.BEHAVIOR_PIT_OUT_BASE
    ) {
      return PinBehavior.BEHAVIOR_PIT_IN_BASE;
    } else if (
      val >= PinBehavior.BEHAVIOR_PIT_OUT_BASE &&
      val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE
    ) {
      return PinBehavior.BEHAVIOR_PIT_OUT_BASE;
    } else if (
      val >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE &&
      val < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + 1000
    ) {
      return PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE;
    } else if (
      val >= (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE &&
      val < (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE + 1000
    ) {
      return (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE;
    }
    return -1;
  }

  static remapLaneIndex(
    lane: number,
    prevIndex: number,
    currIndex: number,
  ): number {
    if (lane === prevIndex) {
      return currIndex;
    } else if (prevIndex < currIndex) {
      if (lane > prevIndex && lane <= currIndex) {
        return lane - 1;
      }
    } else {
      if (lane >= currIndex && lane < prevIndex) {
        return lane + 1;
      }
    }
    return lane;
  }

  static remapPinIdsForOrderChange(
    ids: number[] | undefined,
    prevIndex: number,
    currIndex: number,
  ): void {
    if (!ids) return;
    for (let i = 0; i < ids.length; i++) {
      const val = ids[i];
      const base = TrackLaneRemappingHelper.getPinBehaviorBase(val);
      if (base !== -1) {
        const lane = val - base;
        const newLane = TrackLaneRemappingHelper.remapLaneIndex(
          lane,
          prevIndex,
          currIndex,
        );
        ids[i] = base + newLane;
      }
    }
  }

  static remapVoltageConfigsForOrderChange(
    voltageConfigs: { [lane: number]: number } | undefined,
    prevIndex: number,
    currIndex: number,
  ): { [lane: number]: number } | undefined {
    if (!voltageConfigs) return voltageConfigs;
    const newVoltageConfigs: { [lane: number]: number } = {};
    Object.entries(voltageConfigs).forEach(([laneStr, value]) => {
      const lane = parseInt(laneStr, 10);
      const newLane = TrackLaneRemappingHelper.remapLaneIndex(
        lane,
        prevIndex,
        currIndex,
      );
      newVoltageConfigs[newLane] = value;
    });
    return newVoltageConfigs;
  }

  static remapLedStringsForOrderChange(
    ledStrings: any[] | undefined,
    prevIndex: number,
    currIndex: number,
  ): void {
    if (!ledStrings) return;
    const bases = [
      RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE,
    ];
    ledStrings.forEach((ls) => {
      if (ls.ledLaneColorOverrides) {
        moveItemInArray(ls.ledLaneColorOverrides, prevIndex, currIndex);
      }
      if (ls.leds) {
        ls.leds = ls.leds.map((val: number) => {
          const base = bases.find((b) => val >= b && val < b + 1000);
          if (base !== undefined) {
            const lane = val - base;
            const newLane = TrackLaneRemappingHelper.remapLaneIndex(
              lane,
              prevIndex,
              currIndex,
            );
            return base + newLane;
          }
          return val;
        });
      }
    });
  }

  static updateInterfaceConfigsOnLaneOrderChange(
    arduinoConfigs: ArduinoConfig[] | undefined,
    phidgetConfigs: PhidgetConfig[] | undefined,
    prevIndex: number,
    currIndex: number,
  ): void {
    arduinoConfigs?.forEach((config) => {
      TrackLaneRemappingHelper.remapPinIdsForOrderChange(
        config.digitalIds,
        prevIndex,
        currIndex,
      );
      TrackLaneRemappingHelper.remapPinIdsForOrderChange(
        config.analogIds,
        prevIndex,
        currIndex,
      );
      config.voltageConfigs =
        TrackLaneRemappingHelper.remapVoltageConfigsForOrderChange(
          config.voltageConfigs,
          prevIndex,
          currIndex,
        );
      TrackLaneRemappingHelper.remapLedStringsForOrderChange(
        config.ledStrings,
        prevIndex,
        currIndex,
      );
    });

    phidgetConfigs?.forEach((config) => {
      TrackLaneRemappingHelper.remapPinIdsForOrderChange(
        config.digitalInIds,
        prevIndex,
        currIndex,
      );
      TrackLaneRemappingHelper.remapPinIdsForOrderChange(
        config.digitalOutIds,
        prevIndex,
        currIndex,
      );
      TrackLaneRemappingHelper.remapPinIdsForOrderChange(
        config.analogIds,
        prevIndex,
        currIndex,
      );
      config.voltageConfigs =
        TrackLaneRemappingHelper.remapVoltageConfigsForOrderChange(
          config.voltageConfigs,
          prevIndex,
          currIndex,
        );
    });
  }

  static remapPinIdsForDeletion(
    ids: number[] | undefined,
    deletedLaneIndex: number,
  ): void {
    if (!ids) return;
    for (let i = 0; i < ids.length; i++) {
      const val = ids[i];
      const base = TrackLaneRemappingHelper.getPinBehaviorBase(val);
      if (base !== -1) {
        const lane = val - base;
        if (lane === deletedLaneIndex) {
          ids[i] = PinBehavior.BEHAVIOR_UNUSED;
        } else if (lane > deletedLaneIndex) {
          ids[i] = val - 1;
        }
      }
    }
  }

  static remapVoltageConfigsForDeletion(
    voltageConfigs: { [lane: number]: number } | undefined,
    deletedLaneIndex: number,
  ): { [lane: number]: number } | undefined {
    if (!voltageConfigs) return voltageConfigs;
    const newVoltageConfigs: { [lane: number]: number } = {};
    Object.entries(voltageConfigs).forEach(([laneStr, value]) => {
      const lane = parseInt(laneStr, 10);
      if (lane < deletedLaneIndex) {
        newVoltageConfigs[lane] = value;
      } else if (lane > deletedLaneIndex) {
        newVoltageConfigs[lane - 1] = value;
      }
    });
    return newVoltageConfigs;
  }

  static remapLedStringsForDeletion(
    ledStrings: any[] | undefined,
    deletedLaneIndex: number,
  ): void {
    if (!ledStrings) return;
    const bases = [
      RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE,
    ];
    ledStrings.forEach((ls) => {
      if (
        ls.ledLaneColorOverrides &&
        ls.ledLaneColorOverrides.length > deletedLaneIndex
      ) {
        ls.ledLaneColorOverrides.splice(deletedLaneIndex, 1);
      }
      if (ls.leds) {
        ls.leds = ls.leds.map((val: number) => {
          const base = bases.find((b) => val >= b && val < b + 1000);
          if (base !== undefined) {
            const lane = val - base;
            if (lane === deletedLaneIndex) {
              return RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED;
            } else if (lane > deletedLaneIndex) {
              return val - 1;
            }
          }
          return val;
        });
      }
    });
  }

  static updateInterfaceConfigsOnLaneDeletion(
    arduinoConfigs: ArduinoConfig[] | undefined,
    phidgetConfigs: PhidgetConfig[] | undefined,
    deletedLaneIndex: number,
  ): void {
    arduinoConfigs?.forEach((config) => {
      TrackLaneRemappingHelper.remapPinIdsForDeletion(
        config.digitalIds,
        deletedLaneIndex,
      );
      TrackLaneRemappingHelper.remapPinIdsForDeletion(
        config.analogIds,
        deletedLaneIndex,
      );
      config.voltageConfigs =
        TrackLaneRemappingHelper.remapVoltageConfigsForDeletion(
          config.voltageConfigs,
          deletedLaneIndex,
        );
      TrackLaneRemappingHelper.remapLedStringsForDeletion(
        config.ledStrings,
        deletedLaneIndex,
      );
    });

    phidgetConfigs?.forEach((config) => {
      TrackLaneRemappingHelper.remapPinIdsForDeletion(
        config.digitalInIds,
        deletedLaneIndex,
      );
      TrackLaneRemappingHelper.remapPinIdsForDeletion(
        config.digitalOutIds,
        deletedLaneIndex,
      );
      TrackLaneRemappingHelper.remapPinIdsForDeletion(
        config.analogIds,
        deletedLaneIndex,
      );
      config.voltageConfigs =
        TrackLaneRemappingHelper.remapVoltageConfigsForDeletion(
          config.voltageConfigs,
          deletedLaneIndex,
        );
    });
  }
}
