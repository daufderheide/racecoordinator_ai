import { TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RecordLabelSourceComponent } from "./record-label-source.component";
import { getInspectorSchema } from "./widget-schemas";

describe("Record label source", () => {
  it("saves an allowlisted source and restores the existing text when cleared", () => {
    TestBed.configureTestingModule({
      imports: [RecordLabelSourceComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
    const fixture = TestBed.createComponent(RecordLabelSourceComponent);
    const settings: Record<string, unknown> = { text: "My label" };
    const notify = jasmine.createSpy("notify");
    fixture.componentRef.setInput("settings", settings);
    fixture.componentRef.setInput("notify", notify);

    fixture.componentInstance.setSource("heatBestTime");
    expect(settings["recordField"]).toBe("heatBestTime");
    expect(fixture.componentInstance.recordField).toBe("heatBestTime");
    fixture.componentInstance.setSource("");
    expect(settings).toEqual({ text: "My label" });
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it("shows precision only for numeric sources and empty states only for live sources", () => {
    const schema = getInspectorSchema("label")!;
    const fields = schema.folders
      .find(({ id }) => id === "content")!
      .groups.flatMap((group) => group.fields);
    const visible = (settings: Record<string, unknown>) =>
      fields
        .filter((field) => field.visibleWhen?.(settings) ?? true)
        .map((field) => field.id);
    expect(visible({})).toEqual(["recordField", "text"]);
    expect(visible({ recordField: "heatBestNickname" })).toEqual([
      "recordField",
      "emptyValueMode",
    ]);
    expect(
      visible({ recordField: "heatBestTime", emptyValueMode: "text" }),
    ).toEqual([
      "recordField",
      "recordDecimals",
      "emptyValueMode",
      "emptyValueText",
    ]);
  });
});
