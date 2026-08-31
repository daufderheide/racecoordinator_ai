import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { TwinGraphsComponent } from "@app/components/shared/twin-graphs/twin-graphs.component";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { Role } from "@app/models/role";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { AuthService } from "@app/services/auth.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";

import { DefaultHeatResultsComponent } from "./default-heat-results.component";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("DefaultHeatResultsComponent", () => {
  let component: DefaultHeatResultsComponent;
  let fixture: ComponentFixture<DefaultHeatResultsComponent>;
  let mockRaceConnectionService: any;
  let mockRaceService: any;
  let mockPrintService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: jasmine.createSpy("navigate"),
    };

    mockRaceConnectionService = {
      connect: jasmine.createSpy("connect"),
      disconnect: jasmine.createSpy("disconnect"),
      laps$: new BehaviorSubject<any>(null),
      standingsUpdate$: new BehaviorSubject<any>(null),
      driverRankings: new Map<string, number>(),
    };

    mockRaceService = jasmine.createSpyObj("RaceService", [
      "getRace",
      "getCurrentHeat",
    ]);
    mockRaceService.currentHeat$ = of(null);
    mockRaceService.participants$ = of([]);

    // Mock Setup Data
    const mockDriver1 = new Driver("d1", "Alice", "Ally", "");
    const mockDriver2 = new Driver("d2", "Bob", "Bobby", "");

    const hd1 = new DriverHeatData(
      "hd1",
      { driver: mockDriver1 } as any,
      0,
      mockDriver1,
    );
    hd1.addLapTime(1, 10.5, 10.5, 10.5, 10.5, 1);
    hd1.addLapTime(2, 10.2, 10.35, 10.35, 10.2, 2);

    const hd2 = new DriverHeatData(
      "hd2",
      { driver: mockDriver2 } as any,
      1,
      mockDriver2,
    );
    hd2.addLapTime(1, 11.1, 11.1, 11.1, 11.1, 1);
    hd2.addLapTime(2, 10.9, 11.0, 11.0, 10.9, 2);

    const mockHeat = new Heat("h1", 1, [hd1, hd2]);
    const mockRace = new Race(
      "r1",
      "Race 1",
      {
        lanes: [
          { background_color: "#ff0000" },
          { background_color: "#0000ff" },
        ],
      } as any,
      "RoundRobin",
    );

    mockRaceService.getRace.and.returnValue(mockRace);
    mockRaceService.getCurrentHeat.and.returnValue(mockHeat);

    mockPrintService = jasmine.createSpyObj("PrintService", ["print"]);

    await TestBed.configureTestingModule({
      imports: [DefaultHeatResultsComponent, MockTranslatePipe],
      providers: [
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: PrintService, useValue: mockPrintService },
        {
          provide: DataService,
          useValue: {
            serverUrl: "http://localhost:8080",
            getSystemState: () => of(null),
            updateRaceSubscription: () => {},
          },
        },
        {
          provide: AuthService,
          useValue: { currentRole: Role.VIEWER },
        },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultHeatResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render dual graph containers in stacked layout with axis titles and dual legends", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".rankings-graph")).toBeTruthy();
    expect(compiled.querySelector(".laptimes-graph")).toBeTruthy();

    const twinGraphsDebug = fixture.debugElement.query(
      By.directive(TwinGraphsComponent),
    );
    expect(twinGraphsDebug).toBeTruthy();
    expect(twinGraphsDebug.componentInstance.stacked).toBeTrue();

    // Verify top and bottom legends are rendered in stacked mode
    expect(compiled.querySelector(".top-legend")).toBeTruthy();
    expect(compiled.querySelector(".legend")).toBeTruthy();

    // Verify axis titles for both graphs are rendered (X and Y for each = 4 total)
    const axisTitles = compiled.querySelectorAll(".axis-title");
    expect(axisTitles.length).toBe(4);
  });

  it("should calculate ranking timeline correctly", () => {
    // Trigger graph update loop
    component.ngOnInit();

    expect(component["driverLines"].length).toBe(2);

    // Check first driver rank points
    const line1 = component["driverLines"][0];
    expect(line1.rankPoints.length).toBeGreaterThan(1);

    // Check points chronology ascending
    let prevX = -1;
    line1.rankPoints.forEach((p: any) => {
      expect(p.x).toBeGreaterThanOrEqual(prevX);
      prevX = p.x;
    });
  });

  it("should filter out Empty drivers from calculations", () => {
    const mockDriverEmpty = new Driver("d3", "Empty", "Empty", "");
    const hdEmpty = new DriverHeatData(
      "hdEmpty",
      { driver: mockDriverEmpty } as any,
      2,
      mockDriverEmpty,
    );

    const currentHeat = mockRaceService.getCurrentHeat();
    currentHeat.heatDrivers.push(hdEmpty);

    component.ngOnInit();

    // empty driver should be filtered
    expect(component["driverLines"].length).toBe(2);
  });

  it("should trigger PDF export with Heat Results and fullScroll enabled when exportPdf is confirmed", () => {
    component.exportPdf();
    expect(component.showPdfExportDialog).toBeTrue();

    component.onPdfExportConfirm({
      includeBackground: true,
      saveAsDefault: false,
    });

    expect(mockPrintService.print).toHaveBeenCalledWith(
      "Race 1-HeatResults",
      true,
      undefined,
      true,
    );
  });

  it("should pass groupNames to heat-driver-expander component when enabled", () => {
    (component as any).race = {
      name: "Group Race",
      group_options: {
        enabled: true,
        names: ["Novice Class", "Pro Class"],
      },
    };
    fixture.detectChanges();

    const expanderEl = fixture.nativeElement.querySelector(
      "app-heat-driver-expander",
    );
    expect(expanderEl).toBeTruthy();
  });

  it("should render empty state message when heatData is empty", () => {
    component["heatData"] = [];
    fixture.detectChanges();

    const noDataEl = fixture.nativeElement.querySelector(".no-heats-container");
    expect(noDataEl).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain("HR_NO_HEAT_DATA");
  });

  it("should open driver results window, track it, and close it on destroy or pagehide", () => {
    const mockWindow = jasmine.createSpyObj("Window", ["close"]);
    mockWindow.closed = false;
    spyOn(window, "open").and.returnValue(mockWindow);

    component["openDriverResults"]("d1");
    expect(window.open).toHaveBeenCalledWith("/driver-results/d1", "_blank");
    expect(component["driverResultsWindows"].length).toBe(1);

    // Call pagehide
    component.onPageHide(null);
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalledWith();
    expect(mockWindow.close).toHaveBeenCalled();
    expect(component["driverResultsWindows"].length).toBe(0);

    // Test ngOnDestroy close
    mockRaceConnectionService.disconnect.calls.reset();
    const mockWindow2 = jasmine.createSpyObj("Window", ["close"]);
    mockWindow2.closed = false;
    (window.open as jasmine.Spy).and.returnValue(mockWindow2);
    component["openDriverResults"]("d2");
    expect(component["driverResultsWindows"].length).toBe(1);

    component.ngOnDestroy();
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalledWith();
    expect(mockWindow2.close).toHaveBeenCalled();
    expect(component["driverResultsWindows"].length).toBe(0);
  });

  describe("Viewer Race Ended Redirect", () => {
    it("should redirect to /raceday-setup on acknowledge if race has ended", () => {
      const routerSpy = TestBed.inject(Router);

      component.raceHasEnded = true;
      component.onAcknowledgeModal();

      expect(component.showAckModal).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });

    it("should not redirect to /raceday-setup on acknowledge if race has not ended", () => {
      const routerSpy = TestBed.inject(Router);

      component.raceHasEnded = false;
      component.onAcknowledgeModal();

      expect(component.showAckModal).toBeFalse();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe("Heat Standings & Positions", () => {
    it("should resolve heat positions correctly from heat.standings", () => {
      const currentHeat = mockRaceService.getCurrentHeat();
      // hd2 is 1st, hd1 is 2nd
      currentHeat.standings = ["hd2", "hd1"];
      currentHeat.heatDrivers[0].rank = 0;
      currentHeat.heatDrivers[1].rank = 0;

      component["calculateHeatStandings"]();

      expect(component["heatData"].length).toBe(2);
      const row1 = component["heatData"].find(
        (d) => d.heatDriver.objectId === "hd1",
      )?.row;
      const row2 = component["heatData"].find(
        (d) => d.heatDriver.objectId === "hd2",
      )?.row;

      expect(row2?.rank).toBe(1);
      expect(row1?.rank).toBe(2);
    });

    it("should resolve heat positions directly from heatDriver.rank", () => {
      const currentHeat = mockRaceService.getCurrentHeat();
      currentHeat.standings = [];
      currentHeat.heatDrivers[0].rank = 2; // hd1
      currentHeat.heatDrivers[1].rank = 1; // hd2

      component["calculateHeatStandings"]();

      const row1 = component["heatData"].find(
        (d) => d.heatDriver.objectId === "hd1",
      )?.row;
      const row2 = component["heatData"].find(
        (d) => d.heatDriver.objectId === "hd2",
      )?.row;

      expect(row2?.rank).toBe(1);
      expect(row1?.rank).toBe(2);
    });

    it("should update heat positions when standingsUpdate$ emits", () => {
      const currentHeat = mockRaceService.getCurrentHeat();
      currentHeat.heatDrivers[0].rank = 1;
      currentHeat.heatDrivers[1].rank = 2;
      component["calculateHeatStandings"]();

      expect(
        component["heatData"].find((d) => d.heatDriver.objectId === "hd1")?.row
          .rank,
      ).toBe(1);
      expect(
        component["heatData"].find((d) => d.heatDriver.objectId === "hd2")?.row
          .rank,
      ).toBe(2);

      // Now server emits standings update swapping positions
      mockRaceConnectionService.driverRankings.set("hd1", 2);
      mockRaceConnectionService.driverRankings.set("hd2", 1);
      currentHeat.heatDrivers[0].rank = 2;
      currentHeat.heatDrivers[1].rank = 1;

      mockRaceConnectionService.standingsUpdate$.next({
        updates: [
          { objectId: "hd2", rank: 1 },
          { objectId: "hd1", rank: 2 },
        ],
      });

      expect(
        component["heatData"].find((d) => d.heatDriver.objectId === "hd1")?.row
          .rank,
      ).toBe(2);
      expect(
        component["heatData"].find((d) => d.heatDriver.objectId === "hd2")?.row
          .rank,
      ).toBe(1);
    });

    it("should default rank to 0 for unranked drivers instead of defaulting to 1", () => {
      const currentHeat = mockRaceService.getCurrentHeat();
      currentHeat.standings = [];
      currentHeat.heatDrivers[0].rank = 0;
      currentHeat.heatDrivers[1].rank = 0;
      mockRaceConnectionService.driverRankings.clear();

      component["calculateHeatStandings"]();

      const row1 = component["heatData"].find(
        (d) => d.heatDriver.objectId === "hd1",
      )?.row;
      const row2 = component["heatData"].find(
        (d) => d.heatDriver.objectId === "hd2",
      )?.row;

      expect(row1?.rank).toBe(0);
      expect(row2?.rank).toBe(0);
    });
  });
});
