import { Car } from "@app/models/car";

import { CarConverter } from "./car.converter";

describe("CarConverter (#1210)", () => {
  it("reads a car from race data", () => {
    const car = CarConverter.fromProto({
      model: { entityId: "c1" },
      name: "Audi R8",
      carClass: "GT3",
      scale: "1/32",
      modified: true,
      customValues: [{ fieldId: "f-weight", value: "78" }],
    });
    expect(car?.entity_id).toBe("c1");
    expect(car?.carClass).toBe("GT3");
    expect(car?.modified).toBeTrue();
    expect(car?.customValues).toEqual({ "f-weight": "78" });
  });

  it("has no car without one in the proto", () => {
    expect(CarConverter.fromProto(undefined)).toBeUndefined();
    expect(CarConverter.fromProto({ name: "no id" })).toBeUndefined();
  });

  it("does not cache: two snapshots of one car stay different", () => {
    const a = CarConverter.fromProto({
      model: { entityId: "c1" },
      tyres: "Soft",
    });
    const b = CarConverter.fromProto({
      model: { entityId: "c1" },
      tyres: "Hard",
    });
    expect(a?.tyres).toBe("Soft");
    expect(b?.tyres).toBe("Hard");
  });

  it("round-trips a whole car", () => {
    const car = new Car("c2", "Ford GT40", {
      brand: "Carrera",
      notes: "Le Mans",
      customValues: { "f-pinion": "11" },
    });
    const back = CarConverter.fromProto(CarConverter.toProto(car));
    expect(back).toEqual(car);
    expect(CarConverter.toProto(undefined)).toBeUndefined();
  });
});
