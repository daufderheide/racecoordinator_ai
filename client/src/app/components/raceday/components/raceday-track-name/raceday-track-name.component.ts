import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-track-name",
  templateUrl: "./raceday-track-name.component.html",
  styleUrls: ["./raceday-track-name.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayTrackNameComponent {
  track = input<Track | undefined>(undefined);
}
