import { Model } from "./model";
import { Lane } from "./lane";

export const MAX_DIGITAL_PINS = 60;
export const MAX_ANALOG_PINS = 16;

/**
 * A track defines what the driver are racing on.  It has virtual things like a name
 * and logo which are primarly just used for displaying oon the race day screen.  It
 * also has the lane configuration which limits the number of drivers that can race
 * at the same time and it includes the hardware connected to the track that handles
 * everything from lap counting, to lane power and visual effects like led lights.
 */
export class Track implements Model {
  readonly entity_id: string;
  readonly name: string;
  readonly lanes: Lane[];
  readonly has_digital_fuel: boolean;
  readonly arduino_configs: ArduinoConfig[];

  constructor(entity_id: string, name: string, lanes: Lane[], has_digital_fuel: boolean = false, arduino_configs?: ArduinoConfig[]) {
    this.entity_id = entity_id;
    this.name = name;
    this.lanes = lanes;
    this.has_digital_fuel = has_digital_fuel;
    this.arduino_configs = arduino_configs || [];
  }

  get objectId(): string {
    return this.entity_id;
  }

  hasDigitalFuel(): boolean {
    if (this.has_digital_fuel) {
      return true;
    }
    if (!this.arduino_configs || this.arduino_configs.length === 0) {
      return false;
    }
    // For now, if any config has digital fuel, track has digital fuel.
    for (const config of this.arduino_configs) {
      if (config.voltageConfigs != null && Object.keys(config.voltageConfigs).length > 0) {
        return true;
      }
    }
    return false;
  }

  hasAnalogFuel(): boolean {
    return !this.hasDigitalFuel();
  }
}

export interface ArduinoConfig {
  name: string;
  commPort: string;
  baudRate: number;
  debounceUs: number;
  hardwareType: number;

  globalInvertLanes: boolean;
  normallyClosedRelays: boolean;
  globalInvertLights: number;

  useLapsForPits: number;
  useLapsForPitEnd: number;
  usePitsAsLaps: boolean;
  useLapsForSegments: boolean;

  // Arrays of mapped behaviors (codes)
  digitalIds: number[];
  analogIds: number[];

  ledStrings: any[] | null;
  ledLaneColorOverrides: any[] | null;
  voltageConfigs?: { [lane: number]: number };
}