import { ComponentFixture, TestBed } from "@angular/core/testing";
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
    expect(component.headerLabel).toBe("RD_COL_LAP");

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
});
