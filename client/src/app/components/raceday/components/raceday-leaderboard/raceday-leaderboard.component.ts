import { CommonModule } from "@angular/common";
import { Component, computed, input, ViewEncapsulation } from "@angular/core";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-leaderboard",
  templateUrl: "./raceday-leaderboard.component.html",
  styleUrls: ["./raceday-leaderboard.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayLeaderboardComponent {
  leaderboardEntries = input<any[]>([]);
  widget = input<AbsoluteWidgetNode | null>(null);
  isGroup = input<boolean>(false);
  groupNumber = input<number>(0);
  groupEnabled = input<boolean>(false);

  isGroupBoard = computed(() => {
    return this.isGroup() || this.widget()?.widgetType === "group-leaderboard";
  });

  sortedLeaderboardEntries = computed(() => {
    return [...this.leaderboardEntries()].sort((a, b) => {
      if (a.rank !== b.rank) {
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
      }
      return a.name.localeCompare(b.name);
    });
  });

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
    const customDecimals = this.widget()?.customSettings?.["decimalPlaces"];
    if (customDecimals !== undefined && customDecimals !== null) {
      const d = Math.min(3, Math.max(0, Number(customDecimals)));
      return `1.${d}-${d}`;
    }
    if (!entry) return "1.0-0";
    if (entry.isTime !== undefined) {
      return entry.isTime ? "1.3-3" : "1.2-2";
    }
    return "1.0-0";
  }
}
