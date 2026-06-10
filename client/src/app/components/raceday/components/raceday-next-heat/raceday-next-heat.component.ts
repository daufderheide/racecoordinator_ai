import { CommonModule } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

@Component({
  standalone: true,
  selector: "app-raceday-next-heat",
  templateUrl: "./raceday-next-heat.component.html",
  styleUrls: ["./raceday-next-heat.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayNextHeatComponent {
  @Input() track?: Track;
  @Input() currentHeat?: Heat;
  @Input() heats: Heat[] = [];

  get nextHeatDrivers(): DriverHeatData[] {
    if (!this.currentHeat || !this.heats || this.heats.length === 0) {
      return [];
    }
    const nextHeat = this.heats.find(
      (h) => h.heatNumber === this.currentHeat!.heatNumber + 1,
    );
    if (!nextHeat || !nextHeat.heatDrivers) {
      return [];
    }
    return nextHeat.heatDrivers.filter((hd) => {
      return hd.driver && !hd.driver.isEmpty();
    });
  }

  getLaneBackgroundColor(laneIndex: number): string {
    return this.track?.lanes?.[laneIndex]?.background_color || "#333333";
  }

  getLaneForegroundColor(laneIndex: number): string {
    return this.track?.lanes?.[laneIndex]?.foreground_color || "#ffffff";
  }

  trackByDriver(index: number, hd: DriverHeatData): string {
    return hd.driver?.objectId || hd.driver?.entity_id || String(index);
  }
}
