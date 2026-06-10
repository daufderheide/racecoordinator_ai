import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-group-leaderboard",
  templateUrl: "./raceday-group-leaderboard.component.html",
  styleUrls: ["./raceday-group-leaderboard.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayGroupLeaderboardComponent {
  leaderboardEntries = input<any[]>([]);
  groupNumber = input<number>(0);
  groupEnabled = input<boolean>(false);

  trackByLeaderboardEntry(index: number, entry: any): string {
    return entry.entityId || String(index);
  }

  getLeaderboardPosition(entry: any): number {
    const sorted = [...this.leaderboardEntries()].sort((a, b) => {
      if (a.rank !== b.rank) {
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
      }
      return a.name.localeCompare(b.name);
    });
    const pos = sorted.findIndex((e) => e.entityId === entry.entityId);
    return pos >= 0 ? pos : 0;
  }

  getLeaderboardScoreFormat(entry: any): string {
    if (!entry) return "1.0-0";
    if (entry.isTime !== undefined) {
      return entry.isTime ? "1.3-3" : "1.2-2";
    }
    return "1.0-0";
  }
}
