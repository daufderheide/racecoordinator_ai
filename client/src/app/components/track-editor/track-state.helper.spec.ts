import { Lane } from "@app/models/lane";
import {
  ArduinoConfig,
  LedString,
  PhidgetConfig,
  Track,
} from "@app/models/track";

import { TrackStateHelper } from "./track-state.helper";

describe("TrackStateHelper", () => {
  const createMockTrack = (overrides?: Partial<Track>): Track => {
    return new Track({
      entity_id: "t1",
      name: "Test Track",
      num_track_sections: 100,
      track_scale: 1.0,
      lanes: [
        new Lane("l1", "#ffffff", "#000000", 50),
        new Lane("l2", "#ffffff", "#ff0000", 50),
      ],
      has_digital_fuel: false,
      arduino_configs: [
        {
          name: "Arduino 1",
          commPort: "COM3",
          digitalIds: [1, 2],
          analogIds: [3],
          voltageConfigs: { 0: 5 },
          ledStrings: [
            {
              pin: 4,
              numUsedLeds: 2,
              leds: [100, 101],
              ledLaneColorOverrides: ["#fff"],
            } as any,
          ],
        } as any,
      ],
      trackmate_configs: [
        {
          name: "TM 1",
          commPort: "COM4",
          numLanes: 2,
          lapPinBehaviors: [10, 11],
        } as any,
      ],
      phidget_configs: [
        {
          name: "Phidget 1",
          serialNumber: 12345,
          digitalInIds: [1],
          digitalOutIds: [2],
          analogIds: [3],
          voltageConfigs: { 0: 12 },
        } as any,
      ],
      bart_configs: [
        {
          name: "BART 1",
          deviceName: "BART_DEV",
          minLapMs: 500,
        } as any,
      ],
      ...overrides,
    });
  };

  describe("cloneTrack", () => {
    it("should create a deep clone of the track", () => {
      const original = createMockTrack();
      const cloned = TrackStateHelper.cloneTrack(original);

      expect(cloned.entity_id).toBe(original.entity_id);
      expect(cloned.lanes.length).toBe(original.lanes.length);
      expect(cloned.lanes[0]).not.toBe(original.lanes[0]);
      expect(cloned.arduino_configs?.length).toBe(
        original.arduino_configs?.length,
      );
      expect(cloned.arduino_configs![0]).not.toBe(original.arduino_configs![0]);
    });

    it("should handle track without interface configs", () => {
      const minimal = new Track({
        entity_id: "min",
        name: "Min",
        lanes: [],
      });
      const cloned = TrackStateHelper.cloneTrack(minimal);
      expect(cloned.arduino_configs).toEqual([]);
      expect(cloned.trackmate_configs).toEqual([]);
      expect(cloned.phidget_configs).toEqual([]);
      expect(cloned.bart_configs).toEqual([]);
    });
  });

  describe("createSnapshot", () => {
    it("should create fallback track when editingTrack is undefined", () => {
      const snapshot = TrackStateHelper.createSnapshot({
        editingTrack: undefined,
        trackName: "Ignored",
        numTrackSections: 50,
        trackScale: 0.5,
        lanes: [],
        arduinoConfigs: [],
        trackmateConfigs: [],
        phidgetConfigs: [],
        bartConfigs: [],
      });
      expect(snapshot.entity_id).toBe("new");
      expect(snapshot.name).toBe("");
      expect(snapshot.lanes).toEqual([]);
    });

    it("should create populated snapshot from options", () => {
      const editingTrack = createMockTrack();
      const snapshot = TrackStateHelper.createSnapshot({
        editingTrack,
        trackName: "Custom Name",
        numTrackSections: 120,
        trackScale: 0.03125,
        lanes: [new Lane("l1", "white", "black", 75)],
        arduinoConfigs: [{ name: "A1" } as any],
        trackmateConfigs: [{ name: "TM1" } as any],
        phidgetConfigs: [{ name: "P1" } as any],
        bartConfigs: [{ name: "B1" } as any],
      });

      expect(snapshot.name).toBe("Custom Name");
      expect(snapshot.num_track_sections).toBe(120);
      expect(snapshot.track_scale).toBe(0.03125);
      expect(snapshot.lanes.length).toBe(1);
      expect(snapshot.arduino_configs?.length).toBe(1);
    });
  });

  describe("areTracksEqual", () => {
    it("should return true for identical tracks", () => {
      const t1 = createMockTrack();
      const t2 = createMockTrack();
      expect(TrackStateHelper.areTracksEqual(t1, t2)).toBeTrue();
    });

    it("should detect primitive property differences", () => {
      const base = createMockTrack();
      expect(
        TrackStateHelper.areTracksEqual(
          base,
          createMockTrack({ name: "Diff Name" }),
        ),
      ).toBeFalse();
      expect(
        TrackStateHelper.areTracksEqual(
          base,
          createMockTrack({ num_track_sections: 200 }),
        ),
      ).toBeFalse();
      expect(
        TrackStateHelper.areTracksEqual(
          base,
          createMockTrack({ track_scale: 0.5 }),
        ),
      ).toBeFalse();
    });

    it("should detect lane differences", () => {
      const base = createMockTrack();
      expect(
        TrackStateHelper.areTracksEqual(
          base,
          createMockTrack({ lanes: [new Lane("l1", "w", "b", 50)] }),
        ),
      ).toBeFalse();

      expect(
        TrackStateHelper.areTracksEqual(
          base,
          createMockTrack({
            lanes: [
              new Lane("l1_diff", "#ffffff", "#000000", 50),
              new Lane("l2", "#ffffff", "#ff0000", 50),
            ],
          }),
        ),
      ).toBeFalse();
    });

    it("should detect arduino configs difference", () => {
      const base = createMockTrack();
      const diffArduino = createMockTrack({
        arduino_configs: [{ name: "Different" } as any],
      });
      expect(TrackStateHelper.areTracksEqual(base, diffArduino)).toBeFalse();
    });

    it("should detect trackmate configs difference", () => {
      const base = createMockTrack();
      const diffTM = createMockTrack({
        trackmate_configs: [{ name: "Different" } as any],
      });
      expect(TrackStateHelper.areTracksEqual(base, diffTM)).toBeFalse();
    });

    it("should detect phidget configs difference", () => {
      const base = createMockTrack();
      const diffPhidget = createMockTrack({
        phidget_configs: [{ name: "Different" } as any],
      });
      expect(TrackStateHelper.areTracksEqual(base, diffPhidget)).toBeFalse();
    });

    it("should detect bart configs difference", () => {
      const base = createMockTrack();
      const diffBart = createMockTrack({
        bart_configs: [{ name: "Different" } as any],
      });
      expect(TrackStateHelper.areTracksEqual(base, diffBart)).toBeFalse();
    });
  });

  describe("areArduinoConfigsEqual & isLedStringsEqual", () => {
    it("should return false for different length", () => {
      expect(
        TrackStateHelper.areArduinoConfigsEqual([], [{}] as any),
      ).toBeFalse();
    });

    it("should detect differences in voltageConfigs", () => {
      const ac1: ArduinoConfig[] = [{ voltageConfigs: { 0: 5 } } as any];
      const ac2: ArduinoConfig[] = [{ voltageConfigs: { 0: 10 } } as any];
      expect(TrackStateHelper.areArduinoConfigsEqual(ac1, ac2)).toBeFalse();
    });

    it("should detect differences in ledStrings", () => {
      const ls1: LedString = {
        pin: 2,
        numUsedLeds: 2,
        leds: [1, 2],
        ledLaneColorOverrides: ["red"],
      } as any;
      const ls2: LedString = {
        pin: 2,
        numUsedLeds: 2,
        leds: [1, 3],
        ledLaneColorOverrides: ["red"],
      } as any;
      expect(TrackStateHelper.isLedStringsEqual(ls1, ls2)).toBeFalse();
    });

    it("should handle null/undefined in isLedStringsEqual", () => {
      expect(
        TrackStateHelper.isLedStringsEqual(null as any, null as any),
      ).toBeTrue();
      expect(
        TrackStateHelper.isLedStringsEqual({} as any, null as any),
      ).toBeFalse();
    });
  });

  describe("arePhidgetConfigsEqual", () => {
    it("should detect differences in phidget arrays and voltageConfigs", () => {
      const pc1: PhidgetConfig[] = [
        { digitalInIds: [1, 2], voltageConfigs: { 0: 5 } } as any,
      ];
      const pc2: PhidgetConfig[] = [
        { digitalInIds: [1, 3], voltageConfigs: { 0: 5 } } as any,
      ];
      expect(TrackStateHelper.arePhidgetConfigsEqual(pc1, pc2)).toBeFalse();

      const pc3: PhidgetConfig[] = [
        { digitalInIds: [1, 2], voltageConfigs: { 0: 10 } } as any,
      ];
      expect(TrackStateHelper.arePhidgetConfigsEqual(pc1, pc3)).toBeFalse();
    });
  });

  describe("syncInterfaceConfigsFromTrack", () => {
    it("should sync configs from track when present", () => {
      const track = createMockTrack();
      const current = {
        arduinoConfigs: [],
        trackmateConfigs: [],
        phidgetConfigs: [],
        bartConfigs: [],
      };
      const synced = TrackStateHelper.syncInterfaceConfigsFromTrack(
        track,
        current,
      );

      expect(synced.arduinoConfigs.length).toBe(1);
      expect(synced.trackmateConfigs.length).toBe(1);
      expect(synced.phidgetConfigs.length).toBe(1);
      expect(synced.bartConfigs.length).toBe(1);
    });

    it("should clear current configs when track has none", () => {
      const track = new Track({ entity_id: "t", name: "T", lanes: [] });
      const current = {
        arduinoConfigs: [{ name: "A" } as any],
        trackmateConfigs: [{ name: "TM" } as any],
        phidgetConfigs: [{ name: "P" } as any],
        bartConfigs: [{ name: "B" } as any],
      };
      const synced = TrackStateHelper.syncInterfaceConfigsFromTrack(
        track,
        current,
      );

      expect(synced.arduinoConfigs).toEqual([]);
      expect(synced.trackmateConfigs).toEqual([]);
      expect(synced.phidgetConfigs).toEqual([]);
      expect(synced.bartConfigs).toEqual([]);
    });
  });

  describe("ensureInterfaceConfigsValid", () => {
    it("should initialize default pin arrays and structures if missing", () => {
      const configs: ArduinoConfig[] = [
        {
          name: "A1",
        } as any,
      ];
      TrackStateHelper.ensureInterfaceConfigsValid(configs);

      expect(configs[0].digitalIds).toBeDefined();
      expect(configs[0].analogIds).toBeDefined();
      expect(configs[0].ledStrings).toEqual([]);
      expect(configs[0].voltageConfigs).toEqual({});
    });
  });
});
