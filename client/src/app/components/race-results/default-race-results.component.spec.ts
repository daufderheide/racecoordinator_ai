import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultRaceResultsComponent } from "./default-race-results.component";
import { RaceResultsHarness } from "./testing/race-results.harness";

describe("DefaultRaceResultsComponent", () => {
  let component: DefaultRaceResultsComponent;
  let fixture: ComponentFixture<DefaultRaceResultsComponent>;
  let harness: RaceResultsHarness;
  let mockRaceConnectionService: any;
  let mockRaceService: any;
  let mockPrintService: any;
  let mockTranslationService: any;
  let participantsSubject: BehaviorSubject<RaceParticipant[]>;
  let heatsSubject: BehaviorSubject<Heat[]>;
  let selectedRaceSubject: BehaviorSubject<Race | undefined>;
  let standingsUpdateSubject: Subject<any>;
  let overallStandingsUpdateSubject: Subject<any>;
  let lapsSubject: Subject<any>;

  // Reusable test helpers
  const createDriver = (id: string, name: string, nickname: string): Driver => {
    return new Driver(id, name, nickname, "");
  };

  const createParticipant = (
    id: string,
    driver: Driver,
    rank: number,
    totalLaps: number,
    totalTime: number,
    bestLapTime: number,
    averageLapTime: number,
    medianLapTime: number,
    rankValue: number,
    seed: number,
  ): RaceParticipant => {
    return new RaceParticipant(
      id,
      driver,
      rank,
      totalLaps,
      totalTime,
      bestLapTime,
      averageLapTime,
      medianLapTime,
      rankValue,
      seed,
      100,
    );
  };

  const createHeatWithLaps = (
    heatId: string,
    heatNumber: number,
    drivers: { driver: Driver; laps: number[] }[],
  ): Heat => {
    const heatDrivers = drivers.map((d, i) => {
      const participant = createParticipant(
        d.driver.entity_id,
        d.driver,
        i + 1,
        d.laps.length,
        d.laps.reduce((a, b) => a + b, 0),
        Math.min(...d.laps),
        d.laps.reduce((a, b) => a + b, 0) / d.laps.length,
        [...d.laps].sort((a, b) => a - b)[Math.floor(d.laps.length / 2)],
        0,
        i + 1,
      );
      const hd = new DriverHeatData(
        d.driver.entity_id,
        participant as any,
        i,
        d.driver,
      );
      d.laps.forEach((lap, idx) => {
        hd.addLapTime(idx + 1, lap, 0, 0, 0, idx + 1);
      });
      return hd;
    });
    return new Heat(heatId, heatNumber, heatDrivers);
  };

  beforeEach(async () => {
    participantsSubject = new BehaviorSubject<RaceParticipant[]>([]);
    heatsSubject = new BehaviorSubject<Heat[]>([]);
    selectedRaceSubject = new BehaviorSubject<Race | undefined>(undefined);
    standingsUpdateSubject = new Subject<any>();
    overallStandingsUpdateSubject = new Subject<any>();
    lapsSubject = new Subject<any>();

    mockRaceConnectionService = {
      connect: jasmine.createSpy("connect"),
      disconnect: jasmine.createSpy("disconnect"),
      standingsUpdate$: standingsUpdateSubject.asObservable(),
      overallStandingsUpdate$: overallStandingsUpdateSubject.asObservable(),
      laps$: lapsSubject.asObservable(),
      recordData$: new BehaviorSubject(null).asObservable(),
    };

    mockRaceService = {
      participants$: participantsSubject.asObservable(),
      heats$: heatsSubject.asObservable(),
      selectedRace$: selectedRaceSubject.asObservable(),
      getHeats: jasmine.createSpy("getHeats").and.returnValue([]),
      getCurrentHeat: jasmine
        .createSpy("getCurrentHeat")
        .and.returnValue(undefined),
    };

    mockPrintService = jasmine.createSpyObj("PrintService", ["print"]);

    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
      getCurrentLanguage: jasmine
        .createSpy("getCurrentLanguage")
        .and.returnValue(new BehaviorSubject<string>("en")),
    };

    await TestBed.configureTestingModule({
      imports: [DefaultRaceResultsComponent],
      providers: [
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: PrintService, useValue: mockPrintService },
        { provide: TranslationService, useValue: mockTranslationService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null,
              },
              queryParamMap: {
                get: () => null,
              },
            },
            params: new BehaviorSubject({}),
          },
        },
        {
          provide: DataService,
          useValue: { serverUrl: "http://localhost:8080" },
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(DefaultRaceResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RaceResultsHarness,
    );
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should connect to RaceConnectionService on init", () => {
    expect(mockRaceConnectionService.connect).toHaveBeenCalled();
  });

  it("should disconnect from RaceConnectionService on destroy", () => {
    fixture.destroy();
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalled();
  });

  describe("Standings Calculation", () => {
    it("should produce no standings rows when there are no participants", () => {
      participantsSubject.next([]);
      expect(component["standingsRows"].length).toBe(0);
    });

    it("should calculate standings from participants", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const p1 = createParticipant(
        "d1",
        d1,
        1,
        10,
        50.0,
        4.5,
        5.0,
        5.0,
        100,
        1,
      );
      const p2 = createParticipant("d2", d2, 2, 9, 54.0, 5.5, 6.0, 6.0, 80, 2);

      participantsSubject.next([p1, p2]);

      expect(component["standingsRows"].length).toBe(2);
      expect(component["standingsRows"][0].driver.name).toBe("Alice");
      expect(component["standingsRows"][1].driver.name).toBe("Bob");
    });

    it("should sort by rank ascending", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const p1 = createParticipant("d1", d1, 2, 8, 50.0, 5.0, 6.25, 6.0, 80, 1);
      const p2 = createParticipant(
        "d2",
        d2,
        1,
        10,
        48.0,
        4.5,
        4.8,
        4.8,
        100,
        2,
      );

      participantsSubject.next([p1, p2]);

      const rank1 = component["standingsRows"].find((r) => r.visualIndex === 0);
      const rank2 = component["standingsRows"].find((r) => r.visualIndex === 1);
      expect(rank1?.driver.name).toBe("Bob");
      expect(rank2?.driver.name).toBe("Alice");
    });

    it("should physically sort standingsRows alphabetically by driverKey for DOM stability while visualIndex matches rank", () => {
      const d1 = createDriver("d1", "Charlie", "Chuck");
      const d2 = createDriver("d2", "Alice", "Ally");
      const d3 = createDriver("d3", "Bob", "Bobby");

      const p1 = createParticipant("d1", d1, 3, 7, 52.0, 6.0, 7.0, 7.0, 60, 1);
      const p2 = createParticipant(
        "d2",
        d2,
        1,
        10,
        48.0,
        4.5,
        4.8,
        4.8,
        100,
        2,
      );
      const p3 = createParticipant("d3", d3, 2, 9, 50.0, 5.0, 5.5, 5.5, 80, 3);

      participantsSubject.next([p1, p2, p3]);

      const rows = component["standingsRows"];
      expect(rows.length).toBe(3);
      // Alphabetical order of driverKeys/IDs: d1 (Charlie), d2 (Alice), d3 (Bob)
      expect(rows[0].driver.name).toBe("Charlie");
      expect(rows[1].driver.name).toBe("Alice");
      expect(rows[2].driver.name).toBe("Bob");

      // Corresponding visual index based on their ranks
      expect(rows[0].visualIndex).toBe(2); // Charlie (3rd rank)
      expect(rows[1].visualIndex).toBe(0); // Alice (1st rank)
      expect(rows[2].visualIndex).toBe(1); // Bob (2nd rank)
    });

    it("should include medianLapTime in standings rows", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const p1 = createParticipant(
        "d1",
        d1,
        1,
        10,
        50.0,
        4.5,
        5.0,
        4.8,
        100,
        1,
      );

      participantsSubject.next([p1]);

      expect(component["standingsRows"][0].medianLapTime).toBe(4.8);
    });

    it("should include totalTime in standings rows", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const p1 = createParticipant(
        "d1",
        d1,
        1,
        10,
        55.555,
        4.5,
        5.0,
        4.8,
        100,
        1,
      );

      participantsSubject.next([p1]);

      expect(component["standingsRows"][0].totalTime).toBe(55.555);
    });

    it("should filter Empty drivers", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const dEmpty = createDriver("EMPTY_LANE", "Empty", "Empty");

      const p1 = createParticipant(
        "d1",
        d1,
        1,
        10,
        50.0,
        4.5,
        5.0,
        5.0,
        100,
        1,
      );
      const pEmpty = createParticipant(
        "EMPTY_LANE",
        dEmpty,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        2,
      );

      participantsSubject.next([p1, pEmpty]);

      expect(component["standingsRows"].length).toBe(1);
      expect(component["standingsRows"][0].driver.name).toBe("Alice");
    });
  });

  describe("Gap Calculation", () => {
    it("should set gap to 0 for the leader", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const p1 = createParticipant(
        "d1",
        d1,
        1,
        10,
        50.0,
        4.5,
        5.0,
        5.0,
        100,
        1,
      );

      participantsSubject.next([p1]);

      expect(component["standingsRows"][0].gap1st).toBe(0);
      expect(component["standingsRows"][0].gapAhead).toBe(0);
    });

    it("should calculate time gap when drivers have same lap count", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const p1 = createParticipant(
        "d1",
        d1,
        1,
        10,
        50.0,
        4.5,
        5.0,
        5.0,
        100,
        1,
      );
      const p2 = createParticipant("d2", d2, 2, 10, 53.0, 5.0, 5.3, 5.3, 80, 2);

      participantsSubject.next([p1, p2]);

      const rows = component["standingsRows"];
      expect(rows[1].gap1st).toBe(3.0); // 53 - 50
      expect(rows[1].gapAhead).toBe(3.0); // 53 - 50
    });
  });

  describe("Graph Generation", () => {
    it("should generate driver lines from standings data", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 5.1, 4.9] },
        { driver: d2, laps: [5.5, 5.3, 5.2] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant("d1", d1, 1, 3, 15.0, 4.9, 5.0, 5.0, 100, 1);
      const p2 = createParticipant("d2", d2, 2, 3, 16.0, 5.2, 5.33, 5.3, 80, 2);

      participantsSubject.next([p1, p2]);

      expect(component["driverLines"].length).toBe(2);
    });

    it("should create graph points from lap times across heats", () => {
      const d1 = createDriver("d1", "Alice", "Ally");

      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 5.1, 4.9] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant("d1", d1, 1, 3, 15.0, 4.9, 5.0, 5.0, 100, 1);

      participantsSubject.next([p1]);

      const line = component["driverLines"][0];
      expect(line.points.length).toBe(3);

      // Verify cumulative X values
      expect(line.points[0].x).toBeCloseTo(5.0, 1);
      expect(line.points[1].x).toBeCloseTo(10.1, 1);
      expect(line.points[2].x).toBeCloseTo(15.0, 1);

      // Y values should be the individual lap times
      expect(line.points[0].y).toBeCloseTo(5.0, 1);
      expect(line.points[1].y).toBeCloseTo(5.1, 1);
      expect(line.points[2].y).toBeCloseTo(4.9, 1);
    });

    it("should include current heat data in graph (live race support)", () => {
      const d1 = createDriver("d1", "Alice", "Ally");

      // Completed heat 1
      const heat1 = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 5.1] },
      ]);

      // Current (live) heat 2
      const heat2 = createHeatWithLaps("h2", 2, [
        { driver: d1, laps: [4.8, 4.9] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat1]);
      mockRaceService.getCurrentHeat.and.returnValue(heat2);

      const p1 = createParticipant(
        "d1",
        d1,
        1,
        4,
        19.8,
        4.8,
        4.95,
        4.95,
        100,
        1,
      );

      participantsSubject.next([p1]);

      const line = component["driverLines"][0];
      // Should have points from both heats: 2 from heat1 + 2 from heat2
      expect(line.points.length).toBe(4);
    });

    it("should not double-count current heat if it is also in the heats list", () => {
      const d1 = createDriver("d1", "Alice", "Ally");

      const heat1 = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 5.1] },
      ]);

      // Same heat object returned by both getHeats and getCurrentHeat
      mockRaceService.getHeats.and.returnValue([heat1]);
      mockRaceService.getCurrentHeat.and.returnValue(heat1);

      const p1 = createParticipant(
        "d1",
        d1,
        1,
        2,
        10.1,
        5.0,
        5.05,
        5.05,
        100,
        1,
      );

      participantsSubject.next([p1]);

      const line = component["driverLines"][0];
      // Should NOT double the points — deduplication by objectId
      expect(line.points.length).toBe(2);
    });

    it("should generate ranking timeline with correct positions", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      // Alice is faster
      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 5.0] },
        { driver: d2, laps: [6.0, 6.0] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant("d1", d1, 1, 2, 10.0, 5.0, 5.0, 5.0, 100, 1);
      const p2 = createParticipant("d2", d2, 2, 2, 12.0, 6.0, 6.0, 6.0, 80, 2);

      participantsSubject.next([p1, p2]);

      // Both drivers should have rank points
      const line1 = component["driverLines"].find((l) => l.objectId === "d1")!;
      const line2 = component["driverLines"].find((l) => l.objectId === "d2")!;

      expect(line1.rankPoints.length).toBeGreaterThan(0);
      expect(line2.rankPoints.length).toBeGreaterThan(0);
    });

    it("should generate path data strings", () => {
      const d1 = createDriver("d1", "Alice", "Ally");

      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 5.1] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant(
        "d1",
        d1,
        1,
        2,
        10.1,
        5.0,
        5.05,
        5.05,
        100,
        1,
      );

      participantsSubject.next([p1]);

      const line = component["driverLines"][0];
      expect(line.pathData).toContain("M");
      expect(line.pathData).toContain("L");
    });

    it("should mark own laps on ranking points", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0] },
        { driver: d2, laps: [6.0] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant("d1", d1, 1, 1, 5.0, 5.0, 5.0, 5.0, 100, 1);
      const p2 = createParticipant("d2", d2, 2, 1, 6.0, 6.0, 6.0, 6.0, 80, 2);

      participantsSubject.next([p1, p2]);

      const line1 = component["driverLines"].find((l) => l.objectId === "d1")!;

      // At least one rank point should have isOwnLap = true
      const ownLapPoints = line1.rankPoints.filter((p) => p.isOwnLap);
      expect(ownLapPoints.length).toBeGreaterThan(0);
    });

    it("should mark causesStandingsChange correctly when a lap causes a standings change", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 4.5] },
        { driver: d2, laps: [4.0] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant(
        "d1",
        d1,
        1,
        2,
        9.5,
        4.5,
        4.75,
        4.75,
        100,
        1,
      );
      const p2 = createParticipant("d2", d2, 2, 1, 4.0, 4.0, 4.0, 4.0, 80, 2);

      participantsSubject.next([p1, p2]);

      const line1 = component["driverLines"].find((l) => l.objectId === "d1")!;
      const line2 = component["driverLines"].find((l) => l.objectId === "d2")!;

      // Check Bob's points
      const bobPoints = line2.rankPoints;
      const bobOwnLapChange = bobPoints.filter(
        (p) => p.isOwnLap && p.causesStandingsChange,
      );
      expect(bobOwnLapChange.length).toBe(1);
      expect(bobOwnLapChange[0].x).toBe(4.0);
      expect(bobOwnLapChange[0].y).toBe(1);

      // Check Alice's points
      const alicePoints = line1.rankPoints;
      const aliceOwnLaps = alicePoints.filter((p) => p.isOwnLap);
      expect(aliceOwnLaps.length).toBe(2);

      // Alice's lap at 5.0 should not have caused standings change (remained at rank 2 behind Bob who ran 4.0s earlier)
      const lapAt5 = aliceOwnLaps.find((p) => p.x === 5.0);
      expect(lapAt5).toBeTruthy();
      expect(lapAt5?.causesStandingsChange).toBeFalse();

      // Alice's lap at 9.5 should have caused standings change (since she finishes 2nd lap and leads on laps 2 > 1)
      const lapAt95 = aliceOwnLaps.find((p) => p.x === 9.5);
      expect(lapAt95).toBeTruthy();
      expect(lapAt95?.causesStandingsChange).toBeTrue();
    });
  });

  describe("Driver Visibility (Legend Interaction)", () => {
    beforeEach(() => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");
      const d3 = createDriver("d3", "Charlie", "Chuck");

      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0] },
        { driver: d2, laps: [6.0] },
        { driver: d3, laps: [7.0] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant("d1", d1, 1, 1, 5.0, 5.0, 5.0, 5.0, 100, 1);
      const p2 = createParticipant("d2", d2, 2, 1, 6.0, 6.0, 6.0, 6.0, 80, 2);
      const p3 = createParticipant("d3", d3, 3, 1, 7.0, 7.0, 7.0, 7.0, 60, 3);

      participantsSubject.next([p1, p2, p3]);
    });

    it("should have all drivers visible by default", () => {
      expect(component["isDriverVisible"]("d1")).toBeTrue();
      expect(component["isDriverVisible"]("d2")).toBeTrue();
      expect(component["isDriverVisible"]("d3")).toBeTrue();
    });

    it("should toggle driver visibility", () => {
      component["toggleDriverVisibility"]("d2");
      expect(component["isDriverVisible"]("d2")).toBeFalse();
      expect(component["isDriverVisible"]("d1")).toBeTrue();

      // Toggle back
      component["toggleDriverVisibility"]("d2");
      expect(component["isDriverVisible"]("d2")).toBeTrue();
    });

    it("should show only one driver on showOnlyDriver", () => {
      component["showOnlyDriver"]("d2");
      expect(component["isDriverVisible"]("d1")).toBeFalse();
      expect(component["isDriverVisible"]("d2")).toBeTrue();
      expect(component["isDriverVisible"]("d3")).toBeFalse();
    });

    it("should show all drivers when showOnlyDriver called on already-solo driver", () => {
      // First solo d2
      component["showOnlyDriver"]("d2");
      expect(component["isDriverVisible"]("d1")).toBeFalse();

      // Then solo d2 again — should restore all
      component["showOnlyDriver"]("d2");
      expect(component["isDriverVisible"]("d1")).toBeTrue();
      expect(component["isDriverVisible"]("d2")).toBeTrue();
      expect(component["isDriverVisible"]("d3")).toBeTrue();
    });

    it("should set hoveredDriverId on legend hover", () => {
      expect(component["hoveredDriverId"]).toBeNull();

      component["hoveredDriverId"] = "d2";
      expect(component["hoveredDriverId"]).toBe("d2");

      component["hoveredDriverId"] = null;
      expect(component["hoveredDriverId"]).toBeNull();
    });

    it("should force hidden driver back into DOM / render it when hovered", async () => {
      fixture.detectChanges();

      // Initially all 3 drivers are visible, so we should have 6 driver-group elements (3 in left graph, 3 in right graph)
      expect(await harness.getDriverGroupCount()).toBe(6);

      // Hide Bob (d2)
      component["toggleDriverVisibility"]("d2");
      fixture.detectChanges();

      // Bob is hidden, so only d1 and d3 are rendered (2 in left graph, 2 in right graph -> 4 total)
      expect(await harness.getDriverGroupCount()).toBe(4);

      // Hover over Bob (d2)
      component["hoveredDriverId"] = "d2";
      fixture.detectChanges();

      // Bob is hovered, so he should temporarily re-enter the DOM / render in both graphs (6 total)
      expect(await harness.getDriverGroupCount()).toBe(6);
    });
  });

  describe("PDF Export", () => {
    it("should call printService.print with Race Results, fullScroll, and raceStartTime", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const p1 = createParticipant("d1", d1, 1, 5, 25.0, 4.5, 5.0, 5.0, 100, 1);

      participantsSubject.next([p1]);

      component["exportPdf"]();

      expect(mockPrintService.print).toHaveBeenCalledWith(
        "Race Results",
        true,
        jasmine.any(Date),
      );
    });

    it("should capture raceStartTime on first participant arrival", () => {
      const before = new Date();

      const d1 = createDriver("d1", "Alice", "Ally");
      const p1 = createParticipant("d1", d1, 1, 5, 25.0, 4.5, 5.0, 5.0, 100, 1);

      participantsSubject.next([p1]);

      const after = new Date();

      const raceStartTime = component["raceStartTime"];
      expect(raceStartTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(raceStartTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should not update raceStartTime on subsequent participant updates", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const p1 = createParticipant("d1", d1, 1, 5, 25.0, 4.5, 5.0, 5.0, 100, 1);

      participantsSubject.next([p1]);
      const firstTime = component["raceStartTime"];

      // Update participants again
      const p1Updated = createParticipant(
        "d1",
        d1,
        1,
        10,
        50.0,
        4.5,
        5.0,
        5.0,
        200,
        1,
      );
      participantsSubject.next([p1Updated]);

      expect(component["raceStartTime"]).toBe(firstTime);
    });
  });

  describe("Laps Subscription (Live Updates)", () => {
    it("should recalculate standings when a new lap arrives", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const p1 = createParticipant("d1", d1, 1, 5, 25.0, 4.5, 5.0, 5.0, 100, 1);

      participantsSubject.next([p1]);

      const rowsBefore = component["standingsRows"];
      expect(rowsBefore.length).toBe(1);

      // Simulate a new lap event — this should trigger recalculateStandings
      spyOn<any>(component, "recalculateStandings").and.callThrough();
      lapsSubject.next({});

      expect(component["recalculateStandings"]).toHaveBeenCalled();
    });
  });

  describe("Graph Scaling", () => {
    it("should set maxX and maxY from lap data", () => {
      const d1 = createDriver("d1", "Alice", "Ally");

      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [10.0, 12.0, 8.0] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant(
        "d1",
        d1,
        1,
        3,
        30.0,
        8.0,
        10.0,
        10.0,
        100,
        1,
      );

      participantsSubject.next([p1]);

      // maxX should be > 0 (cumulative time * 1.05)
      expect(component["maxX"]).toBeGreaterThan(0);
      // maxY should be > 0 (max lap time * 1.1)
      expect(component["maxY"]).toBeGreaterThan(0);
    });

    it("should default maxX and maxY when there are no points", () => {
      const d1 = createDriver("d1", "Alice", "Ally");

      mockRaceService.getHeats.and.returnValue([]);

      const p1 = createParticipant("d1", d1, 1, 0, 0, 0, 0, 0, 0, 1);

      participantsSubject.next([p1]);

      expect(component["maxX"]).toBe(10);
      expect(component["maxY"]).toBe(5);
    });
  });

  describe("Legend Ordering", () => {
    it("should maintain stable legend order by seed regardless of rank", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      // Seed order: d1=1, d2=2 but Bob has rank 1
      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [6.0] },
        { driver: d2, laps: [5.0] },
      ]);

      mockRaceService.getHeats.and.returnValue([heat]);

      const p1 = createParticipant("d1", d1, 2, 1, 6.0, 6.0, 6.0, 6.0, 80, 1);
      const p2 = createParticipant("d2", d2, 1, 1, 5.0, 5.0, 5.0, 5.0, 100, 2);

      participantsSubject.next([p1, p2]);

      // driverLines should be in seed order (d1 first, d2 second),
      // NOT standings order
      expect(component["driverLines"][0].objectId).toBe("d1");
      expect(component["driverLines"][1].objectId).toBe("d2");
    });
  });

  describe("DOM Rendering", () => {
    it("should render the results table header", async () => {
      expect(await harness.hasResultsTableHeader()).toBeTrue();
    });

    it("should render dual graph containers", async () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const heat = createHeatWithLaps("h1", 1, [{ driver: d1, laps: [5.0] }]);
      mockRaceService.getHeats.and.returnValue([heat]);
      const p1 = createParticipant("d1", d1, 1, 1, 5.0, 5.0, 5.0, 5.0, 100, 1);
      participantsSubject.next([p1]);
      fixture.detectChanges();

      expect(await harness.hasRankingsGraph()).toBeTrue();
      expect(await harness.hasLaptimesGraph()).toBeTrue();
    });

    it("should render driver rows matching participant count", async () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const p1 = createParticipant("d1", d1, 1, 5, 25.0, 4.5, 5.0, 5.0, 100, 1);
      const p2 = createParticipant("d2", d2, 2, 4, 24.0, 5.5, 6.0, 6.0, 80, 2);

      participantsSubject.next([p1, p2]);
      fixture.detectChanges();

      expect(await harness.getDriverRowCount()).toBe(2);
    });
  });

  describe("Format Gap", () => {
    it("should return empty string for null", () => {
      expect(component["formatGap"](null)).toBe("");
    });

    it("should return dashes for zero gap (leader)", () => {
      expect(component["formatGap"](0)).toBe("--.---");
    });

    it("should format positive gap with plus sign", () => {
      expect(component["formatGap"](1.234)).toBe("+1.234");
    });

    it("should format negative gap without plus sign", () => {
      expect(component["formatGap"](-0.5)).toBe("-0.500");
    });
  });
});
