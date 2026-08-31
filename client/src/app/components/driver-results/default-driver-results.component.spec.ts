import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, of, Subject } from "rxjs";
import { DriverConverter } from "@app/converters/driver.converter";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RacePredictionService } from "@app/services/race-prediction.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultDriverResultsComponent } from "./default-driver-results.component";
import { DriverResultsHarness } from "./testing/driver-results.harness";

describe("DefaultDriverResultsComponent", () => {
  let component: DefaultDriverResultsComponent;
  let fixture: ComponentFixture<DefaultDriverResultsComponent>;
  let harness: DriverResultsHarness;
  let mockRaceConnectionService: any;
  let mockRaceService: any;
  let mockTranslationService: any;
  let mockPrintService: any;
  let mockDataService: any;

  let paramsSubject: BehaviorSubject<any>;
  let participantsSubject: BehaviorSubject<RaceParticipant[]>;
  let heatsSubject: BehaviorSubject<Heat[]>;
  let selectedRaceSubject: BehaviorSubject<Race | undefined>;
  let currentHeatSubject: BehaviorSubject<Heat | undefined>;
  let standingsUpdateSubject: Subject<any>;
  let overallStandingsUpdateSubject: Subject<any>;
  let lapsSubject: Subject<any>;
  let raceStateSubject: BehaviorSubject<RaceState>;

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
      // also mock adjusted lap count and rank
      hd.adjustedLapCount = d.laps.length;
      hd.rank = i + 1;
      return hd;
    });
    return new Heat(heatId, heatNumber, heatDrivers);
  };

  beforeEach(async () => {
    paramsSubject = new BehaviorSubject<any>({ driverId: "d1" });
    participantsSubject = new BehaviorSubject<RaceParticipant[]>([]);
    heatsSubject = new BehaviorSubject<Heat[]>([]);
    selectedRaceSubject = new BehaviorSubject<Race | undefined>(undefined);
    currentHeatSubject = new BehaviorSubject<Heat | undefined>(undefined);
    standingsUpdateSubject = new Subject<any>();
    overallStandingsUpdateSubject = new Subject<any>();
    lapsSubject = new Subject<any>();
    raceStateSubject = new BehaviorSubject<RaceState>(RaceState.UNKNOWN_STATE);

    mockRaceConnectionService = {
      connect: jasmine.createSpy("connect"),
      disconnect: jasmine.createSpy("disconnect"),
      standingsUpdate$: standingsUpdateSubject.asObservable(),
      overallStandingsUpdate$: overallStandingsUpdateSubject.asObservable(),
      laps$: lapsSubject.asObservable(),
      raceState$: raceStateSubject.asObservable(),
      driverRankings: new Map<string, number>(),
    };

    mockRaceService = {
      participants$: participantsSubject.asObservable(),
      heats$: heatsSubject.asObservable(),
      selectedRace$: selectedRaceSubject.asObservable(),
      currentHeat$: currentHeatSubject.asObservable(),
      getCurrentHeat: () => currentHeatSubject.getValue(),
    };

    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
      getCurrentLanguage: jasmine
        .createSpy("getCurrentLanguage")
        .and.returnValue(new BehaviorSubject<string>("en")),
    };

    mockPrintService = jasmine.createSpyObj("PrintService", ["print"]);

    mockDataService = {
      serverUrl: "http://localhost:8080",
      getDriverStatistics: jasmine
        .createSpy("getDriverStatistics")
        .and.returnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [DefaultDriverResultsComponent],
      providers: [
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: PrintService, useValue: mockPrintService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
            snapshot: {
              paramMap: {
                get: (key: string) => (key === "driverId" ? "d1" : null),
              },
            },
          },
        },
        {
          provide: DataService,
          useValue: mockDataService,
        },
        {
          provide: RacePredictionService,
          useValue: {
            getRacePredictions: jasmine
              .createSpy("getRacePredictions")
              .and.returnValue(of(null)),
            getPredictionEvaluation: jasmine
              .createSpy("getPredictionEvaluation")
              .and.returnValue(of(null)),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(DefaultDriverResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      DriverResultsHarness,
    );
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should connect on init and disconnect on destroy", () => {
    expect(mockRaceConnectionService.connect).toHaveBeenCalled();
    fixture.destroy();
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalled();
  });

  describe("Standings and Heat Calculations", () => {
    it("should calculate overall standings row for target driver", () => {
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

      expect(component["overallRow"]).toBeTruthy();
      expect(component["overallRow"]?.driver.name).toBe("Alice");
      expect(component["overallRow"]?.rank).toBe(1);
    });

    it("should populate heat driver statistics and calculate adjusted lap count", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 5.2, 5.1] },
        { driver: d2, laps: [6.0, 6.1] },
      ]);

      heatsSubject.next([heat]);

      expect(component["driverHeats"].length).toBe(1);
      const heatRow = component["driverHeats"][0];
      expect(heatRow.heat.heatNumber).toBe(1);
      expect(heatRow.row.laps).toBe(3); // Adjusted lap count
      expect(heatRow.row.rank).toBe(1);
    });

    it("should merge live current heat and auto-expand if started and not manually collapsed", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const d2 = createDriver("d2", "Bob", "Bobby");

      const heat1 = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [5.0, 5.2] },
      ]);
      const activeHeat = createHeatWithLaps("h2", 2, [
        { driver: d1, laps: [4.9] },
        { driver: d2, laps: [5.1] },
      ]);
      activeHeat.started = true;

      heatsSubject.next([heat1]);
      currentHeatSubject.next(activeHeat);

      expect(component["driverHeats"].length).toBe(2);
      expect(component["driverHeats"][0].heat.objectId).toBe("h1");
      expect(component["driverHeats"][1].heat.objectId).toBe("h2");
      expect(component["driverHeats"][1].row.laps).toBe(1);

      // Verify h2 is auto-expanded
      expect(component["expandedHeats"].has("h2")).toBe(true);

      // Verify that after manual collapse, it doesn't auto-expand again
      component["toggleHeat"]("h2");
      expect(component["expandedHeats"].has("h2")).toBe(false);

      // Fire a live update from current heat
      currentHeatSubject.next(activeHeat);
      expect(component["expandedHeats"].has("h2")).toBe(false);
    });
  });

  describe("UI Layout Specifications", () => {
    it("should display laps with decimal precision", async () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      const p1 = createParticipant(
        "d1",
        d1,
        1,
        10.25,
        50.0,
        4.5,
        5.0,
        5.0,
        100,
        1,
      );

      participantsSubject.next([p1]);
      fixture.detectChanges();

      expect(await harness.hasLapsCell()).toBeTrue();
    });
  });

  describe("PDF Export Functionality", () => {
    it("should call printService.print with correct driver details and fullScroll", () => {
      const d1 = createDriver("d1", "Alice", "Ally");
      component["driver"] = d1;
      fixture.detectChanges();

      component["exportPdf"]();
      expect(component["showPdfExportDialog"]).toBeTrue();

      component["onPdfExportConfirm"]({
        includeBackground: true,
        saveAsDefault: false,
      });

      expect(mockPrintService.print).toHaveBeenCalledWith(
        "Ally - Driver Results",
        true,
        undefined,
        true,
      );
    });

    it("should call printService.print with fallback name when driver is undefined", () => {
      component["driver"] = undefined;
      fixture.detectChanges();

      component["exportPdf"]();
      expect(component["showPdfExportDialog"]).toBeTrue();

      component["onPdfExportConfirm"]({
        includeBackground: true,
        saveAsDefault: false,
      });

      expect(mockPrintService.print).toHaveBeenCalledWith(
        "Driver Results - Driver Results",
        true,
        undefined,
        true,
      );
    });
  });

  describe("Team Driver Display Features", () => {
    it("should recognize when the participant is a team and render the individual team member names next to laps and in tooltips", async () => {
      const teamModel = new Team("t1", "The Girls", "", ["d1", "d2"]);
      const teamVirtualDriver = createDriver("t1", "The Girls", "The Girls");

      const p1 = createParticipant(
        "t1",
        teamVirtualDriver,
        1,
        10,
        50.0,
        4.5,
        5.0,
        5.0,
        100,
        1,
      );
      p1.team = teamModel;

      participantsSubject.next([p1]);
      paramsSubject.next({ driverId: "t1" });

      const d1 = createDriver("d1", "Sarah", "Sarah");
      const d2 = createDriver("d2", "Alice", "Ally");

      // Manually register in DriverConverter cache to mimic converter population
      DriverConverter.register(d1);
      DriverConverter.register(d2);

      const heat = createHeatWithLaps("h1", 1, [
        { driver: teamVirtualDriver, laps: [5.0, 5.2] },
      ]);
      // Set the actual driver to d1 for lap 1, d2 for lap 2
      const hd = heat.heatDrivers[0];
      // Since heat.heatDrivers[0] is created with teamVirtualDriver, we can override actualDriver or hd.participant
      Object.defineProperty(hd, "participant", { value: p1 });
      hd["_lapsWithDetails"] = [
        { time: 5.0, driverId: "d1", isDrift: false },
        { time: 5.2, driverId: "d2", isDrift: false },
      ];

      heatsSubject.next([heat]);
      component["expandedHeats"].add("h1");
      fixture.detectChanges();

      expect(component["isTeam"]()).toBe(true);
      expect(component["getDriverName"]("d1")).toBe("Sarah");
      expect(component["getDriverName"]("d2")).toBe("Ally");

      // Assert badge is rendered
      expect(await harness.getTeamDriverBadgeCount()).toBe(2);
      const compiled = fixture.nativeElement as HTMLElement;
      const badges = compiled.querySelectorAll(".team-driver-badge");
      expect(badges[0].textContent.trim()).toBe("Sarah");
      expect(badges[1].textContent.trim()).toBe("Ally");
    });
  });

  describe("Driver Statistics Features", () => {
    it("should not call getDriverStatistics if no race is selected", () => {
      component["loadedDriverId"] = "";
      component["loadedRaceId"] = "";
      mockDataService.getDriverStatistics.calls.reset();
      paramsSubject.next({ driverId: "d1" });
      fixture.detectChanges();
      expect(mockDataService.getDriverStatistics).not.toHaveBeenCalled();
    });

    it("should fetch statistics with specific raceId when race is selected", () => {
      const mockRace = {
        entity_id: "race-123",
        name: "Test Race",
      } as any;

      mockDataService.getDriverStatistics.calls.reset();
      paramsSubject.next({ driverId: "d1" });
      selectedRaceSubject.next(mockRace);
      fixture.detectChanges();

      expect(mockDataService.getDriverStatistics).toHaveBeenCalledWith(
        "d1",
        "race-123",
        false,
      );
    });

    it("should populate driverStats when data is successfully loaded", () => {
      const mockStats = {
        driver_id: "d:d1",
        race_id: "race-123",
        best_lap_time: 4.85,
        best_lap_count: 15.0,
        lane_best_lap_times: [4.9, 4.85],
        lane_best_lap_counts: [12.0, 15.0],
      };

      mockDataService.getDriverStatistics.and.returnValue(of(mockStats));

      component["loadedDriverId"] = "";
      component["loadedRaceId"] = "";

      const mockRace = {
        entity_id: "race-123",
        name: "Test Race",
      } as any;

      paramsSubject.next({ driverId: "d1" });
      selectedRaceSubject.next(mockRace);
      fixture.detectChanges();

      expect(component["driverStats"]).toEqual(mockStats);
    });

    it("should render statistics dashboard when stats are loaded", () => {
      const mockStats = {
        driver_id: "d:d1",
        race_id: "race-123",
        best_lap_time: 4.85,
        best_lap_count: 15.0,
        lane_best_lap_times: [4.9, 4.85],
        lane_best_lap_counts: [12.0, 15.0],
      };

      mockDataService.getDriverStatistics.and.returnValue(of(mockStats));

      component["loadedDriverId"] = "";
      component["loadedRaceId"] = "";

      const mockRace = {
        entity_id: "race-123",
        name: "Test Race",
      } as any;

      paramsSubject.next({ driverId: "d1" });
      selectedRaceSubject.next(mockRace);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector(".stats-dashboard-container");
      expect(container).toBeTruthy();

      const values = compiled.querySelectorAll(".highlight-value");
      expect(values.length).toBe(2);
      expect(values[0].textContent.trim()).toBe("4.850s");
      expect(values[1].textContent.trim()).toBe("15.00");
    });

    it("should render statistics dashboard with dashes when stats are empty/null", () => {
      mockDataService.getDriverStatistics.and.returnValue(of(null));

      component["loadedDriverId"] = "";
      component["loadedRaceId"] = "";

      const mockRace = {
        entity_id: "race-123",
        name: "Test Race",
      } as any;

      paramsSubject.next({ driverId: "d1" });
      selectedRaceSubject.next(mockRace);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector(".stats-dashboard-container");
      expect(container).toBeTruthy();

      const values = compiled.querySelectorAll(".highlight-value");
      expect(values.length).toBe(2);
      expect(values[0].textContent.trim()).toBe("--.---");
      expect(values[1].textContent.trim()).toBe("--");
    });
  });

  describe("Pacing & Trajectory Dialog", () => {
    it("should open heat trajectory dialog with heat-specific lap data and competitor options", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const mockHeat = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: driver2, laps: [3.9, 4.1] },
      ]);

      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat]);
      fixture.detectChanges();

      const heatData = {
        heat: mockHeat,
        heatDriver: mockHeat.heatDrivers[0],
      };

      (component as any).openHeatTrajectory(heatData);

      expect(component["showTrajectoryModal"]).toBeTrue();
      expect(component["trajectoryDriverAName"]).toBe("SpeedyDave");
      expect(component["trajectoryDriverALapTimes"]).toEqual([3.8, 4.0]);
      expect(component["trajectoryReferenceOptions"].length).toBe(1);
      expect(component["trajectoryReferenceOptions"][0]).toEqual({
        id: "d2",
        name: "Abs",
        lapTimes: [3.9, 4.1],
      });
      expect(component["trajectoryInitialReferenceId"]).toBe("d2");

      (component as any).closeTrajectoryDialog();
      expect(component["showTrajectoryModal"]).toBeFalse();
    });

    it("should open overall trajectory dialog with aggregated laps across all heats", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const mockHeat1 = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: driver2, laps: [3.9, 4.1] },
      ]);
      const mockHeat2 = createHeatWithLaps("h2", 2, [
        { driver: driver1, laps: [3.7, 3.9] },
        { driver: driver2, laps: [4.0, 4.2] },
      ]);

      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat1, mockHeat2]);
      participantsSubject.next([
        createParticipant("p1", driver1, 1, 4, 15.4, 3.7, 3.85, 3.85, 0, 1),
        createParticipant("p2", driver2, 2, 4, 16.2, 3.9, 4.05, 4.05, 0, 2),
      ]);
      fixture.detectChanges();

      (component as any).openOverallTrajectory();

      expect(component["showTrajectoryModal"]).toBeTrue();
      expect(component["trajectoryDriverAName"]).toBe("SpeedyDave");
      // All laps from heat 1 + heat 2 for Dave
      expect(component["trajectoryDriverALapTimes"]).toEqual([
        3.8, 4.0, 3.7, 3.9,
      ]);
      expect(component["trajectoryReferenceOptions"].length).toBe(1);
      expect(component["trajectoryReferenceOptions"][0]).toEqual({
        id: "d2",
        name: "Abs",
        lapTimes: [3.9, 4.1, 4.0, 4.2],
      });
      expect(component["trajectoryInitialReferenceId"]).toBe("d2");
    });

    it("should filter out empty lanes/drivers from comparison options", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const emptyDriver = createDriver("EMPTY_LANE", "Empty", "Empty");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const mockHeat = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: emptyDriver, laps: [] },
        { driver: driver2, laps: [3.9, 4.1] },
      ]);

      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat]);
      fixture.detectChanges();

      const heatData = {
        heat: mockHeat,
        heatDriver: mockHeat.heatDrivers[0],
      };

      (component as any).openHeatTrajectory(heatData);

      // Only Abby, not Empty
      expect(component["trajectoryReferenceOptions"].length).toBe(1);
      expect(component["trajectoryReferenceOptions"][0].id).toBe("d2");
      expect(component["trajectoryReferenceOptions"][0].name).toBe("Abs");
    });

    it("should show team name instead of individual driver in comparison selector when participant is a team", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const team = new Team("t1", "The Girls", "", ["d2"]);

      const mockHeat = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: driver2, laps: [3.9, 4.1] },
      ]);

      // Assign team to driver2's participant
      (mockHeat.heatDrivers[1].participant as any).team = team;

      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat]);
      fixture.detectChanges();

      const heatData = {
        heat: mockHeat,
        heatDriver: mockHeat.heatDrivers[0],
      };

      (component as any).openHeatTrajectory(heatData);

      expect(component["trajectoryReferenceOptions"].length).toBe(1);
      expect(component["trajectoryReferenceOptions"][0].id).toBe("t1");
      expect(component["trajectoryReferenceOptions"][0].name).toBe("The Girls");
    });

    it("should show team name and aggregate team laps in overall trajectory when participant is a team", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const driver3 = createDriver("d3", "Chloe", "Chlo");
      const team = new Team("t1", "The Girls", "", ["d2", "d3"]);

      const mockHeat1 = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: driver2, laps: [3.9, 4.1] },
      ]);
      const mockHeat2 = createHeatWithLaps("h2", 2, [
        { driver: driver1, laps: [3.7, 3.9] },
        { driver: driver3, laps: [4.0, 4.2] },
      ]);

      (mockHeat1.heatDrivers[1].participant as any).team = team;
      (mockHeat2.heatDrivers[1].participant as any).team = team;

      const pTeam = new RaceParticipant(
        "p-team",
        null as any,
        2,
        4,
        16.2,
        3.9,
        4.05,
        4.05,
        0,
        2,
        100,
        0,
        0,
        team,
      );

      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat1, mockHeat2]);
      participantsSubject.next([
        createParticipant("p1", driver1, 1, 4, 15.4, 3.7, 3.85, 3.85, 0, 1),
        pTeam,
      ]);
      fixture.detectChanges();

      (component as any).openOverallTrajectory();

      expect(component["trajectoryReferenceOptions"].length).toBe(1);
      expect(component["trajectoryReferenceOptions"][0].id).toBe("t1");
      expect(component["trajectoryReferenceOptions"][0].name).toBe("The Girls");
      // Aggregated laps for team across heat 1 + heat 2
      expect(component["trajectoryReferenceOptions"][0].lapTimes).toEqual([
        3.9, 4.1, 4.0, 4.2,
      ]);
    });

    it("should filter out empty participants in overall trajectory", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const emptyDriver = createDriver("EMPTY_LANE", "Empty", "Empty");
      const driver2 = createDriver("d2", "Abby", "Abs");

      const mockHeat = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: emptyDriver, laps: [] },
        { driver: driver2, laps: [3.9, 4.1] },
      ]);

      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat]);
      participantsSubject.next([
        createParticipant("p1", driver1, 1, 2, 7.8, 3.8, 3.9, 3.9, 0, 1),
        createParticipant("pEmpty", emptyDriver, 3, 0, 0, 0, 0, 0, 0, 3),
        createParticipant("p2", driver2, 2, 2, 8.0, 3.9, 4.0, 4.0, 0, 2),
      ]);
      fixture.detectChanges();

      (component as any).openOverallTrajectory();

      expect(component["trajectoryReferenceOptions"].length).toBe(1);
      expect(component["trajectoryReferenceOptions"][0].id).toBe("d2");
      expect(component["trajectoryReferenceOptions"][0].name).toBe("Abs");
    });

    it("should trigger openOverallTrajectory when trajectory button in overall standings is clicked", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const mockHeat = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: driver2, laps: [3.9, 4.1] },
      ]);

      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat]);
      participantsSubject.next([
        createParticipant("p1", driver1, 1, 2, 7.8, 3.8, 3.9, 3.9, 0, 1),
        createParticipant("p2", driver2, 2, 2, 8.0, 3.9, 4.0, 4.0, 0, 2),
      ]);
      fixture.detectChanges();

      const trajectoryBtn = fixture.nativeElement.querySelector(
        ".section-title-row .trajectory-btn",
      ) as HTMLButtonElement;
      expect(trajectoryBtn).toBeTruthy();

      trajectoryBtn.click();
      fixture.detectChanges();

      expect(component["showTrajectoryModal"]).toBeTrue();
      expect(component["trajectoryDriverAName"]).toBe("SpeedyDave");
    });

    it("should exclude live team and default to highest ranked other team in overall pacing in a team race", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const driver3 = createDriver("d3", "Chloe", "Chlo");
      const team1 = new Team("t1", "Team Speed", "", ["d1"]);
      const team2 = new Team("t2", "Team Fast", "", ["d2"]);
      const team3 = new Team("t3", "Team Turbo", "", ["d3"]);

      const mockHeat1 = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: driver2, laps: [3.9, 4.1] },
        { driver: driver3, laps: [4.2, 4.3] },
      ]);
      (mockHeat1.heatDrivers[0].participant as any).team = team1;
      (mockHeat1.heatDrivers[1].participant as any).team = team2;
      (mockHeat1.heatDrivers[2].participant as any).team = team3;

      const pTeam1 = new RaceParticipant(
        "p-team1",
        driver1,
        1,
        2,
        7.8,
        3.8,
        3.9,
        3.9,
        0,
        1,
        100,
        0,
        0,
        team1,
      );
      const pTeam2 = new RaceParticipant(
        "p-team2",
        driver2,
        2,
        2,
        8.0,
        3.9,
        4.0,
        4.0,
        0,
        2,
        100,
        0,
        0,
        team2,
      );
      const pTeam3 = new RaceParticipant(
        "p-team3",
        driver3,
        3,
        2,
        8.5,
        4.2,
        4.25,
        4.25,
        0,
        3,
        100,
        0,
        0,
        team3,
      );

      // Navigate as driver d1 (member of team1, rank 1)
      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat1]);
      participantsSubject.next([pTeam1, pTeam2, pTeam3]);
      fixture.detectChanges();

      (component as any).openOverallTrajectory();

      // Team Speed (t1) should NOT be in options
      expect(
        component["trajectoryReferenceOptions"].some((opt) => opt.id === "t1"),
      ).toBeFalse();
      expect(
        component["trajectoryReferenceOptions"].some((opt) => opt.id === "d1"),
      ).toBeFalse();
      expect(component["trajectoryReferenceOptions"].length).toBe(2);
      expect(component["trajectoryReferenceOptions"][0].id).toBe("t2");
      expect(component["trajectoryReferenceOptions"][0].name).toBe("Team Fast");
      expect(component["trajectoryReferenceOptions"][1].id).toBe("t3");
      expect(component["trajectoryReferenceOptions"][1].name).toBe(
        "Team Turbo",
      );

      // Default should be rank 2 (highest ranked non-live team)
      expect(component["trajectoryInitialReferenceId"]).toBe("t2");
    });

    it("should exclude live team and default to highest ranked other team in heat pacing in a team race", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const driver3 = createDriver("d3", "Chloe", "Chlo");
      const team1 = new Team("t1", "Team Speed", "", ["d1"]);
      const team2 = new Team("t2", "Team Fast", "", ["d2"]);
      const team3 = new Team("t3", "Team Turbo", "", ["d3"]);

      const mockHeat1 = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [3.8, 4.0] },
        { driver: driver2, laps: [3.9, 4.1] },
        { driver: driver3, laps: [3.7, 3.8] },
      ]);
      (mockHeat1.heatDrivers[0].participant as any).team = team1;
      mockHeat1.heatDrivers[0].rank = 2;
      (mockHeat1.heatDrivers[1].participant as any).team = team2;
      mockHeat1.heatDrivers[1].rank = 3;
      (mockHeat1.heatDrivers[2].participant as any).team = team3;
      mockHeat1.heatDrivers[2].rank = 1;

      // Navigate as driver d1 (member of team1)
      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat1]);
      fixture.detectChanges();

      const heatData = {
        heat: mockHeat1,
        heatDriver: mockHeat1.heatDrivers[0],
      };

      (component as any).openHeatTrajectory(heatData);

      // Team Speed (t1/d1) must NOT be in reference options
      expect(
        component["trajectoryReferenceOptions"].some((opt) => opt.id === "t1"),
      ).toBeFalse();
      expect(
        component["trajectoryReferenceOptions"].some((opt) => opt.id === "d1"),
      ).toBeFalse();
      expect(component["trajectoryReferenceOptions"].length).toBe(2);

      // In heat 1, team3 is rank 1 and team2 is rank 3. Team 3 should be first and default
      expect(component["trajectoryReferenceOptions"][0].id).toBe("t3");
      expect(component["trajectoryReferenceOptions"][0].name).toBe(
        "Team Turbo",
      );
      expect(component["trajectoryReferenceOptions"][1].id).toBe("t2");
      expect(component["trajectoryReferenceOptions"][1].name).toBe("Team Fast");
      expect(component["trajectoryInitialReferenceId"]).toBe("t3");
    });

    it("should default to rank 1 competitor in overall pacing when live driver is rank 2 or lower", () => {
      const driver1 = createDriver("d1", "Dave", "SpeedyDave");
      const driver2 = createDriver("d2", "Abby", "Abs");
      const driver3 = createDriver("d3", "Chloe", "Chlo");

      const mockHeat = createHeatWithLaps("h1", 1, [
        { driver: driver1, laps: [4.0, 4.1] },
        { driver: driver2, laps: [3.7, 3.8] },
        { driver: driver3, laps: [4.2, 4.3] },
      ]);

      paramsSubject.next({ driverId: "d1" });
      heatsSubject.next([mockHeat]);
      participantsSubject.next([
        createParticipant("p2", driver2, 1, 2, 7.5, 3.7, 3.75, 3.75, 0, 1),
        createParticipant("p1", driver1, 2, 2, 8.1, 4.0, 4.05, 4.05, 0, 2),
        createParticipant("p3", driver3, 3, 2, 8.5, 4.2, 4.25, 4.25, 0, 3),
      ]);
      fixture.detectChanges();

      (component as any).openOverallTrajectory();

      expect(
        component["trajectoryReferenceOptions"].some((opt) => opt.id === "d1"),
      ).toBeFalse();
      expect(component["trajectoryReferenceOptions"].length).toBe(2);
      // Rank 1 (Abby) must be first and default
      expect(component["trajectoryReferenceOptions"][0].id).toBe("d2");
      expect(component["trajectoryReferenceOptions"][0].name).toBe("Abs");
      expect(component["trajectoryReferenceOptions"][1].id).toBe("d3");
      expect(component["trajectoryReferenceOptions"][1].name).toBe("Chlo");
      expect(component["trajectoryInitialReferenceId"]).toBe("d2");
    });
  });
});
