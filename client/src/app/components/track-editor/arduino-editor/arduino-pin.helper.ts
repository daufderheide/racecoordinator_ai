import { Lane } from "@app/models/lane";
import { ArduinoConfig } from "@app/models/track";
import { PinBehavior, RgbLedBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";

export interface PinAction {
  label: string;
  value: string;
  disabled?: boolean;
  tooltip?: string;
}

export interface PinGroup {
  key: string;
  label: string;
  actions: PinAction[];
}

export function isOutputPinBehavior(behavior: number): boolean {
  return (
    behavior === PinBehavior.BEHAVIOR_RELAY ||
    (behavior >= PinBehavior.BEHAVIOR_RELAY_BASE &&
      behavior < PinBehavior.BEHAVIOR_RELAY_BASE + 1000) ||
    behavior === PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG ||
    behavior === PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG ||
    (behavior >= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1 &&
      behavior <= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_5) ||
    (behavior >= (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE &&
      behavior <
        (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE + 1000)
  );
}

export function getPinAction(val: number): string {
  if (val === PinBehavior.BEHAVIOR_UNUSED || val === -1) return "";
  if (val === PinBehavior.BEHAVIOR_RESERVED) return "reserved";
  if (val === PinBehavior.BEHAVIOR_CALL_BUTTON) return "master_call";
  if (val === PinBehavior.BEHAVIOR_RELAY) return "master_relay";

  if (
    val >= PinBehavior.BEHAVIOR_LAP_BASE &&
    val < PinBehavior.BEHAVIOR_SEGMENT_BASE
  ) {
    return `lap_${val - PinBehavior.BEHAVIOR_LAP_BASE}`;
  }

  if (
    val >= PinBehavior.BEHAVIOR_SEGMENT_BASE &&
    val < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE
  ) {
    return `segment_${val - PinBehavior.BEHAVIOR_SEGMENT_BASE}`;
  }

  if (
    val >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE &&
    val < PinBehavior.BEHAVIOR_RELAY_BASE
  ) {
    return `call_${val - PinBehavior.BEHAVIOR_CALL_BUTTON_BASE}`;
  }

  if (
    val >= PinBehavior.BEHAVIOR_RELAY_BASE &&
    val < PinBehavior.BEHAVIOR_RELAY_BASE + 1000
  ) {
    return `relay_${val - PinBehavior.BEHAVIOR_RELAY_BASE}`;
  }

  if (
    val >= PinBehavior.BEHAVIOR_PIT_IN_BASE &&
    val < PinBehavior.BEHAVIOR_PIT_OUT_BASE
  ) {
    return `pitin_${val - PinBehavior.BEHAVIOR_PIT_IN_BASE}`;
  }

  if (
    val >= PinBehavior.BEHAVIOR_PIT_OUT_BASE &&
    val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE
  ) {
    return `pitout_${val - PinBehavior.BEHAVIOR_PIT_OUT_BASE}`;
  }

  if (
    val >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE &&
    val < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + 1000
  ) {
    return `pitinout_${val - PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE}`;
  }

  if (
    val >= PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
    val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
  ) {
    return `voltage_${val - PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE}`;
  }

  if (val === (PinBehavior as any).BEHAVIOR_LED_RGB_STRING) {
    return "led_string";
  }

  if (val === (PinBehavior as any).BEHAVIOR_ANALOG_LED_GREEN_FLAG) {
    return "analogled_green";
  }
  if (val === (PinBehavior as any).BEHAVIOR_ANALOG_LED_YELLOW_FLAG) {
    return "analogled_yellow";
  }
  for (let i = 1; i <= 5; i++) {
    if (val === (PinBehavior as any)[`BEHAVIOR_ANALOG_LED_COUNTDOWN_${i}`]) {
      return `analogled_countdown_${i}`;
    }
  }
  if (
    val >= (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE &&
    val < (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE + 1000
  ) {
    return `analogled_heat_leader_${val - (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE}`;
  }

  return "";
}

export function parsePinAction(action: string): number {
  if (action === "master_call") {
    return PinBehavior.BEHAVIOR_CALL_BUTTON;
  } else if (action === "master_relay") {
    return PinBehavior.BEHAVIOR_RELAY;
  } else if (action.startsWith("lap_")) {
    const laneIndex = parseInt(action.split("_")[1], 10);
    return PinBehavior.BEHAVIOR_LAP_BASE + laneIndex;
  } else if (action.startsWith("segment_")) {
    const laneIndex = parseInt(action.split("_")[1], 10);
    return PinBehavior.BEHAVIOR_SEGMENT_BASE + laneIndex;
  } else if (action.startsWith("call_")) {
    const laneIndex = parseInt(action.split("_")[1], 10);
    return PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + laneIndex;
  } else if (action.startsWith("relay_")) {
    const laneIndex = parseInt(action.split("_")[1], 10);
    return PinBehavior.BEHAVIOR_RELAY_BASE + laneIndex;
  } else if (action === "reserved") {
    return PinBehavior.BEHAVIOR_RESERVED;
  } else if (action.startsWith("voltage_")) {
    const laneIndex = parseInt(action.split("_")[1], 10);
    return PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + laneIndex;
  } else if (action.startsWith("pitin_")) {
    const laneIndex = parseInt(action.split("_")[1], 10);
    return PinBehavior.BEHAVIOR_PIT_IN_BASE + laneIndex;
  } else if (action.startsWith("pitout_")) {
    const laneIndex = parseInt(action.split("_")[1], 10);
    return PinBehavior.BEHAVIOR_PIT_OUT_BASE + laneIndex;
  } else if (action.startsWith("pitinout_")) {
    const laneIndex = parseInt(action.split("_")[1], 10);
    return PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + laneIndex;
  } else if (action === "led_string") {
    return (PinBehavior as any).BEHAVIOR_LED_RGB_STRING;
  } else if (action === "analogled_green") {
    return (PinBehavior as any).BEHAVIOR_ANALOG_LED_GREEN_FLAG;
  } else if (action === "analogled_yellow") {
    return (PinBehavior as any).BEHAVIOR_ANALOG_LED_YELLOW_FLAG;
  } else if (action.startsWith("analogled_countdown_")) {
    const index = parseInt(action.split("_")[2], 10);
    return (PinBehavior as any)[`BEHAVIOR_ANALOG_LED_COUNTDOWN_${index}`];
  } else if (action.startsWith("analogled_heat_leader_")) {
    const laneIndex = parseInt(action.split("_")[3], 10);
    return (
      (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE + laneIndex
    );
  }
  return PinBehavior.BEHAVIOR_UNUSED;
}

export function buildNonePinGroup(
  translationService: TranslationService,
): PinGroup {
  return {
    key: "",
    label: "",
    actions: [
      {
        label: translationService.translate("AE_PIN_UNUSED"),
        value: "",
      },
      {
        label: translationService.translate("AE_PIN_RESERVED"),
        value: "reserved",
      },
    ],
  };
}

export function buildCallButtonPinGroup(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup {
  const callActions: PinAction[] = [
    {
      label: translationService.translate("AE_PIN_MASTER_CALL"),
      value: "master_call",
    },
  ];
  lanes.forEach((_, i) => {
    callActions.push({
      label: translationService.translate("AE_PIN_CALL_BUTTON_LANE", {
        lane: i + 1,
      }),
      value: `call_${i}`,
    });
  });
  return {
    key: "AE_BEHAVIOR_GROUP_CALLBUTTON",
    label: translationService.translate("AE_BEHAVIOR_GROUP_CALLBUTTON"),
    actions: callActions,
  };
}

export function buildRelayPinGroup(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup {
  const relayActions: PinAction[] = [
    {
      label: translationService.translate("AE_PIN_RELAY"),
      value: "master_relay",
    },
  ];
  lanes.forEach((_, i) => {
    relayActions.push({
      label: translationService.translate("AE_PIN_RELAY_LANE", {
        lane: i + 1,
      }),
      value: `relay_${i}`,
    });
  });
  return {
    key: "AE_BEHAVIOR_GROUP_RELAY",
    label: translationService.translate("AE_BEHAVIOR_GROUP_RELAY"),
    actions: relayActions,
  };
}

export function buildPitPinGroup(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup | null {
  const pitActions: PinAction[] = [];
  lanes.forEach((_, i) => {
    pitActions.push({
      label: translationService.translate("AE_PIN_PIT_IN_LANE", {
        lane: i + 1,
      }),
      value: `pitin_${i}`,
    });
    pitActions.push({
      label: translationService.translate("AE_PIN_PIT_OUT_LANE", {
        lane: i + 1,
      }),
      value: `pitout_${i}`,
    });
    pitActions.push({
      label: translationService.translate("AE_PIN_PIT_IN_OUT_LANE", {
        lane: i + 1,
      }),
      value: `pitinout_${i}`,
    });
  });
  if (pitActions.length === 0) {
    return null;
  }
  return {
    key: "AE_BEHAVIOR_GROUP_PIT",
    label: translationService.translate("AE_BEHAVIOR_GROUP_PIT"),
    actions: pitActions,
  };
}

export function buildLapPinGroup(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup | null {
  const lapActions: PinAction[] = [];
  lanes.forEach((_, i) => {
    lapActions.push({
      label: translationService.translate("AE_PIN_LAP_LANE", {
        lane: i + 1,
      }),
      value: `lap_${i}`,
    });
  });
  if (lapActions.length === 0) {
    return null;
  }
  return {
    key: "AE_BEHAVIOR_GROUP_LAP",
    label: translationService.translate("AE_BEHAVIOR_GROUP_LAP"),
    actions: lapActions,
  };
}

export function buildSegmentPinGroup(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup | null {
  const segmentActions: PinAction[] = [];
  lanes.forEach((_, i) => {
    segmentActions.push({
      label: translationService.translate("AE_PIN_SEGMENT_LANE", {
        lane: i + 1,
      }),
      value: `segment_${i}`,
    });
  });
  if (segmentActions.length === 0) {
    return null;
  }
  return {
    key: "AE_BEHAVIOR_GROUP_SEGMENT",
    label: translationService.translate("AE_BEHAVIOR_GROUP_SEGMENT"),
    actions: segmentActions,
  };
}

export function buildVoltagePinGroup(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup | null {
  const voltageActions: PinAction[] = [];
  lanes.forEach((_, i) => {
    voltageActions.push({
      label: translationService.translate("AE_PIN_VOLTAGE_LANE", {
        lane: i + 1,
      }),
      value: `voltage_${i}`,
    });
  });
  if (voltageActions.length === 0) {
    return null;
  }
  return {
    key: "AE_BEHAVIOR_GROUP_VOLTAGE",
    label: translationService.translate("AE_BEHAVIOR_GROUP_VOLTAGE"),
    actions: voltageActions,
  };
}

export function buildAnalogLedPinGroup(
  lanes: Lane[],
  translationService: TranslationService,
): PinGroup {
  const analogLedActions: PinAction[] = [
    {
      label: translationService.translate("AE_PIN_ANALOG_LED_GREEN_FLAG"),
      value: "analogled_green",
    },
    {
      label: translationService.translate("AE_PIN_ANALOG_LED_YELLOW_FLAG"),
      value: "analogled_yellow",
    },
    {
      label: translationService.translate("AE_PIN_ANALOG_LED_COUNTDOWN", {
        num: 1,
      }),
      value: "analogled_countdown_1",
    },
    {
      label: translationService.translate("AE_PIN_ANALOG_LED_COUNTDOWN", {
        num: 2,
      }),
      value: "analogled_countdown_2",
    },
    {
      label: translationService.translate("AE_PIN_ANALOG_LED_COUNTDOWN", {
        num: 3,
      }),
      value: "analogled_countdown_3",
    },
    {
      label: translationService.translate("AE_PIN_ANALOG_LED_COUNTDOWN", {
        num: 4,
      }),
      value: "analogled_countdown_4",
    },
    {
      label: translationService.translate("AE_PIN_ANALOG_LED_COUNTDOWN", {
        num: 5,
      }),
      value: "analogled_countdown_5",
    },
  ];
  lanes.forEach((_, i) => {
    analogLedActions.push({
      label: translationService.translate(
        "AE_PIN_ANALOG_LED_HEAT_LEADER_LANE",
        { lane: i + 1 },
      ),
      value: `analogled_heat_leader_${i}`,
    });
  });
  return {
    key: "AE_BEHAVIOR_GROUP_ANALOG_LED",
    label: translationService.translate("AE_BEHAVIOR_GROUP_ANALOG_LED"),
    actions: analogLedActions,
  };
}

export function buildOtherPinGroup(
  translationService: TranslationService,
): PinGroup {
  return {
    key: "AE_BEHAVIOR_GROUP_OTHER",
    label: translationService.translate("AE_BEHAVIOR_GROUP_OTHER"),
    actions: [
      {
        label: translationService.translate("AE_PIN_LED_RGB_STRING"),
        value: "led_string",
      },
    ],
  };
}

export function sortPinGroups(groups: PinGroup[]): void {
  // Sort each group's actions alphabetically by label (except the 'None' group)
  groups.forEach((g) => {
    if (g.key !== "") {
      g.actions.sort((a, b) => a.label.localeCompare(b.label));
    }
  });

  // Sort groups alphabetically by label, but keep the "None" group (empty key) first
  groups.sort((a, b) => {
    if (a.key === "") return -1;
    if (b.key === "") return 1;
    return a.label.localeCompare(b.label);
  });
}

export function createPinGroups(
  lanes: Lane[],
  includeVoltage: boolean,
  translationService: TranslationService,
): PinGroup[] {
  const groups: PinGroup[] = [
    buildNonePinGroup(translationService),
    buildCallButtonPinGroup(lanes, translationService),
    buildRelayPinGroup(lanes, translationService),
  ];

  const pitGroup = buildPitPinGroup(lanes, translationService);
  if (pitGroup) groups.push(pitGroup);

  const lapGroup = buildLapPinGroup(lanes, translationService);
  if (lapGroup) groups.push(lapGroup);

  const segmentGroup = buildSegmentPinGroup(lanes, translationService);
  if (segmentGroup) groups.push(segmentGroup);

  if (includeVoltage) {
    const voltageGroup = buildVoltagePinGroup(lanes, translationService);
    if (voltageGroup) groups.push(voltageGroup);
  }

  groups.push(buildAnalogLedPinGroup(lanes, translationService));
  groups.push(buildOtherPinGroup(translationService));

  sortPinGroups(groups);
  return groups;
}

export function filterPinActions(
  groups: PinGroup[],
  isDigital: boolean,
  pin: number,
  config: ArduinoConfig | undefined,
  supportsRgbLeds: boolean,
  currentAction: string,
  translationService: TranslationService,
): PinGroup[] {
  if (!config) {
    return groups;
  }

  let canLed = true;
  if (config.hardwareType === 0) {
    // Uno/Nano (hardwareType 0), only allow led_string on D2-D3 and ALL analog A0-A5
    canLed = isDigital ? pin >= 2 && pin <= 3 : pin >= 0 && pin <= 5;
  } else if (config.hardwareType === 1) {
    // Mega (hardwareType 1), only allow led_string on EVEN digital pins D22-D52 and EVEN analog A0-A14
    canLed = isDigital
      ? pin >= 22 && pin <= 52 && pin % 2 === 0
      : pin >= 0 && pin <= 15 && pin % 2 === 0;
  }

  let filtered = groups;
  if (!canLed && currentAction !== "led_string") {
    filtered = groups
      .map((g) => ({
        ...g,
        actions: g.actions.filter((a) => a.value !== "led_string"),
      }))
      .filter((g) => g.actions.length > 0);
  }

  if (!supportsRgbLeds) {
    filtered = filtered.map((g) => ({
      ...g,
      actions: g.actions.map((a) => {
        if (a.value === "led_string") {
          return {
            ...a,
            disabled: true,
            tooltip: translationService.translate(
              "AE_RGB_LEDS_DISABLED_TOOLTIP",
            ),
          };
        }
        return a;
      }),
    }));
  }

  return filtered;
}

export function getLaneIndexFromPinBehavior(behavior: number): number {
  const bases = [
    PinBehavior.BEHAVIOR_LAP_BASE,
    PinBehavior.BEHAVIOR_SEGMENT_BASE,
    PinBehavior.BEHAVIOR_CALL_BUTTON_BASE,
    PinBehavior.BEHAVIOR_RELAY_BASE,
    PinBehavior.BEHAVIOR_PIT_IN_BASE,
    PinBehavior.BEHAVIOR_PIT_OUT_BASE,
    PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE,
    PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE,
  ];

  for (const base of bases) {
    if (behavior >= base && behavior < base + 1000) {
      return behavior - base;
    }
  }
  return -1;
}

export function getLaneIndexFromRgbBehavior(behavior: number): number {
  const bases = [
    RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE,
    RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE,
    RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE,
    RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE,
    RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE,
  ];

  for (const base of bases) {
    if (behavior >= base && behavior < base + 1000) {
      return behavior - base;
    }
  }
  return -1;
}

export function getVoltageLanes(config: ArduinoConfig | undefined): number[] {
  if (!config) return [];
  const lanes = new Set<number>();
  const isMega = config.hardwareType === 1;
  const analogCount = isMega ? 16 : 6;
  const analogIds = config.analogIds || [];
  for (let i = 0; i < analogCount; i++) {
    const behavior = analogIds[i];
    if (
      behavior !== undefined &&
      behavior >= PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
      behavior < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
    ) {
      lanes.add(behavior - PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE);
    }
  }
  return Array.from(lanes).sort((a, b) => a - b);
}

export function getLaneForAnalogPin(
  config: ArduinoConfig | undefined,
  pin: number,
): number {
  if (!config) return -1;
  const isMega = config.hardwareType === 1;
  const analogCount = isMega ? 16 : 6;
  const analogIds = config.analogIds || [];
  if (pin >= 0 && pin < analogCount) {
    const behavior = analogIds[pin];
    if (
      behavior !== undefined &&
      behavior >= PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
      behavior < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
    ) {
      return behavior - PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE;
    }
  }
  return -1;
}

export function syncArduinoLanes(
  config: ArduinoConfig,
  lanes: Lane[],
): boolean {
  const laneCount = lanes.length;
  let changed = false;

  // Validate/Update LED strings
  (config.ledStrings || []).forEach((ls) => {
    if (ls.ledLaneColorOverrides.length > laneCount) {
      ls.ledLaneColorOverrides = ls.ledLaneColorOverrides.slice(0, laneCount);
      changed = true;
    }

    while (ls.ledLaneColorOverrides.length < laneCount) {
      const laneIdx = ls.ledLaneColorOverrides.length;
      const lane = lanes[laneIdx];
      ls.ledLaneColorOverrides.push(lane?.background_color || "#ffffff");
      changed = true;
    }
    if (ls.ledLaneColorOverrides.length > laneCount) {
      ls.ledLaneColorOverrides.splice(laneCount);
      changed = true;
    }

    for (let i = 0; i < ls.ledLaneColorOverrides.length; i++) {
      if (
        !ls.ledLaneColorOverrides[i] ||
        ls.ledLaneColorOverrides[i].trim() === ""
      ) {
        const lane = lanes[i];
        ls.ledLaneColorOverrides[i] = lane?.background_color || "#ffffff";
        changed = true;
      }
    }

    if (ls.leds) {
      ls.leds = ls.leds.map((behavior) => {
        const laneIdx = getLaneIndexFromRgbBehavior(behavior);
        if (laneIdx !== -1 && laneIdx >= laneCount) {
          changed = true;
          return RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED;
        }
        return behavior;
      });
    }
  });

  const validatePins = (ids: number[]) => {
    if (!ids) return;
    for (let i = 0; i < ids.length; i++) {
      const laneIdx = getLaneIndexFromPinBehavior(ids[i]);
      if (laneIdx !== -1 && laneIdx >= laneCount) {
        ids[i] = PinBehavior.BEHAVIOR_UNUSED;
        changed = true;
      }
    }
  };

  if (config.digitalIds) validatePins(config.digitalIds);
  if (config.analogIds) validatePins(config.analogIds);

  if (config.voltageConfigs) {
    const activeVoltageLanes = new Set(getVoltageLanes(config));
    Object.keys(config.voltageConfigs).forEach((key) => {
      const laneIdx = parseInt(key, 10);
      if (laneIdx >= laneCount || !activeVoltageLanes.has(laneIdx)) {
        delete config.voltageConfigs![laneIdx];
        changed = true;
      }
    });
  }

  return changed;
}
