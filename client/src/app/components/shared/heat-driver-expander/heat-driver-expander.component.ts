/* eslint-disable no-restricted-syntax */
import { CommonModule, DecimalPipe } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DriverConverter } from "@app/converters/driver.converter";
import { RaceParticipant } from "@app/models/race_participant";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

export interface HeatStandingsRow {
  rank: number;
  objectId: string;
  laps: number;
  averageLapTime: number;
  medianLapTime: number;
  bestLapTime: number;
  totalTime: number;
  gap1st: number | null;
  gapAhead: number | null;
  reactionTime: number;
}

export interface HeatExpanderData {
  heat: Heat;
  heatDriver: DriverHeatData;
  row: HeatStandingsRow;
  laneColor: { foreground: string; background: string; name: string };
  maxLapTime: number;
  driverName?: string;
}

@Component({
  selector: "app-heat-driver-expander",
  standalone: true,
  imports: [CommonModule, DecimalPipe, TranslatePipe],
  templateUrl: "./heat-driver-expander.component.html",
  styleUrls: ["./heat-driver-expander.component.css"],
})
export class HeatDriverExpanderComponent {
  @Input() heatData!: HeatExpanderData;
  @Input() isExpanded = false;
  @Input() isTeam = false;
  @Input() participants: RaceParticipant[] = [];
  @Input() allHeats: Heat[] = [];
  @Input() customStatsTitle?: string;
  @Input() isGroupRace = false;

  @Output() toggle = new EventEmitter<void>();

  activeTooltip: {
    lap: any;
    lapIdx: number;
    left: number;
    top: number;
    heatId: string;
  } | null = null;

  get dh(): HeatExpanderData {
    return this.heatData;
  }

  onToggle() {
    this.toggle.emit();
  }

  showTooltip(event: MouseEvent, lap: any, lapIdx: number, heatId: string) {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();

    let containerLeft = 0;
    let containerTop = 0;

    // The tooltip is positioned inside .lap-chart-box, which has position: relative.
    // So its left and top CSS properties must be relative to .lap-chart-box.
    const container = el.closest(".lap-chart-box");
    if (container) {
      const containerRect = container.getBoundingClientRect();
      containerLeft = containerRect.left;
      containerTop = containerRect.top;
    }

    this.activeTooltip = {
      lap,
      lapIdx,
      left: rect.left + rect.width / 2 - containerLeft,
      top: rect.top - containerTop,
      heatId,
    };
  }

  hideTooltip() {
    this.activeTooltip = null;
  }

  getLapBarHeight(time: number, maxLapTime: number): number {
    if (!maxLapTime || time <= 0) return 0;
    const minHeight = 10;

    if (time >= maxLapTime) return 100;

    return (
      minHeight +
      Math.min((time / maxLapTime) * (100 - minHeight), 100 - minHeight)
    );
  }

  getSegmentColor(segIdx: number): string {
    const colors = [
      "#00e5ff", // Cyan
      "#d500f9", // Magenta
      "#ff9100", // Amber
      "#00e676", // Green
      "#ff3d00", // Deep Orange
      "#ffd600", // Yellow
      "#2979ff", // Light Blue
    ];
    return colors[segIdx % colors.length];
  }

  getDriverName(driverId: string): string {
    if (!driverId) return "";
    const cached = DriverConverter.get(driverId);
    if (cached) return cached.nickname || cached.name;
    const p = this.participants.find(
      (curr) => curr.driver && curr.driver.entity_id === driverId,
    );
    if (p && p.driver) return p.driver.nickname || p.driver.name;
    for (const heat of this.allHeats) {
      if (heat.heatDrivers) {
        const hd = heat.heatDrivers.find(
          (d) =>
            (d.driver && d.driver.entity_id === driverId) ||
            (d.actualDriver && d.actualDriver.entity_id === driverId),
        );
        if (hd) {
          if (hd.actualDriver && hd.actualDriver.entity_id === driverId) {
            return hd.actualDriver.nickname || hd.actualDriver.name;
          }
          if (hd.driver && hd.driver.entity_id === driverId) {
            return hd.driver.nickname || hd.driver.name;
          }
        }
      }
    }
    return driverId;
  }
}
