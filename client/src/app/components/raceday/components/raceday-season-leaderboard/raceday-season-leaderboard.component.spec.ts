import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RacedaySeasonLeaderboardComponent } from "./raceday-season-leaderboard.component";
import { RacedaySeasonLeaderboardHarness } from "./testing/raceday-season-leaderboard.harness";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("RacedaySeasonLeaderboardComponent", () => {
  let component: RacedaySeasonLeaderboardComponent;
  let fixture: ComponentFixture<RacedaySeasonLeaderboardComponent>;
  let harness: RacedaySeasonLeaderboardHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedaySeasonLeaderboardComponent, MockTranslatePipe],
    })
      .overrideComponent(RacedaySeasonLeaderboardComponent, {
        remove: { imports: [] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RacedaySeasonLeaderboardComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedaySeasonLeaderboardHarness,
    );
    fixture.detectChanges();
  });

  it("should create", async () => {
    expect(component).toBeTruthy();
    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getTitle()).toBe("SM_STANDINGS_TITLE");
  });

  it("should display empty message when seasonStandings is empty", async () => {
    fixture.componentRef.setInput("seasonStandings", []);
    fixture.detectChanges();

    expect(await harness.isEmpty()).toBeTrue();
    expect(await harness.getEmptyMessage()).toBe("SM_NO_RACES_RUN");
    expect(await harness.getRowCount()).toBe(0);
  });

  it("should display sorted standings by net points descending", async () => {
    const mockStandings = [
      { driver_id: "d1", driver_name: "Driver A", net_points: 10 },
      { driver_id: "d2", driver_name: "Driver B", net_points: 25 },
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
  });

  it("should format score based on widget decimalPlaces setting", () => {
    fixture.componentRef.setInput("widget", {
      customSettings: { decimalPlaces: 2 },
    } as any);
    expect(component.getScoreFormat()).toBe("1.2-2");
  });
});
