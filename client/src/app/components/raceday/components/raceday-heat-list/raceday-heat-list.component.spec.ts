import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { Heat } from "@app/race/heat";
import { RaceFlagService } from "@app/services/race-flag.service";
import { RaceTimeService } from "@app/services/race-time.service";

import { RacedayHeatListComponent } from "./raceday-heat-list.component";

describe("RacedayHeatListComponent", () => {
  let component: RacedayHeatListComponent;
  let fixture: ComponentFixture<RacedayHeatListComponent>;
  let flagUrlSubject: BehaviorSubject<string>;
  let formattedTimeSubject: BehaviorSubject<string>;
  let mockRaceFlagService: any;
  let mockRaceTimeService: any;

  const mockTrack: Track = {
    entity_id: "track_1",
    name: "Speedway",
    lanes: [
      {
        lane_number: 1,
        background_color: "#ff0000",
        foreground_color: "#ffffff",
      },
      {
        lane_number: 2,
        background_color: "#0000ff",
        foreground_color: "#ffff00",
      },
      {
        lane_number: 3,
        background_color: "#00ff00",
        foreground_color: "#000000",
      },
      {
        lane_number: 4,
        background_color: "#ffff00",
        foreground_color: "#000000",
      },
    ],
  } as any;

  const mockHeats: any[] = [
    {
      heatNumber: 1,
      group: 0,
      heatDrivers: [
        {
          laneIndex: 0,
          driver: { nickname: "Speedy", name: "John Doe", seed: 1 },
          participant: { team: null },
        },
        {
          laneIndex: 1,
          driver: { nickname: "Rocket", name: "Jane Smith", seed: 2 },
          participant: { team: { name: "Team Red" } },
        },
      ],
    },
    {
      heatNumber: 2,
      group: 1,
      heatDrivers: [
        {
          laneIndex: 0,
          driver: { nickname: "Flash", name: "Bruce Wayne", seed: 3 },
          participant: { team: null },
        },
      ],
    },
  ];

  const mockWidget: AbsoluteWidgetNode = {
    id: "widget-heat-list-1",
    widgetType: "heat-list",
    x: 0,
    y: 0,
    width: 384,
    height: 400,
    zIndex: 100,
    scaleMode: "auto",
    customSettings: {
      showHeader: true,
      autoScrollToCurrent: true,
      highlightCurrentHeat: true,
      heatColumns: "auto",
      laneColumns: "auto",
    },
  };

  beforeEach(async () => {
    flagUrlSubject = new BehaviorSubject<string>("assets/flags/green.svg");
    formattedTimeSubject = new BehaviorSubject<string>("01:23.4");

    mockRaceFlagService = {
      currentFlagUrl$: flagUrlSubject.asObservable(),
      getCurrentFlagUrl: () => flagUrlSubject.value,
    };

    mockRaceTimeService = {
      formattedTime$: formattedTimeSubject.asObservable(),
      formattedTime: formattedTimeSubject.value,
    };

    await TestBed.configureTestingModule({
      imports: [RacedayHeatListComponent, TranslatePipe],
      providers: [
        { provide: RaceFlagService, useValue: mockRaceFlagService },
        { provide: RaceTimeService, useValue: mockRaceTimeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayHeatListComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("widget", mockWidget);
    fixture.componentRef.setInput("track", mockTrack);
    fixture.componentRef.setInput("heats", mockHeats);
    fixture.componentRef.setInput("currentHeat", { heatNumber: 1 } as Heat);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should process heats and map driver nickname (never driver full name)", () => {
    const processed = component.processedHeats();
    expect(processed.length).toBe(2);

    const heat1 = processed[0];
    expect(heat1.heatNumber).toBe(1);
    expect(heat1.isCurrent).toBeTrue();

    const lane1 = heat1.lanes[0];
    expect(lane1.driverNickname).toBe("Speedy");
    expect(lane1.teamName).toBe("");
    expect(lane1.isTeam).toBeFalse();

    const lane2 = heat1.lanes[1];
    expect(lane2.driverNickname).toBe("Rocket");
    expect(lane2.isTeam).toBeTrue();
    expect(lane2.teamName).toBe("Team Red");

    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain("Team Red");
    expect(textContent).not.toContain("John Doe");
    expect(textContent).not.toContain("Jane Smith");
  });

  it("should highlight the current heat, center race state flag and race time together in header", () => {
    const currentCard = fixture.nativeElement.querySelector(
      "#heat-card-1.current-heat",
    );
    expect(currentCard).toBeTruthy();

    const currentBadge = fixture.nativeElement.querySelector(
      ".current-heat-badge",
    );
    expect(currentBadge).toBeTruthy();

    // Centered status container in card header containing both flag and time
    const centerStatus = currentCard.querySelector(
      ".heat-card-header .header-center-status",
    );
    expect(centerStatus).toBeTruthy();

    const flagContainer = centerStatus.querySelector(".header-flag-container");
    expect(flagContainer).toBeTruthy();

    const flagImg = flagContainer.querySelector(".header-flag");
    expect(flagImg).toBeTruthy();
    expect(flagImg.getAttribute("src")).toBe("assets/flags/green.svg");

    const timeEl = centerStatus.querySelector(".header-time");
    expect(timeEl).toBeTruthy();
    expect(timeEl.textContent.trim()).toBe("01:23.4");

    // Non-current heat (heat 2) should NOT show center status, flag or time
    const heat2Card = fixture.nativeElement.querySelector("#heat-card-2");
    expect(heat2Card.querySelector(".header-center-status")).toBeFalsy();
    expect(heat2Card.querySelector(".current-heat-status")).toBeFalsy();
    expect(heat2Card.querySelector(".header-flag-container")).toBeFalsy();
    expect(heat2Card.querySelector(".header-time")).toBeFalsy();
  });

  it("should reactively update race time and race flag when services emit new values", () => {
    const currentCard = fixture.nativeElement.querySelector(
      "#heat-card-1.current-heat",
    );
    const centerStatus = currentCard.querySelector(
      ".heat-card-header .header-center-status",
    );
    expect(centerStatus).toBeTruthy();

    const timeEl = centerStatus.querySelector(".header-time");
    const flagImg = centerStatus.querySelector(".header-flag");

    expect(timeEl.textContent.trim()).toBe("01:23.4");
    expect(flagImg.getAttribute("src")).toBe("assets/flags/green.svg");

    // Emit new time from service
    formattedTimeSubject.next("02:45.8");
    fixture.detectChanges();

    expect(timeEl.textContent.trim()).toBe("02:45.8");

    // Emit new flag from service
    flagUrlSubject.next("assets/flags/yellow.svg");
    fixture.detectChanges();

    expect(flagImg.getAttribute("src")).toBe("assets/flags/yellow.svg");
  });

  it("should respect showCurrentHeatFlag and showCurrentHeatTime toggles", () => {
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        showCurrentHeatFlag: false,
        showCurrentHeatTime: false,
      },
    });
    fixture.detectChanges();

    const currentCard = fixture.nativeElement.querySelector(
      "#heat-card-1.current-heat",
    );
    expect(currentCard.querySelector(".header-center-status")).toBeFalsy();
    expect(currentCard.querySelector(".header-flag")).toBeFalsy();
    expect(currentCard.querySelector(".header-time")).toBeFalsy();
    expect(currentCard.querySelector(".current-heat-badge")).toBeTruthy();

    // Show only time
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        showCurrentHeatFlag: false,
        showCurrentHeatTime: true,
      },
    });
    fixture.detectChanges();
    expect(currentCard.querySelector(".header-center-status")).toBeTruthy();
    expect(currentCard.querySelector(".header-flag")).toBeFalsy();
    expect(currentCard.querySelector(".header-time")).toBeTruthy();

    // Show only flag
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        showCurrentHeatFlag: true,
        showCurrentHeatTime: false,
      },
    });
    fixture.detectChanges();
    expect(currentCard.querySelector(".header-center-status")).toBeTruthy();
    expect(currentCard.querySelector(".header-flag")).toBeTruthy();
    expect(currentCard.querySelector(".header-time")).toBeFalsy();
  });

  it("should allow overriding flag and time via direct component inputs", () => {
    fixture.componentRef.setInput("currentFlagUrl", "assets/flags/yellow.svg");
    fixture.componentRef.setInput("formattedTime", "00:45.0");
    fixture.detectChanges();

    const currentCard = fixture.nativeElement.querySelector(
      "#heat-card-1.current-heat",
    );
    const flagImg = currentCard.querySelector(".header-flag");
    expect(flagImg.getAttribute("src")).toBe("assets/flags/yellow.svg");

    const timeEl = currentCard.querySelector(".header-time");
    expect(timeEl.textContent.trim()).toBe("00:45.0");
  });

  it("should handle lane and heat columns configuration", () => {
    expect(component.getHeatColumnsStyle()).toBe(
      "repeat(auto-fill, minmax(280px, 1fr))",
    );
    expect(component.getLaneColumnsStyle()).toBe("repeat(4, 1fr)");

    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        heatColumns: "2",
        laneColumns: "1",
      },
    });
    fixture.detectChanges();

    expect(component.getHeatColumnsStyle()).toBe("repeat(2, 1fr)");
    expect(component.getLaneColumnsStyle()).toBe("repeat(1, 1fr)");
  });

  it("should toggle title header based on showHeader setting", () => {
    expect(
      fixture.nativeElement.querySelector(".heat-list-title"),
    ).toBeTruthy();

    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        showHeader: false,
      },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(".heat-list-title")).toBeFalsy();
  });

  it("should process heats with heat.lanes format", () => {
    const alternativeHeats = [
      {
        heatNumber: 3,
        lanes: [
          {
            laneNumber: 1,
            nickname: "Bowser",
            backgroundColor: "#222222",
            foregroundColor: "#ffffff",
          },
        ],
      },
    ];
    fixture.componentRef.setInput("heats", alternativeHeats);
    fixture.detectChanges();

    const processed = component.processedHeats();
    expect(processed.length).toBe(1);
    expect(processed[0].lanes[0].driverNickname).toBe("Bowser");
  });

  it("should display empty message when heats is empty", () => {
    fixture.componentRef.setInput("heats", []);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(".heat-list-empty-msg"),
    ).toBeTruthy();
  });

  it("should apply scale-to-window classes and auto-calculate heat columns and rows", () => {
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        scaleToWindow: true,
      },
    });
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector(
      ".raceday-heat-list-container.scale-to-window",
    );
    expect(container).toBeTruthy();

    // 2 heats in mockHeats -> auto layout chooses 2 columns, 1 row
    expect(component.getHeatColumnsStyle()).toBe("repeat(2, 1fr)");
    expect(component.getHeatRowsStyle()).toBe("repeat(1, 1fr)");

    const layout = component.calculateOptimalFit(8, 1920, 900);
    expect(layout.columns).toBeGreaterThanOrEqual(3);
    expect(layout.rows).toBeGreaterThanOrEqual(2);
    expect(layout.scale).toBeGreaterThan(0);
  });

  it("should vertically center lane numbers and driver info with large heat sets", () => {
    // Generate 20 mock heats to test scaling with a large set
    const largeHeats: any[] = [];
    for (let h = 1; h <= 20; h++) {
      largeHeats.push({
        heatNumber: h,
        heatDrivers: [
          {
            laneIndex: 0,
            driver: { nickname: `Driver ${h}` },
          },
          {
            laneIndex: 1,
            driver: { nickname: `Driver ${(h % 20) + 1}` },
          },
          {
            laneIndex: 2,
            driver: { nickname: `Driver ${((h + 1) % 20) + 1}` },
          },
          {
            laneIndex: 3,
            driver: { nickname: `Driver ${((h + 2) % 20) + 1}` },
          },
        ],
      });
    }

    fixture.componentRef.setInput("heats", largeHeats);
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        scaleToWindow: true,
        showActiveSummary: false,
        showCompletedSummary: false,
      },
    });
    fixture.detectChanges();

    const laneBadges =
      fixture.nativeElement.querySelectorAll(".lane-badge-item");
    expect(laneBadges.length).toBe(80); // 20 heats * 4 lanes

    const firstLaneBadge = laneBadges[0];
    const header = firstLaneBadge.querySelector(".lane-badge-header");
    const tag = firstLaneBadge.querySelector(".lane-badge-tag");
    const driverInfo = firstLaneBadge.querySelector(".lane-driver-info");

    expect(header).toBeTruthy();
    expect(tag).toBeTruthy();
    expect(driverInfo).toBeTruthy();
    expect(tag.textContent.trim()).toBe("L1");

    // With 20 heats, fit calculation selects multi-column grid
    const layout20 = component.calculateOptimalFit(20, 1920, 1080);
    expect(layout20.columns).toBeGreaterThanOrEqual(4);
    expect(layout20.rows).toBeGreaterThanOrEqual(4);
  });

  describe("Heat Summary Mode", () => {
    const mockTelemetryHeats = [
      {
        heatNumber: 1,
        isCompleted: true,
        heatDrivers: [
          {
            laneIndex: 0,
            rank: 2,
            lapCount: 15,
            bestLapTime: 5.432,
            gapLeader: 0.25,
            averageLapTime: 5.6,
            medianLapTime: 5.55,
            driver: { nickname: "Speedy", name: "John Doe" },
          },
          {
            laneIndex: 1,
            rank: 1,
            lapCount: 15,
            bestLapTime: 5.182,
            gapLeader: 0,
            averageLapTime: 5.3,
            medianLapTime: 5.25,
            driver: { nickname: "Rocket", name: "Jane Smith" },
          },
          {
            laneIndex: 2,
            isEmpty: true,
            rank: 99,
            lapCount: 0,
          },
          {
            laneIndex: 3,
            driver: null,
          },
        ],
      },
      {
        heatNumber: 2,
        isCompleted: false,
        heatDrivers: [
          {
            laneIndex: 0,
            rank: 1,
            lapCount: 3,
            bestLapTime: 5.8,
            gapLeader: 0,
            averageLapTime: 5.9,
            medianLapTime: 5.85,
            driver: { nickname: "Flash" },
          },
          {
            laneIndex: 1,
            rank: 2,
            lapCount: 2,
            bestLapTime: 6.1,
            gapLeader: 1.2,
            averageLapTime: 6.2,
            medianLapTime: 6.15,
            driver: { nickname: "Arrow" },
          },
        ],
      },
      {
        heatNumber: 3,
        isCompleted: false,
        heatDrivers: [
          {
            laneIndex: 0,
            driver: { nickname: "Batman" },
          },
          {
            laneIndex: 1,
            driver: { nickname: "Superman" },
          },
        ],
      },
    ];

    it("should render summary table for completed heat and lane badges for unrun heat", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCompletedSummary: true,
          showActiveSummary: false,
        },
      });
      fixture.detectChanges();

      // Heat 1 (completed) should render summary table
      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const summaryTable1 = heat1.querySelector(".heat-summary-table");
      expect(summaryTable1).toBeTruthy();

      // Heat 3 (unrun) should render regular lane badges
      const heat3 = fixture.nativeElement.querySelector("#heat-card-3");
      const summaryTable3 = heat3.querySelector(".heat-summary-table");
      const laneGrid3 = heat3.querySelector(".heat-lanes-grid");
      expect(summaryTable3).toBeFalsy();
      expect(laneGrid3).toBeTruthy();
    });

    it("should render active heat summary table immediately when showActiveSummary is true", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", {
        heatNumber: 2,
        heatDrivers: mockTelemetryHeats[1].heatDrivers,
      } as any);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showActiveSummary: true,
        },
      });
      fixture.detectChanges();

      const heat2 = fixture.nativeElement.querySelector("#heat-card-2");
      const summaryTable2 = heat2.querySelector(".heat-summary-table");
      expect(summaryTable2).toBeTruthy();

      // Check live driver rows
      const rows = heat2.querySelectorAll(".summary-lane-row");
      expect(rows.length).toBe(4); // 4 track lanes
      expect(rows[0].textContent).toContain("Flash");
      expect(rows[1].textContent).toContain("Arrow");
    });

    it("should ALWAYS sort summary rows by lane number and never by heat position", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCompletedSummary: true,
        },
      });
      fixture.detectChanges();

      // In Heat 1: Lane 1 (index 0) is Rank 2 (Speedy). Lane 2 (index 1) is Rank 1 (Rocket).
      // Rows MUST be Lane 1 first, Lane 2 second (never Rank 1 then Rank 2).
      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const rows = heat1.querySelectorAll(".summary-lane-row");
      expect(rows.length).toBe(4);

      // Row 1 -> Lane 1 (Speedy, rank 2)
      expect(
        rows[0].querySelector(".summary-cell-pos").textContent.trim(),
      ).toBe("2");
      expect(
        rows[0].querySelector(".summary-cell-driver").textContent,
      ).toContain("Speedy");

      // Row 2 -> Lane 2 (Rocket, rank 1)
      expect(
        rows[1].querySelector(".summary-cell-pos").textContent.trim(),
      ).toBe("1");
      expect(
        rows[1].querySelector(".summary-cell-driver").textContent,
      ).toContain("Rocket");
    });

    it("should display empty lanes with localized Empty and dashes for numerical columns", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCompletedSummary: true,
          summaryShowGap: true,
          summaryShowAverageLap: true,
          summaryShowMedianLap: true,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const rows = heat1.querySelectorAll(".summary-lane-row");

      // Lane 3 (index 2) is isEmpty: true
      const lane3Row = rows[2];
      expect(
        lane3Row.querySelector(".summary-cell-pos").textContent.trim(),
      ).toBe("--");
      expect(
        lane3Row.querySelector(".summary-cell-laps").textContent.trim(),
      ).toBe("--");
      expect(
        lane3Row.querySelector(".summary-cell-best-lap").textContent.trim(),
      ).toBe("--");
      expect(
        lane3Row.querySelector(".summary-cell-gap").textContent.trim(),
      ).toBe("--");
      expect(
        lane3Row.querySelector(".summary-cell-avg-lap").textContent.trim(),
      ).toBe("--");
      expect(
        lane3Row.querySelector(".summary-cell-median-lap").textContent.trim(),
      ).toBe("--");
      expect(
        lane3Row.querySelector(".summary-cell-driver").textContent,
      ).toContain("RD_EMPTY_LANE");

      // Lane 4 (index 3) is driver: null
      const lane4Row = rows[3];
      expect(
        lane4Row.querySelector(".summary-cell-pos").textContent.trim(),
      ).toBe("--");
      expect(
        lane4Row.querySelector(".summary-cell-laps").textContent.trim(),
      ).toBe("--");
      expect(
        lane4Row.querySelector(".summary-cell-best-lap").textContent.trim(),
      ).toBe("--");
      expect(
        lane4Row.querySelector(".summary-cell-driver").textContent,
      ).toContain("RD_EMPTY_LANE");
    });

    it("should toggle optional columns (Gap, Avg Lap, Median Lap)", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as Heat);

      // Default: Gap, Avg, Median are false
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCompletedSummary: true,
          summaryShowGap: false,
          summaryShowAverageLap: false,
          summaryShowMedianLap: false,
        },
      });
      fixture.detectChanges();

      let heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      expect(heat1.querySelector(".summary-col-gap")).toBeFalsy();
      expect(heat1.querySelector(".summary-col-avg-lap")).toBeFalsy();
      expect(heat1.querySelector(".summary-col-median-lap")).toBeFalsy();

      // Enable Gap, Avg Lap, Median Lap
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCompletedSummary: true,
          summaryShowGap: true,
          summaryShowAverageLap: true,
          summaryShowMedianLap: true,
        },
      });
      fixture.detectChanges();

      heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      expect(heat1.querySelector(".summary-col-gap")).toBeTruthy();
      expect(heat1.querySelector(".summary-col-avg-lap")).toBeTruthy();
      expect(heat1.querySelector(".summary-col-median-lap")).toBeTruthy();

      const rows = heat1.querySelectorAll(".summary-lane-row");
      // Row 1 (Speedy): gap is +0.250, avg is 5.600, median is 5.550
      expect(
        rows[0].querySelector(".summary-cell-gap").textContent.trim(),
      ).toBe("+0.250");
      expect(
        rows[0].querySelector(".summary-cell-avg-lap").textContent.trim(),
      ).toBe("5.600");
      expect(
        rows[0].querySelector(".summary-cell-median-lap").textContent.trim(),
      ).toBe("5.550");
    });

    it("should support disabling core columns (Pos, Driver)", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCompletedSummary: true,
          summaryShowPosition: false,
          summaryShowDriver: false,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      expect(heat1.querySelector(".summary-col-pos")).toBeFalsy();
      expect(heat1.querySelector(".summary-col-driver")).toBeFalsy();
      expect(heat1.querySelector(".summary-col-laps")).toBeTruthy();
      expect(heat1.querySelector(".summary-col-best-lap")).toBeTruthy();
    });

    it("should respect lap and time decimal places settings", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCompletedSummary: true,
          summaryLapDecimalPlaces: 2,
          summaryTimeDecimalPlaces: 2,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const rows = heat1.querySelectorAll(".summary-lane-row");
      // 15 laps with 2 decimals -> 15.00; best lap 5.432 with 2 decimals -> 5.43
      expect(
        rows[0].querySelector(".summary-cell-laps").textContent.trim(),
      ).toBe("15.00");
      expect(
        rows[0].querySelector(".summary-cell-best-lap").textContent.trim(),
      ).toBe("5.43");
    });

    it("should fallback to standard lane badges when summaries are disabled", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 1 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showActiveSummary: false,
          showCompletedSummary: false,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      expect(heat1.querySelector(".heat-summary-table")).toBeFalsy();
      expect(heat1.querySelector(".heat-lanes-grid")).toBeTruthy();
    });
  });
});
