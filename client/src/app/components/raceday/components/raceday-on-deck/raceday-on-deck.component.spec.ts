import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Driver } from "@app/models/driver";
import { Lane } from "@app/models/lane";
import { Track } from "@app/models/track";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayOnDeckComponent } from "./raceday-on-deck.component";
import { RacedayOnDeckHarness } from "./testing/raceday-on-deck.harness";

describe("RacedayOnDeckComponent", () => {
  let component: RacedayOnDeckComponent;
  let fixture: ComponentFixture<RacedayOnDeckComponent>;
  let harness: RacedayOnDeckHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayOnDeckComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayOnDeckComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayOnDeckHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render empty state if no heats are provided", async () => {
    expect(await harness.getTitle()).toBe("RD_WIN_ON_DECK");
    expect(await harness.getEntryCount()).toBe(0);
  });

  it("should compute and render on deck drivers correctly", async () => {
    const mockTrack = new Track("t1", "Track 1", 100, [
      new Lane("l1", "white", "red", 50),
      new Lane("l2", "white", "blue", 50),
    ]);

    const d1 = new Driver("d1", "Driver One", "One");
    const d2 = new Driver("d2", "Driver Two", "Two");

    const currentHeat: Heat = {
      objectId: "h1",
      heatNumber: 1,
      heatDrivers: [
        {
          objectId: "hd1",
          laneIndex: 0,
          driver: d1,
          reset: () => {},
        } as any,
      ],
      standings: [],
      started: false,
      group: 0,
    };

    const nextHeat: Heat = {
      objectId: "h2",
      heatNumber: 2,
      heatDrivers: [
        {
          objectId: "hd2",
          laneIndex: 0,
          driver: d1,
          reset: () => {},
        } as any,
        {
          objectId: "hd3",
          laneIndex: 1,
          driver: d2,
          reset: () => {},
        } as any,
      ],
      standings: [],
      started: false,
      group: 0,
    };

    fixture.componentRef.setInput("track", mockTrack);
    fixture.componentRef.setInput("currentHeat", currentHeat);
    fixture.componentRef.setInput("heats", [currentHeat, nextHeat]);
    fixture.detectChanges();

    // d1 is in current heat, so only d2 (Two) is on deck.
    expect(await harness.getEntryCount()).toBe(1);
    expect(await harness.getEntryDriverName(0)).toBe("Two");
    expect(await harness.getEntryLaneText(0)).toBe("L2");
  });
});
