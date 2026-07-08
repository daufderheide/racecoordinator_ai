import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
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
  let mockParent: any;
  let roleSubject: BehaviorSubject<string>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    roleSubject = new BehaviorSubject<string>("VIEWER");

    mockParent = {
      isTeam: (_hd: any) => false,
      isEmptyDriver: (_hd: any) => false,
      getTeammates: (_hd: any) => [],
      getDropdownIcon: (_color: string) => "arrow-url",
      getDriverStats: (_hd: any, _driverId: string) => "(H: 1 L / 10s)",
      authService: {
        currentRole$: roleSubject.asObservable(),
        get currentRole() {
          return roleSubject.value;
        },
      },
      Role: {
        VIEWER: "VIEWER",
      },
      onNextHeatTeammateChange: jasmine.createSpy("onNextHeatTeammateChange"),
    };

    await TestBed.configureTestingModule({
      imports: [RacedayOnDeckComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayOnDeckComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("parent", mockParent);
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayOnDeckHarness,
    );
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should render empty state if no heats are provided", async () => {
    fixture.detectChanges();
    expect(await harness.getTitle()).toBe("RD_WIN_ON_DECK");
    expect(await harness.getEntryCount()).toBe(0);
  });

  it("should compute and render on deck drivers correctly", async () => {
    const mockTrack = new Track({
      entity_id: "t1",
      name: "Track 1",
      num_track_sections: 100,
      lanes: [
        new Lane("l1", "white", "red", 50),
        new Lane("l2", "white", "blue", 50),
      ],
    });

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

  it("should display team name and trigger teammate change when isTeam is true", async () => {
    const mockTrack = new Track({
      entity_id: "t1",
      name: "Track 1",
      num_track_sections: 100,
      lanes: [new Lane("l1", "white", "red", 50)],
    });

    const d1 = new Driver("d1", "Driver One", "One");
    roleSubject.next("DIRECTOR");
    mockParent.isTeam = () => true;
    const teammates = [
      { entity_id: "d1", name: "Driver One", nickname: "One" },
      { entity_id: "d2", name: "Driver Two", nickname: "Two" },
    ];
    mockParent.getTeammates = () => teammates;

    const currentHeat: Heat = {
      objectId: "h1",
      heatNumber: 1,
      heatDrivers: [], // Empty, so next heat drivers are on deck
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
          participant: {
            team: { name: "Team A" },
          },
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

    const element = fixture.nativeElement;
    const nameSpan = element.querySelector(".teammate-display-name");
    expect(nameSpan).toBeTruthy();
    expect(nameSpan.textContent).toContain("One");
    expect(nameSpan.textContent).toContain("Team A");

    const select = element.querySelector("select");
    expect(select).toBeTruthy();
    select.value = "d2";
    select.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(mockParent.onNextHeatTeammateChange).toHaveBeenCalled();
  });
});
