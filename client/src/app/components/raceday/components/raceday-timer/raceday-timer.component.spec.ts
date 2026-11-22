import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject, of } from "rxjs";
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

  it("should apply custom background color from customSettings", () => {
    fixture.componentRef.setInput("widget", {
      id: "timer-1",
      widgetType: "timer",
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      zIndex: 1,
      customSettings: {
        backgroundColor: "#123456",
      },
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".timer-panel");
    expect(panelEl.style.backgroundColor).toBe("rgb(18, 52, 86)");
  });

  it("should apply custom background color from widget.backgroundColor as fallback", () => {
    fixture.componentRef.setInput("widget", {
      id: "timer-2",
      widgetType: "timer",
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      zIndex: 1,
      backgroundColor: "#223344",
      customSettings: {},
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".timer-panel");
    expect(panelEl.style.backgroundColor).toBe("rgb(34, 51, 68)");
  });

  it("should leave background-color empty when not set", () => {
    fixture.componentRef.setInput("widget", {
      id: "timer-3",
      widgetType: "timer",
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      zIndex: 1,
      customSettings: {},
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".timer-panel");
    expect(panelEl.style.backgroundColor).toBe("");
  });

  it("should render time string and handle conditional labels", async () => {
    fixture.componentRef.setInput("formattedTime", "02:30.000");
    fixture.componentRef.setInput("autoStatusLabel", "");
    fixture.componentRef.setInput("isWarmup", false);
    fixture.componentRef.setInput("isCooldown", false);
    fixture.componentRef.setInput("showCountdownOverlay", false);

    fixture.detectChanges();

    expect(await harness.getTimeText()).toBe("02:30.000");
    expect(await harness.getStatusLabel()).toBeNull();
    expect(await harness.getWarmupLabel()).toBeNull();
    expect(await harness.getCooldownLabel()).toBeNull();

    // With warmup and status labels active
    fixture.componentRef.setInput("autoStatusLabel", "RD_PAUSED");
    fixture.componentRef.setInput("isWarmup", true);
    fixture.componentRef.setInput("isCooldown", false);
    fixture.detectChanges();

    expect(await harness.getStatusLabel()).toBe("RD_PAUSED");
    expect(await harness.getWarmupLabel()).toBe("RD_WARMUP");
    expect(await harness.getCooldownLabel()).toBeNull();

    // With cooldown active instead of warmup
    fixture.componentRef.setInput("isWarmup", false);
    fixture.componentRef.setInput("isCooldown", true);
    fixture.detectChanges();

    expect(await harness.getStatusLabel()).toBe("RD_PAUSED");
    expect(await harness.getWarmupLabel()).toBe("RD_COOLDOWN");
    expect(await harness.getCooldownLabel()).toBe("RD_COOLDOWN");

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

  it("should use the application font for status labels and keep the selected clock font", () => {
    fixture.componentRef.setInput("widget", {
      widgetType: "timer",
      customSettings: { timeFontFamily: "Orbitron" },
    });
    fixture.componentRef.setInput("autoStatusLabel", "RD_PAUSED");
    fixture.componentRef.setInput("isWarmup", true);
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector(".status-label");
    const warmup = fixture.nativeElement.querySelector(".warmup-label");
    const clock = fixture.nativeElement.querySelector(".timer-text");

    expect(getComputedStyle(status).fontFamily).toContain("Segoe UI");
    expect(getComputedStyle(warmup).fontFamily).toBe(
      getComputedStyle(status).fontFamily,
    );
    expect(getComputedStyle(clock).fontFamily).toBe("Orbitron");
  });

  it("should apply custom font sizes for timer text even when scaleMode is auto", () => {
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
    (component as any).fitText();

    const timerTextEl = fixture.nativeElement.querySelector(".timer-text");
    const timerPanelEl = fixture.nativeElement.querySelector(".timer-panel");
    expect(timerTextEl.style.fontSize).toBe("85px");
    // the custom size is the maximum; it may only shrink to fit the panel
    const applied = parseInt(
      timerPanelEl.style.getPropertyValue("--timer-font-size"),
      10,
    );
    expect(applied).toBeGreaterThan(0);
    expect(applied).toBeLessThanOrEqual(85);
  });

  it("should keep the custom time font size when it fits and shrink it when it does not (auto)", () => {
    const panelEl = () =>
      fixture.nativeElement.querySelector(".timer-panel") as HTMLElement;
    const run = (w: number, h: number) => {
      fixture.componentRef.setInput("widget", {
        widgetType: "timer",
        scaleMode: "auto",
        customSettings: { timeFontSize: 60 },
      } as any);
      fixture.detectChanges();
      Object.defineProperty(panelEl(), "clientWidth", {
        value: w,
        configurable: true,
      });
      Object.defineProperty(panelEl(), "clientHeight", {
        value: h,
        configurable: true,
      });
      (component as any).lastFittedWidth = -1;
      (component as any).fitText();
      return parseInt(
        panelEl().style.getPropertyValue("--timer-font-size"),
        10,
      );
    };
    expect(run(2000, 600)).toBe(60);
    expect(run(120, 90)).toBeLessThan(60);
  });

  it("should use the custom time font size as-is in fixed scale mode", () => {
    fixture.componentRef.setInput("widget", {
      widgetType: "timer",
      scaleMode: "fixed",
      customSettings: { timeFontSize: 70 },
    } as any);
    fixture.detectChanges();
    (component as any).fitText();
    const panel = fixture.nativeElement.querySelector(".timer-panel");
    expect(panel.style.getPropertyValue("--timer-font-size")).toBe("70px");
  });

  describe("editor mode mock time formatting", () => {
    it("should display mock time according to timeDisplayFormat in editor mode", async () => {
      fixture.componentRef.setInput("isEditor", true);

      // Default dynamic format
      fixture.componentRef.setInput("widget", {
        widgetType: "timer",
        customSettings: { timeDisplayFormat: "dynamic" },
      });
      fixture.detectChanges();
      expect(await harness.getTimeText()).toBe("2:03");

      // mm_ss format
      fixture.componentRef.setInput("widget", {
        widgetType: "timer",
        customSettings: { timeDisplayFormat: "mm_ss" },
      });
      fixture.detectChanges();
      expect(await harness.getTimeText()).toBe("02:03");

      // m_ss format
      fixture.componentRef.setInput("widget", {
        widgetType: "timer",
        customSettings: { timeDisplayFormat: "m_ss" },
      });
      fixture.detectChanges();
      expect(await harness.getTimeText()).toBe("2:03");

      // hh_mm_ss format
      fixture.componentRef.setInput("widget", {
        widgetType: "timer",
        customSettings: { timeDisplayFormat: "hh_mm_ss" },
      });
      fixture.detectChanges();
      expect(await harness.getTimeText()).toBe("00:02:03");

      // seconds format
      fixture.componentRef.setInput("widget", {
        widgetType: "timer",
        customSettings: { timeDisplayFormat: "seconds" },
      });
      fixture.detectChanges();
      expect(await harness.getTimeText()).toBe("123");
    });

    it("should display subseconds in editor mode when subsecondMode is always", async () => {
      fixture.componentRef.setInput("isEditor", true);
      fixture.componentRef.setInput("widget", {
        widgetType: "timer",
        customSettings: {
          timeDisplayFormat: "mm_ss",
          timeSubsecondMode: "always",
          timeSubsecondDecimals: 2,
        },
      });
      fixture.detectChanges();
      expect(await harness.getTimeText()).toBe("02:03.45");
    });

    it("should prioritize formattedTime input over mock time even in editor mode", async () => {
      fixture.componentRef.setInput("isEditor", true);
      fixture.componentRef.setInput("formattedTime", "99:99");
      fixture.componentRef.setInput("widget", {
        widgetType: "timer",
        customSettings: { timeDisplayFormat: "hh_mm_ss" },
      });
      fixture.detectChanges();
      expect(await harness.getTimeText()).toBe("99:99");
    });
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

  it("should apply timer-warmup class during cooldown state", () => {
    fixture.componentRef.setInput("formattedTime", "01:23");
    fixture.componentRef.setInput("isWarmup", false);
    fixture.componentRef.setInput("isCooldown", true);
    fixture.detectChanges();
    const timerText = fixture.nativeElement.querySelector(".timer-text");
    expect(timerText.classList.contains("timer-warmup")).toBe(true);
    expect(timerText.classList.contains("timer-auto")).toBe(false);
  });

  it("should apply timer-auto class during auto-start/auto-advance (not warmup or cooldown)", () => {
    fixture.componentRef.setInput("formattedTime", "01:23");
    fixture.componentRef.setInput("autoStatusLabel", "RD_AUTO_START");
    fixture.componentRef.setInput("isWarmup", false);
    fixture.componentRef.setInput("isCooldown", false);
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

  it("should not apply timer-auto class during cooldown even with auto status", () => {
    fixture.componentRef.setInput("formattedTime", "01:23");
    fixture.componentRef.setInput("autoStatusLabel", "RD_AUTO_ADVANCING");
    fixture.componentRef.setInput("isWarmup", false);
    fixture.componentRef.setInput("isCooldown", true);
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
      isCooldown: false,
      isCooldown$: of(false),
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
    expect(await localHarness.getCooldownLabel()).toBeNull();
  });

  it("should fallback to RaceTimeService for isCooldown when inputs are not provided", async () => {
    const mockRaceTimeService = {
      formattedTime: "00:04.0",
      formattedTime$: of("00:04.0"),
      autoStatusLabel: "RD_AUTO_ADVANCING",
      autoStatusLabel$: of("RD_AUTO_ADVANCING"),
      isWarmup: false,
      isWarmup$: of(false),
      isCooldown: true,
      isCooldown$: of(true),
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

    expect(await localHarness.getTimeText()).toBe("00:04.0");
    expect(await localHarness.getStatusLabel()).toBe("RD_AUTO_ADVANCING");
    expect(await localHarness.getWarmupLabel()).toBe("RD_COOLDOWN");
    expect(await localHarness.getCooldownLabel()).toBe("RD_COOLDOWN");
  });

  it("should skip fitText layout calculations when text length and container dimensions are unchanged", () => {
    const textEl = fixture.nativeElement.querySelector(".timer-text");
    const panelEl = fixture.nativeElement.querySelector(".timer-panel");
    spyOnProperty(panelEl, "clientWidth", "get").and.returnValue(200);
    spyOnProperty(panelEl, "clientHeight", "get").and.returnValue(100);

    const setPropertySpy = spyOn(
      panelEl.style,
      "setProperty",
    ).and.callThrough();

    // First fitting
    textEl.textContent = "01:23.45";
    (component as any).fitText();
    const firstCallCount = setPropertySpy.calls.count();
    expect(firstCallCount).toBeGreaterThan(0);

    // Second fitting with identical length and dimensions ("01:23.46")
    textEl.textContent = "01:23.46";
    (component as any).fitText();

    // setProperty should not be called again because of cache hit
    expect(setPropertySpy.calls.count()).toBe(firstCallCount);

    // Third fitting with different length ("1:23.46")
    textEl.textContent = "1:23.46";
    (component as any).fitText();

    expect(setPropertySpy.calls.count()).toBeGreaterThan(firstCallCount);
  });

  it("should directly update timer textContent without angular change detection when raceTimeService emits", () => {
    const formattedSubject = new BehaviorSubject<string>("01:00.00");
    const mockService = {
      formattedTime: "01:00.00",
      formattedTime$: formattedSubject.asObservable(),
      autoStatusLabel: "",
      autoStatusLabel$: of(""),
      isWarmup: false,
      isWarmup$: of(false),
      isCooldown: false,
      isCooldown$: of(false),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RacedayTimerComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RaceTimeService, useValue: mockService },
      ],
    });

    const localFixture = TestBed.createComponent(RacedayTimerComponent);
    localFixture.detectChanges();

    const timerTextEl = localFixture.nativeElement.querySelector(".timer-text");
    expect(timerTextEl.textContent.trim()).toBe("01:00.00");

    // Emit new time outside Angular
    formattedSubject.next("01:00.01");
    // Verify direct DOM update occurred without calling fixture.detectChanges()
    expect(timerTextEl.textContent.trim()).toBe("01:00.01");
  });

  it("should directly update timer textContent via interpolatedFormattedTime$ without angular change detection", () => {
    const formattedSubject = new BehaviorSubject<string>("01:00.00");
    const interpolatedSubject = new BehaviorSubject<string>("01:00.00");
    const mockService = {
      formattedTime: "01:00.00",
      formattedTime$: formattedSubject.asObservable(),
      interpolatedFormattedTime$: interpolatedSubject.asObservable(),
      autoStatusLabel: "",
      autoStatusLabel$: of(""),
      isWarmup: false,
      isWarmup$: of(false),
      isCooldown: false,
      isCooldown$: of(false),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RacedayTimerComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RaceTimeService, useValue: mockService },
      ],
    });

    const localFixture = TestBed.createComponent(RacedayTimerComponent);
    localFixture.detectChanges();

    const timerTextEl = localFixture.nativeElement.querySelector(".timer-text");
    expect(timerTextEl.textContent.trim()).toBe("01:00.00");

    // Emit high-frequency interpolated tick
    interpolatedSubject.next("01:00.01");
    expect(timerTextEl.textContent.trim()).toBe("01:00.01");
  });

  it("should not re-trigger font fitting effect when time ticks with identical character length", async () => {
    const fitSpy = spyOn<any>(component, "fitText").and.callThrough();
    fitSpy.calls.reset();

    fixture.componentRef.setInput("formattedTime", "00:01.23");
    fixture.detectChanges();
    await fixture.whenStable();

    const fitCallsAfterFirst = fitSpy.calls.count();

    // Change time with same length ("00:01.24" -> 8 chars)
    fixture.componentRef.setInput("formattedTime", "00:01.24");
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fitSpy.calls.count()).toBe(fitCallsAfterFirst);

    // Change time with different length ("0:01.24" -> 7 chars)
    fixture.componentRef.setInput("formattedTime", "0:01.24");
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fitSpy.calls.count()).toBeGreaterThan(fitCallsAfterFirst);
  });

  it("should clean up timeSub and resizeObserver on destroy", () => {
    const timeSub = (component as any).timeSub;
    const observer = (component as any).resizeObserver;
    if (timeSub) {
      spyOn(timeSub, "unsubscribe").and.callThrough();
    }
    if (observer) {
      spyOn(observer, "disconnect").and.callThrough();
    }

    component.ngOnDestroy();

    if (timeSub) {
      expect(timeSub.unsubscribe).toHaveBeenCalled();
    }
  });

  describe("status text options (#1197)", () => {
    const show = (customSettings: any, key = "RD_AUTO_ADVANCING") => {
      fixture.componentRef.setInput("widget", { customSettings });
      fixture.componentRef.setInput("formattedTime", "00:45");
      fixture.componentRef.setInput("autoStatusLabel", key);
      fixture.componentRef.setInput("showCountdownOverlay", false);
      fixture.detectChanges();
      return fixture.nativeElement.querySelector(
        ".status-label",
      ) as HTMLElement | null;
    };

    it("shows the default translated text in uppercase when nothing is set", () => {
      const label = show({});
      expect(label?.textContent?.trim()).toBe("RD_AUTO_ADVANCING");
      expect(label?.classList).not.toContain("status-label-as-typed");
    });

    it("shows the user's own Auto-Advancing and Auto-Starting text", () => {
      expect(
        show({ autoAdvancingText: "  Next heat soon  " })?.textContent?.trim(),
      ).toBe("Next heat soon");
      expect(
        show(
          { autoStartingText: "Get ready" },
          "RD_AUTO_STARTING",
        )?.textContent?.trim(),
      ).toBe("Get ready");
    });

    it("keeps other status keys translated", () => {
      expect(
        show({ autoAdvancingText: "x" }, "RD_PAUSED")?.textContent?.trim(),
      ).toBe("RD_PAUSED");
    });

    it("hides the status text when switched off", () => {
      expect(show({ showStatusText: false })).toBeNull();
    });

    it("shows the text as typed when Uppercase is off", () => {
      const label = show({ statusUppercase: false, autoAdvancingText: "soon" });
      expect(label?.classList).toContain("status-label-as-typed");
    });

    it("applies the status font family, size and colour", () => {
      const label = show({
        statusFontFamily: "Inter",
        statusFontSize: 30,
        statusTextColor: "#ff0000",
      });
      expect(label?.style.fontFamily).toContain("Inter");
      expect(label?.style.fontSize).toBe("30px");
      expect(label?.style.color).toBe("rgb(255, 0, 0)");
      const container = fixture.nativeElement.querySelector(
        ".top-label",
      ) as HTMLElement;
      expect(container.style.height).toBe("42px");
    });

    it("keeps the 24px label row without a custom size", () => {
      show({});
      const container = fixture.nativeElement.querySelector(
        ".top-label",
      ) as HTMLElement;
      expect(container.style.height).toBe("24px");
    });
  });
});
