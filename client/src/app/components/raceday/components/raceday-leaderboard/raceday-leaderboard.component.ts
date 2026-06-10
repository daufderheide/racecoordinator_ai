import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";

@Component({
  standalone: true,
  selector: "app-raceday-leaderboard",
  templateUrl: "./raceday-leaderboard.component.html",
  styleUrls: ["./raceday-leaderboard.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
})
export class RacedayLeaderboardComponent {
  leaderboardEntries = input<any[]>([]);

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
