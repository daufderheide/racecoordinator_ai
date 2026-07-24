import { ArduinoConfig, LedString } from "@app/models/track";
import { IArduinoConfig } from "@app/proto/antigravity";

export class ArduinoConfigConverter {
  static fromProto(proto: IArduinoConfig): ArduinoConfig {
    const p = proto as any;

    const ledStrings: LedString[] = (p.ledStrings || []).map((ls: any) => ({
      pin: ls.pin || 0,
      leds: ls.leds || [],
      numUsedLeds: ls.numUsedLeds || ls.num_used_leds || 0,
      addressableLeds: ls.addressableLeds || ls.addressable_leds || 0,
      brightness: ls.brightness || 0,
      ledType: ls.ledType || ls.led_type || 0,
      flagFlashRate: ls.flagFlashRate || ls.flag_flash_rate || 0,
      ledLaneColorOverrides:
        ls.ledLaneColorOverrides || ls.led_lane_color_overrides || [],
    }));

    const voltageConfigs: { [lane: number]: number } = {};
    if (p.voltageConfigs) {
      p.voltageConfigs.forEach((vc: any) => {
        voltageConfigs[vc.lane] = vc.maxVoltage || vc.max_voltage || 0;
      });
    }

    return {
      name: p.name || "",
      commPort: p.commPort || p.comm_port || "",
      baudRate: p.baudRate || p.baud_rate || 115200,
      debounceUs: p.debounceUs || p.debounce_us || 0,
      hardwareType: p.hardwareType || p.hardware_type || 0,
      normallyClosedLaneSensors:
        p.normallyClosedLaneSensors ?? p.normally_closed_lane_sensors ?? false,
      normallyClosedRelays:
        p.normallyClosedRelays ?? p.normally_closed_relays ?? false,
      globalInvertLights: p.globalInvertLights || p.global_invert_lights || 0,
      usePitsAsLaps: p.usePitsAsLaps ?? p.use_pits_as_laps ?? false,
      useLapsForSegments:
        p.useLapsForSegments ?? p.use_laps_for_segments ?? false,
      lapPinPitBehavior: p.lapPinPitBehavior || p.lap_pin_pit_behavior || 0,
      digitalIds: p.digitalIds || p.digital_ids || [],
      analogIds: p.analogIds || p.analog_ids || [],
      ledStrings: ledStrings,
      voltageConfigs: voltageConfigs,
    };
  }
}
