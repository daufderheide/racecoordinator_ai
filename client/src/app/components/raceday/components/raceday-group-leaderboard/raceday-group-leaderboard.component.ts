import { CommonModule } from "@angular/common";
import { Component, computed, ViewEncapsulation } from "@angular/core";
import { RacedayLeaderboardComponent } from "@app/components/raceday/components/raceday-leaderboard/raceday-leaderboard.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-group-leaderboard",
  templateUrl: "../raceday-leaderboard/raceday-leaderboard.component.html",
  styleUrls: ["../raceday-leaderboard/raceday-leaderboard.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayGroupLeaderboardComponent extends RacedayLeaderboardComponent {
  override isGroupBoard = computed(() => true);
}
