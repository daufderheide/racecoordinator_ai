import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Driver } from "@app/models/driver";
import { Lane } from "@app/models/lane";
import { Track } from "@app/models/track";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayNextHeatComponent } from "./raceday-next-heat.component";
import { RacedayNextHeatHarness } from "./testing/raceday-next-heat.harness";

describe("RacedayNextHeatComponent", () => {
  let component: RacedayNextHeatComponent;
  let fixture: ComponentFixture<RacedayNextHeatComponent>;
  let harness: RacedayNextHeatHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayNextHeatComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayNextHeatComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayNextHeatHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render empty state if no heats are provided", async () => {
    expect(await harness.getTitle()).toBe("RD_WIN_NEXT_HEAT");
    expect(await harness.getEntryCount()).toBe(0);
  });

  it("should compute and render all next heat drivers correctly", async () => {
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

    // In next heat, both d1 (One) and d2 (Two) should be displayed regardless of current heat
    expect(await harness.getEntryCount()).toBe(2);
    expect(await harness.getEntryDriverName(0)).toBe("One");
    expect(await harness.getEntryLaneText(0)).toBe("L1");
    expect(await harness.getEntryDriverName(1)).toBe("Two");
    expect(await harness.getEntryLaneText(1)).toBe("L2");
  });
});
