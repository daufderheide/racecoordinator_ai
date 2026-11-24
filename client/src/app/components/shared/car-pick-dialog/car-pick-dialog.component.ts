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

/** Above this many cars the dialog shows a search box. */
const SEARCH_FROM = 7;

/**
 * Picks the slotcar(s) for one roster entry (#1210). The cars are a list with
 * their picture, class and scale (#1251). A team picks one car for the team or
 * a car per driver; then the driver tabs choose whose car the list sets. In
 * "single" mode (the race-day swap) it is always one car.
 *
 * Cars in takenBy (car id → the entry that has it) are greyed out, and so is a
 * car another driver of the same team already has: one car races for one
 * entry or driver.
 */
@Component({
  standalone: true,
  selector: "app-car-pick-dialog",
  templateUrl: "./car-pick-dialog.component.html",
  styleUrls: ["./car-pick-dialog.component.css"],
  imports: [FormsModule, TranslatePipe, PreviewBadgeComponent],
})
export class CarPickDialogComponent {
  visible = input(false);
  entryName = input("");
  cars = input<Car[]>([]);
  teamDrivers = input<CarPickDriver[]>([]);
  choice = input<CarChoice>(emptyCarChoice());
  mode = input<"entry" | "single">("entry");
  /** Cars that other entries already have: car id → entry name. */
  takenBy = input<Record<string, string>>({});
  /** Prefix for car pictures stored on the server ("/assets/…"). */
  serverUrl = input("");

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

  /** In "a car per driver": the driver whose car the list sets. */
  activeDriverId = "";
  search = "";
  private brokenImages = new Set<string>();

  showSearch = computed(() => this.cars().length >= SEARCH_FROM);

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
        this.activeDriverId = untracked(() => this.teamDrivers())[0]?.id || "";
        this.search = "";
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

  /** The cars matching the search (name, brand, class or scale). */
  visibleCars(): Car[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.sortedCars();
    return this.sortedCars().filter((car) =>
      [car.name, car.brand, car.carClass, car.scale].some((v) =>
        (v || "").toLowerCase().includes(q),
      ),
    );
  }

  /** The car the list shows as picked: the entry's, or the active driver's. */
  selectedId(): string {
    return this.draft.carPerDriver
      ? this.driverCar(this.activeDriverId)
      : this.draft.carId;
  }

  pick(carId: string): void {
    if (carId && this.usedBy(carId)) return;
    if (this.draft.carPerDriver) this.setDriverCar(this.activeDriverId, carId);
    else this.setCar(carId);
  }

  /**
   * Who already has this car, or "": another entry in the race, or (a car per
   * driver) a team mate. The car picked right now is never greyed out.
   */
  usedBy(carId: string): string {
    if (!carId || carId === this.selectedId()) return "";
    if (this.draft.carPerDriver) {
      const mate = this.teamDrivers().find(
        (d) => d.id !== this.activeDriverId && this.driverCar(d.id) === carId,
      );
      if (mate) return mate.name;
    }
    return this.takenBy()[carId] || "";
  }

  /** Class and scale under the car's name. */
  meta(car: Car): string {
    return [car.carClass, car.scale].filter(Boolean).join(" · ");
  }

  carName(carId: string): string {
    return this.cars().find((c) => c.entity_id === carId)?.name || "";
  }

  imageUrl(car: Car): string {
    const url = car.avatarUrl || "";
    if (!url || this.brokenImages.has(car.entity_id)) return "";
    return url.startsWith("/") ? `${this.serverUrl()}${url}` : url;
  }

  onImageError(car: Car): void {
    this.brokenImages.add(car.entity_id);
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
