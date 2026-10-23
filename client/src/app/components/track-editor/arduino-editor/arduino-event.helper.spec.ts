import { ArduinoConfig } from "@app/models/track";
import { PinBehavior } from "@app/proto/antigravity";

import {
  checkCallButtonPins,
  processAnalogDataEvent,
  processDigitalPinEvent,
} from "./arduino-event.helper";

describe("arduino-event.helper", () => {
  describe("checkCallButtonPins", () => {
    it("checks digital and analog call button pins for Uno", () => {
      const config: ArduinoConfig = {
        hardwareType: 0,
        name: "Arduino",
        commPort: "COM1",
        baudRate: 115200,
        debounceUs: 1000,
        normallyClosedRelays: false,
        activeLowAnalogLeds: false,
        usePitsAsLaps: false,
        useLapsForSegments: false,
        lapPinPitBehavior: 0,
        analogIds: [],
        digitalIds: [],
        ledStrings: [],
        voltageConfigs: {},
        normallyClosedLaneSensors: false,
      };

      const triggered: number[] = [];
      const getPinBehavior = (isDigital: boolean, pin: number) => {
        if (isDigital && pin === 4) return PinBehavior.BEHAVIOR_CALL_BUTTON;
        if (!isDigital && pin === 2)
          return PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + 1;
        return PinBehavior.BEHAVIOR_UNUSED;
      };

      checkCallButtonPins(config, 1, getPinBehavior, (pinId) =>
        triggered.push(pinId),
      );

      expect(triggered).toEqual([4, 1002]);
    });

    it("checks digital up to 54 and analog up to 16 for Mega", () => {
      const config: ArduinoConfig = {
        hardwareType: 1,
        name: "Arduino",
        commPort: "COM1",
        baudRate: 115200,
        debounceUs: 1000,
        normallyClosedRelays: false,
        activeLowAnalogLeds: false,
        usePitsAsLaps: false,
        useLapsForSegments: false,
        lapPinPitBehavior: 0,
        analogIds: [],
        digitalIds: [],
        ledStrings: [],
        voltageConfigs: {},
        normallyClosedLaneSensors: false,
      };

      const triggered: number[] = [];
      const getPinBehavior = (isDigital: boolean, pin: number) => {
        if (isDigital && pin === 50) return PinBehavior.BEHAVIOR_CALL_BUTTON;
        if (!isDigital && pin === 15) return PinBehavior.BEHAVIOR_CALL_BUTTON;
        return PinBehavior.BEHAVIOR_UNUSED;
      };

      checkCallButtonPins(config, 0, getPinBehavior, (pinId) =>
        triggered.push(pinId),
      );

      expect(triggered).toEqual([50, 1015]);
    });
  });

  describe("processAnalogDataEvent", () => {
    it("updates live voltage and max voltage seen for lane", () => {
      const liveVoltages: { [key: number]: number | undefined } = {};
      const maxVoltagesSeen: { [key: number]: number | undefined } = { 0: 400 };

      processAnalogDataEvent(
        { pin: 3, value: 500 },
        liveVoltages,
        maxVoltagesSeen,
        (pin) => (pin === 3 ? 0 : -1),
      );

      expect(liveVoltages[3]).toBe(500);
      expect(maxVoltagesSeen[0]).toBe(500);
    });

    it("does not decrease max voltage seen", () => {
      const liveVoltages: { [key: number]: number | undefined } = {};
      const maxVoltagesSeen: { [key: number]: number | undefined } = { 0: 600 };

      processAnalogDataEvent(
        { pin: 3, value: 300 },
        liveVoltages,
        maxVoltagesSeen,
        (_pin) => 0,
      );

      expect(liveVoltages[3]).toBe(300);
      expect(maxVoltagesSeen[0]).toBe(600);
    });
  });

  describe("processDigitalPinEvent", () => {
    it("handles normally open sensor logic (trip on 0)", () => {
      const config: ArduinoConfig = {
        hardwareType: 0,
        name: "Arduino",
        commPort: "COM1",
        baudRate: 115200,
        debounceUs: 1000,
        normallyClosedRelays: false,
        activeLowAnalogLeds: false,
        usePitsAsLaps: false,
        useLapsForSegments: false,
        lapPinPitBehavior: 0,
        analogIds: [],
        digitalIds: [],
        ledStrings: [],
        voltageConfigs: {},
        normallyClosedLaneSensors: false,
      };
      const pinActivity: { [key: string]: boolean } = {};
      const timers: { [key: string]: any } = {};

      processDigitalPinEvent(
        { pin: 5, isDigital: true, state: 0 },
        config,
        pinActivity,
        timers,
      );
      expect(pinActivity["D5"]).toBe(true);

      processDigitalPinEvent(
        { pin: 5, isDigital: true, state: 1 },
        config,
        pinActivity,
        timers,
      );
      expect(pinActivity["D5"]).toBe(false);
    });

    it("handles normally closed sensor logic (trip on 1) and clears timer", () => {
      const config: ArduinoConfig = {
        hardwareType: 0,
        name: "Arduino",
        commPort: "COM1",
        baudRate: 115200,
        debounceUs: 1000,
        normallyClosedRelays: false,
        activeLowAnalogLeds: false,
        usePitsAsLaps: false,
        useLapsForSegments: false,
        lapPinPitBehavior: 0,
        analogIds: [],
        digitalIds: [],
        ledStrings: [],
        voltageConfigs: {},
        normallyClosedLaneSensors: true,
      };
      const pinActivity: { [key: string]: boolean } = {};
      const timerSpy = jasmine.createSpy("timerSpy");
      const timers: { [key: string]: any } = {
        A2: setTimeout(timerSpy, 10000),
      };

      processDigitalPinEvent(
        { pin: 2, isDigital: false, state: 1 },
        config,
        pinActivity,
        timers,
      );
      expect(pinActivity["A2"]).toBe(true);
      expect(timers["A2"]).toBeUndefined();
    });
  });
});
