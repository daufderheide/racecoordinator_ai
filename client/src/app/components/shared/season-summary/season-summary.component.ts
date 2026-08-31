import { DecimalPipe } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { Season, SeasonStandingItem } from "@app/models/season";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { calculateSeasonStandings } from "@app/utils/season.utils";

@Component({
  standalone: true,
  selector: "app-season-summary",
  templateUrl: "./season-summary.component.html",
  styleUrls: ["./season-summary.component.css"],
  imports: [TranslatePipe, DecimalPipe],
})
export class SeasonSummaryComponent {
  season = input<Season | undefined | null>();
  standings = input<SeasonStandingItem[] | undefined | null>();
  emptyMessage = input<string>("SM_NO_RACES_RUN");
  compact = input<boolean>(false);
  showHeader = input<boolean>(true);

  hasDemoRaces = computed(() => {
    const s = this.season();
    if (!s || !s.races) return false;
    return s.races.some((r) => Boolean(r.is_demo));
  });

  computedStandings = computed(() => {
    const raw = this.standings();
    if (raw !== undefined && raw !== null && raw.length > 0) {
      return raw.map((item: any) => {
        const net = item.net_points ?? item.netPoints ?? 0;
        const gross = item.gross_points ?? item.grossPoints ?? 0;
        const dropped =
          item.dropped_points ??
          item.droppedPoints ??
          Math.round(Math.max(0, gross - net) * 100) / 100;
        return {
          driver_id: item.driver_id ?? item.driverId ?? "",
          driver_name: item.driver_name ?? item.driverName ?? "",
          net_points: net,
          gross_points: gross,
          dropped_points: dropped,
          races_run: item.races_run ?? item.racesRun ?? 0,
          current_race_points:
            item.current_race_points ?? item.currentRacePoints,
          race_scores: item.race_scores ?? item.raceScores ?? [],
        };
      });
    }
    const s = this.season();
    if (!s) return [];
    return calculateSeasonStandings(s);
  });
}
