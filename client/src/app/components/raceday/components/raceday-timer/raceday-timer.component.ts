import { CommonModule } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-timer",
  templateUrl: "./raceday-timer.component.html",
  styleUrls: ["./raceday-timer.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayTimerComponent {
  @Input() formattedTime = "";
  @Input() autoStatusLabel = "";
  @Input() isWarmup = false;
  @Input() showCountdownOverlay = false;
}
