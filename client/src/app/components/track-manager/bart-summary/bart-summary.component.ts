import { Component, input } from "@angular/core";
import { BartConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-bart-summary",
  templateUrl: "./bart-summary.component.html",
  styleUrls: ["./bart-summary.component.css"],
  imports: [TranslatePipe],
})
export class BartSummaryComponent {
  config = input<BartConfig>();
  index = input<number>();
  isExpanded = true;

  constructor(public translationService: TranslationService) {}

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  getDeviceName(): string {
    const config = this.config();
    if (!config) return "";
    return config.deviceName || config.name || "BS_NO_DEVICE";
  }

  getLapPinPitBehaviorText(): string {
    const config = this.config();
    if (!config) return "TME_LAP_PIN_PIT_NONE";
    switch (config.lapPinPitBehavior) {
      case 1:
        return "TME_LAP_PIN_PIT_IN";
      case 2:
        return "TME_LAP_PIN_PIT_OUT";
      default:
        return "TME_LAP_PIN_PIT_NONE";
    }
  }

  getConfiguredChannelCount(): number {
    const config = this.config();
    if (!config || !config.lapPinBehaviors) return 0;
    return config.lapPinBehaviors.filter(
      (id) =>
        id !== PinBehavior.BEHAVIOR_UNUSED &&
        id !== PinBehavior.BEHAVIOR_RESERVED &&
        id !== -1,
    ).length;
  }

  hasBehavior(behaviorType: "lap" | "pit_in" | "pit_out"): boolean {
    const config = this.config();
    if (!config) return false;
    const behaviors = config.lapPinBehaviors || [];
    const PB = PinBehavior;

    switch (behaviorType) {
      case "lap":
        return behaviors.some(
          (id) => id >= PB.BEHAVIOR_LAP_BASE && id < PB.BEHAVIOR_PIT_IN_BASE,
        );
      case "pit_in":
        return (
          config.lapPinPitBehavior === 1 ||
          behaviors.some(
            (id) =>
              id >= PB.BEHAVIOR_PIT_IN_BASE && id < PB.BEHAVIOR_PIT_OUT_BASE,
          )
        );
      case "pit_out":
        return (
          config.lapPinPitBehavior === 2 ||
          behaviors.some(
            (id) =>
              id >= PB.BEHAVIOR_PIT_OUT_BASE &&
              id < PB.BEHAVIOR_PIT_IN_OUT_BASE,
          )
        );
      default:
        return false;
    }
  }
}
