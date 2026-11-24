import { carLabel } from "@app/components/shared/car-pick-dialog/car-pick-dialog.component";
import { Car } from "@app/models/car";

/**
 * Helpers to show the slotcar on the results pages (step 5 of #1210).
 * The car comes from each heat's snapshot, so it is the car as it ran.
 */

/** The cars in the order they were first used, one per car (the last snapshot wins). */
export function uniqueCars(cars: (Car | undefined | null)[]): Car[] {
  // A Map keeps the position of a key's first set, so a later snapshot of
  // the same car replaces the value without moving it.
  const byId = new Map<string, Car>();
  for (const car of cars) {
    if (car) byId.set(car.entity_id || car.name, car);
  }
  return [...byId.values()];
}

/** The car's name, class and scale, then its setup: motor, magnet, gears, tyres. */
export function carTooltip(car: Car): string {
  const setup = [car.motor, car.magnet, car.gears, car.tyres]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(" · ");
  return setup ? `${carLabel(car)}\n${setup}` : carLabel(car);
}

/** One line per car, for a tooltip on a list of cars. */
export function carsTooltip(cars: Car[]): string {
  return cars.map((c) => carLabel(c)).join("\n");
}
