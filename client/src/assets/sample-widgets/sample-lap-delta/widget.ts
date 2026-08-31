import { Component } from "@angular/core";
import { CustomWidgetBaseComponent } from "@app/components/shared/custom-widget-base/custom-widget-base.component";

@Component({
  standalone: true,
  templateUrl: "./widget.html",
  styleUrls: ["./widget.css"],
})
export class LapDeltaComponent extends CustomWidgetBaseComponent {
  get title(): string {
    return this.getSetting("title", "Lap Delta (P1 vs P2)");
  }

  get showMilliseconds(): boolean {
    return this.getSetting("showMilliseconds", true);
  }

  get leader(): any | null {
    return this.driverStandings.length > 0 ? this.driverStandings[0] : null;
  }

  get runnerUp(): any | null {
    return this.driverStandings.length > 1 ? this.driverStandings[1] : null;
  }

  get deltaSeconds(): number | null {
    if (!this.leader || !this.runnerUp) return null;
    const t1 = this.leader.best_lap_time;
    const t2 = this.runnerUp.best_lap_time;
    if (!t1 || !t2 || t1 <= 0 || t2 <= 0) return null;
    return t2 - t1;
  }

  get deltaFormatted(): string {
    const d = this.deltaSeconds;
    const decimals = this.showMilliseconds ? 3 : 2;
    if (d === null) return `+${(0).toFixed(decimals)}s`;
    const sign = d >= 0 ? "+" : "-";
    return `${sign}${Math.abs(d).toFixed(decimals)}s`;
  }

  get deltaColor(): string {
    const d = this.deltaSeconds;
    if (d === null || d === 0) return "#94a3b8";
    return d > 0
      ? this.getSetting("positiveColor", "#22c55e")
      : this.getSetting("negativeColor", "#ef4444");
  }

  formatTime(val: number | null | undefined): string {
    const decimals = this.showMilliseconds ? 3 : 2;
    if (!val || val <= 0) return this.showMilliseconds ? "--.---" : "--.--";
    return `${val.toFixed(decimals)}s`;
  }
}
