import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayHeatDetailsComponent } from "./raceday-heat-details.component";
import type {
  ProcessedHeat,
  ProcessedHeatLane,
} from "./raceday-heat-list.component";

const lane: ProcessedHeatLane = {
  laneNumber: 1,
  driverNickname: "Sparky",
  isTeam: true,
  teamName: "Team Orange",
  backgroundColor: "#db493c",
  foregroundColor: "#ffffff",
  isOccupied: true,
  rank: 2,
  formattedRank: "2",
  lapCount: 4,
  formattedLaps: "4",
  bestLapTime: 5.385,
  formattedBestLap: "5.385",
  gapLeader: 0.324,
  formattedGap: "+0.324",
  averageLapTime: 5.6,
  formattedAvgLap: "5.600",
  medianLapTime: 5.5,
  formattedMedianLap: "5.500",
};

const heat: ProcessedHeat = {
  heatNumber: 2,
  group: 0,
  groupName: "",
  hasGroup: false,
  isActive: false,
  isCurrent: false,
  isCompleted: false,
  showSummary: false,
  useLaneColors: true,
  lanes: [lane],
};

describe("RacedayHeatDetailsComponent", () => {
  let fixture: ComponentFixture<RacedayHeatDetailsComponent>;

  const table = (): HTMLTableElement =>
    fixture.nativeElement.querySelector("table");
  const rowValues = (index: number): (string | undefined)[] =>
    Array.from(table().tBodies[0].rows[index].cells).map((cell) =>
      cell.textContent?.trim(),
    );

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    TestBed.configureTestingModule({
      imports: [RacedayHeatDetailsComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
    fixture = TestBed.createComponent(RacedayHeatDetailsComponent);
    fixture.componentRef.setInput("laneCount", 2);
  });

  it("shows the lineup and empty lanes for an upcoming heat", () => {
    fixture.componentRef.setInput("heat", heat);
    fixture.componentRef.setInput("settings", {
      emptyLaneMode: "text",
      emptyLaneText: "Available",
    });
    fixture.detectChanges();
    expect(table().caption?.textContent?.trim()).toBe("HL_TABLE_LINEUP");
    expect(table().tHead?.rows[0].cells.length).toBe(2);
    expect(rowValues(0)[1]).toContain("Sparky");
    expect(rowValues(0)[1]).toContain("Team Orange");
    expect(rowValues(1)).toEqual(["2", "Available"]);
  });

  it("refreshes timing while a heat is active and shows the saved values when it completes", () => {
    fixture.componentRef.setInput("heat", { ...heat, isActive: true });
    fixture.detectChanges();
    expect(table().caption?.textContent?.trim()).toBe("HL_TABLE_LIVE_TIMING");
    expect(rowValues(0).slice(2)).toEqual(["2", "4", "5.385", "+0.324"]);

    const updatedLane = {
      ...lane,
      rank: 1,
      formattedRank: "1",
      lapCount: 5,
      formattedLaps: "5",
      bestLapTime: 5.116,
      formattedBestLap: "5.116",
      formattedGap: "--",
    };
    fixture.componentRef.setInput("heat", {
      ...heat,
      isActive: true,
      lanes: [updatedLane],
    });
    fixture.detectChanges();
    expect(rowValues(0).slice(2)).toEqual(["1", "5", "5.116", "--"]);

    fixture.componentRef.setInput("heat", {
      ...heat,
      isCompleted: true,
      lanes: [updatedLane],
    });
    fixture.detectChanges();
    expect(table().caption?.textContent?.trim()).toBe("RD_WIN_HEAT_RESULTS");
    expect(rowValues(0).slice(2)).toEqual(["1", "5", "5.116", "--"]);
  });

  it("applies the lane colour setting and the configured empty metric", () => {
    fixture.componentRef.setInput("heat", { ...heat, isCompleted: true });
    fixture.componentRef.setInput("settings", {
      emptyValueMode: "text",
      emptyValueText: "Pending",
    });
    fixture.detectChanges();
    const firstLane = table().tBodies[0].rows[0].cells[0];
    expect(firstLane.style.getPropertyValue("--heat-lane-color")).toBe(
      "#db493c",
    );
    expect(rowValues(1).slice(2)).toEqual([
      "Pending",
      "Pending",
      "Pending",
      "Pending",
    ]);

    fixture.componentRef.setInput("useLaneColors", false);
    fixture.detectChanges();
    expect(firstLane.style.getPropertyValue("--heat-lane-color")).toBe("");
  });

  it("renders an empty lineup when a heat has no lanes and no track lane count", () => {
    fixture.componentRef.setInput("heat", { ...heat, lanes: [] });
    fixture.componentRef.setInput("laneCount", 0);
    fixture.detectChanges();
    expect(table().tBodies[0].rows[0].cells[0].colSpan).toBe(2);
    expect(rowValues(0)).toEqual(["RD_EMPTY_LANE"]);
  });
});
