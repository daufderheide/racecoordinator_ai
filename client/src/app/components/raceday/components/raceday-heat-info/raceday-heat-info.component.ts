import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { Race } from "@app/models/race";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { Heat } from "@app/race/heat";

@Component({
  standalone: true,
  selector: "app-raceday-heat-info",
  templateUrl: "./raceday-heat-info.component.html",
  styleUrls: ["./raceday-heat-info.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayHeatInfoComponent {
  heat = input<Heat | undefined>(undefined);
  race = input<Race | undefined>(undefined);
  totalHeats = input<number>(0);
}
