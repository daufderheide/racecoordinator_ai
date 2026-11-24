import { Component, computed, input, output, signal } from "@angular/core";
import {
  LaneCarLane,
  LaneCarsDialogComponent,
} from "@app/components/shared/lane-cars-dialog/lane-cars-dialog.component";
import { Car } from "@app/models/car";
import { TranslatePipe } from "@app/pipes/translate.pipe";

/** One lane in the bar: index, colour and the car's name ("" = no car). */
export interface LaneCarRow {
  lane: number;
  color: string;
  name: string;
}

/**
 * Race Day Setup, cars stay in their lanes (IROC, #1210): the car on each
 * lane under the Racing list. A click opens the lane cars dialog; saving it
 * hands the car id per lane to the host.
 */
@Component({
  standalone: true,
  selector: "app-lane-cars-bar",
  templateUrl: "./lane-cars-bar.component.html",
  styleUrls: ["./lane-cars-bar.component.css"],
  imports: [TranslatePipe, LaneCarsDialogComponent],
})
export class LaneCarsBarComponent {
  lanes = input<LaneCarLane[]>([]);
  cars = input<Car[]>([]);
  laneCarIds = input<string[]>([]);

  save = output<string[]>();

  dialogOpen = signal(false);

  rows = computed<LaneCarRow[]>(() => {
    const ids = this.laneCarIds();
    const cars = this.cars();
    return this.lanes().map((l) => ({
      ...l,
      name: cars.find((c) => c.entity_id === ids[l.lane])?.name || "",
    }));
  });

  onSave(ids: string[]): void {
    this.dialogOpen.set(false);
    this.save.emit(ids);
  }
}
