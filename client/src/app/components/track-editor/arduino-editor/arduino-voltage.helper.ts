import { ArduinoConfig } from "@app/models/track";
import { PinBehavior } from "@app/proto/antigravity";

export function getLiveVoltageForLane(
  config: ArduinoConfig | undefined,
  liveVoltages: { [key: number]: number | undefined },
  lane: number,
): number {
  if (!config) return 0;
  const isMega = config.hardwareType === 1;
  const analogCount = isMega ? 16 : 6;
  const analogIds = config.analogIds || [];

  const targetBehavior = PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + lane;
  for (let i = 0; i < analogCount; i++) {
    if (analogIds[i] === targetBehavior) {
      return liveVoltages[i] ?? 0;
    }
  }
  return 0;
}

export function getVoltageMax(
  config: ArduinoConfig | undefined,
  lane: number,
): number {
  if (!config || !config.voltageConfigs) return 1023;
  const val = config.voltageConfigs[lane];
  return val !== undefined ? val : 1023;
}

export function setVoltageMaxInternal(
  config: ArduinoConfig | undefined,
  lane: number,
  value: number,
): void {
  if (!config) return;
  if (!config.voltageConfigs) config.voltageConfigs = {};
  config.voltageConfigs[lane] = value;
}

export function applyVoltageMax(
  config: ArduinoConfig | undefined,
  lane: number,
  value: string | number,
  isVoltageLinked: boolean,
  voltageLanes: number[],
): void {
  if (!config) return;

  const val = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(val)) return;

  if (isVoltageLinked) {
    for (const l of voltageLanes) {
      setVoltageMaxInternal(config, l, val);
    }
  } else {
    setVoltageMaxInternal(config, lane, val);
  }
}

export function applyMaxToSeen(
  config: ArduinoConfig | undefined,
  lane: number,
  maxVoltagesSeen: { [key: number]: number | undefined },
  isVoltageLinked: boolean,
  voltageLanes: number[],
): void {
  if (!config) return;
  if (isVoltageLinked) {
    let globalMax = 0;
    for (const l of voltageLanes) {
      globalMax = Math.max(globalMax, maxVoltagesSeen[l] ?? 0);
    }
    for (const l of voltageLanes) {
      setVoltageMaxInternal(config, l, globalMax);
    }
  } else {
    const maxSeen = maxVoltagesSeen[lane] ?? 0;
    setVoltageMaxInternal(config, lane, maxSeen);
  }
}
