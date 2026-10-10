import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Role } from "@app/models/role";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { RacedayLaneColumnComponent } from "./raceday-lane-column.component";

describe("RacedayLaneColumnComponent", () => {
  let component: RacedayLaneColumnComponent;
  let fixture: ComponentFixture<RacedayLaneColumnComponent>;
  let mockParent: any;

  const mockDrivers: DriverHeatData[] = [
    {
      objectId: "driver-1",
      laneIndex: 0,
      bestLapTime: 7.481,
      averageLapTime: 8.012,
      medianLapTime: 7.995,
      driver: { name: "Driver One", nickname: "D1", avatar_url: "avatar1.png" },
      isLastLapDrift: false,
    } as any,
    {
      objectId: "driver-2",
      laneIndex: 1,
      bestLapTime: 8.123,
      averageLapTime: 8.543,
      medianLapTime: 8.511,
      driver: { name: "Driver Two", nickname: "D2", avatar_url: "avatar2.png" },
      isLastLapDrift: true,
    } as any,
  ];

  beforeEach(async () => {
    mockParent = {
      heatDrivers: mockDrivers,
      heat: {
        heatDrivers: mockDrivers,
        standings: ["driver-2", "driver-1"], // driver-2 is in P1, driver-1 is in P2
      },
      track: {
        lanes: [
          { background_color: "#112233", foreground_color: "#ffcc00" },
          { background_color: "#223344", foreground_color: "#00ccff" },
        ],
      },
      columns: [
        { propertyName: "lastLapTime", labelKey: "RD_COL_LAP_TIME" },
        { propertyName: "lapCount", labelKey: "RD_COL_LAP" },
      ],
      getLaneColor: (hd: DriverHeatData, prop: string) => {
        const lane = mockParent.track.lanes[hd.laneIndex];
        return lane ? lane[prop] : "";
      },
      getColumnLabel: (col: any) => {
        if (col?.labelKey === "RD_COL_LAP_TIME") return "Last Lap Time";
        return col?.labelKey || col?.propertyName;
      },
      formatValue: (prop: string, val: any, _hd: DriverHeatData) => {
        if (prop === "lastLapTime") return "7.863";
        if (prop === "lapCount") return "25";
        return String(val ?? "--");
      },
      getLastLaps: () => [
        { lapNumber: 24, lapTime: "11.543", isBest: false },
        { lapNumber: 23, lapTime: "7.845", isBest: true },
      ],
      getFullUrl: (url: string) => `http://localhost/${url}`,
      getCurrentFlagUrl: () => "http://localhost/green-flag.png",
      getLaneQrCodeUrl: (lane: number) =>
        `http://localhost/qr-lane-${lane}.png`,
      getDriverViewQrCodeUrl: (lane: number) =>
        `http://localhost/dv-qr-${lane}.png`,
      getDriverVisualPosition: (hd: DriverHeatData) =>
        hd.objectId === "driver-2" ? 0 : 1,
      authService: { currentRole: Role.DIRECTOR },
      onCellClick: jasmine.createSpy("onCellClick"),
      resetLane: jasmine.createSpy("resetLane"),
      onTeammateChange: jasmine.createSpy("onTeammateChange"),
      isNameProperty: (prop: string) =>
        prop === "driver.name" || prop === "driver.nickname",
      isTeam: () => true,
      isDriverSwapDisabled: () => false,
      getTeammates: () => [{ entity_id: "tm-1", name: "Teammate One" }],
      getDropdownArrowBg: () => "none",
    };

    await TestBed.configureTestingModule({
      imports: [RacedayLaneColumnComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayLaneColumnComponent);
    component = fixture.componentInstance;
  });

  function createWidget(
    settings: Partial<LaneColumnWidgetSettings>,
  ): AbsoluteWidgetNode {
    return {
      id: "widget-lane-col-1",
      widgetType: "lane-column",
      x: 10,
      y: 10,
      width: 200,
      height: 100,
      zIndex: 100,
      customSettings: {
        columnKey: "lastLapTime",
        bindingMode: "lane",
        targetIndex: 0,
        layoutOrientation: "vertical",
        showHeader: true,
        useLaneColors: true,
        showBorder: true,
        ...settings,
      },
    };
  }

  it("should resolve target driver by laneIndex in lane mode", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "lane", targetIndex: 0 }),
    );
    fixture.detectChanges();

    expect(component.targetDriver?.objectId).toBe("driver-1");
    expect(component.targetDriver?.laneIndex).toBe(0);

    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "lane", targetIndex: 1 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-2");
    expect(component.targetDriver?.laneIndex).toBe(1);
  });

  it("should resolve target driver by heat standings in position mode", () => {
    fixture.componentRef.setInput("parent", mockParent);
    // standings has ["driver-2", "driver-1"], so P0 is driver-2 and P1 is driver-1
    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "position", targetIndex: 0 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-2");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "position", targetIndex: 1 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-1");
  });

  it("should resolve target driver by driverRankings map when available in position mode", () => {
    mockParent.driverRankings = new Map<string, number>();
    mockParent.driverRankings.set("driver-1", 1); // driver-1 is rank 1
    mockParent.driverRankings.set("driver-2", 2); // driver-2 is rank 2

    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "position", targetIndex: 0 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-1");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "position", targetIndex: 1 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-2");
  });

  it("should fallback to sorting by performance when standings and driverRankings are absent", () => {
    mockParent.driverRankings = new Map<string, number>();
    mockParent.heat.standings = [];
    (mockDrivers[0] as any).lapCount = 20;
    (mockDrivers[0] as any).totalTime = 150;
    (mockDrivers[1] as any).lapCount = 25;
    (mockDrivers[1] as any).totalTime = 145;

    fixture.componentRef.setInput("parent", mockParent);
    // driver-2 has more laps (25 vs 20), so P0 should be driver-2
    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "position", targetIndex: 0 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-2");
  });

  it("should resolve target driver by overall rank in overallPosition mode", () => {
    mockParent.participants = [
      {
        objectId: "driver-1",
        rank: 2,
        seed: 1,
        driver: { name: "Driver One" },
      },
      {
        objectId: "driver-3",
        rank: 1,
        seed: 3,
        driver: { name: "Driver Three" },
      },
    ];

    fixture.componentRef.setInput("parent", mockParent);
    // targetIndex: 0 means rank 1 (driver-3, not in active heat -> synthetic)
    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "overallPosition", targetIndex: 0 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-3");
    expect(component.targetDriver?.driver?.name).toBe("Driver Three");

    // targetIndex: 1 means rank 2 (driver-1, in active heat -> returns active heat driver)
    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "overallPosition", targetIndex: 1 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-1");
  });

  it("should resolve target driver by seed in seed mode", () => {
    mockParent.participants = [
      {
        objectId: "driver-1",
        rank: 2,
        seed: 1,
        driver: { name: "Driver One" },
      },
      {
        objectId: "driver-3",
        rank: 1,
        seed: 2,
        driver: { name: "Driver Three" },
      },
    ];

    fixture.componentRef.setInput("parent", mockParent);
    // targetIndex: 0 means seed 1 (driver-1)
    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "seed", targetIndex: 0 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-1");

    // targetIndex: 1 means seed 2 (driver-3)
    fixture.componentRef.setInput(
      "widget",
      createWidget({ bindingMode: "seed", targetIndex: 1 }),
    );
    fixture.detectChanges();
    expect(component.targetDriver?.objectId).toBe("driver-3");
  });

  it("should inherit background and foreground colors from lane by default", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        bindingMode: "lane",
        targetIndex: 0,
        useLaneColors: true,
      }),
    );
    fixture.detectChanges();

    expect(component.backgroundColor).toBe("#112233");
    expect(component.foregroundColor).toBe("#ffcc00");
    expect(component.borderColor).toBe("#ffcc00");
  });

  it("should allow custom color overrides when useLaneColors is false", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        useLaneColors: false,
        backgroundColor: "#000000",
        textColor: "#ffffff",
        borderColor: "#ff0000",
      }),
    );
    fixture.detectChanges();

    expect(component.backgroundColor).toBe("#000000");
    expect(component.foregroundColor).toBe("#ffffff");
    expect(component.borderColor).toBe("#ff0000");
  });

  it("should dynamically switch colors in position mode when standings change", () => {
    fixture.componentRef.setInput("parent", mockParent);
    // P0 is currently driver-2 who is in Lane 1 (#223344 / #00ccff)
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        bindingMode: "position",
        targetIndex: 0,
        useLaneColors: true,
      }),
    );
    fixture.detectChanges();

    expect(component.backgroundColor).toBe("#223344");
    expect(component.foregroundColor).toBe("#00ccff");

    // Standings change: driver-1 overtakes and is now in P0 (Lane 0: #112233 / #ffcc00)
    mockParent.heat.standings = ["driver-1", "driver-2"];
    fixture.detectChanges();

    expect(component.backgroundColor).toBe("#112233");
    expect(component.foregroundColor).toBe("#ffcc00");
  });

  it("should render header with customLabel or fallback to column label", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "lastLapTime",
        customLabel: "PERSONAL RECORD",
      }),
    );
    fixture.detectChanges();
    expect(component.headerLabel).toBe("PERSONAL RECORD");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lastLapTime", customLabel: "" }),
    );
    fixture.detectChanges();
    expect(component.headerLabel).toBe("Last Lap Time");

    // Test columns that are not in parent.columns but resolve through RacedayLayoutUtils
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "physicalLapCount" }),
    );
    fixture.detectChanges();
    expect(component.headerLabel).toBe("UI_EDITOR_COL_LAP_COUNT");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lastLaps" }),
    );
    fixture.detectChanges();
    expect(component.headerLabel).toBe("RD_COL_LAST_LAPS");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "projectedLaps" }),
    );
    fixture.detectChanges();
    expect(component.headerLabel).toBe("RD_COL_PROJ_LAPS");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "projectedRank" }),
    );
    fixture.detectChanges();
    expect(component.headerLabel).toBe("RD_COL_PROJ_RANK");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "winProbability" }),
    );
    fixture.detectChanges();
    expect(component.headerLabel).toBe("RD_COL_WIN_PROB");
  });

  it("should format standard values using parent.formatValue", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lastLapTime" }),
    );
    fixture.detectChanges();
    expect(component.formattedValue).toBe("7.863");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lapCount" }),
    );
    fixture.detectChanges();
    expect(component.formattedValue).toBe("25");
  });

  it("should identify lastLaps and fetch lap list", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lastLaps" }),
    );
    fixture.detectChanges();

    expect(component.isLastLaps()).toBeTrue();
    const laps = component.getLastLaps();
    expect(laps.length).toBe(2);
    expect(laps[0].lapNumber).toBe(24);
  });

  it("should detect image properties and resolve URLs", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "driver.avatarUrl", targetIndex: 0 }),
    );
    fixture.detectChanges();

    expect(component.isImageProperty()).toBeTrue();
    expect(component.getImageUrl()).toBe("http://localhost/avatar1.png");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "qrCode", targetIndex: 0 }),
    );
    fixture.detectChanges();
    expect(component.getImageUrl()).toBe("http://localhost/qr-lane-0.png");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "flag" }),
    );
    fixture.detectChanges();
    expect(component.getImageUrl()).toBe("http://localhost/green-flag.png");

    mockParent.formatColumnValue = jasmine
      .createSpy("formatColumnValue")
      .and.returnValue("http://localhost/custom-flag.png");
    expect(component.getImageUrl()).toBe("http://localhost/custom-flag.png");
    expect(mockParent.formatColumnValue).toHaveBeenCalledWith(
      component.targetDriver,
      undefined,
      "flag",
      undefined,
    );
  });

  it("should detect drift lap on lastLapTime when driver has isLastLapDrift", () => {
    fixture.componentRef.setInput("parent", mockParent);
    // driver-1 has isLastLapDrift = false
    fixture.componentRef.setInput(
      "widget",
      createWidget({ targetIndex: 0, columnKey: "lastLapTime" }),
    );
    fixture.detectChanges();
    expect(component.isDriftLap()).toBeFalse();

    // driver-2 has isLastLapDrift = true
    fixture.componentRef.setInput(
      "widget",
      createWidget({ targetIndex: 1, columnKey: "lastLapTime" }),
    );
    fixture.detectChanges();
    expect(component.isDriftLap()).toBeTrue();
  });

  it("should map pacing properties to benchmark types", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "ghostPacingPB" }),
    );
    fixture.detectChanges();
    expect(component.isPacingProperty()).toBeTrue();
    expect(component.getPacingBenchmarkType()).toBe("PERSONAL_BEST");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "ghostPacingLeaderAvg" }),
    );
    fixture.detectChanges();
    expect(component.getPacingBenchmarkType()).toBe("HEAT_LEADER_AVG");
  });

  it("should generate lastLaps from driver lapTimes in reverse order with segments and best lap", () => {
    const driverWithLaps = {
      ...mockDrivers[0],
      bestLapTime: 7.481,
      lapTimes: [7.481, 8.123, 7.95],
      lapsWithDetails: [
        { time: 7.481, segments: [2.123, 5.358] },
        { time: 8.123, segments: [2.345, 5.778] },
        { time: 7.95, segments: [2.2, 5.75] },
      ],
    };
    mockParent.heatDrivers = [driverWithLaps];
    mockParent.heat.heatDrivers = [driverWithLaps];
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lastLaps", targetIndex: 0 }),
    );
    fixture.detectChanges();

    const laps = component.getLastLaps();
    expect(laps.length).toBe(3);
    // Most recent completed lap (lap 3) first
    expect(laps[0].lapNumber).toBe(3);
    expect(laps[0].lapTime).toBe("7.950");
    expect(laps[0].isBest).toBeFalse();
    expect(laps[0].segments).toEqual(["2.200", "5.750"]);

    // Lap 2
    expect(laps[1].lapNumber).toBe(2);
    expect(laps[1].lapTime).toBe("8.123");
    expect(laps[1].isBest).toBeFalse();

    // Lap 1 (best lap)
    expect(laps[2].lapNumber).toBe(1);
    expect(laps[2].lapTime).toBe("7.481");
    expect(laps[2].isBest).toBeTrue();
    expect(laps[2].segments).toEqual(["2.123", "5.358"]);
  });

  it("should slice visible last laps according to maxVisibleLaps", () => {
    component.maxVisibleLaps.set(2);
    spyOn(component, "getLastLaps").and.returnValue([
      { lapNumber: 3, lapTime: "7.950", isBest: false, segments: [] },
      { lapNumber: 2, lapTime: "8.123", isBest: false, segments: [] },
      { lapNumber: 1, lapTime: "7.481", isBest: true, segments: [] },
    ]);
    const visible = component.getVisibleLastLaps();
    expect(visible.length).toBe(2);
    expect(visible[0].lapNumber).toBe(3);
    expect(visible[1].lapNumber).toBe(2);
  });

  it("should render -- empty indicator when driver has no completed laps", () => {
    const driverNoLaps = {
      ...mockDrivers[0],
      lapTimes: [],
      lapsWithDetails: [],
    };
    mockParent.heatDrivers = [driverNoLaps];
    mockParent.heat.heatDrivers = [driverNoLaps];
    delete mockParent.getLastLaps;
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lastLaps", targetIndex: 0 }),
    );
    fixture.detectChanges();

    expect(component.getLastLaps().length).toBe(0);
    const emptyEl = fixture.nativeElement.querySelector(".lane-col-empty");
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.textContent.trim()).toBe("--");
  });

  it("should scale font size down when text is wider than container width", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "driver.nickname",
        valueFontSize: 36,
      }),
    );
    const cardEl = component.cardRef()?.nativeElement;
    if (cardEl) {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 160,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 60,
        configurable: true,
      });
    }
    spyOnProperty(component, "formattedValue", "get").and.returnValue(
      "Swamper Gene",
    );
    component.fitContent();

    if (cardEl) {
      const fontSizeVar = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      expect(fontSizeVar).toBeTruthy();
      const numSize = parseInt(fontSizeVar, 10);
      expect(numSize).toBeLessThan(36);
      expect(numSize).toBeGreaterThanOrEqual(10);
    }
  });

  it("should render value inside .lane-col-text with proper text alignment", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "lapCount",
        valueAlignment: "start",
      }),
    );
    fixture.detectChanges();

    const valueEl = fixture.nativeElement.querySelector(".lane-col-value");
    const spanEl = fixture.nativeElement.querySelector(".lane-col-text");
    expect(valueEl).toBeTruthy();
    expect(spanEl).toBeTruthy();
    expect(spanEl.textContent.trim()).toBe("25");
    expect(valueEl.style.justifyContent).toBe("flex-start");
  });

  it("should use track lane foreground color for header and value text when useLaneColors is true", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "lapCount",
        useLaneColors: true,
        targetIndex: 0,
      }),
    );
    fixture.detectChanges();

    expect(component.effectiveHeaderTextColor).toBe("#ffcc00");
    expect(component.effectiveValueTextColor).toBe("#ffcc00");

    const headerEl = fixture.nativeElement.querySelector(".lane-col-header");
    const valueEl = fixture.nativeElement.querySelector(".lane-col-value");
    expect(headerEl.style.color).toBe("rgb(255, 204, 0)");
    expect(valueEl.style.color).toBe("rgb(255, 204, 0)");
  });

  it("should use custom text colors when useLaneColors is false", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "lapCount",
        useLaneColors: false,
        headerTextColor: "#123456",
        valueTextColor: "#654321",
      }),
    );
    fixture.detectChanges();

    expect(component.effectiveHeaderTextColor).toBe("#123456");
    expect(component.effectiveValueTextColor).toBe("#654321");

    const headerEl = fixture.nativeElement.querySelector(".lane-col-header");
    const valueEl = fixture.nativeElement.querySelector(".lane-col-value");
    expect(headerEl.style.color).toBe("rgb(18, 52, 86)");
    expect(valueEl.style.color).toBe("rgb(101, 67, 33)");
  });

  it("should re-fit text value during ngAfterViewChecked when text or dimensions change", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "driver.nickname",
        valueFontSize: 36,
      }),
    );
    fixture.detectChanges();
    const cardEl = component.cardRef()?.nativeElement;
    if (cardEl) {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 150,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 60,
        configurable: true,
      });
    }
    spyOnProperty(component, "formattedValue", "get").and.returnValue(
      "A Very Long Driver Name That Needs Scaling",
    );
    component.ngAfterViewChecked();

    if (cardEl) {
      const fontSizeVar = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      expect(fontSizeVar).toBeTruthy();
      const numSize = parseInt(fontSizeVar, 10);
      expect(numSize).toBeLessThan(36);
      expect(numSize).toBeGreaterThanOrEqual(10);
    }
  });

  it("should check fitTextValue for total time strings", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "totalTime",
        valueFontSize: 36,
      }),
    );
    fixture.detectChanges();
    const cardEl = component.cardRef()?.nativeElement;
    if (cardEl) {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 185,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 67,
        configurable: true,
      });
    }

    const spy = spyOnProperty(
      component,
      "formattedValue",
      "get",
    ).and.returnValue("00:00:21");
    component.ngAfterViewChecked();
    const sizeShort = cardEl?.style.getPropertyValue(
      "--lane-col-value-font-size",
    );

    spy.and.returnValue("00:00:08.52");
    component.ngAfterViewChecked();
    const sizeLong = cardEl?.style.getPropertyValue(
      "--lane-col-value-font-size",
    );

    expect(parseInt(sizeShort!, 10)).toBeGreaterThanOrEqual(30);
    expect(parseInt(sizeLong!, 10)).toBeLessThan(parseInt(sizeShort!, 10));
    expect(parseInt(sizeLong!, 10)).toBeGreaterThanOrEqual(10);
  });

  describe("Insets and Anchor Drop Zones", () => {
    it("should render top, center, and bottom insets", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "top-left": "driver.nickname",
            "top-center": "driver.name",
            "top-right": "lapCount",
            "center-left": "lapCount",
            "center-right": "lapCount",
            "bottom-left": "lapCount",
            "bottom-center": "driver.nickname",
            "bottom-right": "lastLapTime",
          },
        }),
      );
      fixture.detectChanges();

      expect(component.hasTopInsets()).toBeTrue();
      expect(component.hasBottomInsets()).toBeTrue();
      expect(component.hasInset("top-left")).toBeTrue();
      expect(component.hasInset("center-left")).toBeTrue();
      expect(component.hasInset("bottom-right")).toBeTrue();

      const topRow = fixture.nativeElement.querySelector(
        ".lane-col-insets-top",
      );
      const bottomRow = fixture.nativeElement.querySelector(
        ".lane-col-insets-bottom",
      );
      const clCell = fixture.nativeElement.querySelector(".inset-cell.cl");
      const crCell = fixture.nativeElement.querySelector(".inset-cell.cr");

      expect(topRow).toBeTruthy();
      expect(bottomRow).toBeTruthy();
      expect(clCell).toBeTruthy();
      expect(crCell).toBeTruthy();
    });

    it("should render image insets when inset key is an image property", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "top-left": "driver.avatarUrl",
            "bottom-right": "flag",
          },
        }),
      );
      fixture.detectChanges();

      expect(component.getInsetImageUrl("top-left")).toBe(
        "http://localhost/avatar1.png",
      );
      expect(component.getInsetImageUrl("bottom-right")).toBe(
        "http://localhost/green-flag.png",
      );

      const imgs = fixture.nativeElement.querySelectorAll(
        ".lane-col-inset-image",
      );
      expect(imgs.length).toBe(2);
      expect(imgs[0].src).toContain("avatar1.png");
      expect(imgs[1].src).toContain("green-flag.png");

      mockParent.formatColumnValue = jasmine
        .createSpy("formatColumnValue")
        .and.returnValue("http://localhost/cooldown-flag.png");
      expect(component.getInsetImageUrl("bottom-right")).toBe(
        "http://localhost/cooldown-flag.png",
      );
      expect(mockParent.formatColumnValue).toHaveBeenCalledWith(
        component.targetDriver,
        undefined,
        "flag",
        "bottom-right",
      );
    });

    it("should apply custom inset typography and text color", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          useLaneColors: false,
          insetFontFamily: "Courier New",
          insetFontSize: 16,
          insetTextColor: "#abcdef",
          insets: {
            "top-left": "driver.nickname",
          },
        }),
      );
      fixture.detectChanges();

      expect(component.effectiveInsetTextColor).toBe("#abcdef");
      const topRow = fixture.nativeElement.querySelector(
        ".lane-col-insets-top",
      );
      expect(topRow.style.fontFamily).toContain("Courier New");
      expect(topRow.style.fontSize).toBe("16px");
      expect(topRow.style.color).toBe("rgb(171, 205, 239)");
    });

    it("should render 3x3 drop zones in UI Editor mode", () => {
      mockParent.isUIEditorMode = () => true;
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "top-left": "driver.nickname",
          },
        }),
      );
      fixture.detectChanges();

      expect(component.isUIEditorMode).toBeTrue();
      const grid = fixture.nativeElement.querySelector(".anchor-drop-grid");
      expect(grid).toBeTruthy();

      const dropZones = fixture.nativeElement.querySelectorAll(".drop-zone");
      expect(dropZones.length).toBe(9);

      // top-left has a value, so it should render a delete button
      const deleteBtn =
        fixture.nativeElement.querySelector(".delete-anchor-btn");
      expect(deleteBtn).toBeTruthy();
    });

    it("should handle dragover, dragenter, dragleave, and drop events on drop zones", () => {
      mockParent.isUIEditorMode = () => true;
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({ columnKey: "lastLapTime", insets: {} });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const mockEvent: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
        dataTransfer: {
          dropEffect: "",
          getData: jasmine.createSpy("getData").and.callFake((type: string) => {
            if (type === "application/json") {
              return JSON.stringify({
                type: "new-column",
                key: "driver.nickname",
              });
            }
            return "";
          }),
        },
        target: {
          classList: {
            add: jasmine.createSpy("add"),
            remove: jasmine.createSpy("remove"),
          },
        },
      };

      component.onAnchorDragOver(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe("copy");

      component.onAnchorDragEnter(mockEvent);
      expect(mockEvent.target.classList.add).toHaveBeenCalledWith("drag-over");

      component.onAnchorDragLeave(mockEvent);
      expect(mockEvent.target.classList.remove).toHaveBeenCalledWith(
        "drag-over",
      );

      component.onAnchorDrop(mockEvent, "top-left");
      expect(component.settings.insets?.["top-left"]).toBe("driver.nickname");
    });

    it("should accept text/plain lane-col:<key> on drop", () => {
      mockParent.isUIEditorMode = () => true;
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({ columnKey: "lastLapTime", insets: {} });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const mockEvent: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
        dataTransfer: {
          getData: jasmine.createSpy("getData").and.callFake((type: string) => {
            if (type === "text/plain") return "lane-col:bestLapTime";
            return "";
          }),
        },
        target: {
          classList: { remove: jasmine.createSpy("remove") },
        },
      };

      component.onAnchorDrop(mockEvent, "bottom-center");
      expect(component.settings.insets?.["bottom-center"]).toBe("bestLapTime");
    });

    it("should update primary columnKey when dropped on center-center", () => {
      mockParent.isUIEditorMode = () => true;
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({ columnKey: "lastLapTime", insets: {} });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const mockEvent: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
        dataTransfer: {
          getData: jasmine.createSpy("getData").and.callFake((type: string) => {
            if (type === "text/plain") return "lapCount";
            return "";
          }),
        },
        target: {
          classList: { remove: jasmine.createSpy("remove") },
        },
      };

      component.onAnchorDrop(mockEvent, "center-center");
      expect(component.settings.columnKey).toBe("lapCount");
    });

    it("should match dropEffect to move when effectAllowed is move", () => {
      mockParent.isUIEditorMode = () => true;
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      const mockEvent: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
        dataTransfer: {
          effectAllowed: "move",
          dropEffect: "none",
        },
      };

      component.onAnchorDragOver(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe("move");
    });

    it("should accept parent draggedWidgetType and clear it on drop", () => {
      mockParent.isUIEditorMode = () => false;
      mockParent.isLayoutCustomizing = true;
      mockParent.draggedWidgetType = "lane-col:participant.team.name";
      mockParent.layout = { widgets: [] };
      mockParent.layoutChanged = { emit: jasmine.createSpy("emit") };
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({ columnKey: "driver.nickname", insets: {} });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const mockEvent: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
        dataTransfer: {
          getData: jasmine.createSpy("getData").and.returnValue(""),
        },
        target: {
          classList: { remove: jasmine.createSpy("remove") },
        },
      };

      component.onAnchorDrop(mockEvent, "top-center");
      expect(component.settings.insets?.["top-center"]).toBe(
        "participant.team.name",
      );
      expect(mockParent.draggedWidgetType).toBeNull();
      expect(mockParent.layoutChanged.emit).toHaveBeenCalledWith(
        mockParent.layout,
      );
    });

    it("should delete anchor value and notify parent", () => {
      mockParent.isUIEditorMode = () => true;
      mockParent.columnsChanged = { emit: jasmine.createSpy("emit") };
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({
        columnKey: "lastLapTime",
        insets: { "top-left": "driver.nickname" },
      });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const mockClickEvent = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      } as any;

      component.deleteAnchor("top-left", mockClickEvent);
      expect(mockClickEvent.stopPropagation).toHaveBeenCalled();
      expect(component.settings.insets?.["top-left"]).toBeUndefined();
      expect(mockParent.columnsChanged.emit).toHaveBeenCalled();
    });

    it("should adjust fitText headroom when insets are present", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "driver.nickname",
          valueFontSize: 36,
          insetFontSize: 14,
          insets: {
            "top-left": "driver.name",
            "bottom-left": "lapCount",
            "center-left": "flag",
            "center-right": "qrCode",
          },
        }),
      );
      fixture.detectChanges();

      const cardEl = component.cardRef()?.nativeElement;
      if (cardEl) {
        Object.defineProperty(cardEl, "clientWidth", {
          value: 120,
          configurable: true,
        });
        Object.defineProperty(cardEl, "clientHeight", {
          value: 60,
          configurable: true,
        });
      }
      spyOnProperty(component, "formattedValue", "get").and.returnValue(
        "A Name",
      );
      component.fitContent();

      if (cardEl) {
        const fontSizeVar = cardEl.style.getPropertyValue(
          "--lane-col-value-font-size",
        );
        expect(fontSizeVar).toBeTruthy();
        const numSize = parseInt(fontSizeVar, 10);
        expect(numSize).toBeLessThan(36);
        expect(numSize).toBeGreaterThanOrEqual(10);
      }
    });

    it("should preserve large main value font size when only corner insets are present (top-right, bottom-right)", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          valueFontSize: 36,
          insetFontSize: 18,
          insets: {
            "top-right": "bestLapTime",
            "bottom-right": "lastLapTime",
          },
        }),
      );
      fixture.detectChanges();

      const cardEl = component.cardRef()?.nativeElement;
      if (cardEl) {
        Object.defineProperty(cardEl, "clientWidth", {
          value: 160,
          configurable: true,
        });
        Object.defineProperty(cardEl, "clientHeight", {
          value: 60,
          configurable: true,
        });
      }
      spyOnProperty(component, "formattedValue", "get").and.returnValue(
        "4.555",
      );
      component.fitContent();

      if (cardEl) {
        const fontSizeVar = cardEl.style.getPropertyValue(
          "--lane-col-value-font-size",
        );
        expect(fontSizeVar).toBeTruthy();
        const numSize = parseInt(fontSizeVar, 10);
        // Previously this shrank all the way down to 10px because availHeight was squashed!
        // Now it should remain large and legible (>= 25px).
        expect(numSize).toBeGreaterThanOrEqual(25);

        // Right padding should be applied to prevent text overlapping corner insets
        const rightPad = cardEl.style.getPropertyValue("--lane-col-pad-right");
        expect(rightPad).not.toBe("0px");
        expect(parseInt(rightPad, 10)).toBeGreaterThan(0);

        // Top, bottom, and left paddings should remain 0px
        expect(cardEl.style.getPropertyValue("--lane-col-pad-left")).toBe(
          "0px",
        );
        expect(cardEl.style.getPropertyValue("--lane-col-pad-top")).toBe("0px");
        expect(cardEl.style.getPropertyValue("--lane-col-pad-bottom")).toBe(
          "0px",
        );
      }
    });

    it("should apply top headroom and padding only when top-center inset is present", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          valueFontSize: 36,
          insetFontSize: 18,
          insets: {
            "top-center": "driver.nickname",
          },
        }),
      );
      fixture.detectChanges();

      const cardEl = component.cardRef()?.nativeElement;
      if (cardEl) {
        Object.defineProperty(cardEl, "clientWidth", {
          value: 160,
          configurable: true,
        });
        Object.defineProperty(cardEl, "clientHeight", {
          value: 60,
          configurable: true,
        });
      }
      spyOnProperty(component, "formattedValue", "get").and.returnValue(
        "4.555",
      );
      component.fitContent();

      if (cardEl) {
        const topPad = cardEl.style.getPropertyValue("--lane-col-pad-top");
        expect(topPad).not.toBe("0px");
        expect(parseInt(topPad, 10)).toBeGreaterThan(0);
      }
    });

    it("should calculate effectiveInsetFontSize proportionally with card height in auto scaleMode", () => {
      const widget = createWidget({
        columnKey: "lastLapTime",
        insetFontSize: 18,
      });
      widget.scaleMode = "auto";
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const cardEl = component.cardRef()?.nativeElement;
      if (cardEl) {
        // Height 60px -> 60 * 0.28 = ~17px
        Object.defineProperty(cardEl, "clientHeight", {
          value: 60,
          configurable: true,
        });
        expect(component.effectiveInsetFontSize).toBe(17);

        // Height 80px -> 80 * 0.28 = ~22px
        Object.defineProperty(cardEl, "clientHeight", {
          value: 80,
          configurable: true,
        });
        expect(component.effectiveInsetFontSize).toBe(22);

        // Small height clamped to minimum 14px
        Object.defineProperty(cardEl, "clientHeight", {
          value: 30,
          configurable: true,
        });
        expect(component.effectiveInsetFontSize).toBe(14);
      }

      // If scaleMode is manual/fixed, returns settings value or fallback
      widget.scaleMode = "fixed";
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();
      expect(component.effectiveInsetFontSize).toBe(18);
    });
  });

  describe("Interactive Column Actions", () => {
    it("should recognize lapCount column as clickable and trigger onCellClick on card click", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "lapCount", targetIndex: 0 }),
      );
      fixture.detectChanges();

      expect(component.isLapCountClickable).toBeTrue();
      expect(component.cardTooltip).toBe("RD_LAP_COLUMN_TOOLTIP");

      const mockEvent: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };

      component.onCardClick(mockEvent);
      expect(mockParent.onCellClick).toHaveBeenCalledWith(
        mockDrivers[0],
        jasmine.objectContaining({ propertyName: "lapCount" }),
        mockEvent,
      );

      // Active even when heat is unstarted (e.g. auto-starting countdown)
      mockParent.heat = { started: false, heatDrivers: mockDrivers };
      expect(component.isLapCountClickable).toBeTrue();

      // Inactive in UI editor mode
      mockParent.isUIEditorMode = () => true;
      expect(component.isLapCountClickable).toBeFalse();
    });

    it("should trigger onCellClick when clicking an inset configured with lapCount", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          targetIndex: 0,
          insets: { "top-right": "lapCount", "top-left": "driver.name" },
        }),
      );
      fixture.detectChanges();

      expect(component.isInsetLapCount("top-right")).toBeTrue();
      expect(component.isInsetLapCount("top-left")).toBeFalse();

      const mockEvent: any = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };

      component.onInsetClick("top-right", mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockParent.onCellClick).toHaveBeenCalledWith(
        mockDrivers[0],
        jasmine.objectContaining({ propertyName: "lapCount" }),
        mockEvent,
      );
    });

    it("should recognize totalTime and overallTotalTime as clickable and trigger onCellClick on card/inset click", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "totalTime",
          targetIndex: 0,
          insets: { "top-right": "overallTotalTime" },
        }),
      );
      fixture.detectChanges();

      expect(component.isLapCountClickable).toBeTrue();
      expect(component.isInsetLapCount("top-right")).toBeTrue();

      const mockEvent: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };

      component.onCardClick(mockEvent);
      expect(mockParent.onCellClick).toHaveBeenCalledWith(
        mockDrivers[0],
        jasmine.objectContaining({ propertyName: "totalTime" }),
        mockEvent,
      );

      component.onInsetClick("top-right", mockEvent);
      expect(mockParent.onCellClick).toHaveBeenCalledWith(
        mockDrivers[0],
        jasmine.objectContaining({ propertyName: "overallTotalTime" }),
        mockEvent,
      );
    });

    it("should activate teammate driver swap for name properties and call onTeammateChange", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "driver.nickname", targetIndex: 0 }),
      );
      fixture.detectChanges();

      expect(component.isTeamDriverSwapActive).toBeTrue();
      expect(component.cardTooltip).toBe("RD_TEAM_DRIVER_TOOLTIP");

      component.onTeammateChange("tm-1");
      expect(mockParent.onTeammateChange).toHaveBeenCalledWith(
        mockDrivers[0],
        "tm-1",
      );

      // Inactive for VIEWER role
      mockParent.authService.currentRole = Role.VIEWER;
      expect(component.isTeamDriverSwapActive).toBeFalse();

      mockParent.authService.currentRole = Role.DIRECTOR;

      // Active for participant.team.name column
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "participant.team.name", targetIndex: 0 }),
      );
      fixture.detectChanges();
      expect(component.isTeamDriverSwapActive).toBeTrue();

      // Inactive for non-name column
      mockParent.authService.currentRole = Role.DIRECTOR;
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "lastLapTime", targetIndex: 0 }),
      );
      fixture.detectChanges();
      expect(component.isTeamDriverSwapActive).toBeFalse();
    });

    it("should recognize physicalLapCount column and insets as clickable for add lap sections", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "physicalLapCount",
          targetIndex: 0,
          insets: { "bottom-right": "physicalLapCount" },
        }),
      );
      fixture.detectChanges();

      expect(component.isLapCountClickable).toBeTrue();
      expect(component.isInsetLapCount("bottom-right")).toBeTrue();

      const cardEvent: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      component.onCardClick(cardEvent);
      expect(mockParent.onCellClick).toHaveBeenCalledWith(
        mockDrivers[0],
        jasmine.objectContaining({ propertyName: "physicalLapCount" }),
        cardEvent,
      );

      const insetEvent: any = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      component.onInsetClick("bottom-right", insetEvent);
      expect(insetEvent.stopPropagation).toHaveBeenCalled();
      expect(mockParent.onCellClick).toHaveBeenCalledWith(
        mockDrivers[0],
        jasmine.objectContaining({ propertyName: "physicalLapCount" }),
        insetEvent,
      );
    });

    it("should toggle teammate select open and stop propagation when clicking team card outside select", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "driver.name", targetIndex: 0 }),
      );
      fixture.detectChanges();

      expect(component.isTeamDriverSwapActive).toBeTrue();
      const select = component.teammateSelect();
      expect(select).toBeTruthy();
      const toggleSpy = spyOn(select!, "toggleOpen");

      const cardBackground = document.createElement("div");
      const mockEvent: any = {
        target: cardBackground,
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      component.onCardClick(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(toggleSpy).toHaveBeenCalled();
    });

    it("should not double-toggle teammate select when click originated inside app-custom-select", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "driver.name", targetIndex: 0 }),
      );
      fixture.detectChanges();

      expect(component.isTeamDriverSwapActive).toBeTrue();
      const select = component.teammateSelect();
      expect(select).toBeTruthy();
      const toggleSpy = spyOn(select!, "toggleOpen");

      const selectEl = document.createElement("app-custom-select");
      const triggerEl = document.createElement("div");
      selectEl.appendChild(triggerEl);

      const mockEvent: any = {
        target: triggerEl,
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      component.onCardClick(mockEvent);
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
      expect(toggleSpy).not.toHaveBeenCalled();
    });

    it("should activate practice lane reset button in practice mode and trigger resetLane", () => {
      mockParent.race = { practice: true };
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "driver.name", targetIndex: 0 }),
      );
      fixture.detectChanges();

      expect(component.isPracticeLaneResetActive).toBeTrue();
      const resetBtn = fixture.nativeElement.querySelector(
        ".lane-col-reset-btn",
      );
      expect(resetBtn).toBeTruthy();

      const mockEvent: any = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      component.onResetLane(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockParent.resetLane).toHaveBeenCalledWith(0, mockEvent);

      // Also active on laneNumber
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "laneNumber", targetIndex: 1 }),
      );
      fixture.detectChanges();
      expect(component.isPracticeLaneResetActive).toBeTrue();

      // Inactive when not in practice mode
      mockParent.race = { practice: false };
      expect(component.isPracticeLaneResetActive).toBeFalse();

      // Inactive for VIEWER role
      mockParent.race = { practice: true };
      mockParent.authService.currentRole = Role.VIEWER;
      expect(component.isPracticeLaneResetActive).toBeFalse();
    });

    it("should delegate to parent helper methods when available", () => {
      mockParent.isLapCountColumnClickable = jasmine
        .createSpy("isLapCountColumnClickable")
        .and.returnValue(true);
      mockParent.isTeamDriverSwapActive = jasmine
        .createSpy("isTeamDriverSwapActive")
        .and.returnValue(true);

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "lapCount", targetIndex: 0 }),
      );
      fixture.detectChanges();

      expect(component.isLapCountClickable).toBeTrue();
      expect(mockParent.isLapCountColumnClickable).toHaveBeenCalled();

      fixture.componentRef.setInput(
        "widget",
        createWidget({ columnKey: "driver.nickname", targetIndex: 0 }),
      );
      fixture.detectChanges();

      expect(component.isTeamDriverSwapActive).toBeTrue();
      expect(mockParent.isTeamDriverSwapActive).toHaveBeenCalled();
    });
  });

  describe("getPacingDecimalPlaces", () => {
    it("should resolve decimal places from widget settings columnDecimals", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "ghostPacing",
          columnDecimals: { ghostPacing: 1 },
        }),
      );
      fixture.detectChanges();

      expect(component.getPacingDecimalPlaces()).toBe(1);
    });

    it("should resolve decimal places via prefix matching ghostPacing", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "ghostPacingPB",
          columnDecimals: { ghostPacing: 2 },
        }),
      );
      fixture.detectChanges();

      expect(component.getPacingDecimalPlaces()).toBe(2);
    });

    it("should fall back to widget timeDecimalPlaces", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "ghostPacing",
          timeDecimalPlaces: 0,
        }),
      );
      fixture.detectChanges();

      expect(component.getPacingDecimalPlaces()).toBe(0);
    });

    it("should clamp decimal places within [0, 3]", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "ghostPacing",
          columnDecimals: { ghostPacing: 5 },
        }),
      );
      fixture.detectChanges();

      expect(component.getPacingDecimalPlaces()).toBe(3);
    });

    it("should default to 3 when neither columnDecimals nor timeDecimalPlaces is specified", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "ghostPacing",
        }),
      );
      fixture.detectChanges();

      expect(component.getPacingDecimalPlaces()).toBe(3);
    });
  });

  describe("Title Bar Styling & Configuration", () => {
    it("should render title bar by default with lane-view column header styling", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
        }),
      );
      fixture.detectChanges();

      const headerEl = fixture.nativeElement.querySelector(".lane-col-header");
      expect(headerEl).toBeTruthy();
      expect(component.effectiveHeaderBackgroundColor).toBe(
        "rgba(68, 68, 68, 0.7)",
      );
      const cardEl = fixture.nativeElement.querySelector(
        ".raceday-lane-column-card",
      );
      expect(cardEl.classList.contains("has-header")).toBeTrue();
    });

    it("should completely remove the title bar when showHeader is false", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          showHeader: false,
        }),
      );
      fixture.detectChanges();

      const headerEl = fixture.nativeElement.querySelector(".lane-col-header");
      expect(headerEl).toBeNull();
      const cardEl = fixture.nativeElement.querySelector(
        ".raceday-lane-column-card",
      );
      expect(cardEl.classList.contains("has-header")).toBeFalse();
    });

    it("should display custom title text when customLabel is configured", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          customLabel: "Heat Lap Time",
        }),
      );
      fixture.detectChanges();

      expect(component.headerLabel).toBe("Heat Lap Time");
      const headerEl = fixture.nativeElement.querySelector(".lane-col-header");
      expect(headerEl.textContent.trim()).toBe("Heat Lap Time");
    });

    it("should apply custom font family and font size to the title bar", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          headerFontFamily: "Courier New",
          headerFontSize: 20,
        }),
      );
      fixture.detectChanges();

      const headerEl = fixture.nativeElement.querySelector(
        ".lane-col-header",
      ) as HTMLElement;
      expect(headerEl.style.fontFamily).toContain("Courier New");
      expect(headerEl.style.fontSize).toBe("20px");
    });

    it("should apply custom header text color and background color", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          headerTextColor: "#ff0055",
          headerBackgroundColor: "#112233",
        }),
      );
      fixture.detectChanges();

      expect(component.effectiveHeaderTextColor).toBe("#ff0055");
      expect(component.effectiveHeaderBackgroundColor).toBe("#112233");

      const headerEl = fixture.nativeElement.querySelector(
        ".lane-col-header",
      ) as HTMLElement;
      expect(headerEl.style.color).toBe("rgb(255, 0, 85)");
      expect(headerEl.style.background).toBe("rgb(17, 34, 51)");
    });

    it("should apply header text alignment for start, center, and end", () => {
      fixture.componentRef.setInput("parent", mockParent);

      // Start alignment
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          headerAlignment: "start",
        }),
      );
      fixture.detectChanges();
      let headerEl = fixture.nativeElement.querySelector(
        ".lane-col-header",
      ) as HTMLElement;
      expect(headerEl.style.justifyContent).toBe("flex-start");
      expect(headerEl.style.textAlign).toBe("left");

      // End alignment
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          headerAlignment: "end",
        }),
      );
      fixture.detectChanges();
      headerEl = fixture.nativeElement.querySelector(
        ".lane-col-header",
      ) as HTMLElement;
      expect(headerEl.style.justifyContent).toBe("flex-end");
      expect(headerEl.style.textAlign).toBe("right");

      // Center alignment
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          headerAlignment: "center",
        }),
      );
      fixture.detectChanges();
      headerEl = fixture.nativeElement.querySelector(
        ".lane-col-header",
      ) as HTMLElement;
      expect(headerEl.style.justifyContent).toBe("center");
      expect(headerEl.style.textAlign).toBe("center");
    });

    it("should style header correctly in horizontal layout orientation", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          layoutOrientation: "horizontal",
        }),
      );
      fixture.detectChanges();

      const cardEl = fixture.nativeElement.querySelector(
        ".raceday-lane-column-card",
      );
      expect(cardEl.classList.contains("orientation-horizontal")).toBeTrue();
      const headerEl = fixture.nativeElement.querySelector(".lane-col-header");
      expect(headerEl).toBeTruthy();
    });
  });
});
