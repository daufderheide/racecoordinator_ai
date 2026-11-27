import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import {
  RaceStandingsWidgetComponent,
  RaceStandingsWidgetContext,
} from "./race-standings-widget.component";

const widget: AbsoluteWidgetNode = {
  id: "standings",
  widgetType: "race-results-standings",
  x: 0,
  y: 0,
  width: 600,
  height: 350,
  zIndex: 1,
};

describe("RaceStandingsWidgetComponent", () => {
  let fixture: ComponentFixture<RaceStandingsWidgetComponent>;

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    TestBed.configureTestingModule({
      imports: [RaceStandingsWidgetComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
    fixture = TestBed.createComponent(RaceStandingsWidgetComponent);
    fixture.componentRef.setInput("widget", widget);
  });

  it("keeps race ranking order and shows the official score format and signed gaps", () => {
    const row: RaceStandingsWidgetContext["rows"][number] = {
      rank: 2,
      visualIndex: 1,
      driver: { entity_id: "a", name: "Alex", nickname: "" },
      laps: 2.25,
      score: 12.456,
      bestLapTime: 4.35,
      averageLapTime: 4.8,
      gap1st: 1.25,
    };
    const winner = {
      ...row,
      rank: 1,
      visualIndex: 0,
      driver: { entity_id: "z", name: "Team Z", nickname: "" },
      gap1st: null,
    };
    const rows = [row, winner];
    fixture.componentRef.setInput("context", { rows, scoreFormat: "1.3-3" });
    fixture.detectChanges();

    const table: HTMLTableElement =
      fixture.nativeElement.querySelector("table");
    expect(
      Array.from(table.tBodies[0].rows).map((tr) =>
        tr.querySelector("th")?.textContent?.trim(),
      ),
    ).toEqual(["Team Z", "Alex"]);
    expect(table.tBodies[0].rows[1].textContent).toContain("12.456");
    expect(table.tBodies[0].rows[1].textContent).toContain("2.25");
    expect(table.tBodies[0].rows[1].textContent).toContain("+1.250");
    expect(rows[0].driver.name).toBe("Alex");
  });

  it("renders editor samples and applies saved column options", () => {
    fixture.componentRef.setInput("preview", true);
    fixture.componentRef.setInput("widget", {
      ...widget,
      customSettings: { showScore: false, showBestLap: false },
    });
    fixture.detectChanges();
    const table: HTMLTableElement =
      fixture.nativeElement.querySelector("table");
    expect(table.tHead?.rows[0].cells.length).toBe(5);
    expect(table.tHead?.textContent).not.toContain("DR_COL_SCORE");
    expect(table.tHead?.textContent).not.toContain("RD_COL_BEST_LAP");
    expect(table.tBodies[0].textContent).toContain("Jordan");
  });

  it("shows the empty state instead of preview rows in a live results layout", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("table")).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("RD_ERROR_NO_DRIVERS");
  });
});
