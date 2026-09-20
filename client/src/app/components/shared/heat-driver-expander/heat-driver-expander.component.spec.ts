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

  it("should return server-provided analysis metrics from heatDriver", () => {
    const mock = createMockHeatData([5.0, 5.2, 4.8]);
    mock.heatDriver.standardDeviation = 0.163;
    mock.heatDriver.consistencyScore = 96.7;
    mock.heatDriver.averageTop5 = 5.0;
    mock.heatDriver.averageTop10 = 5.0;
    mock.heatDriver.averageTop15 = 5.0;
    mock.heatDriver.top2Consecutive = 10.0;
    mock.heatDriver.top3Consecutive = 15.0;

    component.heatData = mock;
    fixture.detectChanges();

    expect(component.standardDeviation).toBe(0.163);
    expect(component.consistencyScore).toBe(96.7);
    expect(component.averageTop5).toBe(5.0);
    expect(component.averageTop10).toBe(5.0);
    expect(component.averageTop15).toBe(5.0);
    expect(component.top2Consecutive).toBe(10.0);
    expect(component.top3Consecutive).toBe(15.0);
  });

  it("should filter out zero or invalid lap times for validLaps", () => {
    component.heatData = createMockHeatData([5.0, 0, 4.0, 0, 6.0]);
    fixture.detectChanges();

    expect(component.validLaps).toEqual([5.0, 4.0, 6.0]);
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

  it("should render Analysis table with 7 header cells matching 7 body cells", () => {
    component.heatData = createMockHeatData([5.0, 4.8, 5.2]);
    component.isExpanded = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerCells = compiled.querySelectorAll(
      ".analysis-section .results-table-header.analysis-grid .header-cell",
    );
    expect(headerCells.length).toBe(7);

    const bodyCells = compiled.querySelectorAll(
      ".analysis-section .analysis-row.analysis-grid .body-cell",
    );
    expect(bodyCells.length).toBe(7);

    const table = compiled.querySelector(
      ".analysis-table-wrapper .results-table",
    ) as HTMLElement;
    expect(table).not.toBeNull();
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

  it("should emit openTrajectory when trajectory button is clicked", () => {
    const mockData = createMockHeatData([4.2, 4.3]);
    component.heatData = mockData;
    component.isExpanded = true;
    fixture.detectChanges();

    const trajectorySpy = jasmine.createSpy("openTrajectory");
    component.openTrajectory.subscribe(trajectorySpy);

    const mockEvent = new MouseEvent("click");
    spyOn(mockEvent, "stopPropagation");
    component.onOpenTrajectory(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(trajectorySpy).toHaveBeenCalledWith(mockData);
  });

  it("should emit openTrajectory when trajectory button in template is clicked", () => {
    const mockData = createMockHeatData([4.2, 4.3]);
    component.heatData = mockData;
    component.isExpanded = true;
    fixture.detectChanges();

    const trajectorySpy = jasmine.createSpy("openTrajectory");
    component.openTrajectory.subscribe(trajectorySpy);

    const btn = fixture.nativeElement.querySelector(
      ".trajectory-btn",
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();

    expect(trajectorySpy).toHaveBeenCalledWith(mockData);
  });
});
