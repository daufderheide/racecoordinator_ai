import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayRecordsComponent } from "./raceday-records.component";
import { RacedayRecordsHarness } from "./testing/raceday-records.harness";

describe("RacedayRecordsComponent", () => {
  let component: RacedayRecordsComponent;
  let fixture: ComponentFixture<RacedayRecordsComponent>;
  let harness: RacedayRecordsHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayRecordsComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayRecordsComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayRecordsHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render default fallbacks when input records are empty", async () => {
    // Initial state
    const raceLap = await harness.getRecordRowValues(0);
    expect(raceLap.nickname).toBe("---");
    expect(raceLap.score).toBe("--.---");

    const raceScore = await harness.getRecordRowValues(1);
    expect(raceScore.nickname).toBe("---");
    expect(raceScore.score).toBe("--");

    const currentRaceBest = await harness.getRecordRowValues(2);
    expect(currentRaceBest.nickname).toBe("---");
    expect(currentRaceBest.score).toBe("--.---");

    const heatBest = await harness.getRecordRowValues(3);
    expect(heatBest.nickname).toBe("---");
    expect(heatBest.score).toBe("--.---");
  });

  it("should display record values and format time using decimal pipe when inputs are provided", async () => {
    fixture.componentRef.setInput("raceRecordLapNickname", "Alice");
    fixture.componentRef.setInput("raceRecordLapTime", 9.8765);

    fixture.componentRef.setInput("raceRecordScoreNickname", "Bob");
    fixture.componentRef.setInput("raceRecordScore", 12.3);

    fixture.componentRef.setInput("currentRaceBestNickname", "Charlie");
    fixture.componentRef.setInput("currentRaceBestTime", 10.45);

    fixture.componentRef.setInput("heatBestNickname", "Dave");
    fixture.componentRef.setInput("heatBestTime", 11.2345);

    fixture.detectChanges();

    const raceLap = await harness.getRecordRowValues(0);
    expect(raceLap.nickname).toBe("Alice");
    expect(raceLap.score).toBe("9.877"); // formatted 1.3-3

    const raceScore = await harness.getRecordRowValues(1);
    expect(raceScore.nickname).toBe("Bob");
    expect(raceScore.score).toBe("12.300"); // formatted 1.3-3

    const currentBest = await harness.getRecordRowValues(2);
    expect(currentBest.nickname).toBe("Charlie");
    expect(currentBest.score).toBe("10.450");

    const heatBest = await harness.getRecordRowValues(3);
    expect(heatBest.nickname).toBe("Dave");
    expect(heatBest.score).toBe("11.235");
  });

  it("should apply custom widget styles to headers and values when widget settings are provided", () => {
    fixture.componentRef.setInput("widget", {
      id: "widget-records",
      widgetType: "records",
      x: 0,
      y: 0,
      width: 384,
      height: 239,
      zIndex: 100,
      customSettings: {
        headerFontFamily: "Arial",
        headerFontSize: 22,
        headerTextColor: "#ff0000",
        valueFontFamily: "Courier New",
        valueFontSize: 25,
        valueTextColor: "#00ff00",
      },
    });

    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll(".record-header");
    expect(headers.length).toBeGreaterThan(0);
    for (let i = 0; i < headers.length; i++) {
      const el = headers[i] as HTMLElement;
      expect(el.style.fontFamily).toBe("Arial");
      expect(el.style.fontSize).toBe("22px");
      expect(el.style.color).toBe("rgb(255, 0, 0)");
    }

    const values = fixture.nativeElement.querySelectorAll(".record-val");
    expect(values.length).toBeGreaterThan(0);
    for (let i = 0; i < values.length; i++) {
      const el = values[i] as HTMLElement;
      // Some engines might return 'Courier New' or '"Courier New"' for font-family
      expect(el.style.fontFamily.replace(/['"]/g, "")).toBe("Courier New");
      expect(el.style.fontSize).toBe("25px");
      expect(el.style.color).toBe("rgb(0, 255, 0)");
    }
  });

  it("should NOT apply custom widget styles to headers and values when scaleMode is auto", () => {
    fixture.componentRef.setInput("widget", {
      id: "widget-records",
      widgetType: "records",
      scaleMode: "auto",
      customSettings: {
        headerFontFamily: "Arial",
        headerFontSize: 22,
        headerTextColor: "#ff0000",
        valueFontFamily: "Courier New",
        valueFontSize: 25,
        valueTextColor: "#00ff00",
      },
    });

    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll(".record-header");
    expect(headers.length).toBeGreaterThan(0);
    for (let i = 0; i < headers.length; i++) {
      const el = headers[i] as HTMLElement;
      expect(el.style.fontSize).toBeFalsy();
    }

    const values = fixture.nativeElement.querySelectorAll(".record-val");
    expect(values.length).toBeGreaterThan(0);
    for (let i = 0; i < values.length; i++) {
      const el = values[i] as HTMLElement;
      expect(el.style.fontSize).toBeFalsy();
    }
  });

  it("should apply correct styling classes (stripe, no-stripe, first-row) on headers and rows", () => {
    const headers = fixture.nativeElement.querySelectorAll(".record-header");
    expect(headers.length).toBe(4);
    expect(headers[0].classList.contains("stripe")).toBeTrue();
    expect(headers[1].classList.contains("no-stripe")).toBeTrue();
    expect(headers[2].classList.contains("stripe")).toBeTrue();
    expect(headers[3].classList.contains("no-stripe")).toBeTrue();

    const rows = fixture.nativeElement.querySelectorAll(".record-row");
    expect(rows.length).toBe(4);
    expect(rows[0].classList.contains("stripe")).toBeTrue();
    expect(rows[0].classList.contains("first-row")).toBeTrue();
    expect(rows[1].classList.contains("no-stripe")).toBeTrue();
    expect(rows[2].classList.contains("stripe")).toBeTrue();
    expect(rows[3].classList.contains("no-stripe")).toBeTrue();
  });

  it("should render record-group containers and separate name and value classes for alignment", () => {
    const groups = fixture.nativeElement.querySelectorAll(".record-group");
    expect(groups.length).toBe(4);
    expect(groups[0].classList.contains("stripe")).toBeTrue();
    expect(groups[1].classList.contains("no-stripe")).toBeTrue();

    const names = fixture.nativeElement.querySelectorAll(
      ".record-row .record-name",
    );
    expect(names.length).toBe(4);

    const values = fixture.nativeElement.querySelectorAll(
      ".record-row .record-value",
    );
    expect(values.length).toBe(4);
  });

  it("should calculate and set CSS custom properties for auto-scaled record values when scaleMode is auto", (done) => {
    fixture.componentRef.setInput("widget", {
      id: "widget-records",
      widgetType: "records",
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      zIndex: 100,
      scaleMode: "auto",
      customSettings: {},
    });
    fixture.detectChanges();

    setTimeout(() => {
      const panel = fixture.nativeElement.querySelector(
        ".record-panel",
      ) as HTMLElement;
      expect(panel).toBeTruthy();
      const valSize = panel.style.getPropertyValue("--record-value-font-size");
      const headerSize = panel.style.getPropertyValue(
        "--record-header-font-size",
      );
      expect(valSize).toBeTruthy();
      expect(headerSize).toBeTruthy();
      expect(valSize.endsWith("px")).toBeTrue();
      expect(headerSize.endsWith("px")).toBeTrue();
      done();
    }, 50);
  });

  it("should not render records that are disabled in customSettings", async () => {
    fixture.componentRef.setInput("widget", {
      id: "widget-records",
      widgetType: "records",
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      zIndex: 100,
      customSettings: {
        showRaceRecordLap: false,
        showCurrentRaceBest: false,
      },
    });
    fixture.componentRef.setInput("raceRecordScoreNickname", "Bob");
    fixture.componentRef.setInput("raceRecordScore", 15);
    fixture.componentRef.setInput("heatBestNickname", "Dave");
    fixture.componentRef.setInput("heatBestTime", 10.5);
    fixture.detectChanges();

    expect(await harness.getRowCount()).toBe(2);

    const firstVisible = await harness.getRecordRowValues(0);
    expect(firstVisible.nickname).toBe("Bob");

    const secondVisible = await harness.getRecordRowValues(1);
    expect(secondVisible.nickname).toBe("Dave");

    const headers = fixture.nativeElement.querySelectorAll(".record-header");
    expect(headers.length).toBe(2);
    expect(headers[0].textContent.trim()).toBe("RD_RECORD_RACE_SCORE");
    expect(headers[1].textContent.trim()).toBe("RD_RECORD_HEAT_BEST");
  });

  it("should render no records when all are disabled in customSettings", async () => {
    fixture.componentRef.setInput("widget", {
      id: "widget-records",
      widgetType: "records",
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      zIndex: 100,
      customSettings: {
        showRaceRecordLap: false,
        showRaceRecordScore: false,
        showCurrentRaceBest: false,
        showHeatBest: false,
      },
    });
    fixture.detectChanges();

    expect(await harness.getRowCount()).toBe(0);
    const headers = fixture.nativeElement.querySelectorAll(".record-header");
    expect(headers.length).toBe(0);
  });

  it("should set --record-count and calculate proportional font sizes when 2 records are visible", (done) => {
    fixture.componentRef.setInput("widget", {
      id: "widget-records",
      widgetType: "records",
      x: 1152,
      y: 90,
      width: 384,
      height: 239,
      zIndex: 100,
      scaleMode: "auto",
      customSettings: {
        showCurrentRaceBest: false,
        showHeatBest: false,
      },
    });
    fixture.componentRef.setInput("raceRecordLapNickname", "Mario");
    fixture.componentRef.setInput("raceRecordLapTime", 1.842);
    fixture.componentRef.setInput("raceRecordScoreNickname", "Luigi");
    fixture.componentRef.setInput("raceRecordScore", 24.5);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      ".record-panel",
    ) as HTMLElement;
    Object.defineProperty(panel, "clientWidth", { value: 384 });
    Object.defineProperty(panel, "clientHeight", { value: 239 });

    setTimeout(() => {
      (component as any).fitText();
      const valSize = panel.style.getPropertyValue("--record-value-font-size");
      const headerSize = panel.style.getPropertyValue(
        "--record-header-font-size",
      );
      const recordCount = panel.style.getPropertyValue("--record-count");

      expect(recordCount).toBe("2");
      expect(valSize).toBeTruthy();
      expect(headerSize).toBeTruthy();
      // Ensure font sizes remain proportional and do not blow up past standard widget limits
      const valPx = parseInt(valSize, 10);
      const headerPx = parseInt(headerSize, 10);
      expect(valPx).toBeLessThanOrEqual(25);
      expect(headerPx).toBeLessThanOrEqual(20);
      done();
    }, 50);
  });
});
