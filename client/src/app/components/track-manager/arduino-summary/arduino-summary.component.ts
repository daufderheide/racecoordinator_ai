import { Component, input } from "@angular/core";
import { ArduinoConfig } from "src/app/models/track";

import { TranslationService } from "src/app/services/translation.service";

import { PinBehavior } from "src/app/proto/antigravity";

import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-arduino-summary",
  templateUrl: "./arduino-summary.component.html",
  styleUrls: ["./arduino-summary.component.css"],
  imports: [TranslatePipe],
})
export class ArduinoSummaryComponent {
  config = input<ArduinoConfig>();
  index = input<number>();
  isExpanded = true;

  constructor(public translationService: TranslationService) {}

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  getBoardName(): string {
    const config = this.config();
    if (!config) return "";
    return config.hardwareType === 1 ? "AS_BOARD_MEGA" : "AS_BOARD_UNO";
  }

  getConfiguredPinCount(): number {
    const config = this.config();
    if (!config) return 0;
    const isConfigured = (id: number) => {
      // 0 = BEHAVIOR_UNUSED, 1 = BEHAVIOR_RESERVED
      return (
        id !== PinBehavior.BEHAVIOR_UNUSED &&
        id !== PinBehavior.BEHAVIOR_RESERVED &&
        id !== -1
      );
    };
    const digitalCount = (config.digitalIds || []).filter(isConfigured).length;
    const analogCount = (config.analogIds || []).filter(isConfigured).length;
    return digitalCount + analogCount;
  }

  hasBehavior(
    behaviorType: "lap" | "segment" | "call" | "relay" | "voltage" | "led",
  ): boolean {
    const config = this.config();
    if (!config) return false;
    const digitalIds = config.digitalIds || [];
    const analogIds = config.analogIds || [];
    const allPins = [...digitalIds, ...analogIds];

    const PB = PinBehavior;

    switch (behaviorType) {
      case "lap":
        return allPins.some(
          (id) => id >= PB.BEHAVIOR_LAP_BASE && id < PB.BEHAVIOR_SEGMENT_BASE,
        );
      case "segment":
        return allPins.some(
          (id) =>
            id >= PB.BEHAVIOR_SEGMENT_BASE && id < PB.BEHAVIOR_CALL_BUTTON_BASE,
        );
      case "call":
        return allPins.some(
          (id) =>
            id === PB.BEHAVIOR_CALL_BUTTON ||
            (id >= PB.BEHAVIOR_CALL_BUTTON_BASE && id < PB.BEHAVIOR_RELAY_BASE),
        );
      case "relay":
        return allPins.some(
          (id) =>
            id === PB.BEHAVIOR_RELAY ||
            (id >= PB.BEHAVIOR_RELAY_BASE &&
              id < PB.BEHAVIOR_RELAY_BASE + 1000),
        );
      case "voltage":
        return allPins.some(
          (id) =>
            id >= PB.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
            id < PB.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000,
        );
      case "led":
        return allPins.some(
          (id) =>
            id === (PB as any).BEHAVIOR_LED_RGB_STRING ||
            (config?.ledStrings && config.ledStrings.length > 0),
        );
      default:
        return false;
    }
  }
}
