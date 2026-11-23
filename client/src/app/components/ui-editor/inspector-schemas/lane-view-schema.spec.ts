import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import {
  allFields,
  InspectorField,
  isFieldVisible,
  registryDefaults,
} from "@app/components/ui-editor/inspector-kit/inspector-schema";
import { DataService } from "@app/data.service";
import { FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import {
  LaneViewColumnsPartComponent,
  laneViewSchema,
} from "./lane-view-schema";

const field = (id: string): InspectorField =>
  allFields(laneViewSchema).find((f) => f.id === id)!;

describe("Lane View schema", () => {
  it("reads the highlight style like the old inspector, including older layouts", () => {
    const f = field("highlightLapStyle");
    expect(f.read!({ highlightLapStyle: "tint-wash" })).toBe("tint-wash");
    expect(f.read!({ highlightRowOnLap: false })).toBe("none");
    expect(f.read!({})).toBe("classic");
  });

  it("keeps highlightRowOnLap in step with the style", () => {
    const f = field("highlightLapStyle");
    const s: Record<string, any> = {};
    f.write!(s, "none", { widget: null, totalLanes: 4 });
    expect(s).toEqual({ highlightLapStyle: "none", highlightRowOnLap: false });
    f.write!(s, "shimmer", { widget: null, totalLanes: 4 });
    expect(s["highlightRowOnLap"]).toBeTrue();
  });

  it("hides sort by standings in practice, as the old inspector did", () => {
    const f = field("sortByStandings");
    expect(
      isFieldVisible(
        f,
        {},
        { widget: null, totalLanes: 4, isPracticeMode: true },
      ),
    ).toBeFalse();
    expect(
      isFieldVisible(
        f,
        {},
        { widget: null, totalLanes: 4, isPracticeMode: false },
      ),
    ).toBeTrue();
  });

  it("has no colour for the data and inset text (none before either)", () => {
    const data = field("data");
    const inset = field("inset");
    expect(data.type === "textPart" && data.keys.color).toBeUndefined();
    expect(inset.type === "textPart" && inset.keys.color).toBeUndefined();
  });

  it("every key has a default", () => {
    const defaults = registryDefaults("lane-view");
    for (const f of allFields(laneViewSchema)) {
      if (f.type === "geometry" || f.type === "embed" || f.type === "buttons")
        continue;
      const keys =
        f.type === "textPart"
          ? Object.values(f.keys)
          : [("key" in f && f.key) as string];
      for (const k of keys)
        expect(k in defaults)
          .withContext(k!)
          .toBeTrue();
    }
  });

  describe("columns part", () => {
    let fixture: ComponentFixture<LaneViewColumnsPartComponent>;

    beforeEach(async () => {
      const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
        availableFonts: () => [],
      });
      await TestBed.configureTestingModule({
        imports: [LaneViewColumnsPartComponent],
        providers: [
          { provide: FontService, useValue: fontSpy },
          { provide: TranslationService, useValue: mockTranslationService },
          {
            provide: DataService,
            useValue: { listAssets: () => of([]) },
          },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(LaneViewColumnsPartComponent);
    });

    it("shows only the column manager and reports changes through notify", () => {
      let notified = 0;
      const widget = {
        id: "lv",
        widgetType: "lane-view",
        customSettings: registryDefaults("lane-view"),
      };
      const customUi = {
        columnsJson: JSON.stringify(["driver.name", "lapCount"]),
      };
      fixture.componentRef.setInput("settings", widget.customSettings);
      fixture.componentRef.setInput("widget", widget);
      fixture.componentRef.setInput("context", {
        widget,
        totalLanes: 4,
        customUi,
        globalSettings: {},
        availableColumns: [],
        isPracticeMode: false,
      });
      fixture.componentRef.setInput("notify", () => notified++);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll(".inspector-column-item").length).toBe(2);
      // the normal settings and the border section live in the panel's own folders
      expect(el.querySelector("app-widget-border-inspector")).toBeNull();
      expect(el.textContent).not.toContain(
        "UE_INSPECTOR_LANE_VIEW_VERTICAL_LAYOUT",
      );

      (el.querySelector(".delete-btn") as HTMLButtonElement).click();
      expect(notified).toBe(1);
      expect(JSON.parse(customUi.columnsJson)).toEqual(["lapCount"]);
    });
  });
});
