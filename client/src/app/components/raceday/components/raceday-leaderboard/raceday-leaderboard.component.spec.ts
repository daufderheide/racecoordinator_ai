import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { DecimalPipe } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayLeaderboardComponent } from "./raceday-leaderboard.component";
import { RacedayLeaderboardHarness } from "./testing/raceday-leaderboard.harness";

describe("RacedayLeaderboardComponent", () => {
  let component: RacedayLeaderboardComponent;
  let fixture: ComponentFixture<RacedayLeaderboardComponent>;
  let harness: RacedayLeaderboardHarness;

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
      imports: [RacedayLeaderboardComponent, TranslatePipe],
      providers: [
        DecimalPipe,
        { provide: TranslationService, useValue: mockTranslationService },
      ],
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
    const bobText = await harness.getEntryText(0);
    const aliceText = await harness.getEntryText(1);

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

  it("should show group leaderboard title and subtitle when isGroup is true", async () => {
    fixture.componentRef.setInput("isGroup", true);
    fixture.componentRef.setInput("groupEnabled", true);
    fixture.componentRef.setInput("groupNumber", 2);
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector(".leaderboard-title");
    expect(titleEl.textContent.trim()).toBe("RD_WIN_GROUP_LEADER_BOARD");

    const subtitleEl = fixture.nativeElement.querySelector(
      ".leaderboard-subtitle",
    );
    expect(subtitleEl.textContent.trim()).toBe("DR_LABEL_GROUP 3");
  });

  it("should apply custom font sizes from widget settings when in fixed mode", async () => {
    fixture.componentRef.setInput("leaderboardEntries", [
      { entityId: "e1", rank: 1, name: "Alice", score: 12 },
      { entityId: "e2", rank: 2, name: "Bob", score: 10 },
    ]);
    fixture.componentRef.setInput("widget", {
      id: "w1",
      widgetType: "leaderboard",
      scaleMode: "fixed",
      customSettings: {
        titleFontSize: 42,
        overallLeaderFontSize: 30,
        restFontSize: 20,
      },
    });
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector(".leaderboard-title");
    expect(titleEl.style.fontSize).toBe("42px");

    const items = fixture.nativeElement.querySelectorAll(".leaderboard-item");
    expect(items.length).toBe(2);
    // 1st place
    expect(items[0].style.fontSize).toBe("30px");
    // rest
    expect(items[1].style.fontSize).toBe("20px");
  });

  it("should NOT apply custom font sizes when in auto mode", async () => {
    fixture.componentRef.setInput("leaderboardEntries", [
      { entityId: "e1", rank: 1, name: "Alice", score: 12 },
      { entityId: "e2", rank: 2, name: "Bob", score: 10 },
    ]);
    fixture.componentRef.setInput("widget", {
      id: "w1",
      widgetType: "leaderboard",
      scaleMode: "auto",
      customSettings: {
        titleFontSize: 42,
        overallLeaderFontSize: 30,
        restFontSize: 20,
      },
    });
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector(".leaderboard-title");
    expect(titleEl.style.fontSize).toBeFalsy();

    const items = fixture.nativeElement.querySelectorAll(".leaderboard-item");
    expect(items.length).toBe(2);
    // Should be null/empty since auto mode suppresses it
    expect(items[0].style.fontSize).toBeFalsy();
    expect(items[1].style.fontSize).toBeFalsy();
  });
});
