import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  untracked,
} from "@angular/core";
import { carLabel } from "@app/components/shared/car-pick-dialog/car-pick-dialog.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { PreviewBadgeComponent } from "@app/components/shared/preview-badge/preview-badge.component";
import { Car } from "@app/models/car";
import { TranslatePipe } from "@app/pipes/translate.pipe";

/** One track lane in the dialog: its index and background colour. */
export interface LaneCarLane {
  lane: number;
  color: string;
}

/**
 * Picks the car for each lane when the cars stay in their lanes (IROC,
 * #1210). Used in Race Day Setup before heat 1; the result is one car id per
 * lane, "" for a lane without a car.
 */
@Component({
  standalone: true,
  selector: "app-lane-cars-dialog",
  templateUrl: "./lane-cars-dialog.component.html",
  styleUrls: [
    "../car-pick-dialog/car-pick-dialog.component.css",
    "./lane-cars-dialog.component.css",
  ],
  imports: [
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
    PreviewBadgeComponent,
  ],
})
export class LaneCarsDialogComponent {
  visible = input(false);
  lanes = input<LaneCarLane[]>([]);
  cars = input<Car[]>([]);
  laneCarIds = input<string[]>([]);

  save = output<string[]>();
  close = output<void>();

  private host = inject(ElementRef);

  /** The picks being edited, one per lane; copied each time the dialog opens. */
  draft: string[] = [];

  sortedCars = computed(() =>
    [...this.cars()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
  );

  private wasVisible = false;

  constructor() {
    effect(() => {
      const visible = this.visible();
      const opening = visible && !this.wasVisible;
      this.wasVisible = visible;
      if (opening) {
        const ids = untracked(() => this.laneCarIds()) || [];
        this.draft = untracked(() => this.lanes()).map(
          (l) => ids[l.lane] || "",
        );
        setTimeout(() =>
          (
            this.host.nativeElement.querySelector(
              "#lane-cars-save",
            ) as HTMLElement | null
          )?.focus(),
        );
      }
    });
  }

  label(car: Car): string {
    return carLabel(car);
  }

  carFor(index: number): string {
    return this.draft[index] || "";
  }

  setCar(index: number, carId: string): void {
    const next = [...this.draft];
    next[index] = carId || "";
    this.draft = next;
  }

  onSave(): void {
    this.save.emit([...this.draft]);
  }

  onClose(): void {
    this.close.emit();
  }
}
