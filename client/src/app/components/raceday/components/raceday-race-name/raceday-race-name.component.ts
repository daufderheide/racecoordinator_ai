import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { Race } from "@app/models/race";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-race-name",
  templateUrl: "./raceday-race-name.component.html",
  styleUrls: ["./raceday-race-name.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayRaceNameComponent {
  race = input<Race | undefined>(undefined);
}
