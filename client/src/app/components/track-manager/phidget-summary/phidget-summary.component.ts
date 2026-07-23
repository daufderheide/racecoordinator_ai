import { Component, input } from "@angular/core";
import { PhidgetConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-phidget-summary",
  templateUrl: "./phidget-summary.component.html",
  styleUrls: ["./phidget-summary.component.css"],
  imports: [TranslatePipe],
})
export class PhidgetSummaryComponent {
  config = input<PhidgetConfig>();
  index = input<number>();
  isExpanded = true;

  constructor(public translationService: TranslationService) {}

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  getDeviceName(): string {
    const config = this.config();
    if (!config) return "";
    return config.name || "Phidget";
  }

  getSerialNumberStr(): string {
    const config = this.config();
    if (!config || !config.serialNumber || config.serialNumber <= 0) {
      return "PS_NO_SERIAL";
    }
    return config.serialNumber.toString();
  }

  getHubPortStr(): string {
    const config = this.config();
    if (!config || !config.isHubPort) {
      return "PS_NO_HUB";
    }
    return `Port ${config.hubPort}`;
  }

  getConfiguredPinCount(): number {
    const config = this.config();
    if (!config) return 0;
    const isConfigured = (id: number) => {
      return (
        id !== PinBehavior.BEHAVIOR_UNUSED &&
        id !== PinBehavior.BEHAVIOR_RESERVED &&
        id !== -1
      );
    };
    const digitalInCount = (config.digitalInIds || []).filter(
      isConfigured,
    ).length;
    const digitalOutCount = (config.digitalOutIds || []).filter(
      isConfigured,
    ).length;
    const analogCount = (config.analogIds || []).filter(isConfigured).length;
    return digitalInCount + digitalOutCount + analogCount;
  }

  hasBehavior(
    behaviorType: "lap" | "segment" | "call" | "relay" | "voltage" | "led",
  ): boolean {
    const config = this.config();
    if (!config) return false;
    const digitalInIds = config.digitalInIds || [];
    const digitalOutIds = config.digitalOutIds || [];
    const analogIds = config.analogIds || [];
    const allPins = [...digitalInIds, ...digitalOutIds, ...analogIds];

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
            id === (PB as any).BEHAVIOR_ANALOG_LED ||
            (id >= (PB as any).BEHAVIOR_ANALOG_LED_BASE &&
              id < (PB as any).BEHAVIOR_ANALOG_LED_BASE + 1000),
        );
      default:
        return false;
    }
  }
}
