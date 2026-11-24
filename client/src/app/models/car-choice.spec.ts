import { Car } from "./car";
import {
  applyChoiceToParticipant,
  choiceFromParticipant,
  cleanCarChoice,
  emptyCarChoice,
  hasAnyCar,
  participantCarSummary,
  toCarChoiceProto,
} from "./car-choice";
import { participantCarFor } from "./race_participant";

describe("car-choice (#1210)", () => {
  const audi = new Car("c1", "Audi R8");
  const ford = new Car("c2", "Ford GT40");
  const cars = [audi, ford];

  it("starts with no car", () => {
    expect(emptyCarChoice()).toEqual({
      carId: "",
      carPerDriver: false,
      driverCars: {},
    });
    expect(hasAnyCar(emptyCarChoice())).toBeFalse();
    expect(hasAnyCar(undefined)).toBeFalse();
  });

  it("drops stored cars that no longer exist", () => {
    expect(
      cleanCarChoice(
        {
          carId: "gone",
          carPerDriver: true,
          driverCars: { d1: "c1", d2: "x" },
        },
        cars,
      ),
    ).toEqual({ carId: "", carPerDriver: true, driverCars: { d1: "c1" } });
    expect(cleanCarChoice(null, cars)).toEqual(emptyCarChoice());
  });

  it("knows when a car is picked", () => {
    expect(
      hasAnyCar({ carId: "c1", carPerDriver: false, driverCars: {} }),
    ).toBeTrue();
    expect(
      hasAnyCar({ carId: "c1", carPerDriver: true, driverCars: {} }),
    ).toBeFalse();
    expect(
      hasAnyCar({ carId: "", carPerDriver: true, driverCars: { d1: "c2" } }),
    ).toBeTrue();
  });

  it("sends one car, or a car per driver, to the server", () => {
    expect(
      toCarChoiceProto("d_d1", {
        carId: "c1",
        carPerDriver: false,
        driverCars: { d9: "c2" },
      }),
    ).toEqual({
      participantId: "d_d1",
      carId: "c1",
      carPerDriver: false,
      driverCars: [],
    });
    expect(
      toCarChoiceProto("t_t1", {
        carId: "c1",
        carPerDriver: true,
        driverCars: { d1: "c1", d2: "" },
      }),
    ).toEqual({
      participantId: "t_t1",
      carId: "",
      carPerDriver: true,
      driverCars: [{ driverId: "d1", carId: "c1" }],
    });
  });

  it("puts a pick on a racer and reads it back", () => {
    const p: any = {};
    applyChoiceToParticipant(
      p,
      { carId: "c2", carPerDriver: false, driverCars: {} },
      cars,
    );
    expect(p.car).toBe(ford);
    expect(participantCarSummary(p)).toBe("Ford GT40");
    expect(choiceFromParticipant(p)).toEqual({
      carId: "c2",
      carPerDriver: false,
      driverCars: {},
    });

    applyChoiceToParticipant(
      p,
      { carId: "", carPerDriver: true, driverCars: { d1: "c1", d2: "c1" } },
      cars,
    );
    expect(p.car).toBeUndefined();
    expect(participantCarFor(p, "d2")).toBe(audi);
    expect(participantCarFor(p, "d3")).toBeUndefined();
    expect(participantCarSummary(p)).toBe("Audi R8");
  });

  it("keeps a car the racer already had when it's gone from the list", () => {
    const old = new Car("c9", "Old Porsche");
    const p: any = { car: old };
    applyChoiceToParticipant(
      p,
      { carId: "c9", carPerDriver: false, driverCars: {} },
      cars,
    );
    expect(p.car).toBe(old);
  });

  it("removes the car with an empty pick", () => {
    const p: any = { car: audi };
    applyChoiceToParticipant(p, emptyCarChoice(), cars);
    expect(p.car).toBeUndefined();
    expect(participantCarSummary(p)).toBe("");
    expect(participantCarSummary(undefined)).toBe("");
    expect(participantCarFor(undefined)).toBeUndefined();
  });
});
