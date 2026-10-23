import { Lane } from "@app/models/lane";
import { ArduinoConfig, LedString } from "@app/models/track";
import { PinBehavior, RgbLedBehavior } from "@app/proto/antigravity";

export function createLedString(
  numLeds: number,
  pin: number,
  lanes: Lane[],
): LedString {
  const n = Number(numLeds);
  return {
    pin,
    leds: new Array(n).fill(RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED),
    numUsedLeds: 0,
    addressableLeds: n,
    brightness: 32,
    ledType: 1,
    colorOrder: 0,
    flagFlashRate: 2,
    ledLaneColorOverrides: lanes.map((l) => l.background_color || "#ffffff"),
  };
}

export function updateDerivedLedFields(ls: LedString): void {
  ls.numUsedLeds = 0;
  ls.addressableLeds = ls.leds.length;
  ls.leds.forEach((b) => {
    if (b !== RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED) {
      ls.numUsedLeds++;
    }
  });
}

export function resizeLedString(ls: LedString, count: number): void {
  const currentLength = ls.leds.length;
  if (count > currentLength) {
    const extra = new Array(count - currentLength).fill(
      RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED,
    );
    ls.leds = [...ls.leds, ...extra];
  } else if (count < currentLength) {
    ls.leds = ls.leds.slice(0, count);
  }
  updateDerivedLedFields(ls);
}

export function removeLedStringByIndex(
  config: ArduinoConfig,
  index: number,
): void {
  const pin = config.ledStrings[index].pin;
  if (pin !== 0) {
    const isDigital = pin < 1000;
    const pinIndex = isDigital ? pin : pin - 1000;
    const unused = PinBehavior.BEHAVIOR_UNUSED;
    if (isDigital) {
      config.digitalIds[pinIndex] = unused;
    } else {
      config.analogIds[pinIndex] = unused;
    }
  }
  config.ledStrings.splice(index, 1);
}

export function removeLedStringByPin(
  config: ArduinoConfig,
  pin: number,
): number {
  if (!config.ledStrings) return -1;
  const index = config.ledStrings.findIndex((s) => s.pin === pin);
  if (index !== -1) {
    config.ledStrings.splice(index, 1);
  }
  return index;
}

export function updateLedBehaviorState(
  config: ArduinoConfig,
  stringIndex: number,
  ledIndex: number,
  val: number,
  isLinked: boolean,
  activeRgbLedStates: { [key: string]: "off" | "red" | "green" | "blue" },
): void {
  const ls = config.ledStrings[stringIndex];
  ls.leds[ledIndex] = val;

  if (val === 0) {
    activeRgbLedStates[`${stringIndex}-${ledIndex}`] = "off";
    if (isLinked) {
      config.ledStrings.forEach((_, i) => {
        activeRgbLedStates[`${i}-${ledIndex}`] = "off";
      });
    }
  }

  if (isLinked) {
    config.ledStrings.forEach((string, i) => {
      if (i !== stringIndex && string.leds.length > ledIndex) {
        string.leds[ledIndex] = val;
        updateDerivedLedFields(string);
      }
    });
  }

  updateDerivedLedFields(ls);
}

export function updateLedStringBrightness(
  config: ArduinoConfig,
  stringIdx: number,
  val: any,
  isLinked: boolean,
): void {
  const brightness = parseInt(val, 10);
  config.ledStrings[stringIdx].brightness = brightness;
  if (isLinked) {
    config.ledStrings.forEach((ls, i) => {
      if (i !== stringIdx) ls.brightness = brightness;
    });
  }
}

export function updateLedStringCount(
  config: ArduinoConfig,
  stringIdx: number,
  val: any,
  isLinked: boolean,
): void {
  const count = parseInt(val, 10);
  if (isNaN(count) || count < 0) return;

  resizeLedString(config.ledStrings[stringIdx], count);
  if (isLinked) {
    config.ledStrings.forEach((ls, i) => {
      if (i !== stringIdx) resizeLedString(ls, count);
    });
  }
}

export function updateLedStringLedType(
  config: ArduinoConfig,
  stringIdx: number,
  val: any,
  isLinked: boolean,
): void {
  const ledType = parseInt(val, 10);
  config.ledStrings[stringIdx].ledType = ledType;
  const colorOrder = ledType === 2 || ledType === 3 ? 1 : 0;
  config.ledStrings[stringIdx].colorOrder = colorOrder;

  if (isLinked) {
    config.ledStrings.forEach((ls, i) => {
      if (i !== stringIdx) {
        ls.ledType = ledType;
        ls.colorOrder = colorOrder;
      }
    });
  }
}

export function updateLedStringColorOrder(
  config: ArduinoConfig,
  stringIdx: number,
  val: any,
  isLinked: boolean,
): void {
  const colorOrder = parseInt(val, 10);
  config.ledStrings[stringIdx].colorOrder = colorOrder;
  if (isLinked) {
    config.ledStrings.forEach((ls, i) => {
      if (i !== stringIdx) ls.colorOrder = colorOrder;
    });
  }
}

export function updateLedStringFlashRate(
  config: ArduinoConfig,
  stringIdx: number,
  val: any,
  isLinked: boolean,
): void {
  const rate = parseFloat(val);
  config.ledStrings[stringIdx].flagFlashRate = rate;
  if (isLinked) {
    config.ledStrings.forEach((ls, i) => {
      if (i !== stringIdx) ls.flagFlashRate = rate;
    });
  }
}

export function updateLedStringLaneColor(
  config: ArduinoConfig,
  stringIdx: number,
  laneIdx: number,
  color: string,
  isLinked: boolean,
): void {
  const sourceString = config.ledStrings[stringIdx];
  while (sourceString.ledLaneColorOverrides.length <= laneIdx) {
    sourceString.ledLaneColorOverrides.push("#ffffff");
  }
  sourceString.ledLaneColorOverrides[laneIdx] = color;

  if (isLinked) {
    config.ledStrings.forEach((ls, i) => {
      if (i !== stringIdx) {
        if (!ls.ledLaneColorOverrides) ls.ledLaneColorOverrides = [];
        while (ls.ledLaneColorOverrides.length <= laneIdx) {
          ls.ledLaneColorOverrides.push("#ffffff");
        }
        ls.ledLaneColorOverrides[laneIdx] = color;
      }
    });
  }
}
