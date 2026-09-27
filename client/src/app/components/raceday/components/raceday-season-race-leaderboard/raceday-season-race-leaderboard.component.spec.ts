import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RacedaySeasonRaceLeaderboardComponent } from "./raceday-season-race-leaderboard.component";
import { RacedaySeasonRaceLeaderboardHarness } from "./testing/raceday-season-race-leaderboard.harness";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("RacedaySeasonRaceLeaderboardComponent", () => {
  let component: RacedaySeasonRaceLeaderboardComponent;
  let fixture: ComponentFixture<RacedaySeasonRaceLeaderboardComponent>;
  let harness: RacedaySeasonRaceLeaderboardHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedaySeasonRaceLeaderboardComponent, MockTranslatePipe],
    })
      .overrideComponent(RacedaySeasonRaceLeaderboardComponent, {
        remove: { imports: [] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RacedaySeasonRaceLeaderboardComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedaySeasonRaceLeaderboardHarness,
    );
    fixture.detectChanges();
  });

  it("should create", async () => {
    expect(component).toBeTruthy();
    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getTitle()).toBe("SM_SEASON_RACE_STANDINGS_TITLE");
  });

  it("should display empty message when seasonStandings is empty", async () => {
    fixture.componentRef.setInput("seasonStandings", []);
    fixture.detectChanges();

    expect(await harness.isEmpty()).toBeTrue();
    expect(await harness.getEmptyMessage()).toBe("SM_NO_RACES_RUN");
    expect(await harness.getRowCount()).toBe(0);
  });

  it("should display sorted standings by current race points descending", async () => {
    const mockStandings = [
      {
        driver_id: "d1",
        driver_name: "Driver A",
        current_race_points: 10,
        net_points: 100,
      },
      {
        driver_id: "d2",
        driver_name: "Driver B",
        current_race_points: 25,
        net_points: 50,
      },
    ];
    fixture.componentRef.setInput("seasonStandings", mockStandings);
    fixture.detectChanges();

    expect(await harness.isEmpty()).toBeFalse();
    expect(await harness.getRowCount()).toBe(2);
    const names = await harness.getDriverNames();
    expect(names[0]).toBe("Driver B");
    expect(names[1]).toBe("Driver A");
    expect(await harness.getDriverName(0)).toBe("Driver B");
    expect(await harness.getDriverName(1)).toBe("Driver A");

    const scores = await harness.getScores();
    expect(scores[0]).toBe("25");
    expect(scores[1]).toBe("10");
  });

  it("should handle null/undefined items in getRacePoints", () => {
    expect(component.getRacePoints(null)).toBe(0);
    expect(component.getRacePoints(undefined)).toBe(0);
  });

  it("should calculate race points with camelCase currentRacePoints", () => {
    expect(component.getRacePoints({ currentRacePoints: 42 })).toBe(42);
  });

  it("should calculate race points from live_race in race_scores with total_points or totalPoints", () => {
    const item1 = {
      race_scores: [
        { race_id: "other", total_points: 10 },
        { race_id: "live_race", total_points: 99 },
      ],
    };
    expect(component.getRacePoints(item1)).toBe(99);

    const item2 = {
      raceScores: [{ raceId: "live_event", totalPoints: 88 }],
    };
    expect(component.getRacePoints(item2)).toBe(88);
  });

  it("should calculate race points from overall and heat points when total_points is missing", () => {
    const item = {
      race_scores: [
        { race_id: "live_race", overall_points: 20, heat_points: 5 },
      ],
    };
    expect(component.getRacePoints(item)).toBe(25);

    const itemCamel = {
      raceScores: [{ raceId: "live_race", overallPoints: 30, heatPoints: 12 }],
    };
    expect(component.getRacePoints(itemCamel)).toBe(42);
  });

  it("should fallback to race_points / racePoints / score if no live race scores", () => {
    expect(component.getRacePoints({ race_points: 15 })).toBe(15);
    expect(component.getRacePoints({ racePoints: 18 })).toBe(18);
    expect(component.getRacePoints({ score: 7 })).toBe(7);
    expect(component.getRacePoints({})).toBe(0);
  });

  it("should provide trackByItem key using driver_id, driverId, entityId, or index", () => {
    expect(component.trackByItem(0, { driver_id: "d1" })).toBe("d1");
    expect(component.trackByItem(1, { driverId: "d2" })).toBe("d2");
    expect(component.trackByItem(2, { entityId: "e3" })).toBe("e3");
    expect(component.trackByItem(3, {})).toBe("3");
  });

  it("should format score based on widget decimalPlaces setting and clamp correctly", () => {
    fixture.componentRef.setInput("widget", {
      customSettings: { decimalPlaces: 2 },
    } as any);
    expect(component.getScoreFormat()).toBe("1.2-2");

    fixture.componentRef.setInput("widget", {
      customSettings: { decimalPlaces: 5 },
    } as any);
    expect(component.getScoreFormat()).toBe("1.3-3");

    fixture.componentRef.setInput("widget", null);
    expect(component.getScoreFormat()).toBe("1.0-0");
  });
});
