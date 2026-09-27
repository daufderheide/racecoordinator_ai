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

  currentFlagUrl = input<string>("");

  protected displayFlagUrl = computed(() => {
    return this.currentFlagUrl() || this.serviceFlagUrl() || "";
  });
}
