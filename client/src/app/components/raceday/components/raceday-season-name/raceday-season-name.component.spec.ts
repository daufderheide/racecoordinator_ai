import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { TranslationService } from "@app/services/translation.service";

import { RacedaySeasonNameComponent } from "./raceday-season-name.component";
import { RacedaySeasonNameHarness } from "./testing/raceday-season-name.harness";

describe("RacedaySeasonNameComponent", () => {
  let component: RacedaySeasonNameComponent;
  let fixture: ComponentFixture<RacedaySeasonNameComponent>;
  let harness: RacedaySeasonNameHarness;
  let originalOnError: any;

  beforeEach(async () => {
    originalOnError = window.onerror;
    window.onerror = function (message, url, line, col, error) {
      const msgStr = String(message || "");
      if (
        msgStr.includes("ResizeObserver loop") ||
        msgStr.includes("ResizeObserver loop limit exceeded")
      ) {
        return true;
      }
      return originalOnError
        ? originalOnError.call(window, message, url, line, col, error)
        : false;
    };

    const mockTranslationService = {
      translations$: new BehaviorSubject<{ [key: string]: string }>({}),
      translate: (key: string) => key,
    };

    await TestBed.configureTestingModule({
      imports: [RacedaySeasonNameComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedaySeasonNameComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedaySeasonNameHarness,
    );
    fixture.detectChanges();
  });

  afterEach(() => {
    window.onerror = originalOnError;
  });

  it("should create", async () => {
    expect(component).toBeTruthy();
    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getLabelText()).toBe("RD_LABEL_SEASON");
  });

  it("should display N/A when seasonName is empty", async () => {
    fixture.componentRef.setInput("seasonName", "");
    fixture.detectChanges();

    expect(await harness.getSeasonName()).toBe("N/A");
  });

  it("should display season name when input is provided", async () => {
    fixture.componentRef.setInput("seasonName", "2026 Winter Cup");
    fixture.detectChanges();

    expect(await harness.getSeasonName()).toBe("2026 Winter Cup");
  });

  it("should apply custom font size and fallback when scaleMode is custom", () => {
    fixture.componentRef.setInput("seasonName", "2026 Winter Cup");
    fixture.componentRef.setInput("widget", {
      id: "w-season",
      widgetType: "season-name",
      scaleMode: "",
      customSettings: {
        labelFontSize: 21,
        valueFontSize: 27,
      },
    } as any);
    fixture.detectChanges();

    const labelEl: HTMLElement =
      fixture.nativeElement.querySelector(".label-text");
    const valueEl: HTMLElement =
      fixture.nativeElement.querySelector(".value-text");
    expect(labelEl.style.fontSize).toBe("21px");
    expect(valueEl.style.fontSize).toBe("27px");

    // Test fallback when customSettings lacks font sizes
    fixture.componentRef.setInput("widget", {
      id: "w-season",
      widgetType: "season-name",
      scaleMode: "",
      customSettings: {},
    } as any);
    fixture.detectChanges();

    expect(labelEl.style.fontSize).toBe("13px");
    expect(valueEl.style.fontSize).toBe("18px");
  });

  it("should not apply inline font size when scaleMode is auto", () => {
    fixture.componentRef.setInput("seasonName", "2026 Winter Cup");
    fixture.componentRef.setInput("widget", {
      id: "w-season",
      widgetType: "season-name",
      scaleMode: "auto",
      customSettings: {
        labelFontSize: 21,
        valueFontSize: 27,
      },
    } as any);
    fixture.detectChanges();

    const labelEl: HTMLElement =
      fixture.nativeElement.querySelector(".label-text");
    const valueEl: HTMLElement =
      fixture.nativeElement.querySelector(".value-text");
    expect(labelEl.style.fontSize).toBe("");
    expect(valueEl.style.fontSize).toBe("");
  });
});
