import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { DecimalPipe } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayGroupLeaderboardComponent } from "./raceday-group-leaderboard.component";
import { RacedayGroupLeaderboardHarness } from "./testing/raceday-group-leaderboard.harness";

describe("RacedayGroupLeaderboardComponent", () => {
  let component: RacedayGroupLeaderboardComponent;
  let fixture: ComponentFixture<RacedayGroupLeaderboardComponent>;
  let harness: RacedayGroupLeaderboardHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (params && params.group !== undefined) {
          return `${key} ${params.group}`;
        }
        return key;
      },
    );

    await TestBed.configureTestingModule({
      imports: [RacedayGroupLeaderboardComponent, TranslatePipe],
      providers: [
        DecimalPipe,
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayGroupLeaderboardComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayGroupLeaderboardHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show empty message when group stands are not enabled", async () => {
    fixture.componentRef.setInput("groupEnabled", false);
    fixture.detectChanges();

    expect(await harness.getTitle()).toBe("RD_WIN_GROUP_LEADER_BOARD");
    expect(await harness.getSubtitle()).toBe("");
    expect(await harness.getEmptyMessage()).toBe("RD_NO_GROUP_STANDINGS");
    expect(await harness.getEntryCount()).toBe(0);
  });

  it("should render group standings when enabled", async () => {
    fixture.componentRef.setInput("groupEnabled", true);
    fixture.componentRef.setInput("groupNumber", 1);
    const entries = [
      { entityId: "e1", rank: 2, name: "Alice", score: 10, isTime: false },
      { entityId: "e2", rank: 1, name: "Bob", score: 12.3456, isTime: true },
    ];
    fixture.componentRef.setInput("leaderboardEntries", entries);
    fixture.detectChanges();

    expect(await harness.getTitle()).toBe("RD_WIN_GROUP_LEADER_BOARD");
    expect(await harness.getSubtitle()).toBe("DR_LABEL_GROUP 2");
    expect(await harness.getEmptyMessage()).toBe("");
    expect(await harness.getEntryCount()).toBe(2);

    // sorted by rank (e2 has rank 1, e1 has rank 2)
    // The visual position of Bob (e2, rank 1) is 0. Bob is at index 1 in leaderboardEntries input, but rank 1.
    // The visual position of Alice (e1, rank 2) is 1. Alice is at index 0 in leaderboardEntries input, but rank 2.
    // Wait, getLeaderboardPosition(Bob) should return 0, getLeaderboardPosition(Alice) should return 1.
    expect(
      component.getLeaderboardPosition(component.leaderboardEntries()[1]),
    ).toBe(0); // Bob
    expect(
      component.getLeaderboardPosition(component.leaderboardEntries()[0]),
    ).toBe(1); // Alice

    const detailBob = await harness.getEntryDetail(1); // Bob is index 1 in the loop
    expect(detailBob.rank).toBe("1");
    expect(detailBob.name).toBe("Bob");
    expect(detailBob.score).toBe("12.346"); // isTime is true -> formatted with 3 decimals

    const detailAlice = await harness.getEntryDetail(0); // Alice is index 0 in the loop
    expect(detailAlice.rank).toBe("2");
    expect(detailAlice.name).toBe("Alice");
    expect(detailAlice.score).toBe("10.00"); // isTime is false -> formatted with 2 decimals
  });
});
