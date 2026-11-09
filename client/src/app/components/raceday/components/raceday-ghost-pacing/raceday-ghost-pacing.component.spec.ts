import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { GhostPacingService } from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";

import { RacedayGhostPacingComponent } from "./raceday-ghost-pacing.component";
import { RacedayGhostPacingHarness } from "./testing/raceday-ghost-pacing.harness";

describe("RacedayGhostPacingComponent", () => {
  let component: RacedayGhostPacingComponent;
  let fixture: ComponentFixture<RacedayGhostPacingComponent>;
  let harness: RacedayGhostPacingHarness;

  beforeEach(async () => {
    const mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((key: string) => {
        const map: Record<string, string> = {
          RD_GHOST_LANE_RECORD: "Lane Record",
          RD_GHOST_PERSONAL_BEST: "Personal Best",
          RD_GHOST_PERSONAL_AVG: "Personal Avg",
          RD_GHOST_PERSONAL_MEDIAN: "Personal Median",
          RD_GHOST_HEAT_LEADER: "Leader Best",
          RD_GHOST_LEADER_BEST: "Leader Best",
          RD_GHOST_LEADER_AVG: "Leader Avg",
          RD_GHOST_LEADER_MEDIAN: "Leader Median",
          RD_GHOST_OVERALL_RECORD: "Overall Record",
          RD_GHOST_OVERALL_PERSONAL_BEST: "Overall PB",
          RD_GHOST_OVERALL_PERSONAL_AVG: "Overall Avg",
          RD_GHOST_OVERALL_PERSONAL_MEDIAN: "Overall Median",
          RD_GHOST_OVERALL_LEADER_BEST: "Overall Leader Best",
          RD_GHOST_OVERALL_LEADER_AVG: "Overall Leader Avg",
          RD_GHOST_OVERALL_LEADER_MEDIAN: "Overall Leader Median",
          RD_GHOST_NO_BENCHMARK: "No ghost benchmark",
          RD_GHOST_TELEMETRY_POSITION: "Live Telemetry Position",
        };
        return map[key] || key;
      }),
    };

    await TestBed.configureTestingModule({
      imports: [RacedayGhostPacingComponent],
      providers: [
        GhostPacingService,
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayGhostPacingComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayGhostPacingHarness,
    );
  });

  it("should create", async () => {
    expect(component).toBeTruthy();
    expect(await harness.isVisible()).toBeTrue();
  });

  it("should render empty state when targetGhostLapTime is 0", async () => {
    fixture.componentRef.setInput("laneRecord", 0);
    fixture.componentRef.setInput("personalBest", 0);
    fixture.detectChanges();

    expect(component.targetGhostLapTime()).toBe(0);
    expect(await harness.isEmpty()).toBeTrue();
  });

  it("should compute ghost gap and format ahead delta correctly", () => {
    const mockHd = {
      laneIndex: 0,
      currentLapTime: 2.0,
      driver: { name: "Driver 1" },
    } as unknown as DriverHeatData;

    fixture.componentRef.setInput("driverHeatData", mockHd);
    fixture.componentRef.setInput("laneRecord", 5.0);
    fixture.componentRef.setInput("benchmarkType", "LANE_RECORD");
    fixture.componentRef.setInput("lapProgress", 0.4);
    fixture.detectChanges();

    expect(component.targetGhostLapTime()).toBe(5.0);
    expect(component.benchmarkLabel()).toBe("Lane Record");
    expect(component.ghostGap().progressPct).toBe(0.4);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".pacing-track")).toBeNull();
    expect(compiled.querySelector(".ghost-marker")).toBeNull();
  });

  it("should render ahead badge with green formatting when delta is positive", async () => {
    // Current lap elapsed is 1.5s out of expected 2.5s (50% of 5.0s ghost)
    const mockHd = {
      laneIndex: 0,
      currentLapTime: 1.5,
      driver: { name: "Driver 1" },
    } as unknown as DriverHeatData;

    fixture.componentRef.setInput("driverHeatData", mockHd);
    fixture.componentRef.setInput("laneRecord", 5.0);
    fixture.componentRef.setInput("lapProgress", 0.5);
    fixture.detectChanges();

    expect(component.ghostGap().isAhead).toBeTrue();
    expect(await harness.isAhead()).toBeTrue();
    expect(await harness.getDeltaText()).toContain("+");
  });

  it("should format behind delta when driver is slower than ghost", async () => {
    // Current lap elapsed is 4.0s out of expected 3.0s (60% of 5.0s ghost)
    const mockHd = {
      laneIndex: 0,
      currentLapTime: 4.0,
      driver: { name: "Driver 1" },
    } as unknown as DriverHeatData;

    fixture.componentRef.setInput("driverHeatData", mockHd);
    fixture.componentRef.setInput("laneRecord", 5.0);
    fixture.componentRef.setInput("lapProgress", 0.6);
    fixture.detectChanges();

    expect(component.ghostGap().isAhead).toBeFalse();
    expect(await harness.isBehind()).toBeTrue();
    expect(await harness.getDeltaText()).toContain("-");
  });

  it("should render -- for empty driver lanes", async () => {
    const mockEmptyHd = {
      laneIndex: 0,
      isEmpty: true,
    } as unknown as DriverHeatData;

    fixture.componentRef.setInput("driverHeatData", mockEmptyHd);
    fixture.componentRef.setInput("laneRecord", 5.0);
    fixture.detectChanges();

    expect(component.isEmptyDriver()).toBeTrue();
    expect(component.targetGhostLapTime()).toBe(0);
    expect(await harness.isEmpty()).toBeTrue();
  });

  it("should support Personal Best and Leader benchmarks", () => {
    const mockHd = {
      laneIndex: 0,
      driver: { name: "Driver 1" },
      averageLapTime: 4.6,
      medianLapTime: 4.55,
      bestLapTime: 4.4,
    } as unknown as DriverHeatData;
    fixture.componentRef.setInput("driverHeatData", mockHd);
    fixture.componentRef.setInput("benchmarkType", "PERSONAL_BEST");
    fixture.componentRef.setInput("personalBest", 4.8);
    fixture.detectChanges();
    expect(component.benchmarkLabel()).toBe("Personal Best");
    expect(component.targetGhostLapTime()).toBe(4.8);

    fixture.componentRef.setInput("benchmarkType", "PERSONAL_AVG");
    fixture.detectChanges();
    expect(component.benchmarkLabel()).toBe("Personal Avg");
    expect(component.targetGhostLapTime()).toBe(4.6);

    fixture.componentRef.setInput("benchmarkType", "PERSONAL_MEDIAN");
    fixture.detectChanges();
    expect(component.benchmarkLabel()).toBe("Personal Median");
    expect(component.targetGhostLapTime()).toBe(4.55);

    fixture.componentRef.setInput("benchmarkType", "HEAT_LEADER_AVG");
    fixture.componentRef.setInput("heatLeaderAvg", 4.3);
    fixture.detectChanges();
    expect(component.benchmarkLabel()).toBe("Leader Avg");
    expect(component.targetGhostLapTime()).toBe(4.3);

    fixture.componentRef.setInput("benchmarkType", "HEAT_LEADER_MEDIAN");
    fixture.componentRef.setInput("heatLeaderMedian", 4.25);
    fixture.detectChanges();
    expect(component.benchmarkLabel()).toBe("Leader Median");
    expect(component.targetGhostLapTime()).toBe(4.25);

    fixture.componentRef.setInput("benchmarkType", "HEAT_LEADER_BEST");
    fixture.componentRef.setInput("heatLeaderBest", 4.1);
    fixture.detectChanges();
    expect(component.benchmarkLabel()).toBe("Leader Best");
    expect(component.targetGhostLapTime()).toBe(4.1);
  });

  it("should render 3-row stacked view when stacked is true with benchmark data", async () => {
    const mockHd = {
      laneIndex: 0,
      currentLapTime: 2.0,
      driver: { name: "Driver 1" },
    } as unknown as DriverHeatData;

    fixture.componentRef.setInput("driverHeatData", mockHd);
    fixture.componentRef.setInput("laneRecord", 5.2);
    fixture.componentRef.setInput("benchmarkType", "LANE_RECORD");
    fixture.componentRef.setInput("lapProgress", 0.5);
    fixture.componentRef.setInput("stacked", true);
    fixture.detectChanges();

    expect(await harness.getBenchmarkName()).toBe("Lane Record");
    expect(await harness.getTargetTimeText()).toBe("5.200s");
    expect(await harness.isAhead()).toBeTrue();
  });

  it("should render stacked placeholder when stacked is true and targetGhostLapTime is 0", async () => {
    const mockHd = {
      laneIndex: 0,
      driver: { name: "Driver 1" },
    } as unknown as DriverHeatData;
    fixture.componentRef.setInput("driverHeatData", mockHd);
    fixture.componentRef.setInput("laneRecord", 0);
    fixture.componentRef.setInput("personalBest", 0);
    fixture.componentRef.setInput("benchmarkType", "LANE_RECORD");
    fixture.componentRef.setInput("stacked", true);
    fixture.detectChanges();

    expect(await harness.getBenchmarkName()).toBe("Lane Record");
    expect(await harness.getTargetTimeText()).toBe("--");
  });

  it("should show -- for leader average before heat starts when leader has no avg lap time", async () => {
    const mockHd = {
      laneIndex: 0,
      driver: { name: "Driver 1" },
      bestLapTime: 3.456,
      averageLapTime: 0,
    } as unknown as DriverHeatData;
    fixture.componentRef.setInput("driverHeatData", mockHd);
    fixture.componentRef.setInput("benchmarkType", "HEAT_LEADER_AVG");
    fixture.componentRef.setInput("stacked", true);
    fixture.componentRef.setInput("personalBest", 3.456);
    fixture.componentRef.setInput("laneRecord", 4.2);
    fixture.componentRef.setInput("heatLeaderBest", 3.456);
    fixture.componentRef.setInput("heatLeaderAvg", 0);
    fixture.detectChanges();

    expect(component.targetGhostLapTime()).toBe(0);
    expect(component.formattedTargetGhostLapTime()).toBe("--");
    expect(await harness.getBenchmarkName()).toBe("Leader Avg");
    expect(await harness.getTargetTimeText()).toBe("--");
    expect(await harness.getDeltaText()).toBe("--");
  });

  it("should show leader avg lap time when heatLeaderAvg is available", async () => {
    const mockHd = {
      laneIndex: 0,
      driver: { name: "Driver 1" },
      averageLapTime: 3.8,
    } as unknown as DriverHeatData;
    fixture.componentRef.setInput("driverHeatData", mockHd);
    fixture.componentRef.setInput("benchmarkType", "HEAT_LEADER_AVG");
    fixture.componentRef.setInput("stacked", true);
    fixture.componentRef.setInput("heatLeaderAvg", 3.654);
    fixture.detectChanges();

    expect(component.targetGhostLapTime()).toBe(3.654);
    expect(component.formattedTargetGhostLapTime()).toBe("3.654s");
    expect(await harness.getTargetTimeText()).toBe("3.654s");
  });

  describe("overall pacing benchmarks", () => {
    const mockHd = {
      laneIndex: 0,
      driver: { name: "Driver 1" },
      bestLapTime: 4.5,
      averageLapTime: 4.8,
    } as unknown as DriverHeatData;

    it("should resolve OVERALL_RECORD from overallRecord input", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("benchmarkType", "OVERALL_RECORD");
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("overallRecord", 3.21);
      fixture.detectChanges();

      expect(component.targetGhostLapTime()).toBe(3.21);
      expect(await harness.getBenchmarkName()).toBe("Overall Record");
      expect(await harness.getTargetTimeText()).toBe("3.210s");
    });

    it("should resolve OVERALL_PERSONAL_BEST from overallPersonalBest input", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("benchmarkType", "OVERALL_PERSONAL_BEST");
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("overallPersonalBest", 3.456);
      fixture.detectChanges();

      expect(component.targetGhostLapTime()).toBe(3.456);
      expect(await harness.getBenchmarkName()).toBe("Overall PB");
      expect(await harness.getTargetTimeText()).toBe("3.456s");
    });

    it("should resolve OVERALL_PERSONAL_AVG and show -- when 0", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("benchmarkType", "OVERALL_PERSONAL_AVG");
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("overallPersonalAvg", 0);
      fixture.detectChanges();

      expect(component.targetGhostLapTime()).toBe(0);
      expect(component.formattedTargetGhostLapTime()).toBe("--");
      expect(await harness.getBenchmarkName()).toBe("Overall Avg");
      expect(await harness.getTargetTimeText()).toBe("--");

      // When available
      fixture.componentRef.setInput("overallPersonalAvg", 3.65);
      fixture.detectChanges();
      expect(component.targetGhostLapTime()).toBe(3.65);
      expect(await harness.getTargetTimeText()).toBe("3.650s");
    });

    it("should resolve OVERALL_PERSONAL_MEDIAN and show -- when 0", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("benchmarkType", "OVERALL_PERSONAL_MEDIAN");
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("overallPersonalMedian", 0);
      fixture.detectChanges();

      expect(component.targetGhostLapTime()).toBe(0);
      expect(await harness.getBenchmarkName()).toBe("Overall Median");
      expect(await harness.getTargetTimeText()).toBe("--");

      fixture.componentRef.setInput("overallPersonalMedian", 3.7);
      fixture.detectChanges();
      expect(component.targetGhostLapTime()).toBe(3.7);
      expect(await harness.getTargetTimeText()).toBe("3.700s");
    });

    it("should resolve OVERALL_LEADER_BEST from overallLeaderBest", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("benchmarkType", "OVERALL_LEADER_BEST");
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("overallLeaderBest", 3.333);
      fixture.detectChanges();

      expect(component.targetGhostLapTime()).toBe(3.333);
      expect(await harness.getBenchmarkName()).toBe("Overall Leader Best");
      expect(await harness.getTargetTimeText()).toBe("3.333s");
    });

    it("should resolve OVERALL_LEADER_AVG and show -- when 0", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("benchmarkType", "OVERALL_LEADER_AVG");
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("overallLeaderAvg", 0);
      fixture.detectChanges();

      expect(component.targetGhostLapTime()).toBe(0);
      expect(await harness.getBenchmarkName()).toBe("Overall Leader Avg");
      expect(await harness.getTargetTimeText()).toBe("--");

      fixture.componentRef.setInput("overallLeaderAvg", 3.55);
      fixture.detectChanges();
      expect(component.targetGhostLapTime()).toBe(3.55);
      expect(await harness.getTargetTimeText()).toBe("3.550s");
    });

    it("should resolve OVERALL_LEADER_MEDIAN and show -- when 0", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("benchmarkType", "OVERALL_LEADER_MEDIAN");
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("overallLeaderMedian", 0);
      fixture.detectChanges();

      expect(component.targetGhostLapTime()).toBe(0);
      expect(await harness.getBenchmarkName()).toBe("Overall Leader Median");
      expect(await harness.getTargetTimeText()).toBe("--");

      fixture.componentRef.setInput("overallLeaderMedian", 3.58);
      fixture.detectChanges();
      expect(component.targetGhostLapTime()).toBe(3.58);
      expect(await harness.getTargetTimeText()).toBe("3.580s");
    });
  });

  describe("decimalPlaces formatting [0, 3]", () => {
    const mockHd = {
      laneIndex: 0,
      currentLapTime: 2.0,
      driver: { name: "Driver 1" },
    } as unknown as DriverHeatData;

    it("should format target time, delta, and placeholders with 3 decimals by default", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("laneRecord", 5.234);
      fixture.componentRef.setInput("lapProgress", 0.5);
      fixture.componentRef.setInput("stacked", true);
      fixture.detectChanges();

      // expected ghost elapsed = 5.234 * 0.5 = 2.617s; live = 2.0s; delta = +0.617s
      expect(component.effectiveDecimals()).toBe(3);
      expect(component.formattedTargetGhostLapTime()).toBe("5.234s");
      expect(component.formattedDelta()).toBe("+0.617s");
      expect(await harness.getTargetTimeText()).toBe("5.234s");
      expect(await harness.getDeltaText()).toContain("+0.617s");
    });

    it("should format target time, delta, and placeholders with 2 decimals", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("laneRecord", 5.234);
      fixture.componentRef.setInput("lapProgress", 0.5);
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("decimalPlaces", 2);
      fixture.detectChanges();

      expect(component.effectiveDecimals()).toBe(2);
      expect(component.formattedTargetGhostLapTime()).toBe("5.23s");
      expect(component.formattedDelta()).toBe("+0.62s");
      expect(await harness.getTargetTimeText()).toBe("5.23s");
      expect(await harness.getDeltaText()).toContain("+0.62s");
    });

    it("should format target time, delta, and placeholders with 1 decimal", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("laneRecord", 5.234);
      fixture.componentRef.setInput("lapProgress", 0.5);
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("decimalPlaces", 1);
      fixture.detectChanges();

      expect(component.effectiveDecimals()).toBe(1);
      expect(component.formattedTargetGhostLapTime()).toBe("5.2s");
      expect(component.formattedDelta()).toBe("+0.6s");
      expect(await harness.getTargetTimeText()).toBe("5.2s");
      expect(await harness.getDeltaText()).toContain("+0.6s");
    });

    it("should format target time, delta, and placeholders with 0 decimals", async () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("laneRecord", 5.234);
      fixture.componentRef.setInput("lapProgress", 0.5);
      fixture.componentRef.setInput("stacked", true);
      fixture.componentRef.setInput("decimalPlaces", 0);
      fixture.detectChanges();

      expect(component.effectiveDecimals()).toBe(0);
      expect(component.formattedTargetGhostLapTime()).toBe("5s");
      expect(component.formattedDelta()).toBe("+1s");
      expect(await harness.getTargetTimeText()).toBe("5s");
      expect(await harness.getDeltaText()).toContain("+1s");

      // Placeholder with 0 decimals
      fixture.componentRef.setInput("laneRecord", 0);
      fixture.detectChanges();
      expect(component.targetTimePlaceholder()).toBe("--");
      expect(await harness.getTargetTimeText()).toBe("--");
    });

    it("should clamp decimalPlaces within [0, 3]", () => {
      fixture.componentRef.setInput("decimalPlaces", -1);
      fixture.detectChanges();
      expect(component.effectiveDecimals()).toBe(0);

      fixture.componentRef.setInput("decimalPlaces", 5);
      fixture.detectChanges();
      expect(component.effectiveDecimals()).toBe(3);
    });

    it("should format compact header tag with configured decimal places", () => {
      fixture.componentRef.setInput("driverHeatData", mockHd);
      fixture.componentRef.setInput("laneRecord", 6.123);
      fixture.componentRef.setInput("stacked", false);
      fixture.componentRef.setInput("decimalPlaces", 1);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tag = compiled.querySelector(".benchmark-tag");
      expect(tag?.getAttribute("title")).toContain("6.1s");
      expect(tag?.textContent).toContain("6.1s");
    });
  });
});
