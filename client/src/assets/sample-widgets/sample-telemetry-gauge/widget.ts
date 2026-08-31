import { Component } from "@angular/core";
import { CustomWidgetBaseComponent } from "@app/components/shared/custom-widget-base/custom-widget-base.component";

@Component({
  standalone: true,
  templateUrl: "./widget.html",
  styleUrls: ["./widget.css"],
})
export class TelemetryGaugeComponent extends CustomWidgetBaseComponent {
  maxRecordedSpeed: number = 0;

  get title(): string {
    return this.getSetting("title", "Telemetry");
  }

  get currentLeaderName(): string {
    const leader = this.driverStandings?.[0];
    return leader?.name || "";
  }

  get headerDisplay(): string {
    const t = this.title;
    const l = this.currentLeaderName;
    if (t && l) return `${t} (${l})`;
    return t || l || "Telemetry";
  }

  get bestLapTime(): number | null {
    const leader = this.driverStandings?.[0];
    return leader?.best_lap_time || null;
  }

  get lastLapTime(): number | null {
    const leader = this.driverStandings?.[0];
    return leader?.last_lap_time || null;
  }

  get simulatedSpeed(): number {
    const last = this.lastLapTime;
    if (!last || last <= 0) return 0;
    // Approximation for sample visual effect
    const speed = Math.min(120, (15 / last) * 10);
    if (speed > this.maxRecordedSpeed) {
      this.maxRecordedSpeed = speed;
    }
    return speed;
  }

  formatSpeed(speed: number): string {
    return (speed || 0).toFixed(1);
  }

  formatMaxSpeed(speed: number): string {
    return Math.round(speed || 0).toString();
  }

  formatLapTime(val: number | null): string {
    return val && val > 0 ? `${val.toFixed(3)}s` : "--.---";
  }
}
