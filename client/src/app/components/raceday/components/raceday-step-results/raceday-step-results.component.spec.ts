import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StepResults } from "@app/models/step-results.model";

import { RacedayStepResultsComponent } from "./raceday-step-results.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("RacedayStepResultsComponent", () => {
  let component: RacedayStepResultsComponent;
  let fixture: ComponentFixture<RacedayStepResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayStepResultsComponent, MockTranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayStepResultsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render live step results standings with stepping up badges", () => {
    const mockResults: StepResults = {
      step: 1,
      group: 1,
      nextStep: 2,
      stepUpCount: 2,
      standings: [
        {
          rank: 1,
          driverId: "d1",
          driverName: "Speedy",
          totalLaps: 50,
          totalTime: 120.5,
          totalPoints: 25,
          bestLapTime: 2.3,
          steppingUp: true,
          stepUpIndex: 0,
        },
        {
          rank: 2,
          driverId: "d2",
          driverName: "Racer",
          totalLaps: 48,
          totalTime: 121.2,
          totalPoints: 18,
          bestLapTime: 2.4,
          steppingUp: true,
          stepUpIndex: 1,
        },
        {
          rank: 3,
          driverId: "d3",
          driverName: "Cruiser",
          totalLaps: 45,
          totalTime: 123.0,
          totalPoints: 15,
          bestLapTime: 2.5,
          steppingUp: false,
          stepUpIndex: -1,
        },
      ],
    };

    fixture.componentRef.setInput("stepResults", mockResults);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll(".step-result-row");
    expect(rows.length).toBe(3);

    // Rank 1 & 2 stepping up
    expect(rows[0].classList.contains("stepping-up")).toBeTrue();
    expect(rows[0].querySelector(".step-up-badge")).toBeTruthy();

    expect(rows[1].classList.contains("stepping-up")).toBeTrue();
    expect(rows[1].querySelector(".step-up-badge")).toBeTruthy();

    // Rank 3 eliminated
    expect(rows[2].classList.contains("stepping-up")).toBeFalse();
    expect(rows[2].querySelector(".eliminated-badge")).toBeTruthy();
  });

  it("should provide mock data when in UI editor mode and stepResults is null", () => {
    fixture.componentRef.setInput("parentComponent", {
      isUIEditorMode: () => true,
    });
    fixture.componentRef.setInput("stepResults", null);
    fixture.detectChanges();

    const results = component.effectiveStepResults();
    expect(results).toBeTruthy();
    expect(results?.standings.length).toBe(4);
    expect(results?.standings[0].steppingUp).toBeTrue();
  });

  it("should respect customSettings for showing total time, best lap, and points", () => {
    const mockResults: StepResults = {
      step: 1,
      group: 1,
      nextStep: 2,
      stepUpCount: 1,
      standings: [
        {
          rank: 1,
          driverId: "d1",
          driverName: "Speedy",
          totalLaps: 50,
          totalTime: 120.5,
          totalPoints: 25,
          bestLapTime: 2.3,
          steppingUp: true,
          stepUpIndex: 0,
        },
      ],
    };

    fixture.componentRef.setInput("stepResults", mockResults);
    fixture.componentRef.setInput("widget", {
      id: "w1",
      widgetType: "step-results",
      x: 0,
      y: 0,
      width: 800,
      height: 400,
      zIndex: 1,
      customSettings: {
        showTotalTime: false,
        showBestLap: false,
        showPoints: true,
        backgroundColor: "#112233",
      },
    });
    fixture.detectChanges();

    expect(component.showTotalTime()).toBeFalse();
    expect(component.showBestLap()).toBeFalse();
    expect(component.showPoints()).toBeTrue();
    expect(component.effectiveBackgroundColor()).toBe("#112233");

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".col-time")).toBeNull();
    expect(compiled.querySelector(".col-best-lap")).toBeNull();
    expect(compiled.querySelector(".col-points")).toBeTruthy();
  });

  it("should return driverId or index from trackByDriver", () => {
    expect(component.trackByDriver(0, { driverId: "d1" })).toBe("d1");
    expect(component.trackByDriver(1, {})).toBe("1");
  });

  it("should render standings when properties are in snake_case", () => {
    const mockSnakeResults: any = {
      step: 1,
      group: 1,
      next_step: 2,
      step_up_count: 1,
      standings: [
        {
          rank: 1,
          driver_id: "d1",
          driver_name: "Snake Driver",
          total_laps: 30,
          total_time: 90.5,
          total_points: 10,
          best_lap_time: 2.1,
          is_stepping_up: true,
          step_up_index: 1,
        },
      ],
    };

    fixture.componentRef.setInput("stepResults", mockSnakeResults);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".driver-name")?.textContent).toContain(
      "Snake Driver",
    );
    expect(compiled.querySelector(".lap-count")?.textContent).toContain("30");
    expect(compiled.querySelector(".step-up-badge")).toBeTruthy();
  });
});
