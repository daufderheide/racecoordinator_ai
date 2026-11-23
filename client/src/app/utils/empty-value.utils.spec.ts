import { BLANK, emptyLaneLabel, emptyValue } from "./empty-value.utils";

describe("empty values (phase 3c)", () => {
  it("keeps the widget's own placeholder when nothing is chosen", () => {
    expect(emptyValue(undefined, "--")).toBe("--");
    expect(emptyValue({}, "--.---")).toBe("--.---");
    expect(emptyLaneLabel({ emptyLaneMode: "" }, "Empty Lane")).toBe(
      "Empty Lane",
    );
  });

  it("shows nothing (a no-break space, so rows keep their height)", () => {
    expect(emptyValue({ emptyValueMode: "blank" }, "--")).toBe(BLANK);
    expect(emptyLaneLabel({ emptyLaneMode: "blank" }, "Empty Lane")).toBe(
      BLANK,
    );
  });

  it("shows your own text, or nothing when the text is empty", () => {
    expect(
      emptyValue({ emptyValueMode: "text", emptyValueText: "n/a" }, "--"),
    ).toBe("n/a");
    expect(
      emptyLaneLabel(
        { emptyLaneMode: "text", emptyLaneText: "Free" },
        "Empty Lane",
      ),
    ).toBe("Free");
    expect(
      emptyValue({ emptyValueMode: "text", emptyValueText: " " }, "--"),
    ).toBe(BLANK);
  });
});
