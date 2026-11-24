import { Car } from "@app/models/car";

import { carsTooltip, carTooltip, uniqueCars } from "./car-results.utils";

describe("car-results.utils (#1210)", () => {
  const audi = new Car("c1", "Audi R8", { carClass: "GT3", scale: "1/32" });
  const ford = new Car("c2", "Ford GT40");

  describe("uniqueCars", () => {
    it("keeps one entry per car in the order first used", () => {
      expect(uniqueCars([ford, audi, ford]).map((c) => c.name)).toEqual([
        "Ford GT40",
        "Audi R8",
      ]);
    });

    it("skips heats without a car", () => {
      expect(uniqueCars([undefined, null, audi])).toEqual([audi]);
      expect(uniqueCars([undefined])).toEqual([]);
    });

    it("keeps the last snapshot of a car that was edited mid-race", () => {
      const edited = new Car("c1", "Audi R8", { tyres: "Ortmann" });
      const result = uniqueCars([audi, ford, edited]);
      expect(result.map((c) => c.entity_id)).toEqual(["c1", "c2"]);
      expect(result[0].tyres).toBe("Ortmann");
    });
  });

  describe("carTooltip", () => {
    it("shows name, class and scale, then the setup", () => {
      const car = new Car("c1", "Audi R8", {
        carClass: "GT3",
        motor: "21.5k",
        gears: "9/27",
        tyres: "Ortmann",
      });
      expect(carTooltip(car)).toBe("Audi R8 (GT3)\n21.5k · 9/27 · Ortmann");
    });

    it("leaves out the setup line when there is no setup", () => {
      expect(carTooltip(ford)).toBe("Ford GT40");
    });
  });

  it("carsTooltip lists one car per line", () => {
    expect(carsTooltip([audi, ford])).toBe("Audi R8 (GT3 · 1/32)\nFord GT40");
  });
});
