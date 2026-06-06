import { CommonModule } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
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
  @Input() heat?: Heat;
  @Input() race?: Race;
  @Input() track?: Track;
  @Input() totalHeats = 0;
}
