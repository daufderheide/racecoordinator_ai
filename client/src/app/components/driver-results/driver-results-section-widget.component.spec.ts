import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { DriverResultsSectionWidgetComponent } from "./driver-results-section-widget.component";

describe("DriverResultsSectionWidgetComponent", () => {
  let fixture: ComponentFixture<DriverResultsSectionWidgetComponent>;
  let widget: HTMLElement;

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    TestBed.configureTestingModule({
      imports: [DriverResultsSectionWidgetComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
    fixture = TestBed.createComponent(DriverResultsSectionWidgetComponent);
    fixture.componentRef.setInput("section", "driver-results-prediction");
    widget = fixture.nativeElement;
  });

  it("uses representative data in the Layout Editor preview", () => {
    fixture.componentRef.setInput("preview", true);
    fixture.detectChanges();

    expect(widget.querySelector("h2")?.textContent?.trim()).toBe(
      "UE_WIDGET_TYPE_DRIVER_RESULTS_PREDICTION",
    );
    expect(
      Array.from(widget.querySelectorAll("dd"), (value) => value.textContent),
    ).toEqual(["44%", "1 / 2", "40.25 / 39.75"]);
  });

  it("keeps sample data out of live and archived results", () => {
    fixture.detectChanges();

    expect(widget.querySelector(".driver-results-preview")).toBeNull();
    expect(widget.textContent?.trim()).toBe("");
  });
});
