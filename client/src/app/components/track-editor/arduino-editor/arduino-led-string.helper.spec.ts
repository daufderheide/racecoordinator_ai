import { Lane } from "@app/models/lane";
import { ArduinoConfig, LedString } from "@app/models/track";
import { PinBehavior, RgbLedBehavior } from "@app/proto/antigravity";

import {
  createLedString,
  removeLedStringByIndex,
  removeLedStringByPin,
  resizeLedString,
  updateDerivedLedFields,
  updateLedBehaviorState,
  updateLedStringBrightness,
  updateLedStringColorOrder,
  updateLedStringCount,
  updateLedStringFlashRate,
  updateLedStringLaneColor,
  updateLedStringLedType,
} from "./arduino-led-string.helper";

describe("arduino-led-string.helper", () => {
  const lanes: Lane[] = [
    { entity_id: "1", length: 10, background_color: "#ff0000" } as Lane,
    { entity_id: "2", length: 10, background_color: "#0000ff" } as Lane,
  ];

  it("createLedString initializes defaults and color overrides from lanes", () => {
    const ls = createLedString(5, 6, lanes);
    expect(ls.pin).toBe(6);
    expect(ls.leds.length).toBe(5);
    expect(
      ls.leds.every((b) => b === RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED),
    ).toBeTrue();
    expect(ls.addressableLeds).toBe(5);
    expect(ls.numUsedLeds).toBe(0);
    expect(ls.brightness).toBe(32);
    expect(ls.ledLaneColorOverrides).toEqual(["#ff0000", "#0000ff"]);
  });

  it("updateDerivedLedFields counts non-unused LEDs", () => {
    const ls: LedString = {
      pin: 2,
      leds: [
        RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED,
        RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER,
        RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS,
      ],
      numUsedLeds: 0,
      addressableLeds: 0,
      brightness: 32,
      ledType: 1,
      colorOrder: 0,
      flagFlashRate: 2,
      ledLaneColorOverrides: [],
    };
    updateDerivedLedFields(ls);
    expect(ls.numUsedLeds).toBe(2);
    expect(ls.addressableLeds).toBe(3);
  });

  it("resizeLedString grows and shrinks array correctly", () => {
    const ls = createLedString(2, 4, lanes);
    resizeLedString(ls, 4);
    expect(ls.leds.length).toBe(4);
    expect(ls.addressableLeds).toBe(4);

    resizeLedString(ls, 1);
    expect(ls.leds.length).toBe(1);
    expect(ls.addressableLeds).toBe(1);
  });

  it("removeLedStringByIndex resets pin behavior and splices array", () => {
    const config: ArduinoConfig = {
      name: "Arduino",
      commPort: "COM1",
      baudRate: 115200,
      debounceUs: 1000,
      normallyClosedRelays: false,
      activeLowAnalogLeds: false,
      usePitsAsLaps: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 0,
      hardwareType: 0,
      analogIds: [PinBehavior.BEHAVIOR_UNUSED, PinBehavior.BEHAVIOR_UNUSED],
      digitalIds: [0, 0, 0, 0, (PinBehavior as any).BEHAVIOR_LED_RGB_STRING],
      ledStrings: [createLedString(3, 4, lanes)],
      voltageConfigs: {},
      normallyClosedLaneSensors: false,
    };

    removeLedStringByIndex(config, 0);
    expect(config.ledStrings.length).toBe(0);
    expect(config.digitalIds[4]).toBe(PinBehavior.BEHAVIOR_UNUSED);
  });

  it("removeLedStringByPin removes matching pin string", () => {
    const config: ArduinoConfig = {
      name: "Arduino",
      commPort: "COM1",
      baudRate: 115200,
      debounceUs: 1000,
      normallyClosedRelays: false,
      activeLowAnalogLeds: false,
      usePitsAsLaps: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 0,
      hardwareType: 0,
      analogIds: [],
      digitalIds: [],
      ledStrings: [createLedString(3, 4, lanes), createLedString(3, 5, lanes)],
      voltageConfigs: {},
      normallyClosedLaneSensors: false,
    };

    const idx = removeLedStringByPin(config, 5);
    expect(idx).toBe(1);
    expect(config.ledStrings.length).toBe(1);
    expect(config.ledStrings[0].pin).toBe(4);
  });

  it("updateLedBehaviorState updates single string and propagates if linked", () => {
    const config: ArduinoConfig = {
      name: "Arduino",
      commPort: "COM1",
      baudRate: 115200,
      debounceUs: 1000,
      normallyClosedRelays: false,
      activeLowAnalogLeds: false,
      usePitsAsLaps: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 0,
      hardwareType: 0,
      analogIds: [],
      digitalIds: [],
      ledStrings: [createLedString(3, 4, lanes), createLedString(3, 5, lanes)],
      voltageConfigs: {},
      normallyClosedLaneSensors: false,
    };
    const states: { [key: string]: any } = {};

    updateLedBehaviorState(
      config,
      0,
      1,
      RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER,
      true,
      states,
    );

    expect(config.ledStrings[0].leds[1]).toBe(
      RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER,
    );
    expect(config.ledStrings[1].leds[1]).toBe(
      RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER,
    );
  });

  it("updates brightness, count, led type, color order, and flash rate", () => {
    const config: ArduinoConfig = {
      name: "Arduino",
      commPort: "COM1",
      baudRate: 115200,
      debounceUs: 1000,
      normallyClosedRelays: false,
      activeLowAnalogLeds: false,
      usePitsAsLaps: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 0,
      hardwareType: 0,
      analogIds: [],
      digitalIds: [],
      ledStrings: [createLedString(3, 4, lanes), createLedString(3, 5, lanes)],
      voltageConfigs: {},
      normallyClosedLaneSensors: false,
    };

    updateLedStringBrightness(config, 0, 64, true);
    expect(config.ledStrings[0].brightness).toBe(64);
    expect(config.ledStrings[1].brightness).toBe(64);

    updateLedStringCount(config, 0, 10, true);
    expect(config.ledStrings[0].leds.length).toBe(10);
    expect(config.ledStrings[1].leds.length).toBe(10);

    updateLedStringLedType(config, 0, 2, true);
    expect(config.ledStrings[0].ledType).toBe(2);
    expect(config.ledStrings[0].colorOrder).toBe(1);
    expect(config.ledStrings[1].ledType).toBe(2);
    expect(config.ledStrings[1].colorOrder).toBe(1);

    updateLedStringColorOrder(config, 0, 0, true);
    expect(config.ledStrings[0].colorOrder).toBe(0);
    expect(config.ledStrings[1].colorOrder).toBe(0);

    updateLedStringFlashRate(config, 0, 3.5, true);
    expect(config.ledStrings[0].flagFlashRate).toBe(3.5);
    expect(config.ledStrings[1].flagFlashRate).toBe(3.5);

    updateLedStringLaneColor(config, 0, 1, "#ffff00", true);
    expect(config.ledStrings[0].ledLaneColorOverrides[1]).toBe("#ffff00");
    expect(config.ledStrings[1].ledLaneColorOverrides[1]).toBe("#ffff00");
  });
});
