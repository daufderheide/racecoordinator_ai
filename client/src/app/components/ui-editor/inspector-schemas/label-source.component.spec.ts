import { TestBed } from "@angular/core/testing";
import { fieldKeys } from "@app/components/ui-editor/inspector-kit/inspector-schema";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { LabelSourceComponent } from "./label-source.component";
import { getInspectorSchema } from "./widget-schemas";

describe("Label content source", () => {
  it("saves an allowlisted source and restores the existing text when cleared", () => {
    TestBed.configureTestingModule({
      imports: [LabelSourceComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
    const fixture = TestBed.createComponent(LabelSourceComponent);
    const settings: Record<string, unknown> = { text: "My label" };
    const notify = jasmine.createSpy("notify");
    fixture.componentRef.setInput("settings", settings);
    fixture.componentRef.setInput("notify", notify);

    fixture.componentInstance.setSource("heatBestTime");
    expect(settings["recordField"]).toBe("heatBestTime");
    expect(fixture.componentInstance.source).toBe("heatBestTime");
    fixture.componentInstance.setSource("raceTimer");
    expect(settings).toEqual({ text: "My label", labelSource: "raceTimer" });
    expect(fixture.componentInstance.source).toBe("raceTimer");
    fixture.componentInstance.setSource("raceRecordScore");
    expect(settings).toEqual({
      text: "My label",
      recordField: "raceRecordScore",
    });
    fixture.componentInstance.setSource("");
    expect(settings).toEqual({ text: "My label" });
    expect(notify).toHaveBeenCalledTimes(4);
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
    expect(fieldKeys(fields[0])).toEqual(["labelSource", "recordField"]);
    expect(visible({})).toEqual(["labelSource", "text"]);
    expect(
      visible({ labelSource: "raceTimer", recordField: "heatBestTime" }),
    ).toEqual(["labelSource"]);
    expect(visible({ recordField: "heatBestNickname" })).toEqual([
      "labelSource",
      "emptyValueMode",
    ]);
    expect(
      visible({ recordField: "heatBestTime", emptyValueMode: "text" }),
    ).toEqual([
      "labelSource",
      "recordDecimals",
      "emptyValueMode",
      "emptyValueText",
    ]);
  });
});
