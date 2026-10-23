import { Lane } from "@app/models/lane";
import {
  ArduinoConfig,
  BartConfig,
  LedString,
  MAX_ANALOG_PINS,
  MAX_DIGITAL_PINS,
  PhidgetConfig,
  Track,
  TrackmateConfig,
} from "@app/models/track";
import { deepCopy } from "@app/utils/clone.utils";

export interface TrackSnapshotOptions {
  editingTrack?: Track;
  trackName: string;
  numTrackSections: number;
  trackScale: number;
  lanes: Lane[];
  arduinoConfigs: ArduinoConfig[];
  trackmateConfigs: TrackmateConfig[];
  phidgetConfigs: PhidgetConfig[];
  bartConfigs: BartConfig[];
}

export interface InterfaceConfigSet {
  arduinoConfigs: ArduinoConfig[];
  trackmateConfigs: TrackmateConfig[];
  phidgetConfigs: PhidgetConfig[];
  bartConfigs: BartConfig[];
}

export class TrackStateHelper {
  static cloneTrack(track: Track): Track {
    const lanesCopy = track.lanes.map(
      (l) =>
        new Lane(l.entity_id, l.foreground_color, l.background_color, l.length),
    );
    const arduinoCopy = track.arduino_configs
      ? JSON.parse(JSON.stringify(track.arduino_configs))
      : [];
    const trackmateCopy = track.trackmate_configs
      ? JSON.parse(JSON.stringify(track.trackmate_configs))
      : [];
    const phidgetCopy = track.phidget_configs
      ? JSON.parse(JSON.stringify(track.phidget_configs))
      : [];
    const bartCopy = track.bart_configs
      ? JSON.parse(JSON.stringify(track.bart_configs))
      : [];
    return new Track({
      entity_id: track.entity_id,
      name: track.name,
      num_track_sections: track.num_track_sections,
      track_scale: track.track_scale ?? 1.0,
      lanes: lanesCopy,
      has_digital_fuel: track.has_digital_fuel,
      arduino_configs: arduinoCopy,
      has_per_lane_relays: track.has_per_lane_relays,
      has_main_relay: track.has_main_relay,
      trackmate_configs: trackmateCopy,
      phidget_configs: phidgetCopy,
      bart_configs: bartCopy,
    });
  }

  static createSnapshot(options: TrackSnapshotOptions): Track {
    if (!options.editingTrack) {
      return new Track({
        entity_id: "new",
        name: "",
        num_track_sections: 100,
        track_scale: 1.0,
        lanes: [],
        has_digital_fuel: false,
      });
    }
    const configs = options.arduinoConfigs
      ? deepCopy(options.arduinoConfigs)
      : [];
    const tmConfigs = options.trackmateConfigs
      ? deepCopy(options.trackmateConfigs)
      : [];
    const phConfigs = options.phidgetConfigs
      ? deepCopy(options.phidgetConfigs)
      : [];
    const bConfigs = options.bartConfigs ? deepCopy(options.bartConfigs) : [];
    return new Track({
      entity_id: options.editingTrack.entity_id,
      name: options.trackName,
      num_track_sections: options.numTrackSections,
      track_scale: options.trackScale,
      lanes: options.lanes.map(
        (l) =>
          new Lane(
            l.entity_id,
            l.foreground_color,
            l.background_color,
            l.length,
          ),
      ),
      has_digital_fuel: options.editingTrack.has_digital_fuel,
      arduino_configs: configs,
      has_per_lane_relays: options.editingTrack.has_per_lane_relays,
      has_main_relay: options.editingTrack.has_main_relay,
      trackmate_configs: tmConfigs,
      phidget_configs: phConfigs,
      bart_configs: bConfigs,
    });
  }

  static areTracksEqual(t1: Track, t2: Track): boolean {
    if (
      t1.name !== t2.name ||
      t1.num_track_sections !== t2.num_track_sections ||
      (t1.track_scale ?? 1.0) !== (t2.track_scale ?? 1.0)
    ) {
      return false;
    }
    if (t1.lanes.length !== t2.lanes.length) {
      return false;
    }
    for (let i = 0; i < t1.lanes.length; i++) {
      const l1 = t1.lanes[i];
      const l2 = t2.lanes[i];
      if (
        l1.entity_id !== l2.entity_id ||
        l1.background_color !== l2.background_color ||
        l1.foreground_color !== l2.foreground_color ||
        l1.length !== l2.length
      ) {
        return false;
      }
    }

    if (
      !TrackStateHelper.areArduinoConfigsEqual(
        t1.arduino_configs || [],
        t2.arduino_configs || [],
      )
    ) {
      return false;
    }

    if (
      !TrackStateHelper.areTrackmateConfigsEqual(
        t1.trackmate_configs || [],
        t2.trackmate_configs || [],
      )
    ) {
      return false;
    }

    if (
      JSON.stringify(t1.bart_configs || []) !==
      JSON.stringify(t2.bart_configs || [])
    ) {
      return false;
    }

    if (
      !TrackStateHelper.arePhidgetConfigsEqual(
        t1.phidget_configs || [],
        t2.phidget_configs || [],
      )
    ) {
      return false;
    }

    return true;
  }

  static areArduinoConfigsEqual(
    acs1: ArduinoConfig[],
    acs2: ArduinoConfig[],
  ): boolean {
    if (acs1.length !== acs2.length) {
      return false;
    }

    for (let c = 0; c < acs1.length; c++) {
      const ac1 = acs1[c];
      const ac2 = acs2[c];

      const keys = Object.keys(ac1) as (keyof ArduinoConfig)[];
      for (const key of keys) {
        const v1 = ac1[key];
        const v2 = (ac2 as any)[key];

        if (Array.isArray(v1)) {
          const v2Arr = Array.isArray(v2) ? v2 : [];
          if (v1.length !== v2Arr.length) {
            return false;
          }
          for (let i = 0; i < v1.length; i++) {
            if (key === "ledStrings") {
              const ls1 = v1 as unknown as LedString[];
              const ls2 = v2Arr as unknown as LedString[];
              if (!TrackStateHelper.isLedStringsEqual(ls1[i], ls2[i])) {
                return false;
              }
            } else if (v1[i] !== v2Arr[i]) {
              return false;
            }
          }
        } else if (key === "voltageConfigs") {
          const vc1 = (v1 || {}) as { [lane: number]: number };
          const vc2 = (v2 || {}) as { [lane: number]: number };
          const entries1 = Object.entries(vc1);
          const entries2 = Object.entries(vc2);
          if (entries1.length !== entries2.length) {
            return false;
          }
          for (const [lane, val] of entries1) {
            if (vc2[lane as any] !== val) {
              return false;
            }
          }
        } else if (v1 !== v2) {
          return false;
        }
      }
    }

    return true;
  }

  static areTrackmateConfigsEqual(
    tcs1: TrackmateConfig[],
    tcs2: TrackmateConfig[],
  ): boolean {
    if (tcs1.length !== tcs2.length) {
      return false;
    }

    for (let c = 0; c < tcs1.length; c++) {
      const tc1 = tcs1[c];
      const tc2 = tcs2[c];

      const keys = Object.keys(tc1) as (keyof TrackmateConfig)[];
      for (const key of keys) {
        const v1 = tc1[key];
        const v2 = (tc2 as any)[key];

        if (Array.isArray(v1)) {
          const v2Arr = Array.isArray(v2) ? v2 : [];
          if (v1.length !== v2Arr.length) return false;
          for (let i = 0; i < v1.length; i++) {
            if (v1[i] !== v2Arr[i]) return false;
          }
        } else if (v1 !== v2) {
          return false;
        }
      }
    }

    return true;
  }

  static arePhidgetConfigsEqual(
    pcs1: PhidgetConfig[],
    pcs2: PhidgetConfig[],
  ): boolean {
    if (pcs1.length !== pcs2.length) return false;

    for (let c = 0; c < pcs1.length; c++) {
      const pc1 = pcs1[c];
      const pc2 = pcs2[c];

      const keys = Object.keys(pc1) as (keyof PhidgetConfig)[];
      for (const key of keys) {
        const v1 = pc1[key];
        const v2 = (pc2 as any)[key];

        if (Array.isArray(v1)) {
          const v2Arr = Array.isArray(v2) ? v2 : [];
          if (v1.length !== v2Arr.length) return false;
          for (let i = 0; i < v1.length; i++) {
            if (v1[i] !== v2Arr[i]) return false;
          }
        } else if (key === "voltageConfigs") {
          const vc1 = (v1 || {}) as { [lane: number]: number };
          const vc2 = (v2 || {}) as { [lane: number]: number };
          const entries1 = Object.entries(vc1);
          const entries2 = Object.entries(vc2);
          if (entries1.length !== entries2.length) return false;
          for (const [lane, val] of entries1) {
            if (vc2[lane as any] !== val) return false;
          }
        } else if (v1 !== v2) {
          return false;
        }
      }
    }

    return true;
  }

  static isLedStringsEqual(s1: LedString, s2: LedString): boolean {
    if (!s1 || !s2) return s1 === s2;
    if (
      s1.pin !== s2.pin ||
      s1.numUsedLeds !== s2.numUsedLeds ||
      s1.addressableLeds !== s2.addressableLeds ||
      s1.brightness !== s2.brightness ||
      s1.colorOrder !== s2.colorOrder ||
      s1.flagFlashRate !== s2.flagFlashRate
    ) {
      return false;
    }

    if (s1.leds?.length !== s2.leds?.length) return false;
    if (s1.leds) {
      for (let i = 0; i < s1.leds.length; i++) {
        if (s1.leds[i] !== s2.leds[i]) return false;
      }
    }

    if (s1.ledLaneColorOverrides?.length !== s2.ledLaneColorOverrides?.length)
      return false;
    if (s1.ledLaneColorOverrides) {
      for (let i = 0; i < s1.ledLaneColorOverrides.length; i++) {
        if (s1.ledLaneColorOverrides[i] !== s2.ledLaneColorOverrides[i])
          return false;
      }
    }

    return true;
  }

  static syncInterfaceConfigsFromTrack(
    track: Track,
    current: InterfaceConfigSet,
  ): InterfaceConfigSet {
    let { arduinoConfigs, trackmateConfigs, phidgetConfigs, bartConfigs } =
      current;

    if (track.arduino_configs && track.arduino_configs.length > 0) {
      const newConfigsJson = JSON.stringify(track.arduino_configs);
      if (newConfigsJson !== JSON.stringify(arduinoConfigs)) {
        arduinoConfigs = JSON.parse(newConfigsJson);
      }
    } else if (arduinoConfigs.length > 0) {
      arduinoConfigs = [];
    }

    if (track.trackmate_configs && track.trackmate_configs.length > 0) {
      const newTmConfigsJson = JSON.stringify(track.trackmate_configs);
      if (newTmConfigsJson !== JSON.stringify(trackmateConfigs)) {
        trackmateConfigs = JSON.parse(newTmConfigsJson);
      }
    } else if (trackmateConfigs.length > 0) {
      trackmateConfigs = [];
    }

    if (track.phidget_configs && track.phidget_configs.length > 0) {
      const newPhConfigsJson = JSON.stringify(track.phidget_configs);
      if (newPhConfigsJson !== JSON.stringify(phidgetConfigs)) {
        phidgetConfigs = JSON.parse(newPhConfigsJson);
      }
    } else if (phidgetConfigs.length > 0) {
      phidgetConfigs = [];
    }

    if (track.bart_configs && track.bart_configs.length > 0) {
      const newBartConfigsJson = JSON.stringify(track.bart_configs);
      if (newBartConfigsJson !== JSON.stringify(bartConfigs)) {
        bartConfigs = JSON.parse(newBartConfigsJson);
      }
    } else if (bartConfigs.length > 0) {
      bartConfigs = [];
    }

    return { arduinoConfigs, trackmateConfigs, phidgetConfigs, bartConfigs };
  }

  static ensureInterfaceConfigsValid(arduinoConfigs: ArduinoConfig[]): void {
    for (const config of arduinoConfigs) {
      if (!config.digitalIds) {
        config.digitalIds = new Array(MAX_DIGITAL_PINS).fill(-1);
      }
      if (!config.analogIds) {
        config.analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
      }
      if (!config.ledStrings) config.ledStrings = [];
      if (!config.voltageConfigs) config.voltageConfigs = {};

      for (const ls of config.ledStrings) {
        if (!ls.leds) ls.leds = [];
        if (!ls.ledLaneColorOverrides) ls.ledLaneColorOverrides = [];
      }
    }
  }
}
