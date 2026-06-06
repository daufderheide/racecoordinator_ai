import { CommonModule } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";

@Component({
  standalone: true,
  selector: "app-raceday-flag",
  templateUrl: "./raceday-flag.component.html",
  styleUrls: ["./raceday-flag.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
})
export class RacedayFlagComponent {
  @Input() currentFlagUrl = "";
}
