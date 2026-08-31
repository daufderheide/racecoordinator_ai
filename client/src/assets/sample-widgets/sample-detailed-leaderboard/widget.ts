import { Component } from "@angular/core";
import { CustomWidgetBaseComponent } from "@app/components/shared/custom-widget-base/custom-widget-base.component";

@Component({
  standalone: true,
  templateUrl: "./widget.html",
  styleUrls: ["./widget.css"],
})
export class DetailedLeaderboardComponent extends CustomWidgetBaseComponent {
  get title(): string {
    return this.getSetting("title", "");
  }

  get maxRows(): number {
    return this.getSetting("maxRows", 0);
  }

  get showTime(): boolean {
    return this.getSetting("showTime", true);
  }

  get showGap(): boolean {
    return this.getSetting("showGap", true);
  }

  get showBestLap(): boolean {
    return this.getSetting("showBestLap", true);
  }

  get showAvgLap(): boolean {
    return this.getSetting("showAvgLap", true);
  }

  get bestLapColor(): string {
    return this.getSetting("bestLapColor", "#38bdf8");
  }

  get avgLapColor(): string {
    return this.getSetting("avgLapColor", "#f59e0b");
  }

  get displayRows(): any[] {
    const rawStandings = this.driverStandings || [];
    const count = this.maxRows > 0 ? this.maxRows : rawStandings.length;
    const rows: any[] = [];

    for (let i = 0; i < count; i++) {
      if (i < rawStandings.length) {
        const d = rawStandings[i];
        rows.push({
          position: d.rank || i + 1,
          name: d.name || "Driver",
          timeFormatted: this.formatTotalTime(d.total_time),
          laps: d.lapCount !== undefined ? d.lapCount : d.total_laps || 0,
          gapFormatted: this.formatGap(d, i, rawStandings),
          bestLapFormatted: this.formatLapTime(d.best_lap_time),
          avgLapFormatted: this.formatLapTime(
            d.avg_lap_time || d.average_lap_time,
          ),
          isEmpty: false,
        });
      } else {
        rows.push({
          position: i + 1,
          name: "",
          timeFormatted: "",
          laps: "",
          gapFormatted: "",
          bestLapFormatted: "",
          avgLapFormatted: "",
          isEmpty: true,
        });
      }
    }

    return rows;
  }

  formatTotalTime(time: number | undefined): string {
    if (time === undefined || time === null) return "0.00";
    return Number(time).toFixed(2);
  }

  formatGap(d: any, index: number, list: any[]): string {
    if (index === 0) return "";

    if (d.gap_position !== undefined && d.gap_position !== 0) {
      const g = Number(d.gap_position);
      return g > 0 ? `+${g.toFixed(2)}` : g.toFixed(2);
    }

    if (d.gap_leader !== undefined && d.gap_leader !== 0) {
      const g = Number(d.gap_leader);
      return g > 0 ? `+${g.toFixed(2)}` : g.toFixed(2);
    }

    const prev = list[index - 1];
    if (prev && prev.total_time !== undefined && d.total_time !== undefined) {
      const delta = Number(d.total_time) - Number(prev.total_time);
      if (delta !== 0) {
        return delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      }
    }

    if (d.lapCount === 0 || d.total_laps === 0) {
      return "--";
    }

    return "--";
  }

  formatLapTime(val: number | undefined): string {
    if (!val || val <= 0) return "--";
    return Number(val).toFixed(3);
  }
}
