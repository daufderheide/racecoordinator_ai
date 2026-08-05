import { CommonModule } from "@angular/common";
import { Component, computed, input, ViewEncapsulation } from "@angular/core";
import { SeasonStandingItem } from "@app/models/season";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-season-leaderboard",
  templateUrl: "./raceday-season-leaderboard.component.html",
  styleUrls: ["./raceday-season-leaderboard.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedaySeasonLeaderboardComponent {
  seasonStandings = input<SeasonStandingItem[] | any[]>([]);
  widget = input<AbsoluteWidgetNode | null>(null);

  sortedStandings = computed(() => {
    const list = [...(this.seasonStandings() || [])];
    return list.sort((a, b) => {
      const aPts = a.net_points !== undefined ? a.net_points : a.score || 0;
      const bPts = b.net_points !== undefined ? b.net_points : b.score || 0;
      return bPts - aPts;
    });
  });

  trackByItem(index: number, item: any): string {
    return item.driver_id || item.entityId || String(index);
  }

  getScoreFormat(): string {
    const customDecimals = this.widget()?.customSettings?.["decimalPlaces"];
    if (customDecimals !== undefined && customDecimals !== null) {
      const d = Math.min(3, Math.max(0, Number(customDecimals)));
      return `1.${d}-${d}`;
    }
    return "1.0-0";
  }
}
