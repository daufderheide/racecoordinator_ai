import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { DecimalPipe } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RacedayLeaderboardComponent } from "./raceday-leaderboard.component";
import { RacedayLeaderboardHarness } from "./testing/raceday-leaderboard.harness";

describe("RacedayLeaderboardComponent", () => {
  let component: RacedayLeaderboardComponent;
  let fixture: ComponentFixture<RacedayLeaderboardComponent>;
  let harness: RacedayLeaderboardHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayLeaderboardComponent],
      providers: [DecimalPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayLeaderboardComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayLeaderboardHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render empty leaderboard initially", async () => {
    expect(await harness.getTitle()).toBe("Leader Board");
    expect(await harness.getEntryCount()).toBe(0);
  });

  it("should sort and display leaderboard entries correctly", async () => {
    fixture.componentRef.setInput("leaderboardEntries", [
      { entityId: "e1", rank: 2, name: "Alice", score: 10 },
      { entityId: "e2", rank: 1, name: "Bob", score: 12 },
    ]);
    fixture.detectChanges();

    expect(await harness.getEntryCount()).toBe(2);

    // Sorted by rank (Bob first, Alice second)
    const aliceText = await harness.getEntryText(0);
    const bobText = await harness.getEntryText(1);

    expect(bobText).toContain("1 Bob");
    expect(bobText).toContain("12");

    expect(aliceText).toContain("2 Alice");
    expect(aliceText).toContain("10");
  });

  it("should format score correctly based on isTime", async () => {
    // Score as time (isTime: true) should use 3 decimal places
    fixture.componentRef.setInput("leaderboardEntries", [
      { entityId: "e1", rank: 1, name: "Alice", score: 9.8765, isTime: true },
    ]);
    fixture.detectChanges();

    const entryText = await harness.getEntryText(0);
    expect(entryText).toContain("9.877");
  });
});
