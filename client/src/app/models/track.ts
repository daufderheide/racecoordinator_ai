import { Model } from "./model";
import { Lane } from "./lane";

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
    readonly arduino_config?: ArduinoConfig;

    constructor(entity_id: string, name: string, lanes: Lane[], arduino_config?: ArduinoConfig) {
        this.entity_id = entity_id;
        this.name = name;
        this.lanes = lanes;
        this.arduino_config = arduino_config;
    }

    get objectId(): string {
        return this.entity_id;
    }
}

export interface ArduinoConfig {
    name: string;
    commPort: string;
    baudRate: number;
    debounceUs: number;
    hardwareType: number;

    globalInvertLanes: number;
    globalInvertRelays: number;
    globalInvertLights: number;

    useLapsForPits: number;
    useLapsForPitEnd: number;
    usePitsAsLaps: number;
    useLapsForSegments: number;

    // Arrays of mapped behaviors (codes)
    digitalIds: number[];
    analogIds: number[];

    ledStrings: any[] | null;
    ledLaneColorOverrides: any[] | null;
}