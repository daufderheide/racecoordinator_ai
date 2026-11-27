import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { HeatExpanderData } from "@app/components/shared/heat-driver-expander/heat-driver-expander.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import {
  HeatResultsWidgetComponent,
  toHeatResultsRows,
} from "./heat-results-widget.component";

describe("HeatResultsWidgetComponent", () => {
  let fixture: ComponentFixture<HeatResultsWidgetComponent>;
  const widget: AbsoluteWidgetNode = {
    id: "standings",
    widgetType: "heat-results-standings",
    x: 0,
    y: 0,
    width: 640,
    height: 400,
    zIndex: 0,
  };

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    TestBed.configureTestingModule({
      imports: [HeatResultsWidgetComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
    fixture = TestBed.createComponent(HeatResultsWidgetComponent);
    fixture.componentRef.setInput("widget", widget);
  });

  it("renders editor sample data and respects optional standings columns and lane colours", () => {
    fixture.componentRef.setInput("preview", true);
    fixture.detectChanges();
    const table: HTMLTableElement =
      fixture.nativeElement.querySelector("table");
    expect(table.tHead?.rows[0].cells.length).toBe(7);
    expect(table.tBodies[0].rows[0].textContent).toContain("5.124");
    const lane = table.querySelector<HTMLElement>("th.driver")!;
    expect(lane.style.getPropertyValue("--heat-result-lane-color")).toBe(
      "#d74545",
    );

    fixture.componentRef.setInput("widget", {
      ...widget,
      customSettings: { showAverageLap: false, useLaneColors: false },
    });
    fixture.detectChanges();
    expect(table.tHead?.rows[0].cells.length).toBe(6);
    expect(table.tHead?.rows[0].textContent).not.toContain(
      "HL_SUMMARY_AVG_LAP",
    );
    expect(lane.style.getPropertyValue("--heat-result-lane-color")).toBe("");
  });

  it("shows the empty state until real results are available in Race Day mode", () => {
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".heat-results-empty").textContent,
    ).toContain("HR_NO_HEAT_DATA");
    expect(fixture.nativeElement.querySelector("table")).toBeNull();
  });

  it("preserves official ranks, fractional laps, and gaps from the selected heat", () => {
    const entry = (
      id: string,
      rank: number,
      laneIndex: number,
    ): HeatExpanderData =>
      ({
        row: { objectId: id, rank, laps: 25.725, gap1st: 1.4 },
        driverName: id,
        heatDriver: { laneIndex },
        laneColor: { background: "#ff0000" },
      }) as HeatExpanderData;
    const result = toHeatResultsRows([
      entry("unranked", 0, 1),
      entry("second", 2, 0),
      entry("first", 1, 2),
    ]);
    expect(result.map((row) => row.driver)).toEqual([
      "first",
      "second",
      "unranked",
    ]);
    expect(result[0]).toEqual(
      jasmine.objectContaining({
        position: 1,
        lane: 3,
        laps: 25.725,
        gap: null,
      }),
    );
    expect(result[1].gap).toBe(1.4);
  });
});
