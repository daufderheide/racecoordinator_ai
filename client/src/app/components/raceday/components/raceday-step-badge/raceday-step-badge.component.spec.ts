import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RacedayStepBadgeComponent } from "./raceday-step-badge.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("RacedayStepBadgeComponent", () => {
  let component: RacedayStepBadgeComponent;
  let fixture: ComponentFixture<RacedayStepBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayStepBadgeComponent, MockTranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayStepBadgeComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render fallback step badge when unpopulated", () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const pill = el.querySelector(".step-badge-pill");
    expect(pill).toBeTruthy();
    expect(pill?.textContent).toContain("RD_STEP 1");
    const advance = el.querySelector(".step-advance-text");
    expect(advance).toBeTruthy();
    expect(advance?.textContent).toContain("RD_ADVANCING_TO_STEP 2");
  });

  it("should render step and nextStep from input stepResults", () => {
    fixture.componentRef.setInput("stepResults", {
      step: 3,
      group: 1,
      nextStep: 4,
      stepUpCount: 2,
      standings: [],
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const pill = el.querySelector(".step-badge-pill");
    expect(pill?.textContent).toContain("RD_STEP 3");
    const advance = el.querySelector(".step-advance-text");
    expect(advance).toBeTruthy();
    expect(advance?.textContent).toContain("RD_ADVANCING_TO_STEP 4");
  });

  it("should hide advance text when showAdvanceText is false", () => {
    fixture.componentRef.setInput("widget", {
      id: "w1",
      widgetType: "step-badge",
      customSettings: {
        showAdvanceText: false,
      },
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const advance = el.querySelector(".step-advance-text");
    expect(advance).toBeNull();
  });
});
