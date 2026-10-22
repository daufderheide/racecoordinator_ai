import { CommonModule } from "@angular/common";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BehaviorSubject, of } from "rxjs";
import { RaceState } from "@app/proto/antigravity";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RacePredictionService } from "@app/services/race-prediction.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultPredictionResultsComponent } from "./default-prediction-results.component";

describe("DefaultPredictionResultsComponent", () => {
  let component: DefaultPredictionResultsComponent;
  let fixture: ComponentFixture<DefaultPredictionResultsComponent>;
  let raceStateSubject: BehaviorSubject<RaceState>;

  const mockTranslationService = {
    translate: (key: string, params?: any) => {
      if (key === "PRED_AT_PACE" && params && params.pace) {
        return `(@ ${params.pace}s/lap)`;
      }
      return key;
    },
  };

  const mockRaceService = {
    getRace: () => ({ entity_id: "race_1", name: "Test Race" }),
  };

  const mockRacePredictionService = {
    getRacePredictions: () => of(null),
    getPredictionEvaluation: () => of(null),
  };

  let mockRaceConnectionService: any;

  beforeEach(async () => {
    raceStateSubject = new BehaviorSubject<RaceState>(RaceState.NOT_STARTED);
    mockRaceConnectionService = {
      race$: of(null),
      raceState$: raceStateSubject.asObservable(),
      connect: jasmine.createSpy("connect"),
    };

    await TestBed.configureTestingModule({
      imports: [DefaultPredictionResultsComponent, CommonModule],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: RacePredictionService, useValue: mockRacePredictionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultPredictionResultsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display -- for projected rank when rank is -1", () => {
    const mockRecord = {
      race_id: "race_1",
      timestamp: 1000,
      pre_race: {
        heat_index: 0,
        completed_laps: 0,
        win_probabilities: { d1: -1.0 },
        podium_probabilities: { d1: -1.0 },
        projected_standings: [
          {
            driver_id: "d1",
            driver_name: "Alice",
            projected_rank: -1,
            projected_laps: -1.0,
            projected_time_seconds: 0,
            win_probability: -1.0,
            podium_probability: -1.0,
          },
        ],
        heat_forecasts: [],
      },
      realtime_snapshots: [],
    };

    mockRacePredictionService.getRacePredictions = () => of(mockRecord as any);

    fixture.detectChanges();

    const rankCols = fixture.debugElement.queryAll(By.css(".rank-col"));
    expect(rankCols.length).toBe(1);
    expect(rankCols[0].nativeElement.textContent.trim()).toBe("--");
  });

  it("should hide evaluation metrics when getPredictionEvaluation returns null (pre-race/in-race) and show them when evaluation record is present", () => {
    // Pre-race / in-race: endpoint returns null (404)
    mockRacePredictionService.getPredictionEvaluation = () => of(null);
    fixture.detectChanges();

    let evalDashboard = fixture.debugElement.query(
      By.css(".records-dashboard"),
    );
    expect(evalDashboard).toBeNull();
    expect(component.evaluationRecord).toBeNull();

    // Post-race: endpoint returns calculated evaluation record
    const mockEval = {
      race_id: "race_1",
      brier_score: "0.05",
      rank_mae: "0.25",
      lap_projection_mae: "1.2",
    };
    mockRacePredictionService.getPredictionEvaluation = () =>
      of(mockEval as any);

    component.loadPredictions();
    fixture.detectChanges();

    evalDashboard = fixture.debugElement.query(By.css(".records-dashboard"));
    expect(evalDashboard).toBeTruthy();
    expect(component.evaluationRecord).toEqual(mockEval as any);
  });

  it("should call raceConnectionService.connect on ngOnInit", () => {
    fixture.detectChanges();
    expect(mockRaceConnectionService.connect).toHaveBeenCalled();
  });

  it("should dynamically reload predictions and schedule evaluation retries when raceState changes to RACE_OVER", fakeAsync(() => {
    const getPredictionsSpy = spyOn(
      mockRacePredictionService,
      "getRacePredictions",
    ).and.callThrough();
    const getEvaluationSpy = spyOn(
      mockRacePredictionService,
      "getPredictionEvaluation",
    ).and.callThrough();

    fixture.detectChanges(); // initial load
    getPredictionsSpy.calls.reset();
    getEvaluationSpy.calls.reset();

    raceStateSubject.next(RaceState.RACE_OVER);
    fixture.detectChanges();

    expect(getPredictionsSpy).toHaveBeenCalled();
    expect(getEvaluationSpy).toHaveBeenCalled();

    tick(4500); // pass all scheduled reload timeouts (300, 1000, 2000, 4000ms)
    // Initial call + 4 scheduled reloads = at least 5 calls
    expect(getEvaluationSpy.calls.count()).toBeGreaterThanOrEqual(5);
  }));

  it("should render standings table wrapper and scrollable rows for 20 drivers", () => {
    const standings = [];
    for (let i = 1; i <= 20; i++) {
      standings.push({
        driver_id: `d${i}`,
        driver_name: `Driver ${i}`,
        projected_rank: i,
        projected_laps: 50 - i,
        projected_time_seconds: 200,
        win_probability: i === 1 ? 0.5 : 0.02,
        podium_probability: i <= 3 ? 0.8 : 0.1,
      });
    }

    const mockRecord = {
      race_id: "race_20",
      timestamp: 2000,
      pre_race: {
        heat_index: 0,
        completed_laps: 0,
        win_probabilities: {},
        podium_probabilities: {},
        projected_standings: standings,
        heat_forecasts: [],
      },
      realtime_snapshots: [],
    };

    mockRacePredictionService.getRacePredictions = () => of(mockRecord as any);

    fixture.detectChanges();

    const tableWrapper = fixture.debugElement.query(
      By.css(".standings-table-wrapper"),
    );
    expect(tableWrapper).toBeTruthy();

    const rows = fixture.debugElement.queryAll(
      By.css(".prediction-table tbody tr"),
    );
    expect(rows.length).toBe(20);
    expect(rows[0].nativeElement.textContent).toContain("Driver 1");
    expect(rows[19].nativeElement.textContent).toContain("Driver 20");
  });

  it("should calculate implied lap pace correctly", () => {
    const proj = {
      driver_id: "d1",
      driver_name: "Abby",
      projected_rank: 1,
      projected_laps: 55.4,
      projected_time_seconds: 180.0,
      win_probability: 0.99,
      podium_probability: 1.0,
    };
    expect(component.getImpliedPace(proj)).toBe("(@ 3.25s/lap)");
    expect(component.getImpliedPace(undefined)).toBe("");
    expect(component.getImpliedPace({ ...proj, projected_laps: 0 })).toBe("");
  });

  it("should render localized page title and standings table headers", () => {
    const mockRecord = {
      race_id: "race_1",
      timestamp: 1000,
      pre_race: {
        heat_index: 0,
        completed_laps: 0,
        win_probabilities: { d1: 0.8 },
        podium_probabilities: { d1: 1.0 },
        projected_standings: [
          {
            driver_id: "d1",
            driver_name: "Alice",
            projected_rank: 1,
            projected_laps: 50.0,
            projected_time_seconds: 150.0,
            win_probability: 0.8,
            podium_probability: 1.0,
          },
        ],
        heat_forecasts: [],
      },
      realtime_snapshots: [],
    };

    mockRacePredictionService.getRacePredictions = () => of(mockRecord as any);
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css(".page-title"));
    expect(titleEl.nativeElement.textContent.trim()).toBe("PRED_PAGE_TITLE");

    const sectionEl = fixture.debugElement.query(By.css(".section-title"));
    expect(sectionEl.nativeElement.textContent.trim()).toBe(
      "PRED_STANDINGS_TITLE",
    );

    const headers = fixture.debugElement.queryAll(
      By.css(".prediction-table th"),
    );
    expect(headers[0].nativeElement.textContent.trim()).toBe(
      "PRED_COL_PROJ_RANK",
    );
    expect(headers[1].nativeElement.textContent.trim()).toBe("PRED_COL_DRIVER");
    expect(headers[2].nativeElement.textContent.trim()).toBe(
      "PRED_COL_WIN_PROB",
    );
  });

  it("should set hoveredDriverProj and position popover on driver hover", () => {
    const proj = {
      driver_id: "d1",
      driver_name: "Alice",
      projected_rank: 1,
      projected_laps: 50.0,
      projected_time_seconds: 150.0,
      win_probability: 0.8,
      podium_probability: 1.0,
      simulated_wins: 800,
      total_simulations: 1000,
      prior_median_lap_time: 3.0,
    };

    const dummyTarget = document.createElement("div");
    spyOn(dummyTarget, "getBoundingClientRect").and.returnValue({
      top: 100,
      bottom: 120,
      right: 200,
      left: 50,
      width: 150,
      height: 20,
      x: 50,
      y: 100,
      toJSON: () => {},
    });

    const mockEvent = {
      currentTarget: dummyTarget,
    } as unknown as MouseEvent;

    component.onDriverHover(mockEvent, proj as any);

    expect(component.hoveredDriverProj).toBe(proj as any);
    expect(component.popoverTop).toBeGreaterThan(0);
    expect(component.popoverLeft).toBe(212); // right (200) + 12

    component.onDriverLeave();
    expect(component.hoveredDriverProj).toBeNull();
  });

  it("should render app-browser-navigation with mode='close'", () => {
    fixture.detectChanges();
    const navEl = fixture.nativeElement.querySelector("app-browser-navigation");
    expect(navEl).toBeTruthy();
    expect(
      navEl.getAttribute("mode") || navEl.getAttribute("ng-reflect-mode"),
    ).toBe("close");
  });
});
