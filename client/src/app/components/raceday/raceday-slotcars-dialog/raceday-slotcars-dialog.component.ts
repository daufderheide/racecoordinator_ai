import { Component, computed, input, output } from "@angular/core";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { carLabel } from "@app/components/shared/car-pick-dialog/car-pick-dialog.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { PreviewBadgeComponent } from "@app/components/shared/preview-badge/preview-badge.component";
import { Car } from "@app/models/car";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

export interface SlotcarSwap {
  lane: number;
  carId: string;
}

interface LaneRow {
  lane: number;
  color: string;
  name: string;
  carId: string;
}

/**
 * Race day "Slotcars…" (#1210): the coming heat, lane by lane, with the car
 * each racer will use. Changing one swaps it straight away; between heats
 * only, so a heat that ran keeps its car in the results.
 */
@Component({
  standalone: true,
  selector: "app-raceday-slotcars-dialog",
  templateUrl: "./raceday-slotcars-dialog.component.html",
  styleUrls: [
    "../../shared/car-pick-dialog/car-pick-dialog.component.css",
    "./raceday-slotcars-dialog.component.css",
  ],
  imports: [
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
    PreviewBadgeComponent,
  ],
})
export class RacedaySlotcarsDialogComponent {
  visible = input(false);
  heat = input<Heat | undefined>(undefined);
  track = input<Track | undefined>(undefined);
  cars = input<Car[]>([]);
  /** A heat is counting down, racing or paused: no swaps now. */
  locked = input(false);
  /** IROC (#1210): the cars stay in their lanes; rows are lanes, with the lane's car. */
  lanesMode = input(false);
  laneCars = input<(Car | undefined)[]>([]);

  swap = output<SlotcarSwap>();
  close = output<void>();

  sortedCars = computed(() =>
    [...this.cars()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
  );

  rows = computed<LaneRow[]>(() => {
    const lanes = this.lanesMode();
    return (this.heat()?.heatDrivers || [])
      .filter((hd) => lanes || !this.isEmptyLane(hd))
      .map((hd) => ({
        lane: hd.laneIndex,
        color: this.track()?.lanes?.[hd.laneIndex]?.background_color || "",
        name: this.isEmptyLane(hd) ? "" : this.racerName(hd),
        // In lanes mode the lane's car right now: after a heat has run, its
        // own copy keeps the old car while a swap is for the next heats.
        carId: lanes
          ? this.laneCars()[hd.laneIndex]?.entity_id || ""
          : hd.car?.entity_id || "",
      }));
  });

  label(car: Car): string {
    return carLabel(car);
  }

  onSwap(row: LaneRow, carId: string): void {
    if (this.locked() || (carId || "") === row.carId) return;
    this.swap.emit({ lane: row.lane, carId: carId || "" });
  }

  onClose(): void {
    this.close.emit();
  }

  private isEmptyLane(hd: DriverHeatData): boolean {
    return RacedayFormatUtils.isEmptyDriver(hd);
  }

  /** "Team (driver on the lane)" for a team, else the driver's name. */
  private racerName(hd: DriverHeatData): string {
    const team = hd.participant?.team;
    const driver = hd.actualDriver ?? hd.participant?.driver;
    if (team && driver && driver.name && driver.name !== team.name) {
      return `${team.name} (${driver.name})`;
    }
    return team?.name || driver?.name || "";
  }
}
