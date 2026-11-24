import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import { HeatsFilterBarComponent } from "./heats-filter-bar.component";

describe("HeatsFilterBarComponent", () => {
  let component: HeatsFilterBarComponent;
  let fixture: ComponentFixture<HeatsFilterBarComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (key === "RD_FILTER_ALL_GROUPS") return "All Groups";
        if (key === "RD_FILTER_ALL_STEPS") return "All Steps";
        if (key === "RD_FILTER_GROUP_N") return `Group ${params?.n}`;
        if (key === "RD_FILTER_STEP_N") return `Step ${params?.n}`;
        if (key === "RD_SHOWING_HEATS_COUNT") {
          return `Showing ${params?.visible} of ${params?.total} heats`;
        }
        if (key === "RD_CLEAR_FILTERS") return "Clear Filters";
        return key;
      },
    );

    await TestBed.configureTestingModule({
      imports: [HeatsFilterBarComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatsFilterBarComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not render filter bar when hasGroupFilter and hasStepFilter are false", () => {
    fixture.componentRef.setInput("hasGroupFilter", false);
    fixture.componentRef.setInput("hasStepFilter", false);
    fixture.detectChanges();

    const bar = fixture.nativeElement.querySelector(".heats-filter-bar");
    expect(bar).toBeNull();
  });

  it("should render group filter section when hasGroupFilter is true", () => {
    fixture.componentRef.setInput("hasGroupFilter", true);
    fixture.componentRef.setInput("availableGroups", [
      { index: 0, name: "Group 1", count: 4 },
      { index: 1, name: "Group 2", count: 2 },
    ]);
    fixture.componentRef.setInput("totalHeats", 6);
    fixture.componentRef.setInput("visibleHeats", 6);
    fixture.detectChanges();

    const groupSection = fixture.nativeElement.querySelector(
      ".group-filter-section",
    );
    expect(groupSection).toBeTruthy();

    const tabs = groupSection.querySelectorAll(".filter-tab");
    expect(tabs.length).toBe(3); // All Groups + 2 groups
    expect(tabs[0].textContent).toContain("All Groups");
    expect(tabs[1].textContent).toContain("Group 1");
  });

  it("should render step filter section when hasStepFilter is true", () => {
    fixture.componentRef.setInput("hasStepFilter", true);
    fixture.componentRef.setInput("availableSteps", [
      { step: 1, name: "Step 1", count: 2 },
      { step: 2, name: "Step 2", count: 2 },
    ]);
    fixture.componentRef.setInput("totalHeats", 4);
    fixture.componentRef.setInput("visibleHeats", 4);
    fixture.detectChanges();

    const stepSection = fixture.nativeElement.querySelector(
      ".step-filter-section",
    );
    expect(stepSection).toBeTruthy();

    const tabs = stepSection.querySelectorAll(".filter-tab");
    expect(tabs.length).toBe(3); // All Steps + 2 steps
  });

  it("should emit groupChange when a group tab is clicked", () => {
    fixture.componentRef.setInput("hasGroupFilter", true);
    fixture.componentRef.setInput("availableGroups", [
      { index: 0, name: "Group 1", count: 2 },
    ]);
    fixture.detectChanges();

    const groupSpy = jasmine.createSpy("groupChange");
    component.groupChange.subscribe(groupSpy);

    const tabs = fixture.nativeElement.querySelectorAll(
      ".group-filter-section .filter-tab",
    );
    tabs[1].click(); // Click Group 1

    expect(groupSpy).toHaveBeenCalledWith(0);

    tabs[0].click(); // Click All Groups
    expect(groupSpy).toHaveBeenCalledWith(null);
  });

  it("should emit stepChange when a step tab is clicked", () => {
    fixture.componentRef.setInput("hasStepFilter", true);
    fixture.componentRef.setInput("availableSteps", [
      { step: 1, name: "Step 1", count: 2 },
    ]);
    fixture.detectChanges();

    const stepSpy = jasmine.createSpy("stepChange");
    component.stepChange.subscribe(stepSpy);

    const tabs = fixture.nativeElement.querySelectorAll(
      ".step-filter-section .filter-tab",
    );
    tabs[1].click(); // Click Step 1

    expect(stepSpy).toHaveBeenCalledWith(1);
  });

  it("should emit clearFilters when Clear Filters button is clicked", () => {
    fixture.componentRef.setInput("hasGroupFilter", true);
    fixture.componentRef.setInput("selectedGroup", 0);
    fixture.detectChanges();

    const clearSpy = jasmine.createSpy("clearFilters");
    component.clearFilters.subscribe(clearSpy);

    const clearBtn = fixture.nativeElement.querySelector(".btn-clear-filters");
    expect(clearBtn).toBeTruthy();
    clearBtn.click();

    expect(clearSpy).toHaveBeenCalled();
  });
});
