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
        return col?.labelKey === "RD_COL_LAP_TIME"
          ? "Last Lap Time"
          : col?.propertyName;
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
});
