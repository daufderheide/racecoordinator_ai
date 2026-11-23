import { getInspectorSchema } from "./widget-schemas";

/** "When there's no data" in the Behaviour folder (phase 3c). */
describe("empty states folder", () => {
  const ids = (type: string) =>
    getInspectorSchema(type)!
      .folders.filter((f) => f.id === "behaviour")
      .flatMap((f) => f.groups.flatMap((g) => g.fields.map((x) => x.id)));

  it("is on Records and Progress Gauge (values) and Heat List (also empty lanes)", () => {
    expect(ids("records")).toEqual(["emptyValueMode", "emptyValueText"]);
    expect(ids("progress-gauge")).toEqual(["emptyValueMode", "emptyValueText"]);
    expect(ids("heat-list")).toEqual([
      "emptyValueMode",
      "emptyValueText",
      "emptyLaneMode",
      "emptyLaneText",
    ]);
  });

  it("only asks for the text when Own text is chosen", () => {
    const text: any = getInspectorSchema("records")!
      .folders.find((f) => f.id === "behaviour")!
      .groups[0].fields.find((f) => f.id === "emptyValueText");
    expect(text.visibleWhen({}, {} as any)).toBeFalse();
    expect(text.visibleWhen({ emptyValueMode: "text" }, {} as any)).toBeTrue();
  });

  it("offers a lane-colour background on the Flag and Progress Gauge only (phase 3c)", () => {
    const has = (type: string) =>
      getInspectorSchema(type)!
        .folders.find((f) => f.id === "frame")!
        .groups.some((g) =>
          g.fields.some((f) => f.id === "laneColorBackground"),
        );
    expect(has("flag")).toBeTrue();
    expect(has("progress-gauge")).toBeTrue();
    expect(has("qr")).toBeFalse();
    expect(has("branding")).toBeFalse();
  });
});
