import { IArduinoConfig } from "@app/proto/antigravity";

import { ArduinoConfigConverter } from "./arduino_config.converter";

describe("ArduinoConfigConverter", () => {
  it("should convert from proto correctly", () => {
    const proto: IArduinoConfig = {
      name: "Arduino UNO",
      commPort: "COM3",
      baudRate: 115200,
      debounceUs: 50,
      hardwareType: 1,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: false,
      globalInvertLights: 0,
      usePitsAsLaps: true,
      useLapsForSegments: false,
      lapPinPitBehavior: 2,
      digitalIds: [1, 2, 3],
      analogIds: [4, 5],
      ledStrings: [
        {
          pin: 6,
          leds: [1, 2, 3],
          numUsedLeds: 3,
          addressableLeds: 10,
          brightness: 255,
          ledType: 0,
          flagFlashRate: 500,
          ledLaneColorOverrides: [],
        },
      ],
      voltageConfigs: [{ lane: 1, maxVoltage: 12.0 } as any],
    };

    const config = ArduinoConfigConverter.fromProto(proto);

    expect(config.name).toBe("Arduino UNO");
    expect(config.commPort).toBe("COM3");
    expect(config.baudRate).toBe(115200);
    expect(config.normallyClosedLaneSensors).toBeTrue();
    expect(config.normallyClosedRelays).toBeFalse();
    expect(config.digitalIds).toEqual([1, 2, 3]);
    expect(config.ledStrings.length).toBe(1);
    expect(config.voltageConfigs![1]).toBe(12.0);
  });
});
