import { Lane } from "@app/models/lane";
import { RgbLedBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";

import { PinAction, PinGroup } from "./arduino-pin.helper";

export function buildLeaderLedGroup(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup {
  const leaderActions: PinAction[] = [
    {
      label: translationService.translate("RGB_LED_BEHAVIOR_HEAT_PROGRESS"),
      value: RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS.toString(),
    },
    {
      label: translationService.translate("RGB_LED_BEHAVIOR_HEAT_LEADER"),
      value: RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER.toString(),
    },
    ...lanes.map((_, i) => ({
      label: translationService.translate("AE_LED_BEHAVIOR_HEAT_LEADER_LANE", {
        lane: i + 1,
      }),
      value: (RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + i).toString(),
    })),
  ];
  return {
    key: "AE_LED_GROUP_LEADER",
    label: translationService.translate("AE_LED_GROUP_LEADER"),
    actions: leaderActions,
  };
}

export function buildLaneLedGroup(
  groupKey: string,
  actionKey: string,
  baseVal: number,
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup {
  const actions: PinAction[] = lanes.map((_, i) => ({
    label: translationService.translate(actionKey, { lane: i + 1 }),
    value: (baseVal + i).toString(),
  }));
  return {
    key: groupKey,
    label: translationService.translate(groupKey),
    actions,
  };
}

export function buildIndexedLedGroup(
  groupKey: string,
  actionKey: string,
  baseVal: number,
  count: number,
  translationService: TranslationService,
): PinGroup {
  const actions: PinAction[] = [];
  for (let i = 1; i <= count; i++) {
    actions.push({
      label: translationService.translate(actionKey, { index: i }),
      value: (baseVal + i - 1).toString(),
    });
  }
  return {
    key: groupKey,
    label: translationService.translate(groupKey),
    actions,
  };
}

export function buildLedBehaviors(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup[] {
  const groups: PinGroup[] = [
    {
      key: "",
      label: "",
      actions: [
        {
          label: translationService.translate("AE_PIN_UNUSED"),
          value: RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED.toString(),
        },
      ],
    },
    buildLeaderLedGroup(lanes, translationService),
    buildLaneLedGroup(
      "AE_LED_GROUP_FUEL",
      "AE_LED_BEHAVIOR_FUEL_LEVEL_LANE",
      RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE,
      lanes,
      translationService,
    ),
    buildLaneLedGroup(
      "AE_LED_GROUP_REFUELING",
      "AE_LED_BEHAVIOR_REFUELING_LANE",
      RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE,
      lanes,
      translationService,
    ),
    buildLaneLedGroup(
      "AE_LED_GROUP_LAP_INDICATOR",
      "AE_LED_BEHAVIOR_LAP_INDICATOR_LANE",
      RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE,
      lanes,
      translationService,
    ),
    buildLaneLedGroup(
      "AE_LED_GROUP_LAP_SENSOR",
      "AE_LED_BEHAVIOR_LAP_SENSOR_LANE",
      RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE,
      lanes,
      translationService,
    ),
    buildIndexedLedGroup(
      "AE_LED_GROUP_RACE_STATE",
      "AE_LED_BEHAVIOR_RACE_STATE",
      RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE,
      5,
      translationService,
    ),
    buildIndexedLedGroup(
      "AE_LED_GROUP_COUNTDOWN",
      "AE_LED_BEHAVIOR_COUNTDOWN",
      RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE,
      5,
      translationService,
    ),
  ];

  groups.forEach((g) => {
    g.actions.sort((a, b) => a.label.localeCompare(b.label));
  });

  groups.sort((a, b) => {
    if (a.key === "") return -1;
    if (b.key === "") return 1;
    return a.label.localeCompare(b.label);
  });

  return groups;
}

export function buildLedTypes(
  translationService: TranslationService,
  hardwareType?: number,
): PinAction[] {
  const allTypes = [
    {
      label: translationService.translate("AE_LED_TYPE_NEOPIXEL"),
      value: "0",
    },
    {
      label: translationService.translate("AE_LED_TYPE_WS2811"),
      value: "1",
    },
    {
      label: translationService.translate("AE_LED_TYPE_WS2812"),
      value: "2",
    },
    {
      label: translationService.translate("AE_LED_TYPE_WS2812B"),
      value: "3",
    },
    {
      label: translationService.translate("AE_LED_TYPE_TM1809"),
      value: "4",
    },
    {
      label: translationService.translate("AE_LED_TYPE_OTHER"),
      value: "12",
    },
  ];
  if (hardwareType === 0) {
    return allTypes.filter((t) => ["1", "4", "12"].includes(t.value));
  }
  return allTypes;
}

export function buildColorOrders(
  translationService: TranslationService,
): PinAction[] {
  return [
    {
      label: translationService.translate("AE_LED_ORDER_RGB"),
      value: "0",
    },
    {
      label: translationService.translate("AE_LED_ORDER_GRB"),
      value: "1",
    },
    {
      label: translationService.translate("AE_LED_ORDER_BGR"),
      value: "2",
    },
    {
      label: translationService.translate("AE_LED_ORDER_RBG"),
      value: "3",
    },
    {
      label: translationService.translate("AE_LED_ORDER_GBR"),
      value: "4",
    },
    {
      label: translationService.translate("AE_LED_ORDER_BRG"),
      value: "5",
    },
  ];
}

export function getLedBaseTranslationKey(behaviorKey: string): string {
  switch (behaviorKey) {
    case "RGB_LED_BEHAVIOR_HEAT_LEADER_BASE":
      return "AE_LED_BEHAVIOR_HEAT_LEADER_LANE";
    case "RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE":
      return "AE_LED_BEHAVIOR_FUEL_LEVEL_LANE";
    case "RGB_LED_BEHAVIOR_REFUELING_BASE":
      return "AE_LED_BEHAVIOR_REFUELING_LANE";
    case "RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE":
      return "AE_LED_BEHAVIOR_LAP_INDICATOR_LANE";
    case "RGB_LED_BEHAVIOR_LAP_SENSOR_BASE":
      return "AE_LED_BEHAVIOR_LAP_SENSOR_LANE";
    default:
      return behaviorKey;
  }
}

export function getRgbLedColorHex(
  color: "off" | "red" | "green" | "blue",
): string | undefined {
  if (color === "red") return "#ef4444";
  if (color === "green") return "#22c55e";
  if (color === "blue") return "#3b82f6";
  return undefined;
}

export function getRgbLedColorShadow(
  color: "off" | "red" | "green" | "blue",
): string | undefined {
  if (color === "red") return "0 0 8px rgba(239, 68, 68, 0.6)";
  if (color === "green") return "0 0 8px rgba(34, 197, 94, 0.6)";
  if (color === "blue") return "0 0 8px rgba(59, 130, 246, 0.6)";
  return undefined;
}

export function getLedActionLabel(
  value: string | number | undefined,
  ledBehaviors: PinGroup[],
  translationService: TranslationService,
): string {
  const valStr = value?.toString();
  if (!valStr || valStr === "0") {
    return translationService.translate("AE_PIN_UNUSED");
  }
  for (const group of ledBehaviors) {
    const action = group.actions.find((a) => a.value === valStr);
    if (action) return action.label;
  }
  return valStr;
}
