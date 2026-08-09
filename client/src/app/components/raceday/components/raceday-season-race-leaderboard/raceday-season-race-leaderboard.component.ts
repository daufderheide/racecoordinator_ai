import { CommonModule } from "@angular/common";
import { Component, computed, input, ViewEncapsulation } from "@angular/core";
import { SeasonStandingItem } from "@app/models/season";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-season-race-leaderboard",
  templateUrl: "./raceday-season-race-leaderboard.component.html",
  styleUrls: ["./raceday-season-race-leaderboard.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedaySeasonRaceLeaderboardComponent {
  seasonStandings = input<SeasonStandingItem[] | any[]>([]);
  widget = input<AbsoluteWidgetNode | null>(null);

  getRacePoints(item: any): number {
    if (!item) return 0;
    if (
      item.current_race_points !== undefined &&
      item.current_race_points !== null
    ) {
      return Number(item.current_race_points);
    }
    if (
      item.currentRacePoints !== undefined &&
      item.currentRacePoints !== null
    ) {
      return Number(item.currentRacePoints);
    }
    const scores = item.race_scores || item.raceScores;
    if (Array.isArray(scores) && scores.length > 0) {
      const liveScore =
        scores.find(
          (s: any) =>
            s.race_id === "live_race" ||
            s.race_id === "live_event" ||
            s.raceId === "live_race" ||
            s.raceId === "live_event",
        ) || scores[scores.length - 1];
      if (liveScore) {
        if (
          liveScore.total_points !== undefined &&
          liveScore.total_points !== null
        ) {
          return Number(liveScore.total_points);
        }
        if (
          liveScore.totalPoints !== undefined &&
          liveScore.totalPoints !== null
        ) {
          return Number(liveScore.totalPoints);
        }
        const overall =
          liveScore.overall_points ?? liveScore.overallPoints ?? 0;
        const heat = liveScore.heat_points ?? liveScore.heatPoints ?? 0;
        return Number(overall) + Number(heat);
      }
    }
    return Number(item.race_points ?? item.racePoints ?? item.score ?? 0);
  }

  sortedStandings = computed(() => {
    const list = [...(this.seasonStandings() || [])];
    return list.sort((a, b) => {
      const aPts = this.getRacePoints(a);
      const bPts = this.getRacePoints(b);
      return bPts - aPts;
    });
  });

  trackByItem(index: number, item: any): string {
    return item.driver_id || item.driverId || item.entityId || String(index);
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
