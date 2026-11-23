import { allFields } from "@app/components/ui-editor/inspector-kit/inspector-schema";

import { getInspectorSchema } from "./widget-schemas";

/** Number format in one place (phase 3c): same group and labels everywhere. */
describe("number format", () => {
  const field = (type: string, id: string): any =>
    allFields(getInspectorSchema(type)!).find((f) => f.id === id);
  const groupTitleOf = (type: string, id: string) =>
    getInspectorSchema(type)!
      .folders.flatMap((f) => f.groups)
      .find((g) => g.fields.some((f) => f.id === id))?.titleKey;

  it("puts decimals in a Numbers group with the shared labels", () => {
    expect(groupTitleOf("records", "lapDecimalPlaces")).toBe("UE_KIT_NUMBERS");
    expect(field("records", "lapDecimalPlaces").labelKey).toBe(
      "UE_KIT_LAP_DECIMALS",
    );
    expect(field("records", "scoreDecimalPlaces").labelKey).toBe(
      "UE_KIT_SCORE_DECIMALS",
    );
    expect(groupTitleOf("leaderboard", "decimalPlaces")).toBe("UE_KIT_NUMBERS");
    expect(groupTitleOf("heat-list", "summaryLapDecimalPlaces")).toBe(
      "UE_KIT_NUMBERS",
    );
    expect(field("heat-list", "summaryTimeDecimalPlaces").labelKey).toBe(
      "UE_KIT_TIME_DECIMALS",
    );
    expect(field("lane-view", "insetLapDecimalPlaces").labelKey).toBe(
      "UE_KIT_LAP_DECIMALS",
    );
    expect(field("progress-gauge", "lapDecimalPlaces").labelKey).toBe(
      "UE_KIT_LAP_DECIMALS",
    );
  });

  it("keeps every widget's own keys and choices, so stored layouts look the same", () => {
    expect(field("leaderboard", "decimalPlaces").key).toBe("decimalPlaces");
    expect(
      field("heat-list", "summaryTimeDecimalPlaces").options.map(
        (o: any) => o.value,
      ),
    ).toEqual([1, 2, 3, 4]);
    // Records: nothing stored = 3, as before
    expect(field("records", "lapDecimalPlaces").default).toBe(3);
  });
});
