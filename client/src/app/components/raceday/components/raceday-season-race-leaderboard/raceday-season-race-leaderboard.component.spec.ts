import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RacedaySeasonRaceLeaderboardComponent } from "./raceday-season-race-leaderboard.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("RacedaySeasonRaceLeaderboardComponent", () => {
  let component: RacedaySeasonRaceLeaderboardComponent;
  let fixture: ComponentFixture<RacedaySeasonRaceLeaderboardComponent>;

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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty message when seasonStandings is empty", () => {
    fixture.componentRef.setInput("seasonStandings", []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector(".leaderboard-empty-message")?.textContent?.trim(),
    ).toBe("SM_NO_RACES_RUN");
  });

  it("should display sorted standings by current race points descending", () => {
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

    const compiled = fixture.nativeElement as HTMLElement;
    const names = compiled.querySelectorAll(".leaderboard-name");
    expect(names.length).toBe(2);
    expect(names[0].textContent?.trim()).toBe("Driver B");
    expect(names[1].textContent?.trim()).toBe("Driver A");

    const scores = compiled.querySelectorAll(".leaderboard-score");
    expect(scores[0].textContent?.trim()).toBe("25");
    expect(scores[1].textContent?.trim()).toBe("10");
  });

  it("should format score based on widget decimalPlaces setting", () => {
    fixture.componentRef.setInput("widget", {
      customSettings: { decimalPlaces: 2 },
    } as any);
    expect(component.getScoreFormat()).toBe("1.2-2");
  });
});
