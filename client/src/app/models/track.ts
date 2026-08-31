import { BartConfig } from "./bart_config";
import { Lane } from "./lane";
import { Model } from "./model";

export { BartConfig } from "./bart_config";

export const MAX_DIGITAL_PINS = 60;
export const MAX_ANALOG_PINS = 16;

/**
 * A track defines what the driver are racing on.  It has virtual things like a name
 * and logo which are primarly just used for displaying oon the race day screen.  It
 * also has the lane configuration which limits the number of drivers that can race
 * at the same time and it includes the hardware connected to the track that handles
 * everything from lap counting, to lane power and visual effects like led lights.
 */
export interface TrackParams {
  entity_id: string;
  name: string;
  num_track_sections?: number;
  track_scale?: number;
  lanes: Lane[];
  has_digital_fuel?: boolean;
  has_per_lane_relays?: boolean;
  has_main_relay?: boolean;
  arduino_configs?: ArduinoConfig[];
  phidget_configs?: PhidgetConfig[];
  trackmate_configs?: TrackmateConfig[];
  bart_configs?: BartConfig[];
}

export class Track implements Model {
  readonly entity_id!: string;
  readonly name!: string;
  readonly num_track_sections!: number;
  readonly track_scale!: number;
  readonly lanes!: Lane[];
  readonly has_digital_fuel!: boolean;
  readonly has_per_lane_relays!: boolean;
  readonly has_main_relay!: boolean;
  readonly arduino_configs!: ArduinoConfig[];
  readonly phidget_configs!: PhidgetConfig[];
  readonly trackmate_configs!: TrackmateConfig[];
  readonly bart_configs!: BartConfig[];

  constructor(params: TrackParams) {
    Object.assign(this, params);

    // Apply defaults for optional parameters that weren't provided
    this.num_track_sections ??= 100;
    this.track_scale =
      this.track_scale != null &&
      this.track_scale > 0 &&
      this.track_scale <= 1.0
        ? this.track_scale
        : 1.0;
    this.has_digital_fuel ??= false;
    this.has_per_lane_relays ??= false;
    this.has_main_relay ??= false;
    this.arduino_configs ??= [];
    this.phidget_configs ??= [];
    this.trackmate_configs ??= [];
    this.bart_configs ??= [];
  }

  get objectId(): string {
    return this.entity_id;
  }

  hasDigitalFuel(): boolean {
    if (this.has_digital_fuel) {
      return true;
    }
    // Check Arduino configs
    if (this.arduino_configs) {
      for (const config of this.arduino_configs) {
        if (
          config.voltageConfigs != null &&
          Object.keys(config.voltageConfigs).length > 0
        ) {
          return true;
        }
      }
    }
    // Check Phidget configs
    if (this.phidget_configs) {
      for (const config of this.phidget_configs) {
        if (
          config.voltageConfigs != null &&
          Object.keys(config.voltageConfigs).length > 0
        ) {
          return true;
        }
      }
    }
    return false;
  }

  hasAnalogFuel(): boolean {
    return !this.hasDigitalFuel();
  }
}

export interface LedString {
  pin: number;
  leds: number[];
  numUsedLeds: number;
  addressableLeds: number;
  brightness: number;
  ledType: number;
  colorOrder: number;
  flagFlashRate: number;
  ledLaneColorOverrides: string[];
}

export interface TrackmateConfig {
  name: string;
  commPort: string;
  normallyClosedRelays: boolean;
  normallyClosedLaneSensors: boolean;
  useIR: boolean; // deprecated, use normallyClosedLaneSensors
  debounce: number;
  numLanes: number;
  hasPerLaneRelays: boolean;
  lapPinPitBehavior: number;
  lapPinBehaviors: number[];
}

export interface ArduinoConfig {
  name: string;
  commPort: string;
  baudRate: number;
  debounceUs: number;
  hardwareType: number;

  normallyClosedLaneSensors: boolean;
  normallyClosedRelays: boolean;
  globalInvertLights: number;

  usePitsAsLaps: boolean;
  useLapsForSegments: boolean;
  lapPinPitBehavior: number;

  // Arrays of mapped behaviors (codes)
  digitalIds: number[];
  analogIds: number[];

  ledStrings: LedString[];
  voltageConfigs?: { [lane: number]: number };
}

export interface PhidgetConfig {
  name: string;
  serialNumber: number;
  isHubPort: boolean;
  hubPort: number;

  normallyClosedLaneSensors: boolean;
  normallyClosedRelays: boolean;

  useLapsForSegments: boolean;
  lapPinPitBehavior: number;

  digitalInIds: number[];
  digitalOutIds: number[];
  analogIds: number[];

  voltageConfigs?: { [lane: number]: number };
}
