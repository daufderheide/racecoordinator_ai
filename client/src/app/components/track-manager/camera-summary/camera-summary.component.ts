import { Component, input } from "@angular/core";
import { CameraConfig } from "@app/models/camera_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-camera-summary",
  templateUrl: "./camera-summary.component.html",
  styleUrls: ["./camera-summary.component.css"],
  imports: [TranslatePipe],
})
export class CameraSummaryComponent {
  config = input<CameraConfig>();
  index = input<number>();
  isExpanded = true;

  constructor(public translationService: TranslationService) {}

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  getDeviceName(): string {
    const config = this.config();
    if (!config) return "";
    return config.name || "CS_DEFAULT_NAME";
  }

  getConfiguredGateCount(): number {
    const config = this.config();
    if (!config || !config.gates) return 0;
    return config.gates.length;
  }

  hasBehavior(behaviorType: "lap" | "segment" | "pit_in" | "pit_out"): boolean {
    const config = this.config();
    if (!config || !config.gates) return false;
    switch (behaviorType) {
      case "lap":
        return config.gates.some((g) => g.gateType === 0);
      case "segment":
        return config.gates.some((g) => g.gateType === 1);
      case "pit_in":
        return config.gates.some((g) => g.gateType === 2);
      case "pit_out":
        return config.gates.some((g) => g.gateType === 3);
      default:
        return false;
    }
  }
}
