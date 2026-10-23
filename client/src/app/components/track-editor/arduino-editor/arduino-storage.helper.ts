import { LoggerService } from "@app/services/logger.service";

export interface ArduinoSectionsExpanded {
  arduino: boolean;
  main: boolean;
  digital: boolean;
  analog: boolean;
  voltage: boolean;
  leds: boolean;
}

export function loadArduinoSections(
  index: number,
  defaultSections: ArduinoSectionsExpanded,
  logger: LoggerService,
): ArduinoSectionsExpanded {
  const saved = localStorage.getItem(`rc.arduino-editor.sections.${index}`);
  if (!saved) {
    return { ...defaultSections };
  }
  try {
    const parsed = JSON.parse(saved);
    return { ...defaultSections, ...parsed };
  } catch (e) {
    logger.error("Failed to parse saved sections", e);
    return { ...defaultSections };
  }
}

export function loadArduinoGroupsCollapsed(
  index: number,
  logger: LoggerService,
): { [key: string]: boolean } {
  const saved = localStorage.getItem(
    `rc.arduino-editor.groups-collapsed.${index}`,
  );
  if (!saved) {
    return {};
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    logger.error("Failed to parse saved groups", e);
    return {};
  }
}

export function loadArduinoVoltageLinked(index: number): boolean {
  const saved = localStorage.getItem(
    `rc.arduino-editor.voltage-linked.${index}`,
  );
  return saved !== null ? saved === "true" : false;
}

export function loadArduinoLedStringsLinked(index: number): boolean {
  const saved = localStorage.getItem(
    `rc.arduino-editor.led-strings-linked.${index}`,
  );
  return saved !== null ? saved === "true" : true;
}

export function loadArduinoLedStringsExpanded(
  index: number,
  count: number,
  logger: LoggerService,
): boolean[] {
  const expanded = new Array(count).fill(true);
  const saved = localStorage.getItem(`rc.arduino-editor.led-strings.${index}`);
  if (!saved) {
    return expanded;
  }
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      parsed.forEach((val, i) => {
        if (i < expanded.length) {
          expanded[i] = val;
        }
      });
    }
  } catch (e) {
    logger.error("Failed to parse saved led strings", e);
  }
  return expanded;
}

export function saveArduinoState(
  index: number,
  sections: ArduinoSectionsExpanded,
  ledStringsExpanded: boolean[],
  groupsCollapsed: { [key: string]: boolean },
): void {
  localStorage.setItem(
    `rc.arduino-editor.sections.${index}`,
    JSON.stringify(sections),
  );
  localStorage.setItem(
    `rc.arduino-editor.led-strings.${index}`,
    JSON.stringify(ledStringsExpanded),
  );
  localStorage.setItem(
    `rc.arduino-editor.groups-collapsed.${index}`,
    JSON.stringify(groupsCollapsed),
  );
}

export function saveArduinoVoltageLinked(index: number, linked: boolean): void {
  localStorage.setItem(
    `rc.arduino-editor.voltage-linked.${index}`,
    linked.toString(),
  );
}

export function saveArduinoLedStringsLinked(
  index: number,
  linked: boolean,
): void {
  localStorage.setItem(
    `rc.arduino-editor.led-strings-linked.${index}`,
    linked.toString(),
  );
}
