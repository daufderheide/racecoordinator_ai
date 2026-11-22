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
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { PreviewBadgeComponent } from "@app/components/shared/preview-badge/preview-badge.component";
import { Car } from "@app/models/car";
import { CarChoice, emptyCarChoice } from "@app/models/car-choice";
import { TranslatePipe } from "@app/pipes/translate.pipe";

export interface CarPickDriver {
  id: string;
  name: string;
}

/** A car's name with its class and scale, for the pick lists. */
export function carLabel(car: Car): string {
  const extra = [car.carClass, car.scale].filter(Boolean).join(" · ");
  return extra ? `${car.name} (${extra})` : car.name;
}

/**
 * Picks the slotcar(s) for one roster entry (#1210). A solo driver gets one
 * list. A team picks one car for the team or a car per driver. In "single"
 * mode (the race-day swap) it is always one list.
 */
@Component({
  standalone: true,
  selector: "app-car-pick-dialog",
  templateUrl: "./car-pick-dialog.component.html",
  styleUrls: ["./car-pick-dialog.component.css"],
  imports: [
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
    PreviewBadgeComponent,
  ],
})
export class CarPickDialogComponent {
  visible = input(false);
  entryName = input("");
  cars = input<Car[]>([]);
  teamDrivers = input<CarPickDriver[]>([]);
  choice = input<CarChoice>(emptyCarChoice());
  mode = input<"entry" | "single">("entry");

  save = output<CarChoice>();
  close = output<void>();

  private host = inject(ElementRef);

  /** The choice being edited; copied from the input each time the dialog opens. */
  draft: CarChoice = emptyCarChoice();

  sortedCars = computed(() =>
    [...this.cars()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
  );

  isTeam = computed(
    () => this.mode() === "entry" && this.teamDrivers().length > 0,
  );

  private wasVisible = false;

  constructor() {
    // Copy the pick only when the dialog opens: a host may hand in a new
    // (equal) choice object on every change detection, which must not wipe
    // what is being picked.
    effect(() => {
      const visible = this.visible();
      const opening = visible && !this.wasVisible;
      this.wasVisible = visible;
      if (opening) {
        const c = untracked(() => this.choice()) || emptyCarChoice();
        this.draft = {
          carId: c.carId || "",
          carPerDriver:
            untracked(() => this.isTeam()) && c.carPerDriver === true,
          driverCars: { ...(c.driverCars || {}) },
        };
        // Keys typed after opening go to the dialog, not to what is behind it.
        setTimeout(() =>
          (
            this.host.nativeElement.querySelector(
              "#car-pick-save",
            ) as HTMLElement | null
          )?.focus(),
        );
      }
    });
  }

  label(car: Car): string {
    return carLabel(car);
  }

  setPerDriver(perDriver: boolean): void {
    this.draft = { ...this.draft, carPerDriver: perDriver };
  }

  setCar(carId: string): void {
    this.draft = { ...this.draft, carId: carId || "" };
  }

  setDriverCar(driverId: string, carId: string): void {
    const driverCars = { ...this.draft.driverCars };
    if (carId) driverCars[driverId] = carId;
    else delete driverCars[driverId];
    this.draft = { ...this.draft, driverCars };
  }

  driverCar(driverId: string): string {
    return this.draft.driverCars[driverId] || "";
  }

  onSave(): void {
    const d = this.draft;
    this.save.emit(
      d.carPerDriver
        ? { carId: "", carPerDriver: true, driverCars: { ...d.driverCars } }
        : { carId: d.carId, carPerDriver: false, driverCars: {} },
    );
  }

  onClose(): void {
    this.close.emit();
  }
}
