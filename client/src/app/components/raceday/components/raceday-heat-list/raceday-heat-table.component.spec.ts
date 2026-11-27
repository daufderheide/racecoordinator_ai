import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import type {
  ProcessedHeat,
  ProcessedHeatLane,
} from "./raceday-heat-list.component";
import { RacedayHeatTableComponent } from "./raceday-heat-table.component";

describe("RacedayHeatTableComponent", () => {
  let fixture: ComponentFixture<RacedayHeatTableComponent>;

  const lane: ProcessedHeatLane = {
    laneNumber: 1,
    driverNickname: "Sparky",
    isTeam: true,
    teamName: "Team Orange",
    backgroundColor: "#db493c",
    foregroundColor: "#ffffff",
    isOccupied: true,
    rank: 1,
    formattedRank: "1",
    lapCount: 4,
    formattedLaps: "4",
    bestLapTime: 4,
    formattedBestLap: "4.000",
    gapLeader: 0,
    formattedGap: "--",
    averageLapTime: 5,
    formattedAvgLap: "5.000",
    medianLapTime: 5,
    formattedMedianLap: "5.000",
  };
  const heat: ProcessedHeat = {
    heatNumber: 2,
    group: 0,
    groupName: "Group A",
    hasGroup: true,
    isActive: true,
    isCurrent: true,
    isCompleted: false,
    showSummary: false,
    useLaneColors: true,
    lanes: [lane, { ...lane, laneNumber: 2, isOccupied: false }],
  };

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    TestBed.configureTestingModule({
      imports: [RacedayHeatTableComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
    fixture = TestBed.createComponent(RacedayHeatTableComponent);
    fixture.componentRef.setInput("heats", [heat]);
  });

  it("renders driver and team names, indicates the current heat and inherits empty lane settings", () => {
    fixture.componentRef.setInput("settings", {
      emptyLaneMode: "text",
      emptyLaneText: "Available",
    });
    fixture.detectChanges();
    const table: HTMLTableElement =
      fixture.nativeElement.querySelector("table");
    expect(table.tHead?.rows[0].cells.length).toBe(5);
    expect(table.tBodies[0].rows[0].getAttribute("aria-current")).toBe("step");
    expect(
      table
        .querySelector<HTMLElement>(".heat-lane")
        ?.style.getPropertyValue("--heat-lane-color"),
    ).toBe("#db493c");
    expect(table.querySelector(".heat-driver")?.textContent).toContain(
      "Sparky",
    );
    expect(table.querySelector(".heat-team")?.textContent).toContain(
      "Team Orange",
    );
    expect(table.querySelector(".heat-lane-empty")?.textContent).toContain(
      "Available",
    );
  });

  it("can hide status and groups, remove lane colours, and hide lane assignments", () => {
    fixture.componentRef.setInput("settings", {
      heatTableShowStatus: false,
      heatTableShowGroup: false,
      heatTableShowLaneColors: false,
    });
    fixture.detectChanges();
    const table: HTMLTableElement =
      fixture.nativeElement.querySelector("table");
    expect(table.tHead?.rows[0].cells.length).toBe(3);
    const firstLane: HTMLElement | null = table.querySelector(".heat-lane");
    expect(firstLane?.style.getPropertyValue("--heat-lane-color")).toBe("");

    fixture.componentRef.setInput("settings", {
      heatTableShowStatus: false,
      heatTableShowGroup: false,
      heatTableShowLanes: false,
    });
    fixture.detectChanges();
    expect(table.tHead?.rows[0].cells.length).toBe(1);
    expect(table.querySelector(".heat-lane")).toBeNull();
  });

  it("keeps the track's lane columns when a scheduled heat has no assignments", () => {
    fixture.componentRef.setInput("heats", [{ ...heat, lanes: [] }]);
    fixture.componentRef.setInput("trackLaneCount", 2);
    fixture.detectChanges();
    const table: HTMLTableElement =
      fixture.nativeElement.querySelector("table");
    expect(table.querySelectorAll(".heat-lane-column").length).toBe(2);
    expect(table.querySelectorAll(".heat-lane-empty").length).toBe(2);
  });
});
