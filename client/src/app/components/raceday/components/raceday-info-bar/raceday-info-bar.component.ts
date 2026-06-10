import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { Heat } from "@app/race/heat";

@Component({
  standalone: true,
  selector: "app-raceday-info-bar",
  templateUrl: "./raceday-info-bar.component.html",
  styleUrls: ["./raceday-info-bar.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayInfoBarComponent {
  heat = input<Heat | undefined>(undefined);
  race = input<Race | undefined>(undefined);
  track = input<Track | undefined>(undefined);
  totalHeats = input<number>(0);
}
