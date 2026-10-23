import { ChangeDetectorRef } from "@angular/core";
import { EditorTab } from "@app/components/shared/editor-tabs/editor-tabs.component";
import { DataService } from "@app/data.service";
import {
  ArduinoConfig,
  BartConfig,
  PhidgetConfig,
  TrackmateConfig,
} from "@app/models/track";
import { PinBehavior } from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";

import { TrackEditorHelpEditors } from "./track-editor-help.helper";

export interface InitializeInterfacesOptions {
  arduinoConfigs: ArduinoConfig[];
  trackmateConfigs: TrackmateConfig[];
  phidgetConfigs: PhidgetConfig[];
  bartConfigs: BartConfig[];
  numLanes: number;
}

export class TrackInterfaceConfigsHelper {
  static createDefaultArduinoConfig(count: number): ArduinoConfig {
    return {
      name: `Arduino ${count + 1}`,
      commPort: "",
      baudRate: 115200,
      debounceUs: 3,
      hardwareType: 0,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: true,
      activeLowAnalogLeds: false,
      usePitsAsLaps: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 3,
      digitalIds: [],
      analogIds: [],
      ledStrings: [],
    };
  }

  static addArduinoConfig(configs: ArduinoConfig[]): ArduinoConfig[] {
    return [
      ...configs,
      TrackInterfaceConfigsHelper.createDefaultArduinoConfig(configs.length),
    ];
  }

  static removeArduinoConfig(
    configs: ArduinoConfig[],
    index: number,
  ): ArduinoConfig[] {
    const copy = [...configs];
    copy.splice(index, 1);
    return copy;
  }

  static createDefaultTrackmateConfig(
    count: number,
    numLanes: number,
  ): TrackmateConfig {
    return {
      name: `Trackmate ${count + 1}`,
      commPort: "",
      normallyClosedRelays: true,
      normallyClosedLaneSensors: true,
      useIR: true,
      debounce: 1,
      numLanes,
      hasPerLaneRelays: false,
      lapPinPitBehavior: 3,
      lapPinBehaviors: Array(numLanes)
        .fill(0)
        .map((_, i) => PinBehavior.BEHAVIOR_LAP_BASE + i),
    };
  }

  static addTrackmateConfig(
    configs: TrackmateConfig[],
    numLanes: number,
  ): TrackmateConfig[] {
    return [
      ...configs,
      TrackInterfaceConfigsHelper.createDefaultTrackmateConfig(
        configs.length,
        numLanes,
      ),
    ];
  }

  static removeTrackmateConfig(
    configs: TrackmateConfig[],
    index: number,
  ): TrackmateConfig[] {
    const copy = [...configs];
    copy.splice(index, 1);
    return copy;
  }

  static createDefaultBartConfig(count: number, numLanes: number): BartConfig {
    return {
      name: `BART ${count + 1}`,
      deviceName: "",
      deviceAddress: "",
      numLanes,
      minLapMs: 1,
      lapPinPitBehavior: 3,
      lapPinBehaviors: Array(numLanes)
        .fill(0)
        .map((_, i) => PinBehavior.BEHAVIOR_LAP_BASE + i),
    };
  }

  static addBartConfig(configs: BartConfig[], numLanes: number): BartConfig[] {
    return [
      ...configs,
      TrackInterfaceConfigsHelper.createDefaultBartConfig(
        configs.length,
        numLanes,
      ),
    ];
  }

  static removeBartConfig(configs: BartConfig[], index: number): BartConfig[] {
    const copy = [...configs];
    copy.splice(index, 1);
    return copy;
  }

  static createDefaultPhidgetConfig(count: number): PhidgetConfig {
    return {
      name: `Phidget ${count + 1}`,
      serialNumber: -1,
      isHubPort: false,
      hubPort: 0,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: true,
      activeLowAnalogLeds: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 3,
      digitalInIds: Array(32).fill(0),
      digitalOutIds: Array(32).fill(0),
      analogIds: Array(16).fill(0),
    };
  }

  static addPhidgetConfig(configs: PhidgetConfig[]): PhidgetConfig[] {
    return [
      ...configs,
      TrackInterfaceConfigsHelper.createDefaultPhidgetConfig(configs.length),
    ];
  }

  static removePhidgetConfig(
    configs: PhidgetConfig[],
    index: number,
  ): PhidgetConfig[] {
    const copy = [...configs];
    copy.splice(index, 1);
    return copy;
  }

  static buildInterfaceTabs(
    arduinoConfigs: ArduinoConfig[] | undefined,
    trackmateConfigs: TrackmateConfig[] | undefined,
    phidgetConfigs: PhidgetConfig[] | undefined,
    bartConfigs: BartConfig[] | undefined,
  ): EditorTab[] {
    const tabs: EditorTab[] = [];

    arduinoConfigs?.forEach((_, i) => {
      tabs.push({ id: `interface-arduino-${i}`, label: `Arduino ${i + 1}` });
    });

    trackmateConfigs?.forEach((_, i) => {
      tabs.push({ id: `interface-trackmate-${i}`, label: `Trakmate ${i + 1}` });
    });

    phidgetConfigs?.forEach((_, i) => {
      tabs.push({ id: `interface-phidget-${i}`, label: `Phidget ${i + 1}` });
    });

    bartConfigs?.forEach((_, i) => {
      tabs.push({ id: `interface-bart-${i}`, label: `BART ${i + 1}` });
    });

    return tabs;
  }

  static scrollToAndExpandInterface(
    tabId: string,
    editors: TrackEditorHelpEditors,
    cdr?: ChangeDetectorRef,
  ): void {
    const match = tabId.match(
      /interface-(arduino|trackmate|phidget|bart)-(\d+)/,
    );
    if (!match) return;

    const type = match[1];
    const index = parseInt(match[2], 10);

    switch (type) {
      case "arduino":
        editors.arduinoEditors?.get(index)?.ensureSectionsExpanded();
        break;
      case "trackmate":
        editors.trakmateEditors?.get(index)?.ensureSectionsExpanded();
        break;
      case "phidget":
        editors.phidgetEditors?.get(index)?.ensureSectionsExpanded();
        break;
      case "bart":
        editors.bartEditors?.get(index)?.ensureSectionsExpanded();
        break;
    }

    if (cdr) {
      cdr.detectChanges();
    }

    setTimeout(() => {
      const element = document.getElementById(tabId);
      const container = document.querySelector(".preview-panel");
      if (element && container) {
        const topPos =
          element.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;

        container.scrollTo({
          top: topPos - 24,
          behavior: "smooth",
        });
      } else if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  static initializeInterfaces(
    dataService: DataService,
    logger: LoggerService,
    options: InitializeInterfacesOptions,
  ): void {
    if (
      options.arduinoConfigs.length > 0 ||
      options.trackmateConfigs.length > 0 ||
      options.phidgetConfigs.length > 0 ||
      options.bartConfigs.length > 0
    ) {
      dataService
        .initializeInterface(
          options.arduinoConfigs,
          options.trackmateConfigs,
          options.phidgetConfigs,
          options.numLanes,
          options.bartConfigs,
        )
        .subscribe({
          next: (response) => {
            if (!response.success) {
              logger.warn(
                `Failed to initialize interfaces: ${response.message}`,
              );
            } else {
              logger.info("Interfaces initialized successfully");
            }
          },
          error: (err) => {
            logger.error("Error calling initializeInterface", err);
          },
        });
    } else {
      dataService.closeInterface().subscribe({
        next: () => logger.debug("Interface closed successfully"),
        error: (err) => logger.error("Error closing interface", err),
      });
    }
  }
}
