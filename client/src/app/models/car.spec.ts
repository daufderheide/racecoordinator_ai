import { Car, CAR_SCALE_OPTIONS, CAR_TEXT_FIELDS } from "./car";

describe("Car", () => {
  it("defaults every optional field to empty", () => {
    const car = new Car("c1", "Porsche");
    expect(car.entity_id).toBe("c1");
    expect(car.objectId).toBe("c1");
    expect(car.name).toBe("Porsche");
    expect(car.avatarUrl).toBeUndefined();
    expect(car.scale).toBe("");
    expect(car.modified).toBeFalse();
    for (const f of CAR_TEXT_FIELDS) {
      expect(car[f]).withContext(f).toBe("");
    }
  });

  it("keeps the given fields", () => {
    const car = new Car("c1", "Porsche", {
      avatarUrl: "p.png",
      brand: "Scalextric",
      carClass: "GT3",
      scale: "1/32",
      motor: "21.5k",
      magnet: "None",
      chassis: "Sidewinder",
      gears: "9/27",
      tyres: "Urethane",
      modified: true,
      notes: "Lowered",
    });
    expect(car.avatarUrl).toBe("p.png");
    expect(car.brand).toBe("Scalextric");
    expect(car.carClass).toBe("GT3");
    expect(car.scale).toBe("1/32");
    expect(car.motor).toBe("21.5k");
    expect(car.magnet).toBe("None");
    expect(car.chassis).toBe("Sidewinder");
    expect(car.gears).toBe("9/27");
    expect(car.tyres).toBe("Urethane");
    expect(car.modified).toBeTrue();
    expect(car.notes).toBe("Lowered");
  });

  it("treats an empty picture as none and only true as modified", () => {
    const car = new Car("c1", "A", { avatarUrl: "", modified: "yes" as any });
    expect(car.avatarUrl).toBeUndefined();
    expect(car.modified).toBeFalse();
  });

  describe("fromJSON", () => {
    it("reads server JSON", () => {
      const car = Car.fromJSON({
        entity_id: "7",
        name: "GT40",
        carClass: "Classic",
        scale: "1/24",
        tyres: "Rubber",
        modified: true,
      });
      expect(car.entity_id).toBe("7");
      expect(car.name).toBe("GT40");
      expect(car.carClass).toBe("Classic");
      expect(car.scale).toBe("1/24");
      expect(car.tyres).toBe("Rubber");
      expect(car.modified).toBeTrue();
      expect(car.motor).toBe("");
    });

    it("accepts entityId and car_class", () => {
      const car = Car.fromJSON({ entityId: "8", car_class: "LMP" });
      expect(car.entity_id).toBe("8");
      expect(car.carClass).toBe("LMP");
      expect(car.name).toBe("");
    });

    it("survives null", () => {
      const car = Car.fromJSON(null);
      expect(car.entity_id).toBe("");
      expect(car.name).toBe("");
    });
  });

  it("offers the agreed scales, with Not set first", () => {
    expect(CAR_SCALE_OPTIONS.map((o) => o.value)).toEqual([
      "",
      "1/24",
      "1/32",
      "1/43",
      "1/64",
      "other",
    ]);
  });
});
