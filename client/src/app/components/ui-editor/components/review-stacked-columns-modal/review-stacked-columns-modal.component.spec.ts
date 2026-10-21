import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StackedColumnIssue } from "@app/components/raceday/utils/lane-grid-repair.helper";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import { ReviewStackedColumnsModalComponent } from "./review-stacked-columns-modal.component";

describe("ReviewStackedColumnsModalComponent", () => {
  let component: ReviewStackedColumnsModalComponent;
  let fixture: ComponentFixture<ReviewStackedColumnsModalComponent>;

  const mockTranslations: Record<string, string> = {
    UI_EDITOR_COL_HEAT_BEST_LAP: "Heat Best Lap",
    RD_COL_NAME: "Driver Name",
    "UE_ANCHOR_bottom-right": "Bottom Right",
    UE_STACKED_COLUMNS_BADGE_HEADER: "Header",
  };

  const mockTranslationService = {
    translate: (key: string, params?: any) => {
      if (params && params.count != null) {
        return `${key} (${params.count})`;
      }
      if (params && params.insets) {
        return `${key}: ${params.insets}`;
      }
      if (params && params.lane != null) {
        return `Lane ${params.lane}`;
      }
      return mockTranslations[key] || key;
    },
    currentLang: "en",
    instant: (key: string) => mockTranslations[key] || key,
  };

  const mockIssues: StackedColumnIssue[] = [
    {
      id: "issue_1",
      columnKey: "bestLapTime",
      columnLabel: "UI_EDITOR_COL_HEAT_BEST_LAP",
      laneIndex: 0,
      laneDisplay: "Lane 1",
      isHeader: false,
      gridId: "grid-1",
      primaryWidget: {
        id: "w1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 100,
        customSettings: { columnKey: "bestLapTime" },
      },
      duplicateWidgets: [
        {
          id: "w2",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          zIndex: 100,
          customSettings: { columnKey: "bestLapTime" },
        },
      ],
      hasInsetsToMerge: true,
      insetsToMerge: { "bottom-right": "photo" },
    },
    {
      id: "issue_2",
      columnKey: "driver.name",
      columnLabel: "RD_COL_NAME",
      laneIndex: 0,
      laneDisplay: "Header",
      isHeader: true,
      gridId: "grid-1",
      primaryWidget: {
        id: "h1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        zIndex: 100,
        customSettings: { columnKey: "driver.name", isHeaderWidget: true },
      },
      duplicateWidgets: [
        {
          id: "h2",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 30,
          zIndex: 100,
          customSettings: { columnKey: "driver.name", isHeaderWidget: true },
        },
      ],
      hasInsetsToMerge: false,
      insetsToMerge: {},
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewStackedColumnsModalComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewStackedColumnsModalComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not render modal content when visible is false", () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector(".modal-overlay");
    expect(modal).toBeNull();
  });

  it("should render modal content and list issues with localized labels when visible is true", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("issues", mockIssues);
    fixture.componentRef.setInput("layoutName", "Main Raceday Layout");
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector(".modal-overlay");
    expect(modal).toBeTruthy();

    const issueCards = fixture.nativeElement.querySelectorAll(".issue-card");
    expect(issueCards.length).toBe(2);

    // Verify localized column name: UI_EDITOR_COL_HEAT_BEST_LAP -> Heat Best Lap
    const columnNames = fixture.nativeElement.querySelectorAll(".column-name");
    expect(columnNames[0].textContent.trim()).toBe("Heat Best Lap");
    expect(columnNames[1].textContent.trim()).toBe("Driver Name");

    // Verify localized badges
    const laneBadges = fixture.nativeElement.querySelectorAll(".lane-badge");
    expect(laneBadges[0].textContent.trim()).toBe("Lane 1");
    expect(laneBadges[1].textContent.trim()).toBe("Header");

    const layoutBadge = fixture.nativeElement.querySelector(".badge-value");
    expect(layoutBadge.textContent).toContain("Main Raceday Layout");

    const insetsMergeRow =
      fixture.nativeElement.querySelector(".insets-merge-row");
    expect(insetsMergeRow).toBeTruthy();
    expect(insetsMergeRow.textContent).toContain("Bottom Right (photo)");
  });

  it("should emit fix when Fix Layout button is clicked", () => {
    spyOn(component.fix, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("issues", mockIssues);
    fixture.detectChanges();

    const fixBtn = fixture.nativeElement.querySelector(
      "#ue-btn-confirm-fix-stacked-columns",
    );
    expect(fixBtn).toBeTruthy();
    fixBtn.click();

    expect(component.fix.emit).toHaveBeenCalled();
  });

  it("should emit cancel when Cancel button or close icon is clicked", () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("issues", mockIssues);
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector(".btn-secondary");
    cancelBtn.click();
    expect(component.cancel.emit).toHaveBeenCalledTimes(1);

    const closeBtn = fixture.nativeElement.querySelector(".close-btn");
    closeBtn.click();
    expect(component.cancel.emit).toHaveBeenCalledTimes(2);
  });
});
