import { Lane } from "@app/models/lane";
import { ArduinoConfig } from "@app/models/track";
import { PinBehavior, RgbLedBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import {
  createPinGroups,
  filterPinActions,
  getLaneForAnalogPin,
  getLaneIndexFromPinBehavior,
  getLaneIndexFromRgbBehavior,
  getPinAction,
  getVoltageLanes,
  isOutputPinBehavior,
  parsePinAction,
  syncArduinoLanes,
} from "./arduino-pin.helper";

describe("arduino-pin.helper", () => {
  let translationService: TranslationService;

  beforeEach(() => {
    translationService =
      new TranslationServiceMock() as unknown as TranslationService;
  });

  const lanes: Lane[] = [
    { entity_id: "1", length: 10, background_color: "#ff0000" } as Lane,
    { entity_id: "2", length: 10, background_color: "#0000ff" } as Lane,
  ];

  it("converts between PinBehavior values and pin action strings", () => {
    expect(getPinAction(PinBehavior.BEHAVIOR_UNUSED)).toBe("");
    expect(getPinAction(PinBehavior.BEHAVIOR_RESERVED)).toBe("reserved");
    expect(getPinAction(PinBehavior.BEHAVIOR_CALL_BUTTON)).toBe("master_call");
    expect(getPinAction(PinBehavior.BEHAVIOR_RELAY)).toBe("master_relay");
    expect(getPinAction(PinBehavior.BEHAVIOR_LAP_BASE + 1)).toBe("lap_1");
    expect(getPinAction(PinBehavior.BEHAVIOR_SEGMENT_BASE + 2)).toBe(
      "segment_2",
    );
    expect(getPinAction(PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + 0)).toBe(
      "call_0",
    );
    expect(getPinAction(PinBehavior.BEHAVIOR_RELAY_BASE + 3)).toBe("relay_3");
    expect(getPinAction(PinBehavior.BEHAVIOR_PIT_IN_BASE + 1)).toBe("pitin_1");
    expect(getPinAction(PinBehavior.BEHAVIOR_PIT_OUT_BASE + 0)).toBe(
      "pitout_0",
    );
    expect(getPinAction(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 2)).toBe(
      "voltage_2",
    );

    expect(parsePinAction("")).toBe(PinBehavior.BEHAVIOR_UNUSED);
    expect(parsePinAction("reserved")).toBe(PinBehavior.BEHAVIOR_RESERVED);
    expect(parsePinAction("master_call")).toBe(
      PinBehavior.BEHAVIOR_CALL_BUTTON,
    );
    expect(parsePinAction("master_relay")).toBe(PinBehavior.BEHAVIOR_RELAY);
    expect(parsePinAction("lap_1")).toBe(PinBehavior.BEHAVIOR_LAP_BASE + 1);
    expect(parsePinAction("voltage_2")).toBe(
      PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 2,
    );
  });

  it("isOutputPinBehavior detects relay and analog led output behaviors", () => {
    expect(isOutputPinBehavior(PinBehavior.BEHAVIOR_RELAY)).toBeTrue();
    expect(isOutputPinBehavior(PinBehavior.BEHAVIOR_RELAY_BASE + 1)).toBeTrue();
    expect(
      isOutputPinBehavior(PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG),
    ).toBeTrue();
    expect(
      isOutputPinBehavior(PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG),
    ).toBeTrue();
    expect(
      isOutputPinBehavior(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1),
    ).toBeTrue();
    expect(isOutputPinBehavior(PinBehavior.BEHAVIOR_LAP_BASE)).toBeFalse();
  });

  it("createPinGroups builds digital and analog groups", () => {
    const digitalGroups = createPinGroups(lanes, false, translationService);
    expect(digitalGroups.length).toBeGreaterThan(0);

    const analogGroups = createPinGroups(lanes, true, translationService);
    expect(analogGroups.length).toBeGreaterThan(0);
  });

  it("filterPinActions disables assigned pins except current", () => {
    const groups = createPinGroups(lanes, false, translationService);
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
      digitalIds: [
        0,
        0,
        PinBehavior.BEHAVIOR_LAP_BASE + 0,
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
      ],
      ledStrings: [],
      voltageConfigs: {},
      normallyClosedLaneSensors: false,
    };

    const filtered = filterPinActions(
      groups,
      true,
      2,
      config,
      true,
      "lap_0",
      translationService,
    );

    const lane1Group = filtered.find((g) => g.key === "lane_0");
    const lapAction = lane1Group?.actions.find((a) => a.value === "lap_0");
    expect(lapAction?.disabled).toBeFalsy();
  });

  it("getLaneIndexFromPinBehavior and getLaneIndexFromRgbBehavior extract lane correctly", () => {
    expect(getLaneIndexFromPinBehavior(PinBehavior.BEHAVIOR_LAP_BASE + 3)).toBe(
      3,
    );
    expect(getLaneIndexFromPinBehavior(PinBehavior.BEHAVIOR_RELAY)).toBe(-1);

    expect(
      getLaneIndexFromRgbBehavior(
        RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 2,
      ),
    ).toBe(2);
    expect(
      getLaneIndexFromRgbBehavior(RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED),
    ).toBe(-1);
  });

  it("getVoltageLanes and getLaneForAnalogPin retrieve analog voltage lanes", () => {
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
      analogIds: [
        PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1,
        PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 0,
      ],
      digitalIds: [],
      ledStrings: [],
      voltageConfigs: {},
      normallyClosedLaneSensors: false,
    };

    expect(getVoltageLanes(config)).toEqual([0, 1]);
    expect(getLaneForAnalogPin(config, 0)).toBe(1);
    expect(getLaneForAnalogPin(config, 1)).toBe(0);
    expect(getLaneForAnalogPin(config, 5)).toBe(-1);
  });

  it("syncArduinoLanes cleans up pins, overrides, and voltageConfigs for removed lanes", () => {
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
      analogIds: [PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 5],
      digitalIds: [0, 0, PinBehavior.BEHAVIOR_LAP_BASE + 5],
      ledStrings: [
        {
          pin: 2,
          leds: [RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE + 5],
          numUsedLeds: 1,
          addressableLeds: 1,
          brightness: 32,
          ledType: 1,
          colorOrder: 0,
          flagFlashRate: 2,
          ledLaneColorOverrides: ["#fff", "#fff", "#fff"],
        },
      ],
      voltageConfigs: { 5: 100 },
      normallyClosedLaneSensors: false,
    };

    const changed = syncArduinoLanes(config, lanes);
    expect(changed).toBeTrue();
    expect(config.digitalIds[2]).toBe(PinBehavior.BEHAVIOR_UNUSED);
    expect(config.analogIds[0]).toBe(PinBehavior.BEHAVIOR_UNUSED);
    expect(config.ledStrings[0].leds[0]).toBe(
      RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED,
    );
    expect(config.voltageConfigs?.[5]).toBeUndefined();
    expect(config.ledStrings[0].ledLaneColorOverrides.length).toBe(2);
  });
});
