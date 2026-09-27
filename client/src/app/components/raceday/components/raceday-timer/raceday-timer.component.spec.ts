import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceTimeService } from "@app/services/race-time.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayTimerComponent } from "./raceday-timer.component";
import { RacedayTimerHarness } from "./testing/raceday-timer.harness";

describe("RacedayTimerComponent", () => {
  let component: RacedayTimerComponent;
  let fixture: ComponentFixture<RacedayTimerComponent>;
  let harness: RacedayTimerHarness;
  let originalOnError: any;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

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

    await TestBed.configureTestingModule({
      imports: [RacedayTimerComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayTimerComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayTimerHarness,
    );
    fixture.detectChanges();
  });

  afterEach(() => {
    if (originalOnError !== undefined) {
      window.onerror = originalOnError;
    }
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render time string and handle conditional labels", async () => {
    fixture.componentRef.setInput("formattedTime", "02:30.000");
    fixture.componentRef.setInput("autoStatusLabel", "");
    fixture.componentRef.setInput("isWarmup", false);
    fixture.componentRef.setInput("showCountdownOverlay", false);

    fixture.detectChanges();

    expect(await harness.getTimeText()).toBe("02:30.000");
    expect(await harness.getStatusLabel()).toBeNull();
    expect(await harness.getWarmupLabel()).toBeNull();

    // With warmup and status labels active
    fixture.componentRef.setInput("autoStatusLabel", "RD_PAUSED");
    fixture.componentRef.setInput("isWarmup", true);
    fixture.detectChanges();

    expect(await harness.getStatusLabel()).toBe("RD_PAUSED");
    expect(await harness.getWarmupLabel()).toBe("RD_WARMUP");

    // Hide status label when countdown overlay is active
    fixture.componentRef.setInput("showCountdownOverlay", true);
    fixture.detectChanges();

    expect(await harness.getStatusLabel()).toBeNull();
  });

  it("should apply custom style settings for timer text when widget input is set", () => {
    const mockWidget: any = {
      widgetType: "timer",
      customSettings: {
        timeFontFamily: "Arial",
        timeFontSize: 85,
        timeTextColor: "#ff0000",
      },
    };
    fixture.componentRef.setInput("widget", mockWidget);
    fixture.componentRef.setInput("autoStatusLabel", "RD_PAUSED");
    fixture.componentRef.setInput("isWarmup", true);
    fixture.detectChanges();

    const timerTextEl = fixture.nativeElement.querySelector(".timer-text");
    expect(timerTextEl.style.fontFamily).toBe("Arial");
    expect(timerTextEl.style.fontSize).toBe("85px");
    expect(timerTextEl.style.color).toBe("rgb(255, 0, 0)");
  });

  it("should NOT apply custom font sizes for timer text when scaleMode is auto", () => {
    const mockWidget: any = {
      widgetType: "timer",
      scaleMode: "auto",
      customSettings: {
        timeFontFamily: "Arial",
        timeFontSize: 85,
        timeTextColor: "#ff0000",
      },
    };
    fixture.componentRef.setInput("widget", mockWidget);
    fixture.detectChanges();

    const timerTextEl = fixture.nativeElement.querySelector(".timer-text");
    expect(timerTextEl.style.fontSize).toBeFalsy();
  });

  it("should render with timer-panel and timer-text classes for styling", () => {
    fixture.componentRef.setInput("formattedTime", "01:23");
    fixture.detectChanges();
    const timerPanel = fixture.nativeElement.querySelector(".timer-panel");
    const timerText = fixture.nativeElement.querySelector(".timer-text");
    expect(timerPanel).toBeTruthy();
    expect(timerText).toBeTruthy();
    expect(timerText.textContent.trim()).toBe("01:23");
  });

  it("should apply timer-warmup class during warmup state", () => {
    fixture.componentRef.setInput("formattedTime", "01:23");
    fixture.componentRef.setInput("isWarmup", true);
    fixture.detectChanges();
    const timerText = fixture.nativeElement.querySelector(".timer-text");
    expect(timerText.classList.contains("timer-warmup")).toBe(true);
    expect(timerText.classList.contains("timer-auto")).toBe(false);
  });

  it("should apply timer-auto class during auto-start/auto-advance (not warmup)", () => {
    fixture.componentRef.setInput("formattedTime", "01:23");
    fixture.componentRef.setInput("autoStatusLabel", "RD_AUTO_START");
    fixture.componentRef.setInput("isWarmup", false);
    fixture.componentRef.setInput("showCountdownOverlay", false);
    fixture.detectChanges();
    const timerText = fixture.nativeElement.querySelector(".timer-text");
    expect(timerText.classList.contains("timer-auto")).toBe(true);
    expect(timerText.classList.contains("timer-warmup")).toBe(false);
  });

  it("should not apply timer-auto class during countdown overlay", () => {
    fixture.componentRef.setInput("formattedTime", "01:23");
    fixture.componentRef.setInput("autoStatusLabel", "RD_AUTO_START");
    fixture.componentRef.setInput("isWarmup", false);
    fixture.componentRef.setInput("showCountdownOverlay", true);
    fixture.detectChanges();
    const timerText = fixture.nativeElement.querySelector(".timer-text");
    expect(timerText.classList.contains("timer-auto")).toBe(false);
  });

  it("should not apply timer-auto class during warmup even with auto status", () => {
    fixture.componentRef.setInput("formattedTime", "01:23");
    fixture.componentRef.setInput("autoStatusLabel", "RD_AUTO_START");
    fixture.componentRef.setInput("isWarmup", true);
    fixture.componentRef.setInput("showCountdownOverlay", false);
    fixture.detectChanges();
    const timerText = fixture.nativeElement.querySelector(".timer-text");
    expect(timerText.classList.contains("timer-warmup")).toBe(true);
    expect(timerText.classList.contains("timer-auto")).toBe(false);
  });

  it("should fallback to RaceTimeService when inputs are not provided", async () => {
    const mockRaceTimeService = {
      formattedTime: "04:56.7",
      formattedTime$: of("04:56.7"),
      autoStatusLabel: "RD_AUTO_ADVANCING",
      autoStatusLabel$: of("RD_AUTO_ADVANCING"),
      isWarmup: true,
      isWarmup$: of(true),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RacedayTimerComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RaceTimeService, useValue: mockRaceTimeService },
      ],
    }).compileComponents();

    const localFixture = TestBed.createComponent(RacedayTimerComponent);
    const localHarness = await TestbedHarnessEnvironment.harnessForFixture(
      localFixture,
      RacedayTimerHarness,
    );
    localFixture.detectChanges();

    expect(await localHarness.getTimeText()).toBe("04:56.7");
    expect(await localHarness.getStatusLabel()).toBe("RD_AUTO_ADVANCING");
    expect(await localHarness.getWarmupLabel()).toBe("RD_WARMUP");
  });
});
