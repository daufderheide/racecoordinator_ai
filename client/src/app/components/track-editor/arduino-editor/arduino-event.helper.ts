import { ArduinoConfig } from "@app/models/track";
import { PinBehavior } from "@app/proto/antigravity";

export function checkCallButtonPins(
  config: ArduinoConfig | undefined,
  lane: number | undefined,
  getPinBehavior: (isDigital: boolean, pin: number) => number,
  triggerPinActivity: (pinId: number) => void,
): void {
  const isMega = config?.hardwareType === 1;
  const digitalCount = isMega ? 54 : 14;
  const analogCount = isMega ? 16 : 6;

  for (let i = 2; i < digitalCount; i++) {
    const behavior = getPinBehavior(true, i);
    if (
      behavior === PinBehavior.BEHAVIOR_CALL_BUTTON ||
      behavior === PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + (lane ?? 0)
    ) {
      triggerPinActivity(i);
    }
  }

  for (let i = 0; i < analogCount; i++) {
    const behavior = getPinBehavior(false, i);
    if (
      behavior === PinBehavior.BEHAVIOR_CALL_BUTTON ||
      behavior === PinBehavior.BEHAVIOR_CALL_BUTTON_BASE + (lane ?? 0)
    ) {
      triggerPinActivity(i + 1000);
    }
  }
}

export function processAnalogDataEvent(
  analogData: any,
  liveVoltages: { [key: number]: number | undefined },
  maxVoltagesSeen: { [key: number]: number | undefined },
  getLaneForAnalogPin: (pin: number) => number,
): void {
  const pin = analogData.pin ?? -1;
  const value = analogData.value ?? 0;
  liveVoltages[pin] = value;

  const lane = getLaneForAnalogPin(pin);
  if (lane !== -1) {
    const currentMax = maxVoltagesSeen[lane] ?? 0;
    if (value > currentMax) {
      maxVoltagesSeen[lane] = value;
    }
  }
}

export function processDigitalPinEvent(
  digitalPin: any,
  config: ArduinoConfig | undefined,
  pinActivity: { [key: string]: boolean },
  pinActivityTimers: { [key: string]: any },
): void {
  const pin = digitalPin.pin ?? -1;
  const isDigital = digitalPin.isDigital ?? false;
  const state = digitalPin.state ?? 0;
  const key = (isDigital ? "D" : "A") + pin;

  const nc = config?.normallyClosedLaneSensors;
  const isTrip = nc ? state === 1 : state === 0;

  pinActivity[key] = isTrip;

  if (pinActivityTimers[key]) {
    clearTimeout(pinActivityTimers[key]);
    delete pinActivityTimers[key];
  }
}
