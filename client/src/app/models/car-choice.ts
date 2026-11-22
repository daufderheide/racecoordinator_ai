import { IParticipantCarChoice } from "@app/proto/antigravity";

import { Car } from "./car";

/**
 * The slotcar(s) picked for one roster entry (#1210). A solo driver or a team
 * sharing one car uses carId; a team with a car per driver uses driverCars
 * (driver id → car id). An empty id means no car.
 */
export interface CarChoice {
  carId: string;
  carPerDriver: boolean;
  driverCars: Record<string, string>;
}

export function emptyCarChoice(): CarChoice {
  return { carId: "", carPerDriver: false, driverCars: {} };
}

/** A stored choice with only the cars that still exist. */
export function cleanCarChoice(
  raw: Partial<CarChoice> | null | undefined,
  cars: Car[],
): CarChoice {
  const exists = (id: string | undefined) =>
    !!id && cars.some((c) => c.entity_id === id);
  const driverCars: Record<string, string> = {};
  for (const [driverId, carId] of Object.entries(raw?.driverCars || {})) {
    if (exists(carId)) driverCars[driverId] = carId;
  }
  return {
    carId: exists(raw?.carId) ? (raw!.carId as string) : "",
    carPerDriver: raw?.carPerDriver === true,
    driverCars,
  };
}

export function hasAnyCar(choice: CarChoice | undefined): boolean {
  if (!choice) return false;
  return choice.carPerDriver
    ? Object.values(choice.driverCars).some(Boolean)
    : !!choice.carId;
}

/** What the server gets at race start for one entry. */
export function toCarChoiceProto(
  participantId: string,
  choice: CarChoice,
): IParticipantCarChoice {
  return {
    participantId,
    carId: choice.carPerDriver ? "" : choice.carId,
    carPerDriver: choice.carPerDriver,
    driverCars: choice.carPerDriver
      ? Object.entries(choice.driverCars)
          .filter(([, carId]) => !!carId)
          .map(([driverId, carId]) => ({ driverId, carId }))
      : [],
  };
}

type CarHolder = {
  car?: Car;
  carPerDriver?: boolean;
  driverCars?: { driverId: string; car: Car }[];
};

/** A racer's cars as a pick (car ids), for the pick dialog. */
export function choiceFromParticipant(p: CarHolder | undefined): CarChoice {
  const driverCars: Record<string, string> = {};
  for (const dc of p?.driverCars || []) {
    if (dc.car?.entity_id) driverCars[dc.driverId] = dc.car.entity_id;
  }
  return {
    carId: p?.car?.entity_id || "",
    carPerDriver: p?.carPerDriver === true,
    driverCars,
  };
}

/**
 * Puts a pick on a racer, with the whole car from the Slotcar database. A car
 * that isn't in the list (deleted meanwhile) is kept as it was on the racer.
 */
export function applyChoiceToParticipant(
  p: CarHolder,
  choice: CarChoice,
  cars: Car[],
): void {
  const find = (id: string, keep?: Car) =>
    cars.find((c) => c.entity_id === id) ||
    (keep && keep.entity_id === id ? keep : undefined);
  p.carPerDriver = choice.carPerDriver;
  if (choice.carPerDriver) {
    p.car = undefined;
    p.driverCars = Object.entries(choice.driverCars)
      .map(([driverId, carId]) => {
        const old = p.driverCars?.find((dc) => dc.driverId === driverId)?.car;
        const car = carId ? find(carId, old) : undefined;
        return car ? { driverId, car } : null;
      })
      .filter(Boolean) as { driverId: string; car: Car }[];
  } else {
    p.car = choice.carId ? find(choice.carId, p.car) : undefined;
    p.driverCars = [];
  }
}

/** The car name(s) of a racer, for a list row; "" for no car. */
export function participantCarSummary(p: CarHolder | undefined): string {
  if (!p) return "";
  if (p.carPerDriver) {
    const names = (p.driverCars || [])
      .map((dc) => dc.car?.name)
      .filter(Boolean);
    return [...new Set(names)].join(" / ");
  }
  return p.car?.name || "";
}

/** A team's drivers (id and name), for "a car per driver". */
export function teamCarDrivers(
  driverIds: string[] | undefined,
  allDrivers: { entity_id: string; name: string }[],
): { id: string; name: string }[] {
  return (driverIds || [])
    .map((id) => allDrivers.find((d) => d.entity_id === id))
    .filter((d): d is { entity_id: string; name: string } => !!d)
    .map((d) => ({ id: d.entity_id, name: d.name }));
}
