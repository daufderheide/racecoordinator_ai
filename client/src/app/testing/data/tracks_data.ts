import { Lane } from "../../models/lane";
import { Track } from "../../models/track";

export const MOCK_TRACKS = [
  {
    entity_id: "t1",
    name: "Classic Circuit",
    has_per_lane_relays: true,
    lanes: [
      {
        entity_id: "l1",
        length: 12.5,
        background_color: "#ff0000",
        foreground_color: "#ffffff",
      },
      {
        entity_id: "l2",
        length: 12.5,
        background_color: "#0000ff",
        foreground_color: "#ffffff",
      },
    ],
    arduino_configs: [
      {
        name: "Arduino 1",
        commPort: "COM3",
        baudRate: 115200,
        debounceUs: 5000,
        hardwareType: 1, // Mega
        digitalIds: new Array(60).fill(0),
        analogIds: new Array(16).fill(0),
        normallyClosedLaneSensors: false,
        normallyClosedRelays: true,
        globalInvertLights: 0,
        usePitsAsLaps: false,
        useLapsForSegments: true,
        ledStrings: null,
        ledLaneColorOverrides: null,
        lapPinPitBehavior: 3,
      },
    ],
  },
  {
    entity_id: "t2",
    name: "Speedway",
    lanes: [
      {
        entity_id: "l1",
        length: 15.0,
        background_color: "#ffff00",
        foreground_color: "#000000",
      },
      {
        entity_id: "l2",
        length: 15.0,
        background_color: "#00ff00",
        foreground_color: "#000000",
      },
      {
        entity_id: "l3",
        length: 15.0,
        background_color: "#ff00ff",
        foreground_color: "#ffffff",
      },
      {
        entity_id: "l4",
        length: 15.0,
        background_color: "#00ffff",
        foreground_color: "#000000",
      },
    ],
    arduino_configs: [
      {
        name: "Arduino 2",
        commPort: "COM4",
        baudRate: 115200,
        debounceUs: 5000,
        hardwareType: 0, // Uno
        digitalIds: new Array(60).fill(0),
        analogIds: new Array(16).fill(0),
        normallyClosedLaneSensors: false,
        normallyClosedRelays: true,
        globalInvertLights: 0,
        usePitsAsLaps: false,
        useLapsForSegments: true,
        ledStrings: null,
        ledLaneColorOverrides: null,
        lapPinPitBehavior: 3,
      },
    ],
  },
  {
    entity_id: "t3",
    name: "Trakmate Track",
    lanes: [
      {
        entity_id: "l1",
        length: 12.5,
        background_color: "#ff0000",
        foreground_color: "#ffffff",
      },
      {
        entity_id: "l2",
        length: 12.5,
        background_color: "#0000ff",
        foreground_color: "#ffffff",
      },
    ],
    arduino_configs: [],
    trackmate_configs: [
      {
        name: "Trakmate 1",
        commPort: "COM2",
        normallyClosedRelays: false,
        normallyClosedLaneSensors: false,
        useIR: false,
        debounce: 2000,
        numLanes: 2,
        hasPerLaneRelays: true,
        lapPinPitBehavior: 0,
        lapPinBehaviors: [],
      },
    ],
  },
];

export const MOCK_TRACK_INSTANCES = MOCK_TRACKS.map(
  (t: any) =>
    new Track({
      entity_id: t.entity_id,
      name: t.name,
      num_track_sections: t.num_track_sections || 100,
      lanes: t.lanes.map(
        (l: any) =>
          new Lane(
            l.entity_id,
            l.foreground_color,
            l.background_color,
            l.length,
          ),
      ),
      has_digital_fuel: t.has_digital_fuel || false,
      arduino_configs: t.arduino_configs,
      has_per_lane_relays: t.has_per_lane_relays || false,
      has_main_relay: t.has_main_relay || false,
      trackmate_configs: t.trackmate_configs,
      phidget_configs: t.phidget_configs,
    }),
);

export const MOCK_FACTORY_SETTINGS = {
  lanes: [
    { background_color: "#ef4444", foreground_color: "black", length: 10 },
    { background_color: "#ffffff", foreground_color: "black", length: 10 },
    { background_color: "#3b82f6", foreground_color: "black", length: 10 },
    { background_color: "#fbbf24", foreground_color: "black", length: 10 },
  ],
  arduino_configs: [
    {
      name: "Arduino 1",
      commPort: "",
      baudRate: 115200,
      debounceUs: 5000,
      hardwareType: 0,
      digitalIds: new Array(60).fill(0),
      analogIds: new Array(16).fill(0),
      normallyClosedLaneSensors: false,
      normallyClosedRelays: true,
      globalInvertLights: 0,
      usePitsAsLaps: false,
      useLapsForSegments: true,
      ledStrings: null,
      ledLaneColorOverrides: null,
      lapPinPitBehavior: 3,
      voltageConfigs: {},
    },
  ],
};
