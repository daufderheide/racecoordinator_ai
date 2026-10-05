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

  it("should highlight the current heat, place race state flag and race time on the right, and not render current heat badge", () => {
    const currentCard = fixture.nativeElement.querySelector(
      "#heat-card-1.current-heat",
    );
    expect(currentCard).toBeTruthy();

    const currentBadge = fixture.nativeElement.querySelector(
      ".current-heat-badge",
    );
    expect(currentBadge).toBeFalsy();

    // Right-aligned status container in card header containing both flag and time
    const rightStatus = currentCard.querySelector(
      ".heat-card-header .header-right-status",
    );
    expect(rightStatus).toBeTruthy();

    const flagContainer = rightStatus.querySelector(".header-flag-container");
    expect(flagContainer).toBeTruthy();

    const flagImg = flagContainer.querySelector(".header-flag");
    expect(flagImg).toBeTruthy();
    expect(flagImg.getAttribute("src")).toBe("assets/flags/green.svg");

    const timeEl = rightStatus.querySelector(".header-time");
    expect(timeEl).toBeTruthy();
    expect(timeEl.textContent.trim()).toBe("01:23.4");

    // Non-current heat (heat 2) should NOT show status, flag or time
    const heat2Card = fixture.nativeElement.querySelector("#heat-card-2");
    expect(heat2Card.querySelector(".header-right-status")).toBeFalsy();
    expect(heat2Card.querySelector(".header-center-status")).toBeFalsy();
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
    expect(currentCard.querySelector(".current-heat-badge")).toBeFalsy();

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

  it("should handle lane and heat columns configuration with content-aware dynamic min-width", () => {
    // Default widget has 4 lanes across with 9-char name => min-width 516px
    expect(component.getHeatColumnsStyle()).toBe(
      "repeat(auto-fill, minmax(516px, 1fr))",
    );
    expect(component.getLaneColumnsStyle()).toBe("repeat(4, 1fr)");

    // Fixed heatColumns and laneColumns
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

  it("should dynamically calculate card min-width based on visible summary columns", () => {
    // When summary is completely disabled and laneColumns is 1, base min-width floor of 280px applies
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        heatColumns: "auto",
        laneColumns: "1",
        showActiveSummary: false,
        showCompletedSummary: false,
        showFutureSummary: false,
        showCurrentHeatFlag: false,
        showCurrentHeatTime: false,
      },
    });
    fixture.detectChanges();

    expect(component.calculateAutoCardMinWidth()).toBe(280);
    expect(component.getHeatColumnsStyle()).toBe(
      "repeat(auto-fill, minmax(280px, 1fr))",
    );

    // When all summary columns (Pos, Driver, Laps, Best, Gap, Avg, Median) are enabled
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        heatColumns: "auto",
        showActiveSummary: true,
        summaryShowPosition: true,
        summaryShowDriver: true,
        summaryShowLaps: true,
        summaryShowBestLap: true,
        summaryShowGap: true,
        summaryShowAverageLap: true,
        summaryShowMedianLap: true,
      },
    });
    fixture.detectChanges();

    const fullTableMinWidth = component.calculateAutoCardMinWidth();
    expect(fullTableMinWidth).toBeGreaterThanOrEqual(550);
    expect(component.getHeatColumnsStyle()).toBe(
      `repeat(auto-fill, minmax(${fullTableMinWidth}px, 1fr))`,
    );
  });

  it("should increase card min-width when laneColumns requires multiple columns", () => {
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        heatColumns: "auto",
        showActiveSummary: false,
        showCompletedSummary: false,
        showFutureSummary: false,
        laneColumns: "3",
      },
    });
    fixture.detectChanges();

    const minWidth = component.calculateAutoCardMinWidth();
    // 3 columns * 120 + 2 * 4 + 24 = 392
    expect(minWidth).toBe(392);
    expect(component.getHeatColumnsStyle()).toBe(
      "repeat(auto-fill, minmax(392px, 1fr))",
    );
  });

  it("should dynamically expand card min-width based on driver name length and cap at maximum characters", () => {
    // 12-character name: text width = round(12 * 7.5 + 8) = 98 => badge width = 142px
    // 4 columns: 4 * 142 + 3 * 4 + 24 = 604px
    const heatsWithLongName = [
      {
        heatNumber: 1,
        isCompleted: false,
        heatDrivers: [
          {
            laneIndex: 0,
            driver: { nickname: "DriverTwenty" }, // 12 characters
          },
        ],
      },
    ];

    fixture.componentRef.setInput("heats", heatsWithLongName);
    fixture.componentRef.setInput("widget", {
      ...mockWidget,
      customSettings: {
        ...mockWidget.customSettings,
        heatColumns: "auto",
        laneColumns: "auto",
        showActiveSummary: false,
      },
    });
    fixture.detectChanges();

    expect(component.calculateAutoCardMinWidth()).toBe(604);

    // 30-character outlier: capped at 13 characters => text width = round(13 * 7.5 + 8) = 106 => badge = 150px
    // 4 columns: 4 * 150 + 3 * 4 + 24 = 636px
    const heatsWithSuperLongName = [
      {
        heatNumber: 1,
        isCompleted: false,
        heatDrivers: [
          {
            laneIndex: 0,
            driver: { nickname: "SuperLongDriverNameExceedingMax" }, // 31 characters
          },
        ],
      },
    ];

    fixture.componentRef.setInput("heats", heatsWithSuperLongName);
    fixture.detectChanges();

    expect(component.calculateAutoCardMinWidth()).toBe(636);
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
      expect(summaryTable2.style.getPropertyValue("--lane-count")).toBe("4");
    });

    it("should set --lane-count on summary table so all lanes divide height equally", () => {
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

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const table = heat1.querySelector(".heat-summary-table");
      expect(table).toBeTruthy();
      expect(table.style.getPropertyValue("--lane-count")).toBe("4");
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
          showFutureSummary: false,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      expect(heat1.querySelector(".heat-summary-table")).toBeFalsy();
      expect(heat1.querySelector(".heat-lanes-grid")).toBeTruthy();
    });

    it("should render summary tables for all heats including future heats when showFutureSummary is true", () => {
      fixture.componentRef.setInput("heats", mockTelemetryHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCompletedSummary: true,
          showActiveSummary: true,
          showFutureSummary: true,
          summaryShowGap: true,
          summaryShowAverageLap: true,
          summaryShowMedianLap: true,
        },
      });
      fixture.detectChanges();

      // All 3 heats (completed Heat 1, active Heat 2, future Heat 3) should render summary tables
      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const heat2 = fixture.nativeElement.querySelector("#heat-card-2");
      const heat3 = fixture.nativeElement.querySelector("#heat-card-3");

      expect(heat1.querySelector(".heat-summary-table")).toBeTruthy();
      expect(heat2.querySelector(".heat-summary-table")).toBeTruthy();
      expect(heat3.querySelector(".heat-summary-table")).toBeTruthy();
      expect(heat3.querySelector(".heat-lanes-grid")).toBeFalsy();

      // Check future Heat 3 lane rows: driver shown, but all lap & standing metrics are "--"
      const heat3Rows = heat3.querySelectorAll(".summary-lane-row");
      expect(heat3Rows.length).toBe(4);

      // Lane 1: Batman
      expect(
        heat3Rows[0].querySelector(".summary-cell-driver").textContent,
      ).toContain("Batman");
      expect(
        heat3Rows[0].querySelector(".summary-cell-pos").textContent.trim(),
      ).toBe("--");
      expect(
        heat3Rows[0].querySelector(".summary-cell-laps").textContent.trim(),
      ).toBe("--");
      expect(
        heat3Rows[0].querySelector(".summary-cell-best-lap").textContent.trim(),
      ).toBe("--");
      expect(
        heat3Rows[0].querySelector(".summary-cell-gap").textContent.trim(),
      ).toBe("--");
      expect(
        heat3Rows[0].querySelector(".summary-cell-avg-lap").textContent.trim(),
      ).toBe("--");
      expect(
        heat3Rows[0]
          .querySelector(".summary-cell-median-lap")
          .textContent.trim(),
      ).toBe("--");

      // Lane 2: Superman
      expect(
        heat3Rows[1].querySelector(".summary-cell-driver").textContent,
      ).toContain("Superman");
      expect(
        heat3Rows[1].querySelector(".summary-cell-pos").textContent.trim(),
      ).toBe("--");
      expect(
        heat3Rows[1].querySelector(".summary-cell-laps").textContent.trim(),
      ).toBe("--");
      expect(
        heat3Rows[1].querySelector(".summary-cell-best-lap").textContent.trim(),
      ).toBe("--");
    });

    it("should display dashes for future heat even if heatDriver object contains residual lap data", () => {
      const heatsWithResidualData = [
        {
          heatNumber: 1,
          isCompleted: false,
          heatDrivers: [
            {
              laneIndex: 0,
              driver: { nickname: "FutureRacer" },
              rank: 1,
              lapCount: 20,
              bestLapTime: 4.888,
              gapLeader: 0.123,
              averageLapTime: 5.1,
              medianLapTime: 5.0,
            },
          ],
        },
      ];

      // Heat 1 is future because curHeatNum is 0 (race not started yet) and not completed
      fixture.componentRef.setInput("heats", heatsWithResidualData);
      fixture.componentRef.setInput("currentHeat", null);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showFutureSummary: true,
          summaryShowGap: true,
          summaryShowAverageLap: true,
          summaryShowMedianLap: true,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const summaryTable = heat1.querySelector(".heat-summary-table");
      expect(summaryTable).toBeTruthy();

      const row = heat1.querySelector(".summary-lane-row");
      expect(row.querySelector(".summary-cell-driver").textContent).toContain(
        "FutureRacer",
      );
      expect(row.querySelector(".summary-cell-pos").textContent.trim()).toBe(
        "--",
      );
      expect(row.querySelector(".summary-cell-laps").textContent.trim()).toBe(
        "--",
      );
      expect(
        row.querySelector(".summary-cell-best-lap").textContent.trim(),
      ).toBe("--");
      expect(row.querySelector(".summary-cell-gap").textContent.trim()).toBe(
        "--",
      );
      expect(
        row.querySelector(".summary-cell-avg-lap").textContent.trim(),
      ).toBe("--");
      expect(
        row.querySelector(".summary-cell-median-lap").textContent.trim(),
      ).toBe("--");
    });

    it("should display dashes for future heat with legacy lanes structure", () => {
      const heatsWithLegacyLanes = [
        {
          heatNumber: 1,
          isCompleted: false,
          lanes: [
            {
              laneNumber: 1,
              nickname: "LegacyRacer",
              rank: 1,
              lapCount: 12,
              bestLapTime: 5.2,
              gapLeader: 0.4,
              averageLapTime: 5.5,
              medianLapTime: 5.4,
            },
          ],
        },
      ];

      fixture.componentRef.setInput("heats", heatsWithLegacyLanes);
      fixture.componentRef.setInput("currentHeat", null);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showFutureSummary: true,
          summaryShowGap: true,
          summaryShowAverageLap: true,
          summaryShowMedianLap: true,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const row = heat1.querySelector(".summary-lane-row");
      expect(row.querySelector(".summary-cell-driver").textContent).toContain(
        "LegacyRacer",
      );
      expect(row.querySelector(".summary-cell-pos").textContent.trim()).toBe(
        "--",
      );
      expect(row.querySelector(".summary-cell-laps").textContent.trim()).toBe(
        "--",
      );
      expect(
        row.querySelector(".summary-cell-best-lap").textContent.trim(),
      ).toBe("--");
      expect(row.querySelector(".summary-cell-gap").textContent.trim()).toBe(
        "--",
      );
      expect(
        row.querySelector(".summary-cell-avg-lap").textContent.trim(),
      ).toBe("--");
      expect(
        row.querySelector(".summary-cell-median-lap").textContent.trim(),
      ).toBe("--");
    });

    it("should only display team name in summary data when driver is a team, and not both driver and team name", () => {
      const heatsWithTeam = [
        {
          heatNumber: 1,
          isCompleted: false,
          heatDrivers: [
            {
              laneIndex: 0,
              driver: { nickname: "Speedy" },
              participant: { team: null },
            },
            {
              laneIndex: 1,
              driver: { nickname: "Rocket" },
              participant: { team: { name: "Team Red" } },
            },
          ],
        },
      ];

      fixture.componentRef.setInput("heats", heatsWithTeam);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 1 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showActiveSummary: true,
          summaryShowDriver: true,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const rows = heat1.querySelectorAll(".summary-lane-row");

      // Lane 1 is individual driver: shows Speedy
      const lane1DriverCell = rows[0].querySelector(".summary-cell-driver");
      expect(lane1DriverCell.textContent.trim()).toBe("Speedy");
      expect(
        lane1DriverCell.querySelector(".summary-driver-nickname"),
      ).toBeTruthy();
      expect(lane1DriverCell.querySelector(".summary-team-name")).toBeFalsy();

      // Lane 2 is team driver: shows Team Red only, NOT Rocket
      const lane2DriverCell = rows[1].querySelector(".summary-cell-driver");
      expect(lane2DriverCell.textContent.trim()).toBe("Team Red");
      expect(lane2DriverCell.querySelector(".summary-team-name")).toBeTruthy();
      expect(
        lane2DriverCell.querySelector(".summary-driver-nickname"),
      ).toBeFalsy();
      expect(lane2DriverCell.textContent).not.toContain("Rocket");
    });

    it("should continue to display both driver nickname and team name when heat is NOT showing summary data", () => {
      const heatsWithTeam = [
        {
          heatNumber: 1,
          isCompleted: false,
          heatDrivers: [
            {
              laneIndex: 0,
              driver: { nickname: "Rocket" },
              participant: { team: { name: "Team Red" } },
            },
          ],
        },
      ];

      fixture.componentRef.setInput("heats", heatsWithTeam);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 1 } as Heat);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showActiveSummary: false, // Summary disabled -> standard lane badge view
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const badge = heat1.querySelector(".lane-badge-item");
      expect(badge).toBeTruthy();

      const driverNick = badge.querySelector(".lane-driver-nickname");
      const teamName = badge.querySelector(".lane-team-name");

      expect(driverNick).toBeTruthy();
      expect(driverNick.textContent.trim()).toBe("Rocket");
      expect(teamName).toBeTruthy();
      expect(teamName.textContent.trim()).toBe("Team Red");
    });
  });

  describe("Group Display", () => {
    it("should display group number when group_options is enabled", () => {
      fixture.componentRef.setInput("race", {
        group_options: {
          enabled: true,
          names: [],
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const heat2 = fixture.nativeElement.querySelector("#heat-card-2");

      const title1 = heat1.querySelector(".heat-title-text").textContent.trim();
      const title2 = heat2.querySelector(".heat-title-text").textContent.trim();

      const sep1 = heat1.querySelector(".heat-separator");
      expect(sep1).not.toBeNull();
      expect(sep1.textContent).toBe(" - ");

      expect(title1).toBe("RM_LABEL_HEAT_NUMBER - RE_GROUPS_LABEL 1");
      expect(title2).toBe("RM_LABEL_HEAT_NUMBER - RE_GROUPS_LABEL 2");
    });

    it("should display custom group name when group_options has names defined", () => {
      fixture.componentRef.setInput("race", {
        group_options: {
          enabled: true,
          names: ["Pro Group", "Amateur Group"],
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const heat2 = fixture.nativeElement.querySelector("#heat-card-2");

      const title1 = heat1.querySelector(".heat-title-text").textContent.trim();
      const title2 = heat2.querySelector(".heat-title-text").textContent.trim();

      expect(title1).toBe("RM_LABEL_HEAT_NUMBER - Pro Group");
      expect(title2).toBe("RM_LABEL_HEAT_NUMBER - Amateur Group");
    });

    it("should not display group when group_options is disabled", () => {
      fixture.componentRef.setInput("race", {
        group_options: {
          enabled: false,
          names: ["Pro Group"],
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const title1 = heat1.querySelector(".heat-title-text").textContent.trim();

      expect(title1).toBe("RM_LABEL_HEAT_NUMBER");
      expect(heat1.querySelector(".heat-separator")).toBeNull();
      expect(title1).not.toContain("RE_GROUPS_LABEL");
      expect(title1).not.toContain("Pro Group");
    });

    it("should support camelCase groupOptions and fallback to parent.race", () => {
      fixture.componentRef.setInput("race", undefined);
      fixture.componentRef.setInput("parent", {
        race: {
          groupOptions: {
            enabled: true,
            names: ["Semi-Pro"],
          },
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const heat2 = fixture.nativeElement.querySelector("#heat-card-2");

      const title1 = heat1.querySelector(".heat-title-text").textContent.trim();
      const title2 = heat2.querySelector(".heat-title-text").textContent.trim();

      expect(title1).toBe("RM_LABEL_HEAT_NUMBER - Semi-Pro");
      expect(title2).toBe("RM_LABEL_HEAT_NUMBER - RE_GROUPS_LABEL 2");
    });

    it("should toggle has-center-status class on heat-card-header for current heat", () => {
      const currentCard = fixture.nativeElement.querySelector(
        "#heat-card-1.current-heat",
      );
      const header = currentCard.querySelector(".heat-card-header");
      expect(header.classList.contains("has-center-status")).toBeTrue();

      // Disable both flag and time
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showCurrentHeatFlag: false,
          showCurrentHeatTime: false,
        },
      });
      fixture.detectChanges();

      expect(header.classList.contains("has-center-status")).toBeFalse();
    });

    it("should provide full title bar space for heat and group info with right-aligned flag and time and no badge", () => {
      const currentCard = fixture.nativeElement.querySelector(
        "#heat-card-1.current-heat",
      );
      expect(currentCard).toBeTruthy();
      expect(currentCard.classList.contains("current-heat")).toBeTrue();

      // No active heat badge
      expect(currentCard.querySelector(".current-heat-badge")).toBeNull();

      // Title text has heat and group info
      const titleText = currentCard.querySelector(".heat-title-text");
      expect(titleText).toBeTruthy();
      expect(titleText.textContent).toContain("RM_LABEL_HEAT_NUMBER");

      // Right-aligned status container with flag and time
      const rightStatus = currentCard.querySelector(".header-right-status");
      expect(rightStatus).toBeTruthy();
      expect(rightStatus.querySelector(".header-flag")).toBeTruthy();
      expect(rightStatus.querySelector(".header-time")).toBeTruthy();
    });

    it("should use lane background color and font color when summaryUseLaneColors is enabled", () => {
      fixture.componentRef.setInput("track", {
        id: "track-1",
        name: "Test Track",
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
        ],
      } as any);

      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showActiveSummary: true,
          summaryUseLaneColors: true,
          summaryRowTextColor: "#123456",
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const rows = heat1.querySelectorAll(".summary-lane-row");
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const row1 = rows[0] as HTMLElement;
      expect(row1.style.backgroundColor).toBe("rgb(255, 0, 0)");
      expect(row1.style.color).toBe("rgb(255, 255, 255)");
    });

    it("should use summaryRowTextColor and default background when summaryUseLaneColors is disabled", () => {
      fixture.componentRef.setInput("track", {
        id: "track-1",
        name: "Test Track",
        lanes: [
          {
            lane_number: 1,
            background_color: "#ff0000",
            foreground_color: "#ffffff",
          },
        ],
      } as any);

      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showActiveSummary: true,
          summaryUseLaneColors: false,
          summaryRowTextColor: "#123456",
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const rows = heat1.querySelectorAll(".summary-lane-row");
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const row1 = rows[0] as HTMLElement;
      // Background should not be lane color (null / empty style)
      expect(row1.style.backgroundColor).toBe("");
      // Font color should come from summaryRowTextColor
      expect(row1.style.color).toBe("rgb(18, 52, 86)");
    });

    it("should render lane-badge-item and heat-lanes-grid elements with stretching layout across heats", () => {
      const mixedHeats = [
        {
          heatNumber: 1,
          isCompleted: false,
          heatDrivers: [
            { laneIndex: 0, driver: { nickname: "Speedy" } },
            { laneIndex: 1, driver: { nickname: "Rocket" } },
          ],
        },
        {
          heatNumber: 2,
          isCompleted: false,
          heatDrivers: [
            { laneIndex: 0, driver: { nickname: "Driver A" } },
            {
              laneIndex: 1,
              driver: { nickname: "Driver B" },
              participant: { team: { name: "Team Beta" } },
            },
          ],
        },
      ];

      fixture.componentRef.setInput("heats", mixedHeats);
      fixture.componentRef.setInput("currentHeat", null);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          showActiveSummary: false,
          showFutureSummary: false,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const heat2 = fixture.nativeElement.querySelector("#heat-card-2");

      expect(heat1.querySelector(".heat-lanes-grid")).toBeTruthy();
      expect(heat2.querySelector(".heat-lanes-grid")).toBeTruthy();

      const heat1Badges = heat1.querySelectorAll(".lane-badge-item");
      const heat2Badges = heat2.querySelectorAll(".lane-badge-item");

      expect(heat1Badges.length).toBe(4);
      expect(heat2Badges.length).toBe(4);
    });

    it("should support independent display options: active summary with lane colors, completed summary without lane colors, and future heats with no summary and no lane colors", () => {
      fixture.componentRef.setInput("track", {
        id: "track-1",
        name: "Test Track",
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
        ],
      } as any);

      const threeHeats = [
        {
          heatNumber: 1,
          isCompleted: true,
          heatDrivers: [
            { laneIndex: 0, driver: { nickname: "Driver 1" } },
            { laneIndex: 1, driver: { nickname: "Driver 2" } },
          ],
        },
        {
          heatNumber: 2,
          isCompleted: false,
          heatDrivers: [
            { laneIndex: 0, driver: { nickname: "Driver 3" } },
            { laneIndex: 1, driver: { nickname: "Driver 4" } },
          ],
        },
        {
          heatNumber: 3,
          isCompleted: false,
          heatDrivers: [
            { laneIndex: 0, driver: { nickname: "Driver 5" } },
            { laneIndex: 1, driver: { nickname: "Driver 6" } },
          ],
        },
      ];

      fixture.componentRef.setInput("heats", threeHeats);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as any);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          activeHeatDisplay: "summary_lane_colors", // A) Summary with Lane colors
          completedHeatsDisplay: "summary", // B) Summary without Lane colors
          futureHeatsDisplay: "off", // C) No Summary and No Lane colors
          summaryRowTextColor: "#abcdef",
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1"); // Completed
      const heat2 = fixture.nativeElement.querySelector("#heat-card-2"); // Active
      const heat3 = fixture.nativeElement.querySelector("#heat-card-3"); // Future

      // Heat 1 (Completed): Summary table rendered WITHOUT lane background colors
      expect(heat1.querySelector(".heat-summary-table")).toBeTruthy();
      const heat1Row = heat1.querySelector(".summary-lane-row") as HTMLElement;
      expect(heat1Row.style.backgroundColor).toBe("");
      expect(heat1Row.style.color).toBe("rgb(171, 205, 239)");

      // Heat 2 (Active): Summary table rendered WITH lane background colors
      expect(heat2.querySelector(".heat-summary-table")).toBeTruthy();
      const heat2Row = heat2.querySelector(".summary-lane-row") as HTMLElement;
      expect(heat2Row.style.backgroundColor).toBe("rgb(255, 0, 0)");
      expect(heat2Row.style.color).toBe("rgb(255, 255, 255)");

      // Heat 3 (Future): No summary table, lane badges rendered WITHOUT lane background colors
      expect(heat3.querySelector(".heat-summary-table")).toBeFalsy();
      expect(heat3.querySelector(".heat-lanes-grid")).toBeTruthy();
      const heat3Badges = heat3.querySelectorAll(".lane-badge-item");
      expect(heat3Badges.length).toBe(2);
      const heat3Badge1 = heat3Badges[0] as HTMLElement;
      expect(heat3Badge1.style.backgroundColor).toBe("");
      expect(heat3Badge1.classList.contains("no-lane-colors")).toBeTrue();
    });

    it("should render future heats with lane colors when futureHeatsDisplay is lane_colors", () => {
      fixture.componentRef.setInput("track", {
        id: "track-1",
        name: "Test Track",
        lanes: [
          {
            lane_number: 1,
            background_color: "#ff0000",
            foreground_color: "#ffffff",
          },
        ],
      } as any);

      fixture.componentRef.setInput("heats", [
        {
          heatNumber: 1,
          isCompleted: false,
          heatDrivers: [{ laneIndex: 0, driver: { nickname: "Solo" } }],
        },
      ]);
      fixture.componentRef.setInput("currentHeat", null);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          futureHeatsDisplay: "lane_colors",
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      expect(heat1.querySelector(".heat-lanes-grid")).toBeTruthy();
      const badge = heat1.querySelector(".lane-badge-item") as HTMLElement;
      expect(badge.style.backgroundColor).toBe("rgb(255, 0, 0)");
      expect(badge.classList.contains("no-lane-colors")).toBeFalse();
    });

    it("should resolve legacy settings for active, completed, and future heats when display modes are undefined", () => {
      fixture.componentRef.setInput("track", {
        id: "track-1",
        lanes: [
          {
            lane_number: 1,
            background_color: "#ff0000",
            foreground_color: "#ffffff",
          },
        ],
      } as any);

      fixture.componentRef.setInput("heats", [
        { heatNumber: 1, isCompleted: true, heatDrivers: [{ laneIndex: 0 }] },
        { heatNumber: 2, isCompleted: false, heatDrivers: [{ laneIndex: 0 }] },
        { heatNumber: 3, isCompleted: false, heatDrivers: [{ laneIndex: 0 }] },
      ]);
      fixture.componentRef.setInput("currentHeat", { heatNumber: 2 } as any);
      fixture.componentRef.setInput("widget", {
        ...mockWidget,
        customSettings: {
          ...mockWidget.customSettings,
          activeHeatDisplay: undefined,
          completedHeatsDisplay: undefined,
          futureHeatsDisplay: undefined,
          showActiveSummary: true,
          showCompletedSummary: false,
          showFutureSummary: true,
          summaryUseLaneColors: false,
        },
      });
      fixture.detectChanges();

      const heat1 = fixture.nativeElement.querySelector("#heat-card-1");
      const heat2 = fixture.nativeElement.querySelector("#heat-card-2");
      const heat3 = fixture.nativeElement.querySelector("#heat-card-3");

      // Completed has showCompletedSummary: false -> lane_colors
      expect(heat1.querySelector(".heat-lanes-grid")).toBeTruthy();
      const heat1Badge = heat1.querySelector(".lane-badge-item") as HTMLElement;
      expect(heat1Badge.style.backgroundColor).toBe("rgb(255, 0, 0)");

      // Active has showActiveSummary: true, summaryUseLaneColors: false -> summary
      expect(heat2.querySelector(".heat-summary-table")).toBeTruthy();
      const heat2Row = heat2.querySelector(".summary-lane-row") as HTMLElement;
      expect(heat2Row.style.backgroundColor).toBe("");

      // Future has showFutureSummary: true, summaryUseLaneColors: false -> summary
      expect(heat3.querySelector(".heat-summary-table")).toBeTruthy();
      const heat3Row = heat3.querySelector(".summary-lane-row") as HTMLElement;
      expect(heat3Row.style.backgroundColor).toBe("");
    });
  });
});
