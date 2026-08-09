import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RacedaySeasonLeaderboardComponent } from "./raceday-season-leaderboard.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("RacedaySeasonLeaderboardComponent", () => {
  let component: RacedaySeasonLeaderboardComponent;
  let fixture: ComponentFixture<RacedaySeasonLeaderboardComponent>;

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

  it("should display sorted standings by net points descending", () => {
    const mockStandings = [
      { driver_id: "d1", driver_name: "Driver A", net_points: 10 },
      { driver_id: "d2", driver_name: "Driver B", net_points: 25 },
    ];
    fixture.componentRef.setInput("seasonStandings", mockStandings);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const names = compiled.querySelectorAll(".leaderboard-name");
    expect(names.length).toBe(2);
    expect(names[0].textContent?.trim()).toBe("Driver B");
    expect(names[1].textContent?.trim()).toBe("Driver A");
  });

  it("should format score based on widget decimalPlaces setting", () => {
    fixture.componentRef.setInput("widget", {
      customSettings: { decimalPlaces: 2 },
    } as any);
    expect(component.getScoreFormat()).toBe("1.2-2");
  });
});
