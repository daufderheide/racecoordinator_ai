import { CommonModule } from "@angular/common";
import { Component, computed, input, ViewEncapsulation } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

@Component({
  standalone: true,
  selector: "app-raceday-on-deck",
  templateUrl: "./raceday-on-deck.component.html",
  styleUrls: ["./raceday-on-deck.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe, FormsModule],
})
export class RacedayOnDeckComponent {
  track = input<Track | undefined>(undefined);
  currentHeat = input<Heat | undefined>(undefined);
  heats = input<Heat[]>([]);
  parent = input<any>(undefined);

  nextHeatNumber = computed<number>(() => {
    const cur = this.currentHeat();
    return cur ? cur.heatNumber + 1 : 0;
  });

  onDeckDrivers = computed<DriverHeatData[]>(() => {
    const cur = this.currentHeat();
    const hts = this.heats();
    if (!cur || !hts || hts.length === 0) {
      return [];
    }
    const nextHeat = hts.find((h) => h.heatNumber === cur.heatNumber + 1);
    if (!nextHeat || !nextHeat.heatDrivers) {
      return [];
    }
    const currentDriverIds = new Set(
      cur.heatDrivers
        ?.map((d) => d.driver?.objectId || d.driver?.entity_id)
        .filter(Boolean) || [],
    );
    return nextHeat.heatDrivers.filter((hd) => {
      if (!hd.driver || hd.driver.isEmpty()) return false;
      const id = hd.driver.objectId || hd.driver.entity_id;
      return id && !currentDriverIds.has(id);
    });
  });

  isTeam(hd: DriverHeatData): boolean {
    return this.parent()?.isTeam(hd) ?? false;
  }

  getTeammates(hd: DriverHeatData): any[] {
    return this.parent()?.getTeammates(hd) ?? [];
  }

  getDropdownArrowBg(hd: DriverHeatData): string {
    if (!this.parent()) return "";
    const color = this.getLaneForegroundColor(hd.laneIndex);
    return this.parent().getDropdownIcon(color);
  }

  getDriverStats(hd: DriverHeatData, driverId: string): string {
    return this.parent()?.getDriverStats(hd, driverId) ?? "";
  }

  onTeammateChange(hd: DriverHeatData, event: any) {
    const nextHeatNum = this.nextHeatNumber();
    if (this.parent() && nextHeatNum > 0) {
      this.parent().onNextHeatTeammateChange(hd, event, nextHeatNum);
    }
  }

  getLaneBackgroundColor(laneIndex: number): string {
    return this.track()?.lanes?.[laneIndex]?.background_color || "#333333";
  }

  getLaneForegroundColor(laneIndex: number): string {
    return this.track()?.lanes?.[laneIndex]?.foreground_color || "#ffffff";
  }

  trackByDriver(index: number, hd: DriverHeatData): string {
    return hd.driver?.objectId || hd.driver?.entity_id || String(index);
  }
}
