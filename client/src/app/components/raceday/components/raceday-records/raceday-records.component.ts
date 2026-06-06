import { CommonModule } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-records",
  templateUrl: "./raceday-records.component.html",
  styleUrls: ["./raceday-records.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayRecordsComponent {
  @Input() raceRecordLapNickname = "";
  @Input() raceRecordLapTime = 0;
  @Input() raceRecordScoreNickname = "";
  @Input() raceRecordScore = 0;
  @Input() currentRaceBestNickname = "";
  @Input() currentRaceBestTime = 0;
  @Input() heatBestNickname = "";
  @Input() heatBestTime = 0;
}
