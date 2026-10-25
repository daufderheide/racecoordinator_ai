import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { RaceFlag } from "@app/proto/antigravity";
import { RaceFlagService } from "@app/services/race-flag.service";

@Component({
  standalone: true,
  selector: "app-raceday-flag",
  templateUrl: "./raceday-flag.component.html",
  styleUrls: ["./raceday-flag.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
})
export class RacedayFlagComponent {
  private raceFlagService = inject(RaceFlagService, { optional: true });
  private serviceFlagUrl = toSignal(
    this.raceFlagService?.currentFlagUrl$ ?? of(""),
    {
      initialValue:
        typeof this.raceFlagService?.getCurrentFlagUrl === "function"
          ? this.raceFlagService.getCurrentFlagUrl()
          : typeof this.raceFlagService?.getFlagUrl === "function"
            ? this.raceFlagService.getFlagUrl()
            : "",
    },
  );

  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);
  currentFlagUrl = input<string>("");
  displayMode = input<"image" | "color-bar" | "both" | undefined>(undefined);
  raceStateColor = input<string | undefined>(undefined);
  raceFlag = input<any>(undefined);

  protected displayFlagUrl = computed(() => {
    return this.currentFlagUrl() || this.serviceFlagUrl() || "";
  });

  get effectiveSettings(): Record<string, any> {
    return this.widget()?.customSettings || {};
  }

  get effectiveDisplayMode(): "image" | "color-bar" | "both" {
    return (
      this.displayMode() || this.effectiveSettings["displayMode"] || "image"
    );
  }

  get isImageMode(): boolean {
    const mode = this.effectiveDisplayMode;
    return mode === "image" || mode === "both";
  }

  get isColorBarMode(): boolean {
    const mode = this.effectiveDisplayMode;
    return mode === "color-bar" || mode === "both";
  }

  get effectiveRaceStateColor(): string {
    if (this.raceStateColor()) {
      return this.raceStateColor()!;
    }
    const parentComp = this.parent();
    if (parentComp && typeof parentComp.raceStateColor === "string") {
      return parentComp.raceStateColor;
    }
    const flag =
      this.raceFlag() ?? parentComp?.driverData?.flag ?? RaceFlag.UNKNOWN_FLAG;

    if (this.raceFlagService) {
      if (flag === RaceFlag.UNKNOWN_FLAG || flag === 0) {
        return this.raceFlagService.getFlagColor();
      }
      return this.raceFlagService.getFlagTypeForFlag(flag);
    }
    return "red";
  }
}
