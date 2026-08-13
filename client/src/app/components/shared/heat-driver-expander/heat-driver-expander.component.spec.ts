import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Driver } from "@app/models/driver";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

import {
  HeatDriverExpanderComponent,
  HeatExpanderData,
} from "./heat-driver-expander.component";

describe("HeatDriverExpanderComponent Analysis Section", () => {
  let component: HeatDriverExpanderComponent;
  let fixture: ComponentFixture<HeatDriverExpanderComponent>;

  const createMockHeatData = (laps: number[]): HeatExpanderData => {
    const driver = new Driver("d1", "Test Driver", "Tester", "");
    const heatDriver = new DriverHeatData("hd1", { driver } as any, 0, driver);

    laps.forEach((time, idx) => {
      heatDriver.addLapTime(idx + 1, time, 0, 0, 0, idx + 1);
    });

    return {
      heat: new Heat("h1", 1, [heatDriver]),
      heatDriver,
      row: {
        rank: 1,
        objectId: "hd1",
        laps: laps.length,
        averageLapTime: 5.0,
        medianLapTime: 5.0,
        bestLapTime: 4.0,
        totalTime: laps.reduce((a, b) => a + b, 0),
        gap1st: 0,
        gapAhead: 0,
        reactionTime: 0.1,
      },
      laneColor: { foreground: "#fff", background: "#f00", name: "Red Lane" },
      maxLapTime: 10,
    };
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatDriverExpanderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatDriverExpanderComponent);
    component = fixture.componentInstance;
  });

  it("should handle empty lap data gracefully", () => {
    component.heatData = createMockHeatData([]);
    fixture.detectChanges();

    expect(component.validLaps.length).toBe(0);
    expect(component.standardDeviation).toBeNull();
    expect(component.consistencyScore).toBeNull();
    expect(component.averageTop5).toBeNull();
    expect(component.averageTop10).toBeNull();
    expect(component.averageTop15).toBeNull();
    expect(component.top2Consecutive).toBeNull();
    expect(component.top3Consecutive).toBeNull();
  });

  it("should return null for std dev and top consecutive when single lap exists", () => {
    component.heatData = createMockHeatData([5.0]);
    fixture.detectChanges();

    expect(component.validLaps).toEqual([5.0]);
    expect(component.standardDeviation).toBeNull();
    expect(component.consistencyScore).toBe(100);
    expect(component.averageTop5).toBe(5.0);
    expect(component.top2Consecutive).toBeNull();
    expect(component.top3Consecutive).toBeNull();
  });

  it("should correctly compute standard deviation and consistency score", () => {
    component.heatData = createMockHeatData([5.0, 5.0, 5.0, 5.0]);
    fixture.detectChanges();

    expect(component.standardDeviation).toBeCloseTo(0.0, 4);
    expect(component.consistencyScore).toBeCloseTo(100.0, 4);
  });

  it("should correctly compute Top N averages and Top K consecutive laps", () => {
    // Lap times: 6.0, 5.0, 4.0, 7.0, 4.5, 4.2
    // Sorted: 4.0, 4.2, 4.5, 5.0, 6.0, 7.0
    // Top 5 sorted: 4.0, 4.2, 4.5, 5.0, 6.0 -> sum = 23.7 -> avg = 4.74
    // Top 2 consecutive sliding window sums:
    // (6+5=11), (5+4=9), (4+7=11), (7+4.5=11.5), (4.5+4.2=8.7) -> min = 8.7
    // Top 3 consecutive sliding window sums:
    // (6+5+4=15), (5+4+7=16), (4+7+4.5=15.5), (7+4.5+4.2=15.7) -> min = 15.0
    component.heatData = createMockHeatData([6.0, 5.0, 4.0, 7.0, 4.5, 4.2]);
    fixture.detectChanges();

    expect(component.averageTop5).toBeCloseTo(4.74, 2);
    expect(component.top2Consecutive).toBeCloseTo(8.7, 2);
    expect(component.top3Consecutive).toBeCloseTo(15.0, 2);
  });

  it("should correctly compute Top 10 and Top 15 averages when 16+ laps exist", () => {
    const laps = [
      1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0,
      15.0, 16.0,
    ];
    component.heatData = createMockHeatData(laps);
    fixture.detectChanges();

    // Top 10: 1..10 -> avg = 5.5
    expect(component.averageTop10).toBeCloseTo(5.5, 2);
    // Top 15: 1..15 -> avg = 8.0
    expect(component.averageTop15).toBeCloseTo(8.0, 2);
  });

  it("should filter out zero or invalid lap times", () => {
    component.heatData = createMockHeatData([5.0, 0, 4.0, 0, 6.0]);
    fixture.detectChanges();

    expect(component.validLaps).toEqual([5.0, 4.0, 6.0]);
    expect(component.averageTop5).toBeCloseTo(5.0, 2);
  });

  it("should render Analysis table when expanded", () => {
    component.heatData = createMockHeatData([5.0, 4.8, 5.2]);
    component.isExpanded = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const analysisHeader = compiled.querySelector(
      ".analysis-section .subsection-title",
    );
    expect(analysisHeader).not.toBeNull();
    expect(analysisHeader?.textContent).toContain("DR_SECTION_ANALYSIS");

    const analysisCells = compiled.querySelectorAll(".analysis-row .body-cell");
    expect(analysisCells.length).toBe(7);
  });

  it("should render custom group name on group badge when isGroupRace is true", () => {
    component.heatData = createMockHeatData([5.0]);
    component.heatData.heat.group = 1;
    component.isGroupRace = true;
    component.groupNames = ["Alpha", "Beta Group"];
    fixture.detectChanges();

    const groupBadge = fixture.nativeElement.querySelector(".group-badge");
    expect(groupBadge).not.toBeNull();
    expect(groupBadge.textContent.trim()).toBe("Beta Group");
  });
});
