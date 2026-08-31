import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { GhostPacingService } from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";

import { RacedayGhostPacingComponent } from "./raceday-ghost-pacing.component";

describe("RacedayGhostPacingComponent", () => {
  let component: RacedayGhostPacingComponent;
  let fixture: ComponentFixture<RacedayGhostPacingComponent>;

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
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render empty state when targetGhostLapTime is 0", () => {
    fixture.componentRef.setInput("laneRecord", 0);
    fixture.componentRef.setInput("personalBest", 0);
    fixture.detectChanges();

    expect(component.targetGhostLapTime()).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".pacing-empty")).toBeTruthy();
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

  it("should render ahead badge with green formatting when delta is positive", () => {
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
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".delta-badge.ahead")).toBeTruthy();
    expect(component.formattedDelta()).toContain("+");
  });

  it("should format behind delta when driver is slower than ghost", () => {
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
    expect(component.formattedDelta()).toContain("-");
  });

  it("should render -- for empty driver lanes", () => {
    const mockEmptyHd = {
      laneIndex: 0,
      isEmpty: true,
    } as unknown as DriverHeatData;

    fixture.componentRef.setInput("driverHeatData", mockEmptyHd);
    fixture.componentRef.setInput("laneRecord", 5.0);
    fixture.detectChanges();

    expect(component.isEmptyDriver()).toBeTrue();
    expect(component.targetGhostLapTime()).toBe(0);
    expect(component.formattedDelta()).toBe("--");
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("--");
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

  it("should render 3-row stacked view when stacked is true with benchmark data", () => {
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

    const compiled = fixture.nativeElement as HTMLElement;
    const stackedContent = compiled.querySelector(".pacing-stacked-content");
    expect(stackedContent).toBeTruthy();

    const labelEl = compiled.querySelector(".pacing-benchmark-label");
    expect(labelEl?.textContent?.trim()).toBe("Lane Record");

    const timeEl = compiled.querySelector(".pacing-target-time");
    expect(timeEl?.textContent?.trim()).toBe("5.20s");

    const badgeEl = compiled.querySelector(".delta-badge");
    expect(badgeEl).toBeTruthy();
    expect(badgeEl?.classList.contains("ahead")).toBeTrue();
  });

  it("should render stacked placeholder when stacked is true and targetGhostLapTime is 0", () => {
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

    const compiled = fixture.nativeElement as HTMLElement;
    const stackedContent = compiled.querySelector(".pacing-stacked-content");
    expect(stackedContent).toBeTruthy();

    const timeEl = compiled.querySelector(".pacing-target-time");
    expect(timeEl?.textContent?.trim()).toBe("--.--s");
  });
});
