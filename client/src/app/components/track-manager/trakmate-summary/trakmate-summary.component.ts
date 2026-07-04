import { Component, input } from "@angular/core";
import { TrackmateConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-trakmate-summary",
  templateUrl: "./trakmate-summary.component.html",
  styleUrls: ["./trakmate-summary.component.css"],
  imports: [TranslatePipe],
})
export class TrakmateSummaryComponent {
  config = input<TrackmateConfig>();
  index = input<number>();
  isExpanded = true;

  constructor(public translationService: TranslationService) {}

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  hasPitRow(): boolean {
    const config = this.config();
    if (!config || !config.lapPinBehaviors) return false;
    const PB = PinBehavior;
    return config.lapPinBehaviors.some(
      (behavior) =>
        (behavior >= PB.BEHAVIOR_PIT_IN_BASE &&
          behavior < PB.BEHAVIOR_VOLTAGE_LEVEL_BASE) ||
        behavior >= PB.BEHAVIOR_PIT_IN_OUT_BASE,
    );
  }
}
