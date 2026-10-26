import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Role } from "@app/models/role";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceState } from "@app/proto/antigravity";
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

  it("should sort by position when bindingMode is position", () => {
    mockParent.driverRankings = new Map([
      ["driver-1", 2],
      ["driver-2", 1],
    ]);
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        bindingMode: "position",
        targetIndex: 0,
      }),
    );
    fixture.detectChanges();
    // targetIndex: 0 in position mode resolves rank 1 (driver-2)
    expect(component.targetDriver?.objectId).toBe("driver-2");
  });

  describe("Grid data source and sorting decoupling", () => {
    beforeEach(() => {
      mockParent.participants = [
        {
          objectId: "driver-1", // in heat, lane 0
          rank: 5,
          seed: 2,
          driver: { name: "Driver One" },
        },
        {
          objectId: "driver-2", // in heat, lane 1
          rank: 2,
          seed: 4,
          driver: { name: "Driver Two" },
        },
        {
          objectId: "driver-3", // NOT in heat
          rank: 1,
          seed: 1,
          driver: { name: "Driver Three" },
        },
        {
          objectId: "driver-4", // NOT in heat
          rank: 3,
          seed: 3,
          driver: { name: "Driver Four" },
        },
      ];
      mockParent.getDriverOverallRanking = (hd: any) => {
        if (hd.objectId === "driver-1") return 5;
        if (hd.objectId === "driver-2") return 2;
        return 999;
      };
      mockParent.driverRankings = new Map([
        ["driver-1", 1],
        ["driver-2", 2],
      ]);
    });

    it("Heat Grid: should ONLY show heat drivers even when sorted by overallPosition", () => {
      fixture.componentRef.setInput("parent", mockParent);

      // targetIndex 0 on Heat Grid sorted by overallPosition:
      // Heat drivers are driver-1 (overall #5) and driver-2 (overall #2).
      // Sorted by overall rank: driver-2 (#2) comes before driver-1 (#5).
      // Driver-3 (#1 overall) is NOT in heat and MUST NOT be shown!
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-heat-1",
          gridType: "heat",
          bindingMode: "overallPosition",
          targetIndex: 0,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-2");

      // targetIndex 1 on Heat Grid sorted by overallPosition: driver-1 (#5)
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-heat-1",
          gridType: "heat",
          bindingMode: "overallPosition",
          targetIndex: 1,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-1");
    });

    it("Heat Grid: should sort heat drivers by seed when bindingMode is seed", () => {
      fixture.componentRef.setInput("parent", mockParent);
      // driver-1 has seed 2, driver-2 has seed 4.
      // Sorted by seed: driver-1 (seed 2) is targetIndex 0, driver-2 (seed 4) is targetIndex 1.
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-heat-1",
          gridType: "heat",
          bindingMode: "seed",
          targetIndex: 0,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-1");

      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-heat-1",
          gridType: "heat",
          bindingMode: "seed",
          targetIndex: 1,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-2");
    });

    it("Overall Grid: should show all participants sorted by overallPosition", () => {
      fixture.componentRef.setInput("parent", mockParent);
      // Overall participants ranks: driver-3 (rank 1), driver-2 (rank 2), driver-4 (rank 3), driver-1 (rank 5)
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-overall-1",
          gridType: "overall",
          bindingMode: "overallPosition",
          targetIndex: 0,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-3");

      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-overall-1",
          gridType: "overall",
          bindingMode: "overallPosition",
          targetIndex: 1,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-2");
    });

    it("Overall Grid: should sort participants with active heat participants first when bindingMode is position", () => {
      fixture.componentRef.setInput("parent", mockParent);
      // Heat drivers are driver-1 (heat pos 1) and driver-2 (heat pos 2).
      // Driver-3 and driver-4 are not in heat.
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-overall-1",
          gridType: "overall",
          bindingMode: "position",
          targetIndex: 0,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-1");

      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-overall-1",
          gridType: "overall",
          bindingMode: "position",
          targetIndex: 1,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-2");
    });

    it("Heat Grid: should resolve the heat driver and lane color by lane even for rankOverall, rankHeat, and rankGroup", () => {
      fixture.componentRef.setInput("parent", mockParent);

      // rankOverall column in Heat Grid Lane 0 -> must resolve driver-1 in Lane 0 with lane color #112233
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-heat-ranks",
          columnKey: "rankOverall",
          bindingMode: "lane",
          targetIndex: 0,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-1");
      expect(component.backgroundColor).toBe("#112233");

      // rankOverall column in Heat Grid Lane 1 -> must resolve driver-2 in Lane 1 with lane color #445566
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-heat-ranks",
          columnKey: "rankOverall",
          bindingMode: "lane",
          targetIndex: 1,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-2");
      expect(component.backgroundColor).toBe("#223344");

      // rankGroup column in Heat Grid Lane 0 -> must resolve driver-1 in Lane 0 with lane color #112233
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-heat-ranks",
          columnKey: "rankGroup",
          bindingMode: "lane",
          targetIndex: 0,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-1");
      expect(component.backgroundColor).toBe("#112233");

      // rankHeat column in Heat Grid Lane 1 -> must resolve driver-2 in Lane 1 with lane color #445566
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          gridId: "grid-heat-ranks",
          columnKey: "rankHeat",
          bindingMode: "lane",
          targetIndex: 1,
        }),
      );
      fixture.detectChanges();
      expect(component.targetDriver?.objectId).toBe("driver-2");
      expect(component.backgroundColor).toBe("#223344");
    });
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

  it("should default to black background and white text when useLaneColors is false without color overrides", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        useLaneColors: false,
        backgroundColor: "",
        textColor: "",
      }),
    );
    fixture.detectChanges();

    expect(component.backgroundColor).toBe("#000000");
    expect(component.foregroundColor).toBe("#ffffff");
  });

  it("should update colors when useLaneColors changes between true and false", () => {
    fixture.componentRef.setInput("parent", mockParent);
    const widget = createWidget({
      useLaneColors: true,
      targetIndex: 0,
      backgroundColor: "#000000",
      textColor: "#ffffff",
    });
    fixture.componentRef.setInput("widget", widget);
    fixture.detectChanges();

    // With useLaneColors: true, it uses lane 0 colors (#112233 / #ffcc00)
    expect(component.backgroundColor).toBe("#112233");
    expect(component.foregroundColor).toBe("#ffcc00");

    // Uncheck: useLaneColors becomes false
    const updatedWidget = {
      ...widget,
      customSettings: {
        ...widget.customSettings,
        useLaneColors: false,
      },
    };
    fixture.componentRef.setInput("widget", updatedWidget);
    fixture.detectChanges();

    expect(component.backgroundColor).toBe("#000000");
    expect(component.foregroundColor).toBe("#ffffff");

    // Re-check: useLaneColors becomes true
    const recheckedWidget = {
      ...widget,
      customSettings: {
        ...widget.customSettings,
        useLaneColors: true,
      },
    };
    fixture.componentRef.setInput("widget", recheckedWidget);
    fixture.detectChanges();

    expect(component.backgroundColor).toBe("#112233");
    expect(component.foregroundColor).toBe("#ffcc00");
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

  it("should not apply lane 0 color to empty row when bindingMode is position and useLaneColors is true", () => {
    fixture.componentRef.setInput("parent", mockParent);
    // targetIndex: 5 has no driver in heat.standings or heatDrivers
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        bindingMode: "position",
        targetIndex: 5,
        useLaneColors: true,
      }),
    );
    fixture.detectChanges();

    expect(component.backgroundColor).toBe("transparent");
    expect(component.foregroundColor).toBe("#ffffff");
  });

  it("should style overall grid rows like non-lane rows when race is over and useLaneColors is true", () => {
    mockParent.raceState = RaceState.RACE_OVER;
    mockParent.participants = [
      { objectId: "driver-2", rank: 1, driver: { name: "Driver Two" } },
      { objectId: "driver-1", rank: 2, driver: { name: "Driver One" } },
    ];
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        gridId: "overall-grid",
        gridType: "overall",
        bindingMode: "overallPosition",
        targetIndex: 0,
        useLaneColors: true,
      }),
    );
    fixture.detectChanges();

    // Even though driver-2 is in mockDrivers (laneIndex 1), when race is over with overall data source,
    // they are considered not in a lane and styled like non-lane rows.
    expect(component.backgroundColor).toBe("transparent");
    expect(component.foregroundColor).toBe("#ffffff");
  });

  it("should preserve lane colors for a grid using the heat data source when race is over", () => {
    mockParent.raceState = RaceState.RACE_OVER;
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        gridId: "heat-grid",
        gridType: "heat",
        bindingMode: "overallPosition",
        targetIndex: 0,
        useLaneColors: true,
      }),
    );
    fixture.detectChanges();

    // Heat grid rows represent heat drivers and must retain their lane colors
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

  it("should exclude on-pause auto segments in fallback formattedValue when parent.formatValue is absent", () => {
    const testDriver: any = {
      objectId: "driver-test",
      laneIndex: 0,
      lapCount: 10.35,
      totalLaps: 10.35,
      autoCalculatedLaps: 0.35,
      adjustedLapCount: 10.35,
      isFinished: false,
    };
    fixture.componentRef.setInput("parent", {
      heatDrivers: [testDriver],
      track: { lanes: [] },
      columns: [],
    } as any);

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lapCount", targetIndex: 0 }),
    );
    fixture.detectChanges();
    expect(component.formattedValue).toBe("10");

    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "totalLaps", targetIndex: 0 }),
    );
    fixture.detectChanges();
    expect(component.formattedValue).toBe("10");
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
    expect(laps.length).toBe(5);
    // Previous completed lap (lap 2) first
    expect(laps[0].lapNumber).toBe(2);
    expect(laps[0].lapTime).toBe("8.123");
    expect(laps[0].isBest).toBeFalse();
    expect(laps[0].segments).toEqual(["2.345", "5.778"]);

    // Lap 1 (best lap)
    expect(laps[1].lapNumber).toBe(1);
    expect(laps[1].lapTime).toBe("7.481");
    expect(laps[1].isBest).toBeTrue();
    expect(laps[1].segments).toEqual(["2.123", "5.358"]);

    // Unregistered lap slots padded with placeholder
    expect(laps[2].lapTime).toBe("--.---");
    expect(laps[3].lapTime).toBe("--.---");
    expect(laps[4].lapTime).toBe("--.---");
  });

  it("should generate custom number of lastLaps when lastLapsCount is configured", () => {
    const driverWithLaps = {
      ...mockDrivers[0],
      bestLapTime: 7.481,
      lapTimes: [7.481, 8.123, 7.95, 8.0, 7.8],
      lapsWithDetails: [],
    };
    mockParent.heatDrivers = [driverWithLaps];
    mockParent.heat.heatDrivers = [driverWithLaps];
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lastLaps", targetIndex: 0, lastLapsCount: 3 }),
    );
    fixture.detectChanges();

    const laps = component.getLastLaps();
    expect(laps.length).toBe(3);
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

  it("should render 5 placeholder laps when driver has no completed laps", () => {
    const driverNoLaps = {
      ...mockDrivers[0],
      lapTimes: [],
      lapsWithDetails: [],
    };
    mockParent.heatDrivers = [driverNoLaps];
    mockParent.heat.heatDrivers = [driverNoLaps];
    delete mockParent.getLastLaps;
    fixture.componentRef.setInput("parent", mockParent);
    const widgetNoLaps = createWidget({
      columnKey: "lastLaps",
      targetIndex: 0,
    });
    widgetNoLaps.width = 200;
    widgetNoLaps.height = 500;
    fixture.componentRef.setInput("widget", widgetNoLaps);
    fixture.detectChanges();

    const laps = component.getLastLaps();
    expect(laps.length).toBe(5);
    expect(laps.every((l) => l.lapTime === "--.---")).toBeTrue();

    const lapItemEls = fixture.nativeElement.querySelectorAll(".last-lap-item");
    expect(lapItemEls.length).toBe(5);
    lapItemEls.forEach((el: Element) => {
      expect(el.textContent.trim()).toBe("--.---");
    });
  });

  it("should render 5 placeholder laps when driver has only 1 lap (displayed as current lap)", () => {
    const driverOneLap = {
      ...mockDrivers[0],
      lapTimes: [7.863],
      lapsWithDetails: [{ segments: [2.5, 5.363] }],
    };
    mockParent.heatDrivers = [driverOneLap];
    mockParent.heat.heatDrivers = [driverOneLap];
    delete mockParent.getLastLaps;
    fixture.componentRef.setInput("parent", mockParent);
    const widgetOneLap = createWidget({
      columnKey: "lastLaps",
      targetIndex: 0,
    });
    widgetOneLap.width = 200;
    widgetOneLap.height = 500;
    fixture.componentRef.setInput("widget", widgetOneLap);
    fixture.detectChanges();

    const laps = component.getLastLaps();
    expect(laps.length).toBe(5);
    expect(laps.every((l) => l.lapTime === "--.---")).toBeTrue();

    const lapItemEls = fixture.nativeElement.querySelectorAll(".last-lap-item");
    expect(lapItemEls.length).toBe(5);
    lapItemEls.forEach((el: Element) => {
      expect(el.textContent.trim()).toBe("--.---");
    });
  });

  it("should render -- fallback when getLastLaps returns empty array", () => {
    spyOn(component, "getLastLaps").and.returnValue([]);
    fixture.componentRef.setInput(
      "widget",
      createWidget({ columnKey: "lastLaps", targetIndex: 0 }),
    );
    fixture.detectChanges();

    const emptyEl = fixture.nativeElement.querySelector(".lane-col-empty");
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.textContent.trim()).toBe("--");
  });

  it("should determine isVerticalLapsFlow correctly based on gridDirection and aspect ratio", () => {
    // 1. When gridDirection is horizontal (lanes side-by-side, cells are tall rows)
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "lastLaps",
        gridDirection: "horizontal",
      }),
    );
    fixture.detectChanges();
    expect(component.isVerticalLapsFlow).toBeTrue();

    // 2. When gridDirection is vertical (lanes are rows, cells are wide columns)
    fixture.componentRef.setInput(
      "widget",
      createWidget({
        columnKey: "lastLaps",
        gridDirection: "vertical",
      }),
    );
    fixture.detectChanges();
    expect(component.isVerticalLapsFlow).toBeFalse();

    // 3. Standalone widget: based on aspect ratio
    const tallWidget = createWidget({ columnKey: "lastLaps" });
    tallWidget.width = 200;
    tallWidget.height = 400;
    delete tallWidget.customSettings?.["gridDirection"];
    fixture.componentRef.setInput("widget", tallWidget);
    fixture.detectChanges();
    expect(component.isVerticalLapsFlow).toBeTrue();

    const wideWidget = createWidget({ columnKey: "lastLaps" });
    wideWidget.width = 400;
    wideWidget.height = 100;
    delete wideWidget.customSettings?.["gridDirection"];
    fixture.componentRef.setInput("widget", wideWidget);
    fixture.detectChanges();
    expect(component.isVerticalLapsFlow).toBeFalse();
  });

  it("should render lastLaps with lap times and stacked segments", () => {
    const driverWithLaps = {
      ...mockDrivers[0],
      bestLapTime: 2.0,
      lapTimes: [2.0, 2.2, 2.1],
      lapsWithDetails: [
        { time: 2.0, segments: [0.4, 0.6, 0.4, 0.6] },
        { time: 2.2, segments: [0.44, 0.66, 0.44, 0.66] },
        { time: 2.1, segments: [0.42, 0.63, 0.42, 0.63] },
      ],
    };
    mockParent.heatDrivers = [driverWithLaps];
    mockParent.heat.heatDrivers = [driverWithLaps];
    fixture.componentRef.setInput("parent", mockParent);
    const widget = createWidget({
      columnKey: "lastLaps",
      targetIndex: 0,
      gridDirection: "horizontal",
    });
    widget.width = 200;
    widget.height = 500;
    fixture.componentRef.setInput("widget", widget);
    fixture.detectChanges();

    const lapItems = fixture.nativeElement.querySelectorAll(".last-lap-item");
    expect(lapItems.length).toBe(5);

    const firstLapTime = lapItems[0].querySelector(".last-lap-time");
    expect(firstLapTime).toBeTruthy();
    expect(firstLapTime.textContent.trim()).toBe("2.200");

    const firstSegments = lapItems[0].querySelectorAll(".last-lap-seg");
    expect(firstSegments.length).toBe(4);
    expect(firstSegments[0].textContent.trim()).toBe("0.440");
    expect(firstSegments[1].textContent.trim()).toBe("0.660");

    // Second lap is lap 1
    const secondLapTime = lapItems[1].querySelector(".last-lap-time");
    expect(secondLapTime?.textContent.trim()).toBe("2.000");

    // Unregistered laps are padded with placeholder dashes
    expect(
      lapItems[2].querySelector(".last-lap-time")?.textContent.trim(),
    ).toBe("--.---");
    expect(
      lapItems[3].querySelector(".last-lap-time")?.textContent.trim(),
    ).toBe("--.---");
    expect(
      lapItems[4].querySelector(".last-lap-time")?.textContent.trim(),
    ).toBe("--.---");
  });

  it("should scale header text down for header widgets when width is constrained", () => {
    fixture.componentRef.setInput("parent", mockParent);
    const hw = createWidget({
      columnKey: "lastLaps",
      isHeaderWidget: true,
      showHeader: true,
      headerPlacement: "left",
      headerFontSize: 24,
    });
    hw.width = 60;
    hw.height = 55;
    fixture.componentRef.setInput("widget", hw);
    fixture.detectChanges();

    component.fitContent();
    const headerEl = fixture.nativeElement.querySelector(".lane-col-header");
    expect(headerEl).toBeTruthy();
    const computedFs = parseFloat(headerEl.style.fontSize);
    expect(computedFs).toBeLessThanOrEqual(24);
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

  it("should skip font fitting when text, dimensions, and insets are unchanged", () => {
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
      "Unchanged Text",
    );
    const fitSpy = spyOn<any>(component, "fitTextValue").and.callThrough();

    // First call: fits text
    component.fitContent();
    expect(fitSpy).toHaveBeenCalledTimes(1);

    // Second call without any dimension or text change: skips fitTextValue
    component.fitContent();
    expect(fitSpy).toHaveBeenCalledTimes(1);

    // Force call: executes fitTextValue
    component.fitContent(true);
    expect(fitSpy).toHaveBeenCalledTimes(2);
  });

  it("should apply exact custom valueFontSize without height clamping when scaleMode is custom", () => {
    fixture.componentRef.setInput("parent", mockParent);
    const widget = createWidget({
      columnKey: "driver.nickname",
      valueFontSize: 64,
    });
    widget.scaleMode = "";
    fixture.componentRef.setInput("widget", widget);
    const cardEl = component.cardRef()?.nativeElement;
    if (cardEl) {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 160,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 30,
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
      expect(fontSizeVar).toBe("64px");
    }
  });

  it("should re-fit and update font size when valueFontSize changes in custom scaling mode", () => {
    fixture.componentRef.setInput("parent", mockParent);
    const widget = createWidget({
      columnKey: "driver.nickname",
      valueFontSize: 40,
    });
    widget.scaleMode = "";
    fixture.componentRef.setInput("widget", widget);
    const cardEl = component.cardRef()?.nativeElement;
    if (cardEl) {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 160,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 30,
        configurable: true,
      });
    }
    spyOnProperty(component, "formattedValue", "get").and.returnValue(
      "Driver Name",
    );
    component.fitContent();

    expect(cardEl?.style.getPropertyValue("--lane-col-value-font-size")).toBe(
      "40px",
    );

    // Update valueFontSize without dimension change
    const updatedWidget = createWidget({
      columnKey: "driver.nickname",
      valueFontSize: 55,
    });
    updatedWidget.scaleMode = "";
    fixture.componentRef.setInput("widget", updatedWidget);
    component.fitContent();

    expect(cardEl?.style.getPropertyValue("--lane-col-value-font-size")).toBe(
      "55px",
    );
  });

  it("should re-fit when scaleMode switches between auto and custom", () => {
    fixture.componentRef.setInput("parent", mockParent);
    const widget = createWidget({
      columnKey: "driver.nickname",
      valueFontSize: 50,
    });
    widget.scaleMode = "auto";
    fixture.componentRef.setInput("widget", widget);
    const cardEl = component.cardRef()?.nativeElement;
    if (cardEl) {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 160,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 30,
        configurable: true,
      });
    }
    spyOnProperty(component, "formattedValue", "get").and.returnValue(
      "Driver Name",
    );
    component.fitContent();

    const autoSizeVar = cardEl?.style.getPropertyValue(
      "--lane-col-value-font-size",
    );
    const autoNum = parseInt(autoSizeVar || "0", 10);
    expect(autoNum).toBeLessThanOrEqual(30);

    // Switch to custom scaling mode ("")
    const updatedWidget = createWidget({
      columnKey: "driver.nickname",
      valueFontSize: 50,
    });
    updatedWidget.scaleMode = "";
    fixture.componentRef.setInput("widget", updatedWidget);
    component.fitContent();

    expect(cardEl?.style.getPropertyValue("--lane-col-value-font-size")).toBe(
      "50px",
    );
  });

  it("should auto-scale font size back up when switching from custom mode with small font size back to auto scaleMode", () => {
    fixture.componentRef.setInput("parent", mockParent);
    const widget = createWidget({
      columnKey: "driver.nickname",
      valueFontSize: 14,
    });
    widget.scaleMode = "";
    fixture.componentRef.setInput("widget", widget);
    const cardEl = component.cardRef()?.nativeElement;
    if (cardEl) {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 100,
        configurable: true,
      });
    }
    spyOnProperty(component, "formattedValue", "get").and.returnValue(
      "Driver Name",
    );
    component.fitContent();

    expect(cardEl?.style.getPropertyValue("--lane-col-value-font-size")).toBe(
      "14px",
    );

    // Switch back to auto-scale mode
    const autoWidget = createWidget({
      columnKey: "driver.nickname",
      valueFontSize: 14,
    });
    autoWidget.scaleMode = "auto";
    fixture.componentRef.setInput("widget", autoWidget);
    component.fitContent();

    const sizeVar = cardEl?.style.getPropertyValue(
      "--lane-col-value-font-size",
    );
    const autoNum = parseInt(sizeVar || "0", 10);
    expect(autoNum).toBeGreaterThan(14);
    expect(autoNum).toBeLessThanOrEqual(36);
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

    it("should allow inset to span across multiple inset slots without empty cell constraints", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "bottom-right": "lastLapTime",
          },
        }),
      );
      fixture.detectChanges();

      const bottomRow = fixture.nativeElement.querySelector(
        ".lane-col-insets-bottom",
      );
      expect(bottomRow).toBeTruthy();

      const brCell = fixture.nativeElement.querySelector(".inset-cell.br");
      const blCell = fixture.nativeElement.querySelector(".inset-cell.bl");
      const bcCell = fixture.nativeElement.querySelector(".inset-cell.bc");

      expect(brCell).toBeTruthy();
      expect(blCell).toBeNull();
      expect(bcCell).toBeNull();
      expect(brCell.textContent).toContain("7.863");
    });

    it("should allow top inset to span across row when only top-right is present", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "top-right": "bestLapTime",
          },
        }),
      );
      fixture.detectChanges();

      const topRow = fixture.nativeElement.querySelector(
        ".lane-col-insets-top",
      );
      expect(topRow).toBeTruthy();

      const trCell = fixture.nativeElement.querySelector(".inset-cell.tr");
      const tlCell = fixture.nativeElement.querySelector(".inset-cell.tl");
      const tcCell = fixture.nativeElement.querySelector(".inset-cell.tc");

      expect(trCell).toBeTruthy();
      expect(tlCell).toBeNull();
      expect(tcCell).toBeNull();
      expect(trCell.textContent).toContain("7.481");
    });

    it("should assign directional default valueAlignment for inset custom widgets based on placement anchor", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "bottom-left": "custom:dopamine:advanced-laps",
            "bottom-center": "custom:dopamine:advanced-laps",
            "bottom-right": "custom:dopamine:advanced-laps",
          },
        }),
      );
      fixture.detectChanges();

      const leftInputs = component.getCustomWidgetInputsForInset("bottom-left");
      const centerInputs =
        component.getCustomWidgetInputsForInset("bottom-center");
      const rightInputs =
        component.getCustomWidgetInputsForInset("bottom-right");

      expect(leftInputs?.widget.customSettings?.["valueAlignment"]).toBe(
        "left",
      );
      expect(centerInputs?.widget.customSettings?.["valueAlignment"]).toBe(
        "center",
      );
      expect(rightInputs?.widget.customSettings?.["valueAlignment"]).toBe(
        "right",
      );
    });

    it("should resolve inset alignments and apply them to inset-cell element", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "top-left": "driver.nickname",
            "bottom-right": "bestLapTime",
          },
          insetsConfig: {
            "top-left": {
              horizontalAlignment: "center",
              verticalAlignment: "bottom",
            },
          },
        }),
      );
      fixture.detectChanges();

      expect(component.getInsetHorizontalAlignment("top-left")).toBe("center");
      expect(component.getInsetVerticalAlignment("top-left")).toBe("bottom");
      expect(component.getInsetJustifyContent("top-left")).toBe("center");
      expect(component.getInsetAlignItems("top-left")).toBe("flex-end");
      expect(component.getInsetTextAlign("top-left")).toBe("center");
      expect(component.getInsetObjectPosition("top-left")).toBe(
        "center bottom",
      );

      // Default fallback for bottom-right: right, bottom
      expect(component.getInsetHorizontalAlignment("bottom-right")).toBe(
        "right",
      );
      expect(component.getInsetVerticalAlignment("bottom-right")).toBe(
        "bottom",
      );
      expect(component.getInsetJustifyContent("bottom-right")).toBe("flex-end");
      expect(component.getInsetAlignItems("bottom-right")).toBe("flex-end");
      expect(component.getInsetTextAlign("bottom-right")).toBe("right");
      expect(component.getInsetObjectPosition("bottom-right")).toBe(
        "right bottom",
      );

      const tlCell: HTMLElement =
        fixture.nativeElement.querySelector(".inset-cell.tl");
      expect(tlCell).toBeTruthy();
      expect(tlCell.style.justifyContent).toBe("center");
      expect(tlCell.style.alignItems).toBe("flex-end");
      expect(tlCell.style.textAlign).toBe("center");

      const brCell: HTMLElement =
        fixture.nativeElement.querySelector(".inset-cell.br");
      expect(brCell).toBeTruthy();
      expect(brCell.style.justifyContent).toBe("flex-end");
      expect(brCell.style.alignItems).toBe("flex-end");
      expect(brCell.style.textAlign).toBe("right");
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

      const tlCell = fixture.nativeElement.querySelector(".inset-cell.tl");
      const brCell = fixture.nativeElement.querySelector(".inset-cell.br");
      expect(tlCell.classList.contains("has-image")).toBeTrue();
      expect(brCell.classList.contains("has-image")).toBeTrue();

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

    it("should render default avatar for image insets when driver has no avatar specified", () => {
      const driverWithNoAvatar = new DriverHeatData(
        "hd-no-avatar",
        {
          objectId: "hd-no-avatar",
          laneIndex: 0,
          driver: {
            id: "d-no-avatar",
            name: "No Avatar Driver",
            avatarUrl: "",
          },
        } as any,
        0,
      );
      fixture.componentRef.setInput("parent", mockParent);
      spyOnProperty(component, "targetDriver", "get").and.returnValue(
        driverWithNoAvatar,
      );
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "top-left": "driver.avatarUrl",
          },
        }),
      );
      fixture.detectChanges();

      expect(component.getInsetImageUrl("top-left")).toBe(
        "http://localhost/assets/images/default_avatar.svg",
      );
      const svg = fixture.nativeElement.querySelector(
        "svg.lane-col-inset-image.placeholder-avatar",
      );
      expect(svg).toBeTruthy();
      expect(["#ffcc00", "rgb(255, 204, 0)"]).toContain(svg.style.color);
    });

    it("should not render inset image tag when driver is empty", () => {
      const emptyDriver = new DriverHeatData(
        "empty",
        {
          objectId: "empty",
          isEmpty: true,
          driver: { id: "EMPTY_DRIVER", name: "rd_empty_lane", avatarUrl: "" },
        } as any,
        0,
      );
      fixture.componentRef.setInput("parent", mockParent);
      spyOnProperty(component, "targetDriver", "get").and.returnValue(
        emptyDriver,
      );
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "top-left": "driver.avatarUrl",
          },
        }),
      );
      fixture.detectChanges();

      expect(component.getInsetImageUrl("top-left")).toBe("");
      const img = fixture.nativeElement.querySelector(".lane-col-inset-image");
      expect(img).toBeFalsy();
    });

    it("should fallback to default avatar on image error in onImageError", () => {
      const mockImg = document.createElement("img");
      mockImg.src = "http://localhost/broken-avatar.png";
      const event = { target: mockImg } as unknown as Event;

      component.onImageError(event, "top-left");
      expect(mockImg.src).toContain("assets/images/default_avatar.svg");
      expect(component.imageErrors.has("top-left")).toBeTrue();
    });

    it("should render placeholder avatar in lane text color when inset image errors", () => {
      const driverWithAvatar = new DriverHeatData(
        "d1",
        {
          objectId: "d1",
          driver: {
            id: "d-1",
            name: "Driver 1",
            avatarUrl: "/avatars/broken.png",
          },
        } as any,
        0,
      );
      fixture.componentRef.setInput("parent", mockParent);
      spyOnProperty(component, "targetDriver", "get").and.returnValue(
        driverWithAvatar,
      );
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          insets: {
            "top-left": "driver.avatarUrl",
          },
        }),
      );
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector(
        "img.lane-col-inset-image",
      );
      expect(img).toBeTruthy();

      component.onImageError({ target: img } as any, "top-left");
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector(
        "svg.lane-col-inset-image.placeholder-avatar",
      );
      expect(svg).toBeTruthy();
      expect(["#ffcc00", "rgb(255, 204, 0)"]).toContain(svg.style.color);
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

    it("should accept custom widget on drop", () => {
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
            if (type === "application/json") {
              return JSON.stringify({ key: "custom:dopamine:advanced-laps" });
            }
            return "";
          }),
        },
        target: {
          classList: { remove: jasmine.createSpy("remove") },
        },
      };

      component.onAnchorDrop(mockEvent, "top-left");
      expect(component.settings.insets?.["top-left"]).toBe(
        "custom:dopamine:advanced-laps",
      );
    });

    it("should build synthetic inputs with scaled font size and driver binding for custom widgets", () => {
      const widget = createWidget({
        columnKey: "lastLapTime",
        targetIndex: 2,
        bindingMode: "lane",
        insets: { "top-left": "custom:dopamine:advanced-laps" },
        insetFontSize: 14,
      });
      fixture.componentRef.setInput("widget", widget);
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      expect(
        component.isCustomWidget("custom:dopamine:advanced-laps"),
      ).toBeTrue();
      expect(component.isCustomWidget("lastLapTime")).toBeFalse();

      const inputs = component.getCustomWidgetInputsForInset("top-left");
      expect(inputs).toBeDefined();
      expect(inputs.widget.widgetType).toBe("custom:dopamine:advanced-laps");
      expect(inputs.widget.customSettings?.["showHeader"]).toBeFalse();
      expect(inputs.widget.customSettings?.["valueFontSize"]).toBe(14);
      expect(inputs.widget.customSettings?.["gridLane"]).toBe(2);
      expect(inputs.widget.customSettings?.["targetIndex"]).toBe(3);
      expect(inputs.widget.customSettings?.["bindingMode"]).toBe("lane");
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

    it("should clean up insetsConfig and notify anchorSelected when deleted anchor was selected", () => {
      mockParent.isUIEditorMode = () => true;
      mockParent.columnsChanged = { emit: jasmine.createSpy("emit") };
      mockParent.selectAnchor = jasmine.createSpy("selectAnchor");
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({
        columnKey: "lastLapTime",
        insets: { "top-left": "driver.nickname" },
        insetsConfig: {
          "top-left": { timeDecimalPlaces: 2, fontSize: 16 },
        },
      });
      fixture.componentRef.setInput("widget", widget);
      fixture.componentRef.setInput("selectedAnchor", "top-left");
      fixture.detectChanges();

      const anchorSelectedSpy = spyOn(component.anchorSelected, "emit");
      const mockClickEvent = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      } as any;

      component.deleteAnchor("top-left", mockClickEvent);
      expect(component.settings.insets?.["top-left"]).toBeUndefined();
      expect(component.settings.insetsConfig?.["top-left"]).toBeUndefined();
      expect(mockParent.selectAnchor).toHaveBeenCalledWith(widget.id, null);
      expect(anchorSelectedSpy).toHaveBeenCalledWith({
        widgetId: widget.id,
        anchor: null,
      });
    });

    it("should handle onAnchorClick and onCenterZoneClick in UI editor mode", () => {
      mockParent.isUIEditorMode = () => true;
      mockParent.selectAnchor = jasmine.createSpy("selectAnchor");
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({
        columnKey: "lastLapTime",
        insets: { "top-right": "bestLapTime" },
      });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const anchorSelectedSpy = spyOn(component.anchorSelected, "emit");
      const mockEvent = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      } as any;

      component.onAnchorClick("top-right", mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockParent.selectAnchor).toHaveBeenCalledWith(
        widget.id,
        "top-right",
      );
      expect(anchorSelectedSpy).toHaveBeenCalledWith({
        widgetId: widget.id,
        anchor: "top-right",
      });

      component.onCenterZoneClick(mockEvent);
      expect(mockParent.selectAnchor).toHaveBeenCalledWith(widget.id, null);
      expect(anchorSelectedSpy).toHaveBeenCalledWith({
        widgetId: widget.id,
        anchor: null,
      });
    });

    it("should resolve per-anchor typography settings from insetsConfig", () => {
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({
        columnKey: "lastLapTime",
        insetFontFamily: "DefaultFont",
        insetFontSize: 18,
        insetTextColor: "#ffffff",
        useLaneColors: false,
        insets: { "top-left": "bestLapTime" },
        insetsConfig: {
          "top-left": {
            fontFamily: "CustomFont",
            fontSize: 22,
            textColor: "#38bdf8",
          },
        },
      });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      expect(component.getInsetFontFamily("top-left")).toBe("CustomFont");
      expect(component.getEffectiveInsetFontSize("top-left")).toBe(22);
      expect(component.getEffectiveInsetTextColor("top-left")).toBe("#38bdf8");

      // Fallback for anchor without custom insetsConfig
      expect(component.getInsetFontFamily("bottom-right")).toBe("DefaultFont");
      expect(component.getEffectiveInsetFontSize("bottom-right")).toBe(18);
      expect(component.getEffectiveInsetTextColor("bottom-right")).toBe(
        "#ffffff",
      );
    });

    it("should apply insetsConfig options to insetSettings in getInsetValue", () => {
      let capturedSettings: any;
      mockParent.formatValue = (
        _key: string,
        _val: any,
        _hd: any,
        _colDef: any,
        _anchor: string,
        settings: any,
      ) => {
        capturedSettings = settings;
        return "formatted-inset";
      };
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({
        columnKey: "driver.nickname",
        timeDecimalPlaces: 3,
        lapDecimalPlaces: 1,
        insets: { "top-right": "totalTime" },
        insetsConfig: {
          "top-right": {
            timeDisplayFormat: "seconds",
            timeSubsecondMode: "always",
            timeSubsecondThreshold: 5,
            timeSubsecondDecimals: 3,
            timeDecimalPlaces: 2,
            lapDecimalPlaces: 0,
            decimalPlaces: 1,
          },
        },
      });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const val = component.getInsetValue("top-right");
      expect(val).toBe("formatted-inset");
      expect(capturedSettings).toBeDefined();
      expect(capturedSettings.timeDisplayFormat).toBe("seconds");
      expect(capturedSettings.timeSubsecondMode).toBe("always");
      expect(capturedSettings.timeSubsecondThreshold).toBe(5);
      expect(capturedSettings.timeSubsecondDecimals).toBe(3);
      expect(capturedSettings.timeDecimalPlaces).toBe(2);
      expect(capturedSettings.lapDecimalPlaces).toBe(0);
      expect(capturedSettings.columnDecimals?.["totalTime"]).toBe(1);
    });

    it("should not inherit center-center widget settings in getInsetValue when inset has no custom config", () => {
      let capturedSettings: any;
      mockParent.formatValue = (
        _key: string,
        _val: any,
        _hd: any,
        _colDef: any,
        _anchor: string,
        settings: any,
      ) => {
        capturedSettings = settings;
        return "formatted-inset";
      };
      fixture.componentRef.setInput("parent", mockParent);
      const widget = createWidget({
        columnKey: "driver.nickname",
        timeDisplayFormat: "seconds",
        timeSubsecondMode: "always",
        timeSubsecondThreshold: 99,
        timeSubsecondDecimals: 1,
        timeDecimalPlaces: 1,
        lapDecimalPlaces: 0,
        columnDecimals: { totalTime: 0 },
        insets: { "top-left": "totalTime" },
        insetsConfig: {},
      });
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      const val = component.getInsetValue("top-left");
      expect(val).toBe("formatted-inset");
      expect(capturedSettings).toBeDefined();
      expect(capturedSettings.timeDisplayFormat).toBe("dynamic");
      expect(capturedSettings.timeSubsecondMode).toBe("never");
      expect(capturedSettings.timeSubsecondThreshold).toBe(10);
      expect(capturedSettings.timeSubsecondDecimals).toBe(2);
      expect(capturedSettings.timeDecimalPlaces).toBe(3);
      expect(capturedSettings.lapDecimalPlaces).toBe(2);
      expect(capturedSettings.columnDecimals).toEqual({});
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

        // Paddings should remain 0px so configuring insets does not push center text or shrink its font
        expect(cardEl.style.getPropertyValue("--lane-col-pad-right")).toBe(
          "0px",
        );
        expect(cardEl.style.getPropertyValue("--lane-col-pad-left")).toBe(
          "0px",
        );
        expect(cardEl.style.getPropertyValue("--lane-col-pad-top")).toBe("0px");
        expect(cardEl.style.getPropertyValue("--lane-col-pad-bottom")).toBe(
          "0px",
        );
      }
    });

    it("should preserve center/center styling and paddings when top-center inset is present", () => {
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
        expect(cardEl.style.getPropertyValue("--lane-col-pad-top")).toBe("0px");
        expect(cardEl.style.getPropertyValue("--lane-col-pad-bottom")).toBe(
          "0px",
        );
        expect(cardEl.style.getPropertyValue("--lane-col-pad-left")).toBe(
          "0px",
        );
        expect(cardEl.style.getPropertyValue("--lane-col-pad-right")).toBe(
          "0px",
        );
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

    it("should format team name for driver.name and driver.nickname on overall and seed grids when driver is a team", () => {
      const participant = {
        objectId: "p1",
        seed: 1,
        team: { name: "Ferrari Team" },
        driver: { name: "Charles", nickname: "Lord Perceval" },
      };
      const teamHd = {
        objectId: "p1",
        participant,
        driver: { name: "Charles", nickname: "Lord Perceval" },
        actualDriver: { name: "Charles", nickname: "Lord Perceval" },
      } as any;
      const parentWithFormat = {
        ...mockParent,
        participants: [participant],
        sortedHeatDrivers: [teamHd],
        heatDrivers: [teamHd],
        formatValue: undefined,
      };
      fixture.componentRef.setInput("parent", parentWithFormat);

      // On overall grid: should show team name
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "driver.name",
          targetIndex: 0,
          gridType: "overall",
        }),
      );
      fixture.detectChanges();
      expect(component.formattedValue).toBe("Ferrari Team");

      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "driver.nickname",
          targetIndex: 0,
          bindingMode: "seed",
        }),
      );
      fixture.detectChanges();
      expect(component.formattedValue).toBe("Ferrari Team");

      // On heat grid: should show actual driver name or nickname
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "driver.name",
          targetIndex: 0,
          gridType: "heat",
        }),
      );
      fixture.detectChanges();
      expect(component.formattedValue).toBe("Charles");

      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "driver.nickname",
          targetIndex: 0,
          gridType: "heat",
        }),
      );
      fixture.detectChanges();
      expect(component.formattedValue).toBe("Lord Perceval");
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

    it("should render header-only card when isHeaderWidget is true", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          isHeaderWidget: true,
          customLabel: "Lap Times",
        }),
      );
      fixture.detectChanges();

      const cardEl = fixture.nativeElement.querySelector(
        ".raceday-lane-column-card",
      );
      expect(cardEl.classList.contains("header-widget-card")).toBeTrue();

      const headerOnlyEl = fixture.nativeElement.querySelector(
        ".lane-col-header.header-widget-only",
      );
      expect(headerOnlyEl).toBeTruthy();
      expect(headerOnlyEl.textContent.trim()).toBe("Lap Times");

      const bodyEl = fixture.nativeElement.querySelector(".lane-col-body");
      expect(bodyEl).toBeNull();
    });

    it("should render vertically centered header widget for lastLaps without align-top", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLaps",
          isHeaderWidget: true,
          customLabel: "Last Laps",
        }),
      );
      fixture.detectChanges();

      const headerOnlyEl = fixture.nativeElement.querySelector(
        ".lane-col-header.header-widget-only",
      );
      expect(headerOnlyEl).toBeTruthy();
      expect(headerOnlyEl.textContent.trim()).toBe("Last Laps");
    });

    it("should apply highlight class when driver is in parent.highlightedDrivers", () => {
      mockParent.highlightedDrivers = new Set(["driver-1"]);
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          targetIndex: 0,
          highlightRowOnLap: true,
        }),
      );
      fixture.detectChanges();

      expect(component.isHighlighted).toBeTrue();
      const cardEl = fixture.nativeElement.querySelector(
        ".raceday-lane-column-card",
      );
      expect(cardEl.classList.contains("highlight")).toBeTrue();

      // Should not highlight if highlightRowOnLap is disabled
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          targetIndex: 0,
          highlightRowOnLap: false,
        }),
      );
      fixture.detectChanges();
      expect(component.isHighlighted).toBeFalse();

      // Should not highlight header widgets
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          targetIndex: 0,
          isHeaderWidget: true,
          highlightRowOnLap: true,
        }),
      );
      fixture.detectChanges();
      expect(component.isHighlighted).toBeFalse();

      // Should apply highlight-style class based on highlightLapStyle
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          targetIndex: 0,
          highlightRowOnLap: true,
          highlightLapStyle: "glow-border",
        }),
      );
      fixture.detectChanges();
      expect(component.highlightLapStyle).toBe("glow-border");
      const styledCard = fixture.nativeElement.querySelector(
        ".raceday-lane-column-card",
      );
      expect(
        styledCard.classList.contains("highlight-style-glow-border"),
      ).toBeTrue();
      expect(component.isLightBackground).toBeFalse(); // default dark bg

      // Should not highlight if highlightLapStyle is 'none'
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          targetIndex: 0,
          highlightLapStyle: "none",
        }),
      );
      fixture.detectChanges();
      expect(component.isHighlighted).toBeFalse();
      const noneCard = fixture.nativeElement.querySelector(
        ".raceday-lane-column-card",
      );
      expect(noneCard.classList.contains("highlight")).toBeFalse();

      // Should default to none if highlightRowOnLap is false without explicit highlightLapStyle
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          targetIndex: 0,
          highlightRowOnLap: false,
        }),
      );
      fixture.detectChanges();
      expect(component.highlightLapStyle).toBe("none");

      // Should default to classic if highlightRowOnLap is true without explicit highlightLapStyle
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lastLapTime",
          targetIndex: 0,
          highlightRowOnLap: true,
        }),
      );
      fixture.detectChanges();
      expect(component.highlightLapStyle).toBe("classic");
    });

    it("should default effectiveHeaderTextColor to #ffffff for isHeaderWidget even if lane colors are enabled", () => {
      // mockParent lane 0 foreground_color is #ffcc00
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lapCount",
          isHeaderWidget: true,
          useLaneColors: true,
          targetIndex: 0,
          headerBackgroundColor: "#000000",
        }),
      );
      fixture.detectChanges();

      expect(component.effectiveHeaderTextColor).toBe("#ffffff");
      expect(component.foregroundColor).toBe("#ffffff");
      expect(component.backgroundColor).toBe("#000000");

      const headerOnlyEl = fixture.nativeElement.querySelector(
        ".lane-col-header.header-widget-only",
      );
      expect(headerOnlyEl.style.color).toBe("rgb(255, 255, 255)");
      expect(headerOnlyEl.style.background).toBe("rgb(0, 0, 0)");
    });

    it("should use custom headerTextColor for isHeaderWidget when specified", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "lapCount",
          isHeaderWidget: true,
          headerTextColor: "#38bdf8",
          headerBackgroundColor: "#1e293b",
        }),
      );
      fixture.detectChanges();

      expect(component.effectiveHeaderTextColor).toBe("#38bdf8");
      expect(component.foregroundColor).toBe("#38bdf8");
      expect(component.backgroundColor).toBe("#1e293b");

      const headerOnlyEl = fixture.nativeElement.querySelector(
        ".lane-col-header.header-widget-only",
      );
      expect(headerOnlyEl.style.color).toBe("rgb(56, 189, 248)");
      expect(headerOnlyEl.style.background).toBe("rgb(30, 41, 59)");
    });
  });

  describe("Custom Widget as Main Column", () => {
    it("should resolve columnKey from widgetType if widgetType starts with custom:", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", {
        id: "w-custom",
        widgetType: "custom:lap-counter" as any,
        scaleMode: "fixed",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        customSettings: {
          insets: { "top-right": "lastLapTime" },
        } as any,
      });
      fixture.detectChanges();

      expect(component.columnKey).toBe("custom:lap-counter");
      expect(component.isCustomWidget(component.columnKey)).toBeTrue();
      expect(component.hasInset("top-right")).toBeTrue();
    });

    it("should generate and cache synthetic inputs for custom widget as main", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", {
        id: "w-main",
        widgetType: "lane-column",
        scaleMode: "fixed",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        customSettings: {
          columnKey: "custom:my-widget",
          bindingMode: "position",
          targetIndex: 2,
          myOption: "value1",
        } as any,
      });
      fixture.detectChanges();

      const inputs = component.getCustomWidgetInputsForMain();
      expect(inputs).toBeDefined();
      expect(inputs?.widget.customSettings?.["gridLane"]).toBe(2);
      expect(inputs?.widget.customSettings?.["showHeader"]).toBeFalse();
      expect(inputs?.widget.customSettings?.["myOption"]).toBe("value1");

      // Verify cached reference
      expect(component.getCustomWidgetInputsForMain()).toBe(inputs);
    });

    it("should render placeholder or component for custom widget in main content", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput(
        "widget",
        createWidget({
          columnKey: "custom:unregistered-widget",
        }),
      );
      fixture.detectChanges();

      const placeholder = fixture.nativeElement.querySelector(
        ".lane-col-custom-placeholder",
      );
      expect(placeholder).toBeTruthy();
      expect(placeholder.textContent).toContain("custom:unregistered-widget");
    });

    it("should compute isGridCellUnselected and prevent anchor modifications when grid is not selected", () => {
      mockParent.isUIEditorMode = () => true;
      mockParent.gridSession = () => null;
      mockParent.columnsChanged = { emit: jasmine.createSpy("emit") };
      fixture.componentRef.setInput("parent", mockParent);

      const gridWidget = createWidget({
        columnKey: "lastLapTime",
        insets: { "top-left": "driver.nickname" },
      });
      gridWidget.customSettings = {
        ...(gridWidget.customSettings || {}),
        gridId: "grid-unselected-lane-col",
      };
      fixture.componentRef.setInput("widget", gridWidget);
      fixture.detectChanges();

      expect(component.isGridCellUnselected).toBeTrue();

      // anchor-drop-grid should not be rendered when isGridCellUnselected is true
      const dropGrid = fixture.nativeElement.querySelector(".anchor-drop-grid");
      expect(dropGrid).toBeNull();

      // deleteAnchor should be blocked
      const mockClickEvent = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      } as any;
      component.deleteAnchor("top-left", mockClickEvent);
      expect(component.settings.insets?.["top-left"]).toBe("driver.nickname");
      expect(mockParent.columnsChanged.emit).not.toHaveBeenCalled();

      // onAnchorDrop should be blocked
      const mockDropEvent = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
        dataTransfer: {
          getData: () => "bestLapTime",
        },
      } as any;
      component.onAnchorDrop(mockDropEvent, "top-right");
      expect(component.settings.insets?.["top-right"]).toBeUndefined();

      // Now activate grid session
      mockParent.gridSession = () => ({
        gridId: "grid-unselected-lane-col",
        sourceLaneIndex: 0,
      });
      fixture.detectChanges();

      expect(component.isGridCellUnselected).toBeFalse();
      const dropGridActive =
        fixture.nativeElement.querySelector(".anchor-drop-grid");
      expect(dropGridActive).toBeTruthy();

      // deleteAnchor now succeeds
      component.deleteAnchor("top-left", mockClickEvent);
      expect(component.settings.insets?.["top-left"]).toBeUndefined();
      expect(mockParent.columnsChanged.emit).toHaveBeenCalled();

      // Only selected widget or active drag renders anchor-drop-grid
      mockParent.selectedWidgetId = () => "other-selected-widget-id";
      fixture.detectChanges();
      expect(component.shouldRenderAnchorDropGrid).toBeFalse();
      expect(
        fixture.nativeElement.querySelector(".anchor-drop-grid"),
      ).toBeNull();

      mockParent.selectedWidgetId = () => gridWidget.id;
      fixture.detectChanges();
      expect(component.shouldRenderAnchorDropGrid).toBeTrue();
      expect(
        fixture.nativeElement.querySelector(".anchor-drop-grid"),
      ).toBeTruthy();

      mockParent.selectedWidgetId = () => "other-selected-widget-id";
      mockParent.draggedWidgetType = "lane-column";
      fixture.detectChanges();
      expect(component.shouldRenderAnchorDropGrid).toBeTrue();
      expect(
        fixture.nativeElement.querySelector(".anchor-drop-grid"),
      ).toBeTruthy();
    });

    describe("emptyRowsMode & isExtraGridRow & isOverallNoDataRow", () => {
      it("should resolve default emptyRowsMode correctly", () => {
        // heat/lane binding mode defaults to "empty"
        fixture.componentRef.setInput("parent", mockParent);
        fixture.componentRef.setInput(
          "widget",
          createWidget({ bindingMode: "lane", emptyRowsMode: undefined }),
        );
        fixture.detectChanges();
        expect(component.emptyRowsMode).toBe("empty");

        // position binding mode with heat grid defaults to "empty"
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            bindingMode: "position",
            gridType: "heat",
            emptyRowsMode: undefined,
          }),
        );
        fixture.detectChanges();
        expect(component.emptyRowsMode).toBe("empty");

        // overallPosition binding mode defaults to "remove"
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            bindingMode: "overallPosition",
            emptyRowsMode: undefined,
          }),
        );
        fixture.detectChanges();
        expect(component.emptyRowsMode).toBe("remove");

        // seed binding mode defaults to "remove"
        fixture.componentRef.setInput(
          "widget",
          createWidget({ bindingMode: "seed", emptyRowsMode: undefined }),
        );
        fixture.detectChanges();
        expect(component.emptyRowsMode).toBe("remove");

        // explicit setting overrides default
        fixture.componentRef.setInput(
          "widget",
          createWidget({ bindingMode: "lane", emptyRowsMode: "blank" }),
        );
        fixture.detectChanges();
        expect(component.emptyRowsMode).toBe("blank");

        fixture.componentRef.setInput(
          "widget",
          createWidget({
            bindingMode: "overallPosition",
            emptyRowsMode: "empty",
          }),
        );
        fixture.detectChanges();
        expect(component.emptyRowsMode).toBe("empty");
      });

      it("should determine isExtraGridRow correctly", () => {
        fixture.componentRef.setInput("parent", mockParent);
        // Valid driver on lane 0 -> not an extra row
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 0,
          }),
        );
        fixture.detectChanges();
        expect(component.isExtraGridRow).toBeFalse();

        // Lane 5 (no driver in mockParent with laneIndex: 5) -> isExtraGridRow is true
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 5,
          }),
        );
        fixture.detectChanges();
        expect(component.isExtraGridRow).toBeTrue();

        // Non-grid widget (no gridId) -> isExtraGridRow is false
        fixture.componentRef.setInput(
          "widget",
          createWidget({ bindingMode: "lane", targetIndex: 5 }),
        );
        fixture.detectChanges();
        expect(component.isExtraGridRow).toBeFalse();

        // Header widget is never an extra row
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 5,
            isHeaderWidget: true,
          }),
        );
        fixture.detectChanges();
        expect(component.isExtraGridRow).toBeFalse();

        // In UI Editor mode, isExtraGridRow is always false
        mockParent.isUIEditorMode = () => true;
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 5,
          }),
        );
        fixture.detectChanges();
        expect(component.isExtraGridRow).toBeFalse();
        mockParent.isUIEditorMode = () => false;
      });

      it("should determine isOverallNoDataRow based on emptyRowsMode", () => {
        fixture.componentRef.setInput("parent", mockParent);
        // Extra row with emptyRowsMode = "remove" -> isOverallNoDataRow is true
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 5,
            emptyRowsMode: "remove",
          }),
        );
        fixture.detectChanges();
        expect(component.isOverallNoDataRow).toBeTrue();

        // Extra row with emptyRowsMode = "empty" -> isOverallNoDataRow is false (row shown with --)
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 5,
            emptyRowsMode: "empty",
          }),
        );
        fixture.detectChanges();
        expect(component.isOverallNoDataRow).toBeFalse();

        // Extra row with emptyRowsMode = "blank" -> isOverallNoDataRow is false (row shown blank)
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 5,
            emptyRowsMode: "blank",
          }),
        );
        fixture.detectChanges();
        expect(component.isOverallNoDataRow).toBeFalse();

        // Populated row with emptyRowsMode = "remove" -> isOverallNoDataRow is false
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 0,
            emptyRowsMode: "remove",
          }),
        );
        fixture.detectChanges();
        expect(component.isOverallNoDataRow).toBeFalse();
      });

      it("should format values and insets according to emptyRowsMode for extra grid rows", () => {
        fixture.componentRef.setInput("parent", mockParent);

        // empty mode: returns "--" for main value and inset
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 5,
            emptyRowsMode: "empty",
            insets: { "top-left": "lapCount" },
          }),
        );
        fixture.detectChanges();
        expect(component.formattedValue).toBe("--");
        expect(component.getInsetValue("top-left")).toBe("--");
        expect(component.hasInset("top-left")).toBeTrue();

        // blank mode: returns "" for main value and inset, hasInset is false, header suppressed
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            bindingMode: "lane",
            targetIndex: 5,
            emptyRowsMode: "blank",
            insets: { "top-left": "lapCount" },
          }),
        );
        fixture.detectChanges();
        expect(component.formattedValue).toBe("");
        expect(component.getInsetValue("top-left")).toBe("");
        expect(component.hasInset("top-left")).toBeFalse();

        const headerEl =
          fixture.nativeElement.querySelector(".lane-col-header");
        expect(headerEl).toBeNull();
      });

      it("should format driver.name and driver.nickname as RD_EMPTY_LANE on heat grid extra rows in empty mode", () => {
        fixture.componentRef.setInput("parent", mockParent);

        // Heat grid in empty mode with driver.name: should return RD_EMPTY_LANE
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            gridType: "heat",
            bindingMode: "lane",
            columnKey: "driver.name",
            targetIndex: 5,
            emptyRowsMode: "empty",
            insets: { "top-left": "driver.nickname" },
          }),
        );
        fixture.detectChanges();
        expect(component.formattedValue).toBe("RD_EMPTY_LANE");
        expect(component.getInsetValue("top-left")).toBe("RD_EMPTY_LANE");

        // Heat grid in blank mode with driver.name: should return ""
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            gridType: "heat",
            bindingMode: "lane",
            columnKey: "driver.name",
            targetIndex: 5,
            emptyRowsMode: "blank",
            insets: { "top-left": "driver.nickname" },
          }),
        );
        fixture.detectChanges();
        expect(component.formattedValue).toBe("");
        expect(component.getInsetValue("top-left")).toBe("");

        // Overall grid in empty mode with driver.name: should return "--"
        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-test",
            gridType: "overall",
            bindingMode: "overallPosition",
            columnKey: "driver.name",
            targetIndex: 5,
            emptyRowsMode: "empty",
            insets: { "top-left": "driver.nickname" },
          }),
        );
        fixture.detectChanges();
        expect(component.formattedValue).toBe("--");
        expect(component.getInsetValue("top-left")).toBe("--");
      });

      it("should apply lane colors to empty lanes on heat grid in position mode with emptyRowsMode empty", () => {
        fixture.componentRef.setInput("parent", mockParent);

        // Position 1 (targetIndex 1, 2nd position row) when there is an empty driver on Lane 1
        const emptyHd = {
          objectId: "empty-lane-1",
          isEmpty: true,
          laneIndex: 1,
        } as any;
        const testParent = {
          ...mockParent,
          heatDrivers: [mockDrivers[0], emptyHd],
          heat: {
            heatDrivers: [mockDrivers[0], emptyHd],
            standings: ["driver-1", "empty-lane-1"],
          },
        };
        fixture.componentRef.setInput("parent", testParent);

        fixture.componentRef.setInput(
          "widget",
          createWidget({
            gridId: "grid-heat-empty-test",
            gridType: "heat",
            bindingMode: "position",
            columnKey: "driver.name",
            targetIndex: 1,
            emptyRowsMode: "empty",
            useLaneColors: true,
          }),
        );
        fixture.detectChanges();

        expect(component.formattedValue).toBe("RD_EMPTY_LANE");
        // Lane 1 has background_color "#223344" and foreground_color "#00ccff"
        expect(component.backgroundColor).toBe("#223344");
        expect(component.foregroundColor).toBe("#00ccff");
      });
    });
  });
});
