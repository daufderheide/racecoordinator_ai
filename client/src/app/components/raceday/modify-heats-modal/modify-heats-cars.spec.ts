import { of, throwError } from "rxjs";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";

import { ModifyHeatsCars } from "./modify-heats-cars";

describe("ModifyHeatsCars (#1210)", () => {
  const ann = new Driver("d1", "Ann", "A");
  const bob = new Driver("d2", "Bob", "B");
  const racer = (team?: Team) =>
    new RaceParticipant("p1", ann, 0, 0, 0, 0, 0, 0, 0, 0, 100, 0, 0, team);
  let cars: ModifyHeatsCars;

  beforeEach(() => {
    cars = new ModifyHeatsCars(() => [ann, bob]);
    cars.load({
      getCars: () =>
        of([
          { entity_id: "c1", name: "Audi R8" },
          { entity_id: "c2", name: "Ford GT40" },
        ]),
    });
  });

  it("loads the Slotcar database", () => {
    expect(cars.allCars.map((c) => c.name)).toEqual(["Audi R8", "Ford GT40"]);
  });

  it("has no cars when loading fails or there is no service", () => {
    const empty = new ModifyHeatsCars(() => []);
    empty.load({ getCars: () => throwError(() => new Error("x")) });
    expect(empty.allCars).toEqual([]);
    empty.load({});
    expect(empty.allCars).toEqual([]);
  });

  it("gives the racer being picked for a new car", () => {
    const p = racer();
    const click = new MouseEvent("click");
    spyOn(click, "stopPropagation");
    cars.open(p, click);
    expect(click.stopPropagation).toHaveBeenCalled();
    expect(cars.choiceFor(cars.target)).toEqual({
      carId: "",
      carPerDriver: false,
      driverCars: {},
    });

    expect(
      cars.pick({ carId: "c2", carPerDriver: false, driverCars: {} }),
    ).toBeTrue();
    expect(cars.target).toBeNull();
    expect(cars.summary(p)).toBe("Ford GT40");
  });

  it("does nothing without a racer", () => {
    expect(
      cars.pick({ carId: "c1", carPerDriver: false, driverCars: {} }),
    ).toBeFalse();
  });

  it("lists a team's drivers", () => {
    const p = racer(new Team("t1", "Ferrari", undefined, ["d2", "d9"]));
    expect(cars.teamDrivers(p)).toEqual([{ id: "d2", name: "Bob" }]);
    expect(cars.teamDrivers(null)).toEqual([]);
  });
});
