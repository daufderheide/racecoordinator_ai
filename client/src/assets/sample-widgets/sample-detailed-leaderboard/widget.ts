import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CustomWidgetBaseComponent } from "@app/components/shared/custom-widget-base/custom-widget-base.component";

export interface LeaderboardColumn {
  id: string;
  header: string;
  metric: string;
  color: string;
  cssClass: string;
}

export interface MetricCell {
  text: string;
  color?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule],
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
    return this.getSetting(
      "col6Color",
      this.getSetting("bestLapColor", "#38bdf8"),
    );
  }

  get avgLapColor(): string {
    return this.getSetting(
      "col7Color",
      this.getSetting("avgLapColor", "#f59e0b"),
    );
  }

  get configuredColumns(): LeaderboardColumn[] {
    const colKeys = [
      "col3Metric",
      "col4Metric",
      "col5Metric",
      "col6Metric",
      "col7Metric",
    ];
    const colorKeys = [
      "col3Color",
      "col4Color",
      "col5Color",
      "col6Color",
      "col7Color",
    ];
    const defaults = [
      "totalTime",
      "totalLaps",
      "gapLeader",
      "bestLapTime",
      "averageLapTime",
    ];
    const defaultColors = [
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#38bdf8",
      "#f59e0b",
    ];
    const cols: LeaderboardColumn[] = [];

    for (let i = 0; i < colKeys.length; i++) {
      let metric = this.getSetting(colKeys[i], defaults[i]);
      // Backward compatibility fallback for boolean toggles
      if (i === 0 && !this.showTime && metric === "totalTime") metric = "none";
      if (
        i === 2 &&
        !this.showGap &&
        (metric === "gapLeader" || metric === "gapPosition")
      ) {
        metric = "none";
      }
      if (i === 3 && !this.showBestLap && metric === "bestLapTime")
        metric = "none";
      if (
        i === 4 &&
        !this.showAvgLap &&
        (metric === "averageLapTime" || metric === "medianLapTime")
      ) {
        metric = "none";
      }

      if (metric && metric !== "none") {
        let fallbackColor = defaultColors[i];
        if (i === 3 && this.getSetting("bestLapColor", "")) {
          fallbackColor = this.getSetting("bestLapColor", "");
        } else if (i === 4 && this.getSetting("avgLapColor", "")) {
          fallbackColor = this.getSetting("avgLapColor", "");
        }
        const color = this.getSetting(colorKeys[i], fallbackColor);

        cols.push({
          id: `col-${i + 3}`,
          header: this.getColumnHeader(metric),
          metric,
          color,
          cssClass: this.getColumnCssClass(metric),
        });
      }
    }
    return cols;
  }

  getColumnHeader(metric: string): string {
    switch (metric) {
      case "totalTime":
        return "Time";
      case "totalLaps":
        return "Laps";
      case "gapLeader":
        return "Gap";
      case "gapPosition":
        return "Gap Ahead";
      case "bestLapTime":
        return "Best Lap";
      case "lastLapTime":
        return "Last Lap";
      case "averageLapTime":
        return "Avg Lap";
      case "medianLapTime":
        return "Median Lap";
      case "lane":
        return "Lane";
      default:
        return metric;
    }
  }

  getColumnCssClass(metric: string): string {
    switch (metric) {
      case "totalTime":
        return "col-time";
      case "totalLaps":
        return "col-laps";
      case "gapLeader":
      case "gapPosition":
        return "col-gap";
      case "bestLapTime":
        return "col-best";
      case "lastLapTime":
        return "col-last";
      case "averageLapTime":
        return "col-avg";
      case "medianLapTime":
        return "col-median";
      case "lane":
        return "col-lane";
      default:
        return "col-metric";
    }
  }

  formatMetric(
    metric: string,
    driver: any,
    index: number,
    list: any[],
    columnColor?: string,
  ): MetricCell {
    if (!driver || driver.isEmpty) return { text: "" };
    switch (metric) {
      case "totalTime":
        return {
          text: this.formatTotalTime(driver.totalTime),
          color: columnColor,
        };
      case "totalLaps":
        return {
          text: this.formatLaps(
            driver.lapCount !== undefined ? driver.lapCount : driver.totalLaps,
          ),
          color: columnColor,
        };
      case "gapLeader":
      case "gapPosition":
        return {
          text: this.formatGap(driver, index, list, metric),
          color: columnColor,
        };
      case "bestLapTime":
        return {
          text: this.formatLapTime(driver.bestLapTime),
          color:
            driver.bestLapTime > 0
              ? columnColor || this.bestLapColor
              : undefined,
        };
      case "lastLapTime":
        return {
          text: this.formatLapTime(driver.lastLapTime),
          color: columnColor,
        };
      case "averageLapTime":
        return {
          text: this.formatLapTime(driver.averageLapTime),
          color:
            driver.averageLapTime > 0
              ? columnColor || this.avgLapColor
              : undefined,
        };
      case "medianLapTime":
        return {
          text: this.formatLapTime(driver.medianLapTime),
          color: columnColor,
        };
      case "lane":
        return {
          text:
            driver.lane !== undefined && driver.lane !== null
              ? `${driver.lane}`
              : "--",
          color: columnColor,
        };
      default:
        return { text: "--", color: columnColor };
    }
  }

  get displayRows(): any[] {
    const rawStandings = this.driverStandings || [];
    const count = this.maxRows > 0 ? this.maxRows : rawStandings.length;
    const columns = this.configuredColumns;
    const rows: any[] = [];

    for (let i = 0; i < count; i++) {
      if (i < rawStandings.length) {
        const d = rawStandings[i];
        const cells = columns.map((col) =>
          this.formatMetric(col.metric, d, i, rawStandings, col.color),
        );
        rows.push({
          position: d.rank || i + 1,
          name: d.name || "Driver",
          cells,
          timeFormatted: this.formatTotalTime(d.totalTime),
          laps: this.formatLaps(
            d.lapCount !== undefined ? d.lapCount : d.totalLaps || 0,
          ),
          gapFormatted: this.formatGap(d, i, rawStandings),
          bestLapFormatted: this.formatLapTime(d.bestLapTime),
          avgLapFormatted: this.formatLapTime(d.averageLapTime),
          isEmpty: false,
        });
      } else {
        const emptyCells = columns.map(() => ({ text: "" }));
        rows.push({
          position: i + 1,
          name: "",
          cells: emptyCells,
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
    if (time === undefined || time === null || isNaN(Number(time)))
      return "0.000";
    return Number(time).toFixed(3);
  }

  formatLaps(laps: number | undefined): string {
    if (laps === undefined || laps === null || isNaN(Number(laps)))
      return "0.00";
    return Number(laps).toFixed(2);
  }

  formatGap(
    d: any,
    index: number,
    list: any[],
    preferredMetric?: string,
  ): string {
    if (index === 0) return "";

    const gapPos = d.gapPosition !== undefined ? d.gapPosition : d.gap_position;
    const gapLead = d.gapLeader !== undefined ? d.gapLeader : d.gap_leader;
    const totTime = d.totalTime !== undefined ? d.totalTime : d.total_time;

    if (preferredMetric === "gapPosition") {
      if (gapPos !== undefined && gapPos !== 0) {
        const g = Number(gapPos);
        return g > 0 ? `+${g.toFixed(3)}` : g.toFixed(3);
      }
    } else {
      if (gapLead !== undefined && gapLead !== 0) {
        const g = Number(gapLead);
        return g > 0 ? `+${g.toFixed(3)}` : g.toFixed(3);
      }
    }

    if (gapPos !== undefined && gapPos !== 0) {
      const g = Number(gapPos);
      return g > 0 ? `+${g.toFixed(3)}` : g.toFixed(3);
    }
    if (gapLead !== undefined && gapLead !== 0) {
      const g = Number(gapLead);
      return g > 0 ? `+${g.toFixed(3)}` : g.toFixed(3);
    }

    const prev = list[index - 1];
    const prevTime =
      prev && (prev.totalTime !== undefined ? prev.totalTime : prev.total_time);
    if (prevTime !== undefined && totTime !== undefined) {
      const delta = Number(totTime) - Number(prevTime);
      if (delta !== 0) {
        return delta > 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3);
      }
    }

    if (
      (d.lapCount === 0 || d.lapCount === undefined) &&
      (d.totalLaps === 0 || d.total_laps === 0)
    ) {
      return "--";
    }

    return "--";
  }

  formatLapTime(val: number | undefined): string {
    if (!val || val <= 0 || isNaN(Number(val))) return "--";
    return Number(val).toFixed(3);
  }
}
