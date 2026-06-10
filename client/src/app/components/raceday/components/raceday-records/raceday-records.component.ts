import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
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
  raceRecordLapNickname = input<string>("");
  raceRecordLapTime = input<number>(0);
  raceRecordScoreNickname = input<string>("");
  raceRecordScore = input<number>(0);
  currentRaceBestNickname = input<string>("");
  currentRaceBestTime = input<number>(0);
  heatBestNickname = input<string>("");
  heatBestTime = input<number>(0);
}
