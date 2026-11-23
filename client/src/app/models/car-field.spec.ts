import { CAR_FIELD_TYPES, CarField, sortCarFields } from "./car-field";

describe("CarField", () => {
  it("has defaults", () => {
    const f = new CarField("f1", "Weight");
    expect(f.type).toBe("text");
    expect(f.options).toEqual([]);
    expect(f.position).toBe(0);
    expect(f.objectId).toBe("f1");
  });

  it("reads server JSON", () => {
    const f = CarField.fromJSON({
      entity_id: "f1",
      name: "Compound",
      type: "choice",
      options: ["Soft", 2],
      position: 3,
    });
    expect(f.entity_id).toBe("f1");
    expect(f.name).toBe("Compound");
    expect(f.type).toBe("choice");
    expect(f.options).toEqual(["Soft", "2"]);
    expect(f.position).toBe(3);
  });

  it("falls back to text and empty values", () => {
    const f = CarField.fromJSON({ entityId: "f2", type: "colour" });
    expect(f.entity_id).toBe("f2");
    expect(f.name).toBe("");
    expect(f.type).toBe("text");
    expect(f.position).toBe(0);
    expect(CarField.fromJSON(null).entity_id).toBe("");
  });

  it("sorts by position, then name", () => {
    const sorted = sortCarFields([
      new CarField("c", "C", "text", [], 1),
      new CarField("b", "B", "text", [], 0),
      new CarField("a", "A", "text", [], 1),
    ]);
    expect(sorted.map((f) => f.entity_id)).toEqual(["b", "a", "c"]);
  });

  it("does not change the list it sorts", () => {
    const list = [
      new CarField("b", "B", "text", [], 1),
      new CarField("a", "A"),
    ];
    sortCarFields(list);
    expect(list[0].entity_id).toBe("b");
  });

  it("offers the four types", () => {
    expect(CAR_FIELD_TYPES.map((t) => t.value)).toEqual([
      "text",
      "number",
      "boolean",
      "choice",
    ]);
  });
});
