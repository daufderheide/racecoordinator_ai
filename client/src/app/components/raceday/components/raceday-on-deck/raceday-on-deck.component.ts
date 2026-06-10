import { CommonModule } from "@angular/common";
import { Component, computed, input, ViewEncapsulation } from "@angular/core";
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
  imports: [CommonModule, TranslatePipe],
})
export class RacedayOnDeckComponent {
  track = input<Track | undefined>(undefined);
  currentHeat = input<Heat | undefined>(undefined);
  heats = input<Heat[]>([]);

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
